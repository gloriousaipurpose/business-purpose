import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import PainPointRun, SourcePerformance
from app.pipeline.pain_pipeline import run_pain_pipeline

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pain-radar", tags=["Pain Points Radar"])

# ── Schemas ───────────────────────────────────────────────────────────────────

class PainRadarRequest(BaseModel):
    niche: str = Field(..., description="Niche to analyse for acute customer and business pain, e.g. 'e-commerce', 'health-fitness'")
    niche_notes: Optional[str] = Field(None, description="Optional extra context (e.g. tier-2 cities, SMB focus, budget)")
    target_market: str = Field("India", description="Target market (default: India)")

class PainRadarRunSummary(BaseModel):
    id: int
    niche: str
    niche_notes: Optional[str]
    target_market: str
    status: str
    pain_points_count: int
    verified_count: int
    run_summary: str
    started_at: Optional[str]
    finished_at: Optional[str]

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("", response_model=Dict[str, Any])
async def start_pain_radar(
    req: PainRadarRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    run = PainPointRun(
        niche=req.niche.strip(),
        niche_notes=req.niche_notes,
        target_market=req.target_market or "India",
        status="running"
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    background_tasks.add_task(
        run_pain_pipeline,
        run_id=run.id,
        niche=run.niche,
        niche_notes=run.niche_notes or "",
        target_market=run.target_market
    )

    return {
        "run_id": run.id,
        "message": f"Pain Radar pipeline launched for niche '{run.niche}'.",
        "status": "running"
    }


@router.get("/{run_id}", response_model=Dict[str, Any])
def get_pain_run(run_id: int, db: Session = Depends(get_db)):
    run = db.query(PainPointRun).filter(PainPointRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Pain Radar run not found.")

    res = run.result_json or {}
    points = res.get("pain_points", [])
    verified_count = sum(1 for p in points if (p.get("verification") or "").lower() == "verified")

    return {
        "id": run.id,
        "niche": run.niche,
        "niche_notes": run.niche_notes,
        "target_market": run.target_market,
        "status": run.status,
        "strategist_plan": run.strategist_plan,
        "collected_items_count": len(run.collected_data or []),
        "result_json": run.result_json,
        "verified_count": verified_count,
        "error_text": run.error_text,
        "started_at": run.started_at.isoformat() if run.started_at else None,
        "finished_at": run.finished_at.isoformat() if run.finished_at else None,
    }


@router.get("", response_model=List[Dict[str, Any]])
def list_pain_runs(limit: int = 25, db: Session = Depends(get_db)):
    runs = db.query(PainPointRun).order_by(PainPointRun.started_at.desc()).limit(limit).all()
    out = []
    for r in runs:
        res = r.result_json or {}
        points = res.get("pain_points", [])
        verified = sum(1 for p in points if (p.get("verification") or "").lower() == "verified")
        out.append({
            "id": r.id,
            "niche": r.niche,
            "niche_notes": r.niche_notes,
            "target_market": r.target_market,
            "status": r.status,
            "pain_points_count": len(points),
            "verified_count": verified,
            "run_summary": res.get("run_summary", ""),
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "finished_at": r.finished_at.isoformat() if r.finished_at else None,
        })
    return out


@router.get("/sources/performance", response_model=List[Dict[str, Any]])
def get_sources_performance(db: Session = Depends(get_db)):
    records = db.query(SourcePerformance).order_by(SourcePerformance.useful_count.desc()).all()
    return [
        {
            "id": r.id,
            "source": r.source,
            "niche": r.niche,
            "items_collected": r.items_collected,
            "useful_count": r.useful_count,
            "noise_level": r.noise_level,
            "last_run_at": r.last_run_at.isoformat() if r.last_run_at else None,
        }
        for r in records
    ]
