import logging
import httpx
from datetime import datetime
from typing import List
from app.config import settings
from app.sources.base import Source, RawItemData

logger = logging.getLogger(__name__)

DEFAULT_SUBREDDITS = [
    "entrepreneur", "SaaS", "startups", "indiehackers", "india", "IndiaStartups", "smallbusiness"
]

class RedditSource(Source):
    name = "reddit"

    def __init__(self, subreddits: List[str] = None):
        self.subreddits = subreddits or DEFAULT_SUBREDDITS

    async def fetch(self) -> List[RawItemData]:
        # Try fetching via public JSON feed with user-agent
        items = []
        headers = {"User-Agent": settings.REDDIT_USER_AGENT or "BusinessRadar/1.0"}
        
        async with httpx.AsyncClient(timeout=10.0, headers=headers, follow_redirects=True) as client:
            for sub in self.subreddits:
                try:
                    url = f"https://www.reddit.com/r/{sub}/hot.json?limit=15"
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        logger.warning(f"Reddit r/{sub} status {resp.status_code}")
                        continue
                    data = resp.json()
                    posts = data.get("data", {}).get("children", [])
                    for post in posts:
                        pdata = post.get("data", {})
                        if pdata.get("stickied"):
                            continue
                        title = pdata.get("title", "")
                        selftext = pdata.get("selftext", "")
                        permalink = pdata.get("permalink", "")
                        post_url = f"https://reddit.com{permalink}" if permalink else pdata.get("url", "")
                        created_utc = pdata.get("created_utc")
                        pub_date = datetime.utcfromtimestamp(created_utc) if created_utc else datetime.utcnow()

                        content = f"Subreddit: r/{sub}\nTitle: {title}\nText: {selftext[:1000]}"
                        items.append(RawItemData(
                            source=self.name,
                            url=post_url,
                            title=f"r/{sub}: {title}",
                            text=content,
                            published_at=pub_date
                        ))
                except Exception as e:
                    logger.warning(f"Error fetching Reddit r/{sub}: {e}")
                    continue

        return items
