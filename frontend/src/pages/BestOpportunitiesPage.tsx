import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ScoreBreakdownModal } from '../components/ScoreBreakdownModal';
import { Award, Shield, CheckCircle, ChevronRight } from 'lucide-react';
import { OpportunityScore } from '../types';

export const BestOpportunitiesPage: React.FC = () => {
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunitiesRanked'],
    queryFn: () => apiClient.getOpportunities(),
    retry: false,
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#181623] border border-[#29253b] p-5 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#29253b] text-purple-300 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Best Opportunities</h1>
            <p className="text-xs text-[#7e7b99]">Ranked market intelligence ideas scored with visible rubric</p>
          </div>
        </div>

        <div className="px-3 py-1.5 bg-[#13111e] border border-[#29253b] rounded-lg text-xs text-[#a19dbf]">
          Total Candidates: <strong className="text-purple-300 font-semibold">{opportunities.length}</strong>
        </div>
      </div>

      {/* Ranked Table */}
      {isLoading ? (
        <div className="text-center py-16 text-purple-300 text-xs">Loading Ranked Opportunities...</div>
      ) : opportunities.length > 0 ? (
        <div className="bg-[#181623] border border-[#29253b] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#a19dbf]">
              <thead className="bg-[#13111e] font-medium text-[#7e7b99] uppercase border-b border-[#29253b]">
                <tr>
                  <th className="py-3.5 px-5">Rank</th>
                  <th className="py-3.5 px-5">Opportunity Entity</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Score (0-100)</th>
                  <th className="py-3.5 px-5">Confidence</th>
                  <th className="py-3.5 px-5">India Gap</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#29253b]">
                {opportunities.map((item: OpportunityScore, index: number) => (
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
                        {item.entity_category || 'general'}
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
                      <button className="text-purple-300 hover:text-white p-1.5 rounded bg-[#13111e] border border-[#29253b] inline-flex items-center gap-1 text-[11px] font-medium">
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
          No scored opportunities found yet. Run an analysis scan from any section!
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
