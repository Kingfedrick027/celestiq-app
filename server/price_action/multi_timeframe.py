import pandas as pd
from .market_structure import detect_trend
from .candlestick import detect_patterns
from .chart_patterns import detect_chart_patterns
from .support_resistance import find_key_levels, nearest_level
from .volume import analyze_volume


def analyze_single_timeframe(df: pd.DataFrame, timeframe: str) -> dict:
    if df.empty or len(df) < 10:
        return {"timeframe": timeframe, "error": "Insufficient data"}

    trend = detect_trend(df)
    candle_patterns = detect_patterns(df)
    chart_patterns = detect_chart_patterns(df)
    key_levels = find_key_levels(df)
    level_info = nearest_level(df, key_levels)
    volume = analyze_volume(df)

    current_price = float(df["close"].iloc[-1])
    prev_close = float(df["close"].iloc[-2]) if len(df) > 1 else current_price
    change_pct = (current_price - prev_close) / prev_close * 100

    return {
        "timeframe": timeframe,
        "current_price": current_price,
        "change_pct": round(change_pct, 3),
        "trend": trend,
        "candlestick_patterns": candle_patterns,
        "chart_patterns": chart_patterns,
        "key_levels": key_levels,
        "level_context": level_info,
        "volume": volume,
        "candle_count": len(df),
    }


def aggregate_timeframes(tf_data: dict) -> dict:
    timeframes = ["5m", "15m", "1h", "4h"]
    results = {}

    for tf in timeframes:
        if tf in tf_data and not tf_data[tf].empty:
            results[tf] = analyze_single_timeframe(tf_data[tf], tf)

    bias = _compute_bias(results)
    signal = _compute_signal(results, bias)
    confluence = _compute_confluence(results)

    return {
        "timeframes": results,
        "overall_bias": bias,
        "signal": signal,
        "confluence_score": confluence,
    }


def _compute_bias(results: dict) -> str:
    scores = {"bullish": 0, "bearish": 0, "neutral": 0}
    weights = {"4h": 4, "1h": 3, "15m": 2, "5m": 1}

    for tf, data in results.items():
        if "error" in data:
            continue
        w = weights.get(tf, 1)
        trend = data.get("trend", {}).get("trend", "ranging")
        if trend == "uptrend":
            scores["bullish"] += w
        elif trend == "downtrend":
            scores["bearish"] += w
        else:
            scores["neutral"] += w

    if scores["bullish"] > scores["bearish"] and scores["bullish"] > scores["neutral"]:
        return "bullish"
    elif scores["bearish"] > scores["bullish"] and scores["bearish"] > scores["neutral"]:
        return "bearish"
    return "neutral"


def _compute_signal(results: dict, bias: str) -> str:
    if not results:
        return "WAIT"

    # Require 5m pattern alignment with higher TF bias
    tf5 = results.get("5m", {})
    tf15 = results.get("15m", {})

    patterns_5m = tf5.get("candlestick_patterns", []) + tf5.get("chart_patterns", [])
    patterns_15m = tf15.get("candlestick_patterns", []) + tf15.get("chart_patterns", [])
    all_patterns = patterns_5m + patterns_15m

    bullish_patterns = [p for p in all_patterns if p.get("direction") == "bullish" and p.get("strength") in ("strong", "medium")]
    bearish_patterns = [p for p in all_patterns if p.get("direction") == "bearish" and p.get("strength") in ("strong", "medium")]

    at_level = tf5.get("level_context", {}).get("at_level", False)

    if bias == "bullish" and bullish_patterns and at_level:
        return "BUY"
    elif bias == "bearish" and bearish_patterns and at_level:
        return "SELL"
    elif bias == "bullish" and bullish_patterns:
        return "BUY"
    elif bias == "bearish" and bearish_patterns:
        return "SELL"
    return "WAIT"


def _compute_confluence(results: dict) -> float:
    if not results:
        return 0.0

    score = 0.0
    max_score = 0.0

    for tf, weight in [("4h", 0.35), ("1h", 0.30), ("15m", 0.20), ("5m", 0.15)]:
        data = results.get(tf, {})
        if "error" in data:
            continue
        max_score += weight

        trend = data.get("trend", {}).get("trend", "ranging")
        strength = data.get("trend", {}).get("strength", "weak")
        patterns = data.get("candlestick_patterns", []) + data.get("chart_patterns", [])
        strong_patterns = [p for p in patterns if p.get("strength") == "strong"]

        if trend != "ranging":
            score += weight * 0.5
        if strength in ("strong",):
            score += weight * 0.3
        if strong_patterns:
            score += weight * 0.2

    return round(score / max_score, 2) if max_score > 0 else 0.0
