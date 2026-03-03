/**
 * Product Test Helpers and Fixtures
 * 
 * @description Shared test utilities for product-related component tests
 * 
 * PURPOSE:
 * - Provides type-safe mock interfaces for all product services
 * - Offers reusable test helper functions to reduce code duplication
 * - Supplies standard mock data fixtures for consistent testing
 * 
 * USAGE:
 * Import the needed helpers in your test files:
 * ```typescript
 * import {
 *   MockProductService,
 *   mockProduct,
 *   mockProductListItem,
 *   mockLimit,
 *   mockCopay
 * } from '../testing/product-test-helpers';
 * ```
 */

import { Mock, vi } from 'vitest';
import {
  Product,
  ProductListItem,
  ProductLimit,
  ProductCopay,
  PaginatedProducts
} from '../../../shared/models/product.model';

// ============================================================================
// TYPE-SAFE MOCK INTERFACES
// ============================================================================

/**
 * Type-safe mock interface for ProductService
 */
export interface MockProductService {
  getProducts: Mock;
  getProductById: Mock;
  checkPlanCode: Mock;
  createProduct: Mock;
  updateProduct: Mock;
  deleteProduct: Mock;
  activateProduct: Mock;
  deactivateProduct: Mock;
  getLimitsByProductId: Mock;
  getLimitById: Mock;
  createLimit: Mock;
  updateLimit: Mock;
  deleteLimit: Mock;
  getCopayByProductId: Mock;
  getCopayById: Mock;
  createCopay: Mock;
  updateCopay: Mock;
  deleteCopay: Mock;
}

/**
 * Type-safe mock interface for Angular Router
 */
export interface MockRouter {
  navigate: Mock;
}

/**
 * Type-safe mock interface for ToastService
 */
export interface MockToastService {
  success: Mock;
  error: Mock;
  info: Mock;
  warning: Mock;
}

/**
 * Type-safe mock interface for LoggerService
 */
export interface MockLoggerService {
  info: Mock;
  error: Mock;
  warn: Mock;
  debug: Mock;
}

// ============================================================================
// MOCK DATA FIXTURES
// ============================================================================

/**
 * Standard mock product data for testing
 */
export const mockProduct: Product = {
  product_id: '1',
  legacy_product_id: 'LEG001',
  insurer_name: 'Test Insurer',
  plan_code: 'TEST001',
  plan_name: 'Test Plan',
  is_active: true,
  created_at: new Date('2024-01-01')
};

/**
 * Standard mock product list item for testing
 */
export const mockProductListItem: ProductListItem = {
  product_id: '1',
  legacy_product_id: 'LEG001',
  insurer_name: 'Test Insurer',
  plan_code: 'TEST001',
  plan_name: 'Test Plan',
  is_active: true
};

/**
 * Standard mock product limit for testing
 */
export const mockLimit: ProductLimit = {
  limit_id: '1',
  product_id: '1',
  legacy_product_limit_id: 'LEG_LIM001',
  limit_type: 'ANNUAL',
  limit_amount: 100000,
  is_active: true
};

/**
 * Standard mock product copay for testing
 */
export const mockCopay: ProductCopay = {
  copay_id: '1',
  product_id: '1',
  legacy_product_copay_id: 'LEG_COP001',
  copay_type: 'PERCENTAGE',
  copay_value: 10,
  applies_to: 'ALL',
  is_active: true
};

/**
 * Standard mock paginated products for testing
 */
export const mockPaginatedProducts: PaginatedProducts = {
  products: [mockProductListItem],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1
};

/**
 * Multiple mock products for list testing
 */
export const mockProductsList: ProductListItem[] = [
  mockProductListItem,
  {
    product_id: '2',
    legacy_product_id: 'LEG002',
    insurer_name: 'Another Insurer',
    plan_code: 'TEST002',
    plan_name: 'Another Plan',
    is_active: false
  },
  {
    product_id: '3',
    insurer_name: 'Third Insurer',
    plan_code: 'TEST003',
    plan_name: 'Third Plan',
    is_active: true
  }
];

/**
 * Multiple mock limits for testing
 */
export const mockLimitsList: ProductLimit[] = [
  mockLimit,
  {
    limit_id: '2',
    product_id: '1',
    limit_type: 'LIFETIME',
    limit_amount: 500000,
    is_active: true
  },
  {
    limit_id: '3',
    product_id: '1',
    limit_type: 'ROOM_BOARD',
    limit_amount: 200,
    is_active: false
  }
];

/**
 * Multiple mock copay entries for testing
 */
export const mockCopayList: ProductCopay[] = [
  mockCopay,
  {
    copay_id: '2',
    product_id: '1',
    copay_type: 'FIXED',
    copay_value: 50,
    applies_to: 'OUTPATIENT',
    is_active: true
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a mock form object for testing
 */
export function createMockForm(valid: boolean = true): any {
  return {
    valid,
    invalid: !valid
  };
}

/**
 * Stubs window.confirm to return a specific value
 */
export function stubConfirm(returnValue: boolean = true): any {
  return vi.spyOn(window, 'confirm').mockReturnValue(returnValue);
}

/**
 * Generates a mock product with custom overrides
 */
export function generateMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    ...mockProduct,
    ...overrides
  };
}

/**
 * Generates a mock product list item with custom overrides
 */
export function generateMockProductListItem(overrides: Partial<ProductListItem> = {}): ProductListItem {
  return {
    ...mockProductListItem,
    ...overrides
  };
}

/**
 * Generates a mock limit with custom overrides
 */
export function generateMockLimit(overrides: Partial<ProductLimit> = {}): ProductLimit {
  return {
    ...mockLimit,
    ...overrides
  };
}

/**
 * Generates a mock copay with custom overrides
 */
export function generateMockCopay(overrides: Partial<ProductCopay> = {}): ProductCopay {
  return {
    ...mockCopay,
    ...overrides
  };
}

/**
 * Generates mock paginated products with custom data
 */
export function generateMockPaginatedProducts(
  products: ProductListItem[] = [mockProductListItem],
  total: number = products.length,
  page: number = 1,
  limit: number = 10
): PaginatedProducts {
  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
