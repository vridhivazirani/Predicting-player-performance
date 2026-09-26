# Predicting Player Form Slump and Transfer Market Overvaluation
## A Multimodal Machine Learning Approach Integrating Match Performance Metrics and Social Media Sentiment

> **⚠ Mock-Data Caveat** — All numbers in `data/raw/` are **entirely synthetic / fabricated**.
> Real footballer names are used only to make pipeline outputs recognisable during development.
> These figures do **not** reflect actual performance, market valuations, or social media sentiment.
> See §[Plugging in Real Data](#plugging-in-real-data) for how to replace them.

---

## Project Goals

| Task | Description |
|------|-------------|
| **Slump prediction** | Flag upcoming per-90 performance drops using time-series features + sentiment |
| **Overvaluation detection** | Measure the gap between model-predicted market value and actual Transfermarkt price |
| **Multimodal fusion** | Late-fusion of LSTM (performance time-series) + MLP (sentiment) for joint predictions |

---

## Repo Structure

```
Predicting-player-performance/
├── config.yaml                  # All thresholds, paths, model hyperparams
├── requirements.txt
├── run_pipeline.py              # End-to-end orchestration script
│
├── src/
│   ├── data/
│   │   ├── mock_generator.py    # Synthetic data generator (105 players × 26 weeks)
│   │   ├── loaders.py           # FBref / Transfermarkt / sentiment CSV loaders
│   │   └── cleaner.py           # Alignment on (player_id, week) key
│   ├── features/
│   │   └── engineering.py       # Rolling features, slump labels, overvaluation residuals
│   ├── models/
│   │   ├── baseline.py          # XGBoost (slump) + LightGBM (overvaluation)
│   │   └── multimodal.py        # LSTM + MLP late-fusion model (PyTorch)
│   └── evaluation/
│       └── metrics.py           # F1/AUC, MAE/R², ablation table, results export
│
├── data/
│   ├── raw/                     # CSV inputs (generated or real)
│   │   ├── match_performance.csv
│   │   ├── market_valuations.csv
│   │   └── social_sentiment.csv
│   └── processed/
│       └── aligned_weekly.csv   # Merged (player_id, week) table
│
├── models/                      # Saved model artefacts (*.pkl, *.pt)
├── results/
│   ├── results.csv              # Full results table
│   └── ablation.csv             # Perf-only vs +sentiment comparison
│
├── dashboard/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── results.json             # Written by run_pipeline.py — dashboard reads this
│
└── notebooks/
    └── README.md                # Planned EDA + results notebooks
```

---

## Quickstart

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Generate mock data + run pipeline
```bash
python run_pipeline.py --regenerate
```

This will:
1. Generate synthetic CSVs in `data/raw/`
2. Align and feature-engineer
3. Train XGBoost slump classifier + LightGBM overvaluation regressor
4. (Optionally) train LSTM fusion model
5. Write `dashboard/results.json` and `results/results.csv`

Skip the LSTM for a faster run:
```bash
python run_pipeline.py --regenerate --no-multimodal
```

### 3. View the dashboard
```bash
cd dashboard
python -m http.server 8000
# Open http://localhost:8000
```

---

## results.json Schema

Each element in the JSON array has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `player_id` | string | Unique player identifier (e.g. `p001`) |
| `name` | string | Player name |
| `club` | string | Current club |
| `position` | string | FW / MF / DF / GK |
| `week` | int | Season week number |
| `date` | string | ISO 8601 date of the week |
| `per90_score` | float | Composite per-90 performance score (0–10) |
| `market_value` | float | Market value in €M (Transfermarkt-style) |
| `predicted_value` | float | Model-predicted market value in €M |
| `sentiment_score` | float | Weekly sentiment aggregate (−1 to +1) |
| `slump_probability` | float | Model-output probability of slump (0–1) |
| `overvaluation_score` | float | `market_value − predicted_value` in €M |
| `slump_label` | int | Ground-truth slump label (0/1) |
| `form_z` | float | Z-score of current form vs 5-week rolling baseline |
| `per90_rolling_mean_5w` | float | 5-week rolling mean of per90_score |
| `per90_trend_5w` | float | Linear slope of per90_score over 5 weeks |
| `per90_decay` | float | Exponentially-weighted mean of per90_score |
| `sentiment_rolling_mean` | float | 4-week rolling mean of sentiment_score |
| `volume_momentum` | float | Mention volume / 4-week average volume |

---

## Key Thresholds (config.yaml)

| Parameter | Default | Meaning |
|-----------|---------|---------|
| `rolling_window` | 5 weeks | Window for form features |
| `slump_zscore_threshold` | −1.5 | Z-score below which a week is flagged |
| `slump_min_weeks` | 3 | Consecutive flagged weeks = sustained slump |
| `decay_alpha` | 0.85 | EWM decay factor |
| `test_weeks` | 10 | Weeks held out for evaluation |
| `residual_clip` | ±50 €M | Clip overvaluation scores |

---

## Ablation Setup

`run_pipeline.py` trains two model variants:

| Variant | Features |
|---------|----------|
| `perf_only` | XGBoost/LightGBM on performance features only |
| `perf+sentiment` | LSTM fusion with sentiment branch |

Results are written to `results/ablation.csv` with columns:
`model, slump_f1, slump_auc, overval_mae, overval_r2`

---

## Plugging in Real Data

Replace the three CSVs in `data/raw/` with your real exports, ensuring these **minimum columns** are present:

### match_performance.csv (FBref / StatsBomb style)
```
player_id, name, club, position, week, date, per90_score, minutes_played, injury_flag,
goals_per90, assists_per90, xg_per90, xa_per90, key_passes_per90, ...
```

### market_valuations.csv (Transfermarkt style)
```
player_id, name, club, position, week, date, market_value_eur, nationality, age
```

### social_sentiment.csv (scraped / API)
```
player_id, name, week, date, sentiment_score, mention_volume, positive_ratio, negative_ratio
```

Then re-run:
```bash
python run_pipeline.py
```

The dashboard will automatically reflect the real data — no code changes needed.

---

## NLP Pipeline (real data)

When `social_sentiment.csv` contains raw post text, wire in the transformer-based scorer:

```python
from transformers import pipeline

sentiment_pipe = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment",
    tokenizer="cardiffnlp/twitter-roberta-base-sentiment",
)
```

Aggregate per-player per-week scores and write to `social_sentiment.csv`.

---

## Dashboard Features

- 🔍 **Live search** across 100+ players (name / club / position)
- 🎛️ **Filters**: position, slump status, overvaluation direction, week
- 📊 **Sparklines** per card showing per-90 form trend
- 💹 **Market delta** — stock-price-style ↑/↓ vs model-predicted value
- 😐 **Sentiment mini-bar** per card
- 🔬 **Detail modal**: 4 Chart.js charts (form, value, sentiment, slump prob) + feature attribution panel
- Dark theme, responsive grid, ⌘K search shortcut

---

*Research project — synthetic data only. Real footballer names are used as labels; all metrics are fabricated for pipeline testing.*
