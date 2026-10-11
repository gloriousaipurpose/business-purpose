import os
import sys
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app.config import settings
from app.db import Base, engine, SessionLocal, ensure_schema_columns
from app.models import Run, RawItem, Entity, Finding, OpportunityScore, Notification

def seed_database(force: bool = False):
    print("Creating database schema & ensuring columns...")
    Base.metadata.create_all(bind=engine)
    ensure_schema_columns()
    db = SessionLocal()

    # Clear tables if forced
    if force:
        print("Force mode enabled: Clearing all existing tables for a clean seed...")
        db.query(Notification).delete()
        db.query(OpportunityScore).delete()
        db.query(Finding).delete()
        db.query(Entity).delete()
        db.query(RawItem).delete()
        db.query(Run).delete()
        db.commit()
    elif db.query(Run).count() > 0:
        # Check if any findings are missing pain_point or sections
        existing_findings = db.query(Finding).all()
        needs_update = False
        for f in existing_findings:
            if not getattr(f, "pain_point", None) or not getattr(f, "action_plan", None):
                needs_update = True
                break

        section_counts = {sec: db.query(Finding).filter(Finding.section == sec).count() for sec in [
            "new_startups", "booming_products", "pain_points", "ai_opportunities", "emerging_trends", "india_gaps", "deep_research"
        ]}
        if any(c == 0 for c in section_counts.values()):
            needs_update = True

        if not needs_update:
            print("Database already contains complete data across all sections. Skipping seed.")
            db.close()
            return
        else:
            print("Refreshing sample database with complete 7-section findings, pain points, and action plans...")
            db.query(Notification).delete()
            db.query(OpportunityScore).delete()
            db.query(Finding).delete()
            db.query(Entity).delete()
            db.query(RawItem).delete()
            db.query(Run).delete()
            db.commit()

    print("Seeding sample analysis runs, entities, findings, scores, and notifications...")

    now = datetime.utcnow()
    two_days_ago = now - timedelta(days=2)

    # 1. Previous Run
    run1 = Run(
        started_at=two_days_ago,
        finished_at=two_days_ago + timedelta(minutes=4),
        run_type="automatic",
        sections=["new_startups", "booming_products", "pain_points", "india_gaps", "ai_opportunities", "emerging_trends", "deep_research"],
        status="completed",
        sources_checked=[
            {"name": "hackernews", "status": "ok", "items_count": 25, "error": None},
            {"name": "producthunt", "status": "ok", "items_count": 18, "error": None},
            {"name": "betalist", "status": "ok", "items_count": 14, "error": None},
            {"name": "lobsters", "status": "ok", "items_count": 15, "error": None},
            {"name": "duckduckgo_search", "status": "ok", "items_count": 20, "error": None},
            {"name": "reddit", "status": "ok", "items_count": 42, "error": None},
            {"name": "rss_sources", "status": "ok", "items_count": 30, "error": None}
        ],
        summary_text="[NEW_STARTUPS]: DevPulse AI and QuickBilling launched with strong initial developer traction.\n[PAIN_POINTS]: Recurring complaints regarding local GST compliance in SMB tools.\n[BOOMING_PRODUCTS]: Edge Database caching layers saw 250% star growth.\n[AI_OPPORTUNITIES]: Support ticket triage agent adoption surged.\n[EMERGING_TRENDS]: Rise of hyper-localized micro-SaaS in emerging economies.\n[INDIA_GAPS]: Vernacular compliance automation remains unsolved for tier-2 businesses.\n[DEEP_RESEARCH]: Global cross-border payments infrastructure transitioning to instant rails.",
        key_trends=["AI Workflow Automation", "Localized Indian Compliance SaaS", "Edge Data Synchronization"],
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
        run_type="automatic",
        sections=["all"],
        status="completed",
        sources_checked=[
            {"name": "hackernews", "status": "ok", "items_count": 28, "error": None},
            {"name": "producthunt", "status": "ok", "items_count": 20, "error": None},
            {"name": "betalist", "status": "ok", "items_count": 16, "error": None},
            {"name": "lobsters", "status": "ok", "items_count": 18, "error": None},
            {"name": "duckduckgo_search", "status": "ok", "items_count": 22, "error": None},
            {"name": "reddit", "status": "ok", "items_count": 55, "error": None},
            {"name": "googletrends", "status": "ok", "items_count": 15, "error": None},
            {"name": "github_trending", "status": "ok", "items_count": 12, "error": None},
            {"name": "rss_sources", "status": "ok", "items_count": 35, "error": None}
        ],
        summary_text=(
            "[NEW_STARTUPS]: WhatsApp Commerce OS & VoiceAI Agent suite gained 3x traction.\n"
            "[BOOMING_PRODUCTS]: FastEdge Cache grew 300% WoW with developers bypassing Redis latency.\n"
            "[PAIN_POINTS]: Severe SMB frustration regarding manual GSTR-2B purchase register matching.\n"
            "[AI_OPPORTUNITIES]: Autonomous AI support triage engines solving 60% repetitive B2B tickets.\n"
            "[EMERGING_TRENDS]: Shift from heavy SaaS platforms to single-workflow AI agents.\n"
            "[INDIA_GAPS]: Clear gap found in localized automated GST invoice auditing for tier-2 SMBs.\n"
            "[DEEP_RESEARCH]: UPI International rails create untapped export checkout opportunity for SaaS."
        ),
        key_trends=["WhatsApp Business Automation India", "Local AI Agents for Tier-2 Retail", "Edge Database Caching"],
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

    # Seed Entities
    entities_data = [
        ("DocuTranslate India", "india_gaps", "India", "Vernacular document translation & OCR for Indian legal & financial compliance.", 4),
        ("Automated GST Invoice Auditor", "pain_points", "India", "1-click GSTR-2B reconciliation and invoice mismatch detection engine for SMB accountants.", 3),
        ("WhatsApp Vernacular Voice Commerce", "new_startups", "India", "Voice-driven order booking and inventory tracking via WhatsApp for regional shopkeepers.", 5),
        ("FastEdge Redis Alternative", "booming_products", "Global", "Ultra-low latency serverless key-value edge cache with zero cold starts.", 3),
        ("ResolvePulse AI Triage", "ai_opportunities", "Global", "Autonomous customer support co-pilot resolving tier-1 ticket backlog with verified context.", 4),
        ("Micro-Compliance Agent Suite", "emerging_trends", "Global", "Lightweight single-purpose compliance bots replacing bloated monolithic ERPs.", 3),
        ("Cross-Border UPI SaaS Gateway", "deep_research", "India", "Instant settlement export gateway enabling global SaaS customers to pay via local UPI.", 4)
    ]

    ent_map = {}
    for name, cat, country, desc, app_count in entities_data:
        ent = db.query(Entity).filter(Entity.canonical_name == name).first()
        if not ent:
            ent = Entity(
                canonical_name=name,
                category=cat,
                country=country,
                description=desc,
                first_seen_run_id=run1.id,
                last_seen_run_id=run2.id,
                appearance_count=app_count
            )
            db.add(ent)
            db.commit()
            db.refresh(ent)
        else:
            ent.category = cat
            ent.description = desc
            ent.last_seen_run_id = run2.id
            ent.appearance_count = app_count
            db.commit()
        ent_map[name] = ent

    # Seed Findings for ALL 7 sections with pain_point and action_plan
    findings_data = [
        # 1. new_startups
        {
            "ent": "WhatsApp Vernacular Voice Commerce",
            "section": "new_startups",
            "kind": "startup",
            "title": "Vernacular Voice Order Booking via WhatsApp for Kirana Retailers",
            "summary": "Shopkeepers in Tier-2 Indian cities adopt voice-first WhatsApp tools to track daily orders without needing complex desktop POS software.",
            "pain_point": "Small store owners struggle with typing complex product catalogs on mobile and find existing desktop POS systems too slow.",
            "action_plan": "Build a lightweight WhatsApp Bot using Whisper transcription to parse vernacular audio messages into structured inventory receipts.",
            "evidence": [
                {"url": "https://news.ycombinator.com/item?id=38910123", "quote": "offline-first WhatsApp bot that lets shopkeepers log inventory via voice notes", "source": "hackernews"},
                {"url": "https://yourstory.com/whatsapp-commerce-tier2", "quote": "Tier-2 retailers process 80% of orders through voice messages", "source": "rss_yourstory"},
                {"url": "https://betalist.com/startups/voice-whatsapp-pos", "quote": "Voice AI assistant tailored for Indian regional accents launched in beta", "source": "betalist"}
            ],
            "confidence": "high",
            "source_count": 3
        },
        # 2. booming_products
        {
            "ent": "FastEdge Redis Alternative",
            "section": "booming_products",
            "kind": "product",
            "title": "FastEdge: High-Growth Distributed Edge Key-Value Cache",
            "summary": "Developers migrating away from managed Redis instances toward distributed edge caches with instant replication and predictable billing.",
            "pain_point": "Managed cloud Redis clusters are expensive ($100+/mo) and suffer cross-region latency spikes for globally distributed apps.",
            "action_plan": "Deploy a serverless edge KV cache with SQLite/WASM replication at 1/5th traditional cloud cluster cost.",
            "evidence": [
                {"url": "https://lobste.rs/s/fastedge-cache", "quote": "Replaced our $400/mo AWS Elasticache with FastEdge and cut p99 latency to 4ms", "source": "lobsters"},
                {"url": "https://github.com/trending", "quote": "FastEdge repo gained 1,200 stars this week in database systems", "source": "github_trending"},
                {"url": "https://techcrunch.com/category/startups/", "quote": "Developer tools targeting serverless data caching receive seed surge", "source": "rss_techcrunch"}
            ],
            "confidence": "high",
            "source_count": 3
        },
        # 3. pain_points
        {
            "ent": "Automated GST Invoice Auditor",
            "section": "pain_points",
            "kind": "pain_point",
            "title": "Manual GST Reconciliation Bottlenecks in Indian SMBs",
            "summary": "Indian accountants express intense recurring frustration over ITC mismatches between monthly GSTR-2B portal filings and internal ERP registers.",
            "pain_point": "Accountants waste 15-20 hours every month manually cross-matching supplier invoice numbers and tax IDs to avoid losing Input Tax Credits.",
            "action_plan": "Build a 1-click Chrome Extension or desktop tool that auto-downloads GSTR-2B and flags mismatches with Tally data in under 30 seconds.",
            "evidence": [
                {"url": "https://reddit.com/r/india/comments/12345/gst_reconciliation_nightmare", "quote": "I wish there was an automated AI tool that matched GSTR-2B with my purchase register in 1-click", "source": "reddit"},
                {"url": "https://entrackr.com/smb-software-gaps-2026", "quote": "SMBs lose up to 5% Input Tax Credit annually due to un-reconciled supplier invoices", "source": "rss_entrackr"}
            ],
            "confidence": "high",
            "source_count": 2
        },
        # 4. ai_opportunities
        {
            "ent": "ResolvePulse AI Triage",
            "section": "ai_opportunities",
            "kind": "ai_opportunity",
            "title": "Autonomous B2B Ticket Resolution & Triage Co-Pilot",
            "summary": "High commercial demand for AI co-pilots that connect to Zendesk and Jira to autonomously draft accurate technical responses using codebase documentation.",
            "pain_point": "Customer support engineering teams drown in repetitive 'how-to' queries and ticket escalations, causing 48-hour response delays.",
            "action_plan": "Develop a specialized RAG bot that ingests API docs and past solved tickets to auto-resolve tier-1 customer inquiries.",
            "evidence": [
                {"url": "https://www.producthunt.com/posts/resolvepulse-ai", "quote": "Resolves 65% of incoming technical SaaS tickets automatically without human intervention", "source": "producthunt"},
                {"url": "https://venturebeat.com/category/ai/", "quote": "Enterprise customer service automation budgets expanded 40% year-over-year", "source": "rss_venturebeat"},
                {"url": "https://duckduckgo.com/?q=ai+support+agent+saas", "quote": "B2B SaaS companies seek compliant AI support agents with deterministic guardrails", "source": "duckduckgo_search"}
            ],
            "confidence": "high",
            "source_count": 3
        },
        # 5. emerging_trends
        {
            "ent": "Micro-Compliance Agent Suite",
            "section": "emerging_trends",
            "kind": "trend",
            "title": "Rise of Single-Purpose Autonomous Compliance Micro-Agents",
            "summary": "Startups are disaggregating heavy GRC platforms into single-purpose automated compliance checkers for HIPAA, GDPR, and DPDP.",
            "pain_point": "Enterprises find monolithic compliance platforms bloated, expensive, and difficult to configure for modern cloud architectures.",
            "action_plan": "Create niche, vertical compliance bots with 1-click GitHub/AWS integration that continuously audit a single regulation.",
            "evidence": [
                {"url": "https://techcrunch.com/category/startups/", "quote": "Specialized single-agent compliance startups are outperforming all-in-one GRC suites", "source": "rss_techcrunch"},
                {"url": "https://news.ycombinator.com/item?id=38992011", "quote": "Nobody wants a $20k enterprise suite when an automated webhook script does the job", "source": "hackernews"},
                {"url": "https://www.lennysnewsletter.com/feed", "quote": "The bundling/unbundling cycle in enterprise software is shifting toward lightweight agents", "source": "rss_lennys"}
            ],
            "confidence": "high",
            "source_count": 3
        },
        # 6. india_gaps
        {
            "ent": "DocuTranslate India",
            "section": "india_gaps",
            "kind": "india_opportunity",
            "title": "Vernacular PDF Translation for Indian Enterprise Compliance",
            "summary": "Strong demand from Indian law firms, chartered accountants, and BFSI institutions for instant regional document translation while preserving exact layout.",
            "pain_point": "Law firms and auditors waste up to 40% of junior associate billable hours manually translating vernacular court filings and state gazettes into English.",
            "action_plan": "Build a specialized OCR + LLM translation pipeline tailored for Indian legal formats that outputs identical dual-language PDFs.",
            "evidence": [
                {"url": "https://www.producthunt.com/posts/docutranslate-ai", "quote": "DocuTranslate automatically translates complex legal PDFs across 12 Indian languages while preserving layout", "source": "producthunt"},
                {"url": "https://inc42.com/features/legaltech-india-growth", "quote": "Law firms in tier-2 hubs report 40% time wasted on manually translating vernacular filings", "source": "rss_inc42"},
                {"url": "https://reddit.com/r/IndiaStartups/comments/987/legaltech_ideas", "quote": "Looking for a tool that handles Hindi/Tamil PDF layout translation accurately", "source": "reddit"}
            ],
            "confidence": "high",
            "source_count": 3
        },
        # 7. deep_research
        {
            "ent": "Cross-Border UPI SaaS Gateway",
            "section": "deep_research",
            "kind": "india_opportunity",
            "title": "Cross-Border UPI Settlement Gateway for Global SaaS Exporters",
            "summary": "Indian software exports are surging, but foreign client checkout drop-offs remain high due to credit card international authorization failures.",
            "pain_point": "Global buyers in Southeast Asia and Middle East experience high credit card decline rates when paying Indian SaaS vendors via traditional Stripe/PayPal rails.",
            "action_plan": "Establish an instant settlement gateway leveraging NPCI International UPI rails to offer zero-decline localized bank checkouts.",
            "evidence": [
                {"url": "https://economictimes.indiatimes.com/tech/startups/", "quote": "UPI International expands to Singapore, UAE, and Europe offering instant merchant settlement", "source": "rss_et_startups"},
                {"url": "https://restofworld.org/feed/latest/", "quote": "Emerging cross-border payment corridors bypass credit card interchange fees", "source": "rss_rest_of_world"},
                {"url": "https://duckduckgo.com/?q=upi+cross+border+saas", "quote": "SaaS founders request low-fee direct cross-border payment solutions for international customers", "source": "duckduckgo_search"}
            ],
            "confidence": "high",
            "source_count": 3
        }
    ]

    for item in findings_data:
        ent = ent_map.get(item["ent"])
        f = Finding(
            run_id=run2.id,
            entity_id=ent.id if ent else None,
            section=item["section"],
            kind=item["kind"],
            title=item["title"],
            summary=item["summary"],
            pain_point=item["pain_point"],
            action_plan=item["action_plan"],
            evidence=item["evidence"],
            confidence=item["confidence"],
            source_count=item["source_count"],
            created_at=now
        )
        db.add(f)
    db.commit()

    # Seed Opportunity Scores
    scores_data = [
        (
            "DocuTranslate India", 88.0, 22.0, 14.0, 18.0, 12.0, 14.0, 8.0, "high",
            {
                "demand_growth": "Surge in legal tech evidence across 3 independent sources.",
                "proven_abroad": "Proven by DeepL and specialized legal translation SaaS in EU.",
                "india_gap": "Clear gap verified for Indian regional language layout retention.",
                "ease_to_build": "High; leverage OCR + LLM API pipeline.",
                "revenue_potential": "B2B SaaS subscription model per document translated.",
                "timing": "Optimal due to recent digital court mandate expansion in India."
            },
            [
                {"risk": "Data privacy regulations regarding sensitive legal files", "severity": "medium", "evidence": "Indian Digital Personal Data Protection Act compliance requirements."},
                {"risk": "OCR accuracy degradation on handwritten or poor quality scans", "severity": "high", "evidence": "Older court filings frequently use physical stamps and low-res scans."}
            ],
            [
                {"name": "Krutrim API", "url": "https://krutrim.ai", "how_close_a_match": "Base LLM model, not specialized document workflow."},
                {"name": "Reverie Language Tech", "url": "https://reverieinc.com", "how_close_a_match": "Partial match; focuses on web localization."}
            ],
            "Verified clear gap across 5 search query angles for document layout-preserving translation."
        ),
        (
            "WhatsApp Vernacular Voice Commerce", 84.0, 23.0, 10.0, 17.0, 11.0, 15.0, 8.0, "high",
            {
                "demand_growth": "High viral adoption signals among tier-2 shopkeepers.",
                "proven_abroad": "Conversational commerce validated in Latin America & Southeast Asia.",
                "india_gap": "Distinct Indian market opportunity given WhatsApp's 500M+ user base.",
                "ease_to_build": "Moderate; requires WhatsApp Cloud API & Whisper voice parsing.",
                "revenue_potential": "High recurring SaaS subscription per merchant store.",
                "timing": "Peak timing as retail digitalization expands into tier-3 hubs."
            },
            [{"risk": "WhatsApp Business API messaging costs", "severity": "medium", "evidence": "Meta per-conversation pricing model changes."}],
            [],
            "Clear gap for voice-first order booking."
        ),
        (
            "Automated GST Invoice Auditor", 82.0, 21.0, 13.0, 18.0, 12.0, 11.0, 7.0, "high",
            {
                "demand_growth": "Intense monthly recurring frustration from accountants.",
                "proven_abroad": "Validated by invoice reconciliation tools in US/EU.",
                "india_gap": "Clear gap; existing tools are bloated or tied to expensive enterprise ERPs.",
                "ease_to_build": "Fast; 1-click Chrome Extension or lightweight Python tool.",
                "revenue_potential": "Strong B2B subscription for accounting firms.",
                "timing": "Excellent as tax audit rules tighten."
            },
            [{"risk": "GST portal API changes or CAPTCHA updates", "severity": "medium", "evidence": "Government portal updates can break scrapers."}],
            [{"name": "ClearTax", "url": "https://cleartax.in", "how_close_a_match": "Enterprise focused, bloated and expensive for micro SMBs."}],
            "Clear gap for lightweight, fast 1-click reconciliation."
        ),
        (
            "FastEdge Redis Alternative", 79.0, 22.0, 15.0, 11.0, 10.0, 13.0, 8.0, "high",
            {
                "demand_growth": "Strong developer interest on GitHub and technical forums.",
                "proven_abroad": "Upstash and Cloudflare KV demonstrated massive demand.",
                "india_gap": "Global infra tool with high international developer demand.",
                "ease_to_build": "Challenging; requires robust distributed systems expertise.",
                "revenue_potential": "Usage-based cloud pricing ($0.20 per million requests).",
                "timing": "High as serverless and edge computing architectures expand."
            },
            [{"risk": "High developer trust barrier for mission-critical caching", "severity": "high", "evidence": "Developers hesitate to migrate production caches."}],
            [],
            "Global opportunity with developer traction."
        ),
        (
            "Cross-Border UPI SaaS Gateway", 86.0, 23.0, 11.0, 19.0, 9.0, 16.0, 8.0, "high",
            {
                "demand_growth": "Export SaaS from India is growing at 30% CAGR.",
                "proven_abroad": "Stripe/Adyen cross-border checkout models highly lucrative.",
                "india_gap": "Clear gap; UPI international export corridors are brand new.",
                "ease_to_build": "Regulatory heavy; requires NPCI & banking partner integrations.",
                "revenue_potential": "Transaction fee volume model (1.2% per international settlement).",
                "timing": "Breakthrough timing as bilateral government UPI treaties go live."
            },
            [{"risk": "Cross-border banking regulations and forex compliance", "severity": "high", "evidence": "RBI and international currency licensing requirements."}],
            [],
            "Huge untapped export checkout opportunity."
        )
    ]

    for name, tot, dg, pa, ig, eb, rp, ti, conf, just, risks, comps, s_notes in scores_data:
        ent = ent_map.get(name)
        if ent:
            sc = OpportunityScore(
                run_id=run2.id,
                entity_id=ent.id,
                total=tot,
                demand_growth=dg,
                proven_abroad=pa,
                india_gap=ig,
                ease_to_build=eb,
                revenue_potential=rp,
                timing=ti,
                confidence=conf,
                subscore_justifications=just,
                risks=risks,
                india_competitors_found=comps,
                search_notes=s_notes,
                created_at=now
            )
            db.add(sc)
    db.commit()

    # Seed Notification
    notif = Notification(
        run_id=run2.id,
        entity_id=ent_map["DocuTranslate India"].id,
        message=(
            "🔥 *New opportunity detected*\n"
            "Vernacular PDF Translation for Indian Enterprise Compliance\n\n"
            "India opportunity score: *88/100* | Confidence: *High*\n"
            "Evidence: *3 sources*\n"
            f"[View Analysis]({settings.FRONTEND_URL}/runs/{run2.id}?entity={ent_map['DocuTranslate India'].id})"
        ),
        score=88.0,
        sent_at=now,
        channel="telegram",
        delivered=True
    )
    db.add(notif)
    db.commit()
    db.close()

    print("Seed complete! All 7 sections, pain points, action plans, and scored opportunities are fully populated.")

if __name__ == "__main__":
    force_mode = "--force" in sys.argv
    seed_database(force=force_mode)
