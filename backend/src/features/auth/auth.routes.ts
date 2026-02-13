import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { validateRequest } from '../../core/middleware/validator.middleware';
import { loginSchema } from './auth.validator';

const router = Router();
const authController = new AuthController();

// Public routes
router.get('/csrf-token', authController.getCsrfToken);
router.post('/login', validateRequest(loginSchema), authController.login);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;
