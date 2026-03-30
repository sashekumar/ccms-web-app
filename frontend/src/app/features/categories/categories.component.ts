import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../../core/services/category.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../core/services/toast.service';
import { Category } from '../../shared/models/permission.model';
import { DataTableComponent, DataTableColumn, DataTableAction, DataTableFilter, DataTablePagination, DataTableFilterState, DataTableRowActionEvent } from '../../shared/components/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { TextInputComponent } from '../../shared/components/ui/text-input/text-input.component';
import { TextAreaComponent } from '../../shared/components/ui/text-area/text-area.component';
import { CheckboxComponent } from '../../shared/components/ui/checkbox/checkbox.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ConfirmDialogComponent, TextInputComponent, TextAreaComponent, CheckboxComponent, ButtonComponent],
  templateUrl: './categories.component.html',
  styles: []
})
export class CategoriesComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  loading = false;
  saving = false;
  showModal = false;
  showDeleteConfirm = false;
  showToggleConfirm = false;
  editingCategory: Category | null = null;
  categoryToDelete: Category | null = null;
  pendingToggle: { category: Category; newValue: boolean } | null = null;
  successMessage = '';
  errorMessage = '';

  // Filters
  searchTerm = '';
  statusFilter: boolean | null = null;

  // Form data
  formData = {
    categoryName: '',
    categoryCode: '',
    description: '',
    icon: '',
    displayOrder: 0,
    isActive: true
  };

  private destroy$ = new Subject<void>();

  // DataTable Configuration
  pagination: DataTablePagination = {
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 0
  };

  tableFilters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by name, code, or description...',
      inputType: 'string'
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    }
  ];

  columns: DataTableColumn[] = [
    {
      key: 'category_name',
      label: 'Category Name',
      type: 'avatar',
      sortable: true,
      avatarSubKey: 'category_code',
      avatarSubPrefix: 'Code: '
    },
    {
      key: 'description',
      label: 'Description',
      type: 'text',
      sortable: false
    },
    {
      key: 'display_order',
      label: 'Display Order',
      type: 'number',
      sortable: true
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'toggle',
      sortable: true
    }
  ];

  rowActions: DataTableAction[] = [
    {
      id: 'edit',
      title: 'Edit Category',
      iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'indigo',
      permission: 'CATEGORY_MANAGEMENT.UPDATE'
    },
    {
      id: 'delete',
      title: 'Delete Category',
      iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'red',
      permission: 'CATEGORY_MANAGEMENT.DELETE'
    }
  ];

  constructor(
    private categoryService: CategoryService,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.loading = true;
    this.categoryService.getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.applyFilters();
          this.updatePagination();
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error loading categories', error);
          this.toast.error('Error loading categories');
          this.errorMessage = 'Error loading categories';
          this.loading = false;
          this.clearMessages();
        }
      });
  }

  updatePagination(): void {
    this.pagination = {
      ...this.pagination,
      total: this.filteredCategories.length,
      totalPages: Math.ceil(this.filteredCategories.length / this.pagination.limit)
    };
  }

  applyFilters(): void {
    this.filteredCategories = this.categories.filter(category => {
      // Search filter
      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        const matchesSearch = 
          category.category_name.toLowerCase().includes(search) ||
          category.category_code.toLowerCase().includes(search) ||
          (category.description && category.description.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (this.statusFilter !== null && category.is_active !== this.statusFilter) {
        return false;
      }

      return true;
    });
  }

  onFilterChange(filters: DataTableFilterState): void {
    this.logger.debug('Filter changed:', filters);
    
    // Extract search filter
    this.searchTerm = filters['search'] || '';
    
    // Extract status filter
    if (filters['is_active'] === 'true') {
      this.statusFilter = true;
    } else if (filters['is_active'] === 'false') {
      this.statusFilter = false;
    } else {
      this.statusFilter = null;
    }
    
    // Update pagination from filters
    this.pagination = {
      ...this.pagination,
      page: filters.page,
      limit: filters.limit
    };
    
    // Apply filters and recalculate pagination
    this.applyFilters();
    this.updatePagination();
  }

  getPaginatedData(): Category[] {
    const startIndex = (this.pagination.page - 1) * this.pagination.limit;
    const endIndex = startIndex + this.pagination.limit;
    return this.filteredCategories.slice(startIndex, endIndex);
  }

  onToggleStatus(event: { row: any; column: any; newValue: boolean }): void {
    const category = event.row as Category;
    const newValue = event.newValue;
    // Store pending action and open confirm dialog
    this.pendingToggle = { category, newValue };
    this.showToggleConfirm = true;
  }

  /** Called when user confirms the status toggle */
  confirmToggleStatus(): void {
    if (!this.pendingToggle) return;
    const { category, newValue } = this.pendingToggle;
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    
    this.logger.debug(`Toggling category ${category.category_id} status to: ${newValue}`);
    
    this.categoryService.updateCategory(category.category_id, {
      is_active: newValue
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          category.is_active = newValue;
          const label = newValue ? 'activated' : 'deactivated';
          this.toast.success(`Category "${category.category_name}" has been ${label} successfully.`);
          this.logger.info(`Category ${category.category_id} status updated to: ${newValue}`);
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error updating category status:', error);
          this.toast.error('Failed to update category status. Please try again.');
          // Reload to revert the optimistic update
          this.loadCategories();
        }
      });
  }

  /** Called when user cancels the status toggle */
  cancelToggleStatus(): void {
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    // Reload to revert the optimistic chip state
    this.loadCategories();
  }

  onRowAction(event: DataTableRowActionEvent): void {
    const category = event.row as Category;
    switch (event.action) {
      case 'edit':
        this.openEditModal(category);
        break;
      case 'delete':
        this.confirmDelete(category);
        break;
    }
  }

  openCreateModal(): void {
    this.editingCategory = null;
    this.formData = {
      categoryName: '',
      categoryCode: '',
      description: '',
      icon: '',
      displayOrder: 0,
      isActive: true
    };
    this.showModal = true;
  }

  openEditModal(category: Category): void {
    this.editingCategory = category;
    this.formData = {
      categoryName: category.category_name,
      categoryCode: category.category_code,
      description: category.description || '',
      icon: category.icon || '',
      displayOrder: category.display_order || 0,
      isActive: category.is_active
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingCategory = null;
  }

  saveCategory(): void {
    this.saving = true;
    this.errorMessage = '';

    if (this.editingCategory) {
      this.categoryService.updateCategory(this.editingCategory.category_id, {
        category_name: this.formData.categoryName,
        category_code: this.formData.categoryCode,
        description: this.formData.description,
        icon: this.formData.icon,
        display_order: this.formData.displayOrder,
        is_active: this.formData.isActive
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Category updated successfully');
            this.successMessage = 'Category updated successfully';
            this.saving = false;
            this.closeModal();
            this.loadCategories();
            this.clearMessages();
          },
          error: (error: HttpErrorResponse) => {
            this.logger.error('Error updating category', error);
            this.toast.error('Error updating category: ' + (error.error?.message || error.message));
            this.errorMessage = 'Error updating category: ' + (error.error?.message || error.message);
            this.saving = false;
            this.clearMessages();
          }
        });
    } else {
      this.categoryService.createCategory({
        category_name: this.formData.categoryName,
        category_code: this.formData.categoryCode,
        description: this.formData.description,
        icon: this.formData.icon,
        display_order: this.formData.displayOrder
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Category created successfully');
            this.successMessage = 'Category created successfully';
            this.saving = false;
            this.closeModal();
            this.loadCategories();
            this.clearMessages();
          },
          error: (error: HttpErrorResponse) => {
            this.logger.error('Error creating category', error);
            this.toast.error('Error creating category: ' + (error.error?.message || error.message));
            this.errorMessage = 'Error creating category: ' + (error.error?.message || error.message);
            this.saving = false;
            this.clearMessages();
          }
        });
    }
  }

  confirmDelete(category: Category): void {
    this.categoryToDelete = category;
    this.showDeleteConfirm = true;
  }

  deleteCategory(): void {
    if (!this.categoryToDelete) return;

    this.saving = true;
    this.errorMessage = '';

    this.categoryService.deleteCategory(this.categoryToDelete.category_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Category deleted successfully');
          this.successMessage = 'Category deleted successfully';
          this.saving = false;
          this.showDeleteConfirm = false;
          this.categoryToDelete = null;
          this.loadCategories();
          this.clearMessages();
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error deleting category', error);
          this.toast.error('Error deleting category: ' + (error.error?.message || error.message));
          this.errorMessage = 'Error deleting category: ' + (error.error?.message || error.message);
          this.saving = false;
          this.showDeleteConfirm = false;
          this.clearMessages();
        }
      });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.categoryToDelete = null;
  }

  /**
   * Clear success and error messages after a delay
   */
  private clearMessages(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 5000);
  }

  /**
   * TrackBy function for categories list
   * Improves ngFor performance by tracking items by unique identifier
   */
  trackByCategoryId(index: number, category: Category): number {
    return category.category_id;
  }
}
