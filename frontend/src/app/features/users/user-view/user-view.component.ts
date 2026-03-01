import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserDetail, UserDetailRole } from '../../../shared/models/user.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../common/components/status-badge/status-badge.component';

@Component({
  selector: 'app-user-view',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6">
        <button
          (click)="goBack()"
          class="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Users
        </button>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">User Details</h1>
            <p class="mt-1 text-sm text-gray-600">View user information and permissions</p>
          </div>
          <div class="flex gap-2">
            <button
              *hasPermission="'USER_MANAGEMENT.UPDATE'"
              (click)="editUser()"
              class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit User
            </button>
            <button
              *hasPermission="'USER_ROLE_ASSIGNMENT.ATTACH_ROLE'"
              (click)="manageRoles()"
              class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              Manage Roles
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loading"></app-loading-spinner>

      <!-- User Details -->
      <div *ngIf="!loading && userDetail" class="mx-auto max-w-4xl space-y-6">
        <!-- Basic Information Card -->
        <div class="rounded-lg bg-white p-6 shadow">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">Basic Information</h2>
            <app-status-badge [active]="userDetail.user.is_active"></app-status-badge>
          </div>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <!-- User Avatar -->
            <div class="md:col-span-2">
              <div class="flex items-center">
                <div class="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-3xl font-bold text-white">
                  {{ userDetail.user.full_name.charAt(0).toUpperCase() }}
                </div>
                <div class="ml-6">
                  <h3 class="text-2xl font-bold text-gray-900">{{ userDetail.user.full_name }}</h3>
                  <p class="text-gray-500">@{{ userDetail.user.username }}</p>
                </div>
              </div>
            </div>

            <!-- Last Login -->
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-500">Last Login</label>
              <p class="text-base text-gray-900">{{ userDetail.user.last_login ? (userDetail.user.last_login | date:'medium') : 'Never' }}</p>
            </div>

            <!-- User ID -->
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-500">User ID</label>
              <p class="text-base font-mono text-gray-900">{{ userDetail.user.user_id }}</p>
            </div>
          </div>
        </div>

        <!-- Roles Card -->
        <div class="rounded-lg bg-white p-6 shadow">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">Assigned Roles</h2>
            <button
              *hasPermission="'USER_ROLE_ASSIGNMENT.ATTACH_ROLE'"
              (click)="manageRoles()"
              class="text-sm text-[#1e3c72] hover:text-[#2a5298]"
            >
              Manage Roles
            </button>
          </div>
          <div *ngIf="userDetail.roles.length > 0" class="space-y-3">
            <div
              *ngFor="let role of userDetail.roles; trackBy: trackByRoleId"
              class="flex items-center justify-between rounded-lg border border-gray-200 p-4"
            >
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-medium text-gray-900">{{ role.role_name }}</h3>
                  <span class="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                    {{ role.role_code }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-500">
                  Assigned {{ role.assigned_at | date:'short' }} by {{ role.assigned_by }}
                </p>
                <p *ngIf="role.expires_at" class="mt-1 text-sm text-orange-600">
                  Expires: {{ role.expires_at | date:'short' }}
                </p>
              </div>
              <div class="text-right">
                <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div *ngIf="userDetail.roles.length === 0" class="py-8 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No roles assigned</h3>
            <p class="mt-1 text-sm text-gray-500">This user has no roles assigned yet.</p>
            <button
              *hasPermission="'USER_ROLE_ASSIGNMENT.ATTACH_ROLE'"
              (click)="manageRoles()"
              class="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Assign Role
            </button>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading && !userDetail" class="mx-auto max-w-4xl rounded-lg bg-white p-12 text-center shadow">
        <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">User not found</h3>
        <p class="mt-1 text-sm text-gray-500">The requested user could not be found.</p>
      </div>
    </div>
  `
})
export class UserViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  userDetail: UserDetail | null = null;
  loading = false;
  userId?: number;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.userId = parseInt(params['id']);
          this.loadUser();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUser(): void {
    if (!this.userId) return;

    this.loading = true;
    this.userService.getUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userDetail) => {
          this.userDetail = userDetail;
          this.loading = false;
        },
        error: (error) => {
          this.logger.error('Error loading user', error);
          this.toast.error('Failed to load user details');
          this.loading = false;
        }
      });
  }

  editUser(): void {
    if (this.userId) {
      this.router.navigate(['/admin/users/edit', this.userId]);
    }
  }

  manageRoles(): void {
    if (this.userId) {
      this.router.navigate(['/admin/users/roles', this.userId]);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }

  /**
   * TrackBy function for user roles list
   * Improves ngFor performance by tracking items by unique identifier
   */
  trackByRoleId(index: number, role: UserDetailRole): number {
    return role.role_id;
  }
}
