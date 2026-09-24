import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import { InspectionModel } from '../models/Inspection.js';
import { ObservationModel } from '../models/Observation.js';
import { SemanticResultModel } from '../models/SemanticResult.js';
import { ResearchLogModel } from '../models/ResearchLog.js';
import { User } from '../models/User.js';
import { analyzeObservationPair, filterCandidatePairs, generateContentHash } from '../services/semanticService.js';
import { broadcastToRoom } from '../websocket/yjsServer.js';

// ─── Validation Schemas ──────────────────────────────────────────────────────

const createInspectionSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
});

const shareInspectionSchema = z.object({
  email: z.string().email(),
  permission: z.enum(['editor', 'viewer']).default('editor'),
});

const createLocationSchema = z.object({
  locationId: z.string().min(1),
  name: z.string().min(1).max(200),
  parentId: z.string().nullable().optional(),
});

const snapshotObservationSchema = z.object({
  observations: z.array(
    z.object({
      observationId: z.string(),
      locationId: z.string(),
      authorId: z.string(),
      authorName: z.string(),
      plainTextContent: z.string(),
      connectivityState: z.enum(['online', 'offline']),
    })
  ),
});

const humanDecisionSchema = z.object({
  decision: z.enum(['ACCEPTED', 'REJECTED', 'KEPT_BOTH', 'KEPT_ONE', 'EDITED']),
});

// ─── Create Inspection ───────────────────────────────────────────────────────

export const createInspection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = createInspectionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Validation failed', errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { title, description } = validation.data;

    const inspection = await InspectionModel.create({
      title,
      description: description || '',
      owner: req.user!._id,
    });

    // Log for research
    await ResearchLogModel.create({
      inspectionId: inspection._id,
      eventType: 'inspection_created',
      data: { title, userId: req.user!._id, userName: req.user!.name },
    });

    const populated = await inspection.populate([
      { path: 'owner', select: 'name email avatar' },
    ]);

    res.status(201).json({ inspection: populated });
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({ message: 'Failed to create inspection' });
  }
};

// ─── Get Inspections ─────────────────────────────────────────────────────────

export const getInspections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const inspections = await InspectionModel.find({
      isDeleted: false,
      $or: [
        { owner: userId },
        { 'collaborators.user': userId },
      ],
    })
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .select('-yjsState')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ inspections });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch inspections' });
  }
};

// ─── Get Single Inspection ───────────────────────────────────────────────────

export const getInspection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inspection = await InspectionModel.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .select('-yjsState');

    if (!inspection) {
      res.status(404).json({ message: 'Inspection not found' });
      return;
    }

    res.json({ inspection });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch inspection' });
  }
};

// ─── Update Inspection ───────────────────────────────────────────────────────

export const updateInspection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, status } = req.body;
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;

    const inspection = await InspectionModel.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false,
        $or: [
          { owner: req.user!._id },
          { 'collaborators.user': req.user!._id, 'collaborators.permission': 'editor' },
        ],
      },
      updates,
      { new: true }
    )
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .select('-yjsState');

    if (!inspection) {
      res.status(404).json({ message: 'Inspection not found or access denied' });
      return;
    }

    res.json({ inspection });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update inspection' });
  }
};

// ─── Join Inspection ─────────────────────────────────────────────────────────

export const joinInspection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const inspection = await InspectionModel.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!inspection) {
      res.status(404).json({ message: 'Inspection not found' });
      return;
    }

    const isOwner = inspection.owner.toString() === userId.toString();
    const isCollaborator = inspection.collaborators.some((c: any) => {
      const cId = c.user?._id?.toString() || c.user?.toString();
      return cId === userId.toString();
    });

    if (!isOwner && !isCollaborator) {
      inspection.collaborators.push({
        user: userId,
        permission: 'editor',
        addedAt: new Date(),
      });
      await inspection.save();

      await ResearchLogModel.create({
        inspectionId: inspection._id,
        eventType: 'collaborator_joined',
        data: { userId: req.user!._id, userName: req.user!.name },
      });
    }

    const populated = await inspection.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'collaborators.user', select: 'name email avatar' },
    ]);

    res.json({ inspection: populated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to join inspection' });
  }
};

// ─── Create Location (server backup) ────────────────────────────────────────

export const createLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = createLocationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Validation failed', errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { locationId, name, parentId } = validation.data;

    const inspection = await InspectionModel.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false,
        'locations.locationId': { $ne: locationId }, // prevent duplicate
        $or: [
          { owner: req.user!._id },
          { 'collaborators.user': req.user!._id, 'collaborators.permission': 'editor' },
        ],
      },
      {
        $push: {
          locations: {
            locationId,
            name,
            parentId: parentId || null,
            createdBy: req.user!._id,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).select('-yjsState');

    if (!inspection) {
      res.status(404).json({ message: 'Inspection not found or location already exists' });
      return;
    }

    await ResearchLogModel.create({
      inspectionId: inspection._id,
      eventType: 'location_created',
      data: { locationId, name, userId: req.user!._id },
    });

    res.json({ locations: inspection.locations });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create location' });
  }
};

// ─── Delete Location ─────────────────────────────────────────────────────────

export const deleteLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, locationId } = req.params;

    const inspection = await InspectionModel.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
        $or: [
          { owner: req.user!._id },
          { 'collaborators.user': req.user!._id, 'collaborators.permission': 'editor' },
        ],
      },
      {
        $pull: { locations: { locationId } },
      },
      { new: true }
    ).select('-yjsState');

    if (!inspection) {
      res.status(404).json({ message: 'Inspection not found or permission denied' });
      return;
    }

    // Clean up observations and semantic results for this location
    await ObservationModel.deleteMany({ inspectionId: id, locationId });
    await SemanticResultModel.deleteMany({ inspectionId: id, locationId });

    await ResearchLogModel.create({
      inspectionId: id,
      eventType: 'location_deleted',
      data: { locationId, userId: req.user!._id },
    });

    res.json({ locations: inspection.locations });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete location' });
  }
};

// ─── Get Locations ───────────────────────────────────────────────────────────

export const getLocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inspection = await InspectionModel.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).select('locations');

    if (!inspection) {
      res.status(404).json({ message: 'Inspection not found' });
      return;
    }

    res.json({ locations: inspection.locations });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
};

// ─── Snapshot Observations ───────────────────────────────────────────────────

export const snapshotObservations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = snapshotObservationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Validation failed' });
      return;
    }

    const inspectionId = req.params.id;
    const { observations } = validation.data;

    // Upsert each observation snapshot
    const ops = observations.map((obs) => ({
      updateOne: {
        filter: { inspectionId, observationId: obs.observationId },
        update: {
          $set: {
            locationId: obs.locationId,
            authorId: obs.authorId,
            authorName: obs.authorName,
            plainTextContent: obs.plainTextContent.substring(0, 10000),
            connectivityState: obs.connectivityState,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            inspectionId,
            observationId: obs.observationId,
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await ObservationModel.bulkWrite(ops as any);

    // Clean up observations that were deleted on the client
    const currentObservationIds = observations.map((o) => o.observationId);
    const observationsToDelete = await ObservationModel.find({
      inspectionId,
      observationId: { $nin: currentObservationIds },
    });

    if (observationsToDelete.length > 0) {
      const deletedIds = observationsToDelete.map((o) => o.observationId);
      
      await ObservationModel.deleteMany({
        inspectionId,
        observationId: { $in: deletedIds },
      });
      
      await SemanticResultModel.deleteMany({
        inspectionId,
        observationIds: { $in: deletedIds },
      });
      
      // Also trigger a semantic_updated broadcast since semantic results might have been deleted
      import('../websocket/yjsServer.js').then(({ broadcastToRoom }) => {
        broadcastToRoom(`inspection-${inspectionId}`, JSON.stringify({ type: 'semantic_updated' }));
      }).catch(() => {});
    }

    res.json({ message: 'Observations snapshot saved', count: observations.length });
  } catch (error) {
    console.error('Snapshot error:', error);
    res.status(500).json({ message: 'Failed to snapshot observations' });
  }
};

// ─── Get Observations ────────────────────────────────────────────────────────

export const getObservations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const observations = await ObservationModel.find({
      inspectionId: req.params.id,
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ observations });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch observations' });
  }
};

// ─── Trigger Semantic Analysis ───────────────────────────────────────────────

export const triggerSemanticAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inspectionId = req.params.id;
    const { locationId } = req.body;

    if (!locationId) {
      res.status(400).json({ message: 'locationId is required' });
      return;
    }

    // Get all observation snapshots for this location
    const observations = await ObservationModel.find({
      inspectionId,
      locationId,
    }).lean();

    if (observations.length < 2) {
      res.json({ results: [], message: 'Not enough observations for comparison' });
      return;
    }

    // Get inspection for location name
    const inspection = await InspectionModel.findById(inspectionId).select('locations');
    const location = inspection?.locations.find((l) => l.locationId === locationId);
    const locationName = location?.name || 'Unknown Location';

    // Lightweight candidate filtering
    const candidates = filterCandidatePairs(
      observations.map((o) => ({
        observationId: o.observationId,
        authorId: o.authorId.toString(),
        authorName: o.authorName,
        text: o.plainTextContent,
      }))
    );

    if (candidates.length === 0) {
      res.json({ results: [], message: 'No candidate pairs found for analysis' });
      return;
    }

    await ResearchLogModel.create({
      inspectionId,
      eventType: 'semantic_analysis_started',
      data: {
        locationId,
        locationName,
        totalObservations: observations.length,
        candidatePairs: candidates.length,
        triggeredBy: req.user!._id,
      },
    });

    const results = [];

    for (const [obs1, obs2] of candidates) {
      const hash1 = generateContentHash(obs1.text);
      const hash2 = generateContentHash(obs2.text);

      // Check if this pair was already analyzed
      const existing = await SemanticResultModel.findOne({
        inspectionId,
        locationId,
        observationIds: { $all: [obs1.observationId, obs2.observationId] },
      });

      // If existing result has the same content hashes, skip re-analysis
      if (
        existing &&
        existing.contentHashes &&
        existing.contentHashes.includes(hash1) &&
        existing.contentHashes.includes(hash2)
      ) {
        results.push(existing);
        continue;
      }

      const startTime = Date.now();
      try {
        const analysis = await analyzeObservationPair({
          observation1: obs1,
          observation2: obs2,
          locationName,
        });
        const processingTime = Date.now() - startTime;

        let semanticResult = await SemanticResultModel.findOne({
          inspectionId,
          locationId,
          observationIds: { $all: [obs1.observationId, obs2.observationId] },
        });

        if (semanticResult) {
          semanticResult.contentHashes = [hash1, hash2];
          semanticResult.relationship = analysis.relationship as any;
          semanticResult.confidence = analysis.confidence;
          semanticResult.reason = analysis.reason;
          semanticResult.suggestedAction = analysis.suggestedAction as any;
          semanticResult.suggestedText = analysis.suggestedText || null as any;
          semanticResult.humanDecision = 'PENDING';
          semanticResult.decidedBy = null as any;
          semanticResult.decidedAt = null as any;
          semanticResult.aiProcessingTimeMs = processingTime;
          await semanticResult.save();
        } else {
          semanticResult = await SemanticResultModel.create({
            inspectionId,
            locationId,
            observationIds: [obs1.observationId, obs2.observationId],
            contentHashes: [hash1, hash2],
            relationship: analysis.relationship,
            confidence: analysis.confidence,
            reason: analysis.reason,
            suggestedAction: analysis.suggestedAction,
            suggestedText: analysis.suggestedText || null,
            humanDecision: 'PENDING',
            aiProcessingTimeMs: processingTime,
          });
        }

        results.push(semanticResult);

        await ResearchLogModel.create({
          inspectionId,
          eventType: 'semantic_analysis_completed',
          data: {
            locationId,
            observationIds: [obs1.observationId, obs2.observationId],
            relationship: analysis.relationship,
            confidence: analysis.confidence,
            processingTimeMs: processingTime,
          },
        });
      } catch (aiError) {
        console.error('AI analysis failed for pair:', obs1.observationId, obs2.observationId, aiError);
        // Continue with remaining pairs — AI failure should not block the workflow
      }
    }

    broadcastToRoom(`inspection-${inspectionId}`, JSON.stringify({ type: 'semantic_updated' }));

    res.json({ results });
  } catch (error) {
    console.error('Semantic analysis error:', error);
    res.status(500).json({ message: 'Failed to run semantic analysis' });
  }
};

// ─── Get Semantic Results ────────────────────────────────────────────────────

export const getSemanticResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const results = await SemanticResultModel.find({
      inspectionId: req.params.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch semantic results' });
  }
};

// ─── Record Human Decision ───────────────────────────────────────────────────

export const recordHumanDecision = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = humanDecisionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Invalid decision' });
      return;
    }

    const { decision } = validation.data;

    const result = await SemanticResultModel.findOneAndUpdate(
      {
        _id: req.params.resultId,
        inspectionId: req.params.id,
      },
      {
        humanDecision: decision,
        decidedBy: req.user!._id,
        decidedAt: new Date(),
      },
      { new: true }
    );

    if (!result) {
      res.status(404).json({ message: 'Semantic result not found' });
      return;
    }

    await ResearchLogModel.create({
      inspectionId: req.params.id,
      eventType: 'human_decision',
      data: {
        semanticResultId: result._id,
        relationship: result.relationship,
        decision,
        decidedBy: req.user!._id,
      },
    });

    broadcastToRoom(`inspection-${req.params.id}`, JSON.stringify({ type: 'semantic_updated' }));

    res.json({ result });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record decision' });
  }
};

// ─── Finalize Report ─────────────────────────────────────────────────────────

export const finalizeReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inspectionId = req.params.id;

    // Check that all semantic results have been resolved
    const pendingResults = await SemanticResultModel.countDocuments({
      inspectionId,
      humanDecision: 'PENDING',
      relationship: { $ne: 'INDEPENDENT' }, // INDEPENDENT doesn't require human review
    });

    if (pendingResults > 0) {
      res.status(400).json({
        message: `Cannot finalize: ${pendingResults} semantic review(s) still pending`,
        pendingCount: pendingResults,
      });
      return;
    }

    const inspection = await InspectionModel.findOne({
      _id: inspectionId,
      isDeleted: false,
      $or: [
        { owner: req.user!._id },
        { 'collaborators.user': req.user!._id, 'collaborators.permission': 'editor' },
      ],
    }).populate('owner', 'name email avatar').populate('collaborators.user', 'name email avatar').select('-yjsState');

    if (!inspection) {
      res.status(404).json({ message: 'Inspection not found or unauthorized' });
      return;
    }

    if (inspection.status === 'FINALIZED') {
      res.status(400).json({ message: 'Inspection is already finalized' });
      return;
    }

    // Add user to finalizedBy if not already there
    const userIdString = req.user!._id.toString();
    const alreadyFinalized = inspection.finalizedBy.some(id => id.toString() === userIdString);
    if (!alreadyFinalized) {
      inspection.finalizedBy.push(req.user!._id as any);
    }

    // Check if everyone has finalized (deduplicate collaborators)
    const uniqueCollabIds = new Set(
      inspection.collaborators
        .map((c: any) => c.user?._id?.toString() || c.user?.toString())
        .filter(Boolean)
    );
    const totalRequired = uniqueCollabIds.size + 1;
    if (inspection.finalizedBy.length >= totalRequired) {
      inspection.status = 'FINALIZED';
      inspection.finalizedAt = new Date();
    } else {
      inspection.status = 'READY_TO_FINALIZE'; // Partial finalization
    }

    await inspection.save();

    await ResearchLogModel.create({
      inspectionId,
      eventType: 'report_finalized',
      data: {
        finalizedBy: req.user!._id,
        observationCount: await ObservationModel.countDocuments({ inspectionId }),
        locationCount: inspection.locations.length,
      },
    });

    broadcastToRoom(`inspection-${inspectionId}`, JSON.stringify({ type: 'status_updated' }));

    res.json({ inspection });
  } catch (error) {
    res.status(500).json({ message: 'Failed to finalize report' });
  }
};

// ─── Export Data (for PDF generation on client) ──────────────────────────────

export const getExportData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inspectionId = req.params.id;

    const inspection = await InspectionModel.findOne({
      _id: inspectionId,
      isDeleted: false,
    })
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .populate('finalizedBy', 'name email avatar')
      .select('-yjsState');

    if (!inspection) {
      res.status(404).json({ message: 'Inspection not found' });
      return;
    }

    const observations = await ObservationModel.find({ inspectionId })
      .sort({ locationId: 1, createdAt: 1 })
      .lean();

    const semanticResults = await SemanticResultModel.find({
      inspectionId,
      humanDecision: { $ne: 'PENDING' },
    }).lean();

    res.json({
      inspection,
      observations,
      semanticResults,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get export data' });
  }
};

// ─── Research Logs ───────────────────────────────────────────────────────────

export const getResearchLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await ResearchLogModel.find({
      inspectionId: req.params.id,
    })
      .sort({ timestamp: -1 })
      .limit(500)
      .lean();

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch research logs' });
  }
};

// ─── Get Report Status ───────────────────────────────────────────────────────

export const getReportStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inspectionId = req.params.id;

    const inspection = await InspectionModel.findById(inspectionId).select('status collaborators finalizedBy owner');
    if (!inspection) {
      res.status(404).json({ message: 'Inspection not found' });
      return;
    }

    const totalNonIndependent = await SemanticResultModel.countDocuments({
      inspectionId,
      relationship: { $ne: 'INDEPENDENT' },
    });

    const pendingReviews = await SemanticResultModel.countDocuments({
      inspectionId,
      relationship: { $ne: 'INDEPENDENT' },
      humanDecision: 'PENDING',
    });

    const isFinalized = inspection.status === 'FINALIZED';
    const allReviewed = pendingReviews === 0;
    const hasSemanticResults = totalNonIndependent > 0;

    // Count observations to determine if observation phase is done
    const totalObservations = await ObservationModel.countDocuments({ inspectionId });
    
    const uniqueCollaboratorIds = new Set(
      inspection.collaborators
        .map((c: any) => c.user?._id?.toString() || c.user?.toString())
        .filter(Boolean)
    );
    const totalUsers = uniqueCollaboratorIds.size + 1;
    const finalizedUsers = inspection.finalizedBy.length;

    // Also check if all unique users finalized (in case status wasn't updated due to old bug)
    const effectivelyFinalized = isFinalized || finalizedUsers >= totalUsers;

    res.json({
      status: {
        synchronization: totalObservations > 0 ? 'COMPLETE' : 'WAITING',
        semanticReview: !hasSemanticResults
          ? 'NOT_REQUIRED'
          : allReviewed
            ? 'COMPLETE'
            : 'WAITING',
        finalization: effectivelyFinalized
          ? 'FINALIZED'
          : allReviewed
            ? 'READY'
            : 'LOCKED',
        pdfExport: effectivelyFinalized ? 'AVAILABLE' : 'LOCKED',
        totalUsers,
        finalizedUsers,
      },
      pendingReviews,
      totalSemanticResults: totalNonIndependent,
      totalUsers,
      finalizedUsers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get report status' });
  }
};

// ─── Delete Inspection ───────────────────────────────────────────────────────

export const deleteInspection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inspection = await InspectionModel.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user!._id,
        isDeleted: false,
      },
      { isDeleted: true },
      { new: true }
    );

    if (!inspection) {
      res.status(404).json({ message: 'Inspection not found or not owner' });
      return;
    }

    await ResearchLogModel.create({
      inspectionId: req.params.id,
      eventType: 'inspection_deleted',
      data: { userId: req.user!._id, userName: req.user!.name },
    });

    res.json({ message: 'Inspection deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete inspection' });
  }
};

// ─── Share Inspection ────────────────────────────────────────────────────────

export const shareInspection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = shareInspectionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Invalid data', errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { email, permission } = validation.data;

    const inspection = await InspectionModel.findOne({
      _id: req.params.id,
      isDeleted: false,
      $or: [
        { owner: req.user!._id },
        { 'collaborators.user': req.user!._id, 'collaborators.permission': 'editor' },
      ],
    });

    if (!inspection) {
      res.status(404).json({ message: 'Inspection not found or permission denied' });
      return;
    }

    const userToShare = await User.findOne({ email });
    if (!userToShare) {
      res.status(404).json({ message: 'User not found with that email' });
      return;
    }

    if (userToShare._id.toString() === req.user!._id.toString()) {
      res.status(400).json({ message: 'Cannot share with yourself' });
      return;
    }

    const existingCollab = inspection.collaborators.find((c: any) => {
      const cId = c.user?._id?.toString() || c.user?.toString();
      return cId === userToShare._id.toString();
    });

    if (existingCollab) {
      existingCollab.permission = permission;
    } else {
      inspection.collaborators.push({
        user: userToShare._id as any,
        permission,
        addedAt: new Date(),
      });
    }

    await inspection.save();
    const populated = await inspection.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'collaborators.user', select: 'name email avatar' },
    ]);

    await ResearchLogModel.create({
      inspectionId: inspection._id,
      eventType: 'collaborator_invited',
      data: {
        invitedBy: req.user!._id,
        invitedUser: userToShare._id,
        email,
        permission,
      },
    });

    res.json({ inspection: populated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to share inspection' });
  }
};

// ─── Remove Inspection Collaborator ──────────────────────────────────────────

export const removeInspectionCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inspection = await InspectionModel.findOne({
      _id: req.params.id,
      owner: req.user!._id,
      isDeleted: false,
    });

    if (!inspection) {
      res.status(404).json({ message: 'Inspection not found or not owner' });
      return;
    }

    const userIdToRemove = req.params.userId;
    inspection.collaborators = inspection.collaborators.filter(
      (c) => c.user.toString() !== userIdToRemove
    );

    await inspection.save();
    const populated = await inspection.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'collaborators.user', select: 'name email avatar' },
    ]);

    await ResearchLogModel.create({
      inspectionId: inspection._id,
      eventType: 'collaborator_removed',
      data: { removedBy: req.user!._id, removedUserId: userIdToRemove },
    });

    res.json({ message: 'Collaborator removed', inspection: populated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove collaborator' });
  }
};
