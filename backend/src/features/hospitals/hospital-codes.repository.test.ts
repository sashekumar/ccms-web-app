import { HospitalCodesRepository } from './hospital-codes.repository';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock dependencies
jest.mock('../../core/database/connection-manager');
jest.mock('mssql', () => ({
  BigInt: 'BigInt',
  VarChar: jest.fn(),
  Bit: 'Bit',
}));

describe('HospitalCodesRepository', () => {
  let repository: HospitalCodesRepository;
  let mockPool: any;
  let mockRequest: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock request with proper MSSQL pattern
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
    };

    // Create mock pool
    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest),
    };

    // Setup connectionManager mock
    (connectionManager.getPool as jest.Mock).mockResolvedValue(mockPool);

    // Create repository instance
    repository = new HospitalCodesRepository();
  });

  describe('getCodesByHospitalId', () => {
    it('should return array of codes for a hospital', async () => {
      const mockCodes = [
        {
          code_id: 1,
          legacy_hospital_code_id: null,
          hospital_id: 100,
          code_type: 'EXTERNAL_ID',
          code_value: 'EXT123',
          is_active: true,
        },
        {
          code_id: 2,
          legacy_hospital_code_id: null,
          hospital_id: 100,
          code_type: 'PANEL_CODE',
          code_value: 'PNL456',
          is_active: true,
        },
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockCodes });

      const result = await repository.getCodesByHospitalId(100);

      expect(result).toEqual(mockCodes);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 100);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE hospital_id = @hospitalId'));
    });

    it('should return empty array when no codes found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.getCodesByHospitalId(999);

      expect(result).toEqual([]);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 999);
    });

    it('should order codes by code_type', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.getCodesByHospitalId(100);

      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY code_type ASC'));
    });
  });

  describe('getCodeById', () => {
    it('should return code when found', async () => {
      const mockCode = {
        code_id: 1,
        legacy_hospital_code_id: null,
        hospital_id: 100,
        code_type: 'EXTERNAL_ID',
        code_value: 'EXT123',
        is_active: true,
      };

      mockRequest.query.mockResolvedValue({ recordset: [mockCode] });

      const result = await repository.getCodeById(1);

      expect(result).toEqual(mockCode);
      expect(mockPool.request).toHaveBeenCalled();
    });

    it('should return null when code not found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.getCodeById(999);

      expect(result).toBeNull();
    });
  });

  describe('codeTypeExists', () => {
    it('should return true when code type exists for hospital', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ count: 1 }] });

      const result = await repository.codeTypeExists(100, 'EXTERNAL_ID');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 100);
      expect(mockRequest.input).toHaveBeenCalledWith('codeType', undefined, 'EXTERNAL_ID');
    });

    it('should return false when code type does not exist', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ count: 0 }] });

      const result = await repository.codeTypeExists(100, 'NONEXISTENT');

      expect(result).toBe(false);
    });

    it('should exclude specific code ID when provided', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ count: 0 }] });

      const result = await repository.codeTypeExists(100, 'EXTERNAL_ID', 5);

      expect(result).toBe(false);
      expect(mockRequest.input).toHaveBeenCalledWith('excludeCodeId', sql.BigInt, 5);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('code_id != @excludeCodeId'));
    });

    it('should not add exclusion clause when excludeCodeId is not provided', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ count: 0 }] });

      await repository.codeTypeExists(100, 'EXTERNAL_ID');

      expect(mockRequest.input).not.toHaveBeenCalledWith('excludeCodeId', expect.anything(), expect.anything());
    });
  });

  describe('createCode', () => {
    it('should create code with all fields and return ID', async () => {
      const newCodeId = 123;
      mockRequest.query.mockResolvedValue({ recordset: [{ code_id: newCodeId }] });

      const result = await repository.createCode(
        100,
        'EXTERNAL_ID',
        'EXT123',
        true,
        'test-user'
      );

      expect(result).toBe(newCodeId);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 100);
      expect(mockRequest.input).toHaveBeenCalledWith('codeType', undefined, 'EXTERNAL_ID');
      expect(mockRequest.input).toHaveBeenCalledWith('codeValue', undefined, 'EXT123');
      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', undefined, 'test-user');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('OUTPUT INSERTED.code_id'));
    });

    it('should create code without optional code_value', async () => {
      const newCodeId = 124;
      mockRequest.query.mockResolvedValue({ recordset: [{ code_id: newCodeId }] });

      const result = await repository.createCode(
        100,
        'EXTERNAL_ID',
        undefined,
        true,
        'test-user'
      );

      expect(result).toBe(newCodeId);
      expect(mockRequest.input).not.toHaveBeenCalledWith('codeValue', expect.anything(), expect.anything());
    });

    it('should handle inactive code creation', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ code_id: 125 }] });

      await repository.createCode(
        100,
        'PANEL_CODE',
        'PNL789',
        false,
        'test-user'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, false);
    });
  });

  describe('updateCode', () => {
    it('should update all fields when provided', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.updateCode(
        1,
        'EXTERNAL_ID',
        'EXT999',
        false,
        'test-user'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('codeId', sql.BigInt, 1);
      expect(mockRequest.input).toHaveBeenCalledWith('codeType', undefined, 'EXTERNAL_ID');
      expect(mockRequest.input).toHaveBeenCalledWith('codeValue', undefined, 'EXT999');
      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', undefined, 'test-user');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('code_type = @codeType'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('code_value = @codeValue'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('is_active = @isActive'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('updated_at = GETDATE()'));
    });

    it('should update only codeType when other fields are undefined', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.updateCode(
        1,
        'PANEL_CODE',
        undefined,
        undefined,
        'test-user'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('codeType', undefined, 'PANEL_CODE');
      expect(mockRequest.input).not.toHaveBeenCalledWith('codeValue', expect.anything(), expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('isActive', expect.anything(), expect.anything());
    });

    it('should return early when no fields to update', async () => {
      await repository.updateCode(
        1,
        undefined,
        undefined,
        undefined,
        'test-user'
      );

      expect(mockRequest.query).not.toHaveBeenCalled();
    });

    it('should set codeValue to null when empty string provided', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.updateCode(
        1,
        undefined,
        '',
        undefined,
        'test-user'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('codeValue', undefined, null);
    });
  });

  describe('deleteCode', () => {
    it('should delete code successfully', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.deleteCode(1);

      expect(mockRequest.input).toHaveBeenCalledWith('codeId', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE code_id = @codeId'));
    });

    it('should handle deletion of non-existent code', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      // Should not throw error
      await expect(repository.deleteCode(999)).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockRequest.query.mockRejectedValue(dbError);

      await expect(repository.getCodesByHospitalId(100)).rejects.toThrow('Database connection failed');
    });

    it('should handle SQL injection attempts safely', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ count: 0 }] });

      // SQL injection attempt should be parameterized
      await repository.codeTypeExists(100, "'; DROP TABLE hospitals; --");

      expect(mockRequest.input).toHaveBeenCalledWith('codeType', undefined, "'; DROP TABLE hospitals; --");
      expect(mockRequest.query).toHaveBeenCalledWith(expect.not.stringContaining('DROP TABLE'));
    });
  });
});
