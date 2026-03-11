import request from 'supertest';
import express, { Express } from 'express';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

// Mock dependencies
jest.mock('./permissions.service');

describe('PermissionsController Integration Tests', () => {
  let app: Express;
  let permissionsController: PermissionsController;
  let mockPermissionsService: jest.Mocked<PermissionsService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app
    app = express();
    app.use(express.json());

    // Mock PermissionsService
    mockPermissionsService = {
      checkPermission: jest.fn(),
      getUserPermissions: jest.fn(),
      assignRole: jest.fn(),
      detachRole: jest.fn(),
      getUserRoles: jest.fn(),
      getAllRoles: jest.fn(),
      getRoleById: jest.fn(),
      getRolePermissions: jest.fn(),
      getRolePermissionsMatrix: jest.fn(),
      createRole: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
      getAllModules: jest.fn(),
      getAllActions: jest.fn(),
      createModule: jest.fn(),
      updateModule: jest.fn(),
      deleteModule: jest.fn(),
      createAction: jest.fn(),
      updateAction: jest.fn(),
      deleteAction: jest.fn(),
      getAllModuleActions: jest.fn(),
      createModuleAction: jest.fn(),
      updateModuleAction: jest.fn(),
      deleteModuleAction: jest.fn(),
      grantPermission: jest.fn(),
      revokePermission: jest.fn(),
      getAllCategories: jest.fn(),
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      clearAllCaches: jest.fn(),
    } as any;

    (PermissionsService as jest.MockedClass<typeof PermissionsService>).mockImplementation(() => mockPermissionsService);

    // Initialize controller and setup routes
    permissionsController = new PermissionsController();

    // Setup routes with mock authenticated user
    app.get('/api/permissions/check', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.checkPermission(req, res);
    });
    app.get('/api/permissions/user', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.getUserPermissions(req, res);
    });
    app.get('/api/permissions/user/:userId', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.getUserPermissionsById(req, res);
    });
    app.post('/api/permissions/assign-role', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.assignRole(req, res);
    });
    app.delete('/api/permissions/detach-role/:userId/:roleId', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.detachRole(req, res);
    });
    app.get('/api/permissions/user/:userId/roles', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.getUserRoles(req, res);
    });
    app.get('/api/roles', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.getAllRoles(req, res);
    });
    app.post('/api/permissions/roles/get', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.getRoleById(req, res);
    });
    app.post('/api/permissions/roles/permissions', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.getRolePermissions(req, res);
    });
    app.post('/api/permissions/roles/permissions-matrix', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.getRolePermissionsMatrix(req, res);
    });
    app.post('/api/permissions/roles/create', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.createRole(req, res);
    });
    app.post('/api/permissions/roles/update', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.updateRole(req, res);
    });
    app.post('/api/permissions/roles/delete', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.deleteRole(req, res);
    });
    app.post('/api/permissions/modules/list', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.getAllModules(req, res);
    });
    app.post('/api/permissions/actions/list', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.getAllActions(req, res);
    });
    app.post('/api/permissions/grant', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.grantPermission(req, res);
    });
    app.post('/api/permissions/revoke', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.revokePermission(req, res);
    });
    app.post('/api/permissions/module-actions/list', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.getAllModuleActions(req, res);
    });
    app.post('/api/permissions/module-actions/create', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.createModuleAction(req, res);
    });
    app.post('/api/permissions/module-actions/update', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.updateModuleAction(req, res);
    });
    app.post('/api/permissions/module-actions/delete', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.deleteModuleAction(req, res);
    });
    app.post('/api/permissions/categories', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.createCategory(req, res);
    });
    app.put('/api/permissions/categories/:categoryId', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.updateCategory(req, res);
    });
    app.delete('/api/permissions/categories/:categoryId', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.deleteCategory(req, res);
    });
    app.post('/api/permissions/clear-cache', (req, res) => {
      (req as any).user = { userId: 1, username: 'admin' };
      permissionsController.clearCache(req, res);
    });
  });

  describe('GET /api/permissions/check', () => {
    it('should check permission successfully', async () => {
      mockPermissionsService.checkPermission.mockResolvedValue({ has_permission: true });

      const response = await request(app)
        .get('/api/permissions/check')
        .query({ moduleCode: 'USERS', actionCode: 'VIEW' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({ has_permission: true });
      expect(mockPermissionsService.checkPermission).toHaveBeenCalledWith(1, 'USERS', 'VIEW');
    }, 10000);

    it('should return 400 when moduleCode is missing', async () => {
      const response = await request(app)
        .get('/api/permissions/check')
        .query({ actionCode: 'VIEW' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('moduleCode and actionCode are required');
      expect(mockPermissionsService.checkPermission).not.toHaveBeenCalled();
    });

    it('should return 400 when actionCode is missing', async () => {
      const response = await request(app)
        .get('/api/permissions/check')
        .query({ moduleCode: 'USERS' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('moduleCode and actionCode are required');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.checkPermission.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/permissions/check')
        .query({ moduleCode: 'USERS', actionCode: 'VIEW' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error checking permission');
    });
  });

  describe('GET /api/permissions/user', () => {
    const mockPermissions = {
      categories: [],
      uncategorized_modules: []
    };

    it('should get user permissions successfully', async () => {
      mockPermissionsService.getUserPermissions.mockResolvedValue(mockPermissions);

      const response = await request(app)
        .get('/api/permissions/user')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPermissions);
      expect(mockPermissionsService.getUserPermissions).toHaveBeenCalledWith(1, undefined);
    });

    it('should support active role header', async () => {
      mockPermissionsService.getUserPermissions.mockResolvedValue(mockPermissions);

      await request(app)
        .get('/api/permissions/user')
        .set('x-active-role-id', '2')
        .expect(200);

      expect(mockPermissionsService.getUserPermissions).toHaveBeenCalledWith(1, 2);
    });

    it('should handle service errors', async () => {
      mockPermissionsService.getUserPermissions.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/permissions/user')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error fetching user permissions');
    });
  });

  describe('GET /api/permissions/user/:userId', () => {
    it('should get user permissions by ID', async () => {
      const mockPermissions = {
        categories: [],
        uncategorized_modules: []
      };
      mockPermissionsService.getUserPermissions.mockResolvedValue(mockPermissions);

      const response = await request(app)
        .get('/api/permissions/user/5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPermissions);
      expect(mockPermissionsService.getUserPermissions).toHaveBeenCalledWith(5);
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/permissions/user/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID');
      expect(mockPermissionsService.getUserPermissions).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockPermissionsService.getUserPermissions.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .get('/api/permissions/user/999')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/permissions/assign-role', () => {
    const validDto = {
      user_id: 5,
      role_id: 2
    };

    it('should assign role successfully', async () => {
      mockPermissionsService.assignRole.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/permissions/assign-role')
        .send(validDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe('Role assigned successfully');
      expect(mockPermissionsService.assignRole).toHaveBeenCalledWith(validDto, '1');
    });

    it('should return 400 when user_id is missing', async () => {
      const response = await request(app)
        .post('/api/permissions/assign-role')
        .send({ role_id: 2 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('user_id and role_id are required');
      expect(mockPermissionsService.assignRole).not.toHaveBeenCalled();
    });

    it('should return 400 when role_id is missing', async () => {
      const response = await request(app)
        .post('/api/permissions/assign-role')
        .send({ user_id: 5 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('user_id and role_id are required');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.assignRole.mockRejectedValue(new Error('Role not found'));

      const response = await request(app)
        .post('/api/permissions/assign-role')
        .send(validDto)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error assigning role');
    });
  });

  describe('DELETE /api/permissions/detach-role/:userId/:roleId', () => {
    it('should detach role successfully', async () => {
      mockPermissionsService.detachRole.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/permissions/detach-role/5/2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe('Role detached successfully');
      expect(mockPermissionsService.detachRole).toHaveBeenCalledWith(5, 2);
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .delete('/api/permissions/detach-role/invalid/2')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID or role ID');
      expect(mockPermissionsService.detachRole).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid role ID', async () => {
      const response = await request(app)
        .delete('/api/permissions/detach-role/5/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID or role ID');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.detachRole.mockRejectedValue(new Error('Role assignment not found'));

      const response = await request(app)
        .delete('/api/permissions/detach-role/5/2')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error detaching role');
    });
  });

  describe('GET /api/permissions/user/:userId/roles', () => {
    it('should get user roles successfully', async () => {
      mockPermissionsService.getUserRoles.mockResolvedValue([1, 2, 3]);

      const response = await request(app)
        .get('/api/permissions/user/5/roles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.roleIds).toEqual([1, 2, 3]);
      expect(mockPermissionsService.getUserRoles).toHaveBeenCalledWith(5);
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/permissions/user/invalid/roles')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID');
      expect(mockPermissionsService.getUserRoles).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockPermissionsService.getUserRoles.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/permissions/user/5/roles')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error fetching user roles');
    });
  });

  describe('GET /api/roles', () => {
    const mockRoles = [
      { role_id: 1, role_name: 'Admin', role_code: 'ADMIN', description: null, is_system_role: true, is_active: true, created_at: new Date(), updated_at: null, created_by: null, updated_by: null },
      { role_id: 2, role_name: 'User', role_code: 'USER', description: null, is_system_role: false, is_active: true, created_at: new Date(), updated_at: null, created_by: null, updated_by: null }
    ];

    it('should get all roles successfully', async () => {
      mockPermissionsService.getAllRoles.mockResolvedValue(mockRoles);

      const response = await request(app)
        .get('/api/roles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].role_code).toBe('ADMIN');
      expect(response.body.data[1].role_code).toBe('USER');
      expect(mockPermissionsService.getAllRoles).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockPermissionsService.getAllRoles.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/roles')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error fetching roles');
    });
  });

  describe('POST /api/permissions/roles/get', () => {
    const mockRole = { role_id: 2, role_name: 'Manager', role_code: 'MANAGER', description: null, is_system_role: false, is_active: true, created_at: new Date(), updated_at: null, created_by: null, updated_by: null };

    it('should get role by ID successfully', async () => {
      mockPermissionsService.getRoleById.mockResolvedValue(mockRole);

      const response = await request(app)
        .post('/api/permissions/roles/get')
        .send({ role_id: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role_id).toBe(2);
      expect(response.body.data.role_code).toBe('MANAGER');
      expect(mockPermissionsService.getRoleById).toHaveBeenCalledWith(2);
    });

    it('should return 400 for invalid role ID', async () => {
      const response = await request(app)
        .post('/api/permissions/roles/get')
        .send({ role_id: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid role ID');
      expect(mockPermissionsService.getRoleById).not.toHaveBeenCalled();
    });

    it('should return 404 when role not found', async () => {
      mockPermissionsService.getRoleById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/permissions/roles/get')
        .send({ role_id: 999 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Role not found');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.getRoleById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/permissions/roles/get')
        .send({ role_id: 2 })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error fetching role');
    });
  });

  describe('POST /api/permissions/roles/permissions', () => {
    it('should get role permissions successfully', async () => {
      const mockPermissions = [
        { role_id: 2, role_name: 'Manager', role_code: 'MANAGER', module_id: 1, module_code: 'USERS', module_name: 'Users', action_id: 1, action_code: 'VIEW', action_name: 'View', module_action_id: 1, permission_key: 'USERS.VIEW', permission_label: 'View Users', granted: true }
      ];
      mockPermissionsService.getRolePermissions.mockResolvedValue(mockPermissions);

      const response = await request(app)
        .post('/api/permissions/roles/permissions')
        .send({ role_id: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPermissions);
      expect(mockPermissionsService.getRolePermissions).toHaveBeenCalledWith(2);
    });

    it('should return 400 for invalid role ID', async () => {
      const response = await request(app)
        .post('/api/permissions/roles/permissions')
        .send({ role_id: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid role ID');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.getRolePermissions.mockRejectedValue(new Error('Role not found'));

      const response = await request(app)
        .post('/api/permissions/roles/permissions')
        .send({ role_id: 2 })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/permissions/roles/permissions-matrix', () => {
    it('should get role permissions matrix successfully', async () => {
      const mockMatrix: any = {
        modules: ['USERS', 'ROLES'],
        actions: ['VIEW', 'CREATE'],
        permissions: [[true, false], [true, true]]
      };
      mockPermissionsService.getRolePermissionsMatrix.mockResolvedValue(mockMatrix);

      const response = await request(app)
        .post('/api/permissions/roles/permissions-matrix')
        .send({ role_id: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMatrix);
      expect(mockPermissionsService.getRolePermissionsMatrix).toHaveBeenCalledWith(2);
    });

    it('should return 400 for invalid role ID', async () => {
      const response = await request(app)
        .post('/api/permissions/roles/permissions-matrix')
        .send({ role_id: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid role ID');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.getRolePermissionsMatrix.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/permissions/roles/permissions-matrix')
        .send({ role_id: 2 })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/permissions/roles/create', () => {
    const validDto = {
      role_name: 'New Role',
      role_code: 'NEW_ROLE',
      category_id: 1
    };

    it('should create role successfully', async () => {
      mockPermissionsService.createRole.mockResolvedValue(10);

      const response = await request(app)
        .post('/api/permissions/roles/create')
        .send(validDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.roleId).toBe(10);
      expect(response.body.message).toBe('Role created successfully');
      expect(mockPermissionsService.createRole).toHaveBeenCalledWith(validDto, '1');
    });

    it('should return 400 when role_name is missing', async () => {
      const response = await request(app)
        .post('/api/permissions/roles/create')
        .send({ role_code: 'NEW_ROLE' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('role_name and role_code are required');
      expect(mockPermissionsService.createRole).not.toHaveBeenCalled();
    });

    it('should return 400 when role_code is missing', async () => {
      const response = await request(app)
        .post('/api/permissions/roles/create')
        .send({ role_name: 'New Role' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('role_name and role_code are required');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.createRole.mockRejectedValue(new Error('Role code already exists'));

      const response = await request(app)
        .post('/api/permissions/roles/create')
        .send(validDto)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error creating role');
    });
  });

  describe('POST /api/permissions/roles/update', () => {
    const validDto = {
      role_id: 5,
      role_name: 'Updated Role'
    };

    it('should update role successfully', async () => {
      mockPermissionsService.updateRole.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/permissions/roles/update')
        .send(validDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe('Role updated successfully');
      expect(mockPermissionsService.updateRole).toHaveBeenCalledWith(5, validDto, '1');
    });

    it('should return 400 for invalid role ID', async () => {
      const response = await request(app)
        .post('/api/permissions/roles/update')
        .send({ role_id: 'invalid', role_name: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid role ID');
      expect(mockPermissionsService.updateRole).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockPermissionsService.updateRole.mockRejectedValue(new Error('Role not found'));

      const response = await request(app)
        .post('/api/permissions/roles/update')
        .send(validDto)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error updating role');
    });
  });

  describe('POST /api/permissions/roles/delete', () => {
    it('should delete role successfully', async () => {
      mockPermissionsService.deleteRole.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/permissions/roles/delete')
        .send({ role_id: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe('Role deleted successfully');
      expect(mockPermissionsService.deleteRole).toHaveBeenCalledWith(5);
    });

    it('should return 400 for invalid role ID', async () => {
      const response = await request(app)
        .post('/api/permissions/roles/delete')
        .send({ role_id: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid role ID');
      expect(mockPermissionsService.deleteRole).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockPermissionsService.deleteRole.mockRejectedValue(new Error('Cannot delete role with assigned users'));

      const response = await request(app)
        .post('/api/permissions/roles/delete')
        .send({ role_id: 5 })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error deleting role');
    });
  });

  describe('POST /api/permissions/modules/list', () => {
    const mockModules = [
      { module_id: 1, module_name: 'Users', module_code: 'USERS', description: null, category_id: null, icon: null, route: null, display_order: 1, is_active: true, created_at: new Date(), updated_at: null, created_by: null, updated_by: null },
      { module_id: 2, module_name: 'Roles', module_code: 'ROLES', description: null, category_id: null, icon: null, route: null, display_order: 2, is_active: true, created_at: new Date(), updated_at: null, created_by: null, updated_by: null }
    ];

    it('should get all modules successfully', async () => {
      mockPermissionsService.getAllModules.mockResolvedValue(mockModules);

      const response = await request(app)
        .post('/api/permissions/modules/list')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].module_code).toBe('USERS');
      expect(response.body.data[1].module_code).toBe('ROLES');
      expect(mockPermissionsService.getAllModules).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockPermissionsService.getAllModules.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/permissions/modules/list')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error fetching modules');
    });
  });

  describe('POST /api/permissions/actions/list', () => {
    const mockActions = [
      { action_id: 1, action_name: 'View', action_code: 'VIEW', description: null, is_active: true, created_at: new Date(), updated_at: null, created_by: null, updated_by: null },
      { action_id: 2, action_name: 'Create', action_code: 'CREATE', description: null, is_active: true, created_at: new Date(), updated_at: null, created_by: null, updated_by: null }
    ];

    it('should get all actions successfully', async () => {
      mockPermissionsService.getAllActions.mockResolvedValue(mockActions);

      const response = await request(app)
        .post('/api/permissions/actions/list')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].action_code).toBe('VIEW');
      expect(response.body.data[1].action_code).toBe('CREATE');
      expect(mockPermissionsService.getAllActions).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockPermissionsService.getAllActions.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/permissions/actions/list')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error fetching actions');
    });
  });

  describe('POST /api/permissions/grant', () => {
    const validDto = {
      role_id: 2,
      module_action_id: 5
    };

    it('should grant permission successfully', async () => {
      mockPermissionsService.grantPermission.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/permissions/grant')
        .send(validDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe('Permission granted successfully');
      expect(mockPermissionsService.grantPermission).toHaveBeenCalledWith(validDto, '1');
    });

    it('should return 400 when role_id is missing', async () => {
      const response = await request(app)
        .post('/api/permissions/grant')
        .send({ module_action_id: 5 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('role_id and module_action_id are required');
      expect(mockPermissionsService.grantPermission).not.toHaveBeenCalled();
    });

    it('should return 400 when module_action_id is missing', async () => {
      const response = await request(app)
        .post('/api/permissions/grant')
        .send({ role_id: 2 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('role_id and module_action_id are required');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.grantPermission.mockRejectedValue(new Error('Permission already exists'));

      const response = await request(app)
        .post('/api/permissions/grant')
        .send(validDto)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error granting permission');
    });
  });

  describe('POST /api/permissions/revoke', () => {
    const validDto = {
      role_id: 2,
      module_action_id: 5
    };

    it('should revoke permission successfully', async () => {
      mockPermissionsService.revokePermission.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/permissions/revoke')
        .send(validDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe('Permission revoked successfully');
      expect(mockPermissionsService.revokePermission).toHaveBeenCalledWith(validDto);
    });

    it('should return 400 when role_id is missing', async () => {
      const response = await request(app)
        .post('/api/permissions/revoke')
        .send({ module_action_id: 5 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('role_id and module_action_id are required');
      expect(mockPermissionsService.revokePermission).not.toHaveBeenCalled();
    });

    it('should return 400 when module_action_id is missing', async () => {
      const response = await request(app)
        .post('/api/permissions/revoke')
        .send({ role_id: 2 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('role_id and module_action_id are required');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.revokePermission.mockRejectedValue(new Error('Permission not found'));

      const response = await request(app)
        .post('/api/permissions/revoke')
        .send(validDto)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error revoking permission');
    });
  });

  describe('POST /api/permissions/module-actions/list', () => {
    it('should get all module-actions successfully', async () => {
      const mockModuleActions = [
        { module_action_id: 1, module_id: 1, action_id: 1, module_name: 'Users', module_code: 'USERS', action_name: 'View', action_code: 'VIEW', display_order: 1, is_active: true, category_id: 1, category_name: 'System', icon: 'users' },
        { module_action_id: 2, module_id: 1, action_id: 2, module_name: 'Users', module_code: 'USERS', action_name: 'Create', action_code: 'CREATE', display_order: 2, is_active: true, category_id: 1, category_name: 'System', icon: 'users' },
      ];
      mockPermissionsService.getAllModuleActions.mockResolvedValue(mockModuleActions as any);

      const response = await request(app)
        .post('/api/permissions/module-actions/list')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockModuleActions);
    });

    it('should handle service errors', async () => {
      mockPermissionsService.getAllModuleActions.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/permissions/module-actions/list')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/permissions/module-actions/create', () => {
    it('should create module-action successfully', async () => {
      mockPermissionsService.createModuleAction.mockResolvedValue(123);

      const response = await request(app)
        .post('/api/permissions/module-actions/create')
        .send({ module_id: 1, action_id: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.module_action_id).toBe(123);
    });

    it('should return 400 when moduleId is missing', async () => {
      const response = await request(app)
        .post('/api/permissions/module-actions/create')
        .send({ action_id: 2 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('module_id and action_id are required');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.createModuleAction.mockRejectedValue(new Error('Creation failed'));

      const response = await request(app)
        .post('/api/permissions/module-actions/create')
        .send({ module_id: 1, action_id: 2 })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/permissions/module-actions/update', () => {
    it('should update module-action successfully', async () => {
      mockPermissionsService.updateModuleAction.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/permissions/module-actions/update')
        .send({ module_action_id: 1, display_order: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 when module_action_id is invalid', async () => {
      const response = await request(app)
        .post('/api/permissions/module-actions/update')
        .send({ module_action_id: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Valid module_action_id is required');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.updateModuleAction.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .post('/api/permissions/module-actions/update')
        .send({ module_action_id: 1, display_order: 5 })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/permissions/module-actions/delete', () => {
    it('should delete module-action successfully', async () => {
      mockPermissionsService.deleteModuleAction.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/permissions/module-actions/delete')
        .send({ module_action_id: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 when module_action_id is invalid', async () => {
      const response = await request(app)
        .post('/api/permissions/module-actions/delete')
        .send({ module_action_id: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle service errors', async () => {
      mockPermissionsService.deleteModuleAction.mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .post('/api/permissions/module-actions/delete')
        .send({ module_action_id: 1 })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/permissions/categories', () => {
    it('should create category successfully', async () => {
      mockPermissionsService.createCategory.mockResolvedValue(100);

      const response = await request(app)
        .post('/api/permissions/categories')
        .send({ category_name: 'Test', category_code: 'TEST', display_order: 1 })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category_id).toBe(100);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/permissions/categories')
        .send({ category_name: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('category_name, category_code, and display_order are required');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.createCategory.mockRejectedValue(new Error('Creation failed'));

      const response = await request(app)
        .post('/api/permissions/categories')
        .send({ category_name: 'Test', category_code: 'TEST', display_order: 1 })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/permissions/categories/:categoryId', () => {
    it('should update category successfully', async () => {
      mockPermissionsService.updateCategory.mockResolvedValue(undefined);

      const response = await request(app)
        .put('/api/permissions/categories/1')
        .send({ category_name: 'Updated' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 when categoryId is invalid', async () => {
      const response = await request(app)
        .put('/api/permissions/categories/invalid')
        .send({ category_name: 'Updated' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID');
    });

    it('should return 400 when no fields provided', async () => {
      const response = await request(app)
        .put('/api/permissions/categories/1')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('At least one field must be provided for update');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.updateCategory.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .put('/api/permissions/categories/1')
        .send({ category_name: 'Updated' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/permissions/categories/:categoryId', () => {
    it('should delete category successfully', async () => {
      mockPermissionsService.deleteCategory.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/permissions/categories/1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 when categoryId is invalid', async () => {
      const response = await request(app)
        .delete('/api/permissions/categories/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.deleteCategory.mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/api/permissions/categories/1')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/permissions/clear-cache', () => {
    it('should clear cache successfully', async () => {
      const response = await request(app)
        .post('/api/permissions/clear-cache')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe('Permission caches cleared successfully');
    });

    it('should handle service errors', async () => {
      mockPermissionsService.clearAllCaches = jest.fn().mockImplementation(() => {
        throw new Error('Cache clear failed');
      });

      const response = await request(app)
        .post('/api/permissions/clear-cache')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});
