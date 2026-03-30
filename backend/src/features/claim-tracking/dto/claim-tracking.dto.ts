/**
 * Claim Tracking DTOs
 * Filters, creates, updates and response shapes for the 3 tracking sub-tables.
 */

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
// CREATE
// ============================================================================

export interface CreateStatusLogDto {
  claim_id: number;
  old_status?: string;
  new_status?: string;
  notes?: string;
}

export interface CreateMilestoneDto {
  claim_id: number;
  milestone_name?: string;
  milestone_date?: string;
}

export interface CreateDurationDto {
  claim_id: number;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  status?: string;
}

// ============================================================================
// UPDATE
// ============================================================================

export interface UpdateStatusLogDto {
  notes?: string;
}

export interface UpdateMilestoneDto {
  milestone_name?: string;
  milestone_date?: string;
}

export interface UpdateDurationDto {
  end_date?: string;
  duration_days?: number;
  status?: string;
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
