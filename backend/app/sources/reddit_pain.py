import logging
import httpx
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Rotate clean browser user-agents
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 BusinessRadar/1.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15 BusinessRadar/1.0",
]

DEFAULT_PAIN_SUBREDDITS = [
    "SaaS", "entrepreneur", "smallbusiness", "startups",
    "IndiaStartups", "india", "indiehackers"
]

NICHE_SUBREDDIT_MAP = {
    "e-commerce": ["ecommerce", "dropship", "FulfillmentByAmazon", "smallbusiness", "IndiaStartups"],
    "software-saas": ["SaaS", "indiehackers", "startups", "webdev"],
    "health-fitness": ["fitness", "bodyweightfitness", "nutrition", "running"],
    "food-beverages": ["restaurateur", "foodtrucks", "smallbusiness"],
    "education-edtech": ["edtech", "teachers", "highereducation"],
    "finance-fintech": ["Fintech", "personalfinanceindia", "IndiaInvestments", "smallbusiness"],
    "sports": ["sports", "running", "soccer", "cricket"],
    "logistics-supply-chain": ["supplychain", "freightbrokers", "logistics"],
    "real-estate": ["realestateinvesting", "CommercialRealEstate", "PropertyManagement"],
    "marketing-adtech": ["marketing", "PPC", "SEO", "socialmediamarketing"]
}

async def fetch_reddit_pain(
    niche: str,
    queries: List[str],
    subreddits: Optional[List[str]] = None,
    max_items: int = 20
) -> List[Dict[str, Any]]:
    """
    Niche-aware Reddit collector reading search hits, new posts, and comments.
    Targets language of real frustration, workarounds, and spend signals.
    """
    target_subs = subreddits or NICHE_SUBREDDIT_MAP.get(niche.lower()) or DEFAULT_PAIN_SUBREDDITS
    results: List[Dict[str, Any]] = []
    seen_ids = set()

    headers = {"User-Agent": USER_AGENTS[0]}

    async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
        # 1. Search subreddits with queries
        for sub in target_subs[:4]:
            if len(results) >= max_items:
                break

            query_term = queries[0] if queries else "I wish there was OR workaround OR frustrating"
            search_url = f"https://www.reddit.com/r/{sub}/search.json"
            params = {
                "q": query_term,
                "restrict_sr": "1",
                "sort": "new",
                "limit": min(15, max_items)
            }

            try:
                await asyncio.sleep(0.6)  # polite pacing
                resp = await client.get(search_url, params=params)

                # Fallback to new.json if search is rate-limited or empty
                if resp.status_code != 200:
                    resp = await client.get(f"https://www.reddit.com/r/{sub}/new.json?limit=15")

                if resp.status_code == 200:
                    data = resp.json()
                    children = data.get("data", {}).get("children", [])
                    for child in children:
                        pdata = child.get("data", {})
                        post_id = pdata.get("id") or ""
                        if not post_id or post_id in seen_ids:
                            continue
                        seen_ids.add(post_id)

                        title = pdata.get("title") or ""
                        selftext = pdata.get("selftext") or ""
                        combined = f"{title}. {selftext}".strip()

                        if len(combined) < 30:
                            continue

                        # Signal type detection
                        lower = combined.lower()
                        signal = "complaint"
                        if any(w in lower for w in ["excel", "sheet", "manually", "whatsapp", "workaround", "hack"]):
                            signal = "workaround"
                        elif any(w in lower for w in ["pay", "cost", "month", "$", "rupees", "hired", "agency", "subscription"]):
                            signal = "spend"
                        elif any(w in lower for w in ["looking for", "alternative to", "recommend", "how do you manage"]):
                            signal = "intent"

                        author = pdata.get("author") or "reddit_user"
                        created_utc = pdata.get("created_utc")
                        date_str = datetime.utcfromtimestamp(created_utc).strftime("%Y-%m-%d") if created_utc else datetime.utcnow().strftime("%Y-%m-%d")

                        results.append({
                            "id": f"reddit-{post_id}",
                            "source": f"r/{sub}",
                            "signal_type": signal,
                            "date": date_str,
                            "author_type": f"community user (u/{author}) in r/{sub}",
                            "url": f"https://reddit.com{pdata.get('permalink') or ''}",
                            "text": combined[:450]
                        })

                        if len(results) >= max_items:
                            break

            except Exception as e:
                logger.warning(f"Error collecting Reddit pain from r/{sub}: {e}")

    logger.info(f"Reddit pain collector fetched {len(results)} items across {target_subs[:4]}")
    return results
