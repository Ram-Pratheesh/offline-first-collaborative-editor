import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  joinDocument,
  removeCollaborator,
  toggleStar,
  getVersions,
  saveVersion,
  restoreVersion,
  getYjsState,
  saveYjsState,
} from '../controllers/documentController.js';

const router = Router();

router.use(authenticate);

router.post('/', createDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.patch('/:id', updateDocument);
router.delete('/:id', deleteDocument);

router.post('/:id/share', shareDocument);
router.post('/:id/join', joinDocument);
router.delete('/:id/share/:userId', removeCollaborator);

router.post('/:id/star', toggleStar);

router.get('/:id/versions', getVersions);
router.post('/:id/versions', saveVersion);
router.post('/:id/versions/:versionId/restore', restoreVersion);

router.get('/:id/yjs-state', getYjsState);
router.post('/:id/yjs-state', saveYjsState);

export default router;
