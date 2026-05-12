import pandas as pd
import numpy as np


def find_key_levels(df: pd.DataFrame, n_levels: int = 6) -> list[dict]:
    if len(df) < 20:
        return []

    levels = []

    # Swing highs/lows as key levels
    window = 5
    for i in range(window, len(df) - window):
        slice_h = df["high"].iloc[i - window:i + window + 1]
        slice_l = df["low"].iloc[i - window:i + window + 1]
        if df["high"].iloc[i] == slice_h.max():
            levels.append({"price": float(df["high"].iloc[i]), "type": "resistance", "touches": 1})
        if df["low"].iloc[i] == slice_l.min():
            levels.append({"price": float(df["low"].iloc[i]), "type": "support", "touches": 1})

    # Round number levels (XAUUSD: every $50)
    current = df["close"].iloc[-1]
    for base in range(int(current - 200), int(current + 200), 50):
        levels.append({"price": float(base), "type": "round_number", "touches": 0})

    # Cluster nearby levels (within 0.3% of each other)
    levels.sort(key=lambda x: x["price"])
    clustered = []
    threshold = current * 0.003

    for lvl in levels:
        if clustered and abs(lvl["price"] - clustered[-1]["price"]) < threshold:
            clustered[-1]["touches"] += lvl["touches"]
            clustered[-1]["price"] = (clustered[-1]["price"] + lvl["price"]) / 2
        else:
            clustered.append(lvl.copy())

    # Filter to levels that have been touched or are round numbers
    significant = [l for l in clustered if l["touches"] >= 2 or l["type"] == "round_number"]
    significant.sort(key=lambda x: abs(x["price"] - current))
    return significant[:n_levels]


def nearest_level(df: pd.DataFrame, levels: list[dict]) -> dict:
    if not levels:
        return {}

    current = df["close"].iloc[-1]
    nearest = min(levels, key=lambda x: abs(x["price"] - current))
    distance_pct = abs(nearest["price"] - current) / current * 100

    above = [l for l in levels if l["price"] > current]
    below = [l for l in levels if l["price"] < current]

    return {
        "nearest": nearest,
        "distance_pct": round(distance_pct, 3),
        "nearest_resistance": min(above, key=lambda x: x["price"]) if above else None,
        "nearest_support": max(below, key=lambda x: x["price"]) if below else None,
        "at_level": distance_pct < 0.15,
    }


def classify_price_action_at_level(df: pd.DataFrame, level_price: float) -> str:
    recent = df.tail(5)
    current = df["close"].iloc[-1]
    threshold = level_price * 0.002

    if abs(current - level_price) > threshold * 3:
        return "away"

    price_came_from_below = df["close"].iloc[-5] < level_price
    if price_came_from_below and current > level_price:
        return "breakout_up"
    if not price_came_from_below and current < level_price:
        return "breakout_down"

    wicks_rejecting = any(
        abs(recent["high"].iloc[i] - level_price) < threshold and
        recent["close"].iloc[i] < level_price - threshold
        for i in range(len(recent))
    )
    if wicks_rejecting:
        return "rejection"

    return "approaching"
