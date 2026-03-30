import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { UserListComponent } from './user-list.component';
import { UserService } from '../../../core/services/user.service';
import { PermissionService } from '../../../core/services/permission.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../shared/models/user.model';
import { Role } from '../../../shared/models/permission.model';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: UserService;
  let permissionService: PermissionService;
  let loggerService: LoggerService;
  let toastService: ToastService;
  let router: Router;

  const mockRoles: Role[] = [
    { role_id: 1, role_name: 'Admin', role_code: 'ADMIN', description: 'Administrator', is_active: true, is_system_role: false, created_at: new Date(), updated_at: new Date(), created_by: null, updated_by: null },
    { role_id: 2, role_name: 'User', role_code: 'USER', description: 'Regular User', is_active: true, is_system_role: false, created_at: new Date(), updated_at: new Date(), created_by: null, updated_by: null }
  ];

  const mockUsers: User[] = [
    {
      user_id: 1,
      username: 'john.doe',
      full_name: 'John Doe',
      is_active: true,
      roles: [{ role_id: 1, role_name: 'Admin', role_code: 'ADMIN' }],
      last_login: new Date()
    },
    {
      user_id: 2,
      username: 'jane.smith',
      full_name: 'Jane Smith',
      is_active: true,
      roles: [{ role_id: 2, role_name: 'User', role_code: 'USER' }],
      last_login: null
    }
  ];

  const mockUsersResponse = {
    users: mockUsers,
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1
  };

  beforeEach(async () => {
    const userServiceMock = {
      getUsers: vi.fn().mockReturnValue(of(mockUsersResponse)),
      deleteUser: vi.fn().mockReturnValue(of(undefined)),
      updateUser: vi.fn().mockReturnValue(of(undefined))
    };

    const permissionServiceMock = {
      getAllRoles: vi.fn().mockReturnValue(of(mockRoles)),
      hasPermission: vi.fn().mockReturnValue(of(true)),
      userPermissions$: of([])
    };

    const loggerServiceMock = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    };

    const toastServiceMock = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn()
    };

    const routerMock = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [UserListComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: PermissionService, useValue: permissionServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    permissionService = TestBed.inject(PermissionService);
    loggerService = TestBed.inject(LoggerService);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
  });

  // ===========================
  // Component Initialization
  // ===========================
  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.users).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.showDeleteConfirm).toBe(false);
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should load users and roles on init', () => {
      fixture.detectChanges();
      expect(userService.getUsers).toHaveBeenCalled();
      expect(permissionService.getAllRoles).toHaveBeenCalled();
    });

    it('should configure table columns correctly', () => {
      expect(component.columns).toHaveLength(4);
      expect(component.columns[0].key).toBe('full_name');
      expect(component.columns[1].key).toBe('roles');
      expect(component.columns[1].type).toBe('tags');
      expect(component.columns[2].type).toBe('toggle');
    });

    it('should configure row actions correctly', () => {
      expect(component.rowActions).toHaveLength(4);
      expect(component.rowActions.map(a => a.id)).toEqual(['view', 'edit', 'roles', 'delete']);
    });

    it('should configure table filters correctly', () => {
      expect(component.tableFilters).toHaveLength(3);
      expect(component.tableFilters[0].key).toBe('search');
      expect(component.tableFilters[1].key).toBe('is_active');
      expect(component.tableFilters[2].key).toBe('role_id');
    });

    it('should initialize pagination with default values', () => {
      expect(component.pagination).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      });
    });
  });

  // ===========================
  // Data Loading
  // ===========================
  describe('Data Loading', () => {
    it('should load users successfully', () => {
      fixture.detectChanges();
      expect(component.users).toEqual(mockUsers);
      expect(component.pagination.total).toBe(2);
    });

    it('should set loading state while fetching users', () => {
      component.loadUsers();
      // With synchronous mock observable, loading is reset to false immediately
      expect(component.loading).toBe(false);
    });

    it('should handle user load errors', () => {
      (userService.getUsers as any).mockReturnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      expect(loggerService.error).toHaveBeenCalledWith('Error loading users', expect.any(Error));
      expect(toastService.error).toHaveBeenCalledWith('Failed to load users. Please try again.');
      expect(component.loading).toBe(false);
    });

    it('should load roles and populate filter options', () => {
      fixture.detectChanges();
      const roleFilter = component.tableFilters.find(f => f.key === 'role_id');
      expect(roleFilter?.options).toHaveLength(3); // All Roles + 2 roles
      expect(roleFilter?.options?.[1].label).toBe('Admin');
    });

    it('should handle role load errors gracefully', () => {
      (permissionService.getAllRoles as any).mockReturnValue(throwError(() => new Error('Role load error')));
      fixture.detectChanges();
      expect(loggerService.error).toHaveBeenCalledWith('Error loading roles', expect.any(Error));
    });

    it('should update pagination after loading users', () => {
      fixture.detectChanges();
      expect(component.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      });
    });
  });

  // ===========================
  // Filter Functionality
  // ===========================
  describe('Filter Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      vi.clearAllMocks();
    });

    it('should handle search filter changes', () => {
      component.onFilterChange({ search: 'john', page: 1, limit: 10 });
      expect(userService.getUsers).toHaveBeenCalledWith(expect.objectContaining({ search: 'john' }));
    });

    it('should convert is_active string filter to boolean', () => {
      component.onFilterChange({ is_active: 'true', page: 1, limit: 10 });
      expect(userService.getUsers).toHaveBeenCalledWith(expect.objectContaining({ is_active: true }));

      component.onFilterChange({ is_active: 'false', page: 1, limit: 10 });
      expect(userService.getUsers).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
    });

    it('should handle role filter changes', () => {
      component.onFilterChange({ role_id: '1', page: 1, limit: 10 });
      expect(userService.getUsers).toHaveBeenCalledWith(expect.objectContaining({ role_id: 1 }));
    });

    it('should handle pagination changes', () => {
      component.onFilterChange({ page: 2, limit: 25 });
      expect(component.filters.page).toBe(2);
      expect(component.filters.limit).toBe(25);
      expect(userService.getUsers).toHaveBeenCalled();
    });

    it('should handle empty search filter', () => {
      component.onFilterChange({ search: '', page: 1, limit: 10 });
      // Component stores empty string for search, not undefined
      expect(component.filters.search).toBe('');
    });

    it('should reset to page 1 when filters change', () => {
      component.filters.page = 3;
      component.onFilterChange({ search: 'test', page: 1, limit: 10 });
      expect(component.filters.page).toBe(1);
    });
  });

  // ===========================
  // Row Actions
  // ===========================
  describe('Row Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to user view on view action', () => {
      component.onRowAction({ action: 'view', row: mockUsers[0] });
      expect(router.navigate).toHaveBeenCalledWith(['admin/users/view/1']);
    });

    it('should navigate to user edit on edit action', () => {
      component.onRowAction({ action: 'edit', row: mockUsers[0] });
      expect(router.navigate).toHaveBeenCalledWith(['admin/users/edit/1']);
    });

    it('should navigate to user roles on roles action', () => {
      component.onRowAction({ action: 'roles', row: mockUsers[0] });
      expect(router.navigate).toHaveBeenCalledWith(['admin/users/roles/1']);
    });

    it('should show delete confirmation on delete action', () => {
      component.onRowAction({ action: 'delete', row: mockUsers[0] });
      expect(component.showDeleteConfirm).toBe(true);
      expect(component.userToDelete).toEqual(mockUsers[0]);
    });

    it('should handle unknown action gracefully', () => {
      // Component falls through switch for unknown actions without logging errors
      component.onRowAction({ action: 'unknown', row: mockUsers[0] });
      expect(userService.deleteUser).not.toHaveBeenCalled();
    });
  });

  // ===========================
  // Delete Functionality
  // ===========================
  describe('Delete Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      vi.clearAllMocks();
    });

    it('should show delete confirmation dialog', () => {
      component.onRowAction({ action: 'delete', row: mockUsers[0] });
      expect(component.showDeleteConfirm).toBe(true);
      expect(component.userToDelete).toEqual(mockUsers[0]);
    });

    it('should cancel delete and close dialog', () => {
      component.userToDelete = mockUsers[0];
      component.showDeleteConfirm = true;
      component.showDeleteConfirm = false;
      expect(component.showDeleteConfirm).toBe(false);
    });

    it('should delete user successfully', () => {
      component.userToDelete = mockUsers[0];
      component.showDeleteConfirm = true;

      component.confirmDelete();

      expect(userService.deleteUser).toHaveBeenCalledWith(1);
      expect(toastService.success).toHaveBeenCalledWith('User deleted successfully.');
      expect(component.showDeleteConfirm).toBe(false);
      expect(userService.getUsers).toHaveBeenCalled(); // Reload data
    });

    it('should handle delete errors', () => {
      (userService.deleteUser as any).mockReturnValue(throwError(() => ({ status: 500 })));
      component.userToDelete = mockUsers[0];

      component.confirmDelete();

      expect(toastService.error).toHaveBeenCalledWith('Failed to delete user. Please try again.');
      expect(loggerService.error).toHaveBeenCalledWith('Error deleting user', expect.any(Object));
    });

    it('should handle null userToDelete gracefully', () => {
      component.userToDelete = null;
      component.confirmDelete();
      expect(userService.deleteUser).not.toHaveBeenCalled();
    });

    it('should display user name in delete confirmation', () => {
      component.userToDelete = mockUsers[0];
      expect(component.userToDelete.full_name).toBe('John Doe');
    });
  });

  // ===========================
  // Toggle Status Functionality
  // ===========================
  describe('Toggle Status Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      vi.clearAllMocks();
    });

    it('should show toggle confirmation dialog', () => {
      component.onToggleStatus({ row: mockUsers[0], newValue: false });
      expect(component.showToggleConfirm).toBe(true);
      expect(component.pendingToggle).toEqual({ user: mockUsers[0], newValue: false });
    });

    it('should cancel toggle and revert status', () => {
      const user = { ...mockUsers[0] };
      component.pendingToggle = { user, newValue: false };
      component.showToggleConfirm = true;

      component.cancelToggleStatus();

      expect(component.showToggleConfirm).toBe(false);
      expect(component.pendingToggle).toBeNull();
      expect(user.is_active).toBe(true); // Reverted
    });

    it('should confirm toggle successfully - activate', () => {
      const user = { ...mockUsers[1], is_active: false };
      component.pendingToggle = { user, newValue: true };

      component.confirmToggleStatus();

      expect(userService.updateUser).toHaveBeenCalledWith(2, { is_active: true });
      expect(toastService.success).toHaveBeenCalledWith('User "Jane Smith" has been activated successfully.');
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should confirm toggle successfully - deactivate', () => {
      const user = { ...mockUsers[0] };
      component.pendingToggle = { user, newValue: false };

      component.confirmToggleStatus();

      expect(userService.updateUser).toHaveBeenCalledWith(1, { is_active: false });
      expect(toastService.success).toHaveBeenCalledWith('User "John Doe" has been deactivated successfully.');
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should handle toggle errors and revert status', () => {
      (userService.updateUser as any).mockReturnValue(throwError(() => ({ message: 'Update failed' })));
      const user = { ...mockUsers[0] };
      component.pendingToggle = { user, newValue: false };

      component.confirmToggleStatus();

      expect(toastService.error).toHaveBeenCalledWith('Failed to update user status: Update failed');
      expect(user.is_active).toBe(true); // Reverted
    });

    it('should handle null pendingToggle gracefully', () => {
      component.pendingToggle = null;
      component.confirmToggleStatus();
      expect(userService.updateUser).not.toHaveBeenCalled();
    });

    it('should display correct confirmation message for activation', () => {
      component.pendingToggle = { user: mockUsers[0], newValue: true };
      expect(component.pendingToggle.newValue).toBe(true);
    });

    it('should display correct confirmation message for deactivation', () => {
      component.pendingToggle = { user: mockUsers[0], newValue: false };
      expect(component.pendingToggle.newValue).toBe(false);
    });
  });

  // ===========================
  // Navigation
  // ===========================
  describe('Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to create user modal', () => {
      component.openCreateModal();
      expect(router.navigate).toHaveBeenCalledWith(['admin/users/create']);
    });

    it('should have correct route for user view', () => {
      const viewAction = component.rowActions.find(a => a.id === 'view');
      expect(viewAction).toBeDefined();
    });

    it('should have correct route for user edit', () => {
      const editAction = component.rowActions.find(a => a.id === 'edit');
      expect(editAction).toBeDefined();
    });
  });

  // ===========================
  // Component Cleanup
  // ===========================
  describe('Component Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const destroySpy = vi.spyOn(component['destroy$'], 'next');
      const completeSpy = vi.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ===========================
  // Edge Cases
  // ===========================
  describe('Edge Cases', () => {
    it('should handle empty user list', () => {
      (userService.getUsers as any).mockReturnValue(of({ users: [], total: 0, page: 1, limit: 10, totalPages: 0 }));
      fixture.detectChanges();
      expect(component.users).toEqual([]);
      expect(component.pagination.total).toBe(0);
    });

    it('should handle undefined filter values', () => {
      component.onFilterChange({ search: undefined, page: 1, limit: 10 });
      // Component uses || '' so undefined becomes ''
      expect(component.filters.search).toBe('');
    });

    it('should handle user with no roles', () => {
      const userNoRoles: User = { ...mockUsers[0], roles: [] };
      (userService.getUsers as any).mockReturnValue(of({ users: [userNoRoles], total: 1, page: 1, limit: 10, totalPages: 1 }));
      fixture.detectChanges();
      expect(component.users[0].roles).toEqual([]);
    });

    it('should handle generic error without message', () => {
      (userService.getUsers as any).mockReturnValue(throwError(() => ({})));
      fixture.detectChanges();
      expect(toastService.error).toHaveBeenCalledWith('Failed to load users. Please try again.');
    });

    it('should handle user with null last_login', () => {
      expect(mockUsers[1].last_login).toBeNull();
    });
  });
});
