import logging
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import Base, engine, SessionLocal
from app.models import Run
from app.scheduler import start_scheduler
from app.api.runs import router as runs_router
from app.api.sections import router as sections_router
from app.api.opportunities import router as opportunities_router
from app.api.compare import router as compare_router
from app.api.notifications import router as notifications_router
from app.api.scheduler_api import router as scheduler_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("business_radar")

def cleanup_stuck_runs():
    db = SessionLocal()
    try:
        stuck_runs = db.query(Run).filter(Run.status == "running").all()
        if stuck_runs:
            logger.info(f"Cleaning up {len(stuck_runs)} stuck 'running' runs from previous server session...")
            for r in stuck_runs:
                r.status = "failed"
                r.summary_text = "Run interrupted by server restart."
                r.finished_at = datetime.utcnow()
            db.commit()
    except Exception as e:
        logger.error(f"Error cleaning stuck runs: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    logger.info("Cleaning up stuck runs from previous sessions...")
    cleanup_stuck_runs()

    logger.info("Starting background APScheduler (runs every 5 hours)...")
    start_scheduler()
    yield
    # Shutdown actions
    logger.info("Shutting down Business Radar FastAPI server...")

app = FastAPI(
    title="Business Opportunity Radar API",
    description="Continuously updating intelligence system identifying startups, booming products, pain points & India market gaps.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(runs_router)
app.include_router(sections_router)
app.include_router(opportunities_router)
app.include_router(compare_router)
app.include_router(notifications_router)
app.include_router(scheduler_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "Business Opportunity Radar Backend"}
