import logging
import httpx
import feedparser
import yaml
import os
from datetime import datetime
from typing import List
from app.sources.base import Source, RawItemData

logger = logging.getLogger(__name__)

DEFAULT_FEEDS = [
    {"name": "Inc42", "url": "https://inc42.com/feed/"},
    {"name": "Entrackr", "url": "https://entrackr.com/feed/"},
    {"name": "YourStory", "url": "https://yourstory.com/feed"},
    {"name": "ET Startups", "url": "https://economictimes.indiatimes.com/tech/startups/rssfeeds/62806267.cms"},
    {"name": "YC Blog", "url": "https://blog.ycombinator.com/rss/"},
    {"name": "Indie Hackers", "url": "https://www.indiehackers.com/feed.xml"}
]

class RSSSourcesPlugin(Source):
    name = "rss_sources"

    def __init__(self, feeds: List[dict] = None):
        self.feeds = feeds or DEFAULT_FEEDS

    async def fetch(self) -> List[RawItemData]:
        items = []
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            for feed_info in self.feeds:
                feed_name = feed_info.get("name", "RSS")
                feed_url = feed_info.get("url")
                if not feed_url:
                    continue
                try:
                    resp = await client.get(feed_url)
                    if resp.status_code == 200:
                        parsed = feedparser.parse(resp.text)
                        for entry in parsed.entries[:10]:
                            title = entry.get("title", "")
                            link = entry.get("link", feed_url)
                            summary = entry.get("summary", "") or entry.get("description", "")
                            
                            # Clean snippet
                            text_snippet = f"Source: {feed_name}\nTitle: {title}\nSummary: {summary[:800]}"
                            items.append(RawItemData(
                                source=f"rss_{feed_name.lower().replace(' ', '_')}",
                                url=link,
                                title=f"[{feed_name}] {title}",
                                text=text_snippet,
                                published_at=datetime.utcnow()
                            ))
                except Exception as e:
                    logger.warning(f"Failed to fetch RSS feed {feed_name} ({feed_url}): {e}")
        return items
