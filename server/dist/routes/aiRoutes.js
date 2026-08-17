import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { summarizeChanges, summarizeDocument, summarizeTrackedChanges } from '../controllers/aiController.js';
const router = Router();
router.use(authenticate);
router.post('/summarize-changes', summarizeChanges);
router.get('/document-summary/:id', summarizeDocument);
router.get('/document-changes/:id', summarizeTrackedChanges);
export default router;
//# sourceMappingURL=aiRoutes.js.map