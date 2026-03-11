import { Request, Response } from 'express';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { ResponseUtil } from '../../core/utils/response.util';

jest.mock('./hospitals.service');
jest.mock('../../core/utils/response.util');

describe('HospitalsController', () => {
  let controller: HospitalsController;
  let mockService: jest.Mocked<HospitalsService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    controller = new HospitalsController();
    mockService = (controller as any).service as jest.Mocked<HospitalsService>;
    
    mockRequest = { 
      body: {}, 
      params: {} as any,
      user: { userId: 1 }
    } as any;
    mockResponse = {};
    
    jest.clearAllMocks();
  });

  // ============================================================================
  // HOSPITALS
  // ============================================================================

  describe('getHospitals', () => {
    it('should return paginated hospitals successfully', async () => {
      const mockResult = {
        hospitals: [{ hospital_id: 1, hospital_name: 'City Hospital', hospital_code: 'CH001', is_panel: true }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        stats: { total_hospitals: 1, panel_hospitals: 1, non_panel_hospitals: 0 }
      };
      
      mockService.getHospitals.mockResolvedValue(mockResult as any);
      mockRequest.body = { page: 1, limit: 10 };

      await controller.getHospitals(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitals).toHaveBeenCalledWith({
        search: undefined,
        hospital_type: undefined,
        is_panel: undefined,
        panel_status: undefined,
        is_deleted: undefined,
        page: 1,
        limit: 10,
        sort_by: 'hospital_id',
        sort_order: 'DESC'
      });
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockResult,
        'Hospitals retrieved successfully'
      );
    });

    it('should apply search filter', async () => {
      mockService.getHospitals.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = { search: 'City', page: 1, limit: 10 };

      await controller.getHospitals(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitals).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'City' })
      );
    });

    it('should apply hospital_type filter', async () => {
      mockService.getHospitals.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = { hospital_type: 'Private', page: 1, limit: 10 };

      await controller.getHospitals(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitals).toHaveBeenCalledWith(
        expect.objectContaining({ hospital_type: 'Private' })
      );
    });

    it('should apply is_panel filter', async () => {
      mockService.getHospitals.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = { is_panel: true, page: 1, limit: 10 };

      await controller.getHospitals(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitals).toHaveBeenCalledWith(
        expect.objectContaining({ is_panel: true })
      );
    });

    it('should apply panel_status filter', async () => {
      mockService.getHospitals.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = { panel_status: 'Active', page: 1, limit: 10 };

      await controller.getHospitals(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitals).toHaveBeenCalledWith(
        expect.objectContaining({ panel_status: 'Active' })
      );
    });

    it('should use default pagination values', async () => {
      mockService.getHospitals.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = {};

      await controller.getHospitals(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitals).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10, sort_by: 'hospital_id', sort_order: 'DESC' })
      );
    });

    it('should handle service errors', async () => {
      mockService.getHospitals.mockRejectedValue(new Error('Database error'));
      mockRequest.body = {};

      await controller.getHospitals(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching hospitals',
        500,
        'Database error'
      );
    });
  });

  describe('getHospitalById', () => {
    it('should return hospital when found', async () => {
      const mockHospital = { hospital_id: 1, hospital_name: 'City Hospital', hospital_code: 'CH001' };
      mockService.getHospitalById.mockResolvedValue(mockHospital as any);
      mockRequest.body = { hospital_id: 1 };

      await controller.getHospitalById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitalById).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockHospital,
        'Hospital retrieved successfully'
      );
    });

    it('should return 400 for missing hospital_id', async () => {
      mockRequest.body = {};

      await controller.getHospitalById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitalById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });

    it('should return 400 for invalid hospital_id', async () => {
      mockRequest.body = { hospital_id: 'invalid' };

      await controller.getHospitalById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitalById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });

    it('should return 404 when hospital not found', async () => {
      mockService.getHospitalById.mockResolvedValue(null);
      mockRequest.body = { hospital_id: 999 };

      await controller.getHospitalById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitalById).toHaveBeenCalledWith(999);
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Hospital not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.getHospitalById.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { hospital_id: 1 };

      await controller.getHospitalById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching hospital',
        500,
        'Query failed'
      );
    });
  });

  describe('createHospital', () => {
    it('should create hospital successfully', async () => {
      mockService.createHospital.mockResolvedValue(2);
      mockRequest.body = {
        hospital_name: 'New Hospital',
        hospital_code: 'NH001',
        hospital_type: 'Private'
      };

      await controller.createHospital(mockRequest as Request, mockResponse as Response);

      expect(mockService.createHospital).toHaveBeenCalledWith(mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { hospital_id: 2 },
        'Hospital created successfully',
        201
      );
    });

    it('should return 400 when hospital_name is missing', async () => {
      mockRequest.body = { hospital_code: 'NH001' };

      await controller.createHospital(mockRequest as Request, mockResponse as Response);

      expect(mockService.createHospital).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'hospital_name is required',
        400
      );
    });

    it('should return 409 for duplicate hospital_code', async () => {
      mockService.createHospital.mockRejectedValue(
        new Error('UNIQUE KEY constraint violation on hospital_code')
      );
      mockRequest.body = { hospital_name: 'Test', hospital_code: 'CH001' };

      await controller.createHospital(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Hospital code already exists'
      );
    });

    it('should return 409 for duplicate hospital_name', async () => {
      mockService.createHospital.mockRejectedValue(
        new Error('UNIQUE KEY constraint violation on hospital_name')
      );
      mockRequest.body = { hospital_name: 'City Hospital' };

      await controller.createHospital(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Hospital name already exists'
      );
    });

    it('should return 409 when hospital code already exists (service error)', async () => {
      mockService.createHospital.mockRejectedValue(new Error('Hospital code already exists'));
      mockRequest.body = { hospital_name: 'Test', hospital_code: 'CH001' };

      await controller.createHospital(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Hospital code already exists'
      );
    });

    it('should return 400 for validation errors', async () => {
      mockService.createHospital.mockRejectedValue(new Error('hospital_code must be at least 3 characters'));
      mockRequest.body = { hospital_name: 'Test', hospital_code: 'AB' };

      await controller.createHospital(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'hospital_code must be at least 3 characters',
        400
      );
    });

    it('should handle general service errors', async () => {
      mockService.createHospital.mockRejectedValue(new Error('Insert failed'));
      mockRequest.body = { hospital_name: 'Test' };

      await controller.createHospital(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating hospital',
        500,
        'Insert failed'
      );
    });
  });

  describe('updateHospital', () => {
    it('should update hospital successfully', async () => {
      mockService.updateHospital.mockResolvedValue(undefined);
      mockRequest.body = {
        hospital_id: 1,
        hospital_name: 'Updated Hospital',
        is_panel: true
      };

      await controller.updateHospital(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateHospital).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          hospital_name: 'Updated Hospital',
          is_panel: true
        }),
        '1'
      );
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Hospital updated successfully'
      );
    });

    it('should return 400 for missing hospital_id', async () => {
      mockRequest.body = { hospital_name: 'Updated' };

      await controller.updateHospital(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateHospital).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });

    it('should return 400 for invalid hospital_id', async () => {
      mockRequest.body = { hospital_id: 'invalid', hospital_name: 'Updated' };

      await controller.updateHospital(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateHospital).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });

    it('should return 404 when hospital not found', async () => {
      mockService.updateHospital.mockRejectedValue(new Error('Hospital not found'));
      mockRequest.body = { hospital_id: 999, hospital_name: 'Updated' };

      await controller.updateHospital(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Hospital not found'
      );
    });

    it('should return 409 for duplicate hospital_code', async () => {
      mockService.updateHospital.mockRejectedValue(
        new Error('UNIQUE KEY constraint violation on hospital_code')
      );
      mockRequest.body = { hospital_id: 1, hospital_code: 'CH002' };

      await controller.updateHospital(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Hospital code already exists'
      );
    });

    it('should handle service errors', async () => {
      mockService.updateHospital.mockRejectedValue(new Error('Update failed'));
      mockRequest.body = { hospital_id: 1, hospital_name: 'Updated' };

      await controller.updateHospital(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating hospital',
        500,
        'Update failed'
      );
    });
  });

  describe('deleteHospital', () => {
    it('should delete hospital successfully', async () => {
      mockService.deleteHospital.mockResolvedValue(undefined);
      mockRequest.body = { hospital_id: 1 };

      await controller.deleteHospital(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteHospital).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Hospital deleted successfully'
      );
    });

    it('should return 400 for invalid hospital_id', async () => {
      mockRequest.body = { hospital_id: 'invalid' };

      await controller.deleteHospital(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteHospital).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });

    it('should return 404 when hospital not found', async () => {
      mockService.deleteHospital.mockRejectedValue(new Error('Hospital not found'));
      mockRequest.body = { hospital_id: 999 };

      await controller.deleteHospital(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Hospital not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.deleteHospital.mockRejectedValue(new Error('Delete failed'));
      mockRequest.body = { hospital_id: 1 };

      await controller.deleteHospital(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error deleting hospital',
        500,
        'Delete failed'
      );
    });
  });

  describe('checkHospitalCode', () => {
    it('should return availability status', async () => {
      mockService.checkHospitalCodeAvailability.mockResolvedValue(true);
      mockRequest.body = { hospital_code: 'NEW001' };

      await controller.checkHospitalCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkHospitalCodeAvailability).toHaveBeenCalledWith('NEW001', undefined);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { available: true },
        'Hospital code availability checked'
      );
    });

    it('should exclude current hospital when checking', async () => {
      mockService.checkHospitalCodeAvailability.mockResolvedValue(true);
      mockRequest.body = { hospital_code: 'CH001', exclude_hospital_id: 1 };

      await controller.checkHospitalCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkHospitalCodeAvailability).toHaveBeenCalledWith('CH001', 1);
    });

    it('should handle service errors', async () => {
      mockService.checkHospitalCodeAvailability.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { hospital_code: 'CH001' };

      await controller.checkHospitalCode(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error checking hospital code',
        500,
        'Query failed'
      );
    });
  });

  // ============================================================================
  // HOSPITAL ADDRESSES
  // ============================================================================

  describe('getAddresses', () => {
    it('should return hospital addresses successfully', async () => {
      const mockAddresses = [
        { address_id: 1, hospital_id: 1, address_line1: '123 Main St', city: 'Kuala Lumpur' }
      ];
      mockService.getAddressesByHospitalId.mockResolvedValue(mockAddresses as any);
      mockRequest.params = { hospitalId: '1' };

      await controller.getAddresses(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAddressesByHospitalId).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockAddresses,
        'Addresses retrieved successfully'
      );
    });

    it('should return 400 for invalid hospitalId', async () => {
      mockRequest.params = { hospitalId: 'invalid' };

      await controller.getAddresses(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAddressesByHospitalId).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.getAddressesByHospitalId.mockRejectedValue(new Error('Query failed'));
      mockRequest.params = { hospitalId: '1' };

      await controller.getAddresses(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching addresses',
        500,
        'Query failed'
      );
    });
  });

  describe('createAddress', () => {
    it('should create address successfully', async () => {
      mockService.createAddress.mockResolvedValue(2);
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = {
        address_line1: '456 Oak Ave',
        city: 'Kuala Lumpur'
      };

      await controller.createAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.createAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          hospital_id: 1,
          address_line1: '456 Oak Ave',
          city: 'Kuala Lumpur'
        }),
        '1'
      );
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { address_id: 2 },
        'Address created successfully',
        201
      );
    });

    it('should return 400 for invalid hospitalId', async () => {
      mockRequest.params = { hospitalId: 'invalid' };
      mockRequest.body = { address_line1: '456 Oak Ave' };

      await controller.createAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.createAddress).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });

    it('should return 404 when hospital not found', async () => {
      mockService.createAddress.mockRejectedValue(new Error('Hospital not found'));
      mockRequest.params = { hospitalId: '999' };
      mockRequest.body = { address_line1: '456 Oak Ave' };

      await controller.createAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Hospital not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.createAddress.mockRejectedValue(new Error('Insert failed'));
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = { address_line1: '456 Oak Ave' };

      await controller.createAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating address',
        500,
        'Insert failed'
      );
    });
  });

  describe('updateAddress', () => {
    it('should update address successfully', async () => {
      mockService.updateAddress.mockResolvedValue(undefined);
      mockRequest.params = { addressId: '1' };
      mockRequest.body = { address_line1: 'Updated Address' };

      await controller.updateAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateAddress).toHaveBeenCalledWith(1, mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Address updated successfully'
      );
    });

    it('should return 400 for invalid addressId', async () => {
      mockRequest.params = { addressId: 'invalid' };
      mockRequest.body = { address_line1: 'Updated' };

      await controller.updateAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateAddress).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid address ID',
        400
      );
    });

    it('should return 404 when address not found', async () => {
      mockService.updateAddress.mockRejectedValue(new Error('Address not found'));
      mockRequest.params = { addressId: '999' };
      mockRequest.body = { address_line1: 'Updated' };

      await controller.updateAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Address not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.updateAddress.mockRejectedValue(new Error('Update failed'));
      mockRequest.params = { addressId: '1' };
      mockRequest.body = { address_line1: 'Updated' };

      await controller.updateAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating address',
        500,
        'Update failed'
      );
    });
  });

  describe('deleteAddress', () => {
    it('should delete address successfully', async () => {
      mockService.deleteAddress.mockResolvedValue(undefined);
      mockRequest.params = { addressId: '1' };

      await controller.deleteAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteAddress).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Address deleted successfully'
      );
    });

    it('should return 400 for invalid addressId', async () => {
      mockRequest.params = { addressId: 'invalid' };

      await controller.deleteAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteAddress).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid address ID',
        400
      );
    });

    it('should return 404 when address not found', async () => {
      mockService.deleteAddress.mockRejectedValue(new Error('Address not found'));
      mockRequest.params = { addressId: '999' };

      await controller.deleteAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Address not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.deleteAddress.mockRejectedValue(new Error('Delete failed'));
      mockRequest.params = { addressId: '1' };

      await controller.deleteAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error deleting address',
        500,
        'Delete failed'
      );
    });
  });

  // ============================================================================
  // HOSPITAL CODES
  // ============================================================================

  describe('getCodes', () => {
    it('should return hospital codes successfully', async () => {
      const mockCodes = [
        { code_id: 1, hospital_id: 1, code_type: 'ICD10', code_value: 'A00.0' }
      ];
      mockService.getCodesByHospitalId.mockResolvedValue(mockCodes as any);
      mockRequest.params = { hospitalId: '1' };

      await controller.getCodes(mockRequest as Request, mockResponse as Response);

      expect(mockService.getCodesByHospitalId).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockCodes,
        'Codes retrieved successfully'
      );
    });

    it('should return 400 for invalid hospitalId', async () => {
      mockRequest.params = { hospitalId: 'invalid' };

      await controller.getCodes(mockRequest as Request, mockResponse as Response);

      expect(mockService.getCodesByHospitalId).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.getCodesByHospitalId.mockRejectedValue(new Error('Query failed'));
      mockRequest.params = { hospitalId: '1' };

      await controller.getCodes(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching codes',
        500,
        'Query failed'
      );
    });
  });

  describe('createCode', () => {
    it('should create code successfully', async () => {
      mockService.createCode.mockResolvedValue(2);
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = {
        code_type: 'ICD10',
        code_value: 'B00.0'
      };

      await controller.createCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.createCode).toHaveBeenCalledWith(
        expect.objectContaining({
          hospital_id: 1,
          code_type: 'ICD10',
          code_value: 'B00.0'
        }),
        '1'
      );
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { code_id: 2 },
        'Code created successfully',
        201
      );
    });

    it('should return 400 for invalid hospitalId', async () => {
      mockRequest.params = { hospitalId: 'invalid' };
      mockRequest.body = { code_type: 'ICD10', code_value: 'B00.0' };

      await controller.createCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.createCode).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });
  });

  describe('updateCode', () => {
    it('should update code successfully', async () => {
      mockService.updateCode.mockResolvedValue(undefined);
      mockRequest.params = { codeId: '1' };
      mockRequest.body = { code_value: 'Updated Value' };

      await controller.updateCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateCode).toHaveBeenCalledWith(1, mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Code updated successfully'
      );
    });

    it('should return 400 for invalid codeId', async () => {
      mockRequest.params = { codeId: 'invalid' };
      mockRequest.body = { code_value: 'Updated' };

      await controller.updateCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateCode).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid code ID',
        400
      );
    });

    it('should return 404 when code not found', async () => {
      mockService.updateCode.mockRejectedValue(new Error('Code not found'));
      mockRequest.params = { codeId: '999' };
      mockRequest.body = { code_value: 'Updated' };

      await controller.updateCode(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Code not found'
      );
    });
  });

  describe('deleteCode', () => {
    it('should delete code successfully', async () => {
      mockService.deleteCode.mockResolvedValue(undefined);
      mockRequest.params = { codeId: '1' };

      await controller.deleteCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteCode).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Code deleted successfully'
      );
    });

    it('should return 400 for invalid codeId', async () => {
      mockRequest.params = { codeId: 'invalid' };

      await controller.deleteCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteCode).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid code ID',
        400
      );
    });
  });

  // ============================================================================
  // HOSPITAL STAFF
  // ============================================================================

  describe('getStaff', () => {
    it('should return hospital staff successfully', async () => {
      const mockStaff = [
        { staff_id: 1, hospital_id: 1, staff_name: 'Dr. John', designation: 'Surgeon' }
      ];
      mockService.getStaffByHospitalId.mockResolvedValue(mockStaff as any);
      mockRequest.params = { hospitalId: '1' };

      await controller.getStaff(mockRequest as Request, mockResponse as Response);

      expect(mockService.getStaffByHospitalId).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockStaff,
        'Staff retrieved successfully'
      );
    });

    it('should return 400 for invalid hospitalId', async () => {
      mockRequest.params = { hospitalId: 'invalid' };

      await controller.getStaff(mockRequest as Request, mockResponse as Response);

      expect(mockService.getStaffByHospitalId).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });
  });

  describe('createStaff', () => {
    it('should create staff successfully', async () => {
      mockService.createStaff.mockResolvedValue(2);
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = {
        staff_name: 'Dr. Jane',
        designation: 'Cardiologist'
      };

      await controller.createStaff(mockRequest as Request, mockResponse as Response);

      expect(mockService.createStaff).toHaveBeenCalledWith(
        expect.objectContaining({
          hospital_id: 1,
          staff_name: 'Dr. Jane',
          designation: 'Cardiologist'
        }),
        '1'
      );
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { staff_id: 2 },
        'Staff created successfully',
        201
      );
    });

    it('should return 400 for invalid hospitalId', async () => {
      mockRequest.params = { hospitalId: 'invalid' };
      mockRequest.body = { staff_name: 'Dr. Jane' };

      await controller.createStaff(mockRequest as Request, mockResponse as Response);

      expect(mockService.createStaff).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });

    it('should return 404 when hospital not found', async () => {
      mockService.createStaff.mockRejectedValue(new Error('Hospital not found'));
      mockRequest.params = { hospitalId: '999' };
      mockRequest.body = { staff_name: 'Dr. Jane' };

      await controller.createStaff(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Hospital not found'
      );
    });
  });

  describe('updateStaff', () => {
    it('should update staff successfully', async () => {
      mockService.updateStaff.mockResolvedValue(undefined);
      mockRequest.params = { staffId: '1' };
      mockRequest.body = { staff_name: 'Dr. Updated' };

      await controller.updateStaff(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateStaff).toHaveBeenCalledWith(1, mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Staff updated successfully'
      );
    });

    it('should return 400 for invalid staffId', async () => {
      mockRequest.params = { staffId: 'invalid' };
      mockRequest.body = { staff_name: 'Updated' };

      await controller.updateStaff(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateStaff).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid staff ID',
        400
      );
    });

    it('should return 404 when staff not found', async () => {
      mockService.updateStaff.mockRejectedValue(new Error('Staff not found'));
      mockRequest.params = { staffId: '999' };
      mockRequest.body = { staff_name: 'Updated' };

      await controller.updateStaff(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Staff not found'
      );
    });
  });

  describe('deleteStaff', () => {
    it('should delete staff successfully', async () => {
      mockService.deleteStaff.mockResolvedValue(undefined);
      mockRequest.params = { staffId: '1' };

      await controller.deleteStaff(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteStaff).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Staff deleted successfully'
      );
    });

    it('should return 400 for invalid staffId', async () => {
      mockRequest.params = { staffId: 'invalid' };

      await controller.deleteStaff(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteStaff).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid staff ID',
        400
      );
    });
  });

  // ============================================================================
  // HOSPITAL CONTACTS
  // ============================================================================

  describe('getContacts', () => {
    it('should return hospital contacts successfully', async () => {
      const mockContacts = [
        { contact_id: 1, hospital_id: 1, contact_type: 'email', contact_value: 'info@hospital.com' }
      ];
      mockService.getContactsByStaffId.mockResolvedValue(mockContacts as any);
      mockRequest.params = { staffId: '1' };

      await controller.getContacts(mockRequest as Request, mockResponse as Response);

      expect(mockService.getContactsByStaffId).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockContacts,
        'Contacts retrieved successfully'
      );
    });

    it('should return 400 for invalid staffId', async () => {
      mockRequest.params = { staffId: 'invalid' };

      await controller.getContacts(mockRequest as Request, mockResponse as Response);

      expect(mockService.getContactsByStaffId).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid staff ID',
        400
      );
    });
  });

  describe('createContact', () => {
    it('should create contact successfully', async () => {
      mockService.createContact.mockResolvedValue(2);
      mockRequest.params = { staffId: '1' };
      mockRequest.body = {
        contact_type: 'phone',
        contact_value: '03-12345678'
      };

      await controller.createContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.createContact).toHaveBeenCalledWith(
        expect.objectContaining({
          staff_id: 1,
          contact_type: 'phone',
          contact_value: '03-12345678'
        }),
        '1'
      );
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { contact_id: 2 },
        'Contact created successfully',
        201
      );
    });
  });

  describe('updateContact', () => {
    it('should update contact successfully', async () => {
      mockService.updateContact.mockResolvedValue(undefined);
      mockRequest.params = { contactId: '1' };
      mockRequest.body = { contact_value: 'updated@hospital.com' };

      await controller.updateContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateContact).toHaveBeenCalledWith(1, mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Contact updated successfully'
      );
    });

    it('should return 400 for invalid contactId', async () => {
      mockRequest.params = { contactId: 'invalid' };
      mockRequest.body = { contact_value: 'updated' };

      await controller.updateContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateContact).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid contact ID',
        400
      );
    });
  });

  describe('deleteContact', () => {
    it('should delete contact successfully', async () => {
      mockService.deleteContact.mockResolvedValue(undefined);
      mockRequest.params = { contactId: '1' };

      await controller.deleteContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteContact).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Contact deleted successfully'
      );
    });

    it('should return 400 for invalid contactId', async () => {
      mockRequest.params = { contactId: 'invalid' };

      await controller.deleteContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteContact).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid contact ID',
        400
      );
    });
  });

  // ============================================================================
  // HOSPITAL FEES
  // ============================================================================

  describe('getFees', () => {
    it('should return hospital fees successfully', async () => {
      const mockFees = [
        { fee_id: 1, hospital_id: 1, fee_type: 'Consultation', fee_amount: 100.00 }
      ];
      mockService.getFeesByHospitalId.mockResolvedValue(mockFees as any);
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = {};

      await controller.getFees(mockRequest as Request, mockResponse as Response);

      expect(mockService.getFeesByHospitalId).toHaveBeenCalledWith(1, {});
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockFees,
        'Fees retrieved successfully'
      );
    });

    it('should return 400 for invalid hospitalId', async () => {
      mockRequest.params = { hospitalId: 'invalid' };

      await controller.getFees(mockRequest as Request, mockResponse as Response);

      expect(mockService.getFeesByHospitalId).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });
  });

  describe('createFee', () => {
    it('should create fee successfully', async () => {
      mockService.createFee.mockResolvedValue(2);
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = {
        fee_type: 'Laboratory',
        fee_amount: 50.00
      };

      await controller.createFee(mockRequest as Request, mockResponse as Response);

      expect(mockService.createFee).toHaveBeenCalledWith(
        expect.objectContaining({
          hospital_id: 1,
          fee_type: 'Laboratory',
          fee_amount: 50.00
        }),
        '1'
      );
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { fee_id: 2 },
        'Fee created successfully',
        201
      );
    });
  });

  describe('updateFee', () => {
    it('should update fee successfully', async () => {
      mockService.updateFee.mockResolvedValue(undefined);
      mockRequest.params = { feeId: '1' };
      mockRequest.body = { fee_amount: 150.00 };

      await controller.updateFee(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateFee).toHaveBeenCalledWith(1, mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Fee updated successfully'
      );
    });

    it('should return 400 for invalid feeId', async () => {
      mockRequest.params = { feeId: 'invalid' };
      mockRequest.body = { fee_amount: 150.00 };

      await controller.updateFee(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateFee).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid fee ID',
        400
      );
    });
  });

  describe('deleteFee', () => {
    it('should delete fee successfully', async () => {
      mockService.deleteFee.mockResolvedValue(undefined);
      mockRequest.params = { feeId: '1' };

      await controller.deleteFee(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteFee).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Fee deleted successfully'
      );
    });

    it('should return 400 for invalid feeId', async () => {
      mockRequest.params = { feeId: 'invalid' };

      await controller.deleteFee(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteFee).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid fee ID',
        400
      );
    });

    it('should return 404 when fee not found', async () => {
      mockService.deleteFee.mockRejectedValue(new Error('Fee schedule not found'));
      mockRequest.params = { feeId: '999' };

      await controller.deleteFee(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Fee schedule not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.deleteFee.mockRejectedValue(new Error('Delete failed'));
      mockRequest.params = { feeId: '1' };

      await controller.deleteFee(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error deleting fee',
        500,
        'Delete failed'
      );
    });
  });

  // ============================================================================
  // ADDITIONAL VALIDATION AND EDGE CASE TESTS
  // ============================================================================

  describe('getHospitals - Additional Edge Cases', () => {
    it('should handle multiple filters combined', async () => {
      const mockResult = { hospitals: [], total: 0, page: 1, limit: 10, totalPages: 0, stats: {} };
      mockService.getHospitals.mockResolvedValue(mockResult as any);
      mockRequest.body = { 
        search: 'General', 
        hospital_type: 'Private', 
        is_panel: true,
        panel_status: 'Active',
        is_deleted: false,
        page: 2, 
        limit: 25 
      };

      await controller.getHospitals(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitals).toHaveBeenCalledWith({
        search: 'General',
        hospital_type: 'Private',
        is_panel: true,
        panel_status: 'Active',
        is_deleted: false,
        page: 2,
        limit: 25,
        sort_by: 'hospital_id',
        sort_order: 'DESC'
      });
    });

    it('should handle empty string search', async () => {
      mockService.getHospitals.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = { search: '', page: 1, limit: 10 };

      await controller.getHospitals(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitals).toHaveBeenCalledWith(
        expect.objectContaining({ search: '' })
      );
    });
  });

  describe('createHospital - Additional Validation', () => {
    it('should handle empty hospital_name', async () => {
      mockRequest.body = { hospital_name: '' };

      await controller.createHospital(mockRequest as Request, mockResponse as Response);

      expect(mockService.createHospital).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'hospital_name is required',
        400
      );
    });

    it('should handle whitespace-only hospital_name', async () => {
      mockRequest.body = { hospital_name: '   ' };

      await controller.createHospital(mockRequest as Request, mockResponse as Response);

      expect(mockService.createHospital).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'hospital_name is required',
        400
      );
    });

    it('should create hospital with minimal required fields', async () => {
      mockService.createHospital.mockResolvedValue(10);
      mockRequest.body = { hospital_name: 'City Hospital' };

      await controller.createHospital(mockRequest as Request, mockResponse as Response);

      expect(mockService.createHospital).toHaveBeenCalledWith(mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { hospital_id: 10 },
        'Hospital created successfully',
        201
      );
    });

    it('should handle validation errors with "must be" message', async () => {
      mockService.createHospital.mockRejectedValue(new Error('hospital_type must be valid'));
      mockRequest.body = { hospital_name: 'Test Hospital', hospital_type: 'Invalid' };

      await controller.createHospital(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'hospital_type must be valid',
        400
      );
    });

    it('should handle validation errors with "is required" message', async () => {
      mockService.createHospital.mockRejectedValue(new Error('hospital_code is required'));
      mockRequest.body = { hospital_name: 'Test Hospital' };

      await controller.createHospital(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'hospital_code is required',
        400
      );
    });

    it('should handle validation errors with "cannot be" message', async () => {
      mockService.createHospital.mockRejectedValue(new Error('Accreditation status cannot be null'));
      mockRequest.body = { hospital_name: 'Test Hospital' };

      await controller.createHospital(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Accreditation status cannot be null',
        400
      );
    });
  });

  describe('updateHospital - Additional Validation', () => {
    it('should handle empty hospital_id', async () => {
      mockRequest.body = { hospital_id: '', hospital_name: 'Updated Name' };

      await controller.updateHospital(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateHospital).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });

    it('should handle NaN hospital_id', async () => {
      mockRequest.body = { hospital_id: 'abc', hospital_name: 'Updated Name' };

      await controller.updateHospital(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateHospital).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });

    it('should update hospital with partial data', async () => {
      mockService.updateHospital.mockResolvedValue(undefined);
      mockRequest.body = { hospital_id: '1', hospital_name: 'Updated Name' };

      await controller.updateHospital(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateHospital).toHaveBeenCalledWith(1, expect.objectContaining({
        hospital_name: 'Updated Name'
      }), '1');
    });
  });

  describe('createAddress - Additional Validation', () => {
    it('should return 400 for missing address fields', async () => {
      mockService.createAddress.mockRejectedValue(new Error('address_line1 is required'));
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = {};

      await controller.createAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating address',
        500,
        'address_line1 is required'
      );
    });

    it('should handle missing hospital gracefully', async () => {
      mockService.createAddress.mockRejectedValue(new Error('Hospital not found'));
      mockRequest.params = { hospitalId: '999' };
      mockRequest.body = { address_line1: '123 Main St' };

      await controller.createAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Hospital not found'
      );
    });
  });

  describe('createCode - Additional Validation', () => {
    it('should handle duplicate code type for hospital', async () => {
      mockService.createCode.mockRejectedValue(new Error('Code type already exists for this hospital'));
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = { code_type: 'MOH', code_value: 'MOH123' };

      await controller.createCode(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Code type already exists for this hospital'
      );
    });

    it('should create code with valid hospital', async () => {
      mockService.createCode.mockResolvedValue(5);
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = { code_type: 'MOH', code_value: 'MOH123' };

      await controller.createCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.createCode).toHaveBeenCalledWith(
        expect.objectContaining({ hospital_id: 1, code_type: 'MOH', code_value: 'MOH123' }),
        '1'
      );
    });
  });

  describe('createStaff - Additional Validation', () => {
    it('should return 400 for empty staff_name', async () => {
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = { staff_name: '' };

      await controller.createStaff(mockRequest as Request, mockResponse as Response);

      expect(mockService.createStaff).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'staff_name is required',
        400
      );
    });

    it('should return 400 for whitespace-only staff_name', async () => {
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = { staff_name: '   ' };

      await controller.createStaff(mockRequest as Request, mockResponse as Response);

      expect(mockService.createStaff).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'staff_name is required',
        400
      );
    });

    it('should create staff with minimal fields', async () => {
      mockService.createStaff.mockResolvedValue(10);
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = { staff_name: 'Dr. Smith' };

      await controller.createStaff(mockRequest as Request, mockResponse as Response);

      expect(mockService.createStaff).toHaveBeenCalledWith(
        expect.objectContaining({ hospital_id: 1, staff_name: 'Dr. Smith' }),
        '1'
      );
    });

    it('should handle validation errors properly', async () => {
      mockService.createStaff.mockRejectedValue(new Error('designation is required'));
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = { staff_name: 'Dr. Smith' };

      await controller.createStaff(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'designation is required',
        400
      );
    });
  });

  describe('updateStaff - Additional Validation', () => {
    it('should handle empty name validation', async () => {
      mockService.updateStaff.mockRejectedValue(new Error('staff_name cannot be empty'));
      mockRequest.params = { staffId: '1' };
      mockRequest.body = { staff_name: '' };

      await controller.updateStaff(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'staff_name cannot be empty',
        400
      );
    });

    it('should handle general service errors', async () => {
      mockService.updateStaff.mockRejectedValue(new Error('Database connection failed'));
      mockRequest.params = { staffId: '1' };
      mockRequest.body = { staff_name: 'Dr. Updated' };

      await controller.updateStaff(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating staff',
        500,
        'Database connection failed'
      );
    });
  });

  describe('checkHospitalCode - Additional Tests', () => {
    it('should return available=false when code exists', async () => {
      mockService.checkHospitalCodeAvailability.mockResolvedValue(false);
      mockRequest.body = { hospital_code: 'HOSP001' };

      await controller.checkHospitalCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkHospitalCodeAvailability).toHaveBeenCalledWith('HOSP001', undefined);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { available: false },
        'Hospital code availability checked'
      );
    });

    it('should exclude current hospital when checking', async () => {
      mockService.checkHospitalCodeAvailability.mockResolvedValue(true);
      mockRequest.body = { hospital_code: 'HOSP001', exclude_hospital_id: 5 };

      await controller.checkHospitalCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkHospitalCodeAvailability).toHaveBeenCalledWith('HOSP001', 5);
    });

    it('should handle service errors', async () => {
      mockService.checkHospitalCodeAvailability.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { hospital_code: 'HOSP001' };

      await controller.checkHospitalCode(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error checking hospital code',
        500,
        'Query failed'
      );
    });
  });

  describe('getFees - Additional Tests', () => {
    it('should handle service errors', async () => {
      mockService.getFeesByHospitalId.mockRejectedValue(new Error('Query failed'));
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = {};

      await controller.getFees(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching fees',
        500,
        'Query failed'
      );
    });
  });

  describe('createFee - Additional Validation', () => {
    it('should handle missing required fee fields', async () => {
      mockService.createFee.mockRejectedValue(new Error('fee_type is required'));
      mockRequest.params = { hospitalId: '1' };
      mockRequest.body = {};

      await controller.createFee(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating fee',
        500,
        'fee_type is required'
      );
    });
  });

  describe('updateFee - Additional Tests', () => {
    it('should handle validation errors', async () => {
      mockService.updateFee.mockRejectedValue(new Error('amount must be positive'));
      mockRequest.params = { feeId: '1' };
      mockRequest.body = { amount: -100 };

      await controller.updateFee(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating fee',
        500,
        'amount must be positive'
      );
    });
  });

  describe('Edge Cases for ID Parameters', () => {
    it('should handle zero as invalid hospitalId in getAddresses', async () => {
      mockRequest.params = { hospitalId: '0' };

      await controller.getAddresses(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAddressesByHospitalId).toHaveBeenCalledWith(0);
    });

    it('should handle negative numbers as hospitalId', async () => {
      mockRequest.body = { hospital_id: -1 };

      await controller.getHospitalById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitalById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid hospital ID',
        400
      );
    });

    it('should handle very large IDs', async () => {
      mockService.getHospitalById.mockResolvedValue(null);
      mockRequest.body = { hospital_id: 999999999 };

      await controller.getHospitalById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getHospitalById).toHaveBeenCalledWith(999999999);
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Hospital not found'
      );
    });
  });
});

