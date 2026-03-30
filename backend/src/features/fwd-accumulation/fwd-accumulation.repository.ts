import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { BaseRepository } from '../../core/base/base.repository';
import { DB_TABLES } from '../../core/constants';
import { FwdAccumulationClientEntity } from './entities/fwd-accumulation.entity';
import {
  FwdClientFilters, FwdDisabilityFilters, FwdOnetimeFilters, FwdPaFilters,
  CreateFwdClientDto, CreateFwdDisabilityDto, CreateFwdOnetimeDto, CreateFwdPaDto,
  UpdateFwdClientDto, UpdateFwdDisabilityDto, UpdateFwdOnetimeDto, UpdateFwdPaDto
} from './dto/fwd-accumulation.dto';

/**
 * FWD Accumulation Repository
 * Manages all 4 FWD accumulation sub-tables.
 * Extends BaseRepository on the client table as primary anchor.
 */
export class FwdAccumulationRepository extends BaseRepository<FwdAccumulationClientEntity> {
  constructor() {
    super(DB_TABLES.FWD_ACCUMULATION_CLIENT, 'client_acc_id', false);
  }

  // ============================================================================
  // CLIENT - READ
  // ============================================================================

  async getClientAccumulations(filters: FwdClientFilters): Promise<{ data: any[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const where: string[] = [];

    if (filters.member_id) {
      where.push('fa.member_id = @memberId');
      request.input('memberId', sql.BigInt, filters.member_id);
    }
    if (filters.fwd_client_no) {
      where.push('fa.fwd_client_no = @fwdClientNo');
      request.input('fwdClientNo', sql.VarChar(50), filters.fwd_client_no);
    }
    if (filters.period_year) {
      where.push('fa.period_year = @periodYear');
      request.input('periodYear', sql.Int, filters.period_year);
    }
    if (filters.period_month) {
      where.push('fa.period_month = @periodMonth');
      request.input('periodMonth', sql.Int, filters.period_month);
    }
    if (filters.searchTerm) {
      where.push('(fa.fwd_client_no LIKE @search OR m.member_name LIKE @search OR m.member_ic LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${filters.searchTerm}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const countResult = await request.query(`
      SELECT COUNT(*) AS total FROM ${DB_TABLES.FWD_ACCUMULATION_CLIENT} fa
      LEFT JOIN ccms_members m ON fa.member_id = m.member_id ${whereClause}
    `);
    const total = countResult.recordset[0]?.total || 0;

    const allowedSort: Record<string, string> = {
      period_year: 'fa.period_year', period_month: 'fa.period_month',
      accumulated_amount: 'fa.accumulated_amount', as_at_date: 'fa.as_at_date'
    };
    const sortCol = allowedSort[filters.sortBy || 'period_year'] || 'fa.period_year';
    const sortOrder = filters.sortOrder || 'DESC';

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT fa.client_acc_id, fa.member_id, m.member_name, m.member_ic,
             fa.fwd_client_no, fa.period_year, fa.period_month,
             fa.accumulated_amount, fa.as_at_date, fa.created_at, fa.created_by
      FROM ${DB_TABLES.FWD_ACCUMULATION_CLIENT} fa
      LEFT JOIN ccms_members m ON fa.member_id = m.member_id
      ${whereClause}
      ORDER BY ${sortCol} ${sortOrder}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    return { data: result.recordset, total };
  }

  // ============================================================================
  // DISABILITY - READ
  // ============================================================================

  async getDisabilityAccumulations(filters: FwdDisabilityFilters): Promise<{ data: any[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const where: string[] = [];

    if (filters.disability_code) {
      where.push('fa.disability_code = @disabilityCode');
      request.input('disabilityCode', sql.VarChar(50), filters.disability_code);
    }
    if (filters.period_year) {
      where.push('fa.period_year = @periodYear');
      request.input('periodYear', sql.Int, filters.period_year);
    }
    if (filters.period_month) {
      where.push('fa.period_month = @periodMonth');
      request.input('periodMonth', sql.Int, filters.period_month);
    }
    if (filters.searchTerm) {
      where.push('fa.disability_code LIKE @search');
      request.input('search', sql.NVarChar(255), `%${filters.searchTerm}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const countResult = await request.query(`SELECT COUNT(*) AS total FROM ${DB_TABLES.FWD_ACCUMULATION_DISABILITY} fa ${whereClause}`);
    const total = countResult.recordset[0]?.total || 0;

    const allowedSort: Record<string, string> = {
      period_year: 'fa.period_year', period_month: 'fa.period_month',
      accumulated_amount: 'fa.accumulated_amount'
    };
    const sortCol = allowedSort[filters.sortBy || 'period_year'] || 'fa.period_year';
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT fa.disability_acc_id, fa.disability_code, fa.period_year, fa.period_month,
             fa.accumulated_amount, fa.created_at, fa.created_by
      FROM ${DB_TABLES.FWD_ACCUMULATION_DISABILITY} fa
      ${whereClause}
      ORDER BY ${sortCol} ${filters.sortOrder || 'DESC'}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    return { data: result.recordset, total };
  }

  // ============================================================================
  // ONETIME - READ
  // ============================================================================

  async getOnetimeAccumulations(filters: FwdOnetimeFilters): Promise<{ data: any[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const where: string[] = [];

    if (filters.member_id) {
      where.push('fa.member_id = @memberId');
      request.input('memberId', sql.BigInt, filters.member_id);
    }
    if (filters.benefit_code) {
      where.push('fa.benefit_code = @benefitCode');
      request.input('benefitCode', sql.VarChar(50), filters.benefit_code);
    }
    if (filters.searchTerm) {
      where.push('(fa.fwd_member_no LIKE @search OR fa.benefit_code LIKE @search OR m.member_name LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${filters.searchTerm}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const countResult = await request.query(`
      SELECT COUNT(*) AS total FROM ${DB_TABLES.FWD_ACCUMULATION_ONETIME} fa
      LEFT JOIN ccms_members m ON fa.member_id = m.member_id ${whereClause}
    `);
    const total = countResult.recordset[0]?.total || 0;

    const allowedSort: Record<string, string> = {
      accumulated_amount: 'fa.accumulated_amount', created_at: 'fa.created_at'
    };
    const sortCol = allowedSort[filters.sortBy || 'created_at'] || 'fa.created_at';
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT fa.onetime_acc_id, fa.member_id, m.member_name, m.member_ic,
             fa.fwd_member_no, fa.benefit_code, fa.accumulated_amount,
             fa.created_at, fa.created_by
      FROM ${DB_TABLES.FWD_ACCUMULATION_ONETIME} fa
      LEFT JOIN ccms_members m ON fa.member_id = m.member_id
      ${whereClause}
      ORDER BY ${sortCol} ${filters.sortOrder || 'DESC'}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    return { data: result.recordset, total };
  }

  // ============================================================================
  // PA - READ
  // ============================================================================

  async getPaAccumulations(filters: FwdPaFilters): Promise<{ data: any[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const where: string[] = [];

    if (filters.pa_id) {
      where.push('fa.pa_id = @paId');
      request.input('paId', sql.BigInt, filters.pa_id);
    }
    if (filters.claim_id) {
      where.push('fa.claim_id = @claimId');
      request.input('claimId', sql.BigInt, filters.claim_id);
    }
    if (filters.searchTerm) {
      where.push('(c.claim_ref_no LIKE @search OR pa.pa_ref_no LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${filters.searchTerm}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const countResult = await request.query(`
      SELECT COUNT(*) AS total FROM ${DB_TABLES.FWD_ACCUMULATION_PA} fa
      LEFT JOIN ccms_payment_advice pa ON fa.pa_id = pa.pa_id
      LEFT JOIN ccms_claims c ON fa.claim_id = c.claim_id ${whereClause}
    `);
    const total = countResult.recordset[0]?.total || 0;

    const allowedSort: Record<string, string> = {
      accumulated_amount: 'fa.accumulated_amount', as_at_date: 'fa.as_at_date', created_at: 'fa.created_at'
    };
    const sortCol = allowedSort[filters.sortBy || 'as_at_date'] || 'fa.as_at_date';
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT fa.pa_acc_id, fa.pa_id, fa.claim_id,
             pa.pa_ref_no, c.claim_ref_no,
             fa.accumulated_amount, fa.as_at_date,
             fa.created_at, fa.created_by
      FROM ${DB_TABLES.FWD_ACCUMULATION_PA} fa
      LEFT JOIN ccms_payment_advice pa ON fa.pa_id = pa.pa_id
      LEFT JOIN ccms_claims c ON fa.claim_id = c.claim_id
      ${whereClause}
      ORDER BY ${sortCol} ${filters.sortOrder || 'DESC'}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    return { data: result.recordset, total };
  }

  // ============================================================================
  // CREATE
  // ============================================================================

  async createClientAccumulation(dto: CreateFwdClientDto, userId: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    request.input('memberId', sql.BigInt, dto.member_id);
    request.input('fwdClientNo', sql.VarChar(50), dto.fwd_client_no || null);
    request.input('periodYear', sql.Int, dto.period_year || null);
    request.input('periodMonth', sql.Int, dto.period_month || null);
    request.input('accumulatedAmount', sql.Money, dto.accumulated_amount || null);
    request.input('asAtDate', sql.DateTime2, dto.as_at_date ? new Date(dto.as_at_date) : null);
    request.input('createdBy', sql.VarChar(50), userId);
    const result = await request.query(`
      INSERT INTO ${DB_TABLES.FWD_ACCUMULATION_CLIENT}
        (member_id, fwd_client_no, period_year, period_month, accumulated_amount, as_at_date, created_at, created_by)
      VALUES (@memberId, @fwdClientNo, @periodYear, @periodMonth, @accumulatedAmount, @asAtDate, GETDATE(), @createdBy);
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
    `);
    return result.recordset[0]?.id;
  }

  async createDisabilityAccumulation(dto: CreateFwdDisabilityDto, userId: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    request.input('disabilityCode', sql.VarChar(50), dto.disability_code || null);
    request.input('periodYear', sql.Int, dto.period_year || null);
    request.input('periodMonth', sql.Int, dto.period_month || null);
    request.input('accumulatedAmount', sql.Money, dto.accumulated_amount || null);
    request.input('createdBy', sql.VarChar(50), userId);
    const result = await request.query(`
      INSERT INTO ${DB_TABLES.FWD_ACCUMULATION_DISABILITY}
        (disability_code, period_year, period_month, accumulated_amount, created_at, created_by)
      VALUES (@disabilityCode, @periodYear, @periodMonth, @accumulatedAmount, GETDATE(), @createdBy);
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
    `);
    return result.recordset[0]?.id;
  }

  async createOnetimeAccumulation(dto: CreateFwdOnetimeDto, userId: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    request.input('memberId', sql.BigInt, dto.member_id);
    request.input('fwdMemberNo', sql.VarChar(50), dto.fwd_member_no || null);
    request.input('benefitCode', sql.VarChar(50), dto.benefit_code || null);
    request.input('accumulatedAmount', sql.Money, dto.accumulated_amount || null);
    request.input('createdBy', sql.VarChar(50), userId);
    const result = await request.query(`
      INSERT INTO ${DB_TABLES.FWD_ACCUMULATION_ONETIME}
        (member_id, fwd_member_no, benefit_code, accumulated_amount, created_at, created_by)
      VALUES (@memberId, @fwdMemberNo, @benefitCode, @accumulatedAmount, GETDATE(), @createdBy);
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
    `);
    return result.recordset[0]?.id;
  }

  async createPaAccumulation(dto: CreateFwdPaDto, userId: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    request.input('paId', sql.BigInt, dto.pa_id);
    request.input('claimId', sql.BigInt, dto.claim_id);
    request.input('accumulatedAmount', sql.Money, dto.accumulated_amount || null);
    request.input('asAtDate', sql.DateTime2, dto.as_at_date ? new Date(dto.as_at_date) : null);
    request.input('createdBy', sql.VarChar(50), userId);
    const result = await request.query(`
      INSERT INTO ${DB_TABLES.FWD_ACCUMULATION_PA}
        (pa_id, claim_id, accumulated_amount, as_at_date, created_at, created_by)
      VALUES (@paId, @claimId, @accumulatedAmount, @asAtDate, GETDATE(), @createdBy);
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
    `);
    return result.recordset[0]?.id;
  }

  // ============================================================================
  // UPDATE helpers
  // ============================================================================

  private async genericUpdate(table: string, pkCol: string, pkVal: number, dto: Record<string, any>, fieldMap: Record<string, { col: string; type: any }>, userId: string): Promise<void> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const setClauses: string[] = [];
    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) continue;
      const fieldDef = fieldMap[key];
      if (!fieldDef) continue;
      const paramKey = `p_${key}`;
      let sqlValue: any = value;
      if (fieldDef.type === sql.DateTime2 && typeof value === 'string') sqlValue = new Date(value);
      setClauses.push(`${fieldDef.col} = @${paramKey}`);
      request.input(paramKey, fieldDef.type, sqlValue);
    }
    if (setClauses.length === 0) return;
    setClauses.push('updated_at = GETDATE()', 'updated_by = @updatedBy');
    request.input('updatedBy', sql.VarChar(50), userId);
    request.input('pkVal', sql.BigInt, pkVal);
    await request.query(`UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${pkCol} = @pkVal`);
  }

  async updateClientAccumulation(id: number, dto: UpdateFwdClientDto, userId: string): Promise<void> {
    await this.genericUpdate(DB_TABLES.FWD_ACCUMULATION_CLIENT, 'client_acc_id', id, dto, {
      fwd_client_no:      { col: 'fwd_client_no',      type: sql.VarChar(50) },
      period_year:        { col: 'period_year',        type: sql.Int },
      period_month:       { col: 'period_month',       type: sql.Int },
      accumulated_amount: { col: 'accumulated_amount', type: sql.Money },
      as_at_date:         { col: 'as_at_date',         type: sql.DateTime2 }
    }, userId);
  }

  async updateDisabilityAccumulation(id: number, dto: UpdateFwdDisabilityDto, userId: string): Promise<void> {
    await this.genericUpdate(DB_TABLES.FWD_ACCUMULATION_DISABILITY, 'disability_acc_id', id, dto, {
      disability_code:    { col: 'disability_code',    type: sql.VarChar(50) },
      period_year:        { col: 'period_year',        type: sql.Int },
      period_month:       { col: 'period_month',       type: sql.Int },
      accumulated_amount: { col: 'accumulated_amount', type: sql.Money }
    }, userId);
  }

  async updateOnetimeAccumulation(id: number, dto: UpdateFwdOnetimeDto, userId: string): Promise<void> {
    await this.genericUpdate(DB_TABLES.FWD_ACCUMULATION_ONETIME, 'onetime_acc_id', id, dto, {
      fwd_member_no:      { col: 'fwd_member_no',      type: sql.VarChar(50) },
      benefit_code:       { col: 'benefit_code',       type: sql.VarChar(50) },
      accumulated_amount: { col: 'accumulated_amount', type: sql.Money }
    }, userId);
  }

  async updatePaAccumulation(id: number, dto: UpdateFwdPaDto, userId: string): Promise<void> {
    await this.genericUpdate(DB_TABLES.FWD_ACCUMULATION_PA, 'pa_acc_id', id, dto, {
      accumulated_amount: { col: 'accumulated_amount', type: sql.Money },
      as_at_date:         { col: 'as_at_date',         type: sql.DateTime2 }
    }, userId);
  }

  // ============================================================================
  // STATS
  // ============================================================================

  async getStats(): Promise<any> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const result = await request.query(`
      SELECT
        (SELECT COUNT(*)         FROM ${DB_TABLES.FWD_ACCUMULATION_CLIENT})     AS total_client_records,
        (SELECT COUNT(*)         FROM ${DB_TABLES.FWD_ACCUMULATION_DISABILITY}) AS total_disability_records,
        (SELECT COUNT(*)         FROM ${DB_TABLES.FWD_ACCUMULATION_ONETIME})    AS total_onetime_records,
        (SELECT COUNT(*)         FROM ${DB_TABLES.FWD_ACCUMULATION_PA})         AS total_pa_records,
        ISNULL((SELECT SUM(accumulated_amount) FROM ${DB_TABLES.FWD_ACCUMULATION_CLIENT}),     0) AS total_client_amount,
        ISNULL((SELECT SUM(accumulated_amount) FROM ${DB_TABLES.FWD_ACCUMULATION_DISABILITY}), 0) AS total_disability_amount,
        ISNULL((SELECT SUM(accumulated_amount) FROM ${DB_TABLES.FWD_ACCUMULATION_ONETIME}),    0) AS total_onetime_amount,
        ISNULL((SELECT SUM(accumulated_amount) FROM ${DB_TABLES.FWD_ACCUMULATION_PA}),         0) AS total_pa_amount
    `);
    return result.recordset[0];
  }
}
