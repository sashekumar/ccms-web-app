import { BaseService } from './base.service';
import { BaseRepository, QueryOptions } from './base.repository';

// Mock BaseRepository
jest.mock('./base.repository');

// Test entity interface
interface TestEntity {
  id: number;
  name: string;
  is_active: boolean;
}

// Test service implementation
class TestService extends BaseService<TestEntity> {
  constructor(repository: BaseRepository<TestEntity>) {
    super(repository);
  }
}

describe('BaseService', () => {
  let service: TestService;
  let mockRepository: jest.Mocked<BaseRepository<TestEntity>>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repository with all methods
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
    } as any;

    service = new TestService(mockRepository);
  });

  describe('getAll', () => {
    it('should return all records from repository', async () => {
      const mockData = [
        { id: 1, name: 'Test1', is_active: true },
        { id: 2, name: 'Test2', is_active: false }
      ];
      mockRepository.findAll.mockResolvedValue(mockData);

      const result = await service.getAll();

      expect(result).toEqual(mockData);
      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should pass options to repository', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const options: QueryOptions = {
        page: 1,
        limit: 10,
        sort_by: 'name',
        sort_order: 'ASC',
        filters: { is_active: true }
      };

      await service.getAll(options);

      expect(mockRepository.findAll).toHaveBeenCalledWith(options);
    });
  });

  describe('getById', () => {
    it('should return record when found', async () => {
      const mockData = { id: 1, name: 'Test', is_active: true };
      mockRepository.findById.mockResolvedValue(mockData);

      const result = await service.getById(1);

      expect(result).toEqual(mockData);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw error when record not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getById(999)).rejects.toThrow('Record with ID 999 not found');
    });

    it('should work with string IDs', async () => {
      const mockData = { id: 1, name: 'Test', is_active: true };
      mockRepository.findById.mockResolvedValue(mockData);

      const result = await service.getById('abc123');

      expect(result).toEqual(mockData);
      expect(mockRepository.findById).toHaveBeenCalledWith('abc123');
    });
  });

  describe('getOne', () => {
    it('should return record matching conditions', async () => {
      const mockData = { id: 1, name: 'Test', is_active: true };
      mockRepository.findOne.mockResolvedValue(mockData);

      const result = await service.getOne({ name: 'Test' });

      expect(result).toEqual(mockData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ name: 'Test' });
    });

    it('should return null when no match found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getOne({ name: 'NonExistent' });

      expect(result).toBeNull();
    });

    it('should pass multiple conditions', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await service.getOne({ name: 'Test', is_active: true });

      expect(mockRepository.findOne).toHaveBeenCalledWith({ name: 'Test', is_active: true });
    });
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const mockData = { id: 1, name: 'Test', is_active: true };
      mockRepository.create.mockResolvedValue(mockData);

      const result = await service.create({ name: 'Test', is_active: true });

      expect(result).toEqual(mockData);
      expect(mockRepository.create).toHaveBeenCalledWith({ name: 'Test', is_active: true }, undefined);
    });

    it('should pass createdBy parameter', async () => {
      const mockData = { id: 1, name: 'Test', is_active: true };
      mockRepository.create.mockResolvedValue(mockData);

      await service.create({ name: 'Test' }, 'admin');

      expect(mockRepository.create).toHaveBeenCalledWith({ name: 'Test' }, 'admin');
    });
  });

  describe('update', () => {
    it('should update existing record', async () => {
      const mockExisting = { id: 1, name: 'Old', is_active: true };
      const mockUpdated = { id: 1, name: 'New', is_active: false };
      
      mockRepository.findById.mockResolvedValue(mockExisting);
      mockRepository.update.mockResolvedValue(mockUpdated);

      const result = await service.update(1, { name: 'New', is_active: false });

      expect(result).toEqual(mockUpdated);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.update).toHaveBeenCalledWith(1, { name: 'New', is_active: false }, undefined);
    });

    it('should throw error when record not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update(999, { name: 'New' })).rejects.toThrow('Record with ID 999 not found');

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should pass updatedBy parameter', async () => {
      const mockExisting = { id: 1, name: 'Old', is_active: true };
      mockRepository.findById.mockResolvedValue(mockExisting);
      mockRepository.update.mockResolvedValue(mockExisting);

      await service.update(1, { name: 'New' }, 'admin');

      expect(mockRepository.update).toHaveBeenCalledWith(1, { name: 'New' }, 'admin');
    });

    it('should verify record exists before updating', async () => {
      const mockExisting = { id: 1, name: 'Test', is_active: true };
      mockRepository.findById.mockResolvedValue(mockExisting);
      mockRepository.update.mockResolvedValue(mockExisting);

      await service.update(1, { name: 'Updated' });

      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.update).toHaveBeenCalledWith(1, { name: 'Updated' }, undefined);
    });
  });

  describe('delete', () => {
    it('should delete existing record', async () => {
      const mockExisting = { id: 1, name: 'Test', is_active: true };
      mockRepository.findById.mockResolvedValue(mockExisting);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.delete(1);

      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw error when record not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow('Record with ID 999 not found');

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should verify record exists before deleting', async () => {
      const mockExisting = { id: 1, name: 'Test', is_active: true };
      mockRepository.findById.mockResolvedValue(mockExisting);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.delete(1);

      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('count', () => {
    it('should return count from repository', async () => {
      mockRepository.count.mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
      expect(mockRepository.count).toHaveBeenCalledWith(undefined);
    });

    it('should pass filters to repository', async () => {
      mockRepository.count.mockResolvedValue(10);

      await service.count({ is_active: true });

      expect(mockRepository.count).toHaveBeenCalledWith({ is_active: true });
    });
  });

  describe('exists', () => {
    it('should return true when record exists', async () => {
      mockRepository.exists.mockResolvedValue(true);

      const result = await service.exists(1);

      expect(result).toBe(true);
      expect(mockRepository.exists).toHaveBeenCalledWith(1);
    });

    it('should return false when record does not exist', async () => {
      mockRepository.exists.mockResolvedValue(false);

      const result = await service.exists(999);

      expect(result).toBe(false);
      expect(mockRepository.exists).toHaveBeenCalledWith(999);
    });

    it('should work with string IDs', async () => {
      mockRepository.exists.mockResolvedValue(true);

      await service.exists('abc123');

      expect(mockRepository.exists).toHaveBeenCalledWith('abc123');
    });
  });
});
