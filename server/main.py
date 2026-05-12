import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from data_service import fetch_candles_all_timeframes, fetch_candles_yfinance
from analyzer import run_full_analysis
from ml.trainer import train_model, model_exists
from ml.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_active_connections: list[WebSocket] = []
_latest_analysis: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Train ML model if not exists
    if not model_exists():
        logger.info("No ML model found — training on historical data (this may take a few minutes)...")
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: train_model(years=3))
        logger.info(f"ML training result: {result}")
    else:
        logger.info("ML model already exists, skipping training")

    # Start background candle poller
    poller_task = asyncio.create_task(_candle_poller())

    # Start weekly retrain scheduler
    start_scheduler()

    yield

    poller_task.cancel()
    stop_scheduler()


app = FastAPI(title="Celestiq Trading Analyzer", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "model_trained": model_exists(), "timestamp": datetime.utcnow().isoformat()}


@app.get("/analyze")
async def analyze_now():
    loop = asyncio.get_event_loop()
    tf_data = await loop.run_in_executor(None, fetch_candles_all_timeframes)
    result = await loop.run_in_executor(None, lambda: run_full_analysis(tf_data))
    return JSONResponse(content=result)


@app.get("/candles/{timeframe}")
async def get_candles(timeframe: str, limit: int = 200):
    if timeframe not in ("5m", "15m", "1h", "4h"):
        return JSONResponse(status_code=400, content={"error": "Invalid timeframe"})
    loop = asyncio.get_event_loop()
    df = await loop.run_in_executor(None, lambda: fetch_candles_yfinance(timeframe, limit))
    if df.empty:
        return JSONResponse(status_code=503, content={"error": "No data"})
    df2 = df.reset_index()
    df2.columns = [str(c) for c in df2.columns]
    time_col = df2.columns[0]
    df2[time_col] = df2[time_col].astype(str)
    candles = df2.rename(columns={time_col: "time"}).to_dict(orient="records")
    return JSONResponse(content={"timeframe": timeframe, "candles": candles})


@app.post("/train")
async def trigger_training():
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, lambda: train_model(years=3))
    if result.get("success"):
        from ml.predictor import reload_model
        reload_model()
    return JSONResponse(content=result)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    _active_connections.append(websocket)
    logger.info(f"WebSocket connected. Total: {len(_active_connections)}")

    # Send current analysis immediately on connect
    if _latest_analysis:
        try:
            await websocket.send_text(json.dumps(_latest_analysis))
        except Exception:
            pass

    try:
        while True:
            # Keep connection alive; data is pushed by the poller
            await asyncio.sleep(30)
            await websocket.send_text(json.dumps({"type": "ping"}))
    except WebSocketDisconnect:
        _active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total: {len(_active_connections)}")
    except Exception:
        if websocket in _active_connections:
            _active_connections.remove(websocket)


async def _broadcast(data: dict):
    disconnected = []
    for ws in _active_connections:
        try:
            await ws.send_text(json.dumps(data))
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        if ws in _active_connections:
            _active_connections.remove(ws)


async def _candle_poller():
    """Poll for new candles every 60 seconds and push analysis to all connected clients."""
    while True:
        try:
            loop = asyncio.get_event_loop()
            tf_data = await loop.run_in_executor(None, fetch_candles_all_timeframes)
            result = await loop.run_in_executor(None, lambda: run_full_analysis(tf_data))
            result["type"] = "analysis"
            result["timestamp"] = datetime.utcnow().isoformat()

            # Include candle data for chart
            for tf, df in tf_data.items():
                if not df.empty:
                    candles = []
                    for ts, row in df.tail(300).iterrows():
                        candles.append({
                            "time": int(ts.timestamp()) if hasattr(ts, "timestamp") else str(ts),
                            "open": float(row["open"]),
                            "high": float(row["high"]),
                            "low": float(row["low"]),
                            "close": float(row["close"]),
                            "volume": float(row.get("volume", 0)),
                        })
                    result.setdefault("candles", {})[tf] = candles

            global _latest_analysis
            _latest_analysis = result

            if _active_connections:
                await _broadcast(result)
                logger.info(f"Pushed analysis to {len(_active_connections)} clients. Signal: {result.get('signal')}")

        except Exception as e:
            logger.error(f"Poller error: {e}", exc_info=True)

        await asyncio.sleep(60)
