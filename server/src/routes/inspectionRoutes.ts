import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createInspection,
  getInspections,
  getInspection,
  updateInspection,
  joinInspection,
  createLocation,
  deleteLocation,
  getLocations,
  snapshotObservations,
  getObservations,
  triggerSemanticAnalysis,
  getSemanticResults,
  recordHumanDecision,
  finalizeReport,
  getExportData,
  getResearchLogs,
  getReportStatus,
  deleteInspection,
  shareInspection,
  removeInspectionCollaborator,
} from '../controllers/inspectionController.js';

const router = Router();

router.use(authenticate);

// Inspection CRUD
router.post('/', createInspection);
router.get('/', getInspections);
router.get('/:id', getInspection);
router.patch('/:id', updateInspection);
router.delete('/:id', deleteInspection);
router.post('/:id/join', joinInspection);
router.post('/:id/share', shareInspection);
router.delete('/:id/collaborators/:userId', removeInspectionCollaborator);

// Locations
router.post('/:id/locations', createLocation);
router.get('/:id/locations', getLocations);
router.delete('/:id/locations/:locationId', deleteLocation);

// Observations
router.post('/:id/observations/snapshot', snapshotObservations);
router.get('/:id/observations', getObservations);

// Semantic Analysis
router.post('/:id/semantic-analysis', triggerSemanticAnalysis);
router.get('/:id/semantic-results', getSemanticResults);
router.post('/:id/semantic-results/:resultId/decide', recordHumanDecision);

// Report
router.get('/:id/report-status', getReportStatus);
router.post('/:id/finalize', finalizeReport);
router.get('/:id/export-data', getExportData);

// Research
router.get('/:id/research-logs', getResearchLogs);

export default router;
