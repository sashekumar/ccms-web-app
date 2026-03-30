import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { PermissionService } from '../../../core/services/permission.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserDetail, UserDetailRole } from '../../../shared/models/user.model';
import { Role, AssignRoleDto } from '../../../shared/models/permission.model';

// Shared UI Components
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/ui/dropdown/dropdown.component';
import { TextInputComponent } from '../../../shared/components/ui/text-input/text-input.component';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';

// Pipes
import { DateMalayPipe } from '../../../shared/pipes/date-malay.pipe';

import { APP_ROUTES } from '../../../core/constants/routes.constants'

@Component({
  selector: 'app-user-roles',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonComponent,
    DropdownComponent,
    TextInputComponent,
    ConfirmDialogComponent,
    BadgeComponent,
    LoadingSpinnerComponent,
    CardComponent,
    DateMalayPipe
  ],
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
      <app-loading-spinner
        *ngIf="loading"
        size="large"
        message="Loading user roles..."
      ></app-loading-spinner>

      <!-- Content -->
      <div *ngIf="!loading && userDetail" class="mx-auto max-w-4xl space-y-6">
        <!-- Assign New Role Card -->
        <app-card title="Assign New Role">
          <div class="space-y-6">
            <!-- No roles available notice -->
            <div *ngIf="roleDropdownOptions.length === 0 && !loading" class="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              All available roles have already been assigned to this user.
            </div>

            <!-- Role Selection -->
            <app-dropdown
              *ngIf="roleDropdownOptions.length > 0"
              [(ngModel)]="selectedRoleId"
              label="Select Role"
              placeholder="-- Select a role --"
              [options]="roleDropdownOptions"
              [disabled]="assigning"
            ></app-dropdown>

            <!-- Expiration Date (Optional) -->
            <app-text-input
              [(ngModel)]="expirationDate"
              label="Expiration Date (Optional)"
              placeholder="Leave empty for permanent assignment"
              inputType="string"
              [disabled]="assigning"
              hint="Enter date and time for role expiration (format: YYYY-MM-DDTHH:mm)"
            ></app-text-input>

            <!-- Assign Button -->
            <div class="mt-6">
              <app-button
                variant="primary"
                size="md"
                (click)="assignRole()"
                [disabled]="!selectedRoleId || assigning"
                [loading]="assigning"
              >
                Assign Role
              </app-button>
            </div>
          </div>
        </app-card>

        <!-- Currently Assigned Roles Card -->
        <app-card title="Currently Assigned Roles">
          <div *ngIf="userDetail.roles.length > 0" class="space-y-3">
            <div
              *ngFor="let role of userDetail.roles; trackBy: trackByRoleId"
              class="flex items-center justify-between rounded-lg border border-gray-200 p-4"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-medium text-gray-900">{{ role.role_name }}</h3>
                  <app-badge variant="primary" size="sm">
                    {{ role.role_code }}
                  </app-badge>
                </div>
                <p class="mt-1 text-sm text-gray-500">
                  Assigned {{ role.assigned_at | dateMalay }} by {{ role.assigned_by }}
                </p>
                <p *ngIf="role.expires_at" class="mt-1 text-sm" [class.text-red-600]="isExpired(role.expires_at)" [class.text-orange-600]="!isExpired(role.expires_at)">
                  {{ isExpired(role.expires_at) ? 'Expired' : 'Expires' }}: {{ role.expires_at | dateMalay:'DD MMM YYYY HH:mm' }}
                </p>
              </div>
              <app-button
                variant="danger"
                size="sm"
                (click)="confirmDetachRole(role.role_id, role.role_name)"
                [disabled]="detachingRoleId === role.role_id"
                [loading]="detachingRoleId === role.role_id"
              >
                {{ detachingRoleId === role.role_id ? 'Removing...' : 'Remove' }}
              </app-button>
            </div>
          </div>

          <div *ngIf="userDetail.roles.length === 0" class="py-8 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No roles assigned</h3>
            <p class="mt-1 text-sm text-gray-500">This user has no roles assigned yet.</p>
          </div>
        </app-card>
      </div>

      <!-- Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="showConfirmModal"
        title="Remove Role"
        [message]="'Are you sure you want to remove the role &quot;' + roleToDetachName + '&quot; from this user? This action cannot be undone.'"
        variant="danger"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        (confirmed)="detachRole()"
        (cancelled)="cancelDetach()"
      ></app-confirm-dialog>
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

  // Dropdown options
  roleDropdownOptions: DropdownOption[] = [];

  constructor(
    private userService: UserService,
    private permissionService: PermissionService,
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
          this.logger.error('Error loading data', error);
          this.toast.error('Failed to load user roles');
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

    // Update dropdown options (no placeholder item — handled by dropdown's placeholder input)
    this.roleDropdownOptions = this.availableRoles.map(r => (
      { value: r.role_id, label: `${r.role_name} (${r.role_code})` }
    ));
  }

  assignRole(): void {
    if (!this.userId || !this.selectedRoleId) return;

    this.assigning = true;

    const dto: AssignRoleDto = {
      user_id: this.userId,
      role_id: this.selectedRoleId,
      expires_at: this.expirationDate ? new Date(this.expirationDate) : undefined
    };
    
    this.permissionService.assignRole(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Role assigned successfully');
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
                  this.logger.error('Error reloading user after role assignment', error);
                }
              });
          }
          
          // Remove stale timeout from assign
        },
        error: (error) => {
          this.logger.error('Error assigning role', error);
          this.toast.error(error.error?.message || 'Failed to assign role');
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

    this.permissionService.detachRole(this.userId, this.roleToDetach)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Role removed successfully');
          this.detachingRoleId = null;
          this.roleToDetach = null;
          this.roleToDetachName = '';
          this.showConfirmModal = false;
          
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
                  this.logger.error('Error reloading user after role detachment', error);
                }
              });
          }
        },
        error: (error) => {
          this.logger.error('Error detaching role', error);
          this.toast.error(error.error?.message || 'Failed to remove role');
          this.detachingRoleId = null;
          this.showConfirmModal = false;
        }
      });
  }

  isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  goBack(): void {
    if (this.userId) {
      this.router.navigate([APP_ROUTES.ADMIN_USERS.DETAIL(this.userId)]);
    } else {
      this.router.navigate([APP_ROUTES.ADMIN_USERS.LIST]);
    }
  }

  /**
   * TrackBy function for roles lists
   * Improves ngFor performance by tracking items by unique identifier
   */
  trackByRoleId(index: number, role: Role | UserDetailRole): number {
    return role.role_id;
  }
}



