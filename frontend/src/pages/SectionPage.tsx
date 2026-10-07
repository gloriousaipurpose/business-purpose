import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { FindingCard } from '../components/FindingCard';
import { ScoreBreakdownModal } from '../components/ScoreBreakdownModal';
import { Play, Clock, Search, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { SECTIONS } from '../components/Sidebar';
import { useRun } from '../context/RunContext';

export const SectionPage: React.FC = () => {
  const { sectionName = 'new_startups' } = useParams<{ sectionName: string }>();
  const { activeRunId, startRun } = useRun();

  const [topic, setTopic] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);

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
          <button
            onClick={() => refetch()}
            className="p-2 bg-[#181623] border border-[#29253b] text-[#7e7b99] hover:text-white rounded-lg transition-colors"
            title="Refresh section findings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

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
            disabled={isRunActive}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border font-medium text-xs transition-colors ${
              isRunActive
                ? 'bg-[#13111e] text-[#7e7b99] border-[#29253b] cursor-not-allowed'
                : 'bg-[#29253b] hover:bg-[#322d48] text-purple-200 border-[#3b3754]'
            }`}
          >
            {isRunActive ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin" />
                <span>Scan Running in Cloud...</span>
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
    </div>
  );
};
