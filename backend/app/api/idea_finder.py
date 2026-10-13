import json
import logging
import asyncio
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db import get_db, SessionLocal
from app.models import IdeaFinderRun
from app.llm.client import llm_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/idea-finder", tags=["Idea Finder"])

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class IdeaFinderRequest(BaseModel):
    niche: str = Field(..., description="Niche to analyse, e.g. 'e-commerce', 'sports', 'food'")
    niche_notes: Optional[str] = Field(None, description="Optional extra context about the niche")
    target_market: str = Field("India", description="Primary target market (default: India)")

class IdeaFinderRunResponse(BaseModel):
    id: int
    niche: str
    niche_notes: Optional[str]
    target_market: str
    status: str
    result_json: Optional[dict]
    error_text: Optional[str]
    started_at: str
    finished_at: Optional[str]

    class Config:
        from_attributes = True

# ── Pydantic schema for LLM output (permissive — store raw) ──────────────────

class _LLMIdeaOutput(BaseModel):
    niche: Optional[str] = None
    run_summary: Optional[str] = None
    findings: Optional[list] = None
    rejected_ideas: Optional[list] = None
    data_gaps: Optional[str] = None

# ── Prompt ────────────────────────────────────────────────────────────────────

def build_idea_prompt(niche: str, niche_notes: str, target_market: str) -> str:
    return f"""ROLE
You are a skeptical market analyst finding real, unserved gaps in existing
products and services. Your job is to find problems people already suffer
from and already try to solve badly, not to invent exciting concepts.
You are rewarded for rejecting weak ideas, not for producing many.

INPUTS
Niche: {niche}
Niche notes: {niche_notes or 'None provided'}
Target market: {target_market}   (default: India; also note if the gap is
  global-first and not yet served in India)
Collected data: Use your knowledge of publicly known pain points, complaints,
  workarounds (Excel, WhatsApp groups, manual processes), "I wish…" statements,
  Reddit/Twitter/forum discussions, startup failure post-mortems, and user reviews
  for this niche. Cite your source type as knowledge-base or web reference.
Previous run findings: None (first run)

HARD RULES
1. Every pain point and claim must cite a source type or reference. No source = do not include it.
2. Never invent statistics, user counts, prices, or competitors. If unknown, write "unknown".
3. A gap is NOT real if a mainstream product already solves it well for the target market.
4. Prefer fewer, stronger findings. If evidence is thin, say so and return less. Returning zero ideas is acceptable.
5. Write everything in plain, simple English — like explaining to a smart friend. No jargon.

STEPS
1. PAIN POINTS: Extract recurring complaints, frustrations, workarounds
   (Excel, WhatsApp groups, manual processes), and "I wish..." statements.
   For each: who has it, how often it appears, how intense (money lost,
   time lost, risk), and the quoted evidence with source type.
2. CLASSIFY each as one of: unmet need / bad existing solution /
   workaround in use / ignored segment (language, city tier, price, size) /
   new shift (tech, law, payments, behavior) / global solution missing locally.
3. COMPETITION: List existing solutions for each pain point. State what
   each does well, what users complain about, price, and who it ignores.
   Conclude: is the gap open, narrow, or closed?
4. GAP IDEAS: For pain points with an open or narrow gap, propose a specific
   product or service for a specific user group. Not generic ("an app for X").
5. RED TEAM each idea: Why might this fail? Can a big player copy it in
   weeks? Is the buyer different from the user? Will they pay (evidence of
   spending, not just complaining)? Is the market reachable without a big
   marketing budget? What is the cheapest manual test?
6. SCORE (0-10 each, with one-line justification):
   pain intensity, payment evidence, competition gap, reachability,
   defensibility, India fit, timing.
7. CONFIDENCE: low / medium / high, based only on evidence quantity and quality.
8. DEDUPE against previous run: label each finding NEW (all are NEW this run).

OUTPUT: valid JSON only, in this exact shape:
{{
  "niche": "{niche}",
  "run_summary": "2-3 plain English sentences summarising what you found",
  "findings": [{{
    "pain_point": "Plain English description of the real pain",
    "who_suffers": "Specific type of person or business that has this problem",
    "type": "unmet need | bad existing solution | workaround in use | ignored segment | new shift | global solution missing locally",
    "evidence": [{{"id": "source-type or reference", "quote": "Short quote or paraphrase"}}],
    "existing_solutions": [{{"name": "Product name", "strength": "What it does well", "weakness": "What users complain about"}}],
    "gap_status": "open|narrow|closed",
    "idea": "Specific product or service idea in one clear sentence",
    "target_user": "Who exactly would use this",
    "who_pays": "Who pays — is it the user, a business, or someone else?",
    "risks": ["Risk 1 in plain English", "Risk 2"],
    "cheapest_validation_test": "The cheapest way to test if people would pay for this",
    "scores": {{
      "pain_intensity": {{"score": 0, "reason": "one line"}},
      "payment_evidence": {{"score": 0, "reason": "one line"}},
      "competition_gap": {{"score": 0, "reason": "one line"}},
      "reachability": {{"score": 0, "reason": "one line"}},
      "defensibility": {{"score": 0, "reason": "one line"}},
      "india_fit": {{"score": 0, "reason": "one line"}},
      "timing": {{"score": 0, "reason": "one line"}}
    }},
    "total_score": 0,
    "confidence": "low|medium|high",
    "change_vs_previous": "NEW"
  }}],
  "rejected_ideas": [{{"idea": "Idea that was considered but rejected", "reason": "Why it was rejected in plain English"}}],
  "data_gaps": "What evidence is missing to be more certain about these findings"
}}
"""

# ── Background task ───────────────────────────────────────────────────────────

async def _run_idea_analysis(run_id: int, niche: str, niche_notes: str, target_market: str):
    db = SessionLocal()
    try:
        run = db.query(IdeaFinderRun).filter(IdeaFinderRun.id == run_id).first()
        if not run:
            return

        prompt = build_idea_prompt(niche, niche_notes or "", target_market)

        try:
            result, tokens, cost = await llm_client.generate_json(
                prompt=prompt,
                response_schema=_LLMIdeaOutput,
                system_prompt=(
                    "You are a skeptical market analyst. Return strictly valid JSON only. "
                    "Write in plain, simple English — no jargon. "
                    "Be honest about what you don't know."
                ),
                max_retries=4
            )
            # Calculate total scores
            findings = result.findings or []
            for f in findings:
                scores = f.get("scores", {}) if isinstance(f, dict) else {}
                total = sum(v.get("score", 0) if isinstance(v, dict) else 0 for v in scores.values())
                if isinstance(f, dict):
                    f["total_score"] = round(total, 1)

            run.result_json = {
                "niche": result.niche or niche,
                "run_summary": result.run_summary or "",
                "findings": findings,
                "rejected_ideas": result.rejected_ideas or [],
                "data_gaps": result.data_gaps or ""
            }
            run.status = "completed"
            logger.info(f"Idea finder run #{run_id} completed: {len(findings)} findings, {tokens} tokens, ${cost:.5f}")

        except Exception as e:
            logger.error(f"Idea finder run #{run_id} LLM error: {e}")
            run.status = "failed"
            run.error_text = str(e)

        run.finished_at = datetime.utcnow()
        db.commit()

    finally:
        db.close()

# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("", response_model=dict)
async def start_idea_finder(
    req: IdeaFinderRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    run = IdeaFinderRun(
        niche=req.niche.strip(),
        niche_notes=req.niche_notes,
        target_market=req.target_market or "India",
        status="running"
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    background_tasks.add_task(
        _run_idea_analysis,
        run_id=run.id,
        niche=run.niche,
        niche_notes=run.niche_notes or "",
        target_market=run.target_market
    )

    return {"run_id": run.id, "message": "Idea analysis started.", "status": "running"}


@router.get("/{run_id}", response_model=dict)
def get_idea_run(run_id: int, db: Session = Depends(get_db)):
    run = db.query(IdeaFinderRun).filter(IdeaFinderRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Idea finder run not found.")
    return {
        "id": run.id,
        "niche": run.niche,
        "niche_notes": run.niche_notes,
        "target_market": run.target_market,
        "status": run.status,
        "result_json": run.result_json,
        "error_text": run.error_text,
        "started_at": run.started_at.isoformat() if run.started_at else None,
        "finished_at": run.finished_at.isoformat() if run.finished_at else None,
    }


@router.get("", response_model=List[dict])
def list_idea_runs(limit: int = 20, db: Session = Depends(get_db)):
    runs = db.query(IdeaFinderRun).order_by(IdeaFinderRun.started_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "niche": r.niche,
            "niche_notes": r.niche_notes,
            "target_market": r.target_market,
            "status": r.status,
            "findings_count": len(r.result_json.get("findings", [])) if r.result_json else 0,
            "run_summary": r.result_json.get("run_summary", "") if r.result_json else "",
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "finished_at": r.finished_at.isoformat() if r.finished_at else None,
        }
        for r in runs
    ]
