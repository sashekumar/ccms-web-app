import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { BaseRepository } from '../../core/base/base.repository';
import { DB_TABLES } from '../../core/constants';
import { ClaimStatusLogEntity } from './entities/claim-tracking.entity';
import {
  StatusLogFilters, MilestoneFilters, DurationFilters,
  CreateStatusLogDto, CreateMilestoneDto, CreateDurationDto,
  UpdateStatusLogDto, UpdateMilestoneDto, UpdateDurationDto
} from './dto/claim-tracking.dto';

/**
 * Claim Tracking Repository
 * Manages claim status logs, processing milestones, and duration records.
 * Extends BaseRepository anchored on the status log table.
 */
export class ClaimTrackingRepository extends BaseRepository<ClaimStatusLogEntity> {
  constructor() {
    super(DB_TABLES.CLAIM_STATUS_LOG, 'log_id', false);
  }

  // ============================================================================
  // STATUS LOG
  // ============================================================================

  async getStatusLogs(filters: StatusLogFilters): Promise<{ data: any[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const where: string[] = [];

    if (filters.claim_id) {
      where.push('sl.claim_id = @claimId');
      request.input('claimId', sql.BigInt, filters.claim_id);
    }
    if (filters.new_status) {
      where.push('sl.new_status = @newStatus');
      request.input('newStatus', sql.VarChar(50), filters.new_status);
    }
    if (filters.changed_by) {
      where.push('sl.changed_by = @changedBy');
      request.input('changedBy', sql.VarChar(50), filters.changed_by);
    }
    if (filters.date_from) {
      where.push('sl.changed_at >= @dateFrom');
      request.input('dateFrom', sql.DateTime2, new Date(filters.date_from));
    }
    if (filters.date_to) {
      where.push('sl.changed_at <= @dateTo');
      request.input('dateTo', sql.DateTime2, new Date(filters.date_to));
    }
    if (filters.searchTerm) {
      where.push('(c.claim_ref_no LIKE @search OR sl.notes LIKE @search OR sl.new_status LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${filters.searchTerm}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const countResult = await request.query(`
      SELECT COUNT(*) AS total
      FROM ${DB_TABLES.CLAIM_STATUS_LOG} sl
      LEFT JOIN ccms_claims c ON sl.claim_id = c.claim_id
      ${whereClause}
    `);
    const total = countResult.recordset[0]?.total || 0;

    const allowedSort: Record<string, string> = {
      changed_at: 'sl.changed_at', new_status: 'sl.new_status', claim_id: 'sl.claim_id'
    };
    const sortCol = allowedSort[filters.sortBy || 'changed_at'] || 'sl.changed_at';
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT sl.log_id, sl.claim_id, c.claim_ref_no,
             sl.old_status, sl.new_status, sl.changed_by, sl.changed_at, sl.notes,
             sl.created_at, sl.created_by
      FROM ${DB_TABLES.CLAIM_STATUS_LOG} sl
      LEFT JOIN ccms_claims c ON sl.claim_id = c.claim_id
      ${whereClause}
      ORDER BY ${sortCol} ${filters.sortOrder || 'DESC'}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    return { data: result.recordset, total };
  }

  async createStatusLog(dto: CreateStatusLogDto, userId: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    request.input('claimId', sql.BigInt, dto.claim_id);
    request.input('oldStatus', sql.VarChar(50), dto.old_status || null);
    request.input('newStatus', sql.VarChar(50), dto.new_status || null);
    request.input('notes', sql.NVarChar(sql.MAX), dto.notes || null);
    request.input('changedBy', sql.VarChar(50), userId);
    request.input('createdBy', sql.VarChar(50), userId);
    const result = await request.query(`
      INSERT INTO ${DB_TABLES.CLAIM_STATUS_LOG}
        (claim_id, old_status, new_status, notes, changed_by, changed_at, created_at, created_by)
      VALUES (@claimId, @oldStatus, @newStatus, @notes, @changedBy, GETDATE(), GETDATE(), @createdBy);
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
    `);
    return result.recordset[0]?.id;
  }

  async updateStatusLog(logId: number, dto: UpdateStatusLogDto, userId: string): Promise<void> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    request.input('notes', sql.NVarChar(sql.MAX), dto.notes || null);
    request.input('updatedBy', sql.VarChar(50), userId);
    request.input('logId', sql.BigInt, logId);
    await request.query(`
      UPDATE ${DB_TABLES.CLAIM_STATUS_LOG}
      SET notes = @notes, updated_at = GETDATE(), updated_by = @updatedBy
      WHERE log_id = @logId
    `);
  }

  // ============================================================================
  // MILESTONES
  // ============================================================================

  async getMilestones(filters: MilestoneFilters): Promise<{ data: any[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const where: string[] = [];

    if (filters.claim_id) {
      where.push('m.claim_id = @claimId');
      request.input('claimId', sql.BigInt, filters.claim_id);
    }
    if (filters.milestone_name) {
      where.push('m.milestone_name = @milestoneName');
      request.input('milestoneName', sql.VarChar(100), filters.milestone_name);
    }
    if (filters.date_from) {
      where.push('m.milestone_date >= @dateFrom');
      request.input('dateFrom', sql.DateTime2, new Date(filters.date_from));
    }
    if (filters.date_to) {
      where.push('m.milestone_date <= @dateTo');
      request.input('dateTo', sql.DateTime2, new Date(filters.date_to));
    }
    if (filters.searchTerm) {
      where.push('(c.claim_ref_no LIKE @search OR m.milestone_name LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${filters.searchTerm}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const countResult = await request.query(`
      SELECT COUNT(*) AS total
      FROM ${DB_TABLES.CLAIM_PROCESSING_MILESTONES} m
      LEFT JOIN ccms_claims c ON m.claim_id = c.claim_id
      ${whereClause}
    `);
    const total = countResult.recordset[0]?.total || 0;

    const allowedSort: Record<string, string> = {
      milestone_date: 'm.milestone_date', milestone_name: 'm.milestone_name', claim_id: 'm.claim_id'
    };
    const sortCol = allowedSort[filters.sortBy || 'milestone_date'] || 'm.milestone_date';
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT m.milestone_id, m.claim_id, c.claim_ref_no,
             m.milestone_name, m.milestone_date,
             m.created_at, m.created_by
      FROM ${DB_TABLES.CLAIM_PROCESSING_MILESTONES} m
      LEFT JOIN ccms_claims c ON m.claim_id = c.claim_id
      ${whereClause}
      ORDER BY ${sortCol} ${filters.sortOrder || 'DESC'}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    return { data: result.recordset, total };
  }

  async createMilestone(dto: CreateMilestoneDto, userId: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    request.input('claimId', sql.BigInt, dto.claim_id);
    request.input('milestoneName', sql.VarChar(100), dto.milestone_name || null);
    request.input('milestoneDate', sql.DateTime2, dto.milestone_date ? new Date(dto.milestone_date) : null);
    request.input('createdBy', sql.VarChar(50), userId);
    const result = await request.query(`
      INSERT INTO ${DB_TABLES.CLAIM_PROCESSING_MILESTONES}
        (claim_id, milestone_name, milestone_date, created_by, created_at)
      VALUES (@claimId, @milestoneName, @milestoneDate, @createdBy, GETDATE());
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
    `);
    return result.recordset[0]?.id;
  }

  async updateMilestone(milestoneId: number, dto: UpdateMilestoneDto, userId: string): Promise<void> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const setClauses: string[] = ['updated_at = GETDATE()', 'updated_by = @updatedBy'];
    if (dto.milestone_name !== undefined) { setClauses.push('milestone_name = @milestoneName'); request.input('milestoneName', sql.VarChar(100), dto.milestone_name); }
    if (dto.milestone_date !== undefined) { setClauses.push('milestone_date = @milestoneDate'); request.input('milestoneDate', sql.DateTime2, dto.milestone_date ? new Date(dto.milestone_date) : null); }
    request.input('updatedBy', sql.VarChar(50), userId);
    request.input('milestoneId', sql.BigInt, milestoneId);
    await request.query(`UPDATE ${DB_TABLES.CLAIM_PROCESSING_MILESTONES} SET ${setClauses.join(', ')} WHERE milestone_id = @milestoneId`);
  }

  // ============================================================================
  // DURATIONS
  // ============================================================================

  async getDurations(filters: DurationFilters): Promise<{ data: any[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const where: string[] = [];

    if (filters.claim_id) {
      where.push('d.claim_id = @claimId');
      request.input('claimId', sql.BigInt, filters.claim_id);
    }
    if (filters.status) {
      where.push('d.status = @status');
      request.input('status', sql.VarChar(50), filters.status);
    }
    if (filters.min_days !== undefined) {
      where.push('d.duration_days >= @minDays');
      request.input('minDays', sql.Int, filters.min_days);
    }
    if (filters.max_days !== undefined) {
      where.push('d.duration_days <= @maxDays');
      request.input('maxDays', sql.Int, filters.max_days);
    }
    if (filters.searchTerm) {
      where.push('(c.claim_ref_no LIKE @search OR d.status LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${filters.searchTerm}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const countResult = await request.query(`
      SELECT COUNT(*) AS total
      FROM ${DB_TABLES.CLAIM_DURATIONS} d
      LEFT JOIN ccms_claims c ON d.claim_id = c.claim_id
      ${whereClause}
    `);
    const total = countResult.recordset[0]?.total || 0;

    const allowedSort: Record<string, string> = {
      duration_days: 'd.duration_days', start_date: 'd.start_date', claim_id: 'd.claim_id'
    };
    const sortCol = allowedSort[filters.sortBy || 'duration_days'] || 'd.duration_days';
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT d.duration_id, d.claim_id, c.claim_ref_no,
             d.start_date, d.end_date, d.duration_days, d.status,
             d.created_at, d.created_by
      FROM ${DB_TABLES.CLAIM_DURATIONS} d
      LEFT JOIN ccms_claims c ON d.claim_id = c.claim_id
      ${whereClause}
      ORDER BY ${sortCol} ${filters.sortOrder || 'DESC'}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    return { data: result.recordset, total };
  }

  async createDuration(dto: CreateDurationDto, userId: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    request.input('claimId', sql.BigInt, dto.claim_id);
    request.input('startDate', sql.DateTime2, dto.start_date ? new Date(dto.start_date) : null);
    request.input('endDate', sql.DateTime2, dto.end_date ? new Date(dto.end_date) : null);
    request.input('durationDays', sql.Int, dto.duration_days ?? null);
    request.input('status', sql.VarChar(50), dto.status || null);
    request.input('createdBy', sql.VarChar(50), userId);
    const result = await request.query(`
      INSERT INTO ${DB_TABLES.CLAIM_DURATIONS}
        (claim_id, start_date, end_date, duration_days, status, created_at, created_by)
      VALUES (@claimId, @startDate, @endDate, @durationDays, @status, GETDATE(), @createdBy);
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
    `);
    return result.recordset[0]?.id;
  }

  async updateDuration(durationId: number, dto: UpdateDurationDto, userId: string): Promise<void> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const setClauses: string[] = ['updated_at = GETDATE()', 'updated_by = @updatedBy'];
    if (dto.end_date !== undefined) { setClauses.push('end_date = @endDate'); request.input('endDate', sql.DateTime2, dto.end_date ? new Date(dto.end_date) : null); }
    if (dto.duration_days !== undefined) { setClauses.push('duration_days = @durationDays'); request.input('durationDays', sql.Int, dto.duration_days); }
    if (dto.status !== undefined) { setClauses.push('status = @status'); request.input('status', sql.VarChar(50), dto.status); }
    request.input('updatedBy', sql.VarChar(50), userId);
    request.input('durationId', sql.BigInt, durationId);
    await request.query(`UPDATE ${DB_TABLES.CLAIM_DURATIONS} SET ${setClauses.join(', ')} WHERE duration_id = @durationId`);
  }

  // ============================================================================
  // STATS
  // ============================================================================

  async getStats(): Promise<any> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const result = await request.query(`
      SELECT
        (SELECT COUNT(*) FROM ${DB_TABLES.CLAIM_STATUS_LOG})       AS total_status_log_entries,
        (SELECT COUNT(*) FROM ${DB_TABLES.CLAIM_PROCESSING_MILESTONES}) AS total_milestones,
        (SELECT COUNT(*) FROM ${DB_TABLES.CLAIM_DURATIONS})         AS total_durations,
        ISNULL((SELECT AVG(CAST(duration_days AS FLOAT)) FROM ${DB_TABLES.CLAIM_DURATIONS} WHERE duration_days IS NOT NULL), 0) AS avg_duration_days,
        ISNULL((SELECT MAX(duration_days) FROM ${DB_TABLES.CLAIM_DURATIONS}), 0) AS max_duration_days,
        (SELECT COUNT(*) FROM ${DB_TABLES.CLAIM_DURATIONS} WHERE end_date IS NULL) AS open_durations
    `);
    return result.recordset[0];
  }

  // ============================================================================
  // CLAIM HISTORY — all 3 sub-tables for a single claim
  // ============================================================================

  async getClaimHistory(claimId: number): Promise<any> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    request.input('claimId', sql.BigInt, claimId);

    const [statusLogs, milestones, durations] = await Promise.all([
      request.query(`
        SELECT log_id, old_status, new_status, changed_by, changed_at, notes, created_at
        FROM ${DB_TABLES.CLAIM_STATUS_LOG}
        WHERE claim_id = @claimId
        ORDER BY changed_at ASC
      `),
      pool.request().input('claimId2', sql.BigInt, claimId).query(`
        SELECT milestone_id, milestone_name, milestone_date, created_by, created_at
        FROM ${DB_TABLES.CLAIM_PROCESSING_MILESTONES}
        WHERE claim_id = @claimId2
        ORDER BY milestone_date ASC
      `),
      pool.request().input('claimId3', sql.BigInt, claimId).query(`
        SELECT duration_id, start_date, end_date, duration_days, status, created_at
        FROM ${DB_TABLES.CLAIM_DURATIONS}
        WHERE claim_id = @claimId3
        ORDER BY start_date ASC
      `)
    ]);

    return {
      status_logs: statusLogs.recordset,
      milestones: milestones.recordset,
      durations: durations.recordset
    };
  }
}
