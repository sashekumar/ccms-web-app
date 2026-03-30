import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../../../core/services/permission.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { CreateRoleDto, UpdateRoleDto } from '../../../shared/models/permission.model';
import { TextInputComponent } from '../../../shared/components/ui/text-input/text-input.component';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';

import { APP_ROUTES } from '../../../core/constants/routes.constants';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextInputComponent, CheckboxComponent, ButtonComponent, CardComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6">
        <button
          type="button"
          (click)="goBack()"
          class="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Roles
        </button>
        <h1 class="text-3xl font-bold text-gray-900">{{ isEditMode ? 'Edit Role' : 'Create Role' }}</h1>
        <p class="mt-1 text-sm text-gray-600">{{ isEditMode ? 'Update role information' : 'Create a new role in the system' }}</p>
      </div>

      <!-- Form Card -->
      <div class="mx-auto max-w-2xl">
        <app-card>
          <form [formGroup]="roleForm" (ngSubmit)="onSubmit()">

            <!-- System Role Warning -->
            <div *ngIf="isSystemRole" class="mb-6 rounded-lg bg-yellow-50 p-4">
              <div class="flex">
                <svg class="h-5 w-5 shrink-0 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-yellow-800">System Role</h3>
                  <p class="mt-1 text-sm text-yellow-700">
                    This is a system role. Fields are read-only to prevent breaking system functionality.
                  </p>
                </div>
              </div>
            </div>

            <!-- Role Name -->
            <div class="mb-4">
              <app-text-input
                formControlName="roleName"
                label="Role Name"
                placeholder="Enter role name"
                [required]="true"
                [disabled]="isSystemRole"
                [error]="getFieldError('roleName')"
              ></app-text-input>
            </div>

            <!-- Role Code -->
            <div class="mb-4">
              <app-text-input
                formControlName="roleCode"
                label="Role Code"
                placeholder="Enter role code (e.g., ADMIN)"
                [required]="true"
                [disabled]="isEditMode || isSystemRole"
                [error]="getFieldError('roleCode')"
                hint="Role code is unique and cannot be changed after creation"
              ></app-text-input>
            </div>

            <!-- Description -->
            <div class="mb-4">
              <label class="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                formControlName="description"
                [attr.readonly]="isSystemRole || null"
                [class.bg-gray-100]="isSystemRole"
                [class.cursor-not-allowed]="isSystemRole"
                rows="3"
                placeholder="Enter role description"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              ></textarea>
            </div>

            <!-- Active Status -->
            <div class="mb-6">
              <app-checkbox
                formControlName="isActive"
                label="Active Role"
                [disabled]="isSystemRole"
                labelSize="sm"
                description="Inactive roles cannot be assigned to users"
              ></app-checkbox>
            </div>

            <!-- Actions -->
            <div class="mt-6 flex justify-end gap-3">
              <app-button type="button" variant="outline" (click)="goBack()">
                Cancel
              </app-button>
              <app-button
                *ngIf="!isSystemRole"
                type="submit"
                variant="primary"
                [loading]="loading"
                [disabled]="roleForm.invalid || loading"
              >
                {{ isEditMode ? 'Update Role' : 'Create Role' }}
              </app-button>
            </div>
          </form>
        </app-card>
      </div>
    </div>
  `
})
export class RoleFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  roleForm: FormGroup;
  isEditMode = false;
  isSystemRole = false;
  roleId?: number;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router,
    private logger: LoggerService,
    private toast: ToastService
  ) {
    this.roleForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.isEditMode = true;
          this.roleId = parseInt(params['id']);
          this.loadRole();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      roleName: ['', [Validators.required, Validators.maxLength(100)]],
      roleCode: ['', [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern(/^[A-Z0-9_]+$/)
      ]],
      description: [''],
      isActive: [true]
    });
  }

  private loadRole(): void {
    if (!this.roleId) return;

    this.loading = true;
    this.permissionService.getRoleById(this.roleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (role) => {
          this.roleForm.patchValue({
            roleName: role.role_name,
            roleCode: role.role_code,
            description: role.description,
            isActive: role.is_active
          });
          
          this.isSystemRole = role.is_system_role;
          
          if (this.isSystemRole) {
            // Disable all fields for system roles
            this.roleForm.get('roleName')?.disable();
            this.roleForm.get('roleCode')?.disable();
            this.roleForm.get('description')?.disable();
            this.roleForm.get('isActive')?.disable();
          }
          
          this.loading = false;
        },
        error: (error) => {
          this.logger.error('Error loading role', error);
          this.toast.error('Failed to load role data');
          this.loading = false;
        }
      });
  }

  onSubmit(): void {
    if (this.roleForm.invalid || this.isSystemRole) {
      Object.keys(this.roleForm.controls).forEach(key => {
        this.roleForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    if (this.isEditMode) {
      this.updateRole();
    } else {
      this.createRole();
    }
  }

  private createRole(): void {
    const dto: CreateRoleDto = {
      role_name: this.roleForm.value.roleName,
      role_code: this.roleForm.value.roleCode,
      description: this.roleForm.value.description || undefined
    };

    this.permissionService.createRole(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roleId) => {
          this.loading = false;
          this.toast.success('Role created successfully');
          // Navigate to permissions page to assign permissions
          this.router.navigate([APP_ROUTES.ADMIN_ROLES.PERMISSIONS(roleId)]);
        },
        error: (error) => {
          this.logger.error('Error creating role', error);
          this.toast.error(error.error?.message || 'Failed to create role');
          this.loading = false;
        }
      });
  }

  private updateRole(): void {
    if (!this.roleId) return;

    const dto: UpdateRoleDto = {
      role_name: this.roleForm.value.roleName,
      description: this.roleForm.value.description || undefined,
      is_active: this.roleForm.value.isActive
    };

    this.permissionService.updateRole(this.roleId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.toast.success('Role updated successfully');
          this.router.navigate([APP_ROUTES.ADMIN_ROLES.LIST]);
        },
        error: (error) => {
          this.logger.error('Error updating role', error);
          this.toast.error(error.error?.message || 'Failed to update role');
          this.loading = false;
        }
      });
  }

  getFieldError(fieldName: string): string {
    const control = this.roleForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';
    if (control.errors['required'])    return 'This field is required';
    if (control.errors['maxlength'])   return `Must not exceed ${control.errors['maxlength'].requiredLength} characters`;
    if (control.errors['pattern'])     return 'Only uppercase letters, numbers, and underscores allowed';
    return 'Invalid value';
  }

  goBack(): void {
    this.router.navigate([APP_ROUTES.ADMIN_ROLES.LIST]);
  }
}



