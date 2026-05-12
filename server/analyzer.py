import pandas as pd
from price_action.multi_timeframe import aggregate_timeframes
from ml.predictor import predict as ml_predict
from ai_narrator import generate_market_reading


def run_full_analysis(tf_data: dict[str, pd.DataFrame]) -> dict:
    # Rule-based multi-timeframe analysis
    mtf_result = aggregate_timeframes(tf_data)

    # ML prediction (uses 5m data as primary)
    primary_df = tf_data.get("5m")
    if primary_df is None or primary_df.empty:
        primary_df = tf_data.get("15m")
    if primary_df is None or primary_df.empty:
        primary_df = next(iter(tf_data.values()), pd.DataFrame())
    ml_result = ml_predict(primary_df)

    # Merge ML signal into overall signal
    final_signal = _reconcile_signals(
        rule_signal=mtf_result.get("signal", "WAIT"),
        ml_signal=ml_result.get("signal", "WAIT"),
        ml_confidence=ml_result.get("confidence", 0.0),
        ml_available=ml_result.get("ml_available", False),
    )

    mtf_result["ml_prediction"] = ml_result
    mtf_result["signal"] = final_signal

    # Generate plain English reading via Groq AI
    narrative = generate_market_reading(mtf_result)
    mtf_result["narrative"] = narrative
    mtf_result["signal"] = narrative.get("signal", final_signal)

    # Serialize (remove raw DataFrames, clean for JSON)
    return _clean_for_json(mtf_result)


def _reconcile_signals(rule_signal: str, ml_signal: str, ml_confidence: float, ml_available: bool) -> str:
    if not ml_available:
        return rule_signal

    # Both agree → use that signal
    if rule_signal == ml_signal:
        return rule_signal

    # ML is confident → use ML
    if ml_confidence >= 0.6:
        return ml_signal

    # Rule says BUY/SELL but ML is WAIT with low confidence → trust rule
    if ml_signal == "WAIT" and ml_confidence < 0.5:
        return rule_signal

    return "WAIT"


def _clean_for_json(obj):
    import numpy as np
    if isinstance(obj, dict):
        return {k: _clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_clean_for_json(i) for i in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.DataFrame):
        return None
    return obj
