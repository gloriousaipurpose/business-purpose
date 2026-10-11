# 🚀 Business Opportunity Radar — Master Product Blueprint & Intelligence Specification

> **Permanent Project Reference Document**: Refer to this document at the start of any conversation to understand the complete application architecture, commercial subscription model, evidence-first data pipelines, and feature roadmap without re-explaining the core idea.

---

## 🎯 1. Core Product Vision & Value Proposition

**Business Opportunity Radar** is a continuously running, evidence-backed market intelligence radar designed for entrepreneurs, indie hackers, investors, and product builders. 

Instead of generating hypothetical startup ideas with generic AI hallucinations, Radar:
1. **Scrapes and searches the live internet every 5 hours** across multiple high-signal platforms (DuckDuckGo live searches, BetaList, Lobste.rs, Hacker News, Product Hunt, Reddit, Google Trends, GitHub Trending, and 10+ curated venture/tech RSS feeds).
2. **Filters signal from noise**: Extracts distinct companies, products, unresolved complaints, and developer trends.
3. **Identifies the Core Friction & Actionable Solution**: In every analysis, it extracts:
   - 🚨 **The Pain Point**: The exact customer, operational, or workflow friction.
   - 💡 **What We Can Do (Action Plan)**: A concrete, actionable solution or micro-SaaS build concept that a founder can build and monetize immediately.
4. **Calculates India Market Gap Arbitrage**: Systematically checks whether a booming global concept has been successfully localized in India or if an untapped market gap exists.
5. **Applies Skeptical Critic Rigor**: Stress-tests each idea against regulatory barriers, unit economics, distribution moats, and saturation before scoring.
6. **Scores on a Transparent 0-100 Rubric**: Ranks opportunities with visible subscores (Demand Growth, Proven Abroad, India Gap, Ease to Build, Revenue Potential, Timing).
7. **Strict Append-Only Intelligence History**: Maintains an auditable timeline of past runs and differential shifts (what's new, what disappeared, what surged in demand).

---

## 💎 2. Commercial Subscription Monetization Plan

This product is engineered to be sold as a high-value B2B/Founder subscription (e.g., **$49/mo Starter**, **$149/mo Pro**, **$299/mo Syndicate/VC**):

| Tier | Features & Capabilities |
|---|---|
| **Free / Community** | Browse latest 24h opportunities, top 3 highest scored ideas, basic search and filters. |
| **Pro Founder ($49/mo)** | Full access to all 7 intelligence sections, access to complete historical analyses timeline, interactive side-by-side run comparison, instant Telegram/Email alerts on 80+ breakthrough opportunities. |
| **Builder / Agency ($149/mo)** | Custom Deep Research query engine (trigger on-demand targeted scans on custom keywords/niches), export reports to PDF/CSV, access to raw evidence quotes and verified India competitors. |
| **Enterprise / Investor ($299/mo)** | Real-time multi-source webhook feeds, automated market gap alerts, private portfolio monitoring, API access to scored entity history. |

---

## 🧭 3. The 7 Core Intelligence Sections

Every analysis run scans, extracts, and organizes findings into 7 dedicated sections:

1. 🚀 **New Startups (`new_startups`)**:
   - Fresh companies and beta products launched on HackerNews, Product Hunt, BetaList, TechCrunch.
   - Focus: What launched, product traction signals, pain point solved, and founder build playbook.

2. 📈 **Booming Products & Businesses (`booming_products`)**:
   - Products experiencing rapid inflection, GitHub star spikes, viral Reddit adoption, or breakout search velocity.
   - Focus: Quantifiable evidence of growth, migration away from incumbents, and how to ride the wave.

3. ⚠️ **Pain Points & Frustrations (`pain_points`)**:
   - Recurring complaints, broken workflows, manual spreadsheets, and customer dissatisfaction on Reddit, HN, and consumer reviews.
   - Focus: The core customer friction and the exact micro-SaaS or tool to build.

4. 🤖 **AI & Software Opportunities (`ai_opportunities`)**:
   - Manual, expensive, or tedious tasks newly solvable with autonomous agents, LLM pipelines, or modern APIs.
   - Focus: How a 1-2 person team can build and ship the solution in under 4 weeks.

5. 🌐 **Emerging Trends (`emerging_trends`)**:
   - Macro shifts across multiple data sources (e.g., unbundling of complex ERPs into single-workflow micro-agents).
   - Focus: The broader thematic pattern and where customer demand is heading over the next 12-24 months.

6. 🇮🇳 **India Market Gaps (`india_gaps`)**:
   - Proven business models abroad with weak, bloated, or non-existent Indian alternatives, especially targeting vernacular, GST/DPDP compliance, or Tier-2 retail.
   - Focus: Direct competitor verification and the localized playbook to win India.

7. 🔬 **Deep Research (`deep_research`)**:
   - On-demand or scheduled investigative reports on user-requested topics or frontier technological breakthroughs.
   - Focus: Market size, competing incumbents, regulatory hurdles, and execution feasibility.

---

## 📡 4. Data Sources Matrix

The collection pipeline aggregates and deduplicates data across diverse channels:

| Source | File / Method | Signal Captured |
|---|---|---|
| **DuckDuckGo Live Search** | `app/sources/duckduckgo_source.py` | Fresh open-web searches for pain points, bootstrapped launches, and Indian market gaps. |
| **BetaList** | `app/sources/betalist.py` | Early-stage pre-launch and newly submitted startups before they reach Product Hunt. |
| **Lobste.rs** | `app/sources/lobsters.py` | High-signal developer tooling, infrastructure shifts, and architecture discussions. |
| **Hacker News** | `app/sources/hackernews.py` | Show HN launches, Ask HN frustration threads, and high-karma tech discussions. |
| **Product Hunt** | `app/sources/producthunt.py` | Top daily products and launch metrics via API/RSS. |
| **Reddit** | `app/sources/reddit.py` | Unfiltered complaints and founder insights across r/SaaS, r/entrepreneur, r/startups, r/india, r/IndiaStartups. |
| **Google Trends** | `app/sources/googletrends.py` | Real-time and daily breakout search terms across India and Global regions. |
| **GitHub Trending** | `app/sources/github_trending.py` | Open-source repositories gaining viral stars and developer traction. |
| **Curated Tech & Business RSS** | `app/sources/rss_sources.py` | Inc42, Entrackr, YourStory, ET Startups, TechCrunch Startups, VentureBeat AI, YC Blog, Indie Hackers, Lenny's Newsletter, ShowDev, Rest of World. |

---

## ⚖️ 5. Transparent 0-100 Scoring Rubric

Every candidate entity is evaluated through a strict 6-dimensional rubric:

1. **Demand & Growth (0-25 pts)**: Strength of search volume, community upvotes, and customer requests across independent sources.
2. **Proven Abroad (0-15 pts)**: Clear precedent of commercial viability or venture backing in US, Europe, or other international markets.
3. **India Market Gap (0-20 pts)**: Verified absence of direct local Indian competitors (penalized if local market is already saturated).
4. **Ease to Build (0-15 pts)**: Can a lean team launch an MVP in 3-6 weeks using modern APIs, LLMs, and low-code/cloud infrastructure?
5. **Revenue Potential (0-15 pts)**: Viability of charging subscription MRR, take-rate, or transaction fees with healthy margins.
6. **Market Timing (0-10 pts)**: Recent technological, regulatory, or macroeconomic catalysts making this idea timely today.

- **Total Score**: 0-100 sum computed deterministically in code.
- **Confidence Rating**:
  - `High`: Backed by 3+ independent source domains.
  - `Medium`: Backed by 2 independent source domains.
  - `Low`: Backed by 1 source domain.
- **Instant Alerts**: Opportunities scoring **80+** automatically trigger instant notification dispatches (Telegram/Webhook).

---

## ⚙️ 6. System Architecture & Operation

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLite (default local) or PostgreSQL with SQLAlchemy 2.0 and Alembic. Strict **append-only** schema for runs, findings, raw items, and scores.
- **Background Scheduler**: APScheduler running in async mode every 5 hours (`RUN_INTERVAL_HOURS=5`), with smart startup catch-up that triggers an immediate run if the last scan was $\ge 5$ hours ago.
- **AI Engine**: Groq SDK multi-key rotating pool using `llama-3.3-70b-versatile` with automatic fallback to `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, and `gemma2-9b-it`.

### Frontend
- **Framework**: React 18, Vite, TypeScript, Tailwind CSS.
- **State & Caching**: TanStack Query v5 with automatic background polling and optimistic UI updates.
- **Features**:
  - Glassmorphic dark aesthetic (`#181623` base, `#29253b` borders, purple/violet highlights).
  - Advanced Filter Bar on Section, Opportunities, and Timeline pages (text query, confidence, score thresholds, sectors, and custom sort order).
  - Side-by-side comparative diff engine across historical runs.
  - Score Breakdown Modal with subscore justifications, competitor findings, and skeptical critic risk analysis.

---

## 🛠️ 7. How to Maintain & Extend

1. **Adding a New Data Source**:
   - Create `app/sources/my_source.py` inheriting from `Source` in `app/sources/base.py`.
   - Register it in `app/sources/sources.yaml`.
   - Instantiate it in `app/pipeline/collect.py` inside `load_source_plugins()`.

2. **Starting the System**:
   - Double-click `run_all.bat` or run:
     - Backend: `start_backend.bat` (`uvicorn app.main:app --reload --port 8000`)
     - Frontend: `start_frontend.bat` (`npm run dev` at `http://localhost:5173`)

3. **Seeding & Resetting Data**:
   - `python seed.py --force` (populates all 7 sections with fresh findings, pain points, action plans, and scores).
