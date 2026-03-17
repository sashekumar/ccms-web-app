import { Router } from 'express';
import { MonitoringController } from './monitoring.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new MonitoringController();

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// MONITORING ROUTES
// ============================================================================

/**
 * Get active LOS alerts
 * POST /api/monitoring/los-alerts
 * Permission: ADMISSIONS.VIEW
 * Body: MonitoringFilters
 */
router.post('/los-alerts', requirePermission('ADMISSIONS', 'VIEW'), controller.getLOSAlerts);

/**
 * Acknowledge LOS alert
 * POST /api/monitoring/acknowledge-alert
 * Permission: ADMISSIONS.UPDATE
 * Body: { alert_id: number, notes?: string }
 */
router.post('/acknowledge-alert', requirePermission('ADMISSIONS', 'UPDATE'), controller.acknowledgeAlert);

/**
 * Get 8-hour monitoring checks
 * POST /api/monitoring/8hm-checks
 * Permission: ADMISSIONS.VIEW
 * Body: MonitoringFilters
 */
router.post('/8hm-checks', requirePermission('ADMISSIONS', 'VIEW'), controller.get8HMChecks);

/**
 * Record 8-hour monitoring check
 * POST /api/monitoring/record-check
 * Permission: ADMISSIONS.UPDATE
 * Body: { admission_id: number, status: string, notes?: string }
 */
router.post('/record-check', requirePermission('ADMISSIONS', 'UPDATE'), controller.recordCheck);

export default router;
