from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db import Base

class Run(Base):
    __tablename__ = "runs"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at = Column(DateTime, nullable=True)
    run_type = Column(String, nullable=False, default="manual")  # manual | automatic
    sections = Column(JSON, nullable=False)  # list of section names
    status = Column(String, nullable=False, default="running")  # running | completed | partial | failed
    sources_checked = Column(JSON, nullable=False, default=list)  # list of {name, status, items_count, error}
    summary_text = Column(Text, nullable=True)
    key_trends = Column(JSON, nullable=True)
    changes_from_previous = Column(JSON, nullable=True)
    tokens_used = Column(Integer, default=0, nullable=False)
    estimated_cost = Column(Float, default=0.0, nullable=False)
    previous_run_id = Column(Integer, ForeignKey("runs.id"), nullable=True)

    raw_items = relationship("RawItem", back_populates="run", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="run", cascade="all, delete-orphan")
    scores = relationship("OpportunityScore", back_populates="run", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="run", cascade="all, delete-orphan")


class RawItem(Base):
    __tablename__ = "raw_items"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id"), nullable=False)
    source = Column(String, nullable=False, index=True)
    url = Column(String, nullable=False)
    title = Column(Text, nullable=False)
    text = Column(Text, nullable=False)
    published_at = Column(DateTime, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    run = relationship("Run", back_populates="raw_items")


class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    canonical_name = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, nullable=True)
    country = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    first_seen_run_id = Column(Integer, ForeignKey("runs.id"), nullable=False)
    last_seen_run_id = Column(Integer, ForeignKey("runs.id"), nullable=False)
    appearance_count = Column(Integer, default=1, nullable=False)

    findings = relationship("Finding", back_populates="entity")
    scores = relationship("OpportunityScore", back_populates="entity")
    notifications = relationship("Notification", back_populates="entity")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id"), nullable=False)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    section = Column(String, nullable=False, index=True)
    kind = Column(String, nullable=False)  # startup | product | pain_point | india_opportunity | trend | ai_opportunity
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=False, default=list)  # list of {url, quote, source}
    confidence = Column(String, nullable=False, default="medium")  # high | medium | low
    source_count = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    run = relationship("Run", back_populates="findings")
    entity = relationship("Entity", back_populates="findings")


class OpportunityScore(Base):
    __tablename__ = "opportunity_scores"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id"), nullable=False)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    total = Column(Float, nullable=False)  # 0-100 sum computed in Python
    demand_growth = Column(Float, nullable=False, default=0.0)  # 0-25
    proven_abroad = Column(Float, nullable=False, default=0.0)  # 0-15
    india_gap = Column(Float, nullable=False, default=0.0)  # 0-20
    ease_to_build = Column(Float, nullable=False, default=0.0)  # 0-15
    revenue_potential = Column(Float, nullable=False, default=0.0)  # 0-15
    timing = Column(Float, nullable=False, default=0.0)  # 0-10
    confidence = Column(String, nullable=False, default="medium")  # high | medium | low
    subscore_justifications = Column(JSON, nullable=True)  # dict of justification strings per metric
    risks = Column(JSON, nullable=True, default=list)  # critic output: list of {risk, severity, evidence}
    india_competitors_found = Column(JSON, nullable=True, default=list)
    search_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    run = relationship("Run", back_populates="scores")
    entity = relationship("Entity", back_populates="scores")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id"), nullable=False)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    message = Column(Text, nullable=False)
    score = Column(Float, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    channel = Column(String, nullable=False, default="telegram")
    delivered = Column(Boolean, default=True, nullable=False)

    run = relationship("Run", back_populates="notifications")
    entity = relationship("Entity", back_populates="notifications")
