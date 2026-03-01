import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { permissionGuard, permissionAnyGuard, permissionAllGuard } from './permission.guard';
import { PermissionService } from '../services/permission.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { UserPermissionsResponse, ModulePermissions, CategoryPermissions } from '../../shared/models/permission.model';
import { APP_ROUTES } from '../constants';

describe('Permission Guards', () => {
  let permissionServiceMock: any;
  let routerMock: any;
  let route: ActivatedRouteSnapshot;
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
      { action_code: 'VIEW', action_name: 'View' },
      { action_code: 'UPDATE', action_name: 'Update' }
    ]
  };

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

  beforeEach(() => {
    userPermissionsSubject = new BehaviorSubject<UserPermissionsResponse | null>(mockPermissions);

    permissionServiceMock = {
      userPermissions$: userPermissionsSubject.asObservable(),
      hasPermission: vi.fn(),
      hasAnyPermission: vi.fn(),
      hasAllPermissions: vi.fn(),
      loadUserPermissions: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: PermissionService, useValue: permissionServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    route = { data: {} } as ActivatedRouteSnapshot;
  });

  describe('permissionGuard', () => {
    describe('Service Creation', () => {
      it('should be defined', () => {
        expect(permissionGuard).toBeDefined();
      });
    });

    describe('Permission Format - String', () => {
      it('should allow access with valid permission string format', () => {
        route.data = { permission: 'USER_MGMT.VIEW' };
        permissionServiceMock.hasPermission.mockReturnValue(of(true));

        TestBed.runInInjectionContext(() => {
          (permissionGuard(route, {} as any) as Observable<boolean>).subscribe((result: boolean) => {
            expect(result).toBe(true);
            expect(permissionServiceMock.hasPermission).toHaveBeenCalledWith('USER_MGMT', 'VIEW');
            expect(routerMock.navigate).not.toHaveBeenCalled();
            
          });
        });
      });

      it('should deny access with invalid string format (no dot)', () => {
        route.data = { permission: 'USER_MGMT' };

        TestBed.runInInjectionContext(() => {
          const result = permissionGuard(route, {} as any);
          expect(result).toBe(false);
          expect(routerMock.navigate).toHaveBeenCalledWith([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
        });
      });

      it('should deny access with invalid string format (too many dots)', () => {
        route.data = { permission: 'USER_MGMT.VIEW.EXTRA' };

        TestBed.runInInjectionContext(() => {
          const result = permissionGuard(route, {} as any);
          expect(result).toBe(false);
          expect(routerMock.navigate).toHaveBeenCalledWith([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
        });
      });
    });

    describe('Permission Format - Array', () => {
      it('should allow access with valid array format', () => {
        route.data = { permission: ['USER_MGMT', 'VIEW'] };
        permissionServiceMock.hasPermission.mockReturnValue(of(true));

        TestBed.runInInjectionContext(() => {
          (permissionGuard(route, {} as any) as Observable<boolean>).subscribe((result: boolean) => {
            expect(result).toBe(true);
            expect(permissionServiceMock.hasPermission).toHaveBeenCalledWith('USER_MGMT', 'VIEW');
            
          });
        });
      });

      it('should deny access with invalid array format (wrong length)', () => {
        route.data = { permission: ['USER_MGMT'] };

        TestBed.runInInjectionContext(() => {
          const result = permissionGuard(route, {} as any);
          expect(result).toBe(false);
          expect(routerMock.navigate).toHaveBeenCalledWith([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
        });
      });
    });

    describe('Missing Permission Data', () => {
      it('should deny access when permission data is missing', () => {
        route.data = {};

        TestBed.runInInjectionContext(() => {
          const result = permissionGuard(route, {} as any);
          expect(result).toBe(false);
          expect(routerMock.navigate).toHaveBeenCalledWith([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
        });
      });
    });

    describe('Permission Checking', () => {
      it('should deny access when user lacks permission', () => {
        route.data = { permission: 'USER_MGMT.DELETE' };
        permissionServiceMock.hasPermission.mockReturnValue(of(false));

        TestBed.runInInjectionContext(() => {
          (permissionGuard(route, {} as any) as Observable<boolean>).subscribe((result: boolean) => {
            expect(result).toBe(false);
            expect(routerMock.navigate).toHaveBeenCalledWith([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
            
          });
        });
      });

      it('should allow access when user has permission', () => {
        route.data = { permission: 'USER_MGMT.VIEW' };
        permissionServiceMock.hasPermission.mockReturnValue(of(true));

        TestBed.runInInjectionContext(() => {
          (permissionGuard(route, {} as any) as Observable<boolean>).subscribe((result: boolean) => {
            expect(result).toBe(true);
            
          });
        });
      });
    });

    describe('Permissions Not Loaded', () => {
      it('should load permissions if not yet loaded', () => {
        userPermissionsSubject.next(null);
        route.data = { permission: 'USER_MGMT.VIEW' };
        
        permissionServiceMock.loadUserPermissions.mockReturnValue(of(mockPermissions));
        permissionServiceMock.hasPermission.mockReturnValue(of(true));

        TestBed.runInInjectionContext(() => {
          (permissionGuard(route, {} as any) as Observable<boolean>).subscribe((result: boolean) => {
            expect(result).toBe(true);
            expect(permissionServiceMock.loadUserPermissions).toHaveBeenCalled();
            
          });
        });
      });

      it('should load permissions if empty', () => {
        const emptyPermissions: UserPermissionsResponse = {
          categories: [],
          uncategorized_modules: []
        };
        userPermissionsSubject.next(emptyPermissions);
        route.data = { permission: 'USER_MGMT.VIEW' };
        
        permissionServiceMock.loadUserPermissions.mockReturnValue(of(mockPermissions));
        permissionServiceMock.hasPermission.mockReturnValue(of(true));

        TestBed.runInInjectionContext(() => {
          (permissionGuard(route, {} as any) as Observable<boolean>).subscribe((result: boolean) => {
            expect(result).toBe(true);
            expect(permissionServiceMock.loadUserPermissions).toHaveBeenCalled();
            
          });
        });
      });
    });
  });

  describe('permissionAnyGuard', () => {
    describe('Service Creation', () => {
      it('should be defined', () => {
        expect(permissionAnyGuard).toBeDefined();
      });
    });

    describe('Multiple Permissions - ANY', () => {
      it('should allow access when user has at least one permission', () => {
        route.data = { 
          permissions: [
            ['USER_MGMT', 'VIEW'],
            ['ROLE_MGMT', 'VIEW']
          ]
        };
        permissionServiceMock.hasAnyPermission.mockReturnValue(of(true));

        TestBed.runInInjectionContext(() => {
          (permissionAnyGuard(route, {} as any) as Observable<boolean>).subscribe((result: boolean) => {
            expect(result).toBe(true);
            expect(permissionServiceMock.hasAnyPermission).toHaveBeenCalledWith([
              ['USER_MGMT', 'VIEW'],
              ['ROLE_MGMT', 'VIEW']
            ]);
            
          });
        });
      });

      it('should deny access when user lacks all permissions', () => {
        route.data = { 
          permissions: [
            ['USER_MGMT', 'DELETE'],
            ['ROLE_MGMT', 'DELETE']
          ]
        };
        permissionServiceMock.hasAnyPermission.mockReturnValue(of(false));

        TestBed.runInInjectionContext(() => {
          (permissionAnyGuard(route, {} as any) as Observable<boolean>).subscribe((result: boolean) => {
            expect(result).toBe(false);
            expect(routerMock.navigate).toHaveBeenCalledWith([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
            
          });
        });
      });
    });

    describe('Invalid Data', () => {
      it('should deny access when permissions array is missing', () => {
        route.data = {};

        TestBed.runInInjectionContext(() => {
          const result = permissionAnyGuard(route, {} as any);
          expect(result).toBe(false);
          expect(routerMock.navigate).toHaveBeenCalledWith([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
        });
      });

      it('should deny access when permissions is not an array', () => {
        route.data = { permissions: 'USER_MGMT.VIEW' };

        TestBed.runInInjectionContext(() => {
          const result = permissionAnyGuard(route, {} as any);
          expect(result).toBe(false);
          expect(routerMock.navigate).toHaveBeenCalledWith([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
        });
      });
    });

    describe('Permissions Not Loaded', () => {
      it('should load permissions before checking', () => {
        userPermissionsSubject.next(null);
        route.data = { 
          permissions: [
            ['USER_MGMT', 'VIEW']
          ]
        };
        
        permissionServiceMock.loadUserPermissions.mockReturnValue(of(mockPermissions));
        permissionServiceMock.hasAnyPermission.mockReturnValue(of(true));

        TestBed.runInInjectionContext(() => {
          (permissionAnyGuard(route, {} as any) as Observable<boolean>).subscribe((result: boolean) => {
            expect(result).toBe(true);
            expect(permissionServiceMock.loadUserPermissions).toHaveBeenCalled();
            
          });
        });
      });
    });
  });

  describe('permissionAllGuard', () => {
    describe('Service Creation', () => {
      it('should be defined', () => {
        expect(permissionAllGuard).toBeDefined();
      });
    });

    describe('Multiple Permissions - ALL', () => {
      it('should allow access when user has all permissions', () => {
        route.data = { 
          permissions: [
            ['USER_MGMT', 'VIEW'],
            ['ROLE_MGMT', 'VIEW']
          ]
        };
        permissionServiceMock.hasAllPermissions.mockReturnValue(of(true));

        TestBed.runInInjectionContext(() => {
          (permissionAllGuard(route, {} as any) as Observable<boolean>).subscribe((result: boolean) => {
            expect(result).toBe(true);
            expect(permissionServiceMock.hasAllPermissions).toHaveBeenCalledWith([
              ['USER_MGMT', 'VIEW'],
              ['ROLE_MGMT', 'VIEW']
            ]);
            
          });
        });
      });

      it('should deny access when user lacks any permission', () => {
        route.data = { 
          permissions: [
            ['USER_MGMT', 'VIEW'],
            ['ROLE_MGMT', 'DELETE']
          ]
        };
        permissionServiceMock.hasAllPermissions.mockReturnValue(of(false));

        TestBed.runInInjectionContext(() => {
          (permissionAllGuard(route, {} as any) as Observable<boolean>).subscribe((result: boolean) => {
            expect(result).toBe(false);
            expect(routerMock.navigate).toHaveBeenCalledWith([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
            
          });
        });
      });
    });

    describe('Invalid Data', () => {
      it('should deny access when permissions array is missing', () => {
        route.data = {};

        TestBed.runInInjectionContext(() => {
          const result = permissionAllGuard(route, {} as any);
          expect(result).toBe(false);
          expect(routerMock.navigate).toHaveBeenCalledWith([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
        });
      });
    });

    describe('Permissions Not Loaded', () => {
      it('should load permissions before checking', () => {
        userPermissionsSubject.next(null);
        route.data = { 
          permissions: [
            ['USER_MGMT', 'VIEW'],
            ['ROLE_MGMT', 'VIEW']
          ]
        };
        
        permissionServiceMock.loadUserPermissions.mockReturnValue(of(mockPermissions));
        permissionServiceMock.hasAllPermissions.mockReturnValue(of(true));

        TestBed.runInInjectionContext(() => {
          (permissionAllGuard(route, {} as any) as Observable<boolean>).subscribe((result: boolean) => {
            expect(result).toBe(true);
            expect(permissionServiceMock.loadUserPermissions).toHaveBeenCalled();
            
          });
        });
      });
    });
  });
});
