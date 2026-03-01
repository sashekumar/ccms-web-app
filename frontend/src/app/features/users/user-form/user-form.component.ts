import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { CreateUserDto, UpdateUserDto } from '../../../shared/models/user.model';

@Component({
  selector: 'app-user-form',
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
          Back to Users
        </button>
        <h1 class="text-3xl font-bold text-gray-900">{{ isEditMode ? 'Edit User' : 'Create User' }}</h1>
        <p class="mt-1 text-sm text-gray-600">{{ isEditMode ? 'Update user information' : 'Add a new user to the system' }}</p>
      </div>

      <!-- Form Card -->
      <div class="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
          <!-- Username -->
          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Username <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="username"
              [readonly]="isEditMode"
              [class.bg-gray-100]="isEditMode"
              [class.cursor-not-allowed]="isEditMode"
              class="w-full rounded-lg border px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              [class.border-red-500]="isFieldInvalid('username')"
              placeholder="Enter username"
            />
            <p *ngIf="isFieldInvalid('username')" class="mt-1 text-sm text-red-500">
              <span *ngIf="userForm.get('username')?.errors?.['required']">Username is required</span>
              <span *ngIf="userForm.get('username')?.errors?.['minlength']">Username must be at least 3 characters</span>
              <span *ngIf="userForm.get('username')?.errors?.['maxlength']">Username must not exceed 50 characters</span>
              <span *ngIf="userForm.get('username')?.errors?.['pattern']">Username can only contain letters, numbers, and underscores</span>
            </p>
          </div>

          <!-- Full Name -->
          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Full Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="full_name"
              class="w-full rounded-lg border px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              [class.border-red-500]="isFieldInvalid('full_name')"
              placeholder="Enter full name"
            />
            <p *ngIf="isFieldInvalid('full_name')" class="mt-1 text-sm text-red-500">
              <span *ngIf="userForm.get('full_name')?.errors?.['required']">Full name is required</span>
              <span *ngIf="userForm.get('full_name')?.errors?.['maxlength']">Full name must not exceed 100 characters</span>
            </p>
          </div>

          <!-- Password -->
          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Password <span *ngIf="!isEditMode" class="text-red-500">*</span>
              <span *ngIf="isEditMode" class="text-sm font-normal text-gray-500">(Leave blank to keep current)</span>
            </label>
            <input
              type="password"
              formControlName="password"
              class="w-full rounded-lg border px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              [class.border-red-500]="isFieldInvalid('password')"
              placeholder="Enter password"
            />
            <p *ngIf="isFieldInvalid('password')" class="mt-1 text-sm text-red-500">
              <span *ngIf="userForm.get('password')?.errors?.['required']">Password is required</span>
              <span *ngIf="userForm.get('password')?.errors?.['minlength']">Password must be at least 8 characters</span>
            </p>
          </div>

          <!-- Confirm Password -->
          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Confirm Password <span *ngIf="!isEditMode" class="text-red-500">*</span>
            </label>
            <input
              type="password"
              formControlName="confirmPassword"
              class="w-full rounded-lg border px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              [class.border-red-500]="isFieldInvalid('confirmPassword') || userForm.errors?.['passwordMismatch']"
              placeholder="Confirm password"
            />
            <p *ngIf="isFieldInvalid('confirmPassword') || userForm.errors?.['passwordMismatch']" class="mt-1 text-sm text-red-500">
              <span *ngIf="userForm.get('confirmPassword')?.errors?.['required']">Password confirmation is required</span>
              <span *ngIf="userForm.errors?.['passwordMismatch']">Passwords do not match</span>
            </p>
          </div>

          <!-- Active Status -->
          <div class="mb-6">
            <label class="flex items-center">
              <input
                type="checkbox"
                formControlName="is_active"
                class="h-4 w-4 rounded border-gray-300 text-[#1e3c72] focus:ring-[#1e3c72]"
              />
              <span class="ml-2 text-sm font-medium text-gray-700">Active User</span>
            </label>
            <p class="mt-1 text-sm text-gray-500">Inactive users cannot log in to the system</p>
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
              type="submit"
              [disabled]="userForm.invalid || loading"
              class="rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span *ngIf="loading" class="flex items-center">
                <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
              <span *ngIf="!loading">{{ isEditMode ? 'Update User' : 'Create User' }}</span>
            </button>
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
  errorMessage = '';

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
          this.errorMessage = 'Failed to load user data';
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
    this.errorMessage = '';

    if (this.isEditMode) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  private createUser(): void {
    if (this.userForm.invalid) {
      this.loading = false;
      // Mark all fields as touched to show validation errors
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      this.errorMessage = 'Please fill in all required fields correctly';
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
          this.router.navigate(['/admin/users']);
        },
        error: (error) => {
          this.logger.error('Error creating user', error);
          this.errorMessage = error.error?.message || 'Failed to create user';
          this.toast.error(this.errorMessage);
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
          this.router.navigate(['/admin/users']);
        },
        error: (error) => {
          this.logger.error('Error updating user', error);
          this.errorMessage = error.error?.message || 'Failed to update user';
          this.toast.error(this.errorMessage);
          this.loading = false;
        }
      });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }
}
