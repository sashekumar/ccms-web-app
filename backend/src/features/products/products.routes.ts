import { Router } from 'express';
import { ProductsController } from './products.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new ProductsController();

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// PRODUCTS ROUTES (POLICY_MANAGEMENT module)
// ============================================================================

// Product management routes
router.post('/list', requirePermission('POLICY_MANAGEMENT', 'VIEW'), controller.getProducts);
router.post('/get', requirePermission('POLICY_MANAGEMENT', 'VIEW'), controller.getProductById);
router.post('/create', requirePermission('POLICY_MANAGEMENT', 'CREATE'), controller.createProduct);
router.put('/update', requirePermission('POLICY_MANAGEMENT', 'UPDATE'), controller.updateProduct);
router.post('/delete', requirePermission('POLICY_MANAGEMENT', 'DELETE'), controller.deleteProduct);
router.post('/:productId/activate', requirePermission('POLICY_MANAGEMENT', 'ACTIVATE'), controller.activateProduct);
router.post('/:productId/deactivate', requirePermission('POLICY_MANAGEMENT', 'DEACTIVATE'), controller.deactivateProduct);
router.post('/check-code', controller.checkPlanCode);

// ============================================================================
// PRODUCT LIMITS ROUTES
// READ: VIEW_LIMITS, WRITE: MANAGE_LIMITS
// ============================================================================

router.post('/:productId/limits/list', requirePermission('POLICY_MANAGEMENT', 'VIEW_LIMITS'), controller.getLimits);
router.post('/:productId/limits/get', requirePermission('POLICY_MANAGEMENT', 'VIEW_LIMITS'), controller.getLimitById);
router.post('/:productId/limits', requirePermission('POLICY_MANAGEMENT', 'MANAGE_LIMITS'), controller.createLimit);
router.put('/:productId/limits/:limitId', requirePermission('POLICY_MANAGEMENT', 'MANAGE_LIMITS'), controller.updateLimit);
router.delete('/:productId/limits/:limitId', requirePermission('POLICY_MANAGEMENT', 'MANAGE_LIMITS'), controller.deleteLimit);

// ============================================================================
// PRODUCT COPAY ROUTES
// READ: VIEW_COPAY, WRITE: MANAGE_COPAY
// ============================================================================

router.post('/:productId/copay/list', requirePermission('POLICY_MANAGEMENT', 'VIEW_COPAY'), controller.getCopay);
router.post('/:productId/copay/get', requirePermission('POLICY_MANAGEMENT', 'VIEW_COPAY'), controller.getCopayById);
router.post('/:productId/copay', requirePermission('POLICY_MANAGEMENT', 'MANAGE_COPAY'), controller.createCopay);
router.put('/:productId/copay/:copayId', requirePermission('POLICY_MANAGEMENT', 'MANAGE_COPAY'), controller.updateCopay);
router.delete('/:productId/copay/:copayId', requirePermission('POLICY_MANAGEMENT', 'MANAGE_COPAY'), controller.deleteCopay);

export default router;
