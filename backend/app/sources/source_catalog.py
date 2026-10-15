from typing import List, Dict, Any

SOURCE_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "reddit",
        "name": "Reddit Communities & Discussions",
        "type": "community",
        "signals": ["complaint", "workaround", "spend"],
        "pain_density": 9,
        "india_relevance": 6,
        "access": "public JSON / search (niche subreddits + comments)",
        "risk": "medium (rate-limits; polite pacing required)",
        "notes": "Niche subreddits should be chosen per niche; read new posts + comments, not only hot"
    },
    {
        "id": "hn_algolia",
        "name": "Hacker News Search (Algolia)",
        "type": "developer_community",
        "signals": ["complaint", "workaround", "intent"],
        "pain_density": 8,
        "india_relevance": 3,
        "access": "official Algolia REST API (free, open, no auth)",
        "risk": "low",
        "notes": "Direct text search across comments & Ask HN for 'I wish', 'alternative to', 'doing manually'"
    },
    {
        "id": "github_issues",
        "name": "GitHub Issues & Unmet Feature Requests",
        "type": "software_issues",
        "signals": ["workaround", "complaint", "intent"],
        "pain_density": 7,
        "india_relevance": 4,
        "access": "official GitHub Search API (10 req/min unauthenticated)",
        "risk": "low",
        "notes": "Concrete developer and business tool limitations, open bugs, and requested enhancements"
    },
    {
        "id": "ddg_search",
        "name": "DuckDuckGo Live Search Engine",
        "type": "live_search",
        "signals": ["complaint", "intent", "workaround"],
        "pain_density": 6,
        "india_relevance": 7,
        "access": "ddgs SDK live queries",
        "risk": "medium (unofficial scraping, snippets)",
        "notes": "High discovery breadth; use for 'I wish there was', 'alternative to', and India gap queries"
    },
    {
        "id": "lobsters",
        "name": "Lobste.rs Infrastructure & Dev Community",
        "type": "technical_community",
        "signals": ["complaint", "workaround"],
        "pain_density": 5,
        "india_relevance": 2,
        "access": "public JSON API",
        "risk": "low",
        "notes": "Low volume but high technical signal for backend, DB, and DevOps pain"
    },
    {
        "id": "google_trends_rss",
        "name": "Google Trends Daily & Breakout Intent",
        "type": "search_demand",
        "signals": ["intent"],
        "pain_density": 3,
        "india_relevance": 8,
        "access": "official RSS feeds (geo=IN, geo=US)",
        "risk": "low",
        "notes": "Surfaces sudden interest surges and timing catalysts; news-skewed"
    },
    {
        "id": "product_hunt",
        "name": "Product Hunt Daily Launches",
        "type": "launches",
        "signals": ["supply"],
        "pain_density": 2,
        "india_relevance": 4,
        "access": "RSS feed",
        "risk": "low",
        "notes": "Use ONLY to verify existing competitors and supply, NEVER as proof of customer pain"
    },
    {
        "id": "betalist",
        "name": "BetaList Pre-Launches",
        "type": "launches",
        "signals": ["supply"],
        "pain_density": 2,
        "india_relevance": 3,
        "access": "RSS feed",
        "risk": "low",
        "notes": "Use ONLY for early competitor checks and supply validation"
    },
    {
        "id": "github_trending",
        "name": "GitHub Trending Repositories",
        "type": "adoption",
        "signals": ["supply"],
        "pain_density": 2,
        "india_relevance": 3,
        "access": "GitHub REST Search",
        "risk": "low",
        "notes": "Shows developer adoption & tooling supply, not raw user friction"
    },
    {
        "id": "rss_news",
        "name": "Curated Tech & Venture RSS (11 Feeds)",
        "type": "industry_news",
        "signals": ["spend", "timing", "supply"],
        "pain_density": 3,
        "india_relevance": 8,
        "access": "RSS (Inc42, Entrackr, YourStory, ET Startups, TechCrunch, YC Blog, Rest of World)",
        "risk": "low",
        "notes": "Provides macro spend context, corporate funding, and regulatory shifts in India"
    }
]

def get_source_catalog_dict() -> List[Dict[str, Any]]:
    return SOURCE_CATALOG
