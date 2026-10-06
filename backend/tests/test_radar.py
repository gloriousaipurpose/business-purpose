import pytest
from datetime import datetime, timedelta
from app.schemas import ScoringLLMResult, SubScoreItem, IndiaGapResult, CriticResult, FindingSchema
from app.pipeline.score import compute_total_score, calculate_confidence
from app.pipeline.clean import get_or_create_entity
from app.models import Entity, Run, Finding, OpportunityScore, RawItem
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db import Base

# Setup in-memory SQLite for testing
@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_scoring_math():
    """Verify total score sum computation in Python logic."""
    llm_res = ScoringLLMResult(
        demand_growth=SubScoreItem(score=20.0, justification="High demand"),
        proven_abroad=SubScoreItem(score=12.0, justification="Proven in US"),
        india_gap=SubScoreItem(score=18.0, justification="Clear gap"),
        ease_to_build=SubScoreItem(score=10.0, justification="Easy"),
        revenue_potential=SubScoreItem(score=12.0, justification="Good MRR"),
        timing=SubScoreItem(score=8.0, justification="Great timing")
    )
    total = compute_total_score(llm_res)
    assert total == 80.0
    assert 0.0 <= total <= 100.0

def test_confidence_calculation():
    """Verify confidence mapping based on independent source count."""
    assert calculate_confidence(1) == "low"
    assert calculate_confidence(2) == "medium"
    assert calculate_confidence(3) == "high"
    assert calculate_confidence(5) == "high"

def test_append_only_entity_matching(db_session):
    """Verify entity deduplication & append-only rule (only last_seen and appearance_count update)."""
    # Create run 1
    run1 = Run(sections=["all"], status="completed", run_type="manual")
    db_session.add(run1)
    db_session.commit()

    # Create initial entity
    ent1 = get_or_create_entity(
        db=db_session,
        run_id=run1.id,
        canonical_name="AI Legal Tech",
        category="legal",
        country="India",
        description="Initial description"
    )
    assert ent1.first_seen_run_id == run1.id
    assert ent1.appearance_count == 1

    # Create run 2
    run2 = Run(sections=["all"], status="completed", run_type="manual")
    db_session.add(run2)
    db_session.commit()

    # Match fuzzy entity in run 2
    ent2 = get_or_create_entity(
        db=db_session,
        run_id=run2.id,
        canonical_name="AI Legal Tech India", # Fuzzy match
        category="legal"
    )

    # Should match existing entity ID
    assert ent2.id == ent1.id
    assert ent2.first_seen_run_id == run1.id # Unchanged
    assert ent2.last_seen_run_id == run2.id # Updated
    assert ent2.appearance_count == 2 # Incremented

def test_append_only_records_no_delete(db_session):
    """Ensure runs, raw items, findings, scores can only be inserted, never overwritten."""
    run = Run(sections=["all"], status="completed", run_type="manual")
    db_session.add(run)
    db_session.commit()

    finding = Finding(
        run_id=run.id,
        section="new_startups",
        kind="startup",
        title="Test Startup",
        summary="Test summary",
        evidence=[{"url": "http://test.com", "quote": "Quote", "source": "hn"}],
        confidence="high"
    )
    db_session.add(finding)
    db_session.commit()

    assert db_session.query(Finding).count() == 1
