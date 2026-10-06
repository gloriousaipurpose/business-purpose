from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import OpportunityScore, Entity, Finding, Run
from app.schemas import OpportunityScoreResponse

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])

@router.get("", response_model=List[OpportunityScoreResponse])
def get_ranked_opportunities(
    limit: int = 50,
    min_score: float = 0.0,
    confidence: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns top ranked opportunities across entities based on their latest score."""
    # Subquery for latest score per entity
    subquery = (
        db.query(OpportunityScore.entity_id, OpportunityScore.id)
        .order_by(OpportunityScore.entity_id, OpportunityScore.created_at.desc())
        .distinct(OpportunityScore.entity_id)
        .subquery()
    )

    query = db.query(OpportunityScore).join(subquery, OpportunityScore.id == subquery.c.id)

    if min_score > 0:
        query = query.filter(OpportunityScore.total >= min_score)
    if confidence:
        query = query.filter(OpportunityScore.confidence == confidence)

    scores = query.order_by(OpportunityScore.total.desc()).limit(limit).all()

    result = []
    for sc in scores:
        ent = db.query(Entity).filter(Entity.id == sc.entity_id).first()
        res_item = OpportunityScoreResponse.model_validate(sc)
        if ent:
            res_item.entity_name = ent.canonical_name
            res_item.entity_category = ent.category
            res_item.entity_description = ent.description
        result.append(res_item)

    return result

@router.get("/{entity_id}", response_model=dict)
def get_opportunity_details(entity_id: int, db: Session = Depends(get_db)):
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found.")

    # Fetch score history across runs
    scores = (
        db.query(OpportunityScore)
        .filter(OpportunityScore.entity_id == entity_id)
        .order_by(OpportunityScore.created_at.asc())
        .all()
    )

    # Fetch all findings across runs
    findings = (
        db.query(Finding)
        .filter(Finding.entity_id == entity_id)
        .order_by(Finding.created_at.desc())
        .all()
    )

    latest_score = scores[-1] if scores else None

    # Score timeline for chart
    timeline = []
    for sc in scores:
        run = db.query(Run).filter(Run.id == sc.run_id).first()
        timeline.append({
            "run_id": sc.run_id,
            "date": sc.created_at.strftime("%b %d, %H:%M"),
            "score": sc.total,
            "demand_growth": sc.demand_growth,
            "proven_abroad": sc.proven_abroad,
            "india_gap": sc.india_gap,
            "ease_to_build": sc.ease_to_build,
            "revenue_potential": sc.revenue_potential,
            "timing": sc.timing,
            "run_type": run.run_type if run else "manual"
        })

    formatted_findings = [
        {
            "id": f.id,
            "run_id": f.run_id,
            "section": f.section,
            "title": f.title,
            "summary": f.summary,
            "evidence": f.evidence,
            "confidence": f.confidence,
            "created_at": f.created_at
        }
        for f in findings
    ]

    return {
        "entity": {
            "id": entity.id,
            "canonical_name": entity.canonical_name,
            "category": entity.category,
            "country": entity.country,
            "description": entity.description,
            "first_seen_run_id": entity.first_seen_run_id,
            "last_seen_run_id": entity.last_seen_run_id,
            "appearance_count": entity.appearance_count
        },
        "latest_score": OpportunityScoreResponse.model_validate(latest_score) if latest_score else None,
        "score_timeline": timeline,
        "findings": formatted_findings,
        "india_competitors": latest_score.india_competitors_found if latest_score else [],
        "risks": latest_score.risks if latest_score else []
    }
