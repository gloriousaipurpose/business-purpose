from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# ==================== LLM OUTPUT SCHEMAS ====================

class ExtractedItem(BaseModel):
    name: str = Field(..., description="Name of startup, product, business, or pain point concept")
    kind: str = Field(..., description="One of: startup, product, pain_point, india_opportunity, trend, ai_opportunity")
    one_line_description: str = Field(..., description="Short summary of what it is")
    category: Optional[str] = None
    country_of_origin: Optional[str] = None
    date: Optional[str] = None
    source_url: str = Field(..., description="Exact URL of the source raw item")
    supporting_quote: str = Field(..., description="Exact supporting quote from raw text, max 25 words")


class ExtractedItemsList(BaseModel):
    items: List[ExtractedItem] = Field(default_factory=list)


class EvidenceItem(BaseModel):
    url: str
    quote: str
    source: str


class FindingSchema(BaseModel):
    canonical_name: str
    title: str
    summary: str
    kind: str
    section: str
    evidence: List[EvidenceItem] = Field(default_factory=list)
    confidence: str = Field(default="medium", description="high, medium, or low")


class SectionAnalysisResult(BaseModel):
    findings: List[FindingSchema] = Field(default_factory=list)
    summary: str = Field(default="No significant findings in this data.")


class IndiaGapCompetitor(BaseModel):
    name: str
    url: Optional[str] = None
    how_close_a_match: str


class IndiaGapResult(BaseModel):
    competitors_found: List[IndiaGapCompetitor] = Field(default_factory=list)
    queries_used: List[str] = Field(default_factory=list)
    conclusion: str = Field(..., description="clear_gap | partial_gap | saturated | unclear")
    reasoning: str


class CriticRisk(BaseModel):
    risk: str
    severity: str = Field(..., description="low | medium | high")
    evidence: Optional[str] = None


class CriticResult(BaseModel):
    top_risks: List[CriticRisk] = Field(default_factory=list)
    verdict: str = Field(..., description="proceed | proceed_with_caution | avoid")
    one_line_summary: str


class SubScoreItem(BaseModel):
    score: float = Field(..., description="Sub-score value")
    justification: str = Field(..., description="One-sentence justification citing evidence")


class ScoringLLMResult(BaseModel):
    demand_growth: SubScoreItem
    proven_abroad: SubScoreItem
    india_gap: SubScoreItem
    ease_to_build: SubScoreItem
    revenue_potential: SubScoreItem
    timing: SubScoreItem


class ScoreUpItem(BaseModel):
    entity: str
    from_score: float = Field(alias="from")
    to_score: float = Field(alias="to")
    why: str

    model_config = {"populate_by_name": True}


class ScoreDownItem(BaseModel):
    entity: str
    from_score: float = Field(alias="from")
    to_score: float = Field(alias="to")
    why: str

    model_config = {"populate_by_name": True}


class RepeatedItem(BaseModel):
    entity: str
    times_seen: int


class DiffResult(BaseModel):
    new: List[Dict[str, Any]] = Field(default_factory=list)
    disappeared: List[Dict[str, Any]] = Field(default_factory=list)
    score_up: List[Dict[str, Any]] = Field(default_factory=list)
    score_down: List[Dict[str, Any]] = Field(default_factory=list)
    repeated: List[Dict[str, Any]] = Field(default_factory=list)
    important_trends: List[str] = Field(default_factory=list)
    summary: str = Field(default="No significant changes.")


# ==================== API REQUEST / RESPONSE SCHEMAS ====================

class RunCreateRequest(BaseModel):
    sections: List[str] = Field(..., description="List of section keys or ['all']")
    topic: Optional[str] = Field(None, description="Topic for Deep Research if section is deep_research")


class SourceCheckedSchema(BaseModel):
    name: str
    status: str  # ok | skipped | failed
    items_count: int = 0
    error: Optional[str] = None


class RunResponse(BaseModel):
    id: int
    started_at: datetime
    finished_at: Optional[datetime] = None
    run_type: str
    sections: List[str]
    status: str
    sources_checked: List[SourceCheckedSchema] = Field(default_factory=list)
    summary_text: Optional[str] = None
    key_trends: Optional[List[str]] = None
    changes_from_previous: Optional[Dict[str, Any]] = None
    tokens_used: int
    estimated_cost: float
    previous_run_id: Optional[int] = None

    model_config = {"from_attributes": True}


class RunStatusResponse(BaseModel):
    id: int
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    sources_checked: List[SourceCheckedSchema]
    findings_count: int
    progress_percentage: int


class EntityResponse(BaseModel):
    id: int
    canonical_name: str
    category: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    first_seen_run_id: int
    last_seen_run_id: int
    appearance_count: int

    model_config = {"from_attributes": True}


class FindingResponse(BaseModel):
    id: int
    run_id: int
    entity_id: Optional[int] = None
    section: str
    kind: str
    title: str
    summary: str
    evidence: List[EvidenceItem]
    confidence: str
    source_count: int
    created_at: datetime
    entity_name: Optional[str] = None

    model_config = {"from_attributes": True}


class OpportunityScoreResponse(BaseModel):
    id: int
    run_id: int
    entity_id: int
    total: float
    demand_growth: float
    proven_abroad: float
    india_gap: float
    ease_to_build: float
    revenue_potential: float
    timing: float
    confidence: str
    subscore_justifications: Optional[Dict[str, str]] = None
    risks: Optional[List[Dict[str, Any]]] = None
    india_competitors_found: Optional[List[Dict[str, Any]]] = None
    search_notes: Optional[str] = None
    created_at: datetime
    entity_name: Optional[str] = None
    entity_category: Optional[str] = None
    entity_description: Optional[str] = None

    model_config = {"from_attributes": True}


class NotificationResponse(BaseModel):
    id: int
    run_id: int
    entity_id: int
    message: str
    score: float
    sent_at: datetime
    channel: str
    delivered: bool

    model_config = {"from_attributes": True}


class SchedulerStatusResponse(BaseModel):
    is_running: bool
    is_paused: bool
    next_run_time: Optional[str] = None
    run_interval_hours: int
    timezone: str


class CompareResponse(BaseModel):
    run_ids: List[int]
    diff: Dict[str, Any]
