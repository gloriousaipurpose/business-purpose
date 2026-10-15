import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, Sparkles, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, XCircle, Clock, Loader2, RotateCcw, Users, DollarSign,
  ShieldAlert, FlaskConical, TrendingUp, Globe, Zap, Target, BarChart3,
  Layers, Compass, Search, Filter, HelpCircle, ShieldCheck
} from 'lucide-react';
import { apiClient } from '../api/client';
import {
  TriangulatedPainPoint,
  PainRadarRun,
  PainRadarRunSummary,
  SourcePlanItem,
  SourcePerformanceRecord
} from '../types';

// ── Niches ───────────────────────────────────────────────────────────────────
const NICHES = [
  { id: 'e-commerce', label: 'E-Commerce & Retail', emoji: '🛒' },
  { id: 'software-saas', label: 'Software & SaaS', emoji: '💻' },
  { id: 'food-beverages', label: 'Food & Beverages', emoji: '🍽️' },
  { id: 'health-fitness', label: 'Health & Fitness', emoji: '🏃' },
  { id: 'education-edtech', label: 'Education & EdTech', emoji: '📚' },
  { id: 'finance-fintech', label: 'Finance & FinTech', emoji: '💰' },
  { id: 'sports', label: 'Sports & Athletics', emoji: '⚽' },
  { id: 'travel-hospitality', label: 'Travel & Hospitality', emoji: '✈️' },
  { id: 'real-estate', label: 'Real Estate & PropTech', emoji: '🏠' },
  { id: 'agriculture-agritech', label: 'Agriculture & AgriTech', emoji: '🌾' },
  { id: 'logistics-supply-chain', label: 'Logistics & Supply Chain', emoji: '🚚' },
  { id: 'healthcare-medtech', label: 'Healthcare & MedTech', emoji: '🏥' },
  { id: 'fashion-apparel', label: 'Fashion & Apparel', emoji: '👗' },
  { id: 'manufacturing', label: 'Manufacturing & SMBs', emoji: '🏭' },
  { id: 'marketing-adtech', label: 'Marketing & Agencies', emoji: '📣' },
  { id: 'ai-tools', label: 'AI Tools & Automation', emoji: '🤖' },
];

const signalBadgeStyles: Record<string, { label: string; style: string }> = {
  complaint: { label: 'Complaint', style: 'bg-rose-950/60 text-rose-300 border-rose-800/40' },
  workaround: { label: 'Workaround', style: 'bg-amber-950/60 text-amber-300 border-amber-800/40' },
  spend: { label: 'Spend Signal', style: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' },
  intent: { label: 'Search Intent', style: 'bg-purple-950/60 text-purple-300 border-purple-800/40' },
  supply: { label: 'Supply Check', style: 'bg-slate-900 text-slate-400 border-slate-700' },
};

const gapBadgeStyles: Record<string, string> = {
  open: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/40',
  narrow: 'bg-amber-950/60 text-amber-300 border-amber-700/40',
  closed: 'bg-slate-800 text-slate-300 border-slate-700',
};

// ── Single Triangulated Pain Card ─────────────────────────────────────────────
const TriangulatedPainCard: React.FC<{ p: TriangulatedPainPoint; index: number }> = ({ p, index }) => {
  const [expanded, setExpanded] = useState(false);
  const isVerified = (p.verification || '').toLowerCase() === 'verified';

  const scoreEntries = p.scores
    ? Object.entries(p.scores).map(([key, val]) => ({
        key,
        score: typeof val === 'object' && val !== null ? val.score ?? 0 : Number(val) || 0,
        reason: typeof val === 'object' && val !== null ? val.reason ?? '' : '',
      }))
    : [];

  return (
    <div className={`bg-[#181623] border rounded-xl overflow-hidden transition-all duration-200 ${
      isVerified ? 'border-emerald-600/40 shadow-sm shadow-emerald-950/30' : 'border-[#29253b] hover:border-[#3b3754]'
    }`}>
      <div className="p-4 sm:p-5">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border ${
              isVerified ? 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300' : 'bg-purple-900/40 border-purple-700/30 text-purple-300'
            }`}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase flex items-center gap-1 ${
                  isVerified
                    ? 'bg-emerald-900/60 text-emerald-200 border-emerald-500/60 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {isVerified ? <ShieldCheck className="w-3 h-3 text-emerald-400" /> : <HelpCircle className="w-3 h-3 text-slate-400" />}
                  {isVerified ? 'Verified Triangulated Pain' : 'Unverified Pain'}
                </span>

                <span className="text-[10px] text-[#7e7b99]">
                  {p.independent_sources || 1} independent source{p.independent_sources !== 1 ? 's' : ''} • {p.independent_authors || 1} authors
                </span>
              </div>

              <h3 className="text-white font-semibold text-sm sm:text-base leading-snug">
                {p.name}
              </h3>
              <p className="text-[#a19dbf] text-xs mt-1">
                <span className="text-purple-300 font-medium">Who Suffers:</span> {p.who_suffers}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-sm font-bold text-emerald-400">
              {p.total_score || 0}/70
            </span>
            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${gapBadgeStyles[p.gap_status?.toLowerCase()] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
              Gap: {p.gap_status || 'open'}
            </span>
          </div>
        </div>

        {/* Signals Found Row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(p.signal_types || []).map((sig, i) => {
            const conf = signalBadgeStyles[sig.toLowerCase()] || { label: sig, style: 'bg-slate-800 text-slate-300 border-slate-700' };
            return (
              <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${conf.style}`}>
                {conf.label}
              </span>
            );
          })}
        </div>

        {/* Situation & Workaround Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 bg-[#13111e] border border-[#29253b] rounded-xl p-3 sm:p-4">
          <div>
            <p className="text-[#7e7b99] text-[10px] font-semibold uppercase tracking-wider mb-1">
              Exact Situation & Friction
            </p>
            <p className="text-[#c9c5e8] text-xs leading-relaxed">{p.situation}</p>
            <p className="text-[#7e7b99] text-[11px] mt-1.5">
              <span className="text-rose-400 font-medium">Intensity:</span> {p.intensity}
            </p>
          </div>
          <div>
            <p className="text-amber-400 text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Current Workaround & Cost
            </p>
            <p className="text-white text-xs leading-relaxed font-medium">{p.workaround || 'Manual process / spreadsheets'}</p>
            <p className="text-emerald-400 text-[11px] mt-1.5 font-medium">
              Spend Evidence: {p.spend_evidence || 'None found'}
            </p>
          </div>
        </div>

        {/* Toggle details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-purple-300 hover:text-purple-200 text-[11px] font-medium transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Show less' : 'Show evidence quotes, existing solutions & score matrix'}
        </button>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-[#29253b] p-4 sm:p-5 space-y-4 bg-[#14121f]">
          {/* Quoted Evidence */}
          {p.evidence && p.evidence.length > 0 && (
            <div>
              <p className="text-[#a19dbf] text-[11px] font-semibold uppercase tracking-wider mb-2">
                Quoted Evidence & Source Citations
              </p>
              <div className="space-y-1.5">
                {p.evidence.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 bg-[#13111e] border border-[#29253b] rounded-lg p-2.5 text-xs">
                    <span className="text-purple-400 font-mono text-[10px] shrink-0 font-bold">[{ev.id}]</span>
                    <span className="text-[#a19dbf] italic leading-relaxed">"{ev.quote}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Solutions & Shortfalls */}
          {p.existing_solutions && p.existing_solutions.length > 0 && (
            <div>
              <p className="text-amber-300 text-[11px] font-semibold uppercase tracking-wider mb-2">
                Existing Tools & Why The Gap Remains
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {p.existing_solutions.map((sol, i) => (
                  <div key={i} className="bg-[#13111e] border border-[#29253b] rounded-lg p-2.5 text-xs">
                    <p className="text-white font-semibold mb-0.5">{sol.name}</p>
                    <p className="text-[#a19dbf] text-[11px] leading-tight">Misses: {sol.misses}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Matrix */}
          {scoreEntries.length > 0 && (
            <div>
              <p className="text-[#a19dbf] text-[11px] font-semibold uppercase tracking-wider mb-2">
                Analyst 7-Dimension Score Matrix (Total: {p.total_score}/70)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {scoreEntries.map(({ key, score, reason }) => (
                  <div key={key} className="flex items-start gap-2 bg-[#13111e] border border-[#29253b] rounded-lg p-2.5">
                    <span className="text-sm font-bold shrink-0 text-emerald-400">{score}/10</span>
                    <div>
                      <p className="text-[#a19dbf] text-[10px] font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-[#7e7b99] text-[10px] leading-tight">{reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bias notes */}
          {p.bias_notes && (
            <div className="text-[11px] text-[#7e7b99] bg-[#181623] border border-[#29253b] rounded-lg p-2.5">
              <span className="text-amber-400/90 font-semibold">Bias & Sampling Check: </span>
              {p.bias_notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Pain Points Radar Page ───────────────────────────────────────────────
export const PainRadarPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedNiche, setSelectedNiche] = useState('e-commerce');
  const [customNiche, setCustomNiche] = useState('');
  const [nicheNotes, setNicheNotes] = useState('');
  const [targetMarket, setTargetMarket] = useState('India');
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [pollingRunId, setPollingRunId] = useState<number | null>(null);
  const [viewedRun, setViewedRun] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pain_points' | 'strategist_plan' | 'sources_perf'>('pain_points');

  // List of past runs
  const { data: pastRuns, refetch: refetchList } = useQuery({
    queryKey: ['painRadarRuns'],
    queryFn: () => apiClient.listPainRadarRuns(),
    refetchInterval: pollingRunId ? 4000 : false,
  });

  // Active run polling
  const { data: activeRun } = useQuery({
    queryKey: ['painRadarRun', pollingRunId],
    queryFn: () => apiClient.getPainRadarRun(pollingRunId!),
    enabled: pollingRunId !== null,
    refetchInterval: (data: any) => {
      if (!data || data.status === 'running') return 3000;
      return false;
    },
  });

  // Source performance history
  const { data: sourcePerf } = useQuery({
    queryKey: ['sourcePerformance'],
    queryFn: () => apiClient.getSourcePerformance(),
  });

  useEffect(() => {
    if (activeRun?.status === 'completed' || activeRun?.status === 'failed') {
      setPollingRunId(null);
      setActiveRunId(activeRun.id);
      setViewedRun(activeRun);
      refetchList();
    }
    if (activeRun?.status === 'running') {
      setViewedRun(activeRun);
    }
  }, [activeRun?.status, activeRun?.id]);

  const startMutation = useMutation({
    mutationFn: () => {
      const niche = (selectedNiche === '__custom__' ? customNiche : selectedNiche).trim();
      if (!niche) throw new Error('Please select or specify a niche.');
      return apiClient.startPainRadar(niche, nicheNotes || undefined, targetMarket);
    },
    onSuccess: (data) => {
      setPollingRunId(data.run_id);
      setActiveRunId(null);
      setViewedRun(null);
      refetchList();
    },
  });

  const loadPastRun = async (id: number) => {
    setPollingRunId(null);
    setActiveRunId(id);
    setViewedRun(null);
    try {
      const run = await apiClient.getPainRadarRun(id);
      setViewedRun(run);
    } catch (e) {
      console.error('Failed to load past pain radar run', e);
    }
  };

  const displayedRun = viewedRun;
  const isRunning = pollingRunId !== null && activeRun?.status === 'running';

  const painPoints: TriangulatedPainPoint[] = (displayedRun?.result_json?.pain_points || []) as TriangulatedPainPoint[];
  const verifiedCount = painPoints.filter(p => (p.verification || '').toLowerCase() === 'verified').length;
  const unverifiedCount = painPoints.length - verifiedCount;
  const strategistPlan = displayedRun?.strategist_plan;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-600 to-purple-800 text-white shadow-md">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Pain Points Radar <span className="text-[10px] bg-rose-950 border border-rose-800 text-rose-300 px-2 py-0.5 rounded-full font-semibold uppercase">3-Stage Agentic Pipeline</span>
          </h2>
          <p className="text-[#7e7b99] text-xs">
            Strategist Agent decides where to search ➔ Python code collectors fetch raw text ➔ Skeptical Analyst triangulates 2+ sources & 2+ signals.
          </p>
        </div>
      </div>

      {/* Input Panel */}
      <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 sm:p-6 space-y-4">
        <div>
          <p className="text-[#a19dbf] text-xs font-semibold uppercase tracking-wider mb-2">
            Choose Niche To Scan For Acute Pain
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {NICHES.map(n => (
              <button
                key={n.id}
                onClick={() => { setSelectedNiche(n.id); setCustomNiche(''); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${
                  selectedNiche === n.id
                    ? 'bg-purple-900/50 border-purple-600/60 text-white shadow-sm'
                    : 'bg-[#13111e] border-[#29253b] text-[#a19dbf] hover:border-[#3b3754] hover:text-white'
                }`}
              >
                <span className="text-base shrink-0">{n.emoji}</span>
                <span className="truncate">{n.label}</span>
              </button>
            ))}
            <button
              onClick={() => setSelectedNiche('__custom__')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                selectedNiche === '__custom__'
                  ? 'bg-purple-900/50 border-purple-600/60 text-white'
                  : 'bg-[#13111e] border-[#29253b] text-[#a19dbf] hover:border-[#3b3754] hover:text-white'
              }`}
            >
              <span className="text-base shrink-0">✏️</span>
              <span>Custom…</span>
            </button>
          </div>

          {selectedNiche === '__custom__' && (
            <input
              type="text"
              placeholder="e.g. cloud kitchen operations, trucking compliance, local tutoring…"
              value={customNiche}
              onChange={e => setCustomNiche(e.target.value)}
              className="w-full mt-2 bg-[#13111e] border border-[#3b3754] rounded-lg px-3 py-2 text-white text-xs placeholder-[#7e7b99] focus:outline-none focus:border-purple-500"
            />
          )}
        </div>

        {/* Optional notes */}
        <div>
          <label className="text-[#7e7b99] text-[11px] font-medium mb-1 block">
            Optional Context (specific role, tier-2 India cities, budget limits)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Focus on SMB accountants dealing with GST reconciliations, budget under ₹2000/mo…"
            value={nicheNotes}
            onChange={e => setNicheNotes(e.target.value)}
            className="w-full bg-[#13111e] border border-[#29253b] rounded-lg px-3 py-2 text-white text-xs placeholder-[#7e7b99] focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {/* Target market & Launch Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-[#7e7b99] text-xs">Target Market:</span>
            <select
              value={targetMarket}
              onChange={e => setTargetMarket(e.target.value)}
              className="bg-[#13111e] border border-[#29253b] rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="India">India</option>
              <option value="Global">Global</option>
              <option value="India + Global">India + Global</option>
              <option value="US">United States</option>
            </select>
          </div>

          <button
            onClick={() => startMutation.mutate()}
            disabled={isRunning || startMutation.isPending || (!selectedNiche) || (selectedNiche === '__custom__' && !customNiche.trim())}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-700 via-purple-700 to-indigo-600 hover:from-rose-600 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
          >
            {isRunning || startMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Running 3-Stage Pipeline…</>
            ) : (
              <><Zap className="w-4 h-4 text-amber-300" /> Run Pain Points Radar</>
            )}
          </button>
        </div>
      </div>

      {/* Running State */}
      {isRunning && (
        <div className="bg-[#181623] border border-purple-700/40 rounded-xl p-6 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-300" />
          <p className="text-white font-semibold text-sm">
            Scanning for acute pain in "{displayedRun?.niche || (selectedNiche === '__custom__' ? customNiche : selectedNiche)}"…
          </p>
          <div className="flex flex-col gap-1 text-[#a19dbf] text-xs text-center max-w-md">
            <span>🧠 <b>Stage 1</b>: Strategist selecting 70/20/10 source portfolio & pain search queries</span>
            <span>⚡ <b>Stage 2</b>: Python code collectors fetching live text from Algolia HN, Reddit & GitHub</span>
            <span>🔍 <b>Stage 3</b>: Skeptical Analyst triangulating 2+ sources & 2+ signals</span>
          </div>
        </div>
      )}

      {/* Results View */}
      {displayedRun?.status === 'completed' && displayedRun.result_json && (
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-white font-bold text-sm capitalize">
                  Triangulated Pain Results for: <span className="text-purple-300">{displayedRun.niche}</span>
                </p>
                <p className="text-[#7e7b99] text-[11px]">
                  {displayedRun.target_market} • {displayedRun.collected_items_count || 0} raw items analyzed • {new Date(displayedRun.started_at).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-600/50 text-emerald-300 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> {verifiedCount} Verified
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  {unverifiedCount} Unverified
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-medium">
                  {painPoints.length} Total
                </span>
              </div>
            </div>

            {displayedRun.result_json.run_summary && (
              <p className="text-[#a19dbf] text-xs leading-relaxed border-t border-[#29253b] pt-3">
                {displayedRun.result_json.run_summary}
              </p>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-t border-[#29253b] pt-3 mt-3">
              <button
                onClick={() => setActiveTab('pain_points')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'pain_points'
                    ? 'bg-purple-900/60 text-white border border-purple-600/50'
                    : 'text-[#7e7b99] hover:text-white'
                }`}
              >
                Triangulated Pain Points ({painPoints.length})
              </button>
              <button
                onClick={() => setActiveTab('strategist_plan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'strategist_plan'
                    ? 'bg-purple-900/60 text-white border border-purple-600/50'
                    : 'text-[#7e7b99] hover:text-white'
                }`}
              >
                🧠 Strategist Plan & Blind Spots
              </button>
              <button
                onClick={() => setActiveTab('sources_perf')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'sources_perf'
                    ? 'bg-purple-900/60 text-white border border-purple-600/50'
                    : 'text-[#7e7b99] hover:text-white'
                }`}
              >
                📊 Source Scoreboard
              </button>
            </div>
          </div>

          {/* TAB 1: Pain Points Gallery */}
          {activeTab === 'pain_points' && (
            <div className="space-y-3">
              {painPoints.length > 0 ? (
                painPoints.map((p, i) => (
                  <TriangulatedPainCard key={i} p={p} index={i} />
                ))
              ) : (
                <div className="bg-[#181623] border border-[#29253b] rounded-xl p-8 text-center">
                  <XCircle className="w-10 h-10 text-[#7e7b99] mx-auto mb-2" />
                  <p className="text-white font-semibold text-sm">No corroborated pain points found</p>
                  <p className="text-[#7e7b99] text-xs">Try selecting a different niche or adding more context notes.</p>
                </div>
              )}

              {/* Data Gaps */}
              {displayedRun.result_json.data_gaps && (
                <div className="bg-[#181623] border border-amber-800/30 rounded-xl p-4">
                  <p className="text-amber-300 text-[11px] font-semibold uppercase tracking-wider mb-1">
                    ⚠️ Missing Evidence / Data Gaps
                  </p>
                  <p className="text-[#a19dbf] text-xs leading-relaxed">{displayedRun.result_json.data_gaps}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Strategist Plan & Blind Spots */}
          {activeTab === 'strategist_plan' && strategistPlan && (
            <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 sm:p-5 space-y-4">
              <div>
                <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
                  🧠 Strategist Pain Hypotheses
                </h3>
                <div className="space-y-1">
                  {(strategistPlan.pain_hypotheses || []).map((hypo: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 bg-[#13111e] border border-[#29253b] rounded-lg p-2.5 text-xs text-[#c9c5e8]">
                      <span className="text-purple-400 font-bold">•</span>
                      <span>{hypo}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
                  Source Portfolio Allocation (70% Proven / 20% Untested / 10% Exploratory)
                </h3>
                <div className="space-y-2">
                  {(strategistPlan.source_plan || []).map((sp: SourcePlanItem, i: number) => (
                    <div key={i} className="bg-[#13111e] border border-[#29253b] rounded-lg p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white uppercase text-[11px]">{sp.source}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-medium capitalize">
                            {sp.category}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                            {sp.signal_type}
                          </span>
                        </div>
                      </div>
                      <p className="text-[#a19dbf] text-[11px]">{sp.reason}</p>
                      {sp.queries && sp.queries.length > 0 && (
                        <div className="text-[10px] text-[#7e7b99]">
                          <span className="font-medium text-purple-400">Queries: </span>
                          {sp.queries.join(' • ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {strategistPlan.blind_spots && (
                <div className="bg-rose-950/20 border border-rose-900/30 rounded-lg p-3 text-xs">
                  <p className="text-rose-300 font-semibold text-[11px] uppercase tracking-wider mb-1">
                    Honest Blind Spots
                  </p>
                  <p className="text-[#d8b4c6] leading-relaxed">{strategistPlan.blind_spots}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Source Scoreboard & Learning Loop */}
          {activeTab === 'sources_perf' && (
            <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 sm:p-5 space-y-3">
              <div>
                <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-1">
                  Source Performance & Learning Scoreboard
                </h3>
                <p className="text-[#7e7b99] text-[11px]">
                  Tracks useful findings vs noise level over time so the Strategist agent makes smarter source allocations.
                </p>
              </div>

              {sourcePerf && sourcePerf.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#29253b] text-[#7e7b99] text-[10px] uppercase">
                        <th className="py-2 px-3">Source</th>
                        <th className="py-2 px-3">Niche</th>
                        <th className="py-2 px-3">Useful Findings</th>
                        <th className="py-2 px-3">Noise Level</th>
                        <th className="py-2 px-3">Last Run</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#29253b]">
                      {sourcePerf.map((sp: SourcePerformanceRecord) => (
                        <tr key={sp.id} className="hover:bg-[#13111e]">
                          <td className="py-2.5 px-3 font-semibold text-white">{sp.source}</td>
                          <td className="py-2.5 px-3 text-[#a19dbf] capitalize">{sp.niche}</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">{sp.useful_count}</td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-medium ${
                              sp.noise_level === 'low' ? 'text-emerald-400 border-emerald-800' :
                              sp.noise_level === 'high' ? 'text-rose-400 border-rose-800' : 'text-amber-400 border-amber-800'
                            }`}>
                              {sp.noise_level}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#7e7b99] text-[10px]">
                            {new Date(sp.last_run_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[#7e7b99] text-xs py-4 text-center">No source performance records yet. Runs will populate this table automatically.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Past Runs Drawer */}
      {pastRuns && pastRuns.length > 0 && (
        <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 sm:p-5">
          <p className="text-[#7e7b99] text-[11px] font-semibold uppercase tracking-wider mb-3">
            <Clock className="w-3.5 h-3.5 inline mr-1" /> Previous Pain Points Radar Runs
          </p>
          <div className="space-y-2">
            {pastRuns.map((r: PainRadarRunSummary) => (
              <button
                key={r.id}
                onClick={() => loadPastRun(r.id)}
                className={`w-full flex items-center justify-between gap-3 bg-[#13111e] border rounded-lg px-3 py-2.5 hover:border-[#3b3754] transition-colors text-left ${
                  (activeRunId === r.id || pollingRunId === r.id) ? 'border-purple-600/60' : 'border-[#29253b]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {r.status === 'completed' ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> :
                   r.status === 'running'   ? <Loader2 className="w-4 h-4 text-purple-300 animate-spin shrink-0" /> :
                                              <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold capitalize truncate">{r.niche}</p>
                    <p className="text-[#7e7b99] text-[10px]">
                      {r.target_market} • {r.verified_count} verified ({r.pain_points_count} total) • {new Date(r.started_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <RotateCcw className="w-3.5 h-3.5 text-[#7e7b99] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
