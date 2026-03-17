import { Router } from 'express';
import { ClaimsController } from './claims.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new ClaimsController();

// Use authentication middleware for all claim routes
router.use(authenticateToken);

// List Claims - Uses POST to allow complex filtering logic in body
router.post(
  '/list',
  requirePermission('CLAIMS', 'VIEW'),
  controller.getClaims
);

// Get specific claim by ID
router.get(
  '/:id',
  requirePermission('CLAIMS', 'VIEW'),
  controller.getClaimById
);

// Update claim
router.put(
  '/:id',
  requirePermission('CLAIMS', 'UPDATE'),
  controller.updateClaim
);

// Delete/Soft Delete Claim
router.delete(
  '/:id',
  requirePermission('CLAIMS', 'DELETE'),
  controller.deleteClaim
);

export default router;
