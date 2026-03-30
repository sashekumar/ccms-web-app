/**
 * Stop Loss DTOs
 * Domain: Financial Stop-Loss Calculation Management
 *
 * Period Types: MONTHLY | QUARTERLY | ANNUAL
 */

export interface StopLossFilters {
  page?: number;
  limit?: number;
  product_id?: number;
  period_type?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  is_history_record?: boolean;
  date_from?: string;               // YYYY-MM-DD
  date_to?: string;                 // YYYY-MM-DD
  sortBy?: 'period_date' | 'created_at' | 'total_gross_premium';
  sortOrder?: 'ASC' | 'DESC';
  searchTerm?: string;
}

export interface CreateStopLossDto {
  product_id: number;
  period_type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  period_date: string;              // YYYY-MM-DD
  total_policy_count?: number;
  total_gross_premium?: number;
  claims_ol?: number;
  claims_reim?: number;
  tpa_fees?: number;
  is_history_record?: boolean;
}

export interface UpdateStopLossDto {
  period_type?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  period_date?: string;             // YYYY-MM-DD
  total_policy_count?: number;
  total_gross_premium?: number;
  claims_ol?: number;
  claims_reim?: number;
  tpa_fees?: number;
  is_history_record?: boolean;
}

export interface StopLossResponse {
  sl_id: number;
  product_id: number;
  product_name?: string;
  period_type?: string;
  period_date?: string;
  total_policy_count?: number;
  total_gross_premium?: number;
  claims_ol?: number;
  claims_reim?: number;
  tpa_fees?: number;
  is_history_record?: boolean;
  created_at: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface StopLossStatsResponse {
  total: number;
  current_records: number;
  history_records: number;
  total_gross_premium: number;
  total_claims_ol: number;
  total_claims_reim: number;
  total_tpa_fees: number;
}
