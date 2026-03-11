import { HospitalsService } from './hospitals.service';
import { HospitalsRepository } from './hospitals.repository';
import { HospitalAddressesRepository } from './hospital-addresses.repository';
import { HospitalCodesRepository } from './hospital-codes.repository';
import { HospitalStaffRepository } from './hospital-staff.repository';
import { HospitalStaffContactsRepository } from './hospital-staff-contacts.repository';
import { FeeSchedulesRepository } from './fee-schedules.repository';
import { CreateHospitalDto, UpdateHospitalDto, HospitalFilters } from './hospitals.types';
import { CreateHospitalAddressDto, UpdateHospitalAddressDto } from './hospital-addresses.types';
import { CreateHospitalCodeDto, UpdateHospitalCodeDto } from './hospital-codes.types';
import { CreateHospitalStaffDto, UpdateHospitalStaffDto } from './hospital-staff.types';
import { CreateHospitalStaffContactDto, UpdateHospitalStaffContactDto } from './hospital-staff-contacts.types';
import { CreateFeeScheduleDto, UpdateFeeScheduleDto } from './fee-schedules.types';

// Mock dependencies
jest.mock('./hospitals.repository');
jest.mock('./hospital-addresses.repository');
jest.mock('./hospital-codes.repository');
jest.mock('./hospital-staff.repository');
jest.mock('./hospital-staff-contacts.repository');
jest.mock('./fee-schedules.repository');

describe('HospitalsService', () => {
  let service: HospitalsService;
  let mockRepository: jest.Mocked<HospitalsRepository>;
  let mockAddressesRepository: jest.Mocked<HospitalAddressesRepository>;
  let mockCodesRepository: jest.Mocked<HospitalCodesRepository>;
  let mockStaffRepository: jest.Mocked<HospitalStaffRepository>;
  let mockContactsRepository: jest.Mocked<HospitalStaffContactsRepository>;
  let mockFeesRepository: jest.Mocked<FeeSchedulesRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock HospitalsRepository
    mockRepository = {
      getHospitals: jest.fn(),
      getHospitalById: jest.fn(),
      hospitalCodeExists: jest.fn(),
      createHospital: jest.fn(),
      updateHospital: jest.fn(),
      deleteHospital: jest.fn(),
    } as any;

    mockAddressesRepository = {
      getAddressesByHospitalId: jest.fn(),
      getAddressById: jest.fn(),
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
      clearPrimaryFlags: jest.fn(),
    } as any;

    mockCodesRepository = {
      getCodesByHospitalId: jest.fn(),
      getCodeById: jest.fn(),
      createCode: jest.fn(),
      updateCode: jest.fn(),
      deleteCode: jest.fn(),
      codeTypeExists: jest.fn(),
    } as any;

    mockStaffRepository = {
      getStaffByHospitalId: jest.fn(),
      getStaffById: jest.fn(),
      createStaff: jest.fn(),
      updateStaff: jest.fn(),
      deleteStaff: jest.fn(),
    } as any;

    mockContactsRepository = {
      getContactsByStaffId: jest.fn(),
      getContactById: jest.fn(),
      createContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      clearPrimaryFlags: jest.fn(),
    } as any;

    mockFeesRepository = {
      getFeesByHospitalId: jest.fn(),
      getFeeById: jest.fn(),
      createFee: jest.fn(),
      updateFee: jest.fn(),
      deleteFee: jest.fn(),
    } as any;

    (HospitalsRepository as jest.MockedClass<typeof HospitalsRepository>).mockImplementation(() => mockRepository);
    (HospitalAddressesRepository as jest.MockedClass<typeof HospitalAddressesRepository>).mockImplementation(() => mockAddressesRepository);
    (HospitalCodesRepository as jest.MockedClass<typeof HospitalCodesRepository>).mockImplementation(() => mockCodesRepository);
    (HospitalStaffRepository as jest.MockedClass<typeof HospitalStaffRepository>).mockImplementation(() => mockStaffRepository);
    (HospitalStaffContactsRepository as jest.MockedClass<typeof HospitalStaffContactsRepository>).mockImplementation(() => mockContactsRepository);
    (FeeSchedulesRepository as jest.MockedClass<typeof FeeSchedulesRepository>).mockImplementation(() => mockFeesRepository);

    service = new HospitalsService();
  });

  describe('getHospitals', () => {
    it('should return paginated hospitals', async () => {
      const filters: HospitalFilters = { page: 1, limit: 10 };
      const mockResult = {
        hospitals: [
          { hospital_id: 1, hospital_name: 'Test Hospital', hospital_code: 'HSP001', is_panel: true, is_deleted: false }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        stats: { total: 1, panel: 1, nonPanel: 0, active: 1, inactive: 0 }
      };

      mockRepository.getHospitals.mockResolvedValue(mockResult);

      const result = await service.getHospitals(filters);

      expect(result).toEqual(mockResult);
      expect(mockRepository.getHospitals).toHaveBeenCalledWith(filters);
    });
  });

  describe('getHospitalById', () => {
    it('should return hospital by ID', async () => {
      const mockHospital = {
        hospital_id: 1,
        hospital_name: 'Test Hospital',
        hospital_code: 'HSP001',
        is_panel: true,
        is_deleted: false
      };

      mockRepository.getHospitalById.mockResolvedValue(mockHospital);

      const result = await service.getHospitalById(1);

      expect(result).toEqual(mockHospital);
      expect(mockRepository.getHospitalById).toHaveBeenCalledWith(1);
    });

    it('should return null when hospital not found', async () => {
      mockRepository.getHospitalById.mockResolvedValue(null);

      const result = await service.getHospitalById(999);

      expect(result).toBeNull();
    });
  });

  describe('createHospital', () => {
    const validDto: CreateHospitalDto = {
      hospital_name: 'Test Hospital',
      hospital_code: 'HSP001',
      is_panel: true
    };

    it('should create hospital successfully', async () => {
      mockRepository.hospitalCodeExists.mockResolvedValue(false);
      mockRepository.createHospital.mockResolvedValue(1);

      const result = await service.createHospital(validDto, 'admin');

      expect(result).toBe(1);
      expect(mockRepository.createHospital).toHaveBeenCalledWith('Test Hospital', 'HSP001', undefined, undefined, undefined, undefined, true, undefined, undefined, undefined, undefined, false, 'admin');
    });

    it('should throw error when hospital name is empty', async () => {
      const dto = { ...validDto, hospital_name: '' };
      await expect(service.createHospital(dto, 'admin')).rejects.toThrow('Hospital name is required');
    });

    it('should throw error when hospital name is whitespace only', async () => {
      const dto = { ...validDto, hospital_name: '   ' };
      await expect(service.createHospital(dto, 'admin')).rejects.toThrow('Hospital name is required');
    });

    it('should throw error when hospital name exceeds 255 characters', async () => {
      const dto = { ...validDto, hospital_name: 'a'.repeat(256) };
      await expect(service.createHospital(dto, 'admin')).rejects.toThrow('Hospital name must not exceed 255 characters');
    });

    it('should throw error when hospital code exceeds 50 characters', async () => {
      const dto = { ...validDto, hospital_code: 'a'.repeat(51) };
      await expect(service.createHospital(dto, 'admin')).rejects.toThrow('Hospital code must not exceed 50 characters');
    });

    it('should throw error when hospital code already exists', async () => {
      mockRepository.hospitalCodeExists.mockResolvedValue(true);
      await expect(service.createHospital(validDto, 'admin')).rejects.toThrow('Hospital code already exists');
    });

    it('should throw error when hospital type exceeds 50 characters', async () => {
      const dto = { ...validDto, hospital_type: 'a'.repeat(51) };
      await expect(service.createHospital(dto, 'admin')).rejects.toThrow('Hospital type must not exceed 50 characters');
    });

    it('should throw error when reg_no exceeds 50 characters', async () => {
      const dto = { ...validDto, reg_no: 'a'.repeat(51) };
      await expect(service.createHospital(dto, 'admin')).rejects.toThrow('Registration number must not exceed 50 characters');
    });

    it('should throw error when bank_acc_no exceeds 50 characters', async () => {
      const dto = { ...validDto, bank_acc_no: 'a'.repeat(51) };
      await expect(service.createHospital(dto, 'admin')).rejects.toThrow('Bank account number must not exceed 50 characters');
    });

    it('should throw error when panel_status exceeds 50 characters', async () => {
      const dto = { ...validDto, panel_status: 'a'.repeat(51) };
      await expect(service.createHospital(dto, 'admin')).rejects.toThrow('Panel status must not exceed 50 characters');
    });

    it('should throw error when accreditation_status exceeds 50 characters', async () => {
      const dto = { ...validDto, accreditation_status: 'a'.repeat(51) };
      await expect(service.createHospital(dto, 'admin')).rejects.toThrow('Accreditation status must not exceed 50 characters');
    });

    it('should default is_panel to false when not provided', async () => {
      const dto = { hospital_name: 'Test Hospital' };
      mockRepository.hospitalCodeExists.mockResolvedValue(false);
      mockRepository.createHospital.mockResolvedValue(1);

      await service.createHospital(dto, 'admin');

      expect(mockRepository.createHospital).toHaveBeenCalledWith(
        'Test Hospital', undefined, undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined, false, 'admin'
      );
    });
  });

  describe('updateHospital', () => {
    const validDto: UpdateHospitalDto = {
      hospital_name: 'Updated Hospital Name'
    };

    it('should update hospital successfully', async () => {
      mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1, hospital_name: 'Test', hospital_code: 'HSP001', is_panel: true, is_deleted: false } as any);
      mockRepository.updateHospital.mockResolvedValue(undefined);

      await service.updateHospital(1, validDto, 'admin');

      expect(mockRepository.updateHospital).toHaveBeenCalledWith(
        1, 
        'Updated Hospital Name', 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        'admin'
      );
    });

    it('should throw error when hospital not found', async () => {
      mockRepository.getHospitalById.mockResolvedValue(null);
      await expect(service.updateHospital(999, validDto, 'admin')).rejects.toThrow('Hospital not found');
    });

    it('should throw error when hospital name is empty', async () => {
      mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
      const dto = { hospital_name: '' };
      await expect(service.updateHospital(1, dto, 'admin')).rejects.toThrow('Hospital name cannot be empty');
    });

    it('should throw error when hospital name is whitespace only', async () => {
      mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
      const dto = { hospital_name: '   ' };
      await expect(service.updateHospital(1, dto, 'admin')).rejects.toThrow('Hospital name cannot be empty');
    });

    it('should throw error when hospital name exceeds 255 characters', async () => {
      mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
      const dto = { hospital_name: 'a'.repeat(256) };
      await expect(service.updateHospital(1, dto, 'admin')).rejects.toThrow('Hospital name must not exceed 255 characters');
    });

    it('should throw error when hospital code exceeds 50 characters', async () => {
      mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
      const dto = { hospital_code: 'a'.repeat(51) };
      await expect(service.updateHospital(1, dto, 'admin')).rejects.toThrow('Hospital code must not exceed 50 characters');
    });

    it('should throw error when hospital code already exists', async () => {
      mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
      mockRepository.hospitalCodeExists.mockResolvedValue(true);
      const dto = { hospital_code: 'HSP001' };
      await expect(service.updateHospital(1, dto, 'admin')).rejects.toThrow('Hospital code already exists');
    });

    it('should throw error when hospital type exceeds 50 characters', async () => {
      mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
      const dto = { hospital_type: 'a'.repeat(51) };
      await expect(service.updateHospital(1, dto, 'admin')).rejects.toThrow('Hospital type must not exceed 50 characters');
    });

    it('should throw error when reg_no exceeds 50 characters', async () => {
      mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
      const dto = { reg_no: 'a'.repeat(51) };
      await expect(service.updateHospital(1, dto, 'admin')).rejects.toThrow('Registration number must not exceed 50 characters');
    });

    it('should throw error when bank_acc_no exceeds 50 characters', async () => {
      mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
      const dto = { bank_acc_no: 'a'.repeat(51) };
      await expect(service.updateHospital(1, dto, 'admin')).rejects.toThrow('Bank account number must not exceed 50 characters');
    });

    it('should throw error when panel_status exceeds 50 characters', async () => {
      mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
      const dto = { panel_status: 'a'.repeat(51) };
      await expect(service.updateHospital(1, dto, 'admin')).rejects.toThrow('Panel status must not exceed 50 characters');
    });

    it('should throw error when accreditation_status exceeds 50 characters', async () => {
      mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
      const dto = { accreditation_status: 'a'.repeat(51) };
      await expect(service.updateHospital(1, dto, 'admin')).rejects.toThrow('Accreditation status must not exceed 50 characters');
    });
  });

  describe('deleteHospital', () => {
    it('should delete hospital successfully', async () => {
      mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1, hospital_name: 'Test', hospital_code: 'HSP001', is_panel: true, is_deleted: false } as any);
      mockRepository.deleteHospital.mockResolvedValue(undefined);

      await service.deleteHospital(1);

      expect(mockRepository.deleteHospital).toHaveBeenCalledWith(1);
    });

    it('should throw error when hospital not found', async () => {
      mockRepository.getHospitalById.mockResolvedValue(null);
      await expect(service.deleteHospital(999)).rejects.toThrow('Hospital not found');
    });
  });

  describe('checkHospitalCodeAvailability', () => {
    it('should return true when code is available', async () => {
      mockRepository.hospitalCodeExists.mockResolvedValue(false);
      const result = await service.checkHospitalCodeAvailability('HSP001');
      expect(result).toBe(true);
    });

    it('should return false when code exists', async () => {
      mockRepository.hospitalCodeExists.mockResolvedValue(true);
      const result = await service.checkHospitalCodeAvailability('HSP001');
      expect(result).toBe(false);
    });

    it('should exclude hospital ID when provided', async () => {
      mockRepository.hospitalCodeExists.mockResolvedValue(false);
      await service.checkHospitalCodeAvailability('HSP001', 1);
      expect(mockRepository.hospitalCodeExists).toHaveBeenCalledWith('HSP001', 1);
    });
  });

  // ========================================================================
  // HOSPITAL ADDRESSES
  // ========================================================================

  describe('Hospital Addresses', () => {
    describe('getAddressesByHospitalId', () => {
      it('should return addresses for hospital', async () => {
        const mockAddresses = [{ address_id: 1, hospital_id: 1, street_line1: 'Test' }];
        mockAddressesRepository.getAddressesByHospitalId.mockResolvedValue(mockAddresses as any);

        const result = await service.getAddressesByHospitalId(1);

        expect(result).toEqual(mockAddresses);
        expect(mockAddressesRepository.getAddressesByHospitalId).toHaveBeenCalledWith(1);
      });
    });

    describe('getAddressById', () => {
      it('should return address by ID', async () => {
        const mockAddress = { address_id: 1, hospital_id: 1 };
        mockAddressesRepository.getAddressById.mockResolvedValue(mockAddress as any);

        const result = await service.getAddressById(1);

        expect(result).toEqual(mockAddress);
      });

      it('should return null when not found', async () => {
        mockAddressesRepository.getAddressById.mockResolvedValue(null);
        const result = await service.getAddressById(999);
        expect(result).toBeNull();
      });
    });

    describe('createAddress', () => {
      const validDto: CreateHospitalAddressDto = {
        hospital_id: 1,
        street_line1: 'Test Street',
        is_primary: false
      };

      it('should create address successfully', async () => {
        mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
        mockAddressesRepository.createAddress.mockResolvedValue(1);

        const result = await service.createAddress(validDto, 'admin');

        expect(result).toBe(1);
        expect(mockAddressesRepository.createAddress).toHaveBeenCalled();
      });

      it('should throw error when hospital not found', async () => {
        mockRepository.getHospitalById.mockResolvedValue(null);
        await expect(service.createAddress(validDto, 'admin')).rejects.toThrow('Hospital not found');
      });

      it('should clear primary flags when setting as primary', async () => {
        const dto = { ...validDto, is_primary: true };
        mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
        mockAddressesRepository.createAddress.mockResolvedValue(1);

        await service.createAddress(dto, 'admin');

        expect(mockAddressesRepository.clearPrimaryFlags).toHaveBeenCalledWith(1);
      });
    });

    describe('updateAddress', () => {
      const validDto: UpdateHospitalAddressDto = {
        street_line1: 'Updated Street'
      };

      it('should update address successfully', async () => {
        mockAddressesRepository.getAddressById.mockResolvedValue({ address_id: 1, hospital_id: 1 } as any);
        mockAddressesRepository.updateAddress.mockResolvedValue(undefined);

        await service.updateAddress(1, validDto, 'admin');

        expect(mockAddressesRepository.updateAddress).toHaveBeenCalled();
      });

      it('should throw error when address not found', async () => {
        mockAddressesRepository.getAddressById.mockResolvedValue(null);
        await expect(service.updateAddress(999, validDto, 'admin')).rejects.toThrow('Address not found');
      });

      it('should clear primary flags when setting as primary', async () => {
        const dto = { ...validDto, is_primary: true };
        mockAddressesRepository.getAddressById.mockResolvedValue({ address_id: 1, hospital_id: 1 } as any);
        mockAddressesRepository.updateAddress.mockResolvedValue(undefined);

        await service.updateAddress(1, dto, 'admin');

        expect(mockAddressesRepository.clearPrimaryFlags).toHaveBeenCalledWith(1);
      });
    });

    describe('deleteAddress', () => {
      it('should delete address successfully', async () => {
        mockAddressesRepository.getAddressById.mockResolvedValue({ address_id: 1 } as any);
        mockAddressesRepository.deleteAddress.mockResolvedValue(undefined);

        await service.deleteAddress(1);

        expect(mockAddressesRepository.deleteAddress).toHaveBeenCalledWith(1);
      });

      it('should throw error when address not found', async () => {
        mockAddressesRepository.getAddressById.mockResolvedValue(null);
        await expect(service.deleteAddress(999)).rejects.toThrow('Address not found');
      });
    });
  });

  // ========================================================================
  // HOSPITAL CODES
  // ========================================================================

  describe('Hospital Codes', () => {
    describe('getCodesByHospitalId', () => {
      it('should return codes for hospital', async () => {
        const mockCodes = [{ code_id: 1, hospital_id: 1 }];
        mockCodesRepository.getCodesByHospitalId.mockResolvedValue(mockCodes as any);

        const result = await service.getCodesByHospitalId(1);

        expect(result).toEqual(mockCodes);
      });
    });

    describe('createCode', () => {
      const validDto: CreateHospitalCodeDto = {
        hospital_id: 1,
        code_type: 'LICENSE',
        code_value: '12345'
      };

      it('should create code successfully', async () => {
        mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
        mockCodesRepository.codeTypeExists.mockResolvedValue(false);
        mockCodesRepository.createCode.mockResolvedValue(1);

        const result = await service.createCode(validDto, 'admin');

        expect(result).toBe(1);
      });

      it('should throw error when hospital not found', async () => {
        mockRepository.getHospitalById.mockResolvedValue(null);
        await expect(service.createCode(validDto, 'admin')).rejects.toThrow('Hospital not found');
      });

      it('should throw error when code type already exists', async () => {
        mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
        mockCodesRepository.codeTypeExists.mockResolvedValue(true);
        await expect(service.createCode(validDto, 'admin')).rejects.toThrow(`Code type 'LICENSE' already exists for this hospital`);
      });
    });

    describe('updateCode', () => {
      const validDto: UpdateHospitalCodeDto = {
        code_value: '54321'
      };

      it('should update code successfully', async () => {
        mockCodesRepository.getCodeById.mockResolvedValue({ code_id: 1, hospital_id: 1, code_type: 'LICENSE' } as any);
        mockCodesRepository.updateCode.mockResolvedValue(undefined);

        await service.updateCode(1, validDto, 'admin');

        expect(mockCodesRepository.updateCode).toHaveBeenCalled();
      });

      it('should throw error when code not found', async () => {
        mockCodesRepository.getCodeById.mockResolvedValue(null);
        await expect(service.updateCode(999, validDto, 'admin')).rejects.toThrow('Code not found');
      });

      it('should throw error when new code type already exists', async () => {
        mockCodesRepository.getCodeById.mockResolvedValue({ code_id: 1, hospital_id: 1, code_type: 'LICENSE' } as any);
        mockCodesRepository.codeTypeExists.mockResolvedValue(true);
        const dto = { code_type: 'TAX_ID' };
        await expect(service.updateCode(1, dto, 'admin')).rejects.toThrow(`Code type 'TAX_ID' already exists for this hospital`);
      });
    });

    describe('deleteCode', () => {
      it('should delete code successfully', async () => {
        mockCodesRepository.getCodeById.mockResolvedValue({ code_id: 1 } as any);
        mockCodesRepository.deleteCode.mockResolvedValue(undefined);

        await service.deleteCode(1);

        expect(mockCodesRepository.deleteCode).toHaveBeenCalledWith(1);
      });

      it('should throw error when code not found', async () => {
        mockCodesRepository.getCodeById.mockResolvedValue(null);
        await expect(service.deleteCode(999)).rejects.toThrow('Code not found');
      });
    });
  });

  // ========================================================================
  // HOSPITAL STAFF
  // ========================================================================

  describe('Hospital Staff', () => {
    describe('getStaffByHospitalId', () => {
      it('should return staff for hospital', async () => {
        const mockStaff = [{ staff_id: 1, hospital_id: 1 }];
        mockStaffRepository.getStaffByHospitalId.mockResolvedValue(mockStaff as any);

        const result = await service.getStaffByHospitalId(1);

        expect(result).toEqual(mockStaff);
      });
    });

    describe('createStaff', () => {
      const validDto: CreateHospitalStaffDto = {
        hospital_id: 1,
        staff_name: 'Dr. Smith'
      };

      it('should create staff successfully', async () => {
        mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
        mockStaffRepository.createStaff.mockResolvedValue(1);

        const result = await service.createStaff(validDto, 'admin');

        expect(result).toBe(1);
      });

      it('should throw error when hospital not found', async () => {
        mockRepository.getHospitalById.mockResolvedValue(null);
        await expect(service.createStaff(validDto, 'admin')).rejects.toThrow('Hospital not found');
      });

      it('should throw error when staff name is empty', async () => {
        mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
        const dto = { ...validDto, staff_name: '' };
        await expect(service.createStaff(dto, 'admin')).rejects.toThrow('Staff name is required');
      });

      it('should throw error when staff name is whitespace only', async () => {
        mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
        const dto = { ...validDto, staff_name: '   ' };
        await expect(service.createStaff(dto, 'admin')).rejects.toThrow('Staff name is required');
      });
    });

    describe('updateStaff', () => {
      const validDto: UpdateHospitalStaffDto = {
        staff_name: 'Dr. Jones'
      };

      it('should update staff successfully', async () => {
        mockStaffRepository.getStaffById.mockResolvedValue({ staff_id: 1 } as any);
        mockStaffRepository.updateStaff.mockResolvedValue(undefined);

        await service.updateStaff(1, validDto, 'admin');

        expect(mockStaffRepository.updateStaff).toHaveBeenCalled();
      });

      it('should throw error when staff not found', async () => {
        mockStaffRepository.getStaffById.mockResolvedValue(null);
        await expect(service.updateStaff(999, validDto, 'admin')).rejects.toThrow('Staff not found');
      });

      it('should throw error when staff name is empty', async () => {
        mockStaffRepository.getStaffById.mockResolvedValue({ staff_id: 1 } as any);
        const dto = { staff_name: '' };
        await expect(service.updateStaff(1, dto, 'admin')).rejects.toThrow('Staff name cannot be empty');
      });

      it('should throw error when staff name is whitespace only', async () => {
        mockStaffRepository.getStaffById.mockResolvedValue({ staff_id: 1 } as any);
        const dto = { staff_name: '   ' };
        await expect(service.updateStaff(1, dto, 'admin')).rejects.toThrow('Staff name cannot be empty');
      });
    });

    describe('deleteStaff', () => {
      it('should delete staff successfully', async () => {
        mockStaffRepository.getStaffById.mockResolvedValue({ staff_id: 1 } as any);
        mockStaffRepository.deleteStaff.mockResolvedValue(undefined);

        await service.deleteStaff(1);

        expect(mockStaffRepository.deleteStaff).toHaveBeenCalledWith(1);
      });

      it('should throw error when staff not found', async () => {
        mockStaffRepository.getStaffById.mockResolvedValue(null);
        await expect(service.deleteStaff(999)).rejects.toThrow('Staff not found');
      });
    });
  });

  // ========================================================================
  // STAFF CONTACTS
  // ========================================================================

  describe('Staff Contacts', () => {
    describe('getContactsByStaffId', () => {
      it('should return contacts for staff', async () => {
        const mockContacts = [{ contact_id: 1, staff_id: 1 }];
        mockContactsRepository.getContactsByStaffId.mockResolvedValue(mockContacts as any);

        const result = await service.getContactsByStaffId(1);

        expect(result).toEqual(mockContacts);
      });
    });

    describe('createContact', () => {
      const validDto: CreateHospitalStaffContactDto = {
        staff_id: 1,
        contact_type: 'EMAIL',
        contact_value: 'test@example.com'
      };

      it('should create contact successfully', async () => {
        mockStaffRepository.getStaffById.mockResolvedValue({ staff_id: 1 } as any);
        mockContactsRepository.createContact.mockResolvedValue(1);

        const result = await service.createContact(validDto, 'admin');

        expect(result).toBe(1);
      });

      it('should throw error when staff not found', async () => {
        mockStaffRepository.getStaffById.mockResolvedValue(null);
        await expect(service.createContact(validDto, 'admin')).rejects.toThrow('Staff not found');
      });

      it('should clear primary flags when setting as primary', async () => {
        const dto = { ...validDto, is_primary: true };
        mockStaffRepository.getStaffById.mockResolvedValue({ staff_id: 1 } as any);
        mockContactsRepository.createContact.mockResolvedValue(1);

        await service.createContact(dto, 'admin');

        expect(mockContactsRepository.clearPrimaryFlags).toHaveBeenCalledWith(1);
      });
    });

    describe('updateContact', () => {
      const validDto: UpdateHospitalStaffContactDto = {
        contact_value: 'updated@example.com'
      };

      it('should update contact successfully', async () => {
        mockContactsRepository.getContactById.mockResolvedValue({ contact_id: 1, staff_id: 1 } as any);
        mockContactsRepository.updateContact.mockResolvedValue(undefined);

        await service.updateContact(1, validDto, 'admin');

        expect(mockContactsRepository.updateContact).toHaveBeenCalled();
      });

      it('should throw error when contact not found', async () => {
        mockContactsRepository.getContactById.mockResolvedValue(null);
        await expect(service.updateContact(999, validDto, 'admin')).rejects.toThrow('Contact not found');
      });

      it('should clear primary flags when setting as primary', async () => {
        const dto = { ...validDto, is_primary: true };
        mockContactsRepository.getContactById.mockResolvedValue({ contact_id: 1, staff_id: 1 } as any);
        mockContactsRepository.updateContact.mockResolvedValue(undefined);

        await service.updateContact(1, dto, 'admin');

        expect(mockContactsRepository.clearPrimaryFlags).toHaveBeenCalledWith(1);
      });
    });

    describe('deleteContact', () => {
      it('should delete contact successfully', async () => {
        mockContactsRepository.getContactById.mockResolvedValue({ contact_id: 1 } as any);
        mockContactsRepository.deleteContact.mockResolvedValue(undefined);

        await service.deleteContact(1);

        expect(mockContactsRepository.deleteContact).toHaveBeenCalledWith(1);
      });

      it('should throw error when contact not found', async () => {
        mockContactsRepository.getContactById.mockResolvedValue(null);
        await expect(service.deleteContact(999)).rejects.toThrow('Contact not found');
      });
    });
  });

  // ========================================================================
  // FEE SCHEDULES
  // ========================================================================

  describe('Fee Schedules', () => {
    describe('getFeesByHospitalId', () => {
      it('should return fees for hospital', async () => {
        const mockFees = [{ fee_id: 1, hospital_id: 1 }];
        mockFeesRepository.getFeesByHospitalId.mockResolvedValue(mockFees as any);

        const result = await service.getFeesByHospitalId(1);

        expect(result).toEqual(mockFees);
      });

      it('should return fees with filters', async () => {
        const mockFees = [{ fee_id: 1, hospital_id: 1 }];
        const filters = { is_active: true };
        mockFeesRepository.getFeesByHospitalId.mockResolvedValue(mockFees as any);

        const result = await service.getFeesByHospitalId(1, filters);

        expect(result).toEqual(mockFees);
        expect(mockFeesRepository.getFeesByHospitalId).toHaveBeenCalledWith(1, filters);
      });
    });

    describe('createFee', () => {
      const validDto: CreateFeeScheduleDto = {
        hospital_id: 1,
        fee_type: 'CONSULTATION',
        item_code: 'CONS001',
        amount: 100
      };

      it('should create fee successfully', async () => {
        mockRepository.getHospitalById.mockResolvedValue({ hospital_id: 1 } as any);
        mockFeesRepository.createFee.mockResolvedValue(1);

        const result = await service.createFee(validDto, 'admin');

        expect(result).toBe(1);
      });

      it('should throw error when hospital not found', async () => {
        mockRepository.getHospitalById.mockResolvedValue(null);
        await expect(service.createFee(validDto, 'admin')).rejects.toThrow('Hospital not found');
      });

      it('should create fee without hospital_id', async () => {
        const dto = { ...validDto, hospital_id: undefined };
        mockFeesRepository.createFee.mockResolvedValue(1);

        const result = await service.createFee(dto, 'admin');

        expect(result).toBe(1);
      });
    });

    describe('updateFee', () => {
      const validDto: UpdateFeeScheduleDto = {
        amount: 150
      };

      it('should update fee successfully', async () => {
        mockFeesRepository.getFeeById.mockResolvedValue({ fee_id: 1 } as any);
        mockFeesRepository.updateFee.mockResolvedValue(undefined);

        await service.updateFee(1, validDto, 'admin');

        expect(mockFeesRepository.updateFee).toHaveBeenCalled();
      });

      it('should throw error when fee not found', async () => {
        mockFeesRepository.getFeeById.mockResolvedValue(null);
        await expect(service.updateFee(999, validDto, 'admin')).rejects.toThrow('Fee schedule not found');
      });
    });

    describe('deleteFee', () => {
      it('should delete fee successfully', async () => {
        mockFeesRepository.getFeeById.mockResolvedValue({ fee_id: 1 } as any);
        mockFeesRepository.deleteFee.mockResolvedValue(undefined);

        await service.deleteFee(1);

        expect(mockFeesRepository.deleteFee).toHaveBeenCalledWith(1);
      });

      it('should throw error when fee not found', async () => {
        mockFeesRepository.getFeeById.mockResolvedValue(null);
        await expect(service.deleteFee(999)).rejects.toThrow('Fee schedule not found');
      });
    });
  });
});
