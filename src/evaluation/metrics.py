"""
src/evaluation/metrics.py
=========================
Evaluation utilities: time-split metrics, ablation comparison, results export.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import (
    f1_score, roc_auc_score,
    mean_absolute_error, r2_score,
)


# ---------------------------------------------------------------------------
# Metric computation
# ---------------------------------------------------------------------------

def classification_metrics(y_true: np.ndarray, y_prob: np.ndarray) -> dict:
    y_pred = (y_prob >= 0.5).astype(int)
    auc = float(roc_auc_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 0.5
    return {
        "f1": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "auc": round(auc, 4),
        "support_pos": int(y_true.sum()),
        "support_neg": int((y_true == 0).sum()),
    }


def regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    return {
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
        "r2": round(float(r2_score(y_true, y_pred)), 4),
    }


# ---------------------------------------------------------------------------
# Ablation comparison table
# ---------------------------------------------------------------------------

def ablation_report(
    results: dict[str, dict],
    save_path: str | None = None,
) -> pd.DataFrame:
    """
    Summarise ablation results into a pretty DataFrame.

    Parameters
    ----------
    results : e.g.
        {
          "perf_only":       {"slump": {"f1": .., "auc": ..}, "overval": {"mae": .., "r2": ..}},
          "perf+sentiment":  {"slump": {"f1": .., "auc": ..}, "overval": {"mae": .., "r2": ..}},
        }
    """
    rows = []
    for model_name, scores in results.items():
        row = {"model": model_name}
        for task, metrics in scores.items():
            for metric, val in metrics.items():
                row[f"{task}_{metric}"] = val
        rows.append(row)
    df = pd.DataFrame(rows)
    if save_path:
        df.to_csv(save_path, index=False)
        print(f"Ablation report saved → {save_path}")
    return df


# ---------------------------------------------------------------------------
# Results export
# ---------------------------------------------------------------------------

def export_results(
    df: pd.DataFrame,
    slump_proba: np.ndarray,
    overval_pred: np.ndarray,
    out_json: str,
    out_csv: str,
) -> pd.DataFrame:
    """
    Build and export the canonical results table.

    Schema:
      player_id, name, club, position, week, per90_score, market_value,
      predicted_value, sentiment_score, slump_probability, overvaluation_score
    """
    results = df[["player_id", "name", "club", "position", "week", "date",
                  "per90_score", "market_value_eur", "predicted_value",
                  "sentiment_score", "overvaluation_score",
                  "slump_label", "form_z",
                  "per90_rolling_mean_5w", "per90_trend_5w", "per90_decay",
                  "sentiment_rolling_mean", "volume_momentum"]].copy()

    results.rename(columns={"market_value_eur": "market_value"}, inplace=True)

    # Attach slump probability (may come from multimodal or baseline)
    if len(slump_proba) == len(results):
        results["slump_probability"] = np.round(slump_proba, 4)
    else:
        # Fallback: use slump_label as probability proxy
        results["slump_probability"] = results["slump_label"].astype(float)

    # Attach overvaluation prediction from model
    if len(overval_pred) == len(results):
        results["overvaluation_score"] = np.round(overval_pred, 2)

    # Round numeric outputs
    for col in ["per90_score", "market_value", "predicted_value", "sentiment_score",
                "form_z", "per90_rolling_mean_5w", "per90_trend_5w", "per90_decay",
                "sentiment_rolling_mean", "volume_momentum"]:
        if col in results.columns:
            results[col] = results[col].round(4)

    results.sort_values(["player_id", "week"], inplace=True)
    results.reset_index(drop=True, inplace=True)

    # CSV export
    Path(out_csv).parent.mkdir(parents=True, exist_ok=True)
    results.to_csv(out_csv, index=False)
    print(f"Results CSV → {out_csv}  ({len(results):,} rows)")

    # JSON export (for dashboard)
    Path(out_json).parent.mkdir(parents=True, exist_ok=True)
    records = results.to_dict(orient="records")
    # Convert any NaN to None for valid JSON
    cleaned = [
        {k: (None if (isinstance(v, float) and np.isnan(v)) else v) for k, v in row.items()}
        for row in records
    ]
    with open(out_json, "w") as f:
        json.dump(cleaned, f, indent=2, default=str)
    print(f"Results JSON → {out_json}  ({len(cleaned):,} records)")

    return results
