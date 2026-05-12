# Celestiq — XAUUSD Price Action Market Reader

Real-time gold (XAUUSD) trading app that reads the market like a professional price action trader.

## What it does

Every 60 seconds (every candle close), the system:
1. Fetches live XAUUSD candles across 5m, 15m, 1h, 4h
2. Runs rule-based price action analysis (market structure, candlestick patterns, chart patterns, S/R levels)
3. Runs LightGBM ML model (pre-trained on 3–5 years of XAUUSD data, auto-retrains weekly)
4. Generates a plain English market reading via Groq AI (Llama 3.3 70B)
5. Pushes a BUY / SELL / WAIT signal to the live chart

## Quick start

### 1. Get free API keys

| Service | URL | Notes |
|---|---|---|
| Groq | https://console.groq.com | Free, fast LLaMA — no credit card |
| Twelve Data | https://twelvedata.com | Optional — falls back to Yahoo Finance |

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env — add your GROQ_API_KEY (and optionally TWELVE_DATA_API_KEY)

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

On first start, the ML model trains automatically (~2–5 min on 3y of data). Progress shown in terminal.

### 3. Frontend

```bash
cd client
npm install
npm run dev
# Opens at http://localhost:5173
```

## Architecture

```
client/          React + Vite + TradingView Lightweight Charts + Tailwind
server/
  main.py        FastAPI app + WebSocket poller (pushes every 60s)
  data_service.py  Candle fetching (Twelve Data → yfinance fallback)
  analyzer.py    Orchestrates rule-based + ML + AI narrator
  ai_narrator.py Groq API → plain English market reading
  price_action/  Rule-based pattern detection modules
  ml/            LightGBM training, prediction, weekly scheduler
```

## Features

- Live XAUUSD candlestick chart with TradingView
- 5m / 15m / 1h / 4h multi-timeframe analysis
- Detects: Hammer, Pin Bar, Engulfing, Doji, Morning/Evening Star, Inside/Outside Bar, Double Top/Bottom, H&S, Triangles, Flags
- Support & Resistance level detection
- Volume confirmation
- LightGBM ML model scoring pattern reliability (trains on historical data, retrains every Sunday)
- Groq AI narration: explains WHY, not just what
- BUY / SELL / WAIT signal with ML confidence %
- WebSocket live push — no page refresh needed
