import pandas as pd
import numpy as np
from .market_structure import find_swing_points


def detect_chart_patterns(df: pd.DataFrame) -> list[dict]:
    if len(df) < 30:
        return []

    patterns = []
    highs, lows = find_swing_points(df, window=4)

    if len(highs) >= 2:
        patterns += _detect_double_top(df, highs)
    if len(lows) >= 2:
        patterns += _detect_double_bottom(df, lows)
    if len(highs) >= 3 and len(lows) >= 2:
        patterns += _detect_head_and_shoulders(df, highs, lows)
    if len(lows) >= 3 and len(highs) >= 2:
        patterns += _detect_inv_head_and_shoulders(df, highs, lows)
    patterns += _detect_triangles(df, highs, lows)
    patterns += _detect_flags(df)

    return patterns


def _detect_double_top(df: pd.DataFrame, highs: list) -> list[dict]:
    results = []
    last_idx = len(df) - 1
    recent_highs = [h for h in highs if h[0] >= last_idx - 40]

    for i in range(len(recent_highs) - 1):
        h1_i, h1_v = recent_highs[i]
        for j in range(i + 1, len(recent_highs)):
            h2_i, h2_v = recent_highs[j]
            if abs(h1_v - h2_v) / h1_v < 0.005 and h2_i > h1_i + 5:
                neckline = df["low"].iloc[h1_i:h2_i].min()
                current = df["close"].iloc[-1]
                completion = min(100, int((1 - (current - neckline) / (h1_v - neckline)) * 100)) if h1_v != neckline else 50
                results.append({
                    "name": "double_top",
                    "type": "reversal",
                    "direction": "bearish",
                    "completion_pct": completion,
                    "target": float(neckline - (h1_v - neckline)),
                    "description": f"Double top forming — neckline at {neckline:.2f}, target {neckline - (h1_v - neckline):.2f}",
                })
    return results


def _detect_double_bottom(df: pd.DataFrame, lows: list) -> list[dict]:
    results = []
    last_idx = len(df) - 1
    recent_lows = [l for l in lows if l[0] >= last_idx - 40]

    for i in range(len(recent_lows) - 1):
        l1_i, l1_v = recent_lows[i]
        for j in range(i + 1, len(recent_lows)):
            l2_i, l2_v = recent_lows[j]
            if abs(l1_v - l2_v) / l1_v < 0.005 and l2_i > l1_i + 5:
                neckline = df["high"].iloc[l1_i:l2_i].max()
                current = df["close"].iloc[-1]
                completion = min(100, int((current - l1_v) / (neckline - l1_v) * 100)) if neckline != l1_v else 50
                results.append({
                    "name": "double_bottom",
                    "type": "reversal",
                    "direction": "bullish",
                    "completion_pct": completion,
                    "target": float(neckline + (neckline - l1_v)),
                    "description": f"Double bottom forming — neckline at {neckline:.2f}, target {neckline + (neckline - l1_v):.2f}",
                })
    return results


def _detect_head_and_shoulders(df: pd.DataFrame, highs: list, lows: list) -> list[dict]:
    results = []
    last_idx = len(df) - 1
    recent = [h for h in highs if h[0] >= last_idx - 60]
    if len(recent) < 3:
        return []

    for i in range(len(recent) - 2):
        l, h, r = recent[i], recent[i + 1], recent[i + 2]
        if h[1] > l[1] and h[1] > r[1] and abs(l[1] - r[1]) / l[1] < 0.01:
            neckline_lows = [lw for lw in lows if l[0] < lw[0] < r[0]]
            if neckline_lows:
                neckline = sum(lw[1] for lw in neckline_lows) / len(neckline_lows)
                results.append({
                    "name": "head_and_shoulders",
                    "type": "reversal",
                    "direction": "bearish",
                    "completion_pct": 80,
                    "target": float(neckline - (h[1] - neckline)),
                    "description": f"Head & Shoulders — neckline {neckline:.2f}, target {neckline - (h[1] - neckline):.2f}",
                })
    return results


def _detect_inv_head_and_shoulders(df: pd.DataFrame, highs: list, lows: list) -> list[dict]:
    results = []
    last_idx = len(df) - 1
    recent = [l for l in lows if l[0] >= last_idx - 60]
    if len(recent) < 3:
        return []

    for i in range(len(recent) - 2):
        l, h, r = recent[i], recent[i + 1], recent[i + 2]
        if h[1] < l[1] and h[1] < r[1] and abs(l[1] - r[1]) / l[1] < 0.01:
            neckline_highs = [hg for hg in highs if l[0] < hg[0] < r[0]]
            if neckline_highs:
                neckline = sum(hg[1] for hg in neckline_highs) / len(neckline_highs)
                results.append({
                    "name": "inv_head_and_shoulders",
                    "type": "reversal",
                    "direction": "bullish",
                    "completion_pct": 80,
                    "target": float(neckline + (neckline - h[1])),
                    "description": f"Inv. H&S — neckline {neckline:.2f}, target {neckline + (neckline - h[1]):.2f}",
                })
    return results


def _detect_triangles(df: pd.DataFrame, highs: list, lows: list) -> list[dict]:
    results = []
    last_idx = len(df) - 1
    recent_highs = [h for h in highs if h[0] >= last_idx - 30]
    recent_lows = [l for l in lows if l[0] >= last_idx - 30]

    if len(recent_highs) < 2 or len(recent_lows) < 2:
        return []

    h_descending = recent_highs[-1][1] < recent_highs[0][1]
    l_ascending = recent_lows[-1][1] > recent_lows[0][1]
    h_flat = abs(recent_highs[-1][1] - recent_highs[0][1]) / recent_highs[0][1] < 0.003
    l_flat = abs(recent_lows[-1][1] - recent_lows[0][1]) / recent_lows[0][1] < 0.003

    if h_descending and l_ascending:
        results.append({"name": "symmetrical_triangle", "type": "continuation", "direction": "neutral",
                        "completion_pct": 70, "target": None,
                        "description": "Symmetrical triangle — coiling for a breakout, direction undecided"})
    elif h_flat and l_ascending:
        results.append({"name": "ascending_triangle", "type": "continuation", "direction": "bullish",
                        "completion_pct": 70, "target": None,
                        "description": "Ascending triangle — buyers pressing resistance, bullish bias"})
    elif h_descending and l_flat:
        results.append({"name": "descending_triangle", "type": "continuation", "direction": "bearish",
                        "completion_pct": 70, "target": None,
                        "description": "Descending triangle — sellers pressing support, bearish bias"})

    return results


def _detect_flags(df: pd.DataFrame) -> list[dict]:
    results = []
    if len(df) < 20:
        return []

    # Strong move (pole) followed by consolidation
    pole_window = 10
    flag_window = 8

    if len(df) < pole_window + flag_window:
        return []

    pole = df.tail(pole_window + flag_window).head(pole_window)
    flag = df.tail(flag_window)

    pole_move = (pole["close"].iloc[-1] - pole["close"].iloc[0]) / pole["close"].iloc[0]
    flag_range = (flag["high"].max() - flag["low"].min()) / flag["close"].iloc[0]
    flag_drift = (flag["close"].iloc[-1] - flag["close"].iloc[0]) / flag["close"].iloc[0]

    if abs(pole_move) > 0.005 and flag_range < abs(pole_move) * 0.5:
        if pole_move > 0 and -0.003 < flag_drift < 0.001:
            results.append({"name": "bull_flag", "type": "continuation", "direction": "bullish",
                            "completion_pct": 75, "target": None,
                            "description": "Bull flag — strong up move consolidating, expect continuation up"})
        elif pole_move < 0 and -0.001 < flag_drift < 0.003:
            results.append({"name": "bear_flag", "type": "continuation", "direction": "bearish",
                            "completion_pct": 75, "target": None,
                            "description": "Bear flag — strong down move consolidating, expect continuation down"})

    return results
