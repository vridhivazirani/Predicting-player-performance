"""
run_pipeline.py
===============
Master pipeline script — runs end-to-end:
  1. Generate (or load) mock data
  2. Load & align all three data sources
  3. Build features + labels
  4. Train baseline models
  5. (Optional) Train multimodal LSTM fusion model
  6. Export results.json + results.csv

Usage:
  python run_pipeline.py                    # uses mock data
  python run_pipeline.py --no-multimodal   # skip LSTM (fast baseline only)
  python run_pipeline.py --regenerate      # re-generate mock data first
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import yaml

# Ensure src/ is on path when run from repo root
sys.path.insert(0, str(Path(__file__).parent))

from src.data.mock_generator import main as generate_mock
from src.data.loaders import load_performance, load_market, load_sentiment
from src.data.cleaner import align_datasets
from src.features.engineering import build_features
from src.models.baseline import (
    time_split, SLUMP_FEATURES, OVERVAL_FEATURES,
    train_slump_classifier, train_overval_regressor,
    evaluate_classifier, evaluate_regressor,
    predict_slump_proba, predict_overval,
)
from src.evaluation.metrics import (
    ablation_report, export_results, classification_metrics, regression_metrics,
)


def load_config(path: str = "config.yaml") -> dict:
    with open(path) as f:
        return yaml.safe_load(f)


def main(args: argparse.Namespace) -> None:
    cfg = load_config()

    # ------------------------------------------------------------------
    # 1. Data generation / loading
    # ------------------------------------------------------------------
    raw_dir = Path("data/raw")
    if args.regenerate or not (raw_dir / "match_performance.csv").exists():
        print("=== Generating mock data ===")
        generate_mock()

    print("\n=== Loading data ===")
    perf_df = load_performance()
    market_df = load_market()
    sent_df = load_sentiment()

    print(f"  Performance : {perf_df.shape}")
    print(f"  Market      : {market_df.shape}")
    print(f"  Sentiment   : {sent_df.shape}")

    # ------------------------------------------------------------------
    # 2. Align
    # ------------------------------------------------------------------
    print("\n=== Aligning datasets ===")
    aligned = align_datasets(perf_df, market_df, sent_df)
    Path("data/processed").mkdir(parents=True, exist_ok=True)
    aligned.to_csv(cfg["data"]["aligned_output"], index=False)
    print(f"  Aligned: {aligned.shape}  → {cfg['data']['aligned_output']}")

    # ------------------------------------------------------------------
    # 3. Feature engineering
    # ------------------------------------------------------------------
    print("\n=== Building features ===")
    featured = build_features(aligned)
    print(f"  Features built: {featured.shape}, cols={list(featured.columns)}")

    # ------------------------------------------------------------------
    # 4. Time-based split
    # ------------------------------------------------------------------
    test_weeks = cfg["modeling"]["test_weeks"]
    train_df, test_df = time_split(featured, test_weeks=test_weeks)
    print(f"\n=== Train/Test split (test_weeks={test_weeks}) ===")
    print(f"  Train: {len(train_df):,} rows  |  Test: {len(test_df):,} rows")

    # ------------------------------------------------------------------
    # 5. Baseline models
    # ------------------------------------------------------------------
    print("\n=== Training baseline models ===")

    # Slump classifier
    print("  → Slump classifier (XGBoost, performance-only) …")
    slump_model = train_slump_classifier(train_df, SLUMP_FEATURES)
    slump_metrics_train = evaluate_classifier(slump_model, train_df, SLUMP_FEATURES)
    slump_metrics_test = evaluate_classifier(slump_model, test_df, SLUMP_FEATURES)
    print(f"    Train: {slump_metrics_train}  Test: {slump_metrics_test}")

    # Overvaluation regressor
    print("  → Overvaluation regressor (LightGBM, performance-only) …")
    overval_model = train_overval_regressor(train_df, OVERVAL_FEATURES)
    overval_metrics_train = evaluate_regressor(overval_model, train_df, OVERVAL_FEATURES)
    overval_metrics_test = evaluate_regressor(overval_model, test_df, OVERVAL_FEATURES)
    print(f"    Train: {overval_metrics_train}  Test: {overval_metrics_test}")

    # Baseline predictions on full dataset
    slump_proba_base = predict_slump_proba(slump_model, featured, SLUMP_FEATURES)
    overval_pred_base = predict_overval(overval_model, featured, OVERVAL_FEATURES)

    ablation_results: dict[str, dict] = {
        "perf_only": {
            "slump": slump_metrics_test,
            "overval": overval_metrics_test,
        }
    }

    # ------------------------------------------------------------------
    # 6. Multimodal fusion model (optional)
    # ------------------------------------------------------------------
    slump_proba_final = slump_proba_base
    overval_pred_final = overval_pred_base

    if not args.no_multimodal:
        print("\n=== Training multimodal LSTM fusion model ===")
        try:
            from src.models.multimodal import train_multimodal, predict_multimodal, PERF_SEQ_COLS, SENT_FEAT_COLS

            mm_model = train_multimodal(train_df)

            # Evaluate on test set
            mm_slump_prob, mm_overval = predict_multimodal(mm_model, test_df)
            test_sub = test_df.dropna(subset=["slump_label", "overvaluation_score"])
            if len(mm_slump_prob) == len(test_sub):
                mm_slump_metrics = classification_metrics(
                    test_sub["slump_label"].values, mm_slump_prob
                )
                mm_overval_metrics = regression_metrics(
                    test_sub["overvaluation_score"].values, mm_overval
                )
                ablation_results["perf+sentiment"] = {
                    "slump": mm_slump_metrics,
                    "overval": mm_overval_metrics,
                }
                print(f"  Multimodal slump  : {mm_slump_metrics}")
                print(f"  Multimodal overval: {mm_overval_metrics}")

            # Use multimodal predictions on full dataset for export
            full_slump_prob, full_overval = predict_multimodal(mm_model, featured)
            if len(full_slump_prob) == len(featured):
                slump_proba_final = full_slump_prob
                overval_pred_final = full_overval

        except Exception as e:
            print(f"  ⚠  Multimodal training failed ({e}). Using baseline predictions.")

    # ------------------------------------------------------------------
    # 7. Ablation report
    # ------------------------------------------------------------------
    print("\n=== Ablation report ===")
    Path("results").mkdir(parents=True, exist_ok=True)
    ablation_df = ablation_report(ablation_results, save_path="results/ablation.csv")
    print(ablation_df.to_string(index=False))

    # ------------------------------------------------------------------
    # 8. Export results.json + results.csv
    # ------------------------------------------------------------------
    print("\n=== Exporting results ===")
    export_results(
        df=featured,
        slump_proba=slump_proba_final,
        overval_pred=overval_pred_final,
        out_json=cfg["output"]["results_json"],
        out_csv=cfg["output"]["results_csv"],
    )

    print("\n✅ Pipeline complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Player Performance Pipeline")
    parser.add_argument("--regenerate", action="store_true", help="Re-generate mock data")
    parser.add_argument("--no-multimodal", action="store_true", help="Skip LSTM fusion model")
    args = parser.parse_args()
    main(args)
