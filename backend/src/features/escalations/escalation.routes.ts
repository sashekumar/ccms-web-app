import { Router } from 'express';
import { EscalationController } from './escalation.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new EscalationController();

// Use authentication middleware for all escalation routes
router.use(authenticateToken);

// List escalations with filters (POST for consistency)
router.post(
  '/',
  requirePermission('ESCALATIONS', 'VIEW'),
  controller.getEscalations
);

// Get specific escalation by ID (POST)
router.post(
  '/:id',
  requirePermission('ESCALATIONS', 'VIEW'),
  controller.getEscalationById
);

// Update escalation (priority, status)
router.put(
  '/:id',
  requirePermission('ESCALATIONS', 'UPDATE'),
  controller.updateEscalation
);

// Assign escalation to officer
router.post(
  '/:id/assign',
  requirePermission('ESCALATIONS', 'UPDATE'),
  controller.assignEscalation
);

// Add update/remark
router.post(
  '/:id/updates',
  requirePermission('ESCALATIONS', 'UPDATE'),
  controller.addEscalationUpdate
);

// Get updates for escalation (POST to different endpoint)
router.post(
  '/:id/updates/list',
  requirePermission('ESCALATIONS', 'VIEW'),
  controller.getEscalationUpdates
);

// Close escalation
router.post(
  '/:id/close',
  requirePermission('ESCALATIONS', 'UPDATE'),
  controller.closeEscalation
);

// Lookups
router.post(
  '/lookups/sources',
  requirePermission('ESCALATIONS', 'VIEW'),
  controller.getEscalationSources
);

router.post(
  '/lookups/natures',
  requirePermission('ESCALATIONS', 'VIEW'),
  controller.getEscalationNatures
);

export default router;
