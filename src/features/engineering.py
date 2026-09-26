"""
src/features/engineering.py
============================
Feature engineering pipeline:
  1. Rolling-window performance features (form trend, variance, decay)
  2. Slump label generator (z-score threshold)
  3. Overvaluation score (baseline regression residuals)
  4. Sentiment momentum features
"""

from __future__ import annotations

import warnings
from typing import Optional

import numpy as np
import pandas as pd
import yaml
from scipy import stats
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler


# ---------------------------------------------------------------------------
# Config helper
# ---------------------------------------------------------------------------

def _load_cfg(config_path: str = "config.yaml") -> dict:
    with open(config_path) as f:
        return yaml.safe_load(f)


# ---------------------------------------------------------------------------
# 1. Rolling-window performance features
# ---------------------------------------------------------------------------

PERF_FEATURES = [
    "goals_per90", "assists_per90", "xg_per90", "xa_per90",
    "key_passes_per90", "progressive_carries_per90",
    "pressures_per90", "tackles_won_per90", "dribbles_completed_per90",
    "per90_score",
]


def add_rolling_features(df: pd.DataFrame, window: int = 5, decay_alpha: float = 0.85) -> pd.DataFrame:
    """
    For each player, compute:
      - per90_rolling_mean_{w}   : rolling mean of per90_score
      - per90_rolling_std_{w}    : rolling std (form variance)
      - per90_rolling_trend_{w}  : slope of linear regression over window
      - per90_decay              : exponentially-weighted mean (form decay)
      - form_z                   : z-score of most-recent per90 vs rolling baseline
    """
    df = df.copy().sort_values(["player_id", "week"])
    grp = df.groupby("player_id")["per90_score"]

    df[f"per90_rolling_mean_{window}w"] = (
        grp.transform(lambda s: s.rolling(window, min_periods=2).mean())
    )
    df[f"per90_rolling_std_{window}w"] = (
        grp.transform(lambda s: s.rolling(window, min_periods=2).std())
    )
    df["per90_decay"] = (
        grp.transform(lambda s: s.ewm(alpha=1 - decay_alpha, min_periods=2).mean())
    )

    # Rolling linear trend (slope of per90 over last `window` weeks)
    def _rolling_slope(series: pd.Series, w: int) -> pd.Series:
        slopes = [np.nan] * len(series)
        arr = series.values
        for i in range(w - 1, len(arr)):
            y = arr[max(0, i - w + 1): i + 1]
            if np.sum(~np.isnan(y)) >= 2:
                x = np.arange(len(y))
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    slope, *_ = np.polyfit(x, y, 1)
                slopes[i] = slope
        return pd.Series(slopes, index=series.index)

    df[f"per90_trend_{window}w"] = (
        df.groupby("player_id")["per90_score"]
        .transform(lambda s: _rolling_slope(s, window))
    )

    # Form z-score: (current − rolling_mean) / rolling_std
    df["form_z"] = (
        (df["per90_score"] - df[f"per90_rolling_mean_{window}w"])
        / df[f"per90_rolling_std_{window}w"].replace(0, np.nan)
    ).clip(-5, 5)

    return df


# ---------------------------------------------------------------------------
# 2. Slump label generator
# ---------------------------------------------------------------------------

def label_slumps(
    df: pd.DataFrame,
    z_threshold: float = -1.5,
    min_weeks: int = 3,
    window: int = 5,
) -> pd.DataFrame:
    """
    Flag weeks where a player is in a slump.

    A slump is defined as `min_weeks` consecutive weeks where
    `form_z` < `z_threshold`.

    Adds columns:
      - slump_flag (int 0/1): raw per-week flag
      - slump_label (int 0/1): sustained slump (min_weeks consecutive)
    """
    df = df.copy()

    if "form_z" not in df.columns:
        df = add_rolling_features(df, window=window)

    df["slump_flag"] = (df["form_z"] < z_threshold).astype(int)

    # Sustained slump: rolling sum of slump_flag over min_weeks
    def _sustained(series: pd.Series, min_w: int) -> pd.Series:
        roll = series.rolling(min_w, min_periods=min_w).sum()
        return (roll >= min_w).astype(int)

    df["slump_label"] = (
        df.groupby("player_id")["slump_flag"]
        .transform(lambda s: _sustained(s, min_weeks))
    )
    return df


# ---------------------------------------------------------------------------
# 3. Overvaluation score (baseline regression residuals)
# ---------------------------------------------------------------------------

REGRESSION_FEATURES = [
    "per90_score", "per90_decay", "age", "injury_flag",
]


def compute_overvaluation(
    df: pd.DataFrame,
    baseline_model: str = "ridge",
    config_path: str = "config.yaml",
) -> pd.DataFrame:
    """
    Train a baseline regression  market_value ~ performance_features
    and compute signed residuals as the overvaluation score.

    Positive score  → market value > model prediction (potentially overvalued).
    Negative score  → market value < model prediction (potentially undervalued).

    Adds columns:
      - predicted_value   : model-predicted market value (€M)
      - overvaluation_score : residual (actual − predicted), clipped
    """
    cfg = _load_cfg(config_path)
    clip = cfg["overvaluation"]["residual_clip"]

    df = df.copy()
    feat_cols = [c for c in REGRESSION_FEATURES if c in df.columns]

    sub = df.dropna(subset=feat_cols + ["market_value_eur"]).copy()
    X = sub[feat_cols].values
    y = sub["market_value_eur"].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    if baseline_model == "ridge":
        model = Ridge(alpha=10.0)
        model.fit(X_scaled, y)
        preds = model.predict(X_scaled)
    else:
        raise ValueError(f"Unsupported baseline_model: {baseline_model}")

    sub["predicted_value"] = np.round(preds, 2)
    sub["overvaluation_score"] = np.clip(
        (sub["market_value_eur"] - sub["predicted_value"]).round(2), -clip, clip
    )

    df = df.merge(
        sub[["player_id", "week", "predicted_value", "overvaluation_score"]],
        on=["player_id", "week"],
        how="left",
    )
    df["predicted_value"] = df["predicted_value"].fillna(df.get("market_value_eur", 0))
    df["overvaluation_score"] = df["overvaluation_score"].fillna(0.0)
    return df


# ---------------------------------------------------------------------------
# 4. Sentiment momentum features
# ---------------------------------------------------------------------------

def add_sentiment_features(df: pd.DataFrame, volume_window: int = 4) -> pd.DataFrame:
    """
    Derive momentum features from raw sentiment/volume:
      - sentiment_rolling_mean : rolling mean of sentiment_score
      - sentiment_trend        : change in sentiment_score vs prev week
      - volume_momentum        : ratio of current volume to rolling avg volume
    """
    df = df.copy().sort_values(["player_id", "week"])
    grp_sent = df.groupby("player_id")["sentiment_score"]
    grp_vol = df.groupby("player_id")["mention_volume"]

    df["sentiment_rolling_mean"] = grp_sent.transform(
        lambda s: s.rolling(volume_window, min_periods=1).mean()
    ).round(4)
    df["sentiment_trend"] = grp_sent.transform(lambda s: s.diff()).round(4)
    df["volume_momentum"] = (
        grp_vol.transform(lambda s: s / s.rolling(volume_window, min_periods=1).mean())
    ).round(3)

    return df


# ---------------------------------------------------------------------------
# Master pipeline
# ---------------------------------------------------------------------------

def build_features(
    df: pd.DataFrame,
    config_path: str = "config.yaml",
) -> pd.DataFrame:
    """
    Run the full feature engineering pipeline on the aligned dataset.
    Returns a DataFrame enriched with all features + labels.
    """
    cfg = _load_cfg(config_path)
    window = cfg["features"]["rolling_window"]
    z_thr = cfg["features"]["slump_zscore_threshold"]
    min_w = cfg["features"]["slump_min_weeks"]
    decay = cfg["features"]["decay_alpha"]
    vol_w = cfg["sentiment"]["volume_window"]

    df = add_rolling_features(df, window=window, decay_alpha=decay)
    df = label_slumps(df, z_threshold=z_thr, min_weeks=min_w, window=window)
    df = add_sentiment_features(df, volume_window=vol_w)
    df = compute_overvaluation(df, config_path=config_path)
    return df
