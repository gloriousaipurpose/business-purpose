export interface EvidenceItem {
  url: string;
  quote: string;
  source: string;
}

export interface Finding {
  id: number;
  run_id: number;
  entity_id?: number;
  entity_name?: string;
  section: string;
  kind: string;
  title: string;
  summary: string;
  pain_point?: string;
  action_plan?: string;
  evidence: EvidenceItem[];
  confidence: 'high' | 'medium' | 'low';
  score?: number;
  source_count: number;
  likes: number;
  created_at: string;
}

export interface IndiaCompetitor {
  name: string;
  url?: string;
  how_close_a_match: string;
}

export interface RiskItem {
  risk: string;
  severity: 'low' | 'medium' | 'high';
  evidence?: string;
}

export interface OpportunityScore {
  id: number;
  run_id: number;
  entity_id: number;
  entity_name?: string;
  entity_category?: string;
  entity_description?: string;
  total: number;
  demand_growth: number;
  proven_abroad: number;
  india_gap: number;
  ease_to_build: number;
  revenue_potential: number;
  timing: number;
  confidence: 'high' | 'medium' | 'low';
  subscore_justifications?: Record<string, string>;
  risks?: RiskItem[];
  india_competitors_found?: IndiaCompetitor[];
  search_notes?: string;
  created_at: string;
}

export interface SourceChecked {
  name: string;
  status: 'ok' | 'skipped' | 'failed';
  items_count: number;
  error?: string;
}

export interface Run {
  id: number;
  started_at: string;
  finished_at?: string;
  run_type: 'manual' | 'automatic';
  sections: string[];
  status: 'running' | 'completed' | 'partial' | 'failed';
  sources_checked: SourceChecked[];
  summary_text?: string;
  key_trends?: string[];
  changes_from_previous?: any;
  tokens_used: number;
  estimated_cost: number;
  previous_run_id?: number;
}

export interface NotificationItem {
  id: number;
  run_id: number;
  entity_id: number;
  entity_name?: string;
  message: string;
  score: number;
  sent_at: string;
  channel: string;
  delivered: boolean;
}

export interface SchedulerStatus {
  is_running: boolean;
  is_paused: boolean;
  next_run_time?: string;
  run_interval_hours: number;
  timezone: string;
}

export interface CompareEntitySummary {
  entity_id: number;
  name: string;
  category?: string;
  appearance_count: number;
  first_score: number;
  last_score: number;
}

export interface CompareResult {
  run_ids: number[];
  runs_meta: {
    id: number;
    started_at: string;
    run_type: string;
    status: string;
    findings_count: number;
  }[];
  comparison: {
    new: CompareEntitySummary[];
    disappeared: CompareEntitySummary[];
    more_important: CompareEntitySummary[];
    repeating: CompareEntitySummary[];
  };
}

// ── Idea Finder ──────────────────────────────────────────────────────────────

export interface IdeaScore {
  score: number;
  reason: string;
}

export interface IdeaFinderFinding {
  pain_point: string;
  who_suffers: string;
  type: string;
  evidence: { id: string; quote: string }[];
  existing_solutions: { name: string; strength: string; weakness: string }[];
  gap_status: 'open' | 'narrow' | 'closed';
  idea: string;
  target_user: string;
  who_pays: string;
  risks: string[];
  cheapest_validation_test: string;
  scores: {
    pain_intensity: IdeaScore;
    payment_evidence: IdeaScore;
    competition_gap: IdeaScore;
    reachability: IdeaScore;
    defensibility: IdeaScore;
    india_fit: IdeaScore;
    timing: IdeaScore;
  };
  total_score: number;
  confidence: 'low' | 'medium' | 'high';
  change_vs_previous: string;
}

export interface LoveSignalEvidence {
  id: string;
  quote: string;
}

export interface LoveSignal {
  signal: string;
  root_desire: string;
  strength: 'high' | 'medium' | 'low' | string;
  evidence: LoveSignalEvidence[];
}

export interface NoveltyEvidence {
  found: string;
  url_or_id: string;
}

export interface InnovationFeasibility {
  first_version: string;
  hardest_part: string;
  needs: string;
}

export interface InnovationScores {
  strength_of_love_signal?: IdeaScore;
  improvement_over_current?: IdeaScore;
  novelty?: IdeaScore;
  feasibility?: IdeaScore;
  willingness_to_pay?: IdeaScore;
  defensibility?: IdeaScore;
  india_fit?: IdeaScore;
  [key: string]: IdeaScore | undefined;
}

export interface InnovationItem {
  idea: string;
  linked_love_signal: string;
  target_user: string;
  how_served_today: string;
  what_is_better: string;
  lens_used: string;
  novelty: 'new' | 'partial' | 'exists' | string;
  novelty_evidence: NoveltyEvidence[];
  feasibility: InnovationFeasibility;
  who_pays: string;
  risks: string[];
  validation_test: string;
  scores: InnovationScores;
  total_score: number;
  confidence: 'low' | 'medium' | 'high' | string;
  change_vs_previous: string;
}

export interface IdeaFinderRun {
  id: number;
  niche: string;
  niche_notes?: string;
  target_market: string;
  mode?: 'normal' | 'innovation';
  status: 'running' | 'completed' | 'failed';
  result_json?: {
    niche: string;
    mode?: 'normal' | 'innovation';
    run_summary: string;
    findings?: IdeaFinderFinding[];
    love_signals?: LoveSignal[];
    innovations?: InnovationItem[];
    rejected_ideas: { idea: string; reason: string }[];
    data_gaps: string;
  };
  error_text?: string;
  started_at: string;
  finished_at?: string;
}

export interface IdeaFinderRunSummary {
  id: number;
  niche: string;
  niche_notes?: string;
  target_market: string;
  mode?: 'normal' | 'innovation';
  status: string;
  findings_count: number;
  run_summary: string;
  started_at: string;
  finished_at?: string;
}

// ── Pain Points Radar Dedicated Pipeline Types ───────────────────────────────

export interface PainEvidenceItem {
  id: string;
  quote: string;
}

export interface PainSolutionItem {
  name: string;
  misses: string;
}

export interface PainPointScoreItem {
  score: number;
  reason: string;
}

export interface TriangulatedPainPoint {
  name: string;
  who_suffers: string;
  situation: string;
  evidence: PainEvidenceItem[];
  independent_sources: number;
  independent_authors: number;
  intensity: string;
  workaround: string;
  spend_evidence: string;
  signal_types: string[]; // complaint, workaround, spend, intent
  trend: 'growing' | 'steady' | 'fading' | string;
  existing_solutions: PainSolutionItem[];
  gap_status: 'open' | 'narrow' | 'closed' | string;
  bias_notes?: string;
  scores: {
    intensity?: PainPointScoreItem;
    frequency?: PainPointScoreItem;
    payment_evidence?: PainPointScoreItem;
    workaround_cost?: PainPointScoreItem;
    trend?: PainPointScoreItem;
    gap_openness?: PainPointScoreItem;
    india_relevance?: PainPointScoreItem;
    [key: string]: PainPointScoreItem | undefined;
  };
  total_score: number;
  verification: 'verified' | 'unverified' | string;
  confidence: 'low' | 'medium' | 'high' | string;
  change_vs_previous?: string;
}

export interface SourcePlanItem {
  source: string;
  signal_type: string;
  reason: string;
  scores?: Record<string, any>;
  category: 'proven' | 'untested' | 'exploratory' | string;
  queries: string[];
  filters: Record<string, any>;
  max_items: number;
}

export interface StrategistPlan {
  pain_hypotheses: string[];
  source_plan: SourcePlanItem[];
  signal_coverage: Record<string, number>;
  blind_spots: string;
  expected_cost: string;
}

export interface SourceFeedbackItem {
  source: string;
  useful: number;
  noise: 'low' | 'medium' | 'high' | string;
}

export interface PainRadarRun {
  id: number;
  niche: string;
  niche_notes?: string;
  target_market: string;
  status: 'running' | 'completed' | 'failed';
  strategist_plan?: StrategistPlan;
  collected_items_count: number;
  result_json?: {
    niche: string;
    run_summary: string;
    pain_points: TriangulatedPainPoint[];
    discarded: { item: string; reason: string }[];
    source_feedback: SourceFeedbackItem[];
    data_gaps: string;
  };
  verified_count?: number;
  error_text?: string;
  started_at: string;
  finished_at?: string;
}

export interface PainRadarRunSummary {
  id: number;
  niche: string;
  niche_notes?: string;
  target_market: string;
  status: string;
  pain_points_count: number;
  verified_count: number;
  run_summary: string;
  started_at: string;
  finished_at?: string;
}

export interface SourcePerformanceRecord {
  id: number;
  source: string;
  niche: string;
  items_collected: number;
  useful_count: number;
  noise_level: string;
  last_run_at: string;
}

