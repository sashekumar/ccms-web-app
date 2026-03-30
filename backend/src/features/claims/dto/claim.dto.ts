export interface CreateClaimDto {
  member_id: number;
  hospital_id: number;
  policy_record_id?: number | null;
  patient_type?: string | null;           // PRINCIPAL | DEPENDENT (default: PRINCIPAL)
  patient_id?: number | null;             // dependent_id when patient_type = DEPENDENT
  disability_category?: string | null;
  total_billed?: number | null;
  document_received_at?: Date | string | null;
  payee_name?: string | null;
  payee_ic_no?: string | null;
  payee_bank_name?: string | null;
  payee_bank_account_no?: string | null;
  claim_mode?: string | null;
  // Injected by service
  sla_days?: number;
  sla_deadline?: Date;
  sla_status?: string;
}

export interface UpdateClaimDto {
  claim_status?: string | null;
  member_id?: number | null;
  hospital_id?: number | null;
  patient_type?: string | null;           // PRINCIPAL | DEPENDENT
  patient_id?: number | null;             // dependent_id when patient_type = DEPENDENT
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
  
  document_received_at?: Date | string | null;
  
  // EC (Extended Care) fields
  is_ec_case?: boolean | null;
  ec_status?: string | null;
  ec_notification_date?: Date | string | null;
  ec_closed_date?: Date | string | null;

  // Allow nested for frontend benefit (these are often stripped)
  expenses?: any[] | null;
  documents?: any[] | null;
  claim_mode?: string | null;
}

export interface ApproveClaimDto {
  total_approved: number;
  remarks?: string | null;
  // Injected by service
  sla_status?: string;
  approved_by?: string;
}

export interface RejectClaimDto {
  rejection_reason: string;
  rejection_type?: string | null;
  remarks?: string | null;
}
