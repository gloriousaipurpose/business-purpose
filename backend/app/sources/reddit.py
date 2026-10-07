import logging
import httpx
import feedparser
from datetime import datetime
from typing import List
from app.config import settings
from app.sources.base import Source, RawItemData

logger = logging.getLogger(__name__)

DEFAULT_SUBREDDITS = [
    "entrepreneur", "SaaS", "startups", "indiehackers", "india", "IndiaStartups", "smallbusiness"
]

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

class RedditSource(Source):
    name = "reddit"

    def __init__(self, subreddits: List[str] = None):
        self.subreddits = subreddits or DEFAULT_SUBREDDITS

    async def fetch(self) -> List[RawItemData]:
        items = []
        async with httpx.AsyncClient(timeout=10.0, headers=DEFAULT_HEADERS, follow_redirects=True) as client:
            for sub in self.subreddits:
                try:
                    # Use Reddit RSS feed endpoint (most reliable across all networks)
                    url = f"https://www.reddit.com/r/{sub}/.rss"
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        logger.warning(f"Reddit r/{sub} RSS status {resp.status_code}")
                        continue
                    
                    feed = feedparser.parse(resp.text)
                    for entry in feed.entries[:15]:
                        title = entry.get("title", "")
                        summary = entry.get("summary", "")
                        link = entry.get("link", f"https://reddit.com/r/{sub}")
                        
                        # Strip basic HTML tags from RSS summary
                        clean_text = summary.replace("<p>", " ").replace("</p>", " ").replace("<!-- SC_OFF -->", "").replace("<!-- SC_ON -->", "").strip()
                        
                        content = f"Subreddit: r/{sub}\nTitle: {title}\nText: {clean_text[:1200]}"
                        items.append(RawItemData(
                            source=self.name,
                            url=link,
                            title=f"r/{sub}: {title}",
                            text=content,
                            published_at=datetime.utcnow()
                        ))
                except Exception as e:
                    logger.warning(f"Error fetching Reddit r/{sub} RSS: {e}")
                    continue

        return items
