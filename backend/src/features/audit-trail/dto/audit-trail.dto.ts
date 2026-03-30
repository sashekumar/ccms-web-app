/**
 * Audit Trail - Data Transfer Objects
 * API request/response models for audit logs and admission logs
 */

// ============================================================================
// FILTERS & SEARCH PARAMS
// ============================================================================

export interface AuditLogFilters {
  table_name?: string;
  record_id?: bigint;
  action_type?: string; // 'CREATE', 'UPDATE', 'DELETE'
  changed_by?: string;
  changed_after?: Date;
  changed_before?: Date;
}

export interface AdmissionLogFilters {
  admission_id?: bigint;
  change_type?: string;
  changed_by?: string;
  changed_after?: Date;
  changed_before?: Date;
}

// ============================================================================
// CREATE / UPDATE DTOs
// ============================================================================

export interface CreateAuditLogDto {
  table_name: string;
  record_id: bigint;
  action_type: string;
  old_value?: string | null;
  new_value?: string | null;
  changed_by: string;
}

export interface CreateAdmissionLogDto {
  admission_id: bigint;
  change_type: string;
  change_description?: string | null;
  changed_by: string;
}

export interface UpdateAuditLogDto {
  old_value?: string | null;
  new_value?: string | null;
}

export interface UpdateAdmissionLogDto {
  change_description?: string | null;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface AuditLogRecord {
  audit_id: bigint;
  table_name: string;
  record_id: bigint;
  action_type: string;
  old_value?: string | null;
  new_value?: string | null;
  changed_by: string;
  changed_at: Date;
}

export interface AdmissionLogRecord {
  log_id: bigint;
  admission_id: bigint;
  change_type: string;
  change_description?: string | null;
  changed_by: string;
  changed_at: Date;
}

export interface AuditTrailStatsResponse {
  total_audit_entries: number;
  total_admission_entries: number;
  audit_entries_today: number;
  admission_entries_today: number;
  top_modified_table: string | null;
  top_modifier: string | null;
}

export interface AuditHistory {
  auditLogs: AuditLogRecord[];
  admissionLogs: AdmissionLogRecord[];
}

export interface PaginatedAuditResponse<T> {
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
