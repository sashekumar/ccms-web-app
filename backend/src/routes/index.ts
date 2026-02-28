import { Router } from 'express';
import authRoutes from '../features/auth/auth.routes';
import permissionsRoutes from '../features/permissions/permissions.routes';
import usersRoutes from '../features/users/users.routes';
import { ResponseUtil } from '../core/utils/response.util';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/users', usersRoutes);

// Health check
router.get('/health', (req, res) => {
  ResponseUtil.success(res, {
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'CCMS API'
  }, 'Service is healthy');
});

export default router;
