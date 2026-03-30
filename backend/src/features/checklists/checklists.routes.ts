/**
 * Checklists - Routes
 * API endpoints for checklists operations
 */

import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { ChecklistsController } from './checklists.controller';

const router = Router();
const controller = new ChecklistsController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ============================================================================
// STATISTICS
// ============================================================================

router.post(
  '/stats',
  requirePermission('CHECKLISTS', 'VIEW'),
  (req, res) => controller.getStats(req, res)
);

// ============================================================================
// CHECKLISTS ENDPOINTS
// ============================================================================

router.post(
  '/checklists',
  requirePermission('CHECKLISTS', 'VIEW'),
  (req, res) => controller.getChecklists(req, res)
);

router.get(
  '/checklists/claim/:claim_id',
  requirePermission('CHECKLISTS', 'VIEW'),
  (req, res) => controller.getClaimChecklists(req, res)
);

router.post(
  '/checklists/create',
  requirePermission('CHECKLISTS', 'UPDATE'),
  (req, res) => controller.createChecklist(req, res)
);

router.put(
  '/checklists/:id',
  requirePermission('CHECKLISTS', 'UPDATE'),
  (req, res) => controller.updateChecklist(req, res)
);

router.delete(
  '/checklists/:id',
  requirePermission('CHECKLISTS', 'UPDATE'),
  (req, res) => controller.deleteChecklist(req, res)
);

export default router;
