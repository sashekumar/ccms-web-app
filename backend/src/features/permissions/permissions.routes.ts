import { Router } from 'express';
import { PermissionsController } from './permissions.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new PermissionsController();

// Apply authentication to all routes
router.use(authenticateToken);

// Permission check endpoints
router.get('/check', controller.checkPermission);
router.get('/user', controller.getUserPermissions);
router.get('/user/:userId', requirePermission('USER_MANAGEMENT', 'VIEW'), controller.getUserPermissionsById);

// Role assignment endpoints (requires user management permissions)
router.post('/assign-role', requirePermission('USER_ROLE_ASSIGNMENT', 'ATTACH_ROLE'), controller.assignRole);
router.delete('/detach-role/:userId/:roleId', requirePermission('USER_ROLE_ASSIGNMENT', 'DETACH_ROLE'), controller.detachRole);
router.get('/user/:userId/roles', requirePermission('USER_MANAGEMENT', 'VIEW'), controller.getUserRoles);

// Permission grant/revoke (requires role permission management)
router.post('/grant', requirePermission('ROLE_PERMISSION_MANAGEMENT', 'CREATE'), controller.grantPermission);
router.post('/revoke', requirePermission('ROLE_PERMISSION_MANAGEMENT', 'DELETE'), controller.revokePermission);

// Cache management (requires admin access)
router.post('/clear-cache', requirePermission('ROLE_MANAGEMENT', 'UPDATE'), controller.clearCache);

// Role management endpoints
router.post('/roles/list', controller.getAllRoles);
router.post('/roles/get', controller.getRoleById);
router.post('/roles/permissions', controller.getRolePermissions);
router.post('/roles/permissions-matrix', controller.getRolePermissionsMatrix);
router.post('/roles/create', requirePermission('ROLE_MANAGEMENT', 'CREATE'), controller.createRole);
router.post('/roles/update', requirePermission('ROLE_MANAGEMENT', 'UPDATE'), controller.updateRole);
router.post('/roles/delete', requirePermission('ROLE_MANAGEMENT', 'DELETE'), controller.deleteRole);

// Module and Action endpoints
router.post('/modules/list', controller.getAllModules);
router.post('/modules/create', requirePermission('MODULE_MANAGEMENT', 'CREATE'), controller.createModule);
router.post('/modules/update', requirePermission('MODULE_MANAGEMENT', 'UPDATE'), controller.updateModule);
router.post('/modules/delete', requirePermission('MODULE_MANAGEMENT', 'DELETE'), controller.deleteModule);

router.post('/actions/list', controller.getAllActions);
router.post('/actions/create', requirePermission('ACTION_MANAGEMENT', 'CREATE'), controller.createAction);
router.post('/actions/update', requirePermission('ACTION_MANAGEMENT', 'UPDATE'), controller.updateAction);
router.post('/actions/delete', requirePermission('ACTION_MANAGEMENT', 'DELETE'), controller.deleteAction);

// Module-Action endpoints
router.post('/module-actions/list', controller.getAllModuleActions);
router.post('/module-actions/create', requirePermission('MODULE_ACTION_MANAGEMENT', 'CREATE'), controller.createModuleAction);
router.post('/module-actions/update', requirePermission('MODULE_ACTION_MANAGEMENT', 'UPDATE'), controller.updateModuleAction);
router.post('/module-actions/delete', requirePermission('MODULE_ACTION_MANAGEMENT', 'DELETE'), controller.deleteModuleAction);

// Category management endpoints
router.get('/categories', controller.getAllCategories);
router.get('/categories/:categoryId', controller.getCategoryById);
router.post('/categories', requirePermission('CATEGORY_MANAGEMENT', 'CREATE'), controller.createCategory);
router.put('/categories/:categoryId', requirePermission('CATEGORY_MANAGEMENT', 'UPDATE'), controller.updateCategory);
router.delete('/categories/:categoryId', requirePermission('CATEGORY_MANAGEMENT', 'DELETE'), controller.deleteCategory);

export default router;
