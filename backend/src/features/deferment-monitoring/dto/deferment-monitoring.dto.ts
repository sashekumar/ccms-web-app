/**
 * Deferment Monitoring - Data Transfer Objects
 * Filters, requests, and response DTOs
 */

// ========================================================================
// FILTERS
// ========================================================================

export interface DefermentMonitoringFilters {
  admission_id?: bigint;
  claim_id?: bigint;
  deferment_status?: string;
  escalation_status?: string;
  escalated_to?: string;
  expected_resolution_after?: string;
  expected_resolution_before?: string;
  search?: string;
}

// ========================================================================
// CREATE/UPDATE DTOs
// ========================================================================

export interface CreateDefermentDto {
  admission_id: bigint;
  deferment_reason: string;
  expected_resolution_date?: Date;
  notes?: string;
  updated_by: string;
}

export interface UpdateDefermentDto {
  deferment_status?: string;
  deferment_reason?: string;
  expected_resolution_date?: Date;
  notes?: string;
  updated_by: string;
}

export interface ResolveDefermentDto {
  resolution_notes: string;
  resolved_by: string;
}

// ========================================================================
// RESPONSE DTOs
// ========================================================================

export interface DefermentMonitoringRecord {
  admission_id: bigint;
  claim_id: bigint;
  member_id: bigint;
  deferment_status: string;
  deferment_reason?: string | null;
  expected_resolution_date?: Date | null;
  escalation_id?: bigint | null;
  escalation_status?: string | null;
  escalated_to?: string | null;
  last_updated_by: string;
  updated_at: Date;
  created_at: Date;
}

export interface DefermentMonitoringStatsResponse {
  total_deferred: number;
  pending_deferrals: number;
  under_review_deferrals: number;
  resolved_deferrals: number;
  closed_deferrals: number;
  overdue_deferrals: number;
  top_deferment_reason: string | null;
  average_resolution_time_days: number;
}

export interface PaginatedDefermentMonitoringResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
