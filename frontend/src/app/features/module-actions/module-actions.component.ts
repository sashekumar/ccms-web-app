import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PermissionService } from '../../core/services/permission.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../core/services/toast.service';
import { Module, Action, ModuleAction } from '../../shared/models/permission.model';
import { LoadingSpinnerComponent } from '../../shared/components/ui/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../common/components/status-badge/status-badge.component';

@Component({
  selector: 'app-module-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Module-Action Management</h1>
          <p class="mt-1 text-sm text-gray-600">Link actions to modules for permission control</p>
        </div>
        <button 
          (click)="openCreateModal()"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1e3c72] hover:bg-[#2a5298] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72]">
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Attach Actions to Module
        </button>
      </div>

      <!-- Filters -->
      <div class="mb-6 rounded-lg bg-white p-4 shadow">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <!-- Search -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="applyFilters()"
              placeholder="Module or action name"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            />
          </div>

          <!-- Module Filter -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Module</label>
            <select
              [(ngModel)]="moduleFilter"
              (ngModelChange)="applyFilters()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="null">All Modules</option>
              <option *ngFor="let module of modules; trackBy: trackByModuleId" [ngValue]="module.module_id">{{ module.module_name }}</option>
            </select>
          </div>

          <!-- Action Filter -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Action</label>
            <select
              [(ngModel)]="actionFilter"
              (ngModelChange)="applyFilters()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="null">All Actions</option>
              <option *ngFor="let action of actions; trackBy: trackByActionId" [ngValue]="action.action_id">{{ action.action_name }}</option>
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
              <option [ngValue]="null">All Status</option>
              <option [ngValue]="true">Active Only</option>
              <option [ngValue]="false">Inactive Only</option>
            </select>
          </div>
        </div>
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
      <div *ngIf="!loading" class="rounded-lg bg-white shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custom Label</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr *ngFor="let item of filteredModuleActions; trackBy: trackByModuleActionId" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ item.module_name }}</div>
                  <div class="text-sm text-gray-500">{{ item.module_code }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ item.action_name }}</div>
                  <div class="text-sm text-gray-500">{{ item.action_code }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.action_label || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <app-status-badge [active]="item.is_active"></app-status-badge>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button (click)="openEditModal(item)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button (click)="confirmDelete(item)" class="text-red-600 hover:text-red-900">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredModuleActions.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
                  {{ searchTerm || moduleFilter || actionFilter || statusFilter !== null ? 'No module-actions found matching your filters' : 'No module-actions found. Start by attaching actions to modules.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Count -->
      <div *ngIf="!loading" class="mt-4 text-sm text-gray-600">
        Total: {{ moduleActions.length }} module-action{{ moduleActions.length !== 1 ? 's' : '' }}
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
            <div class="space-y-4">
              <div *ngIf="!editingItem">
                <label class="block text-sm font-medium text-gray-700">Module *</label>
                <select [(ngModel)]="formData.moduleId" name="moduleId" required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3c72] focus:ring-[#1e3c72] sm:text-sm border px-3 py-2">
                  <option value="">Select Module</option>
                  <option *ngFor="let module of modules; trackBy: trackByModuleId" [value]="module.module_id">
                    {{ module.module_name }} ({{ module.module_code }})
                  </option>
                </select>
              </div>

              <div *ngIf="!editingItem">
                <label class="block text-sm font-medium text-gray-700 mb-2">Actions * (Select Multiple)</label>
                <div class="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                  <div *ngFor="let action of actions; trackBy: trackByActionId" class="flex items-center">
                    <input 
                      type="checkbox" 
                      [id]="'action-' + action.action_id"
                      [value]="action.action_id"
                      (change)="toggleAction(action.action_id, $event)"
                      class="h-4 w-4 text-[#1e3c72] focus:ring-[#1e3c72] border-gray-300 rounded">
                    <label [for]="'action-' + action.action_id" class="ml-2 block text-sm text-gray-900 flex-1">
                      <span class="font-medium">{{ action.action_name }}</span>
                      <span class="text-gray-500 ml-1">({{ action.action_code }})</span>
                    </label>
                  </div>
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
                <label class="block text-sm font-medium text-gray-700">Custom Action Label</label>
                <input type="text" [(ngModel)]="formData.actionLabel" name="actionLabel"
                  placeholder="e.g., 'View Details' or leave empty for default"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3c72] focus:ring-[#1e3c72] sm:text-sm border px-3 py-2">
                <p class="mt-1 text-xs text-gray-500">Optional: Override the default action name</p>
              </div>

              <div *ngIf="editingItem" class="flex items-center">
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
            <button type="button" (click)="saveModuleAction()" [disabled]="saving"
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
  `
})
export class ModuleActionsComponent implements OnInit, OnDestroy {
  moduleActions: ModuleAction[] = [];
  filteredModuleActions: ModuleAction[] = [];
  modules: Module[] = [];
  actions: Action[] = [];
  loading = true;
  saving = false;
  showModal = false;
  showDeleteConfirm = false;
  editingItem: ModuleAction | null = null;
  itemToDelete: ModuleAction | null = null;
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
          this.applyFilters();
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
  toggleAction(actionId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.formData.actionIds.push(actionId);
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
