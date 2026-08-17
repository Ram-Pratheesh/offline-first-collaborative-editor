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
    <div className="bg-bg-card border border-border-subtle rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );

  const StatRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
    label,
    value,
    highlight,
  }) => (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-success' : 'text-text-primary'}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Activity className="w-5 h-5 text-purple-light" />
            <h1 className="text-lg font-semibold text-text-primary">Collaboration Diagnostics</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearAll} title="Reset Metrics">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button size="sm" onClick={exportMetrics}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export JSON</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Current Status */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-success' : 'bg-warning'}`} />
            <span className="text-sm text-text-secondary">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isWebSocketConnected ? 'bg-success' : 'bg-text-muted'}`} />
            <span className="text-sm text-text-secondary">WebSocket {isWebSocketConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              syncStatus === 'synced' ? 'bg-success' :
              syncStatus === 'syncing' ? 'bg-info animate-pulse' :
              syncStatus === 'offline' ? 'bg-warning' : 'bg-text-muted'
            }`} />
            <span className="text-sm text-text-secondary capitalize">{syncStatus}</span>
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

          {/* C. Merge Success Rate */}
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
          <h2 className="text-lg font-semibold text-text-primary mb-4">Test Scenarios</h2>
          <p className="text-sm text-text-secondary mb-4">
            Click each scenario to toggle its status (pending → pass → fail → pending).
            Results are included in the JSON export.
          </p>
          <div className="space-y-2">
            {scenarios.map((scenario) => (
              <motion.div
                key={scenario.id}
                className="bg-bg-card border border-border-subtle rounded-xl p-4 cursor-pointer hover:border-border-accent transition-colors"
                onClick={() => toggleScenario(scenario.id)}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {scenario.status === 'pass' ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : scenario.status === 'fail' ? (
                      <XCircle className="w-5 h-5 text-error" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-text-muted">TEST {scenario.id}</span>
                      <span className="text-sm font-medium text-text-primary">{scenario.name}</span>
                    </div>
                    <p className="text-xs text-text-secondary">{scenario.description}</p>
                    <p className="text-xs text-text-muted mt-1">
                      <span className="font-medium">Expected:</span> {scenario.expected}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {scenarios.filter((s) => s.status === 'pass').length}
              </div>
              <div className="text-xs text-text-muted">Passed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-error">
                {scenarios.filter((s) => s.status === 'fail').length}
              </div>
              <div className="text-xs text-text-muted">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-secondary">
                {scenarios.filter((s) => s.status === 'pending').length}
              </div>
              <div className="text-xs text-text-muted">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {scenarios.length}
              </div>
              <div className="text-xs text-text-muted">Total</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MetricsDashboard;
