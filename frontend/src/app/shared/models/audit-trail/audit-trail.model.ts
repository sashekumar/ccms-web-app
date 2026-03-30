/**
 * Audit Trail - Frontend Model & Types
 * Defines TypeScript interfaces for frontend audit trail operations
 */

// Tab options for audit trail dashboard
export type AuditTrailTabType = 'AUDIT_LOGS' | 'ADMISSION_LOGS';

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface AuditLogFilters {
  table_name?: string;
  record_id?: bigint;
  action_type?: string;
  changed_by?: string;
  changed_after?: string; // ISO date string
  changed_before?: string; // ISO date string
}

export interface AdmissionLogFilters {
  admission_id?: bigint;
  change_type?: string;
  changed_by?: string;
  changed_after?: string; // ISO date string
  changed_before?: string; // ISO date string
}

// ============================================================================
// RECORD TYPES
// ============================================================================

export interface AuditLogRecord {
  audit_id: bigint;
  table_name: string;
  record_id: bigint;
  action_type: string; // CREATE, UPDATE, DELETE
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

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface AuditTrailStatsResponse {
  total_audit_entries: number;
  total_admission_entries: number;
  audit_entries_today: number;
  admission_entries_today: number;
  top_modified_table: string | null;
  top_modifier: string | null;
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

// ============================================================================
// COMPONENT STATE TYPES
// ============================================================================

export interface AuditTrailComponentState {
  // Tabs & Selection
  activeTab: AuditTrailTabType;
  selectedRecord: AuditLogRecord | AdmissionLogRecord | null;

  // Statistics
  stats: AuditTrailStatsResponse | null;
  statsLoading: boolean;
  statsError: string | null;

  // Audit Logs
  auditLogs: AuditLogRecord[];
  auditPage: number;
  auditLimit: number;
  auditTotal: number;
  auditLoading: boolean;
  auditError: string | null;
  auditFilters: AuditLogFilters;

  // Admission Logs
  admissionLogs: AdmissionLogRecord[];
  admissionPage: number;
  admissionLimit: number;
  admissionTotal: number;
  admissionLoading: boolean;
  admissionError: string | null;
  admissionFilters: AdmissionLogFilters;

  // Detail Panel
  showDetailPanel: boolean;
  detailLoading: boolean;
}
