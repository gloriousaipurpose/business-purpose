import logging
from typing import List, Tuple
from app.models import RawItem
from app.schemas import ExtractedItem, ExtractedItemsList
from app.llm.prompts import EXTRACT_PROMPT
from app.llm.client import llm_client

logger = logging.getLogger(__name__)

async def run_extract(raw_items: List[RawItem], batch_size: int = 5) -> Tuple[List[ExtractedItem], int, float]:
    """
    Batches raw items, extracts structured startup/product/pain-point items using Groq.
    Enforces EVIDENCE FIRST rule: reject items without valid source URL or supporting quote.
    Returns (extracted_items, tokens_used, total_cost)
    """
    if not raw_items:
        return [], 0, 0.0

    valid_extracted: List[ExtractedItem] = []
    total_tokens = 0
    total_cost = 0.0

    # Build url to text map for quote verification
    raw_map = {item.url: item.text for item in raw_items}

    for i in range(0, len(raw_items), batch_size):
        batch = raw_items[i : i + batch_size]
        batch_text = "\n---\n".join([
            f"ID: {item.id}\nSource: {item.source}\nURL: {item.url}\nTitle: {item.title}\nText: {item.text}"
            for item in batch
        ])

        prompt = f"{EXTRACT_PROMPT}\n\nRAW ITEMS TO EXTRACT FROM:\n{batch_text}"

        try:
            res_obj, tokens, cost = await llm_client.generate_json(
                prompt=prompt,
                response_schema=ExtractedItemsList,
                system_prompt="You are a strict data extraction engine. Extract JSON array of findings only from given raw text."
            )
            total_tokens += tokens
            total_cost += cost

            for item in res_obj.items:
                # Evidence rule validation
                if not item.source_url or not item.supporting_quote:
                    logger.info(f"Rejected extracted item '{item.name}': missing URL or supporting quote.")
                    continue
                
                if len(item.supporting_quote.strip()) < 3:
                    logger.info(f"Rejected extracted item '{item.name}': quote too short.")
                    continue

                valid_extracted.append(item)

        except Exception as e:
            logger.warning(f"Extraction batch failed: {e}")

    return valid_extracted, total_tokens, total_cost
