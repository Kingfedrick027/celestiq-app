import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = None


def _get_client() -> Groq | None:
    global _client
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return None
    if _client is None:
        _client = Groq(api_key=api_key)
    return _client


SYSTEM_PROMPT = """You are a seasoned price action trader with 20+ years of experience reading gold (XAUUSD).
You analyze raw market data like a professional — no fluff, no generic advice.
Your job is to tell the trader WHAT the market is doing RIGHT NOW and WHY, then give a clear recommendation.

Rules:
- Be direct and specific. Reference actual price levels, patterns, and timeframe context.
- Explain the reasoning behind your reading, not just the conclusion.
- Never say "in conclusion" or "to summarize". Just talk like a trader.
- Keep it under 120 words.
- End with ONE of: BUY / SELL / WAIT — and a one-sentence reason."""


def generate_market_reading(analysis: dict) -> dict:
    client = _get_client()

    tf_summary = _build_timeframe_summary(analysis)
    signal = analysis.get("signal", "WAIT")
    confluence = analysis.get("confluence_score", 0.0)
    ml = analysis.get("ml_prediction", {})
    ml_signal = ml.get("signal", "WAIT") if ml else "WAIT"
    ml_confidence = ml.get("confidence", 0.0) if ml else 0.0

    if client is None:
        return _fallback_reading(analysis, tf_summary, signal)

    prompt = f"""Current XAUUSD market analysis:

{tf_summary}

Rule-based signal: {signal} (confluence: {confluence:.0%})
ML model signal: {ml_signal} (confidence: {ml_confidence:.0%})

Give your market reading and recommendation."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=200,
        )
        text = response.choices[0].message.content.strip()
        final_signal = _extract_signal_from_text(text, signal)
        return {"reading": text, "signal": final_signal, "source": "groq"}
    except Exception as e:
        return _fallback_reading(analysis, tf_summary, signal)


def _build_timeframe_summary(analysis: dict) -> str:
    lines = []
    for tf in ["4h", "1h", "15m", "5m"]:
        tf_data = analysis.get("timeframes", {}).get(tf, {})
        if not tf_data or "error" in tf_data:
            continue

        trend = tf_data.get("trend", {}).get("trend", "ranging")
        strength = tf_data.get("trend", {}).get("strength", "")
        candle_pats = [p["name"] for p in tf_data.get("candlestick_patterns", [])]
        chart_pats = [p["name"] for p in tf_data.get("chart_patterns", [])]
        all_pats = candle_pats + chart_pats
        price = tf_data.get("current_price", 0)
        level_ctx = tf_data.get("level_context", {})
        at_level = level_ctx.get("at_level", False)
        nearest_res = level_ctx.get("nearest_resistance")
        nearest_sup = level_ctx.get("nearest_support")
        vol = tf_data.get("volume", {}).get("description", "")

        pat_str = f"Patterns: {', '.join(all_pats)}" if all_pats else "No notable patterns"
        level_str = ""
        if at_level:
            level_str = "Price AT a key level. "
        if nearest_res:
            level_str += f"Resistance: {nearest_res['price']:.2f}. "
        if nearest_sup:
            level_str += f"Support: {nearest_sup['price']:.2f}."

        lines.append(f"[{tf}] {trend.upper()} ({strength}) @ {price:.2f} | {pat_str} | {level_str} | {vol}")

    return "\n".join(lines) if lines else "No timeframe data available"


def _extract_signal_from_text(text: str, fallback: str) -> str:
    upper = text.upper()
    last_200 = upper[-200:]
    if "BUY" in last_200 and "SELL" not in last_200:
        return "BUY"
    elif "SELL" in last_200 and "BUY" not in last_200:
        return "SELL"
    elif "WAIT" in last_200:
        return "WAIT"
    return fallback


def _fallback_reading(analysis: dict, tf_summary: str, signal: str) -> dict:
    tf_readings = []
    for tf in ["4h", "1h", "15m", "5m"]:
        tf_data = analysis.get("timeframes", {}).get(tf, {})
        if not tf_data or "error" in tf_data:
            continue
        trend = tf_data.get("trend", {}).get("trend", "ranging")
        strength = tf_data.get("trend", {}).get("strength", "")
        pats = [p["description"] for p in tf_data.get("candlestick_patterns", [])[:2]]
        pat_str = f" — {pats[0]}" if pats else ""
        tf_readings.append(f"{tf}: {trend} ({strength}){pat_str}")

    reading = " | ".join(tf_readings) if tf_readings else "Insufficient data to read market."
    if not reading:
        reading = "Market structure unclear. Wait for a cleaner setup."

    signal_text = {
        "BUY": "BUY — bullish alignment across timeframes.",
        "SELL": "SELL — bearish alignment across timeframes.",
        "WAIT": "WAIT — no clear setup yet.",
    }.get(signal, "WAIT — no clear setup yet.")

    return {
        "reading": f"{reading}\n\n{signal_text}",
        "signal": signal,
        "source": "fallback",
    }
