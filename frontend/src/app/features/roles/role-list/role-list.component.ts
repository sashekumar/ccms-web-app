import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../../../core/services/permission.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { Role } from '../../../shared/models/permission.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../common/components/status-badge/status-badge.component';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Role Management</h1>
          <p class="mt-1 text-sm text-gray-600">Manage system roles and their permissions</p>
        </div>
        <button
          *hasPermission="'ROLE_MANAGEMENT.CREATE'"
          (click)="createRole()"
          class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Role
        </button>
      </div>

      <!-- Filter Section -->
      <div class="mb-6 rounded-lg bg-white p-4 shadow">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- Search -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onFilterChange()"
              placeholder="Search by role name or code"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            />
          </div>
          
          <!-- Status Filter -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              [(ngModel)]="filterActive"
              (ngModelChange)="onFilterChange()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="null">All Roles</option>
              <option [ngValue]="true">Active Only</option>
              <option [ngValue]="false">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loading" message="Loading roles..."></app-loading-spinner>

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

      <!-- Roles Table -->
      <div *ngIf="!loading" class="overflow-hidden rounded-lg bg-white shadow">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Role
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Code
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr *ngFor="let role of filteredRoles; trackBy: trackByRoleId" class="hover:bg-gray-50">
              <!-- Role Name -->
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{{ role.role_name }}</div>
              </td>

              <!-- Code -->
              <td class="whitespace-nowrap px-6 py-4">
                <span class="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                  {{ role.role_code }}
                </span>
              </td>

              <!-- Description -->
              <td class="px-6 py-4">
                <div class="text-sm text-gray-500">{{ role.description || '-' }}</div>
              </td>

              <!-- Type -->
              <td class="whitespace-nowrap px-6 py-4">
                <span
                  *ngIf="role.is_system_role"
                  class="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800"
                >
                  System
                </span>
                <span
                  *ngIf="!role.is_system_role"
                  class="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800"
                >
                  Custom
                </span>
              </td>

              <!-- Status -->
              <td class="whitespace-nowrap px-6 py-4">
                <app-status-badge [active]="role.is_active"></app-status-badge>
              </td>

              <!-- Actions -->
              <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <div class="flex justify-end gap-2">
                  <button
                    *hasPermission="'ROLE_MANAGEMENT.VIEW'"
                    (click)="viewPermissions(role.role_id)"
                    class="text-blue-600 hover:text-blue-900"
                    title="View Permissions"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </button>
                  <button
                    *hasPermission="'ROLE_MANAGEMENT.UPDATE'"
                    (click)="editRole(role.role_id)"
                    [disabled]="role.is_system_role"
                    class="text-indigo-600 hover:text-indigo-900 disabled:cursor-not-allowed disabled:opacity-50"
                    [title]="role.is_system_role ? 'System roles cannot be edited' : 'Edit Role'"
                    data-testid="edit-role-button"
                    aria-label="Edit"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    *hasPermission="'ROLE_MANAGEMENT.DELETE'"
                    (click)="confirmDelete(role.role_id, role.role_name, role.is_system_role)"
                    [disabled]="role.is_system_role"
                    class="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                    [title]="role.is_system_role ? 'System roles cannot be deleted' : 'Delete Role'"
                    data-testid="delete-role-button"
                    aria-label="Delete"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div *ngIf="filteredRoles.length === 0" class="py-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">
            {{ searchTerm || filterActive !== null ? 'No roles found matching your filters' : 'No roles found' }}
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ searchTerm || filterActive !== null ? 'Try adjusting your search or filters' : 'Get started by creating a new role.' }}
          </p>
          <button
            *hasPermission="'ROLE_MANAGEMENT.CREATE'"
            (click)="createRole()"
            [class.hidden]="searchTerm || filterActive !== null"
            class="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Create Role
          </button>
        </div>
      </div>

      <!-- Role Count -->
      <div *ngIf="!loading" class="mt-4 text-sm text-gray-600">
        <span *ngIf="searchTerm || filterActive !== null">
          Showing {{ filteredRoles.length }} of {{ roles.length }} role{{ roles.length !== 1 ? 's' : '' }}
        </span>
        <span *ngIf="!searchTerm && filterActive === null">
          Total: {{ roles.length }} role{{ roles.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Delete Confirmation Modal -->
      <div
        *ngIf="showDeleteModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50"
        (click)="cancelDelete()"
      >
        <div
          class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <div class="mb-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
          </div>
          <h3 class="mb-2 text-lg font-medium text-gray-900">Delete Role</h3>
          <p class="mb-6 text-sm text-gray-500">
            Are you sure you want to delete the role "{{ roleToDeleteName }}"?
            This action cannot be undone and will remove all associated permissions.
          </p>
          <div class="flex gap-3">
            <button
              (click)="cancelDelete()"
              class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              (click)="deleteRole()"
              [disabled]="deleting"
              class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span *ngIf="deleting">Deleting...</span>
              <span *ngIf="!deleting">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RoleListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  roles: Role[] = [];
  filteredRoles: Role[] = [];
  loading = false;
  deleting = false;
  successMessage = '';
  errorMessage = '';
  
  // Filters
  searchTerm = '';
  filterActive: boolean | null = null;
  
  showDeleteModal = false;
  roleToDelete: number | null = null;
  roleToDeleteName = '';

  constructor(
    private permissionService: PermissionService,
    private router: Router,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRoles(): void {
    this.loading = true;
    this.permissionService.getAllRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.roles = roles;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          this.logger.error('Error loading roles', error);
          this.toast.error('Failed to load roles');
          this.loading = false;
        }
      });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredRoles = this.roles.filter(role => {
      // Search filter
      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        const matchesSearch = 
          role.role_name.toLowerCase().includes(search) ||
          role.role_code.toLowerCase().includes(search) ||
          (role.description && role.description.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (this.filterActive !== null && role.is_active !== this.filterActive) {
        return false;
      }
      
      return true;
    });
  }

  createRole(): void {
    this.router.navigate(['/admin/roles/create']);
  }

  viewPermissions(roleId: number): void {
    this.router.navigate(['/admin/roles/permissions', roleId]);
  }

  editRole(roleId: number): void {
    this.router.navigate(['/admin/roles/edit', roleId]);
  }

  confirmDelete(roleId: number, roleName: string, isSystemRole: boolean): void {
    if (isSystemRole) return;
    
    this.roleToDelete = roleId;
    this.roleToDeleteName = roleName;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.roleToDelete = null;
    this.roleToDeleteName = '';
    this.showDeleteModal = false;
  }

  deleteRole(): void {
    if (!this.roleToDelete) return;

    this.deleting = true;
    this.errorMessage = '';
    this.permissionService.deleteRole(this.roleToDelete)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting = false;
          this.showDeleteModal = false;
          this.roleToDelete = null;
          this.roleToDeleteName = '';
          this.loadRoles(); // Reload the list
          this.toast.success('Role deleted successfully');
          this.successMessage = 'Role deleted successfully';
          this.clearMessages();
        },
        error: (error) => {
          this.logger.error('Error deleting role', error);
          this.deleting = false;
          this.showDeleteModal = false;
          
          // Show user-friendly error message based on status code
          let errorMsg = '';
          if (error.status === 403) {
            errorMsg = 'Access Denied: You do not have permission to delete this role.';
          } else if (error.status === 404) {
            errorMsg = 'Role not found. It may have already been deleted.';
          } else if (error.status === 400 && error.error?.message) {
            errorMsg = error.error.message;
          } else {
            errorMsg = 'Failed to delete role. Please try again.';
          }
          this.toast.error(errorMsg);
          this.errorMessage = errorMsg;
          this.clearMessages();
        }
      });
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
   * TrackBy function for roles list
   * Improves ngFor performance by tracking items by unique identifier
   */
  trackByRoleId(index: number, role: Role): number {
    return role.role_id;
  }
}
