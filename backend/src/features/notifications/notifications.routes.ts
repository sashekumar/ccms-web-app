/**
 * Notifications Log - Routes
 * API endpoints for notification log operations
 */

import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { NotificationsController } from './notifications.controller';

const router = Router();
const controller = new NotificationsController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ============================================================================
// STATISTICS
// ============================================================================

router.post(
  '/stats',
  requirePermission('NOTIFICATIONS_LOG', 'VIEW'),
  (req, res) => controller.getStats(req, res)
);

// ============================================================================
// NOTIFICATION LOG ENDPOINTS
// ============================================================================

router.post(
  '/notifications',
  requirePermission('NOTIFICATIONS_LOG', 'VIEW'),
  (req, res) => controller.getNotifications(req, res)
);

router.post(
  '/notifications/create',
  requirePermission('NOTIFICATIONS_LOG', 'UPDATE'),
  (req, res) => controller.createNotification(req, res)
);

router.put(
  '/notifications/:id',
  requirePermission('NOTIFICATIONS_LOG', 'UPDATE'),
  (req, res) => controller.updateNotification(req, res)
);

export default router;
