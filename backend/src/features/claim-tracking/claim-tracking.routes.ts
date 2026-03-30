import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { ClaimTrackingController } from './claim-tracking.controller';

const router = Router();
const controller = new ClaimTrackingController();

router.use(authenticateToken);

// Stats
router.post('/stats', requirePermission('CLAIM_TRACKING', 'VIEW'), controller.getStats);

// Claim history (all 3 sub-types for one claim)
router.post('/history/:claimId', requirePermission('CLAIM_TRACKING', 'VIEW'), controller.getClaimHistory);

// Status Log
router.post('/status-log', requirePermission('CLAIM_TRACKING', 'VIEW'), controller.getStatusLogs);
router.post('/status-log/create', requirePermission('CLAIM_TRACKING', 'UPDATE'), controller.createStatusLog);
router.put('/status-log/:id', requirePermission('CLAIM_TRACKING', 'UPDATE'), controller.updateStatusLog);

// Milestones
router.post('/milestones', requirePermission('CLAIM_TRACKING', 'VIEW'), controller.getMilestones);
router.post('/milestones/create', requirePermission('CLAIM_TRACKING', 'UPDATE'), controller.createMilestone);
router.put('/milestones/:id', requirePermission('CLAIM_TRACKING', 'UPDATE'), controller.updateMilestone);

// Durations / SLA
router.post('/durations', requirePermission('CLAIM_TRACKING', 'VIEW'), controller.getDurations);
router.post('/durations/create', requirePermission('CLAIM_TRACKING', 'UPDATE'), controller.createDuration);
router.put('/durations/:id', requirePermission('CLAIM_TRACKING', 'UPDATE'), controller.updateDuration);

export default router;
