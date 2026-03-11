import { ProductsRepository } from './products.repository';
import { CreateProductDto, UpdateProductDto, ProductFilters } from './products.types';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock the database service
jest.mock('../../core/database/connection-manager');

describe('ProductsRepository', () => {
  let repository: ProductsRepository;
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

    repository = new ProductsRepository();
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const filters: ProductFilters = { page: 1, limit: 10 };
      const mockProducts = [
        { product_id: 1, plan_code: 'PLN001', plan_name: 'Test Plan', is_active: true }
      ];
      const mockCount = [{ total: 1 }];

      mockRequest.query
        .mockResolvedValueOnce({ recordset: mockCount } as any)
        .mockResolvedValueOnce({ recordset: mockProducts } as any);

      const result = await repository.getProducts(filters);

      expect(result.data).toEqual(mockProducts);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      });
    });

    it('should apply search filter', async () => {
      const filters: ProductFilters = { page: 1, limit: 10, search: 'Test' };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [] } as any);

      await repository.getProducts(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('search', sql.NVarChar(255), '%Test%');
      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
    });

    it('should apply insurer_name filter', async () => {
      const filters: ProductFilters = { page: 1, limit: 10, insurer_name: 'Test Insurer' };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [] } as any);

      await repository.getProducts(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('insurerName', sql.NVarChar(255), 'Test Insurer');
      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
    });

    it('should apply is_active filter', async () => {
      const filters: ProductFilters = { page: 1, limit: 10, is_active: true };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [] } as any);

      await repository.getProducts(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
    });

    it('should apply sorting', async () => {
      const filters: ProductFilters = { page: 1, limit: 10, sort_by: 'plan_code', sort_order: 'ASC' };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
        .mockResolvedValueOnce({ recordset: [] } as any);

      await repository.getProducts(filters);

      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY plan_code ASC')
      );
    });
  });

  describe('getProductById', () => {
    it('should return product by ID', async () => {
      const mockProduct = { product_id: 1, plan_code: 'PLN001', plan_name: 'Test Plan' };
      mockRequest.query.mockResolvedValueOnce({ recordset: [mockProduct] } as any);

      const result = await repository.getProductById(1);

      expect(result).toEqual(mockProduct);
      expect(mockRequest.input).toHaveBeenCalledWith('product_id', sql.BigInt, 1);
    });

    it('should return null when product not found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] } as any);

      const result = await repository.getProductById(999);

      expect(result).toBeNull();
    });
  });

  describe('checkPlanCodeExists', () => {
    it('should return true when plan_code exists', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 1 }] } as any);

      const result = await repository.checkPlanCodeExists('PLN001');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('plan_code', sql.VarChar(50), 'PLN001');
    });

    it('should return false when plan_code does not exist', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] } as any);

      const result = await repository.checkPlanCodeExists('NONEXISTENT');

      expect(result).toBe(false);
    });

    it('should exclude current product when updating', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] } as any);

      const result = await repository.checkPlanCodeExists('PLN001', 1);

      expect(result).toBe(false);
      expect(mockRequest.input).toHaveBeenCalledWith('plan_code', sql.VarChar(50), 'PLN001');
      expect(mockRequest.input).toHaveBeenCalledWith('exclude_id', sql.BigInt, 1);
    });
  });

  describe('createProduct', () => {
    const validDto: CreateProductDto = {
      plan_code: 'PLN001',
      plan_name: 'Test Plan',
      is_active: true
    };

    it('should create product successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ product_id: 1 }] } as any);

      const result = await repository.createProduct(validDto, 'admin');

      expect(result).toBe(1);
      expect(mockRequest.input).toHaveBeenCalledWith('plan_code', sql.VarChar(50), 'PLN001');
      expect(mockRequest.input).toHaveBeenCalledWith('plan_name', sql.NVarChar(255), 'Test Plan');
      expect(mockRequest.input).toHaveBeenCalledWith('is_active', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
    });
  });

  describe('updateProduct', () => {
    const validDto: UpdateProductDto = {
      plan_name: 'Updated Plan Name'
    };

    it('should update product successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] } as any);

      await repository.updateProduct(1, validDto, 'admin');

      expect(mockRequest.input).toHaveBeenCalledWith('product_id', sql.BigInt, 1);
      expect(mockRequest.input).toHaveBeenCalledWith('plan_name', sql.NVarChar(255), 'Updated Plan Name');
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
    });
  });

  describe('activateProduct', () => {
    it('should activate product successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] } as any);

      await repository.activateProduct(1);

      expect(mockRequest.input).toHaveBeenCalledWith('product_id', sql.BigInt, 1);
    });
  });

  describe('deactivateProduct', () => {
    it('should deactivate product successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] } as any);

      await repository.deactivateProduct(1);

      expect(mockRequest.input).toHaveBeenCalledWith('product_id', sql.BigInt, 1);
    });
  });
});
