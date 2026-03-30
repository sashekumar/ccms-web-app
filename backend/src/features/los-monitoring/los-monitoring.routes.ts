import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { LOSMonitoringController } from './los-monitoring.controller';

const router = Router();
const controller = new LOSMonitoringController();

router.use(authenticateToken);

router.post('/stats', requirePermission('LOS_MON', 'VIEW'), (req, res) => controller.getStats(req, res));
router.post('/alerts', requirePermission('LOS_MON', 'VIEW'), (req, res) => controller.getLOSAlerts(req, res));
router.get('/alerts/admission/:admission_id', requirePermission('LOS_MON', 'VIEW'), (req, res) => controller.getAdmissionLOSAlerts(req, res));
router.post('/alerts/create', requirePermission('LOS_MON', 'UPDATE'), (req, res) => controller.createLOSAlert(req, res));
router.put('/alerts/:id', requirePermission('LOS_MON', 'UPDATE'), (req, res) => controller.updateLOSAlert(req, res));

export default router;
