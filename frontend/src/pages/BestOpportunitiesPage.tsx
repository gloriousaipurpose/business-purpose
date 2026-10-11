import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ScoreBreakdownModal } from '../components/ScoreBreakdownModal';
import { 
  Award, 
  Shield, 
  CheckCircle, 
  ChevronRight, 
  RefreshCw, 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal 
} from 'lucide-react';
import { OpportunityScore } from '../types';
import { useRun } from '../context/RunContext';

export const BestOpportunitiesPage: React.FC = () => {
  const { activeRunId } = useRun();
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minScoreFilter, setMinScoreFilter] = useState('all'); // all, 85, 80, 75, 70
  const [indiaGapFilter, setIndiaGapFilter] = useState('all'); // all, clear, partial
  const [confidenceFilter, setConfidenceFilter] = useState('all'); // all, high, medium, low
  const [sortBy, setSortBy] = useState<'total' | 'india_gap' | 'demand' | 'revenue' | 'ease' | 'timing'>('total');

  const { data: opportunities = [], isLoading, refetch } = useQuery({
    queryKey: ['opportunitiesRanked'],
    queryFn: () => apiClient.getOpportunities(),
    refetchInterval: activeRunId ? 3000 : 10000,
    refetchOnMount: 'always',
    retry: false,
  });

  // Unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    opportunities.forEach((op: OpportunityScore) => {
      if (op.entity_category) cats.add(op.entity_category);
    });
    return Array.from(cats);
  }, [opportunities]);

  // Filtered & Sorted opportunities
  const filteredOpportunities = useMemo(() => {
    let list = [...opportunities];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((op: OpportunityScore) => {
        const nameMatch = op.entity_name?.toLowerCase().includes(q);
        const descMatch = op.entity_description?.toLowerCase().includes(q);
        const notesMatch = op.search_notes?.toLowerCase().includes(q);
        return nameMatch || descMatch || notesMatch;
      });
    }

    // 2. Category Filter
    if (categoryFilter !== 'all') {
      list = list.filter((op: OpportunityScore) => op.entity_category === categoryFilter);
    }

    // 3. Min Score Filter
    if (minScoreFilter !== 'all') {
      const min = parseFloat(minScoreFilter);
      list = list.filter((op: OpportunityScore) => op.total >= min);
    }

    // 4. India Gap Filter
    if (indiaGapFilter === 'clear') {
      list = list.filter((op: OpportunityScore) => op.india_gap >= 15);
    } else if (indiaGapFilter === 'partial') {
      list = list.filter((op: OpportunityScore) => op.india_gap < 15);
    }

    // 5. Confidence Filter
    if (confidenceFilter !== 'all') {
      list = list.filter((op: OpportunityScore) => op.confidence === confidenceFilter);
    }

    // 6. Sorting
    list.sort((a: OpportunityScore, b: OpportunityScore) => {
      if (sortBy === 'india_gap') return b.india_gap - a.india_gap;
      if (sortBy === 'demand') return b.demand_growth - a.demand_growth;
      if (sortBy === 'revenue') return b.revenue_potential - a.revenue_potential;
      if (sortBy === 'ease') return b.ease_to_build - a.ease_to_build;
      if (sortBy === 'timing') return b.timing - a.timing;
      // default: total score desc
      return b.total - a.total;
    });

    return list;
  }, [opportunities, searchQuery, categoryFilter, minScoreFilter, indiaGapFilter, confidenceFilter, sortBy]);

  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    categoryFilter !== 'all' || 
    minScoreFilter !== 'all' || 
    indiaGapFilter !== 'all' || 
    confidenceFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setMinScoreFilter('all');
    setIndiaGapFilter('all');
    setConfidenceFilter('all');
    setSortBy('total');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181623] border border-[#29253b] p-5 rounded-xl shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#29253b] text-purple-300 rounded-lg border border-[#3b3754]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Best Opportunities Radar</h1>
            <p className="text-xs text-[#7e7b99]">Ranked market intelligence ideas scored with a transparent 0-100 rubric</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 bg-[#181623] border border-[#29253b] text-[#7e7b99] hover:text-white rounded-lg transition-colors"
            title="Refresh opportunities list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="px-3.5 py-1.5 bg-[#13111e] border border-[#29253b] rounded-lg text-xs text-[#a19dbf]">
            Total Scored: <strong className="text-purple-300 font-semibold">{opportunities.length}</strong>
          </div>
        </div>
      </div>

      {/* Advanced Filter & Search Section */}
      <div className="bg-[#181623] border border-[#29253b] p-4 rounded-xl space-y-3.5 shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7e7b99] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search opportunity entity, market sector, or description..."
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
              <span>Rank By:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#13111e] border border-[#29253b] text-xs text-[#c5c2df] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-400"
            >
              <option value="total">Overall Score (0-100)</option>
              <option value="india_gap">India Market Gap (0-20)</option>
              <option value="demand">Demand Growth (0-25)</option>
              <option value="revenue">Revenue Potential (0-15)</option>
              <option value="ease">Ease to Build (0-15)</option>
              <option value="timing">Market Timing (0-10)</option>
            </select>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#232034]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-[#7e7b99] flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              <span>Filter:</span>
            </span>

            {/* Score Tier Buttons */}
            <div className="flex items-center bg-[#13111e] border border-[#29253b] rounded-lg p-0.5 text-[11px]">
              {[
                { label: 'All Scores', val: 'all' },
                { label: '85+ Breakthrough', val: '85' },
                { label: '80+ Top Tier', val: '80' },
                { label: '70+ Viable', val: '70' }
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => setMinScoreFilter(s.val)}
                  className={`px-2.5 py-0.5 rounded transition-colors ${
                    minScoreFilter === s.val
                      ? 'bg-purple-600/30 text-purple-200 font-semibold border border-purple-500/30'
                      : 'text-[#7e7b99] hover:text-[#c5c2df]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* India Gap Pills */}
            <div className="flex items-center bg-[#13111e] border border-[#29253b] rounded-lg p-0.5 text-[11px]">
              {[
                { label: 'All Gaps', val: 'all' },
                { label: 'Clear Gap (15+)', val: 'clear' },
                { label: 'Partial Gap', val: 'partial' }
              ].map((g) => (
                <button
                  key={g.val}
                  onClick={() => setIndiaGapFilter(g.val)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    indiaGapFilter === g.val
                      ? 'bg-purple-600/30 text-purple-200 font-semibold border border-purple-500/30'
                      : 'text-[#7e7b99] hover:text-[#c5c2df]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#13111e] border border-[#29253b] text-[11px] text-[#c5c2df] rounded-lg px-2.5 py-1 focus:outline-none focus:border-purple-400 capitalize"
              >
                <option value="all">All Sectors</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            )}

            {/* Confidence Filter */}
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="bg-[#13111e] border border-[#29253b] text-[11px] text-[#c5c2df] rounded-lg px-2.5 py-1 focus:outline-none focus:border-purple-400 capitalize"
            >
              <option value="all">All Confidence</option>
              <option value="high">High Confidence</option>
              <option value="medium">Medium Confidence</option>
              <option value="low">Low Confidence</option>
            </select>

            {/* Reset Filters */}
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

          {/* Counts */}
          <div className="text-[11px] text-[#7e7b99]">
            Showing <strong className="text-purple-300">{filteredOpportunities.length}</strong> of{' '}
            <strong className="text-slate-300">{opportunities.length}</strong> opportunities
          </div>
        </div>
      </div>

      {/* Ranked Table */}
      {isLoading ? (
        <div className="text-center py-20 text-purple-300 text-xs">Loading Ranked Opportunities...</div>
      ) : filteredOpportunities.length > 0 ? (
        <div className="bg-[#181623] border border-[#29253b] rounded-xl overflow-hidden shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#a19dbf]">
              <thead className="bg-[#13111e] font-medium text-[#7e7b99] uppercase border-b border-[#29253b]">
                <tr>
                  <th className="py-3.5 px-5">Rank</th>
                  <th className="py-3.5 px-5">Opportunity Entity</th>
                  <th className="py-3.5 px-5">Sector</th>
                  <th className="py-3.5 px-5">Score (0-100)</th>
                  <th className="py-3.5 px-5">Confidence</th>
                  <th className="py-3.5 px-5">India Gap</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#29253b]">
                {filteredOpportunities.map((item: OpportunityScore, index: number) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedEntityId(item.entity_id)}
                    className="hover:bg-[#1f1c2e] cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-5 font-semibold text-[#7e7b99]">#{index + 1}</td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {item.entity_name || `Entity #${item.entity_id}`}
                      </div>
                      {item.entity_description && (
                        <div className="text-[11px] text-[#7e7b99] truncate max-w-sm mt-0.5">
                          {item.entity_description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 capitalize">
                      <span className="bg-[#13111e] border border-[#29253b] px-2 py-0.5 rounded text-[10px] text-[#a19dbf]">
                        {item.entity_category?.replace(/_/g, ' ') || 'general'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 font-semibold text-xs text-purple-200 bg-[#29253b] border border-[#3b3754] px-2.5 py-1 rounded-lg">
                        <Award className="w-3.5 h-3.5 text-purple-300" />
                        {item.total}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-[#29253b] bg-[#13111e] text-[#a19dbf] inline-flex items-center gap-1 capitalize">
                        <Shield className="w-3 h-3 text-purple-300" />
                        {item.confidence}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[11px]">
                      {item.india_gap >= 15 ? (
                        <span className="text-purple-300 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Clear Gap ({item.india_gap}/20)
                        </span>
                      ) : (
                        <span className="text-[#7e7b99]">Partial ({item.india_gap}/20)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button className="text-purple-300 hover:text-white p-1.5 rounded bg-[#13111e] border border-[#29253b] inline-flex items-center gap-1 text-[11px] font-medium group-hover:border-purple-500/40 transition-colors">
                        Breakdown <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#181623] border border-[#29253b] rounded-xl p-12 text-center text-[#7e7b99] text-xs">
          {hasActiveFilters ? (
            <div>
              <p>No opportunities matched your current filter criteria.</p>
              <button
                onClick={resetFilters}
                className="mt-3 px-3 py-1.5 bg-[#29253b] text-purple-200 text-xs rounded-lg hover:bg-[#322d48] transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            'No scored opportunities found yet. Run an analysis scan from any section!'
          )}
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
