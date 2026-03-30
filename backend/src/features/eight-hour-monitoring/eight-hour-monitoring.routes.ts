import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { EightHourMonitoringController } from './eight-hour-monitoring.controller';

const router = Router();
const controller = new EightHourMonitoringController();

router.use(authenticateToken);

router.post('/stats', requirePermission('EIGHT_HOUR_MON', 'VIEW'), (req, res) => controller.getStats(req, res));
router.post('/checks', requirePermission('EIGHT_HOUR_MON', 'VIEW'), (req, res) => controller.getMonitoringChecks(req, res));
router.get('/checks/admission/:admission_id', requirePermission('EIGHT_HOUR_MON', 'VIEW'), (req, res) => controller.getAdmissionMonitoringChecks(req, res));
router.post('/checks/create', requirePermission('EIGHT_HOUR_MON', 'UPDATE'), (req, res) => controller.createMonitoringCheck(req, res));
router.put('/checks/:id', requirePermission('EIGHT_HOUR_MON', 'UPDATE'), (req, res) => controller.updateMonitoringCheck(req, res));

export default router;
