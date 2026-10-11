import logging
import httpx
from datetime import datetime
from typing import List
from app.sources.base import Source, RawItemData

logger = logging.getLogger(__name__)

LOBSTERS_URL = "https://lobste.rs/hottest.json"

class LobstersSource(Source):
    name = "lobsters"

    def __init__(self, url: str = LOBSTERS_URL):
        self.url = url

    async def fetch(self) -> List[RawItemData]:
        """Fetches trending developer tools, infrastructure discussions, and launches from Lobste.rs."""
        raw_items: List[RawItemData] = []
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                resp = await client.get(
                    self.url,
                    headers={"User-Agent": "BusinessRadar/1.0 (Business Opportunity Research)"}
                )
                if resp.status_code != 200:
                    logger.warning(f"Lobste.rs returned HTTP {resp.status_code}")
                    return []

                stories = resp.json()
                for story in stories[:20]:
                    title = story.get("title", "").strip()
                    url = story.get("url") or story.get("short_id_url") or ""
                    description = story.get("description", "").strip()
                    score = story.get("score", 0)
                    comment_count = story.get("comment_count", 0)
                    tags = story.get("tags", [])

                    if not title or not url:
                        continue

                    # Filter or format text
                    text_content = f"{title}. Tags: {', '.join(tags)}. Score: {score}, Comments: {comment_count}."
                    if description:
                        text_content += f"\nDescription: {description}"

                    raw_items.append(
                        RawItemData(
                            source=self.name,
                            url=url,
                            title=f"[Lobste.rs] {title}",
                            text=text_content,
                            published_at=datetime.utcnow()
                        )
                    )

            logger.info(f"Lobste.rs source collected {len(raw_items)} developer tool items.")
        except Exception as e:
            logger.warning(f"Lobste.rs fetch error: {e}")

        return raw_items
