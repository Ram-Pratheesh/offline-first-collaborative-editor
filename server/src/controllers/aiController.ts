import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { generateChangeSummary, generateDocumentSummary, generateTrackedChangeSummary, ChangeEvent } from '../services/aiService.js';
import { DocumentModel } from '../models/Document.js';
import { ChangeLogModel } from '../models/ChangeLog.js';

export const summarizeChanges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { changes, documentTitle } = req.body as {
      changes: ChangeEvent[];
      documentTitle: string;
    };

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      res.status(400).json({ message: 'Changes array is required' });
      return;
    }

    const summary = await generateChangeSummary(changes, documentTitle || 'Untitled');

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate summary' });
  }
};

export const summarizeTrackedChanges = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const docId = req.params.id;

    // Verify user has access to the document
    const doc = await DocumentModel.findOne({
      _id: docId,
      isDeleted: false,
      $or: [
        { owner: req.user!._id },
        { 'collaborators.user': req.user!._id },
      ],
    }).select('title');

    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    // Fetch recent change logs for this document (last 24 hours)
    const recentChanges = await ChangeLogModel.find({
      documentId: docId,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    if (recentChanges.length === 0) {
      res.json({
        summary: {
          summary: 'No recent changes have been tracked for this document.',
          contributorChanges: [],
          importantAdditions: [],
          removedContent: [],
          noEditsLost: true,
          totalEdits: 0,
        },
      });
      return;
    }

    // We fetch newest first to get the most recent 100, but we need to process them chronologically
    recentChanges.reverse();

    // Group changes by user
    const userChangesMap = new Map<string, { userName: string; inserts: string[]; deletes: string[]; offlineEdits: string[] }>();

    for (const change of recentChanges) {
      const key = change.userId.toString();
      if (!userChangesMap.has(key)) {
        userChangesMap.set(key, { userName: change.userName, inserts: [], deletes: [], offlineEdits: [] });
      }
      const userEntry = userChangesMap.get(key)!;

      if (change.changeType === 'insert') {
        if (change.isOffline) {
          userEntry.offlineEdits.push(change.content);
        } else {
          userEntry.inserts.push(change.content);
        }
      } else if (change.changeType === 'delete') {
        userEntry.deletes.push(change.content);
      }
    }

    // Build per-user change descriptions for the AI
    const perUserChanges: { userName: string; insertedText: string; deletedText: string; offlineText: string }[] = [];

    for (const [, entry] of userChangesMap) {
      perUserChanges.push({
        userName: entry.userName,
        insertedText: entry.inserts.join('').substring(0, 2000),
        deletedText: entry.deletes.join('').substring(0, 1000),
        offlineText: entry.offlineEdits.join('').substring(0, 1000),
      });
    }

    const summary = await generateTrackedChangeSummary(perUserChanges, doc.title);

    res.json({ summary });
  } catch (error) {
    console.error('Tracked summary error:', error);
    res.status(500).json({ message: 'Failed to generate tracked summary' });
  }
};

export const summarizeDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await DocumentModel.findOne({
      _id: req.params.id,
      isDeleted: false,
      $or: [
        { owner: req.user!._id },
        { 'collaborators.user': req.user!._id },
      ],
    }).select('title content');

    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    const summary = await generateDocumentSummary(doc.content, doc.title);

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate document summary' });
  }
};

