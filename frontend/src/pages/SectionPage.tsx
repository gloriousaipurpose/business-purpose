import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { FindingCard } from '../components/FindingCard';
import { ScoreBreakdownModal } from '../components/ScoreBreakdownModal';
import { 
  Play, 
  Clock, 
  Search, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Filter, 
  X, 
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Award
} from 'lucide-react';
import { SECTIONS } from '../components/Sidebar';
import { useRun } from '../context/RunContext';
import { Finding } from '../types';

export const SectionPage: React.FC = () => {
  const { sectionName = 'new_startups' } = useParams<{ sectionName: string }>();
  const { activeRunId, startRun } = useRun();

  const [topic, setTopic] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [minScoreFilter, setMinScoreFilter] = useState<string>('all'); // all, 80, 70, scored
  const [sortBy, setSortBy] = useState<'newest' | 'score_desc' | 'sources_desc' | 'title_asc'>('newest');

  const currentSectionConfig = SECTIONS.find(
    (s) => s.id === sectionName || s.path.endsWith(sectionName)
  ) || {
    label: sectionName.replace(/_/g, ' ').toUpperCase(),
  };

  // Fetch Latest Section Findings safely
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sectionLatest', sectionName],
    queryFn: () => apiClient.getLatestSection(sectionName),
    refetchInterval: activeRunId ? 3000 : 10000,
    refetchOnMount: 'always',
    retry: false,
  });

  const handleRunNow = async () => {
    try {
      setIsStarting(true);
      await startRun([sectionName], topic);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to trigger analysis run.');
    } finally {
      setIsStarting(false);
    }
  };

  const isRunActive = !!activeRunId || isStarting;

  // Filter & Sort Findings
  const filteredFindings = useMemo(() => {
    if (!data?.findings) return [];

    let list = [...data.findings];

    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((f: Finding) => {
        const titleMatch = f.title.toLowerCase().includes(q);
        const summaryMatch = f.summary.toLowerCase().includes(q);
        const entityMatch = f.entity_name?.toLowerCase().includes(q);
        const painMatch = f.pain_point?.toLowerCase().includes(q);
        const actionMatch = f.action_plan?.toLowerCase().includes(q);
        return titleMatch || summaryMatch || entityMatch || painMatch || actionMatch;
      });
    }

    // 2. Confidence Filter
    if (confidenceFilter !== 'all') {
      list = list.filter((f: Finding) => f.confidence === confidenceFilter);
    }

    // 3. Kind Filter
    if (kindFilter !== 'all') {
      list = list.filter((f: Finding) => f.kind === kindFilter);
    }

    // 4. Min Score Filter
    if (minScoreFilter === '80') {
      list = list.filter((f: Finding) => (f.score ?? 0) >= 80);
    } else if (minScoreFilter === '70') {
      list = list.filter((f: Finding) => (f.score ?? 0) >= 70);
    } else if (minScoreFilter === 'scored') {
      list = list.filter((f: Finding) => f.score !== undefined && f.score !== null);
    }

    // 5. Sorting
    list.sort((a: Finding, b: Finding) => {
      if (sortBy === 'score_desc') {
        return (b.score ?? 0) - (a.score ?? 0);
      }
      if (sortBy === 'sources_desc') {
        return (b.source_count ?? 0) - (a.source_count ?? 0);
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      // default: newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [data?.findings, searchQuery, confidenceFilter, kindFilter, minScoreFilter, sortBy]);

  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    confidenceFilter !== 'all' || 
    kindFilter !== 'all' || 
    minScoreFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setConfidenceFilter('all');
    setKindFilter('all');
    setMinScoreFilter('all');
    setSortBy('newest');
  };

  // Distinct kinds present in current findings
  const availableKinds = useMemo(() => {
    if (!data?.findings) return [];
    const kinds = new Set<string>();
    data.findings.forEach((f: Finding) => {
      if (f.kind) kinds.add(f.kind);
    });
    return Array.from(kinds);
  }, [data?.findings]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181623] border border-[#29253b] p-4 sm:p-5 rounded-xl shadow-lg shadow-black/20">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <span>{currentSectionConfig.label}</span>
          </h1>
          <div className="flex items-center gap-2 text-xs text-[#7e7b99] mt-1">
            <Clock className="w-3.5 h-3.5 text-purple-300" />
            <span>Last Analyzed:</span>
            <span className="text-slate-300 font-medium">
              {data?.last_analyzed_at
                ? new Date(data.last_analyzed_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })
                : 'Not analyzed yet'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 bg-[#181623] border border-[#29253b] text-[#7e7b99] hover:text-white rounded-lg transition-colors"
            title="Refresh section findings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {sectionName === 'deep_research' && (
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-[#7e7b99] absolute left-3 top-2.5" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter Deep Research Topic..."
                className="w-full sm:w-60 bg-[#13111e] border border-[#29253b] text-xs text-white pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-purple-400"
              />
            </div>
          )}

          <button
            onClick={handleRunNow}
            disabled={isRunActive}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border font-medium text-xs transition-colors shadow-sm ${
              isRunActive
                ? 'bg-[#13111e] text-[#7e7b99] border-[#29253b] cursor-not-allowed'
                : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border-purple-500/40 hover:border-purple-500/60'
            }`}
          >
            {isRunActive ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin" />
                <span>Running Scan in Cloud...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-purple-300" />
                <span>Run Analysis Now</span>
              </>
            )}
          </button>
        </div>
      </div>


      {/* Analyst Summary Note */}
      {data?.summary && (
        <div className="bg-[#181623] border border-[#29253b] p-4 rounded-xl text-xs text-[#a19dbf] leading-relaxed shadow-sm">
          <div className="flex items-center gap-1.5 text-purple-300 font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicated Analyst Synthesis</span>
          </div>
          <p className="text-slate-200">{data.summary}</p>
        </div>
      )}

      {/* Comprehensive Filter & Search Bar */}
      <div className="bg-[#181623] border border-[#29253b] p-4 rounded-xl space-y-3.5 shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7e7b99] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter findings by keyword, pain point, solution, or entity name..."
              className="w-full bg-[#13111e] border border-[#29253b] text-xs text-white pl-9 pr-8 py-2 rounded-lg focus:outline-none focus:border-purple-400 placeholder-[#585570]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#7e7b99] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-[#7e7b99] flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#13111e] border border-[#29253b] text-xs text-[#c5c2df] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-400"
            >
              <option value="newest">Newest First</option>
              <option value="score_desc">Highest Opportunity Score</option>
              <option value="sources_desc">Most Evidence Sources</option>
              <option value="title_asc">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Badges & Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#232034]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-[#7e7b99] flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              <span>Filter:</span>
            </span>

            {/* Confidence Filter Pills */}
            <div className="flex items-center bg-[#13111e] border border-[#29253b] rounded-lg p-0.5 text-[11px] overflow-x-auto max-w-full">
              {(['all', 'high', 'medium', 'low'] as const).map((conf) => (
                <button
                  key={conf}
                  onClick={() => setConfidenceFilter(conf)}
                  className={`px-2.5 py-0.5 rounded capitalize transition-colors shrink-0 ${
                    confidenceFilter === conf
                      ? 'bg-purple-600/30 text-purple-200 font-semibold border border-purple-500/30'
                      : 'text-[#7e7b99] hover:text-[#c5c2df]'
                  }`}
                >
                  {conf === 'all' ? 'All Conf.' : conf}
                </button>
              ))}
            </div>

            {/* Min Score Filter Pills */}
            <div className="flex items-center bg-[#13111e] border border-[#29253b] rounded-lg p-0.5 text-[11px] overflow-x-auto max-w-full">

              {[
                { label: 'All Scores', value: 'all' },
                { label: '80+ Top', value: '80' },
                { label: '70+ Strong', value: '70' },
                { label: 'Scored Only', value: 'scored' }
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setMinScoreFilter(s.value)}
                  className={`px-2.5 py-0.5 rounded transition-colors ${
                    minScoreFilter === s.value
                      ? 'bg-purple-600/30 text-purple-200 font-semibold border border-purple-500/30'
                      : 'text-[#7e7b99] hover:text-[#c5c2df]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Kind Dropdown if multiple kinds exist */}
            {availableKinds.length > 1 && (
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                className="bg-[#13111e] border border-[#29253b] text-[11px] text-[#c5c2df] rounded-lg px-2.5 py-1 focus:outline-none focus:border-purple-400 capitalize"
              >
                <option value="all">All Types</option>
                {availableKinds.map((k) => (
                  <option key={k} value={k}>
                    Type: {k.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Result Count Indicator */}
          <div className="text-[11px] text-[#7e7b99]">
            Showing <strong className="text-purple-300">{filteredFindings.length}</strong> of{' '}
            <strong className="text-slate-300">{data?.findings?.length || 0}</strong> findings
          </div>
        </div>
      </div>

      {/* Findings Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-purple-300 text-xs flex flex-col items-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>Loading Grounded Market Findings...</span>
        </div>
      ) : filteredFindings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFindings.map((finding: Finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              onOpenScoreDetail={(entId) => setSelectedEntityId(entId)}
            />
          ))}
        </div>
      ) : data?.findings && data.findings.length > 0 ? (
        /* No items matched the active filter */
        <div className="bg-[#181623] border border-[#29253b] rounded-xl p-10 text-center space-y-3">
          <div className="w-10 h-10 bg-[#13111e] border border-[#29253b] rounded-lg flex items-center justify-center mx-auto text-[#7e7b99]">
            <Filter className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">No findings matched your current filters.</h3>
            <p className="text-xs text-[#7e7b99] mt-1 max-w-sm mx-auto">
              Try adjusting your search query, confidence filter, or score threshold.
            </p>
            <button
              onClick={resetFilters}
              className="mt-3 px-3 py-1.5 bg-[#29253b] text-purple-200 text-xs rounded-lg hover:bg-[#322d48] transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#181623] border border-[#29253b] rounded-xl p-12 text-center space-y-3">
          <div className="w-10 h-10 bg-[#13111e] border border-[#29253b] rounded-lg flex items-center justify-center mx-auto text-[#7e7b99]">
            <AlertCircle className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">No significant findings in this run.</h3>
            <p className="text-xs text-[#7e7b99] mt-1 max-w-sm mx-auto">
              Click "Run Analysis Now" above to trigger a live scan across DuckDuckGo, BetaList, Lobste.rs, HackerNews, ProductHunt, Reddit, Google Trends, and RSS feeds.
            </p>
          </div>
        </div>
      )}

      {/* Score Breakdown Modal */}
      {selectedEntityId && (
        <ScoreBreakdownModal
          entityId={selectedEntityId}
          onClose={() => setSelectedEntityId(null)}
        />
      )}
    </div>
  );
};
