import logging
import asyncio
from datetime import datetime
from typing import List
from app.sources.base import Source, RawItemData

logger = logging.getLogger(__name__)

DEFAULT_QUERIES = [
    "site:news.ycombinator.com/item \"Show HN\" 2025 OR 2026",
    "site:reddit.com/r/SaaS \"pain point\" OR \"I wish there was a tool\"",
    "trending AI SaaS software workflow automation launches",
    "\"unmet demand\" OR \"market gap\" Indian startups SMBs",
    "\"we just launched\" startup bootstrapped ARR"
]

class DuckDuckGoSource(Source):
    name = "duckduckgo_search"

    def __init__(self, queries: List[str] = None):
        self.queries = queries or DEFAULT_QUERIES

    async def fetch(self) -> List[RawItemData]:
        """
        Executes live DuckDuckGo web searches across high-signal query angles.
        Yields grounded, real-world URLs and content snippets from the open internet.
        """
        raw_items: List[RawItemData] = []
        
        def run_sync_searches():
            results = []
            try:
                from duckduckgo_search import DDGS
                with DDGS() as ddgs:
                    for query in self.queries:
                        try:
                            # Fetch top 4 results per query to stay fast and avoid rate limits
                            ddg_gen = ddgs.text(query, max_results=4)
                            for r in ddg_gen:
                                results.append(r)
                        except Exception as q_err:
                            logger.warning(f"DuckDuckGo search failed for query '{query}': {q_err}")
            except Exception as e:
                logger.warning(f"DuckDuckGo DDGS initialization failed: {e}")
            return results

        # Run DDGS in thread pool since DDGS is synchronous
        search_results = await asyncio.to_thread(run_sync_searches)

        seen_urls = set()
        for r in search_results:
            url = r.get("href") or r.get("link") or ""
            title = r.get("title") or ""
            body = r.get("body") or r.get("snippet") or ""

            if not url or not title or url in seen_urls:
                continue
            seen_urls.add(url)

            raw_items.append(
                RawItemData(
                    source=self.name,
                    url=url,
                    title=f"[Web Search] {title}",
                    text=f"{title}\n{body}",
                    published_at=datetime.utcnow()
                )
            )

        logger.info(f"DuckDuckGo source collected {len(raw_items)} live web search items.")
        return raw_items
