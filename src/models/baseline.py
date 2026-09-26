"""
src/models/baseline.py
======================
Baseline gradient-boosting models (XGBoost / LightGBM) on performance
features alone — no sentiment. Used as the ablation baseline.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

import numpy as np
import pandas as pd
import yaml

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

try:
    import lightgbm as lgb
    LGB_AVAILABLE = True
except ImportError:
    LGB_AVAILABLE = False

from sklearn.metrics import f1_score, roc_auc_score, mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler


def _load_cfg(config_path: str = "config.yaml") -> dict:
    with open(config_path) as f:
        return yaml.safe_load(f)


# ---------------------------------------------------------------------------
# Feature sets
# ---------------------------------------------------------------------------

SLUMP_FEATURES = [
    "per90_score", "per90_rolling_mean_5w", "per90_rolling_std_5w",
    "per90_trend_5w", "per90_decay", "form_z",
    "minutes_played", "injury_flag",
]

OVERVAL_FEATURES = [
    "per90_score", "per90_rolling_mean_5w", "per90_decay",
    "form_z", "minutes_played",
]


# ---------------------------------------------------------------------------
# Time-based train / test split
# ---------------------------------------------------------------------------

def time_split(df: pd.DataFrame, test_weeks: int = 10) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Split on week number: last `test_weeks` are held out.
    Guarantees no future leakage across weeks.
    """
    max_week = df["week"].max()
    cutoff = max_week - test_weeks
    train = df[df["week"] <= cutoff].copy()
    test = df[df["week"] > cutoff].copy()
    return train, test


# ---------------------------------------------------------------------------
# Slump classifier (XGBoost)
# ---------------------------------------------------------------------------

def train_slump_classifier(
    train_df: pd.DataFrame,
    feat_cols: list[str],
    config_path: str = "config.yaml",
) -> "xgb.XGBClassifier":
    if not XGB_AVAILABLE:
        raise ImportError("xgboost not installed — run: pip install xgboost")

    cfg = _load_cfg(config_path)
    seed = cfg["modeling"]["random_seed"]
    n_est = cfg["modeling"]["xgb_n_estimators"]

    sub = train_df.dropna(subset=feat_cols + ["slump_label"])
    X = sub[feat_cols].fillna(0).values
    y = sub["slump_label"].values

    pos_count = int((y == 1).sum())
    if pos_count == 0:
        # No positive labels in training window — inject a few synthetic ones
        # based on lowest form_z rows so the model is not trivially all-negative
        print("  ⚠  No slump labels in train set; using form_z proxy for training.")
        if "form_z" in feat_cols:
            fz_idx = feat_cols.index("form_z")
            worst = np.argsort(X[:, fz_idx])[:max(20, len(X) // 20)]
            y = y.copy()
            y[worst] = 1

    model = xgb.XGBClassifier(
        n_estimators=n_est,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=max(1.0, (y == 0).sum() / max((y == 1).sum(), 1)),
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=seed,
        verbosity=0,
    )
    model.fit(X, y)
    return model


# ---------------------------------------------------------------------------
# Overvaluation regressor (LightGBM)
# ---------------------------------------------------------------------------

def train_overval_regressor(
    train_df: pd.DataFrame,
    feat_cols: list[str],
    config_path: str = "config.yaml",
):
    if not LGB_AVAILABLE:
        raise ImportError("lightgbm not installed — run: pip install lightgbm")

    cfg = _load_cfg(config_path)
    seed = cfg["modeling"]["random_seed"]
    n_est = cfg["modeling"]["lgbm_n_estimators"]

    sub = train_df.dropna(subset=feat_cols + ["overvaluation_score"])
    X = sub[feat_cols].values
    y = sub["overvaluation_score"].values

    model = lgb.LGBMRegressor(
        n_estimators=n_est,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=seed,
        verbose=-1,
    )
    model.fit(X, y)
    return model


# ---------------------------------------------------------------------------
# Evaluation helpers
# ---------------------------------------------------------------------------

def evaluate_classifier(model, test_df: pd.DataFrame, feat_cols: list[str]) -> dict:
    sub = test_df.dropna(subset=feat_cols + ["slump_label"])
    if len(sub) == 0:
        return {"f1": 0.0, "auc": 0.0}
    X = sub[feat_cols].values
    y = sub["slump_label"].values
    probs = model.predict_proba(X)[:, 1]
    preds = (probs >= 0.5).astype(int)
    return {
        "f1": round(float(f1_score(y, preds, zero_division=0)), 4),
        "auc": round(float(roc_auc_score(y, probs) if len(np.unique(y)) > 1 else 0.5), 4),
    }


def evaluate_regressor(model, test_df: pd.DataFrame, feat_cols: list[str]) -> dict:
    sub = test_df.dropna(subset=feat_cols + ["overvaluation_score"])
    if len(sub) == 0:
        return {"mae": 0.0, "r2": 0.0}
    X = sub[feat_cols].values
    y = sub["overvaluation_score"].values
    preds = model.predict(X)
    return {
        "mae": round(float(mean_absolute_error(y, preds)), 4),
        "r2": round(float(r2_score(y, preds)), 4),
    }


def predict_slump_proba(model, df: pd.DataFrame, feat_cols: list[str]) -> np.ndarray:
    """Return per-row slump probability for the full dataset."""
    X = df[feat_cols].fillna(0).values
    return model.predict_proba(X)[:, 1]


def predict_overval(model, df: pd.DataFrame, feat_cols: list[str]) -> np.ndarray:
    """Return per-row overvaluation score predictions."""
    X = df[feat_cols].fillna(0).values
    return model.predict(X)
