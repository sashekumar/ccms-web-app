/**
 * FWD Accumulation Tracking Models
 * Frontend interfaces for FWD Accumulation DTOs and responses
 */

export type FwdAccumulationType = 'CLIENT' | 'DISABILITY' | 'ONETIME' | 'PA';

// ============================================================================
// FILTERS
// ============================================================================

export interface FwdClientFilters {
  member_id?: number;
  fwd_client_no?: string;
  period_year?: number;
  period_month?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface FwdDisabilityFilters {
  disability_code?: string;
  period_year?: number;
  period_month?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface FwdOnetimeFilters {
  member_id?: number;
  benefit_code?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface FwdPaFilters {
  pa_id?: number;
  claim_id?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

// ============================================================================
// RECORDS
// ============================================================================

export interface FwdClientRecord {
  client_acc_id: number;
  member_id?: number;
  member_name?: string;
  member_ic?: string;
  fwd_client_no?: string;
  period_year?: number;
  period_month?: number;
  accumulated_amount?: number;
  as_at_date?: string;
  created_at?: string;
  created_by?: string;
}

export interface FwdDisabilityRecord {
  disability_acc_id: number;
  disability_code?: string;
  period_year?: number;
  period_month?: number;
  accumulated_amount?: number;
  created_at?: string;
  created_by?: string;
}

export interface FwdOnetimeRecord {
  onetime_acc_id: number;
  member_id?: number;
  member_name?: string;
  member_ic?: string;
  fwd_member_no?: string;
  benefit_code?: string;
  accumulated_amount?: number;
  created_at?: string;
  created_by?: string;
}

export interface FwdPaRecord {
  pa_acc_id: number;
  pa_id?: number;
  claim_id?: number;
  pa_ref_no?: string;
  claim_ref_no?: string;
  accumulated_amount?: number;
  as_at_date?: string;
  created_at?: string;
  created_by?: string;
}

// ============================================================================
// CREATE / UPDATE DTOs
// ============================================================================

export interface CreateFwdClientDto {
  member_id: number;
  fwd_client_no?: string;
  period_year?: number;
  period_month?: number;
  accumulated_amount?: number;
  as_at_date?: string;
}

export interface CreateFwdDisabilityDto {
  disability_code?: string;
  period_year?: number;
  period_month?: number;
  accumulated_amount?: number;
}

export interface CreateFwdOnetimeDto {
  member_id: number;
  fwd_member_no?: string;
  benefit_code?: string;
  accumulated_amount?: number;
}

export interface CreateFwdPaDto {
  pa_id: number;
  claim_id: number;
  accumulated_amount?: number;
  as_at_date?: string;
}

export interface UpdateFwdClientDto {
  fwd_client_no?: string;
  period_year?: number;
  period_month?: number;
  accumulated_amount?: number;
  as_at_date?: string;
}

export interface UpdateFwdDisabilityDto {
  disability_code?: string;
  period_year?: number;
  period_month?: number;
  accumulated_amount?: number;
}

export interface UpdateFwdOnetimeDto {
  fwd_member_no?: string;
  benefit_code?: string;
  accumulated_amount?: number;
}

export interface UpdateFwdPaDto {
  accumulated_amount?: number;
  as_at_date?: string;
}

// ============================================================================
// STATS
// ============================================================================

export interface FwdAccumulationStatsResponse {
  total_client_records: number;
  total_disability_records: number;
  total_onetime_records: number;
  total_pa_records: number;
  total_client_amount: number;
  total_disability_amount: number;
  total_onetime_amount: number;
  total_pa_amount: number;
}

export interface PaginatedFwdResponse<T> {
  data: T[];
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
