import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import Base, engine
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Starting background APScheduler...")
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
