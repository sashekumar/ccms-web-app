import { Router } from 'express';
import { ClaimsController } from './claims.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new ClaimsController();

// Use authentication middleware for all claim routes
router.use(authenticateToken);

// Create reimbursement claim
router.post(
  '/',
  requirePermission('CLAIMS', 'CREATE'),
  controller.createClaim
);

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

// ============================================================================
// CLAIM EXPENSES SUB-ROUTES
// ============================================================================

// Get all expenses for a claim
router.get(
  '/:id/expenses',
  requirePermission('CLAIMS', 'VIEW'),
  controller.getClaimExpenses
);

// Add expense to a claim
router.post(
  '/:id/expenses',
  requirePermission('CLAIMS', 'UPDATE'),
  controller.addClaimExpense
);

// Update expense
router.put(
  '/:id/expenses/:expenseId',
  requirePermission('CLAIMS', 'UPDATE'),
  controller.updateClaimExpense
);

// Delete expense
router.delete(
  '/:id/expenses/:expenseId',
  requirePermission('CLAIMS', 'UPDATE'),
  controller.deleteClaimExpense
);

// ============================================================================
// CLAIM DOCUMENTS SUB-ROUTES
// ============================================================================

// Get all documents for a claim
router.get(
  '/:id/documents',
  requirePermission('CLAIMS', 'VIEW'),
  controller.getClaimDocuments
);

// Add document to a claim
router.post(
  '/:id/documents',
  requirePermission('CLAIMS', 'UPDATE'),
  controller.addClaimDocument
);

// Update document metadata
router.put(
  '/:id/documents/:docId',
  requirePermission('CLAIMS', 'UPDATE'),
  controller.updateClaimDocument
);

// Delete document
router.delete(
  '/:id/documents/:docId',
  requirePermission('CLAIMS', 'UPDATE'),
  controller.deleteClaimDocument
);

export default router;
