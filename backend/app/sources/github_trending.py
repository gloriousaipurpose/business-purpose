import logging
import httpx
from datetime import datetime, timedelta
from typing import List
from app.sources.base import Source, RawItemData

logger = logging.getLogger(__name__)

class GitHubTrendingSource(Source):
    name = "github_trending"

    async def fetch(self) -> List[RawItemData]:
        # Fetch repos created or pushed recently with high star growth via GitHub API
        date_7_days_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
        url = f"https://api.github.com/search/repositories?q=created:>{date_7_days_ago}&sort=stars&order=desc&per_page=15"
        
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "BusinessRadar/1.0"
        }
        items = []
        try:
            async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    for repo in data.get("items", []):
                        name = repo.get("full_name", "")
                        desc = repo.get("description", "") or ""
                        html_url = repo.get("html_url", "")
                        stars = repo.get("stargazers_count", 0)
                        language = repo.get("language") or "Unknown"
                        
                        text = f"GitHub Repo: {name}\nStars: {stars}\nLanguage: {language}\nDescription: {desc}"
                        items.append(RawItemData(
                            source=self.name,
                            url=html_url,
                            title=f"GitHub Trending: {name}",
                            text=text,
                            published_at=datetime.utcnow()
                        ))
        except Exception as e:
            logger.warning(f"Error fetching GitHub trending: {e}")
        return items
