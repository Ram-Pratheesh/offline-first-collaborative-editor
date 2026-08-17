import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { useEditorStore } from '../store/editorStore';
import { useNotificationStore } from '../store/notificationStore';

interface SyncProvider {
  ydoc: Y.Doc;
  indexeddbProvider: IndexeddbPersistence;
  wsConnection: WebSocket | null;
  destroy: () => void;
}

export function createSyncProvider(
  documentId: string,
  token: string,
  onSyncComplete?: () => void
): SyncProvider {
  const ydoc = new Y.Doc();
  const { setOnline, setWebSocketConnected, setSyncing, setLastSynced } = useEditorStore.getState();
  const { addToast } = useNotificationStore.getState();

  // 1. IndexedDB persistence — loads local state first (instant)
  const indexeddbProvider = new IndexeddbPersistence(`collab-doc-${documentId}`, ydoc);

  indexeddbProvider.once('synced', () => {
    console.log('📦 Content loaded from IndexedDB');
  });

  // 2. WebSocket connection for real-time sync
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const wsHost = window.location.hostname;
  const wsPort = '5000'; // Server port
  const wsUrl = `${wsProtocol}://${wsHost}:${wsPort}/yjs?room=${documentId}&token=${token}`;

  let wsConnection: WebSocket | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout>;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  let destroyed = false;

  function connect() {
    if (destroyed) return;

    try {
      wsConnection = new WebSocket(wsUrl);
      wsConnection.binaryType = 'arraybuffer';

      wsConnection.onopen = () => {
        console.log('🔗 WebSocket connected');
        setWebSocketConnected(true);
        setSyncing(true);
        reconnectAttempts = 0;

        // Send current state
        const stateVector = Y.encodeStateVector(ydoc);
        wsConnection?.send(stateVector);

        addToast({
          type: 'success',
          title: 'Connected',
          message: 'Real-time sync active',
          duration: 2000,
        });
      };

      wsConnection.onmessage = (event) => {
        try {
          // Check if it's a string message (presence/awareness)
          if (typeof event.data === 'string') {
            const msg = JSON.parse(event.data);
            if (msg.type === 'presence') {
              const { setActiveUsers } = useEditorStore.getState();
              const colors = ['#f87171', '#fb923c', '#4ade80', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6'];
              setActiveUsers(
                msg.users.map((u: any, i: number) => ({
                  ...u,
                  color: colors[i % colors.length],
                }))
              );
            }
            return;
          }

          // Binary Yjs update
          const update = new Uint8Array(event.data);
          Y.applyUpdate(ydoc, update);
          setLastSynced(new Date());

          if (onSyncComplete) onSyncComplete();
        } catch (error) {
          console.error('Error processing WS message:', error);
        }
      };

      wsConnection.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code);
        setWebSocketConnected(false);

        if (!destroyed && event.code !== 4001 && event.code !== 4002 && event.code !== 4003) {
          // Reconnect with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectAttempts++;

          if (reconnectAttempts <= maxReconnectAttempts) {
            reconnectTimeout = setTimeout(connect, delay);
          }
        }
      };

      wsConnection.onerror = () => {
        console.error('❌ WebSocket error');
      };

      // Forward local updates to server
      const updateHandler = (update: Uint8Array, origin: any) => {
        if (origin !== 'ws' && wsConnection?.readyState === WebSocket.OPEN) {
          wsConnection.send(update);
        }
      };

      ydoc.on('update', updateHandler);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }

  // Network status monitoring
  const handleOnline = () => {
    setOnline(true);
    addToast({
      type: 'info',
      title: '🌐 Internet Restored',
      message: 'Synchronizing changes...',
      duration: 3000,
    });
    connect();
  };

  const handleOffline = () => {
    setOnline(false);
    addToast({
      type: 'warning',
      title: '✈️ Offline Mode',
      message: 'Working locally — changes saved offline',
      duration: 4000,
    });
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  setOnline(navigator.onLine);

  // Start connection
  if (navigator.onLine) {
    connect();
  }

  return {
    ydoc,
    indexeddbProvider,
    wsConnection,
    destroy: () => {
      destroyed = true;
      clearTimeout(reconnectTimeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (wsConnection) {
        wsConnection.close();
      }
      indexeddbProvider.destroy();
      ydoc.destroy();
    },
  };
}
