import logging
from typing import Tuple, Dict, Any, List
from sqlalchemy.orm import Session
from app.models import Run, Finding, OpportunityScore, Entity
from app.schemas import DiffResult
from app.llm.prompts import DIFF_PROMPT
from app.llm.client import llm_client

logger = logging.getLogger(__name__)

async def run_diff(db: Session, current_run: Run, previous_run: Run) -> Tuple[Dict[str, Any], int, float]:
    """
    Compares findings and scores between current run and previous run.
    """
    if not previous_run:
        return {
            "new": [],
            "disappeared": [],
            "score_up": [],
            "score_down": [],
            "repeated": [],
            "important_trends": [],
            "summary": "Initial baseline run. No previous run to compare against."
        }, 0, 0.0

    curr_findings = db.query(Finding).filter(Finding.run_id == current_run.id).all()
    prev_findings = db.query(Finding).filter(Finding.run_id == previous_run.id).all()

    def format_findings(findings_list):
        lines = []
        for f in findings_list:
            lines.append(f"- {f.title} (Kind: {f.kind}, Section: {f.section}): {f.summary[:150]}")
        return "\n".join(lines) if lines else "None"

    curr_text = format_findings(curr_findings)
    prev_text = format_findings(prev_findings)

    prompt = DIFF_PROMPT.format(
        previous_findings=prev_text,
        current_findings=curr_text
    )

    try:
        diff_res, tokens, cost = await llm_client.generate_json(
            prompt=prompt,
            response_schema=DiffResult,
            system_prompt="You are a market intelligence engine comparing analysis runs. Return JSON only."
        )
        return diff_res.model_dump(), tokens, cost
    except Exception as e:
        logger.error(f"Diff execution between run {current_run.id} and {previous_run.id} failed: {e}")
        return {
            "new": [],
            "disappeared": [],
            "score_up": [],
            "score_down": [],
            "repeated": [],
            "important_trends": [],
            "summary": "No significant changes."
        }, 0, 0.0
