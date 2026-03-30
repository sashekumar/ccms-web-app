/**
 * Claim Tracking & SLA Models
 * Frontend interfaces for claim status logs, milestones, and durations.
 */

export type ClaimTrackingTabType = 'STATUS_LOG' | 'MILESTONES' | 'DURATIONS';

// ============================================================================
// FILTERS
// ============================================================================

export interface StatusLogFilters {
  claim_id?: number;
  new_status?: string;
  changed_by?: string;
  date_from?: string;
  date_to?: string;
  searchTerm?: string;
  sortBy?: 'changed_at' | 'new_status' | 'claim_id';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface MilestoneFilters {
  claim_id?: number;
  milestone_name?: string;
  date_from?: string;
  date_to?: string;
  searchTerm?: string;
  sortBy?: 'milestone_date' | 'milestone_name' | 'claim_id';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface DurationFilters {
  claim_id?: number;
  status?: string;
  min_days?: number;
  max_days?: number;
  searchTerm?: string;
  sortBy?: 'duration_days' | 'start_date' | 'claim_id';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

// ============================================================================
// RECORDS
// ============================================================================

export interface StatusLogRecord {
  log_id: number;
  claim_id?: number;
  claim_ref_no?: string;
  old_status?: string;
  new_status?: string;
  changed_by?: string;
  changed_at?: string;
  notes?: string;
  created_at?: string;
  created_by?: string;
}

export interface MilestoneRecord {
  milestone_id: number;
  claim_id?: number;
  claim_ref_no?: string;
  milestone_name?: string;
  milestone_date?: string;
  created_at?: string;
  created_by?: string;
}

export interface DurationRecord {
  duration_id: number;
  claim_id?: number;
  claim_ref_no?: string;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  status?: string;
  created_at?: string;
  created_by?: string;
}

// ============================================================================
// STATS
// ============================================================================

export interface ClaimTrackingStatsResponse {
  total_status_log_entries: number;
  total_milestones: number;
  total_durations: number;
  avg_duration_days: number;
  max_duration_days: number;
  open_durations: number;
}

export interface ClaimHistory {
  status_logs: StatusLogRecord[];
  milestones: MilestoneRecord[];
  durations: DurationRecord[];
}

export interface PaginatedTrackingResponse<T> {
  data: T[];
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
