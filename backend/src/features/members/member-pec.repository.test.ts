import { MemberPECRepository } from './member-pec.repository';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';
import { CreateMemberPECDto, UpdateMemberPECDto } from './member-pec.types';

// Mock dependencies
jest.mock('../../core/database/connection-manager');
jest.mock('mssql', () => ({
  BigInt: 'BigInt',
  VarChar: jest.fn(),
  NVarChar: jest.fn(),
  Date: 'Date',
  Bit: 'Bit',
  MAX: 'MAX',
}));

describe('MemberPECRepository', () => {
  let repository: MemberPECRepository;
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
    repository = new MemberPECRepository();
  });

  describe('getPECsByDependentId', () => {
    it('should return array of PEC conditions for a dependent', async () => {
      const mockPECs = [
        {
          pec_id: '1',
          legacy_pec_id: null,
          dependent_id: '100',
          condition_code: 'E11',
          condition_name: 'Type 2 diabetes mellitus',
          diagnosis_date: new Date('2020-01-15'),
          is_excluded: true,
          notes: 'Diagnosed 2020',
        },
        {
          pec_id: '2',
          legacy_pec_id: null,
          dependent_id: '100',
          condition_code: 'I10',
          condition_name: 'Essential hypertension',
          diagnosis_date: new Date('2019-06-20'),
          is_excluded: false,
          notes: null,
        },
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockPECs });

      const result = await repository.getPECsByDependentId('100');

      expect(result).toEqual(mockPECs);
      expect(mockRequest.input).toHaveBeenCalledWith('dependent_id', sql.BigInt, '100');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE dependent_id = @dependent_id'));
    });

    it('should return empty array when no PEC conditions found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.getPECsByDependentId('999');

      expect(result).toEqual([]);
    });

    it('should order PECs by diagnosis_date DESC, pec_id DESC', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.getPECsByDependentId('100');

      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY diagnosis_date DESC, pec_id DESC'));
    });
  });

  describe('getPECById', () => {
    it('should return PEC condition when found', async () => {
      const mockPEC = {
        pec_id: '1',
        legacy_pec_id: null,
        dependent_id: '100',
        condition_code: 'E11',
        condition_name: 'Type 2 diabetes mellitus',
        diagnosis_date: new Date('2020-01-15'),
        is_excluded: true,
        notes: 'Diagnosed 2020',
      };

      mockRequest.query.mockResolvedValue({ recordset: [mockPEC] });

      const result = await repository.getPECById('1');

      expect(result).toEqual(mockPEC);
      expect(mockRequest.input).toHaveBeenCalledWith('pec_id', sql.BigInt, '1');
    });

    it('should return null when PEC condition not found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.getPECById('999');

      expect(result).toBeNull();
    });
  });

  describe('createPEC', () => {
    it('should create PEC condition with all fields and return ID', async () => {
      const newPECId = '123';
      mockRequest.query.mockResolvedValue({ recordset: [{ pec_id: newPECId }] });

      const dto: CreateMemberPECDto = {
        dependent_id: '100',
        condition_code: 'E11',
        condition_name: 'Type 2 diabetes mellitus',
        diagnosis_date: new Date('2020-01-15'),
        is_excluded: true,
        notes: 'Pre-existing condition',
      };

      const result = await repository.createPEC(dto, 'test-user');

      expect(result).toBe(newPECId);
      expect(mockRequest.input).toHaveBeenCalledWith('dependent_id', sql.BigInt, '100');
      expect(mockRequest.input).toHaveBeenCalledWith('condition_code', undefined, 'E11');
      expect(mockRequest.input).toHaveBeenCalledWith('condition_name', undefined, 'Type 2 diabetes mellitus');
      expect(mockRequest.input).toHaveBeenCalledWith('diagnosis_date', sql.Date, dto.diagnosis_date);
      expect(mockRequest.input).toHaveBeenCalledWith('is_excluded', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('notes', undefined, 'Pre-existing condition');
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', undefined, 'test-user');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'));
    });

    it('should create PEC condition without optional fields', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ pec_id: '124' }] });

      const dto: CreateMemberPECDto = {
        dependent_id: '100',
      };

      const result = await repository.createPEC(dto);

      expect(result).toBe('124');
      expect(mockRequest.input).toHaveBeenCalledWith('condition_code', undefined, null);
      expect(mockRequest.input).toHaveBeenCalledWith('condition_name', undefined, null);
      expect(mockRequest.input).toHaveBeenCalledWith('diagnosis_date', sql.Date, null);
      expect(mockRequest.input).toHaveBeenCalledWith('is_excluded', sql.Bit, true); // default value
      expect(mockRequest.input).toHaveBeenCalledWith('notes', undefined, null);
    });

    it('should default is_excluded to true when not provided', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ pec_id: '125' }] });

      const dto: CreateMemberPECDto = {
        dependent_id: '100',
        condition_name: 'Test Condition',
      };

      await repository.createPEC(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('is_excluded', sql.Bit, true);
    });

    it('should allow is_excluded to be set to false', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ pec_id: '126' }] });

      const dto: CreateMemberPECDto = {
        dependent_id: '100',
        condition_name: 'Test Condition',
        is_excluded: false,
      };

      await repository.createPEC(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('is_excluded', sql.Bit, false);
    });
  });

  describe('updatePEC', () => {
    it('should update all fields when provided', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const dto: UpdateMemberPECDto = {
        pec_id: '1',
        condition_code: 'I10',
        condition_name: 'Essential hypertension',
        diagnosis_date: new Date('2021-03-10'),
        is_excluded: false,
        notes: 'Updated notes',
      };

      const result = await repository.updatePEC('1', dto, 'test-user');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('pec_id', sql.BigInt, '1');
      expect(mockRequest.input).toHaveBeenCalledWith('condition_code', undefined, 'I10');
      expect(mockRequest.input).toHaveBeenCalledWith('condition_name', undefined, 'Essential hypertension');
      expect(mockRequest.input).toHaveBeenCalledWith('diagnosis_date', sql.Date, dto.diagnosis_date);
      expect(mockRequest.input).toHaveBeenCalledWith('is_excluded', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('notes', undefined, 'Updated notes');
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', undefined, 'test-user');
    });

    it('should update only specific fields when provided', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const dto: UpdateMemberPECDto = {
        pec_id: '1',
        condition_name: 'New Condition Name',
      };

      await repository.updatePEC('1', dto);

      expect(mockRequest.input).toHaveBeenCalledWith('condition_name', undefined, 'New Condition Name');
      expect(mockRequest.input).not.toHaveBeenCalledWith('condition_code', expect.anything(), expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('diagnosis_date', expect.anything(), expect.anything());
    });

    it('should return false when no fields to update', async () => {
      const dto: UpdateMemberPECDto = {
        pec_id: '1',
      };

      const result = await repository.updatePEC('1', dto);

      expect(result).toBe(false);
    });

    it('should handle failed update', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const dto: UpdateMemberPECDto = {
        pec_id: '999',
        condition_name: 'Updated Name',
      };

      const result = await repository.updatePEC('999', dto);

      expect(result).toBe(false);
    });

    it('should handle empty string for notes field', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const dto: UpdateMemberPECDto = {
        pec_id: '1',
        notes: '',
      };

      await repository.updatePEC('1', dto);

      expect(mockRequest.input).toHaveBeenCalledWith('notes', undefined, '');
    });
  });

  describe('deletePEC', () => {
    it('should delete PEC condition successfully', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const result = await repository.deletePEC('1');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('pec_id', sql.BigInt, '1');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
    });

    it('should return false when PEC condition not found', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const result = await repository.deletePEC('999');

      expect(result).toBe(false);
    });
  });

  describe('setPECExcludedStatus', () => {
    it('should set PEC condition to excluded', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const result = await repository.setPECExcludedStatus('1', true);

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('pec_id', sql.BigInt, '1');
      expect(mockRequest.input).toHaveBeenCalledWith('is_excluded', sql.Bit, true);
    });

    it('should set PEC condition to not excluded', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const result = await repository.setPECExcludedStatus('1', false);

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('is_excluded', sql.Bit, false);
    });

    it('should return false when PEC condition not found', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const result = await repository.setPECExcludedStatus('999', true);

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockRequest.query.mockRejectedValue(dbError);

      await expect(repository.getPECsByDependentId('100')).rejects.toThrow('Database connection failed');
    });

    it('should handle SQL injection attempts safely', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ pec_id: '123' }] });

      const dto: CreateMemberPECDto = {
        dependent_id: '100',
        condition_code: "'; DROP TABLE member_pec_conditions; --",
      };

      await repository.createPEC(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('condition_code', undefined, "'; DROP TABLE member_pec_conditions; --");
    });
  });

  describe('edge cases', () => {
    it('should handle very long condition names', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ pec_id: '127' }] });

      const longName = 'A'.repeat(250);
      const dto: CreateMemberPECDto = {
        dependent_id: '100',
        condition_name: longName,
      };

      await repository.createPEC(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('condition_name', undefined, longName);
    });

    it('should handle very long notes', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ pec_id: '128' }] });

      const longNotes = 'This is a very long note. '.repeat(100);
      const dto: CreateMemberPECDto = {
        dependent_id: '100',
        condition_name: 'Test Condition',
        notes: longNotes,
      };

      await repository.createPEC(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('notes', undefined, longNotes);
    });

    it('should handle special characters in condition codes', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ pec_id: '129' }] });

      const specialCode = "E11.9-A";
      const dto: CreateMemberPECDto = {
        dependent_id: '100',
        condition_code: specialCode,
      };

      await repository.createPEC(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('condition_code', undefined, specialCode);
    });

    it('should handle date boundaries', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ pec_id: '130' }] });

      const oldDate = new Date('1950-01-01');
      const dto: CreateMemberPECDto = {
        dependent_id: '100',
        condition_name: 'Old Condition',
        diagnosis_date: oldDate,
      };

      await repository.createPEC(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('diagnosis_date', sql.Date, oldDate);
    });
  });
});
