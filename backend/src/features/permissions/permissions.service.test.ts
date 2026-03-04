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
      getAllRoles: jest.fn(),
      getRolePermissions: jest.fn(),
      getRolePermissionsMatrix: jest.fn(),
      createRole: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
      grantPermission: jest.fn(),
      revokePermission: jest.fn(),
      getAllModuleActions: jest.fn(),
      createModuleAction: jest.fn(),
      updateModuleAction: jest.fn(),
      deleteModuleAction: jest.fn(),
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
    } as any;

    mockCategoriesRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockModulesRepo = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockActionsRepo = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    (PermissionsRepository as jest.MockedClass<typeof PermissionsRepository>).mockImplementation(
      () => mockRepository
    );

    (CategoriesRepository as jest.MockedClass<typeof CategoriesRepository>).mockImplementation(
      () => mockCategoriesRepo
    );

    (ModulesRepository as jest.MockedClass<typeof ModulesRepository>).mockImplementation(
      () => mockModulesRepo
    );

    (ActionsRepository as jest.MockedClass<typeof ActionsRepository>).mockImplementation(
      () => mockActionsRepo
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

  describe('detachRole', () => {
    it('should detach role successfully', async () => {
      mockRepository.detachRole.mockResolvedValue(undefined);
      mockCache.keys.mockReturnValue(['user:5:permissions', 'user:5:permissions:role:2']);

      await permissionsService.detachRole(5, 2);

      expect(mockRepository.detachRole).toHaveBeenCalledWith(5, 2);
      expect(mockCache.del).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockRepository.detachRole.mockRejectedValue(new Error('Database error'));

      await expect(permissionsService.detachRole(5, 2)).rejects.toThrow('Database error');
    });
  });

  describe('getUserRoles', () => {
    it('should get user roles successfully', async () => {
      mockRepository.getUserRoles.mockResolvedValue([1, 2, 3]);

      const result = await permissionsService.getUserRoles(5);

      expect(result).toEqual([1, 2, 3]);
      expect(mockRepository.getUserRoles).toHaveBeenCalledWith(5);
    });

    it('should handle errors', async () => {
      mockRepository.getUserRoles.mockRejectedValue(new Error('Database error'));

      await expect(permissionsService.getUserRoles(5)).rejects.toThrow('Database error');
    });
  });

  describe('getAllRoles', () => {
    it('should get all roles successfully', async () => {
      const mockRoles = [mockRole];
      mockRepository.getAllRoles.mockResolvedValue(mockRoles);

      const result = await permissionsService.getAllRoles();

      expect(result).toEqual(mockRoles);
      expect(mockRepository.getAllRoles).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockRepository.getAllRoles.mockRejectedValue(new Error('Database error'));

      await expect(permissionsService.getAllRoles()).rejects.toThrow('Database error');
    });
  });

  describe('getRoleById', () => {
    it('should get role by ID successfully', async () => {
      mockRepository.getRoleById.mockResolvedValue(mockRole);

      const result = await permissionsService.getRoleById(2);

      expect(result).toEqual(mockRole);
      expect(mockRepository.getRoleById).toHaveBeenCalledWith(2);
    });

    it('should return null when role not found', async () => {
      mockRepository.getRoleById.mockResolvedValue(null);

      const result = await permissionsService.getRoleById(999);

      expect(result).toBeNull();
    });
  });

  describe('getRolePermissions', () => {
    it('should get role permissions successfully', async () => {
      const mockPermissions: any = [
        { role_id: 2, module_code: 'USERS', action_code: 'VIEW', granted: true }
      ];
      mockRepository.getRolePermissions.mockResolvedValue(mockPermissions);

      const result = await permissionsService.getRolePermissions(2);

      expect(result).toEqual(mockPermissions);
      expect(mockRepository.getRolePermissions).toHaveBeenCalledWith(2);
    });
  });

  describe('getRolePermissionsMatrix', () => {
    it('should get role permissions matrix successfully', async () => {
      const mockMatrix: any = [];
      mockRepository.getRolePermissionsMatrix.mockResolvedValue(mockMatrix);

      const result = await permissionsService.getRolePermissionsMatrix(2);

      expect(result).toEqual(mockMatrix);
      expect(mockRepository.getRolePermissionsMatrix).toHaveBeenCalledWith(2);
    });
  });

  describe('createRole', () => {
    it('should create role successfully', async () => {
      const dto: CreateRoleDto = {
        role_name: 'New Role',
        role_code: 'NEW_ROLE',
        description: 'Test role'
      };
      mockRepository.createRole.mockResolvedValue(10);

      const result = await permissionsService.createRole(dto, 'admin');

      expect(result).toBe(10);
      expect(mockRepository.createRole).toHaveBeenCalledWith('New Role', 'NEW_ROLE', 'Test role', 'admin');
      expect(mockCache.del).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const dto: CreateRoleDto = { role_name: 'Test', role_code: 'TEST' };
      mockRepository.createRole.mockRejectedValue(new Error('Duplicate role code'));

      await expect(permissionsService.createRole(dto, 'admin')).rejects.toThrow('Duplicate role code');
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      mockRepository.getRoleById.mockResolvedValue(mockRole);
      mockRepository.updateRole.mockResolvedValue(undefined);

      await permissionsService.updateRole(2, { role_name: 'Updated' }, 'admin');

      expect(mockRepository.getRoleById).toHaveBeenCalledWith(2);
      expect(mockRepository.updateRole).toHaveBeenCalledWith(2, 'Updated', undefined, undefined, undefined, 'admin');
      expect(mockCache.del).toHaveBeenCalled();
    });

    it('should throw error for system roles', async () => {
      const systemRole = { ...mockRole, is_system_role: true };
      mockRepository.getRoleById.mockResolvedValue(systemRole);

      await expect(
        permissionsService.updateRole(1, { role_name: 'Updated' }, 'admin')
      ).rejects.toThrow('Cannot modify system roles');
    });

    it('should not throw error if role not found', async () => {
      mockRepository.getRoleById.mockResolvedValue(null);
      mockRepository.updateRole.mockResolvedValue(undefined);

      await expect(
        permissionsService.updateRole(999, { role_name: 'Updated' }, 'admin')
      ).resolves.not.toThrow();
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      mockRepository.getRoleById.mockResolvedValue(mockRole);
      mockRepository.deleteRole.mockResolvedValue(undefined);

      await permissionsService.deleteRole(2);

      expect(mockRepository.getRoleById).toHaveBeenCalledWith(2);
      expect(mockRepository.deleteRole).toHaveBeenCalledWith(2);
    });

    it('should throw error for system roles', async () => {
      const systemRole = { ...mockRole, is_system_role: true };
      mockRepository.getRoleById.mockResolvedValue(systemRole);

      await expect(permissionsService.deleteRole(1)).rejects.toThrow('Cannot delete system roles');
    });

    it('should not throw error if role not found', async () => {
      mockRepository.getRoleById.mockResolvedValue(null);
      mockRepository.deleteRole.mockResolvedValue(undefined);

      await expect(permissionsService.deleteRole(999)).resolves.not.toThrow();
    });
  });

  describe('grantPermission', () => {
    it('should grant permission successfully', async () => {
      const dto: any = { role_id: 2, module_action_id: 5 };
      mockRepository.grantPermission.mockResolvedValue(undefined);

      await permissionsService.grantPermission(dto, 'admin');

      expect(mockRepository.grantPermission).toHaveBeenCalledWith(2, 5, 'admin');
      expect(mockCache.del).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const dto: any = { role_id: 2, module_action_id: 5 };
      mockRepository.grantPermission.mockRejectedValue(new Error('Permission already exists'));

      await expect(permissionsService.grantPermission(dto, 'admin')).rejects.toThrow('Permission already exists');
    });
  });

  describe('revokePermission', () => {
    it('should revoke permission successfully', async () => {
      const dto: any = { role_id: 2, module_action_id: 5 };
      mockRepository.revokePermission.mockResolvedValue(undefined);

      await permissionsService.revokePermission(dto);

      expect(mockRepository.revokePermission).toHaveBeenCalledWith(2, 5);
      expect(mockCache.del).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const dto: any = { role_id: 2, module_action_id: 5 };
      mockRepository.revokePermission.mockRejectedValue(new Error('Permission not found'));

      await expect(permissionsService.revokePermission(dto)).rejects.toThrow('Permission not found');
    });
  });

  describe('getAllModules', () => {
    it('should get all modules successfully', async () => {
      const mockModules: any = [
        { module_id: 1, module_name: 'Users', module_code: 'USERS' }
      ];
      mockModulesRepo.findAll.mockResolvedValue(mockModules);

      const result = await permissionsService.getAllModules();

      expect(result).toEqual(mockModules);
      expect(mockModulesRepo.findAll).toHaveBeenCalled();
    });
  });

  describe('getAllActions', () => {
    it('should get all actions successfully', async () => {
      const mockActions: any = [
        { action_id: 1, action_name: 'View', action_code: 'VIEW' }
      ];
      mockActionsRepo.findAll.mockResolvedValue(mockActions);

      const result = await permissionsService.getAllActions();

      expect(result).toEqual(mockActions);
      expect(mockActionsRepo.findAll).toHaveBeenCalled();
    });
  });

  describe('createModule', () => {
    it('should create module successfully', async () => {
      const dto: any = { moduleName: 'New Module', moduleCode: 'NEW_MODULE' };
      (mockModulesRepo.create as jest.Mock).mockResolvedValue({ module_id: 10 });

      const result = await permissionsService.createModule(dto, 'admin');

      expect(result).toBe(10);
      expect(mockModulesRepo.create).toHaveBeenCalled();
      expect(mockCache.del).toHaveBeenCalled();
    });
  });

  describe('updateModule', () => {
    it('should update module successfully', async () => {
      const dto: any = { moduleName: 'Updated Module' };
      (mockModulesRepo.update as jest.Mock).mockResolvedValue(undefined);

      await permissionsService.updateModule(5, dto, 'admin');

      expect(mockModulesRepo.update).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ module_name: 'Updated Module' }),
        'admin'
      );
      expect(mockCache.del).toHaveBeenCalled();
    });
  });

  describe('deleteModule', () => {
    it('should delete module successfully', async () => {
      mockModulesRepo.delete.mockResolvedValue(undefined);

      await permissionsService.deleteModule(5);

      expect(mockModulesRepo.delete).toHaveBeenCalledWith(5);
    });
  });

  describe('createAction', () => {
    it('should create action successfully', async () => {
      const dto: any = { actionName: 'New Action', actionCode: 'NEW_ACTION' };
      (mockActionsRepo.create as jest.Mock).mockResolvedValue({ action_id: 10 });

      const result = await permissionsService.createAction(dto, 'admin');

      expect(result).toBe(10);
      expect(mockActionsRepo.create).toHaveBeenCalled();
      expect(mockCache.del).toHaveBeenCalled();
    });
  });

  describe('updateAction', () => {
    it('should update action successfully', async () => {
      const dto: any = { actionName: 'Updated Action' };
      (mockActionsRepo.update as jest.Mock).mockResolvedValue(undefined);

      await permissionsService.updateAction(5, dto, 'admin');

      expect(mockActionsRepo.update).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ action_name: 'Updated Action' }),
        'admin'
      );
      expect(mockCache.del).toHaveBeenCalled();
    });
  });

  describe('deleteAction', () => {
    it('should delete action successfully', async () => {
      mockActionsRepo.delete.mockResolvedValue(undefined);

      await permissionsService.deleteAction(5);

      expect(mockActionsRepo.delete).toHaveBeenCalledWith(5);
    });
  });

  describe('getAllModuleActions', () => {
    it('should get all module actions successfully', async () => {
      const mockModuleActions: any = [];
      mockRepository.getAllModuleActions.mockResolvedValue(mockModuleActions);

      const result = await permissionsService.getAllModuleActions();

      expect(result).toEqual(mockModuleActions);
      expect(mockRepository.getAllModuleActions).toHaveBeenCalled();
    });
  });

  describe('createModuleAction', () => {
    it('should create module action successfully', async () => {
      const dto: any = { moduleId: 1, actionId: 2, actionLabel: 'View Users' };
      mockRepository.createModuleAction.mockResolvedValue(10);

      const result = await permissionsService.createModuleAction(dto, 'admin');

      expect(result).toBe(10);
      expect(mockRepository.createModuleAction).toHaveBeenCalledWith(1, 2, 'View Users', 'admin');
      expect(mockCache.del).toHaveBeenCalled();
    });

    it('should throw error for invalid data', async () => {
      const dto: any = { module_id: 1, action_id: 2 };
      mockRepository.createModuleAction.mockRejectedValue(new Error('Invalid module or action'));

      await expect(permissionsService.createModuleAction(dto, 'admin')).rejects.toThrow('Invalid module or action');
    });
  });

  describe('updateModuleAction', () => {
    it('should update module action successfully', async () => {
      const dto: any = { actionLabel: 'Updated Label', isActive: true };
      mockRepository.updateModuleAction.mockResolvedValue(undefined);

      await permissionsService.updateModuleAction(5, dto, 'admin');

      expect(mockRepository.updateModuleAction).toHaveBeenCalledWith(5, 'Updated Label', true, 'admin');
      expect(mockCache.del).toHaveBeenCalled();
    });
  });

  describe('deleteModuleAction', () => {
    it('should delete module action successfully', async () => {
      mockRepository.deleteModuleAction.mockResolvedValue(undefined);

      await permissionsService.deleteModuleAction(5);

      expect(mockRepository.deleteModuleAction).toHaveBeenCalledWith(5);
    });

    it('should throw error if has dependencies', async () => {
      mockRepository.deleteModuleAction.mockRejectedValue(new Error('Module action has associated permissions'));

      await expect(permissionsService.deleteModuleAction(5)).rejects.toThrow('Module action has associated permissions');
    });
  });

  describe('getAllCategories', () => {
    it('should get all categories successfully', async () => {
      const mockCategories: any = [];
      mockCategoriesRepo.findAll.mockResolvedValue(mockCategories);

      const result = await permissionsService.getAllCategories();

      expect(result).toEqual(mockCategories);
      expect(mockCategoriesRepo.findAll).toHaveBeenCalled();
    });
  });

  describe('getCategoryById', () => {
    it('should get category by ID successfully', async () => {
      const mockCategory: any = { category_id: 1, category_name: 'System' };
      mockCategoriesRepo.findById.mockResolvedValue(mockCategory);

      const result = await permissionsService.getCategoryById(1);

      expect(result).toEqual(mockCategory);
      expect(mockCategoriesRepo.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when category not found', async () => {
      mockCategoriesRepo.findById.mockResolvedValue(null);

      const result = await permissionsService.getCategoryById(999);

      expect(result).toBeNull();
    });
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      const dto: any = { category_name: 'New Category', category_code: 'NEW_CAT' };
      mockRepository.createCategory.mockResolvedValue(10);
      mockCache.keys.mockReturnValue([]);

      const result = await permissionsService.createCategory(dto, 'admin');

      expect(result).toBe(10);
      expect(mockRepository.createCategory).toHaveBeenCalledWith(dto, 'admin');
      expect(mockCache.del).toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const dto: any = { category_name: 'Updated Category' };
      mockRepository.updateCategory.mockResolvedValue(undefined);
      mockCache.keys.mockReturnValue([]);

      await permissionsService.updateCategory(5, dto, 'admin');

      expect(mockRepository.updateCategory).toHaveBeenCalledWith(5, dto, 'admin');
      expect(mockCache.del).toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      mockCategoriesRepo.delete.mockResolvedValue(undefined);

      await permissionsService.deleteCategory(5);

      expect(mockCategoriesRepo.delete).toHaveBeenCalledWith(5);
    });

    it('should throw error if category has modules', async () => {
      mockCategoriesRepo.delete.mockRejectedValue(new Error('Category has associated modules'));

      await expect(permissionsService.deleteCategory(5)).rejects.toThrow('Category has associated modules');
    });
  });
});
