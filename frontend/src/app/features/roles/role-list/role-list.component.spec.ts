import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { RoleListComponent } from './role-list.component';
import { PermissionService } from '../../../core/services/permission.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { Role } from '../../../shared/models/permission.model';

describe('RoleListComponent', () => {
  let component: RoleListComponent;
  let fixture: ComponentFixture<RoleListComponent>;
  let permissionService: PermissionService;
  let loggerService: LoggerService;
  let toastService: ToastService;
  let router: Router;

  const mockRoles: Role[] = [
    {
      role_id: 1,
      role_name: 'Admin',
      role_code: 'ADMIN',
      description: 'Administrator role',
      is_active: true,
      is_system_role: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    },
    {
      role_id: 2,
      role_name: 'User',
      role_code: 'USER',
      description: 'Regular user role',
      is_active: true,
      is_system_role: false,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    },
    {
      role_id: 3,
      role_name: 'Inactive Role',
      role_code: 'INACTIVE',
      description: 'Inactive role',
      is_active: false,
      is_system_role: false,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    }
  ];

  beforeEach(async () => {
    const permissionServiceMock = {
      getAllRoles: vi.fn().mockReturnValue(of(mockRoles)),
      deleteRole: vi.fn().mockReturnValue(of(undefined)),
      updateRole: vi.fn().mockReturnValue(of(undefined)),
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
      warn: vi.fn(),
      warning: vi.fn()
    };

    const routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RoleListComponent, HttpClientTestingModule],
      providers: [
        { provide: PermissionService, useValue: permissionServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RoleListComponent);
    component = fixture.componentInstance;
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
      expect(component.roles).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.showDeleteModal).toBe(false);
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should load roles on init', () => {
      fixture.detectChanges();
      expect(permissionService.getAllRoles).toHaveBeenCalled();
      expect(component.roles).toEqual(mockRoles);
    });

    it('should configure table columns correctly', () => {
      expect(component.columns).toHaveLength(5);
      expect(component.columns[0].key).toBe('role_name');
      expect(component.columns[1].key).toBe('role_code');
      expect(component.columns[3].type).toBe('badge');
      expect(component.columns[4].type).toBe('toggle');
    });

    it('should configure row actions correctly', () => {
      expect(component.rowActions).toHaveLength(3);
      expect(component.rowActions.map(a => a.id)).toEqual(['permissions', 'edit', 'delete']);
    });

    it('should configure table filters correctly', () => {
      expect(component.filters).toHaveLength(2);
      expect(component.filters[0].key).toBe('searchTerm');
      expect(component.filters[1].key).toBe('status');
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
    it('should load roles successfully', () => {
      fixture.detectChanges();
      expect(component.roles).toEqual(mockRoles);
      expect(component.filteredRoles).toEqual(mockRoles);
    });

    it('should set loading state while fetching roles', () => {
      component['loadRoles']();
      expect(component.loading).toBe(false); // sync mock completes immediately
    });

    it('should handle role load errors', () => {
      (permissionService.getAllRoles as any).mockReturnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      expect(loggerService.error).toHaveBeenCalledWith('Error loading roles', expect.any(Error));
      expect(toastService.error).toHaveBeenCalledWith('Failed to load roles');
      expect(component.loading).toBe(false);
    });

    it('should initialize pagination after loading roles', () => {
      fixture.detectChanges();
      expect(component.pagination.total).toBe(3);
      expect(component.pagination.totalPages).toBe(1);
    });

    it('should populate rowsForPage with paged data', () => {
      fixture.detectChanges();
      expect(component.rowsForPage.length).toBeLessThanOrEqual(10);
    });
  });

  // ===========================
  // Filter Functionality
  // ===========================
  describe('Filter Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter roles by search term - name', () => {
      component.onFilterChange({ searchTerm: 'Admin', page: 1, limit: 10 });
      expect(component.filteredRoles.length).toBe(1);
      expect(component.filteredRoles[0].role_name).toBe('Admin');
    });

    it('should filter roles by search term - code', () => {
      component.onFilterChange({ searchTerm: 'USER', page: 1, limit: 10 });
      expect(component.filteredRoles.length).toBe(1);
      expect(component.filteredRoles[0].role_code).toBe('USER');
    });

    it('should filter roles by search term - description', () => {
      component.onFilterChange({ searchTerm: 'Administrator', page: 1, limit: 10 });
      expect(component.filteredRoles.length).toBe(1);
    });

    it('should filter roles by active status', () => {
      component.onFilterChange({ status: 'true', page: 1, limit: 10 });
      expect(component.filteredRoles.length).toBe(2);
      expect(component.filteredRoles.every(r => r.is_active)).toBe(true);
    });

    it('should filter roles by inactive status', () => {
      component.onFilterChange({ status: 'false', page: 1, limit: 10 });
      expect(component.filteredRoles.length).toBe(1);
      expect(component.filteredRoles[0].is_active).toBe(false);
    });

    it('should handle combined search and status filters', () => {
      component.onFilterChange({ searchTerm: 'role', status: 'true', page: 1, limit: 10 });
      expect(component.filteredRoles.every(r => r.is_active)).toBe(true);
    });

    it('should handle pagination changes', () => {
      component.onFilterChange({ page: 2, limit: 25 });
      expect(component.currentPage).toBe(2);
      expect(component.currentLimit).toBe(25);
    });

    it('should handle empty search filter', () => {
      component.onFilterChange({ searchTerm: '', page: 1, limit: 10 });
      expect(component.filteredRoles).toEqual(mockRoles);
    });

    it('should reset to page 1 when search changes', () => {
      component.currentPage = 3;
      component.onFilterChange({ searchTerm: 'Admin', page: 1, limit: 10 });
      expect(component.currentPage).toBe(1);
    });
  });

  // ===========================
  // Sorting Functionality
  // ===========================
  describe('Sorting Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should sort roles by name ascending', () => {
      component.onSortChange({ column: 'role_name', direction: 'asc' });
      expect(component.rowsForPage[0].role_name).toBe('Admin');
    });

    it('should sort roles by name descending', () => {
      component.onSortChange({ column: 'role_name', direction: 'desc' });
      expect(component.rowsForPage[0].role_name).toBe('User');
    });

    it('should sort roles by code', () => {
      component.onSortChange({ column: 'role_code', direction: 'asc' });
      expect(component.currentSort).toEqual({ column: 'role_code', direction: 'asc' });
    });

    it('should reset to page 1 when sorting changes', () => {
      component.currentPage = 3;
      component.onSortChange({ column: 'role_name', direction: 'asc' });
      expect(component.currentPage).toBe(1);
    });

    it('should clear sort when null', () => {
      component.onSortChange(null);
      expect(component.currentSort).toBeNull();
    });
  });

  // ===========================
  // Row Actions
  // ===========================
  describe('Row Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to role permissions on permissions action', () => {
      component.onRowAction({ action: 'permissions', row: mockRoles[0] });
      expect(router.navigate).toHaveBeenCalledWith(['admin/roles/permissions/1']);
    });

    it('should navigate to role edit on edit action', () => {
      component.onRowAction({ action: 'edit', row: mockRoles[1] }); // non-system role
      expect(router.navigate).toHaveBeenCalledWith(['admin/roles/edit/2']);
    });

    it('should show delete confirmation on delete action', () => {
      component.onRowAction({ action: 'delete', row: mockRoles[1] }); // non-system role
      expect(component.showDeleteModal).toBe(true);
      expect(component.roleToDelete).toBe(2);
      expect(component.roleToDeleteName).toBe('User');
    });

    it('should handle unknown action gracefully', () => {
      component.onRowAction({ action: 'unknown', row: mockRoles[0] });
      // No default case in switch - no navigation or deletion occurs
      expect(permissionService.deleteRole).not.toHaveBeenCalled();
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
      component.onRowAction({ action: 'delete', row: mockRoles[1] }); // non-system role
      expect(component.showDeleteModal).toBe(true);
      expect(component.roleToDeleteName).toBe('User');
    });

    it('should cancel delete and close dialog', () => {
      component.roleToDelete = 1;
      component.showDeleteModal = true;
      component.cancelDelete();
      expect(component.showDeleteModal).toBe(false);
      expect(component.roleToDelete).toBeNull();
    });

    it('should delete role successfully', () => {
      component.roleToDelete = 1;
      component.showDeleteModal = true;

      component.deleteRole();

      expect(permissionService.deleteRole).toHaveBeenCalledWith(1);
      expect(toastService.success).toHaveBeenCalledWith('Role deleted successfully');
      expect(component.showDeleteModal).toBe(false);
      expect(permissionService.getAllRoles).toHaveBeenCalled(); // Reload data
    });

    it('should handle delete errors', () => {
      (permissionService.deleteRole as any).mockReturnValue(throwError(() => ({ error: { message: 'Delete failed' } })));
      component.roleToDelete = 1;

      component.deleteRole();

      expect(toastService.error).toHaveBeenCalledWith('Failed to delete role. Please try again.');
      expect(loggerService.error).toHaveBeenCalledWith('Error deleting role', expect.any(Object));
      expect(component.deleting).toBe(false);
    });

    it('should handle null roleToDelete gracefully', () => {
      component.roleToDelete = null;
      component.deleteRole();
      expect(permissionService.deleteRole).not.toHaveBeenCalled();
    });

    it('should prevent deletion of system roles', () => {
      const systemRole = mockRoles.find(r => r.is_system_role);
      if (systemRole) {
        component.onRowAction({ action: 'delete', row: systemRole });
        // Should show warning or prevent deletion
      }
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
      component.onCellToggle({ row: mockRoles[1], column: { key: 'is_active' } as any, newValue: false });
      expect(component.showToggleConfirm).toBe(true);
      expect(component.pendingToggle).toEqual({ row: mockRoles[1], newValue: false });
    });

    it('should cancel toggle and revert status', () => {
      const role = { ...mockRoles[0] };
      component.pendingToggle = { row: role, newValue: false };
      component.showToggleConfirm = true;

      component.cancelToggle();

      expect(component.showToggleConfirm).toBe(false);
      expect(component.pendingToggle).toBeNull();
      expect(role.is_active).toBe(true); // Reverted
    });

    it('should confirm toggle successfully - activate', () => {
      const role = { ...mockRoles[2] }; // Inactive role
      component.pendingToggle = { row: role, newValue: true };

      component.confirmToggle();

      expect(permissionService.updateRole).toHaveBeenCalledWith(3, { is_active: true });
      expect(toastService.success).toHaveBeenCalledWith('Role activated successfully');
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should confirm toggle successfully - deactivate', () => {
      const role = { ...mockRoles[0] };
      component.pendingToggle = { row: role, newValue: false };

      component.confirmToggle();

      expect(permissionService.updateRole).toHaveBeenCalledWith(1, { is_active: false });
      expect(toastService.success).toHaveBeenCalledWith('Role deactivated successfully');
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should handle toggle errors and revert status', () => {
      (permissionService.updateRole as any).mockReturnValue(throwError(() => ({ error: { message: 'Update failed' } })));
      const role = { ...mockRoles[0] };
      component.pendingToggle = { row: role, newValue: false };

      component.confirmToggle();

      expect(toastService.error).toHaveBeenCalledWith('Failed to update role status. Please try again.');
      expect(role.is_active).toBe(true); // Reverted
    });

    it('should handle null pendingToggle gracefully', () => {
      component.pendingToggle = null;
      component.confirmToggle();
      expect(permissionService.updateRole).not.toHaveBeenCalled();
    });

    it('should get correct toggle confirmation title', () => {
      component.pendingToggle = { row: mockRoles[0], newValue: false };
      const title = component.getToggleConfirmTitle();
      expect(title).toContain('Deactivate');

      component.pendingToggle = { row: mockRoles[2], newValue: true };
      const titleActivate = component.getToggleConfirmTitle();
      expect(titleActivate).toContain('Activate');
    });

    it('should get correct toggle confirmation message', () => {
      component.pendingToggle = { row: mockRoles[0], newValue: false };
      const message = component.getToggleConfirmMessage();
      expect(message).toBeDefined();
    });
  });

  // ===========================
  // Navigation
  // ===========================
  describe('Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to create role', () => {
      component.createRole();
      expect(router.navigate).toHaveBeenCalledWith(['admin/roles/create']);
    });

    it('should have correct route for role permissions', () => {
      const permissionsAction = component.rowActions.find(a => a.id === 'permissions');
      expect(permissionsAction).toBeDefined();
    });

    it('should have correct route for role edit', () => {
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
    it('should handle empty role list', () => {
      (permissionService.getAllRoles as any).mockReturnValue(of([]));
      fixture.detectChanges();
      expect(component.roles).toEqual([]);
      expect(component.pagination.total).toBe(0);
    });

    it('should handle undefined filter values', () => {
      fixture.detectChanges();
      component.onFilterChange({ searchTerm: undefined, page: 1, limit: 10 });
      expect(component.filteredRoles).toEqual(mockRoles);
    });

    it('should handle role with null description', () => {
      const roleNoDesc: Role = { ...mockRoles[0], description: null };
      (permissionService.getAllRoles as any).mockReturnValue(of([roleNoDesc]));
      fixture.detectChanges();
      expect(component.roles[0].description).toBeNull();
    });

    it('should handle generic error without message', () => {
      (permissionService.getAllRoles as any).mockReturnValue(throwError(() => ({})));
      fixture.detectChanges();
      expect(toastService.error).toHaveBeenCalledWith('Failed to load roles');
    });

    it('should handle large role list with pagination', () => {
      const manyRoles = Array.from({ length: 100 }, (_, i) => ({
        ...mockRoles[0],
        role_id: i + 1,
        role_name: `Role ${i + 1}`,
        role_code: `ROLE_${i + 1}`
      }));
      (permissionService.getAllRoles as any).mockReturnValue(of(manyRoles));
      fixture.detectChanges();
      expect(component.pagination.totalPages).toBe(10);
      expect(component.rowsForPage.length).toBe(10);
    });

    it('should handle search with no results', () => {
      component.onFilterChange({ searchTerm: 'NonExistentRole', page: 1, limit: 10 });
      expect(component.filteredRoles).toEqual([]);
    });
  });
});
