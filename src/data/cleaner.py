"""
src/data/cleaner.py
===================
Data-cleaning and alignment module.

Aligns performance, market, and sentiment data on a common
(player_id, week) key and produces a single merged DataFrame.
"""

from __future__ import annotations

import pandas as pd


def align_datasets(
    perf_df: pd.DataFrame,
    market_df: pd.DataFrame,
    sent_df: pd.DataFrame,
    fill_method: str = "ffill",
) -> pd.DataFrame:
    """
    Join all three sources on (player_id, week).

    Strategy
    --------
    - Use inner-join on player_id; left-join on week so weeks without
      market/sentiment data get forward-filled (common when Transfermarkt
      updates less frequently than match data).
    - Market values forward-filled within each player.
    - Sentiment scores forward-filled, then zero-filled for early weeks.

    Parameters
    ----------
    perf_df   : output of load_performance()
    market_df : output of load_market()
    sent_df   : output of load_sentiment()
    fill_method : 'ffill' (default) or 'interpolate'

    Returns
    -------
    pd.DataFrame aligned on (player_id, week) with all features.
    """
    # Select minimal columns to avoid column-name clashes
    perf = perf_df.copy()
    market = market_df[["player_id", "week", "market_value_eur"]].copy()
    sent = sent_df[["player_id", "week", "sentiment_score", "mention_volume",
                     "positive_ratio", "negative_ratio"]].copy()

    # Merge performance ← market
    merged = perf.merge(market, on=["player_id", "week"], how="left")

    # Merge ← sentiment
    merged = merged.merge(sent, on=["player_id", "week"], how="left")

    # Fill missing values within each player group
    fill_cols = ["market_value_eur", "sentiment_score", "positive_ratio", "negative_ratio"]
    for col in fill_cols:
        if col in merged.columns:
            merged[col] = (
                merged.groupby("player_id")[col]
                .transform(lambda s: s.ffill().bfill())
            )

    merged["mention_volume"] = merged["mention_volume"].fillna(0).astype(int)

    # Sanity-check: drop rows where per90_score is null
    merged = merged.dropna(subset=["per90_score"])

    merged.sort_values(["player_id", "week"], inplace=True)
    return merged.reset_index(drop=True)


def basic_clean(df: pd.DataFrame) -> pd.DataFrame:
    """Shared cleaning: strip whitespace from string cols, coerce numeric cols."""
    str_cols = df.select_dtypes("object").columns
    for col in str_cols:
        df[col] = df[col].str.strip()
    return df
