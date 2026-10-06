import logging
from typing import Tuple, List
from app.schemas import CriticResult, FindingSchema
from app.llm.prompts import CRITIC_PROMPT
from app.llm.client import llm_client

logger = logging.getLogger(__name__)

async def run_critic(entity_name: str, findings: List[FindingSchema]) -> Tuple[CriticResult, int, float]:
    """
    Evaluates candidate opportunity from a skeptical investor perspective.
    Identifies regulation risks, hype vs real demand, distribution difficulty, unit economics, etc.
    """
    evidence_lines = []
    for f in findings:
        evidence_lines.append(f"Finding: {f.title}\nSummary: {f.summary}")
        for ev in f.evidence:
            evidence_lines.append(f"  - [{ev.source}] Quote: \"{ev.quote}\" ({ev.url})")

    evidence_text = "\n".join(evidence_lines) if evidence_lines else "No specific evidence text provided."

    prompt = CRITIC_PROMPT.format(
        entity=entity_name,
        evidence_text=evidence_text
    )

    try:
        res_obj, tokens, cost = await llm_client.generate_json(
            prompt=prompt,
            response_schema=CriticResult,
            system_prompt="You are a skeptical VC investor. Identify vulnerabilities and risks in JSON format."
        )
        return res_obj, tokens, cost
    except Exception as e:
        logger.error(f"Critic pass for '{entity_name}' failed: {e}")
        fallback = CriticResult(
            top_risks=[],
            verdict="proceed_with_caution",
            one_line_summary="Critic pass encountered an error during evaluation."
        )
        return fallback, 0, 0.0
