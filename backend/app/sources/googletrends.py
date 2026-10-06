import logging
import httpx
import feedparser
from datetime import datetime
from typing import List
from app.sources.base import Source, RawItemData

logger = logging.getLogger(__name__)

class GoogleTrendsSource(Source):
    name = "googletrends"

    async def fetch(self) -> List[RawItemData]:
        items = []
        geos = ["US", "IN"]
        
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            for geo in geos:
                try:
                    url = f"https://trends.google.com/trends/trendingsearches/daily/rss?geo={geo}"
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
