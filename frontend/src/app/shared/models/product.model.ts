/**
 * Product model definitions (Policy Management)
 * Aligned with backend types and v6 schema
 */

export interface Product {
  product_id: string;
  legacy_product_id?: string | null;
  insurer_name?: string | null;
  plan_code: string;
  plan_name?: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface ProductListItem {
  product_id: string;
  legacy_product_id?: string | null;
  insurer_name?: string | null;
  plan_code: string;
  plan_name?: string | null;
  is_active: boolean;
}

export interface CreateProductDto {
  plan_code: string;
  plan_name?: string | null;
  insurer_name?: string | null;
  is_active?: boolean;
  legacy_product_id?: string;
}

export interface UpdateProductDto {
  plan_code?: string;
  plan_name?: string | null;
  insurer_name?: string | null;
  is_active?: boolean;
  legacy_product_id?: string;
}

export interface ProductFilters {
  search?: string;           // Search in plan_code or plan_name
  insurer_name?: string;      // Filter by insurer
  is_active?: boolean;       // Filter by active status
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedProducts {
  products: ProductListItem[];
  total: number;
  page: number;
  limit?: number;
  totalPages: number;
}

// ============================================================================
// PRODUCT LIMITS
// ============================================================================

export interface ProductLimit {
  limit_id: string;
  legacy_product_limit_id?: string | null;
  product_id: string;
  limit_type?: string | null;    // ANNUAL, LIFETIME, ROOM_BOARD, SURGICAL
  limit_amount?: number | null;
  is_active: boolean;
}

export interface CreateProductLimitDto {
  product_id: string;
  limit_type?: string;
  limit_amount?: number;
  is_active?: boolean;
  legacy_product_limit_id?: string;
}

export interface UpdateProductLimitDto {
  limit_type?: string;
  limit_amount?: number;
  is_active?: boolean;
  legacy_product_limit_id?: string;
}

// ============================================================================
// PRODUCT COPAY
// ============================================================================

export interface ProductCopay {
  copay_id: string;
  legacy_product_copay_id?: string | null;
  product_id: string;
  copay_type?: string | null;        // PERCENTAGE, FIXED
  copay_value?: number | null;
  applies_to?: string | null;
  is_active: boolean;
}

export interface CreateProductCopayDto {
  product_id: string;
  copay_type?: string;
  copay_value?: number;
  applies_to?: string;
  is_active?: boolean;
  legacy_product_copay_id?: string;
}

export interface UpdateProductCopayDto {
  copay_type?: string;
  copay_value?: number;
  applies_to?: string;
  is_active?: boolean;
  legacy_product_copay_id?: string;
}
