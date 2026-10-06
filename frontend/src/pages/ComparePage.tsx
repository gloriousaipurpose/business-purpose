import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { GitCompare, ArrowLeft, TrendingUp, MinusCircle, PlusCircle, Repeat } from 'lucide-react';

export const ComparePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const runIdsParam = searchParams.get('run_ids') || '';

  const runIds = runIdsParam.split(',').map((x) => parseInt(x.trim(), 10)).filter(Boolean);

  const { data, isLoading } = useQuery({
    queryKey: ['compareRuns', runIdsParam],
    queryFn: () => apiClient.compareRuns(runIds),
    enabled: runIds.length >= 2,
    retry: false,
  });

  if (runIds.length < 2) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20 space-y-3">
        <h2 className="text-base font-semibold text-white">Select at least 2 runs to compare.</h2>
        <Link to="/runs" className="inline-flex items-center gap-1.5 text-purple-300 hover:underline text-xs font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Previous Analyses
        </Link>
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="text-center py-20 text-purple-300 text-xs">Computing Side-by-Side Diff Matrix...</div>;
  }

  const { comparison, runs_meta } = data;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#181623] border border-[#29253b] p-5 rounded-xl">
        <div className="flex items-center gap-3">
          <Link to="/runs" className="p-2 rounded-lg bg-[#13111e] border border-[#29253b] text-[#7e7b99] hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-purple-300" /> Run Comparison Diff
            </h1>
            <p className="text-xs text-[#7e7b99] mt-0.5">Comparing Runs: {runs_meta.map((r) => `#${r.id}`).join(' vs ')}</p>
          </div>
        </div>
      </div>

      {/* 4 Column Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 1. New Opportunities */}
        <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#29253b] pb-2.5">
            <h3 className="font-semibold text-xs text-purple-300 flex items-center gap-1.5">
              <PlusCircle className="w-3.5 h-3.5" /> New Opportunities
            </h3>
            <span className="px-2 py-0.5 rounded bg-[#29253b] text-purple-200 text-[10px] font-medium">
              {comparison.new.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {comparison.new.length === 0 ? (
              <p className="text-xs text-[#7e7b99] text-center py-6">No new items found.</p>
            ) : (
              comparison.new.map((item, idx) => (
                <div key={idx} className="bg-[#13111e] border border-[#29253b] p-2.5 rounded-lg space-y-1 text-xs">
                  <span className="font-medium text-white">{item.name}</span>
                  <div className="text-[#7e7b99] flex justify-between text-[11px] pt-0.5">
                    <span>Score: <strong className="text-purple-300">{item.last_score}/100</strong></span>
                    <span>Seen {item.appearance_count}x</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. More Important */}
        <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#29253b] pb-2.5">
            <h3 className="font-semibold text-xs text-purple-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Score Surges (+10)
            </h3>
            <span className="px-2 py-0.5 rounded bg-[#29253b] text-purple-200 text-[10px] font-medium">
              {comparison.more_important.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {comparison.more_important.length === 0 ? (
              <p className="text-xs text-[#7e7b99] text-center py-6">No score surges registered.</p>
            ) : (
              comparison.more_important.map((item, idx) => (
                <div key={idx} className="bg-[#13111e] border border-[#29253b] p-2.5 rounded-lg space-y-1 text-xs">
                  <span className="font-medium text-white">{item.name}</span>
                  <div className="text-[#7e7b99] flex justify-between text-[11px] pt-0.5">
                    <span>{item.first_score} ➔ <strong className="text-purple-300">{item.last_score}</strong></span>
                    <span className="text-purple-300 font-medium">+{item.last_score - item.first_score} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Disappeared */}
        <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#29253b] pb-2.5">
            <h3 className="font-semibold text-xs text-[#a19dbf] flex items-center gap-1.5">
              <MinusCircle className="w-3.5 h-3.5" /> Disappeared
            </h3>
            <span className="px-2 py-0.5 rounded bg-[#13111e] text-[#a19dbf] text-[10px] font-medium">
              {comparison.disappeared.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {comparison.disappeared.length === 0 ? (
              <p className="text-xs text-[#7e7b99] text-center py-6">No items disappeared.</p>
            ) : (
              comparison.disappeared.map((item, idx) => (
                <div key={idx} className="bg-[#13111e] border border-[#29253b] p-2.5 rounded-lg space-y-1 text-xs">
                  <span className="font-medium text-[#a19dbf]">{item.name}</span>
                  <p className="text-[10px] text-[#7e7b99]">Not detected in latest run.</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Repeating */}
        <div className="bg-[#181623] border border-[#29253b] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#29253b] pb-2.5">
            <h3 className="font-semibold text-xs text-[#a19dbf] flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5" /> Repeating Items
            </h3>
            <span className="px-2 py-0.5 rounded bg-[#13111e] text-[#a19dbf] text-[10px] font-medium">
              {comparison.repeating.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {comparison.repeating.length === 0 ? (
              <p className="text-xs text-[#7e7b99] text-center py-6">No repeating items.</p>
            ) : (
              comparison.repeating.map((item, idx) => (
                <div key={idx} className="bg-[#13111e] border border-[#29253b] p-2.5 rounded-lg space-y-1 text-xs">
                  <span className="font-medium text-white">{item.name}</span>
                  <div className="text-[#7e7b99] flex justify-between text-[11px] pt-0.5">
                    <span>Score: {item.last_score}</span>
                    <span className="text-purple-300 font-medium">Seen {item.appearance_count} runs</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
