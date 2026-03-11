/**
 * Type definitions for Product Limits
 * Schema: ccms_new_schema_2026_v6.sql - ccms_product_limits table
 */

export interface ProductLimit {
  limit_id: number;
  legacy_product_limit_id?: string | null;
  product_id: number;
  limit_type?: string | null;    // ANNUAL, LIFETIME, ROOM_BOARD, SURGICAL
  limit_amount?: number | null;  // MONEY type (maps to number in TypeScript)
  is_active: boolean;
}

export interface CreateProductLimitDto {
  product_id: number;
  limit_type?: string;
  limit_amount?: number;
  is_active?: boolean;
}

export interface UpdateProductLimitDto {
  limit_type?: string;
  limit_amount?: number;
  is_active?: boolean;
}

export interface GetProductLimitRequest {
  limit_id: number;
}
