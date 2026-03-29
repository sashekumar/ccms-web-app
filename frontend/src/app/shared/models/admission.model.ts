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
  member_id?: number;
  hospital_id?: number;
  member_name?: string;
  hospital_name?: string;
  policy_record_id?: number;
  estimated_amount?: number;
  diagnosis?: string;
  diagnosis_category?: string;
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
  diagnosisCategory?: string; // Links to LOS threshold logic (from DIAGNOSIS_CATEGORY lookup)
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
  approved_amount?: number;    // RM amount committed for this admission
  ehm_status?: string;         // 8-hour monitoring status
  discharge_date?: Date | string; // Updated expected discharge
  alert_flag?: boolean;        // Enable LOS alerts (default: check category)
  remarks?: string;            // General approval notes
}

export interface RejectAdmissionDto {
  rejectionReason: string;     // Required rejection reason
}

export interface SendMedicalQueryDto {
  queryText: string;  // Required MQ text
  dueDate?: string;   // Optional due date for hospital response
}

export interface RespondToMQDto {
  responseText: string;   // Required hospital response
  attachments?: string;   // Optional file references
  document?: {            // Optional: Uploaded file details
    fileName: string;
    filePath: string;
    fileSize: number;
    fileExtension: string;
  };
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
  
  // Attachment info (joined from ccms_documents)
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
}

// ============================================================================
// CLINICAL ASSESSMENTS (ccms_admission_assessments)
// ============================================================================

export interface AdmissionAssessment {
  assessment_id: number;
  admission_id: number;
  field_name: string;
  field_value: string | null;
  created_at: Date | string;
  created_by: string;
  updated_at: Date | string;
  updated_by: string;
}

export interface AssessmentFieldDto {
  field_name: string;
  field_value: string | null;
}

export interface UpsertAssessmentDto {
  admission_id: number;
  fields: AssessmentFieldDto[];
}

export const ASSESSMENT_FIELDS = [
  { key: 'DIAGNOSIS_CODE',        label: 'Diagnosis Code',                  type: 'text' as const },
  { key: 'DIAGNOSIS_DESCRIPTION', label: 'Diagnosis Description',           type: 'textarea' as const },
  { key: 'MEDICAL_NECESSITY',     label: 'Medical Necessity Justification', type: 'textarea' as const },
  { key: 'ATTENDING_PHYSICIAN',   label: 'Attending Physician',             type: 'text' as const },
  { key: 'COMPLICATIONS',         label: 'Complications / Comorbidities',   type: 'textarea' as const },
  { key: 'TREATMENT_PLAN',        label: 'Treatment Plan',                  type: 'textarea' as const },
  { key: 'PROGNOSIS',             label: 'Prognosis',                       type: 'select' as const, options: ['GOOD', 'FAIR', 'POOR', 'CRITICAL'] as const },
  { key: 'CLINICAL_NOTES',        label: 'Additional Clinical Notes',       type: 'textarea' as const }
];
