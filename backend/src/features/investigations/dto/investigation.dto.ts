/**
 * Investigation DTOs - Medical Investigation Case Management
 * Domain: Claims Investigation & Fraud Detection
 * 
 * Investigation Statuses:
 * - OPEN: Investigation case created
 * - IN_PROGRESS: Currently investigating
 * - UNDER_REVIEW: Findings under review
 * - COMPLETED: Investigation completed
 * - CLOSED: Case closed
 * 
 * Request Types:
 * - MEDICAL_RECORDS: Request for medical records
 * - DISCHARGE_SUMMARY: Request for discharge summary
 * - INVESTIGATION_REPORT: Request for investigation report
 * - SUPPORTING_DOCUMENTS: Request for supporting documents
 * - CONSULTATION_NOTES: Request for consultation notes
 * - FINANCIAL_DOCUMENTS: Request for financial documents
 */

/**
 * Investigation List Filter DTO
 */
export interface InvestigationFilters {
  page?: number;
  limit?: number;
  status?: 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CLOSED';
  claimId?: number;
  clinicId?: number;
  sortBy?: 'created_at' | 'ix_status' | 'claim_id'; // Sortable columns in v7
  sortOrder?: 'ASC' | 'DESC';
  searchTerm?: string;
}

/**
 * Create Investigation DTO
 * 
 * Note: v7 schema only supports claim_id as primary input.
 * Other investigation attributes (findings, priority, etc.) are set via updates.
 */
export interface CreateInvestigationDto {
  claim_id: number; // Required: Link investigation to claim
}

/**
 * Update Investigation DTO
 * 
 * Supported updates on v7 schema:
 * - ix_status (status)
 * - findings
 * - is_pec_found
 * - request_payment_amt
 */
export interface UpdateInvestigationDto {
  status?: 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CLOSED';
  findings?: string;
  is_pec_found?: boolean;
  request_payment_amt?: number;
}

/**
 * Investigation Request DTO (Document/Info Request)
 */
export interface CreateInvestigationRequestDto {
  ix_id: number;
  request_type: 'MEDICAL_RECORDS' | 'DISCHARGE_SUMMARY' | 'INVESTIGATION_REPORT' | 'SUPPORTING_DOCUMENTS' | 'CONSULTATION_NOTES' | 'FINANCIAL_DOCUMENTS';
  requested_from: string; // Hospital/Clinic name or department
  expected_date: string; // YYYY-MM-DD
  description?: string;
}

/**
 * Investigation Request Update DTO
 */
export interface UpdateInvestigationRequestDto {
  status?: 'PENDING' | 'RECEIVED' | 'PARTIAL' | 'NOT_AVAILABLE';
  received_date?: string; // YYYY-MM-DD
  remarks?: string;
}

/**
 * Investigation Call Log DTO
 */
export interface CreateInvestigationCallLogDto {
  ix_id: number;
  called_party: string; // Person/Department contacted
  call_duration: number; // Minutes
  call_notes: string; // Summary of call
  call_date?: string; // YYYY-MM-DD (defaults to today)
}

/**
 * Close Investigation DTO
 */
export interface CloseInvestigationDto {
  status: 'COMPLETED' | 'CLOSED';
  final_findings: string;
  is_pec_found: boolean;
  request_payment_amt?: number;
  remarks?: string;
}

/**
 * Investigation Response (READ)
 */
export interface InvestigationResponse {
  ix_id: number;
  claim_id: number;
  claim_ref_no?: string;
  clinic_id?: number;
  clinic_name?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CLOSED';
  reason: string;
  findings?: string;
  is_pec_found?: boolean;
  request_payment_amt?: number;
  assigned_to_id?: number;
  assigned_to_name?: string;
  is_priority: boolean;
  expected_duration_days?: number;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  
  // Computed/Joined
  pending_requests_count?: number;
  call_logs_count?: number;
  days_since_creation?: number;
}

/**
 * Investigation Request Response (READ)
 */
export interface InvestigationRequestResponse {
  request_id: number;
  ix_id: number;
  request_type: string;
  requested_from: string;
  request_date: string;
  expected_date: string;
  received_date?: string;
  status: 'PENDING' | 'RECEIVED' | 'PARTIAL' | 'NOT_AVAILABLE';
  description?: string;
  remarks?: string;
  
  // History
  history?: {
    status_change: string;
    changed_by: string;
    changed_at: string;
  }[];
}

/**
 * Investigation Call Log Response (READ)
 */
export interface InvestigationCallLogResponse {
  call_id: number;
  ix_id: number;
  call_date: string;
  called_party: string;
  call_duration: number;
  call_notes: string;
  called_by: string;
}

/**
 * Paginated Investigations Response
 */
export interface PaginatedInvestigationsResponse {
  investigations: InvestigationResponse[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}
