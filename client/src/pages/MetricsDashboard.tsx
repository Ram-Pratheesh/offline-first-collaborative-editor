import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Activity, Zap, Clock, Shield, Wifi,
  HardDrive, Brain, CheckCircle, XCircle, RotateCcw,
  Download,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useEditorStore } from '../store/editorStore';
import { useMetricsStore } from '../store/metricsStore';

interface TestScenario {
  id: number;
  name: string;
  description: string;
  expected: string;
  status: 'pending' | 'pass' | 'fail' | 'running';
}

const initialScenarios: TestScenario[] = [
  { id: 1, name: 'Normal Collaboration', description: 'User A and User B online, both edit', expected: 'Changes synchronize correctly', status: 'pending' },
  { id: 2, name: 'User Goes Offline', description: 'User A disconnects internet, continues editing', expected: 'Document remains editable, changes persist locally', status: 'pending' },
  { id: 3, name: 'Reconnection', description: 'User A reconnects after offline editing', expected: 'Offline changes synchronize automatically', status: 'pending' },
  { id: 4, name: 'Concurrent Editing', description: 'User A and B edit simultaneously', expected: 'No lost edits (Yjs CRDT merge)', status: 'pending' },
  { id: 5, name: 'Multiple Offline Users', description: 'Both users go offline, make changes, reconnect', expected: 'All changes eventually converge', status: 'pending' },
  { id: 6, name: 'Same Location Editing', description: 'Two users edit the same paragraph simultaneously', expected: 'Yjs handles concurrent ops without conflict popup', status: 'pending' },
  { id: 7, name: 'Refresh While Offline', description: 'User makes offline edits, refreshes browser', expected: 'Changes remain via IndexedDB persistence', status: 'pending' },
  { id: 8, name: 'Close and Reopen', description: 'User edits offline, closes browser, reopens', expected: 'Local changes restored from IndexedDB', status: 'pending' },
  { id: 9, name: 'Network Interruption During Sync', description: 'Disconnect/reconnect during active sync', expected: 'System eventually reaches consistent state', status: 'pending' },
  { id: 10, name: 'Different Documents', description: 'User A opens doc/abc, User B opens doc/xyz', expected: 'They do NOT see each other\'s edits', status: 'pending' },
];

const MetricsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    wsMessagesSent, wsMessagesReceived, wsBytesSent, wsBytesReceived,
    isOnline, isWebSocketConnected, syncStatus,
  } = useEditorStore();
  const {
    syncLatencySamples, lastRecoveryTimeMs, recoveryTimeSamples,
    totalMergeAttempts, successfulMerges,
    lastAiSummaryTimeMs, aiSummaryTimeSamples,
    lastConsistency,
    getLatencyStats, getRecoveryStats, getMergeSuccessRate,
    clearAll,
  } = useMetricsStore();

  const [scenarios, setScenarios] = useState<TestScenario[]>(initialScenarios);

  const latencyStats = getLatencyStats();
  const recoveryStats = getRecoveryStats();

  const toggleScenario = (id: number) => {
    setScenarios((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextStatus = s.status === 'pending' ? 'pass' : s.status === 'pass' ? 'fail' : 'pending';
        return { ...s, status: nextStatus };
      })
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const exportMetrics = () => {
    const metrics = {
      timestamp: new Date().toISOString(),
      syncLatency: latencyStats,
      syncLatencySamples: syncLatencySamples.slice(-20),
      offlineRecovery: {
        lastRecoveryMs: lastRecoveryTimeMs,
        stats: recoveryStats,
        samples: recoveryTimeSamples,
      },
      mergeReliability: {
        totalAttempts: totalMergeAttempts,
        successful: successfulMerges,
        successRate: getMergeSuccessRate(),
      },
      documentConsistency: lastConsistency,
      networkUsage: {
        messagesSent: wsMessagesSent,
        messagesReceived: wsMessagesReceived,
        bytesSent: wsBytesSent,
        bytesReceived: wsBytesReceived,
      },
      aiSummary: {
        lastTimeMs: lastAiSummaryTimeMs,
        samples: aiSummaryTimeSamples,
      },
      testScenarios: scenarios.map((s) => ({
        name: s.name,
        status: s.status,
      })),
    };

    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collabedit-metrics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const MetricCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, icon, children }) => (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #ebe6f0',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 24px rgba(94, 55, 143, 0.04)',
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#faf7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#171432' }}>{title}</h3>
      </div>
      {children}
    </div>
  );

  const StatRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
    label,
    value,
    highlight,
  }) => (
    <div className="flex items-center justify-between py-2">
      <span style={{ fontSize: '14px', color: '#656180', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '15px', fontWeight: 700, color: highlight ? '#10bf7a' : '#171432' }}>
        {value}
      </span>
    </div>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 10% 92%, #ffd7e8 0, transparent 24%), radial-gradient(circle at 88% 95%, #ded1ff 0, transparent 23%), linear-gradient(135deg, #fff7f8 0%, #fdf7ff 50%, #f3e8ff 100%)',
      }}
    >
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #ebe6f0',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 0,
                borderRadius: '12px',
                background: '#faf7ff',
                color: '#656180',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <Activity size={24} color="#803cf0" />
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#171432' }}>
              Collaboration Diagnostics
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearAll}
              title="Reset Metrics"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 16px',
                height: '40px',
                borderRadius: '12px',
                border: '1px solid #ebe6f0',
                background: '#ffffff',
                color: '#656180',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={exportMetrics}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 20px',
                height: '40px',
                borderRadius: '12px',
                border: 0,
                background: 'linear-gradient(90deg, #ff4d86, #803cf0)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(203, 61, 200, 0.2)',
              }}
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export JSON</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Current Status */}
        <div
          className="flex items-center gap-6 flex-wrap"
          style={{
            background: '#ffffff',
            border: '1px solid #ebe6f0',
            borderRadius: '16px',
            padding: '16px 24px',
            boxShadow: '0 4px 12px rgba(94, 55, 143, 0.03)',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: isOnline ? '#10bf7a' : '#e59b22' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#656180' }}>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: isWebSocketConnected ? '#10bf7a' : '#a19cb5' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#656180' }}>WebSocket {isWebSocketConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: syncStatus === 'synced' ? '#10bf7a' : syncStatus === 'syncing' ? '#4b93f4' : syncStatus === 'offline' ? '#e59b22' : '#a19cb5'
            }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#656180', textTransform: 'capitalize' }}>{syncStatus}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* A. Sync Latency */}
          <MetricCard title="Sync Latency" icon={<Zap className="w-4 h-4 text-warning" />}>
            {latencyStats ? (
              <>
                <StatRow label="Min" value={`${latencyStats.min} ms`} />
                <StatRow label="Max" value={`${latencyStats.max} ms`} />
                <StatRow label="Average" value={`${latencyStats.avg} ms`} />
                <StatRow label="Median" value={`${latencyStats.median} ms`} />
                <StatRow label="Samples" value={`${latencyStats.count}`} />
              </>
            ) : (
              <p className="text-xs text-text-muted italic py-4 text-center">
                Edit a document to start collecting latency samples
              </p>
            )}
          </MetricCard>

          {/* B. Offline Recovery */}
          <MetricCard title="Offline Recovery" icon={<Clock className="w-4 h-4 text-info" />}>
            <StatRow
              label="Last Recovery"
              value={lastRecoveryTimeMs ? `${(lastRecoveryTimeMs / 1000).toFixed(2)}s` : 'N/A'}
            />
            {recoveryStats ? (
              <>
                <StatRow label="Min" value={`${(recoveryStats.min / 1000).toFixed(2)}s`} />
                <StatRow label="Max" value={`${(recoveryStats.max / 1000).toFixed(2)}s`} />
                <StatRow label="Average" value={`${(recoveryStats.avg / 1000).toFixed(2)}s`} />
                <StatRow label="Samples" value={`${recoveryStats.count}`} />
              </>
            ) : (
              <p className="text-xs text-text-muted italic py-2 text-center">
                Go offline and reconnect to measure
              </p>
            )}
          </MetricCard>

          {/* C. Document Consistency */}
          <MetricCard title="Document Consistency" icon={<Activity className="w-4 h-4 text-success" />}>
            {lastConsistency ? (
              <>
                <StatRow label="Clients Checked" value={`${lastConsistency.clientsChecked}`} />
                <StatRow label="Consistent Clients" value={`${lastConsistency.consistentClients}`} highlight />
                <StatRow label="Consistency Rate" value={`${lastConsistency.consistencyRate}%`} highlight={lastConsistency.consistencyRate === 100} />
                <StatRow label="Status" value={lastConsistency.status} highlight={lastConsistency.status === 'CONSISTENT'} />
              </>
            ) : (
              <p className="text-xs text-text-muted italic py-4 text-center">
                Open a document in multiple tabs to measure consistency
              </p>
            )}
          </MetricCard>

          {/* D. Merge Success Rate */}
          <MetricCard title="Merge Reliability" icon={<Shield className="w-4 h-4 text-success" />}>
            <StatRow label="Total Attempts" value={`${totalMergeAttempts}`} />
            <StatRow label="Successful" value={`${successfulMerges}`} highlight />
            <StatRow label="Failed" value={`${totalMergeAttempts - successfulMerges}`} />
            <StatRow
              label="Success Rate"
              value={`${getMergeSuccessRate()}%`}
              highlight={getMergeSuccessRate() >= 95}
            />
          </MetricCard>

          {/* E. Network Usage */}
          <MetricCard title="Network Usage" icon={<Wifi className="w-4 h-4 text-cyan-accent" />}>
            <StatRow label="Messages Sent" value={`${wsMessagesSent}`} />
            <StatRow label="Messages Received" value={`${wsMessagesReceived}`} />
            <StatRow label="Bytes Sent" value={formatBytes(wsBytesSent)} />
            <StatRow label="Bytes Received" value={formatBytes(wsBytesReceived)} />
            <StatRow label="Total Traffic" value={formatBytes(wsBytesSent + wsBytesReceived)} />
          </MetricCard>

          {/* D. Persistence */}
          <MetricCard title="Persistence" icon={<HardDrive className="w-4 h-4 text-purple-light" />}>
            <StatRow label="Storage" value="IndexedDB" />
            <StatRow label="Status" value="Active" highlight />
            <p className="text-xs text-text-muted mt-2">
              Yjs document state is persisted to IndexedDB via y-indexeddb.
              Edits survive browser refresh and closure.
            </p>
          </MetricCard>

          {/* G. AI Summary Time */}
          <MetricCard title="AI Summary" icon={<Brain className="w-4 h-4 text-pink-accent" />}>
            <StatRow
              label="Last Generation"
              value={lastAiSummaryTimeMs ? `${(lastAiSummaryTimeMs / 1000).toFixed(2)}s` : 'N/A'}
            />
            {aiSummaryTimeSamples.length > 0 && (
              <>
                <StatRow
                  label="Average"
                  value={`${(aiSummaryTimeSamples.reduce((a, b) => a + b, 0) / aiSummaryTimeSamples.length / 1000).toFixed(2)}s`}
                />
                <StatRow label="Samples" value={`${aiSummaryTimeSamples.length}`} />
              </>
            )}
          </MetricCard>
        </div>

        {/* Test Scenarios */}
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#171432', marginBottom: '8px' }}>Test Scenarios</h2>
          <p style={{ fontSize: '15px', color: '#656180', marginBottom: '24px' }}>
            Click each scenario to toggle its status (pending → pass → fail → pending).
            Results are included in the JSON export.
          </p>
          <div className="space-y-3">
            {scenarios.map((scenario) => (
              <motion.div
                key={scenario.id}
                onClick={() => toggleScenario(scenario.id)}
                whileTap={{ scale: 0.99 }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #ebe6f0',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(94, 55, 143, 0.03)',
                  transition: 'border-color 0.2s',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 shrink-0">
                    {scenario.status === 'pass' ? (
                      <CheckCircle size={24} color="#10bf7a" />
                    ) : scenario.status === 'fail' ? (
                      <XCircle size={24} color="#f43f5e" />
                    ) : (
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #d1cadd' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#a19cb5', background: '#faf7ff', padding: '2px 6px', borderRadius: '4px' }}>TEST {scenario.id}</span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#171432' }}>{scenario.name}</span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#656180', margin: '4px 0 8px 0' }}>{scenario.description}</p>
                    <p style={{ fontSize: '13px', color: '#8a849d', margin: 0 }}>
                      <span style={{ fontWeight: 600, color: '#171432' }}>Expected:</span> {scenario.expected}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ebe6f0',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(94, 55, 143, 0.04)',
          }}
        >
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 800, color: '#171432' }}>Test Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#10bf7a' }}>
                {scenarios.filter((s) => s.status === 'pass').length}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#8a849d', marginTop: '4px' }}>Passed</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#f43f5e' }}>
                {scenarios.filter((s) => s.status === 'fail').length}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#8a849d', marginTop: '4px' }}>Failed</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#a19cb5' }}>
                {scenarios.filter((s) => s.status === 'pending').length}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#8a849d', marginTop: '4px' }}>Pending</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#171432' }}>
                {scenarios.length}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#8a849d', marginTop: '4px' }}>Total</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MetricsDashboard;
