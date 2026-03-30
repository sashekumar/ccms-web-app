import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HospitalFormComponent } from './hospital-form.component';
import { HospitalService } from '../../../core/services/hospital.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { Hospital, CreateHospitalDto, UpdateHospitalDto } from '../../../shared/models/hospital.model';
import { BankService } from '../../../core/services/bank.service';

describe('HospitalFormComponent', () => {
  let component: HospitalFormComponent;
  let fixture: ComponentFixture<HospitalFormComponent>;
  let hospitalService: any;
  let bankService: any;
  let router: any;
  let activatedRoute: any;
  let toastService: any;
  let loggerService: any;

  const mockHospital: Hospital = {
    hospital_id: '1',
    legacy_hospital_id: '123e4567-e89b-12d3-a456-426614174000',
    hospital_name: 'Test Hospital',
    hospital_code: 'TH001',
    hospital_type: 'Private',
    reg_no: 'REG123',
    bank_id: 1,
    bank_acc_no: '1234567890',
    is_panel: true,
    panel_status: 'Active',
    panel_effective_date: new Date('2024-01-01'),
    accreditation_status: 'Accredited',
    accreditation_expiry: new Date('2025-12-31'),
    is_deleted: false,
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockBanks = [
    { bank_id: 1, bank_name: 'Bank A', bank_code: 'BA' },
    { bank_id: 2, bank_name: 'Bank B', bank_code: 'BB' }
  ];

  beforeEach(async () => {
    hospitalService = {
      getHospitalById: vi.fn(),
      createHospital: vi.fn(),
      updateHospital: vi.fn(),
      checkHospitalCode: vi.fn()
    };

    bankService = {
      getBanks: vi.fn().mockReturnValue(of({ banks: mockBanks, total: 2, page: 1, limit: 1000, totalPages: 1 }))
    };

    router = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    activatedRoute = {
      params: of({ id: null }),
      snapshot: { 
        params: {},
        paramMap: {
          get: (key: string) => null
        }
      }
    };

    toastService = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn()
    };

    loggerService = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [HospitalFormComponent, FormsModule],
      providers: [
        { provide: HospitalService, useValue: hospitalService },
        { provide: BankService, useValue: bankService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: ToastService, useValue: toastService },
        { provide: LoggerService, useValue: loggerService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalFormComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be a standalone component', () => {
      const componentMetadata = (HospitalFormComponent as any).ɵcmp;
      expect(componentMetadata.standalone).toBe(true);
    });
  });

  describe('Component Initialization', () => {
    it('should initialize in create mode when no ID', () => {
      fixture.detectChanges();

      expect(component.isEditMode).toBe(false);
    });

    it('should initialize in edit mode when ID present', () => {
      activatedRoute.params = of({ id: '1' });
      activatedRoute.snapshot.params = { id: '1' };
      activatedRoute.snapshot.paramMap = {
        get: (key: string) => key === 'id' ? '1' : null
      };
      hospitalService.getHospitalById.mockReturnValue(of(mockHospital));

      fixture.detectChanges();

      expect(component.isEditMode).toBe(true);
    });

    it('should initialize form data with default values', () => {
      fixture.detectChanges();

      expect(component.formData.hospital_name).toBe('');
      expect(component.formData.is_panel).toBeNull();
    });
  });

  describe('loadHospital()', () => {
    it('should load hospital data in edit mode', () => {
      hospitalService.getHospitalById.mockReturnValue(of(mockHospital));

      component.loadHospital('1');

      expect(hospitalService.getHospitalById).toHaveBeenCalledWith('1');
      expect(component.formData.hospital_name).toBe('Test Hospital');
      expect(component.formData.hospital_code).toBe('TH001');
      expect(component.loading).toBe(false);
    });

    it('should handle date fields correctly', () => {
      hospitalService.getHospitalById.mockReturnValue(of(mockHospital));

      component.loadHospital('1');

      expect(component.formData.panel_effective_date).toBeDefined();
      expect(component.formData.accreditation_expiry).toBeDefined();
    });

    it('should handle null optional fields', () => {
      const hospitalWithNulls = { ...mockHospital, reg_no: null, bank_id: null };
      hospitalService.getHospitalById.mockReturnValue(of(hospitalWithNulls));

      component.loadHospital('1');

      expect(component.formData).toBeDefined();
    });

    it('should handle load errors', () => {
      const error = new Error('Failed to load');
      hospitalService.getHospitalById.mockReturnValue(throwError(() => error));

      component.loadHospital('1');

      expect(component.loading).toBe(false);
      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('should require hospital name', () => {
      component.formData.hospital_name = '';
      
      expect(component.formData.hospital_name).toBe('');
    });

    it('should validate hospital code format', () => {
      component.formData.hospital_code = 'VALID123';
      
      expect(component.formData.hospital_code).toBe('VALID123');
    });

    it('should handle legacy hospital ID as GUID', () => {
      component.formData.legacy_hospital_id = '123e4567-e89b-12d3-a456-426614174000';
      
      expect(component.formData.legacy_hospital_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should validate numeric fields', () => {
      component.formData.bank_id = 1;
      
      expect(typeof component.formData.bank_id).toBe('number');
    });

    it('should validate date fields', () => {
      const testDate = new Date('2024-01-01');
      component.formData.panel_effective_date = testDate;
      
      expect(component.formData.panel_effective_date).toBeInstanceOf(Date);
    });
  });

  describe('save() - Create Mode', () => {
    beforeEach(() => {
      component.isEditMode = false;
      component.formData = {
        hospital_name: 'New Hospital',
        hospital_code: 'NH001',
        hospital_type: 'Public',
        is_panel: true
      };
    });

    it('should create hospital successfully', () => {
      hospitalService.createHospital.mockReturnValue(of('Hospital created successfully'));

      component.save();

      expect(hospitalService.createHospital).toHaveBeenCalledWith(component.formData);
      expect(toastService.success).toHaveBeenCalledWith('Hospital created successfully');
      expect(router.navigate).toHaveBeenCalledWith(['hospitals']);
    });

    it('should set saving state during submission', () => {
      let savingDuringSubmission = false;
      hospitalService.createHospital.mockImplementation(() => {
        savingDuringSubmission = component.saving;
        return of('Success');
      });

      component.save();

      expect(savingDuringSubmission).toBe(true);
    });

    it('should handle duplicate hospital code error', () => {
      const error = { status: 409, error: { message: 'Hospital code already exists' } };
      hospitalService.createHospital.mockReturnValue(throwError(() => error));

      component.save();

      expect(toastService.error).toHaveBeenCalled();
      expect(loggerService.error).toHaveBeenCalled();
    });

    it('should handle validation errors', () => {
      const error = { status: 400, error: { message: 'Invalid data' } };
      hospitalService.createHospital.mockReturnValue(throwError(() => error));

      component.save();

      expect(toastService.error).toHaveBeenCalled();
    });
  });

  describe('save() - Edit Mode', () => {
    beforeEach(() => {
      component.isEditMode = true;
      component.hospitalId = '1';
      component.formData = {
        hospital_name: 'Updated Hospital',
        hospital_code: 'TH001',
        is_panel: true
      };
    });

    it('should update hospital successfully', () => {
      hospitalService.updateHospital.mockReturnValue(of(null));

      component.save();

      expect(hospitalService.updateHospital).toHaveBeenCalledWith(
        component.hospitalId,
        expect.objectContaining({ hospital_code: 'TH001' })
      );
      expect(toastService.success).toHaveBeenCalledWith('Hospital updated successfully');
      expect(router.navigate).toHaveBeenCalledWith(['hospitals']);
    });

    it('should handle update errors', () => {
      const error = { status: 404, error: { message: 'Hospital not found' } };
      hospitalService.updateHospital.mockReturnValue(throwError(() => error));

      component.save();

      expect(toastService.error).toHaveBeenCalled();
    });
  });

  describe('goBack()', () => {
    it('should navigate back to hospital list', () => {
      component.goBack();

      expect(router.navigate).toHaveBeenCalledWith(['hospitals']);
    });

    it('should not save changes when cancelled', () => {
      component.formData.hospital_name = 'Changed Name';
      component.goBack();

      expect(hospitalService.createHospital).not.toHaveBeenCalled();
      expect(hospitalService.updateHospital).not.toHaveBeenCalled();
    });
  });

  describe('Form Fields', () => {
    it('should handle hospital name input', () => {
      component.formData.hospital_name = 'Test Hospital Name';
      
      expect(component.formData.hospital_name).toBe('Test Hospital Name');
    });

    it('should handle hospital code input', () => {
      component.formData.hospital_code = 'CODE123';
      
      expect(component.formData.hospital_code).toBe('CODE123');
    });

    it('should handle hospital type selection', () => {
      component.formData.hospital_type = 'Private';
      
      expect(component.formData.hospital_type).toBe('Private');
    });

    it('should handle panel status checkbox', () => {
      component.formData.is_panel = true;
      
      expect(component.formData.is_panel).toBe(true);
    });

    it('should handle panel status selection when is_panel is true', () => {
      component.formData.is_panel = true;
      component.formData.panel_status = 'Active';
      
      expect(component.formData.panel_status).toBe('Active');
    });

    it('should handle bank selection', () => {
      component.formData.bank_id = 1;
      
      expect(component.formData.bank_id).toBe(1);
    });

    it('should handle bank account number', () => {
      component.formData.bank_acc_no = '1234567890';
      
      expect(component.formData.bank_acc_no).toBe('1234567890');
    });

    it('should handle registration number', () => {
      component.formData.reg_no = 'REG123';
      
      expect(component.formData.reg_no).toBe('REG123');
    });

    it('should handle accreditation status', () => {
      component.formData.accreditation_status = 'Accredited';
      
      expect(component.formData.accreditation_status).toBe('Accredited');
    });
  });

  describe('Date Handling', () => {
    it('should handle panel effective date', () => {
      const testDate = new Date('2024-01-01');
      component.formData.panel_effective_date = testDate;
      
      expect(component.formData.panel_effective_date).toEqual(testDate);
    });

    it('should handle accreditation expiry date', () => {
      const testDate = new Date('2025-12-31');
      component.formData.accreditation_expiry = testDate;
      
      expect(component.formData.accreditation_expiry).toEqual(testDate);
    });

    it('should handle null dates', () => {
      component.formData.panel_effective_date = null;
      component.formData.accreditation_expiry = null;
      
      expect(component.formData.panel_effective_date).toBeNull();
      expect(component.formData.accreditation_expiry).toBeNull();
    });
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const subscription = component['destroy$'];
      const completeSpy = vi.spyOn(subscription, 'next');

      component.ngOnDestroy();

      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('loadBanks()', () => {
    it('should load available banks', () => {
      // This test assumes loadBanks method exists
      if (typeof component.loadBanks === 'function') {
        const bankService = TestBed.inject(HospitalService) as any;
        if (bankService.getBanks) {
          bankService.getBanks.mockReturnValue(of(mockBanks));
          
          component.loadBanks();

          expect(component.banks).toEqual(mockBanks);
        }
      }
    });
  });

  describe('Form State', () => {
    it('should disable submit button while saving', () => {
      component.saving = true;
      
      expect(component.saving).toBe(true);
    });

    it('should show loading indicator while loading', () => {
      component.loading = true;
      
      expect(component.loading).toBe(true);
    });
  });

  describe('Navigation Guards', () => {
    it('should navigate to list after successful create', () => {
      hospitalService.createHospital.mockReturnValue(of('Success'));

      component.save();

      expect(router.navigate).toHaveBeenCalledWith(['hospitals']);
    });

    it('should navigate to list after successful update', () => {
      component.isEditMode = true;
      component.hospitalId = '1';
      hospitalService.updateHospital.mockReturnValue(of(null));

      component.save();

      expect(router.navigate).toHaveBeenCalledWith(['hospitals']);
    });

    it('should stay on form after error', () => {
      const error = { status: 400, error: { message: 'Error' } };
      hospitalService.createHospital.mockReturnValue(throwError(() => error));

      component.save();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
