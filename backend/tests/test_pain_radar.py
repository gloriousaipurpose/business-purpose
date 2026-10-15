import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db import Base, get_db
from app.models import PainPointRun, SourcePerformance

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

def test_pain_radar_list_empty(client):
    res = client.get("/pain-radar")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_pain_radar_get_nonexistent(client):
    res = client.get("/pain-radar/99999")
    assert res.status_code == 404

def test_pain_radar_start_missing_niche(client):
    res = client.post("/pain-radar", json={})
    assert res.status_code == 422

def test_pain_radar_start_valid(client):
    res = client.post("/pain-radar", json={
        "niche": "e-commerce",
        "niche_notes": "Tier 2 India focus",
        "target_market": "India"
    })
    assert res.status_code == 200
    data = res.json()
    assert "run_id" in data
    assert data["status"] == "running"
    run_id = data["run_id"]

    status_res = client.get(f"/pain-radar/{run_id}")
    assert status_res.status_code == 200
    run_data = status_res.json()
    assert run_data["niche"] == "e-commerce"
    assert run_data["status"] in ["running", "completed", "failed"]

def test_sources_performance_endpoint(client):
    res = client.get("/pain-radar/sources/performance")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
