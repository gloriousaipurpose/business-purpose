import os
import sys
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app.config import settings
from app.db import Base, engine, SessionLocal
from app.models import Run, RawItem, Entity, Finding, OpportunityScore, Notification

def seed_database():
    print("Creating database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if data already exists
    if db.query(Run).count() > 0:
        print("Database already contains data. Skipping seed.")
        db.close()
        return

    print("Seeding sample analysis runs, entities, findings, scores, and notifications...")

    now = datetime.utcnow()
    two_days_ago = now - timedelta(days=2)

    # 1. Previous Run
    run1 = Run(
        started_at=two_days_ago,
        finished_at=two_days_ago + timedelta(minutes=4),
        run_type="automatic",
        sections=["new_startups", "booming_products", "pain_points", "india_gaps", "ai_opportunities", "emerging_trends"],
        status="completed",
        sources_checked=[
            {"name": "hackernews", "status": "ok", "items_count": 25, "error": None},
            {"name": "producthunt", "status": "ok", "items_count": 18, "error": None},
            {"name": "reddit", "status": "ok", "items_count": 42, "error": None},
            {"name": "rss_sources", "status": "ok", "items_count": 30, "error": None}
        ],
        summary_text="[NEW_STARTUPS]: DevPulse AI and QuickBilling launched with strong initial developer traction.\n[PAIN_POINTS]: Recurring complaints regarding local GST compliance in SMB tools.",
        key_trends=["AI Workflow Automation", "Localized Indian Compliance SaaS"],
        tokens_used=4200,
        estimated_cost=0.0031
    )
    db.add(run1)
    db.commit()
    db.refresh(run1)

    # 2. Current Run
    run2 = Run(
        started_at=now - timedelta(hours=1),
        finished_at=now - timedelta(minutes=55),
        run_type="manual",
        sections=["all"],
        status="completed",
        sources_checked=[
            {"name": "hackernews", "status": "ok", "items_count": 28, "error": None},
            {"name": "producthunt", "status": "ok", "items_count": 20, "error": None},
            {"name": "reddit", "status": "ok", "items_count": 55, "error": None},
            {"name": "googletrends", "status": "ok", "items_count": 15, "error": None},
            {"name": "github_trending", "status": "ok", "items_count": 12, "error": None},
            {"name": "rss_sources", "status": "ok", "items_count": 35, "error": None}
        ],
        summary_text="[NEW_STARTUPS]: WhatsApp Commerce OS & VoiceAI Agent suite gained 3x traction.\n[INDIA_GAPS]: Clear gap found in localized automated GST invoice auditing for tier-2 SMBs.",
        key_trends=["WhatsApp Business Automation India", "Local AI Agents for Tier-2 Retail"],
        changes_from_previous={
            "new": [{"entity": "WhatsApp Voice AI Agent", "summary": "Conversational commerce agent"}],
            "score_up": [{"entity": "DocuTranslate India", "from": 72, "to": 88, "why": "3 new independent enterprise sources validated demand."}],
            "important_trends": ["Conversational Voice Agents in Vernacular Indian Languages"],
            "summary": "WhatsApp-first solutions and local GST compliance software saw the largest surge in demand scores."
        },
        tokens_used=8900,
        estimated_cost=0.0068,
        previous_run_id=run1.id
    )
    db.add(run2)
    db.commit()
    db.refresh(run2)

    # Seed Raw Items
    raw1 = RawItem(
        run_id=run2.id,
        source="producthunt",
        url="https://www.producthunt.com/posts/docutranslate-ai",
        title="DocuTranslate AI - Enterprise Document Translation",
        text="DocuTranslate automatically translates complex legal and financial PDFs across 12 Indian languages while preserving layout.",
        published_at=now - timedelta(hours=3)
    )
    raw2 = RawItem(
        run_id=run2.id,
        source="reddit",
        url="https://reddit.com/r/india/comments/12345/gst_reconciliation_nightmare",
        title="r/india: Why is GST reconciliation still so manual for SMBs?",
        text="I wish there was an automated AI tool that matched GSTR-2B with my purchase register in 1-click. Every tool out there is bloated.",
        published_at=now - timedelta(hours=5)
    )
    raw3 = RawItem(
        run_id=run2.id,
        source="hackernews",
        url="https://news.ycombinator.com/item?id=38910123",
        title="Show HN: WhatsApp Voice Agent for Tier-2 Kirana Stores",
        text="We built an offline-first WhatsApp bot that lets shopkeepers log inventory and process orders via vernacular voice notes.",
        published_at=now - timedelta(hours=4)
    )
    db.add_all([raw1, raw2, raw3])
    db.commit()

    # Seed Entities
    ent1 = Entity(
        canonical_name="DocuTranslate India",
        category="ai_opportunities",
        country="India",
        description="Vernacular document translation & OCR for Indian legal & financial compliance.",
        first_seen_run_id=run1.id,
        last_seen_run_id=run2.id,
        appearance_count=3
    )
    ent2 = Entity(
        canonical_name="Automated GST Invoice Auditor",
        category="india_gaps",
        country="India",
        description="1-click GSTR-2B reconciliation and invoice mismatch detection engine for SMB accountants.",
        first_seen_run_id=run2.id,
        last_seen_run_id=run2.id,
        appearance_count=2
    )
    ent3 = Entity(
        canonical_name="WhatsApp Vernacular Voice Commerce",
        category="new_startups",
        country="India",
        description="Voice-driven order booking and inventory tracking via WhatsApp for regional shopkeepers.",
        first_seen_run_id=run2.id,
        last_seen_run_id=run2.id,
        appearance_count=4
    )
    db.add_all([ent1, ent2, ent3])
    db.commit()
    db.refresh(ent1)
    db.refresh(ent2)
    db.refresh(ent3)

    # Seed Findings
    f1 = Finding(
        run_id=run2.id,
        entity_id=ent1.id,
        section="india_gaps",
        kind="india_opportunity",
        title="Vernacular PDF Translation for Indian Enterprise Compliance",
        summary="High demand from Indian law firms and tax consultants needing instant translation of regional court documents into English.",
        evidence=[
            {"url": "https://www.producthunt.com/posts/docutranslate-ai", "quote": "DocuTranslate automatically translates complex legal PDFs across 12 Indian languages", "source": "producthunt"},
            {"url": "https://inc42.com/features/legaltech-india-growth", "quote": "Law firms in tier-2 hubs report 40% time wasted on manually translating vernacular filings", "source": "rss_inc42"},
            {"url": "https://reddit.com/r/IndiaStartups/comments/987/legaltech_ideas", "quote": "Looking for a tool that handles Hindi/Tamil PDF layout translation accurately", "source": "reddit"}
        ],
        confidence="high",
        source_count=3
    )
    f2 = Finding(
        run_id=run2.id,
        entity_id=ent2.id,
        section="pain_points",
        kind="pain_point",
        title="Manual GST Reconciliation Bottlenecks in Indian SMBs",
        summary="Accountants express intense frustration over ITC mismatches between GSTR-2B and purchase registers.",
        evidence=[
            {"url": "https://reddit.com/r/india/comments/12345/gst_reconciliation_nightmare", "quote": "I wish there was an automated AI tool that matched GSTR-2B with my purchase register in 1-click", "source": "reddit"},
            {"url": "https://entrackr.com/smb-software-gaps-2026", "quote": "SMBs lose up to 5% Input Tax Credit annually due to un-reconciled supplier invoices", "source": "rss_entrackr"}
        ],
        confidence="medium",
        source_count=2
    )
    f3 = Finding(
        run_id=run2.id,
        entity_id=ent3.id,
        section="new_startups",
        kind="startup",
        title="Vernacular Voice Order Booking via WhatsApp",
        summary="Kirana shop owners adopt voice-to-text WhatsApp commerce tools over complex desktop POS systems.",
        evidence=[
            {"url": "https://news.ycombinator.com/item?id=38910123", "quote": "offline-first WhatsApp bot that lets shopkeepers log inventory via voice notes", "source": "hackernews"},
            {"url": "https://yourstory.com/whatsapp-commerce-tier2", "quote": "Tier-2 retailers process 80% of orders through voice messages", "source": "rss_yourstory"},
            {"url": "https://producthunt.com/posts/voice-whatsapp-pos", "quote": "Voice AI assistant tailored for Indian regional accents", "source": "producthunt"}
        ],
        confidence="high",
        source_count=3
    )
    db.add_all([f1, f2, f3])
    db.commit()

    # Seed Opportunity Scores
    s1_run1 = OpportunityScore(
        run_id=run1.id,
        entity_id=ent1.id,
        total=72.0,
        demand_growth=18.0,
        proven_abroad=12.0,
        india_gap=15.0,
        ease_to_build=10.0,
        revenue_potential=11.0,
        timing=6.0,
        confidence="medium",
        subscore_justifications={
            "demand_growth": "Moderate early signal from regional law firms.",
            "india_gap": "Partial gap; generic translation tools exist but ruin layout formatting."
        },
        created_at=two_days_ago
    )

    s1_run2 = OpportunityScore(
        run_id=run2.id,
        entity_id=ent1.id,
        total=88.0,
        demand_growth=22.0,
        proven_abroad=14.0,
        india_gap=18.0,
        ease_to_build=12.0,
        revenue_potential=14.0,
        timing=8.0,
        confidence="high",
        subscore_justifications={
            "demand_growth": "Surge in legal tech evidence across 3 independent sources.",
            "proven_abroad": "Proven by DeepL and specialized legal translation SaaS in EU.",
            "india_gap": "Clear gap verified for Indian regional language layout retention.",
            "ease_to_build": "High; leverage OCR + LLM API pipeline.",
            "revenue_potential": "B2B SaaS subscription model per document translated.",
            "timing": "Optimal due to recent digital court mandate expansion in India."
        },
        risks=[
            {"risk": "Data privacy regulations regarding sensitive legal files", "severity": "medium", "evidence": "Indian Digital Personal Data Protection Act compliance requirements."},
            {"risk": "OCR accuracy degradation on handwritten or poor quality scans", "severity": "high", "evidence": "Older court filings frequently use physical stamps and low-res scans."}
        ],
        india_competitors_found=[
            {"name": "Krutrim API", "url": "https://krutrim.ai", "how_close_a_match": "Base LLM model, not specialized document workflow."},
            {"name": "Reverie Language Tech", "url": "https://reverieinc.com", "how_close_a_match": "Partial match; focuses on web localization."}
        ],
        search_notes="Verified clear gap across 5 search query angles for document layout-preserving translation.",
        created_at=now
    )

    s2_run2 = OpportunityScore(
        run_id=run2.id,
        entity_id=ent3.id,
        total=84.0,
        demand_growth=23.0,
        proven_abroad=10.0,
        india_gap=17.0,
        ease_to_build=11.0,
        revenue_potential=15.0,
        timing=8.0,
        confidence="high",
        subscore_justifications={
            "demand_growth": "High viral adoption signals among tier-2 shopkeepers.",
            "india_gap": "Distinct Indian market opportunity given WhatsApp's 500M+ user base."
        },
        risks=[
            {"risk": "WhatsApp Business API messaging costs", "severity": "medium", "evidence": "Meta per-conversation pricing model changes."}
        ],
        india_competitors_found=[],
        search_notes="Clear gap for voice-first order booking.",
        created_at=now
    )

    db.add_all([s1_run1, s1_run2, s2_run2])
    db.commit()

    # Seed Notification
    notif = Notification(
        run_id=run2.id,
        entity_id=ent1.id,
        message=(
            "🔥 *New opportunity detected*\n"
            "Vernacular PDF Translation for Indian Enterprise Compliance\n\n"
            "India opportunity score: *88/100* | Confidence: *High*\n"
            "Evidence: *3 sources*\n"
            f"[View Analysis]({settings.FRONTEND_URL}/runs/{run2.id}?entity={ent1.id})"
        ),
        score=88.0,
        sent_at=now,
        channel="telegram",
        delivered=True
    )
    db.add(notif)
    db.commit()
    db.close()

    print("Seed complete! Sample data ready.")

if __name__ == "__main__":
    seed_database()
