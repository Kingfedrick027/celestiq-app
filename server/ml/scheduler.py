from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio
import logging

logger = logging.getLogger(__name__)
_scheduler = None


def _retrain_job():
    from ml.trainer import train_model
    from ml.predictor import reload_model
    logger.info("[ML Scheduler] Starting weekly retrain...")
    result = train_model(years=2)
    if result.get("success"):
        reload_model()
        logger.info(f"[ML Scheduler] Retrain complete. Accuracy: {result.get('accuracy')}")
    else:
        logger.warning(f"[ML Scheduler] Retrain failed: {result.get('error')}")


def start_scheduler():
    global _scheduler
    _scheduler = AsyncIOScheduler()
    # Every Sunday at midnight
    _scheduler.add_job(_retrain_job, CronTrigger(day_of_week="sun", hour=0, minute=0))
    _scheduler.start()
    logger.info("[ML Scheduler] Weekly retrain scheduled (Sunday midnight)")
    return _scheduler


def stop_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown()
