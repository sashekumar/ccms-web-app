import { ProductCopayRepository } from './product-copay.repository';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';
import { CreateProductCopayDto, UpdateProductCopayDto } from './product-copay.types';

// Mock dependencies
jest.mock('../../core/database/connection-manager');
jest.mock('mssql', () => ({
  BigInt: 'BigInt',
  VarChar: jest.fn(),
  NVarChar: jest.fn(),
  Decimal: jest.fn(),
  Bit: 'Bit',
}));

describe('ProductCopayRepository', () => {
  let repository: ProductCopayRepository;
  let mockPool: any;
  let mockRequest: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock request with proper MSSQL pattern
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
    };

    // Create mock pool
    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest),
    };

    // Setup connectionManager mock
    (connectionManager.getPool as jest.Mock).mockResolvedValue(mockPool);

    // Create repository instance
    repository = new ProductCopayRepository();
  });

  describe('getCopayByProductId', () => {
    it('should return array of copay rules for a product', async () => {
      const mockCopays = [
        {
          copay_id: 1,
          legacy_product_copay_id: null,
          product_id: 100,
          copay_type: 'PERCENTAGE',
          copay_value: 10.50,
          applies_to: 'OUTPATIENT',
          is_active: true,
        },
        {
          copay_id: 2,
          legacy_product_copay_id: null,
          product_id: 100,
          copay_type: 'FIXED',
          copay_value: 50.00,
          applies_to: 'CONSULTATION',
          is_active: true,
        },
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockCopays });

      const result = await repository.getCopayByProductId(100);

      expect(result).toEqual(mockCopays);
      expect(mockRequest.input).toHaveBeenCalledWith('product_id', sql.BigInt, 100);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE product_id = @product_id'));
    });

    it('should return empty array when no copay rules found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.getCopayByProductId(999);

      expect(result).toEqual([]);
    });

    it('should order copay rules by copay_id', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.getCopayByProductId(100);

      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY copay_id'));
    });
  });

  describe('getCopayById', () => {
    it('should return copay rule when found', async () => {
      const mockCopay = {
        copay_id: 1,
        legacy_product_copay_id: null,
        product_id: 100,
        copay_type: 'PERCENTAGE',
        copay_value: 10.50,
        applies_to: 'OUTPATIENT',
        is_active: true,
      };

      mockRequest.query.mockResolvedValue({ recordset: [mockCopay] });

      const result = await repository.getCopayById(1);

      expect(result).toEqual(mockCopay);
      expect(mockRequest.input).toHaveBeenCalledWith('copay_id', sql.BigInt, 1);
    });

    it('should return null when copay rule not found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.getCopayById(999);

      expect(result).toBeNull();
    });
  });

  describe('createCopay', () => {
    it('should create copay rule with all fields and return ID', async () => {
      const newCopayId = 123;
      mockRequest.query.mockResolvedValue({ recordset: [{ copay_id: newCopayId }] });

      const dto: CreateProductCopayDto = {
        product_id: 100,
        copay_type: 'PERCENTAGE',
        copay_value: 15.00,
        applies_to: 'OUTPATIENT',
        is_active: true,
      };

      const result = await repository.createCopay(dto, 'test-user');

      expect(result).toBe(newCopayId);
      expect(mockRequest.input).toHaveBeenCalledWith('product_id', sql.BigInt, 100);
      expect(mockRequest.input).toHaveBeenCalledWith('copay_type', undefined, 'PERCENTAGE');
      expect(mockRequest.input).toHaveBeenCalledWith('copay_value', undefined, 15.00);
      expect(mockRequest.input).toHaveBeenCalledWith('applies_to', undefined, 'OUTPATIENT');
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', undefined, 'test-user');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'));
    });

    it('should create copay rule without optional fields', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ copay_id: 124 }] });

      const dto: CreateProductCopayDto = {
        product_id: 100,
      };

      const result = await repository.createCopay(dto, 'test-user');

      expect(result).toBe(124);
      expect(mockRequest.input).toHaveBeenCalledWith('copay_type', undefined, null);
      expect(mockRequest.input).toHaveBeenCalledWith('copay_value', undefined, null);
      expect(mockRequest.input).toHaveBeenCalledWith('applies_to', undefined, null);
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, true); // default value
    });

    it('should default is_active to true when not provided', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ copay_id: 125 }] });

      const dto: CreateProductCopayDto = {
        product_id: 100,
        copay_type: 'FIXED',
        copay_value: 50.00,
      };

      await repository.createCopay(dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, true);
    });

    it('should allow is_active to be set to false', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ copay_id: 126 }] });

      const dto: CreateProductCopayDto = {
        product_id: 100,
        copay_type: 'PERCENTAGE',
        copay_value: 10.00,
        is_active: false,
      };

      await repository.createCopay(dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, false);
    });

    it('should handle decimal values correctly', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ copay_id: 127 }] });

      const dto: CreateProductCopayDto = {
        product_id: 100,
        copay_type: 'PERCENTAGE',
        copay_value: 12.75,
      };

      await repository.createCopay(dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('copay_value', undefined, 12.75);
    });
  });

  describe('updateCopay', () => {
    it('should update all fields when provided', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const dto: UpdateProductCopayDto = {
        copay_type: 'FIXED',
        copay_value: 100.00,
        applies_to: 'INPATIENT',
        is_active: false,
      };

      const result = await repository.updateCopay(1, dto, 'test-user');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('copay_id', sql.BigInt, 1);
      expect(mockRequest.input).toHaveBeenCalledWith('copay_type', undefined, 'FIXED');
      expect(mockRequest.input).toHaveBeenCalledWith('copay_value', undefined, 100.00);
      expect(mockRequest.input).toHaveBeenCalledWith('applies_to', undefined, 'INPATIENT');
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', undefined, 'test-user');
    });

    it('should update only specific fields when provided', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const dto: UpdateProductCopayDto = {
        copay_value: 25.50,
      };

      await repository.updateCopay(1, dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('copay_value', undefined, 25.50);
      expect(mockRequest.input).not.toHaveBeenCalledWith('copay_type', expect.anything(), expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('applies_to', expect.anything(), expect.anything());
    });

    it('should return false when no fields to update', async () => {
      const dto: UpdateProductCopayDto = {};

      const result = await repository.updateCopay(1, dto, 'test-user');

      expect(result).toBe(false);
    });

    it('should handle failed update', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const dto: UpdateProductCopayDto = {
        copay_value: 30.00,
      };

      const result = await repository.updateCopay(999, dto, 'test-user');

      expect(result).toBe(false);
    });

    it('should handle empty string for applies_to field', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const dto: UpdateProductCopayDto = {
        applies_to: '',
      };

      await repository.updateCopay(1, dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('applies_to', undefined, '');
    });

    it('should handle zero copay values', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const dto: UpdateProductCopayDto = {
        copay_value: 0.00,
      };

      await repository.updateCopay(1, dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('copay_value', undefined, 0.00);
    });
  });

  describe('deleteCopay', () => {
    it('should delete copay rule successfully', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const result = await repository.deleteCopay(1);

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('copay_id', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
    });

    it('should return false when copay rule not found', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const result = await repository.deleteCopay(999);

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockRequest.query.mockRejectedValue(dbError);

      await expect(repository.getCopayByProductId(100)).rejects.toThrow('Database connection failed');
    });

    it('should handle SQL injection attempts safely', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ copay_id: 123 }] });

      const dto: CreateProductCopayDto = {
        product_id: 100,
        copay_type: "'; DROP TABLE product_copay; --",
      };

      await repository.createCopay(dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('copay_type', undefined, "'; DROP TABLE product_copay; --");
    });
  });

  describe('edge cases', () => {
    it('should handle very large copay values', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ copay_id: 128 }] });

      const dto: CreateProductCopayDto = {
        product_id: 100,
        copay_type: 'FIXED',
        copay_value: 99999999.99,
      };

      await repository.createCopay(dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('copay_value', undefined, 99999999.99);
    });

    it('should handle precise decimal values', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ copay_id: 129 }] });

      const dto: CreateProductCopayDto = {
        product_id: 100,
        copay_type: 'PERCENTAGE',
        copay_value: 12.3456,
      };

      await repository.createCopay(dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('copay_value', undefined, 12.3456);
    });

    it('should handle long applies_to strings', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ copay_id: 130 }] });

      const longAppliesTo = 'A'.repeat(250);
      const dto: CreateProductCopayDto = {
        product_id: 100,
        applies_to: longAppliesTo,
      };

      await repository.createCopay(dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('applies_to', undefined, longAppliesTo);
    });

    it('should handle special characters in copay types', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ copay_id: 131 }] });

      const specialType = 'FLAT-FEE_PER_SERVICE';
      const dto: CreateProductCopayDto = {
        product_id: 100,
        copay_type: specialType,
      };

      await repository.createCopay(dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('copay_type', undefined, specialType);
    });

    it('should handle negative copay values', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ copay_id: 132 }] });

      const dto: CreateProductCopayDto = {
        product_id: 100,
        copay_type: 'DISCOUNT',
        copay_value: -10.00,
      };

      await repository.createCopay(dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('copay_value', undefined, -10.00);
    });
  });
});
