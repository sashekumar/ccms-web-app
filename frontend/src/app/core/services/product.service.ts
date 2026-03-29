import { Injectable } from '@angular/core';
import { ApiResponse } from './base-api.service';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants';
import {
  Product,
  ProductListItem,
  CreateProductDto,
  UpdateProductDto,
  ProductFilters,
  PaginatedProducts,
  ProductLimit,
  CreateProductLimitDto,
  UpdateProductLimitDto,
  ProductCopay,
  CreateProductCopayDto,
  UpdateProductCopayDto,
  ProductLosThreshold,
  CreateProductLosThresholdDto,
  UpdateProductLosThresholdDto
} from '../../shared/models/product.model';

/**
 * Product Service - Handles products/policy management operations
 */
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private api: ApiService) {}

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  /**
   * Get paginated list of products with filters
   */
  getProducts(filters: ProductFilters = {}): Observable<PaginatedProducts> {
    return this.api.post<ApiResponse<{ data: ProductListItem[]; pagination: any }>>(
      API_ENDPOINTS.PRODUCTS.LIST,
      filters
    ).pipe(
      map(response => {
        const { data, pagination } = response.data;
        return {
          products: data,
          total: pagination.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: pagination.totalPages
        };
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Get product by ID
   */
  getProductById(product_id: string): Observable<Product> {
    return this.api.post<ApiResponse<Product>>(
      API_ENDPOINTS.PRODUCTS.GET,
      { product_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Check if plan code exists
   */
  checkPlanCode(plan_code: string, product_id?: string): Observable<{ exists: boolean; message: string }> {
    return this.api.post<ApiResponse<{ exists: boolean; message: string }>>(
      API_ENDPOINTS.PRODUCTS.CHECK_CODE,
      { plan_code, product_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Create new product
   */
  createProduct(dto: CreateProductDto): Observable<string> {
    return this.api.post<ApiResponse<{ product_id: string }>>(
      API_ENDPOINTS.PRODUCTS.CREATE,
      dto
    ).pipe(
      map(response => response.data.product_id),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Update product
   */
  updateProduct(product_id: string, dto: UpdateProductDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.PRODUCTS.UPDATE,
      { product_id, ...dto }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Delete product (deactivate)
   */
  deleteProduct(product_id: string): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PRODUCTS.DELETE,
      { product_id }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Activate product
   */
  activateProduct(product_id: string): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PRODUCTS.activate(product_id),
      {}
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Deactivate product
   */
  deactivateProduct(product_id: string): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PRODUCTS.deactivate(product_id),
      {}
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  // ============================================================================
  // PRODUCT LIMITS
  // ============================================================================

  /**
   * Get all limits for a product
   */
  getLimitsByProductId(product_id: string): Observable<ProductLimit[]> {
    return this.api.post<ApiResponse<ProductLimit[]>>(
      API_ENDPOINTS.PRODUCTS.LIMITS.list(product_id),
      {}
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Get limit by ID
   */
  getLimitById(product_id: string, limit_id: string): Observable<ProductLimit> {
    return this.api.post<ApiResponse<ProductLimit>>(
      API_ENDPOINTS.PRODUCTS.LIMITS.get(product_id),
      { limit_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Create new product limit
   */
  createLimit(product_id: string, dto: Omit<CreateProductLimitDto, 'product_id'>): Observable<string> {
    return this.api.post<ApiResponse<{ limit_id: string }>>(
      API_ENDPOINTS.PRODUCTS.LIMITS.create(product_id),
      dto
    ).pipe(
      map(response => response.data.limit_id),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Update product limit
   */
  updateLimit(product_id: string, limit_id: string, dto: UpdateProductLimitDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.PRODUCTS.LIMITS.update(product_id, limit_id),
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Delete product limit
   */
  deleteLimit(product_id: string, limit_id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.PRODUCTS.LIMITS.delete(product_id, limit_id)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  // ============================================================================
  // PRODUCT COPAY
  // ============================================================================

  /**
   * Get all copay rules for a product
   */
  getCopayByProductId(product_id: string): Observable<ProductCopay[]> {
    return this.api.post<ApiResponse<ProductCopay[]>>(
      API_ENDPOINTS.PRODUCTS.COPAY.list(product_id),
      {}
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Get copay by ID
   */
  getCopayById(product_id: string, copay_id: string): Observable<ProductCopay> {
    return this.api.post<ApiResponse<ProductCopay>>(
      API_ENDPOINTS.PRODUCTS.COPAY.get(product_id),
      { copay_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Create new product copay rule
   */
  createCopay(product_id: string, dto: Omit<CreateProductCopayDto, 'product_id'>): Observable<string> {
    return this.api.post<ApiResponse<{ copay_id: string }>>(
      API_ENDPOINTS.PRODUCTS.COPAY.create(product_id),
      dto
    ).pipe(
      map(response => response.data.copay_id),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Update product copay rule
   */
  updateCopay(product_id: string, copay_id: string, dto: UpdateProductCopayDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.PRODUCTS.COPAY.update(product_id, copay_id),
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Delete product copay rule
   */
  deleteCopay(product_id: string, copay_id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.PRODUCTS.COPAY.delete(product_id, copay_id)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  // ============================================================================
  // PRODUCT LOS THRESHOLDS
  // ============================================================================

  /**
   * Get all LOS thresholds for a product
   */
  getThresholdsByProductId(product_id: string): Observable<ProductLosThreshold[]> {
    return this.api.post<ApiResponse<ProductLosThreshold[]>>(
      API_ENDPOINTS.PRODUCTS.THRESHOLDS.list(product_id),
      {}
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Get LOS threshold by ID
   */
  getThresholdById(product_id: string, threshold_id: string): Observable<ProductLosThreshold> {
    return this.api.post<ApiResponse<ProductLosThreshold>>(
      API_ENDPOINTS.PRODUCTS.THRESHOLDS.get(product_id),
      { threshold_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Create new product LOS threshold
   */
  createThreshold(product_id: string, dto: Omit<CreateProductLosThresholdDto, 'product_id'>): Observable<string> {
    return this.api.post<ApiResponse<{ threshold_id: string }>>(
      API_ENDPOINTS.PRODUCTS.THRESHOLDS.create(product_id),
      dto
    ).pipe(
      map(response => response.data.threshold_id),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Update product LOS threshold
   */
  updateThreshold(product_id: string, threshold_id: string, dto: UpdateProductLosThresholdDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.PRODUCTS.THRESHOLDS.update(product_id, threshold_id),
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Delete product LOS threshold
   */
  deleteThreshold(product_id: string, threshold_id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.PRODUCTS.THRESHOLDS.delete(product_id, threshold_id)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }
}
