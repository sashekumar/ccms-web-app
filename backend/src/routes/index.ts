import { Router } from 'express';
import authRoutes from '../features/auth/auth.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'CCMS API'
  });
});

export default router;
