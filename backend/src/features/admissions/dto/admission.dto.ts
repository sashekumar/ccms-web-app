/**
 * Create Admission DTO
 * Used when creating a new admission request
 * 
 * Workflow:
 * 1. Backend auto-creates claim record (CLM-YYYY-NNNN)
 * 2. Backend creates admission linked to new claim
 * 3. Initial status: PENDING_APPROVAL
 * 4. GL generated only when MO approves (GL-YYYY-NNNN)
 * 
 * Validation Rules:
 * - memberId: Required, must reference existing member
 * - hospitalId: Required, must reference existing hospital
 * - admissionDate: Required
 * - dischargeDate: Optional (can be set later)
 * - admissionType: Required (from ADMISSION_TYPE lookup)
 * - roomType: Required (from ROOM_TYPE lookup)
 * - roomRate: Optional (can be calculated or entered)
 * - icuDays/icuRate: Optional (only for ICU cases)
 * - ehmStatus: Optional (defaults to 'NOT_APPLICABLE')
 * - defermentStatus: Optional (defaults to 'NOT_DEFERRED')
 * 
 * Frontend Usage:
 * - Form submission from admission-form.component.ts
 * - Member selected via member search
 * - Hospital selected from dropdown
 * - Dropdowns use LookupService.getLookupByCategory()
 */
export interface CreateAdmissionDto {
  member_id: number;               // Required: FK to ccms_members (patient)
  hospital_id: number;             // Required: FK to ccms_hospitals
  policy_record_id?: number;       // Optional: Specific policy if member has multiple
  admission_date: Date | string;   // Required: When patient admitted
  discharge_date?: Date | string;  // Optional: When patient discharged (can be null for ongoing)
  admission_type: string;          // Required: From ADMISSION_TYPE lookup (EMERGENCY, ELECTIVE)
  room_type: string;               // Required: From ROOM_TYPE lookup (STANDARD_WARD, ICU, etc.)
  room_rate?: number;              // Optional: Daily room charge
  icu_days?: number;               // Optional: Days in ICU (0 if not ICU case)
  icu_rate?: number;               // Optional: ICU daily rate
  ehm_status?: string;             // Optional: From EHM_STATUS lookup (default: NOT_APPLICABLE)
  deferment_status?: string;       // Optional: From DEFERMENT_STATUS lookup (default: NOT_DEFERRED)
  estimated_amount?: number;       // Optional: Hospital's estimated cost
  diagnosis?: string;              // Optional: Initial diagnosis
  diagnosis_category?: string;     // Optional: Connects to LOS threshold logic (from DIAGNOSIS_CATEGORY)
  alert_flag?: boolean;            // Optional: Enable LOS alert monitoring (default: false)
}

/**
 * Update Admission DTO
 * Partial update of admission details
 * 
 * Rules:
 * - All fields optional (partial update)
 * - Cannot update: admission_id, claim_id, gl_ref_no, created_by, created_at
 * - Cannot update admission_status directly (use approve/reject endpoints)
 * - Updating discharge_date auto-recalculates los_days
 */
export interface UpdateAdmissionDto {
  admission_date?: Date | string;
  discharge_date?: Date | string;
  admission_type?: string;
  room_type?: string;
  room_rate?: number;
  icu_days?: number;
  icu_rate?: number;
  ehm_status?: string;
  deferment_status?: string;
  alert_flag?: boolean;            // Optional: Toggle LOS alert monitoring
}

/**
 * Approve Admission DTO
 * Used when approving an admission (generates GL)
 * 
 * Workflow:
 * 1. Updates admission_status = 'APPROVED'
 * 2. Generates gl_ref_no (format: GL-YYYY-NNNN)
 * 3. Creates remark entry in ccms_remarks:
 *    - ref_type = 'ADMISSION'
 *    - ref_id = admission_id
 *    - action_for = 'APPROVAL'
 *    - remark_text = remarks (optional)
 * 
 * Permission Required: ADMISSIONS.APPROVE
 */
export interface ApproveAdmissionDto {
  remarks?: string;  // Optional approval notes (e.g., "Approved for RM 8,000", "Standard approval")
}

/**
 * Reject Admission DTO
 * Used when rejecting/declining an admission
 * 
 * Workflow:
 * 1. Updates admission_status = 'REJECTED'
 * 2. Creates remark entry in ccms_remarks:
 *    - ref_type = 'ADMISSION'
 *    - ref_id = admission_id
 *    - action_for = 'REJECTION'
 *    - remark_text = rejectionReason
 * 
 * Permission Required: ADMISSIONS.APPROVE
 */
export interface RejectAdmissionDto {
  rejectionReason: string;  // Required: Reason for rejection (e.g., "Missing documents", "Outside policy coverage")
}

/**
 * Send Medical Query DTO
 * Used when requesting additional medical information from hospital
 * 
 * Workflow:
 * 1. Updates admission_status = 'PENDING_MQ'
 * 2. Creates remark entry with action_for = 'MQ_SENT'
 * 3. Sends notification to hospital
 * 
 * Permission Required: ADMISSIONS.APPROVE
 */
export interface SendMedicalQueryDto {
  queryText: string;          // Required: Questions/information needed from hospital
  dueDate?: Date | string;    // Optional: Expected response date
}

/**
 * Respond to Medical Query DTO
 * Used by hospital to respond to medical query
 * 
 * Workflow:
 * 1. Updates admission_status = 'MQ_RESPONDED'
 * 2. Creates remark entry with action_for = 'MQ_RESPONSE'
 * 3. Ready for review/approval
 * 
 * Permission Required: ADMISSIONS.UPDATE or ADMISSIONS.APPROVE
 */
export interface RespondToMQDto {
  responseText: string;       // Required: Hospital's response to the query
  attachments?: string[];     // Optional: Document references
}

/**
 * Defer Admission DTO
 * Used when deferring a case for additional review/documentation
 * 
 * Workflow:
 * 1. Updates deferment_status = 'PENDING_DEFERMENT'
 * 2. Creates remark entry with action_for = 'DEFERMENT'
 * 3. Sets follow-up date
 * 
 * Permission Required: ADMISSIONS.APPROVE
 */
export interface DeferAdmissionDto {
  defermentReason: string;    // Required: Reason for deferment
  followUpDate?: Date | string;  // Optional: When to review again
  assignedTo?: string;        // Optional: User to follow up
}

/**
 * Resolve Deferment DTO
 * Used when resolving a deferred case
 * 
 * Workflow:
 * 1. Updates deferment_status = 'DEFERMENT_RESOLVED'
 * 2. Creates remark entry with resolution details
 * 3. Case ready for normal approval workflow
 * 
 * Permission Required: ADMISSIONS.APPROVE
 */
export interface ResolveDefermentDto {
  resolutionNotes: string;    // Required: How deferment was resolved
}

/**
 * Admission Query Filters DTO
 * Used for GET /admissions list endpoint
 * 
 * Supports:
 * - Status filtering (PENDING_APPROVAL, APPROVED, REJECTED, etc.)
 * - Type filtering (EMERGENCY, ELECTIVE)
 * - Date range filtering
 * - Search across claim_ref_no, member name, hospital name
 * - Pagination
 * - Sorting
 */
export interface AdmissionFilterDto {
  // Status filters
  admissionStatus?: string;      // From admission_status field
  admissionType?: string;        // From ADMISSION_TYPE lookup
  roomType?: string;             // From ROOM_TYPE lookup
  
  // Related entity filters
  claimId?: number;              // Filter by specific claim
  hospitalId?: number;           // Filter by hospital (via claim)
  memberId?: number;             // Filter by member (via claim)
  
  // Date range filters
  admissionDateFrom?: Date | string;
  admissionDateTo?: Date | string;
  dischargeDateFrom?: Date | string;
  dischargeDateTo?: Date | string;
  
  // Alert filters
  hasAlert?: boolean;            // Filter admissions with alert_flag=true
  
  // Search
  search?: string;               // Full-text search: claim_ref_no, member name, hospital name
  
  // Soft delete
  isDeleted?: boolean;           // Default: false (hide deleted)
  
  // Pagination
  page?: number;                 // Default: 1
  limit?: number;                // Default: 10
  
  // Sorting
  sortBy?: string;               // Default: 'admission_id'
  sortOrder?: 'ASC' | 'DESC';    // Default: 'DESC'
}

/**
 * Admission Response DTO
 * Full admission details with related data
 * 
 * Used by:
 * - GET /admissions/:id (detail view)
 * - POST /admissions (create response)
 * - PUT /admissions/:id (update response)
 */
export interface AdmissionResponseDto {
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
  icu_days?: number | null;
  icu_rate?: number | null;
  ehm_status?: string | null;
  deferment_status?: string | null;
  alert_flag?: boolean;
  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date | null;
  updated_by?: string | null;
  is_deleted?: boolean;
  
  // Related data (optional - for detail view)
  claim?: {
    claim_ref_no?: string;
    member_name?: string;
    hospital_name?: string;
  };
  
  // Workflow history (optional - from ccms_remarks)
  remarks?: Array<{
    remark_id: number;
    action_for?: string;
    remark_text?: string;
    created_by?: string;
    created_at: Date;
  }>;
}
