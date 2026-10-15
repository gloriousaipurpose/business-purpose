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

export interface IdeaFinderRun {
  id: number;
  niche: string;
  niche_notes?: string;
  target_market: string;
  status: 'running' | 'completed' | 'failed';
  result_json?: {
    niche: string;
    run_summary: string;
    findings: IdeaFinderFinding[];
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
  status: string;
  findings_count: number;
  run_summary: string;
  started_at: string;
  finished_at?: string;
}

