import { MemberDependentsRepository } from './member-dependents.repository';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';
import { CreateMemberDependentDto, UpdateMemberDependentDto } from './member-dependents.types';

// Mock dependencies
jest.mock('../../core/database/connection-manager');
jest.mock('mssql', () => ({
  BigInt: 'BigInt',
  NVarChar: jest.fn(),
  VarChar: jest.fn(),
  Int: 'Int',
  Date: 'Date',
  Bit: 'Bit',
}));

describe('MemberDependentsRepository', () => {
  let repository: MemberDependentsRepository;
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
    repository = new MemberDependentsRepository();
  });

  describe('getDependentsByMemberId', () => {
    it('should return array of dependents for a member', async () => {
      const mockDependents = [
        {
          dependent_id: '1',
          legacy_dependent_id: null,
          principal_member_id: '100',
          full_name: 'John Doe Jr',
          ic_no: '123456789012',
          relationship_id: 1,
          dob: new Date('2010-05-15'),
          is_active: true,
        },
        {
          dependent_id: '2',
          legacy_dependent_id: null,
          principal_member_id: '100',
          full_name: 'Jane Doe',
          ic_no: '987654321098',
          relationship_id: 2,
          dob: new Date('2012-08-20'),
          is_active: true,
        },
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockDependents });

      const result = await repository.getDependentsByMemberId('100');

      expect(result).toEqual(mockDependents);
      expect(mockRequest.input).toHaveBeenCalledWith('principal_member_id', sql.BigInt, '100');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE d.principal_member_id = @principal_member_id'));
    });

    it('should return empty array when no dependents found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.getDependentsByMemberId('999');

      expect(result).toEqual([]);
    });

    it('should order dependents by is_active DESC, dependent_id ASC', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.getDependentsByMemberId('100');

      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY d.is_active DESC, d.dependent_id ASC'));
    });
  });

  describe('getDependentById', () => {
    it('should return dependent when found', async () => {
      const mockDependent = {
        dependent_id: '1',
        legacy_dependent_id: null,
        principal_member_id: '100',
        full_name: 'John Doe Jr',
        ic_no: '123456789012',
        relationship_id: 1,
        dob: new Date('2010-05-15'),
        is_active: true,
      };

      mockRequest.query.mockResolvedValue({ recordset: [mockDependent] });

      const result = await repository.getDependentById('1');

      expect(result).toEqual(mockDependent);
      expect(mockRequest.input).toHaveBeenCalledWith('dependent_id', sql.BigInt, '1');
    });

    it('should return null when dependent not found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.getDependentById('999');

      expect(result).toBeNull();
    });
  });

  describe('createDependent', () => {
    it('should create dependent with all fields and return ID', async () => {
      const newDependentId = '123';
      mockRequest.query.mockResolvedValue({ recordset: [{ dependent_id: newDependentId }] });

      const dto: CreateMemberDependentDto = {
        principal_member_id: '100',
        full_name: 'John Doe Jr',
        ic_no: '123456789012',
        relationship_id: 1,
        dob: new Date('2010-05-15'),
        is_active: true,
      };

      const result = await repository.createDependent(dto, 'test-user');

      expect(result).toBe(newDependentId);
      expect(mockRequest.input).toHaveBeenCalledWith('principal_member_id', sql.BigInt, '100');
      expect(mockRequest.input).toHaveBeenCalledWith('full_name', undefined, 'John Doe Jr');
      expect(mockRequest.input).toHaveBeenCalledWith('ic_no', undefined, '123456789012');
      expect(mockRequest.input).toHaveBeenCalledWith('relationship_id', sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith('dob', sql.Date, dto.dob);
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', undefined, 'test-user');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'));
    });

    it('should create dependent without optional fields', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ dependent_id: '124' }] });

      const dto: CreateMemberDependentDto = {
        principal_member_id: '100',
        full_name: 'Jane Doe',
      };

      const result = await repository.createDependent(dto);

      expect(result).toBe('124');
      expect(mockRequest.input).toHaveBeenCalledWith('ic_no', undefined, null);
      expect(mockRequest.input).toHaveBeenCalledWith('relationship_id', sql.Int, null);
      expect(mockRequest.input).toHaveBeenCalledWith('dob', sql.Date, null);
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, true); // default value
    });

    it('should default is_active to true when not provided', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ dependent_id: '125' }] });

      const dto: CreateMemberDependentDto = {
        principal_member_id: '100',
        full_name: 'Test Dependent',
      };

      await repository.createDependent(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, true);
    });

    it('should allow is_active to be set to false', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ dependent_id: '126' }] });

      const dto: CreateMemberDependentDto = {
        principal_member_id: '100',
        full_name: 'Inactive Dependent',
        is_active: false,
      };

      await repository.createDependent(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, false);
    });
  });

  describe('updateDependent', () => {
    it('should update all fields when provided', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const dto: UpdateMemberDependentDto = {
        dependent_id: '1',
        full_name: 'Updated Name',
        ic_no: '999999999999',
        relationship_id: 2,
        dob: new Date('2011-06-20'),
        is_active: false,
      };

      const result = await repository.updateDependent('1', dto, 'test-user');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('dependent_id', sql.BigInt, '1');
      expect(mockRequest.input).toHaveBeenCalledWith('full_name', undefined, 'Updated Name');
      expect(mockRequest.input).toHaveBeenCalledWith('ic_no', undefined, '999999999999');
      expect(mockRequest.input).toHaveBeenCalledWith('relationship_id', sql.Int, 2);
      expect(mockRequest.input).toHaveBeenCalledWith('dob', sql.Date, dto.dob);
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', undefined, 'test-user');
    });

    it('should update only specific fields when provided', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const dto: UpdateMemberDependentDto = {
        dependent_id: '1',
        full_name: 'New Name Only',
      };

      await repository.updateDependent('1', dto);

      expect(mockRequest.input).toHaveBeenCalledWith('full_name', undefined, 'New Name Only');
      expect(mockRequest.input).not.toHaveBeenCalledWith('ic_no', expect.anything(), expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('relationship_id', expect.anything(), expect.anything());
    });

    it('should return false when no fields to update', async () => {
      const dto: UpdateMemberDependentDto = {
        dependent_id: '1',
      };

      const result = await repository.updateDependent('1', dto);

      expect(result).toBe(false);
    });

    it('should handle failed update', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const dto: UpdateMemberDependentDto = {
        dependent_id: '999',
        full_name: 'Updated Name',
      };

      const result = await repository.updateDependent('999', dto);

      expect(result).toBe(false);
    });
  });

  describe('deleteDependent', () => {
    it('should delete dependent successfully', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const result = await repository.deleteDependent('1');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('dependent_id', sql.BigInt, '1');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
    });

    it('should return false when dependent not found', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const result = await repository.deleteDependent('999');

      expect(result).toBe(false);
    });
  });

  describe('setDependentActiveStatus', () => {
    it('should set dependent to active', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const result = await repository.setDependentActiveStatus('1', true);

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('dependent_id', sql.BigInt, '1');
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, true);
    });

    it('should set dependent to inactive', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const result = await repository.setDependentActiveStatus('1', false);

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, false);
    });

    it('should return false when dependent not found', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const result = await repository.setDependentActiveStatus('999', true);

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockRequest.query.mockRejectedValue(dbError);

      await expect(repository.getDependentsByMemberId('100')).rejects.toThrow('Database connection failed');
    });

    it('should handle SQL injection attempts safely', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ dependent_id: '123' }] });

      const dto: CreateMemberDependentDto = {
        principal_member_id: '100',
        full_name: "'; DROP TABLE member_dependents; --",
      };

      await repository.createDependent(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('full_name', undefined, "'; DROP TABLE member_dependents; --");
    });
  });

  describe('edge cases', () => {
    it('should handle very long names', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ dependent_id: '127' }] });

      const longName = 'A'.repeat(250);
      const dto: CreateMemberDependentDto = {
        principal_member_id: '100',
        full_name: longName,
      };

      await repository.createDependent(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('full_name', undefined, longName);
    });

    it('should handle special characters in names', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ dependent_id: '128' }] });

      const specialName = "O'Brien-Smith (Jr.)";
      const dto: CreateMemberDependentDto = {
        principal_member_id: '100',
        full_name: specialName,
      };

      await repository.createDependent(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('full_name', undefined, specialName);
    });

    it('should handle date boundaries', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ dependent_id: '129' }] });

      const futureDate = new Date('2025-12-31');
      const dto: CreateMemberDependentDto = {
        principal_member_id: '100',
        full_name: 'Test Dependent',
        dob: futureDate,
      };

      await repository.createDependent(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('dob', sql.Date, futureDate);
    });
  });
});
