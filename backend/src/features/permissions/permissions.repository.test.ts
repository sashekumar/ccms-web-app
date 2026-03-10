import { PermissionsRepository } from './permissions.repository';
import sql from 'mssql';

// Mock mssql
jest.mock('mssql');

// Mock connection manager
jest.mock('../../core/database/connection-manager', () => ({
  connectionManager: {
    getPool: jest.fn()
  }
}));

import { connectionManager } from '../../core/database/connection-manager';

describe('PermissionsRepository', () => {
  let repository: PermissionsRepository;
  let mockRequest: any;
  let mockPool: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
      execute: jest.fn(),
    };

    // Mock pool
    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest)
    };

    // Setup connection manager mock
    (connectionManager.getPool as jest.Mock).mockResolvedValue(mockPool);

    repository = new PermissionsRepository();
  });

  describe('checkUserPermission', () => {
    it('should return true when user has permission', async () => {
      mockRequest.execute.mockResolvedValue({
        recordset: [{ /* result from stored procedure */ }]
      });

      const result = await repository.checkUserPermission(1, 'USERS', 'VIEW');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledTimes(3);
      expect(mockRequest.execute).toHaveBeenCalled();
    });

    it('should return false when user does not have permission', async () => {
      mockRequest.execute.mockResolvedValue({
        recordset: []
      });

      const result = await repository.checkUserPermission(1, 'USERS', 'DELETE');

      expect(result).toBe(false);
    });

    it('should return false when no permission record found', async () => {
      mockRequest.execute.mockResolvedValue({
        recordset: []
      });

      const result = await repository.checkUserPermission(1, 'USERS', 'VIEW');

      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions without role filter', async () => {
      const mockPermissions = [
        { module_code: 'USERS', action_code: 'VIEW' },
        { module_code: 'USERS', action_code: 'EDIT' }
      ];
      mockRequest.query.mockResolvedValue({
        recordset: mockPermissions
      });

      const result = await repository.getUserPermissions(1);

      expect(result).toEqual(mockPermissions);
      expect(mockRequest.input).toHaveBeenCalledWith('userId', expect.anything(), 1);
    });

    it('should return user permissions with role filter', async () => {
      const mockPermissions = [
        { module_code: 'USERS', action_code: 'VIEW' }
      ];
      mockRequest.query.mockResolvedValue({
        recordset: mockPermissions
      });

      const result = await repository.getUserPermissions(1, 2);

      expect(result).toEqual(mockPermissions);
      expect(mockRequest.input).toHaveBeenCalledWith('userId', expect.anything(), 1);
      expect(mockRequest.input).toHaveBeenCalledWith('roleId', expect.anything(), 2);
    });
  });

  describe('getUserPermissionsFormatted', () => {
    it('should return formatted user permissions grouped by category', async () => {
      const mockPermissions = [
        {
          category_code: 'SYSTEM',
          category_name: 'System',
          category_icon: 'system',
          category_display_order: 1,
          module_code: 'USERS',
          module_name: 'Users',
          module_route: '/users',
          module_icon: 'user',
          module_display_order: 1,
          action_code: 'VIEW',
          action_name: 'View'
        }
      ];
      mockRequest.query.mockResolvedValue({
        recordset: mockPermissions
      });

      const result = await repository.getUserPermissionsFormatted(1);

      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('uncategorized_modules');
      expect(mockRequest.input).toHaveBeenCalledWith('userId', expect.anything(), 1);
    });

    it('should handle uncategorized modules', async () => {
      const mockPermissions = [
        {
          category_code: null,
          category_name: null,
          category_icon: null,
          category_display_order: null,
          module_code: 'UNCATEGORIZED',
          module_name: 'Uncategorized',
          module_route: '/uncategorized',
          module_icon: 'default',
          module_display_order: 1,
          action_code: 'VIEW',
          action_name: 'View'
        }
      ];
      mockRequest.query.mockResolvedValue({
        recordset: mockPermissions
      });

      const result = await repository.getUserPermissionsFormatted(1);

      expect(result.uncategorized_modules.length).toBeGreaterThan(0);
    });
  });

  describe('assignRole', () => {
    it('should assign role successfully', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.assignRole({ user_id: 5, role_id: 2 }, 'admin');

      expect(mockRequest.input).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalled();
    });
  });

  describe('detachRole', () => {
    it('should detach role successfully', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.detachRole(5, 2);

      expect(mockRequest.input).toHaveBeenCalledWith('userId', expect.anything(), 5);
      expect(mockRequest.input).toHaveBeenCalledWith('roleId', expect.anything(), 2);
      expect(mockRequest.query).toHaveBeenCalled();
    });
  });

  describe('getUserRoles', () => {
    it('should return array of role IDs', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [{ role_id: 1 }, { role_id: 2 }, { role_id: 3 }]
      });

      const result = await repository.getUserRoles(5);

      expect(result).toEqual([1, 2, 3]);
      expect(mockRequest.input).toHaveBeenCalledWith('userId', expect.anything(), 5);
    });

    it('should return empty array when user has no roles', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      const result = await repository.getUserRoles(5);

      expect(result).toEqual([]);
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        { role_id: 1, role_name: 'Admin', role_code: 'ADMIN' },
        { role_id: 2, role_name: 'User', role_code: 'USER' }
      ];
      mockRequest.query.mockResolvedValue({
        recordset: mockRoles
      });

      const result = await repository.getAllRoles();

      expect(result).toEqual(mockRoles);
      expect(mockRequest.query).toHaveBeenCalled();
    });
  });

  describe('getRoleById', () => {
    it('should return role when found', async () => {
      const mockRole = { role_id: 2, role_name: 'Manager', role_code: 'MANAGER' };
      mockRequest.query.mockResolvedValue({
        recordset: [mockRole]
      });

      const result = await repository.getRoleById(2);

      expect(result).toEqual(mockRole);
      expect(mockRequest.input).toHaveBeenCalledWith('roleId', expect.anything(), 2);
    });

    it('should return null when role not found', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      const result = await repository.getRoleById(999);

      expect(result).toBeNull();
    });
  });

  describe('getRolePermissions', () => {
    it('should return role permissions', async () => {
      const mockPermissions = [
        {
          role_id: 2,
          role_code: 'MANAGER',
          module_id: 1,
          module_code: 'USERS',
          action_id: 1,
          action_code: 'VIEW'
        }
      ];
      mockRequest.query.mockResolvedValue({
        recordset: mockPermissions
      });

      const result = await repository.getRolePermissions(2);

      expect(result).toEqual(mockPermissions);
      expect(mockRequest.input).toHaveBeenCalledWith('roleId', expect.anything(), 2);
    });
  });

  describe('getRolePermissionsMatrix', () => {
    it('should return permissions matrix', async () => {
      const mockMatrix = [
        {
          module_id: 1,
          module_code: 'USERS',
          module_name: 'Users',
          actions: []
        }
      ];
      mockRequest.query.mockResolvedValue({
        recordset: mockMatrix
      });

      const result = await repository.getRolePermissionsMatrix(2);

      expect(result).toEqual(mockMatrix);
      expect(mockRequest.input).toHaveBeenCalledWith('roleId', expect.anything(), 2);
    });
  });

  describe('createRole', () => {
    it('should create role and return ID', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [{ role_id: 10 }]
      });

      const result = await repository.createRole('New Role', 'NEW_ROLE', 'Test', 'admin');

      expect(result).toBe(10);
      expect(mockRequest.input).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalled();
    });

    it('should handle null description', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [{ role_id: 10 }]
      });

      const result = await repository.createRole('New Role', 'NEW_ROLE', null, 'admin');

      expect(result).toBe(10);
    });
  });

  describe('updateRole', () => {
    it('should update role with all fields', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.updateRole(2, 'Updated', 'UPDATED', 'Desc', true, 'admin');

      expect(mockRequest.input).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalled();
    });

    it('should handle undefined fields', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.updateRole(2, undefined, undefined, undefined, undefined, 'admin');

      expect(mockRequest.input).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalled();
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.deleteRole(2);

      expect(mockRequest.input).toHaveBeenCalledWith('roleId', expect.anything(), 2);
      expect(mockRequest.query).toHaveBeenCalled();
    });
  });

  describe('grantPermission', () => {
    it('should grant permission successfully', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.grantPermission(2, 5, 'admin');

      expect(mockRequest.input).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalled();
    });
  });

  describe('revokePermission', () => {
    it('should revoke permission successfully', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.revokePermission(2, 5);

      expect(mockRequest.input).toHaveBeenCalledWith('roleId', expect.anything(), 2);
      expect(mockRequest.input).toHaveBeenCalledWith('moduleActionId', expect.anything(), 5);
      expect(mockRequest.query).toHaveBeenCalled();
    });
  });

  describe('getAllModuleActions', () => {
    it('should return all module actions with details', async () => {
      const mockModuleActions = [
        {
          module_action_id: 1,
          module_id: 1,
          action_id: 1,
          module_code: 'USERS',
          action_code: 'VIEW'
        }
      ];
      mockRequest.query.mockResolvedValue({
        recordset: mockModuleActions
      });

      const result = await repository.getAllModuleActions();

      expect(result).toEqual(mockModuleActions);
      expect(mockRequest.query).toHaveBeenCalled();
    });
  });

  describe('createModuleAction', () => {
    it('should create module action and return ID', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [{ module_action_id: 10 }]
      });

      const result = await repository.createModuleAction(1, 2, 'View Users', 'admin');

      expect(result).toBe(10);
      expect(mockRequest.input).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalled();
    });

    it('should handle undefined action label', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [{ module_action_id: 10 }]
      });

      const result = await repository.createModuleAction(1, 2, undefined, 'admin');

      expect(result).toBe(10);
    });
  });

  describe('updateModuleAction', () => {
    it('should update module action with all fields', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.updateModuleAction(5, 'Updated Label', true, 'admin');

      expect(mockRequest.input).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalled();
    });

    it('should handle undefined fields', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.updateModuleAction(5, undefined, undefined, 'admin');

      // When all fields are undefined, method returns early, no DB call
      expect(mockRequest.query).not.toHaveBeenCalled();
    });
  });

  describe('deleteModuleAction', () => {
    it('should delete module action successfully', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.deleteModuleAction(5);

      expect(mockRequest.input).toHaveBeenCalledWith('moduleActionId', expect.anything(), 5);
      expect(mockRequest.query).toHaveBeenCalled();
    });
  });

  describe('createCategory', () => {
    it('should create category and return ID', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: [{ category_id: 10 }]
      });

      const dto = {
        category_name: 'New Category',
        category_code: 'NEW_CAT',
        category_icon: 'icon',
        display_order: 1
      };

      const result = await repository.createCategory(dto, 'admin');

      expect(result).toBe(10);
      expect(mockRequest.input).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should update category with all fields', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const dto = {
        category_name: 'Updated',
        category_code: 'UPDATED',
        category_icon: 'icon',
        display_order: 2,
        is_active: true
      };

      await repository.updateCategory(5, dto, 'admin');

      expect(mockRequest.input).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const dto = {
        category_name: 'Updated Name'
      };

      await repository.updateCategory(5, dto, 'admin');

      expect(mockRequest.query).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockRequest.execute.mockRejectedValue(dbError);

      await expect(repository.checkUserPermission(1, 'USERS', 'VIEW'))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle SQL errors', async () => {
      mockRequest.query.mockRejectedValue(new Error('SQL syntax error'));

      await expect(repository.getAllRoles())
        .rejects.toThrow('SQL syntax error');
    });
  });
});
