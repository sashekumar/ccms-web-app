import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../core/utils/response.util';

// Mock ResponseUtil first
jest.mock('../core/utils/response.util');

// Mock PermissionsService
const mockCheckPermission = jest.fn();
jest.mock('../features/permissions/permissions.service', () => {
  return {
    PermissionsService: jest.fn().mockImplementation(() => {
      return {
        checkPermission: mockCheckPermission
      };
    })
  };
});

// Now import middleware after mocks are set up
import {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions
} from './permission.middleware';

describe('Permission Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

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
    (ResponseUtil.unauthorized as jest.Mock).mockImplementation((res, message) => {
      res.status?.(401).json({ error: message });
    });
    (ResponseUtil.forbidden as jest.Mock).mockImplementation((res, message) => {
      res.status?.(403).json({ error: message });
    });
    (ResponseUtil.error as jest.Mock).mockImplementation((res, message, code) => {
      res.status?.(code).json({ error: message });
    });
  });

  describe('requirePermission', () => {
    const middleware = requirePermission('USER_MANAGEMENT', 'VIEW');

    it('should allow access when user has permission', async () => {
      (mockRequest as any).user = {
        userId: 1,
        username: 'testuser',
        roles: [2] // Not super admin
      };

      mockCheckPermission.mockResolvedValue({
        has_permission: true
      });

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockCheckPermission).toHaveBeenCalledWith(
        1,
        'USER_MANAGEMENT',
        'VIEW'
      );
      expect(mockNext).toHaveBeenCalled();
      expect(ResponseUtil.forbidden).not.toHaveBeenCalled();
    });

    it('should deny access when user lacks permission', async () => {
      (mockRequest as any).user = {
        userId: 1,
        username: 'testuser',
        roles: [2]
      };

      mockCheckPermission.mockResolvedValue({
        has_permission: false
      });

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseUtil.forbidden).toHaveBeenCalledWith(
        mockResponse,
        'Access denied. Required permission: USER_MANAGEMENT.VIEW'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should bypass check for Super Admin (role_id = 1)', async () => {
      (mockRequest as any).user = {
        userId: 1,
        username: 'admin',
        roles: [1] // Super Admin
      };

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockCheckPermission).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      // No user property

      await middleware(
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

    it('should return 401 when userId is missing', async () => {
      (mockRequest as any).user = {
        username: 'testuser'
        // Missing userId
      };

      await middleware(
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

    it('should handle service errors gracefully', async () => {
      (mockRequest as any).user = {
        userId: 1,
        username: 'testuser',
        roles: [2]
      };

      const serviceError = new Error('Service error');
      mockCheckPermission.mockRejectedValue(serviceError);

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error checking permissions',
        500,
        'Service error'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAnyPermission', () => {
    const permissions: [string, string][] = [
      ['USER_MANAGEMENT', 'VIEW'],
      ['USER_MANAGEMENT', 'CREATE']
    ];
    const middleware = requireAnyPermission(permissions);

    it('should allow access when user has any of the permissions', async () => {
      (mockRequest as any).user = {
        userId: 1,
        username: 'testuser',
        roles: [2]
      };

      mockCheckPermission
        .mockResolvedValueOnce({ has_permission: false })
        .mockResolvedValueOnce({ has_permission: true });

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(ResponseUtil.forbidden).not.toHaveBeenCalled();
    });

    it('should deny access when user has none of the permissions', async () => {
      (mockRequest as any).user = {
        userId: 1,
        username: 'testuser',
        roles: [2]
      };

      mockCheckPermission.mockResolvedValue({
        has_permission: false
      });

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseUtil.forbidden).toHaveBeenCalledWith(
        mockResponse,
        'Access denied. Required permissions: USER_MANAGEMENT.VIEW OR USER_MANAGEMENT.CREATE'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should bypass check for Super Admin', async () => {
      (mockRequest as any).user = {
        userId: 1,
        username: 'admin',
        roles: [1]
      };

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockCheckPermission).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should stop checking after finding first valid permission', async () => {
      (mockRequest as any).user = {
        userId: 1,
        username: 'testuser',
        roles: [2]
      };

      mockCheckPermission.mockResolvedValue({
        has_permission: true
      });

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should only check once and stop
      expect(mockCheckPermission).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAllPermissions', () => {
    const permissions: [string, string][] = [
      ['USER_MANAGEMENT', 'VIEW'],
      ['USER_MANAGEMENT', 'CREATE']
    ];
    const middleware = requireAllPermissions(permissions);

    it('should allow access when user has all permissions', async () => {
      (mockRequest as any).user = {
        userId: 1,
        username: 'testuser',
        roles: [2]
      };

      mockCheckPermission.mockResolvedValue({
        has_permission: true
      });

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockCheckPermission).toHaveBeenCalledTimes(2);
      expect(mockNext).toHaveBeenCalled();
      expect(ResponseUtil.forbidden).not.toHaveBeenCalled();
    });

    it('should deny access when user lacks any permission', async () => {
      (mockRequest as any).user = {
        userId: 1,
        username: 'testuser',
        roles: [2]
      };

      mockCheckPermission
        .mockResolvedValueOnce({ has_permission: true })
        .mockResolvedValueOnce({ has_permission: false });

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseUtil.forbidden).toHaveBeenCalledWith(
        mockResponse,
        'Access denied. Required permissions: USER_MANAGEMENT.VIEW AND USER_MANAGEMENT.CREATE'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should bypass check for Super Admin', async () => {
      (mockRequest as any).user = {
        userId: 1,
        username: 'admin',
        roles: [1]
      };

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockCheckPermission).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should check all permissions before allowing', async () => {
      (mockRequest as any).user = {
        userId: 1,
        username: 'testuser',
        roles: [2]
      };

      mockCheckPermission.mockResolvedValue({
        has_permission: true
      });

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should check all permissions
      expect(mockCheckPermission).toHaveBeenCalledTimes(2);
      expect(mockCheckPermission).toHaveBeenNthCalledWith(
        1,
        1,
        'USER_MANAGEMENT',
        'VIEW'
      );
      expect(mockCheckPermission).toHaveBeenNthCalledWith(
        2,
        1,
        'USER_MANAGEMENT',
        'CREATE'
      );
    });
  });
});
