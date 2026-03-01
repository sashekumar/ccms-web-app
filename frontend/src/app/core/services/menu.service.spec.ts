import { TestBed } from '@angular/core/testing';
import { MenuService, MenuItem } from './menu.service';
import { PermissionService } from './permission.service';
import { LoggerService } from './logger.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { UserPermissionsResponse, ModulePermissions, CategoryPermissions } from '../../shared/models/permission.model';
import { take } from 'rxjs/operators';

describe('MenuService', () => {
  let service: MenuService;
  let permissionServiceMock: any;
  let loggerServiceMock: { error: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; debug: ReturnType<typeof vi.fn> };
  let userPermissionsSubject: BehaviorSubject<UserPermissionsResponse | null>;

  const mockModule1: ModulePermissions = {
    module_code: 'USER_MGMT',
    module_name: 'User Management',
    module_route: '/admin/users',
    icon: 'users-icon',
    display_order: 1,
    actions: [
      { action_code: 'VIEW', action_name: 'View' },
      { action_code: 'CREATE', action_name: 'Create' }
    ]
  };

  const mockModule2: ModulePermissions = {
    module_code: 'ROLE_MGMT',
    module_name: 'Role Management',
    module_route: '/admin/roles',
    icon: 'shield-icon',
    display_order: 2,
    actions: [
      { action_code: 'VIEW', action_name: 'View' }
    ]
  };

  const mockModuleWithoutView: ModulePermissions = {
    module_code: 'NO_VIEW',
    module_name: 'No View Module',
    module_route: '/no-view',
    icon: 'hidden-icon',
    display_order: 3,
    actions: [
      { action_code: 'CREATE', action_name: 'Create' }
    ]
  };

  const detailViewModule: ModulePermissions = {
    module_code: 'ROLE_PERMISSION_MANAGEMENT',
    module_name: 'Role Permissions',
    module_route: '/admin/roles/permissions',
    icon: 'key-icon',
    display_order: 4,
    actions: [
      { action_code: 'VIEW', action_name: 'View' }
    ]
  };

  beforeEach(() => {
    userPermissionsSubject = new BehaviorSubject<UserPermissionsResponse | null>(null);

    permissionServiceMock = {
      userPermissions$: userPermissionsSubject.asObservable(),
      getUserPermissions: vi.fn()
    };

    loggerServiceMock = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        MenuService,
        { provide: PermissionService, useValue: permissionServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock }
      ]
    });

    service = TestBed.inject(MenuService);
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should subscribe to permission changes on initialization', () => {
      expect(permissionServiceMock.userPermissions$).toBeTruthy();
    });
  });

  describe('buildMenuFromPermissions() - Category Structure', () => {
    it('should build menu from category-based permissions', () => {
      const mockCategory: CategoryPermissions = {
        category_code: 'ADMIN',
        category_name: 'Administration',
        category_icon: 'admin-icon',
        display_order: 1,
        modules: [mockModule1, mockModule2]
      };

      const mockPermissions: UserPermissionsResponse = {
        categories: [mockCategory],
        uncategorized_modules: []
      };

      userPermissionsSubject.next(mockPermissions);

      service.menuItems$.pipe(take(1)).subscribe(items => {
        expect(items.length).toBeGreaterThan(0);
        
        // Find the admin category
        const adminCategory = items.find(item => item.id === 'admin');
        expect(adminCategory).toBeTruthy();
        expect(adminCategory?.label).toBe('Administration');
        expect(adminCategory?.children?.length).toBe(2);
      });
    });

    it('should filter out modules without VIEW permission', () => {
      const mockCategory: CategoryPermissions = {
        category_code: 'ADMIN',
        category_name: 'Administration',
        category_icon: 'admin-icon',
        display_order: 1,
        modules: [mockModule1, mockModuleWithoutView]
      };

      const mockPermissions: UserPermissionsResponse = {
        categories: [mockCategory],
        uncategorized_modules: []
      };

      userPermissionsSubject.next(mockPermissions);

      service.menuItems$.pipe(take(1)).subscribe(items => {
        const adminCategory = items.find(item => item.id === 'admin');
        // Should only have 1 module (mockModule1) since mockModuleWithoutView has no VIEW
        expect(adminCategory?.children?.length).toBe(1);
        expect(adminCategory?.children?.[0].moduleCode).toBe('USER_MGMT');
      });
    });

    it('should filter out detail view modules', () => {
      const mockCategory: CategoryPermissions = {
        category_code: 'ADMIN',
        category_name: 'Administration',
        category_icon: 'admin-icon',
        display_order: 1,
        modules: [mockModule1, detailViewModule]
      };

      const mockPermissions: UserPermissionsResponse = {
        categories: [mockCategory],
        uncategorized_modules: []
      };

      userPermissionsSubject.next(mockPermissions);

      service.menuItems$.pipe(take(1)).subscribe(items => {
        const adminCategory = items.find(item => item.id === 'admin');
        // Should only have mockModule1, detailViewModule filtered out
        expect(adminCategory?.children?.length).toBe(1);
        expect(adminCategory?.children?.[0].moduleCode).toBe('USER_MGMT');
      });
    });

    it('should not include empty categories', () => {
      const emptyCategory: CategoryPermissions = {
        category_code: 'EMPTY',
        category_name: 'Empty Category',
        category_icon: 'empty-icon',
        display_order: 1,
        modules: [mockModuleWithoutView] // No VIEW permission
      };

      const mockPermissions: UserPermissionsResponse = {
        categories: [emptyCategory],
        uncategorized_modules: []
      };

      userPermissionsSubject.next(mockPermissions);

      service.menuItems$.pipe(take(1)).subscribe(items => {
        const emptyItem = items.find(item => item.id === 'empty');
        expect(emptyItem).toBeUndefined();
      });
    });
  });

  describe('buildMenuFromPermissions() - Uncategorized Modules', () => {
    it('should add uncategorized modules as top-level items', () => {
      const mockPermissions: UserPermissionsResponse = {
        categories: [],
        uncategorized_modules: [mockModule1, mockModule2]
      };

      userPermissionsSubject.next(mockPermissions);

      service.menuItems$.pipe(take(1)).subscribe(items => {
        // Should have 2 uncategorized modules + logout
        const userMgmt = items.find(item => item.moduleCode === 'USER_MGMT');
        const roleMgmt = items.find(item => item.moduleCode === 'ROLE_MGMT');
        
        expect(userMgmt).toBeTruthy();
        expect(roleMgmt).toBeTruthy();
        expect(userMgmt?.route).toBe('/admin/users');
        expect(roleMgmt?.route).toBe('/admin/roles');
      });
    });

    it('should place uncategorized modules before categories', () => {
      const mockCategory: CategoryPermissions = {
        category_code: 'ADMIN',
        category_name: 'Administration',
        category_icon: 'admin-icon',
        display_order: 1,
        modules: [mockModule2]
      };

      const mockPermissions: UserPermissionsResponse = {
        categories: [mockCategory],
        uncategorized_modules: [mockModule1]
      };

      userPermissionsSubject.next(mockPermissions);

      service.menuItems$.pipe(take(1)).subscribe(items => {
        // First item should be uncategorized (exclude logout which is always last)
        const nonLogoutItems = items.filter(item => item.id !== 'logout');
        expect(nonLogoutItems[0].moduleCode).toBe('USER_MGMT');
        expect(nonLogoutItems[1].id).toBe('admin');
      });
    });
  });

  describe('buildMenuFromPermissions() - Flat Structure (Legacy)', () => {
    it('should support old flat module structure', () => {
      const mockPermissions: UserPermissionsResponse = {
        modules: [mockModule1, mockModule2]
      } as any;

      userPermissionsSubject.next(mockPermissions);

      service.menuItems$.pipe(take(1)).subscribe(items => {
        const userMgmt = items.find(item => item.moduleCode === 'USER_MGMT');
        const roleMgmt = items.find(item => item.moduleCode === 'ROLE_MGMT');
        
        expect(userMgmt).toBeTruthy();
        expect(roleMgmt).toBeTruthy();
      });
    });
  });

  describe('Default Menu', () => {
    it('should add logout item to all menus', () => {
      const mockPermissions: UserPermissionsResponse = {
        categories: [],
        uncategorized_modules: [mockModule1]
      };

      userPermissionsSubject.next(mockPermissions);

      service.menuItems$.pipe(take(1)).subscribe(items => {
        const logoutItem = items.find(item => item.id === 'logout');
        expect(logoutItem).toBeTruthy();
        expect(logoutItem?.label).toBe('Logout');
        expect(logoutItem?.icon).toBe('sign-out-alt');
        expect(logoutItem?.route).toBeUndefined();
      });
    });

    it('should show dashboard if no menu items available', () => {
      const mockPermissions: UserPermissionsResponse = {
        categories: [],
        uncategorized_modules: []
      };

      userPermissionsSubject.next(mockPermissions);

      service.menuItems$.pipe(take(1)).subscribe(items => {
        const dashboard = items.find(item => item.id === 'dashboard');
        expect(dashboard).toBeTruthy();
        expect(dashboard?.label).toBe('Dashboard');
        expect(dashboard?.route).toBe('/dashboard');
      });
    });

    it('should set default menu items on permission error', () => {
      // Simulate error by calling the error handler
      userPermissionsSubject.error(new Error('Permission load failed'));

      // Create new service instance to trigger error subscription
      const newService = new MenuService(permissionServiceMock, loggerServiceMock as any);
      
      newService.menuItems$.pipe(take(1)).subscribe(items => {
        const dashboard = items.find(item => item.id === 'dashboard');
        const logout = items.find(item => item.id === 'logout');
        
        expect(dashboard).toBeTruthy();
        expect(logout).toBeTruthy();
        expect(items.length).toBe(2);
      });
    });
  });

  describe('loadMenuItems()', () => {
    it('should call getUserPermissions and build menu', () => {
      const mockPermissions: UserPermissionsResponse = {
        categories: [],
        uncategorized_modules: [mockModule1]
      };

      permissionServiceMock.getUserPermissions.mockReturnValue(of(mockPermissions));

      service.loadMenuItems();

      expect(permissionServiceMock.getUserPermissions).toHaveBeenCalled();
    });

    it('should set default menu on error', () => {
      permissionServiceMock.getUserPermissions.mockReturnValue(
        throwError(() => new Error('Load failed'))
      );

      service.loadMenuItems();

      service.menuItems$.pipe(take(1)).subscribe(items => {
        const dashboard = items.find(item => item.id === 'dashboard');
        expect(dashboard).toBeTruthy();
      });
    });
  });

  describe('reloadMenu()', () => {
    it('should trigger menu reload', () => {
      const mockPermissions: UserPermissionsResponse = {
        categories: [],
        uncategorized_modules: [mockModule1]
      };

      permissionServiceMock.getUserPermissions.mockReturnValue(of(mockPermissions));

      service.reloadMenu();

      expect(permissionServiceMock.getUserPermissions).toHaveBeenCalled();
    });
  });

  describe('getCurrentMenuItems()', () => {
    it('should return menuItems$ observable', () => {
      const observable = service.getCurrentMenuItems();
      expect(observable).toBe(service.menuItems$);
    });
  });

  describe('Menu Item Structure', () => {
    it('should create menu items with correct properties', () => {
      const mockPermissions: UserPermissionsResponse = {
        categories: [],
        uncategorized_modules: [mockModule1]
      };

      userPermissionsSubject.next(mockPermissions);

      service.menuItems$.pipe(take(1)).subscribe(items => {
        const userMgmt = items.find(item => item.moduleCode === 'USER_MGMT');
        
        expect(userMgmt?.id).toBe('user-mgmt');
        expect(userMgmt?.label).toBe('User Management');
        expect(userMgmt?.icon).toBe('users-icon');
        expect(userMgmt?.route).toBe('/admin/users');
        expect(userMgmt?.moduleCode).toBe('USER_MGMT');
      });
    });

    it('should use fallback icon if not provided', () => {
      const moduleWithoutIcon: ModulePermissions = {
        module_code: 'TEST',
        module_name: 'Test Module',
        module_route: '/test',
        icon: null,
        display_order: 1,
        actions: [{ action_code: 'VIEW', action_name: 'View' }]
      };

      const mockPermissions: UserPermissionsResponse = {
        categories: [],
        uncategorized_modules: [moduleWithoutIcon]
      };

      userPermissionsSubject.next(mockPermissions);

      service.menuItems$.pipe(take(1)).subscribe(items => {
        const testModule = items.find(item => item.moduleCode === 'TEST');
        expect(testModule?.icon).toBe('circle');
      });
    });

    it('should generate route from module code if not provided', () => {
      const moduleWithoutRoute: ModulePermissions = {
        module_code: 'TEST_MODULE',
        module_name: 'Test Module',
        module_route: null,
        icon: 'test-icon',
        display_order: 1,
        actions: [{ action_code: 'VIEW', action_name: 'View' }]
      };

      const mockPermissions: UserPermissionsResponse = {
        categories: [],
        uncategorized_modules: [moduleWithoutRoute]
      };

      userPermissionsSubject.next(mockPermissions);

      service.menuItems$.pipe(take(1)).subscribe(items => {
        const testModule = items.find(item => item.moduleCode === 'TEST_MODULE');
        expect(testModule?.route).toBe('/test-module');
      });
    });

    it('should skip DETAIL_VIEW_MODULES in uncategorized modules', () => {
      const mockDetailViewModule: ModulePermissions = {
        module_code: 'ROLE_PERMISSION_MANAGEMENT',
        module_name: 'Role Permissions',
        module_route: '/admin/roles/permissions',
        icon: 'shield-alt',
        actions: [{ action_code: 'VIEW', action_name: 'View' }]
      };

      const mockRegularModule: ModulePermissions = {
        module_code: 'USER_MANAGEMENT',
        module_name: 'User Management',
        module_route: '/admin/users',
        icon: 'users',
        actions: [{ action_code: 'VIEW', action_name: 'View' }]
      };

      permissionServiceMock.getUserPermissions.mockReturnValue(of({
        categories: [],
        uncategorized_modules: [mockDetailViewModule, mockRegularModule]
      }));

      service.loadMenuItems();

      service.menuItems$.pipe(take(1)).subscribe(items => {
        // Should only include the regular module, not the detail view module
        const regularModule = items.find(item => item.moduleCode === 'USER_MANAGEMENT');
        const detailModule = items.find(item => item.moduleCode === 'ROLE_PERMISSION_MANAGEMENT');
        
        expect(regularModule).toBeDefined();
        expect(detailModule).toBeUndefined();
      });
    });

    it('should skip DETAIL_VIEW_MODULES in old flat structure', () => {
      const mockDetailViewModule: ModulePermissions = {
        module_code: 'USER_ROLE_ASSIGNMENT',
        module_name: 'User Role Assignment',
        module_route: '/admin/users/roles',
        icon: 'user-tag',
        actions: [{ action_code: 'VIEW', action_name: 'View' }]
      };

      const mockRegularModule: ModulePermissions = {
        module_code: 'CATEGORY_MANAGEMENT',
        module_name: 'Category Management',
        module_route: '/admin/categories',
        icon: 'folder',
        actions: [{ action_code: 'VIEW', action_name: 'View' }]
      };

      permissionServiceMock.getUserPermissions.mockReturnValue(of({
        modules: [mockDetailViewModule, mockRegularModule]
      } as any));

      service.loadMenuItems();

      service.menuItems$.pipe(take(1)).subscribe(items => {
        // Should only include the regular module, not the detail view module
        const regularModule = items.find(item => item.moduleCode === 'CATEGORY_MANAGEMENT');
        const detailModule = items.find(item => item.moduleCode === 'USER_ROLE_ASSIGNMENT');
        
        expect(regularModule).toBeDefined();
        expect(detailModule).toBeUndefined();
      });
    });

    it('should handle empty permissions with neither categories nor modules', () => {
      permissionServiceMock.getUserPermissions.mockReturnValue(of({} as any));

      service.loadMenuItems();

      service.menuItems$.pipe(take(1)).subscribe(items => {
        // Should show warning and provide default dashboard + logout
        expect(loggerServiceMock.warn).toHaveBeenCalledWith('No permissions data available for menu building');
        expect(items.length).toBe(2); // Dashboard + Logout
        expect(items[0].id).toBe('dashboard');
        expect(items[1].id).toBe('logout');
      });
    });
  });
});
