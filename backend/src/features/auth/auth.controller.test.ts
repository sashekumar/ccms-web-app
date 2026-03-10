import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CsrfService } from '../../core/auth/csrf.service';

// Mock dependencies
jest.mock('./auth.service');
jest.mock('../../core/auth/csrf.service');

describe('AuthController Integration Tests', () => {
  let app: Express;
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // Mock AuthService
    mockAuthService = {
      login: jest.fn(),
      getCurrentUser: jest.fn(),
      refreshToken: jest.fn(),
    } as any;

    (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

    // Mock CsrfService
    (CsrfService.generateToken as jest.Mock) = jest.fn().mockReturnValue('mock-csrf-token');
    (CsrfService.validateToken as jest.Mock) = jest.fn().mockReturnValue(true);

    // Initialize controller and setup routes
    authController = new AuthController();
    app.get('/api/auth/csrf-token', authController.getCsrfToken);
    app.post('/api/auth/login', authController.login);
    app.post('/api/auth/logout', authController.logout);
    app.get('/api/auth/me', (req, res, next) => {
      // Mock authenticated user
      req.user = { userId: 1, username: 'testuser', tokenType: 'access' };
      authController.me(req, res, next);
    });
    app.post('/api/auth/refresh', authController.refresh);
  });

  describe('GET /api/auth/csrf-token', () => {
    it('should generate and return CSRF token', async () => {
      const response = await request(app)
        .get('/api/auth/csrf-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.csrfToken).toBe('mock-csrf-token');
      expect(response.body.message).toBe('CSRF token generated');
      expect(CsrfService.generateToken).toHaveBeenCalled();
    });

    it('should return new token on each request', async () => {
      (CsrfService.generateToken as jest.Mock)
        .mockReturnValueOnce('token-1')
        .mockReturnValueOnce('token-2');

      const response1 = await request(app).get('/api/auth/csrf-token');
      const response2 = await request(app).get('/api/auth/csrf-token');

      expect(response1.body.data.csrfToken).toBe('token-1');
      expect(response2.body.data.csrfToken).toBe('token-2');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginDto = {
      username: 'testuser',
      password: 'password123'
    };

    const mockLoginResult = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        user_id: 1,
        username: 'testuser',
        full_name: 'Test User',
        is_active: true,
        last_login: null,
        roles: [{ role_id: 1, role_name: 'Admin', role_code: 'ADMIN' }]
      }
    };

    beforeEach(() => {
      mockAuthService.login.mockResolvedValue(mockLoginResult);
    });

    it('should login successfully with valid credentials and CSRF token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('x-csrf-token', 'valid-csrf-token')
        .send(validLoginDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockLoginResult.user);
      expect(response.body.message).toBe('Login successful');
      expect(mockAuthService.login).toHaveBeenCalledWith(validLoginDto);
      expect(CsrfService.validateToken).toHaveBeenCalledWith('valid-csrf-token');
    });

    it('should set httpOnly cookies on successful login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('x-csrf-token', 'valid-csrf-token')
        .send(validLoginDto)
        .expect(200);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('accessToken'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('refreshToken'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('HttpOnly'))).toBe(true);
    });

    it('should set correct cookie expiration times', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('x-csrf-token', 'valid-csrf-token')
        .send(validLoginDto);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      const accessCookie = cookies.find((c: string) => c.includes('accessToken'));
      const refreshCookie = cookies.find((c: string) => c.includes('refreshToken'));

      expect(accessCookie).toContain('Max-Age');
      expect(refreshCookie).toContain('Max-Age');
    });

    it('should return 403 when CSRF token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginDto)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired CSRF token');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should return 403 when CSRF token is invalid', async () => {
      (CsrfService.validateToken as jest.Mock).mockReturnValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .set('x-csrf-token', 'invalid-token')
        .send(validLoginDto)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired CSRF token');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should handle login service errors', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      await request(app)
        .post('/api/auth/login')
        .set('x-csrf-token', 'valid-token')
        .send(validLoginDto)
        .expect(500);

      expect(mockAuthService.login).toHaveBeenCalled();
    });

    it('should handle missing username', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Username is required'));

      await request(app)
        .post('/api/auth/login')
        .set('x-csrf-token', 'valid-token')
        .send({ password: 'password123' })
        .expect(500);
    });

    it('should handle missing password', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Password is required'));

      await request(app)
        .post('/api/auth/login')
        .set('x-csrf-token', 'valid-token')
        .send({ username: 'testuser' })
        .expect(500);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toBe('Logout successful');
    });

    it('should clear access and refresh token cookies', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      // clearCookie sets Expires in the past to clear the cookie
      expect(cookies.some((c: string) => c.includes('accessToken'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('refreshToken'))).toBe(true);
    });

    it('should logout even without existing cookies', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    const mockUser = {
      user_id: 1,
      username: 'testuser',
      full_name: 'Test User',
      is_active: true,
      last_login: null,
      roles: [{ role_id: 1, role_name: 'Admin', role_code: 'ADMIN' }]
    };

    it('should return current user info when authenticated', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUser);
      expect(response.body.message).toBe('User retrieved successfully');
      expect(mockAuthService.getCurrentUser).toHaveBeenCalledWith(1);
    });

    it('should return 401 when user is not authenticated', async () => {
      // Create app without authenticated user
      const unauthApp = express();
      unauthApp.use(express.json());
      const unauthController = new AuthController();
      unauthApp.get('/api/auth/me', (req, res, next) => {
        // No req.user set
        unauthController.me(req, res, next);
      });

      const response = await request(unauthApp)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Unauthorized');
      expect(mockAuthService.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('User not found'));

      await request(app)
        .get('/api/auth/me')
        .expect(500);

      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/refresh', () => {
    const mockRefreshResult = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    };

    beforeEach(() => {
      mockAuthService.refreshToken.mockResolvedValue(mockRefreshResult);
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=old-refresh-token'])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
    });

    it('should set new httpOnly cookies on token refresh', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=old-refresh-token'])
        .expect(200);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('accessToken'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('refreshToken'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('HttpOnly'))).toBe(true);
    });

    it('should return 401 when refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Refresh token required');
      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });

    it('should handle invalid refresh token', async () => {
      mockAuthService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

      await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=invalid-token'])
        .expect(500);

      expect(mockAuthService.refreshToken).toHaveBeenCalled();
    });

    it('should handle expired refresh token', async () => {
      mockAuthService.refreshToken.mockRejectedValue(new Error('Refresh token expired'));

      await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=expired-token'])
        .expect(500);

      expect(mockAuthService.refreshToken).toHaveBeenCalled();
    });
  });

  describe('Cookie Security Settings', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should set secure flag in production', async () => {
      process.env.NODE_ENV = 'production';
      mockAuthService.login.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { user_id: 1, username: 'test', full_name: 'Test', is_active: true, last_login: null, roles: [] }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .set('x-csrf-token', 'valid-token')
        .send({ username: 'test', password: 'password' });

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c: string) => c.includes('Secure'))).toBe(true);
    });

    it('should set SameSite=strict for all cookies', async () => {
      mockAuthService.login.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { user_id: 1, username: 'test', full_name: 'Test', is_active: true, last_login: null, roles: [] }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .set('x-csrf-token', 'valid-token')
        .send({ username: 'test', password: 'password' });

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies.every((c: string) => c.includes('SameSite=Strict'))).toBe(true);
    });
  });
});
