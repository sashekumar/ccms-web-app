import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RoleService, RoleConfig, MenuItem } from './role.service';
import { take } from 'rxjs';

describe('RoleService', () => {
  let service: RoleService;

  const mockMenuItem1: MenuItem = {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard-icon',
    route: '/dashboard'
  };

  const mockMenuItem2: MenuItem = {
    id: 'users',
    label: 'Users',
    icon: 'users-icon',
    route: '/users',
    children: [
      { id: 'users-list', label: 'User List', icon: 'list-icon', route: '/users/list' }
    ]
  };

  const mockRole1: RoleConfig = {
    roleId: 1,
    roleName: 'admin',
    roleDisplayName: 'Administrator',
    description: 'System administrator',
    menuItems: [mockMenuItem1, mockMenuItem2]
  };

  const mockRole2: RoleConfig = {
    roleId: 2,
    roleName: 'user',
    roleDisplayName: 'Regular User',
    description: 'Regular user',
    menuItems: [mockMenuItem1]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RoleService]
    });

    service = TestBed.inject(RoleService);
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty roles', () => {
      service.rolesConfig$.pipe(take(1)).subscribe(roles => {
        expect(roles).toEqual([]);
      });
    });

    it('should initialize with null selected role', () => {
      service.selectedRole$.pipe(take(1)).subscribe(role => {
        expect(role).toBeNull();
      });
    });
  });

  describe('initializeRoles()', () => {
    beforeEach(() => {
      // Manually populate roles for testing
      service['rolesConfigSubject'].next([mockRole1, mockRole2]);
    });

    it('should initialize admin user with first role', () => {
      service.initializeRoles(0);

      service.selectedRole$.pipe(take(1)).subscribe({
        next: (role) => {
          expect(role).toEqual(mockRole1);
        }
      });

      expect(sessionStorage.getItem('selectedRole')).toBe('1');
    });

    it('should initialize regular user with their specific role', () => {
      service.initializeRoles(2);

      service.selectedRole$.pipe(take(1)).subscribe({
        next: (role) => {
          expect(role).toEqual(mockRole2);
          expect(role?.roleId).toBe(2);
        }
      });

      expect(sessionStorage.getItem('selectedRole')).toBe('2');
    });

    it('should handle non-existent role gracefully', () => {
      service.initializeRoles(999);

      service.selectedRole$.pipe(take(1)).subscribe({
        next: (role) => {
          expect(role).toBeNull();
        }
      });
    });

    it('should not override selected role for admin if already set', () => {
      // Set a role first
      service['selectedRoleSubject'].next(mockRole2);
      
      // Initialize with admin - should not change since role already selected
      service.initializeRoles(0);

      service.selectedRole$.pipe(take(1)).subscribe({
        next: (role) => {
          expect(role).toEqual(mockRole2);
        }
      });
    });
  });

  describe('isAdmin()', () => {
    it('should return true for roleId 0', () => {
      expect(service.isAdmin(0)).toBe(true);
    });

    it('should return false for non-zero roleId', () => {
      expect(service.isAdmin(1)).toBe(false);
      expect(service.isAdmin(2)).toBe(false);
      expect(service.isAdmin(999)).toBe(false);
    });
  });

  describe('getAllRoles()', () => {
    it('should return observable of roles', () => {
      const testRoles = [mockRole1, mockRole2];
      service['rolesConfigSubject'].next(testRoles);

      service.getAllRoles().pipe(take(1)).subscribe(roles => {
        expect(roles).toEqual(testRoles);
        expect(roles.length).toBe(2);
      });
    });

    it('should return empty array when no roles configured', () => {
      service.getAllRoles().pipe(take(1)).subscribe(roles => {
        expect(roles).toEqual([]);
      });
    });
  });

  describe('getSelectedRole()', () => {
    it('should return currently selected role', () => {
      service['selectedRoleSubject'].next(mockRole1);

      service.getSelectedRole().pipe(take(1)).subscribe(role => {
        expect(role).toEqual(mockRole1);
      });
    });

    it('should return null when no role selected', () => {
      service.getSelectedRole().pipe(take(1)).subscribe(role => {
        expect(role).toBeNull();
      });
    });
  });

  describe('setSelectedRole()', () => {
    beforeEach(() => {
      service['rolesConfigSubject'].next([mockRole1, mockRole2]);
    });

    it('should set selected role by roleId', () => {
      service.setSelectedRole(2);

      service.selectedRole$.pipe(take(1)).subscribe({
        next: (role) => {
          expect(role).toEqual(mockRole2);
        }
      });

      expect(sessionStorage.getItem('selectedRole')).toBe('2');
    });

    it('should update sessionStorage when role changed', () => {
      service.setSelectedRole(1);
      expect(sessionStorage.getItem('selectedRole')).toBe('1');

      service.setSelectedRole(2);
      expect(sessionStorage.getItem('selectedRole')).toBe('2');
    });

    it('should not change role if roleId not found', () => {
      service['selectedRoleSubject'].next(mockRole1);
      
      service.setSelectedRole(999);

      service.selectedRole$.pipe(take(1)).subscribe({
        next: (role) => {
          expect(role).toEqual(mockRole1); // Should remain unchanged
        }
      });
    });
  });

  describe('getMenuItemsForRole()', () => {
    beforeEach(() => {
      service['rolesConfigSubject'].next([mockRole1, mockRole2]);
    });

    it('should return menu items for specific role', () => {
      service.getMenuItemsForRole(1).pipe(take(1)).subscribe(menuItems => {
        expect(menuItems).toEqual(mockRole1.menuItems);
        expect(menuItems.length).toBe(2);
      });
    });

    it('should return empty array for non-existent role', () => {
      service.getMenuItemsForRole(999).pipe(take(1)).subscribe(menuItems => {
        expect(menuItems).toEqual([]);
      });
    });

    it('should return correct menu items for different roles', () => {
      service.getMenuItemsForRole(2).pipe(take(1)).subscribe(menuItems => {
        expect(menuItems).toEqual(mockRole2.menuItems);
        expect(menuItems.length).toBe(1);
      });
    });
  });

  describe('getCurrentMenuItems()', () => {
    it('should return menu items for selected role', () => {
      service['selectedRoleSubject'].next(mockRole1);

      service.getCurrentMenuItems().pipe(take(1)).subscribe(menuItems => {
        expect(menuItems).toEqual(mockRole1.menuItems);
      });
    });

    it('should return empty array when no role selected', () => {
      service.getCurrentMenuItems().pipe(take(1)).subscribe(menuItems => {
        expect(menuItems).toEqual([]);
      });
    });
  });

  describe('Deprecation Warning', () => {
    it('should log deprecation warning on initialization', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      // Create new instance to trigger constructor
      const newService = new RoleService();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RoleService is deprecated. Use PermissionService for permission-based menu items.'
      );
      
      consoleSpy.mockRestore();
    });
  });
});
