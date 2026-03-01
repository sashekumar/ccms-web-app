import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PermissionService } from '../../core/services/permission.service';
import { CategoryService } from '../../core/services/category.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../core/services/toast.service';
import { Module, Category } from '../../shared/models/permission.model';
import { LoadingSpinnerComponent } from '../../shared/components/ui/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../common/components/status-badge/status-badge.component';

@Component({
  selector: 'app-modules',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Module Management</h1>
          <p class="mt-1 text-sm text-gray-600">System modules and their configurations</p>
        </div>
        <button 
          (click)="openCreateModal()"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1e3c72] hover:bg-[#2a5298] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72]">
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Create Module
        </button>
      </div>

      <!-- Filters -->
      <div class="mb-6 rounded-lg bg-white p-4 shadow">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <!-- Search -->
          <div class="md:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="applyFilters()"
              placeholder="Search by module name or code"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            />
          </div>

          <!-- Category Filter -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select
              [(ngModel)]="categoryFilter"
              (ngModelChange)="applyFilters()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="null">All Categories</option>
              <option [ngValue]="0">Uncategorized</option>
              <option *ngFor="let category of categories; trackBy: trackByCategoryId" [ngValue]="category.category_id">
                {{ category.category_name }}
              </option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              [(ngModel)]="statusFilter"
              (ngModelChange)="applyFilters()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="null">All Modules</option>
              <option [ngValue]="true">Active Only</option>
              <option [ngValue]="false">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loading" message="Loading modules..."></app-loading-spinner>

      <!-- Success Message -->
      <div *ngIf="successMessage" class="mb-4 rounded-md bg-green-50 p-4">
        <div class="flex">
          <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <p class="ml-3 text-sm text-green-800">{{ successMessage }}</p>
        </div>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage" class="mb-4 rounded-md bg-red-50 p-4">
        <div class="flex">
          <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <p class="ml-3 text-sm text-red-800">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Modules Table -->
      <div *ngIf="!loading" class="rounded-lg bg-white shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr *ngFor="let module of filteredModules; trackBy: trackByModuleId" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ module.module_name }}</div>
                  <div *ngIf="module.description" class="text-sm text-gray-500">{{ module.description }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                    {{ module.module_code }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span *ngIf="module.category_id" class="inline-flex rounded-full bg-purple-100 px-2 text-xs font-semibold leading-5 text-purple-800">
                    {{ getCategoryName(module.category_id) }}
                  </span>
                  <span *ngIf="!module.category_id" class="text-gray-400 italic">Uncategorized</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ module.route || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ module.icon || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ module.display_order || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <app-status-badge [active]="module.is_active"></app-status-badge>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button (click)="openEditModal(module)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button (click)="confirmDelete(module)" class="text-red-600 hover:text-red-900">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredModules.length === 0">
                <td colspan="8" class="px-6 py-8 text-center text-sm text-gray-500">
                  {{ searchTerm || statusFilter !== null ? 'No modules found matching your filters' : 'No modules found' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Module Count -->
      <div *ngIf="!loading" class="mt-4 text-sm text-gray-600">
        <span *ngIf="searchTerm || statusFilter !== null">
          Showing {{ filteredModules.length }} of {{ modules.length }} module{{ modules.length !== 1 ? 's' : '' }}
        </span>
        <span *ngIf="!searchTerm && statusFilter === null">
          Total: {{ modules.length }} module{{ modules.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4" (click)="closeModal()">
      <div class="w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="flex-shrink-0 border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-medium text-gray-900">
              {{ editingModule ? 'Edit Module' : 'Create Module' }}
            </h3>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Module Name *</label>
                <input type="text" [(ngModel)]="formData.moduleName" name="moduleName" required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3c72] focus:ring-[#1e3c72] sm:text-sm border px-3 py-2">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Module Code *</label>
                <input type="text" [(ngModel)]="formData.moduleCode" name="moduleCode" required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3c72] focus:ring-[#1e3c72] sm:text-sm border px-3 py-2">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea [(ngModel)]="formData.description" name="description" rows="2"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3c72] focus:ring-[#1e3c72] sm:text-sm border px-3 py-2"></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Category</label>
                <select [(ngModel)]="formData.categoryId" name="categoryId"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3c72] focus:ring-[#1e3c72] sm:text-sm border px-3 py-2">
                  <option [ngValue]="null">-- No Category (Uncategorized) --</option>
                  <option *ngFor="let category of categories; trackBy: trackByCategoryId" [ngValue]="category.category_id">
                    {{ category.category_name }}
                  </option>
                </select>
                <p class="mt-1 text-xs text-gray-500">Select a category to organize this module in the menu</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Route</label>
                <input type="text" [(ngModel)]="formData.route" name="route"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3c72] focus:ring-[#1e3c72] sm:text-sm border px-3 py-2">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Icon</label>
                <input type="text" [(ngModel)]="formData.icon" name="icon"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3c72] focus:ring-[#1e3c72] sm:text-sm border px-3 py-2">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Display Order</label>
                <input type="number" [(ngModel)]="formData.displayOrder" name="displayOrder"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3c72] focus:ring-[#1e3c72] sm:text-sm border px-3 py-2">
              </div>

              <div *ngIf="editingModule" class="flex items-center">
                <input type="checkbox" [(ngModel)]="formData.isActive" name="isActive" id="isActive"
                  class="h-4 w-4 text-[#1e3c72] focus:ring-[#1e3c72] border-gray-300 rounded">
                <label for="isActive" class="ml-2 block text-sm text-gray-900">Active</label>
              </div>
            </div>
          </div>

        <!-- Modal Footer -->
        <div class="flex-shrink-0 border-t border-gray-200 px-6 py-4">
          <div class="flex gap-3 justify-end">
            <button type="button" (click)="closeModal()" [disabled]="saving"
              class="rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="button" (click)="saveModule()" [disabled]="saving"
              class="rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#1e3c72] text-sm font-medium text-white hover:bg-[#2a5298] disabled:opacity-50">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div *ngIf="showDeleteConfirm" class="fixed z-[9999] inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4 text-center">
        <div class="fixed inset-0 transition-opacity" (click)="showDeleteConfirm = false">
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div class="relative inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900">Delete Module</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Are you sure you want to delete module "{{ moduleToDelete?.module_name }}"? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" (click)="deleteModule()" [disabled]="saving"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
              {{ saving ? 'Deleting...' : 'Delete' }}
            </button>
            <button type="button" (click)="showDeleteConfirm = false" [disabled]="saving"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ModulesComponent implements OnInit, OnDestroy {
  modules: Module[] = [];
  filteredModules: Module[] = [];
  categories: Category[] = [];
  loading = true;
  saving = false;
  showModal = false;
  showDeleteConfirm = false;
  editingModule: Module | null = null;
  moduleToDelete: Module | null = null;
  successMessage = '';
  errorMessage = '';

  // Filters
  searchTerm = '';
  categoryFilter: number | null = null;
  statusFilter: boolean | null = null;

  formData = {
    moduleName: '',
    moduleCode: '',
    description: '',
    route: '',
    icon: '',
    displayOrder: 0,
    categoryId: null as number | null,
    isActive: true
  };

  private destroy$ = new Subject<void>();

  constructor(
    private permissionService: PermissionService,
    private categoryService: CategoryService,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    forkJoin({
      modules: this.permissionService.getAllModules(),
      categories: this.categoryService.getAllCategories()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.modules = data.modules;
          this.categories = data.categories;
          this.applyFilters();
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error loading modules data', error);
          this.toast.error('Error loading data');
          this.errorMessage = 'Error loading data';
          this.loading = false;
          this.clearMessages();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  applyFilters(): void {
    this.filteredModules = this.modules.filter(module => {
      // Search filter
      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        const matchesSearch = 
          module.module_name.toLowerCase().includes(search) ||
          module.module_code.toLowerCase().includes(search) ||
          (module.description && module.description.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (this.categoryFilter !== null) {
        if (this.categoryFilter === 0) {
          // Filter for uncategorized modules
          if (module.category_id !== null) return false;
        } else {
          // Filter for specific category
          if (module.category_id !== this.categoryFilter) return false;
        }
      }

      // Status filter
      if (this.statusFilter !== null && module.is_active !== this.statusFilter) {
        return false;
      }

      return true;
    });
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.category_id === categoryId);
    return category ? category.category_name : 'Unknown';
  }

  openCreateModal(): void {
    this.editingModule = null;
    this.formData = {
      moduleName: '',
      moduleCode: '',
      description: '',
      route: '',
      icon: '',
      displayOrder: 0,
      categoryId: null,
      isActive: true
    };
    this.showModal = true;
  }

  openEditModal(module: Module): void {
    this.editingModule = module;
    this.formData = {
      moduleName: module.module_name,
      moduleCode: module.module_code,
      description: module.description || '',
      route: module.route || '',
      icon: module.icon || '',
      displayOrder: module.display_order || 0,
      categoryId: module.category_id,
      isActive: module.is_active
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingModule = null;
  }

  saveModule(): void {
    this.saving = true;
    this.errorMessage = '';

    if (this.editingModule) {
      this.permissionService.updateModule(this.editingModule.module_id, this.formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Module updated successfully');
            this.successMessage = 'Module updated successfully';
            this.saving = false;
            this.closeModal();
            this.loadData();
            this.clearMessages();
          },
          error: (error: HttpErrorResponse) => {
            this.logger.error('Error updating module', error);
            this.errorMessage = 'Error updating module: ' + (error.error?.message || error.message);
            this.toast.error(this.errorMessage);
            this.saving = false;
            this.clearMessages();
          }
        });
    } else {
      this.permissionService.createModule({
        module_name: this.formData.moduleName,
        module_code: this.formData.moduleCode,
        description: this.formData.description || undefined,
        category_id: this.formData.categoryId || undefined,
        icon: this.formData.icon || undefined,
        route: this.formData.route || undefined,
        display_order: this.formData.displayOrder
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Module created successfully');
            this.successMessage = 'Module created successfully';
            this.saving = false;
            this.closeModal();
            this.loadData();
            this.clearMessages();
          },
          error: (error: HttpErrorResponse) => {
            this.logger.error('Error creating module', error);
            this.errorMessage = 'Error creating module: ' + (error.error?.message || error.message);
            this.toast.error(this.errorMessage);
            this.saving = false;
            this.clearMessages();
          }
        });
    }
  }

  confirmDelete(module: Module): void {
    this.moduleToDelete = module;
    this.showDeleteConfirm = true;
  }

  deleteModule(): void {
    if (!this.moduleToDelete) return;

    this.saving = true;
    this.errorMessage = '';

    this.permissionService.deleteModule(this.moduleToDelete.module_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Module deleted successfully');
          this.successMessage = 'Module deleted successfully';
          this.saving = false;
          this.showDeleteConfirm = false;
          this.moduleToDelete = null;
          this.loadData();
          this.clearMessages();
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error deleting module', error);
          this.errorMessage = 'Error deleting module: ' + (error.error?.message || error.message);
          this.toast.error(this.errorMessage);
          this.saving = false;
          this.showDeleteConfirm = false;
          this.clearMessages();
        }
      });
  }

  private clearMessages(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 5000);
  }

  /**
   * TrackBy functions for performance optimization
   */
  trackByCategoryId(index: number, category: Category): number {
    return category.category_id;
  }

  trackByModuleId(index: number, module: Module): number {
    return module.module_id;
  }
}