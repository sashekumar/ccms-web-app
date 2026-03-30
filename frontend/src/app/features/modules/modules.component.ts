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
import { DataTableComponent, DataTableColumn, DataTableAction, DataTableFilter, DataTablePagination, DataTableFilterState, DataTableRowActionEvent } from '../../shared/components/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { TextInputComponent } from '../../shared/components/ui/text-input/text-input.component';
import { TextAreaComponent } from '../../shared/components/ui/text-area/text-area.component';
import { CheckboxComponent } from '../../shared/components/ui/checkbox/checkbox.component';
import { DropdownComponent, DropdownOption } from '../../shared/components/ui/dropdown/dropdown.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

// Extended interface for display purposes
interface ModuleDisplay extends Module {
  category_name?: string;
}

@Component({
  selector: 'app-modules',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ConfirmDialogComponent, TextInputComponent, TextAreaComponent, CheckboxComponent, DropdownComponent, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Module Management</h1>
          <p class="mt-1 text-sm text-gray-600">System modules and their configurations</p>
        </div>
        <app-button
          variant="primary"
          size="md"
          iconLeft="fas fa-plus"
          (click)="openCreateModal()">
          Create Module
        </app-button>
      </div>

      <!-- Data Table -->
      <app-data-table
        [rows]="getPaginatedData()"
        [columns]="columns"
        [rowActions]="rowActions"
        [filters]="tableFilters"
        [pagination]="pagination"
        [loading]="loading"
        emptyMessage="No modules found"
        (filterChange)="onFilterChange($event)"
        (rowAction)="onRowAction($event)"
        (cellToggle)="onToggleStatus($event)"
      ></app-data-table>
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
            <form id="moduleForm" #moduleFormRef="ngForm" (ngSubmit)="saveModule()">
              <div class="space-y-4">
                <app-text-input
                  label="Module Name"
                  [(ngModel)]="formData.moduleName"
                  name="name"
                  [required]="true"
                  placeholder="Enter module name">
                </app-text-input>

                <app-text-input
                  label="Module Code"
                  [(ngModel)]="formData.moduleCode"
                  name="code"
                  [required]="true"
                  placeholder="e.g., USER_MANAGEMENT">
                </app-text-input>

                <app-text-area
                  label="Description"
                  [(ngModel)]="formData.description"
                  name="description"
                  [rows]="2"
                  placeholder="Optional module description">
                </app-text-area>

                <app-dropdown
                  label="Category"
                  [(ngModel)]="formData.categoryId"
                  name="category"
                  [options]="categoryOptions"
                  placeholder="-- No Category (Uncategorized) --"
                  [clearable]="true"
                  hint="Select a category to organize this module in the menu">
                </app-dropdown>

              <app-text-input
                label="Route"
                [(ngModel)]="formData.route"
                name="route"
                placeholder="/module-path">
              </app-text-input>

              <app-text-input
                label="Icon"
                [(ngModel)]="formData.icon"
                name="icon"
                placeholder="e.g., th-list">
              </app-text-input>

              <app-text-input
                label="Display Order"
                inputType="integer"
                [(ngModel)]="formData.displayOrder"
                name="order"
                placeholder="e.g., 100">
              </app-text-input>

              <app-checkbox
                *ngIf="editingModule"
                label="Active"
                [(ngModel)]="formData.isActive"
                name="active"
                labelSize="sm">
              </app-checkbox>
            </div>
          </form>
          </div>

        <!-- Modal Footer -->
        <div class="flex-shrink-0 border-t border-gray-200 px-6 py-4">
          <div class="flex gap-3 justify-end">
            <app-button
              variant="secondary"
              size="md"
              type="button"
              [disabled]="saving"
              (click)="closeModal()">
              Cancel
            </app-button>
            <app-button
              variant="primary"
              size="md"
              type="submit"
              form="moduleForm"
              [disabled]="saving || !moduleFormRef.valid"
              [loading]="saving">
              Save
            </app-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <app-confirm-dialog
      [isOpen]="showDeleteConfirm"
      title="Delete Module"
      [message]="'Are you sure you want to delete module &quot;' + (moduleToDelete?.module_name || '') + '&quot;? This action cannot be undone.'"
      variant="danger"
      (confirmed)="deleteModule()"
      (cancelled)="cancelDelete()"
    ></app-confirm-dialog>

    <!-- Status Toggle Confirmation Dialog -->
    <app-confirm-dialog
      [isOpen]="showToggleConfirm"
      [title]="pendingToggle?.newValue ? 'Activate Module' : 'Deactivate Module'"
      [message]="pendingToggle?.newValue
        ? 'Are you sure you want to activate &quot;' + pendingToggle?.module?.module_name + '&quot;?'
        : 'Are you sure you want to deactivate &quot;' + pendingToggle?.module?.module_name + '&quot;?'"
      [variant]="pendingToggle?.newValue ? 'primary' : 'warn'"
      [confirmLabel]="pendingToggle?.newValue ? 'Yes, Activate' : 'Yes, Deactivate'"
      cancelLabel="Cancel"
      (confirmed)="confirmToggleStatus()"
      (cancelled)="cancelToggleStatus()"
    ></app-confirm-dialog>
  `
})
export class ModulesComponent implements OnInit, OnDestroy {
  modules: Module[] = [];
  filteredModules: ModuleDisplay[] = [];
  categories: Category[] = [];
  categoryOptions: DropdownOption[] = [];
  loading = true;
  saving = false;
  showModal = false;
  showDeleteConfirm = false;
  showToggleConfirm = false;
  editingModule: Module | null = null;
  moduleToDelete: Module | null = null;
  pendingToggle: { module: Module; newValue: boolean } | null = null;
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

  // DataTable configuration
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
      placeholder: 'Search by module name or code', 
      inputType: 'string' 
    },
    {
      key: 'category_id',
      label: 'Category',
      type: 'select',
      placeholder: 'Filter by category',
      options: [] // Will be populated dynamically from categories
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      placeholder: 'Filter by status',
      options: [
        { value: '', label: 'All Modules' },
        { value: 'true', label: 'Active Only' },
        { value: 'false', label: 'Inactive Only' }
      ]
    }
  ];

  columns: DataTableColumn[] = [
    { 
      key: 'module_name', 
      label: 'Module', 
      type: 'avatar', 
      sortable: true,
      avatarSubKey: 'module_code'
    },
    { 
      key: 'category_name', 
      label: 'Category', 
      type: 'text',
      sortable: true
    },
    { 
      key: 'route', 
      label: 'Route', 
      type: 'text',
      sortable: true
    },
    { 
      key: 'icon', 
      label: 'Icon', 
      type: 'text',
      sortable: false
    },
    { 
      key: 'display_order', 
      label: 'Order', 
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
      title: 'Edit',
      iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'indigo',
      permission: 'MODULE_MANAGEMENT.UPDATE'
    },
    {
      id: 'delete',
      title: 'Delete',
      iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'red',
      permission: 'MODULE_MANAGEMENT.DELETE'
    }
  ];

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
          
          // Populate dropdown options
          this.categoryOptions = this.categories.map(c => ({
            value: c.category_id,
            label: c.category_name
          }));
          
          // Populate category filter options
          const categoryFilter = this.tableFilters.find(f => f.key === 'category_id');
          if (categoryFilter) {
            categoryFilter.options = [
              { value: '', label: 'All Categories' },
              { value: '0', label: 'Uncategorized' },
              ...this.categories.map(c => ({
                value: c.category_id.toString(),
                label: c.category_name
              }))
            ];
          }
          
          this.applyFilters();
          this.updatePagination();
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

  updatePagination(): void {
    this.pagination = {
      ...this.pagination,
      total: this.filteredModules.length,
      totalPages: Math.ceil(this.filteredModules.length / this.pagination.limit)
    };
  }

  applyFilters(): void {
    this.filteredModules = this.modules
      .filter(module => {
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
            // Handle both string and number comparison
            const moduleCategory = typeof module.category_id === 'string' ? parseInt(module.category_id, 10) : module.category_id;
            if (moduleCategory !== this.categoryFilter) return false;
          }
        }

        // Status filter
        if (this.statusFilter !== null && module.is_active !== this.statusFilter) {
          return false;
        }

        return true;
      })
      .map(module => ({
        ...module,
        category_name: module.category_id 
          ? this.getCategoryName(module.category_id)
          : '—'
      }));
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.category_id === categoryId);
    return category ? category.category_name : 'Unknown';
  }

  // DataTable event handlers
  onFilterChange(filters: DataTableFilterState): void {
    // Extract search filter
    this.searchTerm = filters['search'] || '';
    
    // Extract category filter
    const categoryValue = filters['category_id'];
    if (categoryValue !== undefined && categoryValue !== null && categoryValue !== '') {
      this.categoryFilter = parseInt(categoryValue, 10);
      // Check if parseInt returned NaN
      if (isNaN(this.categoryFilter)) {
        this.categoryFilter = null;
      }
    } else {
      this.categoryFilter = null;
    }
    
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

  getPaginatedData(): ModuleDisplay[] {
    const startIndex = (this.pagination.page - 1) * this.pagination.limit;
    const endIndex = startIndex + this.pagination.limit;
    return this.filteredModules.slice(startIndex, endIndex);
  }

  onToggleStatus(event: { row: any; column: any; newValue: boolean }): void {
    const module = event.row as Module;
    const newValue = event.newValue;
    // Store pending action and open confirm dialog
    this.pendingToggle = { module, newValue };
    this.showToggleConfirm = true;
  }

  /** Called when user confirms the status toggle */
  confirmToggleStatus(): void {
    if (!this.pendingToggle) return;
    const { module, newValue } = this.pendingToggle;
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    
    this.logger.debug(`Toggling module ${module.module_id} status to: ${newValue}`);
    
    this.permissionService.updateModule(module.module_id, {
      is_active: newValue
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          module.is_active = newValue;
          const label = newValue ? 'activated' : 'deactivated';
          this.toast.success(`Module "${module.module_name}" has been ${label} successfully.`);
          this.logger.info(`Module ${module.module_id} status updated to: ${newValue}`);
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error updating module status:', error);
          this.toast.error('Failed to update module status. Please try again.');
          // Reload to revert the optimistic update
          this.loadData();
        }
      });
  }

  /** Called when user cancels the status toggle */
  cancelToggleStatus(): void {
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    // Reload to revert the optimistic chip state
    this.loadData();
  }

  onRowAction(event: DataTableRowActionEvent): void {
    const module = event.row as Module;
    switch (event.action) {
      case 'edit':
        this.openEditModal(module);
        break;
      case 'delete':
        this.confirmDelete(module);
        break;
    }
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
      this.permissionService.updateModule(this.editingModule.module_id, {
        module_name: this.formData.moduleName || undefined,
        module_code: this.formData.moduleCode || undefined,
        description: this.formData.description || undefined,
        category_id: this.formData.categoryId ?? undefined,
        icon: this.formData.icon || undefined,
        route: this.formData.route || undefined,
        display_order: this.formData.displayOrder,
        is_active: this.formData.isActive
      })
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

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.moduleToDelete = null;
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