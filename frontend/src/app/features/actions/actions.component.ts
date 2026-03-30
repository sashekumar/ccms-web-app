import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PermissionService } from '../../core/services/permission.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../core/services/toast.service';
import { Action } from '../../shared/models/permission.model';
import { DataTableComponent, DataTableColumn, DataTableAction, DataTableFilter, DataTablePagination, DataTableFilterState, DataTableRowActionEvent } from '../../shared/components/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { TextInputComponent } from '../../shared/components/ui/text-input/text-input.component';
import { TextAreaComponent } from '../../shared/components/ui/text-area/text-area.component';
import { CheckboxComponent } from '../../shared/components/ui/checkbox/checkbox.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ConfirmDialogComponent, TextInputComponent, TextAreaComponent, CheckboxComponent, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Action Management</h1>
          <p class="mt-1 text-sm text-gray-600">System actions and permission types</p>
        </div>
        <app-button
          variant="primary"
          size="md"
          iconLeft="fas fa-plus"
          (click)="openCreateModal()">
          Create Action
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
        emptyMessage="No actions found"
        (filterChange)="onFilterChange($event)"
        (rowAction)="onRowAction($event)"
        (cellToggle)="onToggleStatus($event)"
      ></app-data-table>

      <!-- Common Actions Info -->
      <div *ngIf="!loading && actions.length > 0" class="mt-6 rounded-lg bg-blue-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-blue-800">About Actions</h3>
            <div class="mt-2 text-sm text-blue-700">
              <p>Actions define what operations can be performed on modules. Common actions include:</p>
              <ul class="mt-2 list-disc list-inside space-y-1">
                <li><strong>VIEW</strong> - Read/view data</li>
                <li><strong>CREATE</strong> - Create new records</li>
                <li><strong>UPDATE</strong> - Modify existing records</li>
                <li><strong>DELETE</strong> - Remove records</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4" (click)="closeModal()">
      <div class="w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="flex-shrink-0 border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-medium text-gray-900">
              {{ editingAction ? 'Edit Action' : 'Create Action' }}
            </h3>
          </div>

          <!-- Modal Body (Scrollable) -->
          <form (ngSubmit)="saveAction()" #actionForm="ngForm" class="flex-1 overflow-y-auto px-6 py-4">
            <div class="space-y-4">
              <app-text-input
                label="Action Name"
                [(ngModel)]="formData.actionName"
                name="name"
                [required]="true"
                placeholder="Enter action name">
              </app-text-input>

              <app-text-input
                label="Action Code"
                [(ngModel)]="formData.actionCode"
                name="code"
                [required]="true"
                placeholder="e.g., CREATE, UPDATE, DELETE">
              </app-text-input>

              <app-text-area
                label="Description"
                [(ngModel)]="formData.description"
                name="description"
                [rows]="3"
                placeholder="Optional action description">
              </app-text-area>

              <app-checkbox
                *ngIf="editingAction"
                label="Active"
                [(ngModel)]="formData.isActive"
                name="active"
                labelSize="sm">
              </app-checkbox>
            </div>

        <!-- Modal Footer -->
        <div class="flex-shrink-0 border-t border-gray-200 px-6 py-4 mt-4">
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
              [disabled]="saving || !actionForm.valid"
              [loading]="saving">
              Save
            </app-button>
          </div>
        </div>
          </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <app-confirm-dialog
      [isOpen]="showDeleteConfirm"
      title="Delete Action"
      [message]="'Are you sure you want to delete action &quot;' + (actionToDelete?.action_name || '') + '&quot;? This action cannot be undone.'"
      variant="danger"
      (confirmed)="deleteAction()"
      (cancelled)="cancelDelete()"
    ></app-confirm-dialog>

    <!-- Status Toggle Confirmation Dialog -->
    <app-confirm-dialog
      [isOpen]="showToggleConfirm"
      [title]="pendingToggle?.newValue ? 'Activate Action' : 'Deactivate Action'"
      [message]="pendingToggle?.newValue
        ? 'Are you sure you want to activate &quot;' + pendingToggle?.action?.action_name + '&quot;?'
        : 'Are you sure you want to deactivate &quot;' + pendingToggle?.action?.action_name + '&quot;?'"
      [variant]="pendingToggle?.newValue ? 'primary' : 'warn'"
      [confirmLabel]="pendingToggle?.newValue ? 'Yes, Activate' : 'Yes, Deactivate'"
      cancelLabel="Cancel"
      (confirmed)="confirmToggleStatus()"
      (cancelled)="cancelToggleStatus()"
    ></app-confirm-dialog>
  `
})
export class ActionsComponent implements OnInit, OnDestroy {
  actions: Action[] = [];
  filteredActions: Action[] = [];
  loading = true;
  saving = false;
  showModal = false;
  showDeleteConfirm = false;
  showToggleConfirm = false;
  editingAction: Action | null = null;
  actionToDelete: Action | null = null;
  pendingToggle: { action: Action; newValue: boolean } | null = null;
  successMessage = '';
  errorMessage = '';

  // Filters
  searchTerm = '';
  statusFilter: boolean | null = null;

  formData = {
    actionName: '',
    actionCode: '',
    description: '',
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
      placeholder: 'Search by action name or code', 
      inputType: 'string' 
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      placeholder: 'Filter by status',
      options: [
        { value: '', label: 'All Actions' },
        { value: 'true', label: 'Active Only' },
        { value: 'false', label: 'Inactive Only' }
      ]
    }
  ];

  columns: DataTableColumn[] = [
    { 
      key: 'action_name', 
      label: 'Action', 
      type: 'avatar', 
      sortable: true,
      avatarSubKey: 'action_code'
    },
    { 
      key: 'description', 
      label: 'Description', 
      type: 'text',
      sortable: false
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
      permission: 'ACTION_MANAGEMENT.UPDATE'
    },
    {
      id: 'delete',
      title: 'Delete',
      iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'red',
      permission: 'ACTION_MANAGEMENT.DELETE'
    }
  ];

  constructor(
    private permissionService: PermissionService,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadActions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadActions(): void {
    this.loading = true;
    this.permissionService.getAllActions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (actions) => {
          this.actions = actions;
          this.applyFilters();
          this.updatePagination();
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error loading actions:', error);
          this.toast.error('Error loading actions');
          this.errorMessage = 'Error loading actions';
          this.loading = false;
          this.clearMessages();
        }
      });
  }

  updatePagination(): void {
    this.pagination = {
      ...this.pagination,
      total: this.filteredActions.length,
      totalPages: Math.ceil(this.filteredActions.length / this.pagination.limit)
    };
  }

  applyFilters(): void {
    this.filteredActions = this.actions.filter(action => {
      // Search filter
      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        const matchesSearch = 
          action.action_name.toLowerCase().includes(search) ||
          action.action_code.toLowerCase().includes(search) ||
          (action.description && action.description.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (this.statusFilter !== null && action.is_active !== this.statusFilter) {
        return false;
      }

      return true;
    });
  }

  // DataTable event handlers
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

  getPaginatedData(): Action[] {
    const startIndex = (this.pagination.page - 1) * this.pagination.limit;
    const endIndex = startIndex + this.pagination.limit;
    return this.filteredActions.slice(startIndex, endIndex);
  }

  onToggleStatus(event: { row: any; column: any; newValue: boolean }): void {
    const action = event.row as Action;
    const newValue = event.newValue;
    // Store pending action and open confirm dialog
    this.pendingToggle = { action, newValue };
    this.showToggleConfirm = true;
  }

  /** Called when user confirms the status toggle */
  confirmToggleStatus(): void {
    if (!this.pendingToggle) return;
    const { action, newValue } = this.pendingToggle;
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    
    this.logger.debug(`Toggling action ${action.action_id} status to: ${newValue}`);
    
    this.permissionService.updateAction(action.action_id, {
      is_active: newValue
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          action.is_active = newValue;
          const label = newValue ? 'activated' : 'deactivated';
          this.toast.success(`Action "${action.action_name}" has been ${label} successfully.`);
          this.logger.info(`Action ${action.action_id} status updated to: ${newValue}`);
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error updating action status:', error);
          this.toast.error('Failed to update action status. Please try again.');
          // Reload to revert the optimistic update
          this.loadActions();
        }
      });
  }

  /** Called when user cancels the status toggle */
  cancelToggleStatus(): void {
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    // Reload to revert the optimistic chip state
    this.loadActions();
  }

  onRowAction(event: DataTableRowActionEvent): void {
    const action = event.row as Action;
    switch (event.action) {
      case 'edit':
        this.openEditModal(action);
        break;
      case 'delete':
        this.confirmDelete(action);
        break;
    }
  }

  openCreateModal(): void {
    this.editingAction = null;
    this.formData = {
      actionName: '',
      actionCode: '',
      description: '',
      isActive: true
    };
    this.showModal = true;
  }

  openEditModal(action: Action): void {
    this.editingAction = action;
    this.formData = {
      actionName: action.action_name,
      actionCode: action.action_code,
      description: action.description || '',
      isActive: action.is_active
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingAction = null;
  }

  saveAction(): void {
    this.saving = true;
    this.errorMessage = '';

    if (this.editingAction) {
      this.permissionService.updateAction(this.editingAction.action_id, {
        action_name: this.formData.actionName || undefined,
        action_code: this.formData.actionCode || undefined,
        description: this.formData.description || undefined,
        is_active: this.formData.isActive
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Action updated successfully');
            this.successMessage = 'Action updated successfully';
            this.saving = false;
            this.closeModal();
            this.loadActions();
            this.clearMessages();
          },
          error: (error: HttpErrorResponse) => {
            this.logger.error('Error updating action:', error);
            this.toast.error('Error updating action: ' + (error.error?.message || error.message));
            this.errorMessage = 'Error updating action: ' + (error.error?.message || error.message);
            this.saving = false;
            this.clearMessages();
          }
        });
    } else {
      this.permissionService.createAction({
        action_name: this.formData.actionName,
        action_code: this.formData.actionCode,
        description: this.formData.description || undefined
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Action created successfully');
            this.successMessage = 'Action created successfully';
            this.saving = false;
            this.closeModal();
            this.loadActions();
            this.clearMessages();
          },
          error: (error: HttpErrorResponse) => {
            this.logger.error('Error creating action:', error);
            this.toast.error('Error creating action: ' + (error.error?.message || error.message));
            this.errorMessage = 'Error creating action: ' + (error.error?.message || error.message);
            this.saving = false;
            this.clearMessages();
          }
        });
    }
  }

  confirmDelete(action: Action): void {
    this.actionToDelete = action;
    this.showDeleteConfirm = true;
  }

  deleteAction(): void {
    if (!this.actionToDelete) return;

    this.saving = true;
    this.errorMessage = '';

    this.permissionService.deleteAction(this.actionToDelete.action_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Action deleted successfully');
          this.successMessage = 'Action deleted successfully';
          this.saving = false;
          this.showDeleteConfirm = false;
          this.actionToDelete = null;
          this.loadActions();
          this.clearMessages();
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error deleting action:', error);
          this.toast.error('Error deleting action: ' + (error.error?.message || error.message));
          this.errorMessage = 'Error deleting action: ' + (error.error?.message || error.message);
          this.saving = false;
          this.showDeleteConfirm = false;
          this.clearMessages();
        }
      });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.actionToDelete = null;
  }

  private clearMessages(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 5000);
  }

  /**
   * TrackBy function for actions list
   * Improves ngFor performance by tracking items by unique identifier
   */
  trackByActionId(index: number, action: Action): number {
    return action.action_id;
  }
}
