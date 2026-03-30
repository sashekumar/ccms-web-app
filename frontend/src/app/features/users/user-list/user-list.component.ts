import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { PermissionService } from '../../../core/services/permission.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { User, UserFilters, UserRole } from '../../../shared/models/user.model';
import { Role } from '../../../shared/models/permission.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';

// Shared UI Components
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { DataTableComponent } from '../../../shared/components/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { StatusBadgeComponent } from '../../../common/components/status-badge/status-badge.component';

// Data Table Types
import type { DataTableColumn, DataTableAction, DataTableFilter, DataTableFilterState, DataTablePagination } from '../../../shared/components/ui/data-table/data-table.component';

import { APP_ROUTES } from '../../../core/constants/routes.constants'

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, 
    HasPermissionDirective, 
    ButtonComponent,
    DataTableComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
          <p class="mt-1 text-sm text-gray-600">Manage user accounts and permissions</p>
        </div>
        <app-button
          *hasPermission="'USER_MANAGEMENT.CREATE'"
          variant="primary"
          size="md"
          iconLeft="fas fa-plus"
          (click)="openCreateModal()"
        >
          Create User
        </app-button>
      </div>

      <!-- Data Table with Built-in Filters -->
      <app-data-table
        [rows]="users"
        [columns]="columns"
        [rowActions]="rowActions"
        [filters]="tableFilters"
        [pagination]="pagination"
        [loading]="loading"
        (filterChange)="onFilterChange($event)"
        (rowAction)="onRowAction($event)"
        (cellToggle)="onToggleStatus($event)"
      ></app-data-table>

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Delete User"
        [message]="'Are you sure you want to delete user &quot;' + userToDelete?.full_name + '&quot;? This action cannot be undone.'"
        variant="danger"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        (confirmed)="confirmDelete()"
        (cancelled)="showDeleteConfirm = false"
      ></app-confirm-dialog>

      <!-- Status Toggle Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="showToggleConfirm"
        [title]="pendingToggle?.newValue ? 'Activate User' : 'Deactivate User'"
        [message]="pendingToggle?.newValue
          ? 'Are you sure you want to activate &quot;' + pendingToggle?.user?.full_name + '&quot;? They will be able to log in to the system.'
          : 'Are you sure you want to deactivate &quot;' + pendingToggle?.user?.full_name + '&quot;? They will no longer be able to log in.'"
        [variant]="pendingToggle?.newValue ? 'primary' : 'warn'"
        [confirmLabel]="pendingToggle?.newValue ? 'Yes, Activate' : 'Yes, Deactivate'"
        cancelLabel="Cancel"
        (confirmed)="confirmToggleStatus()"
        (cancelled)="cancelToggleStatus()"
      ></app-confirm-dialog>
    `
  })
export class UserListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  users: User[] = [];
  roles: Role[] = [];
  loading = false;
  showDeleteConfirm = false;
  userToDelete: User | null = null;
  showToggleConfirm = false;
  pendingToggle: { user: User; newValue: boolean } | null = null;

  filters: UserFilters = {
    page: 1,
    limit: 10,
    sort_by: 'user_id',
    sort_order: 'DESC'
  };

  pagination: DataTablePagination = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  };

  // Table filter definitions for DataTableComponent
  tableFilters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Username or full name',
      inputType: 'string'
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      placeholder: 'All Users',
      options: [
        { value: '', label: 'All Users' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    },
    {
      key: 'role_id',
      label: 'Role',
      type: 'select',
      placeholder: 'All Roles',
      options: [] // Will be populated by loadRoles()
    }
  ];

  // Data table columns configuration
  columns: DataTableColumn[] = [
    { 
      key: 'full_name', 
      label: 'User', 
      type: 'text'
    },
    { 
      key: 'roles', 
      label: 'Roles', 
      type: 'tags',
      tagLabelKey: 'role_name',
      tagColor: 'blue'
    },
    { 
      key: 'is_active', 
      label: 'Status', 
      type: 'toggle'
    },
    { 
      key: 'last_login', 
      label: 'Last Login', 
      type: 'date',
      dateFormat: 'dd MMM yyyy HH:mm'
    }
  ];

  // Row actions
  rowActions: DataTableAction[] = [
    { 
      id: 'view', 
      title: 'View User', 
      iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      color: 'blue',
      permission: 'USER_MANAGEMENT.VIEW'
    },
    { 
      id: 'edit', 
      title: 'Edit User', 
      iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'indigo',
      permission: 'USER_MANAGEMENT.UPDATE'
    },
    { 
      id: 'roles', 
      title: 'Manage Roles', 
      iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      color: 'purple',
      permission: 'USER_MANAGEMENT.UPDATE'
    },
    { 
      id: 'delete', 
      title: 'Delete User', 
      iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'red',
      permission: 'USER_MANAGEMENT.DELETE'
    }
  ];

  constructor(
    private userService: UserService,
    private permissionService: PermissionService,
    private router: Router,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.users = result.users;
          this.pagination = {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
          };
          this.loading = false;
        },
        error: (error) => {
          this.logger.error('Error loading users', error);
          this.toast.error('Failed to load users. Please try again.');
          this.loading = false;
        }
      });
  }

  loadRoles(): void {
    this.permissionService.getAllRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.roles = roles;
          // Update role filter options
          const roleFilter = this.tableFilters.find(f => f.key === 'role_id');
          if (roleFilter) {
            roleFilter.options = [
              { value: '', label: 'All Roles' },
              ...roles.map(r => ({ value: r.role_id, label: r.role_name }))
            ];
          }
        },
        error: (error) => {
          this.logger.error('Error loading roles', error);
        }
      });
  }

  onFilterChange(filterState: DataTableFilterState): void {
    // Convert filter values from string to proper types for the API
    const currentIsActive = filterState['is_active'] as any;
    if (currentIsActive !== undefined && currentIsActive !== null) {
      if (currentIsActive === '') {
        this.filters.is_active = undefined;
      } else if (currentIsActive === 'true') {
        this.filters.is_active = true;
      } else if (currentIsActive === 'false') {
        this.filters.is_active = false;
      }
    }
    
    // Convert role_id from string to number
    const currentRoleId = filterState['role_id'] as any;
    if (currentRoleId !== undefined && currentRoleId !== null) {
      if (currentRoleId === '') {
        this.filters.role_id = undefined;
      } else if (typeof currentRoleId === 'string') {
        this.filters.role_id = parseInt(currentRoleId);
      } else {
        this.filters.role_id = currentRoleId;
      }
    }

    // Store search term
    this.filters.search = filterState['search'] || '';

    // Update pagination
    this.filters.page = filterState.page;
    this.filters.limit = filterState.limit;
    
    this.loadUsers();
  }

  onRowAction(event: any): void {
    const actionId = event.action;
    const row = event.row;
    
    switch (actionId) {
      case 'view':
        this.viewUser(row);
        break;
      case 'edit':
        this.editUser(row);
        break;
      case 'roles':
        this.manageRoles(row);
        break;
      case 'delete':
        this.deleteUser(row);
        break;
    }
  }

  /** Handle toggle status change from data-table — show confirmation first */
  onToggleStatus(event: any): void {
    const user: User = event.row;
    const newValue: boolean = event.newValue;
    // Store pending action and open confirm dialog
    this.pendingToggle = { user, newValue };
    this.showToggleConfirm = true;
  }

  /** Called when user confirms the status toggle */
  confirmToggleStatus(): void {
    if (!this.pendingToggle) return;
    const { user, newValue } = this.pendingToggle;
    this.showToggleConfirm = false;
    this.pendingToggle = null;

    this.logger.debug(`Toggling user ${user.user_id} status to: ${newValue}`);

    this.userService.updateUser(user.user_id, { is_active: newValue })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          user.is_active = newValue;
          const label = newValue ? 'activated' : 'deactivated';
          this.toast.success(`User "${user.full_name}" has been ${label} successfully.`);
          this.logger.info(`User ${user.user_id} status updated to: ${newValue}`);
        },
        error: (error) => {
          this.toast.error(`Failed to update user status: ${error.message}`);
          this.logger.error(`Error toggling user ${user.user_id} status:`, error);
          this.loadUsers();
        }
      });
  }

  /** Called when user cancels the status toggle */
  cancelToggleStatus(): void {
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    // Reload to revert the optimistic chip state
    this.loadUsers();
  }

  previousPage(): void {
    if (this.pagination.page > 1) {
      this.filters.page = this.pagination.page - 1;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.pagination.page < this.pagination.totalPages) {
      this.filters.page = this.pagination.page + 1;
      this.loadUsers();
    }
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadUsers();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.page;

    if (totalPages <= maxPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftOffset = Math.floor(maxPages / 2);
      let start = Math.max(1, currentPage - leftOffset);
      const end = Math.min(totalPages, start + maxPages - 1);

      if (end - start < maxPages - 1) {
        start = Math.max(1, end - maxPages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  getStartItem(): number {
    return (this.pagination.page - 1) * this.pagination.limit + 1;
  }

  getEndItem(): number {
    const end = this.pagination.page * this.pagination.limit;
    return Math.min(end, this.pagination.total);
  }

  viewUser(user: User): void {
    this.router.navigate([APP_ROUTES.ADMIN_USERS.DETAIL(user.user_id)]);
  }

  editUser(user: User): void {
    this.router.navigate([APP_ROUTES.ADMIN_USERS.EDIT(user.user_id)]);
  }

  manageRoles(user: User): void {
    this.router.navigate([APP_ROUTES.ADMIN_USERS.ROLES(user.user_id)]);
  }

  openCreateModal(): void {
    this.router.navigate([APP_ROUTES.ADMIN_USERS.CREATE])
      .then(success => {
        if (!success) {
          this.logger.error('Navigation to create user failed');
        }
      })
      .catch(error => {
        this.logger.error('Navigation error', error);
      });
  }

  deleteUser(user: User): void {
    this.userToDelete = user;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;
    
    this.showDeleteConfirm = false;
    this.userService.deleteUser(this.userToDelete.user_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadUsers();
          this.toast.success('User deleted successfully.');
        },
        error: (error) => {
          this.logger.error('Error deleting user', error);
          let errorMsg = '';
          if (error.status === 403) {
            errorMsg = 'Access Denied: You do not have permission to delete this user.';
          } else if (error.status === 404) {
            errorMsg = 'User not found. It may have already been deleted.';
          } else {
            errorMsg = 'Failed to delete user. Please try again.';
          }
          this.toast.error(errorMsg);
        }
      });
  }

  /**
   * TrackBy functions for performance optimization
   */
  trackByRoleId(index: number, role: Role): number {
    return role.role_id;
  }

  trackByUserId(index: number, user: User): number {
    return user.user_id;
  }

  trackByUserRoleId(index: number, role: UserRole): number {
    return role.role_id;
  }

  trackByPageNumber(index: number, page: number): number {
    return page;
  }
}



