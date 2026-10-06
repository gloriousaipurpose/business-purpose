import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Quote, Shield, Award } from 'lucide-react';
import { Finding } from '../types';

interface FindingCardProps {
  finding: Finding;
  onOpenScoreDetail?: (entityId: number) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onOpenScoreDetail }) => {
  const [expandedQuotes, setExpandedQuotes] = useState(false);

  return (
    <div className="bg-[#181623] border border-[#29253b] hover:border-[#3b3754] rounded-xl p-5 transition-colors flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider bg-[#29253b] px-2 py-0.5 rounded border border-[#3b3754]">
              {finding.kind || finding.section}
            </span>
            <h3 className="text-base font-semibold text-white mt-2 tracking-tight">
              {finding.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {finding.score !== undefined && finding.score !== null && (
              <button
                onClick={() => finding.entity_id && onOpenScoreDetail?.(finding.entity_id)}
                className="flex items-center gap-1 bg-[#29253b] text-purple-200 border border-[#3b3754] text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-[#322d48] transition-colors"
              >
                <Award className="w-3.5 h-3.5 text-purple-300" />
                <span>{finding.score}/100</span>
              </button>
            )}

            <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#13111e] border border-[#29253b] text-[#a19dbf] flex items-center gap-1 capitalize">
              <Shield className="w-3 h-3 text-purple-300" />
              <span>{finding.confidence} Confidence</span>
            </span>
          </div>
        </div>

        {/* Summary text */}
        <p className="text-[#a19dbf] text-xs leading-relaxed mb-4">
          {finding.summary}
        </p>

        {/* Evidence Sources */}
        {finding.evidence && finding.evidence.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-medium text-[#7e7b99] mb-2 flex items-center justify-between">
              <span>Evidence Sources ({finding.evidence.length})</span>
              <button
                onClick={() => setExpandedQuotes(!expandedQuotes)}
                className="text-purple-300 hover:underline text-[11px] flex items-center gap-1"
              >
                {expandedQuotes ? 'Hide Quotes' : 'View Supporting Quotes'}
                {expandedQuotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {finding.evidence.map((ev, idx) => (
                <a
                  key={idx}
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] bg-[#13111e] border border-[#29253b] text-[#a19dbf] hover:text-white hover:border-[#3b3754] px-2.5 py-1 rounded transition-colors"
                >
                  <span className="text-[#7e7b99]">[{ev.source || 'link'}]</span>
                  <span className="truncate max-w-[130px]">{ev.url}</span>
                  <ExternalLink className="w-3 h-3 text-[#7e7b99]" />
                </a>
              ))}
            </div>

            {/* Expandable Quotes */}
            {expandedQuotes && (
              <div className="mt-2.5 p-3 bg-[#13111e] border border-[#29253b] rounded-lg space-y-2">
                {finding.evidence.map((ev, idx) => (
                  <div key={idx} className="text-[11px] text-[#a19dbf] flex items-start gap-2">
                    <Quote className="w-3 h-3 text-purple-300 shrink-0 mt-0.5" />
                    <div>
                      <p className="italic font-mono text-slate-200">"{ev.quote}"</p>
                      <span className="text-[9px] text-[#7e7b99]">— {ev.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-[#29253b] flex items-center justify-between text-[11px] text-[#7e7b99]">
        <span>Entity: {finding.entity_name || 'N/A'}</span>
        <span>{new Date(finding.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
