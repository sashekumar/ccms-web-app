import { Router } from 'express';
import authRoutes from '../features/auth/auth.routes';
import permissionsRoutes from '../features/permissions/permissions.routes';
import usersRoutes from '../features/users/users.routes';
import { ResponseUtil } from '../core/utils/response.util';
import banksRoutes from '../features/banks/banks.routes';
import clausesRoutes from '../features/clauses/clauses.routes';
import lookupsRoutes from '../features/lookups/lookups.routes';
import hospitalsRoutes from '../features/hospitals/hospitals.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/users', usersRoutes);

// Master data routes
router.use('/master/banks', banksRoutes);
router.use('/master/clauses', clausesRoutes);
router.use('/master/lookups', lookupsRoutes);

// Hospital management routes
router.use('/hospitals', hospitalsRoutes);

// Health check
router.get('/health', (req, res) => {
  ResponseUtil.success(res, {
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'CCMS API'
  }, 'Service is healthy');
});

export default router;
