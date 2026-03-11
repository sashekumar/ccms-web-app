import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth.middleware';
import { JwtService } from '../auth/jwt.service';
import { ResponseUtil } from '../utils/response.util';
import { TokenPayload } from '../../features/auth/auth.types';

// Mock dependencies
jest.mock('../auth/jwt.service');
jest.mock('../utils/response.util');

describe('Core Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockResponseUtil: jest.Mocked<typeof ResponseUtil>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      cookies: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
    mockResponseUtil = ResponseUtil as jest.Mocked<typeof ResponseUtil>;
  });

  describe('authMiddleware', () => {
    it('should authenticate valid token from cookie', () => {
      const mockPayload: TokenPayload = {
        userId: 1,
        username: 'testuser',
        tokenType: 'access'
      };

      mockRequest.cookies = { accessToken: 'valid-token' };
      (JwtService.verifyToken as jest.Mock).mockReturnValue(mockPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(JwtService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponseUtil.error).not.toHaveBeenCalled();
    });

    it('should reject request without token', () => {
      mockRequest.cookies = {};

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Authentication required',
        401,
        'NO_TOKEN'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      mockRequest.cookies = { accessToken: 'invalid-token' };
      (JwtService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid or expired token',
        401,
        'INVALID_TOKEN'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired token', () => {
      mockRequest.cookies = { accessToken: 'expired-token' };
      (JwtService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid or expired token',
        401,
        'INVALID_TOKEN'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed token', () => {
      mockRequest.cookies = { accessToken: 'malformed' };
      (JwtService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Malformed token');
      });

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid or expired token',
        401,
        'INVALID_TOKEN'
      );
    });

    it('should handle token with missing user data', () => {
      const incompletePayload: Partial<TokenPayload> = {
        userId: 1
        // missing username and tokenType
      };

      mockRequest.cookies = { accessToken: 'valid-token' };
      (JwtService.verifyToken as jest.Mock).mockReturnValue(incompletePayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(incompletePayload);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
