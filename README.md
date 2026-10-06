# Business Opportunity Radar 🚀

A continuously updating, evidence-first business intelligence system. It collects real data from the internet, finds new startups, booming products, pain points, and Global ➔ India market gaps, scores them using a transparent visible rubric (0-100), records all analysis runs in an append-only database, and notifies you only on high-confidence breakthroughs.

---

## 🏗️ Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic, SQLite / PostgreSQL, APScheduler (IntervalTrigger), Groq SDK (Llama 3.3 70B), Pydantic v2, Tenacity retries, DuckDuckGo Search, RapidFuzz deduplication.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Router v6, TanStack Query v5, Recharts, Lucide Icons.

---

## ⚡ Quick Start Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd radar/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment example file
cp .env.example .env

# Edit .env and set your GROQ_API_KEY
# GROQ_API_KEY=gsk_your_actual_groq_key

# Run Alembic Database Migrations
alembic upgrade head

# Seed initial sample data for UI demonstration
python seed.py

# Run Unit Tests
pytest tests/test_radar.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

Backend will be live at `http://127.0.0.1:8000`. API docs available at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory in a new terminal
cd radar/frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```

Dashboard will open at `http://localhost:5173`.

---

## 🔑 Required & Optional API Keys

| API Key / Setting | Required? | Where to get it | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | **Required** | [Groq Console](https://console.groq.com) | Free tier available; powers JSON extraction, analysis, critic, and scoring. |
| `GROQ_MODEL` | Optional | Default: `llama-3.3-70b-versatile` | Configurable in `.env`. |
| `PRODUCTHUNT_TOKEN` | Optional | [Product Hunt API](https://www.producthunt.com/v2/oauth/applications) | If missing, automatically falls back to PH RSS feed. |
| `REDDIT_CLIENT_ID` / `SECRET` | Optional | [Reddit Apps](https://www.reddit.com/prefs/apps) | If missing, uses public Reddit JSON endpoint with User-Agent. |
| `TELEGRAM_BOT_TOKEN` | Optional | [BotFather on Telegram](https://t.me/BotFather) | For instant mobile alerts on 80+ score opportunities. |
| `TELEGRAM_CHAT_ID` | Optional | Get via `@userinfobot` | Telegram chat/channel target ID. |

---

## 🔌 How to Add a New Source Plugin

1. Create a new class inheriting from `Source` in `app/sources/`:

```python
# app/sources/my_custom_source.py
from typing import List
from app.sources.base import Source, RawItemData

class MyCustomSource(Source):
    name = "my_custom_source"

    async def fetch(self) -> List[RawItemData]:
        # Implement fetching logic using httpx or SDK
        return [
            RawItemData(
                source=self.name,
                url="https://example.com/item/1",
                title="Example Item Title",
                text="Detailed raw text content...",
                published_at=datetime.utcnow()
            )
        ]
```

2. Add your source entry to `app/sources/sources.yaml`:

```yaml
sources:
  - name: my_custom_source
    enabled: true
    type: my_custom_source
```

3. Register the type instantiation in `app/pipeline/collect.py` under `load_source_plugins()`.

---

## 🧪 Append-Only Guarantee & Rules

- **Runs, Raw Items, Findings, and Opportunity Scores** are strictly **append-only**.
- No `UPDATE` or `DELETE` operations are executed on findings or score history.
- Only entity tracking fields (`entities.last_seen_run_id` and `appearance_count`) are updated upon deduplication.
