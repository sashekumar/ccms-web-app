/**
 * Audit Trail - Entity Definitions
 * Defines interfaces for audit logs and admission log entities
 */

// System-wide audit trail (all table changes)
export interface AuditLogEntity {
  audit_id: bigint;
  legacy_audit_log_id?: string | null;
  table_name: string;
  record_id: bigint;
  action_type: string; // 'CREATE', 'UPDATE', 'DELETE'
  old_value?: string | null;
  new_value?: string | null;
  changed_by: string;
  changed_at: Date;
  created_at: Date;
  created_by?: string | null;
  updated_at?: Date | null;
  updated_by?: string | null;
}

// Admission-specific change log
export interface AdmissionLogEntity {
  log_id: bigint;
  legacy_admission_log_id?: string | null;
  admission_id: bigint;
  change_type: string;
  change_description?: string | null;
  changed_by: string;
  changed_at: Date;
  created_at: Date;
  created_by?: string | null;
  updated_at?: Date | null;
  updated_by?: string | null;
}
