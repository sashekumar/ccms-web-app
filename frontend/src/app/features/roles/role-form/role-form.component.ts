import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../../../core/services/permission.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { CreateRoleDto, UpdateRoleDto } from '../../../shared/models/permission.model';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
          Back to Roles
        </button>
        <h1 class="text-3xl font-bold text-gray-900">{{ isEditMode ? 'Edit Role' : 'Create Role' }}</h1>
        <p class="mt-1 text-sm text-gray-600">{{ isEditMode ? 'Update role information' : 'Create a new role in the system' }}</p>
      </div>

      <!-- Form Card -->
      <div class="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
        <form [formGroup]="roleForm" (ngSubmit)="onSubmit()">
          <!-- Role Name -->
          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Role Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="roleName"
              [readonly]="isSystemRole"
              [class.bg-gray-100]="isSystemRole"
              [class.cursor-not-allowed]="isSystemRole"
              class="w-full rounded-lg border px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              [class.border-red-500]="isFieldInvalid('roleName')"
              placeholder="Enter role name"
            />
            <p *ngIf="isFieldInvalid('roleName')" class="mt-1 text-sm text-red-500">
              <span *ngIf="roleForm.get('roleName')?.errors?.['required']">Role name is required</span>
              <span *ngIf="roleForm.get('roleName')?.errors?.['maxlength']">Role name must not exceed 100 characters</span>
            </p>
          </div>

          <!-- Role Code -->
          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Role Code <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="roleCode"
              [readonly]="isEditMode || isSystemRole"
              [class.bg-gray-100]="isEditMode || isSystemRole"
              [class.cursor-not-allowed]="isEditMode || isSystemRole"
              class="w-full rounded-lg border px-3 py-2 font-mono text-sm focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              [class.border-red-500]="isFieldInvalid('roleCode')"
              placeholder="Enter role code (e.g., ADMIN)"
            />
            <p *ngIf="!isFieldInvalid('roleCode')" class="mt-1 text-sm text-gray-500">
              Role code is unique and cannot be changed after creation
            </p>
            <p *ngIf="isFieldInvalid('roleCode')" class="mt-1 text-sm text-red-500">
              <span *ngIf="roleForm.get('roleCode')?.errors?.['required']">Role code is required</span>
              <span *ngIf="roleForm.get('roleCode')?.errors?.['maxlength']">Role code must not exceed 50 characters</span>
              <span *ngIf="roleForm.get('roleCode')?.errors?.['pattern']">Role code can only contain uppercase letters, numbers, and underscores</span>
            </p>
          </div>

          <!-- Description -->
          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              formControlName="description"
              [readonly]="isSystemRole"
              [class.bg-gray-100]="isSystemRole"
              [class.cursor-not-allowed]="isSystemRole"
              rows="3"
              class="w-full rounded-lg border px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              placeholder="Enter role description"
            ></textarea>
          </div>

          <!-- Active Status -->
          <div class="mb-6">
            <label class="flex items-center">
              <input
                type="checkbox"
                formControlName="isActive"
                [disabled]="isSystemRole"
                class="h-4 w-4 rounded border-gray-300 text-[#1e3c72] focus:ring-[#1e3c72] disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span class="ml-2 text-sm font-medium text-gray-700">Active Role</span>
            </label>
            <p class="mt-1 text-sm text-gray-500">Inactive roles cannot be assigned to users</p>
          </div>

          <!-- System Role Warning -->
          <div *ngIf="isSystemRole" class="mb-6 rounded-lg bg-yellow-50 p-4">
            <div class="flex">
              <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">System Role</h3>
                <p class="mt-1 text-sm text-yellow-700">
                  This is a system role. Most fields are read-only to prevent breaking system functionality.
                </p>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="mb-4 rounded-lg bg-red-50 p-4">
            <div class="flex">
              <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              <div class="ml-3">
                <p class="text-sm text-red-800">{{ errorMessage }}</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3">
            <button
              type="button"
              (click)="goBack()"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              *ngIf="!isSystemRole"
              type="submit"
              [disabled]="roleForm.invalid || loading"
              class="rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span *ngIf="loading" class="flex items-center">
                <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
              <span *ngIf="!loading">{{ isEditMode ? 'Update Role' : 'Create Role' }}</span>
            </button>
          </div>
        </form>
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
  errorMessage = '';

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
          this.errorMessage = 'Failed to load role data';
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
    this.errorMessage = '';

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
          this.router.navigate(['/admin/roles/permissions', roleId]);
        },
        error: (error) => {
          this.logger.error('Error creating role', error);
          this.errorMessage = error.error?.message || 'Failed to create role';
          this.toast.error(this.errorMessage);
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
          this.router.navigate(['/admin/roles']);
        },
        error: (error) => {
          this.logger.error('Error updating role', error);
          this.errorMessage = error.error?.message || 'Failed to update role';
          this.toast.error(this.errorMessage);
          this.loading = false;
        }
      });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.roleForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  goBack(): void {
    this.router.navigate(['/admin/roles']);
  }
}
