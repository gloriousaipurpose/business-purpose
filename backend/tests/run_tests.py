import unittest
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.schemas import ScoringLLMResult, SubScoreItem
from app.pipeline.score import compute_total_score, calculate_confidence
from app.pipeline.clean import get_or_create_entity
from app.models import Entity, Run, Finding, OpportunityScore
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db import Base

class TestRadarLogic(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.db = Session()

    def tearDown(self):
        self.db.close()

    def test_scoring_math(self):
        llm_res = ScoringLLMResult(
            demand_growth=SubScoreItem(score=20.0, justification="High demand"),
            proven_abroad=SubScoreItem(score=12.0, justification="Proven in US"),
            india_gap=SubScoreItem(score=18.0, justification="Clear gap"),
            ease_to_build=SubScoreItem(score=10.0, justification="Easy"),
            revenue_potential=SubScoreItem(score=12.0, justification="Good MRR"),
            timing=SubScoreItem(score=8.0, justification="Great timing")
        )
        total = compute_total_score(llm_res)
        self.assertEqual(total, 80.0)
        self.assertTrue(0.0 <= total <= 100.0)

    def test_confidence_calculation(self):
        self.assertEqual(calculate_confidence(1), "low")
        self.assertEqual(calculate_confidence(2), "medium")
        self.assertEqual(calculate_confidence(3), "high")
        self.assertEqual(calculate_confidence(5), "high")

    def test_append_only_entity_matching(self):
        run1 = Run(sections=["all"], status="completed", run_type="manual")
        self.db.add(run1)
        self.db.commit()

        ent1 = get_or_create_entity(
            db=self.db,
            run_id=run1.id,
            canonical_name="AI Legal Tech",
            category="legal",
            country="India",
            description="Initial description"
        )
        self.assertEqual(ent1.first_seen_run_id, run1.id)
        self.assertEqual(ent1.appearance_count, 1)

        run2 = Run(sections=["all"], status="completed", run_type="manual")
        self.db.add(run2)
        self.db.commit()

        ent2 = get_or_create_entity(
            db=self.db,
            run_id=run2.id,
            canonical_name="AI Legal Tech India", # Fuzzy match
            category="legal"
        )

        self.assertEqual(ent2.id, ent1.id)
        self.assertEqual(ent2.first_seen_run_id, run1.id)
        self.assertEqual(ent2.last_seen_run_id, run2.id)
        self.assertEqual(ent2.appearance_count, 2)

    def test_append_only_records_no_delete(self):
        run = Run(sections=["all"], status="completed", run_type="manual")
        self.db.add(run)
        self.db.commit()

        finding = Finding(
            run_id=run.id,
            section="new_startups",
            kind="startup",
            title="Test Startup",
            summary="Test summary",
            evidence=[{"url": "http://test.com", "quote": "Quote", "source": "hn"}],
            confidence="high"
        )
        self.db.add(finding)
        self.db.commit()

        self.assertEqual(self.db.query(Finding).count(), 1)

if __name__ == "__main__":
    unittest.main()
