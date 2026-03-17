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
  
  document_received_at?: Date | string;
}
