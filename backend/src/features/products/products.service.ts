const NodeCache = require('node-cache');
import { ProductsRepository } from './products.repository';
import { ProductLimitsRepository } from './product-limits.repository';
import { ProductCopayRepository } from './product-copay.repository';
import { ProductLosThresholdsRepository } from './product-los-thresholds.repository';
import { 
  Product, 
  ProductFilters, 
  PaginatedProducts, 
  CreateProductDto, 
  UpdateProductDto 
} from './products.types';
import { ProductLimit, CreateProductLimitDto, UpdateProductLimitDto } from './product-limits.types';
import { ProductCopay, CreateProductCopayDto, UpdateProductCopayDto } from './product-copay.types';
import { ProductLosThreshold, CreateProductLosThresholdDto, UpdateProductLosThresholdDto } from './product-los-thresholds.types';
import { BaseService } from '../../core/base/base.service';

// 5-minute cache TTL (same as permissions cache)
const PRODUCT_CACHE_TTL = 300;

// Cache key prefixes
const CACHE_KEYS = {
  PRODUCT: 'product',
  PRODUCT_LIST: 'product_list',
  PLAN_CODE: 'plan_code',
  LIMITS: 'limits',
  COPAY: 'copay',
  THRESHOLDS: 'thresholds'
};

export class ProductsService extends BaseService<Product> {
  protected repository: ProductsRepository;
  private limitsRepository: ProductLimitsRepository;
  private copayRepository: ProductCopayRepository;
  private thresholdsRepository: ProductLosThresholdsRepository;
  private productCache: typeof NodeCache;

  constructor() {
    const repository = new ProductsRepository();
    super(repository);
    this.repository = repository;
    this.limitsRepository = new ProductLimitsRepository();
    this.copayRepository = new ProductCopayRepository();
    this.thresholdsRepository = new ProductLosThresholdsRepository();
    this.productCache = new NodeCache({ stdTTL: PRODUCT_CACHE_TTL, checkperiod: 60 });
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Clear product cache by product ID or all cache
   */
  public clearProductCache(productId?: number): void {
    if (productId) {
      this.productCache.del(`${CACHE_KEYS.PRODUCT}:${productId}`);
      this.productCache.del(`${CACHE_KEYS.LIMITS}:${productId}`);
      this.productCache.del(`${CACHE_KEYS.COPAY}:${productId}`);
      this.productCache.del(`${CACHE_KEYS.THRESHOLDS}:${productId}`);
    } else {
      this.productCache.flushAll();
    }
  }

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  /**
   * Get paginated list of products
   */
  public async getProducts(filters: ProductFilters): Promise<PaginatedProducts> {
    // Don't cache list queries (too variable with filters)
    return await this.repository.getProducts(filters);
  }

  /**
   * Get product by ID (with caching)
   */
  public async getProductById(productId: number): Promise<Product | null> {
    const cacheKey = `${CACHE_KEYS.PRODUCT}:${productId}`;
    const cached = this.productCache.get(cacheKey) as Product | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const product = await this.repository.getProductById(productId);
    
    if (product) {
      this.productCache.set(cacheKey, product);
    }

    return product;
  }

  /**
   * Check if plan code exists (with caching)
   */
  public async checkPlanCodeExists(planCode: string, excludeId?: number): Promise<boolean> {
    const cacheKey = `${CACHE_KEYS.PLAN_CODE}:${planCode}:${excludeId || 'new'}`;
    const cached = this.productCache.get(cacheKey) as boolean | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const exists = await this.repository.checkPlanCodeExists(planCode, excludeId);
    this.productCache.set(cacheKey, exists);

    return exists;
  }

  /**
   * Create new product
   */
  public async createProduct(dto: CreateProductDto, createdBy: string): Promise<number> {
    const productId = await this.repository.createProduct(dto, createdBy);
    
    // Clear plan code cache
    this.productCache.del(`${CACHE_KEYS.PLAN_CODE}:${dto.plan_code}:new`);
    
    return productId;
  }

  /**
   * Update product
   */
  public async updateProduct(productId: number, dto: UpdateProductDto, updatedBy: string): Promise<boolean> {
    const success = await this.repository.updateProduct(productId, dto, updatedBy);
    
    if (success) {
      this.clearProductCache(productId);
      
      // Clear plan code cache if plan_code changed
      if (dto.plan_code) {
        this.productCache.del(`${CACHE_KEYS.PLAN_CODE}:${dto.plan_code}:${productId}`);
      }
    }

    return success;
  }

  /**
   * Activate product
   */
  public async activateProduct(productId: number): Promise<boolean> {
    const success = await this.repository.activateProduct(productId);
    
    if (success) {
      this.clearProductCache(productId);
    }

    return success;
  }

  /**
   * Deactivate product (soft delete)
   */
  public async deactivateProduct(productId: number): Promise<boolean> {
    const success = await this.repository.deactivateProduct(productId);
    
    if (success) {
      this.clearProductCache(productId);
    }

    return success;
  }

  // ============================================================================
  // PRODUCT LIMITS
  // ============================================================================

  /**
   * Get all limits for a product (with caching)
   */
  public async getLimitsByProductId(productId: number): Promise<ProductLimit[]> {
    const cacheKey = `${CACHE_KEYS.LIMITS}:${productId}`;
    const cached = this.productCache.get(cacheKey) as ProductLimit[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const limits = await this.limitsRepository.getLimitsByProductId(productId);
    this.productCache.set(cacheKey, limits);

    return limits;
  }

  /**
   * Get limit by ID
   */
  public async getLimitById(limitId: number): Promise<ProductLimit | null> {
    return await this.limitsRepository.getLimitById(limitId);
  }

  /**
   * Create new product limit
   */
  public async createLimit(dto: CreateProductLimitDto, createdBy: string): Promise<number> {
    const limitId = await this.limitsRepository.createLimit(dto, createdBy);
    
    // Clear limits cache for this product
    this.productCache.del(`${CACHE_KEYS.LIMITS}:${dto.product_id}`);
    
    return limitId;
  }

  /**
   * Update product limit
   */
  public async updateLimit(limitId: number, dto: UpdateProductLimitDto, updatedBy: string): Promise<boolean> {
    // Get the limit first to know which product to clear cache for
    const limit = await this.limitsRepository.getLimitById(limitId);
    const success = await this.limitsRepository.updateLimit(limitId, dto, updatedBy);
    
    if (success && limit) {
      this.productCache.del(`${CACHE_KEYS.LIMITS}:${limit.product_id}`);
    }

    return success;
  }

  /**
   * Delete product limit
   */
  public async deleteLimit(limitId: number): Promise<boolean> {
    // Get the limit first to know which product to clear cache for
    const limit = await this.limitsRepository.getLimitById(limitId);
    const success = await this.limitsRepository.deleteLimit(limitId);
    
    if (success && limit) {
      this.productCache.del(`${CACHE_KEYS.LIMITS}:${limit.product_id}`);
    }

    return success;
  }

  // ============================================================================
  // PRODUCT COPAY
  // ============================================================================

  /**
   * Get all copay rules for a product (with caching)
   */
  public async getCopayByProductId(productId: number): Promise<ProductCopay[]> {
    const cacheKey = `${CACHE_KEYS.COPAY}:${productId}`;
    const cached = this.productCache.get(cacheKey) as ProductCopay[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const copay = await this.copayRepository.getCopayByProductId(productId);
    this.productCache.set(cacheKey, copay);

    return copay;
  }

  /**
   * Get copay by ID
   */
  public async getCopayById(copayId: number): Promise<ProductCopay | null> {
    return await this.copayRepository.getCopayById(copayId);
  }

  /**
   * Create new product copay rule
   */
  public async createCopay(dto: CreateProductCopayDto, createdBy: string): Promise<number> {
    const copayId = await this.copayRepository.createCopay(dto, createdBy);
    
    // Clear copay cache for this product
    this.productCache.del(`${CACHE_KEYS.COPAY}:${dto.product_id}`);
    
    return copayId;
  }

  /**
   * Update product copay rule
   */
  public async updateCopay(copayId: number, dto: UpdateProductCopayDto, updatedBy: string): Promise<boolean> {
    // Get the copay first to know which product to clear cache for
    const copay = await this.copayRepository.getCopayById(copayId);
    const success = await this.copayRepository.updateCopay(copayId, dto, updatedBy);
    
    if (success && copay) {
      this.productCache.del(`${CACHE_KEYS.COPAY}:${copay.product_id}`);
    }

    return success;
  }

  /**
   * Delete product copay rule
   */
  public async deleteCopay(copayId: number): Promise<boolean> {
    // Get the copay first to know which product to clear cache for
    const copay = await this.copayRepository.getCopayById(copayId);
    const success = await this.copayRepository.deleteCopay(copayId);
    
    if (success && copay) {
      this.productCache.del(`${CACHE_KEYS.COPAY}:${copay.product_id}`);
    }

    return success;
  }

  // ============================================================================
  // PRODUCT LOS THRESHOLDS
  // ============================================================================

  /**
   * Get all LOS thresholds for a product (with caching)
   */
  public async getThresholdsByProductId(productId: number): Promise<ProductLosThreshold[]> {
    const cacheKey = `${CACHE_KEYS.THRESHOLDS}:${productId}`;
    const cached = this.productCache.get(cacheKey) as ProductLosThreshold[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const thresholds = await this.thresholdsRepository.getThresholdsByProductId(productId);
    this.productCache.set(cacheKey, thresholds);

    return thresholds;
  }

  /**
   * Get LOS threshold by ID
   */
  public async getThresholdById(thresholdId: number): Promise<ProductLosThreshold | null> {
    return await this.thresholdsRepository.getThresholdById(thresholdId);
  }

  /**
   * Create new product LOS threshold
   */
  public async createThreshold(dto: CreateProductLosThresholdDto, createdBy: string): Promise<number> {
    const thresholdId = await this.thresholdsRepository.createThreshold(dto, createdBy);
    
    // Clear thresholds cache for this product
    this.productCache.del(`${CACHE_KEYS.THRESHOLDS}:${dto.product_id}`);
    
    return thresholdId;
  }

  /**
   * Update product LOS threshold
   */
  public async updateThreshold(thresholdId: number, dto: UpdateProductLosThresholdDto, updatedBy: string): Promise<boolean> {
    const threshold = await this.thresholdsRepository.getThresholdById(thresholdId);
    const success = await this.thresholdsRepository.updateThreshold(thresholdId, dto, updatedBy);
    
    if (success && threshold) {
      this.productCache.del(`${CACHE_KEYS.THRESHOLDS}:${threshold.product_id}`);
    }

    return success;
  }

  /**
   * Delete product LOS threshold
   */
  public async deleteThreshold(thresholdId: number): Promise<boolean> {
    const threshold = await this.thresholdsRepository.getThresholdById(thresholdId);
    const success = await this.thresholdsRepository.deleteThreshold(thresholdId);
    
    if (success && threshold) {
      this.productCache.del(`${CACHE_KEYS.THRESHOLDS}:${threshold.product_id}`);
    }

    return success;
  }
}
