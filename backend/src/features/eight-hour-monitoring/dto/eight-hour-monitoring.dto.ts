/**
 * Eight Hour Monitoring - Data Transfer Objects
 * Filters, requests, and response DTOs
 */

// ========================================================================
// FILTERS
// ========================================================================

export interface EightHourMonitoringFilters {
  admission_id?: bigint;
  status?: string;
  checked_by?: string;
  check_date_after?: string;
  check_date_before?: string;
  search?: string;
}

// ========================================================================
// CREATE/UPDATE DTOs
// ========================================================================

export interface CreateEightHourMonitoringDto  {
  admission_id: bigint;
  check_time: Date;
  hours_elapsed: number;
  status?: string;
  checked_by: string;
  notes?: string;
  next_check_due?: Date;
}

export interface UpdateEightHourMonitoringDto {
  check_time?: Date;
  hours_elapsed?: number;
  status?: string;
  checked_by: string;
  notes?: string;
  next_check_due?: Date;
}

// ========================================================================
// RESPONSE DTOs
// ========================================================================

export interface EightHourMonitoringRecord {
  monitoring_id: bigint;
  admission_id: bigint;
  check_time: Date;
  hours_elapsed: number;
  status: string;
  checked_by: string;
  notes?: string | null;
  next_check_due: Date;
  updated_at: Date;
  created_at: Date;
}

export interface EightHourMonitoringStatsResponse {
  total_checks: number;
  checks_today: number;
  pending_checks: number;
  completed_checks: number;
  overdue_checks: number;
  top_checker: string | null;
}

export interface PaginatedEightHourMonitoringResponse<T> {
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
