import { DatabaseService, database } from './database.service';
import { connectionManager } from './connection-manager';

// Mock dependencies
jest.mock('./connection-manager');
jest.mock('../utils/logger.util', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockPool: any;
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request object
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
    };

    // Mock pool
    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest),
    };

    // Mock connectionManager.getPool
    (connectionManager.getPool as jest.Mock).mockResolvedValue(mockPool);

    service = new DatabaseService();
  });

  describe('executeQuery', () => {
    it('should execute query without parameters', async () => {
      const mockResult = { recordset: [{ id: 1 }], rowsAffected: [1] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await service.executeQuery('SELECT * FROM users');

      expect(connectionManager.getPool).toHaveBeenCalled();
      expect(mockPool.request).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalledWith('SELECT * FROM users');
      expect(result).toEqual(mockResult);
    });

    it('should execute query with parameters', async () => {
      const mockResult = { recordset: [{ id: 1, name: 'Test' }], rowsAffected: [1] };
      mockRequest.query.mockResolvedValue(mockResult);

      const parameters = {
        id: 1,
        name: 'Test',
        status: 'active',
      };

      const result = await service.executeQuery('SELECT * FROM users WHERE id = @id', parameters);

      expect(mockRequest.input).toHaveBeenCalledWith('id', 1);
      expect(mockRequest.input).toHaveBeenCalledWith('name', 'Test');
      expect(mockRequest.input).toHaveBeenCalledWith('status', 'active');
      expect(mockRequest.query).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should handle query execution errors', async () => {
      const error = new Error('Query failed');
      mockRequest.query.mockRejectedValue(error);

      await expect(
        service.executeQuery('SELECT * FROM invalid_table')
      ).rejects.toThrow('Query failed');
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      (connectionManager.getPool as jest.Mock).mockRejectedValue(error);

      await expect(
        service.executeQuery('SELECT * FROM users')
      ).rejects.toThrow('Connection failed');
    });

    it('should return rowsAffected for UPDATE queries', async () => {
      const mockResult = { recordset: [], rowsAffected: [5] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await service.executeQuery('UPDATE users SET status = @status', {
        status: 'inactive',
      });

      expect(result.rowsAffected).toEqual([5]);
    });
  });

  describe('findOne', () => {
    it('should return single record when found', async () => {
      const mockRecord = { id: 1, name: 'Test User' };
      const mockResult = { recordset: [mockRecord], rowsAffected: [1] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await service.findOne('SELECT * FROM users WHERE id = @id', { id: 1 });

      expect(result).toEqual(mockRecord);
    });

    it('should return null when no record found', async () => {
      const mockResult = { recordset: [], rowsAffected: [0] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await service.findOne('SELECT * FROM users WHERE id = @id', { id: 999 });

      expect(result).toBeNull();
    });

    it('should return first record when multiple found', async () => {
      const mockRecords = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
      ];
      const mockResult = { recordset: mockRecords, rowsAffected: [2] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await service.findOne('SELECT * FROM users');

      expect(result).toEqual(mockRecords[0]);
    });

    it('should handle errors', async () => {
      mockRequest.query.mockRejectedValue(new Error('Database error'));

      await expect(
        service.findOne('SELECT * FROM users WHERE id = @id', { id: 1 })
      ).rejects.toThrow('Database error');
    });
  });

  describe('findMany', () => {
    it('should return array of records', async () => {
      const mockRecords = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
        { id: 3, name: 'User 3' },
      ];
      const mockResult = { recordset: mockRecords, rowsAffected: [3] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await service.findMany('SELECT * FROM users');

      expect(result).toEqual(mockRecords);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no records found', async () => {
      const mockResult = { recordset: [], rowsAffected: [0] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await service.findMany('SELECT * FROM users WHERE status = @status', {
        status: 'deleted',
      });

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should filter with parameters', async () => {
      const mockRecords = [{ id: 1, name: 'Active User', status: 'active' }];
      const mockResult = { recordset: mockRecords, rowsAffected: [1] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await service.findMany('SELECT * FROM users WHERE status = @status', {
        status: 'active',
      });

      expect(mockRequest.input).toHaveBeenCalledWith('status', 'active');
      expect(result).toEqual(mockRecords);
    });

    it('should handle errors', async () => {
      mockRequest.query.mockRejectedValue(new Error('Database error'));

      await expect(
        service.findMany('SELECT * FROM invalid_table')
      ).rejects.toThrow('Database error');
    });
  });

  describe('database export', () => {
    it('should export singleton instance', () => {
      expect(database).toBeInstanceOf(DatabaseService);
    });
  });
});
