import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './auth.types';
import { CsrfService } from '../../core/auth/csrf.service';
import { ResponseUtil } from '../../core/utils/response.util';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * GET /api/auth/csrf-token
   * Generate CSRF token for login
   */
  public getCsrfToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = CsrfService.generateToken();
      
      ResponseUtil.success(res, { csrfToken: token }, 'CSRF token generated');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/login
   * Login - Sets httpOnly cookies
   */
  public login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const loginDto: LoginDto = req.body;
      const csrfToken = req.headers['x-csrf-token'] as string;

      // Validate CSRF token
      if (!csrfToken || !CsrfService.validateToken(csrfToken)) {
        ResponseUtil.forbidden(res, 'Invalid or expired CSRF token');
        return;
      }

      const result = await this.authService.login(loginDto);

      // Set httpOnly cookies
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      ResponseUtil.success(res, result.user, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/logout
   * Logout - Clear cookies
   */
  public logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      ResponseUtil.success(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/auth/me
   * Get current user info
   */
  public me = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ResponseUtil.unauthorized(res, 'Unauthorized');
        return;
      }

      const user = await this.authService.getCurrentUser(userId);

      ResponseUtil.success(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  public refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        ResponseUtil.unauthorized(res, 'Refresh token required');
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      // Set new httpOnly cookies
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      ResponseUtil.success(res, null, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };
}
