import logging
from typing import List, Tuple, Dict, Any
from app.models import RawItem
from app.schemas import SectionAnalysisResult, FindingSchema, ExtractedItem
from app.llm.prompts import get_analyze_prompt
from app.llm.client import llm_client

logger = logging.getLogger(__name__)

async def run_section_analysis(
    section: str,
    extracted_items: List[ExtractedItem],
    raw_items: List[RawItem],
    topic: str = None
) -> Tuple[SectionAnalysisResult, int, float]:
    """
    Analyzes gathered raw items and extracted concepts for a specific dashboard section.
    Keeps context concise to stay safely under Groq TPM/ITPM limits.
    """
    prompt_base = get_analyze_prompt(section)

    if topic and section == "deep_research":
        prompt_base += f"\nDeep Research Topic requested by user: '{topic}'"

    # Context formatting
    context_lines = []
    if extracted_items:
        for item in extracted_items[:10]:
            context_lines.append(
                f"- Name: {item.name} ({item.kind}) | URL: {item.source_url} | Quote: \"{(item.supporting_quote or '')[:150]}\" | Desc: {(item.one_line_description or '')[:150]}"
            )
    
    # Fallback to raw items if extracted items list is empty or small
    if len(context_lines) < 3 and raw_items:
        for ritem in raw_items[:10]:
            context_lines.append(
                f"- Raw item [{ritem.source}]: {ritem.title[:100]} | URL: {ritem.url} | Content: {(ritem.text or '')[:200]}"
            )

    context_text = "\n".join(context_lines)

    if not context_text:
        return SectionAnalysisResult(findings=[], summary="No significant findings in this data."), 0, 0.0

    full_prompt = f"{prompt_base}\n\nEXTRACTED EVIDENCE & CONCEPTS:\n{context_text}"

    try:
        result_obj, tokens, cost = await llm_client.generate_json(
            prompt=full_prompt,
            response_schema=SectionAnalysisResult,
            system_prompt="You are a market analyst. Output JSON only, strictly backed by provided evidence."
        )
        return result_obj, tokens, cost
    except Exception as e:
        logger.error(f"Analysis for section '{section}' failed: {e}")
        return SectionAnalysisResult(findings=[], summary="No significant findings in this data."), 0, 0.0
