import pandas as pd
import numpy as np


def find_swing_points(df: pd.DataFrame, window: int = 5) -> tuple[list, list]:
    highs, lows = [], []
    for i in range(window, len(df) - window):
        if df["high"].iloc[i] == df["high"].iloc[i - window:i + window + 1].max():
            highs.append((i, df["high"].iloc[i]))
        if df["low"].iloc[i] == df["low"].iloc[i - window:i + window + 1].min():
            lows.append((i, df["low"].iloc[i]))
    return highs, lows


def detect_trend(df: pd.DataFrame) -> dict:
    if len(df) < 20:
        return {"trend": "ranging", "strength": "weak", "description": "Insufficient data"}

    highs, lows = find_swing_points(df)

    if len(highs) < 2 or len(lows) < 2:
        return {"trend": "ranging", "strength": "weak", "description": "Not enough swing points"}

    last_highs = highs[-3:] if len(highs) >= 3 else highs
    last_lows = lows[-3:] if len(lows) >= 3 else lows

    hh = all(last_highs[i][1] > last_highs[i - 1][1] for i in range(1, len(last_highs)))
    hl = all(last_lows[i][1] > last_lows[i - 1][1] for i in range(1, len(last_lows)))
    lh = all(last_highs[i][1] < last_highs[i - 1][1] for i in range(1, len(last_highs)))
    ll = all(last_lows[i][1] < last_lows[i - 1][1] for i in range(1, len(last_lows)))

    if hh and hl:
        trend = "uptrend"
        description = "Higher Highs and Higher Lows — bullish structure intact"
    elif lh and ll:
        trend = "downtrend"
        description = "Lower Highs and Lower Lows — bearish structure intact"
    elif hh and not hl:
        trend = "uptrend"
        description = "Higher Highs but losing momentum — weak uptrend"
    elif ll and not lh:
        trend = "downtrend"
        description = "Lower Lows but losing momentum — weak downtrend"
    else:
        trend = "ranging"
        description = "No clear structure — market consolidating"

    ema20 = df["close"].ewm(span=20).mean().iloc[-1]
    ema50 = df["close"].ewm(span=50).mean().iloc[-1] if len(df) >= 50 else ema20
    current = df["close"].iloc[-1]

    if trend == "uptrend":
        strength = "strong" if current > ema20 > ema50 else "weak"
    elif trend == "downtrend":
        strength = "strong" if current < ema20 < ema50 else "weak"
    else:
        strength = "neutral"

    atr = _calc_atr(df)
    recent_range = df["high"].tail(10).max() - df["low"].tail(10).min()
    exhausted = recent_range < atr * 1.5 and trend != "ranging"

    return {
        "trend": trend,
        "strength": "exhausted" if exhausted and strength == "strong" else strength,
        "description": description,
        "swing_highs": [(int(i), float(v)) for i, v in last_highs],
        "swing_lows": [(int(i), float(v)) for i, v in last_lows],
    }


def _calc_atr(df: pd.DataFrame, period: int = 14) -> float:
    high = df["high"]
    low = df["low"]
    close = df["close"].shift(1)
    tr = pd.concat([high - low, (high - close).abs(), (low - close).abs()], axis=1).max(axis=1)
    return float(tr.rolling(period).mean().iloc[-1]) if len(df) >= period else float(tr.mean())
