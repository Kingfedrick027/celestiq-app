import os
import asyncio
import httpx
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

TWELVE_DATA_API_KEY = os.getenv("TWELVE_DATA_API_KEY", "")
SYMBOL = "XAU/USD"
YF_SYMBOL = "GC=F"  # Gold futures on Yahoo Finance

INTERVAL_MAP = {
    "5m": "5min",
    "15m": "15min",
    "1h": "1h",
    "4h": "4h",
}

YF_INTERVAL_MAP = {
    "5m": "5m",
    "15m": "15m",
    "1h": "1h",
    "4h": "1h",  # yfinance doesn't have 4h; we resample from 1h
}

YF_PERIOD_MAP = {
    "5m": "5d",
    "15m": "30d",
    "1h": "60d",
    "4h": "90d",
}


def _resample_to_4h(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.index = pd.to_datetime(df.index)
    resampled = df.resample("4h").agg({
        "Open": "first",
        "High": "max",
        "Low": "min",
        "Close": "last",
        "Volume": "sum",
    }).dropna()
    return resampled


def fetch_candles_yfinance(interval: str = "5m", limit: int = 200) -> pd.DataFrame:
    yf_interval = YF_INTERVAL_MAP[interval]
    period = YF_PERIOD_MAP[interval]

    ticker = yf.Ticker(YF_SYMBOL)
    df = ticker.history(period=period, interval=yf_interval)

    if df.empty:
        return pd.DataFrame()

    df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
    df.index = df.index.tz_localize(None) if df.index.tz else df.index

    if interval == "4h":
        df = _resample_to_4h(df)

    df = df.tail(limit)
    df.columns = [c.lower() for c in df.columns]
    return df


async def fetch_candles_twelve_data(interval: str = "5m", limit: int = 200) -> pd.DataFrame:
    if not TWELVE_DATA_API_KEY:
        return fetch_candles_yfinance(interval, limit)

    td_interval = INTERVAL_MAP[interval]
    url = "https://api.twelvedata.com/time_series"
    params = {
        "symbol": SYMBOL,
        "interval": td_interval,
        "outputsize": limit,
        "apikey": TWELVE_DATA_API_KEY,
        "format": "JSON",
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params)
            data = resp.json()

        if data.get("status") == "error" or "values" not in data:
            return fetch_candles_yfinance(interval, limit)

        records = data["values"]
        df = pd.DataFrame(records)
        df["datetime"] = pd.to_datetime(df["datetime"])
        df = df.set_index("datetime").sort_index()
        for col in ["open", "high", "low", "close", "volume"]:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        df = df[["open", "high", "low", "close", "volume"]].dropna()
        return df

    except Exception:
        return fetch_candles_yfinance(interval, limit)


def fetch_candles_all_timeframes() -> dict[str, pd.DataFrame]:
    result = {}
    for tf in ["5m", "15m", "1h", "4h"]:
        result[tf] = fetch_candles_yfinance(tf)
    return result


def fetch_historical_for_training(years: int = 5) -> pd.DataFrame:
    end = datetime.now()
    start = end - timedelta(days=365 * years)

    ticker = yf.Ticker(YF_SYMBOL)
    df = ticker.history(start=start.strftime("%Y-%m-%d"), end=end.strftime("%Y-%m-%d"), interval="1h")

    if df.empty:
        return pd.DataFrame()

    df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
    df.index = df.index.tz_localize(None) if df.index.tz else df.index
    df.columns = [c.lower() for c in df.columns]
    return df
