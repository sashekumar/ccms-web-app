/**
 * Financial Management Models
 * Frontend interfaces for Payment Advice DTOs and responses
 */

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED' | 'DEFERRED';

export interface PaymentAdviceFilters {
  payment_status?: PaymentStatus;
  claim_id?: number;
  pa_ref_no?: string;
  is_shortfall?: boolean;
  is_multipl_pa?: boolean;
  finance_deferment_status?: string;
  submission_batch_no?: string;
  date_from?: string;
  date_to?: string;
  searchTerm?: string;
  sortBy?: 'created_at' | 'payment_date' | 'grand_total' | 'pa_ref_no';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreatePaymentAdviceDto {
  claim_id: number;
  pa_ref_no: string;
  hospital_invoice_no?: string;
  hospital_invoice_amount?: number;
  tax_amt?: number;
  discount_amt?: number;
  subtotal_ra?: number;
  subtotal_nra?: number;
  subtotal_ia?: number;
  grand_total?: number;
  grand_total_ia?: number;
  consultation_total?: number;
  uncovered_total?: number;
  payment_method?: string;
  is_shortfall?: boolean;
  is_multipl_pa?: boolean;
}

export interface UpdatePaymentAdviceDto {
  payment_status?: PaymentStatus;
  payment_method?: string;
  payment_date?: string;
  hospital_invoice_no?: string;
  hospital_invoice_amount?: number;
  tax_amt?: number;
  discount_amt?: number;
  subtotal_ra?: number;
  subtotal_nra?: number;
  subtotal_ia?: number;
  grand_total?: number;
  grand_total_ia?: number;
  consultation_total?: number;
  uncovered_total?: number;
  is_shortfall?: boolean;
  is_multipl_pa?: boolean;
  submission_batch_no?: string;
  submission_date?: string;
  finance_deferment_status?: string;
  physical_folder_status?: string;
}

export interface PaLineItem {
  item_id: number;
  pa_id: number;
  benefit_name?: string;
  billed_amt?: number;
  approved_amt?: number;
  non_reimb_reason?: string;
  is_consultation_breakdown?: boolean;
}

export interface PaSummary {
  summary_id: number;
  pa_id: number;
  sob_type?: string;
  sob_category?: string;
  amount_ia?: number;
  amount_ra?: number;
  amount_nra?: number;
}

export interface PaPayment {
  payment_id: number;
  pa_id: number;
  payment_amount?: number;
  payment_method?: string;
  payment_date?: string;
  payment_reference?: string;
  payment_status?: string;
  member_ic?: string;
  member_name?: string;
}

export interface PaUncoveredCharge {
  uncovered_id: number;
  pa_id: number;
  charge_description?: string;
  charge_amount?: number;
  uncovered_reason?: string;
}

export interface PaConsultationBreakdown {
  consultation_id: number;
  pa_id: number;
  consultation_type?: string;
  consultation_amount?: number;
  doctor_id?: string;
  consultation_date?: string;
}

export interface PaymentAdviceResponse {
  pa_id: number;
  claim_id: number;
  claim_ref_no?: string;
  hospital_id?: number;
  hospital_name?: string;
  pa_ref_no: string;
  hospital_invoice_no?: string;
  hospital_invoice_amount?: number;
  tax_amt?: number;
  discount_amt?: number;
  subtotal_ra?: number;
  subtotal_nra?: number;
  subtotal_ia?: number;
  grand_total?: number;
  grand_total_ia?: number;
  consultation_total?: number;
  uncovered_total?: number;
  payment_status?: PaymentStatus;
  payment_method?: string;
  payment_date?: string;
  is_shortfall?: boolean;
  is_multipl_pa?: boolean;
  submission_batch_no?: string;
  submission_date?: string;
  finance_deferment_status?: string;
  physical_folder_status?: string;
  created_at: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  // Detail sub-entities
  line_items?: PaLineItem[];
  summary?: PaSummary[];
  payments?: PaPayment[];
  uncovered_charges?: PaUncoveredCharge[];
  consultation_breakdown?: PaConsultationBreakdown[];
}

export interface PaymentAdviceStatsResponse {
  total: number;
  pending: number;
  approved: number;
  paid: number;
  cancelled: number;
  deferred: number;
  shortfall_count: number;
  total_grand_total: number;
  total_paid_amount: number;
}

export interface PaginatedPaymentAdviceResponse {
  data: PaymentAdviceResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
