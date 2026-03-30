/**
 * FWD Accumulation DTOs
 * Domain: FWD Insurer Benefit Accumulation Tracking
 *
 * Sub-types: CLIENT | DISABILITY | ONETIME | PA
 */

// ============================================================================
// FILTERS
// ============================================================================

export interface FwdClientFilters {
  page?: number;
  limit?: number;
  member_id?: number;
  fwd_client_no?: string;
  period_year?: number;
  period_month?: number;
  sortBy?: 'period_year' | 'period_month' | 'accumulated_amount' | 'as_at_date';
  sortOrder?: 'ASC' | 'DESC';
  searchTerm?: string;
}

export interface FwdDisabilityFilters {
  page?: number;
  limit?: number;
  disability_code?: string;
  period_year?: number;
  period_month?: number;
  sortBy?: 'period_year' | 'period_month' | 'accumulated_amount';
  sortOrder?: 'ASC' | 'DESC';
  searchTerm?: string;
}

export interface FwdOnetimeFilters {
  page?: number;
  limit?: number;
  member_id?: number;
  benefit_code?: string;
  sortBy?: 'accumulated_amount' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
  searchTerm?: string;
}

export interface FwdPaFilters {
  page?: number;
  limit?: number;
  pa_id?: number;
  claim_id?: number;
  sortBy?: 'accumulated_amount' | 'as_at_date' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
  searchTerm?: string;
}

// ============================================================================
// CREATE DTOs
// ============================================================================

export interface CreateFwdClientDto {
  member_id: number;
  fwd_client_no?: string;
  period_year?: number;
  period_month?: number;
  accumulated_amount?: number;
  as_at_date?: string;           // YYYY-MM-DD
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
  as_at_date?: string;           // YYYY-MM-DD
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

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
