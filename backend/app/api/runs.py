import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from app.db import get_db, SessionLocal
from app.models import Run, Finding, OpportunityScore, Entity
from app.schemas import RunCreateRequest, RunResponse, RunStatusResponse, FindingResponse, OpportunityScoreResponse
from app.pipeline.runner import execute_run
from app.scheduler import run_lock

router = APIRouter(prefix="/runs", tags=["Runs"])

async def background_run_task(run_id: int, sections: List[str], topic: Optional[str]):
    async with run_lock:
        db = SessionLocal()
        try:
            await execute_run(db, sections=sections, run_type="manual", topic=topic, existing_run_id=run_id)
        finally:
            db.close()

@router.post("", response_model=dict)
async def start_manual_run(
    req: RunCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if run_lock.locked():
        raise HTTPException(status_code=409, detail="A pipeline analysis run is already in progress.")

    # Create initial run record with status running
    sections = req.sections
    run = Run(
        run_type="manual",
        sections=sections,
        status="running",
        sources_checked=[]
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Trigger async pipeline task with existing run_id
    background_tasks.add_task(background_run_task, run_id=run.id, sections=sections, topic=req.topic)
    
    return {"run_id": run.id, "message": "Manual run launched successfully.", "status": "running"}

@router.get("", response_model=List[RunResponse])
def get_runs(
    run_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Run)
    if run_type:
        query = query.filter(Run.run_type == run_type)
    if status:
        query = query.filter(Run.status == status)

    runs = query.order_by(Run.started_at.desc()).limit(limit).all()
    return runs

@router.get("/{run_id}", response_model=dict)
def get_run_details(run_id: int, db: Session = Depends(get_db)):
    run = db.query(Run).filter(Run.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    findings = db.query(Finding).filter(Finding.run_id == run_id).all()
    scores = db.query(OpportunityScore).filter(OpportunityScore.run_id == run_id).all()

    # Format detailed findings
    formatted_findings = []
    for f in findings:
        ent = db.query(Entity).filter(Entity.id == f.entity_id).first() if f.entity_id else None
        formatted_findings.append({
            "id": f.id,
            "run_id": f.run_id,
            "entity_id": f.entity_id,
            "entity_name": ent.canonical_name if ent else None,
            "section": f.section,
            "kind": f.kind,
            "title": f.title,
            "summary": f.summary,
            "evidence": f.evidence,
            "confidence": f.confidence,
            "source_count": f.source_count,
            "created_at": f.created_at
        })

    formatted_scores = []
    for sc in scores:
        ent = db.query(Entity).filter(Entity.id == sc.entity_id).first()
        formatted_scores.append({
            "id": sc.id,
            "run_id": sc.run_id,
            "entity_id": sc.entity_id,
            "entity_name": ent.canonical_name if ent else None,
            "total": sc.total,
            "demand_growth": sc.demand_growth,
            "proven_abroad": sc.proven_abroad,
            "india_gap": sc.india_gap,
            "ease_to_build": sc.ease_to_build,
            "revenue_potential": sc.revenue_potential,
            "timing": sc.timing,
            "confidence": sc.confidence,
            "subscore_justifications": sc.subscore_justifications,
            "risks": sc.risks,
            "india_competitors_found": sc.india_competitors_found,
            "search_notes": sc.search_notes,
            "created_at": sc.created_at
        })

    return {
        "run": RunResponse.model_validate(run),
        "findings": formatted_findings,
        "scores": formatted_scores
    }

@router.get("/{run_id}/status", response_model=RunStatusResponse)
def get_run_status(run_id: int, db: Session = Depends(get_db)):
    run = db.query(Run).filter(Run.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    findings_count = db.query(Finding).filter(Finding.run_id == run_id).count()

    # Estimate progress percentage
    progress = 100
    if run.status == "running":
        if not run.sources_checked:
            progress = 25
        elif findings_count == 0:
            progress = 60
        else:
            progress = 85

    return RunStatusResponse(
        id=run.id,
        status=run.status,
        started_at=run.started_at,
        finished_at=run.finished_at,
        sources_checked=run.sources_checked or [],
        findings_count=findings_count,
        progress_percentage=progress
    )
