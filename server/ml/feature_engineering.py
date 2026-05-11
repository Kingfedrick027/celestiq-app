import pandas as pd
import numpy as np
from price_action.market_structure import detect_trend, find_swing_points
from price_action.candlestick import detect_patterns
from price_action.support_resistance import find_key_levels, nearest_level
from price_action.volume import analyze_volume


FEATURE_NAMES = [
    "trend_uptrend", "trend_downtrend", "trend_ranging",
    "trend_strong", "trend_weak", "trend_exhausted",
    "pattern_bullish_count", "pattern_bearish_count", "pattern_neutral_count",
    "pattern_strong_count", "pattern_medium_count",
    "has_hammer", "has_engulfing", "has_pin_bar", "has_inside_bar", "has_doji",
    "at_key_level", "dist_to_nearest_pct",
    "vol_spike", "vol_increasing", "vol_declining",
    "rsi_14", "atr_pct",
    "close_vs_ema20", "close_vs_ema50",
    "body_ratio", "upper_wick_ratio", "lower_wick_ratio",
    "recent_range_pct",
]


def extract_features(df: pd.DataFrame) -> np.ndarray:
    features = np.zeros(len(FEATURE_NAMES))
    if len(df) < 20:
        return features

    try:
        trend_data = detect_trend(df)
        trend = trend_data.get("trend", "ranging")
        strength = trend_data.get("strength", "weak")

        features[0] = 1 if trend == "uptrend" else 0
        features[1] = 1 if trend == "downtrend" else 0
        features[2] = 1 if trend == "ranging" else 0
        features[3] = 1 if strength == "strong" else 0
        features[4] = 1 if strength == "weak" else 0
        features[5] = 1 if strength == "exhausted" else 0

        patterns = detect_patterns(df)
        bull_p = [p for p in patterns if p["direction"] == "bullish"]
        bear_p = [p for p in patterns if p["direction"] == "bearish"]
        neut_p = [p for p in patterns if p["direction"] == "neutral"]
        strong_p = [p for p in patterns if p["strength"] == "strong"]
        med_p = [p for p in patterns if p["strength"] == "medium"]

        features[6] = len(bull_p)
        features[7] = len(bear_p)
        features[8] = len(neut_p)
        features[9] = len(strong_p)
        features[10] = len(med_p)

        names = [p["name"] for p in patterns]
        features[11] = 1 if any("hammer" in n for n in names) else 0
        features[12] = 1 if any("engulfing" in n for n in names) else 0
        features[13] = 1 if any("pin_bar" in n for n in names) else 0
        features[14] = 1 if any("inside_bar" in n for n in names) else 0
        features[15] = 1 if any("doji" in n for n in names) else 0

        levels = find_key_levels(df)
        level_ctx = nearest_level(df, levels)
        features[16] = 1 if level_ctx.get("at_level", False) else 0
        features[17] = float(level_ctx.get("distance_pct", 5.0))

        vol = analyze_volume(df)
        features[18] = 1 if vol.get("trend") == "spike" else 0
        features[19] = 1 if vol.get("trend") == "increasing" else 0
        features[20] = 1 if vol.get("trend") == "declining" else 0

        close = df["close"]
        features[21] = float(_rsi(close, 14))

        high, low = df["high"], df["low"]
        prev_close = close.shift(1)
        tr = pd.concat([high - low, (high - prev_close).abs(), (low - prev_close).abs()], axis=1).max(axis=1)
        atr = float(tr.rolling(14).mean().iloc[-1]) if len(df) >= 14 else float(tr.mean())
        features[22] = atr / float(close.iloc[-1]) * 100

        ema20 = float(close.ewm(span=20).mean().iloc[-1])
        ema50 = float(close.ewm(span=50).mean().iloc[-1]) if len(df) >= 50 else ema20
        curr = float(close.iloc[-1])
        features[23] = (curr - ema20) / ema20 * 100
        features[24] = (curr - ema50) / ema50 * 100

        last = df.iloc[-1]
        rng = last["high"] - last["low"]
        if rng > 0:
            features[25] = abs(last["close"] - last["open"]) / rng
            features[26] = (last["high"] - max(last["open"], last["close"])) / rng
            features[27] = (min(last["open"], last["close"]) - last["low"]) / rng

        recent_range = (high.tail(10).max() - low.tail(10).min()) / curr * 100
        features[28] = float(recent_range)

    except Exception:
        pass

    return features


def _rsi(series: pd.Series, period: int = 14) -> float:
    if len(series) < period + 1:
        return 50.0
    delta = series.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / loss.replace(0, 1e-10)
    rsi = 100 - (100 / (1 + rs))
    val = rsi.iloc[-1]
    return float(val) if not pd.isna(val) else 50.0


def build_training_dataset(df: pd.DataFrame, forward_bars: int = 3, threshold_pct: float = 0.3) -> tuple:
    X, y = [], []
    min_bars = 60

    for i in range(min_bars, len(df) - forward_bars):
        window = df.iloc[:i]
        features = extract_features(window)

        future_high = df["high"].iloc[i:i + forward_bars].max()
        future_low = df["low"].iloc[i:i + forward_bars].min()
        current_close = df["close"].iloc[i - 1]

        up_move = (future_high - current_close) / current_close * 100
        down_move = (current_close - future_low) / current_close * 100

        if up_move >= threshold_pct and up_move > down_move:
            label = 1  # BUY
        elif down_move >= threshold_pct and down_move > up_move:
            label = -1  # SELL
        else:
            label = 0  # WAIT/NEUTRAL

        X.append(features)
        y.append(label)

    return np.array(X), np.array(y)
