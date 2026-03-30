import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, filter } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PermissionService } from '../../core/services/permission.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../core/services/toast.service';
import { Module, Action, ModuleAction } from '../../shared/models/permission.model';
import { LoadingSpinnerComponent } from '../../shared/components/ui/loading-spinner/loading-spinner.component';
import { DataTableComponent, DataTableColumn, DataTableAction, DataTableFilter, DataTablePagination, DataTableFilterState, DataTableRowActionEvent } from '../../shared/components/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { TextInputComponent } from '../../shared/components/ui/text-input/text-input.component';
import { CheckboxComponent } from '../../shared/components/ui/checkbox/checkbox.component';
import { DropdownComponent, DropdownOption } from '../../shared/components/ui/dropdown/dropdown.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-module-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, DataTableComponent, ConfirmDialogComponent, TextInputComponent, CheckboxComponent, DropdownComponent, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Module-Action Management</h1>
          <p class="mt-1 text-sm text-gray-600">Link actions to modules for permission control</p>
        </div>
        <app-button
          variant="primary"
          size="md"
          iconLeft="fas fa-plus"
          (click)="openCreateModal()">
          Attach Actions to Module
        </app-button>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loading" message="Loading module-actions..."></app-loading-spinner>

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

      <!-- Module-Actions Table -->
      <div *ngIf="!loading">
        <app-data-table
          [columns]="columns"
          [rows]="getPaginatedData()"
          [filters]="tableFilters"
          [pagination]="pagination"
          [loading]="loading"
          [rowActions]="rowActions"
          (filterChange)="onFilterChange($event)"
          (rowAction)="onRowAction($event)"
          (cellToggle)="onToggleStatus($event)"
        ></app-data-table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4" (click)="closeModal()">
      <div class="w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="flex-shrink-0 border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-medium text-gray-900">
              {{ editingItem ? 'Edit Module-Action' : 'Attach Actions to Module' }}
            </h3>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <form id="moduleActionForm" #moduleActionFormRef="ngForm" (ngSubmit)="saveModuleAction()">
              <div class="space-y-4">
                <div *ngIf="!editingItem">
                  <app-dropdown
                    label="Module"
                    [(ngModel)]="formData.moduleId"
                    name="module"
                    [options]="moduleOptions"
                    [required]="true"
                    placeholder="Select Module">
                  </app-dropdown>
                </div>

              <div *ngIf="!editingItem">
                <label class="block text-sm font-medium text-gray-700 mb-2">Actions <span class="text-red-500">*</span> (Select Multiple)</label>
                <div class="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                  <app-checkbox
                    *ngFor="let action of actions; trackBy: trackByActionId"
                    [id]="'action-' + action.action_id"
                    [value]="isActionSelected(action.action_id)"
                    (valueChange)="toggleActionSelection(action.action_id, $event)"
                    [label]="action.action_name"
                    [secondaryLabel]="'(' + action.action_code + ')'"
                    labelSize="sm"
                    labelWeight="medium"
                  ></app-checkbox>
                </div>
                <p class="mt-1 text-xs text-gray-500">Selected: {{ formData.actionIds.length }} action{{ formData.actionIds.length !== 1 ? 's' : '' }}</p>
              </div>

              <div *ngIf="editingItem">
                <label class="block text-sm font-medium text-gray-700">Module</label>
                <input type="text" [value]="editingItem.module_name + ' (' + editingItem.module_code + ')'" disabled
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 sm:text-sm border px-3 py-2">
              </div>

              <div *ngIf="editingItem">
                <label class="block text-sm font-medium text-gray-700">Action</label>
                <input type="text" [value]="editingItem.action_name + ' (' + editingItem.action_code + ')'" disabled
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 sm:text-sm border px-3 py-2">
              </div>

              <div>
                <app-text-input
                  label="Custom Action Label"
                  [(ngModel)]="formData.actionLabel"
                  name="label"
                  placeholder="e.g., 'View Details' or leave empty for default"
                  hint="Optional: Override the default action name">
                </app-text-input>
              </div>

              <app-checkbox
                *ngIf="editingItem"
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
              form="moduleActionForm"
              [disabled]="saving || !moduleActionFormRef.valid"
              [loading]="saving">
              Save
            </app-button>
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
                <h3 class="text-lg leading-6 font-medium text-gray-900">Delete Module-Action</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Are you sure you want to remove "{{ itemToDelete?.action_name }}" from "{{ itemToDelete?.module_name }}"? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" (click)="deleteModuleAction()" [disabled]="saving"
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

    <!-- Toggle Status Confirmation Dialog -->
    <app-confirm-dialog
      [isOpen]="showToggleConfirm"
      [title]="pendingToggle?.newValue ? 'Activate Module-Action' : 'Deactivate Module-Action'"
      [message]="pendingToggle?.newValue
        ? 'Are you sure you want to activate &quot;' + pendingToggle?.item?.action_name + '&quot; for &quot;' + pendingToggle?.item?.module_name + '&quot;?'
        : 'Are you sure you want to deactivate &quot;' + pendingToggle?.item?.action_name + '&quot; for &quot;' + pendingToggle?.item?.module_name + '&quot;?'"
      [variant]="pendingToggle?.newValue ? 'primary' : 'warn'"
      [confirmLabel]="pendingToggle?.newValue ? 'Yes, Activate' : 'Yes, Deactivate'"
      cancelLabel="Cancel"
      (confirmed)="confirmToggleStatus()"
      (cancelled)="cancelToggleStatus()"
    ></app-confirm-dialog>
  `
})
export class ModuleActionsComponent implements OnInit, OnDestroy {
  moduleActions: ModuleAction[] = [];
  filteredModuleActions: ModuleAction[] = [];
  modules: Module[] = [];
  moduleOptions: DropdownOption[] = [];
  actions: Action[] = [];
  loading = true;
  saving = false;
  showModal = false;
  showDeleteConfirm = false;
  showToggleConfirm = false;
  editingItem: ModuleAction | null = null;
  itemToDelete: ModuleAction | null = null;
  pendingToggle: { item: ModuleAction; newValue: boolean } | null = null;
  successMessage = '';
  errorMessage = '';

  // Filters
  searchTerm = '';
  moduleFilter: number | null = null;
  actionFilter: number | null = null;
  statusFilter: boolean | null = null;

  formData = {
    moduleId: '',
    actionIds: [] as number[],
    actionLabel: '',
    isActive: true
  };

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
      placeholder: 'Search module or action name',
      inputType: 'string'
    },
    {
      key: 'module_id',
      label: 'Module',
      type: 'select',
      placeholder: 'Filter by module',
      options: [] // Will be populated dynamically from modules
    },
    {
      key: 'action_id',
      label: 'Action',
      type: 'select',
      placeholder: 'Filter by action',
      options: [] // Will be populated dynamically from actions
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      placeholder: 'Filter by status',
      options: [
        { value: null, label: 'All Status' },
        { value: true, label: 'Active Only' },
        { value: false, label: 'Inactive Only' }
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
      key: 'action_name',
      label: 'Action',
      type: 'avatar',
      sortable: true,
      avatarSubKey: 'action_code'
    },
    {
      key: 'action_label',
      label: 'Custom Label',
      type: 'text',
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
      color: 'indigo',
      permission: 'MODULE_ACTION_MANAGEMENT.UPDATE',
      iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    },
    {
      id: 'delete',
      title: 'Delete',
      color: 'red',
      permission: 'MODULE_ACTION_MANAGEMENT.DELETE',
      iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private permissionService: PermissionService,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loading = true;
    forkJoin({
      moduleActions: this.permissionService.getAllModuleActions(),
      modules: this.permissionService.getAllModules(),
      actions: this.permissionService.getAllActions()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.moduleActions = data.moduleActions;
          this.modules = data.modules;
          this.actions = data.actions;
          
          // Populate filter options
          this.updateFilterOptions();
          
          this.applyFilters();
          this.updatePagination();
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error loading module-actions data', error);
          this.toast.error('Error loading data');
          this.errorMessage = 'Error loading data';
          this.loading = false;
          this.clearMessages();
        }
      });
  }

  private updateFilterOptions(): void {
    // Update module filter options
    const moduleFilter = this.tableFilters.find(f => f.key === 'module_id');
    if (moduleFilter) {
      moduleFilter.options = [
        { value: null, label: 'All Modules' },
        ...this.modules.map(m => ({ value: m.module_id, label: m.module_name }))
      ];
    }

    // Update action filter options
    const actionFilter = this.tableFilters.find(f => f.key === 'action_id');
    if (actionFilter) {
      actionFilter.options = [
        { value: null, label: 'All Actions' },
        ...this.actions.map(a => ({ value: a.action_id, label: a.action_name }))
      ];
    }
    
    // Populate dropdown options for form
    this.moduleOptions = this.modules.map(m => ({
      value: m.module_id,
      label: `${m.module_name} (${m.module_code})`
    }));
  }

  private updatePagination(): void {
    this.pagination = {
      ...this.pagination,
      total: this.filteredModuleActions.length,
      totalPages: Math.ceil(this.filteredModuleActions.length / this.pagination.limit)
    };
  }

  applyFilters(): void {
    this.filteredModuleActions = this.moduleActions.filter(item => {
      // Search filter
      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        const matchesSearch = 
          item.module_name?.toLowerCase().includes(search) ||
          item.action_name?.toLowerCase().includes(search) ||
          (item.action_label && item.action_label.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Module filter
      if (this.moduleFilter !== null && item.module_id !== this.moduleFilter) {
        return false;
      }

      // Action filter
      if (this.actionFilter !== null && item.action_id !== this.actionFilter) {
        return false;
      }

      // Status filter
      if (this.statusFilter !== null && item.is_active !== this.statusFilter) {
        return false;
      }

      return true;
    });

    // Reset to first page when filters change
    this.pagination.page = 1;
    this.updatePagination();
  }

  openCreateModal(): void {
    this.editingItem = null;
    this.formData = {
      moduleId: '',
      actionIds: [],
      actionLabel: '',
      isActive: true
    };
    this.showModal = true;
  }
  isActionSelected(actionId: number): boolean {
    return this.formData.actionIds.includes(actionId);
  }

  toggleActionSelection(actionId: number, isSelected: boolean): void {
    if (isSelected) {
      if (!this.formData.actionIds.includes(actionId)) {
        this.formData.actionIds.push(actionId);
      }
    } else {
      const index = this.formData.actionIds.indexOf(actionId);
      if (index > -1) {
        this.formData.actionIds.splice(index, 1);
      }
    }
  }

  openEditModal(item: ModuleAction): void {
    this.editingItem = item;
    this.formData = {
      moduleId: item.module_id.toString(),
      actionIds: [item.action_id],
      actionLabel: item.action_label || '',
      isActive: item.is_active
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingItem = null;
  }

  saveModuleAction(): void {
    this.saving = true;
    this.errorMessage = '';

    if (this.editingItem) {
      this.permissionService.updateModuleAction(this.editingItem.module_action_id, {
        action_label: this.formData.actionLabel || undefined,
        is_active: this.formData.isActive
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Module-Action updated successfully');
            this.successMessage = 'Module-Action updated successfully';
            this.saving = false;
            this.closeModal();
            this.loadData();
            this.clearMessages();
          },
          error: (error: HttpErrorResponse) => {
            this.logger.error('Error updating module-action', error);
            this.errorMessage = 'Error updating module-action: ' + (error.error?.message || error.message);
            this.toast.error(this.errorMessage);
            this.saving = false;
            this.clearMessages();
          }
        });
    } else {
      // Validate at least one action is selected
      if (this.formData.actionIds.length === 0) {
        this.errorMessage = 'Please select at least one action';
        this.saving = false;
        this.clearMessages();
        return;
      }

      // Create module-actions for all selected actions
      const moduleId = parseInt(this.formData.moduleId);
      let successCount = 0;
      let errorCount = 0;
      const totalActions = this.formData.actionIds.length;

      this.formData.actionIds.forEach((actionId, index) => {
        this.permissionService.createModuleAction({
          module_id: moduleId,
          action_id: actionId,
          action_label: this.formData.actionLabel || undefined
        })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              successCount++;
              if (successCount + errorCount === totalActions) {
                this.handleBatchComplete(successCount, errorCount, totalActions);
              }
            },
            error: (error: HttpErrorResponse) => {
              this.logger.error('Error creating module-action', error);
              errorCount++;
              if (successCount + errorCount === totalActions) {
                this.handleBatchComplete(successCount, errorCount, totalActions);
              }
            }
          });
      });
    }
  }

  private handleBatchComplete(successCount: number, errorCount: number, totalActions: number): void {
    this.saving = false;
    this.closeModal();
    this.loadData();

    if (errorCount === 0) {
      this.successMessage = `Successfully attached ${successCount} action${successCount !== 1 ? 's' : ''} to module`;
    } else if (successCount === 0) {
      this.errorMessage = `Failed to attach all ${totalActions} action${totalActions !== 1 ? 's' : ''}`;
    } else {
      this.successMessage = `Attached ${successCount} action${successCount !== 1 ? 's' : ''}, ${errorCount} failed`;
    }

    this.clearMessages();
  }

  confirmDelete(item: ModuleAction): void {
    this.itemToDelete = item;
    this.showDeleteConfirm = true;
  }

  deleteModuleAction(): void {
    if (!this.itemToDelete) return;

    this.saving = true;
    this.errorMessage = '';

    this.permissionService.deleteModuleAction(this.itemToDelete.module_action_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Module-Action deleted successfully');
          this.successMessage = 'Module-Action deleted successfully';
          this.saving = false;
          this.showDeleteConfirm = false;
          this.itemToDelete = null;
          this.loadData();
          this.clearMessages();
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error deleting module-action', error);
          this.errorMessage = 'Error deleting module-action: ' + (error.error?.message || error.message);
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
   * DataTable Methods
   */
  getPaginatedData(): ModuleAction[] {
    const start = (this.pagination.page - 1) * this.pagination.limit;
    const end = start + this.pagination.limit;
    return this.filteredModuleActions.slice(start, end);
  }

  onFilterChange(filters: DataTableFilterState): void {
    // Update pagination
    this.pagination = { ...this.pagination, page: filters.page, limit: filters.limit };

    // Update filter values
    this.searchTerm = filters['search'] || '';
    this.moduleFilter = filters['module_id'] ?? null;
    this.actionFilter = filters['action_id'] ?? null;
    this.statusFilter = filters['is_active'] ?? null;

    // Apply filters
    this.applyFilters();
  }

  onToggleStatus(event: { row: any; column: any; newValue: boolean }): void {
    this.pendingToggle = {
      item: event.row as ModuleAction,
      newValue: event.newValue
    };
    this.showToggleConfirm = true;
  }

  confirmToggleStatus(): void {
    if (!this.pendingToggle) return;

    const { item, newValue } = this.pendingToggle;
    const moduleActionId = item.module_action_id;

    this.permissionService.updateModuleAction(moduleActionId, { is_active: newValue })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          item.is_active = newValue;
          this.toast.success(`Module-Action ${newValue ? 'activated' : 'deactivated'} successfully`);
          this.showToggleConfirm = false;
          this.pendingToggle = null;
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error updating module-action status', error);
          this.toast.error('Error updating status');
          this.showToggleConfirm = false;
          this.pendingToggle = null;
          this.loadData(); // Reload to revert UI state
        }
      });
  }

  cancelToggleStatus(): void {
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    this.loadData(); // Reload data to revert the optimistic UI update
  }

  onRowAction(event: DataTableRowActionEvent): void {
    const item = event.row as ModuleAction;
    
    switch (event.action) {
      case 'edit':
        this.openEditModal(item);
        break;
      case 'delete':
        this.confirmDelete(item);
        break;
    }
  }

  /**
   * TrackBy functions for performance optimization
   */
  trackByModuleId(index: number, module: Module): number {
    return module.module_id;
  }

  trackByActionId(index: number, action: Action): number {
    return action.action_id;
  }

  trackByModuleActionId(index: number, item: ModuleAction): number {
    return item.module_action_id;
  }
}
