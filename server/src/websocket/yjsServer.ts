import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as Y from 'yjs';
import { DocumentModel } from '../models/Document.js';
import { ChangeLogModel } from '../models/ChangeLog.js';

const docs = new Map<string, Y.Doc>();
const connections = new Map<string, Set<{ ws: WebSocket; userId: string; userName: string; connectedAt: number }>>();

// Track when users were last seen to detect offline periods
const lastSeenMap = new Map<string, number>(); // key: `${docName}:${userId}`

function getYDoc(docName: string): Y.Doc {
  let doc = docs.get(docName);
  if (!doc) {
    doc = new Y.Doc();
    docs.set(docName, doc);

    // Load persisted state from MongoDB
    loadDocState(docName, doc);

    // Debounced save on updates
    let saveTimeout: NodeJS.Timeout;
    doc.on('update', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveDocState(docName, doc!);
      }, 2000);
    });
  }
  return doc;
}

async function loadDocState(docName: string, doc: Y.Doc): Promise<void> {
  try {
    const dbDoc = await DocumentModel.findById(docName).select('yjsState');
    if (dbDoc?.yjsState) {
      Y.applyUpdate(doc, new Uint8Array(dbDoc.yjsState));
    }
  } catch (error) {
    console.error(`Failed to load Yjs state for ${docName}:`, error);
  }
}

async function saveDocState(docName: string, doc: Y.Doc): Promise<void> {
  try {
    const state = Y.encodeStateAsUpdate(doc);
    await DocumentModel.findByIdAndUpdate(docName, {
      yjsState: Buffer.from(state),
    });
  } catch (error) {
    console.error(`Failed to save Yjs state for ${docName}:`, error);
  }
}

/** Extract plain text from a Yjs document */
function getDocText(ydoc: Y.Doc): string {
  return getDocParagraphs(ydoc).join(' ');
}

/** Extract text from a Yjs document as an array of per-paragraph strings */
function getDocParagraphs(ydoc: Y.Doc): string[] {
  try {
    const xmlFragment = ydoc.getXmlFragment('default');
    const paragraphs: string[] = [];
    for (let i = 0; i < xmlFragment.length; i++) {
      const child = xmlFragment.get(i);
      // Extract text from each top-level element (paragraph, heading, etc.)
      const str = child.toString();
      const text = str.replace(/<[^>]*>/g, '').trim();
      paragraphs.push(text);
    }
    return paragraphs;
  } catch {
    return [];
  }
}

/** Debounced change log to batch rapid keystrokes */
const pendingChanges = new Map<string, { userId: string; userName: string; docName: string; inserted: string[]; insertedText: string; deleted: string[]; isOffline: boolean; timer: NodeJS.Timeout }>();

function flushChangeLog(key: string) {
  const pending = pendingChanges.get(key);
  if (!pending) return;
  pendingChanges.delete(key);

  const insertedText = pending.insertedText.trim();
  const deletedText = pending.deleted.join(' ').trim();

  console.log(`📝 ChangeLog [${pending.userName}]: inserted="${insertedText}" | deleted="${deletedText}" | offline=${pending.isOffline}`);

  // Save insertions
  if (insertedText.length > 0) {
    ChangeLogModel.create({
      documentId: pending.docName,
      userId: pending.userId,
      userName: pending.userName,
      changeType: 'insert',
      content: insertedText.substring(0, 5000),
      isOffline: pending.isOffline,
    }).catch((err) => console.error('Failed to log insert change:', err));
  }

  // Save deletions
  if (deletedText.length > 0) {
    ChangeLogModel.create({
      documentId: pending.docName,
      userId: pending.userId,
      userName: pending.userName,
      changeType: 'delete',
      content: deletedText.substring(0, 5000),
      isOffline: pending.isOffline,
    }).catch((err) => console.error('Failed to log delete change:', err));
  }
}

function broadcastToRoom(
  docName: string,
  message: Uint8Array,
  exclude?: WebSocket
): void {
  const room = connections.get(docName);
  if (!room) return;

  for (const client of room) {
    if (client.ws !== exclude && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

export function setupYjsWebSocket(server: http.Server): void {
  const wss = new WebSocketServer({ server, path: '/yjs' });

  wss.on('connection', async (ws: WebSocket, req) => {
    // Buffer messages sent during async authentication/setup to prevent them from being dropped
    const messageBuffer: Buffer[] = [];
    let isReady = false;
    const bufferHandler = (data: Buffer) => {
      if (!isReady) messageBuffer.push(data);
    };
    ws.on('message', bufferHandler);

    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const docName = url.searchParams.get('room');
    const token = url.searchParams.get('token');

    if (!docName || !token) {
      ws.close(4001, 'Missing room or token');
      return;
    }

    // Verify JWT
    let userId: string;
    let userName: string;
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
      };
      userId = decoded.userId;

      // Get user info
      const { User } = await import('../models/User.js');
      const user = await User.findById(userId);
      if (!user) {
        ws.close(4003, 'User not found');
        return;
      }
      userName = user.name;

      // Verify document exists (link-based access — any authenticated user can join)
      const doc = await DocumentModel.findOne({
        _id: docName,
        isDeleted: false,
      });

      if (!doc) {
        ws.close(4003, 'Document not found');
        return;
      }

      // Auto-add as collaborator if not already owner or collaborator
      const isOwner = doc.owner.toString() === userId;
      const isCollaborator = doc.collaborators.some(
        (c) => c.user.toString() === userId
      );
      if (!isOwner && !isCollaborator) {
        doc.collaborators.push({
          user: userId as any,
          permission: 'editor',
          addedAt: new Date(),
        });
        await doc.save();
      }
    } catch (error) {
      ws.close(4002, 'Invalid token');
      return;
    }

    const ydoc = getYDoc(docName);

    // Detect if user was offline (last seen > 30 seconds ago)
    const lastSeenKey = `${docName}:${userId}`;
    const lastSeen = lastSeenMap.get(lastSeenKey) || 0;
    const wasOffline = Date.now() - lastSeen > 30000 && lastSeen > 0;
    lastSeenMap.set(lastSeenKey, Date.now());

    // Add to room
    if (!connections.has(docName)) {
      connections.set(docName, new Set());
    }
    const clientInfo = { ws, userId, userName, connectedAt: Date.now() };
    connections.get(docName)!.add(clientInfo);

    // Request the client's offline changes by sending the server's State Vector
    const serverSv = Y.encodeStateVector(ydoc);
    ws.send(JSON.stringify({ type: 'sync-request', sv: Array.from(serverSv) }));

    // Broadcast presence update
    const presenceMsg = JSON.stringify({
      type: 'presence',
      users: Array.from(connections.get(docName) || []).map((c) => ({
        userId: c.userId,
        userName: c.userName,
      })),
    });
    for (const client of connections.get(docName) || []) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(presenceMsg);
      }
    }

    const handleMessage = (data: Buffer) => {
      try {
        // Try to parse as JSON first (for awareness/presence/sync)
        const str = data.toString();
        if (str.startsWith('{')) {
          const msg = JSON.parse(str);
          if (msg.type === 'awareness') {
            broadcastToRoom(docName!, Buffer.from(str), ws);
            return;
          } else if (msg.type === 'sync-request') {
            // Client is asking for missing updates. Compute them using the client's State Vector.
            const clientSv = new Uint8Array(msg.sv);
            const update = Y.encodeStateAsUpdate(ydoc, clientSv);
            ws.send(update);
            return;
          }
        }
      } catch {
        // Not JSON, treat as Yjs update
      }

      // Apply Yjs update with change tracking via per-paragraph text diff
      try {
        const update = new Uint8Array(data);

        // Snapshot paragraphs BEFORE applying the update
        const parasBefore = getDocParagraphs(ydoc);

        Y.applyUpdate(ydoc, update);

        // Snapshot paragraphs AFTER applying the update
        const parasAfter = getDocParagraphs(ydoc);

        // Diff each paragraph independently to handle multi-paragraph edits correctly
        let allInserted = '';
        let allDeleted = '';
        const maxLen = Math.max(parasBefore.length, parasAfter.length);
        for (let i = 0; i < maxLen; i++) {
          const before = parasBefore[i] || '';
          const after = parasAfter[i] || '';
          if (before !== after) {
            const ins = findInsertedText(before, after);
            const del = findInsertedText(after, before);
            if (ins) allInserted += ins;
            if (del) allDeleted += (allDeleted ? ' ' : '') + del;
          }
        }

        if (allInserted.length > 0 || allDeleted.length > 0) {
          const changeKey = `${docName}:${userId}`;
          lastSeenMap.set(lastSeenKey, Date.now());

          // Batch rapid changes (debounce 3 seconds)
          let pending = pendingChanges.get(changeKey);
          if (!pending) {
            pending = {
              userId,
              userName,
              docName: docName!,
              inserted: [],
              insertedText: '',
              deleted: [],
              isOffline: wasOffline,
              timer: setTimeout(() => flushChangeLog(changeKey), 3000),
            };
            pendingChanges.set(changeKey, pending);
          } else {
            clearTimeout(pending.timer);
            pending.timer = setTimeout(() => flushChangeLog(changeKey), 3000);
          }

          if (allInserted.length > 0) {
            pending.insertedText += allInserted;
          }
          if (allDeleted.length > 0) {
            // Check if the deleted text is a typo correction (matches end of pending.insertedText)
            if (pending.insertedText.endsWith(allDeleted)) {
              // Undo the typo — remove the recently typed character(s) that were backspaced
              pending.insertedText = pending.insertedText.slice(0, -allDeleted.length);
            } else if (allDeleted.length > 2) {
              // Only log as a real deletion if it's significant content (not a typo backspace)
              pending.deleted.push(allDeleted);
            }
          }
        }

        broadcastToRoom(docName!, data as any, ws);
      } catch (error) {
        console.error('Error applying Yjs update:', error);
      }
    };

    ws.off('message', bufferHandler);
    ws.on('message', handleMessage);

    isReady = true;
    for (const data of messageBuffer) {
      handleMessage(data);
    }

    ws.on('close', () => {
      lastSeenMap.set(lastSeenKey, Date.now());
      connections.get(docName!)?.delete(clientInfo);

      // Flush any pending changes for this user
      const changeKey = `${docName}:${userId}`;
      if (pendingChanges.has(changeKey)) {
        clearTimeout(pendingChanges.get(changeKey)!.timer);
        flushChangeLog(changeKey);
      }

      if (connections.get(docName!)?.size === 0) {
        connections.delete(docName!);
        // Save state and clean up doc after a delay
        setTimeout(() => {
          if (!connections.has(docName!)) {
            const doc = docs.get(docName!);
            if (doc) {
              saveDocState(docName!, doc);
              doc.destroy();
              docs.delete(docName!);
            }
          }
        }, 30000);
      } else {
        // Broadcast updated presence
        const presenceMsg = JSON.stringify({
          type: 'presence',
          users: Array.from(connections.get(docName!) || []).map((c) => ({
            userId: c.userId,
            userName: c.userName,
          })),
        });
        for (const client of connections.get(docName!) || []) {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(presenceMsg);
          }
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connections.get(docName!)?.delete(clientInfo);
    });
  });

  console.log('✅ Yjs WebSocket server attached');
}

/** Find the text present in `after` but not in `before` by diffing common prefix/suffix */
function findInsertedText(before: string, after: string): string {
  if (before === after) return '';

  const minLen = Math.min(before.length, after.length);

  // Find common prefix
  let prefixLen = 0;
  while (prefixLen < minLen && before[prefixLen] === after[prefixLen]) {
    prefixLen++;
  }

  // Find common suffix (don't overlap with prefix)
  let suffixLen = 0;
  while (
    suffixLen < (minLen - prefixLen) &&
    before[before.length - 1 - suffixLen] === after[after.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  // The unique part in `after` is what's between the common prefix and suffix
  const afterEnd = after.length - suffixLen;
  if (prefixLen <= afterEnd) {
    return after.substring(prefixLen, afterEnd);
  }

  return '';
}

