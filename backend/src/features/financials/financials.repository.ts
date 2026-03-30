import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { BaseRepository } from '../../core/base/base.repository';
import { DB_TABLES } from '../../core/constants';
import { PaymentAdviceEntity } from './entities/financials.entity';
import { PaymentAdviceFilters, CreatePaymentAdviceDto, UpdatePaymentAdviceDto } from './dto/financials.dto';

/**
 * Financials Repository
 * Handles all database operations for Payment Advice and related financial tables.
 * Extends BaseRepository for base CRUD operations on ccms_payment_advice.
 *
 * Operations:
 * - Paginated PA list with filters
 * - PA detail with sub-entities (line items, summary, payments, uncovered charges)
 * - Create / Update PA
 * - PA stats aggregation
 */
export class FinancialsRepository extends BaseRepository<PaymentAdviceEntity> {
  constructor() {
    super(DB_TABLES.PAYMENT_ADVICE, 'pa_id', false);
  }

  // ============================================================================
  // READ - List
  // ============================================================================

  /**
   * Get payment advices with filters and pagination
   */
  async getPaymentAdvices(filters: PaymentAdviceFilters): Promise<{ data: any[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];

    if (filters.payment_status) {
      whereClauses.push('pa.payment_status = @paymentStatus');
      request.input('paymentStatus', sql.VarChar(50), filters.payment_status);
    }

    if (filters.claim_id) {
      whereClauses.push('pa.claim_id = @claimId');
      request.input('claimId', sql.BigInt, filters.claim_id);
    }

    if (filters.pa_ref_no) {
      whereClauses.push('pa.pa_ref_no = @paRefNo');
      request.input('paRefNo', sql.VarChar(100), filters.pa_ref_no);
    }

    if (filters.is_shortfall !== undefined) {
      whereClauses.push('pa.is_shortfall = @isShortfall');
      request.input('isShortfall', sql.Bit, filters.is_shortfall ? 1 : 0);
    }

    if (filters.is_multipl_pa !== undefined) {
      whereClauses.push('pa.is_multipl_pa = @isMultiplPa');
      request.input('isMultiplPa', sql.Bit, filters.is_multipl_pa ? 1 : 0);
    }

    if (filters.finance_deferment_status) {
      whereClauses.push('pa.finance_deferment_status = @financeDefermentStatus');
      request.input('financeDefermentStatus', sql.VarChar(50), filters.finance_deferment_status);
    }

    if (filters.submission_batch_no) {
      whereClauses.push('pa.submission_batch_no = @submissionBatchNo');
      request.input('submissionBatchNo', sql.VarChar(50), filters.submission_batch_no);
    }

    if (filters.date_from) {
      whereClauses.push('pa.created_at >= @dateFrom');
      request.input('dateFrom', sql.DateTime, new Date(filters.date_from));
    }

    if (filters.date_to) {
      whereClauses.push('pa.created_at <= @dateTo');
      request.input('dateTo', sql.DateTime, new Date(filters.date_to));
    }

    if (filters.searchTerm) {
      whereClauses.push(
        '(pa.pa_ref_no LIKE @search OR pa.hospital_invoice_no LIKE @search OR c.claim_ref_no LIKE @search OR h.hospital_name LIKE @search)'
      );
      request.input('search', sql.NVarChar(255), `%${filters.searchTerm}%`);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count query (reuses same request with inputs already set)
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM ${this.tableName} pa
      LEFT JOIN ccms_claims c ON pa.claim_id = c.claim_id
      LEFT JOIN ccms_hospitals h ON c.hospital_id = h.hospital_id
      ${whereClause}
    `;

    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0]?.total || 0;

    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    const allowedSort: Record<string, string> = {
      created_at: 'pa.created_at',
      payment_date: 'pa.payment_date',
      grand_total: 'pa.grand_total',
      pa_ref_no: 'pa.pa_ref_no'
    };
    const orderByColumn = allowedSort[sortBy] || 'pa.created_at';

    const query = `
      SELECT
        pa.pa_id,
        pa.claim_id,
        c.claim_ref_no,
        c.hospital_id,
        h.hospital_name,
        pa.pa_ref_no,
        pa.hospital_invoice_no,
        pa.hospital_invoice_amount,
        pa.tax_amt,
        pa.discount_amt,
        pa.subtotal_ra,
        pa.subtotal_nra,
        pa.subtotal_ia,
        pa.grand_total,
        pa.grand_total_ia,
        pa.consultation_total,
        pa.uncovered_total,
        pa.payment_status,
        pa.payment_method,
        pa.payment_date,
        pa.is_shortfall,
        pa.is_multipl_pa,
        pa.submission_batch_no,
        pa.submission_date,
        pa.finance_deferment_status,
        pa.physical_folder_status,
        pa.created_at,
        pa.created_by,
        pa.updated_at,
        pa.updated_by
      FROM ${this.tableName} pa
      LEFT JOIN ccms_claims c ON pa.claim_id = c.claim_id
      LEFT JOIN ccms_hospitals h ON c.hospital_id = h.hospital_id
      ${whereClause}
      ORDER BY ${orderByColumn} ${sortOrder}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);
    return { data: result.recordset, total };
  }

  // ============================================================================
  // READ - Detail
  // ============================================================================

  /**
   * Get full payment advice detail by ID (header only)
   */
  async getPaymentAdviceById(paId: number): Promise<any> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT
        pa.pa_id,
        pa.claim_id,
        c.claim_ref_no,
        c.hospital_id,
        h.hospital_name,
        pa.pa_ref_no,
        pa.hospital_invoice_no,
        pa.hospital_invoice_amount,
        pa.tax_amt,
        pa.discount_amt,
        pa.subtotal_ra,
        pa.subtotal_nra,
        pa.subtotal_ia,
        pa.grand_total,
        pa.grand_total_ia,
        pa.consultation_total,
        pa.uncovered_total,
        pa.payment_status,
        pa.payment_method,
        pa.payment_date,
        pa.is_shortfall,
        pa.is_multipl_pa,
        pa.submission_batch_no,
        pa.submission_date,
        pa.finance_deferment_status,
        pa.physical_folder_status,
        pa.created_at,
        pa.created_by,
        pa.updated_at,
        pa.updated_by
      FROM ${this.tableName} pa
      LEFT JOIN ccms_claims c ON pa.claim_id = c.claim_id
      LEFT JOIN ccms_hospitals h ON c.hospital_id = h.hospital_id
      WHERE pa.pa_id = @paId
    `;

    request.input('paId', sql.BigInt, paId);
    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  /**
   * Get PA line items
   */
  async getLineItems(paId: number): Promise<any[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT item_id, pa_id, benefit_name, billed_amt, approved_amt,
             non_reimb_reason, is_consultation_breakdown, created_at, created_by
      FROM ${DB_TABLES.PA_LINE_ITEMS}
      WHERE pa_id = @paId
      ORDER BY item_id ASC
    `;

    request.input('paId', sql.BigInt, paId);
    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Get PA summary breakdown
   */
  async getSummary(paId: number): Promise<any[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT summary_id, pa_id, sob_type, sob_category,
             amount_ia, amount_ra, amount_nra, created_at, created_by
      FROM ${DB_TABLES.PA_SUMMARY}
      WHERE pa_id = @paId
      ORDER BY summary_id ASC
    `;

    request.input('paId', sql.BigInt, paId);
    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Get PA payment records
   */
  async getPayments(paId: number): Promise<any[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT payment_id, pa_id, payment_amount, payment_method, payment_date,
             payment_reference, payment_status, member_ic, member_name,
             created_at, created_by
      FROM ${DB_TABLES.PA_PAYMENTS}
      WHERE pa_id = @paId
      ORDER BY payment_date DESC
    `;

    request.input('paId', sql.BigInt, paId);
    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Get PA uncovered charges
   */
  async getUncoveredCharges(paId: number): Promise<any[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT uncovered_id, pa_id, charge_description, charge_amount,
             uncovered_reason, created_at, created_by
      FROM ${DB_TABLES.PA_UNCOVERED_CHARGES}
      WHERE pa_id = @paId
      ORDER BY uncovered_id ASC
    `;

    request.input('paId', sql.BigInt, paId);
    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Get PA consultation breakdown
   */
  async getConsultationBreakdown(paId: number): Promise<any[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT consultation_id, pa_id, consultation_type, consultation_amount,
             doctor_id, consultation_date, created_at, created_by
      FROM ${DB_TABLES.PA_CONSULTATION_BREAKDOWN}
      WHERE pa_id = @paId
      ORDER BY consultation_date DESC
    `;

    request.input('paId', sql.BigInt, paId);
    const result = await request.query(query);
    return result.recordset;
  }

  // ============================================================================
  // CREATE
  // ============================================================================

  /**
   * Create a new Payment Advice record
   */
  async createPaymentAdvice(dto: CreatePaymentAdviceDto, userId: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      INSERT INTO ${this.tableName} (
        claim_id, pa_ref_no, hospital_invoice_no, hospital_invoice_amount,
        tax_amt, discount_amt, subtotal_ra, subtotal_nra, subtotal_ia,
        grand_total, grand_total_ia, consultation_total, uncovered_total,
        payment_status, payment_method, is_shortfall, is_multipl_pa,
        created_at, created_by
      )
      VALUES (
        @claimId, @paRefNo, @hospitalInvoiceNo, @hospitalInvoiceAmount,
        @taxAmt, @discountAmt, @subtotalRa, @subtotalNra, @subtotalIa,
        @grandTotal, @grandTotalIa, @consultationTotal, @uncoveredTotal,
        @paymentStatus, @paymentMethod, @isShortfall, @isMultiplPa,
        GETDATE(), @createdBy
      );
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS paId;
    `;

    request.input('claimId', sql.BigInt, dto.claim_id);
    request.input('paRefNo', sql.VarChar(100), dto.pa_ref_no);
    request.input('hospitalInvoiceNo', sql.VarChar(100), dto.hospital_invoice_no || null);
    request.input('hospitalInvoiceAmount', sql.Money, dto.hospital_invoice_amount || null);
    request.input('taxAmt', sql.Money, dto.tax_amt || null);
    request.input('discountAmt', sql.Money, dto.discount_amt || null);
    request.input('subtotalRa', sql.Money, dto.subtotal_ra || null);
    request.input('subtotalNra', sql.Money, dto.subtotal_nra || null);
    request.input('subtotalIa', sql.Money, dto.subtotal_ia || null);
    request.input('grandTotal', sql.Money, dto.grand_total || null);
    request.input('grandTotalIa', sql.Money, dto.grand_total_ia || null);
    request.input('consultationTotal', sql.Money, dto.consultation_total || null);
    request.input('uncoveredTotal', sql.Money, dto.uncovered_total || null);
    request.input('paymentStatus', sql.VarChar(50), 'PENDING');
    request.input('paymentMethod', sql.VarChar(50), dto.payment_method || null);
    request.input('isShortfall', sql.Bit, dto.is_shortfall ? 1 : 0);
    request.input('isMultiplPa', sql.Bit, dto.is_multipl_pa ? 1 : 0);
    request.input('createdBy', sql.VarChar(50), userId);

    const result = await request.query(query);
    return result.recordset[0]?.paId;
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  /**
   * Update Payment Advice fields
   * Only updates fields that are explicitly provided in the DTO
   */
  async updatePaymentAdvice(paId: number, dto: UpdatePaymentAdviceDto, userId: string): Promise<void> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const allowedFields: Record<string, { col: string; type: any }> = {
      payment_status:           { col: 'payment_status',           type: sql.VarChar(50) },
      payment_method:           { col: 'payment_method',           type: sql.VarChar(50) },
      payment_date:             { col: 'payment_date',             type: sql.DateTime },
      hospital_invoice_no:      { col: 'hospital_invoice_no',      type: sql.VarChar(100) },
      hospital_invoice_amount:  { col: 'hospital_invoice_amount',  type: sql.Money },
      tax_amt:                  { col: 'tax_amt',                  type: sql.Money },
      discount_amt:             { col: 'discount_amt',             type: sql.Money },
      subtotal_ra:              { col: 'subtotal_ra',              type: sql.Money },
      subtotal_nra:             { col: 'subtotal_nra',             type: sql.Money },
      subtotal_ia:              { col: 'subtotal_ia',              type: sql.Money },
      grand_total:              { col: 'grand_total',              type: sql.Money },
      grand_total_ia:           { col: 'grand_total_ia',           type: sql.Money },
      consultation_total:       { col: 'consultation_total',       type: sql.Money },
      uncovered_total:          { col: 'uncovered_total',          type: sql.Money },
      is_shortfall:             { col: 'is_shortfall',             type: sql.Bit },
      is_multipl_pa:            { col: 'is_multipl_pa',            type: sql.Bit },
      submission_batch_no:      { col: 'submission_batch_no',      type: sql.VarChar(50) },
      submission_date:          { col: 'submission_date',          type: sql.DateTime },
      finance_deferment_status: { col: 'finance_deferment_status', type: sql.VarChar(50) },
      physical_folder_status:   { col: 'physical_folder_status',   type: sql.VarChar(50) }
    };

    const setClauses: string[] = [];

    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) continue;
      const fieldDef = allowedFields[key];
      if (!fieldDef) continue;

      const paramKey = `p_${key}`;
      let sqlValue: any = value;

      // Convert date strings to Date objects
      if (fieldDef.type === sql.DateTime && typeof value === 'string') {
        sqlValue = new Date(value);
      }
      // Convert booleans to bit
      if (fieldDef.type === sql.Bit) {
        sqlValue = value ? 1 : 0;
      }

      setClauses.push(`${fieldDef.col} = @${paramKey}`);
      request.input(paramKey, fieldDef.type, sqlValue);
    }

    if (setClauses.length === 0) return;

    setClauses.push('updated_at = GETDATE()');
    setClauses.push('updated_by = @updatedBy');
    request.input('updatedBy', sql.VarChar(50), userId);
    request.input('paId', sql.BigInt, paId);

    const query = `UPDATE ${this.tableName} SET ${setClauses.join(', ')} WHERE pa_id = @paId`;
    await request.query(query);
  }

  // ============================================================================
  // STATS
  // ============================================================================

  /**
   * Get aggregated payment advice statistics
   */
  async getStats(): Promise<any> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT
        COUNT(*) AS total,
        ISNULL(SUM(CASE WHEN payment_status = 'PENDING'   THEN 1 ELSE 0 END), 0) AS pending,
        ISNULL(SUM(CASE WHEN payment_status = 'APPROVED'  THEN 1 ELSE 0 END), 0) AS approved,
        ISNULL(SUM(CASE WHEN payment_status = 'PAID'      THEN 1 ELSE 0 END), 0) AS paid,
        ISNULL(SUM(CASE WHEN payment_status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS cancelled,
        ISNULL(SUM(CASE WHEN payment_status = 'DEFERRED'  THEN 1 ELSE 0 END), 0) AS deferred,
        ISNULL(SUM(CASE WHEN is_shortfall = 1             THEN 1 ELSE 0 END), 0) AS shortfall_count,
        ISNULL(SUM(grand_total), 0)     AS total_grand_total,
        ISNULL(SUM(CASE WHEN payment_status = 'PAID' THEN grand_total ELSE 0 END), 0) AS total_paid_amount
      FROM ${this.tableName}
    `;

    const result = await request.query(query);
    return result.recordset[0];
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Check if a PA reference number already exists
   */
  async checkPaRefNoExists(paRefNo: string, excludePaId?: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    let query = `SELECT 1 FROM ${this.tableName} WHERE pa_ref_no = @paRefNo`;
    request.input('paRefNo', sql.VarChar(100), paRefNo);

    if (excludePaId) {
      query += ' AND pa_id <> @excludePaId';
      request.input('excludePaId', sql.BigInt, excludePaId);
    }

    const result = await request.query(query);
    return result.recordset.length > 0;
  }
}
