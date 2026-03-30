/**
 * Financial Management Entities - Maps to v7 schema financial tables
 * Module: Payment Advice (PA) Management
 *
 * Schema Notes:
 * - created_by/updated_by are VARCHAR(50) user identifiers, not numeric IDs
 * - Monetary columns use MONEY type in SQL Server
 * - BIT columns map to boolean in TypeScript
 */

/**
 * Payment Advice Entity - Maps to ccms_payment_advice
 */
export interface PaymentAdviceEntity {
  pa_id: number;                            // Primary Key
  claim_id: number;                         // FK to ccms_claims
  pa_ref_no: string;                        // Unique PA reference number
  hospital_invoice_no?: string;             // Hospital invoice reference
  hospital_invoice_amount?: number;         // Total billed by hospital (MONEY)
  tax_amt?: number;                         // Tax amount (MONEY)
  discount_amt?: number;                    // Discount applied (MONEY)
  subtotal_ra?: number;                     // Reimbursable amount subtotal (MONEY)
  subtotal_nra?: number;                    // Non-reimbursable amount subtotal (MONEY)
  subtotal_ia?: number;                     // Insurance amount subtotal (MONEY)
  grand_total?: number;                     // Grand total payable (MONEY)
  grand_total_ia?: number;                  // Grand total for insurance amount (MONEY)
  consultation_total?: number;              // Total consultation charges (MONEY)
  uncovered_total?: number;                 // Total uncovered charges (MONEY)
  payment_status?: string;                  // PENDING | APPROVED | PAID | CANCELLED | DEFERRED (VARCHAR 50)
  payment_method?: string;                  // Payment method used (VARCHAR 50)
  payment_date?: Date;                      // Date payment was made
  is_shortfall?: boolean;                   // Shortfall payment flag (BIT)
  is_multipl_pa?: boolean;                  // Multiple PA flag (BIT)
  submission_batch_no?: string;             // Batch submission reference (VARCHAR 50)
  submission_date?: Date;                   // Submission date
  finance_deferment_status?: string;        // Finance deferment state (VARCHAR 50)
  physical_folder_status?: string;          // Physical folder tracking (VARCHAR 50)
  created_at: Date;
  created_by?: string;                      // VARCHAR(50)
  updated_at?: Date;
  updated_by?: string;                      // VARCHAR(50)
}

/**
 * PA Line Items Entity - Maps to ccms_pa_line_items
 */
export interface PaLineItemEntity {
  item_id: number;
  pa_id: number;                            // FK to ccms_payment_advice
  benefit_name?: string;
  billed_amt?: number;                      // MONEY
  approved_amt?: number;                    // MONEY
  non_reimb_reason?: string;
  is_consultation_breakdown?: boolean;      // BIT
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

/**
 * PA Summary Entity - Maps to ccms_pa_summary
 */
export interface PaSummaryEntity {
  summary_id: number;
  pa_id: number;                            // FK to ccms_payment_advice
  sob_type?: string;                        // Schedule of Benefits type
  sob_category?: string;                    // SOB category
  amount_ia?: number;                       // Insurance amount (MONEY)
  amount_ra?: number;                       // Reimbursable amount (MONEY)
  amount_nra?: number;                      // Non-reimbursable amount (MONEY)
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

/**
 * PA Consultation Breakdown Entity - Maps to ccms_pa_consultation_breakdown
 */
export interface PaConsultationBreakdownEntity {
  consultation_id: number;
  pa_id: number;                            // FK to ccms_payment_advice
  consultation_type?: string;
  consultation_amount?: number;             // MONEY
  doctor_id?: string;
  consultation_date?: Date;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

/**
 * PA Consultation Breakdown History Entity - Maps to ccms_pa_consultation_breakdown_history
 */
export interface PaConsultationHistoryEntity {
  history_id: number;
  consultation_id: number;                  // FK to ccms_pa_consultation_breakdown
  old_amount?: number;                      // MONEY
  new_amount?: number;                      // MONEY
  changed_by?: string;
  changed_at?: Date;
  created_at: Date;
  created_by?: string;
}

/**
 * PA Uncovered Charges Entity - Maps to ccms_pa_uncovered_charges
 */
export interface PaUncoveredChargeEntity {
  uncovered_id: number;
  pa_id: number;                            // FK to ccms_payment_advice
  charge_description?: string;
  charge_amount?: number;                   // MONEY
  uncovered_reason?: string;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

/**
 * PA Payments Entity - Maps to ccms_pa_payments
 */
export interface PaPaymentEntity {
  payment_id: number;
  pa_id: number;                            // FK to ccms_payment_advice
  payment_amount?: number;                  // MONEY
  payment_method?: string;
  payment_date?: Date;
  payment_reference?: string;
  payment_status?: string;
  member_ic?: string;
  member_name?: string;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

/**
 * Multi-Payment Advice Entity - Maps to ccms_multi_payment_advice
 */
export interface MultiPaymentAdviceEntity {
  mpa_id: number;
  mpa_ref_no: string;                       // Unique MPA reference (UNIQUE)
  claim_id: number;                         // FK to ccms_claims
  total_amount?: number;                    // MONEY
  pa_count?: number;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

/**
 * Multi-Payment Advice Details Entity - Maps to ccms_multi_payment_advice_details
 */
export interface MultiPaymentAdviceDetailEntity {
  mpa_detail_id: number;
  mpa_id: number;                           // FK to ccms_multi_payment_advice
  pa_id: number;                            // FK to ccms_payment_advice
  pa_amount?: number;                       // MONEY
  sequence_no?: number;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}
