import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface LiveProgressModalProps {
  runId: number;
  onComplete: () => void;
  onClose: () => void;
}

export const LiveProgressModal: React.FC<LiveProgressModalProps> = ({ runId, onComplete, onClose }) => {
  const { data: statusData } = useQuery({
    queryKey: ['runStatus', runId],
    queryFn: () => apiClient.getRunStatus(runId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed' || status === 'partial') {
        return false;
      }
      return 1500;
    },
  });

  const isFinished =
    statusData?.status === 'completed' ||
    statusData?.status === 'partial' ||
    statusData?.status === 'failed';

  React.useEffect(() => {
    if (isFinished) {
      onComplete();
    }
  }, [isFinished, onComplete]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#181623] border border-[#29253b] rounded-xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#29253b] text-purple-300 rounded-lg">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Pipeline Execution</h3>
              <p className="text-xs text-[#7e7b99]">Run #{runId} • Real-time Groq & Web Search</p>
            </div>
          </div>
          {isFinished && (
            <button
              onClick={onClose}
              className="px-3 py-1 bg-[#29253b] hover:bg-[#322d48] text-xs text-white rounded"
            >
              Done
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[#a19dbf]">Status: <strong className="text-purple-300 uppercase">{statusData?.status || 'running'}</strong></span>
            <span className="text-purple-300 font-medium">{statusData?.progress_percentage || 10}%</span>
          </div>
          <div className="w-full bg-[#13111e] h-2 rounded-full overflow-hidden border border-[#29253b]">
            <div
              className="bg-purple-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${statusData?.progress_percentage || 10}%` }}
            />
          </div>
        </div>

        {/* Sources Checklist */}
        <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
          <div className="text-[11px] font-medium text-[#7e7b99]">Collector Sources Feed:</div>
          {statusData?.sources_checked && statusData.sources_checked.length > 0 ? (
            statusData.sources_checked.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-[#13111e] p-2 rounded border border-[#29253b]">
                <span className="capitalize text-[#a19dbf]">{s.name}</span>
                <span className="flex items-center gap-1 text-[11px]">
                  {s.status === 'ok' ? (
                    <span className="text-purple-300 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> {s.items_count} items
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {s.status}
                    </span>
                  )}
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs text-[#7e7b99] py-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
              <span>Fetching raw items from internet sources...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
