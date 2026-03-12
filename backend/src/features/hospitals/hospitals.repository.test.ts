import { HospitalsRepository } from './hospitals.repository';
import { CreateHospitalDto, UpdateHospitalDto, HospitalFilters } from './hospitals.types';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock the database service
jest.mock('../../core/database/connection-manager');

describe('HospitalsRepository', () => {
  let repository: HospitalsRepository;
  let mockPool: any;
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock request
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn()
    };

    // Create mock pool
    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest)
    };

    // Mock connectionManager
    (connectionManager.getPool as jest.Mock).mockResolvedValue(mockPool);

    repository = new HospitalsRepository();
  });

  describe('getHospitals', () => {
    it('should return paginated hospitals', async () => {
      const filters: HospitalFilters = { page: 1, limit: 10 };
      const mockHospitals = [
        { hospital_id: 1, hospital_name: 'Test Hospital', hospital_code: 'HSP001', is_panel: true, is_deleted: false }
      ];
      const mockCount = [{ total: 1 }];

      mockRequest.query
        .mockResolvedValueOnce({ recordset: mockCount } as any)
        .mockResolvedValueOnce({ recordset: mockHospitals } as any)
        .mockResolvedValueOnce({ recordset: [{ total: 1, panel: 1, nonPanel: 0, active: 1, inactive: 0 }] } as any);

      const result = await repository.getHospitals(filters);

      expect(result.hospitals).toEqual(mockHospitals);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should apply search filter', async () => {
      const filters: HospitalFilters = { page: 1, limit: 10, search: 'Test' };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [] } as any)
        .mockResolvedValueOnce({ recordset: [{ total: 0, panel: 0, nonPanel: 0, active: 0, inactive: 0 }] } as any);

      await repository.getHospitals(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('search', sql.NVarChar(255), '%Test%');
      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
    });

    it('should apply hospital_type filter', async () => {
      const filters: HospitalFilters = { page: 1, limit: 10, hospital_type: 'Private' };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [] } as any)
        .mockResolvedValueOnce({ recordset: [{ total: 0, panel: 0, nonPanel: 0, active: 0, inactive: 0 }] } as any);

      await repository.getHospitals(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('hospitalType', sql.VarChar(50), 'Private');
      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
    });

    it('should apply is_panel filter', async () => {
      const filters: HospitalFilters = { page: 1, limit: 10, is_panel: true };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [] } as any)
        .mockResolvedValueOnce({ recordset: [{ total: 0, panel: 0, nonPanel: 0, active: 0, inactive: 0 }] } as any);

      await repository.getHospitals(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('isPanel', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
    });

    it('should apply sorting', async () => {
      const filters: HospitalFilters = { page: 1, limit: 10, sort_by: 'hospital_name', sort_order: 'ASC' };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [] } as any)
        .mockResolvedValueOnce({ recordset: [{ total: 0, panel: 0, nonPanel: 0, active: 0, inactive: 0 }] } as any);

      const result = await repository.getHospitals(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
      expect(result).toBeDefined();
    });
  });

  describe('getHospitalById', () => {
    it('should return hospital by ID', async () => {
      const mockHospital = { hospital_id: 1, hospital_name: 'Test Hospital', hospital_code: 'HSP001' };
      mockRequest.query.mockResolvedValueOnce({ recordset: [mockHospital] } as any);

      const result = await repository.getHospitalById(1);

      expect(result).toEqual(mockHospital);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 1);
    });

    it('should return null when hospital not found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] } as any);

      const result = await repository.getHospitalById(999);

      expect(result).toBeNull();
    });
  });

  describe('checkHospitalCodeExists', () => {
    it('should return true when hospital_code exists', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 1 }] } as any);

      const result = await repository.hospitalCodeExists('HSP001');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalCode', sql.VarChar(50), 'HSP001');
    });

    it('should return false when hospital_code does not exist', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] } as any);

      const result = await repository.hospitalCodeExists('NONEXISTENT');

      expect(result).toBe(false);
    });

    it('should exclude current hospital when updating', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] } as any);

      const result = await repository.hospitalCodeExists('HSP001', 1);

      expect(result).toBe(false);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalCode', sql.VarChar(50), 'HSP001');
      expect(mockRequest.input).toHaveBeenCalledWith('excludeHospitalId', sql.BigInt, 1);
    });
  });

  describe('createHospital', () => {
    const validDto: CreateHospitalDto = {
      hospital_name: 'Test Hospital',
      hospital_code: 'HSP001',
      is_panel: true
    };

    it('should create hospital successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ hospital_id: 1 }] } as any);

      const result = await repository.createHospital(
        validDto.hospital_name,
        validDto.hospital_code,
        validDto.hospital_type,
        validDto.reg_no,
        validDto.bank_id,
        validDto.bank_acc_no,
        validDto.is_panel ?? true,
        validDto.panel_status,
        validDto.panel_effective_date,
        validDto.accreditation_status,
        validDto.accreditation_expiry,
        false,  // is_deleted
        'admin'
      );

      expect(result).toBe(1);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalName', sql.NVarChar(255), 'Test Hospital');
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalCode', sql.VarChar(50), 'HSP001');
      expect(mockRequest.input).toHaveBeenCalledWith('isPanel', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('isDeleted', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
    });
  });

  describe('updateHospital', () => {
    const validDto: UpdateHospitalDto = {
      hospital_name: 'Updated Hospital Name'
    };

    it('should update hospital successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] } as any);

      await repository.updateHospital(
        1,
        validDto.hospital_name,
        validDto.hospital_code,
        validDto.hospital_type,
        validDto.reg_no,
        validDto.bank_id,
        validDto.bank_acc_no,
        validDto.is_panel,
        validDto.panel_status,
        validDto.panel_effective_date,
        validDto.accreditation_status,
        validDto.accreditation_expiry,
        validDto.is_deleted,
        'admin'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('hospitalName', sql.NVarChar(255), 'Updated Hospital Name');
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 1);
    });
  });

  describe('deleteHospital', () => {
    it('should delete hospital successfully (soft delete)', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] } as any);

      await repository.deleteHospital(1);

      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalled();
    });
  });
});
