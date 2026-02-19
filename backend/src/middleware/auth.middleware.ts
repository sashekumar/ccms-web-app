import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../core/auth/jwt.service';
import { TokenPayload } from '../features/auth/auth.types';
import { PermissionsRepository } from '../features/permissions/permissions.repository';

const permissionsRepository = new PermissionsRepository();

/**
 * Middleware to authenticate JWT token
 * Extracts token from Authorization header or cookies
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | null = null;

    // Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fallback to cookie
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Verify token
    const payload: TokenPayload = JwtService.verifyToken(token);

    if (payload.tokenType !== 'access') {
      res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
      return;
    }

    // Get user roles for permission checks
    const roles = await permissionsRepository.getUserRoles(payload.userId);

    // Attach user to request
    (req as any).user = {
      userId: payload.userId,
      username: payload.username,
      roles: roles // Array of role IDs for the user
    };

    next();
  } catch (error: any) {
    if (error.message === 'Invalid or expired token') {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for public endpoints that provide additional features for logged-in users
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | null = null;

    // Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fallback to cookie
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      // No token, continue without user
      next();
      return;
    }

    // Verify token
    const payload: TokenPayload = JwtService.verifyToken(token);

    if (payload.tokenType === 'access') {
      // Get user roles
      const roles = await permissionsRepository.getUserRoles(payload.userId);

      // Attach user to request
      (req as any).user = {
        userId: payload.userId,
        username: payload.username,
        roles: roles
      };
    }

    next();
  } catch (error) {
    // Token verification failed, continue without user
    next();
  }
};
