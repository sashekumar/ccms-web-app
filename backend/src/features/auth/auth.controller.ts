import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './auth.types';
import { CsrfService } from '../../core/auth/csrf.service';

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
      
      res.status(200).json({
        success: true,
        message: 'CSRF token generated',
        data: { csrfToken: token }
      });
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
        res.status(403).json({
          success: false,
          message: 'Invalid or expired CSRF token',
          data: null
        });
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

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result.user
      });
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

      res.status(200).json({
        success: true,
        message: 'Logout successful',
        data: null
      });
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
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          data: null
        });
        return;
      }

      const user = await this.authService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };
}
