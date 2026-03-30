import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { CreateUserDto, UpdateUserDto } from '../../../shared/models/user.model';

// Shared UI Components
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { TextInputComponent } from '../../../shared/components/ui/text-input/text-input.component';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox.component';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';

import { APP_ROUTES } from '../../../core/constants/routes.constants'

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, TextInputComponent, CheckboxComponent, LoadingSpinnerComponent],
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
        <h1 class="text-3xl font-bold text-gray-900">{{ isEditMode ? 'Edit User' : 'Create User' }}</h1>
        <p class="mt-1 text-sm text-gray-600">{{ isEditMode ? 'Update user information' : 'Add a new user to the system' }}</p>
      </div>

      <!-- Loading State -->
      <app-loading-spinner
        *ngIf="loading && isEditMode"
        size="large"
        message="Loading user data..."
      ></app-loading-spinner>

      <!-- Form Card -->
      <div *ngIf="!loading || !isEditMode" class="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
          <!-- Username -->
          <div class="mb-4">
            <app-text-input
              formControlName="username"
              label="Username"
              placeholder="Enter username"
              inputType="string"
              [error]="getFieldError('username')"
              [required]="true"
              [disabled]="loading || isEditMode"
              hint="Username can only contain letters, numbers, and underscores (3-50 characters)"
            ></app-text-input>
          </div>

          <!-- Full Name -->
          <div class="mb-4">
            <app-text-input
              formControlName="full_name"
              label="Full Name"
              placeholder="Enter full name"
              inputType="string"
              [error]="getFieldError('full_name')"
              [required]="true"
              [disabled]="loading"
              [maxLength]="100"
            ></app-text-input>
          </div>

          <!-- Password -->
          <div class="mb-4">
            <app-text-input
              formControlName="password"
              label="Password"
              placeholder="Enter password"
              inputType="string"
              [error]="getFieldError('password')"
              [required]="!isEditMode"
              [disabled]="loading"
              [hint]="isEditMode ? 'Leave blank to keep current password' : 'Minimum 8 characters required'"
            ></app-text-input>
          </div>

          <!-- Confirm Password -->
          <div class="mb-4">
            <app-text-input
              formControlName="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm password"
              inputType="string"
              [error]="getPasswordConfirmError()"
              [required]="!isEditMode"
              [disabled]="loading"
            ></app-text-input>
          </div>

          <!-- Active Status -->
          <div class="mb-6">
            <app-checkbox
              formControlName="is_active"
              label="Active User"
              [disabled]="loading"
              labelSize="sm"
              description="Inactive users cannot log in to the system"
            ></app-checkbox>
          </div>

          <!-- Actions -->
          <div class="mt-6 flex justify-end gap-3">
            <app-button
              type="button"
              variant="outline"
              size="md"
              (click)="goBack()"
              [disabled]="loading"
            >
              Cancel
            </app-button>
            <app-button
              type="submit"
              variant="primary"
              size="md"
              [loading]="loading"
              [disabled]="userForm.invalid || loading"
            >
              {{ isEditMode ? 'Update User' : 'Create User' }}
            </app-button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class UserFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  userForm: FormGroup;
  isEditMode = false;
  userId?: number;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private logger: LoggerService,
    private toast: ToastService
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.isEditMode = true;
          this.userId = parseInt(params['id']);
          this.loadUser();
        } else {
          // Create mode - password is required
          this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
          this.userForm.get('confirmPassword')?.setValidators([Validators.required]);
          this.userForm.get('password')?.updateValueAndValidity();
          this.userForm.get('confirmPassword')?.updateValueAndValidity();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      full_name: ['', [Validators.required, Validators.maxLength(100)]],
      password: ['', []],
      confirmPassword: ['', []],
      is_active: [true]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private loadUser(): void {
    if (!this.userId) return;

    this.loading = true;
    this.userService.getUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userDetail) => {
          this.userForm.patchValue({
            username: userDetail.user.username,
            full_name: userDetail.user.full_name,
            is_active: userDetail.user.is_active
          });
          
          // Make password optional in edit mode
          this.userForm.get('password')?.clearValidators();
          this.userForm.get('confirmPassword')?.clearValidators();
          this.userForm.get('password')?.updateValueAndValidity();
          this.userForm.get('confirmPassword')?.updateValueAndValidity();
          
          this.loading = false;
        },
        error: (error) => {
          this.logger.error('Error loading user', error);
          this.toast.error('Failed to load user data');
          this.loading = false;
        }
      });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    if (this.isEditMode) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  private createUser(): void {
    if (this.userForm.invalid) {
      this.loading = false;
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      this.toast.warning('Please fill in all required fields correctly');
      return;
    }

    const dto: CreateUserDto = {
      username: this.userForm.value.username,
      password: this.userForm.value.password,
      full_name: this.userForm.value.full_name,
      is_active: this.userForm.value.is_active
    };

    this.userService.createUser(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userId) => {
          this.loading = false;
          this.toast.success('User created successfully');
          this.router.navigate([APP_ROUTES.ADMIN_USERS.LIST]);
        },
        error: (error) => {
          this.logger.error('Error creating user', error);
          this.toast.error(error.error?.message || 'Failed to create user');
          this.loading = false;
        }
      });
  }

  private updateUser(): void {
    if (!this.userId) return;

    const dto: UpdateUserDto = {
      full_name: this.userForm.value.full_name,
      is_active: this.userForm.value.is_active
    };

    // Only include password if provided
    if (this.userForm.value.password) {
      dto.password = this.userForm.value.password;
    }

    this.userService.updateUser(this.userId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.toast.success('User updated successfully');
          this.router.navigate([APP_ROUTES.ADMIN_USERS.LIST]);
        },
        error: (error) => {
          this.logger.error('Error updating user', error);
          this.toast.error(error.error?.message || 'Failed to update user');
          this.loading = false;
        }
      });
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (!field || !field.invalid || (!field.dirty && !field.touched)) {
      return '';
    }

    if (field.errors?.['required']) return `${fieldName.replace(/_/g, ' ')} is required`;
    if (field.errors?.['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
    if (field.errors?.['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed`;
    if (field.errors?.['pattern']) return `${fieldName.replace(/_/g, ' ')} format is invalid`;
    return 'Invalid input';
  }

  getPasswordConfirmError(): string {
    const field = this.userForm.get('confirmPassword');
    if (!field || (!field.dirty && !field.touched)) {
      return '';
    }

    if (this.userForm.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }

    if (field.errors?.['required']) {
      return 'Password confirmation is required';
    }

    return '';
  }

  goBack(): void {
    this.router.navigate([APP_ROUTES.ADMIN_USERS.LIST]);
  }
}



