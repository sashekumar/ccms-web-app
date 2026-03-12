import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MemberFormComponent } from './member-form.component';
import { MemberService } from '../../../core/services/member.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { Member } from '../../../shared/models/member.model';

describe('MemberFormComponent', () => {
  let component: MemberFormComponent;
  let fixture: ComponentFixture<MemberFormComponent>;
  let mockMemberService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockLogger: any;
  let mockToast: any;

  const mockMember: Member = {
    member_id: '1',
    full_name: 'John Doe',
    ic_no: '900101011234',
    member_type: 'Principal',
    enrollment_date: '2024-01-01',
    is_deleted: false
  };

  beforeEach(async () => {
    mockMemberService = {
      getMemberById: vi.fn().mockReturnValue(of(mockMember)),
      createMember: vi.fn().mockReturnValue(of('123')),
      updateMember: vi.fn().mockReturnValue(of(void 0)),
      checkIC: vi.fn().mockReturnValue(of({ exists: false, message: '' }))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(null)
        }
      }
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn()
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MemberFormComponent, ReactiveFormsModule],
      providers: [
        { provide: MemberService, useValue: mockMemberService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: LoggerService, useValue: mockLogger },
        { provide: ToastService, useValue: mockToast }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MemberFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(null);
      fixture.detectChanges();
    });

    it('should initialize in create mode', () => {
      expect(component.isEditMode).toBe(false);
      expect(component.memberId).toBeNull();
    });

    it('should have empty form with default values', () => {
      expect(component.memberForm.value.full_name).toBe('');
      expect(component.memberForm.value.member_type).toBe('');
      expect(component.memberForm.value.gender).toBe('');
    });

    it('should validate required fields', () => {
      const form = component.memberForm;
      expect(form.valid).toBe(false);

      form.patchValue({
        full_name: 'Test User',
        member_type: 'Principal',
        enrollment_date: '2024-01-01'
      });

      expect(form.valid).toBe(true);
    });

    it('should create member on submit', () => {
      component.memberForm.patchValue({
        full_name: 'Test User',
        member_type: 'Principal',
        enrollment_date: '2024-01-01'
      });

      component.onSubmit();

      expect(mockMemberService.createMember).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('Member created successfully');
    });

    it('should check IC exists on input', async () => {
      component.memberForm.patchValue({
        ic_no: '900101011234'
      });

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));
      expect(mockMemberService.checkIC).toHaveBeenCalledWith('900101011234', undefined);
    });

    it('should show error if IC exists', async () => {
      mockMemberService.checkIC.mockReturnValue(of({ exists: true, message: 'IC exists' }));
      
      component.memberForm.patchValue({
        ic_no: '900101011234'
      });

      await new Promise(resolve => setTimeout(resolve, 600));
      expect(component.icExists).toBe(true);
      expect(component.memberForm.get('ic_no')?.hasError('icExists')).toBe(true);
    });

    it('should navigate to list on cancel', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      component.memberForm.markAsDirty();
      component.onCancel();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members']);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('1');
      fixture.detectChanges();
    });

    it('should initialize in edit mode', () => {
      expect(component.isEditMode).toBe(true);
      expect(component.memberId).toBe('1');
    });

    it('should load member data', () => {
      expect(mockMemberService.getMemberById).toHaveBeenCalledWith('1');
      expect(component.memberForm.value.full_name).toBe('John Doe');
      expect(component.memberForm.value.ic_no).toBe('900101011234');
    });

    it('should update member on submit', () => {
      component.memberForm.patchValue({
        full_name: 'John Updated'
      });

      component.onSubmit();

      expect(mockMemberService.updateMember).toHaveBeenCalledWith('1', expect.any(Object));
      expect(mockToast.success).toHaveBeenCalledWith('Member updated successfully');
    });

    it('should navigate to member detail on cancel', () => {
      component.onCancel();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members', '1']);
    });

    it('should handle load error', () => {
      mockMemberService.getMemberById.mockReturnValue(throwError(() => new Error('Load failed')));
      
      component.ngOnInit();

      expect(mockToast.error).toHaveBeenCalledWith('Failed to load member');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members']);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate enrollment date not in future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      component.memberForm.patchValue({
        enrollment_date: futureDate.toISOString().split('T')[0]
      });

      component.validateEnrollmentDate();

      expect(component.memberForm.get('enrollment_date')?.hasError('futureDate')).toBe(true);
    });

    it('should validate termination date after enrollment date', () => {
      component.memberForm.patchValue({
        enrollment_date: '2024-02-01',
        termination_date: '2024-01-01'
      });

      component.validateTerminationDate();

      expect(component.memberForm.get('termination_date')?.hasError('beforeEnrollment')).toBe(true);
    });

    it('should validate max length', () => {
      const longString = 'a'.repeat(101);
      
      component.memberForm.patchValue({
        full_name: longString
      });

      expect(component.memberForm.get('full_name')?.hasError('maxlength')).toBe(true);
    });

    it('should show field errors', () => {
      component.memberForm.get('full_name')?.markAsTouched();
      component.memberForm.get('full_name')?.setErrors({ required: true });

      expect(component.isFieldInvalid('full_name')).toBe(true);
      expect(component.getFieldError('full_name')).toBe('This field is required');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      vi.spyOn(component['destroy$'], 'next');
      vi.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

it('should reset loading state after loading member', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('1');
      mockMemberService.getMemberById.mockReturnValue(of(mockMember));

      component.ngOnInit();

      expect(component.loading).toBe(false);
    });

    it('should reset submitting state after create', () => {
      component.memberForm.patchValue({
        full_name: 'Test User',
        enrollment_date: '2024-01-01'
      });

      mockMemberService.createMember.mockReturnValue(of('123'));

      component.onSubmit();

      expect(component.submitting).toBe(false);
    });

    it('should reset submitting state after update', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('1');
      component.ngOnInit();

      component.memberForm.patchValue({
        full_name: 'Updated Name'
      });

      mockMemberService.updateMember.mockReturnValue(of(void 0));

      component.onSubmit();

      expect(component.submitting).toBe(false);
    });

    it('should clear submitting on create error', () => {
      component.memberForm.patchValue({
        full_name: 'Test User',
        enrollment_date: '2024-01-01'
      });

      mockMemberService.createMember.mockReturnValue(
        throwError(() => new Error('Create failed'))
      );

      component.onSubmit();

      expect(component.submitting).toBe(false);
    });

    it('should clear submitting on update error', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('1');
      component.ngOnInit();

      mockMemberService.updateMember.mockReturnValue(
        throwError(() => new Error('Update failed'))
      );

      component.onSubmit();

      expect(component.submitting).toBe(false);
    });

    it('should show IC check pending state', async () => {
      component.memberForm.patchValue({
        ic_no: '900101011234'
      });

      // Immediately after typing, should be pending
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Wait for IC check to complete
      await new Promise(resolve => setTimeout(resolve, 600));
      expect(component.icCheckPending).toBe(false);
    });
  });

  describe('Form Validation Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle empty IC number', async () => {
      component.memberForm.patchValue({
        ic_no: ''
      });

      await new Promise(resolve => setTimeout(resolve, 600));

      expect(mockMemberService.checkIC).not.toHaveBeenCalled();
      expect(component.icExists).toBe(false);
    });

    it('should handle IC number with only whitespace', async () => {
      component.memberForm.patchValue({
        ic_no: '   '
      });

      await new Promise(resolve => setTimeout(resolve, 600));

      expect(mockMemberService.checkIC).not.toHaveBeenCalled();
      expect(component.icExists).toBe(false);
    });

    it('should validate bank account number max length', () => {
      const longBankAccNo = 'a'.repeat(51);
      
      component.memberForm.patchValue({
        bank_acc_no: longBankAccNo
      });

      expect(component.memberForm.get('bank_acc_no')?.hasError('maxlength')).toBe(true);
    });

    it('should validate IC number max length', () => {
      const longICNo = 'a'.repeat(51);
      
      component.memberForm.patchValue({
        ic_no: longICNo
      });

      expect(component.memberForm.get('ic_no')?.hasError('maxlength')).toBe(true);
    });

    it('should allow valid enrollment date (today)', () => {
      const today = new Date().toISOString().split('T')[0];
      
      component.memberForm.patchValue({
        enrollment_date: today
      });

      component.validateEnrollmentDate();

      expect(component.memberForm.get('enrollment_date')?.hasError('futureDate')).toBeFalsy();
    });

    it('should allow termination date same as enrollment date', () => {
      component.memberForm.patchValue({
        enrollment_date: '2024-01-01',
        termination_date: '2024-01-01'
      });

      component.validateTerminationDate();

      expect(component.memberForm.get('termination_date')?.hasError('beforeEnrollment')).toBeFalsy();
    });

    it('should validate termination date is after enrollment date', () => {
      component.memberForm.patchValue({
        enrollment_date: '2024-02-01',
        termination_date: '2024-01-15'
      });

      component.validateTerminationDate();
      expect(component.memberForm.get('termination_date')?.hasError('beforeEnrollment')).toBe(true);
    });

    it('should validate termination date error message', () => {
      component.memberForm.get('termination_date')?.setErrors({ beforeEnrollment: true });

      expect(component.getTerminationDateError()).toBe('Termination date must be after enrollment date');
    });

    it('should validate enrollment date error messages', () => {
      component.memberForm.get('enrollment_date')?.setErrors({ required: true });
      expect(component.getEnrollmentDateError()).toBe('Enrollment date is required');

      component.memberForm.get('enrollment_date')?.setErrors({ futureDate: true });
      expect(component.getEnrollmentDateError()).toBe('Enrollment date cannot be in the future');
    });

    it('should return empty string for valid fields', () => {
      component.memberForm.patchValue({
        full_name: 'Test User',
        enrollment_date: '2024-01-01'
      });
      component.memberForm.markAllAsTouched();
      
      expect(component.getFieldError('full_name')).toBe('');
      expect(component.getTerminationDateError()).toBe('');
      expect(component.getEnrollmentDateError()).toBe('');
    });

    it('should return "Invalid value" for unknown error', () => {
      component.memberForm.get('full_name')?.setErrors({ customError: true });

      expect(component.getFieldError('full_name')).toBe('Invalid value');
    });
  });

  describe('Error Handling Scenarios', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle create error with custom message', () => {
      component.memberForm.patchValue({
        full_name: 'Test User',
        member_type: 'Principal',
        enrollment_date: '2024-01-01'
      });

      const error = { error: { message: 'Custom error message' } };
      mockMemberService.createMember.mockReturnValue(throwError(() => error));

      component.onSubmit();

      expect(mockToast.error).toHaveBeenCalledWith('Custom error message');
    });

    it('should handle update error with custom message', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('1');
      component.ngOnInit();

      const error = { error: { message: 'Custom update error' } };
      mockMemberService.updateMember.mockReturnValue(throwError(() => error));

      component.onSubmit();

      expect(mockToast.error).toHaveBeenCalledWith('Custom update error');
    });

    it('should handle IC check network error', async () => {
      mockMemberService.checkIC.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      component.memberForm.patchValue({
        ic_no: '900101011234'
      });

      await new Promise(resolve => setTimeout(resolve, 600));

      expect(mockLogger.error).toHaveBeenCalledWith('Error checking IC:', expect.any(Error));
      expect(component.icCheckPending).toBe(false);
    });

    it('should handle generic create error', () => {
      component.memberForm.patchValue({
        full_name: 'Test User',
        member_type: 'Principal',
        enrollment_date: '2024-01-01'
      });

      mockMemberService.createMember.mockReturnValue(
        throwError(() => new Error('Unknown error'))
      );

      component.onSubmit();

      expect(mockToast.error).toHaveBeenCalledWith('Failed to create member');
    });

    it('should handle generic update error', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('1');
      component.ngOnInit();

      mockMemberService.updateMember.mockReturnValue(
        throwError(() => new Error('Unknown error'))
      );

      component.onSubmit();

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update member');
    });
  });

  describe('Submit Button States', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not submit with invalid form', () => {
      component.memberForm.patchValue({
        full_name: ''
      });

      component.onSubmit();

      expect(mockMemberService.createMember).not.toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith('Please fix form errors before submitting');
    });

    it('should mark all fields as touched on invalid submit', () => {
      component.memberForm.patchValue({
        full_name: ''
      });

      component.onSubmit();

      expect(component.memberForm.get('full_name')?.touched).toBe(true);
      expect(component.memberForm.get('enrollment_date')?.touched).toBe(true);
    });

    it('should not submit when IC exists', () => {
      component.memberForm.patchValue({
        full_name: 'Test User',
        member_type: 'Principal',
        enrollment_date: '2024-01-01'
      });

      component.icExists = true;

      component.onSubmit();

      expect(mockMemberService.createMember).not.toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith('IC number already exists');
    });

    it('should handle multiple submits (component does not prevent)', () => {
      component.memberForm.patchValue({
        full_name: 'Test User',
        member_type: 'Principal',
        enrollment_date: '2024-01-01'
      });

      mockMemberService.createMember.mockReturnValue(of('123'));

      component.onSubmit();
      
      // Component allows multiple submits as there's no guard in onSubmit
      expect(mockMemberService.createMember).toHaveBeenCalled();
    });
  });

  describe('Field Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle gender selection changes', () => {
      component.memberForm.patchValue({ gender: 'Male' });
      expect(component.memberForm.value.gender).toBe('Male');

      component.memberForm.patchValue({ gender: 'Female' });
      expect(component.memberForm.value.gender).toBe('Female');

      component.memberForm.patchValue({ gender: 'Unspecified' });
      expect(component.memberForm.value.gender).toBe('Unspecified');
    });

    it('should handle member type changes', () => {
      component.memberForm.patchValue({ member_type: 'Dependent' });
      expect(component.memberForm.value.member_type).toBe('Dependent');

      component.memberForm.patchValue({ member_type: 'Other' });
      expect(component.memberForm.value.member_type).toBe('Other');
    });

    it('should handle bank ID field with numeric strings', () => {
      component.memberForm.patchValue({ bank_id: '123' });
      expect(component.memberForm.value.bank_id).toBe('123');
    });

    it('should handle clearing optional fields', () => {
      component.memberForm.patchValue({
        ic_no: '900101011234',
        dob: '1990-01-01',
        termination_date: '2024-12-31',
        bank_acc_no: '1234567890'
      });

      component.memberForm.patchValue({
        ic_no: '',
        dob: '',
        termination_date: '',
        bank_acc_no: ''
      });

      expect(component.memberForm.value.ic_no).toBe('');
      expect(component.memberForm.value.dob).toBe('');
      expect(component.memberForm.value.termination_date).toBe('');
      expect(component.memberForm.value.bank_acc_no).toBe('');
    });

    it('should get today date in correct format', () => {
      const today = component.todayDate;
      const expectedFormat = /^\d{4}-\d{2}-\d{2}$/;
      
      expect(today).toMatch(expectedFormat);
    });
  });

  describe('Form DTO Preparation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prepare create DTO with all fields', () => {
      component.memberForm.patchValue({
        full_name: 'John Doe',
        ic_no: '900101011234',
        member_type: 'Principal',
        dob: '1990-01-01',
        gender: 'Male',
        enrollment_date: '2024-01-01',
        termination_date: '2024-12-31',
        bank_id: '5',
        bank_acc_no: '1234567890'
      });

      component.onSubmit();

      expect(mockMemberService.createMember).toHaveBeenCalledWith({
        full_name: 'John Doe',
        ic_no: '900101011234',
        member_type: 'Principal',
        dob: '1990-01-01',
        gender: true,
        enrollment_date: '2024-01-01',
        termination_date: '2024-12-31',
        bank_id: 5,
        bank_acc_no: '1234567890'
      });
    });

    it('should prepare create DTO with minimal fields', () => {
      component.memberForm.patchValue({
        full_name: 'Jane Doe',
        member_type: 'Principal',
        gender: 'Unspecified',
        enrollment_date: '2024-01-01'
      });

      component.onSubmit();

      expect(mockMemberService.createMember).toHaveBeenCalledWith({
        full_name: 'Jane Doe',
        ic_no: undefined,
        member_type: 'Principal',
        dob: undefined,
        gender: undefined,
        enrollment_date: '2024-01-01',
        termination_date: undefined,
        bank_id: undefined,
        bank_acc_no: undefined
      });
    });

    it('should prepare update DTO with all fields', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('1');
      component.ngOnInit();

      component.memberForm.patchValue({
        full_name: 'John Updated',
        ic_no: '900101011234',
        gender: 'Female'
      });

      component.onSubmit();

      expect(mockMemberService.updateMember).toHaveBeenCalledWith('1', expect.objectContaining({
        full_name: 'John Updated',
        ic_no: '900101011234',
        gender: false
      }));
    });

    it('should convert Male gender to true', () => {
      component.memberForm.patchValue({
        full_name: 'Test',
        member_type: 'Principal',
        gender: 'Male',
        enrollment_date: '2024-01-01'
      });

      component.onSubmit();

      expect(mockMemberService.createMember).toHaveBeenCalledWith(
        expect.objectContaining({ gender: true })
      );
    });

    it('should convert Female gender to false', () => {
      component.memberForm.patchValue({
        full_name: 'Test',
        member_type: 'Principal',
        gender: 'Female',
        enrollment_date: '2024-01-01'
      });

      component.onSubmit();

      expect(mockMemberService.createMember).toHaveBeenCalledWith(
        expect.objectContaining({ gender: false })
      );
    });

    it('should convert Unspecified gender to undefined', () => {
      component.memberForm.patchValue({
        full_name: 'Test',
        member_type: 'Principal',
        gender: 'Unspecified',
        enrollment_date: '2024-01-01'
      });

      component.onSubmit();

      expect(mockMemberService.createMember).toHaveBeenCalledWith(
        expect.objectContaining({ gender: undefined })
      );
    });

    it('should parse bank_id as integer', () => {
      component.memberForm.patchValue({
        full_name: 'Test',
        member_type: 'Principal',
        enrollment_date: '2024-01-01',
        bank_id: '42'
      });

      component.onSubmit();

      expect(mockMemberService.createMember).toHaveBeenCalledWith(
        expect.objectContaining({ bank_id: 42 })
      );
    });
  });

  describe('Navigation Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate without prompt if form is pristine', () => {
      component.onCancel();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members']);
    });

    it('should not navigate if user cancels confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      component.memberForm.markAsDirty();
      component.onCancel();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to list on cancel in create mode', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      component.isEditMode = false;
      component.memberForm.markAsDirty();
      component.onCancel();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members']);
    });

    it('should navigate to detail after successful create', () => {
      component.memberForm.patchValue({
        full_name: 'Test',
        member_type: 'Principal',
        enrollment_date: '2024-01-01'
      });

      mockMemberService.createMember.mockReturnValue(of('new-id-123'));

      component.onSubmit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members', 'new-id-123']);
    });

    it('should navigate to detail after successful update', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('1');
      component.ngOnInit();

      component.onSubmit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members', '1']);
    });
  });

  describe('IC Validation Advanced', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not check IC in edit mode with pristine form', async () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('1');
      
      component.ngOnInit();
      
      // Wait for any pending checks
      await new Promise(resolve => setTimeout(resolve, 600));

      // Reset the call count after initial load
      mockMemberService.checkIC.mockClear();

      // IC is loaded but form is pristine, should not check again
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(mockMemberService.checkIC).not.toHaveBeenCalled();
    });

    it('should clear IC errors when IC is removed', async () => {
      component.memberForm.patchValue({
        ic_no: '900101011234'
      });

      await new Promise(resolve => setTimeout(resolve, 600));

      // Now clear the IC
      component.memberForm.patchValue({
        ic_no: ''
      });

      await new Promise(resolve => setTimeout(resolve, 600));

      expect(component.icExists).toBe(false);
    });

    it('should handle rapid IC typing with debounce', async () => {
      // Type rapidly
      component.memberForm.patchValue({ ic_no: '9' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      component.memberForm.patchValue({ ic_no: '90' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      component.memberForm.patchValue({ ic_no: '900' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      component.memberForm.patchValue({ ic_no: '900101011234' });
      
      // Should not have checked yet
      expect(mockMemberService.checkIC).not.toHaveBeenCalled();

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should only check once with the final value
      expect(mockMemberService.checkIC).toHaveBeenCalledTimes(1);
      expect(mockMemberService.checkIC).toHaveBeenCalledWith('900101011234', undefined);
    });
  });

  describe('Gender Conversion in Patching', () => {
    beforeEach(() => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('1');
      fixture.detectChanges();
    });

    it('should convert true to Male when patching form', () => {
      const memberWithMaleGender = { ...mockMember, gender: true };
      mockMemberService.getMemberById.mockReturnValue(of(memberWithMaleGender));

      component.ngOnInit();

      expect(component.memberForm.value.gender).toBe('Male');
    });

    it('should convert false to Female when patching form', () => {
      const memberWithFemaleGender = { ...mockMember, gender: false };
      mockMemberService.getMemberById.mockReturnValue(of(memberWithFemaleGender));

      component.ngOnInit();

      expect(component.memberForm.value.gender).toBe('Female');
    });

    it('should convert undefined/null to empty string when patching form', () => {
      const memberWithNoGender = { ...mockMember, gender: undefined };
      mockMemberService.getMemberById.mockReturnValue(of(memberWithNoGender));

      component.ngOnInit();

      expect(component.memberForm.value.gender).toBe('');
    });
  });
});
