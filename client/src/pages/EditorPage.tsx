import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Wifi,
  WifiOff,
  Loader2,
  Users,
  Cloud,
  CloudOff,
  Sparkles,
  ChevronRight,
  Bug,
  Star,
  FileText,
} from 'lucide-react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Awareness } from 'y-protocols/awareness';
import * as awarenessProtocol from 'y-protocols/awareness';
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

function cyrb53(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

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
    recordMergeAttempt, recordAiSummaryTime, updateConsistency,
  } = useMetricsStore();

  const [doc, setDoc] = useState<DocType | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [changeSummary, setChangeSummary] = useState<ChangeSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [awareness, setAwareness] = useState<Awareness | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const ydocRef = useRef<Y.Doc | null>(null);
  const indexeddbRef = useRef<IndexeddbPersistence | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);
  const destroyedRef = useRef(false);
  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const lastSyncedHashRef = useRef<string | null>(null);

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

    // Create Awareness for collaborative cursors
    const cursorColors = ['#f87171', '#fb923c', '#4ade80', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6', '#e879f9'];
    const colorIndex = Math.floor(Math.random() * cursorColors.length);
    const aw = new Awareness(doc);
    aw.setLocalStateField('user', {
      name: user.name || 'Anonymous',
      color: cursorColors[colorIndex],
      colorLight: cursorColors[colorIndex] + '40',
    });
    aw.setLocalStateField('consistency', { documentHash: cyrb53(doc.getXmlFragment('default').toString()) });
    awarenessRef.current = aw;
    setAwareness(aw);

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
      addToast({ type: 'success', title: '🌐 Internet Restored', message: 'You are back online.', duration: 3000 });
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
      if (awarenessRef.current) {
        awarenessProtocol.removeAwarenessStates(awarenessRef.current, [doc.clientID], null);
        awarenessRef.current.destroy();
      }
      idbProvider.destroy();
      doc.destroy();
      setYdoc(null);
      setAwareness(null);
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
            } else if (msg.type === 'awareness') {
              // Apply remote awareness update (other users' cursor positions)
              if (awarenessRef.current && msg.data) {
                const update = new Uint8Array(msg.data);
                awarenessProtocol.applyAwarenessUpdate(awarenessRef.current, update, ws);
              }
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
          
          // Update last synced hash
          lastSyncedHashRef.current = cyrb53(ydoc.getXmlFragment('default').toString());

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
        setOfflineStart(); // Start tracking offline recovery time
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
        setOfflineStart();
      };

      // Forward local updates
      const updateHandler = (update: Uint8Array, origin: any) => {
        console.log(`[Yjs] Local update detected, origin:`, origin);
        
        // Update local consistency hash
        const docText = ydoc.getXmlFragment('default').toString();
        const docHash = cyrb53(docText);
        if (awarenessRef.current) {
          awarenessRef.current.setLocalStateField('consistency', { documentHash: docHash });
        }

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

      // Forward local awareness changes to server
      const awarenessHandler = ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: any) => {
        if (awarenessRef.current) {
          // Compute convergence metric
          const states = Array.from(awarenessRef.current.getStates().values());
          let totalChecked = 0;
          const hashCounts = new Map<string, number>();
          let localHash = awarenessRef.current.getLocalState()?.consistency?.documentHash;
          
          states.forEach((state: any) => {
            if (state.consistency?.documentHash) {
              totalChecked++;
              const hash = state.consistency.documentHash;
              hashCounts.set(hash, (hashCounts.get(hash) || 0) + 1);
            }
          });

          if (totalChecked > 0 && localHash) {
            let consistentWithLocal = hashCounts.get(localHash) || 0;
            let status: 'CONSISTENT' | 'DIVERGENT' = consistentWithLocal === totalChecked ? 'CONSISTENT' : 'DIVERGENT';

            // If offline and we are the only one left in awareness, compare against the last synced server state
            if (totalChecked === 1 && wsRef.current?.readyState !== WebSocket.OPEN) {
              if (lastSyncedHashRef.current && localHash !== lastSyncedHashRef.current) {
                status = 'DIVERGENT';
                consistentWithLocal = 0; // We have diverged from the server
              }
            }

            updateConsistency({
              clientsChecked: totalChecked,
              consistentClients: consistentWithLocal,
              consistencyRate: Math.round((consistentWithLocal / totalChecked) * 100),
              status,
            });
          }
        }

        if (origin === ws) return; // Don't echo back server updates
        const changedClients = added.concat(updated, removed);
        if (awarenessRef.current && ws.readyState === WebSocket.OPEN) {
          const encodedUpdate = awarenessProtocol.encodeAwarenessUpdate(awarenessRef.current, changedClients);
          ws.send(JSON.stringify({ type: 'awareness', data: Array.from(encodedUpdate) }));
        }
      };
      if (awarenessRef.current) {
        awarenessRef.current.on('update', awarenessHandler);
      }
    } catch {
      console.error('WS connection failed');
    }
  }

  const lastSendTimestampRef = useRef<number>(0);

  const editor = useEditor(
    {
      extensions: ydoc ? createExtensions(ydoc, awareness || undefined) : createFallbackExtensions(),
      editorProps: {
        attributes: {
          class: 'tiptap-editor focus:outline-none',
        },
      },
      immediatelyRender: false,
    },
    [ydoc, user, awareness]
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
        if (!navigator.onLine || !error.response || error.response.status >= 500) {
          // Offline, Server Down, or Vite Proxy Error (502/504) — use cached title or show generic
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
    const start = Date.now();
    try {
      const summary = await documentService.getTrackedSummary(id);
      setChangeSummary(summary);
      recordAiSummaryTime(Date.now() - start);
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to generate summary' });
    } finally {
      setSummaryLoading(false);
    }
  };

  const isStarred = doc?.isStarredBy?.includes(user?._id || '');

  const handleStarToggle = async () => {
    if (!doc) return;
    try {
      const newIsStarred = await documentService.toggleStar(doc._id);
      setDoc(prev => {
        if (!prev) return prev;
        const newStarredBy = newIsStarred
          ? [...prev.isStarredBy, user?._id || '']
          : prev.isStarredBy.filter(id => id !== user?._id);
        return { ...prev, isStarredBy: newStarredBy };
      });
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to update star status' });
    }
  };

  if (loadError) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box',
          background: 'radial-gradient(circle at 10% 92%, #ffd7e8 0, transparent 24%), radial-gradient(circle at 88% 95%, #ded1ff 0, transparent 23%), linear-gradient(135deg, #fff7f8 0%, #fdf7ff 50%, #f3e8ff 100%)',
        }}
      >
        <div style={{ maxWidth: '520px', width: '100%', background: '#ffffff', borderRadius: '32px', padding: '64px 48px', boxSizing: 'border-box', textAlign: 'center', boxShadow: '0 24px 64px rgba(94, 55, 143, 0.12)', border: '1px solid #ebe6f0' }}>
          <div style={{ margin: '0 auto 32px', width: '96px', height: '96px', background: '#fff0f2', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 4px 12px rgba(244, 63, 94, 0.1)' }}>
            <CloudOff size={48} color="#f43f5e" />
          </div>
          <h2 style={{ margin: '0 0 16px', fontSize: '32px', fontWeight: 800, color: '#171432', letterSpacing: '-0.04em' }}>
            {loadError}
          </h2>
          <p style={{ margin: '0 0 40px', fontSize: '16px', color: '#656180', lineHeight: 1.6 }}>
            The document you're looking for might have been deleted, or you don't have permission to view it.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/dashboard')}
            icon={<ArrowLeft size={20} />}
            style={{ width: '100%' }}
          >
            Back to Dashboard
          </Button>
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
  <div
    style={{
      minHeight: '100vh',
      padding: '14px',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      background:
        'radial-gradient(circle at 10% 92%, #ffd7e8 0, transparent 24%), radial-gradient(circle at 88% 95%, #ded1ff 0, transparent 23%), linear-gradient(135deg, #fff7f8 0%, #fdf7ff 50%, #f3e8ff 100%)',
    }}
  >
    <ConnectionBanner />

    <header
      style={{
        minHeight: '100px',
        height: 'auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        padding: '16px 20px',
        boxSizing: 'border-box',
        border: '1px solid #ebe6f0',
        borderRadius: '22px',
        background: 'rgba(255,255,255,.93)',
        boxShadow: '0 12px 30px rgba(94, 55, 143, .08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          minWidth: 0,
          flex: '1 1 auto',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            width: '60px',
            height: '60px',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            border: '1px solid #e6e0eb',
            borderRadius: '16px',
            background: '#ffffff',
            color: '#ff4c87',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={27} />
        </button>

        <span
          style={{
            width: '44px',
            height: '44px',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            borderRadius: '12px',
            color: '#ff4c87',
            background: '#fff0f6',
          }}
        >
          <FileText size={27} />
        </span>

        <input
          type="text"
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder="Untitled Document"
          style={{
            width: '100%',
            maxWidth: '200px',
            minWidth: '100px',
            flex: '1 1 auto',
            border: 0,
            outline: 0,
            background: 'transparent',
            color: '#171432',
            fontSize: '24px',
            fontWeight: 800,
          }}
        />

        <button
          type="button"
          onClick={handleStarToggle}
          style={{
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <Star
            size={24}
            fill={isStarred ? '#f5bc38' : 'none'}
            style={{
              color: isStarred ? '#f5bc38' : '#656180',
            }}
          />
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          flex: '1 1 auto',
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            color:
              syncStatus === 'offline'
                ? '#e59b22'
                : syncStatus === 'syncing'
                  ? '#4b93f4'
                  : '#10bf7a',
            fontSize: '16px',
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: '11px',
              height: '11px',
              borderRadius: '50%',
              background:
                syncStatus === 'offline'
                  ? '#e59b22'
                  : syncStatus === 'syncing'
                    ? '#4b93f4'
                    : '#10bf7a',
            }}
          />
          {syncStatus === 'offline'
            ? 'OFFLINE'
            : syncStatus === 'syncing'
              ? 'SYNCING'
              : 'SYNCED'}
        </div>

        <span
          style={{
            width: '1px',
            height: '30px',
            background: '#e5e0eb',
          }}
        />

        <span
          style={{
            color: '#8a849d',
            fontSize: '18px',
          }}
        >
          {lastSyncedAt
            ? lastSyncedAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            : '00:00:00'}
        </span>

        {activeUsers.length > 0 ? (
          <div
            style={{
              display: 'flex',
              marginLeft: '6px',
            }}
          >
            {activeUsers.slice(0, 3).map((activeUser, index) => (
              <span
                key={activeUser.userId}
                title={activeUser.userName}
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'grid',
                  placeItems: 'center',
                  marginLeft: index === 0 ? 0 : '-9px',
                  border: '3px solid #ffffff',
                  borderRadius: '50%',
                  color: '#ffffff',
                  background: activeUser.color,
                  fontWeight: 800,
                }}
              >
                {activeUser.userName.substring(0, 2).toUpperCase()}
              </span>
            ))}
          </div>
        ) : (
          <span
            title={user?.name || 'User'}
            style={{
              width: '44px',
              height: '44px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #ff5386, #7f43e8)',
              fontWeight: 800,
            }}
          >
            {user?.name?.substring(0, 2).toUpperCase() || 'U'}
          </span>
        )}

        <button
          type="button"
          onClick={handleShowSummary}
          title="AI Change Summary"
          style={{
            width: '45px',
            height: '45px',
            display: 'grid',
            placeItems: 'center',
            border: 0,
            borderRadius: '13px',
            color: '#625a89',
            background: '#faf7ff',
            cursor: 'pointer',
          }}
        >
          <Sparkles size={23} />
        </button>

        <button
          type="button"
          onClick={() => setShowDiagnostics((current) => !current)}
          title="Diagnostics"
          style={{
            width: '45px',
            height: '45px',
            display: 'grid',
            placeItems: 'center',
            border: 0,
            borderRadius: '13px',
            color: '#625a89',
            background: '#faf7ff',
            cursor: 'pointer',
          }}
        >
          <Bug size={22} />
        </button>

        <button
          type="button"
          onClick={() => setShowShare(true)}
          style={{
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '11px',
            padding: '0 26px',
            border: 0,
            borderRadius: '16px',
            color: '#ffffff',
            background: 'linear-gradient(90deg, #ff4d86, #803cf0)',
            boxShadow: '0 10px 22px rgba(203, 61, 200, .24)',
            fontSize: '18px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <Share2 size={23} />
          Share
        </button>
      </div>
    </header>

    <div
      style={{
        marginTop: '14px',
        padding: '18px 24px',
        border: '1px solid #ebe6f0',
        borderRadius: '18px',
        background: 'rgba(255,255,255,.93)',
        boxShadow: '0 10px 24px rgba(94, 55, 143, .05)',
      }}
    >
      <EditorToolbar editor={editor} />
    </div>

    <main
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 260px)',
        marginTop: '8px',
        overflowY: 'auto',
        border: '1px solid #ebe6f0',
        borderRadius: '18px',
        background: '#ffffff',
        boxShadow: '0 12px 30px rgba(94, 55, 143, .06)',
      }}
    >
      <style>
        {`
          .tiptap-editor {
            min-height: calc(100vh - 300px);
            padding: 54px 58px;
            color: #171432;
            font-size: 19px;
            line-height: 1.85;
            outline: none;
          }

          .tiptap-editor p {
            margin: 0 0 22px;
          }

          .tiptap-editor h1,
          .tiptap-editor h2,
          .tiptap-editor h3 {
            color: #171432;
          }

          @media (max-width: 900px) {
            .tiptap-editor {
              padding: 30px 24px;
              font-size: 17px;
            }
          }
        `}
      </style>

      <EditorContent editor={editor} />

      <AnimatePresence>
        {showDiagnostics && (
          <DiagnosticsPanel onClose={() => setShowDiagnostics(false)} />
        )}
      </AnimatePresence>
    </main>

    {doc && (
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        document={doc}
        onUpdate={(updatedDocument) => setDoc(updatedDocument)}
      />
    )}

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
