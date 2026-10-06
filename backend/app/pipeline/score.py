import logging
from typing import Tuple, List, Dict
from app.schemas import ScoringLLMResult, IndiaGapResult, CriticResult, FindingSchema
from app.llm.prompts import SCORING_PROMPT
from app.llm.client import llm_client

logger = logging.getLogger(__name__)

def calculate_confidence(source_count: int) -> str:
    """Computes confidence score based strictly on independent source count."""
    if source_count >= 3:
        return "high"
    elif source_count == 2:
        return "medium"
    else:
        return "low"

def compute_total_score(scoring_res: ScoringLLMResult) -> float:
    """Calculates total score (0-100) strictly in Python code by summing sub-scores."""
    demand = max(0.0, min(25.0, float(scoring_res.demand_growth.score)))
    proven = max(0.0, min(15.0, float(scoring_res.proven_abroad.score)))
    india_gap = max(0.0, min(20.0, float(scoring_res.india_gap.score)))
    ease = max(0.0, min(15.0, float(scoring_res.ease_to_build.score)))
    rev = max(0.0, min(15.0, float(scoring_res.revenue_potential.score)))
    timing = max(0.0, min(10.0, float(scoring_res.timing.score)))

    total = demand + proven + india_gap + ease + rev + timing
    return round(min(100.0, max(0.0, total)), 2)

async def run_scoring(
    entity_name: str,
    findings: List[FindingSchema],
    india_gap_res: IndiaGapResult,
    critic_res: CriticResult,
    source_count: int
) -> Tuple[Dict, int, float]:
    """
    Evaluates sub-scores using Groq, then computes exact sum and confidence in Python.
    """
    context_lines = [
        f"Entity Name: {entity_name}",
        f"India Market Gap Verification: {india_gap_res.conclusion} (Reasoning: {india_gap_res.reasoning})",
        f"Critic Verdict: {critic_res.verdict} (Summary: {critic_res.one_line_summary})",
        "Critic Top Risks:"
    ]
    for r in critic_res.top_risks:
        context_lines.append(f"  - [{r.severity.upper()}] {r.risk}")

    context_lines.append("Findings & Evidence:")
    for f in findings:
        for ev in f.evidence:
            context_lines.append(f"  - [{ev.source}] {ev.quote} ({ev.url})")

    context_text = "\n".join(context_lines)

    prompt = SCORING_PROMPT.format(
        entity=entity_name,
        context_text=context_text
    )

    try:
        scoring_res, tokens, cost = await llm_client.generate_json(
            prompt=prompt,
            response_schema=ScoringLLMResult,
            system_prompt="You are a data-driven investment analyst scoring business opportunities. Output JSON only."
        )

        total_score = compute_total_score(scoring_res)
        confidence = calculate_confidence(source_count)

        justifications = {
            "demand_growth": scoring_res.demand_growth.justification,
            "proven_abroad": scoring_res.proven_abroad.justification,
            "india_gap": scoring_res.india_gap.justification,
            "ease_to_build": scoring_res.ease_to_build.justification,
            "revenue_potential": scoring_res.revenue_potential.justification,
            "timing": scoring_res.timing.justification
        }

        result_dict = {
            "total": total_score,
            "demand_growth": scoring_res.demand_growth.score,
            "proven_abroad": scoring_res.proven_abroad.score,
            "india_gap": scoring_res.india_gap.score,
            "ease_to_build": scoring_res.ease_to_build.score,
            "revenue_potential": scoring_res.revenue_potential.score,
            "timing": scoring_res.timing.score,
            "confidence": confidence,
            "subscore_justifications": justifications,
            "risks": [r.model_dump() for r in critic_res.top_risks],
            "india_competitors_found": [c.model_dump() for c in india_gap_res.competitors_found],
            "search_notes": india_gap_res.reasoning
        }
        return result_dict, tokens, cost

    except Exception as e:
        logger.error(f"Scoring for '{entity_name}' failed: {e}")
        confidence = calculate_confidence(source_count)
        fallback = {
            "total": 50.0,
            "demand_growth": 10.0,
            "proven_abroad": 5.0,
            "india_gap": 10.0,
            "ease_to_build": 10.0,
            "revenue_potential": 10.0,
            "timing": 5.0,
            "confidence": confidence,
            "subscore_justifications": {},
            "risks": [],
            "india_competitors_found": [],
            "search_notes": "Scoring step fallback."
        }
        return fallback, 0, 0.0
