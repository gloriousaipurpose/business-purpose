import logging
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

ALGOLIA_SEARCH_URL = "https://hn.algolia.com/api/v1/search"

async def search_hn_pain(
    queries: List[str],
    max_items: int = 15,
    tag: str = "comment",
    days_back: int = 180
) -> List[Dict[str, Any]]:
    """
    Searches Hacker News comments or stories via the free Algolia API.
    Extracts high-signal complaints, workarounds, and user frustrations.
    """
    cutoff_ts = int((datetime.utcnow() - timedelta(days=days_back)).timestamp())
    results: List[Dict[str, Any]] = []
    seen_ids = set()

    headers = {
        "User-Agent": "BusinessRadarPainCollector/1.0"
    }

    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        for q in queries[:4]:
            if len(results) >= max_items:
                break
            try:
                params = {
                    "query": q,
                    "tags": tag,
                    "numericFilters": f"created_at_i>{cutoff_ts}",
                    "hitsPerPage": min(20, max_items)
                }
                resp = await client.get(ALGOLIA_SEARCH_URL, params=params)
                if resp.status_code != 200:
                    logger.warning(f"Algolia HN returned {resp.status_code} for '{q}'")
                    continue

                data = resp.json()
                hits = data.get("hits", [])
                for hit in hits:
                    object_id = str(hit.get("objectID") or "")
                    if not object_id or object_id in seen_ids:
                        continue
                    seen_ids.add(object_id)

                    text_snippet = hit.get("comment_text") or hit.get("title") or hit.get("story_text") or ""
                    # Clean up basic HTML tags
                    clean_text = text_snippet.replace("<p>", " ").replace("</p>", "").replace("&#x27;", "'").replace("&quot;", '"')
                    if len(clean_text.strip()) < 30:
                        continue

                    # Classify initial signal type
                    signal = "complaint"
                    lower_text = clean_text.lower()
                    if any(w in lower_text for w in ["excel", "sheet", "hack", "script", "manually", "workaround"]):
                        signal = "workaround"
                    elif any(w in lower_text for w in ["pay", "cost", "dollar", "month", "subscription", "$"]):
                        signal = "spend"
                    elif any(w in lower_text for w in ["looking for", "alternative to", "wish", "anyone know"]):
                        signal = "intent"

                    author = hit.get("author") or "hn_user"
                    created_at = hit.get("created_at") or datetime.utcnow().isoformat()

                    results.append({
                        "id": f"hn-{object_id}",
                        "source": "hn_ask" if tag == "story" else "hn_comments",
                        "signal_type": signal,
                        "date": created_at[:10],
                        "author_type": f"developer/founder (@{author})",
                        "url": f"https://news.ycombinator.com/item?id={object_id}",
                        "text": clean_text[:400]
                    })

                    if len(results) >= max_items:
                        break

            except Exception as e:
                logger.error(f"Error searching HN Algolia for '{q}': {e}")

    logger.info(f"HN Algolia collector fetched {len(results)} items for queries: {queries}")
    return results
