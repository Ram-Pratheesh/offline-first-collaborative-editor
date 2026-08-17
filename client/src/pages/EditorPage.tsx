import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Share2, Wifi, WifiOff,
  Loader2, Users, Cloud, CloudOff, Sparkles, ChevronRight,
  Bug,
} from 'lucide-react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { EditorSkeleton } from '../components/ui/Skeleton';
import { EditorToolbar } from '../editor/EditorToolbar';
import { createExtensions, createFallbackExtensions } from '../editor/extensions';
import { ShareModal } from '../components/shared/ShareModal';
import { ChangeSummaryModal } from '../components/shared/ChangeSummaryModal';
import { ConnectionBanner } from '../components/shared/ConnectionBanner';
import { DiagnosticsPanel } from '../components/shared/DiagnosticsPanel';
import { useAuthStore } from '../store/authStore';
import { useEditorStore } from '../store/editorStore';
import { useMetricsStore } from '../store/metricsStore';
import { useNotificationStore } from '../store/notificationStore';
import { documentService } from '../services/documentService';
import type { Document as DocType, ChangeSummary } from '../types';

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useNotificationStore();
  const {
    syncStatus, isOnline, isWebSocketConnected, isSyncing, lastSyncedAt,
    activeUsers, showChangeSummary,
    setOnline, setWebSocketConnected, setSyncing, setLastSynced,
    setActiveUsers, setShowChangeSummary, setDocumentId,
    recordMessageSent, recordMessageReceived, resetMetrics,
  } = useEditorStore();
  const {
    addLatencySample, setOfflineStart, recordRecovery,
    recordMergeAttempt, recordAiSummaryTime,
  } = useMetricsStore();

  const [doc, setDoc] = useState<DocType | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [changeSummary, setChangeSummary] = useState<ChangeSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const ydocRef = useRef<Y.Doc | null>(null);
  const indexeddbRef = useRef<IndexeddbPersistence | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const destroyedRef = useRef(false);
  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);

  // Diagnostics keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDiagnostics((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Initialize Yjs and editor
  useEffect(() => {
    if (!id || !user) return;

    destroyedRef.current = false;
    reconnectAttemptsRef.current = 0;
    setDocumentId(id);
    resetMetrics();

    const doc = new Y.Doc();
    ydocRef.current = doc;
    setYdoc(doc);

    // IndexedDB persistence
    const idbProvider = new IndexeddbPersistence(`collab-doc-${id}`, doc);
    indexeddbRef.current = idbProvider;

    idbProvider.once('synced', () => {
      console.log('📦 Local content loaded from IndexedDB');
    });

    // WebSocket connection
    const token = localStorage.getItem('accessToken');
    if (token && navigator.onLine) {
      connectWs(id, token, doc);
    }

    // Network listeners
    const handleOnline = () => {
      setOnline(true);
      addToast({ type: 'info', title: '🌐 Internet Restored', message: 'Synchronizing changes...', duration: 3000 });
      const t = localStorage.getItem('accessToken');
      if (t && ydocRef.current) {
        reconnectAttemptsRef.current = 0;
        connectWs(id, t, ydocRef.current);
      }
    };

    const handleOffline = () => {
      setOnline(false);
      setWebSocketConnected(false);
      setOfflineStart();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      addToast({ type: 'warning', title: '✈️ Offline Mode', message: 'Working locally — changes saved offline', duration: 4000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOnline(navigator.onLine);

    return () => {
      destroyedRef.current = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
      idbProvider.destroy();
      doc.destroy();
      setYdoc(null);
      setDocumentId(null);
    };
  }, [id, user]);

  function connectWs(docId: string, token: string, ydoc: Y.Doc) {
    if (destroyedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Close any existing connection first
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname;
    const wsUrl = `${wsProtocol}://${wsHost}:5000/yjs?room=${docId}&token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        setWebSocketConnected(true);
        setSyncing(true);
        reconnectAttemptsRef.current = 0;

        // Ask the server for missing updates by sending our State Vector
        const sv = Y.encodeStateVector(ydoc);
        ws.send(JSON.stringify({ type: 'sync-request', sv: Array.from(sv) }));
      };

      ws.onmessage = (event) => {
        try {
          const dataSize = typeof event.data === 'string'
            ? new Blob([event.data]).size
            : event.data.byteLength;
          recordMessageReceived(dataSize);

          if (typeof event.data === 'string') {
            const msg = JSON.parse(event.data);
            if (msg.type === 'presence') {
              const colors = ['#f87171', '#fb923c', '#4ade80', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6'];
              const uniqueUsers = Array.from(new Map(msg.users.map((u: any) => [u.userId, u])).values());
              setActiveUsers(uniqueUsers.map((u: any, i: number) => ({ ...u, color: colors[i % colors.length] })));
            } else if (msg.type === 'sync-request') {
              // Server is asking for our offline changes. Compute them and send them back as an update!
              const serverSv = new Uint8Array(msg.sv);
              const missingUpdates = Y.encodeStateAsUpdate(ydoc, serverSv);
              ws.send(missingUpdates);
              recordMessageSent(missingUpdates.byteLength);
              
              // We have successfully completed the 2-way sync handshake
              setLastSynced(new Date());
            }
            return;
          }

          const update = new Uint8Array(event.data);
          console.log(`[WebSocket] Received update of size ${update.byteLength}`);
          Y.applyUpdate(ydoc, update, wsRef.current);

          const now = new Date();
          setLastSynced(now);
          recordMergeAttempt(true);

          // Record offline recovery if applicable
          recordRecovery();

          // Estimate sync latency from recent sends
          const elapsed = Date.now() - (lastSendTimestampRef.current || Date.now());
          if (lastSendTimestampRef.current && elapsed < 10000) {
            addLatencySample(elapsed);
          }
        } catch (err) {
          console.error('WS message error:', err);
          recordMergeAttempt(false);
        }
      };

      ws.onclose = (event) => {
        setWebSocketConnected(false);
        if (!destroyedRef.current && navigator.onLine && event.code !== 4001 && event.code !== 4002 && event.code !== 4003) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          if (reconnectAttemptsRef.current <= 10) {
            reconnectTimeoutRef.current = setTimeout(() => connectWs(docId, token, ydoc), delay);
          }
        }
      };

      ws.onerror = () => {
        console.error('❌ WebSocket error');
      };

      // Forward local updates
      const updateHandler = (update: Uint8Array, origin: any) => {
        console.log(`[Yjs] Local update detected, origin:`, origin);
        if (origin !== wsRef.current && ws.readyState === WebSocket.OPEN) {
          console.log(`[Yjs] Sending update of size ${update.byteLength} to server`);
          ws.send(update);
          recordMessageSent(update.byteLength);
          lastSendTimestampRef.current = Date.now();
        } else {
          console.log(`[Yjs] Ignoring update (origin matches WebSocket or WS closed)`);
        }
      };
      ydoc.on('update', updateHandler);
    } catch {
      console.error('WS connection failed');
    }
  }

  const lastSendTimestampRef = useRef<number>(0);

  const editor = useEditor(
    {
      extensions: ydoc ? createExtensions(ydoc) : createFallbackExtensions(),
      editorProps: {
        attributes: {
          class: 'tiptap-editor focus:outline-none',
        },
      },
      immediatelyRender: false,
    },
    [ydoc, user]
  );

  // Fetch document metadata — with offline fallback
  useEffect(() => {
    if (!id) return;
    const fetchDoc = async () => {
      try {
        const d = await documentService.getById(id);
        setDoc(d);
        setTitle(d.title);
        setLoadError(null);
      } catch (error: any) {
        if (!navigator.onLine) {
          // Offline — use cached title or show generic
          setLoadError(null);
          setTitle('Offline Document');
          setDoc({
            _id: id,
            title: 'Offline Document',
            content: '',
            icon: '📄',
            owner: { _id: user?._id || '', name: user?.name || '', email: '' } as any,
            collaborators: [],
            isStarredBy: [],

            lastEditedBy: {} as any,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else if (error.response?.status === 404 || error.response?.status === 403) {
          setLoadError('Document not found or access denied.');
        } else {
          addToast({ type: 'error', title: 'Failed to load document' });
          navigate('/dashboard');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    // Try to auto-join the document first (link-based sharing)
    const autoJoin = async () => {
      try {
        await documentService.joinDocument(id);
      } catch {
        // May fail if already a collaborator or owner — that's fine
      }
      fetchDoc();
    };

    autoJoin();
  }, [id]);

  // Update title with debounce
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    clearTimeout(titleTimeoutRef.current);
    titleTimeoutRef.current = setTimeout(async () => {
      if (id) {
        try {
          await documentService.update(id, { title: newTitle } as any);
        } catch {
          // Silent fail for title updates
        }
      }
    }, 1000);
  };

  // Fetch AI summary with timing instrumentation (uses server-tracked per-user changes)
  const handleShowSummary = async () => {
    if (!id) return;
    setShowChangeSummary(true);
    setSummaryLoading(true);
    const startTime = Date.now();
    try {
      // Call the new tracked changes endpoint — the server has per-user change logs
      const summary = await documentService.getTrackedSummary(id);
      const elapsed = Date.now() - startTime;
      recordAiSummaryTime(elapsed);
      setChangeSummary(summary);
    } catch {
      addToast({ type: 'error', title: 'Failed to generate summary' });
    } finally {
      setSummaryLoading(false);
    }
  };

  // Connection status badge
  const StatusIndicator = () => {
    let dotClass = '';
    let label = '';

    switch (syncStatus) {
      case 'offline':
        dotClass = 'bg-warning';
        label = 'Offline';
        break;
      case 'syncing':
        dotClass = 'bg-info animate-pulse';
        label = 'Syncing';
        break;
      case 'synced':
        dotClass = 'bg-success';
        label = 'Synced';
        break;
      default:
        dotClass = 'bg-text-muted';
        label = 'Connecting';
    }

    return (
      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
        <span>{label}</span>
        {lastSyncedAt && syncStatus === 'synced' && (
          <span className="text-text-muted hidden sm:inline">
            · {lastSyncedAt.toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  };

  // Error / 404 state
  if (loadError) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 text-center space-y-8 glass-strong p-12 sm:p-16 rounded-3xl max-w-xl w-full border border-border-subtle shadow-2xl">
          <div className="w-24 h-24 bg-bg-tertiary rounded-3xl flex items-center justify-center mx-auto shadow-inner shadow-black/20">
            <CloudOff className="w-12 h-12 text-text-muted" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {loadError}
            </h2>
            <p className="text-text-secondary text-lg px-4 leading-relaxed">
              The document you're looking for might have been deleted, or you don't have permission to view it.
            </p>
          </div>

          <div className="pt-4 pb-1 flex justify-center w-full">
            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
              icon={<ArrowLeft className="w-5 h-5" />}
              className="w-full max-w-xs h-14 rounded-xl shadow-xl shadow-purple-500/20"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !ydoc || !editor) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="h-14 glass border-b border-border-subtle" />
        <EditorSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Connection Banner */}
      <ConnectionBanner />

      {/* Top Bar */}
      <header className="sticky top-0 z-40 glass border-b border-border-subtle">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <span className="text-xl shrink-0">{doc?.icon || '📄'}</span>

            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="bg-transparent text-text-primary font-semibold text-lg focus:outline-none min-w-0 flex-1 truncate"
              placeholder="Untitled Document"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <StatusIndicator />

            {/* Active Users */}
            {activeUsers.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 ml-2">
                {activeUsers.slice(0, 3).map((u) => (
                  <div
                    key={u.userId}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-bg-primary"
                    style={{ backgroundColor: u.color }}
                    title={u.userName}
                  >
                    {u.userName.charAt(0).toUpperCase()}
                  </div>
                ))}
                {activeUsers.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-medium text-text-secondary ring-2 ring-bg-primary">
                    +{activeUsers.length - 3}
                  </div>
                )}
              </div>
            )}

            <div className="hidden sm:flex items-center gap-3">
              <Button variant="ghost" onClick={handleShowSummary} title="AI Summary" style={{ padding: '0.5rem' }}>
                <Sparkles className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowDiagnostics((p) => !p)}
                title="Diagnostics (Ctrl+Shift+D)"
                style={{ padding: '0.5rem' }}
              >
                <Bug className="w-5 h-5" />
              </Button>
            </div>

            <Button onClick={() => setShowShare(true)} className="ml-2" style={{ padding: '0.625rem 1.25rem' }}>
              <Share2 className="w-5 h-5" />
              <span className="hidden sm:inline font-semibold">Share</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="sticky top-14 z-30 px-4 sm:px-8 py-2 bg-bg-primary/80 backdrop-blur-sm border-b border-border-subtle/50">
        <EditorToolbar editor={editor} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col relative">
        {/* Editor Content */}
        <main className="flex-1 flex flex-col">
          <div className="editor-paper flex-1" style={{ borderRadius: 0, border: 'none', borderLeft: '1px solid var(--color-border-subtle)', borderRight: '1px solid var(--color-border-subtle)', minHeight: 0 }}>
            <EditorContent editor={editor} />
          </div>
        </main>

        {/* Diagnostics Panel */}
        <AnimatePresence>
          {showDiagnostics && (
            <DiagnosticsPanel onClose={() => setShowDiagnostics(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Share Modal */}
      {doc && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          document={doc}
          onUpdate={(updated) => setDoc(updated)}
        />
      )}

      {/* AI Change Summary Modal */}
      <ChangeSummaryModal
        isOpen={showChangeSummary}
        onClose={() => setShowChangeSummary(false)}
        summary={changeSummary}
        loading={summaryLoading}
      />

    </div>
  );
};

export default EditorPage;
