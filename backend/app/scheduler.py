import logging
import asyncio
from datetime import datetime
from app.config import settings

try:
    from pytz import timezone
    tz_obj = timezone(settings.TIMEZONE)
except ImportError:
    try:
        from zoneinfo import ZoneInfo
        tz_obj = ZoneInfo(settings.TIMEZONE)
    except Exception:
        tz_obj = None

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.pipeline.runner import execute_run

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone=tz_obj) if tz_obj else AsyncIOScheduler()
run_lock = asyncio.Lock()

async def scheduled_automatic_run():
    """Background automatic run triggered every 5 hours."""
    if run_lock.locked():
        logger.warning("Automatic run skipped: pipeline execution is already in progress.")
        return

    async with run_lock:
        logger.info("Starting scheduled background automatic run...")
        db: Session = SessionLocal()
        try:
            await execute_run(db, sections=["all"], run_type="automatic")
        except Exception as e:
            logger.error(f"Scheduled run encountered an error: {e}")
        finally:
            db.close()

def start_scheduler():
    """Starts the APScheduler background job."""
    if not scheduler.running:
        scheduler.add_job(
            scheduled_automatic_run,
            trigger=IntervalTrigger(hours=settings.RUN_INTERVAL_HOURS),
            id="automatic_radar_run",
            name="Automatic 5-hour Business Radar Scan",
            replace_existing=True
        )
        scheduler.start()
        logger.info(f"APScheduler started with {settings.RUN_INTERVAL_HOURS}-hour interval trigger (Timezone: {settings.TIMEZONE}).")

def pause_scheduler():
    """Pauses background scheduled jobs."""
    job = scheduler.get_job("automatic_radar_run")
    if job:
        job.pause()
        return True
    return False

def resume_scheduler():
    """Resumes background scheduled jobs."""
    job = scheduler.get_job("automatic_radar_run")
    if job:
        job.resume()
        return True
    return False

def get_scheduler_info() -> dict:
    """Returns status and next run time of background scheduler."""
    job = scheduler.get_job("automatic_radar_run")
    next_time_str = None
    is_paused = False

    if job:
        is_paused = job.next_run_time is None
        if job.next_run_time:
            next_time_str = job.next_run_time.isoformat()

    return {
        "is_running": scheduler.running,
        "is_paused": is_paused,
        "next_run_time": next_time_str,
        "run_interval_hours": settings.RUN_INTERVAL_HOURS,
        "timezone": settings.TIMEZONE
    }
