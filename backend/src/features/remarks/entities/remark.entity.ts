import { DB_TABLES } from '../../../core/constants';

/**
 * Remark Entity
 * Maps to: ccms_remarks table (v7 schema)
 * 
 * Purpose: Records workflow actions, decisions, and notes for any entity (claims, admissions, etc.)
 * This is a polymorphic table used for approval tracking, rejection reasons, MQ notes, etc.
 * 
 * Key Features:
 * - Polymorphic: Works with multiple entity types via ref_type + ref_id
 * - Workflow tracking: action_for field indicates purpose (APPROVAL, REJECTION, CLARIFICATION, etc.)
 * - Audit trail: Preserves who did what and when
 * - Legacy migration support: legacy_remark_id for data migration
 * 
 * Usage Examples:
 * - Admission Approval: ref_type='ADMISSION', action_for='APPROVAL', remark_text='Approved for RM 8,000'
 * - Admission Rejection: ref_type='ADMISSION', action_for='REJECTION', remark_text='Missing documents'
 * - MQ Request: ref_type='CLAIM', action_for='CLARIFICATION', remark_text='Need diagnosis clarification'
 * 
 * Relationships:
 * - Polymorphic to Admissions, Claims, Escalations, Investigations, etc.
 * 
 * v7 Schema Compliance: Strictly follows ccms_remarks table structure from v7 schema
 */
export interface Remark {
  remark_id: number;
  
  // Legacy migration support
  legacy_remark_id?: string | null;
  
  // Polymorphic references (which entity this remark is for)
  ref_type: string;  // Values: 'CLAIM', 'ADMISSION', 'ESCALATION', 'INVESTIGATION', 'PA', 'REMINDER', etc.
  ref_id: number;    // ID of the referenced entity (e.g., admission_id if ref_type='ADMISSION')
  ref_desc?: string | null;  // Description/title of reference (e.g., "Admission for John Doe")
  
  // Workflow tracking
  action_for?: string | null;  // Purpose: 'INVESTIGATION', 'APPROVAL', 'CLARIFICATION', 'REJECTION', 'FOLLOW_UP', 'MQ_RESPONSE', etc.
  remark_text?: string | null;  // The actual remark content (can be JSON for structured data)
  
  // Audit fields
  created_by?: string | null;
  created_at: Date;
  updated_by?: string | null;
  updated_at?: Date | null;
}

/**
 * Create Remark DTO
 * Used when creating a new remark entry
 */
export interface CreateRemarkDto {
  ref_type: string;
  ref_id: number;
  ref_desc?: string;
  action_for?: string;
  remark_text?: string;
  created_by?: string;
}

/**
 * Remark Filters for querying
 */
export interface RemarkFilters {
  ref_type?: string;
  ref_id?: number;
  action_for?: string;
  created_by?: string;
  date_from?: Date;
  date_to?: Date;
  limit?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Paginated Remarks Response
 */
export interface PaginatedRemarks {
  remarks: Remark[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Table name constant
 */
export const REMARKS_TABLE = DB_TABLES.REMARKS;
