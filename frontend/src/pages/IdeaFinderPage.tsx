import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Lightbulb, Sparkles, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, XCircle, Clock, Loader2, RotateCcw, Users, DollarSign,
  ShieldAlert, FlaskConical, TrendingUp, Globe, Zap, Target, BarChart3,
  Heart, Compass, ArrowLeft, ChevronRight, Plus
} from 'lucide-react';
import { apiClient } from '../api/client';
import {
  IdeaFinderFinding,
  IdeaFinderRunSummary,
  InnovationItem,
  LoveSignal
} from '../types';

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

// ── Single Finding Card (Normal Mode) ─────────────────────────────────────────
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

// ── Novelty Badge Styles ──────────────────────────────────────────────────────
const noveltyBadgeMap: Record<string, { label: string; style: string; icon: any }> = {
  new: {
    label: 'NEW • Unserved Opportunity',
    style: 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/50 shadow-sm shadow-emerald-950/40',
    icon: Sparkles,
  },
  partial: {
    label: 'PARTIAL • Similar Exists But Misses Core Parts',
    style: 'bg-amber-950/70 text-amber-300 border border-amber-600/50',
    icon: AlertTriangle,
  },
  exists: {
    label: 'EXISTS • Already Done Well',
    style: 'bg-slate-800/70 text-slate-300 border border-slate-600/50',
    icon: XCircle,
  },
};

// ── Innovation Card (Innovation Mode) ─────────────────────────────────────────
const InnovationCard: React.FC<{ item: InnovationItem; index: number }> = ({ item, index }) => {
  const [expanded, setExpanded] = useState(false);

  const noveltyKey = (item.novelty || 'new').toLowerCase().trim();
  const noveltyInfo = noveltyBadgeMap[noveltyKey] || {
    label: item.novelty || 'NEW',
    style: 'bg-purple-950/60 text-purple-300 border border-purple-700/40',
    icon: Sparkles,
  };
  const NoveltyIcon = noveltyInfo.icon;

  const scoreEntries = item.scores
    ? Object.entries(item.scores).map(([key, val]) => ({
        key,
        score: typeof val === 'object' && val !== null ? val.score ?? 0 : Number(val) || 0,
        reason: typeof val === 'object' && val !== null ? val.reason ?? '' : '',
      }))
    : [];

  return (
    <div className="bg-[#181623] border border-[#29253b] hover:border-violet-600/40 rounded-xl overflow-hidden transition-all duration-200">
      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-800 border border-purple-500/40 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm sm:text-base leading-snug mb-1">
                {item.idea}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {item.linked_love_signal && (
                  <span className="text-[10px] bg-rose-950/50 border border-rose-800/40 text-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                    <Heart className="w-2.5 h-2.5 text-rose-400" /> Serves: {item.linked_love_signal}
                  </span>
                )}
                {item.lens_used && (
                  <span className="text-[10px] bg-indigo-950/50 border border-indigo-800/40 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                    🔍 Lens: {item.lens_used}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold ${scoreColor((item.total_score || 0) / 10)}`}>
                {item.total_score}/70
              </span>
              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${noveltyInfo.style}`}>
                <NoveltyIcon className="w-3 h-3" />
                {noveltyInfo.label.split(' • ')[0]}
              </span>
            </div>
            <span className={`text-[10px] font-semibold uppercase ${confidenceColor[item.confidence?.toLowerCase()] || 'text-slate-400'}`}>
              {item.confidence} confidence
            </span>
          </div>
        </div>

        {/* Head-to-Head Comparison: Current Incumbent vs What Is Better */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 bg-[#13111e] border border-[#29253b] rounded-xl p-3 sm:p-4">
          <div className="border-b md:border-b-0 md:border-r border-[#29253b] pb-2 md:pb-0 md:pr-3">
            <p className="text-[#7e7b99] text-[10px] font-semibold uppercase tracking-wider mb-1">
              How Served Today (Incumbent Experience)
            </p>
            <p className="text-[#a19dbf] text-xs leading-relaxed">{item.how_served_today}</p>
          </div>
          <div className="pt-2 md:pt-0 md:pl-1">
            <p className="text-emerald-400 text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>What Is 10x Better (The Breakthrough)</span>
            </p>
            <p className="text-white text-xs leading-relaxed font-medium">{item.what_is_better}</p>
          </div>
        </div>

        {/* Quick details row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <div className="bg-[#13111e] border border-[#29253b] rounded-lg p-2.5">
            <div className="flex items-center gap-1 text-[#7e7b99] text-[10px] mb-0.5">
              <Users className="w-3 h-3 text-purple-400" /> Target User
            </div>
            <p className="text-white text-xs leading-snug truncate font-medium">{item.target_user}</p>
          </div>
          <div className="bg-[#13111e] border border-[#29253b] rounded-lg p-2.5">
            <div className="flex items-center gap-1 text-[#7e7b99] text-[10px] mb-0.5">
              <DollarSign className="w-3 h-3 text-emerald-400" /> Who Pays & Revenue
            </div>
            <p className="text-white text-xs leading-snug truncate font-medium">{item.who_pays}</p>
          </div>
          <div className="bg-[#13111e] border border-[#29253b] rounded-lg p-2.5">
            <div className="flex items-center gap-1 text-[#7e7b99] text-[10px] mb-0.5">
              <FlaskConical className="w-3 h-3 text-amber-400" /> Validation Test
            </div>
            <p className="text-white text-xs leading-snug truncate font-medium">{item.validation_test}</p>
          </div>
        </div>

        {/* Toggle details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-purple-300 hover:text-purple-200 text-[11px] font-medium transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Show less' : 'Show novelty checks, scores, 3-month feasibility & risks'}
        </button>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-[#29253b] p-4 sm:p-5 space-y-4 bg-[#14121f]">
          {/* Novelty Evidence */}
          {item.novelty_evidence && item.novelty_evidence.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-purple-300 text-[11px] font-semibold mb-2">
                <Compass className="w-3.5 h-3.5" /> Novelty Check (Market Landscape)
              </div>
              <div className="space-y-1.5">
                {item.novelty_evidence.map((nev, i) => (
                  <div key={i} className="flex items-start gap-2 bg-[#13111e] border border-[#29253b] rounded-lg p-2.5 text-xs">
                    <span className="text-purple-400 font-mono text-[10px] shrink-0">[{nev.url_or_id || 'market-check'}]</span>
                    <span className="text-[#a19dbf] leading-relaxed">{nev.found}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3-Month Feasibility */}
          {item.feasibility && (
            <div>
              <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-semibold mb-2">
                <Zap className="w-3.5 h-3.5" /> 3-Month MVP Feasibility
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-[#13111e] border border-[#29253b] rounded-lg p-2.5">
                  <p className="text-[#7e7b99] text-[10px] font-medium mb-0.5">First Version in 3 Months</p>
                  <p className="text-white text-xs leading-snug">{item.feasibility.first_version}</p>
                </div>
                <div className="bg-[#13111e] border border-[#29253b] rounded-lg p-2.5">
                  <p className="text-rose-400 text-[10px] font-medium mb-0.5">Hardest Part / Barrier</p>
                  <p className="text-white text-xs leading-snug">{item.feasibility.hardest_part}</p>
                </div>
                <div className="bg-[#13111e] border border-[#29253b] rounded-lg p-2.5">
                  <p className="text-[#7e7b99] text-[10px] font-medium mb-0.5">Infrastructure & Needs</p>
                  <p className="text-white text-xs leading-snug">{item.feasibility.needs}</p>
                </div>
              </div>
            </div>
          )}

          {/* Score Matrix */}
          {scoreEntries.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[#a19dbf] text-[11px] font-semibold mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-purple-300" /> Strategist Score Matrix (Total: {item.total_score}/70)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {scoreEntries.map(({ key, score, reason }) => (
                  <div key={key} className="flex items-start gap-2 bg-[#13111e] border border-[#29253b] rounded-lg p-2.5">
                    <span className={`text-sm font-bold shrink-0 ${scoreColor(score)}`}>{score}/10</span>
                    <div>
                      <p className="text-[#a19dbf] text-[10px] font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-[#7e7b99] text-[10px] leading-tight">{reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Red Team / Risks */}
          {item.risks && item.risks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-rose-300 text-[11px] font-semibold mb-2">
                <ShieldAlert className="w-3.5 h-3.5" /> Red Team: Why This Might Fail
              </div>
              <div className="space-y-1.5">
                {item.risks.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[#d8b4c6] bg-[#24131e] border border-[#481c35] rounded-lg p-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
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

// ── Love Signals Shelf ────────────────────────────────────────────────────────
const LoveSignalsShelf: React.FC<{ signals: LoveSignal[] }> = ({ signals }) => {
  if (!signals || signals.length === 0) return null;

  return (
    <div className="bg-[#181623] border border-rose-900/30 rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-900/40 text-rose-300 border border-rose-700/30">
            <Heart className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-xs uppercase tracking-wider">
              What People Genuinely Love (Root Desires)
            </h3>
            <p className="text-[#7e7b99] text-[11px]">Demand signals anchored in engagement, rituals, and repeat spending</p>
          </div>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-300 font-semibold">
          {signals.length} Signal{signals.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {signals.map((sig, i) => {
          const strengthColor =
            sig.strength?.toLowerCase() === 'high'
              ? 'text-emerald-400 bg-emerald-950/50 border-emerald-800/40'
              : sig.strength?.toLowerCase() === 'medium'
              ? 'text-amber-400 bg-amber-950/50 border-amber-800/40'
              : 'text-slate-400 bg-slate-900/50 border-slate-800';

          return (
            <div key={i} className="bg-[#13111e] border border-[#29253b] rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-white text-xs font-semibold leading-snug">{sig.signal}</p>
                <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full border font-bold shrink-0 ${strengthColor}`}>
                  {sig.strength || 'SIGNAL'}
                </span>
              </div>

              {sig.root_desire && (
                <div className="bg-purple-950/30 border border-purple-900/30 rounded px-2.5 py-1.5 text-[11px]">
                  <span className="text-purple-300 font-semibold">Root Desire: </span>
                  <span className="text-[#c9c5e8]">{sig.root_desire}</span>
                </div>
              )}

              {sig.evidence && sig.evidence.length > 0 && (
                <div className="space-y-1 pt-1">
                  {sig.evidence.map((ev, ei) => (
                    <div key={ei} className="text-[10px] text-[#7e7b99] flex items-start gap-1.5">
                      <span className="text-rose-400/80 font-mono shrink-0">[{ev.id}]</span>
                      <span className="italic line-clamp-2">"{ev.quote}"</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export const IdeaFinderPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const runIdFromUrl = searchParams.get('run');

  const [selectedNiche, setSelectedNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [nicheNotes, setNicheNotes] = useState('');
  const [targetMarket, setTargetMarket] = useState('India');
  const [analysisMode, setAnalysisMode] = useState<'normal' | 'innovation'>('innovation');
  const [activeRunId, setActiveRunId] = useState<number | null>(() => {
    return runIdFromUrl ? parseInt(runIdFromUrl, 10) : null;
  });
  const [pollingRunId, setPollingRunId] = useState<number | null>(() => {
    const saved = localStorage.getItem('business_radar_polling_idea_id');
    return saved ? parseInt(saved, 10) : null;
  });
  const [viewedRun, setViewedRun] = useState<any>(null);

  // Sync with URL query parameter ?run=...
  useEffect(() => {
    if (runIdFromUrl) {
      const id = parseInt(runIdFromUrl, 10);
      if (!isNaN(id) && (!viewedRun || viewedRun.id !== id)) {
        setActiveRunId(id);
        apiClient.getIdeaRun(id).then((run) => {
          setViewedRun(run);
        }).catch(err => {
          console.error('Failed to load idea run from URL:', err);
        });
      }
    }
  }, [runIdFromUrl]);

  // Persist or clean up active polling run ID
  useEffect(() => {
    if (pollingRunId) {
      localStorage.setItem('business_radar_polling_idea_id', String(pollingRunId));
    } else {
      localStorage.removeItem('business_radar_polling_idea_id');
    }
  }, [pollingRunId]);

  // list of past runs
  const { data: pastRuns, refetch: refetchList } = useQuery({
    queryKey: ['ideaRuns'],
    queryFn: () => apiClient.listIdeaRuns(),
    refetchInterval: pollingRunId ? 3000 : false,
  });

  // active run status - poll reliably while pollingRunId is present
  const { data: activeRun, refetch: refetchActive } = useQuery({
    queryKey: ['ideaRun', pollingRunId],
    queryFn: () => apiClient.getIdeaRun(pollingRunId!),
    enabled: pollingRunId !== null,
    refetchInterval: pollingRunId !== null ? 2500 : false,
  });

  // When active run finishes, stop polling and show result in detail view
  useEffect(() => {
    if (activeRun?.status === 'completed') {
      setPollingRunId(null);
      setActiveRunId(activeRun.id);
      setViewedRun(activeRun);
      setSearchParams({ run: String(activeRun.id) });
      refetchList();
    } else if (activeRun?.status === 'failed') {
      setPollingRunId(null);
      setActiveRunId(activeRun.id);
      setViewedRun(activeRun);
      setSearchParams({ run: String(activeRun.id) });
      refetchList();
    }
  }, [activeRun?.status, activeRun?.id, refetchList]);

  // Dual safety check: if pastRuns list updates and detects our pollingRun is already completed/failed
  useEffect(() => {
    if (pollingRunId && pastRuns && Array.isArray(pastRuns)) {
      const match = pastRuns.find((r: any) => r.id === pollingRunId);
      if (match && (match.status === 'completed' || match.status === 'failed')) {
        apiClient.getIdeaRun(pollingRunId).then((fullRun) => {
          setPollingRunId(null);
          setActiveRunId(fullRun.id);
          setViewedRun(fullRun);
          setSearchParams({ run: String(fullRun.id) });
        }).catch(err => {
          console.warn('Failed to load finished idea run:', err);
        });
      }
    }
  }, [pastRuns, pollingRunId]);

  const startMutation = useMutation({
    mutationFn: () => {
      const niche = (selectedNiche === '__custom__' ? customNiche : selectedNiche).trim();
      if (!niche) throw new Error('Please select or type a niche first.');
      return apiClient.startIdeaFinder(niche, nicheNotes || undefined, targetMarket, analysisMode);
    },
    onSuccess: (data) => {
      setSearchParams({});
      setPollingRunId(data.run_id);
      setActiveRunId(null);
      setViewedRun(null);
      refetchList();
    },
  });

  const displayedRun = viewedRun || (activeRun?.status === 'completed' ? activeRun : null);
  const isRunning = pollingRunId !== null && (activeRun?.status === 'running' || !activeRun);
  const isDetailView = Boolean((runIdFromUrl || activeRunId) && !isRunning);

  // Mode resolution
  const runMode: 'normal' | 'innovation' =
    displayedRun?.mode ||
    displayedRun?.result_json?.mode ||
    (displayedRun?.result_json?.innovations ? 'innovation' : 'normal');

  const findings: IdeaFinderFinding[] = (displayedRun?.result_json?.findings || []) as IdeaFinderFinding[];
  const innovations: InnovationItem[] = (displayedRun?.result_json?.innovations || []) as InnovationItem[];
  const loveSignals: LoveSignal[] = (displayedRun?.result_json?.love_signals || []) as LoveSignal[];
  const rejectedIdeas = (displayedRun?.result_json?.rejected_ideas || []) as { idea: string; reason: string }[];
  const niche = displayedRun?.niche || '';

  const openCount = findings.filter((f: IdeaFinderFinding) => f.gap_status === 'open').length;
  const narrowCount = findings.filter((f: IdeaFinderFinding) => f.gap_status === 'narrow').length;

  const novelInnovationsCount = innovations.filter(i => (i.novelty || '').toLowerCase() === 'new').length;
  const partialInnovationsCount = innovations.filter(i => (i.novelty || '').toLowerCase() === 'partial').length;

  // ── Load a past run and show its results in breadcrumb detail view ─────────
  const loadPastRun = async (id: number) => {
    setSearchParams({ run: String(id) });
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

  const handleBackToFinder = () => {
    setSearchParams({});
    setActiveRunId(null);
    setViewedRun(null);
  };

  // ── DETAIL VIEW: Only selected result is shown with breadcrumbs ──────────
  if (isDetailView) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
        {/* Breadcrumb Navigation Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#181623] border border-[#29253b] rounded-xl px-4 py-3 shadow-md">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <button
              onClick={handleBackToFinder}
              className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Idea & Innovation Finder</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#565375]" />
            <span className="text-white font-semibold capitalize truncate max-w-[200px] sm:max-w-none">
              {displayedRun?.niche || 'Analysis Result'}
            </span>
            {displayedRun && (
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                runMode === 'innovation'
                  ? 'bg-violet-950 border border-violet-700 text-violet-300'
                  : 'bg-slate-800 border border-slate-700 text-slate-300'
              }`}>
                {runMode === 'innovation' ? 'Innovation Strategy' : 'Gap Analysis'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToFinder}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#211e30] hover:bg-[#2b273f] text-slate-200 border border-[#3b3754] rounded-lg transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Analyses</span>
            </button>
            <button
              onClick={() => {
                if (displayedRun?.niche) setSelectedNiche(displayedRun.niche);
                handleBackToFinder();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white rounded-lg transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Analysis</span>
            </button>
          </div>
        </div>

        {/* Loading state for detail view */}
        {!displayedRun ? (
          <div className="bg-[#181623] border border-[#29253b] rounded-xl p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <p className="text-white text-sm font-medium">Loading analysis report…</p>
          </div>
        ) : displayedRun.status === 'failed' ? (
          /* Failed state */
          <div className="bg-[#181623] border border-red-800/40 rounded-xl p-8 text-center space-y-3">
            <XCircle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-white font-semibold text-base">Analysis Failed</p>
            <p className="text-[#7e7b99] text-xs max-w-md mx-auto">{displayedRun.error_text || 'An error occurred during analysis.'}</p>
            <button
              onClick={handleBackToFinder}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition-all"
            >
              Back to Idea Finder
            </button>
          </div>
        ) : displayedRun.result_json ? (
          /* Successful Result View: ONLY this analysis is displayed */
          <div className="space-y-4">
            {/* Summary Bar */}
            <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold text-base capitalize">
                      Results for: <span className="text-purple-300">{displayedRun.niche}</span>
                    </p>
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                      runMode === 'innovation'
                        ? 'bg-violet-950 border border-violet-700 text-violet-300'
                        : 'bg-slate-800 border border-slate-700 text-slate-300'
                    }`}>
                      {runMode === 'innovation' ? 'Innovation Strategy' : 'Gap Analysis'}
                    </span>
                  </div>
                  <p className="text-[#7e7b99] text-[11px]">{displayedRun.target_market} • {new Date(displayedRun.started_at).toLocaleString()}</p>
                </div>

                {/* Badges depending on mode */}
                <div className="flex flex-wrap gap-2">
                  {runMode === 'innovation' ? (
                    <>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-700/30 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {novelInnovationsCount} New Novel
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700/30 font-semibold">
                        {partialInnovationsCount} Partial
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-rose-900/40 text-rose-300 border border-rose-700/30 font-semibold flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {loveSignals.length} Love Signals
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#29253b] text-[#a19dbf] border border-[#3b3754] font-semibold">
                        {innovations.length} Ideas
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-700/30 font-semibold">
                        {openCount} open gaps
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700/30 font-semibold">
                        {narrowCount} narrow
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#29253b] text-[#a19dbf] border border-[#3b3754] font-semibold">
                        {findings.length} total
                      </span>
                    </>
                  )}
                </div>
              </div>

              {displayedRun.result_json.run_summary && (
                <p className="text-[#a19dbf] text-xs leading-relaxed border-t border-[#29253b] pt-3">
                  {displayedRun.result_json.run_summary}
                </p>
              )}
            </div>

            {/* ── INNOVATION MODE OUTPUT ── */}
            {runMode === 'innovation' ? (
              <>
                {/* Love Signals & Root Desires */}
                <LoveSignalsShelf signals={loveSignals} />

                {/* Innovations List */}
                {innovations.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-[#7e7b99] text-[11px] font-semibold uppercase tracking-wider">
                      {innovations.length} Breakthrough Innovation{innovations.length !== 1 ? 's' : ''} — Ranked by Novelty & Potential
                    </p>
                    {([...innovations])
                      .sort((a, b) => {
                        const order: Record<string, number> = { new: 0, partial: 1, exists: 2 };
                        const na = order[(a.novelty || '').toLowerCase()] ?? 3;
                        const nb = order[(b.novelty || '').toLowerCase()] ?? 3;
                        if (na !== nb) return na - nb;
                        return (b.total_score || 0) - (a.total_score || 0);
                      })
                      .map((item: InnovationItem, i: number) => (
                        <InnovationCard key={i} item={item} index={i} />
                      ))}
                  </div>
                ) : (
                  <div className="bg-[#181623] border border-[#29253b] rounded-xl p-8 text-center">
                    <XCircle className="w-10 h-10 text-[#7e7b99] mx-auto mb-3" />
                    <p className="text-white font-semibold text-sm mb-1">No strong innovations found</p>
                    <p className="text-[#7e7b99] text-xs">
                      The strategist didn't find unserved ways to serve love in this niche that passed novelty checks. Try adding more context or test another niche.
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* ── NORMAL MODE OUTPUT ── */
              <>
                {findings.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-[#7e7b99] text-[11px] font-semibold uppercase tracking-wider">
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
              </>
            )}

            {/* Rejected Ideas */}
            {rejectedIdeas.length > 0 && (
              <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 sm:p-5">
                <p className="text-[#7e7b99] text-[11px] font-semibold uppercase tracking-wider mb-3">
                  🚫 Ideas That Were Checked But Rejected ({rejectedIdeas.length})
                </p>
                <div className="space-y-2">
                  {rejectedIdeas.map((r, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 bg-[#13111e] border border-[#29253b] rounded-lg p-3">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[#a19dbf] text-xs font-medium">{r.idea}</p>
                        <p className="text-[#7e7b99] text-[11px] mt-0.5">Reason: {r.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Gaps */}
            {displayedRun.result_json.data_gaps && (
              <div className="bg-[#181623] border border-amber-800/30 rounded-xl p-4">
                <p className="text-amber-300 text-[11px] font-semibold uppercase tracking-wider mb-1.5">
                  ⚠️ What Evidence Is Still Missing
                </p>
                <p className="text-[#a19dbf] text-xs leading-relaxed">{displayedRun.result_json.data_gaps}</p>
              </div>
            )}

            {/* Bottom Back Button */}
            <div className="pt-4 flex justify-between items-center border-t border-[#29253b]">
              <button
                onClick={handleBackToFinder}
                className="flex items-center gap-2 text-xs text-[#a19dbf] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to All Previous Runs
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#181623] border border-[#29253b] rounded-xl p-8 text-center">
            <p className="text-[#7e7b99] text-xs">No result data available for this run.</p>
          </div>
        )}
      </div>
    );
  }

  // ── FINDER / HUB VIEW: Input Form & Past Runs List ──────────────────────────
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-purple-900/40 border border-purple-700/30">
          <Lightbulb className="w-5 h-5 text-purple-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Idea & Innovation Finder</h2>
          <p className="text-[#7e7b99] text-xs">Discover unserved gaps or breakthrough innovations anchored in real customer demand.</p>
        </div>
      </div>

      {/* Input Panel */}
      <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 sm:p-6 space-y-5">
        
        {/* Step 1: Choose Analysis Mode */}
        <div>
          <p className="text-[#a19dbf] text-xs font-semibold uppercase tracking-wider mb-2.5">
            1. Select Analysis Strategy
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option A: Innovation Mode */}
            <button
              type="button"
              onClick={() => setAnalysisMode('innovation')}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                analysisMode === 'innovation'
                  ? 'bg-gradient-to-br from-violet-950/70 via-purple-950/40 to-indigo-950/60 border-violet-500 shadow-md shadow-violet-950/50'
                  : 'bg-[#13111e] border-[#29253b] hover:border-[#3b3754]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${analysisMode === 'innovation' ? 'bg-gradient-to-br from-rose-500 to-violet-600 text-white' : 'bg-[#181623] text-[#7e7b99]'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Innovation Strategy</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-900/50 border border-violet-700/40 text-violet-300 font-semibold flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 text-rose-400" /> Love & Novelty
                </span>
              </div>
              <p className="text-[#7e7b99] text-[11px] leading-relaxed">
                Finds what people genuinely love & spend on, then discovers 10x better ways to serve that love that nobody is currently doing.
              </p>
            </button>

            {/* Option B: Normal Mode */}
            <button
              type="button"
              onClick={() => setAnalysisMode('normal')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                analysisMode === 'normal'
                  ? 'bg-purple-950/50 border-purple-500 shadow-md shadow-purple-950/50'
                  : 'bg-[#13111e] border-[#29253b] hover:border-[#3b3754]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${analysisMode === 'normal' ? 'bg-purple-800/60 text-purple-200' : 'bg-[#181623] text-[#7e7b99]'}`}>
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Standard Gap Analysis</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">Pain-Led</span>
              </div>
              <p className="text-[#7e7b99] text-[11px] leading-relaxed">
                Skeptical market analyst finding unserved gaps, acute pain points, and friction with existing solutions or workarounds.
              </p>
            </button>
          </div>
        </div>

        {/* Step 2: Choose Niche */}
        <div>
          <p className="text-[#a19dbf] text-xs font-semibold uppercase tracking-wider mb-2.5">
            2. Choose Your Niche
          </p>

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
              className="w-full mt-2 bg-[#13111e] border border-[#3b3754] rounded-lg px-3 py-2 text-white text-xs placeholder-[#7e7b99] focus:outline-none focus:border-purple-500"
            />
          )}
        </div>

        {/* Optional notes */}
        <div>
          <label className="text-[#7e7b99] text-[11px] font-medium mb-1 block">
            Optional: Add context (city, budget, user type, specific segments)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. focusing on tier-2 Indian cities, budget under ₹500/month users, vernacular first…"
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
          className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg"
        >
          {isRunning || startMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</>
          ) : analysisMode === 'innovation' ? (
            <><Sparkles className="w-4 h-4 text-amber-300" /> Find Breakthrough Innovations in This Niche</>
          ) : (
            <><Target className="w-4 h-4 text-purple-300" /> Find Real Gaps in This Niche</>
          )}
        </button>
      </div>

      {/* Running state */}
      {isRunning && (
        <div className="bg-[#181623] border border-purple-700/40 rounded-xl p-6 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-300" />
          <p className="text-white font-semibold text-sm">
            Analysing "{niche || (selectedNiche === '__custom__' ? customNiche : selectedNiche)}"…
          </p>
          <p className="text-[#7e7b99] text-xs text-center max-w-sm">
            {analysisMode === 'innovation'
              ? 'The AI is acting as an innovation strategist — discovering what people love, testing innovation lenses, and performing novelty checks against existing players.'
              : 'The AI is playing skeptical analyst — finding real pain points, checking competition, and red-teaming gap ideas.'}
          </p>
        </div>
      )}

      {/* Past Runs */}
      {pastRuns && pastRuns.length > 0 && (
        <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#7e7b99] text-[11px] font-semibold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 inline mr-1" /> Previous Idea & Innovation Runs ({pastRuns.length})
            </p>
            <span className="text-[10px] text-[#7e7b99]">Click any run to view in dedicated view</span>
          </div>
          <div className="space-y-2">
            {pastRuns.map(r => (
              <button
                key={r.id}
                onClick={() => loadPastRun(r.id)}
                className={`w-full flex items-center justify-between gap-3 bg-[#13111e] border rounded-xl px-4 py-3 hover:border-purple-500/50 hover:bg-[#161426] transition-all text-left group ${
                  (activeRunId === r.id || pollingRunId === r.id) ? 'border-purple-600/60' : 'border-[#29253b]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {r.status === 'completed' ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> :
                   r.status === 'running'   ? <Loader2 className="w-4 h-4 text-purple-300 animate-spin shrink-0" /> :
                                              <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-xs font-semibold capitalize truncate group-hover:text-purple-200 transition-colors">{r.niche}</p>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase ${
                        r.mode === 'innovation'
                          ? 'bg-violet-950 border border-violet-800 text-violet-300'
                          : 'bg-slate-800 border border-slate-700 text-slate-300'
                      }`}>
                        {r.mode === 'innovation' ? 'Innovation' : 'Gap Finder'}
                      </span>
                    </div>
                    <p className="text-[#7e7b99] text-[11px] mt-0.5">
                      {r.target_market} • {r.findings_count} ideas • {new Date(r.started_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#7e7b99] group-hover:text-purple-300 transition-colors shrink-0">
                  <span>View Results</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
