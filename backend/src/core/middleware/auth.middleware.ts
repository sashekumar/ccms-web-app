import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../auth/jwt.service';
import { TokenPayload } from '../../features/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authentication middleware - Reads token from httpOnly cookie
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Read access token from httpOnly cookie
    const token = req.cookies.accessToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NO_TOKEN'
      });
      return;
    }

    // Verify token
    const payload = JwtService.verifyToken(token);

    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: 'INVALID_TOKEN'
    });
  }
};
