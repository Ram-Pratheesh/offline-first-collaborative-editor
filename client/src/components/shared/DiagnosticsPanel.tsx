import React from 'react';
import { motion } from 'framer-motion';
import { X, Activity } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { useMetricsStore } from '../../store/metricsStore';

interface DiagnosticsPanelProps {
  onClose: () => void;
}

const StatusDot: React.FC<{ active: boolean; color?: string }> = ({ active, color }) => (
  <span
    className={`inline-block w-2 h-2 rounded-full ${
      active
        ? color || 'bg-success'
        : 'bg-text-muted'
    }`}
  />
);

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ onClose }) => {
  const {
    isOnline, isWebSocketConnected, syncStatus, lastSyncedAt,
    activeUsers, documentId,
    wsMessagesSent, wsMessagesReceived, wsBytesSent, wsBytesReceived,
  } = useEditorStore();

  const {
    syncLatencySamples, lastRecoveryTimeMs,
    totalMergeAttempts, successfulMerges,
    lastAiSummaryTimeMs,
    getLatencyStats, getMergeSuccessRate,
  } = useMetricsStore();

  const latencyStats = getLatencyStats();

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-72 border-l border-border-subtle bg-bg-secondary overflow-y-auto shrink-0 diagnostics-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-light" />
          <span className="text-sm font-semibold text-text-primary">Diagnostics</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Connection */}
        <section>
          <h4 className="text-[0.625rem] uppercase tracking-wider text-text-muted mb-2 font-semibold">Connection</h4>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Internet</span>
              <div className="flex items-center gap-1.5">
                <StatusDot active={isOnline} />
                <span className="text-xs font-medium text-text-primary">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">WebSocket</span>
              <div className="flex items-center gap-1.5">
                <StatusDot active={isWebSocketConnected} />
                <span className="text-xs font-medium text-text-primary">{isWebSocketConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Sync Status</span>
              <span className={`text-xs font-medium ${
                syncStatus === 'synced' ? 'text-success' :
                syncStatus === 'syncing' ? 'text-info' :
                syncStatus === 'offline' ? 'text-warning' : 'text-text-muted'
              }`}>
                {syncStatus.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Persistence</span>
              <div className="flex items-center gap-1.5">
                <StatusDot active={true} color="bg-success" />
                <span className="text-xs font-medium text-text-primary">ACTIVE</span>
              </div>
            </div>
          </div>
        </section>

        {/* Document Info */}
        <section>
          <h4 className="text-[0.625rem] uppercase tracking-wider text-text-muted mb-2 font-semibold">Document</h4>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Room ID</span>
              <span className="text-xs font-mono text-text-primary truncate max-w-[120px]" title={documentId || ''}>
                {documentId ? `...${documentId.slice(-8)}` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Users Online</span>
              <span className="text-xs font-medium text-text-primary">{activeUsers.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Last Sync</span>
              <span className="text-xs text-text-primary">
                {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
        </section>

        {/* Network */}
        <section>
          <h4 className="text-[0.625rem] uppercase tracking-wider text-text-muted mb-2 font-semibold">Network</h4>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Messages Sent</span>
              <span className="text-xs font-medium text-text-primary">{wsMessagesSent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Messages Received</span>
              <span className="text-xs font-medium text-text-primary">{wsMessagesReceived}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Bytes Sent</span>
              <span className="text-xs font-medium text-text-primary">{formatBytes(wsBytesSent)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Bytes Received</span>
              <span className="text-xs font-medium text-text-primary">{formatBytes(wsBytesReceived)}</span>
            </div>
          </div>
        </section>

        {/* Latency */}
        <section>
          <h4 className="text-[0.625rem] uppercase tracking-wider text-text-muted mb-2 font-semibold">Sync Latency</h4>
          {latencyStats ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Min</span>
                <span className="text-xs font-medium text-text-primary">{latencyStats.min} ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Max</span>
                <span className="text-xs font-medium text-text-primary">{latencyStats.max} ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Average</span>
                <span className="text-xs font-medium text-text-primary">{latencyStats.avg} ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Median</span>
                <span className="text-xs font-medium text-text-primary">{latencyStats.median} ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Samples</span>
                <span className="text-xs font-medium text-text-primary">{latencyStats.count}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">No samples yet</p>
          )}
        </section>

        {/* Merge & Recovery */}
        <section>
          <h4 className="text-[0.625rem] uppercase tracking-wider text-text-muted mb-2 font-semibold">Reliability</h4>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Merge Attempts</span>
              <span className="text-xs font-medium text-text-primary">{totalMergeAttempts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Successful</span>
              <span className="text-xs font-medium text-success">{successfulMerges}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Success Rate</span>
              <span className="text-xs font-medium text-text-primary">{getMergeSuccessRate()}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Last Recovery</span>
              <span className="text-xs font-medium text-text-primary">
                {lastRecoveryTimeMs ? `${(lastRecoveryTimeMs / 1000).toFixed(2)}s` : 'N/A'}
              </span>
            </div>
          </div>
        </section>

        {/* AI */}
        <section>
          <h4 className="text-[0.625rem] uppercase tracking-wider text-text-muted mb-2 font-semibold">AI Summary</h4>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Last Generation</span>
            <span className="text-xs font-medium text-text-primary">
              {lastAiSummaryTimeMs ? `${(lastAiSummaryTimeMs / 1000).toFixed(2)}s` : 'N/A'}
            </span>
          </div>
        </section>
      </div>
    </motion.div>
  );
};
