import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { FwdAccumulationController } from './fwd-accumulation.controller';

const router = Router();
const controller = new FwdAccumulationController();

router.use(authenticateToken);

// Stats
router.post('/stats', requirePermission('FWD_ACCUMULATION', 'VIEW'), controller.getStats);

// Client routes
router.post('/client', requirePermission('FWD_ACCUMULATION', 'VIEW'), controller.getClientAccumulations);
router.post('/client/create', requirePermission('FWD_ACCUMULATION', 'UPDATE'), controller.createClientAccumulation);
router.put('/client/:id', requirePermission('FWD_ACCUMULATION', 'UPDATE'), controller.updateClientAccumulation);

// Disability routes
router.post('/disability', requirePermission('FWD_ACCUMULATION', 'VIEW'), controller.getDisabilityAccumulations);
router.post('/disability/create', requirePermission('FWD_ACCUMULATION', 'UPDATE'), controller.createDisabilityAccumulation);
router.put('/disability/:id', requirePermission('FWD_ACCUMULATION', 'UPDATE'), controller.updateDisabilityAccumulation);

// Onetime routes
router.post('/onetime', requirePermission('FWD_ACCUMULATION', 'VIEW'), controller.getOnetimeAccumulations);
router.post('/onetime/create', requirePermission('FWD_ACCUMULATION', 'UPDATE'), controller.createOnetimeAccumulation);
router.put('/onetime/:id', requirePermission('FWD_ACCUMULATION', 'UPDATE'), controller.updateOnetimeAccumulation);

// PA routes
router.post('/pa', requirePermission('FWD_ACCUMULATION', 'VIEW'), controller.getPaAccumulations);
router.post('/pa/create', requirePermission('FWD_ACCUMULATION', 'UPDATE'), controller.createPaAccumulation);
router.put('/pa/:id', requirePermission('FWD_ACCUMULATION', 'UPDATE'), controller.updatePaAccumulation);

export default router;
