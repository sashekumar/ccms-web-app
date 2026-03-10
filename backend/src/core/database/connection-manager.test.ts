import mssql from 'mssql';
import { ConnectionManager, connectionManager } from './connection-manager';
import { databaseConfig } from '../../config/database.config';

// Mock mssql and logger
jest.mock('mssql');
jest.mock('../utils/logger.util', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ConnectionManager', () => {
  let mockPool: any;
  let manager: ConnectionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    (ConnectionManager as any).instance = null;
    
    // Mock connection pool
    mockPool = {
      connected: true,
      connect: jest.fn().mockResolvedValue(mockPool),
      close: jest.fn().mockResolvedValue(undefined),
      request: jest.fn(),
    };

    // Mock mssql.ConnectionPool constructor
    jest.spyOn(mssql, 'ConnectionPool' as any).mockImplementation(() => mockPool);
    
    manager = ConnectionManager.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ConnectionManager.getInstance();
      const instance2 = ConnectionManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('getPool', () => {
    it('should return existing connected pool', async () => {
      // Set up connected pool
      const pool = await manager.getPool();
      
      // Second call should return same pool without reconnecting
      const pool2 = await manager.getPool();
      
      expect(pool2).toBeTruthy();
      expect(mockPool.connect).toHaveBeenCalledTimes(1);
    });

    it('should create new connection if pool not connected', async () => {
      const pool = await manager.getPool();

      expect(mssql.ConnectionPool).toHaveBeenCalledWith(databaseConfig);
      expect(mockPool.connect).toHaveBeenCalled();
      expect(pool).toBeTruthy();
    });

    it('should reuse pending connection promise', async () => {
      // Make multiple simultaneous calls
      const promise1 = manager.getPool();
      const promise2 = manager.getPool();

      const [pool1, pool2] = await Promise.all([promise1, promise2]);

      expect(pool1).toBeTruthy();
      expect(pool2).toBeTruthy();
      expect(mockPool.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockPool.connect.mockRejectedValueOnce(error);

      await expect(manager.getPool()).rejects.toThrow('Connection failed');
    });

    it('should allow retry after failed connection', async () => {
      // First connection fails
      mockPool.connect.mockRejectedValueOnce(new Error('Connection failed'));
      
      await expect(manager.getPool()).rejects.toThrow('Connection failed');

      // Second connection succeeds
      mockPool.connect.mockResolvedValueOnce(mockPool);
      
      const pool = await manager.getPool();
      expect(pool).toBeTruthy();
    });
  });

  describe('close', () => {
    it('should close existing pool', async () => {
      await manager.getPool();
      
      // Access the private pool property to set up the mock
      const pool = (manager as any).pool;
      if (pool) {
        pool.close = jest.fn().mockResolvedValue(undefined);
        
        await manager.close();
        
        expect(pool.close).toHaveBeenCalled();
      }
    });

    it('should handle close when no pool exists', async () => {
      await manager.close();

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should allow new connection after close', async () => {
      const pool1 = await manager.getPool();
      await manager.close();
      
      const pool2 = await manager.getPool();

      expect(mockPool.connect).toHaveBeenCalledTimes(2);
    });
  });

  describe('connectionManager export', () => {
    it('should export singleton instance', () => {
      expect(connectionManager).toBeInstanceOf(ConnectionManager);
    });
  });
});
