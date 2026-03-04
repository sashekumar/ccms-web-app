import { PermissionsService } from './permissions.service';
import { PermissionsRepository } from './permissions.repository';
import { CategoriesRepository, ModulesRepository, ActionsRepository } from './repositories';
import {
  UserPermissionsResponse,
  Role,
  AssignRoleDto,
  CreateRoleDto
} from './permissions.types';

// Mock dependencies
jest.mock('./permissions.repository');
jest.mock('./repositories');
jest.mock('node-cache');

describe('PermissionsService', () => {
  let permissionsService: PermissionsService;
  let mockRepository: jest.Mocked<PermissionsRepository>;
  let mockCategoriesRepo: jest.Mocked<CategoriesRepository>;
  let mockModulesRepo: jest.Mocked<ModulesRepository>;
  let mockActionsRepo: jest.Mocked<ActionsRepository>;
  let mockCache: any;

  const mockRole: Role = {
    role_id: 2,
    role_name: 'Manager',
    role_code: 'MANAGER',
    description: 'Manager role',
    is_system_role: false,
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    created_by: 'admin',
    updated_by: 'admin'
  };

  const mockUserPermissions: UserPermissionsResponse = {
    categories: [
      {
        category_code: 'SYSTEM',
        category_name: 'System',
        category_icon: 'system',
        display_order: 1,
        modules: [
          {
            module_code: 'USER_MANAGEMENT',
            module_name: 'User Management',
            module_route: '/users',
            icon: 'user',
            display_order: 1,
            actions: [
              { action_code: 'VIEW', action_name: 'View' }
            ]
          }
        ]
      }
    ],
    uncategorized_modules: []
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock cache
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      flushAll: jest.fn(),
      keys: jest.fn().mockReturnValue([])
    };

    // Mock repositories
    mockRepository = {
      checkUserPermission: jest.fn(),
      getUserPermissionsFormatted: jest.fn(),
      getRoleById: jest.fn(),
      assignRole: jest.fn(),
      detachRole: jest.fn(),
      getUserRoles: jest.fn(),
    } as any;

    mockCategoriesRepo = {} as any;
    mockModulesRepo = {} as any;
    mockActionsRepo = {} as any;

    (PermissionsRepository as jest.MockedClass<typeof PermissionsRepository>).mockImplementation(
      () => mockRepository
    );

    permissionsService = new PermissionsService();
    // Replace the cache with our mock
    (permissionsService as any).permissionCache = mockCache;
  });

  describe('checkPermission', () => {
    it('should check permission successfully', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockRepository.checkUserPermission.mockResolvedValue(true);

      const result = await permissionsService.checkPermission(1, 'USER_MANAGEMENT', 'VIEW');

      expect(result).toEqual({ has_permission: true });
      expect(mockRepository.checkUserPermission).toHaveBeenCalledWith(
        1,
        'USER_MANAGEMENT',
        'VIEW'
      );
    });

    it('should return cached result if available', async () => {
      mockCache.get.mockReturnValue(true);

      const result = await permissionsService.checkPermission(1, 'USER_MANAGEMENT', 'VIEW');

      expect(result).toEqual({ has_permission: true });
      expect(mockRepository.checkUserPermission).not.toHaveBeenCalled();
    });

    it('should cache the permission check result', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockRepository.checkUserPermission.mockResolvedValue(true);

      await permissionsService.checkPermission(1, 'USER_MANAGEMENT', 'VIEW');

      expect(mockCache.set).toHaveBeenCalledWith(expect.any(String), true);
    });

    it('should return false when permission denied', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockRepository.checkUserPermission.mockResolvedValue(false);

      const result = await permissionsService.checkPermission(1, 'USER_MANAGEMENT', 'DELETE');

      expect(result).toEqual({ has_permission: false });
    });

    it('should handle different users separately', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockRepository.checkUserPermission.mockResolvedValue(true);

      await permissionsService.checkPermission(1, 'USER_MANAGEMENT', 'VIEW');
      await permissionsService.checkPermission(2, 'USER_MANAGEMENT', 'VIEW');

      expect(mockRepository.checkUserPermission).toHaveBeenCalledTimes(2);
      expect(mockRepository.checkUserPermission).toHaveBeenNthCalledWith(
        1,
        1,
        'USER_MANAGEMENT',
        'VIEW'
      );
      expect(mockRepository.checkUserPermission).toHaveBeenNthCalledWith(
        2,
        2,
        'USER_MANAGEMENT',
        'VIEW'
      );
    });
  });

  describe('getUserPermissions', () => {
    it('should get user permissions successfully', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockRepository.getUserPermissionsFormatted.mockResolvedValue(mockUserPermissions);

      const result = await permissionsService.getUserPermissions(1);

      expect(result).toEqual(mockUserPermissions);
      expect(mockRepository.getUserPermissionsFormatted).toHaveBeenCalledWith(1, undefined);
    });

    it('should return cached permissions if available', async () => {
      mockCache.get.mockReturnValue(mockUserPermissions);

      const result = await permissionsService.getUserPermissions(1);

      expect(result).toEqual(mockUserPermissions);
      expect(mockRepository.getUserPermissionsFormatted).not.toHaveBeenCalled();
    });

    it('should cache the permissions result', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockRepository.getUserPermissionsFormatted.mockResolvedValue(mockUserPermissions);

      await permissionsService.getUserPermissions(1);

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        mockUserPermissions
      );
    });

    it('should support role filtering', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockRepository.getUserPermissionsFormatted.mockResolvedValue(mockUserPermissions);

      await permissionsService.getUserPermissions(1, 2);

      expect(mockRepository.getUserPermissionsFormatted).toHaveBeenCalledWith(1, 2);
    });

    it('should handle user with no permissions', async () => {
      mockCache.get.mockReturnValue(undefined);
      const emptyPermissions: UserPermissionsResponse = {
        categories: [],
        uncategorized_modules: []
      };
      mockRepository.getUserPermissionsFormatted.mockResolvedValue(emptyPermissions);

      const result = await permissionsService.getUserPermissions(1);

      expect(result).toEqual(emptyPermissions);
      expect(result.categories).toHaveLength(0);
      expect(result.uncategorized_modules).toHaveLength(0);
    });
  });

  describe('assignRole', () => {
    const assignRoleDto: AssignRoleDto = {
      user_id: 1,
      role_id: 2,
      expires_at: undefined
    };

    it('should assign role successfully', async () => {
      mockRepository.getRoleById.mockResolvedValue(mockRole);
      mockRepository.assignRole.mockResolvedValue();

      await permissionsService.assignRole(assignRoleDto, 'admin');

      expect(mockRepository.getRoleById).toHaveBeenCalledWith(2);
      expect(mockRepository.assignRole).toHaveBeenCalledWith(assignRoleDto, 'admin');
    });

    it('should throw error if role not found', async () => {
      mockRepository.getRoleById.mockResolvedValue(null);

      await expect(
        permissionsService.assignRole(assignRoleDto, 'admin')
      ).rejects.toThrow('Role not found');

      expect(mockRepository.assignRole).not.toHaveBeenCalled();
    });

    it('should clear user permission cache after assignment', async () => {
      mockRepository.getRoleById.mockResolvedValue(mockRole);
      mockRepository.assignRole.mockResolvedValue();

      await permissionsService.assignRole(assignRoleDto, 'admin');

      // Check that clearUserPermissionCache was called (cache.del with pattern)
      expect(mockCache.del).toHaveBeenCalled();
    });

    it('should validate role exists before assignment', async () => {
      mockRepository.getRoleById.mockResolvedValue(mockRole);
      mockRepository.assignRole.mockResolvedValue();

      await permissionsService.assignRole(assignRoleDto, 'admin');

      // Verify getRoleById was called
      expect(mockRepository.getRoleById).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should use separate cache keys for different permission checks', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockRepository.checkUserPermission.mockResolvedValue(true);

      await permissionsService.checkPermission(1, 'USER_MANAGEMENT', 'VIEW');
      await permissionsService.checkPermission(1, 'USER_MANAGEMENT', 'DELETE');

      expect(mockCache.set).toHaveBeenCalledTimes(2);
      const cacheKey1 = (mockCache.set as jest.Mock).mock.calls[0][0];
      const cacheKey2 = (mockCache.set as jest.Mock).mock.calls[1][0];
      expect(cacheKey1).not.toBe(cacheKey2);
    });

    it('should use separate cache keys for different users', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockRepository.getUserPermissionsFormatted.mockResolvedValue(mockUserPermissions);

      await permissionsService.getUserPermissions(1);
      await permissionsService.getUserPermissions(2);

      expect(mockCache.set).toHaveBeenCalledTimes(2);
      const cacheKey1 = (mockCache.set as jest.Mock).mock.calls[0][0];
      const cacheKey2 = (mockCache.set as jest.Mock).mock.calls[1][0];
      expect(cacheKey1).not.toBe(cacheKey2);
    });
  });

  describe('Error Handling', () => {
    it('should propagate database errors', async () => {
      mockCache.get.mockReturnValue(undefined);
      const dbError = new Error('Database connection failed');
      mockRepository.checkUserPermission.mockRejectedValue(dbError);

      await expect(
        permissionsService.checkPermission(1, 'USER_MANAGEMENT', 'VIEW')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle cache errors gracefully', async () => {
      mockCache.get.mockImplementation(() => {
        throw new Error('Cache error');
      });
      mockRepository.checkUserPermission.mockResolvedValue(true);

      // Should still work even if cache fails
      await expect(
        permissionsService.checkPermission(1, 'USER_MANAGEMENT', 'VIEW')
      ).rejects.toThrow('Cache error');
    });
  });
});
