import logging
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

GITHUB_SEARCH_ISSUES_URL = "https://api.github.com/search/issues"

async def search_github_pain(
    queries: List[str],
    max_items: int = 15,
    days_back: int = 365
) -> List[Dict[str, Any]]:
    """
    Searches GitHub issues and discussions for unmet feature requests,
    workaround scripts, and workflow friction using the public Search API.
    """
    cutoff_date = (datetime.utcnow() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    results: List[Dict[str, Any]] = []
    seen_ids = set()

    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "BusinessRadarPainCollector/1.0"
    }

    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        for q in queries[:3]:
            if len(results) >= max_items:
                break
            try:
                # Search issues with high discussion or reaction
                search_query = f"{q} is:issue created:>{cutoff_date}"
                params = {
                    "q": search_query,
                    "sort": "comments",
                    "order": "desc",
                    "per_page": min(15, max_items)
                }

                resp = await client.get(GITHUB_SEARCH_ISSUES_URL, params=params)
                if resp.status_code == 403 or resp.status_code == 429:
                    logger.warning("GitHub API rate limit hit, skipping further GitHub queries")
                    break
                if resp.status_code != 200:
                    logger.warning(f"GitHub Search API returned {resp.status_code} for '{q}'")
                    continue

                data = resp.json()
                items = data.get("items", [])
                for item in items:
                    item_id = str(item.get("id") or "")
                    if not item_id or item_id in seen_ids:
                        continue
                    seen_ids.add(item_id)

                    title = item.get("title") or ""
                    body = (item.get("body") or "")[:350]
                    combined = f"{title}. {body}".strip()

                    if len(combined) < 25:
                        continue

                    # Signal type classification
                    lower = combined.lower()
                    signal = "workaround" if any(w in lower for w in ["workaround", "script", "hack", "manually"]) else "complaint"
                    if any(w in lower for w in ["looking for", "alternative", "how to"]):
                        signal = "intent"

                    author = (item.get("user") or {}).get("login") or "github_user"
                    created_at = item.get("created_at") or datetime.utcnow().isoformat()

                    results.append({
                        "id": f"gh-{item_id}",
                        "source": "github_issues",
                        "signal_type": signal,
                        "date": created_at[:10],
                        "author_type": f"engineer/maintainer (@{author})",
                        "url": item.get("html_url") or "",
                        "text": combined[:400]
                    })

                    if len(results) >= max_items:
                        break

            except Exception as e:
                logger.error(f"Error searching GitHub issues for '{q}': {e}")

    logger.info(f"GitHub Issues collector fetched {len(results)} items")
    return results
