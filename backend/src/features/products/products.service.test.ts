import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { ProductLimitsRepository } from './product-limits.repository';
import { ProductCopayRepository } from './product-copay.repository';
import { CreateProductDto, UpdateProductDto, ProductFilters } from './products.types';
import { CreateProductLimitDto, UpdateProductLimitDto } from './product-limits.types';
import { CreateProductCopayDto, UpdateProductCopayDto } from './product-copay.types';

// Mock dependencies
jest.mock('./products.repository');
jest.mock('./product-limits.repository');
jest.mock('./product-copay.repository');

// Create mock cache instance
const mockCacheInstance = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  flushAll: jest.fn(),
};

// Mock NodeCache
jest.mock('node-cache', () => {
  return jest.fn(() => mockCacheInstance);
});

describe('ProductsService', () => {
  let service: ProductsService;
  let mockRepository: jest.Mocked<ProductsRepository>;
  let mockLimitsRepo: jest.Mocked<ProductLimitsRepository>;
  let mockCopayRepo: jest.Mocked<ProductCopayRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset cache mocks and ensure they return values
    mockCacheInstance.get.mockReturnValue(undefined);
    mockCacheInstance.set.mockReturnValue(true);
    mockCacheInstance.del.mockReturnValue(1);
    mockCacheInstance.flushAll.mockReturnValue(undefined);

    mockRepository = {
      getProducts: jest.fn(),
      getProductById: jest.fn(),
      checkPlanCodeExists: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      activateProduct: jest.fn(),
      deactivateProduct: jest.fn(),
    } as any;

    mockLimitsRepo = {
      getLimitsByProductId: jest.fn(),
      getLimitById: jest.fn(),
      createLimit: jest.fn(),
      updateLimit: jest.fn(),
      deleteLimit: jest.fn(),
    } as any;

    mockCopayRepo = {
      getCopayByProductId: jest.fn(),
      getCopayById: jest.fn(),
      createCopay: jest.fn(),
      updateCopay: jest.fn(),
      deleteCopay: jest.fn(),
    } as any;

    (ProductsRepository as jest.MockedClass<typeof ProductsRepository>).mockImplementation(() => mockRepository);
    (ProductLimitsRepository as jest.MockedClass<typeof ProductLimitsRepository>).mockImplementation(() => mockLimitsRepo);
    (ProductCopayRepository as jest.MockedClass<typeof ProductCopayRepository>).mockImplementation(() => mockCopayRepo);

    service = new ProductsService();
    // Replace the cache with our mock
    (service as any).productCache = mockCacheInstance;
  });

  // ========================================================================
  // CACHE MANAGEMENT
  // ========================================================================

  describe('clearProductCache', () => {
    it('should clear cache for specific product', () => {
      service.clearProductCache(1);
      expect(mockCacheInstance.del).toHaveBeenCalledWith('product:1');
      expect(mockCacheInstance.del).toHaveBeenCalledWith('limits:1');
      expect(mockCacheInstance.del).toHaveBeenCalledWith('copay:1');
    });

    it('should flush all cache when no product ID provided', () => {
      service.clearProductCache();
      expect(mockCacheInstance.flushAll).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // PRODUCTS
  // ========================================================================

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const filters: ProductFilters = { page: 1, limit: 10 };
      const mockResult = {
        data: [{ product_id: 1, plan_code: 'PLN001', plan_name: 'Test Plan', is_active: true }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
      };

      mockRepository.getProducts.mockResolvedValue(mockResult);
      const result = await service.getProducts(filters);

      expect(result).toEqual(mockResult);
      expect(mockRepository.getProducts).toHaveBeenCalledWith(filters);
    });
  });

  describe('getProductById', () => {
    it('should return cached product if available', async () => {
      const mockProduct = { product_id: 1, plan_code: 'PLN001', plan_name: 'Test Plan', is_active: true };
      mockCacheInstance.get.mockReturnValue(mockProduct);

      const result = await service.getProductById(1);

      expect(result).toEqual(mockProduct);
      expect(mockCacheInstance.get).toHaveBeenCalledWith('product:1');
      expect(mockRepository.getProductById).not.toHaveBeenCalled();
    });

    it('should fetch and cache product if not in cache', async () => {
      const mockProduct = { product_id: 1, plan_code: 'PLN001', plan_name: 'Test Plan', is_active: true };
      mockCacheInstance.get.mockReturnValue(undefined);
      mockRepository.getProductById.mockResolvedValue(mockProduct);

      const result = await service.getProductById(1);

      expect(result).toEqual(mockProduct);
      expect(mockCacheInstance.set).toHaveBeenCalledWith('product:1', mockProduct);
    });

    it('should return null when product not found', async () => {
      mockCacheInstance.get.mockReturnValue(undefined);
      mockRepository.getProductById.mockResolvedValue(null);

      const result = await service.getProductById(999);

      expect(result).toBeNull();
      expect(mockCacheInstance.set).not.toHaveBeenCalled();
    });
  });

  describe('checkPlanCodeExists', () => {
    it('should return cached result if available', async () => {
      mockCacheInstance.get.mockReturnValue(true);
      const result = await service.checkPlanCodeExists('PLN001');

      expect(result).toBe(true);
      expect(mockRepository.checkPlanCodeExists).not.toHaveBeenCalled();
    });

    it('should fetch and cache plan code check result', async () => {
      mockCacheInstance.get.mockReturnValue(undefined);
      mockRepository.checkPlanCodeExists.mockResolvedValue(false);

      const result = await service.checkPlanCodeExists('PLN001');

      expect(result).toBe(false);
      expect(mockCacheInstance.set).toHaveBeenCalledWith('plan_code:PLN001:new', false);
    });

    it('should cache with excludeId when provided', async () => {
      mockCacheInstance.get.mockReturnValue(undefined);
      mockRepository.checkPlanCodeExists.mockResolvedValue(false);

      await service.checkPlanCodeExists('PLN001', 1);

      expect(mockCacheInstance.set).toHaveBeenCalledWith('plan_code:PLN001:1', false);
    });
  });

  describe('createProduct', () => {
    const validDto: CreateProductDto = {
      plan_code: 'PLN001',
      plan_name: 'Test Plan',
      is_active: true
    };

    it('should create product and clear plan code cache', async () => {
      mockRepository.createProduct.mockResolvedValue(1);

      const result = await service.createProduct(validDto, 'admin');

      expect(result).toBe(1);
      expect(mockCacheInstance.del).toHaveBeenCalledWith('plan_code:PLN001:new');
    });
  });

  describe('updateProduct', () => {
    const validDto: UpdateProductDto = {
      plan_name: 'Updated Plan Name'
    };

    it('should update product and clear cache', async () => {
      mockRepository.updateProduct.mockResolvedValue(true);

      const result = await service.updateProduct(1, validDto, 'admin');

      expect(result).toBe(true);
      expect(mockCacheInstance.del).toHaveBeenCalledWith('product:1');
    });

    it('should clear plan code cache when plan_code changed', async () => {
      const dto: UpdateProductDto = { plan_code: 'PLN999' };
      mockRepository.updateProduct.mockResolvedValue(true);

      await service.updateProduct(1, dto, 'admin');

      expect(mockCacheInstance.del).toHaveBeenCalledWith('plan_code:PLN999:1');
    });

    it('should not clear cache when update fails', async () => {
      mockRepository.updateProduct.mockResolvedValue(false);

      await service.updateProduct(1, validDto, 'admin');

      expect(mockCacheInstance.del).not.toHaveBeenCalled();
    });
  });

  describe('activateProduct', () => {
    it('should activate product and clear cache', async () => {
      mockRepository.activateProduct.mockResolvedValue(true);

      const result = await service.activateProduct(1);

      expect(result).toBe(true);
      expect(mockCacheInstance.del).toHaveBeenCalledWith('product:1');
    });

    it('should not clear cache when activation fails', async () => {
      mockRepository.activateProduct.mockResolvedValue(false);

      await service.activateProduct(1);

      expect(mockCacheInstance.del).not.toHaveBeenCalled();
    });
  });

  describe('deactivateProduct', () => {
    it('should deactivate product and clear cache', async () => {
      mockRepository.deactivateProduct.mockResolvedValue(true);

      const result = await service.deactivateProduct(1);

      expect(result).toBe(true);
      expect(mockCacheInstance.del).toHaveBeenCalledWith('product:1');
    });

    it('should not clear cache when deactivation fails', async () => {
      mockRepository.deactivateProduct.mockResolvedValue(false);

      await service.deactivateProduct(1);

      expect(mockCacheInstance.del).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // PRODUCT LIMITS
  // ========================================================================

  describe('Product Limits', () => {
    describe('getLimitsByProductId', () => {
      it('should return cached limits', async () => {
        const mockLimits = [{ limit_id: 1, product_id: 1, limit_type: 'ANNUAL' }];
        mockCacheInstance.get.mockReturnValue(mockLimits);

        const result = await service.getLimitsByProductId(1);

        expect(result).toEqual(mockLimits);
        expect(mockLimitsRepo.getLimitsByProductId).not.toHaveBeenCalled();
      });

      it('should fetch and cache limits', async () => {
        const mockLimits = [{ limit_id: 1, product_id: 1, limit_type: 'ANNUAL' }];
        mockCacheInstance.get.mockReturnValue(undefined);
        mockLimitsRepo.getLimitsByProductId.mockResolvedValue(mockLimits as any);

        const result = await service.getLimitsByProductId(1);

        expect(result).toEqual(mockLimits);
        expect(mockCacheInstance.set).toHaveBeenCalledWith('limits:1', mockLimits);
      });
    });

    describe('getLimitById', () => {
      it('should return limit by ID', async () => {
        const mockLimit = { limit_id: 1, product_id: 1 };
        mockLimitsRepo.getLimitById.mockResolvedValue(mockLimit as any);

        const result = await service.getLimitById(1);

        expect(result).toEqual(mockLimit);
      });

      it('should return null when not found', async () => {
        mockLimitsRepo.getLimitById.mockResolvedValue(null);
        const result = await service.getLimitById(999);
        expect(result).toBeNull();
      });
    });

    describe('createLimit', () => {
      it('should create limit and clear cache', async () => {
        const dto: CreateProductLimitDto = { product_id: 1, limit_type: 'ANNUAL', limit_amount: 10000 };
        mockLimitsRepo.createLimit.mockResolvedValue(1);

        const result = await service.createLimit(dto, 'admin');

        expect(result).toBe(1);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('limits:1');
      });
    });

    describe('updateLimit', () => {
      it('should update limit and clear cache', async () => {
        const dto: UpdateProductLimitDto = { limit_amount: 15000 };
        mockLimitsRepo.getLimitById.mockResolvedValue({ limit_id: 1, product_id: 1 } as any);
        mockLimitsRepo.updateLimit.mockResolvedValue(true);

        const result = await service.updateLimit(1, dto, 'admin');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('limits:1');
      });

      it('should not clear cache when limit not found', async () => {
        const dto: UpdateProductLimitDto = { limit_amount: 15000 };
        mockLimitsRepo.getLimitById.mockResolvedValue(null);
        mockLimitsRepo.updateLimit.mockResolvedValue(false);

        await service.updateLimit(999, dto, 'admin');

        expect(mockCacheInstance.del).not.toHaveBeenCalled();
      });

      it('should not clear cache when update fails', async () => {
        const dto: UpdateProductLimitDto = { limit_amount: 15000 };
        mockLimitsRepo.getLimitById.mockResolvedValue({ limit_id: 1, product_id: 1 } as any);
        mockLimitsRepo.updateLimit.mockResolvedValue(false);

        await service.updateLimit(1, dto, 'admin');

        expect(mockCacheInstance.del).not.toHaveBeenCalled();
      });
    });

    describe('deleteLimit', () => {
      it('should delete limit and clear cache', async () => {
        mockLimitsRepo.getLimitById.mockResolvedValue({ limit_id: 1, product_id: 1 } as any);
        mockLimitsRepo.deleteLimit.mockResolvedValue(true);

        const result = await service.deleteLimit(1);

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('limits:1');
      });

      it('should not clear cache when limit not found', async () => {
        mockLimitsRepo.getLimitById.mockResolvedValue(null);
        mockLimitsRepo.deleteLimit.mockResolvedValue(false);

        await service.deleteLimit(999);

        expect(mockCacheInstance.del).not.toHaveBeenCalled();
      });

      it('should not clear cache when delete fails', async () => {
        mockLimitsRepo.getLimitById.mockResolvedValue({ limit_id: 1, product_id: 1 } as any);
        mockLimitsRepo.deleteLimit.mockResolvedValue(false);

        await service.deleteLimit(1);

        expect(mockCacheInstance.del).not.toHaveBeenCalled();
      });
    });
  });

  // ========================================================================
  // PRODUCT COPAY
  // ========================================================================

  describe('Product Copay', () => {
    describe('getCopayByProductId', () => {
      it('should return cached copay rules', async () => {
        const mockCopay = [{ copay_id: 1, product_id: 1, copay_type: 'PERCENTAGE' }];
        mockCacheInstance.get.mockReturnValue(mockCopay);

        const result = await service.getCopayByProductId(1);

        expect(result).toEqual(mockCopay);
        expect(mockCopayRepo.getCopayByProductId).not.toHaveBeenCalled();
      });

      it('should fetch and cache copay rules', async () => {
        const mockCopay = [{ copay_id: 1, product_id: 1, copay_type: 'PERCENTAGE' }];
        mockCacheInstance.get.mockReturnValue(undefined);
        mockCopayRepo.getCopayByProductId.mockResolvedValue(mockCopay as any);

        const result = await service.getCopayByProductId(1);

        expect(result).toEqual(mockCopay);
        expect(mockCacheInstance.set).toHaveBeenCalledWith('copay:1', mockCopay);
      });
    });

    describe('getCopayById', () => {
      it('should return copay by ID', async () => {
        const mockCopay = { copay_id: 1, product_id: 1 };
        mockCopayRepo.getCopayById.mockResolvedValue(mockCopay as any);

        const result = await service.getCopayById(1);

        expect(result).toEqual(mockCopay);
      });

      it('should return null when not found', async () => {
        mockCopayRepo.getCopayById.mockResolvedValue(null);
        const result = await service.getCopayById(999);
        expect(result).toBeNull();
      });
    });

    describe('createCopay', () => {
      it('should create copay and clear cache', async () => {
        const dto: CreateProductCopayDto = { product_id: 1, copay_type: 'PERCENTAGE', copay_value: 10 };
        mockCopayRepo.createCopay.mockResolvedValue(1);

        const result = await service.createCopay(dto, 'admin');

        expect(result).toBe(1);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('copay:1');
      });
    });

    describe('updateCopay', () => {
      it('should update copay and clear cache', async () => {
        const dto: UpdateProductCopayDto = { copay_value: 15 };
        mockCopayRepo.getCopayById.mockResolvedValue({ copay_id: 1, product_id: 1 } as any);
        mockCopayRepo.updateCopay.mockResolvedValue(true);

        const result = await service.updateCopay(1, dto, 'admin');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('copay:1');
      });

      it('should not clear cache when copay not found', async () => {
        const dto: UpdateProductCopayDto = { copay_value: 15 };
        mockCopayRepo.getCopayById.mockResolvedValue(null);
        mockCopayRepo.updateCopay.mockResolvedValue(false);

        await service.updateCopay(999, dto, 'admin');

        expect(mockCacheInstance.del).not.toHaveBeenCalled();
      });

      it('should not clear cache when update fails', async () => {
        const dto: UpdateProductCopayDto = { copay_value: 15 };
        mockCopayRepo.getCopayById.mockResolvedValue({ copay_id: 1, product_id: 1 } as any);
        mockCopayRepo.updateCopay.mockResolvedValue(false);

        await service.updateCopay(1, dto, 'admin');

        expect(mockCacheInstance.del).not.toHaveBeenCalled();
      });
    });

    describe('deleteCopay', () => {
      it('should delete copay and clear cache', async () => {
        mockCopayRepo.getCopayById.mockResolvedValue({ copay_id: 1, product_id: 1 } as any);
        mockCopayRepo.deleteCopay.mockResolvedValue(true);

        const result = await service.deleteCopay(1);

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('copay:1');
      });

      it('should not clear cache when copay not found', async () => {
        mockCopayRepo.getCopayById.mockResolvedValue(null);
        mockCopayRepo.deleteCopay.mockResolvedValue(false);

        await service.deleteCopay(999);

        expect(mockCacheInstance.del).not.toHaveBeenCalled();
      });

      it('should not clear cache when delete fails', async () => {
        mockCopayRepo.getCopayById.mockResolvedValue({ copay_id: 1, product_id: 1 } as any);
        mockCopayRepo.deleteCopay.mockResolvedValue(false);

        await service.deleteCopay(1);

        expect(mockCacheInstance.del).not.toHaveBeenCalled();
      });
    });
  });
});
