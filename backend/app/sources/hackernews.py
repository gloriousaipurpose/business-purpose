import logging
import httpx
from datetime import datetime
from typing import List
from tenacity import retry, stop_after_attempt, wait_exponential
from app.sources.base import Source, RawItemData

logger = logging.getLogger(__name__)

class HackerNewsSource(Source):
    name = "hackernews"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=5), reraise=True)
    async def _fetch_algolia(self) -> List[RawItemData]:
        # Fetch recent Show HN and top tech/startup submissions from Algolia API
        url = "https://hn.algolia.com/api/v1/search_by_date?tags=(story,show_hn)&hitsPerPage=30"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        items = []
        for hit in data.get("hits", []):
            title = hit.get("title") or ""
            story_text = hit.get("story_text") or hit.get("comment_text") or ""
            hit_url = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"
            created_at = None
            if hit.get("created_at"):
                try:
                    created_at = datetime.fromisoformat(hit["created_at"].replace("Z", "+00:00"))
                except Exception:
                    pass

            text_content = f"{title}\n\n{story_text}".strip()
            if len(text_content) > 20:
                items.append(
                    RawItemData(
                        source=self.name,
                        url=hit_url,
                        title=title,
                        text=text_content,
                        published_at=created_at
                    )
                )
        return items

    async def fetch(self) -> List[RawItemData]:
        try:
            return await self._fetch_algolia()
        except Exception as e:
            logger.error(f"Error fetching Hacker News items: {e}")
            raise e
