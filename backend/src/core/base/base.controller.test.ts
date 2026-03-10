import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { BaseService } from './base.service';
import { ResponseUtil } from '../utils/response.util';

// Mock dependencies
jest.mock('../utils/response.util');

// Concrete implementation for testing
interface TestEntity {
  id: number;
  name: string;
}

class TestController extends BaseController<TestEntity> {
  constructor(service: BaseService<TestEntity>) {
    super(service);
  }
}

describe('BaseController', () => {
  let controller: TestController;
  let mockService: jest.Mocked<BaseService<TestEntity>>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock service
    mockService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<BaseService<TestEntity>>;

    controller = new TestController(mockService);

    // Mock Express objects
    mockRequest = {
      params: {},
      query: {},
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('getAll', () => {
    it('should return all records with default options', async () => {
      const mockRecords = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];
      mockService.getAll.mockResolvedValue(mockRecords);

      await controller.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.getAll).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        sortBy: undefined,
        sortOrder: 'DESC',
        filters: {},
      });
      expect(ResponseUtil.success).toHaveBeenCalledWith(mockResponse, mockRecords);
    });

    it('should handle pagination options from query', async () => {
      mockRequest.body = { page: '2', limit: '10' };
      mockService.getAll.mockResolvedValue([]);

      await controller.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.getAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        sortBy: undefined,
        sortOrder: 'DESC',
        filters: {},
      });
    });

    it('should handle sorting options from body', async () => {
      mockRequest.body = { sortBy: 'name', sortOrder: 'ASC' };
      mockService.getAll.mockResolvedValue([]);

      await controller.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.getAll).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        sortBy: 'name',
        sortOrder: 'ASC',
        filters: {},
      });
    });

    it('should pass filters from body', async () => {
      mockRequest.body = { name: 'Test', status: 'active', page: '1' };
      mockService.getAll.mockResolvedValue([]);

      await controller.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: undefined,
        sortBy: undefined,
        sortOrder: 'DESC',
        filters: { name: 'Test', status: 'active' },
      });
    });

    it('should handle errors', async () => {
      mockService.getAll.mockRejectedValue(new Error('Database error'));

      await controller.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching records',
        500,
        'Database error'
      );
    });
  });

  describe('getById', () => {
    it('should return record when found', async () => {
      const mockRecord = { id: 1, name: 'Test' };
      mockRequest.params = { id: '1' };
      mockService.getById.mockResolvedValue(mockRecord);

      await controller.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.getById).toHaveBeenCalledWith('1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(mockResponse, mockRecord);
    });

    it('should handle not found error with 404', async () => {
      mockRequest.params = { id: '999' };
      mockService.getById.mockRejectedValue(new Error('Record not found'));

      await controller.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Record not found',
        404
      );
    });

    it('should handle other errors with 500', async () => {
      mockRequest.params = { id: '1' };
      mockService.getById.mockRejectedValue(new Error('Database connection failed'));

      await controller.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching record',
        500,
        'Database connection failed'
      );
    });
  });

  describe('create', () => {
    it('should create record successfully', async () => {
      const newRecord = { name: 'New Test' };
      const createdRecord = { id: 1, ...newRecord };
      mockRequest.body = newRecord;
      mockService.create.mockResolvedValue(createdRecord);

      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.create).toHaveBeenCalledWith(newRecord);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        createdRecord,
        'Record created successfully',
        201
      );
    });

    it('should handle validation error (must be) with 400', async () => {
      mockRequest.body = { name: '' };
      mockService.create.mockRejectedValue(new Error('Name must be at least 3 characters'));

      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Name must be at least 3 characters',
        400
      );
    });

    it('should handle validation error (required) with 400', async () => {
      mockRequest.body = {};
      mockService.create.mockRejectedValue(new Error('Name is required'));

      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Name is required',
        400
      );
    });

    it('should handle duplicate error (already exists) with 400', async () => {
      mockRequest.body = { name: 'Duplicate' };
      mockService.create.mockRejectedValue(new Error('Record already exists'));

      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Record already exists',
        400
      );
    });

    it('should handle other errors with 500', async () => {
      mockRequest.body = { name: 'Test' };
      mockService.create.mockRejectedValue(new Error('Database connection failed'));

      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating record',
        500,
        'Database connection failed'
      );
    });
  });

  describe('update', () => {
    it('should update record successfully', async () => {
      const updates = { name: 'Updated' };
      const updatedRecord = { id: 1, ...updates };
      mockRequest.params = { id: '1' };
      mockRequest.body = updates;
      mockService.update.mockResolvedValue(updatedRecord);

      await controller.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.update).toHaveBeenCalledWith('1', updates);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        updatedRecord,
        'Record updated successfully'
      );
    });

    it('should handle not found error with 404', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { name: 'Updated' };
      mockService.update.mockRejectedValue(new Error('Record not found'));

      await controller.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Record not found',
        404
      );
    });

    it('should handle validation error (must be) with 400', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: '' };
      mockService.update.mockRejectedValue(new Error('Name must be at least 3 characters'));

      await controller.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Name must be at least 3 characters',
        400
      );
    });

    it('should handle validation error (required) with 400', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {};
      mockService.update.mockRejectedValue(new Error('At least one field is required'));

      await controller.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'At least one field is required',
        400
      );
    });

    it('should handle other errors with 500', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated' };
      mockService.update.mockRejectedValue(new Error('Database connection failed'));

      await controller.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating record',
        500,
        'Database connection failed'
      );
    });
  });

  describe('delete', () => {
    it('should delete record successfully', async () => {
      mockRequest.params = { id: '1' };
      mockService.delete.mockResolvedValue(undefined);

      await controller.delete(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.delete).toHaveBeenCalledWith('1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Record deleted successfully'
      );
    });

    it('should handle not found error with 404', async () => {
      mockRequest.params = { id: '999' };
      mockService.delete.mockRejectedValue(new Error('Record not found'));

      await controller.delete(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Record not found',
        404
      );
    });

    it('should handle other errors with 500', async () => {
      mockRequest.params = { id: '1' };
      mockService.delete.mockRejectedValue(new Error('Database connection failed'));

      await controller.delete(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error deleting record',
        500,
        'Database connection failed'
      );
    });
  });

  describe('count', () => {
    it('should return count of all records', async () => {
      mockService.count.mockResolvedValue(42);

      await controller.count(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.count).toHaveBeenCalledWith({});
      expect(ResponseUtil.success).toHaveBeenCalledWith(mockResponse, { total: 42 });
    });

    it('should return count with filters from query', async () => {
      mockRequest.query = { status: 'active', name: 'Test' };
      mockService.count.mockResolvedValue(5);

      await controller.count(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockService.count).toHaveBeenCalledWith({ status: 'active', name: 'Test' });
      expect(ResponseUtil.success).toHaveBeenCalledWith(mockResponse, { total: 5 });
    });

    it('should handle errors', async () => {
      mockService.count.mockRejectedValue(new Error('Database error'));

      await controller.count(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error counting records',
        500,
        'Database error'
      );
    });
  });
});
