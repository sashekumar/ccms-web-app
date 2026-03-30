import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { ActionsComponent } from './actions.component';
import { PermissionService } from '../../core/services/permission.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../core/services/toast.service';
import { Action } from '../../shared/models/permission.model';

describe('ActionsComponent', () => {
  let component: ActionsComponent;
  let fixture: ComponentFixture<ActionsComponent>;
  let permissionService: PermissionService;
  let loggerService: LoggerService;
  let toastService: ToastService;

  const mockActions: Action[] = [
    {
      action_id: 1,
      action_name: 'View',
      action_code: 'VIEW',
      description: 'View data',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    },
    {
      action_id: 2,
      action_name: 'Create',
      action_code: 'CREATE',
      description: 'Create new records',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    },
    {
      action_id: 3,
      action_name: 'Delete',
      action_code: 'DELETE',
      description: 'Delete records',
      is_active: false,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    }
  ];

  beforeEach(async () => {
    const permissionServiceMock = {
      getAllActions: vi.fn().mockReturnValue(of(mockActions)),
      createAction: vi.fn().mockReturnValue(of(1)),
      updateAction: vi.fn().mockReturnValue(of(undefined)),
      deleteAction: vi.fn().mockReturnValue(of(undefined)),
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

    await TestBed.configureTestingModule({
      imports: [ActionsComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: PermissionService, useValue: permissionServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActionsComponent);
    component = fixture.componentInstance;
    permissionService = TestBed.inject(PermissionService);
    loggerService = TestBed.inject(LoggerService);
    toastService = TestBed.inject(ToastService);
  });

  // ===========================
  // Component Initialization
  // ===========================
  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.actions).toEqual([]);
      expect(component.loading).toBe(true);
      expect(component.showModal).toBe(false);
      expect(component.showDeleteConfirm).toBe(false);
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should load actions on init', () => {
      fixture.detectChanges();
      expect(permissionService.getAllActions).toHaveBeenCalled();
      expect(component.actions).toEqual(mockActions);
    });

    it('should configure table columns correctly', () => {
      expect(component.columns).toHaveLength(3);
      expect(component.columns[0].key).toBe('action_name');
      expect(component.columns[1].key).toBe('description');
      expect(component.columns[2].type).toBe('toggle');
    });

    it('should configure row actions correctly', () => {
      expect(component.rowActions).toHaveLength(2);
      expect(component.rowActions.map(a => a.id)).toEqual(['edit', 'delete']);
    });

    it('should configure table filters correctly', () => {
      expect(component.tableFilters).toHaveLength(2);
      expect(component.tableFilters[0].key).toBe('search');
      expect(component.tableFilters[1].key).toBe('is_active');
    });

    it('should initialize pagination with default values', () => {
      expect(component.pagination).toEqual({
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 0
      });
    });

    it('should initialize form data with default values', () => {
      expect(component.formData.actionName).toBe('');
      expect(component.formData.isActive).toBe(true);
    });
  });

  // ===========================
  // Data Loading
  // ===========================
  describe('Data Loading', () => {
    it('should load actions successfully', () => {
      fixture.detectChanges();
      expect(component.actions).toEqual(mockActions);
      expect(component.loading).toBe(false);
    });

    it('should set loading state while fetching actions', () => {
      expect(component.loading).toBe(true);
    });

    it('should handle action load errors', () => {
      (permissionService.getAllActions as any).mockReturnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      expect(loggerService.error).toHaveBeenCalledWith('Error loading actions:', expect.any(Error));
      expect(toastService.error).toHaveBeenCalledWith('Error loading actions');
      expect(component.loading).toBe(false);
    });

    it('should apply filters after loading actions', () => {
      fixture.detectChanges();
      expect(component.filteredActions.length).toBe(mockActions.length);
    });

    it('should update pagination after loading', () => {
      fixture.detectChanges();
      expect(component.pagination.total).toBe(3);
      expect(component.pagination.totalPages).toBeGreaterThan(0);
    });
  });

  // ===========================
  // Filter Functionality
  // ===========================
  describe('Filter Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter actions by search term - name', () => {
      component.onFilterChange({ search: 'View', page: 1, limit: 25 });
      expect(component.filteredActions.length).toBe(1);
      expect(component.filteredActions[0].action_name).toBe('View');
    });

    it('should filter actions by search term - code', () => {
      component.onFilterChange({ search: 'CREATE', page: 1, limit: 25 });
      expect(component.filteredActions.length).toBe(1);
      expect(component.filteredActions[0].action_code).toBe('CREATE');
    });

    it('should filter actions by search term - description', () => {
      component.onFilterChange({ search: 'records', page: 1, limit: 25 });
      expect(component.filteredActions.length).toBeGreaterThan(0);
    });

    it('should filter actions by active status', () => {
      component.onFilterChange({ is_active: 'true', page: 1, limit: 25 });
      expect(component.filteredActions.every(a => a.is_active)).toBe(true);
    });

    it('should filter actions by inactive status', () => {
      component.onFilterChange({ is_active: 'false', page: 1, limit: 25 });
      expect(component.filteredActions.every(a => !a.is_active)).toBe(true);
    });

    it('should handle combined filters', () => {
      component.onFilterChange({ search: 'Delete', is_active: 'false', page: 1, limit: 25 });
      expect(component.filteredActions.length).toBe(1);
    });

    it('should handle pagination changes', () => {
      component.onFilterChange({ page: 2, limit: 10 });
      expect(component.pagination.page).toBe(2);
      expect(component.pagination.limit).toBe(10);
    });

    it('should handle empty search filter', () => {
      component.onFilterChange({ search: '', page: 1, limit: 25 });
      expect(component.filteredActions.length).toBe(mockActions.length);
    });

    it('should update pagination total after filtering', () => {
      component.onFilterChange({ search: 'View', page: 1, limit: 25 });
      expect(component.pagination.total).toBe(1);
    });
  });

  // ===========================
  // Create Modal
  // ===========================
  describe('Create Modal', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open create modal', () => {
      component.openCreateModal();
      expect(component.showModal).toBe(true);
      expect(component.editingAction).toBeNull();
    });

    it('should reset form data when opening create modal', () => {
      component.formData.actionName = 'Test';
      component.openCreateModal();
      expect(component.formData.actionName).toBe('');
      expect(component.formData.isActive).toBe(true);
    });

    it('should close modal', () => {
      component.showModal = true;
      component.closeModal();
      expect(component.showModal).toBe(false);
    });

    it('should not close modal while saving', () => {
      component.showModal = true;
      component.saving = true;
      expect(component.showModal).toBe(true);
    });
  });

  // ===========================
  // Edit Modal
  // ===========================
  describe('Edit Modal', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open edit modal with action data', () => {
      component.onRowAction({ action: 'edit', row: mockActions[0] });
      expect(component.showModal).toBe(true);
      expect(component.editingAction).toEqual(mockActions[0]);
      expect(component.formData.actionName).toBe('View');
      expect(component.formData.actionCode).toBe('VIEW');
    });

    it('should populate form data from action', () => {
      component.onRowAction({ action: 'edit', row: mockActions[0] });
      expect(component.formData.actionName).toBe(mockActions[0].action_name);
      expect(component.formData.actionCode).toBe(mockActions[0].action_code);
      expect(component.formData.description).toBe(mockActions[0].description);
    });

    it('should handle action with empty description', () => {
      const actionNoDesc = { ...mockActions[0], description: undefined };
      component.onRowAction({ action: 'edit', row: actionNoDesc });
      expect(component.formData.description).toBe('');
    });
  });

  // ===========================
  // Form Validation
  // ===========================
  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.openCreateModal();
    });

    it('should require action name', () => {
      expect(component.formData.actionName).toBe('');
    });

    it('should require action code', () => {
      expect(component.formData.actionCode).toBe('');
    });

    it('should allow optional description to be empty', () => {
      expect(component.formData.description).toBe('');
    });
  });

  // ===========================
  // Save Functionality
  // ===========================
  describe('Save Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      vi.clearAllMocks();
    });

    it('should create new action successfully', () => {
      component.openCreateModal();
      component.formData = {
        actionName: 'Update',
        actionCode: 'UPDATE',
        description: 'Update records',
        isActive: true
      };

      component.saveAction();

      expect(permissionService.createAction).toHaveBeenCalledWith(expect.objectContaining({
        action_name: 'Update',
        action_code: 'UPDATE'
      }));
      expect(toastService.success).toHaveBeenCalledWith('Action created successfully');
      expect(component.showModal).toBe(false);
    });

    it('should update existing action successfully', () => {
      component.editingAction = mockActions[0];
      component.formData = {
        actionName: 'Updated View',
        actionCode: 'VIEW_UPDATED',
        description: 'Updated description',
        isActive: true
      };

      component.saveAction();

      expect(permissionService.updateAction).toHaveBeenCalledWith(1, expect.any(Object));
      expect(toastService.success).toHaveBeenCalledWith('Action updated successfully');
      expect(component.showModal).toBe(false);
    });

    it('should handle create errors', () => {
      (permissionService.createAction as any).mockReturnValue(throwError(() => ({ error: { message: 'Create failed' } })));
      component.openCreateModal();
      component.formData.actionName = 'Test';
      component.formData.actionCode = 'TEST';

      component.saveAction();

      expect(toastService.error).toHaveBeenCalledWith('Error creating action: Create failed');
      expect(component.saving).toBe(false);
    });

    it('should handle update errors', () => {
      (permissionService.updateAction as any).mockReturnValue(throwError(() => ({ error: { message: 'Update failed' } })));
      component.editingAction = mockActions[0];
      component.formData.actionName = 'Test';

      component.saveAction();

      expect(toastService.error).toHaveBeenCalledWith('Error updating action: Update failed');
      expect(component.saving).toBe(false);
    });

    it('should reload actions after successful save', () => {
      component.openCreateModal();
      component.formData.actionName = 'Test';
      component.formData.actionCode = 'TEST';

      component.saveAction();

      expect(permissionService.getAllActions).toHaveBeenCalled();
    });

    it('should set saving state during save', () => {
      component.openCreateModal();
      component.formData.actionName = 'Test';
      component.formData.actionCode = 'TEST';

      component.saveAction();

      expect(component.saving).toBe(false); // After completion
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
      component.onRowAction({ action: 'delete', row: mockActions[0] });
      expect(component.showDeleteConfirm).toBe(true);
      expect(component.actionToDelete).toEqual(mockActions[0]);
    });

    it('should cancel delete and close dialog', () => {
      component.actionToDelete = mockActions[0];
      component.showDeleteConfirm = true;
      component.cancelDelete();
      expect(component.showDeleteConfirm).toBe(false);
      expect(component.actionToDelete).toBeNull();
    });

    it('should delete action successfully', () => {
      component.actionToDelete = mockActions[0];
      component.showDeleteConfirm = true;

      component.deleteAction();

      expect(permissionService.deleteAction).toHaveBeenCalledWith(1);
      expect(toastService.success).toHaveBeenCalledWith('Action deleted successfully');
      expect(component.showDeleteConfirm).toBe(false);
      expect(permissionService.getAllActions).toHaveBeenCalled();
    });

    it('should handle delete errors', () => {
      (permissionService.deleteAction as any).mockReturnValue(throwError(() => ({ error: { message: 'Delete failed' } })));
      component.actionToDelete = mockActions[0];

      component.deleteAction();

      expect(toastService.error).toHaveBeenCalledWith('Error deleting action: Delete failed');
      expect(loggerService.error).toHaveBeenCalledWith('Error deleting action:', expect.any(Object));
    });

    it('should handle null actionToDelete gracefully', () => {
      component.actionToDelete = null;
      component.deleteAction();
      expect(permissionService.deleteAction).not.toHaveBeenCalled();
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
      component.onToggleStatus({ row: mockActions[0], column: { key: 'is_active' } as any, newValue: false });
      expect(component.showToggleConfirm).toBe(true);
      expect(component.pendingToggle).toEqual({ action: mockActions[0], newValue: false });
    });

    it('should cancel toggle and revert status', () => {
      const action = { ...mockActions[0] };
      component.pendingToggle = { action, newValue: false };
      component.showToggleConfirm = true;

      component.cancelToggleStatus();

      expect(component.showToggleConfirm).toBe(false);
      expect(component.pendingToggle).toBeNull();
      expect(action.is_active).toBe(true);
    });

    it('should confirm toggle successfully - activate', () => {
      const action = { ...mockActions[2] }; // Inactive action
      component.pendingToggle = { action, newValue: true };

      component.confirmToggleStatus();

      expect(permissionService.updateAction).toHaveBeenCalledWith(3, { is_active: true });
      expect(toastService.success).toHaveBeenCalledWith('Action "Delete" has been activated successfully.');
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should confirm toggle successfully - deactivate', () => {
      const action = { ...mockActions[0] };
      component.pendingToggle = { action, newValue: false };

      component.confirmToggleStatus();

      expect(permissionService.updateAction).toHaveBeenCalledWith(1, { is_active: false });
      expect(toastService.success).toHaveBeenCalledWith('Action "View" has been deactivated successfully.');
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should handle toggle errors and revert status', () => {
      (permissionService.updateAction as any).mockReturnValue(throwError(() => ({ error: { message: 'Update failed' } })));
      const action = { ...mockActions[0] };
      component.pendingToggle = { action, newValue: false };

      component.confirmToggleStatus();

      expect(toastService.error).toHaveBeenCalledWith('Failed to update action status. Please try again.');
      expect(action.is_active).toBe(true);
    });

    it('should handle null pendingToggle gracefully', () => {
      component.pendingToggle = null;
      component.confirmToggleStatus();
      expect(permissionService.updateAction).not.toHaveBeenCalled();
    });
  });

  // ===========================
  // Row Actions
  // ===========================
  describe('Row Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle edit action', () => {
      component.onRowAction({ action: 'edit', row: mockActions[0] });
      expect(component.showModal).toBe(true);
      expect(component.editingAction).toEqual(mockActions[0]);
    });

    it('should handle delete action', () => {
      component.onRowAction({ action: 'delete', row: mockActions[0] });
      expect(component.showDeleteConfirm).toBe(true);
    });

    it('should handle unknown action gracefully', () => {
      component.onRowAction({ action: 'unknown', row: mockActions[0] });
      // No default case in switch - no error or navigation occurs
      expect(permissionService.deleteAction).not.toHaveBeenCalled();
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
    it('should handle empty action list', () => {
      (permissionService.getAllActions as any).mockReturnValue(of([]));
      fixture.detectChanges();
      expect(component.actions).toEqual([]);
      expect(component.pagination.total).toBe(0);
    });

    it('should handle action with null description', () => {
      const actionNullDesc: Action = {
        ...mockActions[0],
        description: null
      };
      component.onRowAction({ action: 'edit', row: actionNullDesc });
      expect(component.formData.description).toBe('');
    });

    it('should handle generic error without message', () => {
      (permissionService.getAllActions as any).mockReturnValue(throwError(() => ({})));
      fixture.detectChanges();
      expect(toastService.error).toHaveBeenCalledWith('Error loading actions');
    });

    it('should handle search with no results', () => {
      component.onFilterChange({ search: 'NonExistent', page: 1, limit: 25 });
      expect(component.filteredActions).toEqual([]);
    });
  });
});
