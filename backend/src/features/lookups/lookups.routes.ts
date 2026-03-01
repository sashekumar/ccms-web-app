import { Router } from 'express';
import { LookupsController } from './lookups.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new LookupsController();

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// LOOKUP CATEGORIES ROUTES
// ============================================================================

router.post('/categories/list', requirePermission('LOOKUP_MGMT', 'VIEW'), controller.getCategories);
router.post('/categories/get', requirePermission('LOOKUP_MGMT', 'VIEW'), controller.getCategoryById);
router.post('/categories/create', requirePermission('LOOKUP_MGMT', 'CREATE'), controller.createCategory);
router.put('/categories/update', requirePermission('LOOKUP_MGMT', 'UPDATE'), controller.updateCategory);
router.post('/categories/delete', requirePermission('LOOKUP_MGMT', 'DELETE'), controller.deleteCategory);
router.post('/categories/check-code', controller.checkCategoryCode);

// ============================================================================
// LOOKUPS ROUTES
// ============================================================================

router.post('/list', requirePermission('LOOKUP_MGMT', 'VIEW'), controller.getLookups);
router.post('/get', requirePermission('LOOKUP_MGMT', 'VIEW'), controller.getLookupById);
router.post('/by-category', requirePermission('LOOKUP_MGMT', 'VIEW'), controller.getLookupsByCategory);
router.post('/create', requirePermission('LOOKUP_MGMT', 'CREATE'), controller.createLookup);
router.put('/update', requirePermission('LOOKUP_MGMT', 'UPDATE'), controller.updateLookup);
router.post('/delete', requirePermission('LOOKUP_MGMT', 'DELETE'), controller.deleteLookup);
router.post('/check-code', controller.checkLookupCode);

// ============================================================================
// LOOKUP METADATA ROUTES
// ============================================================================

router.post('/metadata/list', requirePermission('LOOKUP_MGMT', 'MANAGE_METADATA'), controller.getMetadata);
router.post('/metadata/get', requirePermission('LOOKUP_MGMT', 'MANAGE_METADATA'), controller.getMetadataById);
router.post('/metadata/create', requirePermission('LOOKUP_MGMT', 'MANAGE_METADATA'), controller.createMetadata);
router.put('/metadata/update', requirePermission('LOOKUP_MGMT', 'MANAGE_METADATA'), controller.updateMetadata);
router.post('/metadata/delete', requirePermission('LOOKUP_MGMT', 'MANAGE_METADATA'), controller.deleteMetadata);
router.post('/metadata/check-key', controller.checkMetadataKey);

export default router;
