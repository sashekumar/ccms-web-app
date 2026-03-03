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
      expect(component.memberForm.value.member_type).toBe('Principal');
      expect(component.memberForm.value.gender).toBe('Unspecified');
    });

    it('should validate required fields', () => {
      const form = component.memberForm;
      expect(form.valid).toBe(false);

      form.patchValue({
        full_name: 'Test User',
        enrollment_date: '2024-01-01'
      });

      expect(form.valid).toBe(true);
    });

    it('should create member on submit', () => {
      component.memberForm.patchValue({
        full_name: 'Test User',
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
});
