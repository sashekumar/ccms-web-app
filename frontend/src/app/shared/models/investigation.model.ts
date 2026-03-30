/**
 * Investigation Models - Medical Investigation Case Management
 * Frontend DTOs and Response Interfaces
 */

// ============================================================================
// INVESTIGATION CASE MODELS
// ============================================================================

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
  pending_requests_count?: number;
  call_logs_count?: number;
  days_since_creation?: number;
  
  // Related data (populated on detail view)
  requests?: InvestigationRequestResponse[];
  call_logs?: InvestigationCallLogResponse[];
}

export interface CreateInvestigationDto {
  claim_id: number;
  clinic_id?: number;
  reason: string;
  expected_duration_days?: number;
  is_priority: boolean;
  assigned_to_id?: number;
}

export interface UpdateInvestigationDto {
  status?: 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CLOSED';
  findings?: string;
  is_pec_found?: boolean;
  request_payment_amt?: number;
  remarks?: string;
}

// ============================================================================
// INVESTIGATION REQUEST MODELS (Document/Info Requests)
// ============================================================================

export interface InvestigationRequestResponse {
  request_id: number;
  ix_id: number;
  request_type: 'MEDICAL_RECORDS' | 'DISCHARGE_SUMMARY' | 'INVESTIGATION_REPORT' | 'SUPPORTING_DOCUMENTS' | 'CONSULTATION_NOTES' | 'FINANCIAL_DOCUMENTS';
  requested_from: string;
  request_date: string;
  expected_date: string;
  received_date?: string;
  status: 'PENDING' | 'RECEIVED' | 'PARTIAL' | 'NOT_AVAILABLE';
  description?: string;
  remarks?: string;
  history?: {
    status_change: string;
    changed_by: string;
    changed_at: string;
  }[];
}

export interface CreateInvestigationRequestDto {
  ix_id: number;
  request_type: 'MEDICAL_RECORDS' | 'DISCHARGE_SUMMARY' | 'INVESTIGATION_REPORT' | 'SUPPORTING_DOCUMENTS' | 'CONSULTATION_NOTES' | 'FINANCIAL_DOCUMENTS';
  requested_from: string;
  expected_date: string;
  description?: string;
}

export interface UpdateInvestigationRequestDto {
  status?: 'PENDING' | 'RECEIVED' | 'PARTIAL' | 'NOT_AVAILABLE';
  received_date?: string;
  remarks?: string;
}

// ============================================================================
// INVESTIGATION CALL LOG MODELS
// ============================================================================

export interface InvestigationCallLogResponse {
  call_id: number;
  ix_id: number;
  call_date: string;
  called_party: string;
  call_duration: number;
  call_notes: string;
  called_by: string;
}

export interface CreateInvestigationCallLogDto {
  ix_id: number;
  called_party: string;
  call_duration: number;
  call_notes: string;
  call_date?: string;
}

// ============================================================================
// CLOSE INVESTIGATION MODEL
// ============================================================================

export interface CloseInvestigationDto {
  status: 'COMPLETED' | 'CLOSED';
  final_findings: string;
  is_pec_found: boolean;
  request_payment_amt?: number;
  remarks?: string;
}

// ============================================================================
// FILTER & PAGINATION MODELS
// ============================================================================

export interface InvestigationFilters {
  page?: number;
  limit?: number;
  status?: 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CLOSED';
  claim_id?: number;
  clinic_id?: number;
  sortBy?: 'created_at' | 'status' | 'expected_date';
  sortOrder?: 'ASC' | 'DESC';
  searchTerm?: string;
}

export interface PaginatedInvestigationsResponse {
  investigations: InvestigationResponse[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

// ============================================================================
// STATISTICS MODEL
// ============================================================================

export interface InvestigationStats {
  total: number;
  open_count: number;
  in_progress_count: number;
  under_review_count: number;
  completed_count: number;
  priority_count: number;
}

// ============================================================================
// REQUEST TYPE OPTIONS
// ============================================================================

export const INVESTIGATION_REQUEST_TYPES = [
  { id: 'MEDICAL_RECORDS', label: 'Medical Records', icon: 'clipboard-list' },
  { id: 'DISCHARGE_SUMMARY', label: 'Discharge Summary', icon: 'document-text' },
  { id: 'INVESTIGATION_REPORT', label: 'Investigation Report', icon: 'report' },
  { id: 'SUPPORTING_DOCUMENTS', label: 'Supporting Documents', icon: 'folder' },
  { id: 'CONSULTATION_NOTES', label: 'Consultation Notes', icon: 'note' },
  { id: 'FINANCIAL_DOCUMENTS', label: 'Financial Documents', icon: 'currency' }
];

// ============================================================================
// STATUS OPTIONS
// ============================================================================

export const INVESTIGATION_STATUSES = [
  { id: 'OPEN', label: 'Open', color: 'blue', icon: 'bookmark-open' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'yellow', icon: 'clock' },
  { id: 'UNDER_REVIEW', label: 'Under Review', color: 'orange', icon: 'magnifying-glass' },
  { id: 'COMPLETED', label: 'Completed', color: 'green', icon: 'check-circle' },
  { id: 'CLOSED', label: 'Closed', color: 'gray', icon: 'x-circle' }
];

export const REQUEST_STATUSES = [
  { id: 'PENDING', label: 'Pending', color: 'blue' },
  { id: 'RECEIVED', label: 'Received', color: 'green' },
  { id: 'PARTIAL', label: 'Partial', color: 'yellow' },
  { id: 'NOT_AVAILABLE', label: 'Not Available', color: 'red' }
];
