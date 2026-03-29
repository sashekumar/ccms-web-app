import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { HospitalService } from './hospital.service';
import { ApiService } from './api.service';
import { 
  Hospital, 
  CreateHospitalDto, 
  UpdateHospitalDto,
  HospitalFilters,
  PaginatedHospitals,
  HospitalAddress,
  HospitalCode,
  HospitalStaff,
  HospitalStaffContact,
  FeeSchedule
} from '../../shared/models/hospital.model';

describe('HospitalService', () => {
  let service: HospitalService;
  let apiService: any;

  const mockResponse = <T>(data: T) => ({ success: true, data });

  beforeEach(() => {
    apiService = {
      post: vi.fn(),
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        HospitalService,
        { provide: ApiService, useValue: apiService }
      ]
    });

    service = TestBed.inject(HospitalService);
  });

  describe('Core Hospital Operations', () => {
    it('should get hospitals list', () => {
      const mockPaginated: PaginatedHospitals = {
        hospitals: [{
          hospital_id: '1',
          hospital_name: 'Test Hospital',
          hospital_code: 'TH001',
          hospital_type: 'Private',
          is_panel: true,
          panel_status: 'Active',
          is_deleted: false
        }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        stats: {
          total: 1,
          panel: 1,
          nonPanel: 0,
          active: 1,
          inactive: 0
        }
      };
      apiService.post.mockReturnValue(of(mockResponse(mockPaginated)));

      service.getHospitals().subscribe(result => {
        expect(result).toEqual(mockPaginated);
      });
    });

    it('should get hospital by ID', () => {
      const mockHospital: Partial<Hospital> = {
        hospital_id: '1',
        hospital_name: 'Test Hospital',
        hospital_code: 'TH001',
        hospital_type: 'Private',
        is_panel: true
      };
      apiService.post.mockReturnValue(of(mockResponse(mockHospital)));

      service.getHospitalById('1').subscribe(result => {
        expect(result).toEqual(mockHospital);
        expect(apiService.post).toHaveBeenCalledWith(
          expect.any(String),
          { hospital_id: '1' }
        );
      });
    });

    it('should create hospital', () => {
      const dto: CreateHospitalDto = {
        hospital_name: 'New Hospital',
        hospital_code: 'NH001'
      };
      apiService.post.mockReturnValue(of(mockResponse({ hospital_id: '123' })));

      service.createHospital(dto).subscribe(result => {
        expect(result).toBe('123');
        expect(apiService.post).toHaveBeenCalledWith(expect.any(String), dto);
      });
    });

    it('should update hospital', () => {
      const dto: UpdateHospitalDto = {
        hospital_name: 'Updated Hospital'
      };
      apiService.put.mockReturnValue(of(mockResponse(undefined)));

      service.updateHospital('1', dto).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          expect.any(String),
          { hospital_id: '1', ...dto }
        );
      });
    });

    it('should delete hospital', () => {
      apiService.post.mockReturnValue(of(mockResponse(undefined)));

      service.deleteHospital('1').subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          expect.any(String),
          { hospital_id: '1' }
        );
      });
    });

    it('should check hospital code availability', () => {
      apiService.post.mockReturnValue(of(mockResponse({ available: true })));

      service.checkHospitalCode('TH001').subscribe(result => {
        expect(result).toBe(true);
      });
    });
  });

  describe('Address Operations', () => {
    it('should get hospital addresses', () => {
      const mockAddresses: Partial<HospitalAddress>[] = [{
        address_id: '1',
        hospital_id: '1',
        address_type: 'PRIMARY',
        street_line1: '123 Main St',
        is_primary: true
      }];
      apiService.post.mockReturnValue(of(mockResponse(mockAddresses)));

      service.getHospitalAddresses('1').subscribe(result => {
        expect(result).toEqual(mockAddresses);
      });
    });

    it('should create hospital address', () => {
      const dto: Partial<HospitalAddress> = {
        street_line1: '456 Side St',
        city: 'Test City'
      };
      apiService.post.mockReturnValue(of(mockResponse({ address_id: '2' })));

      service.createHospitalAddress('1', dto).subscribe(result => {
        expect(result).toBe('2');
      });
    });

    it('should update hospital address', () => {
      const dto: Partial<HospitalAddress> = {
        street_line1: 'Updated St'
      };
      apiService.put.mockReturnValue(of(mockResponse(undefined)));

      service.updateHospitalAddress('1', '2', dto).subscribe(() => {
        expect(apiService.put).toHaveBeenCalled();
      });
    });

    it('should delete hospital address', () => {
      apiService.delete.mockReturnValue(of(mockResponse(undefined)));

      service.deleteHospitalAddress('1', '2').subscribe(() => {
        expect(apiService.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Code Operations', () => {
    it('should get hospital codes', () => {
      const mockCodes: Partial<HospitalCode>[] = [{
        code_id: '1',
        hospital_id: '1',
        code_type: 'INSURER_CODE',
        code_value: 'INS123',
        is_active: true
      }];
      apiService.post.mockReturnValue(of(mockResponse(mockCodes)));

      service.getHospitalCodes('1').subscribe(result => {
        expect(result).toEqual(mockCodes);
      });
    });

    it('should create hospital code', () => {
      const dto: Partial<HospitalCode> = {
        code_type: 'INSURER_CODE',
        code_value: 'INS456'
      };
      apiService.post.mockReturnValue(of(mockResponse({ code_id: '2' })));

      service.createHospitalCode('1', dto).subscribe(result => {
        expect(result).toBe('2');
      });
    });

    it('should update hospital code', () => {
      const dto: Partial<HospitalCode> = {
        code_value: 'INS789'
      };
      apiService.put.mockReturnValue(of(mockResponse(undefined)));

      service.updateHospitalCode('1', '2', dto).subscribe(() => {
        expect(apiService.put).toHaveBeenCalled();
      });
    });

    it('should delete hospital code', () => {
      apiService.delete.mockReturnValue(of(mockResponse(undefined)));

      service.deleteHospitalCode('1', '2').subscribe(() => {
        expect(apiService.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Staff Operations', () => {
    it('should get hospital staff', () => {
      const mockStaff: Partial<HospitalStaff>[] = [{
        staff_id: '1',
        hospital_id: '1',
        staff_name: 'Dr. Smith',
        staff_type: 'Doctor',
        specialty: 'Cardiology',
        is_active: true
      }];
      apiService.post.mockReturnValue(of(mockResponse(mockStaff)));

      service.getHospitalStaff('1').subscribe(result => {
        expect(result).toEqual(mockStaff);
      });
    });

    it('should create hospital staff', () => {
      const dto: Partial<HospitalStaff> = {
        staff_name: 'Dr. New',
        staff_type: 'Doctor'
      };
      apiService.post.mockReturnValue(of(mockResponse({ staff_id: '2' })));

      service.createHospitalStaff('1', dto).subscribe(result => {
        expect(result).toBe('2');
      });
    });

    it('should update hospital staff', () => {
      const dto: Partial<HospitalStaff> = {
        staff_name: 'Dr. Updated'
      };
      apiService.put.mockReturnValue(of(mockResponse(undefined)));

      service.updateHospitalStaff('1', '2', dto).subscribe(() => {
        expect(apiService.put).toHaveBeenCalled();
      });
    });

    it('should delete hospital staff', () => {
      apiService.delete.mockReturnValue(of(mockResponse(undefined)));

      service.deleteHospitalStaff('1', '2').subscribe(() => {
        expect(apiService.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Staff Contact Operations', () => {
    it('should get staff contacts', () => {
      const mockContacts: Partial<HospitalStaffContact>[] = [{
        contact_id: '1',
        staff_id: '1',
        contact_type: 'EMAIL',
        contact_value: 'doctor@test.com',
        is_primary: false
      }];
      apiService.post.mockReturnValue(of(mockResponse(mockContacts)));

      service.getStaffContacts('1', '1').subscribe(result => {
        expect(result).toEqual(mockContacts);
      });
    });

    it('should create staff contact', () => {
      const dto: Partial<HospitalStaffContact> = {
        contact_type: 'EMAIL',
        contact_value: 'new@test.com'
      };
      apiService.post.mockReturnValue(of(mockResponse('2')));

      service.createStaffContact('1', '1', dto).subscribe(result => {
        expect(result).toBe('2');
      });
    });

    it('should update staff contact', () => {
      const dto: Partial<HospitalStaffContact> = {
        contact_value: 'updated@test.com'
      };
      apiService.put.mockReturnValue(of(mockResponse(undefined)));

      service.updateStaffContact('1', '1', '2', dto).subscribe(() => {
        expect(apiService.put).toHaveBeenCalled();
      });
    });

    it('should delete staff contact', () => {
      apiService.delete.mockReturnValue(of(mockResponse(undefined)));

      service.deleteStaffContact('1', '1', '2').subscribe(() => {
        expect(apiService.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Fee Operations', () => {
    it('should get hospital fees', () => {
      const mockFees: Partial<FeeSchedule>[] = [{
        fee_id: '1',
        hospital_id: '1',
        fee_type: 'TPA',
        item_code: 'CONSULT',
        description: 'Consultation',
        amount: 50.00,
        is_active: true
      }];
      apiService.post.mockReturnValue(of(mockResponse(mockFees)));

      service.getHospitalFees('1').subscribe(result => {
        expect(result).toEqual(mockFees);
      });
    });

    it('should create hospital fee', () => {
      const dto: Partial<FeeSchedule> = {
        fee_type: 'TPA',
        item_code: 'XRAY',
        amount: 100.00
      };
      apiService.post.mockReturnValue(of(mockResponse('2')));

      service.createHospitalFee('1', dto).subscribe(result => {
        expect(result).toBe('2');
      });
    });

    it('should update hospital fee', () => {
      const dto: Partial<FeeSchedule> = {
        amount: 150.00
      };
      apiService.put.mockReturnValue(of(mockResponse(undefined)));

      service.updateHospitalFee('1', '2', dto).subscribe(() => {
        expect(apiService.put).toHaveBeenCalled();
      });
    });

    it('should delete hospital fee', () => {
      apiService.delete.mockReturnValue(of(mockResponse(undefined)));

      service.deleteHospitalFee('1', '2').subscribe(() => {
        expect(apiService.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when getting hospitals', () => {
      const error = new Error('Network error');
      apiService.post.mockReturnValue(throwError(() => error));

      service.getHospitals().subscribe({
        error: (err) => {
          expect(err).toBe(error);
        }
      });
    });

    it('should handle errors when creating hospital', () => {
      const error = new Error('Validation error');
      apiService.post.mockReturnValue(throwError(() => error));

      service.createHospital({ hospital_name: 'Test', hospital_code: 'T001' }).subscribe({
        error: (err) => {
          expect(err).toBe(error);
        }
      });
    });

    it('should handle errors when updating hospital', () => {
      const error = new Error('Update failed');
      apiService.put.mockReturnValue(throwError(() => error));

      service.updateHospital('1', { hospital_name: 'Updated' }).subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when deleting hospital', () => {
      const error = new Error('Delete failed');
      apiService.post.mockReturnValue(throwError(() => error));

      service.deleteHospital('1').subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors for address operations', () => {
      const error = new Error('Address error');
      apiService.post.mockReturnValue(throwError(() => error));

      service.getHospitalAddresses('1').subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when creating hospital address', () => {
      const error = new Error('Create address failed');
      apiService.post.mockReturnValue(throwError(() => error));

      service.createHospitalAddress('1', { street_line1: 'Test' }).subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when updating hospital address', () => {
      const error = new Error('Update address failed');
      apiService.put.mockReturnValue(throwError(() => error));

      service.updateHospitalAddress('1', '2', { street_line1: 'Updated' }).subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when deleting hospital address', () => {
      const error = new Error('Delete address failed');
      apiService.delete.mockReturnValue(throwError(() => error));

      service.deleteHospitalAddress('1', '2').subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors for code operations', () => {
      const error = new Error('Code error');
      apiService.post.mockReturnValue(throwError(() => error));

      service.getHospitalCodes('1').subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when creating hospital code', () => {
      const error = new Error('Create code failed');
      apiService.post.mockReturnValue(throwError(() => error));

      service.createHospitalCode('1', { code_type: 'INSURER_CODE', code_value: 'X' }).subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when updating hospital code', () => {
      const error = new Error('Update code failed');
      apiService.put.mockReturnValue(throwError(() => error));

      service.updateHospitalCode('1', '2', { code_value: 'Y' }).subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when deleting hospital code', () => {
      const error = new Error('Delete code failed');
      apiService.delete.mockReturnValue(throwError(() => error));

      service.deleteHospitalCode('1', '2').subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors for staff operations', () => {
      const error = new Error('Staff error');
      apiService.post.mockReturnValue(throwError(() => error));

      service.getHospitalStaff('1').subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when creating hospital staff', () => {
      const error = new Error('Create staff failed');
      apiService.post.mockReturnValue(throwError(() => error));

      service.createHospitalStaff('1', { staff_name: 'Dr Test', staff_type: 'Doctor' }).subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when updating hospital staff', () => {
      const error = new Error('Update staff failed');
      apiService.put.mockReturnValue(throwError(() => error));

      service.updateHospitalStaff('1', '2', { staff_name: 'Updated' }).subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when deleting hospital staff', () => {
      const error = new Error('Delete staff failed');
      apiService.delete.mockReturnValue(throwError(() => error));

      service.deleteHospitalStaff('1', '2').subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors for staff contact operations', () => {
      const error = new Error('Contact error');
      apiService.post.mockReturnValue(throwError(() => error));

      service.getStaffContacts('1', '1').subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when creating staff contact', () => {
      const error = new Error('Create contact failed');
      apiService.post.mockReturnValue(throwError(() => error));

      service.createStaffContact('1', '1', { contact_type: 'EMAIL', contact_value: 'test@test.com' }).subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when updating staff contact', () => {
      const error = new Error('Update contact failed');
      apiService.put.mockReturnValue(throwError(() => error));

      service.updateStaffContact('1', '1', '2', { contact_value: 'new@test.com' }).subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when deleting staff contact', () => {
      const error = new Error('Delete contact failed');
      apiService.delete.mockReturnValue(throwError(() => error));

      service.deleteStaffContact('1', '1', '2').subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors for fee operations', () => {
      const error = new Error('Fee error');
      apiService.post.mockReturnValue(throwError(() => error));

      service.getHospitalFees('1').subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when creating hospital fee', () => {
      const error = new Error('Create fee failed');
      apiService.post.mockReturnValue(throwError(() => error));

      service.createHospitalFee('1', { fee_type: 'TPA', item_code: 'X', amount: 50 }).subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when updating hospital fee', () => {
      const error = new Error('Update fee failed');
      apiService.put.mockReturnValue(throwError(() => error));

      service.updateHospitalFee('1', '2', { amount: 100 }).subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when deleting hospital fee', () => {
      const error = new Error('Delete fee failed');
      apiService.delete.mockReturnValue(throwError(() => error));

      service.deleteHospitalFee('1', '2').subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when getting hospital by ID', () => {
      const error = new Error('Not found');
      apiService.post.mockReturnValue(throwError(() => error));

      service.getHospitalById('999').subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });

    it('should handle errors when checking hospital code', () => {
      const error = new Error('Check code failed');
      apiService.post.mockReturnValue(throwError(() => error));

      service.checkHospitalCode('XXX').subscribe({
        error: (err) => expect(err).toBe(error)
      });
    });
  });
});
