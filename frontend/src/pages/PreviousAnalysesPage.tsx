import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  RefreshCw, 
  Timer, 
  Filter, 
  Search, 
  X,
  Layers
} from 'lucide-react';
import { Run } from '../types';
import { useRun } from '../context/RunContext';

export const PreviousAnalysesPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeRunId } = useRun();
  const [selectedRunIds, setSelectedRunIds] = useState<number[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'automatic' | 'manual'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'running' | 'failed'>('all');

  const { data: runs = [], isLoading, refetch } = useQuery({
    queryKey: ['previousRuns'],
    queryFn: () => apiClient.getRuns(),
    refetchInterval: activeRunId ? 3000 : 10000,
    refetchOnMount: 'always',
    retry: false,
  });

  const toggleSelectRun = (id: number) => {
    if (selectedRunIds.includes(id)) {
      setSelectedRunIds(selectedRunIds.filter((x) => x !== id));
    } else {
      if (selectedRunIds.length >= 3) {
        alert('You can select a maximum of 3 runs for side-by-side comparison.');
        return;
      }
      setSelectedRunIds([...selectedRunIds, id]);
    }
  };

  const handleCompare = () => {
    if (selectedRunIds.length < 2) {
      alert('Select at least 2 runs to perform side-by-side comparison.');
      return;
    }
    navigate(`/compare?run_ids=${selectedRunIds.join(',')}`);
  };

  const getRunDuration = (startStr: string, endStr?: string) => {
    if (!endStr) return null;
    const startIso = startStr.endsWith('Z') || startStr.includes('+') ? startStr : startStr.replace(' ', 'T') + 'Z';
    const endIso = endStr.endsWith('Z') || endStr.includes('+') ? endStr : endStr.replace(' ', 'T') + 'Z';
    const secs = Math.max(0, Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const filteredRuns = useMemo(() => {
    let list = [...runs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r: Run) => {
        const sumMatch = r.summary_text?.toLowerCase().includes(q);
        const trendsMatch = r.key_trends?.some((t) => t.toLowerCase().includes(q));
        const idMatch = String(r.id).includes(q);
        return sumMatch || trendsMatch || idMatch;
      });
    }

    if (typeFilter !== 'all') {
      list = list.filter((r: Run) => r.run_type === typeFilter);
    }

    if (statusFilter !== 'all') {
      list = list.filter((r: Run) => r.status === statusFilter);
    }

    return list;
  }, [runs, searchQuery, typeFilter, statusFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181623] border border-[#29253b] p-4 sm:p-5 rounded-xl shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#29253b] text-purple-300 rounded-lg border border-[#3b3754]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">Previous Analyses Timeline</h1>
            <p className="text-xs text-[#7e7b99]">Append-only audit trail of every 5-hour automatic and manual intelligence scan</p>
          </div>
        </div>

        {/* Compare & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 bg-[#181623] border border-[#29253b] text-[#7e7b99] hover:text-white rounded-lg transition-colors"
            title="Refresh runs timeline"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <span className="text-xs text-[#7e7b99]">
            Selected: <strong className="text-purple-300">{selectedRunIds.length}/3</strong>
          </span>
          <button
            onClick={handleCompare}
            disabled={selectedRunIds.length < 2}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm ${
              selectedRunIds.length >= 2
                ? 'bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/50'
                : 'bg-[#13111e] text-[#7e7b99] cursor-not-allowed border border-[#29253b]'
            }`}
          >
            <span>Compare Selected</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>


      {/* Filter Section */}
      <div className="bg-[#181623] border border-[#29253b] p-4 rounded-xl space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7e7b99] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search run summary text, key trends, or run ID..."
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

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-[#7e7b99] flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Type:</span>
            </span>
            <div className="flex items-center bg-[#13111e] border border-[#29253b] rounded-lg p-0.5 text-[11px]">
              {(['all', 'automatic', 'manual'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-0.5 rounded capitalize transition-colors ${
                    typeFilter === t
                      ? 'bg-purple-600/30 text-purple-200 font-semibold border border-purple-500/30'
                      : 'text-[#7e7b99] hover:text-[#c5c2df]'
                  }`}
                >
                  {t === 'all' ? 'All Types' : t}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-medium text-[#7e7b99] ml-2">Status:</span>
            <div className="flex items-center bg-[#13111e] border border-[#29253b] rounded-lg p-0.5 text-[11px]">
              {(['all', 'completed', 'running', 'failed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-0.5 rounded capitalize transition-colors ${
                    statusFilter === st
                      ? 'bg-purple-600/30 text-purple-200 font-semibold border border-purple-500/30'
                      : 'text-[#7e7b99] hover:text-[#c5c2df]'
                  }`}
                >
                  {st === 'all' ? 'All' : st}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded transition-colors ml-2"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="text-[11px] text-[#7e7b99] pt-2 border-t border-[#232034] flex items-center justify-between">
          <span>Showing <strong className="text-purple-300">{filteredRuns.length}</strong> of <strong className="text-slate-300">{runs.length}</strong> recorded runs</span>
          <span className="text-[10px] text-[#585570]">Select checkboxes to compare 2 or 3 runs side-by-side</span>
        </div>
      </div>

      {/* Timeline List */}
      {isLoading ? (
        <div className="text-center py-20 text-purple-300 text-xs">Loading Run History...</div>
      ) : filteredRuns.length > 0 ? (
        <div className="space-y-3">
          {filteredRuns.map((run: Run) => {
            const isSelected = selectedRunIds.includes(run.id);
            const duration = getRunDuration(run.started_at, run.finished_at);
            const formattedDate = new Date(run.started_at).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });

            return (
              <div
                key={run.id}
                onClick={() => toggleSelectRun(run.id)}
                className={`bg-[#181623] border p-4 rounded-xl transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-purple-400 bg-[#1d1a2c]'
                    : 'border-[#29253b] hover:border-[#3b3754]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1 w-3.5 h-3.5 rounded border-[#29253b] bg-[#13111e] text-purple-500 focus:ring-0"
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm">
                        Analysis Run #{run.id} • {formattedDate}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-medium bg-[#29253b] text-purple-300 border border-[#3b3754]">
                        {run.run_type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold border ${
                        run.status === 'completed' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' :
                        run.status === 'running' ? 'bg-purple-950/60 text-purple-300 border-purple-800 animate-pulse' :
                        'bg-amber-950/60 text-amber-300 border-amber-800'
                      }`}>
                        {run.status}
                      </span>
                      {duration && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#13111e] text-purple-300 border border-[#29253b] flex items-center gap-1">
                          <Timer className="w-3 h-3 text-purple-400" />
                          {duration}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#a19dbf] mt-1.5 line-clamp-2">
                      {run.summary_text || 'Completed intelligence run.'}
                    </p>

                    {/* Sources Checked */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {run.sources_checked && run.sources_checked.map((s, idx) => (
                        <span key={idx} className="text-[10px] bg-[#13111e] border border-[#29253b] text-[#a19dbf] px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-purple-300" />
                          <span className="capitalize">{s.name.replace(/_/g, ' ')} ({s.items_count})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#7e7b99] border-t md:border-t-0 md:border-l border-[#29253b] pt-3 md:pt-0 md:pl-5 shrink-0">
                  <div>
                    <div className="text-[10px] text-[#7e7b99]">Tokens / Cost</div>
                    <div className="font-medium text-slate-300">
                      {run.tokens_used} tks (${run.estimated_cost})
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#181623] border border-[#29253b] rounded-xl p-12 text-center text-[#7e7b99] text-xs">
          No analysis runs found matching current filter criteria.
        </div>
      )}
    </div>
  );
};
