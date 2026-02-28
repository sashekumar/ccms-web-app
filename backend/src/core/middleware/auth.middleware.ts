import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../auth/jwt.service';
import { TokenPayload } from '../../features/auth/auth.types';
import { ResponseUtil } from '../utils/response.util';

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
      ResponseUtil.error(res, 'Authentication required', 401, 'NO_TOKEN');
      return;
    }

    // Verify token
    const payload = JwtService.verifyToken(token);

    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    ResponseUtil.error(res, 'Invalid or expired token', 401, 'INVALID_TOKEN');
  }
};
