import logging
import httpx
import feedparser
from datetime import datetime
from typing import List
from app.sources.base import Source, RawItemData

logger = logging.getLogger(__name__)

BETALIST_FEED_URL = "https://betalist.com/feed"

class BetaListSource(Source):
    name = "betalist"

    def __init__(self, feed_url: str = BETALIST_FEED_URL):
        self.feed_url = feed_url

    async def fetch(self) -> List[RawItemData]:
        """Fetches newly submitted startups and products from BetaList RSS feed."""
        raw_items: List[RawItemData] = []
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                resp = await client.get(
                    self.feed_url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) BusinessRadar/1.0"}
                )
                if resp.status_code != 200:
                    logger.warning(f"BetaList feed returned HTTP {resp.status_code}")
                    return []

                parsed = feedparser.parse(resp.text)
                for entry in parsed.entries[:20]:
                    title = getattr(entry, "title", "").strip()
                    link = getattr(entry, "link", "").strip()
                    summary = getattr(entry, "summary", "").strip() or getattr(entry, "description", "").strip()

                    # Clean html tags from summary
                    import re
                    clean_summary = re.sub(r"<[^>]+>", " ", summary).strip()

                    if not title or not link:
                        continue

                    pub_date = None
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        try:
                            import time
                            pub_date = datetime.fromtimestamp(time.mktime(entry.published_parsed))
                        except Exception:
                            pub_date = datetime.utcnow()

                    raw_items.append(
                        RawItemData(
                            source=self.name,
                            url=link,
                            title=f"[BetaList] {title}",
                            text=f"{title}: {clean_summary}",
                            published_at=pub_date or datetime.utcnow()
                        )
                    )

            logger.info(f"BetaList source collected {len(raw_items)} new startup launches.")
        except Exception as e:
            logger.warning(f"BetaList fetch error: {e}")

        return raw_items
