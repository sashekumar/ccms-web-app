export interface Claim {
  claim_id: number;
  claim_ref_no: string;
  fwd_claim_ref_no?: string | null;
  file_no?: string | null;
  member_id: number;
  
  // Joined details
  member_name?: string | null;
  member_ic_no?: string | null;
  hospital_name?: string | null;
  
  // Admission link (for cashless claims)
  admission_id?: number | null;
  gl_ref_no?: string | null;
  
  patient_type?: string | null;
  patient_id?: number | null;
  policy_record_id?: number | null;
  hospital_id?: number | null;
  doctor_id?: number | null;
  diagnosis_id?: number | null;
  
  disability_code?: string | null;
  disability_category?: string | null;
  
  claim_status_id?: number | null;
  claim_status?: string | null;
  claim_mode?: string | null;
  priority_level?: number | null;
  
  total_billed?: number | null;
  total_approved?: number | null;
  
  pre_auth_required?: boolean | null;
  pre_auth_no?: string | null;
  
  rejection_type?: string | null;
  rejection_reason?: string | null;
  rejection_date?: Date | string | null;
  
  sla_days?: number | null;
  sla_deadline?: Date | string | null;
  sla_status?: string | null;
  
  approval_authority?: string | null;
  approval_date?: Date | string | null;
  batch_no?: string | null;
  
  payee_name?: string | null;
  payee_ic_no?: string | null;
  payee_bank_name?: string | null;
  payee_bank_account_no?: string | null;
  
  is_ec_case?: boolean | null;
  ec_status?: string | null;
  ec_notification_date?: Date | string | null;
  ec_closed_date?: Date | string | null;
  
  document_received_at?: Date | string | null;
  
  created_at?: Date | string | null;
  created_by?: string | null;
  creator_name?: string | null;
  updated_at?: Date | string | null;
  updated_by?: string | null;
  updater_name?: string | null;
}

export interface ClaimFilters {
  search?: string;
  status?: string;
  mode?: string;
  hospital_id?: number;
  patient_type?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateClaimDto {
  member_id: number;
  hospital_id: number;
  policy_record_id?: number | null;
  patient_type?: string | null;
  patient_id?: number | null;
  disability_category?: string | null;
  total_billed?: number | null;
  document_received_at?: string | Date | null;
  payee_name?: string | null;
  payee_ic_no?: string | null;
  payee_bank_name?: string | null;
  payee_bank_account_no?: string | null;
  claim_mode?: string | null;
}

export interface UpdateClaimDto {
  claim_status?: string | null;
  member_id?: number | null;
  hospital_id?: number | null;
  patient_type?: string | null;
  patient_id?: number | null;
  disability_category?: string | null;
  total_billed?: number | null;
  total_approved?: number | null;
  rejection_type?: string | null;
  rejection_reason?: string | null;
  approval_authority?: string | null;
  payee_name?: string | null;
  payee_ic_no?: string | null;
  payee_bank_name?: string | null;
  payee_bank_account_no?: string | null;
  document_received_at?: string | Date | null;
  is_ec_case?: boolean | null;
  ec_status?: string | null;
  ec_notification_date?: string | Date | null;
  ec_closed_date?: string | Date | null;
  claim_mode?: string | null;

  // Added for frontend handling
  expenses?: any[] | null;
  documents?: any[] | null;
}

export interface PaginatedClaims {
  data: Claim[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
