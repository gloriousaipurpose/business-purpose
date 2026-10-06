import axios from 'axios';
import {
  Finding,
  OpportunityScore,
  Run,
  NotificationItem,
  SchedulerStatus,
  CompareResult
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}`
  : '/api';

export const apiClient = {
  // Sections
  getLatestSection: async (name: string) => {
    const res = await axios.get(`${API_BASE}/sections/${name}/latest`);
    return res.data as {
      section: string;
      last_analyzed_at?: string;
      findings: Finding[];
      summary?: string;
    };
  },

  // Runs
  startRun: async (sections: string[], topic?: string) => {
    const res = await axios.post(`${API_BASE}/runs`, { sections, topic });
    return res.data as { run_id: number; message: string; status: string };
  },

  getRuns: async (run_type?: string, status?: string) => {
    const res = await axios.get(`${API_BASE}/runs`, { params: { run_type, status } });
    return res.data as Run[];
  },

  getRunDetails: async (id: number) => {
    const res = await axios.get(`${API_BASE}/runs/${id}`);
    return res.data as { run: Run; findings: Finding[]; scores: OpportunityScore[] };
  },

  getRunStatus: async (id: number) => {
    const res = await axios.get(`${API_BASE}/runs/${id}/status`);
    return res.data as {
      id: number;
      status: string;
      started_at: string;
      finished_at?: string;
      sources_checked: any[];
      findings_count: number;
      progress_percentage: number;
    };
  },

  // Opportunities
  getOpportunities: async () => {
    const res = await axios.get(`${API_BASE}/opportunities`);
    return res.data as OpportunityScore[];
  },

  getOpportunityDetails: async (entityId: number) => {
    const res = await axios.get(`${API_BASE}/opportunities/${entityId}`);
    return res.data as {
      entity: any;
      latest_score?: OpportunityScore;
      score_timeline: any[];
      findings: Finding[];
      india_competitors: any[];
      risks: any[];
    };
  },

  // Compare
  compareRuns: async (runIds: number[]) => {
    const res = await axios.get(`${API_BASE}/compare`, { params: { run_ids: runIds.join(',') } });
    return res.data as CompareResult;
  },

  // Notifications
  getNotifications: async () => {
    const res = await axios.get(`${API_BASE}/notifications`);
    return res.data as NotificationItem[];
  },

  // Scheduler
  getSchedulerStatus: async () => {
    const res = await axios.get(`${API_BASE}/scheduler/status`);
    return res.data as SchedulerStatus;
  },

  pauseScheduler: async () => {
    const res = await axios.post(`${API_BASE}/scheduler/pause`);
    return res.data;
  },

  resumeScheduler: async () => {
    const res = await axios.post(`${API_BASE}/scheduler/resume`);
    return res.data;
  }
};
