import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { BaseRepository } from '../../core/base/base.repository';
import { DB_TABLES } from '../../core/constants';
import { StopLossEntity } from './entities/stop-loss.entity';
import { StopLossFilters, CreateStopLossDto, UpdateStopLossDto } from './dto/stop-loss.dto';

/**
 * Stop Loss Repository
 * Handles all DB operations for ccms_stop_loss_data.
 * Extends BaseRepository for common CRUD operations.
 */
export class StopLossRepository extends BaseRepository<StopLossEntity> {
  constructor() {
    super(DB_TABLES.STOP_LOSS_DATA, 'sl_id', false);
  }

  // ============================================================================
  // READ - List
  // ============================================================================

  async getStopLossRecords(filters: StopLossFilters): Promise<{ data: any[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];

    if (filters.product_id) {
      whereClauses.push('sl.product_id = @productId');
      request.input('productId', sql.BigInt, filters.product_id);
    }

    if (filters.period_type) {
      whereClauses.push('sl.period_type = @periodType');
      request.input('periodType', sql.VarChar(10), filters.period_type);
    }

    if (filters.is_history_record !== undefined) {
      whereClauses.push('sl.is_history_record = @isHistoryRecord');
      request.input('isHistoryRecord', sql.Bit, filters.is_history_record ? 1 : 0);
    }

    if (filters.date_from) {
      whereClauses.push('sl.period_date >= @dateFrom');
      request.input('dateFrom', sql.Date, new Date(filters.date_from));
    }

    if (filters.date_to) {
      whereClauses.push('sl.period_date <= @dateTo');
      request.input('dateTo', sql.Date, new Date(filters.date_to));
    }

    if (filters.searchTerm) {
      whereClauses.push('(p.product_name LIKE @search OR sl.period_type LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${filters.searchTerm}%`);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM ${this.tableName} sl
      LEFT JOIN ccms_products p ON sl.product_id = p.product_id
      ${whereClause}
    `;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0]?.total || 0;

    const allowedSort: Record<string, string> = {
      period_date: 'sl.period_date',
      created_at: 'sl.created_at',
      total_gross_premium: 'sl.total_gross_premium'
    };
    const sortCol = allowedSort[filters.sortBy || 'period_date'] || 'sl.period_date';
    const sortOrder = filters.sortOrder || 'DESC';

    const query = `
      SELECT
        sl.sl_id,
        sl.product_id,
        p.product_name,
        sl.period_type,
        sl.period_date,
        sl.total_policy_count,
        sl.total_gross_premium,
        sl.claims_ol,
        sl.claims_reim,
        sl.tpa_fees,
        sl.is_history_record,
        sl.created_at,
        sl.created_by,
        sl.updated_at,
        sl.updated_by
      FROM ${this.tableName} sl
      LEFT JOIN ccms_products p ON sl.product_id = p.product_id
      ${whereClause}
      ORDER BY ${sortCol} ${sortOrder}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);
    return { data: result.recordset, total };
  }

  // ============================================================================
  // READ - Single
  // ============================================================================

  async getStopLossById(slId: number): Promise<any> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT
        sl.sl_id,
        sl.product_id,
        p.product_name,
        sl.period_type,
        sl.period_date,
        sl.total_policy_count,
        sl.total_gross_premium,
        sl.claims_ol,
        sl.claims_reim,
        sl.tpa_fees,
        sl.is_history_record,
        sl.created_at,
        sl.created_by,
        sl.updated_at,
        sl.updated_by
      FROM ${this.tableName} sl
      LEFT JOIN ccms_products p ON sl.product_id = p.product_id
      WHERE sl.sl_id = @slId
    `;
    request.input('slId', sql.BigInt, slId);
    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  // ============================================================================
  // CREATE
  // ============================================================================

  async createStopLoss(dto: CreateStopLossDto, userId: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      INSERT INTO ${this.tableName} (
        product_id, period_type, period_date, total_policy_count,
        total_gross_premium, claims_ol, claims_reim, tpa_fees,
        is_history_record, created_at, created_by
      )
      VALUES (
        @productId, @periodType, @periodDate, @totalPolicyCount,
        @totalGrossPremium, @claimsOl, @claimsReim, @tpaFees,
        @isHistoryRecord, GETDATE(), @createdBy
      );
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS slId;
    `;

    request.input('productId', sql.BigInt, dto.product_id);
    request.input('periodType', sql.VarChar(10), dto.period_type);
    request.input('periodDate', sql.Date, new Date(dto.period_date));
    request.input('totalPolicyCount', sql.Int, dto.total_policy_count || null);
    request.input('totalGrossPremium', sql.Money, dto.total_gross_premium || null);
    request.input('claimsOl', sql.Money, dto.claims_ol || null);
    request.input('claimsReim', sql.Money, dto.claims_reim || null);
    request.input('tpaFees', sql.Money, dto.tpa_fees || null);
    request.input('isHistoryRecord', sql.Bit, dto.is_history_record ? 1 : 0);
    request.input('createdBy', sql.VarChar(50), userId);

    const result = await request.query(query);
    return result.recordset[0]?.slId;
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  async updateStopLoss(slId: number, dto: UpdateStopLossDto, userId: string): Promise<void> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const allowedFields: Record<string, { col: string; type: any }> = {
      period_type:          { col: 'period_type',          type: sql.VarChar(10) },
      period_date:          { col: 'period_date',          type: sql.Date },
      total_policy_count:   { col: 'total_policy_count',   type: sql.Int },
      total_gross_premium:  { col: 'total_gross_premium',  type: sql.Money },
      claims_ol:            { col: 'claims_ol',            type: sql.Money },
      claims_reim:          { col: 'claims_reim',          type: sql.Money },
      tpa_fees:             { col: 'tpa_fees',             type: sql.Money },
      is_history_record:    { col: 'is_history_record',    type: sql.Bit }
    };

    const setClauses: string[] = [];
    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) continue;
      const fieldDef = allowedFields[key];
      if (!fieldDef) continue;
      const paramKey = `p_${key}`;
      let sqlValue: any = value;
      if (fieldDef.type === sql.Date && typeof value === 'string') sqlValue = new Date(value);
      if (fieldDef.type === sql.Bit) sqlValue = value ? 1 : 0;
      setClauses.push(`${fieldDef.col} = @${paramKey}`);
      request.input(paramKey, fieldDef.type, sqlValue);
    }

    if (setClauses.length === 0) return;

    setClauses.push('updated_at = GETDATE()');
    setClauses.push('updated_by = @updatedBy');
    request.input('updatedBy', sql.VarChar(50), userId);
    request.input('slId', sql.BigInt, slId);

    await request.query(`UPDATE ${this.tableName} SET ${setClauses.join(', ')} WHERE sl_id = @slId`);
  }

  // ============================================================================
  // STATS
  // ============================================================================

  async getStats(): Promise<any> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT
        COUNT(*) AS total,
        ISNULL(SUM(CASE WHEN is_history_record = 0 THEN 1 ELSE 0 END), 0) AS current_records,
        ISNULL(SUM(CASE WHEN is_history_record = 1 THEN 1 ELSE 0 END), 0) AS history_records,
        ISNULL(SUM(total_gross_premium), 0) AS total_gross_premium,
        ISNULL(SUM(claims_ol), 0)           AS total_claims_ol,
        ISNULL(SUM(claims_reim), 0)         AS total_claims_reim,
        ISNULL(SUM(tpa_fees), 0)            AS total_tpa_fees
      FROM ${this.tableName}
    `;
    const result = await request.query(query);
    return result.recordset[0];
  }
}
