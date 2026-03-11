import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PermissionService } from '../../core/services/permission.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../core/services/toast.service';
import { Action } from '../../shared/models/permission.model';
import { LoadingSpinnerComponent } from '../../shared/components/ui/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../common/components/status-badge/status-badge.component';

@Component({
  selector: 'app-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Action Management</h1>
          <p class="mt-1 text-sm text-gray-600">System actions and permission types</p>
        </div>
        <button 
          (click)="openCreateModal()"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1e3c72] hover:bg-[#2a5298] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72]">
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Create Action
        </button>
      </div>

      <!-- Filters -->
      <div class="mb-6 rounded-lg bg-white p-4 shadow">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <!-- Search -->
          <div class="md:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="applyFilters()"
              placeholder="Search by action name or code"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            />
          </div>

          <!-- Status Filter -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              [(ngModel)]="statusFilter"
              (ngModelChange)="applyFilters()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="null">All Actions</option>
              <option [ngValue]="true">Active Only</option>
              <option [ngValue]="false">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loading" message="Loading actions..."></app-loading-spinner>

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

      <!-- Actions Table -->
      <div *ngIf="!loading" class="rounded-lg bg-white shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr *ngFor="let action of filteredActions; trackBy: trackByActionId" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#1e3c72] to-[#2a5298]">
                      <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ action.action_name }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex rounded-full bg-purple-100 px-2 text-xs font-semibold leading-5 text-purple-800">
                    {{ action.action_code }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ action.description || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <app-status-badge [active]="action.is_active"></app-status-badge>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button (click)="openEditModal(action)" class="text-indigo-600 hover:text-indigo-900 mr-3" data-testid="edit-action-button" aria-label="Edit">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button (click)="confirmDelete(action)" class="text-red-600 hover:text-red-900" data-testid="delete-action-button" aria-label="Delete">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredActions.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
                  {{ searchTerm || statusFilter !== null ? 'No actions found matching your filters' : 'No actions found' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Action Count -->
      <div *ngIf="!loading" class="mt-4 text-sm text-gray-600">
        <span *ngIf="searchTerm || statusFilter !== null">
          Showing {{ filteredActions.length }} of {{ actions.length }} action{{ actions.length !== 1 ? 's' : '' }}
        </span>
        <span *ngIf="!searchTerm && statusFilter === null">
          Total: {{ actions.length }} action{{ actions.length !== 1 ? 's' : '' }}
        </span>
      </div>

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
              <div>
                <label class="block text-sm font-medium text-gray-700">Action Name <span class="text-red-500">*</span></label>
                <input type="text" [(ngModel)]="formData.actionName" name="name" required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3c72] focus:ring-[#1e3c72] sm:text-sm border px-3 py-2">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Action Code <span class="text-red-500">*</span></label>
                <input type="text" [(ngModel)]="formData.actionCode" name="code" required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3c72] focus:ring-[#1e3c72] sm:text-sm border px-3 py-2">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea [(ngModel)]="formData.description" name="description" rows="3"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3c72] focus:ring-[#1e3c72] sm:text-sm border px-3 py-2"></textarea>
              </div>

              <div *ngIf="editingAction" class="flex items-center">
                <input type="checkbox" [(ngModel)]="formData.isActive" name="active" id="isActive"
                  class="h-4 w-4 text-[#1e3c72] focus:ring-[#1e3c72] border-gray-300 rounded">
                <label for="isActive" class="ml-2 block text-sm text-gray-900">Active</label>
              </div>
            </div>

        <!-- Modal Footer -->
        <div class="flex-shrink-0 border-t border-gray-200 px-6 py-4 mt-4">
          <div class="flex gap-3 justify-end">
            <button type="button" (click)="closeModal()" [disabled]="saving"
              class="rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" [disabled]="saving || !actionForm.valid"
              class="rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#1e3c72] text-sm font-medium text-white hover:bg-[#2a5298] disabled:opacity-50">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
          </form>
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
                <h3 class="text-lg leading-6 font-medium text-gray-900">Delete Action</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Are you sure you want to delete action "{{ actionToDelete?.action_name }}"? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" (click)="deleteAction()" [disabled]="saving"
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
export class ActionsComponent implements OnInit, OnDestroy {
  actions: Action[] = [];
  filteredActions: Action[] = [];
  loading = true;
  saving = false;
  showModal = false;
  showDeleteConfirm = false;
  editingAction: Action | null = null;
  actionToDelete: Action | null = null;
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
