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
    style={{
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: active ? (color || '#10bf7a') : '#d1cadd',
    }}
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
    lastAiSummaryTimeMs, lastConsistency,
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
      initial={{ y: -10, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -10, opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        top: '120px',
        right: '40px',
        zIndex: 100,
        width: '320px',
        maxHeight: 'calc(100vh - 160px)',
        overflowY: 'auto',
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        border: '1px solid #ebe6f0',
        borderRadius: '20px',
        boxShadow: '0 16px 40px rgba(94, 55, 143, 0.12)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #ebe6f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="#803cf0" />
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#171432' }}>
            Diagnostics
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            border: 0,
            borderRadius: '8px',
            background: '#faf7ff',
            color: '#656180',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Connection */}
        <section>
          <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8a849d', marginBottom: '12px', fontWeight: 800, margin: 0 }}>Connection</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Internet</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StatusDot active={isOnline} />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>WebSocket</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StatusDot active={isWebSocketConnected} />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{isWebSocketConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Sync Status</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: syncStatus === 'synced' ? '#10bf7a' : syncStatus === 'syncing' ? '#4b93f4' : syncStatus === 'offline' ? '#e59b22' : '#8a849d' }}>
                {syncStatus.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Persistence</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StatusDot active={true} color="#10bf7a" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>ACTIVE</span>
              </div>
            </div>
          </div>
        </section>

        {/* Document Info */}
        <section>
          <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8a849d', marginBottom: '12px', fontWeight: 800, margin: 0 }}>Document</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Room ID</span>
              <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, color: '#171432' }} title={documentId || ''}>
                {documentId ? `...${documentId.slice(-8)}` : 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Users Online</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{activeUsers.length}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Last Sync</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>
                {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
        </section>

        {/* Consistency */}
        <section>
          <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8a849d', marginBottom: '12px', fontWeight: 800, margin: 0 }}>Consistency (CRDT)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Status</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StatusDot active={lastConsistency?.status === 'CONSISTENT'} color={lastConsistency?.status === 'CONSISTENT' ? '#10bf7a' : '#e59b22'} />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{lastConsistency?.status || 'N/A'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Rate</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: lastConsistency?.consistencyRate === 100 ? '#10bf7a' : '#171432' }}>
                {lastConsistency ? `${lastConsistency.consistencyRate}%` : 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Clients Matched</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>
                {lastConsistency ? `${lastConsistency.consistentClients} / ${lastConsistency.clientsChecked}` : 'N/A'}
              </span>
            </div>
          </div>
        </section>

        {/* Network */}
        <section>
          <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8a849d', marginBottom: '12px', fontWeight: 800, margin: 0 }}>Network</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Messages Sent</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{wsMessagesSent}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Messages Received</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{wsMessagesReceived}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Bytes Sent</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{formatBytes(wsBytesSent)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Bytes Received</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{formatBytes(wsBytesReceived)}</span>
            </div>
          </div>
        </section>

        {/* Latency */}
        <section>
          <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8a849d', marginBottom: '12px', fontWeight: 800, margin: 0 }}>Sync Latency</h4>
          {latencyStats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Min</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{latencyStats.min} ms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Max</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{latencyStats.max} ms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Average</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{latencyStats.avg} ms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Median</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{latencyStats.median} ms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Samples</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{latencyStats.count}</span>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: '#8a849d', fontStyle: 'italic', marginTop: '12px', margin: '12px 0 0 0' }}>No samples yet</p>
          )}
        </section>

        {/* Merge & Recovery */}
        <section>
          <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8a849d', marginBottom: '12px', fontWeight: 800, margin: 0 }}>Reliability</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Merge Attempts</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{totalMergeAttempts}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Successful</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#10bf7a' }}>{successfulMerges}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Success Rate</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>{getMergeSuccessRate()}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Last Recovery</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>
                {lastRecoveryTimeMs ? `${(lastRecoveryTimeMs / 1000).toFixed(2)}s` : 'N/A'}
              </span>
            </div>
          </div>
        </section>

        {/* AI */}
        <section>
          <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8a849d', marginBottom: '12px', fontWeight: 800, margin: 0 }}>AI Summary</h4>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
            <span style={{ fontSize: '13px', color: '#656180', fontWeight: 600 }}>Last Generation</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#171432' }}>
              {lastAiSummaryTimeMs ? `${(lastAiSummaryTimeMs / 1000).toFixed(2)}s` : 'N/A'}
            </span>
          </div>
        </section>
      </div>
    </motion.div>
  );
};
