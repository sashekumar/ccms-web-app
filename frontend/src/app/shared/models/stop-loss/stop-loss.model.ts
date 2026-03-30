/**
 * Stop Loss Management Models
 * Frontend interfaces for Stop Loss DTOs and responses
 */

export type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export interface StopLossFilters {
  product_id?: number;
  period_type?: PeriodType;
  date_from?: string;
  date_to?: string;
  is_history_record?: boolean;
  searchTerm?: string;
  sortBy?: 'period_date' | 'total_gross_premium' | 'claims_ol' | 'total_policy_count';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface StopLossRecord {
  sl_id: number;
  legacy_stop_loss_id?: string;
  product_id?: number;
  product_name?: string;
  period_type?: PeriodType;
  period_date?: string;
  total_policy_count?: number;
  total_gross_premium?: number;
  claims_ol?: number;
  claims_reim?: number;
  tpa_fees?: number;
  is_history_record: boolean;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface CreateStopLossDto {
  product_id?: number;
  period_type?: PeriodType;
  period_date?: string;
  total_policy_count?: number;
  total_gross_premium?: number;
  claims_ol?: number;
  claims_reim?: number;
  tpa_fees?: number;
  is_history_record?: boolean;
}

export interface UpdateStopLossDto {
  product_id?: number;
  period_type?: PeriodType;
  period_date?: string;
  total_policy_count?: number;
  total_gross_premium?: number;
  claims_ol?: number;
  claims_reim?: number;
  tpa_fees?: number;
  is_history_record?: boolean;
}

export interface StopLossStatsResponse {
  total_records: number;
  current_records: number;
  history_records: number;
  total_gross_premium: number;
  total_claims_ol: number;
  total_claims_reim: number;
  total_tpa_fees: number;
}

export interface PaginatedStopLossResponse {
  data: StopLossRecord[];
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
