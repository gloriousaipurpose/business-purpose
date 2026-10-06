import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { Run } from '../types';

export const PreviousAnalysesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRunIds, setSelectedRunIds] = useState<number[]>([]);

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['previousRuns'],
    queryFn: () => apiClient.getRuns(),
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181623] border border-[#29253b] p-5 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#29253b] text-purple-300 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Previous Analyses Timeline</h1>
            <p className="text-xs text-[#7e7b99]">Append-only history of every manual & automatic run</p>
          </div>
        </div>

        {/* Compare Button */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#7e7b99]">
            Selected: <strong className="text-purple-300">{selectedRunIds.length}/3</strong> runs
          </span>
          <button
            onClick={handleCompare}
            disabled={selectedRunIds.length < 2}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs transition-colors ${
              selectedRunIds.length >= 2
                ? 'bg-[#29253b] hover:bg-[#322d48] text-purple-200 border border-[#3b3754]'
                : 'bg-[#13111e] text-[#7e7b99] cursor-not-allowed border border-[#29253b]'
            }`}
          >
            <span>Compare Selected Runs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timeline List */}
      {isLoading ? (
        <div className="text-center py-16 text-purple-300 text-xs">Loading Run History...</div>
      ) : runs.length > 0 ? (
        <div className="space-y-3">
          {runs.map((run: Run) => {
            const isSelected = selectedRunIds.includes(run.id);
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
                        Analysis Run - {formattedDate}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-medium bg-[#29253b] text-purple-300 border border-[#3b3754]">
                        {run.run_type}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-medium bg-[#13111e] text-[#a19dbf] border border-[#29253b]">
                        {run.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#a19dbf] mt-1 line-clamp-2">
                      {run.summary_text || 'Completed intelligence run.'}
                    </p>

                    {/* Sources Checked */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {run.sources_checked && run.sources_checked.map((s, idx) => (
                        <span key={idx} className="text-[10px] bg-[#13111e] border border-[#29253b] text-[#a19dbf] px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-purple-300" />
                          <span className="capitalize">{s.name} ({s.items_count})</span>
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
          No previous analysis runs found.
        </div>
      )}
    </div>
  );
};
