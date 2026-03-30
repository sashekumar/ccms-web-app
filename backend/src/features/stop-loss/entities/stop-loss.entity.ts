/**
 * Stop Loss Entity - Maps to ccms_stop_loss_data (v7 schema)
 * Represents periodic stop-loss calculation records per product.
 *
 * Schema Notes:
 * - product_id FK → ccms_products
 * - period_type: MONTHLY | QUARTERLY | ANNUAL (VARCHAR 10)
 * - Monetary columns use MONEY type in SQL Server
 * - created_by / updated_by are VARCHAR(50)
 */
export interface StopLossEntity {
  sl_id: number;                      // Primary Key
  legacy_stop_loss_id?: string;       // UNIQUEIDENTIFIER – for migration
  product_id: number;                 // FK to ccms_products
  period_type?: string;               // MONTHLY | QUARTERLY | ANNUAL
  period_date?: Date;                 // Reference date for the period
  total_policy_count?: number;        // Number of active policies
  total_gross_premium?: number;       // MONEY
  claims_ol?: number;                 // Online claims amount MONEY
  claims_reim?: number;               // Reimbursement claims amount MONEY
  tpa_fees?: number;                  // TPA fees MONEY
  is_history_record?: boolean;        // BIT – archived record flag
  created_at: Date;
  created_by?: string;                // VARCHAR(50)
  updated_at?: Date;
  updated_by?: string;                // VARCHAR(50)
}
