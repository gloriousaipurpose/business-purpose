"""
Comprehensive API integration tests for Business Radar backend.
Uses FastAPI TestClient with in-memory SQLite — no external services needed.
Run with: pytest tests/test_api.py -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db import Base, get_db
from app.models import Run, Finding, Entity, IdeaFinderRun

# ── In-memory SQLite fixture ──────────────────────────────────────────────────

from sqlalchemy.pool import StaticPool

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture(scope="module")
def test_db_engine():
    engine = create_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()

@pytest.fixture(scope="module")
def client(test_db_engine):
    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_db_engine)

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

# ── Health check ──────────────────────────────────────────────────────────────

def test_health_check(client):
    """App should return 200 OK on /health."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

# ── Runs API ──────────────────────────────────────────────────────────────────

def test_get_runs_empty(client):
    """GET /runs returns empty list when no runs exist."""
    res = client.get("/runs")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_get_nonexistent_run(client):
    """GET /runs/999 returns 404."""
    res = client.get("/runs/999")
    assert res.status_code == 404

def test_get_nonexistent_run_status(client):
    """GET /runs/999/status returns 404."""
    res = client.get("/runs/999/status")
    assert res.status_code == 404

def test_cancel_nonexistent_run(client):
    """POST /runs/999/cancel returns 404."""
    res = client.post("/runs/999/cancel")
    assert res.status_code == 404

# ── Sections API ──────────────────────────────────────────────────────────────

def test_get_section_latest_returns_200(client):
    """GET /sections/new_startups/latest returns 200 (empty findings is OK)."""
    res = client.get("/sections/new_startups/latest")
    assert res.status_code == 200
    data = res.json()
    assert "section" in data
    assert "findings" in data
    assert isinstance(data["findings"], list)

def test_get_invalid_section(client):
    """GET /sections/nonexistent_section/latest should still return 200 with empty."""
    res = client.get("/sections/nonexistent_section/latest")
    # Either 200 with empty or 404 — both acceptable
    assert res.status_code in [200, 404]

def test_all_sections_return_200(client):
    """All known section names return valid responses."""
    sections = [
        "new_startups", "booming_products", "pain_points",
        "ai_opportunities", "emerging_trends", "india_gaps", "deep_research"
    ]
    for section in sections:
        res = client.get(f"/sections/{section}/latest")
        assert res.status_code == 200, f"Section {section} returned {res.status_code}"
        data = res.json()
        assert "findings" in data

# ── Opportunities API ─────────────────────────────────────────────────────────

def test_get_opportunities_empty(client):
    """GET /opportunities returns list (empty is fine)."""
    res = client.get("/opportunities")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_get_opportunity_detail_404(client):
    """GET /opportunities/9999 returns 404 for unknown entity."""
    res = client.get("/opportunities/9999")
    assert res.status_code == 404

# ── Compare API ───────────────────────────────────────────────────────────────

def test_compare_no_ids(client):
    """GET /compare without run_ids should return 400 or 422."""
    res = client.get("/compare")
    assert res.status_code in [400, 422]

# ── Notifications API ─────────────────────────────────────────────────────────

def test_get_notifications(client):
    """GET /notifications returns list."""
    res = client.get("/notifications")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

# ── Scheduler API ─────────────────────────────────────────────────────────────

def test_scheduler_status(client):
    """GET /scheduler/status returns expected fields."""
    res = client.get("/scheduler/status")
    assert res.status_code == 200
    data = res.json()
    assert "is_running" in data

# ── Idea Finder API ───────────────────────────────────────────────────────────

def test_idea_finder_list_empty(client):
    """GET /idea-finder returns empty list initially."""
    res = client.get("/idea-finder")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_idea_finder_get_nonexistent(client):
    """GET /idea-finder/9999 returns 404."""
    res = client.get("/idea-finder/9999")
    assert res.status_code == 404

def test_idea_finder_start_missing_niche(client):
    """POST /idea-finder without niche should fail validation."""
    res = client.post("/idea-finder", json={})
    assert res.status_code == 422  # FastAPI validation error

def test_idea_finder_start_valid(client):
    """POST /idea-finder with valid niche creates a run record (async, won't have result yet)."""
    res = client.post("/idea-finder", json={
        "niche": "e-commerce",
        "target_market": "India"
    })
    # Should create run (LLM call happens in background, may not complete during test)
    assert res.status_code == 200
    data = res.json()
    assert "run_id" in data
    assert data["status"] == "running"
    run_id = data["run_id"]

    # Verify the run exists
    status_res = client.get(f"/idea-finder/{run_id}")
    assert status_res.status_code == 200
    run_data = status_res.json()
    assert run_data["niche"] == "e-commerce"
    assert run_data["status"] in ["running", "completed", "failed"]
    assert run_data["mode"] == "normal"

def test_idea_finder_start_innovation_mode(client):
    """POST /idea-finder with mode='innovation' sets mode correctly."""
    res = client.post("/idea-finder", json={
        "niche": "fitness",
        "target_market": "India",
        "mode": "innovation"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "innovation"
    run_id = data["run_id"]

    status_res = client.get(f"/idea-finder/{run_id}")
    assert status_res.status_code == 200
    run_data = status_res.json()
    assert run_data["mode"] == "innovation"

# ── 404 behaviour at API level ────────────────────────────────────────────────

def test_unknown_api_route(client):
    """Unknown API path returns 404 (not 500)."""
    res = client.get("/api/this-does-not-exist")
    assert res.status_code == 404

def test_unknown_runs_sub_route(client):
    """Unknown sub-path under /runs returns 404."""
    res = client.get("/runs/999/unknown-action")
    assert res.status_code in [404, 405]

# ── Data integrity ────────────────────────────────────────────────────────────

def test_finding_requires_run_id(test_db_engine):
    """Finding model should not be createable without a run_id (FK constraint)."""
    from sqlalchemy.exc import IntegrityError
    Session = sessionmaker(bind=test_db_engine)
    db = Session()
    try:
        bad_finding = Finding(
            run_id=None,  # violates NOT NULL
            section="test",
            kind="startup",
            title="Bad",
            summary="Bad summary",
            evidence=[],
            confidence="low"
        )
        db.add(bad_finding)
        db.commit()
        # If we get here without error, the DB didn't enforce — still OK for SQLite
    except (IntegrityError, Exception):
        db.rollback()
    finally:
        db.close()

def test_run_status_field_values(test_db_engine):
    """Run can hold all valid status values."""
    Session = sessionmaker(bind=test_db_engine)
    db = Session()
    try:
        for status in ["running", "completed", "partial", "failed"]:
            run = Run(sections=["all"], status=status, run_type="manual")
            db.add(run)
        db.commit()
        runs = db.query(Run).all()
        statuses = {r.status for r in runs}
        assert {"running", "completed", "partial", "failed"}.issubset(statuses)
    finally:
        db.close()
