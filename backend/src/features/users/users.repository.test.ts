import { UsersRepository } from './users.repository';
import { UserFilters } from './users.types';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock the database service
jest.mock('../../core/database/connection-manager');

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let mockPool: any;
  let mockRequest: any;

  beforeEach(() => {
    // Reset all mocks
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

    repository = new UsersRepository();
  });

  describe('Constructor', () => {
    it('should initialize with correct table name', () => {
      expect(repository['tableName']).toBe('ccms_users');
    });

    it('should initialize with correct primary key', () => {
      expect(repository['primaryKey']).toBe('user_id');
    });

    it('should initialize without soft delete', () => {
      expect(repository['useSoftDelete']).toBe(false);
    });
  });

  describe('getUsers', () => {
    it('should get paginated users with default filters', async () => {
      const mockCountResult = { recordset: [{ total: 20 }] };
      const mockUsersResult = {
        recordset: [
          {
            user_id: 1,
            username: 'testuser',
            full_name: 'Test User',
            is_active: true,
            last_login: new Date(),
            role_id: 1,
            role_name: 'Admin',
            role_code: 'ADMIN'
          }
        ]
      };

      mockRequest.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockUsersResult);

      const filters: UserFilters = {};
      const result = await repository.getUsers(filters);

      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(20);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(2);
      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
    });

    it('should apply search filter', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 5 }] })
        .mockResolvedValueOnce({ recordset: [] });

      const filters: UserFilters = { search: 'john' };
      await repository.getUsers(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('search', sql.NVarChar(200), '%john%');
    });

    it('should apply isActive filter', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 10 }] })
        .mockResolvedValueOnce({ recordset: [] });

      const filters: UserFilters = { isActive: true };
      await repository.getUsers(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
    });

    it('should apply roleId filter', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 3 }] })
        .mockResolvedValueOnce({ recordset: [] });

      const filters: UserFilters = { roleId: 2 };
      await repository.getUsers(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('roleId', sql.BigInt, 2);
    });

    it('should support custom pagination', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 100 }] })
        .mockResolvedValueOnce({ recordset: [] });

      const filters: UserFilters = { page: 3, limit: 20 };
      await repository.getUsers(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 40);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 20);
    });

    it('should support custom sorting', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 10 }] })
        .mockResolvedValueOnce({ recordset: [] });

      const filters: UserFilters = { sortBy: 'username', sortOrder: 'ASC' };
      const result = await repository.getUsers(filters);

      // Verify query contains ORDER BY clause
      const queryCall = mockRequest.query.mock.calls[1][0];
      expect(queryCall).toContain('ORDER BY u.username ASC');
    });

    it('should group roles by user', async () => {
      const mockUsersResult = {
        recordset: [
          {
            user_id: 1,
            username: 'testuser',
            full_name: 'Test User',
            is_active: true,
            last_login: null,
            role_id: 1,
            role_name: 'Admin',
            role_code: 'ADMIN'
          },
          {
            user_id: 1,
            username: 'testuser',
            full_name: 'Test User',
            is_active: true,
            last_login: null,
            role_id: 2,
            role_name: 'Manager',
            role_code: 'MANAGER'
          }
        ]
      };

      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 1 }] })
        .mockResolvedValueOnce(mockUsersResult);

      const result = await repository.getUsers({});

      expect(result.users).toHaveLength(1);
      expect(result.users[0].roles).toHaveLength(2);
      expect(result.users[0].roles[0].role_code).toBe('ADMIN');
      expect(result.users[0].roles[1].role_code).toBe('MANAGER');
    });

    it('should handle users without roles', async () => {
      const mockUsersResult = {
        recordset: [
          {
            user_id: 1,
            username: 'testuser',
            full_name: 'Test User',
            is_active: true,
            last_login: null,
            role_id: null,
            role_name: null,
            role_code: null
          }
        ]
      };

      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 1 }] })
        .mockResolvedValueOnce(mockUsersResult);

      const result = await repository.getUsers({});

      expect(result.users).toHaveLength(1);
      expect(result.users[0].roles).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockRequest.query.mockRejectedValue(new Error('Database error'));

      await expect(repository.getUsers({})).rejects.toThrow('Database error');
    });
  });

  describe('getUserById', () => {
    it('should get user by ID with roles', async () => {
      const mockResult = {
        recordset: [
          {
            user_id: 1,
            username: 'testuser',
            full_name: 'Test User',
            is_active: true,
            last_login: new Date(),
            role_id: 1,
            role_name: 'Admin',
            role_code: 'ADMIN',
            assigned_at: new Date(),
            assigned_by: 'system',
            expires_at: null
          }
        ]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await repository.getUserById(1);

      expect(result).not.toBeNull();
      expect(result!.user.user_id).toBe(1);
      expect(result!.user.username).toBe('testuser');
      expect(result!.roles).toHaveLength(1);
      expect(result!.roles[0].role_code).toBe('ADMIN');
      expect(mockRequest.input).toHaveBeenCalledWith('userId', sql.BigInt, 1);
    });

    it('should return null when user not found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.getUserById(999);

      expect(result).toBeNull();
    });

    it('should get user without roles', async () => {
      const mockResult = {
        recordset: [
          {
            user_id: 1,
            username: 'testuser',
            full_name: 'Test User',
            is_active: true,
            last_login: null,
            role_id: null,
            role_name: null,
            role_code: null,
            assigned_at: null,
            assigned_by: null,
            expires_at: null
          }
        ]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await repository.getUserById(1);

      expect(result).not.toBeNull();
      expect(result!.roles).toHaveLength(0);
    });

    it('should group multiple roles for user', async () => {
      const mockResult = {
        recordset: [
          {
            user_id: 1,
            username: 'testuser',
            full_name: 'Test User',
            is_active: true,
            last_login: null,
            role_id: 1,
            role_name: 'Admin',
            role_code: 'ADMIN',
            assigned_at: new Date('2024-01-01'),
            assigned_by: 'system',
            expires_at: null
          },
          {
            user_id: 1,
            username: 'testuser',
            full_name: 'Test User',
            is_active: true,
            last_login: null,
            role_id: 2,
            role_name: 'Manager',
            role_code: 'MANAGER',
            assigned_at: new Date('2024-01-02'),
            assigned_by: 'admin',
            expires_at: new Date('2025-01-01')
          }
        ]
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await repository.getUserById(1);

      expect(result!.roles).toHaveLength(2);
      expect(result!.roles[0].role_code).toBe('ADMIN');
      expect(result!.roles[1].role_code).toBe('MANAGER');
      expect(result!.roles[1].expires_at).toEqual(new Date('2025-01-01'));
    });

    it('should handle database errors', async () => {
      mockRequest.query.mockRejectedValue(new Error('Database error'));

      await expect(repository.getUserById(1)).rejects.toThrow('Database error');
    });
  });

  describe('usernameExists', () => {
    it('should return true when username exists', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ count: 1 }] });

      const result = await repository.usernameExists('existinguser');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('username', sql.VarChar(50), 'existinguser');
    });

    it('should return false when username does not exist', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ count: 0 }] });

      const result = await repository.usernameExists('newuser');

      expect(result).toBe(false);
    });

    it('should exclude user ID when provided', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ count: 0 }] });

      await repository.usernameExists('testuser', 5);

      expect(mockRequest.input).toHaveBeenCalledWith('username', sql.VarChar(50), 'testuser');
      expect(mockRequest.input).toHaveBeenCalledWith('excludeUserId', sql.BigInt, 5);
    });

    it('should not add exclude clause when excludeUserId is not provided', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ count: 1 }] });

      await repository.usernameExists('testuser');

      const inputCalls = mockRequest.input.mock.calls;
      const excludeUserIdCall = inputCalls.find((call: any) => call[0] === 'excludeUserId');
      expect(excludeUserIdCall).toBeUndefined();
    });

    it('should handle database errors', async () => {
      mockRequest.query.mockRejectedValue(new Error('Database error'));

      await expect(repository.usernameExists('testuser')).rejects.toThrow('Database error');
    });
  });
});
