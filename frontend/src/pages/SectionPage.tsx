import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { FindingCard } from '../components/FindingCard';
import { ScoreBreakdownModal } from '../components/ScoreBreakdownModal';
import { LiveProgressModal } from '../components/LiveProgressModal';
import { Play, Clock, Search, AlertCircle } from 'lucide-react';
import { SECTIONS } from '../components/Sidebar';

export const SectionPage: React.FC = () => {
  const { sectionName = 'new_startups' } = useParams<{ sectionName: string }>();
  const queryClient = useQueryClient();

  const [topic, setTopic] = useState('');
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);

  const currentSectionConfig = SECTIONS.find(
    (s) => s.id === sectionName || s.path.endsWith(sectionName)
  ) || {
    label: sectionName.replace(/_/g, ' ').toUpperCase(),
  };

  // Fetch Latest Section Findings safely
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sectionLatest', sectionName],
    queryFn: () => apiClient.getLatestSection(sectionName),
    retry: false,
  });

  const handleRunNow = async () => {
    try {
      const res = await apiClient.startRun([sectionName], topic);
      setActiveRunId(res.run_id);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to trigger analysis run.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181623] border border-[#29253b] p-5 rounded-xl">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {currentSectionConfig.label}
          </h1>
          <div className="flex items-center gap-2 text-xs text-[#7e7b99] mt-1">
            <Clock className="w-3.5 h-3.5 text-purple-300" />
            <span>Last Analyzed:</span>
            <span className="text-slate-300 font-medium">
              {data?.last_analyzed_at
                ? new Date(data.last_analyzed_at).toLocaleString()
                : 'Not analyzed yet'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {sectionName === 'deep_research' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7e7b99] absolute left-3 top-2.5" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter Deep Research Topic..."
                className="bg-[#13111e] border border-[#29253b] text-xs text-white pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-purple-400 w-60"
              />
            </div>
          )}

          <button
            onClick={handleRunNow}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#29253b] hover:bg-[#322d48] text-purple-200 border border-[#3b3754] font-medium text-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current text-purple-300" />
            <span>Run Analysis Now</span>
          </button>
        </div>
      </div>

      {/* Analyst Summary Note */}
      {data?.summary && (
        <div className="bg-[#181623] border border-[#29253b] p-3.5 rounded-xl text-xs text-[#a19dbf] leading-relaxed">
          <strong className="text-purple-300 font-medium">Analyst Summary: </strong>
          {data.summary}
        </div>
      )}

      {/* Findings Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-purple-300 text-xs">Loading Section Intelligence...</div>
      ) : data?.findings && data.findings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.findings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              onOpenScoreDetail={(entId) => setSelectedEntityId(entId)}
            />
          ))}
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
              Click "Run Analysis Now" above to trigger a live scan across HackerNews, ProductHunt, Reddit, Google Trends, and RSS feeds.
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

      {/* Live Progress Modal */}
      {activeRunId && (
        <LiveProgressModal
          runId={activeRunId}
          onComplete={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ['sectionLatest'] });
          }}
          onClose={() => setActiveRunId(null)}
        />
      )}
    </div>
  );
};
