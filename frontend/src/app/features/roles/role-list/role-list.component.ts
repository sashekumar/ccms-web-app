import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../../../core/services/permission.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { Role } from '../../../shared/models/permission.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { DataTableComponent, DataTableColumn, DataTableAction, DataTablePagination, DataTableFilter, DataTableFilterState } from '../../../shared/components/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

import { APP_ROUTES } from '../../../core/constants/routes.constants';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective, DataTableComponent, ConfirmDialogComponent, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Role Management</h1>
          <p class="mt-1 text-sm text-gray-600">Manage system roles and their permissions</p>
        </div>
        <div>
          <app-button
            *hasPermission="'ROLE_MANAGEMENT.CREATE'"
            variant="primary"
            iconLeft="fas fa-plus"
            (click)="createRole()"
          >
            Create Role
          </app-button>
        </div>
      </div>

      <!-- Data Table -->
      <app-data-table
        [rows]="rowsForPage"
        [columns]="columns"
        [filters]="filters"
        [rowActions]="rowActions"
        [pagination]="pagination"
        [loading]="loading"
        emptyMessage="No roles found"
        emptySubMessage="Get started by creating a new role."
        (filterChange)="onFilterChange($event)"
        (sortChange)="onSortChange($event)"
        (rowAction)="onRowAction($event)"
        (cellToggle)="onCellToggle($event)"
      ></app-data-table>

      <!-- Delete Confirmation -->
      <app-confirm-dialog
        [isOpen]="showDeleteModal"
        title="Delete Role"
        [message]="'Are you sure you want to delete &quot;' + roleToDeleteName + '&quot;? This action cannot be undone and will remove all associated permissions.'"
        variant="danger"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        (confirmed)="deleteRole()"
        (cancelled)="cancelDelete()"
      ></app-confirm-dialog>

      <!-- Status Toggle Confirmation -->
      <app-confirm-dialog
        [isOpen]="showToggleConfirm"
        [title]="getToggleConfirmTitle()"
        [message]="getToggleConfirmMessage()"
        [variant]="pendingToggle?.newValue ? 'primary' : 'warn'"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        (confirmed)="confirmToggle()"
        (cancelled)="cancelToggle()"
      ></app-confirm-dialog>
    </div>
  `
})
export class RoleListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  roles: Role[] = [];
  filteredRoles: Role[] = [];
  rowsForPage: Role[] = [];
  loading = false;
  deleting = false;

  showDeleteModal = false;
  roleToDelete: number | null = null;
  roleToDeleteName = '';

  showToggleConfirm = false;
  pendingToggle: { row: Role; newValue: boolean } | null = null;

  currentSort: { column: string; direction: 'asc' | 'desc' } | null = null;
  currentPage = 1;
  currentLimit = 10;
  filterValues: Record<string, any> = {};

  pagination: DataTablePagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

  columns: DataTableColumn[] = [
    { key: 'role_name', label: 'Role Name', sortable: true },
    { key: 'role_code', label: 'Code', sortable: true },
    { key: 'description', label: 'Description' },
    {
      key: 'is_system_role',
      label: 'Type',
      type: 'badge',
      badgeMap: {
        true:  { label: 'System', color: 'purple' },
        false: { label: 'Custom', color: 'gray' }
      }
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'toggle'
    }
  ];

  filters: DataTableFilter[] = [
    {
      key: 'searchTerm',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by role name or code'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'All Roles',
      options: [
        { value: 'true',  label: 'Active'   },
        { value: 'false', label: 'Inactive' }
      ]
    }
  ];

  rowActions: DataTableAction[] = [
    {
      id: 'permissions',
      title: 'View Permissions',
      iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      color: 'blue',
      permission: 'ROLE_MANAGEMENT.VIEW'
    },
    {
      id: 'edit',
      title: 'Edit Role',
      testId: 'edit-role-button',
      iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'indigo',
      permission: 'ROLE_MANAGEMENT.UPDATE'
    },
    {
      id: 'delete',
      title: 'Delete Role',
      testId: 'delete-role-button',
      iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'red',
      permission: 'ROLE_MANAGEMENT.DELETE'
    }
  ];

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
          this.initTableData();
          this.loading = false;
        },
        error: (error) => {
          this.logger.error('Error loading roles', error);
          this.toast.error('Failed to load roles');
          this.loading = false;
        }
      });
  }

  private initTableData(): void {
    const total = this.roles.length;
    this.filteredRoles = [...this.roles];
    this.pagination = { page: 1, limit: 10, total, totalPages: Math.ceil(total / 10) };
    this.rowsForPage = this.roles.slice(0, 10);
  }

  onFilterChange(state: DataTableFilterState): void {
    this.filterValues = state;
    this.currentPage = state.page || 1;
    this.currentLimit = state.limit || 10;
    this.applyFiltersAndSort();
  }

  onSortChange(sort: { column: string; direction: 'asc' | 'desc' } | null): void {
    this.currentSort = sort;
    this.currentPage = 1; // Reset to page 1 when sorting changes
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort(): void {
    const search = (this.filterValues['searchTerm'] || '').toLowerCase();
    const status = this.filterValues['status'];

    // Apply filters
    let filtered = this.roles.filter(role => {
      if (search) {
        const match =
          role.role_name.toLowerCase().includes(search) ||
          role.role_code.toLowerCase().includes(search) ||
          (role.description && role.description.toLowerCase().includes(search));
        if (!match) return false;
      }
      if (status === 'true'  && !role.is_active) return false;
      if (status === 'false' && role.is_active)  return false;
      return true;
    });

    // Apply sorting if active
    if (this.currentSort) {
      filtered.sort((a, b) => {
        let aVal = a[this.currentSort!.column as keyof Role];
        let bVal = b[this.currentSort!.column as keyof Role];

        // Handle null/undefined
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Handle string comparison (case-insensitive)
        if (typeof aVal === 'string') {
          aVal = (aVal as string).toLowerCase();
          bVal = (bVal as string).toLowerCase();
        }

        // Compare values
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this.currentSort!.direction === 'asc' ? comparison : -comparison;
      });
    }

    // Apply pagination
    const total = filtered.length;
    const page = this.currentPage;
    const limit = this.currentLimit;
    const start = (page - 1) * limit;

    this.filteredRoles = filtered;
    this.pagination = { page, limit, total, totalPages: Math.ceil(total / limit) };
    this.rowsForPage = filtered.slice(start, start + limit);
  }

  onRowAction(event: { action: string; row: Role }): void {
    const { action, row } = event;

    switch (action) {
      case 'permissions':
        this.viewPermissions(row.role_id);
        break;
      case 'edit':
        if (row.is_system_role) {
          this.toast.warning('System roles cannot be edited');
          return;
        }
        this.editRole(row.role_id);
        break;
      case 'delete':
        if (row.is_system_role) {
          this.toast.warning('System roles cannot be deleted');
          return;
        }
        this.roleToDelete     = row.role_id;
        this.roleToDeleteName = row.role_name;
        this.showDeleteModal  = true;
        break;
    }
  }

  createRole(): void {
    this.router.navigate([APP_ROUTES.ADMIN_ROLES.CREATE]);
  }

  viewPermissions(roleId: number): void {
    this.router.navigate([APP_ROUTES.ADMIN_ROLES.PERMISSIONS(roleId)]);
  }

  editRole(roleId: number): void {
    this.router.navigate([APP_ROUTES.ADMIN_ROLES.EDIT(roleId)]);
  }

  cancelDelete(): void {
    this.roleToDelete     = null;
    this.roleToDeleteName = '';
    this.showDeleteModal  = false;
  }

  getToggleConfirmTitle(): string {
    return this.pendingToggle?.newValue ? 'Activate Role?' : 'Deactivate Role?';
  }

  getToggleConfirmMessage(): string {
    if (!this.pendingToggle) {
      return '';
    }
    const action = this.pendingToggle.newValue ? 'activate' : 'deactivate';
    const roleName = this.pendingToggle.row.role_name;
    return `Are you sure you want to ${action} "${roleName}"?`;
  }

  onCellToggle(event: { row: Role; column: DataTableColumn; newValue: boolean }): void {
    // Prevent toggling system roles
    if (event.row.is_system_role) {
      this.toast.warning('System roles cannot be toggled');
      return;
    }

    // Store pending toggle and show confirmation
    this.pendingToggle = { row: event.row, newValue: event.newValue };
    this.showToggleConfirm = true;
  }

  cancelToggle(): void {
    this.pendingToggle = null;
    this.showToggleConfirm = false;
  }

  confirmToggle(): void {
    if (!this.pendingToggle) return;

    const { row, newValue } = this.pendingToggle;
    this.loading = true;

    this.permissionService.updateRole(row.role_id, { is_active: newValue })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.showToggleConfirm = false;
          this.pendingToggle = null;
          this.toast.success(`Role ${newValue ? 'activated' : 'deactivated'} successfully`);
          this.loadRoles();
        },
        error: (error) => {
          this.logger.error('Error updating role status', error);
          this.loading = false;
          this.showToggleConfirm = false;
          this.pendingToggle = null;

          let errorMsg = 'Failed to update role status. Please try again.';
          if (error.status === 403) {
            errorMsg = 'Access Denied: You do not have permission to update role status.';
          } else if (error.status === 404) {
            errorMsg = 'Role not found. It may have been deleted.';
          } else if (error.status === 400 && error.error?.message) {
            errorMsg = error.error.message;
          }
          this.toast.error(errorMsg);
        }
      });
  }

  deleteRole(): void {
    if (!this.roleToDelete) return;

    this.deleting = true;
    this.permissionService.deleteRole(this.roleToDelete)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting        = false;
          this.showDeleteModal = false;
          this.roleToDelete     = null;
          this.roleToDeleteName = '';
          this.toast.success('Role deleted successfully');
          this.loadRoles();
        },
        error: (error) => {
          this.logger.error('Error deleting role', error);
          this.deleting        = false;
          this.showDeleteModal = false;

          let errorMsg = 'Failed to delete role. Please try again.';
          if (error.status === 403) {
            errorMsg = 'Access Denied: You do not have permission to delete this role.';
          } else if (error.status === 404) {
            errorMsg = 'Role not found. It may have already been deleted.';
          } else if (error.status === 400 && error.error?.message) {
            errorMsg = error.error.message;
          }
          this.toast.error(errorMsg);
        }
      });
  }

  trackByRoleId(index: number, role: Role): number {
    return role.role_id;
  }
}
