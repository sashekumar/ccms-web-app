import { DB_TABLES } from '../../../core/constants';

/**
 * Admission Entity
 * Maps to: ccms_admissions table (v7 schema)
 * 
 * Purpose: Hospital admission records for claim processing
 * 
 * Key Features:
 * - Computed LOS: los_days is auto-calculated from admission_date and discharge_date
 * - Workflow via remarks: Approval/rejection details stored in ccms_remarks table
 * - GL generation: gl_ref_no generated on approval (format: GL-YYYY-NNNN)
 * - Soft delete: is_deleted flag for data retention
 * 
 * Workflow States (admission_status):
 * - PENDING_APPROVAL: Awaiting medical officer review
 * - APPROVED: Approved and GL generated
 * - REJECTED: Declined with reason in ccms_remarks
 * - PENDING_MQ: Medical query requested
 * - MQ_RESPONDED: Hospital responded to MQ
 * 
 * v7 Schema Compliance: Strictly follows ccms_admissions table structure
 * 
 * Relationships:
 * - BelongsTo: Claim (claim_id FK to ccms_claims)
 * - HasMany: Remarks (polymorphic via ref_type='ADMISSION', ref_id=admission_id)
 * - HasMany: AdmissionAssessments (for dynamic EAV fields)
 */
export interface Admission {
  admission_id: number;
  
  // Legacy migration support
  legacy_admission_id?: string | null;
  
  // References
  claim_id: number;  // FK to ccms_claims (parent claim record)
  
  // GL reference (generated on approval)
  gl_ref_no?: string | null;  // Format: GL-2026-0001
  
  // Admission dates
  admission_date?: Date | null;
  discharge_date?: Date | null;
  los_days?: number | null;  // Computed: DATEDIFF(day, admission_date, discharge_date)
  
  // Workflow status
  admission_status?: string | null;  // PENDING_APPROVAL | APPROVED | REJECTED | PENDING_MQ | etc.
  
  // Admission details
  admission_type?: string | null;  // EMERGENCY | ELECTIVE (from ccms_m_lookups: ADMISSION_TYPE)
  room_type?: string | null;       // STANDARD_WARD | SINGLE_ROOM | ICU | SUITE (from ccms_m_lookups: ROOM_TYPE)
  room_rate?: number | null;       // Daily room charge (MONEY)
  
  // ICU tracking
  icu_days?: number | null;        // Number of days in ICU
  icu_rate?: number | null;        // ICU daily rate (MONEY)
  
  // Enhanced Healthcare Management (8HM)
  ehm_status?: string | null;      // EHM tracking status (from ccms_m_lookups: EHM_STATUS)
  
  // Deferment tracking
  deferment_status?: string | null;  // Deferment state (from ccms_m_lookups: DEFERMENT_STATUS)
  
  // Alerts
  alert_flag?: boolean;            // LOS alert triggered (BIT)
  
  // Audit fields
  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date | null;
  updated_by?: string | null;
  
  // Soft delete
  is_deleted?: boolean;  // Soft delete flag
  
  // Joined data (from related tables - available in some queries)
  claim_ref_no?: string;      // From ccms_claims
  member_name?: string;        // From ccms_members via ccms_claims
  hospital_name?: string;      // From ccms_hospitals via ccms_claims
}

/**
 * Admission List Item (for grid view)
 * Includes computed fields and joined data
 */
export interface AdmissionListItem {
  admission_id: number;
  claim_id: number;
  gl_ref_no?: string | null;
  admission_date?: Date | null;
  discharge_date?: Date | null;
  los_days?: number | null;
  admission_status?: string | null;
  admission_type?: string | null;
  room_type?: string | null;
  room_rate?: number | null;
  alert_flag?: boolean;
  created_at?: Date;
  created_by?: string | null;
  
  // Joined data (from related tables)
  claim_ref_no?: string;      // From ccms_claims
  member_name?: string;        // From ccms_members via ccms_claims
  hospital_name?: string;      // From ccms_hospitals via ccms_claims
}

/**
 * Admission Filters for listing
 */
export interface AdmissionFilters {
  admission_status?: string;
  admission_type?: string;
  room_type?: string;
  claim_id?: number;
  hospital_id?: number;
  member_id?: number;
  admission_date_from?: Date;
  admission_date_to?: Date;
  discharge_date_from?: Date;
  discharge_date_to?: Date;
  has_alert?: boolean;
  search?: string;  // Search across claim_ref_no, member name, hospital name
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  is_deleted?: boolean;
}

/**
 * Paginated Admissions Response
 */
export interface PaginatedAdmissions {
  admissions: AdmissionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Table name constant
 */
export const ADMISSIONS_TABLE = DB_TABLES.ADMISSIONS;
