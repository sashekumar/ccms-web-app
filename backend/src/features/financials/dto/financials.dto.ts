/**
 * Financial Management DTOs - Payment Advice Module
 * Domain: Claims Financial Processing & Payment Management
 *
 * Payment Advice Statuses:
 * - PENDING: PA created, awaiting approval
 * - APPROVED: PA approved, ready for payment
 * - PAID: Payment disbursed
 * - CANCELLED: PA cancelled
 * - DEFERRED: Payment deferred (linked to finance_deferment_status)
 */

/**
 * Payment Advice List Filter DTO
 */
export interface PaymentAdviceFilters {
  page?: number;
  limit?: number;
  payment_status?: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED' | 'DEFERRED';
  claim_id?: number;
  pa_ref_no?: string;
  is_shortfall?: boolean;
  is_multipl_pa?: boolean;
  finance_deferment_status?: string;
  submission_batch_no?: string;
  sortBy?: 'created_at' | 'payment_date' | 'grand_total' | 'pa_ref_no';
  sortOrder?: 'ASC' | 'DESC';
  searchTerm?: string;
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
}

/**
 * Create Payment Advice DTO
 * Note: PA is created during claims processing with core financial amounts.
 */
export interface CreatePaymentAdviceDto {
  claim_id: number;
  pa_ref_no: string;                        // Must be unique
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

/**
 * Update Payment Advice DTO
 * Supports updating status, amounts, and tracking fields
 */
export interface UpdatePaymentAdviceDto {
  payment_status?: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED' | 'DEFERRED';
  payment_method?: string;
  payment_date?: string; // YYYY-MM-DD
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
  submission_date?: string; // YYYY-MM-DD
  finance_deferment_status?: string;
  physical_folder_status?: string;
}

/**
 * Payment Advice Response DTO (READ)
 * Enriched with related claim/hospital info
 */
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
  payment_status?: string;
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
  // Sub-lists returned in detail view
  line_items?: any[];
  summary?: any[];
  payments?: any[];
  uncovered_charges?: any[];
  consultation_breakdown?: any[];
}

/**
 * PA Statistics Response
 */
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

/**
 * Paginated Response wrapper
 */
export interface PaginatedPaymentAdviceResponse {
  data: PaymentAdviceResponse[];
  total: number;
  page: number;
  totalPages: number;
}
