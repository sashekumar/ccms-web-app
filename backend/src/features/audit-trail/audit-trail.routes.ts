/**
 * Audit Trail - Routes
 * API endpoints for audit trail operations
 */

import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { AuditTrailController } from './audit-trail.controller';

const router = Router();
const controller = new AuditTrailController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ============================================================================
// STATISTICS
// ============================================================================

router.post(
  '/stats',
  requirePermission('AUDIT_TRAIL', 'VIEW'),
  (req, res) => controller.getStats(req, res)
);

// ============================================================================
// AUDIT LOGS ENDPOINTS
// ============================================================================

router.post(
  '/audit-logs',
  requirePermission('AUDIT_TRAIL', 'VIEW'),
  (req, res) => controller.getAuditLogs(req, res)
);

router.post(
  '/audit-logs/create',
  requirePermission('AUDIT_TRAIL', 'UPDATE'),
  (req, res) => controller.createAuditLog(req, res)
);

router.put(
  '/audit-logs/:id',
  requirePermission('AUDIT_TRAIL', 'UPDATE'),
  (req, res) => controller.updateAuditLog(req, res)
);

// ============================================================================
// ADMISSION LOGS ENDPOINTS
// ============================================================================

router.post(
  '/admission-logs',
  requirePermission('AUDIT_TRAIL', 'VIEW'),
  (req, res) => controller.getAdmissionLogs(req, res)
);

router.post(
  '/admission-logs/create',
  requirePermission('AUDIT_TRAIL', 'UPDATE'),
  (req, res) => controller.createAdmissionLog(req, res)
);

router.put(
  '/admission-logs/:id',
  requirePermission('AUDIT_TRAIL', 'UPDATE'),
  (req, res) => controller.updateAdmissionLog(req, res)
);

export default router;
