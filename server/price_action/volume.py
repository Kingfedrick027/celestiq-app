import pandas as pd
import numpy as np


def analyze_volume(df: pd.DataFrame) -> dict:
    if len(df) < 10 or "volume" not in df.columns:
        return {"trend": "unknown", "confirmation": False, "description": "No volume data"}

    vol = df["volume"].replace(0, np.nan).dropna()
    if len(vol) < 5:
        return {"trend": "unknown", "confirmation": False, "description": "Insufficient volume"}

    avg_vol = vol.tail(20).mean()
    current_vol = float(vol.iloc[-1])
    ratio = current_vol / avg_vol if avg_vol > 0 else 1.0

    price_up = df["close"].iloc[-1] > df["close"].iloc[-2]

    if ratio > 1.5:
        trend = "spike"
        desc = f"Volume spike ({ratio:.1f}x avg) — strong conviction"
    elif ratio > 1.1:
        trend = "increasing"
        desc = "Volume above average — move has support"
    elif ratio < 0.7:
        trend = "declining"
        desc = "Low volume — weak conviction, could reverse"
    else:
        trend = "normal"
        desc = "Normal volume"

    confirmation = (price_up and trend in ("spike", "increasing")) or \
                   (not price_up and trend in ("spike", "increasing"))

    return {
        "trend": trend,
        "ratio": round(ratio, 2),
        "current": int(current_vol),
        "avg": int(avg_vol),
        "confirmation": confirmation,
        "description": desc,
    }
