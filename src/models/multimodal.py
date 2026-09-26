"""
src/models/multimodal.py
========================
Multimodal fusion model:
  - LSTM encoder over per-player performance time-series
  - Sentiment feature branch (MLP)
  - Late fusion → slump probability + overvaluation score

Uses PyTorch. Falls back gracefully if GPU is unavailable.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import yaml
from torch.utils.data import DataLoader, Dataset


def _load_cfg(config_path: str = "config.yaml") -> dict:
    with open(config_path) as f:
        return yaml.safe_load(f)


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------

PERF_SEQ_COLS = [
    "per90_score", "per90_rolling_mean_5w", "per90_rolling_std_5w",
    "per90_trend_5w", "per90_decay", "form_z",
    "minutes_played", "injury_flag",
]

SENT_FEAT_COLS = [
    "sentiment_score", "sentiment_rolling_mean",
    "sentiment_trend", "volume_momentum",
]


class PlayerWeekDataset(Dataset):
    """
    Each sample is the last `seq_len` weeks of per-player performance,
    plus current-week sentiment features, targeting slump_label and
    overvaluation_score.
    """

    def __init__(
        self,
        df: pd.DataFrame,
        seq_len: int = 5,
        perf_cols: list[str] = PERF_SEQ_COLS,
        sent_cols: list[str] = SENT_FEAT_COLS,
    ):
        self.seq_len = seq_len
        self.samples: list[dict] = []

        for pid, grp in df.groupby("player_id"):
            grp = grp.sort_values("week").reset_index(drop=True)
            perf = grp[perf_cols].fillna(0).values.astype(np.float32)
            sent = grp[sent_cols].fillna(0).values.astype(np.float32)
            slump = grp["slump_label"].fillna(0).values.astype(np.float32)
            overval = grp["overvaluation_score"].fillna(0).values.astype(np.float32)

            for i in range(seq_len, len(grp)):
                seq = perf[i - seq_len: i]           # (seq_len, perf_dim)
                s_feat = sent[i]                      # (sent_dim,)
                self.samples.append(
                    {
                        "seq": torch.tensor(seq),
                        "sent": torch.tensor(s_feat),
                        "slump": torch.tensor(slump[i]),
                        "overval": torch.tensor(overval[i]),
                        "player_id": pid,
                        "week": int(grp.loc[i, "week"]),
                    }
                )

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> dict:
        return self.samples[idx]


# ---------------------------------------------------------------------------
# Model architecture
# ---------------------------------------------------------------------------

class MultimodalFusionModel(nn.Module):
    """
    Late-fusion model:
      LSTM(perf seq) → hidden  ╗
                               ╠→ FC → [slump_prob, overval_score]
      MLP(sent feats) → emb   ╝
    """

    def __init__(
        self,
        perf_dim: int,
        sent_dim: int,
        hidden_size: int = 64,
        num_layers: int = 2,
        dropout: float = 0.3,
    ):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=perf_dim,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.sent_mlp = nn.Sequential(
            nn.Linear(sent_dim, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 32),
        )
        fusion_dim = hidden_size + 32
        self.fusion = nn.Sequential(
            nn.Linear(fusion_dim, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
        )
        self.slump_head = nn.Linear(64, 1)    # binary: slump probability
        self.overval_head = nn.Linear(64, 1)  # regression: overvaluation score

    def forward(self, seq: torch.Tensor, sent: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        _, (hn, _) = self.lstm(seq)
        lstm_out = hn[-1]                          # (batch, hidden_size)
        sent_out = self.sent_mlp(sent)             # (batch, 32)
        fused = torch.cat([lstm_out, sent_out], dim=-1)
        fused = self.fusion(fused)
        slump_logit = self.slump_head(fused).squeeze(-1)
        overval_pred = self.overval_head(fused).squeeze(-1)
        return slump_logit, overval_pred


# ---------------------------------------------------------------------------
# Training loop
# ---------------------------------------------------------------------------

def train_multimodal(
    train_df: pd.DataFrame,
    config_path: str = "config.yaml",
    device: str | None = None,
) -> MultimodalFusionModel:
    cfg = _load_cfg(config_path)
    hidden = cfg["modeling"]["lstm_hidden_size"]
    num_layers = cfg["modeling"]["lstm_num_layers"]
    dropout = cfg["modeling"]["lstm_dropout"]
    epochs = cfg["modeling"]["fusion_epochs"]
    bs = cfg["modeling"]["fusion_batch_size"]
    lr = cfg["modeling"]["fusion_lr"]
    seq_len = cfg["features"]["rolling_window"]

    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    dataset = PlayerWeekDataset(train_df, seq_len=seq_len)
    loader = DataLoader(dataset, batch_size=bs, shuffle=True, drop_last=False)

    perf_dim = len(PERF_SEQ_COLS)
    sent_dim = len(SENT_FEAT_COLS)
    model = MultimodalFusionModel(perf_dim, sent_dim, hidden, num_layers, dropout).to(device)

    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    slump_criterion = nn.BCEWithLogitsLoss()
    overval_criterion = nn.MSELoss()

    model.train()
    for epoch in range(epochs):
        total_loss = 0.0
        for batch in loader:
            seq = batch["seq"].to(device)
            sent = batch["sent"].to(device)
            slump_true = batch["slump"].to(device)
            overval_true = batch["overval"].to(device)

            optimizer.zero_grad()
            slump_logit, overval_pred = model(seq, sent)
            loss = slump_criterion(slump_logit, slump_true) + 0.1 * overval_criterion(overval_pred, overval_true)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            total_loss += loss.item()

        if (epoch + 1) % 10 == 0:
            print(f"  Epoch {epoch+1}/{epochs}  loss={total_loss/max(len(loader),1):.4f}")

    return model


# ---------------------------------------------------------------------------
# Inference
# ---------------------------------------------------------------------------

@torch.no_grad()
def predict_multimodal(
    model: MultimodalFusionModel,
    df: pd.DataFrame,
    config_path: str = "config.yaml",
    device: str | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Returns (slump_proba, overval_pred) arrays aligned to `df` row order.
    """
    cfg = _load_cfg(config_path)
    seq_len = cfg["features"]["rolling_window"]

    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    dataset = PlayerWeekDataset(df, seq_len=seq_len)
    loader = DataLoader(dataset, batch_size=64, shuffle=False)

    model.eval()
    slump_probs: list[float] = []
    overval_preds: list[float] = []

    for batch in loader:
        seq = batch["seq"].to(device)
        sent = batch["sent"].to(device)
        sl, ov = model(seq, sent)
        slump_probs.extend(torch.sigmoid(sl).cpu().numpy().tolist())
        overval_preds.extend(ov.cpu().numpy().tolist())

    return np.array(slump_probs), np.array(overval_preds)
