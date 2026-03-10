import { AuthRepository } from './auth.repository';
import { database } from '../../core/database/database.service';
import { User } from './auth.types';

// Mock the database service
jest.mock('../../core/database/database.service', () => ({
  database: {
    findOne: jest.fn(),
    executeQuery: jest.fn(),
    findById: jest.fn(),
  }
}));

describe('AuthRepository', () => {
  let authRepository: AuthRepository;
  
  const mockUser: User = {
    user_id: 1,
    username: 'testuser',
    password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5kosgVu/vg3F6',
    full_name: 'Test User',
    is_active: true,
    last_login: new Date('2024-01-01')
  };

  const mockRoles = [
    { role_id: 1, role_name: 'Super Admin', role_code: 'SUPER_ADMIN' },
    { role_id: 2, role_name: 'Admin', role_code: 'ADMIN' }
  ];

  beforeEach(() => {
    authRepository = new AuthRepository();
    jest.clearAllMocks();
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      (database.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await authRepository.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(database.findOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        { username: 'testuser' }
      );
      expect(database.findOne).toHaveBeenCalledWith(
        expect.stringContaining('FROM ccms_users'),
        expect.any(Object)
      );
    });

    it('should return null when user not found', async () => {
      (database.findOne as jest.Mock).mockResolvedValue(null);

      const result = await authRepository.findByUsername('nonexistent');

      expect(result).toBeNull();
      expect(database.findOne).toHaveBeenCalledWith(
        expect.any(String),
        { username: 'nonexistent' }
      );
    });

    it('should query with correct fields', async () => {
      (database.findOne as jest.Mock).mockResolvedValue(mockUser);

      await authRepository.findByUsername('testuser');

      const queryCall = (database.findOne as jest.Mock).mock.calls[0][0];
      expect(queryCall).toContain('user_id');
      expect(queryCall).toContain('username');
      expect(queryCall).toContain('password_hash');
      expect(queryCall).toContain('full_name');
      expect(queryCall).toContain('is_active');
      expect(queryCall).toContain('last_login');
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      (database.findOne as jest.Mock).mockRejectedValue(dbError);

      await expect(authRepository.findByUsername('testuser')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      (database.executeQuery as jest.Mock).mockResolvedValue({ rowsAffected: [1] });

      await authRepository.updateLastLogin(1);

      expect(database.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ccms_users'),
        { userId: 1 }
      );
      expect(database.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SET last_login = GETDATE()'),
        expect.any(Object)
      );
    });

    it('should use correct userId parameter', async () => {
      (database.executeQuery as jest.Mock).mockResolvedValue({ rowsAffected: [1] });

      await authRepository.updateLastLogin(123);

      expect(database.executeQuery).toHaveBeenCalledWith(
        expect.any(String),
        { userId: 123 }
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Update failed');
      (database.executeQuery as jest.Mock).mockRejectedValue(dbError);

      await expect(authRepository.updateLastLogin(1)).rejects.toThrow('Update failed');
    });
  });

  describe('getUserRoles', () => {
    it('should get active roles for user', async () => {
      (database.executeQuery as jest.Mock).mockResolvedValue({
        recordset: mockRoles
      });

      const result = await authRepository.getUserRoles(1);

      expect(result).toEqual(mockRoles);
      expect(database.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        { userId: 1 }
      );
    });

    it('should join with roles and user_roles tables', async () => {
      (database.executeQuery as jest.Mock).mockResolvedValue({
        recordset: mockRoles
      });

      await authRepository.getUserRoles(1);

      const queryCall = (database.executeQuery as jest.Mock).mock.calls[0][0];
      expect(queryCall).toContain('ccms_acl_user_roles');
      expect(queryCall).toContain('ccms_acl_roles');
      expect(queryCall).toContain('INNER JOIN');
    });

    it('should filter by active roles only', async () => {
      (database.executeQuery as jest.Mock).mockResolvedValue({
        recordset: mockRoles
      });

      await authRepository.getUserRoles(1);

      const queryCall = (database.executeQuery as jest.Mock).mock.calls[0][0];
      expect(queryCall).toContain('ur.is_active = 1');
      expect(queryCall).toContain('r.is_active = 1');
    });

    it('should check expiration date', async () => {
      (database.executeQuery as jest.Mock).mockResolvedValue({
        recordset: mockRoles
      });

      await authRepository.getUserRoles(1);

      const queryCall = (database.executeQuery as jest.Mock).mock.calls[0][0];
      expect(queryCall).toContain('expires_at');
      expect(queryCall).toContain('GETDATE()');
    });

    it('should return empty array when user has no roles', async () => {
      (database.executeQuery as jest.Mock).mockResolvedValue({
        recordset: []
      });

      const result = await authRepository.getUserRoles(1);

      expect(result).toEqual([]);
    });

    it('should return empty array when recordset is null', async () => {
      (database.executeQuery as jest.Mock).mockResolvedValue({
        recordset: null
      });

      const result = await authRepository.getUserRoles(1);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Query failed');
      (database.executeQuery as jest.Mock).mockRejectedValue(dbError);

      await expect(authRepository.getUserRoles(1)).rejects.toThrow('Query failed');
    });
  });

  describe('Constructor', () => {
    it('should initialize with correct table name', () => {
      expect(authRepository['tableName']).toBe('ccms_users');
    });

    it('should initialize with correct primary key', () => {
      expect(authRepository['primaryKey']).toBe('user_id');
    });

    it('should initialize without soft delete', () => {
      expect(authRepository['useSoftDelete']).toBe(false);
    });
  });
});
