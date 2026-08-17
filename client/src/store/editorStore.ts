import { create } from 'zustand';

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'synced';

interface ActiveUser {
  userId: string;
  userName: string;
  color: string;
}

interface EditorState {
  // Connection state
  isOnline: boolean;
  isWebSocketConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  activeUsers: ActiveUser[];
  showChangeSummary: boolean;
  documentId: string | null;

  // Network metrics
  wsMessagesSent: number;
  wsMessagesReceived: number;
  wsBytesSent: number;
  wsBytesReceived: number;

  // Derived sync status
  syncStatus: SyncStatus;

  // Actions
  setOnline: (online: boolean) => void;
  setWebSocketConnected: (connected: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSynced: (date: Date) => void;
  setActiveUsers: (users: ActiveUser[]) => void;
  setShowChangeSummary: (show: boolean) => void;
  setDocumentId: (id: string | null) => void;

  // Metrics actions
  recordMessageSent: (bytes: number) => void;
  recordMessageReceived: (bytes: number) => void;
  resetMetrics: () => void;
}

function computeSyncStatus(state: {
  isOnline: boolean;
  isWebSocketConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
}): SyncStatus {
  if (!state.isOnline) return 'offline';
  if (state.isSyncing) return 'syncing';
  if (state.isWebSocketConnected && state.lastSyncedAt) return 'synced';
  return 'online';
}

export const useEditorStore = create<EditorState>((set, get) => ({
  isOnline: navigator.onLine,
  isWebSocketConnected: false,
  isSyncing: false,
  lastSyncedAt: null,
  activeUsers: [],
  showChangeSummary: false,
  documentId: null,

  wsMessagesSent: 0,
  wsMessagesReceived: 0,
  wsBytesSent: 0,
  wsBytesReceived: 0,

  syncStatus: navigator.onLine ? 'online' : 'offline',

  setOnline: (online) => {
    const next = { ...get(), isOnline: online };
    set({ isOnline: online, syncStatus: computeSyncStatus(next) });
  },

  setWebSocketConnected: (connected) => {
    const next = { ...get(), isWebSocketConnected: connected };
    set({ isWebSocketConnected: connected, syncStatus: computeSyncStatus(next) });
  },

  setSyncing: (syncing) => {
    const next = { ...get(), isSyncing: syncing };
    set({ isSyncing: syncing, syncStatus: computeSyncStatus(next) });
  },

  setLastSynced: (date) => {
    const next = { ...get(), lastSyncedAt: date, isSyncing: false };
    set({
      lastSyncedAt: date,
      isSyncing: false,
      syncStatus: computeSyncStatus(next),
    });
  },

  setActiveUsers: (users) => set({ activeUsers: users }),
  setShowChangeSummary: (show) => set({ showChangeSummary: show }),
  setDocumentId: (id) => set({ documentId: id }),

  recordMessageSent: (bytes) =>
    set((s) => ({
      wsMessagesSent: s.wsMessagesSent + 1,
      wsBytesSent: s.wsBytesSent + bytes,
    })),

  recordMessageReceived: (bytes) =>
    set((s) => ({
      wsMessagesReceived: s.wsMessagesReceived + 1,
      wsBytesReceived: s.wsBytesReceived + bytes,
    })),

  resetMetrics: () =>
    set({
      wsMessagesSent: 0,
      wsMessagesReceived: 0,
      wsBytesSent: 0,
      wsBytesReceived: 0,
    }),
}));
