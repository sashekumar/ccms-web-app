/**
 * Type definitions for Products module (Policy Management)
 * Schema: ccms_new_schema_2026_v6.sql - ccms_products table
 */

export interface Product {
  product_id: number;
  legacy_product_id?: string | null;
  insurer_name?: string | null;
  plan_code: string;
  plan_name?: string | null;
  is_active: boolean;
  created_at?: Date;
}

export interface ProductListItem {
  product_id: number;
  legacy_product_id?: string | null;
  insurer_name?: string | null;
  plan_code: string;
  plan_name?: string | null;
  is_active: boolean;
}

export interface CreateProductDto {
  plan_code: string;
  plan_name?: string;
  insurer_name?: string;
  is_active?: boolean;
}

export interface UpdateProductDto {
  plan_code?: string;
  plan_name?: string;
  insurer_name?: string;
  is_active?: boolean;
}

export interface ProductFilters {
  search?: string;           // Search in plan_code or plan_name
  insurer_name?: string;     // Filter by insurer
  is_active?: boolean;       // Filter by active status
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedProducts {
  data: ProductListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetProductRequest {
  product_id: number;
}

export interface CheckPlanCodeRequest {
  plan_code: string;
  product_id?: number;  // Exclude this ID when checking (for updates)
}

export interface CheckPlanCodeResponse {
  exists: boolean;
  message: string;
}

export interface ActivateProductRequest {
  product_id: number;
}

export interface DeactivateProductRequest {
  product_id: number;
}
