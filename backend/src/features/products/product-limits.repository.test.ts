import { ProductLimitsRepository } from './product-limits.repository';
import { CreateProductLimitDto, UpdateProductLimitDto } from './product-limits.types';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock the database service
jest.mock('../../core/database/connection-manager');

describe('ProductLimitsRepository', () => {
  let repository: ProductLimitsRepository;
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

    repository = new ProductLimitsRepository();
  });

  describe('getLimitsByProductId', () => {
    it('should return array of limits for a product', async () => {
      const mockLimits = [
        {
          limit_id: 1,
          product_id: 10,
          limit_type: 'ANNUAL',
          limit_amount: 100000,
          is_active: true
        },
        {
          limit_id: 2,
          product_id: 10,
          limit_type: 'PER_ILLNESS',
          limit_amount: 50000,
          is_active: true
        }
      ];

      mockRequest.query.mockResolvedValueOnce({ recordset: mockLimits });

      const result = await repository.getLimitsByProductId(10);

      expect(result).toEqual(mockLimits);
      expect(mockRequest.input).toHaveBeenCalledWith('product_id', sql.BigInt, 10);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE product_id = @product_id'));
    });

    it('should return empty array when no limits found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getLimitsByProductId(999);

      expect(result).toEqual([]);
      expect(mockRequest.input).toHaveBeenCalledWith('product_id', sql.BigInt, 999);
    });

    it('should order by limit_id', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await repository.getLimitsByProductId(10);

      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY limit_id')
      );
    });
  });

  describe('getLimitById', () => {
    it('should return limit when found', async () => {
      const mockLimit = {
        limit_id: 1,
        product_id: 10,
        limit_type: 'ANNUAL',
        limit_amount: 100000,
        is_active: true
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [mockLimit] });

      const result = await repository.getLimitById(1);

      expect(result).toEqual(mockLimit);
      expect(mockRequest.input).toHaveBeenCalledWith('limit_id', sql.BigInt, 1);
    });

    it('should return null when limit not found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getLimitById(999);

      expect(result).toBeNull();
    });
  });

  describe('createLimit', () => {
    it('should create limit with all fields', async () => {
      const dto: CreateProductLimitDto = {
        product_id: 10,
        limit_type: 'ANNUAL',
        limit_amount: 100000,
        is_active: true
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ limit_id: 1 }] });

      const result = await repository.createLimit(dto, 'admin');

      expect(result).toBe(1);
      expect(mockRequest.input).toHaveBeenCalledWith('product_id', sql.BigInt, 10);
      expect(mockRequest.input).toHaveBeenCalledWith('limit_type', sql.VarChar(50), 'ANNUAL');
      expect(mockRequest.input).toHaveBeenCalledWith('limit_amount', sql.Money, 100000);
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('SELECT SCOPE_IDENTITY()'));
    });

    it('should create limit with only required fields', async () => {
      const dto: CreateProductLimitDto = {
        product_id: 10
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ limit_id: 2 }] });

      const result = await repository.createLimit(dto, 'admin');

      expect(result).toBe(2);
      expect(mockRequest.input).toHaveBeenCalledWith('product_id', sql.BigInt, 10);
      expect(mockRequest.input).toHaveBeenCalledWith('limit_type', sql.VarChar(50), null);
      expect(mockRequest.input).toHaveBeenCalledWith('limit_amount', sql.Money, null);
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, true);  // defaults to true
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
    });

    it('should default is_active to true when not provided', async () => {
      const dto: CreateProductLimitDto = {
        product_id: 10,
        limit_type: 'LIFETIME'
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ limit_id: 3 }] });

      await repository.createLimit(dto, 'admin');

      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, true);
    });

    it('should handle is_active as false explicitly', async () => {
      const dto: CreateProductLimitDto = {
        product_id: 10,
        is_active: false
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ limit_id: 4 }] });

      await repository.createLimit(dto, 'admin');

      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, false);
    });

    it('should handle null values for optional fields', async () => {
      const dto: CreateProductLimitDto = {
        product_id: 10,
        limit_type: undefined,
        limit_amount: undefined
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ limit_id: 5 }] });

      await repository.createLimit(dto, 'admin');

      expect(mockRequest.input).toHaveBeenCalledWith('limit_type', sql.VarChar(50), null);
      expect(mockRequest.input).toHaveBeenCalledWith('limit_amount', sql.Money, null);
    });
  });

  describe('updateLimit', () => {
    it('should update limit with all fields', async () => {
      const dto: UpdateProductLimitDto = {
        limit_type: 'PER_ILLNESS',
        limit_amount: 75000,
        is_active: false
      };

      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const result = await repository.updateLimit(1, dto, 'admin');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('limit_type', sql.VarChar(50), 'PER_ILLNESS');
      expect(mockRequest.input).toHaveBeenCalledWith('limit_amount', sql.Money, 75000);
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).toHaveBeenCalledWith('limit_id', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('updated_at = GETDATE()'));
    });

    it('should return false when no fields to update', async () => {
      const dto: UpdateProductLimitDto = {};

      const result = await repository.updateLimit(1, dto, 'admin');

      expect(result).toBe(false);
      expect(mockRequest.query).not.toHaveBeenCalled();
    });

    it('should update only specified fields', async () => {
      const dto: UpdateProductLimitDto = {
        limit_amount: 120000
      };

      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const result = await repository.updateLimit(1, dto, 'admin');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('limit_amount', sql.Money, 120000);
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).not.toHaveBeenCalledWith('limit_type', expect.anything(), expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('is_active', expect.anything(), expect.anything());
    });

    it('should return false when no rows affected', async () => {
      const dto: UpdateProductLimitDto = {
        is_active: false
      };

      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [0] });

      const result = await repository.updateLimit(999, dto, 'admin');

      expect(result).toBe(false);
    });

    it('should handle undefined values', async () => {
      const dto: UpdateProductLimitDto = {
        limit_type: 'ANNUAL',
        limit_amount: undefined
      };

      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateLimit(1, dto, 'admin');

      expect(mockRequest.input).toHaveBeenCalledWith('limit_type', sql.VarChar(50), 'ANNUAL');
      expect(mockRequest.input).not.toHaveBeenCalledWith('limit_amount', expect.anything(), expect.anything());
    });
  });

  describe('deleteLimit', () => {
    it('should delete limit successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const result = await repository.deleteLimit(1);

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('limit_id', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE limit_id = @limit_id'));
    });

    it('should return false when no rows affected', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [0] });

      const result = await repository.deleteLimit(999);

      expect(result).toBe(false);
    });

    it('should use correct SQL parameters', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.deleteLimit(5);

      expect(mockRequest.input).toHaveBeenCalledWith('limit_id', sql.BigInt, 5);
    });
  });
});
