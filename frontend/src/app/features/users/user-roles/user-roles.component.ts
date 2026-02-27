import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { PermissionService } from '../../../core/services/permission.service';
import { UserDetail } from '../../../shared/models/user.model';
import { Role, AssignRoleDto } from '../../../shared/models/permission.model';

interface RoleAssignment {
  roleId: number;
  expiresAt?: string;
}

@Component({
  selector: 'app-user-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          Back to User
        </button>
        <div *ngIf="userDetail">
          <h1 class="text-3xl font-bold text-gray-900">Manage User Roles</h1>
          <p class="mt-1 text-sm text-gray-600">Assign and manage roles for {{ userDetail.user.full_name }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex items-center justify-center py-12">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-[#1e3c72] border-t-transparent"></div>
      </div>

      <!-- Content -->
      <div *ngIf="!loading && userDetail" class="mx-auto max-w-4xl space-y-6">
        <!-- Assign New Role Card -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-xl font-semibold text-gray-900">Assign New Role</h2>
          <div class="space-y-4">
            <!-- Role Selection -->
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Select Role</label>
              <select
                [(ngModel)]="selectedRoleId"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              >
                <option [value]="null">-- Select a role --</option>
                <option
                  *ngFor="let role of availableRoles"
                  [value]="role.role_id"
                >
                  {{ role.role_name }} ({{ role.role_code }})
                </option>
              </select>
            </div>

            <!-- Expiration Date (Optional) -->
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Expiration Date (Optional)
              </label>
              <input
                type="datetime-local"
                [(ngModel)]="expirationDate"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              />
              <p class="mt-1 text-sm text-gray-500">Leave empty for permanent role assignment</p>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="rounded-lg bg-red-50 p-4">
              <div class="flex">
                <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                <div class="ml-3">
                  <p class="text-sm text-red-800">{{ errorMessage }}</p>
                </div>
              </div>
            </div>

            <!-- Success Message -->
            <div *ngIf="successMessage" class="rounded-lg bg-green-50 p-4">
              <div class="flex">
                <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <div class="ml-3">
                  <p class="text-sm text-green-800">{{ successMessage }}</p>
                </div>
              </div>
            </div>

            <!-- Assign Button -->
            <button
              (click)="assignRole()"
              [disabled]="!selectedRoleId || assigning"
              class="w-full rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span *ngIf="assigning" class="flex items-center justify-center">
                <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Assigning...
              </span>
              <span *ngIf="!assigning">Assign Role</span>
            </button>
          </div>
        </div>

        <!-- Currently Assigned Roles Card -->
        <div class="rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-xl font-semibold text-gray-900">Currently Assigned Roles</h2>
          
          <div *ngIf="userDetail.roles.length > 0" class="space-y-3">
            <div
              *ngFor="let role of userDetail.roles"
              class="flex items-center justify-between rounded-lg border border-gray-200 p-4"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-medium text-gray-900">{{ role.role_name }}</h3>
                  <span class="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                    {{ role.role_code }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-500">
                  Assigned {{ role.assigned_at | date:'short' }} by {{ role.assigned_by }}
                </p>
                <p *ngIf="role.expires_at" class="mt-1 text-sm" [class.text-red-600]="isExpired(role.expires_at)" [class.text-orange-600]="!isExpired(role.expires_at)">
                  {{ isExpired(role.expires_at) ? 'Expired' : 'Expires' }}: {{ role.expires_at | date:'short' }}
                </p>
              </div>
              <button
                (click)="confirmDetachRole(role.role_id, role.role_name)"
                [disabled]="detachingRoleId === role.role_id"
                class="ml-4 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span *ngIf="detachingRoleId === role.role_id" class="flex items-center">
                  <svg class="mr-1 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Removing...
                </span>
                <span *ngIf="detachingRoleId !== role.role_id">Remove</span>
              </button>
            </div>
          </div>

          <div *ngIf="userDetail.roles.length === 0" class="py-8 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No roles assigned</h3>
            <p class="mt-1 text-sm text-gray-500">This user has no roles assigned yet.</p>
          </div>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <div
        *ngIf="showConfirmModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        (click)="cancelDetach()"
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
          <h3 class="mb-2 text-lg font-medium text-gray-900">Confirm Role Removal</h3>
          <p class="mb-6 text-sm text-gray-500">
            Are you sure you want to remove the role "{{ roleToDetachName }}" from this user?
            This action cannot be undone.
          </p>
          <div class="flex gap-3">
            <button
              (click)="cancelDetach()"
              class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              (click)="detachRole()"
              class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Remove Role
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserRolesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  userDetail: UserDetail | null = null;
  allRoles: Role[] = [];
  availableRoles: Role[] = [];
  loading = false;
  assigning = false;
  detachingRoleId: number | null = null;
  userId?: number;
  
  selectedRoleId: number | null = null;
  expirationDate: string = '';
  
  errorMessage = '';
  successMessage = '';
  
  showConfirmModal = false;
  roleToDetach: number | null = null;
  roleToDetachName = '';

  constructor(
    private userService: UserService,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.userId = parseInt(params['id']);
          this.loadData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    if (!this.userId) return;

    this.loading = true;
    forkJoin({
      user: this.userService.getUserById(this.userId),
      roles: this.permissionService.getAllRoles()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ user, roles }) => {
          this.userDetail = user;
          this.allRoles = roles;
          this.updateAvailableRoles();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.loading = false;
        }
      });
  }

  private updateAvailableRoles(): void {
    if (!this.userDetail) return;
    
    const assignedRoleIds = this.userDetail.roles.map(r => r.role_id);
    this.availableRoles = this.allRoles.filter(role => 
      !assignedRoleIds.includes(role.role_id) && role.is_active
    );
  }

  assignRole(): void {
    if (!this.userId || !this.selectedRoleId) return;

    this.assigning = true;
    this.errorMessage = '';
    this.successMessage = '';

    const dto: AssignRoleDto = {
      user_id: this.userId,
      role_id: this.selectedRoleId,
      expires_at: this.expirationDate ? new Date(this.expirationDate) : undefined
    };
    
    this.permissionService.assignRole(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Role assigned successfully';
          this.selectedRoleId = null;
          this.expirationDate = '';
          this.assigning = false;
          
          // Reload user data
          if (this.userId) {
            this.userService.getUserById(this.userId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (user) => {
                  this.userDetail = user;
                  this.updateAvailableRoles();
                },
                error: (error) => {
                  console.error('Error reloading user:', error);
                }
              });
          }
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error assigning role:', error);
          this.errorMessage = error.error?.message || 'Failed to assign role';
          this.assigning = false;
        }
      });
  }

  confirmDetachRole(roleId: number, roleName: string): void {
    this.roleToDetach = roleId;
    this.roleToDetachName = roleName;
    this.showConfirmModal = true;
  }

  cancelDetach(): void {
    this.roleToDetach = null;
    this.roleToDetachName = '';
    this.showConfirmModal = false;
  }

  detachRole(): void {
    if (!this.userId || !this.roleToDetach) return;

    this.detachingRoleId = this.roleToDetach;
    this.showConfirmModal = false;
    this.errorMessage = '';
    this.successMessage = '';

    this.permissionService.detachRole(this.userId, this.roleToDetach)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Role removed successfully';
          this.detachingRoleId = null;
          this.roleToDetach = null;
          this.roleToDetachName = '';
          
          // Reload user data
          if (this.userId) {
            this.userService.getUserById(this.userId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (user) => {
                  this.userDetail = user;
                  this.updateAvailableRoles();
                },
                error: (error) => {
                  console.error('Error reloading user:', error);
                }
              });
          }
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error detaching role:', error);
          this.errorMessage = error.error?.message || 'Failed to remove role';
          this.detachingRoleId = null;
        }
      });
  }

  isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  goBack(): void {
    if (this.userId) {
      this.router.navigate(['/admin/users/view', this.userId]);
    } else {
      this.router.navigate(['/admin/users']);
    }
  }
}
