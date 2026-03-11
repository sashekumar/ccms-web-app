import { BaseRepository, QueryOptions } from './base.repository';
import { connectionManager } from '../database/connection-manager';
import sql from 'mssql';

// Mock the database connection
jest.mock('../database/connection-manager');

// Test entity interface
interface TestEntity {
  id: number;
  name: string;
  is_active: boolean;
  created_at: Date;
  created_by: string | null;
  updated_at: Date | null;
  updated_by: string | null;
  is_deleted?: boolean;
}

// Test repository implementation
class TestRepository extends BaseRepository<TestEntity> {
  constructor(tableName: string = 'test_table', primaryKey: string = 'id', useSoftDelete: boolean = false) {
    super(tableName, primaryKey, useSoftDelete);
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let mockPool: any;
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock request
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
      execute: jest.fn()
    };

    // Create mock pool
    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest)
    };

    // Mock connectionManager
    (connectionManager.getPool as jest.Mock).mockResolvedValue(mockPool);

    repository = new TestRepository();
  });

  describe('Constructor', () => {
    it('should initialize with provided table name', () => {
      const repo = new TestRepository('custom_table');
      expect(repo['tableName']).toBe('custom_table');
    });

    it('should initialize with provided primary key', () => {
      const repo = new TestRepository('test_table', 'custom_id');
      expect(repo['primaryKey']).toBe('custom_id');
    });

    it('should initialize with soft delete option', () => {
      const repo = new TestRepository('test_table', 'id', true);
      expect(repo['useSoftDelete']).toBe(true);
    });

    it('should use default values', () => {
      const repo = new TestRepository();
      expect(repo['tableName']).toBe('test_table');
      expect(repo['primaryKey']).toBe('id');
      expect(repo['useSoftDelete']).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should retrieve all records without options', async () => {
      const mockData = [{ id: 1, name: 'Test' }, { id: 2, name: 'Test2' }];
      mockRequest.query.mockResolvedValue({ recordset: mockData });

      const result = await repository.findAll();

      expect(result).toEqual(mockData);
      expect(mockRequest.query).toHaveBeenCalled();
    });

    it('should apply soft delete filter when enabled', async () => {
      const softDeleteRepo = new TestRepository('test_table', 'id', true);
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await softDeleteRepo.findAll();

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('is_deleted = 0');
    });

    it('should apply filters', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.findAll({ filters: { is_active: true, name: 'Test' } });

      expect(mockRequest.input).toHaveBeenCalledWith('is_active', true);
      expect(mockRequest.input).toHaveBeenCalledWith('name', 'Test');
    });

    it('should skip null/undefined filter values', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.findAll({ filters: { name: 'Test', other: null, another: undefined, empty: '' } });

      expect(mockRequest.input).toHaveBeenCalledWith('name', 'Test');
      expect(mockRequest.input).not.toHaveBeenCalledWith('other', expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('another', expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('empty', expect.anything());
    });

    it('should apply custom sorting', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.findAll({ sort_by: 'name', sort_order: 'ASC' });

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('ORDER BY name ASC');
    });

    it('should use default sorting', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.findAll();

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('ORDER BY id DESC');
    });

    it('should apply pagination', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.findAll({ page: 2, limit: 10 });

      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 10);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
      
      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY');
    });

    it('should not apply pagination when not provided', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.findAll();

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).not.toContain('OFFSET');
    });

    it('should combine filters, sorting, and pagination', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.findAll({
        filters: { is_active: true },
        sort_by: 'name',
        sort_order: 'ASC',
        page: 3,
        limit: 20
      });

      expect(mockRequest.input).toHaveBeenCalledWith('is_active', true);
      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 40);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 20);
      
      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('ORDER BY name ASC');
    });
  });

  describe('findById', () => {
    it('should find record by ID', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockRequest.query.mockResolvedValue({ recordset: [mockData] });

      const result = await repository.findById(1);

      expect(result).toEqual(mockData);
      expect(mockRequest.input).toHaveBeenCalledWith('id', 1);
    });

    it('should return null when record not found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it('should apply soft delete filter when enabled', async () => {
      const softDeleteRepo = new TestRepository('test_table', 'id', true);
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await softDeleteRepo.findById(1);

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('is_deleted = 0');
    });

    it('should work with string IDs', async () => {
      const mockData = { id: 'abc123', name: 'Test' };
      mockRequest.query.mockResolvedValue({ recordset: [mockData] });

      const result = await repository.findById('abc123');

      expect(result).toEqual(mockData);
      expect(mockRequest.input).toHaveBeenCalledWith('id', 'abc123');
    });
  });

  describe('findOne', () => {
    it('should find record by conditions', async () => {
      const mockData = { id: 1, name: 'Test', is_active: true };
      mockRequest.query.mockResolvedValue({ recordset: [mockData] });

      const result = await repository.findOne({ name: 'Test', is_active: true });

      expect(result).toEqual(mockData);
      expect(mockRequest.input).toHaveBeenCalledWith('name', 'Test');
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', true);
    });

    it('should return null when no match found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.findOne({ name: 'NonExistent' });

      expect(result).toBeNull();
    });

    it('should apply soft delete filter when enabled', async () => {
      const softDeleteRepo = new TestRepository('test_table', 'id', true);
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await softDeleteRepo.findOne({ name: 'Test' });

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('is_deleted = 0');
    });

    it('should use TOP 1 to get single record', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.findOne({ name: 'Test' });

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('TOP 1');
    });
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const mockData = { id: 1, name: 'Test', is_active: true };
      mockRequest.query.mockResolvedValue({ recordset: [mockData] });

      const result = await repository.create({ name: 'Test', is_active: true });

      expect(result).toEqual(mockData);
      expect(mockRequest.input).toHaveBeenCalledWith('name', 'Test');
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', true);
    });

    it('should add created_by when provided', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ id: 1 }] });

      await repository.create({ name: 'Test' }, 'admin');

      expect(mockRequest.input).toHaveBeenCalledWith('created_by', sql.VarChar(50), 'admin');
      
      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('created_by');
    });

    it('should add created_at automatically', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ id: 1 }] });

      await repository.create({ name: 'Test' });

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('created_at');
      expect(queryCall).toContain('GETDATE()');
    });

    it('should add is_deleted = 0 for soft delete', async () => {
      const softDeleteRepo = new TestRepository('test_table', 'id', true);
      mockRequest.query.mockResolvedValue({ recordset: [{ id: 1 }] });

      await softDeleteRepo.create({ name: 'Test' });

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('is_deleted');
    });

    it('should use OUTPUT INSERTED', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ id: 1 }] });

      await repository.create({ name: 'Test' });

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('OUTPUT INSERTED');
    });
  });

  describe('update', () => {
    it('should update a record', async () => {
      const mockData = { id: 1, name: 'Updated', is_active: false };
      mockRequest.query.mockResolvedValue({ recordset: [mockData] });

      const result = await repository.update(1, { name: 'Updated', is_active: false });

      expect(result).toEqual(mockData);
      expect(mockRequest.input).toHaveBeenCalledWith('name', 'Updated');
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', false);
      expect(mockRequest.input).toHaveBeenCalledWith('id', 1);
    });

    it('should add updated_by when provided', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ id: 1 }] });

      await repository.update(1, { name: 'Updated' }, 'admin');

      expect(mockRequest.input).toHaveBeenCalledWith('updated_by', sql.VarChar(50), 'admin');
      
      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('updated_by = @updated_by');
    });

    it('should add updated_at automatically', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ id: 1 }] });

      await repository.update(1, { name: 'Updated' });

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('updated_at = GETDATE()');
    });

    it('should apply soft delete filter in WHERE clause', async () => {
      const softDeleteRepo = new TestRepository('test_table', 'id', true);
      mockRequest.query.mockResolvedValue({ recordset: [{ id: 1 }] });

      await softDeleteRepo.update(1, { name: 'Updated' });

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('is_deleted = 0');
    });

    it('should use OUTPUT INSERTED', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ id: 1 }] });

      await repository.update(1, { name: 'Updated' });

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('OUTPUT INSERTED');
    });
  });

  describe('delete', () => {
    it('should perform hard delete when soft delete disabled', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.delete(1);

      expect(mockRequest.input).toHaveBeenCalledWith('id', 1);
      
      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('DELETE FROM test_table');
    });

    it('should perform soft delete when enabled', async () => {
      const softDeleteRepo = new TestRepository('test_table', 'id', true);
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await softDeleteRepo.delete(1);

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('UPDATE test_table');
      expect(queryCall).toContain('is_deleted = 1');
      expect(queryCall).toContain('updated_at = GETDATE()');
    });

    it('should work with string IDs', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.delete('abc123');

      expect(mockRequest.input).toHaveBeenCalledWith('id', 'abc123');
    });
  });

  describe('count', () => {
    it('should count all records', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ total: 42 }] });

      const result = await repository.count();

      expect(result).toBe(42);
    });

    it('should apply soft delete filter when enabled', async () => {
      const softDeleteRepo = new TestRepository('test_table', 'id', true);
      mockRequest.query.mockResolvedValue({ recordset: [{ total: 10 }] });

      await softDeleteRepo.count();

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('is_deleted = 0');
    });

    it('should apply filters', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ total: 5 }] });

      await repository.count({ is_active: true, name: 'Test' });

      expect(mockRequest.input).toHaveBeenCalledWith('is_active', true);
      expect(mockRequest.input).toHaveBeenCalledWith('name', 'Test');
    });

    it('should skip null/undefined filter values', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ total: 3 }] });

      await repository.count({ name: 'Test', other: null, another: undefined, empty: '' });

      expect(mockRequest.input).toHaveBeenCalledWith('name', 'Test');
      expect(mockRequest.input).not.toHaveBeenCalledWith('other', expect.anything());
    });
  });

  describe('exists', () => {
    it('should return true when record exists', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ id: 1, name: 'Test' }] });

      const result = await repository.exists(1);

      expect(result).toBe(true);
    });

    it('should return false when record does not exist', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.exists(999);

      expect(result).toBe(false);
    });

    it('should respect soft delete', async () => {
      const softDeleteRepo = new TestRepository('test_table', 'id', true);
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await softDeleteRepo.exists(1);

      const queryCall = mockRequest.query.mock.calls[0][0];
      expect(queryCall).toContain('is_deleted = 0');
    });
  });
});
