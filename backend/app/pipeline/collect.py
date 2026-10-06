import logging
import asyncio
import yaml
import os
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models import Run, RawItem
from app.sources.base import Source, RawItemData
from app.sources.hackernews import HackerNewsSource
from app.sources.producthunt import ProductHuntSource
from app.sources.reddit import RedditSource
from app.sources.googletrends import GoogleTrendsSource
from app.sources.github_trending import GitHubTrendingSource
from app.sources.rss_sources import RSSSourcesPlugin

logger = logging.getLogger(__name__)

def load_source_plugins() -> List[Source]:
    config_path = os.path.join(os.path.dirname(__file__), "..", "sources", "sources.yaml")
    plugins = []
    
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                cfg = yaml.safe_load(f) or {}
            for item in cfg.get("sources", []):
                if not item.get("enabled", True):
                    continue
                stype = item.get("type")
                if stype == "hackernews":
                    plugins.append(HackerNewsSource())
                elif stype == "producthunt":
                    plugins.append(ProductHuntSource())
                elif stype == "reddit":
                    plugins.append(RedditSource(subreddits=item.get("subreddits")))
                elif stype == "googletrends":
                    plugins.append(GoogleTrendsSource())
                elif stype == "github_trending":
                    plugins.append(GitHubTrendingSource())
                elif stype == "rss_sources":
                    plugins.append(RSSSourcesPlugin(feeds=item.get("feeds")))
        except Exception as e:
            logger.error(f"Error loading sources.yaml: {e}")

    # Fallback to default set if empty
    if not plugins:
        plugins = [
            HackerNewsSource(),
            ProductHuntSource(),
            RedditSource(),
            GoogleTrendsSource(),
            GitHubTrendingSource(),
            RSSSourcesPlugin()
        ]
    return plugins

async def run_collect(db: Session, run: Run) -> Tuple[List[RawItem], List[dict]]:
    """
    Executes parallel collection across enabled sources.
    Returns (raw_items_saved, sources_checked_list)
    """
    plugins = load_source_plugins()
    sources_checked = []
    all_raw_items: List[RawItem] = []

    async def fetch_source(plugin: Source):
        try:
            items_data = await plugin.fetch()
            return plugin.name, "ok", items_data, None
        except Exception as e:
            logger.error(f"Source {plugin.name} failed: {e}")
            return plugin.name, "failed", [], str(e)

    tasks = [fetch_source(p) for p in plugins]
    results = await asyncio.gather(*tasks)

    for source_name, status, item_datas, err_msg in results:
        sources_checked.append({
            "name": source_name,
            "status": status,
            "items_count": len(item_datas),
            "error": err_msg
        })

        for rdata in item_datas:
            raw_item = RawItem(
                run_id=run.id,
                source=rdata.source,
                url=rdata.url,
                title=rdata.title,
                text=rdata.text,
                published_at=rdata.published_at
            )
            db.add(raw_item)
            all_raw_items.append(raw_item)

    db.commit()
    for item in all_raw_items:
        db.refresh(item)

    return all_raw_items, sources_checked
