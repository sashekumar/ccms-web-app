import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { PermissionService, ApiResponse } from './permission.service';
import { ApiService } from './api.service';
import { LoggerService } from './logger.service';
import { API_ENDPOINTS } from '../constants';
import { UserPermissionsResponse, ModulePermissions, Role, AssignRoleDto } from '../../shared/models/permission.model';

describe('PermissionService', () => {
  let service: PermissionService;
  let apiServiceMock: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  let loggerServiceMock: { error: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; debug: ReturnType<typeof vi.fn> };

  const mockModulePermissions: ModulePermissions = {
    module_code: 'USER_MGMT',
    module_name: 'User Management',
    module_route: '/users',
    icon: 'users-icon',
    display_order: 1,
    actions: [
      { action_code: 'VIEW', action_name: 'View' },
      { action_code: 'CREATE', action_name: 'Create' },
      { action_code: 'EDIT', action_name: 'Edit' }
    ]
  };

  const mockUserPermissions: UserPermissionsResponse = {
    categories: [
      {
        category_code: 'ADMIN',
        category_name: 'Administration',
        category_icon: 'admin-icon',
        display_order: 1,
        modules: [mockModulePermissions]
      }
    ],
    uncategorized_modules: [],
    modules: []
  };

  const mockRole: Role = {
    role_id: 1,
    role_code: 'ADMIN',
    role_name: 'Administrator',
    description: 'System administrator',
    is_system_role: false,
    is_active: true,
    created_at: new Date(),
    updated_at: null,
    created_by: 'system',
    updated_by: null
  };

  beforeEach(() => {
    apiServiceMock = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn()
    };

    loggerServiceMock = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        PermissionService,
        { provide: ApiService, useValue: apiServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock }
      ]
    });

    service = TestBed.inject(PermissionService);
    
    // Clear cache before each test
    service['userPermissionsSubject'].next(null);
    service['permissionCache'].clear();
    service['cacheTimestamp'] = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with null permissions', () => {
      let permissions: UserPermissionsResponse | null = null;
      service.userPermissions$.subscribe(p => permissions = p);
      expect(permissions).toBeNull();
    });

    it('should have empty permission cache', () => {
      expect(service['permissionCache'].size).toBe(0);
    });
  });

  describe('loadUserPermissions()', () => {
    it('should load user permissions successfully', () => {
      const mockResponse: ApiResponse<UserPermissionsResponse> = {
        success: true,
        data: mockUserPermissions
      };

      apiServiceMock.get.mockReturnValue(of(mockResponse));

      service.loadUserPermissions().subscribe(permissions => {
        expect(permissions).toEqual(mockUserPermissions);
        // Using a more flexible matcher for headers parameter
        expect(apiServiceMock.get).toHaveBeenCalled();
        expect(apiServiceMock.get.mock.calls[0][0]).toBe(API_ENDPOINTS.PERMISSIONS.USER.GET_CURRENT);
      });
    });

    it('should cache permissions after loading', () => {
      const mockResponse: ApiResponse<UserPermissionsResponse> = {
        success: true,
        data: mockUserPermissions
      };

      apiServiceMock.get.mockReturnValue(of(mockResponse));

      service.loadUserPermissions().subscribe(() => {
        let cached: UserPermissionsResponse | null = null;
        service.userPermissions$.subscribe(p => cached = p);
        expect(cached).toEqual(mockUserPermissions);
      });
    });

    it('should update cache timestamp', () => {
      const mockResponse: ApiResponse<UserPermissionsResponse> = {
        success: true,
        data: mockUserPermissions
      };

      apiServiceMock.get.mockReturnValue(of(mockResponse));
      const beforeTimestamp = service['cacheTimestamp'];

      service.loadUserPermissions().subscribe(() => {
        const afterTimestamp = service['cacheTimestamp'];
        expect(afterTimestamp).toBeGreaterThan(beforeTimestamp);
      });
    });

    it('should handle errors gracefully', () => {
      apiServiceMock.get.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      service.loadUserPermissions().subscribe(permissions => {
        expect(permissions.categories).toEqual([]);
        expect(permissions.uncategorized_modules).toEqual([]);
      });
    });
  });

  describe('getUserPermissions()', () => {
    it('should return cached permissions when valid', () => {
      service['userPermissionsSubject'].next(mockUserPermissions);
      service['cacheTimestamp'] = Date.now();

      service.getUserPermissions(false).subscribe(permissions => {
        expect(permissions).toEqual(mockUserPermissions);
        expect(apiServiceMock.get).not.toHaveBeenCalled();
      });
    });

    it('should reload when forceRefresh is true', () => {
      service['userPermissionsSubject'].next(mockUserPermissions);
      service['cacheTimestamp'] = Date.now();

      const mockResponse: ApiResponse<UserPermissionsResponse> = {
        success: true,
        data: mockUserPermissions
      };

      apiServiceMock.get.mockReturnValue(of(mockResponse));

      service.getUserPermissions(true).subscribe(() => {
        expect(apiServiceMock.get).toHaveBeenCalled();
      });
    });

    it('should reload when cache is invalid', () => {
      service['userPermissionsSubject'].next(mockUserPermissions);
      service['cacheTimestamp'] = Date.now() - (6 * 60 * 1000); // 6 minutes ago

      const mockResponse: ApiResponse<UserPermissionsResponse> = {
        success: true,
        data: mockUserPermissions
      };

      apiServiceMock.get.mockReturnValue(of(mockResponse));

      service.getUserPermissions(false).subscribe(() => {
        expect(apiServiceMock.get).toHaveBeenCalled();
      });
    });
  });

  describe('hasPermission()', () => {
    beforeEach(() => {
      service['userPermissionsSubject'].next(mockUserPermissions);
      service['cacheTimestamp'] = Date.now();
    });

    it('should check permission from cache', () => {
      service.hasPermission('USER_MGMT', 'VIEW').subscribe(hasAccess => {
        expect(hasAccess).toBe(true);
      });
    });

    it('should return false for non-existent module', () => {
      service.hasPermission('NONEXISTENT', 'VIEW').subscribe(hasAccess => {
        expect(hasAccess).toBe(false);
      });
    });

    it('should return false for non-existent action', () => {
      service.hasPermission('USER_MGMT', 'DELETE').subscribe(hasAccess => {
        expect(hasAccess).toBe(false);
      });
    });

    it('should cache permission check results', () => {
      service.hasPermission('USER_MGMT', 'VIEW').subscribe(() => {
        const cacheKey = 'USER_MGMT.VIEW';
        expect(service['permissionCache'].has(cacheKey)).toBe(true);
        expect(service['permissionCache'].get(cacheKey)).toBe(true);
      });
    });

    it('should use cached result on subsequent calls', () => {
      const cacheKey = 'USER_MGMT.EDIT';
      service['permissionCache'].set(cacheKey, true);

      service.hasPermission('USER_MGMT', 'EDIT').subscribe(hasAccess => {
        expect(hasAccess).toBe(true);
        expect(apiServiceMock.get).not.toHaveBeenCalled();
      });
    });
  });

  describe('hasPermissionSync()', () => {
    beforeEach(() => {
      service['userPermissionsSubject'].next(mockUserPermissions);
      service['cacheTimestamp'] = Date.now();
    });

    it('should check permission synchronously', () => {
      const hasAccess = service.hasPermissionSync('USER_MGMT', 'VIEW');
      expect(hasAccess).toBe(true);
    });

    it('should return false for non-existent permission', () => {
      const hasAccess = service.hasPermissionSync('USER_MGMT', 'DELETE');
      expect(hasAccess).toBe(false);
    });

    it('should use cache if available', () => {
      const cacheKey = 'USER_MGMT.CREATE';
      service['permissionCache'].set(cacheKey, true);

      const hasAccess = service.hasPermissionSync('USER_MGMT', 'CREATE');
      expect(hasAccess).toBe(true);
    });

    it('should return false when no cached data', () => {
      service['userPermissionsSubject'].next(null);
      
      const hasAccess = service.hasPermissionSync('USER_MGMT', 'VIEW');
      expect(hasAccess).toBe(false);
    });
  });

  describe('hasAnyPermission()', () => {
    beforeEach(() => {
      service['userPermissionsSubject'].next(mockUserPermissions);
      service['cacheTimestamp'] = Date.now();
    });

    it('should return true if user has any of the permissions', () => {
      const permissions: [string, string][] = [
        ['USER_MGMT', 'VIEW'],
        ['USER_MGMT', 'DELETE'] // This one doesn't exist
      ];

      service.hasAnyPermission(permissions).subscribe(hasAny => {
        expect(hasAny).toBe(true);
      });
    });

    it('should return false if user has none of the permissions', () => {
      const permissions: [string, string][] = [
        ['USER_MGMT', 'DELETE'],
        ['NONEXISTENT', 'VIEW']
      ];

      service.hasAnyPermission(permissions).subscribe(hasAny => {
        expect(hasAny).toBe(false);
      });
    });
  });

  describe('hasAllPermissions()', () => {
    beforeEach(() => {
      service['userPermissionsSubject'].next(mockUserPermissions);
      service['cacheTimestamp'] = Date.now();
    });

    it('should return true if user has all permissions', () => {
      const permissions: [string, string][] = [
        ['USER_MGMT', 'VIEW'],
        ['USER_MGMT', 'CREATE'],
        ['USER_MGMT', 'EDIT']
      ];

      service.hasAllPermissions(permissions).subscribe(hasAll => {
        expect(hasAll).toBe(true);
      });
    });

    it('should return false if user is missing any permission', () => {
      const permissions: [string, string][] = [
        ['USER_MGMT', 'VIEW'],
        ['USER_MGMT', 'DELETE'] // This one doesn't exist
      ];

      service.hasAllPermissions(permissions).subscribe(hasAll => {
        expect(hasAll).toBe(false);
      });
    });
  });

  describe('clearAllData()', () => {
    it('should clear all cached data', () => {
      service['userPermissionsSubject'].next(mockUserPermissions);
      service['permissionCache'].set('TEST.VIEW', true);
      service['cacheTimestamp'] = Date.now();

      service.clearAllData();

      let permissions: UserPermissionsResponse | null = undefined as any;
      service.userPermissions$.subscribe(p => permissions = p);
      expect(permissions).toBeNull();
      expect(service['permissionCache'].size).toBe(0);
    });
  });

  describe('getAllRoles()', () => {
    it('should retrieve all roles', () => {
      const mockRoles = [mockRole];
      const mockResponse: ApiResponse<Role[]> = {
        success: true,
        data: mockRoles
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.getAllRoles().subscribe(roles => {
        expect(roles).toEqual(mockRoles);
        expect(apiServiceMock.post).toHaveBeenCalledWith(
          API_ENDPOINTS.PERMISSIONS.ROLES.LIST,
          {}
        );
      });
    });

    it('should handle errors and return empty array', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      service.getAllRoles().subscribe(roles => {
        expect(roles).toEqual([]);
      });
    });
  });

  describe('assignRole()', () => {
    it('should assign role to user', () => {
      const dto: AssignRoleDto = {
        user_id: 1,
        role_id: 1
      };

      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.assignRole(dto).subscribe(result => {
        expect(result).toBeUndefined();
        expect(apiServiceMock.post).toHaveBeenCalledWith(
          API_ENDPOINTS.PERMISSIONS.USER.ASSIGN_ROLE,
          dto
        );
      });
    });

    it('should handle errors', () => {
      const dto: AssignRoleDto = {
        user_id: 1,
        role_id: 999
      };

      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Role not found'))
      );

      service.assignRole(dto).subscribe({
        next: () => {
          throw new Error('Should have failed');
        },
        error: (error) => {
          expect(error.message).toContain('Role not found');
        }
      });
    });
  });

  describe('getUserRoles()', () => {
    it('should get user roles', () => {
      const mockResponse: ApiResponse<{ roleIds: number[] }> = {
        success: true,
        data: { roleIds: [1, 2, 3] }
      };

      apiServiceMock.get.mockReturnValue(of(mockResponse));

      service.getUserRoles(1).subscribe(roleIds => {
        expect(roleIds).toEqual([1, 2, 3]);
      });
    });

    it('should handle errors and return empty array', () => {
      apiServiceMock.get.mockReturnValue(
        throwError(() => new Error('User not found'))
      );

      service.getUserRoles(999).subscribe(roleIds => {
        expect(roleIds).toEqual([]);
      });
    });
  });

  describe('Cache Management', () => {
    it('should validate cache within duration', () => {
      service['cacheTimestamp'] = Date.now();
      expect(service['isCacheValid']()).toBe(true);
    });

    it('should invalidate cache after duration', () => {
      service['cacheTimestamp'] = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      expect(service['isCacheValid']()).toBe(false);
    });

    it('should invalidate cache when timestamp is 0', () => {
      service['cacheTimestamp'] = 0;
      expect(service['isCacheValid']()).toBe(false);
    });
  });

  describe('Permission Check in Memory', () => {
    it('should check permission in category-based structure', () => {
      const hasAccess = service['checkPermissionInMemory'](
        mockUserPermissions,
        'USER_MGMT',
        'VIEW'
      );
      expect(hasAccess).toBe(true);
    });

    it('should support old flat module structure', () => {
      const oldStructurePermissions: UserPermissionsResponse = {
        modules: [mockModulePermissions]
      } as any; // Cast to any to allow old structure without categories

      const hasAccess = service['checkPermissionInMemory'](
        oldStructurePermissions,
        'USER_MGMT',
        'CREATE'
      );
      expect(hasAccess).toBe(true);
    });

    it('should check uncategorized modules', () => {
      const permissionsWithUncategorized: UserPermissionsResponse = {
        categories: [],
        uncategorized_modules: [mockModulePermissions],
        modules: []
      };

      const hasAccess = service['checkPermissionInMemory'](
        permissionsWithUncategorized,
        'USER_MGMT',
        'EDIT'
      );
      expect(hasAccess).toBe(true);
    });

    it('should return false for non-existent module', () => {
      const hasAccess = service['checkPermissionInMemory'](
        mockUserPermissions,
        'NONEXISTENT',
        'VIEW'
      );
      expect(hasAccess).toBe(false);
    });

    it('should return false for non-existent action', () => {
      const hasAccess = service['checkPermissionInMemory'](
        mockUserPermissions,
        'USER_MGMT',
        'DELETE'
      );
      expect(hasAccess).toBe(false);
    });
  });

  describe('getUserPermissionsById()', () => {
    it('should get permissions for specific user', () => {
      const mockResponse: ApiResponse<UserPermissionsResponse> = {
        success: true,
        data: mockUserPermissions
      };

      apiServiceMock.get.mockReturnValue(of(mockResponse));

      service.getUserPermissionsById(1).subscribe(permissions => {
        expect(permissions).toEqual(mockUserPermissions);
        // Using a more flexible matcher for headers parameter
        expect(apiServiceMock.get).toHaveBeenCalled();
        expect(apiServiceMock.get.mock.calls[0][0]).toBe(API_ENDPOINTS.PERMISSIONS.USER.getById(1));
      });
    });

    it('should handle errors', () => {
      apiServiceMock.get.mockReturnValue(
        throwError(() => new Error('User not found'))
      );

      service.getUserPermissionsById(999).subscribe({
        error: (error) => {
          expect(error.message).toContain('User not found');
        }
      });
    });
  });

  describe('detachRole()', () => {
    it('should detach role from user', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.delete.mockReturnValue(of(mockResponse));

      service.detachRole(1, 2).subscribe(() => {
        expect(apiServiceMock.delete).toHaveBeenCalledWith(API_ENDPOINTS.PERMISSIONS.USER.detachRole(1, 2));
      });
    });

    it('should handle detach errors', () => {
      apiServiceMock.delete.mockReturnValue(
        throwError(() => new Error('Role not assigned'))
      );

      service.detachRole(1, 2).subscribe({
        error: (error) => {
          expect(error.message).toContain('Role not assigned');
        }
      });
    });
  });

  describe('getRoleById()', () => {
    it('should get role by ID', () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: mockRole
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.getRoleById(1).subscribe(role => {
        expect(role).toEqual(mockRole);
        expect(apiServiceMock.post).toHaveBeenCalledWith(API_ENDPOINTS.PERMISSIONS.ROLES.GET, { roleId: 1 });
      });
    });

    it('should handle role not found', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Role not found'))
      );

      service.getRoleById(999).subscribe({
        error: (error) => {
          expect(error.message).toContain('Role not found');
        }
      });
    });
  });

  describe('getRolePermissions()', () => {
    it('should get role permissions', () => {
      const mockPermissions = [
        { module_code: 'USER_MGMT', action_code: 'VIEW' }
      ];
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: mockPermissions
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.getRolePermissions(1).subscribe(permissions => {
        expect(permissions).toEqual(mockPermissions);
      });
    });

    it('should handle errors and return empty array', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Error'))
      );

      service.getRolePermissions(1).subscribe(permissions => {
        expect(permissions).toEqual([]);
      });
    });
  });

  describe('getRolePermissionsMatrix()', () => {
    it('should get role permissions matrix', () => {
      const mockMatrix = [
        { module_code: 'USER_MGMT', action_code: 'VIEW', granted: true }
      ];
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: mockMatrix
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.getRolePermissionsMatrix(1).subscribe(matrix => {
        expect(matrix).toEqual(mockMatrix);
      });
    });

    it('should handle errors and return empty array', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Error'))
      );

      service.getRolePermissionsMatrix(1).subscribe(matrix => {
        expect(matrix).toEqual([]);
      });
    });
  });

  describe('createRole()', () => {
    it('should create new role', () => {
      const dto = {
        role_code: 'MANAGER',
        role_name: 'Manager',
        description: 'Manager role'
      };
      const mockResponse: ApiResponse<{ roleId: number }> = {
        success: true,
        data: { roleId: 5 }
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.createRole(dto).subscribe(roleId => {
        expect(roleId).toBe(5);
        expect(apiServiceMock.post).toHaveBeenCalledWith(API_ENDPOINTS.PERMISSIONS.ROLES.CREATE, dto);
      });
    });

    it('should handle create errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Duplicate role code'))
      );

      service.createRole({} as any).subscribe({
        error: (error) => {
          expect(error.message).toContain('Duplicate');
        }
      });
    });
  });

  describe('updateRole()', () => {
    it('should update role', () => {
      const dto = { role_name: 'Updated Manager' };
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.updateRole(1, dto).subscribe(() => {
        expect(apiServiceMock.post).toHaveBeenCalledWith(API_ENDPOINTS.PERMISSIONS.ROLES.UPDATE, { roleId: 1, ...dto });
      });
    });

    it('should handle update errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Role not found'))
      );

      service.updateRole(1, {} as any).subscribe({
        error: (error) => {
          expect(error.message).toContain('not found');
        }
      });
    });
  });

  describe('deleteRole()', () => {
    it('should delete role', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.deleteRole(1).subscribe(() => {
        expect(apiServiceMock.post).toHaveBeenCalledWith(API_ENDPOINTS.PERMISSIONS.ROLES.DELETE, { roleId: 1 });
      });
    });

    it('should handle delete errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Cannot delete system role'))
      );

      service.deleteRole(1).subscribe({
        error: (error) => {
          expect(error.message).toContain('Cannot delete');
        }
      });
    });
  });

  describe('getAllModules()', () => {
    it('should get all modules', () => {
      const mockModules = [
        { module_id: 1, module_code: 'USER_MGMT', module_name: 'User Management' }
      ];
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: mockModules
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.getAllModules().subscribe(modules => {
        expect(modules).toEqual(mockModules);
      });
    });

    it('should handle errors and return empty array', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Error'))
      );

      service.getAllModules().subscribe(modules => {
        expect(modules).toEqual([]);
      });
    });
  });

  describe('getAllActions()', () => {
    it('should get all actions', () => {
      const mockActions = [
        { action_id: 1, action_code: 'VIEW', action_name: 'View' }
      ];
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: mockActions
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.getAllActions().subscribe(actions => {
        expect(actions).toEqual(mockActions);
      });
    });

    it('should handle errors and return empty array', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Error'))
      );

      service.getAllActions().subscribe(actions => {
        expect(actions).toEqual([]);
      });
    });
  });

  describe('grantPermission()', () => {
    it('should grant permission to role', () => {
      const dto = { role_id: 1, module_action_id: 5 };
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.grantPermission(dto).subscribe(() => {
        expect(apiServiceMock.post).toHaveBeenCalledWith(API_ENDPOINTS.PERMISSIONS.GRANT, dto);
      });
    });

    it('should clear cache after granting', () => {
      const dto = { role_id: 1, module_action_id: 5 };
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));
      service['permissionCache'].set('TEST.KEY', true);

      service.grantPermission(dto).subscribe(() => {
        expect(service['permissionCache'].size).toBe(0);
      });
    });

    it('should handle grant errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Permission already granted'))
      );

      service.grantPermission({} as any).subscribe({
        error: (error) => {
          expect(error.message).toContain('already granted');
        }
      });
    });
  });

  describe('revokePermission()', () => {
    it('should revoke permission from role', () => {
      const dto = { role_id: 1, module_action_id: 5 };
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.revokePermission(dto).subscribe(() => {
        expect(apiServiceMock.post).toHaveBeenCalledWith(API_ENDPOINTS.PERMISSIONS.REVOKE, dto);
      });
    });

    it('should clear cache after revoking', () => {
      const dto = { role_id: 1, module_action_id: 5 };
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));
      service['permissionCache'].set('TEST.KEY', true);

      service.revokePermission(dto).subscribe(() => {
        expect(service['permissionCache'].size).toBe(0);
      });
    });

    it('should handle revoke errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Permission not granted'))
      );

      service.revokePermission({} as any).subscribe({
        error: (error) => {
          expect(error.message).toContain('not granted');
        }
      });
    });
  });

  describe('createModule()', () => {
    it('should create new module', () => {
      const dto = { module_code: 'REPORTS', module_name: 'Reports', display_order: 1 };
      const mockResponse: ApiResponse<{ moduleId: number }> = {
        success: true,
        data: { moduleId: 10 }
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.createModule(dto).subscribe(moduleId => {
        expect(moduleId).toBe(10);
      });
    });

    it('should handle create errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Duplicate module code'))
      );

      service.createModule({} as any).subscribe({
        error: (error) => {
          expect(error.message).toContain('Duplicate');
        }
      });
    });
  });

  describe('updateModule()', () => {
    it('should update module', () => {
      const dto = { module_name: 'Updated Reports' };
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.updateModule(1, dto).subscribe(() => {
        expect(apiServiceMock.post).toHaveBeenCalled();
      });
    });

    it('should handle update errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Module not found'))
      );

      service.updateModule(1, {} as any).subscribe({
        error: (error) => {
          expect(error.message).toContain('not found');
        }
      });
    });
  });

  describe('deleteModule()', () => {
    it('should delete module', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.deleteModule(1).subscribe(() => {
        expect(apiServiceMock.post).toHaveBeenCalled();
      });
    });

    it('should handle delete errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Module in use'))
      );

      service.deleteModule(1).subscribe({
        error: (error) => {
          expect(error.message).toContain('in use');
        }
      });
    });
  });

  describe('createAction()', () => {
    it('should create new action', () => {
      const dto = { action_code: 'APPROVE', action_name: 'Approve' };
      const mockResponse: ApiResponse<{ actionId: number }> = {
        success: true,
        data: { actionId: 15 }
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.createAction(dto).subscribe(actionId => {
        expect(actionId).toBe(15);
      });
    });

    it('should handle create errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Duplicate action code'))
      );

      service.createAction({} as any).subscribe({
        error: (error) => {
          expect(error.message).toContain('Duplicate');
        }
      });
    });
  });

  describe('updateAction()', () => {
    it('should update action', () => {
      const dto = { action_name: 'Updated Approve' };
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.updateAction(1, dto).subscribe(() => {
        expect(apiServiceMock.post).toHaveBeenCalled();
      });
    });

    it('should handle update errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Action not found'))
      );

      service.updateAction(1, {} as any).subscribe({
        error: (error) => {
          expect(error.message).toContain('not found');
        }
      });
    });
  });

  describe('deleteAction()', () => {
    it('should delete action', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.deleteAction(1).subscribe(() => {
        expect(apiServiceMock.post).toHaveBeenCalled();
      });
    });

    it('should handle delete errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Action in use'))
      );

      service.deleteAction(1).subscribe({
        error: (error) => {
          expect(error.message).toContain('in use');
        }
      });
    });
  });

  describe('getAllModuleActions()', () => {
    it('should get all module-actions', () => {
      const mockModuleActions = [
        { module_action_id: 1, module_id: 1, action_id: 1 }
      ];
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: mockModuleActions
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.getAllModuleActions().subscribe(moduleActions => {
        expect(moduleActions).toEqual(mockModuleActions);
      });
    });

    it('should handle errors and return empty array', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Error'))
      );

      service.getAllModuleActions().subscribe(moduleActions => {
        expect(moduleActions).toEqual([]);
      });
    });
  });

  describe('createModuleAction()', () => {
    it('should create module-action', () => {
      const dto = { module_id: 1, action_id: 2 };
      const mockResponse: ApiResponse<{ moduleActionId: number }> = {
        success: true,
        data: { moduleActionId: 20 }
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.createModuleAction(dto).subscribe(moduleActionId => {
        expect(moduleActionId).toBe(20);
      });
    });

    it('should handle create errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Duplicate combination'))
      );

      service.createModuleAction({} as any).subscribe({
        error: (error) => {
          expect(error.message).toContain('Duplicate');
        }
      });
    });
  });

  describe('updateModuleAction()', () => {
    it('should update module-action', () => {
      const dto = { is_active: false };
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.updateModuleAction(1, dto).subscribe(() => {
        expect(apiServiceMock.post).toHaveBeenCalled();
      });
    });

    it('should handle update errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Module-action not found'))
      );

      service.updateModuleAction(1, {} as any).subscribe({
        error: (error) => {
          expect(error.message).toContain('not found');
        }
      });
    });
  });

  describe('deleteModuleAction()', () => {
    it('should delete module-action', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.deleteModuleAction(1).subscribe(() => {
        expect(apiServiceMock.post).toHaveBeenCalled();
      });
    });

    it('should handle delete errors', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Module-action in use'))
      );

      service.deleteModuleAction(1).subscribe({
        error: (error) => {
          expect(error.message).toContain('in use');
        }
      });
    });
  });
});
