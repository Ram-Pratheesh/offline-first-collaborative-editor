import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Awareness } from 'y-protocols/awareness';
import * as awarenessProtocol from 'y-protocols/awareness';
import {
  ArrowLeft,
  Plus,
  FileText,
  ClipboardList,
  Share2,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EditorSkeleton } from '../components/ui/Skeleton';
import { LocationTree } from '../components/inspection/LocationTree';
import { ObservationCard } from '../components/inspection/ObservationCard';
import { CreateLocationModal } from '../components/inspection/CreateLocationModal';
import { CollaboratorPanel } from '../components/inspection/CollaboratorPanel';
import { SemanticReconciliationPanel } from '../components/inspection/SemanticReconciliationPanel';
import { ReconnectionSummaryModal } from '../components/inspection/ReconnectionSummaryModal';
import { ShareInspectionModal } from '../components/inspection/ShareInspectionModal';
import { ReportStatusPanel } from '../components/inspection/ReportStatusPanel';
import { ConnectionBanner } from '../components/shared/ConnectionBanner';
import { useAuthStore } from '../store/authStore';
import { useEditorStore } from '../store/editorStore';
import { useInspectionStore, type CollaboratorStatus } from '../store/inspectionStore';
import { useNotificationStore } from '../store/notificationStore';
import { inspectionService } from '../services/inspectionService';
import type { ObservationMeta, Inspection } from '../types';

const COLLABORATOR_COLORS = [
  '#f87171', '#fb923c', '#4ade80', '#22d3ee',
  '#60a5fa', '#a78bfa', '#f472b6', '#e879f9',
];

const InspectionWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useNotificationStore();
  const {
    syncStatus,
    setOnline, setWebSocketConnected, setSyncing, setLastSynced,
    setActiveUsers, setDocumentId, resetMetrics,
    recordMessageSent, recordMessageReceived,
  } = useEditorStore();

  const {
    inspection, locations, selectedLocationId, observations,
    collaborators, semanticResults, isAnalyzing, reportStatus,
    reconnectionSummary, showReconnectionModal,
    setInspection, setLocations,
    setSelectedLocationId, setObservations,
    setCollaborators, setSemanticResults, updateSemanticResult,
    setAnalyzing, setReportStatus,
    setShowReconnectionModal, reset,
  } = useInspectionStore();

  const [pageLoading, setPageLoading] = useState(true);
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const activeUsersRef = useRef<{ userId: string; userName: string }[]>([]);
  const inspectionRef = useRef<Inspection | null>(null);

  // Yjs refs
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const indexeddbRef = useRef<IndexeddbPersistence | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);
  const destroyedRef = useRef(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const snapshotTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const autoAnalyzedLocationsRef = useRef<Set<string>>(new Set());

  // ─── Initialize Yjs ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !user) return;

    destroyedRef.current = false;
    reconnectAttemptsRef.current = 0;
    setDocumentId(id);
    resetMetrics();

    const doc = new Y.Doc();
    ydocRef.current = doc;
    setYdoc(doc);

    // Awareness for collaborative cursors
    const colorIndex = Math.floor(Math.random() * COLLABORATOR_COLORS.length);
    const aw = new Awareness(doc);
    aw.setLocalStateField('user', {
      name: user.name || 'Anonymous',
      color: COLLABORATOR_COLORS[colorIndex],
      colorLight: COLLABORATOR_COLORS[colorIndex] + '40',
    });
    awarenessRef.current = aw;

    // IndexedDB persistence — same pattern as EditorPage
    const idbProvider = new IndexeddbPersistence(`collab-inspection-${id}`, doc);
    indexeddbRef.current = idbProvider;
    idbProvider.once('synced', () => {
      console.log('📦 Local inspection state loaded from IndexedDB');
      // Hydrate store from Yjs Maps
      hydrateFromYjs(doc);
    });

    // WebSocket connection
    const token = localStorage.getItem('accessToken');
    if (token && navigator.onLine) {
      connectWs(id, token, doc);
    }

    // Network listeners
    const handleOnline = () => {
      setOnline(true);
      addToast({ type: 'success', title: '🌐 Back Online', message: 'Reconnecting...', duration: 3000 });
      const t = localStorage.getItem('accessToken');
      if (t && ydocRef.current) {
        reconnectAttemptsRef.current = 0;
        connectWs(id, t, ydocRef.current);
      }
    };

    const handleOffline = () => {
      setOnline(false);
      setWebSocketConnected(false);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      addToast({ type: 'warning', title: '✈️ Offline Mode', message: 'Working locally', duration: 4000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOnline(navigator.onLine);

    return () => {
      destroyedRef.current = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(reconnectTimeoutRef.current);
      clearTimeout(snapshotTimeoutRef.current);
      wsRef.current?.close();
      if (awarenessRef.current) {
        awarenessProtocol.removeAwarenessStates(awarenessRef.current, [doc.clientID], null);
        awarenessRef.current.destroy();
      }
      idbProvider.destroy();
      doc.destroy();
      setYdoc(null);
      setDocumentId(null);
      reset();
    };
  }, [id, user]);

  // ─── Hydrate store from Yjs Y.Maps ────────────────────────────────────────
  function hydrateFromYjs(doc: Y.Doc) {
    const locationsMap = doc.getMap('locations');
    const observationsMap = doc.getMap('observations');

    // Read current locations
    const locs: any[] = [];
    locationsMap.forEach((val, key) => {
      locs.push({ locationId: key, ...(val as any) });
    });
    setLocations(locs);

    // Read current observations
    const obs: ObservationMeta[] = [];
    observationsMap.forEach((val, key) => {
      obs.push({ observationId: key, ...(val as any) });
    });
    setObservations(obs);

    // Observe future changes
    locationsMap.observe(() => {
      const updated: any[] = [];
      locationsMap.forEach((val, key) => {
        updated.push({ locationId: key, ...(val as any) });
      });
      setLocations(updated);
    });

    observationsMap.observe(() => {
      const updated: ObservationMeta[] = [];
      observationsMap.forEach((val, key) => {
        updated.push({ observationId: key, ...(val as any) });
      });
      setObservations(updated);
      // Debounced snapshot to server
      scheduleSnapshot();
    });
  }

  // ─── WebSocket connection ──────────────────────────────────────────────────
  function connectWs(inspectionId: string, token: string, ydoc: Y.Doc) {
    if (destroyedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname;
    // Room name uses inspection- prefix so the WS server knows to use InspectionModel
    const wsUrl = `${wsProtocol}://${wsHost}:5000/yjs?room=inspection-${inspectionId}&token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        setWebSocketConnected(true);
        setSyncing(true);
        reconnectAttemptsRef.current = 0;

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
              const uniqueUsers = Array.from(
                new Map(msg.users.map((u: any) => [u.userId, u])).values()
              );

              // Detect if any new user joined (who wasn't here previously)
              const previousUserIds = new Set(activeUsersRef.current.map((u: any) => u.userId));
              let newUserJoined = false;
              for (const u of uniqueUsers as any[]) {
                if (!previousUserIds.has(u.userId)) {
                  newUserJoined = true;
                  break;
                }
              }

              activeUsersRef.current = uniqueUsers.map((u: any) => ({
                userId: u.userId,
                userName: u.userName,
              }));
              setActiveUsers(
                uniqueUsers.map((u: any, i: number) => ({
                  ...u,
                  color: COLLABORATOR_COLORS[i % COLLABORATOR_COLORS.length],
                }))
              );
              
              if (inspectionRef.current) {
                syncCollaborators(
                  inspectionRef.current,
                  new Set(uniqueUsers.map((u: any) => u.userId))
                );
              } else {
                setCollaborators(
                  uniqueUsers.map((u: any, i: number) => ({
                    userId: u.userId,
                    userName: u.userName,
                    isOnline: true,
                    color: COLLABORATOR_COLORS[i % COLLABORATOR_COLORS.length],
                  }))
                );
              }

              // Refresh server state if a new user just joined so totalUsers updates instantly
              if (newUserJoined) {
                inspectionService.getById(inspectionId).then((ins) => {
                  setInspection(ins);
                  inspectionRef.current = ins;
                  syncCollaborators(ins, new Set(uniqueUsers.map((u: any) => u.userId)));
                }).catch(() => {});
                
                inspectionService.getReportStatus(inspectionId).then((data) => {
                  setReportStatus(data.status);
                }).catch(() => {});
              }
            } else if (msg.type === 'awareness' && awarenessRef.current && msg.data) {
              const update = new Uint8Array(msg.data);
              awarenessProtocol.applyAwarenessUpdate(awarenessRef.current, update, ws);
            } else if (msg.type === 'sync-request') {
              const serverSv = new Uint8Array(msg.sv);
              const missingUpdates = Y.encodeStateAsUpdate(ydoc, serverSv);
              ws.send(missingUpdates as any);
              recordMessageSent(missingUpdates.byteLength);
              setLastSynced(new Date());
            } else if (msg.type === 'semantic_updated' || msg.type === 'status_updated') {
              // Real-time update for semantic results and status
              Promise.all([
                inspectionService.getSemanticResults(inspectionId),
                inspectionService.getReportStatus(inspectionId),
              ]).then(([results, statusData]) => {
                setSemanticResults(results);
                setReportStatus(statusData.status);
              }).catch(() => {});
            }
            return;
          }

          const update = new Uint8Array(event.data);
          Y.applyUpdate(ydoc, update, wsRef.current);
          setLastSynced(new Date());
        } catch (err) {
          console.error('WS message error:', err);
        }
      };

      ws.onclose = (event) => {
        setWebSocketConnected(false);
        if (!destroyedRef.current && navigator.onLine && event.code !== 4001 && event.code !== 4002 && event.code !== 4003) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          if (reconnectAttemptsRef.current <= 10) {
            reconnectTimeoutRef.current = setTimeout(
              () => connectWs(inspectionId, token, ydoc),
              delay
            );
          }
        }
      };

      ws.onerror = () => {
        console.error('❌ WebSocket error');
      };

      // Forward local updates
      const updateHandler = (update: Uint8Array, origin: any) => {
        if (origin !== wsRef.current && ws.readyState === WebSocket.OPEN) {
          ws.send(update as any);
          recordMessageSent(update.byteLength);
        }
      };
      ydoc.on('update', updateHandler);

      // Forward awareness updates
      if (awarenessRef.current) {
        const awarenessHandler = (
          { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
          origin: any
        ) => {
          if (origin === ws) return;
          const changedClients = added.concat(updated, removed);
          if (awarenessRef.current && ws.readyState === WebSocket.OPEN) {
            const encodedUpdate = awarenessProtocol.encodeAwarenessUpdate(
              awarenessRef.current,
              changedClients
            );
            ws.send(JSON.stringify({ type: 'awareness', data: Array.from(encodedUpdate) }));
          }
        };
        awarenessRef.current.on('update', awarenessHandler);
      }
    } catch {
      console.error('WS connection failed');
    }
  }

  // ─── Dynamic Collaborators Synchronization ────────────────────────────────
  const syncCollaborators = useCallback(
    (ins: Inspection, onlineUserIds?: Set<string>) => {
      const onlineSet =
        onlineUserIds || new Set(activeUsersRef.current.map((u) => u.userId));
      const list: CollaboratorStatus[] = [];

      // 1. Owner
      if (ins.owner) {
        list.push({
          userId: ins.owner._id,
          userName: ins.owner.name,
          email: ins.owner.email,
          isOnline: onlineSet.has(ins.owner._id) || ins.owner._id === user?._id,
          color: COLLABORATOR_COLORS[0],
          isOwner: true,
        });
      }

      // 2. Registered Collaborators
      (ins.collaborators || []).forEach((c, idx) => {
        if (!c.user || list.some((x) => x.userId === c.user._id)) return;
        list.push({
          userId: c.user._id,
          userName: c.user.name,
          email: c.user.email,
          isOnline: onlineSet.has(c.user._id) || c.user._id === user?._id,
          color: COLLABORATOR_COLORS[(idx + 1) % COLLABORATOR_COLORS.length],
          isOwner: false,
          permission: c.permission,
        });
      });

      // 3. Any additional connected clients from presence
      onlineSet.forEach((onlineId) => {
        if (!list.some((x) => x.userId === onlineId)) {
          const matching = activeUsersRef.current.find((u) => u.userId === onlineId);
          list.push({
            userId: onlineId,
            userName: matching?.userName || 'Collaborator',
            isOnline: true,
            color: COLLABORATOR_COLORS[list.length % COLLABORATOR_COLORS.length],
            isOwner: false,
          });
        }
      });

      setCollaborators(list);
    },
    [user, setCollaborators]
  );

  // ─── Delete Inspection ─────────────────────────────────────────────────────
  const handleDeleteInspection = useCallback(async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await inspectionService.delete(id);
      addToast({ type: 'success', title: 'Inspection deleted' });
      navigate('/dashboard');
    } catch {
      addToast({ type: 'error', title: 'Failed to delete inspection' });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [id, navigate, addToast]);

  // ─── Fetch inspection metadata ─────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fetchInspection = async () => {
      try {
        await inspectionService.join(id).catch(() => {});
        const ins = await inspectionService.getById(id);
        setInspection(ins);
        inspectionRef.current = ins;
        syncCollaborators(ins);

        // Also fetch semantic results and report status
        const [results, statusData] = await Promise.all([
          inspectionService.getSemanticResults(id).catch(() => []),
          inspectionService.getReportStatus(id).catch(() => null),
        ]);
        setSemanticResults(results);
        if (statusData) setReportStatus(statusData.status);
      } catch {
        if (!navigator.onLine) {
          const offlineIns: Inspection = {
            _id: id,
            title: 'Offline Inspection',
            description: '',
            owner: { _id: user?._id || '', name: user?.name || '', email: '', role: 'user', createdAt: '', updatedAt: '' },
            collaborators: [],
            status: 'DRAFT',
            locations: [],
            isDeleted: false,
            finalizedAt: null,
            finalizedBy: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setInspection(offlineIns);
          inspectionRef.current = offlineIns;
          syncCollaborators(offlineIns);
        } else {
          addToast({ type: 'error', title: 'Failed to load inspection' });
          navigate('/dashboard');
          return;
        }
      } finally {
        setPageLoading(false);
      }
    };
    fetchInspection();
  }, [id, user, navigate, setInspection, setSemanticResults, setReportStatus, addToast, syncCollaborators]);

  // ─── Create Location ──────────────────────────────────────────────────────
  const handleCreateLocation = useCallback(
    (name: string) => {
      if (!ydocRef.current || !user || !id) return;
      const locationId = `loc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const locationsMap = ydocRef.current.getMap('locations');
      locationsMap.set(locationId, {
        name,
        parentId: null,
        createdBy: user._id,
        createdAt: new Date().toISOString(),
      });
      setSelectedLocationId(locationId);

      // Server backup (fire-and-forget)
      inspectionService
        .createLocation(id, { locationId, name })
        .catch(() => {});
    },
    [id, user, setSelectedLocationId]
  );

  // ─── Delete Location ────────────────────────────────────────────────────────
  const handleDeleteLocation = useCallback(
    async (locationId: string) => {
      if (!id) return;

      // Remove from Yjs maps
      if (ydocRef.current) {
        const locationsMap = ydocRef.current.getMap('locations');
        locationsMap.delete(locationId);

        // Remove observations belonging to this location
        const observationsMap = ydocRef.current.getMap('observations');
        const toDelete: string[] = [];
        observationsMap.forEach((val, key) => {
          if ((val as any).locationId === locationId) toDelete.push(key);
        });
        toDelete.forEach((key) => observationsMap.delete(key));
      }

      // Clear selection if this was the selected location
      if (selectedLocationId === locationId) {
        setSelectedLocationId(null);
      }

      // Server-side cleanup (fire-and-forget)
      try {
        await inspectionService.deleteLocation(id, locationId);
        addToast({ type: 'success', title: 'Location deleted', duration: 2000 });
      } catch {
        addToast({ type: 'error', title: 'Failed to delete location from server' });
      }
    },
    [id, selectedLocationId, setSelectedLocationId, addToast]
  );

  // ─── Create Observation ────────────────────────────────────────────────────
  const handleCreateObservation = useCallback(() => {
    if (!ydocRef.current || !user || !selectedLocationId) return;
    const observationId = `obs-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const observationsMap = ydocRef.current.getMap('observations');
    const meta: Omit<ObservationMeta, 'observationId'> = {
      locationId: selectedLocationId,
      authorId: user._id,
      authorName: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      connectivityState: navigator.onLine ? 'online' : 'offline',
    };
    observationsMap.set(observationId, meta);
  }, [selectedLocationId, user]);

  // ─── Delete Observation ────────────────────────────────────────────────────
  const handleDeleteObservation = useCallback((observationId: string) => {
    if (!ydocRef.current) return;
    const observationsMap = ydocRef.current.getMap('observations');
    observationsMap.delete(observationId);
  }, []);

  // ─── Snapshot observations to server (debounced) ───────────────────────────
  const scheduleSnapshot = useCallback(() => {
    clearTimeout(snapshotTimeoutRef.current);
    snapshotTimeoutRef.current = setTimeout(async () => {
      if (!id || !ydocRef.current) return;
      const observationsMap = ydocRef.current.getMap('observations');
      const snapshots: any[] = [];

      observationsMap.forEach((val, key) => {
        const meta = val as any;
        const fragment = ydocRef.current!.getXmlFragment(`obs-${key}`);
        const plainText = fragment.toString().replace(/<[^>]*>/g, '').trim();
        snapshots.push({
          observationId: key,
          locationId: meta.locationId,
          authorId: meta.authorId,
          authorName: meta.authorName,
          plainTextContent: plainText,
          connectivityState: meta.connectivityState,
        });
      });

      if (navigator.onLine) {
        try {
          await inspectionService.snapshotObservations(id, snapshots);
        } catch {}
      }
    }, 5000);
  }, [id]);

  // ─── Semantic Analysis ─────────────────────────────────────────────────────
  const handleTriggerAnalysis = useCallback(async () => {
    if (!id || !selectedLocationId) return;

    // Snapshot first so server has latest text
    if (ydocRef.current) {
      const observationsMap = ydocRef.current.getMap('observations');
      const snapshots: any[] = [];
      observationsMap.forEach((val, key) => {
        const meta = val as any;
        const fragment = ydocRef.current!.getXmlFragment(`obs-${key}`);
        const plainText = fragment.toString().replace(/<[^>]*>/g, '').trim();
        snapshots.push({
          observationId: key,
          locationId: meta.locationId,
          authorId: meta.authorId,
          authorName: meta.authorName,
          plainTextContent: plainText,
          connectivityState: meta.connectivityState,
        });
      });
      if (snapshots.length > 0) {
        await inspectionService.snapshotObservations(id, snapshots).catch(() => {});
      }
    }

    setAnalyzing(true);
    try {
      const results = await inspectionService.triggerSemanticAnalysis(id, selectedLocationId);
      setSemanticResults(results);

      const statusData = await inspectionService.getReportStatus(id).catch(() => null);
      if (statusData) setReportStatus(statusData.status);
    } catch {
      addToast({ type: 'error', title: 'Semantic analysis failed' });
    } finally {
      setAnalyzing(false);
    }
  }, [id, selectedLocationId, setAnalyzing, setSemanticResults, setReportStatus, addToast]);

  const handleObservationBlur = useCallback(() => {
    if (!selectedLocationId) return;
    
    // Only proceed if we have 2+ observations for this location
    const obs = useInspectionStore.getState().observations.filter((o) => o.locationId === selectedLocationId);
    if (obs.length >= 2) {
      if (!autoAnalyzedLocationsRef.current.has(selectedLocationId)) {
        autoAnalyzedLocationsRef.current.add(selectedLocationId);
        
        // Trigger semantic analysis once user finishes typing the 2nd observation
        handleTriggerAnalysis();
      }
    }
  }, [selectedLocationId, handleTriggerAnalysis]);

  // ─── Human Decision ────────────────────────────────────────────────────────
  const handleDecision = useCallback(
    async (resultId: string, decision: string) => {
      if (!id) return;
      try {
        const updated = await inspectionService.recordDecision(id, resultId, decision);
        updateSemanticResult(resultId, updated);

        const statusData = await inspectionService.getReportStatus(id).catch(() => null);
        if (statusData) setReportStatus(statusData.status);

        addToast({ type: 'success', title: 'Decision recorded', duration: 2000 });
      } catch {
        addToast({ type: 'error', title: 'Failed to record decision' });
      }
    },
    [id, updateSemanticResult, setReportStatus, addToast]
  );

  // ─── Finalize ──────────────────────────────────────────────────────────────
  const handleFinalize = useCallback(async () => {
    if (!id) return;
    try {
      const updated = await inspectionService.finalizeReport(id);
      setInspection(updated);

      const statusData = await inspectionService.getReportStatus(id).catch(() => null);
      if (statusData) setReportStatus(statusData.status);

      addToast({ type: 'success', title: '✅ Report finalized!' });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Cannot finalize',
        message: error.response?.data?.message || 'Some reviews are still pending',
      });
    }
  }, [id, setInspection, setReportStatus, addToast]);

  // ─── PDF Export (simple client-side) ───────────────────────────────────────
  const handleExportPdf = useCallback(async () => {
    if (!id) return;
    setIsExporting(true);
    try {
      const data = await inspectionService.getExportData(id);

      const finalizedDate = data.inspection.finalizedAt 
        ? new Date(data.inspection.finalizedAt).toLocaleString() 
        : 'Pending';

      // Build a printable HTML document
      const locations = data.inspection.locations || [];
      let html = `
        <html><head><meta charset="utf-8">
        <style>
          body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #1f2937; }
          h1 { font-size: 24px; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; }
          h2 { font-size: 18px; color: #7c3aed; margin-top: 24px; }
          h3 { font-size: 15px; color: #374151; margin-top: 16px; }
          .obs { padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 8px 0; }
          .meta { font-size: 12px; color: #6b7280; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
          @media print { body { padding: 20px; } }
        </style></head><body>
        <h1>${data.inspection.title}</h1>
        <p class="meta">Finalized: ${finalizedDate}</p>
        <p>${data.inspection.description || ''}</p>
      `;

      for (const loc of locations) {
        html += `<h2>📍 ${loc.name}</h2>`;
        const locObs = (data.observations || []).filter(
          (o: any) => o.locationId === loc.locationId
        );
        const locResults = (data.semanticResults || []).filter(
          (r: any) => r.locationId === loc.locationId && r.humanDecision !== 'PENDING'
        );

        // Map to keep track of observation state
        const finalObsMap = new Map();
        locObs.forEach((o: any) => {
          finalObsMap.set(o.observationId, {
            id: o.observationId,
            text: o.plainTextContent,
            authors: new Set([o.authorName]),
            date: o.createdAt,
            isHidden: false,
            isConflict: false,
            conflictsWith: [] as any[],
          });
        });

        const mergedObs: any[] = [];

        // Apply decisions
        for (const r of locResults) {
          const [id1, id2] = r.observationIds;
          const o1 = finalObsMap.get(id1);
          const o2 = finalObsMap.get(id2);

          if (!o1 || !o2) continue;

          if (r.relationship === 'COMPLEMENTARY' && r.humanDecision === 'ACCEPTED') {
            o1.isHidden = true;
            o2.isHidden = true;
            mergedObs.push({
              text: r.suggestedText || `${o1.text}\n${o2.text}`,
              authors: new Set([...o1.authors, ...o2.authors]),
              date: o2.date > o1.date ? o2.date : o1.date, // use latest date
            });
          } else if (r.relationship === 'DUPLICATE' && r.humanDecision === 'KEPT_ONE') {
            o2.isHidden = true;
            for (const a of o2.authors) o1.authors.add(a);
          } else if (r.relationship === 'CONTRADICTORY' && r.humanDecision === 'KEPT_BOTH') {
            o1.isConflict = true;
            o1.conflictsWith.push(o2);
            o2.isHidden = true; // hide o2 from main list so we can print them together
          }
        }

        let hasPrintedLocObservations = false;

        // Print regular and merged observations
        const printObs = (text: string, authors: Set<string>, date: string) => {
          hasPrintedLocObservations = true;
          const authorStr = Array.from(authors).join(', ');
          html += `
            <div class="obs">
              <strong>${authorStr}</strong>
              <span class="meta"> — ${new Date(date).toLocaleString()}</span>
              <p>${text || '<em>No content</em>'}</p>
            </div>
          `;
        };

        // Print standalone original observations
        for (const o of finalObsMap.values()) {
          if (!o.isHidden && !o.isConflict) {
            printObs(o.text, o.authors, o.date);
          }
        }

        // Print merged observations (from complementary)
        for (const m of mergedObs) {
          printObs(m.text, m.authors, m.date);
        }

        // Print conflicts
        let hasConflicts = false;
        for (const o of finalObsMap.values()) {
          if (o.isConflict && !o.isHidden) {
             if (!hasConflicts) {
                html += `<h3>⚠️ Conflicting Observations</h3>`;
                hasConflicts = true;
             }
             html += `<div style="border: 2px solid #fecaca; border-radius: 8px; margin: 8px 0; padding: 12px; background: #fef2f2;">`;
             // Print o1
             html += `
                <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #fca5a5;">
                  <strong>${Array.from(o.authors).join(', ')}</strong>
                  <p style="margin: 4px 0 0;">${o.text}</p>
                </div>
             `;
             // Print o2s
             for (const c of o.conflictsWith) {
                html += `
                  <div style="margin-bottom: 8px;">
                    <strong>${Array.from(c.authors).join(', ')}</strong>
                    <p style="margin: 4px 0 0;">${c.text}</p>
                  </div>
                `;
             }
             html += `
                <div class="meta" style="color: #dc2626; font-weight: 600; margin-top: 8px;">
                  Resolution: Both observations retained for review.
                </div>
             </div>`;
             hasPrintedLocObservations = true;
          }
        }

        if (!hasPrintedLocObservations) {
           html += `<p class="meta" style="color: #9ca3af; font-style: italic;">No finalized observations.</p>`;
        }
      }

      html += `</body></html>`;

      // Open in print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }

      addToast({ type: 'success', title: 'PDF export ready', duration: 3000 });
    } catch {
      addToast({ type: 'error', title: 'Export failed' });
    } finally {
      setIsExporting(false);
    }
  }, [id, addToast]);

  // ─── Current location observations ─────────────────────────────────────────
  const currentObservations = selectedLocationId
    ? observations.filter((o) => o.locationId === selectedLocationId)
    : [];

  const currentSemanticResults = selectedLocationId
    ? semanticResults.filter((r) => r.locationId === selectedLocationId)
    : [];

  const isFinalized = inspection?.status === 'FINALIZED';

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (pageLoading || !ydoc) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at 10% 92%, #ffd7e8 0, transparent 24%), radial-gradient(circle at 88% 95%, #ded1ff 0, transparent 23%), linear-gradient(135deg, #fff7f8 0%, #fdf7ff 50%, #f3e8ff 100%)',
        }}
      >
        <div style={{ height: '60px', background: 'rgba(255,255,255,0.93)', borderBottom: '1px solid #ebe6f0' }} />
        <EditorSkeleton />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background:
          'radial-gradient(circle at 10% 92%, #ffd7e8 0, transparent 24%), radial-gradient(circle at 88% 95%, #ded1ff 0, transparent 23%), linear-gradient(135deg, #fff7f8 0%, #fdf7ff 50%, #f3e8ff 100%)',
      }}
    >
      <ConnectionBanner />

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '12px 20px',
          margin: '14px 14px 0',
          border: '1px solid #ebe6f0',
          borderRadius: '22px',
          background: 'rgba(255,255,255,.93)',
          boxShadow: '0 12px 30px rgba(94, 55, 143, .08)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 auto', minWidth: 0 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '48px',
              height: '48px',
              display: 'grid',
              placeItems: 'center',
              border: '1px solid #e6e0eb',
              borderRadius: '14px',
              background: '#ffffff',
              color: '#ff4c87',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={22} />
          </button>
          <span
            style={{
              width: '40px',
              height: '40px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: '12px',
              color: '#7c3aed',
              background: '#f5f0ff',
              flexShrink: 0,
            }}
          >
            <ClipboardList size={22} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#171432',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {inspection?.title || 'Inspection'}
            </h1>
            <p style={{ fontSize: '12px', color: '#8a849d', margin: '2px 0 0' }}>
              {inspection?.description || 'Inspection workspace'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Sync status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: 700,
              color: syncStatus === 'offline' ? '#e59b22' : syncStatus === 'syncing' ? '#4b93f4' : '#10bf7a',
            }}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: syncStatus === 'offline' ? '#e59b22' : syncStatus === 'syncing' ? '#4b93f4' : '#10bf7a',
              }}
            />
            {syncStatus === 'offline' ? 'OFFLINE' : syncStatus === 'syncing' ? 'SYNCING' : 'SYNCED'}
          </div>

          {/* Status badge */}
          {inspection?.status && (
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: isFinalized ? '#f0fdf4' : '#faf5ff',
                color: isFinalized ? '#16a34a' : '#7c3aed',
                border: `1px solid ${isFinalized ? '#bbf7d0' : '#e9d5ff'}`,
              }}
            >
              {inspection.status.replace('_', ' ')}
            </span>
          )}

          {/* Share Button */}
          {inspection && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowShareModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '10px',
              }}
            >
              <Share2 size={15} />
              Share
            </Button>
          )}

          {/* Delete Button (Owner only) */}
          {inspection?.owner?._id === user?._id && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete inspection"
              style={{
                width: '36px',
                height: '36px',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid #fee2e2',
                borderRadius: '10px',
                background: '#fef2f2',
                color: '#ef4444',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </header>

      {/* ─── Main Layout ────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: '14px',
          padding: '14px',
          minHeight: 0,
        }}
      >
        {/* ─── Left Sidebar: Locations ──────────────────────────────────── */}
        <aside
          style={{
            width: '260px',
            flexShrink: 0,
            border: '1px solid #ebe6f0',
            borderRadius: '18px',
            background: 'rgba(255,255,255,.95)',
            boxShadow: '0 4px 16px rgba(94, 55, 143, .05)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <LocationTree
            locations={locations}
            observations={observations}
            selectedLocationId={selectedLocationId}
            onSelectLocation={setSelectedLocationId}
            onCreateLocation={() => setShowCreateLocation(true)}
            onDeleteLocation={handleDeleteLocation}
            isFinalized={isFinalized}
          />
        </aside>

        {/* ─── Center: Observations ─────────────────────────────────────── */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {!selectedLocationId ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #ebe6f0',
                borderRadius: '18px',
                background: 'rgba(255,255,255,.93)',
              }}
            >
              <div style={{ textAlign: 'center', color: '#8a849d' }}>
                <ClipboardList size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>
                  Select a Location
                </h2>
                <p style={{ fontSize: '14px', maxWidth: '300px' }}>
                  Choose a location from the sidebar to view and add observations, or create a new location.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Location header + add observation */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  border: '1px solid #ebe6f0',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,.93)',
                }}
              >
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  📍 {locations.find((l) => l.locationId === selectedLocationId)?.name || 'Location'}
                  <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '8px', fontSize: '13px' }}>
                    ({currentObservations.length} observation{currentObservations.length !== 1 ? 's' : ''})
                  </span>
                </h2>
                {!isFinalized && (
                  <Button size="sm" onClick={handleCreateObservation}>
                    <Plus size={16} />
                    Add Observation
                  </Button>
                )}
              </div>

              {/* Observation cards */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {currentObservations.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #ebe6f0',
                      borderRadius: '18px',
                      background: 'rgba(255,255,255,.93)',
                      padding: '48px',
                    }}
                  >
                    <div style={{ textAlign: 'center', color: '#8a849d' }}>
                      <FileText size={40} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                      <p style={{ fontSize: '14px' }}>
                        No observations yet for this location.
                        <br />
                        Click "Add Observation" to start documenting.
                      </p>
                    </div>
                  </div>
                ) : (
                  currentObservations.map((obs) => (
                    <ObservationCard
                      key={obs.observationId}
                      observation={obs}
                      ydoc={ydoc}
                      currentUserId={user?._id || ''}
                      isFinalized={isFinalized}
                      onDelete={handleDeleteObservation}
                      onBlur={handleObservationBlur}
                    />
                  ))
                )}
              </div>

              {/* Semantic Reconciliation */}
              {(currentSemanticResults.length > 0 || isAnalyzing) && (
                <SemanticReconciliationPanel
                  results={currentSemanticResults}
                  observations={currentObservations}
                  isAnalyzing={isAnalyzing}
                  onDecision={handleDecision}
                  onTriggerAnalysis={handleTriggerAnalysis}
                  isFinalized={isFinalized}
                />
              )}
            </>
          )}
        </main>

        {/* ─── Right Sidebar: Collaborators + Report Status ─────────────── */}
        <aside
          style={{
            width: '260px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <CollaboratorPanel
            collaborators={collaborators}
            onOpenShare={() => setShowShareModal(true)}
          />
          <ReportStatusPanel
            status={reportStatus}
            pendingReviews={
              semanticResults.filter(
                (r) => r.humanDecision === 'PENDING' && r.relationship !== 'INDEPENDENT'
              ).length
            }
            onFinalize={handleFinalize}
            onExportPdf={handleExportPdf}
            isExporting={isExporting}
          />
        </aside>
      </div>

      {/* ─── Modals ──────────────────────────────────────────────────────── */}
      <CreateLocationModal
        isOpen={showCreateLocation}
        onClose={() => setShowCreateLocation(false)}
        onCreate={handleCreateLocation}
      />

      <ReconnectionSummaryModal
        isOpen={showReconnectionModal}
        onClose={() => setShowReconnectionModal(false)}
        summary={reconnectionSummary}
      />

      {/* Share Inspection Modal */}
      {inspection && (
        <ShareInspectionModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          inspection={inspection}
          currentUserId={user?._id || ''}
          onUpdate={(updated) => {
            setInspection(updated);
            inspectionRef.current = updated;
            syncCollaborators(updated);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        title="Delete Inspection"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px' }}>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '14px', lineHeight: 1.5 }}>
            Are you sure you want to delete <strong>{inspection?.title}</strong>? This inspection will be removed from your dashboard and collaborators will no longer have access.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button
              variant="ghost"
              disabled={isDeleting}
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={isDeleting}
              onClick={handleDeleteInspection}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {isDeleting ? 'Deleting...' : 'Delete Inspection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InspectionWorkspacePage;
