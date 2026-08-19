import { create } from 'zustand';

export interface LatencySample {
  timestamp: number;
  latencyMs: number;
}

export interface ConsistencyMetrics {
  clientsChecked: number;
  consistentClients: number;
  consistencyRate: number;
  status: 'CONSISTENT' | 'DIVERGENT' | 'N/A';
}

interface MetricsState {
  // Sync latency samples
  syncLatencySamples: LatencySample[];

  // Offline recovery
  offlineStartTime: number | null;
  lastRecoveryTimeMs: number | null;
  recoveryTimeSamples: number[];

  // Merge tracking
  totalMergeAttempts: number;
  successfulMerges: number;

  // AI summary timing
  lastAiSummaryTimeMs: number | null;
  aiSummaryTimeSamples: number[];

  // Document Consistency
  lastConsistency: ConsistencyMetrics | null;

  // Actions
  addLatencySample: (latencyMs: number) => void;
  setOfflineStart: () => void;
  recordRecovery: () => void;
  recordMergeAttempt: (success: boolean) => void;
  recordAiSummaryTime: (timeMs: number) => void;
  updateConsistency: (metrics: ConsistencyMetrics) => void;
  clearAll: () => void;

  // Computed
  getLatencyStats: () => {
    min: number;
    max: number;
    avg: number;
    median: number;
    count: number;
  } | null;
  getRecoveryStats: () => {
    min: number;
    max: number;
    avg: number;
    count: number;
  } | null;
  getMergeSuccessRate: () => number;
}

function computeStats(samples: number[]) {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mid = Math.floor(sorted.length / 2);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(sum / sorted.length),
    median:
      sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[mid],
    count: sorted.length,
  };
}

export const useMetricsStore = create<MetricsState>((set, get) => ({
  syncLatencySamples: [],
  offlineStartTime: null,
  lastRecoveryTimeMs: null,
  recoveryTimeSamples: [],
  totalMergeAttempts: 0,
  successfulMerges: 0,
  lastAiSummaryTimeMs: null,
  aiSummaryTimeSamples: [],
  lastConsistency: null,

  addLatencySample: (latencyMs) =>
    set((s) => ({
      syncLatencySamples: [
        ...s.syncLatencySamples.slice(-99), // keep last 100
        { timestamp: Date.now(), latencyMs },
      ],
    })),

  setOfflineStart: () => set((s) => ({ offlineStartTime: s.offlineStartTime || Date.now() })),

  recordRecovery: () => {
    const { offlineStartTime } = get();
    if (offlineStartTime) {
      const recoveryMs = Date.now() - offlineStartTime;
      set((s) => ({
        offlineStartTime: null,
        lastRecoveryTimeMs: recoveryMs,
        recoveryTimeSamples: [...s.recoveryTimeSamples.slice(-49), recoveryMs],
      }));
    }
  },

  recordMergeAttempt: (success) =>
    set((s) => ({
      totalMergeAttempts: s.totalMergeAttempts + 1,
      successfulMerges: s.successfulMerges + (success ? 1 : 0),
    })),

  recordAiSummaryTime: (timeMs) =>
    set((s) => ({
      lastAiSummaryTimeMs: timeMs,
      aiSummaryTimeSamples: [...s.aiSummaryTimeSamples.slice(-49), timeMs],
    })),

  updateConsistency: (metrics) => set({ lastConsistency: metrics }),

  clearAll: () =>
    set({
      syncLatencySamples: [],
      offlineStartTime: null,
      lastRecoveryTimeMs: null,
      recoveryTimeSamples: [],
      totalMergeAttempts: 0,
      successfulMerges: 0,
      lastAiSummaryTimeMs: null,
      aiSummaryTimeSamples: [],
      lastConsistency: null,
    }),

  getLatencyStats: () => {
    const samples = get().syncLatencySamples.map((s) => s.latencyMs);
    return computeStats(samples);
  },

  getRecoveryStats: () => {
    const samples = get().recoveryTimeSamples;
    const stats = computeStats(samples);
    if (!stats) return null;
    return { min: stats.min, max: stats.max, avg: stats.avg, count: stats.count };
  },

  getMergeSuccessRate: () => {
    const { totalMergeAttempts, successfulMerges } = get();
    if (totalMergeAttempts === 0) return 100;
    return Math.round((successfulMerges / totalMergeAttempts) * 100);
  },
}));
