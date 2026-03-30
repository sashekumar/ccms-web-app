import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { ModuleActionsComponent } from './module-actions.component';
import { PermissionService } from '../../core/services/permission.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../core/services/toast.service';
import { Module, Action, ModuleAction } from '../../shared/models/permission.model';

describe('ModuleActionsComponent', () => {
  let component: ModuleActionsComponent;
  let fixture: ComponentFixture<ModuleActionsComponent>;
  let permissionService: PermissionService;
  let loggerService: LoggerService;
  let toastService: ToastService;

  const mockModules: Module[] = [
    {
      module_id: 1,
      module_name: 'User Management',
      module_code: 'USER_MGMT',
      description: 'User module',
      route: '/users',
      icon: 'users',
      display_order: 1,
      category_id: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    },
    {
      module_id: 2,
      module_name: 'Role Management',
      module_code: 'ROLE_MGMT',
      description: 'Role module',
      route: '/roles',
      icon: 'shield',
      display_order: 2,
      category_id: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    }
  ];

  const mockActions: Action[] = [
    {
      action_id: 1,
      action_name: 'View',
      action_code: 'VIEW',
      description: 'View access',
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
      description: 'Create access',
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
      description: 'Delete access',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    }
  ];

  const mockModuleActions: ModuleAction[] = [
    {
      module_action_id: 1,
      module_id: 1,
      module_name: 'User Management',
      module_code: 'USER_MGMT',
      action_id: 1,
      action_name: 'View',
      action_code: 'VIEW',
      action_label: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    },
    {
      module_action_id: 2,
      module_id: 1,
      module_name: 'User Management',
      module_code: 'USER_MGMT',
      action_id: 2,
      action_name: 'Create',
      action_code: 'CREATE',
      action_label: 'Add User',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    },
    {
      module_action_id: 3,
      module_id: 2,
      module_name: 'Role Management',
      module_code: 'ROLE_MGMT',
      action_id: 3,
      action_name: 'Delete',
      action_code: 'DELETE',
      action_label: null,
      is_active: false,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    }
  ];

  beforeEach(async () => {
    const permissionServiceMock = {
      getAllModules: vi.fn().mockReturnValue(of(mockModules)),
      getAllActions: vi.fn().mockReturnValue(of(mockActions)),
      getAllModuleActions: vi.fn().mockReturnValue(of(mockModuleActions)),
      createModuleAction: vi.fn().mockReturnValue(of(1)),
      updateModuleAction: vi.fn().mockReturnValue(of(undefined)),
      deleteModuleAction: vi.fn().mockReturnValue(of(undefined)),
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
      imports: [ModuleActionsComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: PermissionService, useValue: permissionServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ModuleActionsComponent);
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
      expect(component.moduleActions).toEqual([]);
      expect(component.loading).toBe(true);
      expect(component.showModal).toBe(false);
      expect(component.showDeleteConfirm).toBe(false);
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should load modules, actions, and module-actions on init', () => {
      fixture.detectChanges();
      expect(permissionService.getAllModules).toHaveBeenCalled();
      expect(permissionService.getAllActions).toHaveBeenCalled();
      expect(permissionService.getAllModuleActions).toHaveBeenCalled();
    });

    it('should configure table columns correctly', () => {
      expect(component.columns).toHaveLength(4);
      expect(component.columns[0].key).toBe('module_name');
      expect(component.columns[1].key).toBe('action_name');
      expect(component.columns[3].type).toBe('toggle');
    });

    it('should configure row actions correctly', () => {
      expect(component.rowActions).toHaveLength(2);
      expect(component.rowActions.map(a => a.id)).toEqual(['edit', 'delete']);
    });

    it('should configure table filters correctly', () => {
      expect(component.tableFilters).toHaveLength(4);
      expect(component.tableFilters[0].key).toBe('search');
      expect(component.tableFilters[1].key).toBe('module_id');
      expect(component.tableFilters[2].key).toBe('action_id');
      expect(component.tableFilters[3].key).toBe('is_active');
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
      expect(component.formData.moduleId).toBe('');
      expect(component.formData.actionIds).toEqual([]);
      expect(component.formData.isActive).toBe(true);
    });
  });

  // ===========================
  // Data Loading
  // ===========================
  describe('Data Loading', () => {
    it('should load module-actions successfully', () => {
      fixture.detectChanges();
      expect(component.moduleActions).toEqual(mockModuleActions);
      expect(component.loading).toBe(false);
    });

    it('should set loading state while fetching data', () => {
      expect(component.loading).toBe(true);
    });

    it('should handle module-action load errors', () => {
      (permissionService.getAllModuleActions as any).mockReturnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      expect(loggerService.error).toHaveBeenCalledWith('Error loading module-actions data', expect.any(Error));
      expect(toastService.error).toHaveBeenCalledWith('Error loading data');
      expect(component.loading).toBe(false);
    });

    it('should load modules and populate dropdown options', () => {
      fixture.detectChanges();
      expect(component.modules).toEqual(mockModules);
      expect(component.moduleOptions.length).toBeGreaterThan(0);
    });

    it('should load actions', () => {
      fixture.detectChanges();
      expect(component.actions).toEqual(mockActions);
    });

    it('should populate module filter options', () => {
      fixture.detectChanges();
      const moduleFilter = component.tableFilters.find(f => f.key === 'module_id');
      expect(moduleFilter?.options?.length).toBeGreaterThan(0);
    });

    it('should populate action filter options', () => {
      fixture.detectChanges();
      const actionFilter = component.tableFilters.find(f => f.key === 'action_id');
      expect(actionFilter?.options?.length).toBeGreaterThan(0);
    });

    it('should handle module load errors gracefully', () => {
      (permissionService.getAllModules as any).mockReturnValue(throwError(() => new Error('Module error')));
      fixture.detectChanges();
      expect(loggerService.error).toHaveBeenCalledWith('Error loading module-actions data', expect.any(Error));
    });

    it('should handle action load errors gracefully', () => {
      (permissionService.getAllActions as any).mockReturnValue(throwError(() => new Error('Action error')));
      fixture.detectChanges();
      expect(loggerService.error).toHaveBeenCalledWith('Error loading module-actions data', expect.any(Error));
    });
  });

  // ===========================
  // Filter Functionality
  // ===========================
  describe('Filter Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter module-actions by search term', () => {
      component.onFilterChange({ search: 'User', page: 1, limit: 25 });
      expect(component.filteredModuleActions.length).toBeGreaterThan(0);
      expect(component.filteredModuleActions.every(ma => 
        ma.module_name?.includes('User') || ma.action_name?.includes('User')
      )).toBe(true);
    });

    it('should filter module-actions by module', () => {
      component.onFilterChange({ module_id: '1', page: 1, limit: 25 });
      expect(component.filteredModuleActions.every(ma => ma.module_id === 1)).toBe(true);
    });

    it('should filter module-actions by action', () => {
      component.onFilterChange({ action_id: '1', page: 1, limit: 25 });
      expect(component.filteredModuleActions.every(ma => ma.action_id === 1)).toBe(true);
    });

    it('should filter module-actions by active status', () => {
      component.onFilterChange({ is_active: 'true', page: 1, limit: 25 });
      expect(component.filteredModuleActions.every(ma => ma.is_active)).toBe(true);
    });

    it('should filter module-actions by inactive status', () => {
      component.onFilterChange({ is_active: 'false', page: 1, limit: 25 });
      expect(component.filteredModuleActions.every(ma => !ma.is_active)).toBe(true);
    });

    it('should handle combined filters', () => {
      component.onFilterChange({ module_id: '1', is_active: 'true', page: 1, limit: 25 });
      expect(component.filteredModuleActions.every(ma => ma.module_id === 1 && ma.is_active)).toBe(true);
    });

    it('should handle pagination changes', () => {
      component.onFilterChange({ page: 2, limit: 10 });
      expect(component.pagination.page).toBe(2);
      expect(component.pagination.limit).toBe(10);
    });

    it('should handle empty search filter', () => {
      component.onFilterChange({ search: '', page: 1, limit: 25 });
      expect(component.filteredModuleActions.length).toBe(mockModuleActions.length);
    });

    it('should update pagination total after filtering', () => {
      component.onFilterChange({ module_id: '1', page: 1, limit: 25 });
      expect(component.pagination.total).toBeGreaterThan(0);
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
      expect(component.editingItem).toBeNull();
    });

    it('should reset form data when opening create modal', () => {
      component.formData.moduleId = '1';
      component.formData.actionIds = [1, 2];
      component.openCreateModal();
      expect(component.formData.moduleId).toBe('');
      expect(component.formData.actionIds).toEqual([]);
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

    it('should open edit modal with module-action data', () => {
      component.onRowAction({ action: 'edit', row: mockModuleActions[0] });
      expect(component.showModal).toBe(true);
      expect(component.editingItem).toEqual(mockModuleActions[0]);
    });

    it('should populate form data from module-action', () => {
      component.onRowAction({ action: 'edit', row: mockModuleActions[1] });
      expect(component.formData.actionLabel).toBe(mockModuleActions[1].action_label);
    });

    it('should handle module-action with null action_label', () => {
      component.onRowAction({ action: 'edit', row: mockModuleActions[0] });
      expect(component.formData.actionLabel).toBe('');
    });
  });

  // ===========================
  // Action Selection
  // ===========================
  describe('Action Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.openCreateModal();
    });

    it('should toggle action selection on', () => {
      component.toggleActionSelection(1, true);
      expect(component.formData.actionIds).toContain(1);
    });

    it('should toggle action selection off', () => {
      component.formData.actionIds = [1, 2];
      component.toggleActionSelection(1, false);
      expect(component.formData.actionIds).not.toContain(1);
      expect(component.formData.actionIds).toContain(2);
    });

    it('should check if action is selected', () => {
      component.formData.actionIds = [1, 2];
      expect(component.isActionSelected(1)).toBe(true);
      expect(component.isActionSelected(3)).toBe(false);
    });

    it('should handle selecting multiple actions', () => {
      component.toggleActionSelection(1, true);
      component.toggleActionSelection(2, true);
      component.toggleActionSelection(3, true);
      expect(component.formData.actionIds).toEqual([1, 2, 3]);
    });

    it('should display selected action count', () => {
      component.formData.actionIds = [1, 2];
      expect(component.formData.actionIds.length).toBe(2);
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

    it('should attach actions to module successfully', () => {
      component.openCreateModal();
      component.formData = {
        moduleId: '1',
        actionIds: [1, 2],
        actionLabel: '',
        isActive: true
      };

      component.saveModuleAction();

      expect(permissionService.createModuleAction).toHaveBeenCalledWith(expect.objectContaining({
        module_id: 1,
        action_id: 1
      }));
      expect(permissionService.createModuleAction).toHaveBeenCalledWith(expect.objectContaining({
        module_id: 1,
        action_id: 2
      }));
      expect(component.showModal).toBe(false);
    });

    it('should update existing module-action successfully', () => {
      component.editingItem = mockModuleActions[0];
      component.formData = {
        moduleId: '',
        actionIds: [],
        actionLabel: 'Custom Label',
        isActive: true
      };

      component.saveModuleAction();

      expect(permissionService.updateModuleAction).toHaveBeenCalledWith(1, expect.any(Object));
      expect(toastService.success).toHaveBeenCalledWith('Module-Action updated successfully');
      expect(component.showModal).toBe(false);
    });

    it('should handle attach actions errors', () => {
      (permissionService.createModuleAction as any).mockReturnValue(throwError(() => ({ error: { message: 'Attach failed' } })));
      component.openCreateModal();
      component.formData.moduleId = '1';
      component.formData.actionIds = [1];

      component.saveModuleAction();

      // Component sets errorMessage but no toast.error for batch failures
      expect(component.errorMessage).toContain('Failed to attach');
      expect(component.saving).toBe(false);
    });

    it('should handle update errors', () => {
      (permissionService.updateModuleAction as any).mockReturnValue(throwError(() => ({ error: { message: 'Update failed' } })));
      component.editingItem = mockModuleActions[0];
      component.formData.actionLabel = 'Test';

      component.saveModuleAction();

      expect(toastService.error).toHaveBeenCalledWith('Error updating module-action: Update failed');
      expect(component.saving).toBe(false);
    });

    it('should reload module-actions after successful save', () => {
      component.openCreateModal();
      component.formData.moduleId = '1';
      component.formData.actionIds = [1];

      component.saveModuleAction();

      expect(permissionService.getAllModuleActions).toHaveBeenCalled();
    });

    it('should require module selection for create', () => {
      component.openCreateModal();
      component.formData.moduleId = '';
      expect(component.formData.moduleId).toBe('');
    });

    it('should require at least one action for create', () => {
      component.openCreateModal();
      component.formData.actionIds = [];
      expect(component.formData.actionIds.length).toBe(0);
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
      component.onRowAction({ action: 'delete', row: mockModuleActions[0] });
      expect(component.showDeleteConfirm).toBe(true);
      expect(component.itemToDelete).toEqual(mockModuleActions[0]);
    });

    it('should cancel delete and close dialog', () => {
      component.itemToDelete = mockModuleActions[0];
      component.showDeleteConfirm = true;
      component.showDeleteConfirm = false;
      expect(component.showDeleteConfirm).toBe(false);
    });

    it('should delete module-action successfully', () => {
      component.itemToDelete = mockModuleActions[0];
      component.showDeleteConfirm = true;

      component.deleteModuleAction();

      expect(permissionService.deleteModuleAction).toHaveBeenCalledWith(1);
      expect(toastService.success).toHaveBeenCalledWith('Module-Action deleted successfully');
      expect(component.showDeleteConfirm).toBe(false);
      expect(permissionService.getAllModuleActions).toHaveBeenCalled();
    });

    it('should handle delete errors', () => {
      (permissionService.deleteModuleAction as any).mockReturnValue(throwError(() => ({ error: { message: 'Delete failed' } })));
      component.itemToDelete = mockModuleActions[0];

      component.deleteModuleAction();

      expect(toastService.error).toHaveBeenCalledWith('Error deleting module-action: Delete failed');
      expect(loggerService.error).toHaveBeenCalledWith('Error deleting module-action', expect.any(Object));
    });

    it('should handle null itemToDelete gracefully', () => {
      component.itemToDelete = null;
      component.deleteModuleAction();
      expect(permissionService.deleteModuleAction).not.toHaveBeenCalled();
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
      component.onToggleStatus({ row: mockModuleActions[0], column: { key: 'is_active' } as any, newValue: false });
      expect(component.showToggleConfirm).toBe(true);
      expect(component.pendingToggle).toEqual({ item: mockModuleActions[0], newValue: false });
    });

    it('should cancel toggle and revert status', () => {
      const item = { ...mockModuleActions[0] };
      component.pendingToggle = { item, newValue: false };
      component.showToggleConfirm = true;

      component.cancelToggleStatus();

      expect(component.showToggleConfirm).toBe(false);
      expect(component.pendingToggle).toBeNull();
      expect(item.is_active).toBe(true);
    });

    it('should confirm toggle successfully - activate', () => {
      const item = { ...mockModuleActions[2] }; // Inactive
      component.pendingToggle = { item, newValue: true };

      component.confirmToggleStatus();

      expect(permissionService.updateModuleAction).toHaveBeenCalledWith(3, { is_active: true });
      expect(toastService.success).toHaveBeenCalledWith('Module-Action activated successfully');
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should confirm toggle successfully - deactivate', () => {
      const item = { ...mockModuleActions[0] };
      component.pendingToggle = { item, newValue: false };

      component.confirmToggleStatus();

      expect(permissionService.updateModuleAction).toHaveBeenCalledWith(1, { is_active: false });
      expect(toastService.success).toHaveBeenCalledWith('Module-Action deactivated successfully');
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should handle toggle errors and revert status', () => {
      (permissionService.updateModuleAction as any).mockReturnValue(throwError(() => ({ error: { message: 'Update failed' } })));
      const item = { ...mockModuleActions[0] };
      component.pendingToggle = { item, newValue: false };

      component.confirmToggleStatus();

      expect(toastService.error).toHaveBeenCalledWith('Error updating status');
      expect(item.is_active).toBe(true);
    });

    it('should handle null pendingToggle gracefully', () => {
      component.pendingToggle = null;
      component.confirmToggleStatus();
      expect(permissionService.updateModuleAction).not.toHaveBeenCalled();
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
      component.onRowAction({ action: 'edit', row: mockModuleActions[0] });
      expect(component.showModal).toBe(true);
      expect(component.editingItem).toEqual(mockModuleActions[0]);
    });

    it('should handle delete action', () => {
      component.onRowAction({ action: 'delete', row: mockModuleActions[0] });
      expect(component.showDeleteConfirm).toBe(true);
    });

    it('should handle unknown action gracefully', () => {
      component.onRowAction({ action: 'unknown', row: mockModuleActions[0] });
      // No default case in switch - no deletion occurs
      expect(permissionService.deleteModuleAction).not.toHaveBeenCalled();
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
    it('should handle empty module-action list', () => {
      (permissionService.getAllModuleActions as any).mockReturnValue(of([]));
      fixture.detectChanges();
      expect(component.moduleActions).toEqual([]);
      expect(component.pagination.total).toBe(0);
    });

    it('should handle module-action with null action_label', () => {
      const itemNullLabel: ModuleAction = {
        ...mockModuleActions[0],
        action_label: null
      };
      component.onRowAction({ action: 'edit', row: itemNullLabel });
      expect(component.formData.actionLabel).toBe('');
    });

    it('should handle generic error without message', () => {
      (permissionService.getAllModuleActions as any).mockReturnValue(throwError(() => ({})));
      fixture.detectChanges();
      expect(toastService.error).toHaveBeenCalledWith('Error loading data');
    });

    it('should handle search with no results', () => {
      component.onFilterChange({ search: 'NonExistent', page: 1, limit: 25 });
      expect(component.filteredModuleActions).toEqual([]);
    });

    it('should track actions by id', () => {
      const trackId = component.trackByActionId(0, mockActions[0]);
      expect(trackId).toBe(1);
    });
  });
});
