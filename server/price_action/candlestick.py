import pandas as pd
import numpy as np


def _body(row) -> float:
    return abs(row["close"] - row["open"])


def _upper_wick(row) -> float:
    return row["high"] - max(row["open"], row["close"])


def _lower_wick(row) -> float:
    return min(row["open"], row["close"]) - row["low"]


def _range(row) -> float:
    return row["high"] - row["low"]


def detect_patterns(df: pd.DataFrame) -> list[dict]:
    if len(df) < 3:
        return []

    patterns = []
    c = df.iloc[-1]
    p = df.iloc[-2]
    p2 = df.iloc[-3]

    body_c = _body(c)
    upper_c = _upper_wick(c)
    lower_c = _lower_wick(c)
    range_c = _range(c)
    body_p = _body(p)
    range_p = _range(p)

    avg_body = df["close"].sub(df["open"]).abs().tail(20).mean()
    avg_range = (df["high"] - df["low"]).tail(20).mean()

    if range_c < 1e-8:
        return []

    is_bull_c = c["close"] > c["open"]
    is_bull_p = p["close"] > p["open"]

    # Doji
    if body_c < range_c * 0.1:
        patterns.append({"name": "doji", "type": "reversal", "direction": "neutral",
                         "strength": "medium", "description": "Indecision — market at a crossroads"})

    # Hammer (bullish reversal at bottom)
    if (lower_c > body_c * 2 and upper_c < body_c * 0.5
            and c["low"] <= df["low"].tail(10).quantile(0.2)):
        patterns.append({"name": "hammer", "type": "reversal", "direction": "bullish",
                         "strength": "strong", "description": "Hammer at low — buyers stepping in"})

    # Inverted Hammer / Shooting Star
    if upper_c > body_c * 2 and lower_c < body_c * 0.5:
        if c["high"] >= df["high"].tail(10).quantile(0.8):
            patterns.append({"name": "shooting_star", "type": "reversal", "direction": "bearish",
                             "strength": "strong", "description": "Shooting star at high — sellers rejecting price"})
        else:
            patterns.append({"name": "inverted_hammer", "type": "reversal", "direction": "bullish",
                             "strength": "medium", "description": "Inverted hammer — potential reversal"})

    # Pin Bar (strong rejection wick)
    if lower_c > range_c * 0.6 and body_c < range_c * 0.3:
        patterns.append({"name": "pin_bar_bull", "type": "reversal", "direction": "bullish",
                         "strength": "strong", "description": "Bullish pin bar — strong rejection of lows"})
    elif upper_c > range_c * 0.6 and body_c < range_c * 0.3:
        patterns.append({"name": "pin_bar_bear", "type": "reversal", "direction": "bearish",
                         "strength": "strong", "description": "Bearish pin bar — strong rejection of highs"})

    # Bullish Engulfing
    if (is_bull_c and not is_bull_p
            and c["open"] < p["close"]
            and c["close"] > p["open"]
            and body_c > body_p):
        patterns.append({"name": "bullish_engulfing", "type": "reversal", "direction": "bullish",
                         "strength": "strong", "description": "Bullish engulfing — buyers overwhelm sellers"})

    # Bearish Engulfing
    if (not is_bull_c and is_bull_p
            and c["open"] > p["close"]
            and c["close"] < p["open"]
            and body_c > body_p):
        patterns.append({"name": "bearish_engulfing", "type": "reversal", "direction": "bearish",
                         "strength": "strong", "description": "Bearish engulfing — sellers overwhelm buyers"})

    # Morning Star (3-candle bullish reversal)
    p2_bull = p2["close"] < p2["open"]
    if (p2_bull and _body(p) < avg_body * 0.5 and is_bull_c
            and c["close"] > (p2["open"] + p2["close"]) / 2):
        patterns.append({"name": "morning_star", "type": "reversal", "direction": "bullish",
                         "strength": "strong", "description": "Morning star — 3-candle bottom reversal"})

    # Evening Star (3-candle bearish reversal)
    p2_bull2 = p2["close"] > p2["open"]
    if (p2_bull2 and _body(p) < avg_body * 0.5 and not is_bull_c
            and c["close"] < (p2["open"] + p2["close"]) / 2):
        patterns.append({"name": "evening_star", "type": "reversal", "direction": "bearish",
                         "strength": "strong", "description": "Evening star — 3-candle top reversal"})

    # Inside Bar (continuation / breakout setup)
    if c["high"] < p["high"] and c["low"] > p["low"]:
        patterns.append({"name": "inside_bar", "type": "continuation", "direction": "neutral",
                         "strength": "medium", "description": "Inside bar — compression before breakout"})

    # Outside Bar (engulfs previous candle range)
    if c["high"] > p["high"] and c["low"] < p["low"]:
        direction = "bullish" if is_bull_c else "bearish"
        patterns.append({"name": "outside_bar", "type": "reversal", "direction": direction,
                         "strength": "medium", "description": f"Outside bar ({direction}) — volatile expansion"})

    # Shaved Bar (no or minimal wick on one side)
    if upper_c < range_c * 0.05 and is_bull_c and body_c > avg_body:
        patterns.append({"name": "shaved_top_bull", "type": "continuation", "direction": "bullish",
                         "strength": "medium", "description": "Shaved top bullish — strong buying, no pullback"})
    if lower_c < range_c * 0.05 and not is_bull_c and body_c > avg_body:
        patterns.append({"name": "shaved_bottom_bear", "type": "continuation", "direction": "bearish",
                         "strength": "medium", "description": "Shaved bottom bearish — strong selling, no relief"})

    # Spinning Top
    if (body_c < avg_body * 0.5 and upper_c > body_c and lower_c > body_c
            and not any(p["name"] == "doji" for p in patterns)):
        patterns.append({"name": "spinning_top", "type": "reversal", "direction": "neutral",
                         "strength": "weak", "description": "Spinning top — uncertainty, watch next candle"})

    return patterns
