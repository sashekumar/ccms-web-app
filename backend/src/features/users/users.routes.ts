import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new UsersController();

// Apply authentication to all routes
router.use(authenticateToken);

// User management routes (require USER_MANAGEMENT permissions)
router.post('/list', requirePermission('USER_MANAGEMENT', 'VIEW'), controller.getUsers);
router.post('/check-username', controller.checkUsername);
router.get('/:userId', requirePermission('USER_MANAGEMENT', 'VIEW'), controller.getUserById);
router.post('/', requirePermission('USER_MANAGEMENT', 'CREATE'), controller.createUser);
router.put('/:userId', requirePermission('USER_MANAGEMENT', 'UPDATE'), controller.updateUser);
router.delete('/:userId', requirePermission('USER_MANAGEMENT', 'DELETE'), controller.deleteUser);

export default router;
