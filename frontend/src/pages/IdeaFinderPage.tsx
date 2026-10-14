import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Lightbulb, Sparkles, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, XCircle, Clock, Loader2, RotateCcw, Users, DollarSign,
  ShieldAlert, FlaskConical, TrendingUp, Globe, Zap, Target, BarChart3
} from 'lucide-react';
import { apiClient } from '../api/client';
import { IdeaFinderFinding, IdeaFinderRunSummary } from '../types';

// ── Niche list (comprehensive) ────────────────────────────────────────────────
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
  { id: 'beauty-personal-care', label: 'Beauty & Personal Care', emoji: '💄' },
  { id: 'media-entertainment', label: 'Media & Entertainment', emoji: '🎬' },
  { id: 'film-production', label: 'Film & Content Production', emoji: '🎥' },
  { id: 'event-management', label: 'Event Management', emoji: '🎪' },
  { id: 'hr-recruiting', label: 'HR & Recruiting', emoji: '👥' },
  { id: 'legal-legaltech', label: 'Legal & LegalTech', emoji: '⚖️' },
  { id: 'marketing-adtech', label: 'Marketing & AdTech', emoji: '📣' },
  { id: 'manufacturing', label: 'Manufacturing & D2C Products', emoji: '🏭' },
  { id: 'gaming', label: 'Gaming & Esports', emoji: '🎮' },
  { id: 'climate-sustainability', label: 'Climate & Sustainability', emoji: '🌿' },
  { id: 'pets', label: 'Pets & Animal Care', emoji: '🐾' },
  { id: 'kids-parenting', label: 'Kids & Parenting', emoji: '👶' },
  { id: 'wedding-planning', label: 'Wedding & Life Events', emoji: '💍' },
  { id: 'home-interior', label: 'Home & Interior Design', emoji: '🛋️' },
  { id: 'automotive', label: 'Automotive & EVs', emoji: '🚗' },
  { id: 'freelance-gig', label: 'Freelance & Gig Economy', emoji: '🤝' },
  { id: 'ai-tools', label: 'AI Tools & Automation', emoji: '🤖' },
  { id: 'cybersecurity', label: 'Cybersecurity', emoji: '🔐' },
  { id: 'religion-spirituality', label: 'Religion & Spirituality', emoji: '🙏' },
  { id: 'government-civic', label: 'Government & Civic Tech', emoji: '🏛️' },
  { id: 'social-media', label: 'Social Media & Creator Economy', emoji: '📱' },
];

// ── Score badge colours ───────────────────────────────────────────────────────
const gapColor: Record<string, string> = {
  open: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/40',
  narrow: 'bg-amber-900/40 text-amber-300 border border-amber-700/40',
  closed: 'bg-red-900/40 text-red-300 border border-red-700/40',
};

const confidenceColor: Record<string, string> = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-red-400',
};

const scoreColor = (s: number) =>
  s >= 8 ? 'text-emerald-400' : s >= 5 ? 'text-amber-400' : 'text-red-400';

// ── Single Finding Card ───────────────────────────────────────────────────────
const IdeaCard: React.FC<{ f: IdeaFinderFinding; index: number }> = ({ f, index }) => {
  const [expanded, setExpanded] = useState(false);

  const scoreEntries = f.scores
    ? Object.entries(f.scores).map(([key, val]) => ({ key, ...(val as any) }))
    : [];

  return (
    <div className="bg-[#181623] border border-[#29253b] hover:border-[#3b3754] rounded-xl overflow-hidden transition-colors">
      {/* Card Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-purple-900/40 border border-purple-700/30 flex items-center justify-center text-purple-300 font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-snug mb-1">{f.pain_point}</p>
              <p className="text-[#7e7b99] text-[11px]">{f.who_suffers}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold ${scoreColor(f.total_score / 10)}`}>
                {f.total_score}/70
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${gapColor[f.gap_status] || 'bg-[#29253b] text-[#a19dbf]'}`}>
                {f.gap_status}
              </span>
            </div>
            <span className={`text-[10px] font-semibold uppercase ${confidenceColor[f.confidence]}`}>
              {f.confidence} confidence
            </span>
          </div>
        </div>

        {/* The Idea */}
        <div className="bg-purple-950/30 border border-purple-800/30 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-1.5 text-purple-300 text-[11px] font-semibold mb-1">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>The Idea</span>
          </div>
          <p className="text-purple-100 text-xs leading-relaxed">{f.idea}</p>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          <div className="bg-[#13111e] border border-[#29253b] rounded-lg p-2.5">
            <div className="flex items-center gap-1 text-[#7e7b99] text-[10px] mb-0.5">
              <Users className="w-3 h-3" /> Who uses it
            </div>
            <p className="text-white text-xs leading-snug truncate">{f.target_user}</p>
          </div>
          <div className="bg-[#13111e] border border-[#29253b] rounded-lg p-2.5">
            <div className="flex items-center gap-1 text-[#7e7b99] text-[10px] mb-0.5">
              <DollarSign className="w-3 h-3" /> Who pays
            </div>
            <p className="text-white text-xs leading-snug truncate">{f.who_pays}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-[#13111e] border border-[#29253b] rounded-lg p-2.5">
            <div className="flex items-center gap-1 text-[#7e7b99] text-[10px] mb-0.5">
              <FlaskConical className="w-3 h-3" /> Cheapest test
            </div>
            <p className="text-white text-xs leading-snug">{f.cheapest_validation_test}</p>
          </div>
        </div>

        {/* Type badge */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] bg-[#29253b] border border-[#3b3754] text-[#a19dbf] px-2 py-0.5 rounded-full">
            {f.type}
          </span>
          <span className="text-[10px] bg-[#29253b] border border-[#3b3754] text-[#a19dbf] px-2 py-0.5 rounded-full">
            {f.change_vs_previous}
          </span>
        </div>

        {/* Expand/Collapse toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-purple-300 hover:text-purple-200 text-[11px] font-medium transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Show less' : 'Show scores, risks & competition'}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-[#29253b] p-4 sm:p-5 space-y-4">

          {/* Score Breakdown */}
          {scoreEntries.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[#a19dbf] text-[11px] font-semibold mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-purple-300" /> Score Breakdown
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {scoreEntries.map(({ key, score, reason }) => (
                  <div key={key} className="flex items-start gap-2 bg-[#13111e] border border-[#29253b] rounded-lg p-2.5">
                    <span className={`text-sm font-bold shrink-0 ${scoreColor(score)}`}>{score}/10</span>
                    <div>
                      <p className="text-[#a19dbf] text-[10px] font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-[#7e7b99] text-[10px]">{reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {f.risks && f.risks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-rose-300 text-[11px] font-semibold mb-2">
                <ShieldAlert className="w-3.5 h-3.5" /> Why This Might Fail
              </div>
              <div className="space-y-1.5">
                {f.risks.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[#d8b4c6] bg-[#24131e] border border-[#481c35] rounded-lg p-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competition */}
          {f.existing_solutions && f.existing_solutions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-semibold mb-2">
                <Target className="w-3.5 h-3.5" /> Existing Competition
              </div>
              <div className="space-y-1.5">
                {f.existing_solutions.map((s, i) => (
                  <div key={i} className="bg-[#13111e] border border-[#29253b] rounded-lg p-3">
                    <p className="text-white text-xs font-semibold mb-1">{s.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-emerald-400 text-[10px] font-medium">✓ Does well</p>
                        <p className="text-[#a19dbf] text-[10px]">{s.strength}</p>
                      </div>
                      <div>
                        <p className="text-rose-400 text-[10px] font-medium">✗ Weakness</p>
                        <p className="text-[#a19dbf] text-[10px]">{s.weakness}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          {f.evidence && f.evidence.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[#a19dbf] text-[11px] font-semibold mb-2">
                <Globe className="w-3.5 h-3.5 text-purple-300" /> Evidence Sources
              </div>
              <div className="space-y-1.5">
                {f.evidence.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] bg-[#13111e] border border-[#29253b] rounded-lg p-2.5">
                    <span className="text-purple-400 font-mono shrink-0">[{ev.id}]</span>
                    <span className="text-[#a19dbf] italic">"{ev.quote}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export const IdeaFinderPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedNiche, setSelectedNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [nicheNotes, setNicheNotes] = useState('');
  const [targetMarket, setTargetMarket] = useState('India');
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [pollingRunId, setPollingRunId] = useState<number | null>(null);
  const [viewedRun, setViewedRun] = useState<any>(null);

  // list of past runs
  const { data: pastRuns, refetch: refetchList } = useQuery({
    queryKey: ['ideaRuns'],
    queryFn: () => apiClient.listIdeaRuns(),
    refetchInterval: pollingRunId ? 4000 : false,
  });

  // active run status
  const { data: activeRun, refetch: refetchActive } = useQuery({
    queryKey: ['ideaRun', pollingRunId],
    queryFn: () => apiClient.getIdeaRun(pollingRunId!),
    enabled: pollingRunId !== null,
    refetchInterval: (data: any) => {
      if (!data) return 3000;
      if (data?.status === 'running') return 3000;
      return false;
    },
  });

  // When active run finishes, stop polling and show result
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
      if (!niche) throw new Error('Please select or type a niche first.');
      return apiClient.startIdeaFinder(niche, nicheNotes || undefined, targetMarket);
    },
    onSuccess: (data) => {
      setPollingRunId(data.run_id);
      setActiveRunId(null);
      setViewedRun(null);
      refetchList();
    },
  });

  const displayedRun = viewedRun;
  const isRunning = pollingRunId !== null && activeRun?.status === 'running';
  const findings: IdeaFinderFinding[] = (displayedRun?.result_json?.findings || []) as IdeaFinderFinding[];
  const rejectedIdeas = (displayedRun?.result_json?.rejected_ideas || []) as { idea: string; reason: string }[];
  const niche = displayedRun?.niche || '';

  const openCount = findings.filter((f: IdeaFinderFinding) => f.gap_status === 'open').length;
  const narrowCount = findings.filter((f: IdeaFinderFinding) => f.gap_status === 'narrow').length;

  // ── Load a past run and show its results ──────────────────────────────────
  const loadPastRun = async (id: number) => {
    setPollingRunId(null);
    setActiveRunId(id);
    setViewedRun(null); // clear while loading
    try {
      const run = await apiClient.getIdeaRun(id);
      setViewedRun(run);
    } catch (e) {
      console.error('Failed to load past run', e);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-purple-900/40 border border-purple-700/30">
          <Lightbulb className="w-5 h-5 text-purple-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Idea Finder</h2>
          <p className="text-[#7e7b99] text-xs">Pick a niche — get real, validated gap ideas. No hype, no fluff.</p>
        </div>
      </div>

      {/* Input Panel */}
      <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 sm:p-6 space-y-4">
        <p className="text-[#a19dbf] text-xs font-medium uppercase tracking-wider">Choose Your Niche</p>

        {/* Niche Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {NICHES.map(n => (
            <button
              key={n.id}
              onClick={() => { setSelectedNiche(n.id); setCustomNiche(''); }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${
                selectedNiche === n.id
                  ? 'bg-purple-900/50 border-purple-600/60 text-white'
                  : 'bg-[#13111e] border-[#29253b] text-[#a19dbf] hover:border-[#3b3754] hover:text-white'
              }`}
            >
              <span className="text-base shrink-0">{n.emoji}</span>
              <span className="truncate">{n.label}</span>
            </button>
          ))}
          {/* Custom option */}
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

        {/* Custom niche input */}
        {selectedNiche === '__custom__' && (
          <input
            type="text"
            placeholder="e.g. wedding photography, drone delivery, vernacular content…"
            value={customNiche}
            onChange={e => setCustomNiche(e.target.value)}
            className="w-full bg-[#13111e] border border-[#3b3754] rounded-lg px-3 py-2 text-white text-xs placeholder-[#7e7b99] focus:outline-none focus:border-purple-500"
          />
        )}

        {/* Optional notes */}
        <div>
          <label className="text-[#7e7b99] text-[11px] font-medium mb-1 block">
            Optional: Add context (city, budget, user type, etc.)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. focusing on tier-2 Indian cities, budget under ₹500/month users…"
            value={nicheNotes}
            onChange={e => setNicheNotes(e.target.value)}
            className="w-full bg-[#13111e] border border-[#29253b] rounded-lg px-3 py-2 text-white text-xs placeholder-[#7e7b99] focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {/* Target market */}
        <div className="flex items-center gap-3">
          <label className="text-[#7e7b99] text-[11px] font-medium shrink-0">Target market:</label>
          <select
            value={targetMarket}
            onChange={e => setTargetMarket(e.target.value)}
            className="bg-[#13111e] border border-[#29253b] rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="India">India</option>
            <option value="Global">Global</option>
            <option value="India + Global">India + Global</option>
            <option value="Southeast Asia">Southeast Asia</option>
            <option value="US">United States</option>
          </select>
        </div>

        {/* Error */}
        {startMutation.isError && (
          <p className="text-rose-400 text-xs">
            {(startMutation.error as any)?.message || 'Something went wrong.'}
          </p>
        )}

        {/* Start button */}
        <button
          onClick={() => startMutation.mutate()}
          disabled={isRunning || startMutation.isPending || (!selectedNiche) || (selectedNiche === '__custom__' && !customNiche.trim())}
          className="flex items-center justify-center gap-2 w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg"
        >
          {isRunning || startMutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</>
            : <><Sparkles className="w-4 h-4" /> Find Real Ideas in This Niche</>
          }
        </button>
      </div>

      {/* Running state */}
      {isRunning && (
        <div className="bg-[#181623] border border-purple-700/40 rounded-xl p-6 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-300" />
          <p className="text-white font-semibold text-sm">Analysing "{niche || (selectedNiche === '__custom__' ? customNiche : selectedNiche)}"…</p>
          <p className="text-[#7e7b99] text-xs text-center max-w-xs">
            The AI is playing skeptical analyst — finding real pain points, checking competition, red-teaming ideas. Usually takes 30–60 seconds.
          </p>
        </div>
      )}

      {/* Results */}
      {displayedRun?.status === 'completed' && displayedRun.result_json && (
        <div className="space-y-4">
          {/* Summary Bar */}
          <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-white font-semibold text-sm capitalize">
                  Results for: <span className="text-purple-300">{displayedRun.niche}</span>
                </p>
                <p className="text-[#7e7b99] text-[11px]">{displayedRun.target_market} • {new Date(displayedRun.started_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-700/30 font-semibold">{openCount} open gaps</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700/30 font-semibold">{narrowCount} narrow</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#29253b] text-[#a19dbf] border border-[#3b3754] font-semibold">{findings.length} total</span>
              </div>
            </div>
            {displayedRun.result_json.run_summary && (
              <p className="text-[#a19dbf] text-xs leading-relaxed border-t border-[#29253b] pt-3">
                {displayedRun.result_json.run_summary}
              </p>
            )}
          </div>

          {/* Findings */}
          {findings.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[#7e7b99] text-[11px] font-medium uppercase tracking-wider">
                {findings.length} Validated Gap{findings.length !== 1 ? 's' : ''} — sorted by gap status
              </p>
              {([...findings] as IdeaFinderFinding[])
                .sort((a: IdeaFinderFinding, b: IdeaFinderFinding) => {
                  const order: Record<string, number> = { open: 0, narrow: 1, closed: 2 };
                  return (order[a.gap_status] ?? 3) - (order[b.gap_status] ?? 3);
                })
                .map((f: IdeaFinderFinding, i: number) => (
                  <IdeaCard key={i} f={f} index={i} />
                ))}
            </div>
          ) : (
            <div className="bg-[#181623] border border-[#29253b] rounded-xl p-8 text-center">
              <XCircle className="w-10 h-10 text-[#7e7b99] mx-auto mb-3" />
              <p className="text-white font-semibold text-sm mb-1">No strong ideas found</p>
              <p className="text-[#7e7b99] text-xs">The AI didn't find solid validated gaps in this niche. Try another niche or add more context.</p>
            </div>
          )}

          {/* Rejected Ideas */}
          {rejectedIdeas.length > 0 && (
            <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 sm:p-5">
              <p className="text-[#7e7b99] text-[11px] font-semibold uppercase tracking-wider mb-3">
                🚫 Ideas That Were Considered But Rejected ({rejectedIdeas.length})
              </p>
              <div className="space-y-2">
                {(rejectedIdeas as { idea: string; reason: string }[]).map((r, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 bg-[#13111e] border border-[#29253b] rounded-lg p-3">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[#a19dbf] text-xs font-medium">{r.idea}</p>
                      <p className="text-[#7e7b99] text-[11px] mt-0.5">Rejected: {r.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Gaps */}
          {displayedRun.result_json.data_gaps && (
            <div className="bg-[#181623] border border-amber-800/30 rounded-xl p-4">
              <p className="text-amber-300 text-[11px] font-semibold uppercase tracking-wider mb-1.5">⚠️ What Evidence Is Still Missing</p>
              <p className="text-[#a19dbf] text-xs leading-relaxed">{displayedRun.result_json.data_gaps}</p>
            </div>
          )}
        </div>
      )}

      {/* Failed state */}
      {displayedRun?.status === 'failed' && (
        <div className="bg-[#181623] border border-red-800/40 rounded-xl p-6 text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-white font-semibold text-sm mb-1">Analysis Failed</p>
          <p className="text-[#7e7b99] text-xs">{displayedRun.error_text || 'Unknown error. Please try again.'}</p>
        </div>
      )}

      {/* Past Runs */}
      {pastRuns && pastRuns.length > 0 && (
        <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 sm:p-5">
          <p className="text-[#7e7b99] text-[11px] font-semibold uppercase tracking-wider mb-3">
            <Clock className="w-3.5 h-3.5 inline mr-1" /> Previous Idea Analyses
          </p>
          <div className="space-y-2">
            {pastRuns.map(r => (
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
                    <p className="text-[#7e7b99] text-[10px]">{r.target_market} • {r.findings_count} ideas • {new Date(r.started_at).toLocaleDateString()}</p>
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
