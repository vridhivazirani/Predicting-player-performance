"""
src/data/loaders.py
===================
Modular data-ingestion layer.

Three loaders, each returning a cleaned DataFrame with a canonical
(player_id, week, date) index ready for alignment.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd
import yaml


def _load_config(config_path: str = "config.yaml") -> dict:
    with open(config_path) as f:
        return yaml.safe_load(f)


# ---------------------------------------------------------------------------
# 1. Match Performance Loader
#    Expects FBref/StatsBomb-style CSV with at minimum:
#      player_id, name, week, date, per90_score, minutes_played, injury_flag
# ---------------------------------------------------------------------------

def load_performance(csv_path: str | None = None, config_path: str = "config.yaml") -> pd.DataFrame:
    """
    Load and lightly validate match performance data.

    Parameters
    ----------
    csv_path : path to the CSV; falls back to config.yaml value.
    config_path : path to config.yaml.

    Returns
    -------
    pd.DataFrame with at minimum: [player_id, week, date, per90_score,
                                   minutes_played, injury_flag, name, club, position]
    """
    if csv_path is None:
        cfg = _load_config(config_path)
        csv_path = cfg["data"]["performance_csv"]

    df = pd.read_csv(csv_path, parse_dates=["date"])
    _validate_required(df, ["player_id", "week", "date", "per90_score"], "performance")
    df["week"] = df["week"].astype(int)
    df["injury_flag"] = df["injury_flag"].astype(int)
    df.sort_values(["player_id", "week"], inplace=True)
    return df.reset_index(drop=True)


# ---------------------------------------------------------------------------
# 2. Market Valuation Loader
#    Expects Transfermarkt-style CSV with at minimum:
#      player_id, name, week, date, market_value_eur
# ---------------------------------------------------------------------------

def load_market(csv_path: str | None = None, config_path: str = "config.yaml") -> pd.DataFrame:
    """
    Load and validate market valuation data.

    Returns
    -------
    pd.DataFrame with at minimum: [player_id, week, date, market_value_eur, name, club]
    """
    if csv_path is None:
        cfg = _load_config(config_path)
        csv_path = cfg["data"]["market_csv"]

    df = pd.read_csv(csv_path, parse_dates=["date"])
    _validate_required(df, ["player_id", "week", "date", "market_value_eur"], "market")
    df["week"] = df["week"].astype(int)
    df["market_value_eur"] = pd.to_numeric(df["market_value_eur"], errors="coerce")
    df.sort_values(["player_id", "week"], inplace=True)
    return df.reset_index(drop=True)


# ---------------------------------------------------------------------------
# 3. Social Sentiment Loader
#    Expects a CSV with at minimum:
#      player_id, week, date, sentiment_score, mention_volume
# ---------------------------------------------------------------------------

def load_sentiment(csv_path: str | None = None, config_path: str = "config.yaml") -> pd.DataFrame:
    """
    Load and validate social sentiment data.

    When plugging in real scraped data, ensure it has:
      - player_id (matching the performance loader)
      - week (integer)
      - date (ISO 8601)
      - sentiment_score (float, −1 to 1)
      - mention_volume (integer)

    Returns
    -------
    pd.DataFrame with at minimum: [player_id, week, date, sentiment_score, mention_volume]
    """
    if csv_path is None:
        cfg = _load_config(config_path)
        csv_path = cfg["data"]["sentiment_csv"]

    df = pd.read_csv(csv_path, parse_dates=["date"])
    _validate_required(df, ["player_id", "week", "date", "sentiment_score", "mention_volume"], "sentiment")
    df["week"] = df["week"].astype(int)
    df["sentiment_score"] = pd.to_numeric(df["sentiment_score"], errors="coerce").clip(-1, 1)
    df["mention_volume"] = pd.to_numeric(df["mention_volume"], errors="coerce").fillna(0).astype(int)
    df.sort_values(["player_id", "week"], inplace=True)
    return df.reset_index(drop=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _validate_required(df: pd.DataFrame, required_cols: list[str], source: str) -> None:
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"[{source} loader] Missing required columns: {missing}")
