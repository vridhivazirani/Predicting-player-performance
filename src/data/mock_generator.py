"""
src/data/mock_generator.py
==========================
SYNTHETIC / MOCK DATA GENERATOR
--------------------------------
WARNING: This module generates ENTIRELY FABRICATED statistics attached to real footballer
names for pipeline-validation purposes only. These numbers do NOT reflect actual player
performance, market valuations, or social media sentiment. They are randomly generated with
controlled noise to stress-test the pipeline before real data is wired in.

See README.md §"Mock-Data Caveat" for full details.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# 1.  Player registry — real names, fabricated metadata
# ---------------------------------------------------------------------------

PLAYERS: list[dict] = [
    # fmt: off
    {"player_id": "p001", "name": "Cristiano Ronaldo",    "club": "Al Nassr",        "position": "FW", "age": 39, "nationality": "Portugal"},
    {"player_id": "p002", "name": "Lionel Messi",         "club": "Inter Miami",      "position": "FW", "age": 36, "nationality": "Argentina"},
    {"player_id": "p003", "name": "Kylian Mbappé",        "club": "Real Madrid",      "position": "FW", "age": 25, "nationality": "France"},
    {"player_id": "p004", "name": "Erling Haaland",       "club": "Man City",         "position": "FW", "age": 23, "nationality": "Norway"},
    {"player_id": "p005", "name": "Kevin De Bruyne",      "club": "Man City",         "position": "MF", "age": 32, "nationality": "Belgium"},
    {"player_id": "p006", "name": "Jude Bellingham",      "club": "Real Madrid",      "position": "MF", "age": 20, "nationality": "England"},
    {"player_id": "p007", "name": "Vinícius Júnior",      "club": "Real Madrid",      "position": "FW", "age": 23, "nationality": "Brazil"},
    {"player_id": "p008", "name": "Mohamed Salah",        "club": "Liverpool",        "position": "FW", "age": 31, "nationality": "Egypt"},
    {"player_id": "p009", "name": "Harry Kane",           "club": "Bayern Munich",    "position": "FW", "age": 30, "nationality": "England"},
    {"player_id": "p010", "name": "Robert Lewandowski",   "club": "Barcelona",        "position": "FW", "age": 35, "nationality": "Poland"},
    {"player_id": "p011", "name": "Bukayo Saka",          "club": "Arsenal",          "position": "FW", "age": 22, "nationality": "England"},
    {"player_id": "p012", "name": "Phil Foden",           "club": "Man City",         "position": "MF", "age": 23, "nationality": "England"},
    {"player_id": "p013", "name": "Rodri",                "club": "Man City",         "position": "MF", "age": 27, "nationality": "Spain"},
    {"player_id": "p014", "name": "Virgil van Dijk",      "club": "Liverpool",        "position": "DF", "age": 32, "nationality": "Netherlands"},
    {"player_id": "p015", "name": "Thibaut Courtois",     "club": "Real Madrid",      "position": "GK", "age": 31, "nationality": "Belgium"},
    {"player_id": "p016", "name": "Alisson Becker",       "club": "Liverpool",        "position": "GK", "age": 31, "nationality": "Brazil"},
    {"player_id": "p017", "name": "Neymar Jr",            "club": "Al Hilal",         "position": "FW", "age": 32, "nationality": "Brazil"},
    {"player_id": "p018", "name": "Karim Benzema",        "club": "Al Ittihad",       "position": "FW", "age": 36, "nationality": "France"},
    {"player_id": "p019", "name": "Luka Modrić",          "club": "Real Madrid",      "position": "MF", "age": 38, "nationality": "Croatia"},
    {"player_id": "p020", "name": "Toni Kroos",           "club": "Real Madrid",      "position": "MF", "age": 34, "nationality": "Germany"},
    {"player_id": "p021", "name": "Casemiro",             "club": "Man United",       "position": "MF", "age": 32, "nationality": "Brazil"},
    {"player_id": "p022", "name": "Bruno Fernandes",      "club": "Man United",       "position": "MF", "age": 29, "nationality": "Portugal"},
    {"player_id": "p023", "name": "Son Heung-min",        "club": "Tottenham",        "position": "FW", "age": 31, "nationality": "South Korea"},
    {"player_id": "p024", "name": "Declan Rice",          "club": "Arsenal",          "position": "MF", "age": 25, "nationality": "England"},
    {"player_id": "p025", "name": "Martin Ødegaard",      "club": "Arsenal",          "position": "MF", "age": 25, "nationality": "Norway"},
    {"player_id": "p026", "name": "Federico Valverde",    "club": "Real Madrid",      "position": "MF", "age": 25, "nationality": "Uruguay"},
    {"player_id": "p027", "name": "Jamal Musiala",        "club": "Bayern Munich",    "position": "MF", "age": 21, "nationality": "Germany"},
    {"player_id": "p028", "name": "Florian Wirtz",        "club": "Bayer Leverkusen", "position": "MF", "age": 21, "nationality": "Germany"},
    {"player_id": "p029", "name": "Pedri",                "club": "Barcelona",        "position": "MF", "age": 21, "nationality": "Spain"},
    {"player_id": "p030", "name": "Gavi",                 "club": "Barcelona",        "position": "MF", "age": 19, "nationality": "Spain"},
    {"player_id": "p031", "name": "Lamine Yamal",         "club": "Barcelona",        "position": "FW", "age": 16, "nationality": "Spain"},
    {"player_id": "p032", "name": "Antoine Griezmann",    "club": "Atletico Madrid",  "position": "FW", "age": 32, "nationality": "France"},
    {"player_id": "p033", "name": "Ousmane Dembélé",      "club": "PSG",              "position": "FW", "age": 26, "nationality": "France"},
    {"player_id": "p034", "name": "Marcus Rashford",      "club": "Man United",       "position": "FW", "age": 26, "nationality": "England"},
    {"player_id": "p035", "name": "Cole Palmer",          "club": "Chelsea",          "position": "MF", "age": 22, "nationality": "England"},
    {"player_id": "p036", "name": "Alexander Isak",       "club": "Newcastle",        "position": "FW", "age": 24, "nationality": "Sweden"},
    {"player_id": "p037", "name": "Victor Osimhen",       "club": "Galatasaray",      "position": "FW", "age": 25, "nationality": "Nigeria"},
    {"player_id": "p038", "name": "Julián Álvarez",       "club": "Atletico Madrid",  "position": "FW", "age": 24, "nationality": "Argentina"},
    {"player_id": "p039", "name": "Rodrygo",              "club": "Real Madrid",      "position": "FW", "age": 23, "nationality": "Brazil"},
    {"player_id": "p040", "name": "Achraf Hakimi",        "club": "PSG",              "position": "DF", "age": 25, "nationality": "Morocco"},
    {"player_id": "p041", "name": "William Saliba",       "club": "Arsenal",          "position": "DF", "age": 23, "nationality": "France"},
    {"player_id": "p042", "name": "Ruben Dias",           "club": "Man City",         "position": "DF", "age": 26, "nationality": "Portugal"},
    {"player_id": "p043", "name": "John Stones",          "club": "Man City",         "position": "DF", "age": 29, "nationality": "England"},
    {"player_id": "p044", "name": "Joško Gvardiol",       "club": "Man City",         "position": "DF", "age": 22, "nationality": "Croatia"},
    {"player_id": "p045", "name": "İlkay Gündoğan",      "club": "Barcelona",        "position": "MF", "age": 33, "nationality": "Germany"},
    {"player_id": "p046", "name": "Frenkie de Jong",      "club": "Barcelona",        "position": "MF", "age": 26, "nationality": "Netherlands"},
    {"player_id": "p047", "name": "Marco Verratti",       "club": "Al Arabi",         "position": "MF", "age": 31, "nationality": "Italy"},
    {"player_id": "p048", "name": "Sandro Tonali",        "club": "Newcastle",        "position": "MF", "age": 23, "nationality": "Italy"},
    {"player_id": "p049", "name": "Nicolò Barella",       "club": "Inter Milan",      "position": "MF", "age": 27, "nationality": "Italy"},
    {"player_id": "p050", "name": "Federico Chiesa",      "club": "Liverpool",        "position": "FW", "age": 26, "nationality": "Italy"},
    {"player_id": "p051", "name": "Khvicha Kvaratskhelia","club": "PSG",              "position": "FW", "age": 22, "nationality": "Georgia"},
    {"player_id": "p052", "name": "Rafael Leão",          "club": "AC Milan",         "position": "FW", "age": 24, "nationality": "Portugal"},
    {"player_id": "p053", "name": "Mike Maignan",         "club": "AC Milan",         "position": "GK", "age": 28, "nationality": "France"},
    {"player_id": "p054", "name": "Gianluigi Donnarumma", "club": "PSG",              "position": "GK", "age": 25, "nationality": "Italy"},
    {"player_id": "p055", "name": "Manuel Neuer",         "club": "Bayern Munich",    "position": "GK", "age": 37, "nationality": "Germany"},
    {"player_id": "p056", "name": "Joshua Kimmich",       "club": "Bayern Munich",    "position": "MF", "age": 29, "nationality": "Germany"},
    {"player_id": "p057", "name": "Leroy Sané",           "club": "Bayern Munich",    "position": "FW", "age": 28, "nationality": "Germany"},
    {"player_id": "p058", "name": "Serge Gnabry",         "club": "Bayern Munich",    "position": "FW", "age": 28, "nationality": "Germany"},
    {"player_id": "p059", "name": "Jonathan Tah",         "club": "Bayern Munich",    "position": "DF", "age": 28, "nationality": "Germany"},
    {"player_id": "p060", "name": "Xavi Simons",          "club": "PSG",              "position": "MF", "age": 21, "nationality": "Netherlands"},
    {"player_id": "p061", "name": "Bernardo Silva",       "club": "Man City",         "position": "MF", "age": 29, "nationality": "Portugal"},
    {"player_id": "p062", "name": "N'Golo Kanté",         "club": "Al Ittihad",       "position": "MF", "age": 32, "nationality": "France"},
    {"player_id": "p063", "name": "Aurélien Tchouaméni", "club": "Real Madrid",      "position": "MF", "age": 24, "nationality": "France"},
    {"player_id": "p064", "name": "Eduardo Camavinga",    "club": "Real Madrid",      "position": "MF", "age": 21, "nationality": "France"},
    {"player_id": "p065", "name": "Dani Carvajal",        "club": "Real Madrid",      "position": "DF", "age": 32, "nationality": "Spain"},
    {"player_id": "p066", "name": "David Alaba",          "club": "Real Madrid",      "position": "DF", "age": 31, "nationality": "Austria"},
    {"player_id": "p067", "name": "Éder Militão",         "club": "Real Madrid",      "position": "DF", "age": 25, "nationality": "Brazil"},
    {"player_id": "p068", "name": "Jules Koundé",         "club": "Barcelona",        "position": "DF", "age": 25, "nationality": "France"},
    {"player_id": "p069", "name": "Ronald Araújo",        "club": "Barcelona",        "position": "DF", "age": 24, "nationality": "Uruguay"},
    {"player_id": "p070", "name": "Robert Sánchez",       "club": "Chelsea",          "position": "GK", "age": 26, "nationality": "Spain"},
    {"player_id": "p071", "name": "Emiliano Martínez",   "club": "Aston Villa",      "position": "GK", "age": 31, "nationality": "Argentina"},
    {"player_id": "p072", "name": "Ederson",              "club": "Man City",         "position": "GK", "age": 30, "nationality": "Brazil"},
    {"player_id": "p073", "name": "Jan Oblak",            "club": "Atletico Madrid",  "position": "GK", "age": 31, "nationality": "Slovenia"},
    {"player_id": "p074", "name": "Sadio Mané",           "club": "Al Nassr",         "position": "FW", "age": 31, "nationality": "Senegal"},
    {"player_id": "p075", "name": "Riyad Mahrez",         "club": "Al Ahli",          "position": "FW", "age": 33, "nationality": "Algeria"},
    {"player_id": "p076", "name": "Alphonso Davies",      "club": "Bayern Munich",    "position": "DF", "age": 23, "nationality": "Canada"},
    {"player_id": "p077", "name": "Alejandro Balde",      "club": "Barcelona",        "position": "DF", "age": 20, "nationality": "Spain"},
    {"player_id": "p078", "name": "João Cancelo",         "club": "Barcelona",        "position": "DF", "age": 29, "nationality": "Portugal"},
    {"player_id": "p079", "name": "Trent Alexander-Arnold","club": "Real Madrid",    "position": "DF", "age": 25, "nationality": "England"},
    {"player_id": "p080", "name": "Andrew Robertson",     "club": "Liverpool",        "position": "DF", "age": 29, "nationality": "Scotland"},
    {"player_id": "p081", "name": "Gabriel Jesus",        "club": "Arsenal",          "position": "FW", "age": 26, "nationality": "Brazil"},
    {"player_id": "p082", "name": "Gabriel Martinelli",   "club": "Arsenal",          "position": "FW", "age": 22, "nationality": "Brazil"},
    {"player_id": "p083", "name": "Kai Havertz",          "club": "Arsenal",          "position": "FW", "age": 24, "nationality": "Germany"},
    {"player_id": "p084", "name": "Leandro Trossard",     "club": "Arsenal",          "position": "FW", "age": 28, "nationality": "Belgium"},
    {"player_id": "p085", "name": "Domenico Berardi",     "club": "Sassuolo",         "position": "FW", "age": 29, "nationality": "Italy"},
    {"player_id": "p086", "name": "Dušan Vlahović",       "club": "Juventus",         "position": "FW", "age": 23, "nationality": "Serbia"},
    {"player_id": "p087", "name": "Lautaro Martínez",    "club": "Inter Milan",      "position": "FW", "age": 26, "nationality": "Argentina"},
    {"player_id": "p088", "name": "Paulo Dybala",         "club": "Roma",             "position": "FW", "age": 30, "nationality": "Argentina"},
    {"player_id": "p089", "name": "Ciro Immobile",        "club": "Besiktas",         "position": "FW", "age": 33, "nationality": "Italy"},
    {"player_id": "p090", "name": "Christopher Nkunku",   "club": "Chelsea",          "position": "FW", "age": 26, "nationality": "France"},
    {"player_id": "p091", "name": "Randal Kolo Muani",    "club": "Juventus",         "position": "FW", "age": 25, "nationality": "France"},
    {"player_id": "p092", "name": "Marcus Thuram",        "club": "Inter Milan",      "position": "FW", "age": 26, "nationality": "France"},
    {"player_id": "p093", "name": "Ademola Lookman",      "club": "Atalanta",         "position": "FW", "age": 26, "nationality": "Nigeria"},
    # Additional players to reach 100+
    {"player_id": "p094", "name": "Rúben Neves",          "club": "Al Hilal",         "position": "MF", "age": 27, "nationality": "Portugal"},
    {"player_id": "p095", "name": "Matteo Guendouzi",     "club": "Lazio",            "position": "MF", "age": 25, "nationality": "France"},
    {"player_id": "p096", "name": "Mats Hummels",         "club": "Roma",             "position": "DF", "age": 35, "nationality": "Germany"},
    {"player_id": "p097", "name": "Granit Xhaka",         "club": "Bayer Leverkusen", "position": "MF", "age": 31, "nationality": "Switzerland"},
    {"player_id": "p098", "name": "Yerlan Yerlan",        "club": "Shakhtar",         "position": "MF", "age": 24, "nationality": "Ukraine"},
    {"player_id": "p099", "name": "Mykhaylo Mudryk",      "club": "Chelsea",          "position": "FW", "age": 22, "nationality": "Ukraine"},
    {"player_id": "p100", "name": "Pedro Neto",           "club": "Chelsea",          "position": "FW", "age": 23, "nationality": "Portugal"},
    {"player_id": "p101", "name": "Enzo Fernández",       "club": "Chelsea",          "position": "MF", "age": 23, "nationality": "Argentina"},
    {"player_id": "p102", "name": "Moisés Caicedo",       "club": "Chelsea",          "position": "MF", "age": 22, "nationality": "Ecuador"},
    {"player_id": "p103", "name": "Conor Gallagher",      "club": "Atletico Madrid",  "position": "MF", "age": 24, "nationality": "England"},
    {"player_id": "p104", "name": "Ollie Watkins",        "club": "Aston Villa",      "position": "FW", "age": 28, "nationality": "England"},
    {"player_id": "p105", "name": "Leon Bailey",          "club": "Aston Villa",      "position": "FW", "age": 26, "nationality": "Jamaica"},
    # fmt: on
]

# Players deliberately placed in "slump" territory (performance declining)
SLUMP_PLAYERS = {"p001", "p017", "p034", "p074", "p021", "p089", "p047", "p096"}

# Players deliberately placed in "overvalued" territory (market value >> performance)
OVERVALUED_PLAYERS = {"p099", "p101", "p102", "p060", "p037", "p091", "p100"}

# Base market values (€M) — entirely fabricated, for pipeline testing only
BASE_MARKET_VALUES: dict[str, float] = {
    "p001": 30,  "p002": 35,  "p003": 180, "p004": 180, "p005": 70,
    "p006": 180, "p007": 180, "p008": 100, "p009": 100, "p010": 50,
    "p011": 150, "p012": 150, "p013": 150, "p014": 70,  "p015": 70,
    "p016": 70,  "p017": 50,  "p018": 25,  "p019": 20,  "p020": 20,
    "p021": 40,  "p022": 80,  "p023": 70,  "p024": 130, "p025": 120,
    "p026": 120, "p027": 150, "p028": 150, "p029": 130, "p030": 100,
    "p031": 120, "p032": 60,  "p033": 90,  "p034": 60,  "p035": 100,
    "p036": 80,  "p037": 100, "p038": 100, "p039": 100, "p040": 90,
    "p041": 100, "p042": 80,  "p043": 60,  "p044": 80,  "p045": 45,
    "p046": 70,  "p047": 15,  "p048": 70,  "p049": 90,  "p050": 40,
    "p051": 120, "p052": 90,  "p053": 70,  "p054": 70,  "p055": 25,
    "p056": 90,  "p057": 70,  "p058": 50,  "p059": 35,  "p060": 70,
    "p061": 100, "p062": 30,  "p063": 80,  "p064": 80,  "p065": 45,
    "p066": 30,  "p067": 80,  "p068": 80,  "p069": 70,  "p070": 35,
    "p071": 50,  "p072": 50,  "p073": 45,  "p074": 30,  "p075": 25,
    "p076": 80,  "p077": 50,  "p078": 50,  "p079": 80,  "p080": 50,
    "p081": 55,  "p082": 70,  "p083": 70,  "p084": 40,  "p085": 35,
    "p086": 70,  "p087": 90,  "p088": 55,  "p089": 25,  "p090": 65,
    "p091": 70,  "p092": 70,  "p093": 55,  "p094": 40,  "p095": 30,
    "p096": 20,  "p097": 45,  "p098": 20,  "p099": 80,  "p100": 70,
    "p101": 100, "p102": 100, "p103": 45,  "p104": 70,  "p105": 40,
}

# Base per-90 composite score (0-10 scale) — FABRICATED
BASE_PER90: dict[str, float] = {
    "p001": 6.2, "p002": 7.5, "p003": 8.5, "p004": 8.8, "p005": 7.2,
    "p006": 8.3, "p007": 8.4, "p008": 7.8, "p009": 8.0, "p010": 7.0,
    "p011": 8.1, "p012": 7.9, "p013": 7.6, "p014": 7.3, "p015": 7.1,
    "p016": 7.2, "p017": 5.8, "p018": 5.5, "p019": 6.8, "p020": 7.0,
    "p021": 5.5, "p022": 7.5, "p023": 7.3, "p024": 7.8, "p025": 7.9,
    "p026": 7.8, "p027": 8.2, "p028": 8.3, "p029": 7.7, "p030": 7.2,
    "p031": 7.8, "p032": 7.0, "p033": 7.4, "p034": 5.6, "p035": 8.0,
    "p036": 7.6, "p037": 7.5, "p038": 7.7, "p039": 7.6, "p040": 7.4,
    "p041": 7.7, "p042": 7.5, "p043": 7.0, "p044": 7.3, "p045": 6.8,
    "p046": 7.0, "p047": 5.2, "p048": 7.0, "p049": 7.6, "p050": 6.8,
    "p051": 7.9, "p052": 7.6, "p053": 7.3, "p054": 7.1, "p055": 6.5,
    "p056": 7.7, "p057": 7.0, "p058": 6.8, "p059": 7.0, "p060": 6.5,
    "p061": 7.8, "p062": 7.0, "p063": 7.4, "p064": 7.5, "p065": 7.0,
    "p066": 6.8, "p067": 7.2, "p068": 7.3, "p069": 7.2, "p070": 6.8,
    "p071": 7.4, "p072": 7.3, "p073": 7.2, "p074": 5.8, "p075": 6.0,
    "p076": 7.6, "p077": 7.0, "p078": 6.8, "p079": 7.7, "p080": 7.0,
    "p081": 6.8, "p082": 7.5, "p083": 7.0, "p084": 6.8, "p085": 6.5,
    "p086": 7.2, "p087": 7.9, "p088": 7.0, "p089": 5.4, "p090": 6.8,
    "p091": 6.2, "p092": 7.4, "p093": 7.5, "p094": 6.8, "p095": 6.5,
    "p096": 5.0, "p097": 7.0, "p098": 6.2, "p099": 5.5, "p100": 6.5,
    "p101": 6.0, "p102": 6.3, "p103": 6.8, "p104": 7.3, "p105": 6.7,
}

NUM_WEEKS = 26  # half-season worth of data


def _generate_performance_series(
    player_id: str, rng: np.random.Generator, num_weeks: int
) -> list[float]:
    """Generate weekly per-90 composite scores with realistic noise."""
    base = BASE_PER90.get(player_id, 6.5)
    scores = []
    current = base
    for w in range(num_weeks):
        if player_id in SLUMP_PLAYERS:
            # Deliberate downward drift in the second half of the season
            drift = -0.12 if w >= num_weeks // 2 else 0.0
        else:
            drift = rng.uniform(-0.02, 0.03)
        noise = rng.normal(0, 0.35)
        current = float(np.clip(current + drift + noise, 2.0, 10.0))
        scores.append(round(current, 3))
    return scores


def _generate_market_values(
    player_id: str, rng: np.random.Generator, num_weeks: int
) -> list[float]:
    """Generate weekly market values (€M) with slow drift and occasional jumps."""
    base = BASE_MARKET_VALUES.get(player_id, 40.0)
    values = []
    current = base
    for w in range(num_weeks):
        if player_id in OVERVALUED_PLAYERS:
            # Inflate market value beyond performance justification
            drift = rng.uniform(0.5, 1.5)
        elif player_id in SLUMP_PLAYERS:
            drift = rng.uniform(-1.0, 0.2)
        else:
            drift = rng.uniform(-0.3, 0.5)
        noise = rng.normal(0, 0.8)
        current = float(np.clip(current + drift + noise, 2.0, 350.0))
        values.append(round(current, 2))
    return values


def _generate_sentiment_scores(
    player_id: str, rng: np.random.Generator, num_weeks: int
) -> tuple[list[float], list[int]]:
    """Generate weekly sentiment scores (-1 to 1) and mention volumes."""
    scores: list[float] = []
    volumes: list[int] = []
    high_profile = player_id in {"p001", "p002", "p003", "p004", "p006", "p007", "p008"}
    base_volume = 50_000 if high_profile else 8_000

    for w in range(num_weeks):
        if player_id in SLUMP_PLAYERS and w >= num_weeks // 2:
            # Negative sentiment drift during slump
            sent = float(np.clip(rng.normal(-0.25, 0.2), -1.0, 1.0))
            vol = int(base_volume * rng.uniform(1.1, 1.8))  # controversy → more mentions
        elif player_id in OVERVALUED_PLAYERS:
            sent = float(np.clip(rng.normal(0.35, 0.25), -1.0, 1.0))  # hype
            vol = int(base_volume * rng.uniform(1.2, 2.0))
        else:
            sent = float(np.clip(rng.normal(0.1, 0.3), -1.0, 1.0))
            vol = int(base_volume * rng.uniform(0.7, 1.3))
        scores.append(round(sent, 4))
        volumes.append(vol)
    return scores, volumes


def _week_dates(num_weeks: int, start: datetime | None = None) -> list[str]:
    if start is None:
        start = datetime(2024, 8, 12)  # generic season start
    return [(start + timedelta(weeks=w)).strftime("%Y-%m-%d") for w in range(num_weeks)]


# ---------------------------------------------------------------------------
# 2.  Public generators
# ---------------------------------------------------------------------------

def generate_performance_data(rng: np.random.Generator, num_weeks: int = NUM_WEEKS) -> pd.DataFrame:
    """
    Generate FBref/StatsBomb-style per-match weekly performance data.
    SYNTHETIC — fabricated numbers for pipeline testing only.
    """
    rows = []
    dates = _week_dates(num_weeks)
    for p in PLAYERS:
        pid = p["player_id"]
        per90_series = _generate_performance_series(pid, rng, num_weeks)
        for w, (date, per90) in enumerate(zip(dates, per90_series)):
            # Decompose composite into individual realistic-looking stats
            base_xg = max(0.0, per90 * 0.07 + rng.normal(0, 0.05))
            rows.append(
                {
                    "player_id": pid,
                    "name": p["name"],
                    "club": p["club"],
                    "position": p["position"],
                    "week": w + 1,
                    "date": date,
                    "minutes_played": int(np.clip(rng.normal(75, 18), 0, 90)),
                    "goals_per90": round(max(0.0, rng.normal(base_xg * 0.8, 0.05)), 3),
                    "assists_per90": round(max(0.0, rng.normal(per90 * 0.04, 0.04)), 3),
                    "xg_per90": round(base_xg, 3),
                    "xa_per90": round(max(0.0, rng.normal(per90 * 0.035, 0.03)), 3),
                    "key_passes_per90": round(max(0.0, rng.normal(per90 * 0.18, 0.2)), 2),
                    "progressive_carries_per90": round(max(0.0, rng.normal(per90 * 0.4, 0.5)), 2),
                    "pressures_per90": round(max(0.0, rng.normal(per90 * 1.5, 1.5)), 2),
                    "tackles_won_per90": round(max(0.0, rng.normal(per90 * 0.3, 0.3)), 2),
                    "dribbles_completed_per90": round(max(0.0, rng.normal(per90 * 0.25, 0.3)), 2),
                    "per90_score": round(per90, 3),
                    "injury_flag": int(rng.random() < 0.06),
                }
            )
    df = pd.DataFrame(rows)
    return df


def generate_market_data(rng: np.random.Generator, num_weeks: int = NUM_WEEKS) -> pd.DataFrame:
    """
    Generate Transfermarkt-style market valuation data.
    SYNTHETIC — fabricated values for pipeline testing only.
    """
    rows = []
    dates = _week_dates(num_weeks)
    for p in PLAYERS:
        pid = p["player_id"]
        mv_series = _generate_market_values(pid, rng, num_weeks)
        for w, (date, mv) in enumerate(zip(dates, mv_series)):
            rows.append(
                {
                    "player_id": pid,
                    "name": p["name"],
                    "club": p["club"],
                    "position": p["position"],
                    "week": w + 1,
                    "date": date,
                    "market_value_eur": mv,
                    "nationality": p["nationality"],
                    "age": p["age"],
                }
            )
    return pd.DataFrame(rows)


def generate_sentiment_data(rng: np.random.Generator, num_weeks: int = NUM_WEEKS) -> pd.DataFrame:
    """
    Generate synthetic social media sentiment data (tweet/post aggregates).
    SYNTHETIC — does not reflect any real social media posts. For pipeline testing only.
    """
    rows = []
    dates = _week_dates(num_weeks)
    for p in PLAYERS:
        pid = p["player_id"]
        sentiments, volumes = _generate_sentiment_scores(pid, rng, num_weeks)
        for w, (date, sent, vol) in enumerate(zip(dates, sentiments, volumes)):
            rows.append(
                {
                    "player_id": pid,
                    "name": p["name"],
                    "week": w + 1,
                    "date": date,
                    "sentiment_score": sent,
                    "mention_volume": vol,
                    "positive_ratio": round(np.clip((sent + 1) / 2 + rng.normal(0, 0.05), 0, 1), 3),
                    "negative_ratio": round(np.clip((1 - (sent + 1) / 2) + rng.normal(0, 0.05), 0, 1), 3),
                    "sample_text": f"[SYNTHETIC PLACEHOLDER — real posts to be wired in later for {p['name']}]",
                }
            )
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 3.  CLI entry-point
# ---------------------------------------------------------------------------

def main(seed: int = 42, out_dir: str = "data/raw"):
    rng = np.random.default_rng(seed)
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    print("Generating SYNTHETIC performance data …")
    perf_df = generate_performance_data(rng)
    perf_df.to_csv(out / "match_performance.csv", index=False)
    print(f"  → {len(perf_df):,} rows written to {out / 'match_performance.csv'}")

    print("Generating SYNTHETIC market valuation data …")
    market_df = generate_market_data(rng)
    market_df.to_csv(out / "market_valuations.csv", index=False)
    print(f"  → {len(market_df):,} rows written to {out / 'market_valuations.csv'}")

    print("Generating SYNTHETIC sentiment data …")
    sent_df = generate_sentiment_data(rng)
    sent_df.to_csv(out / "social_sentiment.csv", index=False)
    print(f"  → {len(sent_df):,} rows written to {out / 'social_sentiment.csv'}")

    print(f"\n✓ Mock data generation complete. {len(PLAYERS)} players × {NUM_WEEKS} weeks.")
    print("  ⚠  All numbers are FABRICATED. See README §Mock-Data Caveat.")


if __name__ == "__main__":
    main()
