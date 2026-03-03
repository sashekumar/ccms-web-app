/**
 * Type definitions for Product Copay
 * Schema: ccms_new_schema_2026_v6.sql - ccms_product_copay table
 */

export interface ProductCopay {
  copay_id: number;
  legacy_product_copay_id?: string | null;
  product_id: number;
  copay_type?: string | null;        // PERCENTAGE, FIXED
  copay_value?: number | null;       // DECIMAL(10,2)
  applies_to?: string | null;        // Description of what this copay applies to
  is_active: boolean;
}

export interface CreateProductCopayDto {
  product_id: number;
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

export interface GetProductCopayRequest {
  copay_id: number;
}
