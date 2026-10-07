import logging
import httpx
import feedparser
from datetime import datetime
from typing import List
from app.sources.base import Source, RawItemData

logger = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

class GoogleTrendsSource(Source):
    name = "googletrends"

    async def fetch(self) -> List[RawItemData]:
        items = []
        geos = ["US", "IN"]
        
        async with httpx.AsyncClient(timeout=10.0, headers=DEFAULT_HEADERS, follow_redirects=True) as client:
            for geo in geos:
                try:
                    url = f"https://trends.google.com/trending/rss?geo={geo}"
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        feed = feedparser.parse(resp.text)
                        for entry in feed.entries[:10]:
                            title = entry.get("title", "")
                            snippet = entry.get("description", "")
                            link = entry.get("link", url)
                            items.append(RawItemData(
                                source=self.name,
                                url=link,
                                title=f"Google Trends ({geo}): {title}",
                                text=f"Trending topic in {geo}: {title}. Context: {snippet}",
                                published_at=datetime.utcnow()
                            ))
                except Exception as e:
                    logger.warning(f"Google Trends fetch for {geo} failed: {e}")
        return items
