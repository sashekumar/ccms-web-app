import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { PermissionService } from '../../../core/services/permission.service';
import { User, UserFilters } from '../../../shared/models/user.model';
import { Role } from '../../../shared/models/permission.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
          <p class="mt-1 text-sm text-gray-600">Manage user accounts and permissions</p>
        </div>
        <button
          *hasPermission="'USER_MANAGEMENT.CREATE'"
          (click)="openCreateModal()"
          class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-white transition hover:opacity-90"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create User
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
              [(ngModel)]="filters.search"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Username or full name"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            />
          </div>

          <!-- Status Filter -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              [(ngModel)]="filters.is_active"
              (ngModelChange)="onFilterChange()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="undefined">All Users</option>
              <option [ngValue]="true">Active</option>
              <option [ngValue]="false">Inactive</option>
            </select>
          </div>

          <!-- Role Filter -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select
              [(ngModel)]="filters.role_id"
              (ngModelChange)="onFilterChange()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="undefined">All Roles</option>
              <option *ngFor="let role of roles" [ngValue]="role.role_id">{{ role.role_name }}</option>
            </select>
          </div>

          <!-- Items per page -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Items per page</label>
            <select
              [(ngModel)]="filters.limit"
              (ngModelChange)="onFilterChange()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="10">10</option>
              <option [ngValue]="25">25</option>
              <option [ngValue]="50">50</option>
              <option [ngValue]="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex items-center justify-center py-12">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-[#1e3c72] border-t-transparent"></div>
      </div>

      <!-- Users Table -->
      <div *ngIf="!loading" class="overflow-hidden rounded-lg bg-white shadow">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Roles</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Login</th>
                <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr *ngFor="let user of users" class="transition hover:bg-gray-50">
                <td class="whitespace-nowrap px-6 py-4">
                  <div class="flex items-center">
                    <div class="h-10 w-10 flex-shrink-0">
                      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-white font-semibold">
                        {{ user.full_name.charAt(0).toUpperCase() }}
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ user.full_name }}</div>
                      <div class="text-sm text-gray-500">@{{ user.username }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    <span *ngFor="let role of user.roles" class="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                      {{ role.role_name }}
                    </span>
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span
                    [class]="user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    class="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                  >
                    {{ user.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {{ user.last_login ? (user.last_login | date:'short') : 'Never' }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    *hasPermission="'USER_MANAGEMENT.VIEW'"
                    (click)="viewUser(user)"
                    class="mr-3 text-blue-600 hover:text-blue-900"
                    title="View"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </button>
                  <button
                    *hasPermission="'USER_MANAGEMENT.UPDATE'"
                    (click)="editUser(user)"
                    class="mr-3 text-indigo-600 hover:text-indigo-900"
                    title="Edit"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    *hasPermission="'USER_ROLE_ASSIGNMENT.ATTACH_ROLE'"
                    (click)="manageRoles(user)"
                    class="mr-3 text-purple-600 hover:text-purple-900"
                    title="Manage Roles"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                  </button>
                  <button
                    *hasPermission="'USER_MANAGEMENT.DELETE'"
                    (click)="deleteUser(user)"
                    class="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div class="flex flex-1 justify-between sm:hidden">
            <button
              (click)="previousPage()"
              [disabled]="pagination.page === 1"
              [class.opacity-50]="pagination.page === 1"
              [class.cursor-not-allowed]="pagination.page === 1"
              class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              (click)="nextPage()"
              [disabled]="pagination.page >= pagination.totalPages"
              [class.opacity-50]="pagination.page >= pagination.totalPages"
              [class.cursor-not-allowed]="pagination.page >= pagination.totalPages"
              class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{{ getStartItem() }}</span>
                to
                <span class="font-medium">{{ getEndItem() }}</span>
                of
                <span class="font-medium">{{ pagination.total }}</span>
                results
              </p>
            </div>
            <div>
              <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  (click)="previousPage()"
                  [disabled]="pagination.page === 1"
                  class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                  </svg>
                </button>
                <button
                  *ngFor="let page of getPageNumbers()"
                  (click)="goToPage(page)"
                  [class.bg-[#1e3c72]]="page === pagination.page"
                  [class.text-white]="page === pagination.page"
                  [class.text-gray-900]="page !== pagination.page"
                  [class.hover:bg-gray-50]="page !== pagination.page"
                  class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0"
                >
                  {{ page }}
                </button>
                <button
                  (click)="nextPage()"
                  [disabled]="pagination.page >= pagination.totalPages"
                  class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Next</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && users.length === 0" class="rounded-lg bg-white p-12 text-center shadow">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No users found</h3>
        <p class="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
      </div>
    </div>
  `
})
export class UserListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  users: User[] = [];
  roles: Role[] = [];
  loading = false;

  filters: UserFilters = {
    page: 1,
    limit: 10,
    sortBy: 'user_id',
    sortOrder: 'DESC'
  };

  pagination = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  };

  constructor(
    private userService: UserService,
    private permissionService: PermissionService,
    private router: Router
  ) {
    // Setup search debounce
    this.searchSubject$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.filters.page = 1;
        this.loadUsers();
      });
  }

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
          console.error('Error loading users:', error);
          this.loading = false;
        }
      });
  }

  loadRoles(): void {
    this.permissionService.getAllRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe(roles => {
        this.roles = roles;
      });
  }

  onSearchChange(search: string): void {
    this.searchSubject$.next(search);
  }

  onFilterChange(): void {
    this.filters.page = 1;
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
    this.router.navigate(['/admin/users/view', user.user_id]);
  }

  editUser(user: User): void {
    this.router.navigate(['/admin/users/edit', user.user_id]);
  }

  manageRoles(user: User): void {
    this.router.navigate(['/admin/users/roles', user.user_id]);
  }

  openCreateModal(): void {
    console.log('🎯 CREATE USER BUTTON CLICKED - Navigating to /admin/users/create');
    this.router.navigate(['/admin/users/create'])
      .then(success => {
        console.log('🎯 Navigation result:', success ? 'SUCCESS' : 'FAILED');
      })
      .catch(error => {
        console.error('🎯 Navigation error:', error);
      });
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user "${user.full_name}"? This action cannot be undone.`)) {
      this.userService.deleteUser(user.user_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadUsers();
            alert('User deleted successfully.');
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            
            // Show user-friendly error message based on status code
            if (error.status === 403) {
              alert('Access Denied: You do not have permission to delete this user.');
            } else if (error.status === 404) {
              alert('User not found. It may have already been deleted.');
            } else {
              alert('Failed to delete user. Please try again.');
            }
          }
        });
    }
  }
}
