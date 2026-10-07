import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface RunContextType {
  activeRunId: number | null;
  setActiveRunId: (id: number | null) => void;
  isWidgetVisible: boolean;
  setIsWidgetVisible: (v: boolean) => void;
  isWidgetMinimized: boolean;
  setIsWidgetMinimized: (v: boolean) => void;
  runStatusData: any;
  startRun: (sections: string[], topic?: string) => Promise<number>;
}

const RunContext = createContext<RunContextType | undefined>(undefined);

export const RunProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [isWidgetVisible, setIsWidgetVisible] = useState(true);
  const [isWidgetMinimized, setIsWidgetMinimized] = useState(false);

  // Poll for active running runs on the server to auto-attach if user reopens/refreshes app
  const { data: runningRuns } = useQuery({
    queryKey: ['runningRunsCheck'],
    queryFn: () => apiClient.getRuns(undefined, 'running'),
    refetchInterval: activeRunId ? 3000 : 8000,
    retry: false,
  });

  useEffect(() => {
    if (runningRuns && runningRuns.length > 0) {
      const latestRunning = runningRuns[0];
      if (activeRunId !== latestRunning.id) {
        setActiveRunId(latestRunning.id);
        setIsWidgetVisible(true);
      }
    }
  }, [runningRuns, activeRunId]);

  // Fetch status of active run
  const { data: runStatusData } = useQuery({
    queryKey: ['runStatus', activeRunId],
    queryFn: () => (activeRunId ? apiClient.getRunStatus(activeRunId) : null),
    enabled: !!activeRunId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed' || status === 'partial') {
        return false;
      }
      return 1500;
    },
  });

  const startRun = async (sections: string[], topic?: string) => {
    const res = await apiClient.startRun(sections, topic);
    setActiveRunId(res.run_id);
    setIsWidgetVisible(true);
    setIsWidgetMinimized(false);
    queryClient.invalidateQueries({ queryKey: ['runningRunsCheck'] });
    return res.run_id;
  };

  return (
    <RunContext.Provider
      value={{
        activeRunId,
        setActiveRunId,
        isWidgetVisible,
        setIsWidgetVisible,
        isWidgetMinimized,
        setIsWidgetMinimized,
        runStatusData,
        startRun,
      }}
    >
      {children}
    </RunContext.Provider>
  );
};

export const useRun = (): RunContextType => {
  const ctx = useContext(RunContext);
  if (!ctx) {
    throw new Error('useRun must be used within a RunProvider');
  }
  return ctx;
};
