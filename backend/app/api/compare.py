from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Run, Finding, OpportunityScore, Entity
from app.schemas import CompareResponse

router = APIRouter(prefix="/compare", tags=["Compare"])

@router.get("", response_model=dict)
def compare_runs(
    run_ids: str = Query(..., description="Comma-separated list of run IDs, e.g. 1,2,3"),
    db: Session = Depends(get_db)
):
    try:
        parsed_ids = [int(x.strip()) for x in run_ids.split(",") if x.strip()]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid run_ids format. Provide comma-separated integers.")

    if len(parsed_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 run IDs are required for side-by-side comparison.")

    runs = db.query(Run).filter(Run.id.in_(parsed_ids)).order_by(Run.id.asc()).all()
    if len(runs) < 2:
        raise HTTPException(status_code=404, detail="One or more specified runs were not found.")

    # Structure data per run
    run_data = []
    all_entity_ids = set()

    for r in runs:
        findings = db.query(Finding).filter(Finding.run_id == r.id).all()
        scores = db.query(OpportunityScore).filter(OpportunityScore.run_id == r.id).all()
        
        ent_ids = {f.entity_id for f in findings if f.entity_id}
        all_entity_ids.update(ent_ids)

        scores_map = {sc.entity_id: sc.total for sc in scores}

        run_data.append({
            "run_id": r.id,
            "started_at": r.started_at,
            "run_type": r.run_type,
            "status": r.status,
            "findings_count": len(findings),
            "entity_ids": ent_ids,
            "scores_map": scores_map
        })

    first_run = run_data[0]
    last_run = run_data[-1]

    new_entities = []
    disappeared_entities = []
    more_important = []
    repeating = []

    for ent_id in all_entity_ids:
        ent = db.query(Entity).filter(Entity.id == ent_id).first()
        if not ent:
            continue

        in_first = ent_id in first_run["entity_ids"]
        in_last = ent_id in last_run["entity_ids"]
        
        first_score = first_run["scores_map"].get(ent_id, 0.0)
        last_score = last_run["scores_map"].get(ent_id, 0.0)

        ent_summary = {
            "entity_id": ent.id,
            "name": ent.canonical_name,
            "category": ent.category,
            "appearance_count": ent.appearance_count,
            "first_score": first_score,
            "last_score": last_score
        }

        if not in_first and in_last:
            new_entities.append(ent_summary)
        elif in_first and not in_last:
            disappeared_entities.append(ent_summary)
        elif in_first and in_last:
            if (last_score - first_score) >= 10.0:
                more_important.append(ent_summary)
            else:
                repeating.append(ent_summary)

    return {
        "run_ids": parsed_ids,
        "runs_meta": [
            {
                "id": r["run_id"],
                "started_at": r["started_at"],
                "run_type": r["run_type"],
                "status": r["status"],
                "findings_count": r["findings_count"]
            }
            for r in run_data
        ],
        "comparison": {
            "new": new_entities,
            "disappeared": disappeared_entities,
            "more_important": more_important,
            "repeating": repeating
        }
    }
