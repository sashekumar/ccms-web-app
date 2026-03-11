import { MemberPoliciesRepository } from './member-policies.repository';
import { CreateMemberPolicyDto, UpdateMemberPolicyDto } from './member-policies.types';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock the database service
jest.mock('../../core/database/connection-manager');

describe('MemberPoliciesRepository', () => {
  let repository: MemberPoliciesRepository;
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

    repository = new MemberPoliciesRepository();
  });

  describe('getPoliciesByMemberId', () => {
    it('should return array of policies for a member', async () => {
      const mockPolicies = [
        {
          policy_record_id: '1',
          member_id: '100',
          product_id: '10',
          policy_no: 'POL001',
          effective_date: new Date('2024-01-01'),
          expiry_date: new Date('2024-12-31'),
          status: 'ACTIVE',
          is_deleted: false
        },
        {
          policy_record_id: '2',
          member_id: '100',
          product_id: '11',
          policy_no: 'POL002',
          effective_date: new Date('2023-01-01'),
          expiry_date: new Date('2023-12-31'),
          status: 'EXPIRED',
          is_deleted: false
        }
      ];

      mockRequest.query.mockResolvedValueOnce({ recordset: mockPolicies });

      const result = await repository.getPoliciesByMemberId('100');

      expect(result).toEqual(mockPolicies);
      expect(mockRequest.input).toHaveBeenCalledWith('member_id', sql.BigInt, '100');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE member_id = @member_id'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('is_deleted = 0'));
    });

    it('should return empty array when no policies found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getPoliciesByMemberId('999');

      expect(result).toEqual([]);
      expect(mockRequest.input).toHaveBeenCalledWith('member_id', sql.BigInt, '999');
    });

    it('should order by effective_date DESC and policy_record_id DESC', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await repository.getPoliciesByMemberId('100');

      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY effective_date DESC, policy_record_id DESC')
      );
    });

    it('should exclude deleted policies', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await repository.getPoliciesByMemberId('100');

      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('is_deleted = 0'));
    });
  });

  describe('getPolicyById', () => {
    it('should return policy when found', async () => {
      const mockPolicy = {
        policy_record_id: '1',
        member_id: '100',
        product_id: '10',
        policy_no: 'POL001',
        effective_date: new Date('2024-01-01'),
        status: 'ACTIVE',
        is_deleted: false
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [mockPolicy] });

      const result = await repository.getPolicyById('1');

      expect(result).toEqual(mockPolicy);
      expect(mockRequest.input).toHaveBeenCalledWith('policy_record_id', sql.BigInt, '1');
    });

    it('should return null when policy not found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getPolicyById('999');

      expect(result).toBeNull();
    });
  });

  describe('createPolicy', () => {
    it('should create policy with all fields', async () => {
      const dto: CreateMemberPolicyDto = {
        member_id: '100',
        product_id: '10',
        policy_no: 'POL001',
        effective_date: new Date('2024-01-01'),
        expiry_date: new Date('2024-12-31'),
        status: 'ACTIVE'
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ policy_record_id: '1' }] });

      const result = await repository.createPolicy(dto, 'admin');

      expect(result).toBe('1');
      expect(mockRequest.input).toHaveBeenCalledWith('member_id', sql.BigInt, '100');
      expect(mockRequest.input).toHaveBeenCalledWith('product_id', sql.BigInt, '10');
      expect(mockRequest.input).toHaveBeenCalledWith('policy_no', sql.VarChar(100), 'POL001');
      expect(mockRequest.input).toHaveBeenCalledWith('effective_date', sql.Date, dto.effective_date);
      expect(mockRequest.input).toHaveBeenCalledWith('expiry_date', sql.Date, dto.expiry_date);
      expect(mockRequest.input).toHaveBeenCalledWith('status', sql.VarChar(50), 'ACTIVE');
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('SELECT CAST(SCOPE_IDENTITY() AS VARCHAR)'));
    });

    it('should create policy without createdBy', async () => {
      const dto: CreateMemberPolicyDto = {
        member_id: '100',
        product_id: '10',
        policy_no: 'POL002'
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ policy_record_id: '2' }] });

      const result = await repository.createPolicy(dto);

      expect(result).toBe('2');
      expect(mockRequest.input).toHaveBeenCalledWith('member_id', sql.BigInt, '100');
      expect(mockRequest.input).toHaveBeenCalledWith('product_id', sql.BigInt, '10');
      expect(mockRequest.input).toHaveBeenCalledWith('policy_no', sql.VarChar(100), 'POL002');
      expect(mockRequest.input).not.toHaveBeenCalledWith('createdBy', expect.anything(), expect.anything());
    });

    it('should handle null values for optional fields', async () => {
      const dto: CreateMemberPolicyDto = {
        member_id: '100',
        product_id: '10',
        policy_no: 'POL003',
        effective_date: undefined,
        expiry_date: undefined,
        status: undefined
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ policy_record_id: '3' }] });

      await repository.createPolicy(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('effective_date', sql.Date, null);
      expect(mockRequest.input).toHaveBeenCalledWith('expiry_date', sql.Date, null);
      expect(mockRequest.input).toHaveBeenCalledWith('status', sql.VarChar(50), null);
    });

    it('should set is_deleted to 0 by default', async () => {
      const dto: CreateMemberPolicyDto = {
        member_id: '100',
        product_id: '10',
        policy_no: 'POL004'
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ policy_record_id: '4' }] });

      await repository.createPolicy(dto, 'admin');

      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('is_deleted'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('0'));
    });
  });

  describe('updatePolicy', () => {
    it('should update policy with all fields', async () => {
      const dto: UpdateMemberPolicyDto = {
        policy_record_id: '1',
        product_id: '15',
        policy_no: 'POL999',
        effective_date: new Date('2024-02-01'),
        expiry_date: new Date('2025-01-31'),
        status: 'SUSPENDED'
      };

      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const result = await repository.updatePolicy('1', dto, 'admin');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('product_id', sql.BigInt, '15');
      expect(mockRequest.input).toHaveBeenCalledWith('policy_no', sql.VarChar(100), 'POL999');
      expect(mockRequest.input).toHaveBeenCalledWith('effective_date', sql.Date, dto.effective_date);
      expect(mockRequest.input).toHaveBeenCalledWith('expiry_date', sql.Date, dto.expiry_date);
      expect(mockRequest.input).toHaveBeenCalledWith('status', sql.VarChar(50), 'SUSPENDED');
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).toHaveBeenCalledWith('policy_record_id', sql.BigInt, '1');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('updated_at = GETDATE()'));
    });

    it('should return false when no fields to update', async () => {
      const dto: UpdateMemberPolicyDto = { policy_record_id: '1' };

      const result = await repository.updatePolicy('1', dto);

      expect(result).toBe(false);
      expect(mockRequest.query).not.toHaveBeenCalled();
    });

    it('should update only specified fields', async () => {
      const dto: UpdateMemberPolicyDto = {
        policy_record_id: '1',
        status: 'CANCELLED'
      };

      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const result = await repository.updatePolicy('1', dto, 'admin');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('status', sql.VarChar(50), 'CANCELLED');
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).not.toHaveBeenCalledWith('product_id', expect.anything(), expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('policy_no', expect.anything(), expect.anything());
    });

    it('should return false when no rows affected', async () => {
      const dto: UpdateMemberPolicyDto = {
        policy_record_id: '999',
        status: 'ACTIVE'
      };

      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [0] });

      const result = await repository.updatePolicy('999', dto);

      expect(result).toBe(false);
    });

    it('should update without updatedBy', async () => {
      const dto: UpdateMemberPolicyDto = {
        policy_record_id: '1',
        status: 'ACTIVE'
      };

      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const result = await repository.updatePolicy('1', dto);

      expect(result).toBe(true);
      expect(mockRequest.input).not.toHaveBeenCalledWith('updatedBy', expect.anything(), expect.anything());
    });
  });

  describe('deletePolicy', () => {
    it('should soft delete policy successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const result = await repository.deletePolicy('1');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('policy_record_id', sql.BigInt, '1');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('SET is_deleted = 1'));
      expect(mockRequest.query).not.toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
    });

    it('should return false when no rows affected', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [0] });

      const result = await repository.deletePolicy('999');

      expect(result).toBe(false);
    });

    it('should use correct SQL parameters', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.deletePolicy('5');

      expect(mockRequest.input).toHaveBeenCalledWith('policy_record_id', sql.BigInt, '5');
    });
  });

  describe('checkPolicyNoExists', () => {
    it('should return true when policy number exists', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 1 }] });

      const result = await repository.checkPolicyNoExists('POL001');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('policy_no', sql.VarChar(100), 'POL001');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE policy_no = @policy_no'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('is_deleted = 0'));
    });

    it('should return false when policy number does not exist', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] });

      const result = await repository.checkPolicyNoExists('NONEXISTENT');

      expect(result).toBe(false);
    });

    it('should exclude specific policy record when provided', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] });

      const result = await repository.checkPolicyNoExists('POL001', '1');

      expect(result).toBe(false);
      expect(mockRequest.input).toHaveBeenCalledWith('policy_no', sql.VarChar(100), 'POL001');
      expect(mockRequest.input).toHaveBeenCalledWith('exclude_id', sql.BigInt, '1');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('policy_record_id != @exclude_id'));
    });

    it('should check only non-deleted policies', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] });

      await repository.checkPolicyNoExists('POL002');

      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('is_deleted = 0'));
    });

    it('should handle multiple policies with same number (deleted vs active)', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 1 }] });

      const result = await repository.checkPolicyNoExists('POL003');

      expect(result).toBe(true);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('COUNT(*)'));
    });
  });
});
