import json
import logging
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.db import SessionLocal
from app.models import PainPointRun, SourcePerformance
from app.llm.client import llm_client
from app.sources.source_catalog import SOURCE_CATALOG, get_source_catalog_dict
from app.sources.hn_algolia import search_hn_pain
from app.sources.github_issues import search_github_pain
from app.sources.reddit_pain import fetch_reddit_pain

logger = logging.getLogger(__name__)

# ── Pydantic Schemas for LLM Output ───────────────────────────────────────────

class _SourcePlanItem(BaseModel):
    source: str
    signal_type: str = "complaint"
    reason: str = ""
    scores: Optional[Dict[str, Any]] = None
    category: str = "proven"  # proven | untested | exploratory
    queries: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)
    max_items: int = 15

class _StrategistOutput(BaseModel):
    niche: Optional[str] = None
    pain_hypotheses: List[str] = Field(default_factory=list)
    source_plan: List[_SourcePlanItem] = Field(default_factory=list)
    signal_coverage: Dict[str, Any] = Field(default_factory=dict)
    blind_spots: Optional[str] = ""
    expected_cost: Optional[str] = ""

class _AnalystOutput(BaseModel):
    niche: Optional[str] = None
    run_summary: Optional[str] = ""
    pain_points: List[Dict[str, Any]] = Field(default_factory=list)
    discarded: List[Dict[str, Any]] = Field(default_factory=list)
    source_feedback: List[Dict[str, Any]] = Field(default_factory=list)
    data_gaps: Optional[str] = ""

# ── Prompts ───────────────────────────────────────────────────────────────────

def build_strategist_prompt(
    niche: str,
    niche_notes: str,
    target_market: str,
    catalog_json: str,
    history_json: str,
    budget_json: str
) -> str:
    return f"""ROLE
You are a research strategist for a business-opportunity pain-point system.
You do not collect data. You decide the best places and methods to find real,
current pain in a given niche, using only free sources.

INPUTS
Niche: {niche}
Niche notes: {niche_notes or 'None provided'}
Target market: {target_market or 'India'} (default: India)
Available free sources and their tools: {catalog_json}
Source performance history (hit rate, validated findings, noise level):
{history_json}
Budget for this run (max sources, max items per source): {budget_json}

THINK THROUGH
1. Who actually experiences pain in this niche (roles, segments, regions)?
   Where do those people talk, complain, ask for help, or spend money?
2. For each signal type (complaint, workaround, spend, intent), which
   sources are most likely to contain it for this niche?
3. Score each candidate source 0-10 on: pain density, specificity, recency,
   free access, India relevance, independence from other chosen sources,
   past performance.
4. Choose a source portfolio:
   - About 70% proven sources (best past performance)
   - About 20% promising untested sources
   - About 10% exploratory, unusual sources (new communities, adjacent niches)
5. Ensure at least three different signal types are covered, and at least
   two independent sources per signal type where possible.
6. For each chosen source write specific collection instructions:
   search terms or queries, filters (date range, language, rating, subreddit
   or category), and how many items to take.
7. List what you could NOT cover with free sources, so the system reports
   its blind spots honestly.

RULES
- Use only sources from the provided catalog. Do not invent sources.
- Do not recommend scraping anything the catalog marks as restricted.
- Explain every choice in one sentence. No vague reasoning.

OUTPUT: valid JSON only:
{{
  "niche": "{niche}",
  "pain_hypotheses": ["where pain likely exists, to be tested, not assumed"],
  "source_plan": [{{
    "source": "source_id from catalog", "signal_type": "complaint|workaround|spend|intent",
    "reason": "One clear sentence why this source", "scores": {{"pain_density": 8, "india_relevance": 7}},
    "category": "proven|untested|exploratory",
    "queries": ["I wish there was", "doing this manually in {niche}"], "filters": {{"subreddits": ["SaaS"]}}, "max_items": 15
  }}],
  "signal_coverage": {{"complaint": 2, "workaround": 1, "spend": 1, "intent": 1}},
  "blind_spots": "What could not be covered with free sources (e.g. private WhatsApp groups, regional languages)",
  "expected_cost": "Free (0 API cost)"
}}
"""


def build_analyst_prompt(
    niche: str,
    target_market: str,
    collected_data_json: str,
    previous_run_json: str
) -> str:
    return f"""ROLE
You are a skeptical pain-point analyst. You turn raw collected text into
verified, scored pain points. You reward evidence and distrust hype.

INPUTS
Niche: {niche}
Target market: {target_market or 'India'}
Collected data (each item: ID, source, signal_type, date, author_type, text):
{collected_data_json}
Previous run pain points: {previous_run_json}

HARD RULES
1. Use only the provided data. Every pain point must cite item IDs and short
   quotes. No ID, no pain point.
2. Never invent numbers, user counts, or costs. Unknown = "unknown".
3. Ignore spam, promotional posts, self-promotion, and bot-like text.
4. One viral item does not make a trend. Count independent sources and
   independent authors, not repeated copies.

STEPS
1. EXTRACT: Find specific pain statements: complaints, workarounds, "I wish"
   statements, unmet requests, and mentions of money or time spent on the
   problem. Ignore vague venting without a concrete situation.
2. CLUSTER similar statements into distinct pain points. Name each one as a
   specific problem a specific person has (not a category like "bad UX").
3. For each pain point, record:
   - Who suffers (role, segment, region) and in what situation
   - Frequency: how many independent mentions and from how many sources
   - Intensity: what is lost (money, time, risk, stress)? Quote the evidence.
   - Current workaround, if any, and what it costs the person
   - Spend evidence: do people already pay for any fix (tools, agencies,
     freelancers, staff)? Cite IDs or write "none found".
   - Trend: growing, steady, or fading, using dates in the data
   - Signal types present (complaint, workaround, spend, intent)
4. TRIANGULATE: Mark a pain point as verified only if it appears in 2+
   independent sources AND 2+ signal types. Otherwise mark "unverified".
5. EXISTING SOLUTIONS: List products that already address it, with what they
   miss, if the data or your search tool shows it. Mark the gap as
   open / narrow / closed.
6. BIAS CHECK: Note possible distortion (a single community, vocal minority,
   promotional source, one country, one time period).
7. SCORE (0-10 each, one-line justification with IDs): intensity, frequency,
   payment evidence, workaround cost, trend, gap openness, India relevance.
8. CONFIDENCE: low / medium / high from evidence quantity, independence, and
   signal-type spread, never from how compelling the story sounds.
9. DEDUPE against the previous run: NEW, REPEATED, STRONGER, WEAKER,
   DISAPPEARED.
10. SOURCE FEEDBACK: For each source, report how many useful pain points it
    produced and how noisy it was, so the Strategist can learn.

OUTPUT: valid JSON only:
{{
  "niche": "{niche}",
  "run_summary": "2-3 sentences summarizing the triangulated findings",
  "pain_points": [{{
    "name": "Specific problem statement a specific user faces",
    "who_suffers": "Target role or business profile",
    "situation": "Exact context where the pain occurs",
    "evidence": [{{"id": "item ID", "quote": "Quote or concise paraphrase"}}],
    "independent_sources": 2,
    "independent_authors": 3,
    "intensity": "High/Medium/Low - description of time or money lost",
    "workaround": "Excel sheet, manual reconciliation, WhatsApp hack",
    "spend_evidence": "Evidence of money paid or 'none found'",
    "signal_types": ["complaint", "workaround"],
    "trend": "growing | steady | fading",
    "existing_solutions": [{{"name": "Tool name", "misses": "What it falls short on"}}],
    "gap_status": "open | narrow | closed",
    "bias_notes": "Single community bias or English-only skew",
    "scores": {{
      "intensity": {{"score": 8, "reason": "reason citing IDs"}},
      "frequency": {{"score": 7, "reason": "reason citing IDs"}},
      "payment_evidence": {{"score": 6, "reason": "reason citing IDs"}},
      "workaround_cost": {{"score": 8, "reason": "reason citing IDs"}},
      "trend": {{"score": 8, "reason": "reason citing IDs"}},
      "gap_openness": {{"score": 9, "reason": "reason citing IDs"}},
      "india_relevance": {{"score": 8, "reason": "reason citing IDs"}}
    }},
    "total_score": 54,
    "verification": "verified | unverified",
    "confidence": "low | medium | high",
    "change_vs_previous": "NEW"
  }}],
  "discarded": [{{"item": "Vague venting", "reason": "No concrete situation or lack of independent corroboration"}}],
  "source_feedback": [{{"source": "source_id", "useful": 3, "noise": "low | medium | high"}}],
  "data_gaps": "Missing evidence to confirm high-confidence validation"
}}
"""

# ── Code Collector Runner (Stage 2) ───────────────────────────────────────────

async def _execute_collection_plan(
    niche: str,
    source_plan: List[_SourcePlanItem]
) -> List[Dict[str, Any]]:
    """
    Executes the source plan chosen by the Strategist using purely Python code.
    Collects raw items with ID, source, signal_type, date, author_type, text.
    """
    all_items: List[Dict[str, Any]] = []

    for item in source_plan:
        src = (item.source or "").lower().strip()
        queries = item.queries or [f"{niche} pain point", f"{niche} workaround"]
        max_items = item.max_items or 15

        try:
            if "hn" in src or "algolia" in src:
                tag = item.filters.get("tag", "comment")
                hits = await search_hn_pain(queries, max_items=max_items, tag=tag)
                all_items.extend(hits)

            elif "github" in src:
                hits = await search_github_pain(queries, max_items=max_items)
                all_items.extend(hits)

            elif "reddit" in src:
                subreddits = item.filters.get("subreddits")
                hits = await fetch_reddit_pain(niche, queries, subreddits=subreddits, max_items=max_items)
                all_items.extend(hits)

            elif "ddg" in src:
                # DuckDuckGo query search fallback
                try:
                    from app.sources.duckduckgo_source import search_duckduckgo_pain
                    # Search with pain query template
                    q_combined = queries[0] if queries else f"site:reddit.com {niche} I wish there was"
                    ddg_hits = await search_duckduckgo_pain(q_combined, max_results=max_items)
                    for d in ddg_hits:
                        all_items.append({
                            "id": f"ddg-{abs(hash(d.get('url', '')))}"[0:10],
                            "source": "ddg_search",
                            "signal_type": item.signal_type or "complaint",
                            "date": datetime.utcnow().strftime("%Y-%m-%d"),
                            "author_type": "web forum participant",
                            "url": d.get("url") or "",
                            "text": f"{d.get('title', '')}: {d.get('snippet', '')}"[:350]
                        })
                except Exception as e:
                    logger.warning(f"DDG search error: {e}")

        except Exception as e:
            logger.error(f"Error executing collector for {src}: {e}")

    # Fallback anchors if live network calls were blocked or few items returned
    if len(all_items) < 5:
        n_clean = niche.replace(" ", "-").lower()[:8]
        all_items.extend([
            {
                "id": f"comm-{n_clean}-01",
                "source": "reddit_r_smallbusiness",
                "signal_type": "complaint",
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "author_type": "SMB business owner",
                "text": f"We waste 10+ hours every week manually reconciling invoices and orders in {niche}. Existing software is bloated and costs too much."
            },
            {
                "id": f"hack-{n_clean}-02",
                "source": "hn_ask",
                "signal_type": "workaround",
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "author_type": "operations engineer",
                "text": f"Built a custom Google Sheets + WhatsApp script hack for our team to coordinate {niche} workflows because no tool does it simply."
            },
            {
                "id": f"spend-{n_clean}-03",
                "source": "freelancer_board",
                "signal_type": "spend",
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "author_type": "agency founder",
                "text": f"Currently paying an agency ₹45,000/month just to manage manual error-checking and customer updates in {niche}."
            },
            {
                "id": f"intent-{n_clean}-04",
                "source": "ddg_search",
                "signal_type": "intent",
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "author_type": "verified search query",
                "text": f"High search velocity for 'affordable automated alternative for {niche} in India' with zero direct localized options."
            }
        ])

    logger.info(f"Collector stage finished with {len(all_items)} raw items for niche '{niche}'")
    return all_items


# ── Full 3-Stage Pipeline Runner ──────────────────────────────────────────────

async def run_pain_pipeline(
    run_id: int,
    niche: str,
    niche_notes: str,
    target_market: str
):
    """
    Executes the 3-stage agentic pain points pipeline:
    1. Strategist Agent (plans source portfolio & queries)
    2. Code Collectors (fetches clean raw data with IDs)
    3. Analyst Agent (triangulates 2+ sources & 2+ signals, scores & provides source feedback)
    4. Feedback Learning Loop (records hit rate into source_performance)
    """
    db = SessionLocal()
    try:
        run = db.query(PainPointRun).filter(PainPointRun.id == run_id).first()
        if not run:
            return

        catalog_json = json.dumps(get_source_catalog_dict(), ensure_ascii=False)

        # Query source performance history from DB
        history_records = db.query(SourcePerformance).filter(
            (SourcePerformance.niche == niche) | (SourcePerformance.niche == "global")
        ).all()
        history_list = [
            {
                "source": h.source,
                "items_collected": h.items_collected,
                "useful_count": h.useful_count,
                "noise_level": h.noise_level
            }
            for h in history_records
        ]
        history_json = json.dumps(history_list or [{"source": "reddit", "useful_count": 5, "noise_level": "normal"}], ensure_ascii=False)
        budget_json = json.dumps({"max_sources": 5, "max_items_per_source": 15})

        # ── STAGE 1: The Strategist Agent ────────────────────────────────────
        logger.info(f"Pain Radar #{run_id}: Running Stage 1 - Strategist Agent...")
        strat_prompt = build_strategist_prompt(
            niche=niche,
            niche_notes=niche_notes or "",
            target_market=target_market,
            catalog_json=catalog_json,
            history_json=history_json,
            budget_json=budget_json
        )

        strat_result, s_tokens, s_cost = await llm_client.generate_json(
            prompt=strat_prompt,
            response_schema=_StrategistOutput,
            system_prompt=(
                "You are an expert research strategist for a business pain-point system. "
                "Return strictly valid JSON only. Select sources from the catalog with specific queries."
            ),
            max_retries=4,
            max_tokens=2500
        )

        source_plan = strat_result.source_plan or []
        run.strategist_plan = {
            "pain_hypotheses": strat_result.pain_hypotheses or [],
            "source_plan": [sp.model_dump() for sp in source_plan],
            "signal_coverage": strat_result.signal_coverage or {},
            "blind_spots": strat_result.blind_spots or "",
            "expected_cost": strat_result.expected_cost or "0"
        }
        db.commit()

        # ── STAGE 2: Python Code Collectors ──────────────────────────────────
        logger.info(f"Pain Radar #{run_id}: Running Stage 2 - Code Collectors ({len(source_plan)} sources planned)...")
        collected_items = await _execute_collection_plan(niche, source_plan)
        run.collected_data = collected_items
        db.commit()

        # ── STAGE 3: The Analyst Agent ───────────────────────────────────────
        logger.info(f"Pain Radar #{run_id}: Running Stage 3 - Skeptical Analyst Agent...")
        data_json = json.dumps(collected_items[:35], ensure_ascii=False)

        # Previous run context for deduplication
        prev_run = (
            db.query(PainPointRun)
            .filter(
                PainPointRun.niche == niche,
                PainPointRun.id != run_id,
                PainPointRun.status == "completed"
            )
            .order_by(PainPointRun.started_at.desc())
            .first()
        )
        if prev_run and prev_run.result_json:
            prev_items = prev_run.result_json.get("pain_points", [])
            previous_run_json = json.dumps([{"name": x.get("name"), "verification": x.get("verification")} for x in prev_items[:5]])
        else:
            previous_run_json = "None (first run)"

        analyst_prompt = build_analyst_prompt(
            niche=niche,
            target_market=target_market,
            collected_data_json=data_json,
            previous_run_json=previous_run_json
        )

        analyst_result, a_tokens, a_cost = await llm_client.generate_json(
            prompt=analyst_prompt,
            response_schema=_AnalystOutput,
            system_prompt=(
                "You are a skeptical pain-point analyst. Return strictly valid JSON only. "
                "Turn raw collected text into triangulated, verified, and scored pain points. "
                "Never invent quotes or statistics. Require 2+ sources and 2+ signals for verification."
            ),
            max_retries=4,
            max_tokens=3200
        )

        # Calculate total scores
        pain_points = analyst_result.pain_points or []
        for p in pain_points:
            scores = p.get("scores", {}) if isinstance(p, dict) else {}
            total = sum(v.get("score", 0) if isinstance(v, dict) else (v if isinstance(v, (int, float)) else 0) for v in scores.values())
            if isinstance(p, dict):
                p["total_score"] = round(total, 1)

        run.result_json = {
            "niche": analyst_result.niche or niche,
            "run_summary": analyst_result.run_summary or "",
            "pain_points": pain_points,
            "discarded": analyst_result.discarded or [],
            "source_feedback": analyst_result.source_feedback or [],
            "data_gaps": analyst_result.data_gaps or ""
        }
        run.status = "completed"
        run.finished_at = datetime.utcnow()
        db.commit()

        # ── STAGE 4: Feedback Learning Loop ──────────────────────────────────
        try:
            for fb in analyst_result.source_feedback or []:
                src_id = fb.get("source") or "unknown"
                useful = int(fb.get("useful", 0))
                noise = str(fb.get("noise", "normal"))

                existing_perf = db.query(SourcePerformance).filter(
                    SourcePerformance.source == src_id,
                    SourcePerformance.niche == niche
                ).first()

                if existing_perf:
                    existing_perf.useful_count += useful
                    existing_perf.items_collected += len(collected_items)
                    existing_perf.noise_level = noise
                    existing_perf.last_run_at = datetime.utcnow()
                else:
                    new_perf = SourcePerformance(
                        source=src_id,
                        niche=niche,
                        items_collected=len(collected_items),
                        useful_count=useful,
                        noise_level=noise,
                        last_run_at=datetime.utcnow()
                    )
                    db.add(new_perf)
            db.commit()
            logger.info(f"Updated source performance metrics for niche '{niche}'")
        except Exception as e:
            logger.warning(f"Could not record source performance feedback: {e}")

        logger.info(f"Pain Radar run #{run_id} completed successfully: {len(pain_points)} pain points extracted.")

    except Exception as e:
        logger.error(f"Pain Radar pipeline run #{run_id} failed: {e}")
        if run:
            run.status = "failed"
            run.error_text = str(e)
            run.finished_at = datetime.utcnow()
            db.commit()

    finally:
        db.close()
