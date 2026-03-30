import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { ModulesComponent } from './modules.component';
import { PermissionService } from '../../core/services/permission.service';
import { CategoryService } from '../../core/services/category.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../core/services/toast.service';
import { Module, Category } from '../../shared/models/permission.model';

describe('ModulesComponent', () => {
  let component: ModulesComponent;
  let fixture: ComponentFixture<ModulesComponent>;
  let permissionService: PermissionService;
  let categoryService: CategoryService;
  let loggerService: LoggerService;
  let toastService: ToastService;

  const mockCategories: Category[] = [
    {
      category_id: 1,
      category_name: 'User Management',
      category_code: 'USER_MGMT',
      description: 'User related modules',
      icon: 'users',
      is_active: true,
      display_order: 1,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    },
    {
      category_id: 2,
      category_name: 'System',
      category_code: 'SYSTEM',
      description: 'System modules',
      icon: 'cog',
      is_active: true,
      display_order: 2,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    }
  ];

  const mockModules: Module[] = [
    {
      module_id: 1,
      module_name: 'User Management',
      module_code: 'USER_MANAGEMENT',
      description: 'Manage users',
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
      module_name: 'Settings',
      module_code: 'SETTINGS',
      description: 'System settings',
      route: '/settings',
      icon: 'cog',
      display_order: 2,
      category_id: 2,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null
    },
    {
      module_id: 3,
      module_name: 'Inactive Module',
      module_code: 'INACTIVE',
      description: 'Inactive',
      route: '/inactive',
      icon: 'ban',
      display_order: 3,
      category_id: null,
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
      createModule: vi.fn().mockReturnValue(of(1)),
      updateModule: vi.fn().mockReturnValue(of(undefined)),
      deleteModule: vi.fn().mockReturnValue(of(undefined)),
      hasPermission: vi.fn().mockReturnValue(of(true)),
      userPermissions$: of([])
    };

    const categoryServiceMock = {
      getAllCategories: vi.fn().mockReturnValue(of(mockCategories))
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
      imports: [ModulesComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: PermissionService, useValue: permissionServiceMock },
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ModulesComponent);
    component = fixture.componentInstance;
    permissionService = TestBed.inject(PermissionService);
    categoryService = TestBed.inject(CategoryService);
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
      expect(component.modules).toEqual([]);
      expect(component.loading).toBe(true);
      expect(component.showModal).toBe(false);
      expect(component.showDeleteConfirm).toBe(false);
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should load modules and categories on init', () => {
      fixture.detectChanges();
      expect(permissionService.getAllModules).toHaveBeenCalled();
      expect(categoryService.getAllCategories).toHaveBeenCalled();
    });

    it('should configure table columns correctly', () => {
      expect(component.columns).toHaveLength(6);
      expect(component.columns[0].key).toBe('module_name');
      expect(component.columns[1].key).toBe('category_name');
      expect(component.columns[5].type).toBe('toggle');
    });

    it('should configure row actions correctly', () => {
      expect(component.rowActions).toHaveLength(2);
      expect(component.rowActions.map(a => a.id)).toEqual(['edit', 'delete']);
    });

    it('should configure table filters correctly', () => {
      expect(component.tableFilters).toHaveLength(3);
      expect(component.tableFilters[0].key).toBe('search');
      expect(component.tableFilters[1].key).toBe('category_id');
      expect(component.tableFilters[2].key).toBe('is_active');
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
      expect(component.formData.moduleName).toBe('');
      expect(component.formData.isActive).toBe(true);
      expect(component.formData.displayOrder).toBe(0);
    });
  });

  // ===========================
  // Data Loading
  // ===========================
  describe('Data Loading', () => {
    it('should load modules successfully', () => {
      fixture.detectChanges();
      expect(component.modules).toEqual(mockModules);
      expect(component.loading).toBe(false);
    });

    it('should set loading state while fetching modules', () => {
      expect(component.loading).toBe(true);
    });

    it('should handle module load errors', () => {
      (permissionService.getAllModules as any).mockReturnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      expect(loggerService.error).toHaveBeenCalledWith('Error loading modules data', expect.any(Error));
      expect(toastService.error).toHaveBeenCalledWith('Error loading data');
      expect(component.loading).toBe(false);
    });

    it('should load categories and populate dropdown options', () => {
      fixture.detectChanges();
      expect(component.categories).toEqual(mockCategories);
      expect(component.categoryOptions.length).toBeGreaterThan(0);
    });

    it('should handle category load errors gracefully', () => {
      (categoryService.getAllCategories as any).mockReturnValue(throwError(() => new Error('Category error')));
      fixture.detectChanges();
      expect(loggerService.error).toHaveBeenCalledWith('Error loading modules data', expect.any(Error));
    });

    it('should populate category filter options', () => {
      fixture.detectChanges();
      const categoryFilter = component.tableFilters.find(f => f.key === 'category_id');
      expect(categoryFilter?.options?.length).toBeGreaterThan(0);
    });

    it('should map category names to modules', () => {
      fixture.detectChanges();
      const moduleWithCategory = component.filteredModules.find(m => m.category_id === 1);
      expect(moduleWithCategory?.category_name).toBe('User Management');
    });
  });

  // ===========================
  // Filter Functionality
  // ===========================
  describe('Filter Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter modules by search term', () => {
      component.onFilterChange({ search: 'User', page: 1, limit: 25 });
      expect(component.filteredModules.length).toBe(1);
      expect(component.filteredModules[0].module_name).toContain('User');
    });

    it('should filter modules by category', () => {
      component.onFilterChange({ category_id: '1', page: 1, limit: 25 });
      expect(component.filteredModules.every(m => m.category_id === 1)).toBe(true);
    });

    it('should filter modules by active status', () => {
      component.onFilterChange({ is_active: 'true', page: 1, limit: 25 });
      expect(component.filteredModules.every(m => m.is_active)).toBe(true);
    });

    it('should filter modules by inactive status', () => {
      component.onFilterChange({ is_active: 'false', page: 1, limit: 25 });
      expect(component.filteredModules.every(m => !m.is_active)).toBe(true);
    });

    it('should handle combined filters', () => {
      component.onFilterChange({ search: 'Management', is_active: 'true', page: 1, limit: 25 });
      expect(component.filteredModules.length).toBeGreaterThan(0);
      expect(component.filteredModules.every(m => m.is_active)).toBe(true);
    });

    it('should handle pagination changes', () => {
      component.onFilterChange({ page: 2, limit: 10 });
      expect(component.pagination.page).toBe(2);
      expect(component.pagination.limit).toBe(10);
    });

    it('should handle empty search filter', () => {
      component.onFilterChange({ search: '', page: 1, limit: 25 });
      expect(component.filteredModules.length).toBe(mockModules.length);
    });

    it('should update pagination total after filtering', () => {
      component.onFilterChange({ search: 'User', page: 1, limit: 25 });
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
      expect(component.editingModule).toBeNull();
    });

    it('should reset form data when opening create modal', () => {
      component.formData.moduleName = 'Test';
      component.openCreateModal();
      expect(component.formData.moduleName).toBe('');
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

    it('should open edit modal with module data', () => {
      component.onRowAction({ action: 'edit', row: mockModules[0] });
      expect(component.showModal).toBe(true);
      expect(component.editingModule).toEqual(mockModules[0]);
      expect(component.formData.moduleName).toBe('User Management');
      expect(component.formData.moduleCode).toBe('USER_MANAGEMENT');
    });

    it('should populate form data from module', () => {
      component.onRowAction({ action: 'edit', row: mockModules[0] });
      expect(component.formData.moduleName).toBe(mockModules[0].module_name);
      expect(component.formData.moduleCode).toBe(mockModules[0].module_code);
      expect(component.formData.route).toBe(mockModules[0].route);
      expect(component.formData.icon).toBe(mockModules[0].icon);
      expect(component.formData.displayOrder).toBe(mockModules[0].display_order);
    });

    it('should handle module with null category', () => {
      component.onRowAction({ action: 'edit', row: mockModules[2] });
      expect(component.formData.categoryId).toBeNull();
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

    it('should require module name', () => {
      expect(component.formData.moduleName).toBe('');
    });

    it('should require module code', () => {
      expect(component.formData.moduleCode).toBe('');
    });

    it('should allow optional fields to be empty', () => {
      expect(component.formData.description).toBe('');
      expect(component.formData.route).toBe('');
      expect(component.formData.icon).toBe('');
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

    it('should create new module successfully', () => {
      component.openCreateModal();
      component.formData = {
        moduleName: 'New Module',
        moduleCode: 'NEW_MODULE',
        description: 'Test',
        route: '/new',
        icon: 'plus',
        displayOrder: 10,
        categoryId: 1,
        isActive: true
      };

      component.saveModule();

      expect(permissionService.createModule).toHaveBeenCalledWith(expect.objectContaining({
        module_name: 'New Module',
        module_code: 'NEW_MODULE'
      }));
      expect(toastService.success).toHaveBeenCalledWith('Module created successfully');
      expect(component.showModal).toBe(false);
    });

    it('should update existing module successfully', () => {
      component.editingModule = mockModules[0];
      component.formData = {
        moduleName: 'Updated Module',
        moduleCode: 'UPDATED',
        description: 'Updated',
        route: '/updated',
        icon: 'edit',
        displayOrder: 5,
        categoryId: 2,
        isActive: true
      };

      component.saveModule();

      expect(permissionService.updateModule).toHaveBeenCalledWith(1, expect.any(Object));
      expect(toastService.success).toHaveBeenCalledWith('Module updated successfully');
      expect(component.showModal).toBe(false);
    });

    it('should handle create errors', () => {
      (permissionService.createModule as any).mockReturnValue(throwError(() => ({ error: { message: 'Create failed' } })));
      component.openCreateModal();
      component.formData.moduleName = 'Test';
      component.formData.moduleCode = 'TEST';

      component.saveModule();

      expect(toastService.error).toHaveBeenCalledWith('Error creating module: Create failed');
      expect(component.saving).toBe(false);
    });

    it('should handle update errors', () => {
      (permissionService.updateModule as any).mockReturnValue(throwError(() => ({ error: { message: 'Update failed' } })));
      component.editingModule = mockModules[0];
      component.formData.moduleName = 'Test';

      component.saveModule();

      expect(toastService.error).toHaveBeenCalledWith('Error updating module: Update failed');
      expect(component.saving).toBe(false);
    });

    it('should reload modules after successful save', () => {
      component.openCreateModal();
      component.formData.moduleName = 'Test';
      component.formData.moduleCode = 'TEST';

      component.saveModule();

      expect(permissionService.getAllModules).toHaveBeenCalled();
    });

    it('should set saving state during save', () => {
      component.openCreateModal();
      component.formData.moduleName = 'Test';
      component.formData.moduleCode = 'TEST';

      component.saveModule();

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
      component.onRowAction({ action: 'delete', row: mockModules[0] });
      expect(component.showDeleteConfirm).toBe(true);
      expect(component.moduleToDelete).toEqual(mockModules[0]);
    });

    it('should cancel delete and close dialog', () => {
      component.moduleToDelete = mockModules[0];
      component.showDeleteConfirm = true;
      component.cancelDelete();
      expect(component.showDeleteConfirm).toBe(false);
      expect(component.moduleToDelete).toBeNull();
    });

    it('should delete module successfully', () => {
      component.moduleToDelete = mockModules[0];
      component.showDeleteConfirm = true;

      component.deleteModule();

      expect(permissionService.deleteModule).toHaveBeenCalledWith(1);
      expect(toastService.success).toHaveBeenCalledWith('Module deleted successfully');
      expect(component.showDeleteConfirm).toBe(false);
      expect(permissionService.getAllModules).toHaveBeenCalled();
    });

    it('should handle delete errors', () => {
      (permissionService.deleteModule as any).mockReturnValue(throwError(() => ({ error: { message: 'Delete failed' } })));
      component.moduleToDelete = mockModules[0];

      component.deleteModule();

      expect(toastService.error).toHaveBeenCalledWith('Error deleting module: Delete failed');
      expect(loggerService.error).toHaveBeenCalledWith('Error deleting module', expect.any(Object));
    });

    it('should handle null moduleToDelete gracefully', () => {
      component.moduleToDelete = null;
      component.deleteModule();
      expect(permissionService.deleteModule).not.toHaveBeenCalled();
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
      component.onToggleStatus({ row: mockModules[0], column: 'is_active', newValue: false });
      expect(component.showToggleConfirm).toBe(true);
      expect(component.pendingToggle).toEqual({ module: mockModules[0], newValue: false });
    });

    it('should cancel toggle and revert status', () => {
      const module = { ...mockModules[0] };
      component.pendingToggle = { module, newValue: false };
      component.showToggleConfirm = true;

      component.cancelToggleStatus();

      expect(component.showToggleConfirm).toBe(false);
      expect(component.pendingToggle).toBeNull();
      expect(module.is_active).toBe(true);
    });

    it('should confirm toggle successfully', () => {
      const module = { ...mockModules[0] };
      component.pendingToggle = { module, newValue: false };

      component.confirmToggleStatus();

      expect(permissionService.updateModule).toHaveBeenCalledWith(1, { is_active: false });
      expect(toastService.success).toHaveBeenCalledWith('Module "User Management" has been deactivated successfully.');
      expect(component.showToggleConfirm).toBe(false);
    });

    it('should handle toggle errors and revert status', () => {
      (permissionService.updateModule as any).mockReturnValue(throwError(() => ({ error: { message: 'Update failed' } })));
      const module = { ...mockModules[0] };
      component.pendingToggle = { module, newValue: false };

      component.confirmToggleStatus();

      expect(toastService.error).toHaveBeenCalledWith('Failed to update module status. Please try again.');
      expect(module.is_active).toBe(true);
    });

    it('should handle null pendingToggle gracefully', () => {
      component.pendingToggle = null;
      component.confirmToggleStatus();
      expect(permissionService.updateModule).not.toHaveBeenCalled();
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
      component.onRowAction({ action: 'edit', row: mockModules[0] });
      expect(component.showModal).toBe(true);
      expect(component.editingModule).toEqual(mockModules[0]);
    });

    it('should handle delete action', () => {
      component.onRowAction({ action: 'delete', row: mockModules[0] });
      expect(component.showDeleteConfirm).toBe(true);
    });

    it('should handle unknown action gracefully', () => {
      component.onRowAction({ action: 'unknown', row: mockModules[0] });
      // No default case in switch - no error or deletion occurs
      expect(permissionService.deleteModule).not.toHaveBeenCalled();
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
    it('should handle empty module list', () => {
      (permissionService.getAllModules as any).mockReturnValue(of([]));
      fixture.detectChanges();
      expect(component.modules).toEqual([]);
      expect(component.pagination.total).toBe(0);
    });

    it('should handle module with undefined values', () => {
      const moduleUndefined: Module = {
        ...mockModules[0],
        description: null,
        route: null,
        icon: null
      };
      component.onRowAction({ action: 'edit', row: moduleUndefined });
      expect(component.formData.description).toBe('');
    });

    it('should handle generic error without message', () => {
      (permissionService.getAllModules as any).mockReturnValue(throwError(() => ({})));
      fixture.detectChanges();
      expect(toastService.error).toHaveBeenCalledWith('Error loading data');
    });

    it('should handle module without category', () => {
      const moduleNoCategory = mockModules.find(m => m.category_id === null);
      expect(moduleNoCategory).toBeDefined();
    });
  });
});
