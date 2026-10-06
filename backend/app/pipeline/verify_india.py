import logging
import httpx
from typing import Tuple, List
from app.schemas import IndiaGapResult
from app.llm.prompts import INDIA_GAP_PROMPT
from app.llm.client import llm_client

logger = logging.getLogger(__name__)

async def search_web_queries(entity_name: str) -> Tuple[List[str], str]:
    """Runs 5+ search queries across Google/DuckDuckGo for Indian market context."""
    queries = [
        f"{entity_name} India startup competitor",
        f"{entity_name} alternative IndiaMART Amazon.in",
        f"{entity_name} Indian app Play Store",
        f"{entity_name} site:inc42.com OR site:yourstory.com",
        f"{entity_name} India business model"
    ]
    
    results_text = []
    
    try:
        from duckduckgo_search import DDGS
        ddgs = DDGS()
        for q in queries:
            try:
                res = list(ddgs.text(q, max_results=3))
                if res:
                    results_text.append(f"Query: '{q}'")
                    for item in res:
                        results_text.append(f"  - Title: {item.get('title')}\n    URL: {item.get('href')}\n    Snippet: {item.get('body')}")
            except Exception as e:
                logger.warning(f"DDGS query '{q}' error: {e}")
    except ImportError:
        logger.warning("duckduckgo_search package is not installed.")
    except Exception as e:
        logger.warning(f"DuckDuckGo search initialization failed: {e}")

    search_summary = "\n".join(results_text) if results_text else "No web search results returned."
    return queries, search_summary

async def run_verify_india(entity_name: str) -> Tuple[IndiaGapResult, int, float]:
    """
    Verifies if entity or similar solution exists in India.
    Gathers live web evidence across 5 queries, then calls Groq with INDIA_GAP_PROMPT.
    """
    queries_used, search_evidence = await search_web_queries(entity_name)

    prompt = INDIA_GAP_PROMPT.format(
        entity=entity_name,
        web_evidence=search_evidence
    )

    try:
        res_obj, tokens, cost = await llm_client.generate_json(
            prompt=prompt,
            response_schema=IndiaGapResult,
            system_prompt="You are an Indian market analyst checking local competition. Return valid JSON only."
        )
        return res_obj, tokens, cost
    except Exception as e:
        logger.error(f"India gap verification for '{entity_name}' failed: {e}")
        fallback = IndiaGapResult(
            competitors_found=[],
            queries_used=queries_used,
            conclusion="unclear",
            reasoning="Web verification step encountered an error."
        )
        return fallback, 0, 0.0
