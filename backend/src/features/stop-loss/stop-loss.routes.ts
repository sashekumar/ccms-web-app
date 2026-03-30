import { Router } from 'express';
import { StopLossController } from './stop-loss.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new StopLossController();

router.use(authenticateToken);

// ============================================================================
// STOP LOSS ROUTES
// ============================================================================

/** POST /api/stop-loss — list with filters */
router.post('/', requirePermission('STOP_LOSS', 'VIEW'), controller.getStopLossRecords);

/** POST /api/stop-loss/stats — aggregated statistics */
router.post('/stats', requirePermission('STOP_LOSS', 'VIEW'), controller.getStats);

/** POST /api/stop-loss/create — create record */
router.post('/create', requirePermission('STOP_LOSS', 'UPDATE'), controller.createStopLoss);

/** POST /api/stop-loss/:id — get by ID */
router.post('/:id', requirePermission('STOP_LOSS', 'VIEW'), controller.getStopLossById);

/** PUT /api/stop-loss/:id — update */
router.put('/:id', requirePermission('STOP_LOSS', 'UPDATE'), controller.updateStopLoss);

export default router;
