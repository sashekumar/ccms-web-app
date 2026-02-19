import { Router } from 'express';
import authRoutes from '../features/auth/auth.routes';
import permissionsRoutes from '../features/permissions/permissions.routes';
import usersRoutes from '../features/users/users.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/users', usersRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'CCMS API'
  });
});

export default router;
