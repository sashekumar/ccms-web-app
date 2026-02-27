import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../shared/models/permission.model';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  editingCategory: Category | null = null;
  categoryToDelete: Category | null = null;
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

  constructor(private categoryService: CategoryService) {}

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
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading categories:', error);
          this.errorMessage = 'Error loading categories';
          this.loading = false;
          this.clearMessages();
        }
      });
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
      displayOrder: category.display_order,
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
            this.successMessage = 'Category updated successfully';
            this.saving = false;
            this.closeModal();
            this.loadCategories();
            this.clearMessages();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error updating category:', error);
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
            this.successMessage = 'Category created successfully';
            this.saving = false;
            this.closeModal();
            this.loadCategories();
            this.clearMessages();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error creating category:', error);
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
          this.successMessage = 'Category deleted successfully';
          this.saving = false;
          this.showDeleteConfirm = false;
          this.categoryToDelete = null;
          this.loadCategories();
          this.clearMessages();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error deleting category:', error);
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
