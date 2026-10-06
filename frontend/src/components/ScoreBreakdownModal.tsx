import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { X, Award, CheckCircle, TrendingUp, ExternalLink, ShieldAlert } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ScoreBreakdownModalProps {
  entityId: number;
  onClose: () => void;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({ entityId, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['opportunityDetails', entityId],
    queryFn: () => apiClient.getOpportunityDetails(entityId),
  });

  if (isLoading || !data) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-[#181623] border border-[#29253b] p-6 rounded-xl text-center text-purple-300 text-xs font-medium">
          Loading Intelligence Details...
        </div>
      </div>
    );
  }

  const { entity, latest_score, score_timeline, india_competitors, risks } = data;

  const rubric = [
    { label: 'Demand Growth', score: latest_score?.demand_growth || 0, max: 25, key: 'demand_growth' },
    { label: 'Proven Abroad', score: latest_score?.proven_abroad || 0, max: 15, key: 'proven_abroad' },
    { label: 'India Market Gap', score: latest_score?.india_gap || 0, max: 20, key: 'india_gap' },
    { label: 'Ease to Build', score: latest_score?.ease_to_build || 0, max: 15, key: 'ease_to_build' },
    { label: 'Revenue Potential', score: latest_score?.revenue_potential || 0, max: 15, key: 'revenue_potential' },
    { label: 'Timing', score: latest_score?.timing || 0, max: 10, key: 'timing' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex justify-end">
      <div className="w-full max-w-xl bg-[#0f0e17] border-l border-[#29253b] h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#29253b] pb-4">
          <div>
            <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-widest bg-[#29253b] px-2 py-0.5 rounded border border-[#3b3754]">
              {entity.category || 'Opportunity'}
            </span>
            <h2 className="text-xl font-semibold text-white tracking-tight mt-2">{entity.canonical_name}</h2>
            <p className="text-xs text-[#a19dbf] mt-1">{entity.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7e7b99] hover:text-white rounded-lg bg-[#181623] border border-[#29253b]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overall Score Banner */}
        <div className="bg-[#181623] border border-[#29253b] p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-medium text-[#7e7b99] uppercase tracking-wider">Opportunity Score</div>
            <div className="text-3xl font-bold text-white mt-0.5">
              {latest_score?.total || 0}<span className="text-sm text-[#7e7b99] font-normal"> / 100</span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-[#29253b] text-purple-200 border border-[#3b3754] capitalize">
              <CheckCircle className="w-3.5 h-3.5 text-purple-300" /> {latest_score?.confidence} Confidence
            </span>
            <div className="text-[11px] text-[#7e7b99] mt-1">Seen in {entity.appearance_count} analysis runs</div>
          </div>
        </div>

        {/* Rubric Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-purple-300" /> Sub-Score Rubric
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {rubric.map((item) => {
              const percentage = (item.score / item.max) * 100;
              const justification = latest_score?.subscore_justifications?.[item.key];
              return (
                <div key={item.key} className="bg-[#181623] border border-[#29253b] p-3 rounded-lg space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#a19dbf]">{item.label}</span>
                    <span className="text-purple-300 font-semibold">{item.score} / {item.max}</span>
                  </div>
                  <div className="w-full bg-[#13111e] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-400 h-full rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {justification && (
                    <p className="text-[10px] text-[#7e7b99] leading-tight italic">{justification}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Score History Chart */}
        {score_timeline && score_timeline.length > 1 && (
          <div className="space-y-2 bg-[#181623] border border-[#29253b] p-4 rounded-xl">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-300" /> Score Trajectory Across Runs
            </h3>
            <div className="h-40 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={score_timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#29253b" />
                  <XAxis dataKey="date" stroke="#7e7b99" fontSize={10} />
                  <YAxis domain={[0, 100]} stroke="#7e7b99" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#13111e', borderColor: '#29253b', borderRadius: '6px', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* India Competitors */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-purple-300" /> India Competitors Verified
          </h3>
          {india_competitors && india_competitors.length > 0 ? (
            <div className="space-y-1.5">
              {india_competitors.map((comp: any, idx: number) => (
                <div key={idx} className="bg-[#181623] border border-[#29253b] p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-white">{comp.name}</span>
                    <p className="text-[11px] text-[#7e7b99]">{comp.how_close_a_match}</p>
                  </div>
                  {comp.url && (
                    <a href={comp.url} target="_blank" rel="noreferrer" className="text-purple-300 hover:underline flex items-center gap-1 text-[11px]">
                      Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-[#181623] border border-[#29253b] rounded-lg text-xs text-[#a19dbf]">
              Clear Gap Verified: No direct Indian competitors found across 5+ search angles.
            </div>
          )}
        </div>

        {/* Critic Risks */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-300" /> Skeptical Investor Risks
          </h3>
          {risks && risks.length > 0 ? (
            <div className="space-y-1.5">
              {risks.map((r: any, idx: number) => (
                <div key={idx} className="bg-[#181623] border border-[#29253b] p-2.5 rounded-lg space-y-0.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">{r.risk}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-semibold bg-[#29253b] text-purple-300">
                      {r.severity} Severity
                    </span>
                  </div>
                  {r.evidence && <p className="text-[11px] text-[#7e7b99] italic">"{r.evidence}"</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#7e7b99]">No high severity investor risks flagged.</p>
          )}
        </div>
      </div>
    </div>
  );
};
