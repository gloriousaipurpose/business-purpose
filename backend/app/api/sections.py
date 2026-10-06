from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Finding, Run, Entity, OpportunityScore

router = APIRouter(prefix="/sections", tags=["Sections"])

@router.get("/{name}/latest", response_model=dict)
def get_latest_section_findings(name: str, db: Session = Depends(get_db)):
    # Find latest completed or partial run that analyzed this section
    latest_run = (
        db.query(Run)
        .filter(Run.status.in_(["completed", "partial"]))
        .order_by(Run.started_at.desc())
        .first()
    )

    if not latest_run:
        return {
            "section": name,
            "last_analyzed_at": None,
            "findings": [],
            "summary": "No completed runs found."
        }

    findings = (
        db.query(Finding)
        .filter(Finding.section == name)
        .order_by(Finding.created_at.desc())
        .limit(30)
        .all()
    )

    result_findings = []
    for f in findings:
        ent = db.query(Entity).filter(Entity.id == f.entity_id).first() if f.entity_id else None
        
        # Latest score for this entity
        latest_score = None
        if ent:
            sc = (
                db.query(OpportunityScore)
                .filter(OpportunityScore.entity_id == ent.id)
                .order_by(OpportunityScore.created_at.desc())
                .first()
            )
            if sc:
                latest_score = sc.total

        result_findings.append({
            "id": f.id,
            "run_id": f.run_id,
            "entity_id": f.entity_id,
            "entity_name": ent.canonical_name if ent else f.title,
            "section": f.section,
            "kind": f.kind,
            "title": f.title,
            "summary": f.summary,
            "evidence": f.evidence,
            "confidence": f.confidence,
            "score": latest_score,
            "source_count": f.source_count,
            "created_at": f.created_at
        })

    return {
        "section": name,
        "last_analyzed_at": latest_run.finished_at or latest_run.started_at,
        "findings": result_findings,
        "summary": latest_run.summary_text
    }
