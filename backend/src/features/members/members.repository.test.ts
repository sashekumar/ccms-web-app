import { MembersRepository } from './members.repository';
import { CreateMemberDto, UpdateMemberDto, MemberFilters } from './members.types';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock the database service
jest.mock('../../core/database/connection-manager');

describe('MembersRepository', () => {
  let repository: MembersRepository;
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

    repository = new MembersRepository();
  });

  describe('getMembers', () => {
    it('should return paginated members', async () => {
      const filters: MemberFilters = { page: 1, limit: 10 };
      const mockMembers = [
        { member_id: 'MEM001', full_name: 'John Doe', ic_no: '123456789012', is_deleted: false }
      ];
      const mockCount = { recordset: [{ total: 1 }] };
      const mockStats = { recordset: [{ total_members: 10, active_members: 9, deleted_members: 1 }] };
      const mockData = { recordset: mockMembers };

      mockRequest.query
        .mockResolvedValueOnce(mockCount as any)
        .mockResolvedValueOnce(mockStats as any)
        .mockResolvedValueOnce(mockData as any);

      const result = await repository.getMembers(filters);

      expect(result.data).toEqual(mockMembers);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should apply search filter', async () => {
      const filters: MemberFilters = { page: 1, limit: 10, search: 'John' };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [{ total_members: 0, active_members: 0, deleted_members: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [] } as any);

      await repository.getMembers(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('search', expect.anything(), '%John%');
    });

    it('should apply is_deleted filter', async () => {
      const filters: MemberFilters = { page: 1, limit: 10, is_deleted: false };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [{ total_members: 0, active_members: 0, deleted_members: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [] } as any);

      await repository.getMembers(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('isDeleted', expect.anything(), false);
    });

    it('should apply sorting', async () => {
      const filters: MemberFilters = { page: 1, limit: 10, sort_by: 'full_name', sort_order: 'ASC' };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [{ total_members: 0, active_members: 0, deleted_members: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [] } as any);

      await repository.getMembers(filters);

      expect(mockRequest.query).toHaveBeenCalled();
      const dataQueryCall = mockRequest.query.mock.calls[2][0]; // Third query is the data query with ORDER BY
      expect(dataQueryCall).toContain('ORDER BY full_name ASC');
    });
  });

  describe('getMemberById', () => {
    it('should return member by ID', async () => {
      const mockMember = { member_id: 'MEM001', full_name: 'John Doe', ic_no: '123456789012' };
      mockRequest.query.mockResolvedValueOnce({ recordset: [mockMember] } as any);

      const result = await repository.getMemberById('MEM001');

      expect(result).toEqual(mockMember);
      expect(mockRequest.input).toHaveBeenCalledWith('memberId', expect.anything(), 'MEM001');
    });

    it('should return null when member not found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] } as any);

      const result = await repository.getMemberById('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('checkICExists', () => {
    it('should return true when ic_no exists', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 1 }] } as any);

      const result = await repository.checkICExists('123456789012');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('icNo', expect.anything(), '123456789012');
    });

    it('should return false when ic_no does not exist', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] } as any);

      const result = await repository.checkICExists('NONEXISTENT');

      expect(result).toBe(false);
    });

    it('should exclude current member when updating', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] } as any);

      const result = await repository.checkICExists('123456789012', 'MEM001');

      expect(result).toBe(false);
      expect(mockRequest.input).toHaveBeenCalledWith('icNo', expect.anything(), '123456789012');
      expect(mockRequest.input).toHaveBeenCalledWith('memberId', expect.anything(), 'MEM001');
    });
  });

  describe('createMember', () => {
    const validDto: CreateMemberDto = {
      full_name: 'John Doe',
      ic_no: '123456789012'
    };

    it('should create member successfully', async () => {
      const mockResult = { recordset: [{ member_id: 123 }] };
      mockRequest.query.mockResolvedValueOnce(mockResult as any);

      const result = await repository.createMember(validDto, 'admin');

      expect(result).toBe('123');
      expect(mockRequest.input).toHaveBeenCalledWith('fullName', expect.anything(), 'John Doe');
      expect(mockRequest.input).toHaveBeenCalledWith('icNo', expect.anything(), '123456789012');
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', expect.anything(), 'admin');
    });
  });

  describe('updateMember', () => {
    const validDto: UpdateMemberDto = {
      full_name: 'Jane Doe'
    };

    it('should update member successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] } as any);

      const result = await repository.updateMember('MEM001', validDto, 'admin');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('memberId', expect.anything(), 'MEM001');
      expect(mockRequest.input).toHaveBeenCalledWith('fullName', expect.anything(), 'Jane Doe');
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', expect.anything(), 'admin');
    });
  });

  describe('setMemberDeletedStatus', () => {
    it('should set member deleted status successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] } as any);

      const result = await repository.setMemberDeletedStatus('MEM001', true);

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('memberId', expect.anything(), 'MEM001');
      expect(mockRequest.input).toHaveBeenCalledWith('isDeleted', expect.anything(), true);
    });

    it('should handle restoring deleted member', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] } as any);

      const result = await repository.setMemberDeletedStatus('MEM001', false);

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('memberId', expect.anything(), 'MEM001');
      expect(mockRequest.input).toHaveBeenCalledWith('isDeleted', expect.anything(), false);
    });
  });
});
