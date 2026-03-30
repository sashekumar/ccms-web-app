/**
 * Investigation Entity - Maps to ccms_investigations table (v7 schema)
 * Represents a medical investigation case for claims
 * 
 * Schema Notes:
 * - Hospital/Clinic info obtained through: ccms_investigations → ccms_claims → ccms_hospitals
 * - Status column is named 'ix_status' in the schema
 * - created_by/updated_by are VARCHAR(50) user identifiers, not numeric IDs
 */
export interface InvestigationEntity {
  ix_id: number; // Primary Key
  legacy_investigation_id?: string; // Legacy UUID reference (UNIQUEIDENTIFIER)
  claim_id: number; // Foreign Key to ccms_claims
  ix_status: 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CLOSED'; // Investigation status
  clinic_id?: number; // Legacy: kept in schema for migration purposes
  findings?: string; // Investigation findings/conclusion (NVARCHAR(MAX))
  is_pec_found?: boolean; // Pre-existing condition found? (BIT)
  request_payment_amt?: number; // Recommended payment amount (MONEY)
  created_at: Date; // Creation timestamp
  created_by?: string; // Created by user identifier (VARCHAR(50))
  updated_at?: Date; // Last update timestamp
  updated_by?: string; // Updated by user identifier (VARCHAR(50))
}

/**
 * Investigation Request Entity - Maps to ccms_investigation_request table
 * Represents a document/information request during investigation
 */
export interface InvestigationRequestEntity {
  request_id: number; // Primary Key
  ix_id: number; // Foreign Key to ccms_investigations
  request_type: 'MEDICAL_RECORDS' | 'DISCHARGE_SUMMARY' | 'INVESTIGATION_REPORT' | 'SUPPORTING_DOCUMENTS' | 'CONSULTATION_NOTES' | 'FINANCIAL_DOCUMENTS';
  requested_from: string; // Department/Hospital contacted
  request_date: Date;
  expected_date: Date;
  received_date?: Date;
  status: 'PENDING' | 'RECEIVED' | 'PARTIAL' | 'NOT_AVAILABLE';
  description?: string;
  remarks?: string;
}

/**
 * Investigation Request History Entity - Maps to ccms_investigation_request_history table
 * Audit trail for request status changes
 */
export interface InvestigationRequestHistoryEntity {
  history_id: number; // Primary Key
  request_id: number; // Foreign Key to ccms_investigation_request
  status_change: string; // Old status → New status
  changed_by: number; // FK to ccms_users
  changed_at: Date;
}

/**
 * Investigation Call Log Entity - Maps to ccms_investigation_call_log table
 * Tracks calls made during investigation
 */
export interface InvestigationCallLogEntity {
  call_id: number; // Primary Key
  ix_id: number; // Foreign Key to ccms_investigations
  call_date: Date;
  called_party: string; // Person/Department called
  call_duration: number; // In minutes
  call_notes: string; // Summary of call
  called_by: number; // FK to ccms_users
}
