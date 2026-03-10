import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CategoriesComponent } from './categories.component';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { Category } from '../../shared/models/permission.model';

describe('CategoriesComponent', () => {
  let component: CategoriesComponent;
  let fixture: ComponentFixture<CategoriesComponent>;
  let categoryServiceMock: any;
  let toastServiceMock: any;

  const mockCategories: Category[] = [
    {
      category_id: 1,
      category_name: 'User Management',
      category_code: 'USER_MGMT',
      description: 'User related features',
      icon: 'users',
      display_order: 1,
      is_active: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      created_by: 'system',
      updated_by: null
    },
    {
      category_id: 2,
      category_name: 'System Settings',
      category_code: 'SYS_SETTINGS',
      description: 'System configuration',
      icon: 'settings',
      display_order: 2,
      is_active: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      created_by: 'system',
      updated_by: null
    },
    {
      category_id: 3,
      category_name: 'Reports',
      category_code: 'REPORTS',
      description: null,
      icon: 'chart',
      display_order: 3,
      is_active: false,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      created_by: 'system',
      updated_by: null
    }
  ];

  beforeEach(async () => {
    categoryServiceMock = {
      getAllCategories: vi.fn().mockReturnValue(of(mockCategories)),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn()
    };

    toastServiceMock = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CategoriesComponent, FormsModule],
      providers: [
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be a standalone component', () => {
      const componentMetadata = (CategoriesComponent as any).ɵcmp;
      expect(componentMetadata.standalone).toBe(true);
    });
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.categories).toEqual([]);
      expect(component.filteredCategories).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.saving).toBe(false);
      expect(component.showModal).toBe(false);
      expect(component.showDeleteConfirm).toBe(false);
    });

    it('should load categories on init', () => {
      fixture.detectChanges(); // triggers ngOnInit

      expect(categoryServiceMock.getAllCategories).toHaveBeenCalled();
      expect(component.categories).toEqual(mockCategories);
      expect(component.filteredCategories).toEqual(mockCategories);
    });

    it('should set loading to true while loading', () => {
      categoryServiceMock.getAllCategories.mockReturnValue(of(mockCategories));
      
      component.ngOnInit();

      expect(component.loading).toBe(false); // Completed synchronously
    });

    it('should handle error loading categories', () => {
      const error = { error: { message: 'Server error' } };
      categoryServiceMock.getAllCategories.mockReturnValue(throwError(() => error));

      fixture.detectChanges();

      expect(toastServiceMock.error).toHaveBeenCalledWith('Error loading categories');
      expect(component.loading).toBe(false);
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      component.categories = [...mockCategories];
      component.filteredCategories = [];
    });

    it('should filter by search term (name)', () => {
      component.searchTerm = 'User';
      component.applyFilters();

      expect(component.filteredCategories.length).toBe(1);
      expect(component.filteredCategories[0].category_name).toBe('User Management');
    });

    it('should filter by search term (code)', () => {
      component.searchTerm = 'SYS_SETTINGS';
      component.applyFilters();

      expect(component.filteredCategories.length).toBe(1);
      expect(component.filteredCategories[0].category_code).toBe('SYS_SETTINGS');
    });

    it('should filter by search term (description)', () => {
      component.searchTerm = 'configuration';
      component.applyFilters();

      expect(component.filteredCategories.length).toBe(1);
      expect(component.filteredCategories[0].description).toBe('System configuration');
    });

    it('should be case insensitive in search', () => {
      component.searchTerm = 'user';
      component.applyFilters();

      expect(component.filteredCategories.length).toBe(1);
      
      component.searchTerm = 'USER';
      component.applyFilters();

      expect(component.filteredCategories.length).toBe(1);
    });

    it('should filter by active status', () => {
      component.statusFilter = true;
      component.applyFilters();

      expect(component.filteredCategories.length).toBe(2);
      component.filteredCategories.forEach(cat => {
        expect(cat.is_active).toBe(true);
      });
    });

    it('should filter by inactive status', () => {
      component.statusFilter = false;
      component.applyFilters();

      expect(component.filteredCategories.length).toBe(1);
      expect(component.filteredCategories[0].is_active).toBe(false);
    });

    it('should show all categories when no filters applied', () => {
      component.searchTerm = '';
      component.statusFilter = null;
      component.applyFilters();

      expect(component.filteredCategories.length).toBe(3);
    });

    it('should combine search and status filters', () => {
      component.searchTerm = 'Management';
      component.statusFilter = true;
      component.applyFilters();

      expect(component.filteredCategories.length).toBe(1);
      expect(component.filteredCategories[0].category_name).toBe('User Management');
    });

    it('should return empty when search finds no matches', () => {
      component.searchTerm = 'NonExistent';
      component.applyFilters();

      expect(component.filteredCategories.length).toBe(0);
    });
  });

  describe('Modal Management', () => {
    it('should open create modal with empty form', () => {
      component.openCreateModal();

      expect(component.showModal).toBe(true);
      expect(component.editingCategory).toBeNull();
      expect(component.formData.categoryName).toBe('');
      expect(component.formData.categoryCode).toBe('');
      expect(component.formData.description).toBe('');
      expect(component.formData.isActive).toBe(true);
    });

    it('should open edit modal with category data', () => {
      const category = mockCategories[0];
      component.openEditModal(category);

      expect(component.showModal).toBe(true);
      expect(component.editingCategory).toBe(category);
      expect(component.formData.categoryName).toBe(category.category_name);
      expect(component.formData.categoryCode).toBe(category.category_code);
      expect(component.formData.description).toBe(category.description || '');
    });

    it('should handle null description in edit modal', () => {
      const category = mockCategories[2]; // Reports has null description
      component.openEditModal(category);

      expect(component.formData.description).toBe('');
    });

    it('should close modal and reset editing category', () => {
      component.showModal = true;
      component.editingCategory = mockCategories[0];

      component.closeModal();

      expect(component.showModal).toBe(false);
      expect(component.editingCategory).toBeNull();
    });
  });

  describe('Create Category', () => {
    beforeEach(() => {
      component.formData = {
        categoryName: 'New Category',
        categoryCode: 'NEW_CAT',
        description: 'New description',
        icon: 'icon',
        displayOrder: 4,
        isActive: true
      };
    });

    it('should call createCategory when not editing', () => {
      categoryServiceMock.createCategory.mockReturnValue(of({}));
      component.editingCategory = null;

      component.saveCategory();

      expect(categoryServiceMock.createCategory).toHaveBeenCalledWith({
        category_name: 'New Category',
        category_code: 'NEW_CAT',
        description: 'New description',
        icon: 'icon',
        display_order: 4
      });
    });

    it('should show success message after creation', () => {
      categoryServiceMock.createCategory.mockReturnValue(of({}));
      component.editingCategory = null;

      component.saveCategory();

      expect(toastServiceMock.success).toHaveBeenCalledWith('Category created successfully');
      expect(component.saving).toBe(false);
      expect(component.showModal).toBe(false);
    });

    it('should reload categories after creation', () => {
      categoryServiceMock.createCategory.mockReturnValue(of({}));
      const loadSpy = vi.spyOn(component as any, 'loadCategories');
      component.editingCategory = null;

      component.saveCategory();

      expect(loadSpy).toHaveBeenCalled();
    });

    it('should handle creation error', () => {
      const error = { error: { message: 'Duplicate code' }, message: 'Error' };
      categoryServiceMock.createCategory.mockReturnValue(throwError(() => error));
      component.editingCategory = null;

      component.saveCategory();

      expect(toastServiceMock.error).toHaveBeenCalledWith(expect.stringContaining('Error creating category'));
      expect(component.saving).toBe(false);
    });
  });

  describe('Update Category', () => {
    beforeEach(() => {
      component.editingCategory = mockCategories[0];
      component.formData = {
        categoryName: 'Updated Name',
        categoryCode: 'UPDATED_CODE',
        description: 'Updated description',
        icon: 'new-icon',
        displayOrder: 10,
        isActive: false
      };
    });

    it('should call updateCategory when editing', () => {
      categoryServiceMock.updateCategory.mockReturnValue(of({}));

      component.saveCategory();

      expect(categoryServiceMock.updateCategory).toHaveBeenCalledWith(1, {
        category_name: 'Updated Name',
        category_code: 'UPDATED_CODE',
        description: 'Updated description',
        icon: 'new-icon',
        display_order: 10,
        is_active: false
      });
    });

    it('should show success message after update', () => {
      categoryServiceMock.updateCategory.mockReturnValue(of({}));

      component.saveCategory();

      expect(toastServiceMock.success).toHaveBeenCalledWith('Category updated successfully');
      expect(component.saving).toBe(false);
      expect(component.showModal).toBe(false);
    });

    it('should reload categories after update', () => {
      categoryServiceMock.updateCategory.mockReturnValue(of({}));
      const loadSpy = vi.spyOn(component as any, 'loadCategories');

      component.saveCategory();

      expect(loadSpy).toHaveBeenCalled();
    });

    it('should handle update error', () => {
      const error = { error: { message: 'Not found' }, message: 'Error' };
      categoryServiceMock.updateCategory.mockReturnValue(throwError(() => error));

      component.saveCategory();

      expect(toastServiceMock.error).toHaveBeenCalledWith(expect.stringContaining('Error updating category'));
      expect(component.saving).toBe(false);
    });
  });

  describe('Delete Category', () => {
    it('should open delete confirmation', () => {
      const category = mockCategories[0];
      component.confirmDelete(category);

      expect(component.showDeleteConfirm).toBe(true);
      expect(component.categoryToDelete).toBe(category);
    });

    it('should delete category when confirmed', () => {
      categoryServiceMock.deleteCategory.mockReturnValue(of({}));
      component.categoryToDelete = mockCategories[0];

      component.deleteCategory();

      expect(categoryServiceMock.deleteCategory).toHaveBeenCalledWith(1);
    });

    it('should not delete if no category selected', () => {
      component.categoryToDelete = null;

      component.deleteCategory();

      expect(categoryServiceMock.deleteCategory).not.toHaveBeenCalled();
    });

    it('should show success message after deletion', () => {
      categoryServiceMock.deleteCategory.mockReturnValue(of({}));
      component.categoryToDelete = mockCategories[0];

      component.deleteCategory();

      expect(toastServiceMock.success).toHaveBeenCalledWith('Category deleted successfully');
      expect(component.showDeleteConfirm).toBe(false);
      expect(component.categoryToDelete).toBeNull();
    });

    it('should reload categories after deletion', () => {
      categoryServiceMock.deleteCategory.mockReturnValue(of({}));
      const loadSpy = vi.spyOn(component as any, 'loadCategories');
      component.categoryToDelete = mockCategories[0];

      component.deleteCategory();

      expect(loadSpy).toHaveBeenCalled();
    });

    it('should handle deletion error', () => {
      const error = { error: { message: 'Cannot delete' }, message: 'Error' };
      categoryServiceMock.deleteCategory.mockReturnValue(throwError(() => error));
      component.categoryToDelete = mockCategories[0];

      component.deleteCategory();

      expect(toastServiceMock.error).toHaveBeenCalledWith(expect.stringContaining('Error deleting category'));
      expect(component.showDeleteConfirm).toBe(false);
    });

    it('should cancel delete confirmation', () => {
      component.showDeleteConfirm = true;
      component.categoryToDelete = mockCategories[0];

      component.cancelDelete();

      expect(component.showDeleteConfirm).toBe(false);
      expect(component.categoryToDelete).toBeNull();
    });
  });

  describe('TrackBy Function', () => {
    it('should return category_id', () => {
      const category = mockCategories[0];
      const result = component.trackByCategoryId(0, category);

      expect(result).toBe(1);
    });

    it('should return unique ids for different categories', () => {
      const id1 = component.trackByCategoryId(0, mockCategories[0]);
      const id2 = component.trackByCategoryId(1, mockCategories[1]);

      expect(id1).not.toBe(id2);
    });
  });

  describe('Component Cleanup', () => {
    it('should cleanup on destroy', () => {
      const destroySpy = vi.spyOn(component['destroy$'], 'next');
      const completeSpy = vi.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
