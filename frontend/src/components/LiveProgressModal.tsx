import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle, AlertCircle, Sparkles, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { useRun } from '../context/RunContext';

export const LiveProgressModal: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    activeRunId,
    setActiveRunId,
    isWidgetVisible,
    setIsWidgetVisible,
    isWidgetMinimized,
    setIsWidgetMinimized,
    runStatusData,
  } = useRun();

  if (!activeRunId || !isWidgetVisible) {
    return null;
  }

  const status = runStatusData?.status || 'running';
  const isFinished = status === 'completed' || status === 'partial' || status === 'failed';
  const progressPct = runStatusData?.progress_percentage || 10;

  const handleDismiss = () => {
    if (isFinished) {
      setActiveRunId(null);
      queryClient.invalidateQueries({ queryKey: ['sectionLatest'] });
      queryClient.invalidateQueries({ queryKey: ['previousRuns'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['runningRunsCheck'] });
    } else {
      // Hide widget popover while keeping backend run alive
      setIsWidgetVisible(false);
    }
  };

  // Minimized Compact Pill Floating Badge
  if (isWidgetMinimized) {
    return (
      <div className="fixed top-16 right-6 z-50 pointer-events-auto">
        <div
          onClick={() => setIsWidgetMinimized(false)}
          className="bg-[#181623] border border-purple-500/40 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 cursor-pointer hover:bg-[#201d2e] transition-all transform hover:scale-105"
        >
          {isFinished ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-purple-300 animate-spin" />
          )}
          <div className="text-xs">
            <span className="text-white font-medium">Scan #{activeRunId}: </span>
            <span className="text-purple-300 font-semibold">{isFinished ? 'Done' : `${progressPct}%`}</span>
          </div>
          <ChevronUp className="w-4 h-4 text-[#7e7b99]" />
        </div>
      </div>
    );
  }

  // Non-Blocking Floating Top-Right Widget Card
  return (
    <div className="fixed top-16 right-6 z-50 pointer-events-auto w-96 bg-[#181623] border border-[#3b3754] rounded-xl p-4 shadow-2xl space-y-4 select-none animate-in fade-in slide-in-from-top-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#29253b] pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-md ${isFinished ? 'bg-emerald-950 text-emerald-400' : 'bg-[#29253b] text-purple-300'}`}>
            {isFinished ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4 animate-spin" />}
          </div>
          <div>
            <h3 className="font-semibold text-xs text-white">
              {isFinished ? 'Cloud Scan Complete' : 'Cloud Scan Running'}
            </h3>
            <p className="text-[10px] text-[#7e7b99]">
              Run #{activeRunId} • You can browse the app freely
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsWidgetMinimized(true)}
            className="p-1 text-[#7e7b99] hover:text-white rounded hover:bg-[#29253b]"
            title="Minimize to Floating Bar"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-[#7e7b99] hover:text-white rounded hover:bg-[#29253b]"
            title={isFinished ? 'Dismiss Widget' : 'Hide Widget (Scan continues in background)'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-[#a19dbf]">
            Status:{' '}
            <strong className={`uppercase ${isFinished ? 'text-emerald-400' : 'text-purple-300'}`}>
              {status}
            </strong>
          </span>
          <span className="text-purple-300 font-semibold">{progressPct}%</span>
        </div>
        <div className="w-full bg-[#13111e] h-2 rounded-full overflow-hidden border border-[#29253b]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFinished ? 'bg-emerald-400' : 'bg-purple-400'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Sources Feed Checklist */}
      <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
        <div className="text-[10px] font-medium text-[#7e7b99]">Collector Feed:</div>
        {runStatusData?.sources_checked && runStatusData.sources_checked.length > 0 ? (
          runStatusData.sources_checked.map((s: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs bg-[#13111e] p-2 rounded border border-[#29253b]"
            >
              <span className="capitalize text-[#a19dbf] text-[11px]">{s.name}</span>
              <span className="flex items-center gap-1 text-[10px]">
                {s.status === 'ok' ? (
                  <span className="text-purple-300 flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3 h-3 text-emerald-400" /> {s.items_count} items
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {s.status}
                  </span>
                )}
              </span>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center gap-2 text-[11px] text-[#7e7b99] py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
            <span>Fetching live sources & items...</span>
          </div>
        )}
      </div>

      {/* Action Footer if finished */}
      {isFinished ? (
        <button
          onClick={handleDismiss}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-lg transition-colors shadow-md"
        >
          Scan Finished — Click to Refresh & View Results
        </button>
      ) : (
        <p className="text-[10px] text-[#7e7b99] text-center italic">
          Click ✕ to hide widget while navigating. Scan runs in background.
        </p>
      )}
    </div>
  );
};
