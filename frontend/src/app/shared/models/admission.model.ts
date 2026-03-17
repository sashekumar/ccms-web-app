/**
 * Admission model definitions
 * Aligned with backend types and v7 schema
 * 
 * NOTE: legacy_admission_id is for migration only - NOT used in forms/DTOs
 */

export interface Admission {
  admission_id: number;
  claim_id: number;
  gl_ref_no?: string | null;
  admission_date?: Date | string | null;
  discharge_date?: Date | string | null;
  los_days?: number | null;
  admission_status?: string | null;
  admission_type?: string | null;
  room_type?: string | null;
  room_rate?: number | null;
  icu_days?: number | null;
  icu_rate?: number | null;
  ehm_status?: string | null;
  deferment_status?: string | null;
  alert_flag?: boolean;
  created_at?: Date | string;
  created_by?: string | null;  // Contains user ID (VARCHAR stored)
  updated_at?: Date | string | null;
  updated_by?: string | null;  // Contains user ID (VARCHAR stored)
  is_deleted?: boolean;
  
  // Joined data (from related tables - available in some queries)
  claim_ref_no?: string;
  member_name?: string;
  hospital_name?: string;
  created_by_username?: string;  // Joined from ccms_users table
  updated_by_username?: string;  // Joined from ccms_users table
}

export interface AdmissionListItem {
  admission_id: number;
  claim_id: number;
  gl_ref_no?: string | null;
  admission_date?: Date | string | null;
  discharge_date?: Date | string | null;
  los_days?: number | null;
  admission_status?: string | null;
  admission_type?: string | null;
  room_type?: string | null;
  room_rate?: number | null;
  alert_flag?: boolean;
  created_at?: Date | string;
  created_by?: string | null;
  is_deleted?: boolean;
  
  // Joined data from backend
  claim_ref_no?: string;
  member_name?: string;
  hospital_name?: string;
}

/**
 * Create Admission DTO
 * 
 * Workflow:
 * - Frontend collects member, hospital, dates
 * - Backend auto-creates claim (CLM-YYYY-NNNNN)
 * - Backend creates admission linked to claim
 * - Returns: admission_id, claim_id, claim_ref_no
 * 
 * NOTE: NO claimId field - claim is auto-created by backend
 * Audit fields (created_by) handled by backend from JWT token
 */
export interface CreateAdmissionDto {
  memberId: number;           // Required: Patient (from member search/dropdown)
  hospitalId: number;         // Required: Hospital (from dropdown)
  policyRecordId?: number;    // Optional: Specific policy if member has multiple
  admissionDate: Date | string;
  dischargeDate?: Date | string;
  admissionType: string;      // From ADMISSION_TYPE lookup
  roomType: string;           // From ROOM_TYPE lookup
  roomRate?: number;
  icuDays?: number;
  icuRate?: number;
  ehmStatus?: string;         // From EHM_STATUS lookup
  defermentStatus?: string;   // From DEFERMENT_STATUS lookup
  estimatedAmount?: number;   // Hospital's estimated cost
  diagnosis?: string;         // Initial diagnosis
}

/**
 * Update Admission DTO
 * NOTE: NO legacy fields - frontend never sends legacy_admission_id
 * Audit fields (updated_by) handled by backend from JWT token
 */
export interface UpdateAdmissionDto {
  admissionDate?: Date | string;
  dischargeDate?: Date | string;
  admissionType?: string;
  roomType?: string;
  roomRate?: number;
  icuDays?: number;
  icuRate?: number;
  ehmStatus?: string;
  defermentStatus?: string;
}

export interface ApproveAdmissionDto {
  remarks?: string;  // Optional approval notes
}

export interface RejectAdmissionDto {
  rejectionReason: string;  // Required rejection reason
}

export interface SendMedicalQueryDto {
  queryText: string;  // Required MQ text
  dueDate?: string;   // Optional due date for hospital response
}

export interface RespondToMQDto {
  responseText: string;   // Required hospital response
  attachments?: string;   // Optional file references
}

export interface DeferAdmissionDto {
  defermentReason: string;  // Required reason for deferment
  followUpDate?: string;    // Optional follow-up date
  assignedTo?: string;      // Optional user to assign
}

export interface ResolveDefermentDto {
  resolutionNotes: string;  // Required resolution notes
}

/**
 * Create Admission Response
 * Returned when admission is successfully created
 */
export interface CreateAdmissionResponse {
  admission_id: number;
  claim_id: number;
  claim_ref_no: string;
}

export interface AdmissionFilters {
  admissionStatus?: string;
  admissionType?: string;
  roomType?: string;
  claimId?: number;
  hospitalId?: number;
  memberId?: number;
  admissionDateFrom?: Date | string;
  admissionDateTo?: Date | string;
  dischargeDateFrom?: Date | string;
  dischargeDateTo?: Date | string;
  hasAlert?: boolean;
  search?: string;  // Search claim_ref_no, member name, hospital name
  isDeleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedAdmissions {
  admissions: AdmissionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Admission with workflow history
 * Used in detail view to show approval/rejection history
 */
export interface AdmissionWithRemarks extends Admission {
  remarks?: AdmissionRemark[];
}

export interface AdmissionRemark {
  remark_id: number;
  action_for?: string;  // 'APPROVAL' | 'REJECTION' | 'CLARIFICATION' | 'CREATION' | etc.
  remark_text?: string;
  created_by?: string;
  created_by_username?: string;  // Joined from ccms_users table
  created_at: Date | string;
}
