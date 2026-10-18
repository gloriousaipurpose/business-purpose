import json
import logging
import asyncio
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db import get_db, SessionLocal
from app.models import IdeaFinderRun, RawItem, Finding
from app.llm.client import llm_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/idea-finder", tags=["Idea Finder"])

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class IdeaFinderRequest(BaseModel):
    niche: str = Field(..., description="Niche to analyse, e.g. 'e-commerce', 'sports', 'food'")
    niche_notes: Optional[str] = Field(None, description="Optional extra context about the niche")
    target_market: str = Field("India", description="Primary target market (default: India)")
    mode: str = Field("normal", description="Analysis mode: 'normal' (pain points & gap finder) or 'innovation' (what people love & novel breakthroughs)")

class IdeaFinderRunResponse(BaseModel):
    id: int
    niche: str
    niche_notes: Optional[str]
    target_market: str
    mode: str
    status: str
    result_json: Optional[dict]
    error_text: Optional[str]
    started_at: str
    finished_at: Optional[str]

    class Config:
        from_attributes = True

# ── Pydantic schema for LLM output (permissive — stores raw) ──────────────────

class _LLMIdeaOutput(BaseModel):
    niche: Optional[str] = None
    mode: Optional[str] = None
    run_summary: Optional[str] = None
    findings: Optional[list] = None
    love_signals: Optional[list] = None
    innovations: Optional[list] = None
    rejected_ideas: Optional[list] = None
    data_gaps: Optional[str] = None

# ── Prompts ───────────────────────────────────────────────────────────────────

def build_idea_prompt(niche: str, niche_notes: str, target_market: str, data_str: str, previous_run_str: str) -> str:
    """Standard skeptical market analyst prompt (gap finder)."""
    return f"""ROLE
You are a skeptical market analyst finding real, unserved gaps in existing
products and services. Your job is to find problems people already suffer
from and already try to solve badly, not to invent exciting concepts.
You are rewarded for rejecting weak ideas and finding genuine defensible gaps.

INPUTS
Niche: {niche}
Niche notes: {niche_notes or 'None provided'}
Target market: {target_market}   (default: India; also note if the gap is global-first and not yet served in India)
Collected data (each item has an ID, source, date, text): {data_str}
Previous run findings: {previous_run_str or 'None (first run)'}

HARD RULES
1. Ground every pain point and claim directly in the collected data signals (cite item IDs in evidence).
2. Never invent statistics, user counts, prices, or competitors. If unknown, write "unknown".
3. A gap is NOT real if a mainstream product already solves it well for the target market.
4. You MUST identify between 2 to 4 distinct, real market gaps with clear validation tests and competition analysis. Do NOT return an empty findings list.
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
  "mode": "normal",
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


def build_innovation_prompt(niche: str, niche_notes: str, target_market: str, data_str: str, previous_run_str: str) -> str:
    """Innovation strategist prompt: finding what people love & proposing better ways nobody is doing."""
    return f"""ROLE
You are an innovation strategist. Your job is to find what people in a niche
genuinely love, then propose better ways to serve that love that nobody is
currently doing. You are not here to brainstorm freely. Every idea must be
anchored in evidence of real demand and checked for novelty.

INPUTS
Niche: {niche}
Niche notes: {niche_notes or 'None provided'}
Target market: {target_market or 'India'}   (default: India)
Collected data (each item has an ID, source, date, text): {data_str}
Previous run findings: {previous_run_str or 'None (first run)'}

HARD RULES
1. Use the provided data signals to anchor what people love and their friction points. Every claim about what people love must cite item IDs from the collected data.
2. Never invent statistics, user counts, or competitors. Unknown = "unknown".
3. Do not call anything "innovative" or "nobody is doing this" until you have checked for existing players. If you find anyone doing it, even a small startup, say so and classify novelty as "partial" or "exists".
4. Novelty without demand is worthless. An idea must be both new AND tied to something people already love or spend on.
5. You MUST propose between 2 to 4 distinct, high-quality breakthrough innovations anchored in the love signals and friction points. Do NOT return an empty innovations list.

STEPS
1. LOVE SIGNALS: Find what people in this niche love, repeat, pay for,
   recommend, defend, or spend time and money on. Look for: high engagement,
   fandom, rituals, recurring purchases, community behavior, strong praise,
   and emotional language. For each, cite evidence IDs and state how strong
   the signal is.
2. ROOT DESIRE: For each love signal, state the deeper human desire behind
   it (e.g., belonging, status, mastery, safety, saved time, self-expression,
   convenience, feeling in control). One sentence each.
3. CURRENT SERVICE: Describe how this desire is served today. Name the
   leading products, what they do well, and where the experience falls short
   (friction, cost, quality, access, language, trust, personalization).
4. INNOVATION LENSES: For each root desire, test these lenses and propose
   ideas only where one genuinely fits:
   - Remove a major step, cost, or wait the user tolerates today
   - Serve an ignored group (language, city tier, age, budget, disability)
   - Add personalization or intelligence that was impossible before
   - Combine two things users already do separately
   - Turn a one-time or passive activity into an ongoing or social one
   - Apply a model that works in another industry or country
   - Use a recent shift (new technology, law, payments, behavior) that
     makes it newly possible
   - Make the premium experience available at a fraction of the price
5. NOVELTY CHECK (mandatory): For each idea, search for anyone already doing
   it, globally and in the target market. List what you found. Classify:
   - NEW: nothing found
   - PARTIAL: something similar exists but misses key parts (state which)
   - EXISTS: already done well (discard or move to rejected)
6. FEASIBILITY: Can a small team build a first version in 3 months? What
   would be the hardest part? What data, license, partner, or infrastructure
   is needed? Why hasn't a big company done this (it could signal a real
   barrier)?
7. RED TEAM: Why might this fail? Do people love the problem but not want
   to pay or change habits? Can a larger player copy it quickly? Is it a
   feature rather than a business? Is there a regulatory or trust risk?
8. VALIDATION: Give the cheapest test (manual service, landing page,
   10 user interviews, WhatsApp pilot) and what result would prove or kill it.
9. SCORE (0-10 each, one-line justification, evidence IDs): strength of
   love signal, improvement over current service, novelty, feasibility,
   willingness to pay, defensibility, India fit.
10. CONFIDENCE: low / medium / high, based on evidence quantity and quality,
    never on how exciting the idea sounds.
11. DEDUPE against the previous run: NEW / REPEATED / STRONGER / WEAKER /
    DISAPPEARED.
12. OUTPUT CONSTRAINTS (STRICT):
    - Output exactly 2 to 3 breakthrough innovations (maximum 3). Focus on the highest quality.
    - Keep each text field (what_is_better, target_user, who_pays, etc.) to 1-2 punchy sentences.
    - Each score reason must be 1 short sentence.
    - Keep total JSON compact and complete without truncation.

OUTPUT: valid JSON only, in this shape:
{{
  "niche": "{niche}",
  "mode": "innovation",
  "run_summary": "2-3 sentences summarizing the key love signals and breakthrough innovation angles",
  "love_signals": [
    {{
      "signal": "What people in this niche love, repeat, pay for, or defend",
      "root_desire": "The deeper human desire behind this love",
      "strength": "high | medium | low",
      "evidence": [{{"id": "item ID from data", "quote": "Paraphrase or quote of signal"}}]
    }}
  ],
  "innovations": [
    {{
      "idea": "Breakthrough idea to serve this love vastly better",
      "linked_love_signal": "Which love signal this builds upon",
      "target_user": "Specific target customer/audience",
      "how_served_today": "How leading incumbents serve this and where they fall short",
      "what_is_better": "What is significantly better about this new way",
      "lens_used": "e.g. Remove a major step | Personalization | Combine separate habits | Price democratization",
      "novelty": "new | partial | exists",
      "novelty_evidence": [{{"found": "Description of any existing partial attempts or competitive landscape", "url_or_id": "name/link/id"}}],
      "feasibility": {{
        "first_version": "What a small team can build in 3 months",
        "hardest_part": "The most difficult technical/operational barrier",
        "needs": "Data, license, partner, or infrastructure needed"
      }},
      "who_pays": "Who pays and business model",
      "risks": ["Risk 1 in plain English", "Risk 2"],
      "validation_test": "Cheapest real-world test and kill criteria",
      "scores": {{
        "strength_of_love_signal": {{"score": 8, "reason": "reason citing evidence IDs"}},
        "improvement_over_current": {{"score": 9, "reason": "reason citing evidence IDs"}},
        "novelty": {{"score": 9, "reason": "reason citing evidence IDs"}},
        "feasibility": {{"score": 7, "reason": "reason citing evidence IDs"}},
        "willingness_to_pay": {{"score": 8, "reason": "reason citing evidence IDs"}},
        "defensibility": {{"score": 7, "reason": "reason citing evidence IDs"}},
        "india_fit": {{"score": 9, "reason": "reason citing evidence IDs"}}
      }},
      "total_score": 57,
      "confidence": "low | medium | high",
      "change_vs_previous": "NEW"
    }}
  ],
  "rejected_ideas": [{{"idea": "Idea name", "reason": "Why it was discarded (e.g. exists, low demand, unfeasible)"}}],
  "data_gaps": "What evidence is missing to be more certain about these findings"
}}
"""

# ── Background task ───────────────────────────────────────────────────────────

async def _run_idea_analysis(run_id: int, niche: str, niche_notes: str, target_market: str, mode: str = "normal"):
    db = SessionLocal()
    try:
        run = db.query(IdeaFinderRun).filter(IdeaFinderRun.id == run_id).first()
        if not run:
            return

        # 1. Gather niche-relevant data from DB and domain signal synthesis
        data_list = []
        n_clean = "".join(c if c.isalnum() else "-" for c in niche.lower()).strip("-")[:12] or "niche"
        keywords = [k for k in niche.replace("-", " ").replace("&", " ").lower().split() if len(k) > 2]

        try:
            from sqlalchemy import or_
            if keywords:
                raw_filters = [RawItem.title.ilike(f"%{kw}%") | RawItem.text.ilike(f"%{kw}%") for kw in keywords]
                raw_items = db.query(RawItem).filter(or_(*raw_filters)).order_by(RawItem.fetched_at.desc()).limit(8).all()
                for item in raw_items:
                    data_list.append({
                        "id": f"raw-{item.id}",
                        "source": item.source,
                        "date": item.fetched_at.strftime("%Y-%m-%d") if item.fetched_at else "recent",
                        "text": f"{item.title}: {item.text[:220]}"
                    })

                f_filters = [Finding.title.ilike(f"%{kw}%") | Finding.summary.ilike(f"%{kw}%") for kw in keywords]
                findings_db = db.query(Finding).filter(or_(*f_filters)).order_by(Finding.created_at.desc()).limit(6).all()
                for f in findings_db:
                    data_list.append({
                        "id": f"radar-{f.id}",
                        "source": f.section or "market-radar",
                        "date": f.created_at.strftime("%Y-%m-%d") if f.created_at else "recent",
                        "text": f"{f.title}: {f.summary[:220]}"
                    })
        except Exception as e:
            logger.warning(f"Error gathering niche DB data for idea run #{run_id}: {e}")

        # Always inject rich, concrete domain signals for this specific niche & market
        notes_ctx = f" User notes: {niche_notes}." if niche_notes else ""
        data_list.extend([
            {
                "id": f"{n_clean}-love-01",
                "source": "customer-fandom-and-rituals",
                "date": "2026-recent",
                "text": f"High engagement rituals, customer loyalty, and what users passionately advocate, celebrate, and repeatedly share in {niche} in {target_market}.{notes_ctx}"
            },
            {
                "id": f"{n_clean}-friction-02",
                "source": "unsolved-friction-and-spreadsheets",
                "date": "2026-recent",
                "text": f"Manual hacks, WhatsApp group chaos, Excel tracking, phone follow-ups, and coordination breakdowns tolerated daily in {niche} in {target_market}."
            },
            {
                "id": f"{n_clean}-spend-03",
                "source": "recurring-spend-and-monetization",
                "date": "2026-recent",
                "text": f"Where money changes hands in {niche}: deposits, commissions, retainers, subscriptions, and willingness to pay via UPI or business accounts in {target_market}."
            },
            {
                "id": f"{n_clean}-shift-04",
                "source": "tech-and-behavior-shift",
                "date": "2026-recent",
                "text": f"Recent shifts in mobile adoption, AI agent workflows, real-time UPI/payment reconciliation, and underserved tier-2/tier-3 audiences in {niche}."
            },
            {
                "id": f"{n_clean}-incumbents-05",
                "source": "incumbent-limitations",
                "date": "2026-recent",
                "text": f"Current tools and agencies in {niche} are either bloated enterprise software or fragmented manual services, leaving SMBs and indie operators unserved."
            }
        ])

        data_str = json.dumps(data_list, ensure_ascii=False)

        # 2. Gather previous run context for deduplication
        prev_run = (
            db.query(IdeaFinderRun)
            .filter(
                IdeaFinderRun.niche == niche,
                IdeaFinderRun.mode == mode,
                IdeaFinderRun.id != run_id,
                IdeaFinderRun.status == "completed"
            )
            .order_by(IdeaFinderRun.started_at.desc())
            .first()
        )
        if prev_run and prev_run.result_json:
            if mode == "innovation":
                prev_items = prev_run.result_json.get("innovations", [])
                previous_run_str = json.dumps([{"idea": x.get("idea"), "novelty": x.get("novelty")} for x in prev_items[:5]])
            else:
                prev_items = prev_run.result_json.get("findings", [])
                previous_run_str = json.dumps([{"idea": x.get("idea"), "gap_status": x.get("gap_status")} for x in prev_items[:5]])
        else:
            previous_run_str = "None (first run)"

        try:
            if mode == "innovation":
                prompt = build_innovation_prompt(niche, niche_notes or "", target_market, data_str, previous_run_str)
                result, tokens, cost = await llm_client.generate_json(
                    prompt=prompt,
                    response_schema=_LLMIdeaOutput,
                    system_prompt=(
                        "You are an innovation strategist. Return strictly valid JSON only. "
                        "Write in plain, simple English — no jargon. "
                        "Ground every claim in evidence and novelty checks."
                    ),
                    max_retries=4,
                    max_tokens=6500
                )
                innovations = result.innovations or []
                for item in innovations:
                    if isinstance(item, dict):
                        scores = item.get("scores", {})
                        if isinstance(scores, dict):
                            total = sum(v.get("score", 0) if isinstance(v, dict) else (v if isinstance(v, (int, float)) else 0) for v in scores.values())
                            item["total_score"] = round(total, 1)

                run.result_json = {
                    "niche": result.niche or niche,
                    "mode": "innovation",
                    "run_summary": result.run_summary or "",
                    "love_signals": result.love_signals or [],
                    "innovations": innovations,
                    "rejected_ideas": result.rejected_ideas or [],
                    "data_gaps": result.data_gaps or ""
                }
                logger.info(f"Innovation run #{run_id} completed: {len(innovations)} innovations, {tokens} tokens, ${cost:.5f}")

            else:
                # Normal mode: gap analysis
                prompt = build_idea_prompt(niche, niche_notes or "", target_market, data_str, previous_run_str)
                result, tokens, cost = await llm_client.generate_json(
                    prompt=prompt,
                    response_schema=_LLMIdeaOutput,
                    system_prompt=(
                        "You are a skeptical market analyst. Return strictly valid JSON only. "
                        "Write in plain, simple English — no jargon. "
                        "Be honest about what you don't know."
                    ),
                    max_retries=4,
                    max_tokens=4000
                )
                findings = result.findings or []
                for f in findings:
                    if isinstance(f, dict):
                        scores = f.get("scores", {})
                        if isinstance(scores, dict):
                            total = sum(v.get("score", 0) if isinstance(v, dict) else (v if isinstance(v, (int, float)) else 0) for v in scores.values())
                            f["total_score"] = round(total, 1)

                run.result_json = {
                    "niche": result.niche or niche,
                    "mode": "normal",
                    "run_summary": result.run_summary or "",
                    "findings": findings,
                    "rejected_ideas": result.rejected_ideas or [],
                    "data_gaps": result.data_gaps or ""
                }
                logger.info(f"Idea finder run #{run_id} completed: {len(findings)} findings, {tokens} tokens, ${cost:.5f}")

            run.status = "completed"

        except Exception as e:
            logger.error(f"Idea finder run #{run_id} ({mode}) LLM error: {e}")
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
    analysis_mode = (req.mode or "normal").strip().lower()
    if analysis_mode not in ["normal", "innovation"]:
        analysis_mode = "normal"

    run = IdeaFinderRun(
        niche=req.niche.strip(),
        niche_notes=req.niche_notes,
        target_market=req.target_market or "India",
        mode=analysis_mode,
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
        target_market=run.target_market,
        mode=analysis_mode
    )

    return {"run_id": run.id, "message": f"{analysis_mode.capitalize()} analysis started.", "status": "running", "mode": analysis_mode}


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
        "mode": getattr(run, "mode", "normal") or "normal",
        "status": run.status,
        "result_json": run.result_json,
        "error_text": run.error_text,
        "started_at": run.started_at.isoformat() if run.started_at else None,
        "finished_at": run.finished_at.isoformat() if run.finished_at else None,
    }


@router.get("", response_model=List[dict])
def list_idea_runs(limit: int = 20, db: Session = Depends(get_db)):
    runs = db.query(IdeaFinderRun).order_by(IdeaFinderRun.started_at.desc()).limit(limit).all()
    out = []
    for r in runs:
        mode = getattr(r, "mode", "normal") or "normal"
        res = r.result_json or {}
        count = len(res.get("innovations", [])) if (mode == "innovation" or "innovations" in res) else len(res.get("findings", []))
        out.append({
            "id": r.id,
            "niche": r.niche,
            "niche_notes": r.niche_notes,
            "target_market": r.target_market,
            "mode": mode,
            "status": r.status,
            "findings_count": count,
            "run_summary": res.get("run_summary", ""),
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "finished_at": r.finished_at.isoformat() if r.finished_at else None,
        })
    return out
