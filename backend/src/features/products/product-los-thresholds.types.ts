/**
 * Type definitions for Product LOS Alert Thresholds
 * Schema: ccms_new_schema_2026_v7.sql - ccms_los_alert_thresholds table
 */

export interface ProductLosThreshold {
  threshold_id: number;
  legacy_los_threshold_id?: string | null;
  product_id?: number | null;
  diagnosis_category?: string | null;
  threshold_days?: number | null;
  alert_level?: number | null;
  is_active: boolean;
  created_at?: Date;
}

export interface CreateProductLosThresholdDto {
  product_id?: number;
  diagnosis_category?: string;
  threshold_days?: number;
  alert_level?: number;
  is_active?: boolean;
}

export interface UpdateProductLosThresholdDto {
  diagnosis_category?: string;
  threshold_days?: number;
  alert_level?: number;
  is_active?: boolean;
}

export interface GetProductLosThresholdRequest {
  threshold_id: number;
}
