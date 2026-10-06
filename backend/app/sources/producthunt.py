import logging
import httpx
import feedparser
from datetime import datetime
from typing import List
from app.config import settings
from app.sources.base import Source, RawItemData

logger = logging.getLogger(__name__)

class ProductHuntSource(Source):
    name = "producthunt"

    async def fetch(self) -> List[RawItemData]:
        token = settings.PRODUCTHUNT_TOKEN
        # If GraphQL token is available, query API; otherwise fallback to RSS feed
        if token:
            try:
                return await self._fetch_graphql(token)
            except Exception as e:
                logger.warning(f"ProductHunt GraphQL failed, falling back to RSS: {e}")

        # Fallback to RSS feed if no key or error
        return await self._fetch_rss()

    async def _fetch_graphql(self, token: str) -> List[RawItemData]:
        query = """
        {
          posts(first: 20) {
            edges {
              node {
                name
                tagline
                description
                url
                createdAt
              }
            }
          }
        }
        """
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post("https://api.producthunt.com/v2/api/graphql", json={"query": query}, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        items = []
        edges = data.get("data", {}).get("posts", {}).get("edges", [])
        for edge in edges:
            node = edge.get("node", {})
            name = node.get("name", "")
            tagline = node.get("tagline", "")
            desc = node.get("description", "")
            url = node.get("url", "")
            created_at = None
            if node.get("createdAt"):
                try:
                    created_at = datetime.fromisoformat(node["createdAt"].replace("Z", "+00:00"))
                except Exception:
                    pass

            text = f"Product: {name}\nTagline: {tagline}\nDescription: {desc}".strip()
            items.append(RawItemData(
                source=self.name,
                url=url,
                title=f"{name} - {tagline}",
                text=text,
                published_at=created_at
            ))
        return items

    async def _fetch_rss(self) -> List[RawItemData]:
        rss_url = "https://www.producthunt.com/feed"
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(rss_url)
            resp.raise_for_status()
            feed = feedparser.parse(resp.text)

        items = []
        for entry in feed.entries[:20]:
            title = entry.get("title", "")
            link = entry.get("link", "")
            summary = entry.get("summary", "") or entry.get("description", "")
            items.append(RawItemData(
                source=self.name,
                url=link,
                title=title,
                text=f"{title}\n{summary}".strip(),
                published_at=datetime.utcnow()
            ))
        return items
