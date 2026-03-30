import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { DefermentMonitoringController } from './deferment-monitoring.controller';

const router = Router();
const controller = new DefermentMonitoringController();

router.use(authenticateToken);

router.post('/stats', requirePermission('DEFERMENT_MON', 'VIEW'), (req, res) => controller.getStats(req, res));
router.post('/cases', requirePermission('DEFERMENT_MON', 'VIEW'), (req, res) => controller.getDefermentCases(req, res));
router.get('/cases/admission/:admission_id', requirePermission('DEFERMENT_MON', 'VIEW'), (req, res) => controller.getAdmissionDeferment(req, res));
router.put('/cases/:admission_id', requirePermission('DEFERMENT_MON', 'UPDATE'), (req, res) => controller.updateDefermentCase(req, res));

export default router;
