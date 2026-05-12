import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

try:
    import lightgbm as lgb
    LGB_AVAILABLE = True
except ImportError:
    LGB_AVAILABLE = False

from data_service import fetch_historical_for_training
from ml.feature_engineering import build_training_dataset, FEATURE_NAMES

MODEL_DIR = Path(__file__).parent / "models"
MODEL_PATH = MODEL_DIR / "lgbm_model.pkl"
LABEL_MAP = {-1: "SELL", 0: "WAIT", 1: "BUY"}
REVERSE_LABEL_MAP = {"SELL": -1, "WAIT": 0, "BUY": 1}


def train_model(years: int = 5) -> dict:
    MODEL_DIR.mkdir(exist_ok=True)

    print(f"[ML] Fetching {years}y of XAUUSD historical data...")
    df = fetch_historical_for_training(years=years)

    if df.empty or len(df) < 200:
        return {"success": False, "error": "Not enough historical data"}

    print(f"[ML] Got {len(df)} candles. Building features...")
    X, y = build_training_dataset(df, forward_bars=3, threshold_pct=0.3)

    if len(X) < 100:
        return {"success": False, "error": "Not enough training samples"}

    # Map -1/0/1 to 0/1/2 for LightGBM
    y_mapped = y + 1  # -1->0, 0->1, 1->2

    X_train, X_val, y_train, y_val = train_test_split(X, y_mapped, test_size=0.2, shuffle=False)

    print(f"[ML] Training LightGBM on {len(X_train)} samples...")

    if not LGB_AVAILABLE:
        print("[ML] LightGBM not available, using fallback RandomForest")
        return _train_fallback(X_train, X_val, y_train, y_val, y)

    model = lgb.LGBMClassifier(
        n_estimators=300,
        learning_rate=0.05,
        num_leaves=31,
        feature_fraction=0.8,
        bagging_fraction=0.8,
        bagging_freq=5,
        class_weight="balanced",
        random_state=42,
        verbose=-1,
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        callbacks=[lgb.early_stopping(30, verbose=False), lgb.log_evaluation(False)],
    )

    y_pred = model.predict(X_val)
    report = classification_report(y_val, y_pred, target_names=["SELL", "WAIT", "BUY"], output_dict=True)

    joblib.dump(model, MODEL_PATH)
    print(f"[ML] Model saved to {MODEL_PATH}")
    print(f"[ML] Validation accuracy: {report['accuracy']:.3f}")

    return {
        "success": True,
        "samples": len(X),
        "accuracy": round(report["accuracy"], 3),
        "report": report,
    }


def _train_fallback(X_train, X_val, y_train, y_val, y_orig):
    from sklearn.ensemble import RandomForestClassifier
    model = RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_val)
    report = classification_report(y_val, y_pred, target_names=["SELL", "WAIT", "BUY"], output_dict=True)
    joblib.dump(model, MODEL_PATH)
    return {"success": True, "samples": len(X_train), "accuracy": round(report["accuracy"], 3), "report": report}


def model_exists() -> bool:
    return MODEL_PATH.exists()


def load_model():
    if not MODEL_PATH.exists():
        return None
    return joblib.load(MODEL_PATH)
