import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

import { MemberService } from '../../../core/services/member.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { CreateMemberDto, UpdateMemberDto, Member } from '../../../shared/models/member.model';

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './member-form.component.html',
  styleUrls: ['./member-form.component.scss']
})
export class MemberFormComponent implements OnInit, OnDestroy {
  memberForm!: FormGroup;
  isEditMode = false;
  memberId: string | null = null;
  loading = false;
  submitting = false;
  icCheckPending = false;
  icExists = false;
  
  private destroy$ = new Subject<void>();
  private icCheckSubject$ = new Subject<string>();

  // Member type options
  memberTypes = [
    { value: 'Principal', label: 'Principal' },
    { value: 'Dependent', label: 'Dependent' },
    { value: 'Other', label: 'Other' }
  ];

  // Gender options
  genders = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Unspecified', label: 'Unspecified' }
  ];

  constructor(
    private fb: FormBuilder,
    private memberService: MemberService,
    private router: Router,
    private route: ActivatedRoute,
    private logger: LoggerService,
    private toast: ToastService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.memberId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.memberId;

    if (this.isEditMode) {
      this.loadMember();
    }

    // Set up IC validation with debounce
    this.setupICValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.memberForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.maxLength(100)]],
      ic_no: ['', [Validators.maxLength(50)]],
      member_type: ['Principal', [Validators.required]],
      dob: [''],
      gender: ['Unspecified'],
      enrollment_date: ['', [Validators.required]],
      termination_date: [''],
      bank_id: [''],
      bank_acc_no: ['', [Validators.maxLength(50)]]
    });
  }

  private setupICValidation(): void {
    // Listen to IC number changes
    this.memberForm.get('ic_no')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((icNo: string) => {
          // Only check if IC is provided and not in edit mode (or if IC changed in edit mode)
          if (!icNo || icNo.trim() === '') {
            this.icExists = false;
            this.icCheckPending = false;
            return of(null);
          }

          // In edit mode, don't check if IC hasn't changed
          if (this.isEditMode && this.memberForm.pristine) {
            return of(null);
          }

          this.icCheckPending = true;
          return this.memberService.checkIC(icNo, this.memberId || undefined);
        })
      )
      .subscribe({
        next: (result) => {
          if (result !== null) {
            this.icExists = result.exists;
            this.icCheckPending = false;

            if (this.icExists) {
              this.memberForm.get('ic_no')?.setErrors({ icExists: true });
            }
          }
        },
        error: (error: any) => {
          this.logger.error('Error checking IC:', error);
          this.icCheckPending = false;
        }
      });
  }

  private loadMember(): void {
    if (!this.memberId) return;

    this.loading = true;
    this.memberService.getMemberById(this.memberId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (member: Member) => {
          this.patchFormValues(member);
          this.loading = false;
        },
        error: (error: any) => {
          this.logger.error('Error loading member:', error);
          this.toast.error('Failed to load member');
          this.router.navigate(['/members']);
        }
      });
  }

  private patchFormValues(member: Member): void {
    this.memberForm.patchValue({
      full_name: member.full_name,
      ic_no: member.ic_no || '',
      member_type: member.member_type || 'Principal',
      dob: member.dob || '',
      gender: member.gender === true ? 'Male' : member.gender === false ? 'Female' : 'Unspecified',
      enrollment_date: member.enrollment_date || '',
      termination_date: member.termination_date || '',
      bank_id: member.bank_id?.toString() || '',
      bank_acc_no: member.bank_acc_no || ''
    });

    // Mark form as pristine after patching to avoid triggering IC check
    this.memberForm.markAsPristine();
  }

  onSubmit(): void {
    if (this.memberForm.invalid) {
      this.markFormGroupTouched(this.memberForm);
      this.toast.error('Please fix form errors before submitting');
      return;
    }

    if (this.icExists) {
      this.toast.error('IC number already exists');
      return;
    }

    if (this.isEditMode) {
      this.updateMember();
    } else {
      this.createMember();
    }
  }

  private createMember(): void {
    this.submitting = true;
    const dto: CreateMemberDto = this.prepareCreateDto();

    this.memberService.createMember(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (memberId: string) => {
          this.toast.success('Member created successfully');
          this.submitting = false;
          this.router.navigate(['/members', memberId]);
        },
        error: (error: any) => {
          this.logger.error('Error creating member:', error);
          this.toast.error(error.error?.message || 'Failed to create member');
          this.submitting = false;
        }
      });
  }

  private updateMember(): void {
    if (!this.memberId) return;

    this.submitting = true;
    const dto: UpdateMemberDto = this.prepareUpdateDto();

    this.memberService.updateMember(this.memberId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Member updated successfully');
          this.submitting = false;
          this.router.navigate(['/members', this.memberId]);
        },
        error: (error: any) => {
          this.logger.error('Error updating member:', error);
          this.toast.error(error.error?.message || 'Failed to update member');
          this.submitting = false;
        }
      });
  }

  private prepareCreateDto(): CreateMemberDto {
    const formValue = this.memberForm.value;
    
    return {
      full_name: formValue.full_name,
      ic_no: formValue.ic_no || undefined,
      member_type: formValue.member_type,
      dob: formValue.dob || undefined,
      gender: formValue.gender === 'Male' ? true : formValue.gender === 'Female' ? false : undefined,
      enrollment_date: formValue.enrollment_date,
      termination_date: formValue.termination_date || undefined,
      bank_id: formValue.bank_id ? parseInt(formValue.bank_id) : undefined,
      bank_acc_no: formValue.bank_acc_no || undefined
    };
  }

  private prepareUpdateDto(): UpdateMemberDto {
    const formValue = this.memberForm.value;
    
    return {
      full_name: formValue.full_name,
      ic_no: formValue.ic_no || undefined,
      member_type: formValue.member_type,
      dob: formValue.dob || undefined,
      gender: formValue.gender === 'Male' ? true : formValue.gender === 'Female' ? false : undefined,
      enrollment_date: formValue.enrollment_date,
      termination_date: formValue.termination_date || undefined,
      bank_id: formValue.bank_id ? parseInt(formValue.bank_id) : undefined,
      bank_acc_no: formValue.bank_acc_no || undefined
    };
  }

  onCancel(): void {
    if (this.memberForm.dirty && !confirm('Discard unsaved changes?')) {
      return;
    }

    if (this.isEditMode && this.memberId) {
      this.router.navigate(['/members', this.memberId]);
    } else {
      this.router.navigate(['/members']);
    }
  }

  // Helper method to mark all fields as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.memberForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.memberForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `Maximum ${maxLength} characters allowed`;
    }
    if (field.errors['icExists']) return 'IC number already exists';

    return 'Invalid value';
  }

  // Get today's date in YYYY-MM-DD format for date input max
  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Check if enrollment date is valid (not in future)
  validateEnrollmentDate(): void {
    const enrollmentDate = this.memberForm.get('enrollment_date')?.value;
    if (enrollmentDate) {
      const today = new Date();
      const enrollment = new Date(enrollmentDate);
      
      if (enrollment > today) {
        this.memberForm.get('enrollment_date')?.setErrors({ futureDate: true });
      }
    }
  }

  // Check if termination date is after enrollment date
  validateTerminationDate(): void {
    const enrollmentDate = this.memberForm.get('enrollment_date')?.value;
    const terminationDate = this.memberForm.get('termination_date')?.value;
    
    if (enrollmentDate && terminationDate) {
      const enrollment = new Date(enrollmentDate);
      const termination = new Date(terminationDate);
      
      if (termination < enrollment) {
        this.memberForm.get('termination_date')?.setErrors({ beforeEnrollment: true });
      }
    }
  }

  // Get termination date field error message
  getTerminationDateError(): string {
    const field = this.memberForm.get('termination_date');
    if (!field || !field.errors) return '';

    if (field.errors['beforeEnrollment']) {
      return 'Termination date must be after enrollment date';
    }

    return 'Invalid date';
  }

  // Get enrollment date field error message
  getEnrollmentDateError(): string {
    const field = this.memberForm.get('enrollment_date');
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Enrollment date is required';
    if (field.errors['futureDate']) return 'Enrollment date cannot be in the future';

    return 'Invalid date';
  }
}
