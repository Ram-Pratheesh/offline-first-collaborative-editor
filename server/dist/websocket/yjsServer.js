import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as Y from 'yjs';
import { DocumentModel } from '../models/Document.js';
import { ChangeLogModel } from '../models/ChangeLog.js';
const docs = new Map();
const connections = new Map();
// Track when users were last seen to detect offline periods
const lastSeenMap = new Map(); // key: `${docName}:${userId}`
function getYDoc(docName) {
    let doc = docs.get(docName);
    if (!doc) {
        doc = new Y.Doc();
        docs.set(docName, doc);
        // Load persisted state from MongoDB
        loadDocState(docName, doc);
        // Debounced save on updates
        let saveTimeout;
        doc.on('update', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveDocState(docName, doc);
            }, 2000);
        });
    }
    return doc;
}
async function loadDocState(docName, doc) {
    try {
        const dbDoc = await DocumentModel.findById(docName).select('yjsState');
        if (dbDoc?.yjsState) {
            Y.applyUpdate(doc, new Uint8Array(dbDoc.yjsState));
        }
    }
    catch (error) {
        console.error(`Failed to load Yjs state for ${docName}:`, error);
    }
}
async function saveDocState(docName, doc) {
    try {
        const state = Y.encodeStateAsUpdate(doc);
        await DocumentModel.findByIdAndUpdate(docName, {
            yjsState: Buffer.from(state),
        });
    }
    catch (error) {
        console.error(`Failed to save Yjs state for ${docName}:`, error);
    }
}
/** Extract plain text from a Yjs document */
function getDocText(ydoc) {
    try {
        // Try to get text from the default XML fragment (used by TipTap/ProseMirror)
        const xmlFragment = ydoc.getXmlFragment('default');
        return xmlFragmentToText(xmlFragment);
    }
    catch {
        return '';
    }
}
/** Recursively extract text from an XML fragment */
function xmlFragmentToText(node) {
    let text = '';
    if (node.toString) {
        const str = node.toString();
        // Strip XML/HTML tags to get plain text
        text = str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return text;
}
/** Debounced change log to batch rapid keystrokes */
const pendingChanges = new Map();
function flushChangeLog(key) {
    const pending = pendingChanges.get(key);
    if (!pending)
        return;
    pendingChanges.delete(key);
    const insertedText = pending.insertedText.trim();
    const deletedText = pending.deleted.join('').trim(); // Unused for now
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
}
function broadcastToRoom(docName, message, exclude) {
    const room = connections.get(docName);
    if (!room)
        return;
    for (const client of room) {
        if (client.ws !== exclude && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(message);
        }
    }
}
export function setupYjsWebSocket(server) {
    const wss = new WebSocketServer({ server, path: '/yjs' });
    wss.on('connection', async (ws, req) => {
        // Buffer messages sent during async authentication/setup to prevent them from being dropped
        const messageBuffer = [];
        let isReady = false;
        const bufferHandler = (data) => {
            if (!isReady)
                messageBuffer.push(data);
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
        let userId;
        let userName;
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET);
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
            const isCollaborator = doc.collaborators.some((c) => c.user.toString() === userId);
            if (!isOwner && !isCollaborator) {
                doc.collaborators.push({
                    user: userId,
                    permission: 'editor',
                    addedAt: new Date(),
                });
                await doc.save();
            }
        }
        catch (error) {
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
        connections.get(docName).add(clientInfo);
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
        const handleMessage = (data) => {
            try {
                // Try to parse as JSON first (for awareness/presence/sync)
                const str = data.toString();
                if (str.startsWith('{')) {
                    const msg = JSON.parse(str);
                    if (msg.type === 'awareness') {
                        broadcastToRoom(docName, Buffer.from(str), ws);
                        return;
                    }
                    else if (msg.type === 'sync-request') {
                        // Client is asking for missing updates. Compute them using the client's State Vector.
                        const clientSv = new Uint8Array(msg.sv);
                        const update = Y.encodeStateAsUpdate(ydoc, clientSv);
                        ws.send(update);
                        return;
                    }
                }
            }
            catch {
                // Not JSON, treat as Yjs update
            }
            // Apply Yjs update with change tracking
            try {
                const update = new Uint8Array(data);
                let localInserts = '';
                let localDeletes = 0;
                const observer = (events) => {
                    events.forEach((event) => {
                        if (event.target instanceof Y.XmlText) {
                            event.changes.delta.forEach((change) => {
                                if (change.insert && typeof change.insert === 'string') {
                                    localInserts += change.insert;
                                }
                                else if (change.delete) {
                                    localDeletes += change.delete;
                                }
                            });
                        }
                    });
                };
                const xmlFragment = ydoc.getXmlFragment('default');
                xmlFragment.observeDeep(observer);
                Y.applyUpdate(ydoc, update);
                xmlFragment.unobserveDeep(observer);
                if (localInserts.length > 0 || localDeletes > 0) {
                    const changeKey = `${docName}:${userId}`;
                    lastSeenMap.set(lastSeenKey, Date.now());
                    // Batch rapid changes (debounce 3 seconds)
                    let pending = pendingChanges.get(changeKey);
                    if (!pending) {
                        pending = {
                            userId,
                            userName,
                            docName: docName,
                            inserted: [], // Keep for backwards compatibility with flush logic if needed, but we'll use a string
                            insertedText: '',
                            deleted: [],
                            isOffline: wasOffline,
                            timer: setTimeout(() => flushChangeLog(changeKey), 3000),
                        };
                        pendingChanges.set(changeKey, pending);
                    }
                    else {
                        clearTimeout(pending.timer);
                        pending.timer = setTimeout(() => flushChangeLog(changeKey), 3000);
                    }
                    if (localDeletes > 0) {
                        // Apply backspaces to cancel out typos in the current typing burst
                        pending.insertedText = pending.insertedText.slice(0, -localDeletes);
                    }
                    if (localInserts.length > 0) {
                        pending.insertedText += localInserts;
                    }
                }
                broadcastToRoom(docName, data, ws);
            }
            catch (error) {
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
            connections.get(docName)?.delete(clientInfo);
            // Flush any pending changes for this user
            const changeKey = `${docName}:${userId}`;
            if (pendingChanges.has(changeKey)) {
                clearTimeout(pendingChanges.get(changeKey).timer);
                flushChangeLog(changeKey);
            }
            if (connections.get(docName)?.size === 0) {
                connections.delete(docName);
                // Save state and clean up doc after a delay
                setTimeout(() => {
                    if (!connections.has(docName)) {
                        const doc = docs.get(docName);
                        if (doc) {
                            saveDocState(docName, doc);
                            doc.destroy();
                            docs.delete(docName);
                        }
                    }
                }, 30000);
            }
            else {
                // Broadcast updated presence
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
            }
        });
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            connections.get(docName)?.delete(clientInfo);
        });
    });
    console.log('✅ Yjs WebSocket server attached');
}
/** Find the text that was inserted by comparing before and after strings */
function findInsertedText(shorter, longer) {
    // Find common prefix
    let prefixLen = 0;
    while (prefixLen < shorter.length && shorter[prefixLen] === longer[prefixLen]) {
        prefixLen++;
    }
    // Find common suffix
    let suffixLen = 0;
    while (suffixLen < (shorter.length - prefixLen) &&
        shorter[shorter.length - 1 - suffixLen] === longer[longer.length - 1 - suffixLen]) {
        suffixLen++;
    }
    // The inserted text is what's between the common prefix and suffix in the longer string
    const insertedEnd = longer.length - suffixLen;
    if (prefixLen <= insertedEnd) {
        return longer.substring(prefixLen, insertedEnd);
    }
    return '';
}
//# sourceMappingURL=yjsServer.js.map