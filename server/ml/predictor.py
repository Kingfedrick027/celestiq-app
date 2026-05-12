import numpy as np
import pandas as pd
from ml.trainer import load_model, model_exists
from ml.feature_engineering import extract_features

_model = None
LABEL_MAP = {0: "SELL", 1: "WAIT", 2: "BUY"}
CONFIDENCE_THRESHOLD = 0.4


def get_model():
    global _model
    if _model is None and model_exists():
        _model = load_model()
    return _model


def predict(df: pd.DataFrame) -> dict:
    model = get_model()

    if model is None:
        return {
            "signal": "WAIT",
            "confidence": 0.0,
            "ml_available": False,
            "description": "ML model not trained yet — using rule-based signal only",
        }

    features = extract_features(df).reshape(1, -1)

    try:
        proba = model.predict_proba(features)[0]
        pred_class = int(np.argmax(proba))
        confidence = float(proba[pred_class])

        signal = LABEL_MAP.get(pred_class, "WAIT")

        if confidence < CONFIDENCE_THRESHOLD:
            signal = "WAIT"

        return {
            "signal": signal,
            "confidence": round(confidence, 3),
            "probabilities": {
                "SELL": round(float(proba[0]), 3),
                "WAIT": round(float(proba[1]), 3),
                "BUY": round(float(proba[2]), 3),
            },
            "ml_available": True,
            "description": f"ML confidence: {confidence:.0%}",
        }
    except Exception as e:
        return {
            "signal": "WAIT",
            "confidence": 0.0,
            "ml_available": False,
            "description": f"ML prediction failed: {str(e)}",
        }


def reload_model():
    global _model
    _model = None
    _model = load_model()
