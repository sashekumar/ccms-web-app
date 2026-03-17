

export interface Claim {
  claim_id: number;
  claim_ref_no: string;
  fwd_claim_ref_no?: string;
  file_no?: string;
  member_id: number;
  
  // Joined details
  member_name?: string;
  member_ic_no?: string;
  hospital_name?: string;
  
  patient_type?: string;
  patient_id?: number;
  policy_record_id?: number;
  hospital_id?: number;
  doctor_id?: number;
  diagnosis_id?: number;
  
  disability_code?: string;
  disability_category?: string;
  
  claim_status_id?: number;
  claim_status?: string;
  claim_mode?: string;
  priority_level?: number;
  
  total_billed?: number;
  total_approved?: number;
  
  pre_auth_required?: boolean;
  pre_auth_no?: string;
  
  rejection_type?: string;
  rejection_reason?: string;
  rejection_date?: Date | string;
  
  sla_days?: number;
  sla_deadline?: Date | string;
  sla_status?: string;
  
  approval_authority?: string;
  approval_date?: Date | string;
  batch_no?: string;
  
  payee_name?: string;
  payee_ic_no?: string;
  payee_bank_name?: string;
  payee_bank_account_no?: string;
  
  is_ec_case?: boolean;
  ec_status?: string;
  ec_notification_date?: Date | string;
  ec_closed_date?: Date | string;
  
  document_received_at?: Date | string;
  
  created_at?: Date | string;
  created_by?: string;
  updated_at?: Date | string;
  updated_by?: string;
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

export interface UpdateClaimDto {
  claim_status?: string;
  total_billed?: number;
  total_approved?: number;
  rejection_type?: string;
  rejection_reason?: string;
  approval_authority?: string;
  payee_name?: string;
  payee_ic_no?: string;
  payee_bank_name?: string;
  payee_bank_account_no?: string;
  document_received_at?: string | Date;
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
