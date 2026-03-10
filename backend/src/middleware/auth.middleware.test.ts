import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../core/auth/jwt.service';
import { ResponseUtil } from '../core/utils/response.util';

// Mock dependencies before importing middleware
jest.mock('../core/auth/jwt.service');
jest.mock('../core/utils/response.util');

// Mock PermissionsRepository
const mockGetUserRoles = jest.fn();
jest.mock('../features/permissions/permissions.repository', () => {
  return {
    PermissionsRepository: jest.fn().mockImplementation(() => {
      return {
        getUserRoles: mockGetUserRoles
      };
    })
  };
});

// Now import middleware after mocks are set up
import { authenticateToken, optionalAuth } from './auth.middleware';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const validToken = 'valid.jwt.token';
  const mockTokenPayload = {
    userId: 1,
    username: 'testuser',
    tokenType: 'access' as const,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900
  };

  const mockRoles = [1, 2]; // role IDs

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
      cookies: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Setup default mocks
    mockGetUserRoles.mockResolvedValue(mockRoles);
    (JwtService.verifyToken as jest.Mock).mockReturnValue(mockTokenPayload);
    (ResponseUtil.unauthorized as jest.Mock).mockImplementation((res, message) => {
      res.status?.(401).json({ error: message });
    });
    (ResponseUtil.error as jest.Mock).mockImplementation((res, message, code) => {
      res.status?.(code).json({ error: message });
    });
  });

  describe('authenticateToken', () => {
    it('should authenticate with valid token in Authorization header', async () => {
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(JwtService.verifyToken).toHaveBeenCalledWith(validToken);
      expect((mockRequest as any).user).toEqual({
        userId: 1,
        username: 'testuser',
        roles: mockRoles
      });
      expect(mockNext).toHaveBeenCalled();
      expect(ResponseUtil.unauthorized).not.toHaveBeenCalled();
    });

    it('should authenticate with valid token in cookies', async () => {
      mockRequest.cookies = {
        accessToken: validToken
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(JwtService.verifyToken).toHaveBeenCalledWith(validToken);
      expect((mockRequest as any).user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should prioritize Authorization header over cookies', async () => {
      const headerToken = 'header.token';
      const cookieToken = 'cookie.token';

      mockRequest.headers = {
        authorization: `Bearer ${headerToken}`
      };
      mockRequest.cookies = {
        accessToken: cookieToken
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(JwtService.verifyToken).toHaveBeenCalledWith(headerToken);
      expect(JwtService.verifyToken).not.toHaveBeenCalledWith(cookieToken);
    });

    it('should return 401 when no token provided', async () => {
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseUtil.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        'Authentication required'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      mockRequest.headers = {
        authorization: `Bearer invalid.token`
      };

      (JwtService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid or expired token');
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseUtil.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        'Invalid or expired token'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for refresh token type', async () => {
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      const refreshPayload = { ...mockTokenPayload, tokenType: 'refresh' as const };
      (JwtService.verifyToken as jest.Mock).mockReturnValue(refreshPayload);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseUtil.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        'Invalid token type'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed Authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123'
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseUtil.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        'Authentication required'
      );
    });

    it('should fetch and attach user roles', async () => {
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect((mockRequest as any).user.roles).toEqual(mockRoles);
    });

    it('should handle database error when fetching roles', async () => {
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      const dbError = new Error('Database error');
      mockGetUserRoles.mockRejectedValue(dbError);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Authentication error',
        500,
        'Database error'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should attach user if valid token provided', async () => {
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(JwtService.verifyToken).toHaveBeenCalledWith(validToken);
      expect((mockRequest as any).user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user if no token provided', async () => {
      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(JwtService.verifyToken).not.toHaveBeenCalled();
      expect((mockRequest as any).user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user if token is invalid', async () => {
      mockRequest.headers = {
        authorization: `Bearer invalid.token`
      };

      (JwtService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect((mockRequest as any).user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(ResponseUtil.unauthorized).not.toHaveBeenCalled();
    });

    it('should work with cookie-based token', async () => {
      mockRequest.cookies = {
        accessToken: validToken
      };

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(JwtService.verifyToken).toHaveBeenCalledWith(validToken);
      expect((mockRequest as any).user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
