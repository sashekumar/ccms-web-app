/**
 * Eight Hour Monitoring - Repository
 * Database operations for 8-hour monitoring checks
 */

import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { BaseRepository } from '../../core/base/base.repository';
import { DB_TABLES } from '../../core/constants';
import { EightHourMonitoringEntity } from './entities/eight-hour-monitoring.entity';
import {
  EightHourMonitoringFilters,
  CreateEightHourMonitoringDto,
  UpdateEightHourMonitoringDto,
  EightHourMonitoringRecord,
  EightHourMonitoringStatsResponse
} from './dto/eight-hour-monitoring.dto';

export class EightHourMonitoringRepository extends BaseRepository<EightHourMonitoringEntity> {
  constructor() {
    super(DB_TABLES.EIGHT_HOUR_MONITORING, 'monitoring_id', false);
  }

  // ========================================================================
  // MONITORING OPERATIONS
  // ========================================================================

  async getMonitoringChecks(
    filters: EightHourMonitoringFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: EightHourMonitoringRecord[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const offset = (page - 1) * limit;
    const where: string[] = [];

    if (filters.admission_id !== undefined) {
      where.push('admission_id = @admission_id');
      request.input('admission_id', sql.BigInt, filters.admission_id);
    }
    if (filters.status) {
      where.push('status = @status');
      request.input('status', sql.VarChar(50), filters.status);
    }
    if (filters.checked_by) {
      where.push('checked_by = @checked_by');
      request.input('checked_by', sql.VarChar(50), filters.checked_by);
    }
    if (filters.check_date_after) {
      where.push('check_time >= @check_date_after');
      request.input('check_date_after', sql.DateTime2, new Date(filters.check_date_after));
    }
    if (filters.check_date_before) {
      where.push('check_time <= @check_date_before');
      request.input('check_date_before', sql.DateTime2, new Date(filters.check_date_before));
    }
    if (filters.search) {
      where.push('(notes LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${filters.search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await request.query(`
      SELECT COUNT(*) as total FROM ${DB_TABLES.EIGHT_HOUR_MONITORING} ${whereClause}
    `);
    const total = countResult.recordset[0]?.total || 0;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT
        monitoring_id, admission_id, check_time, hours_elapsed, status,
        checked_by, notes, next_check_due, created_at, updated_at
      FROM ${DB_TABLES.EIGHT_HOUR_MONITORING}
      ${whereClause}
      ORDER BY check_time DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset as EightHourMonitoringRecord[],
      total
    };
  }

  async getAdmissionMonitoringChecks(admission_id: bigint): Promise<EightHourMonitoringRecord[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('admission_id', sql.BigInt, admission_id);

    const result = await request.query(`
      SELECT
        monitoring_id, admission_id, check_time, hours_elapsed, status,
        checked_by, notes, next_check_due, created_at, updated_at
      FROM ${DB_TABLES.EIGHT_HOUR_MONITORING}
      WHERE admission_id = @admission_id
      ORDER BY check_time DESC
    `);

    return result.recordset as EightHourMonitoringRecord[];
  }

  async createMonitoringCheck(dto: CreateEightHourMonitoringDto): Promise<EightHourMonitoringEntity> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('admission_id', sql.BigInt, dto.admission_id);
    request.input('check_time', sql.DateTime2, dto.check_time || new Date());
    request.input('hours_elapsed', sql.Int, dto.hours_elapsed);
    request.input('status', sql.VarChar(50), dto.status || 'PENDING');
    request.input('checked_by', sql.VarChar(50), dto.checked_by);
    request.input('notes', sql.NVarChar(sql.MAX), dto.notes || null);
    request.input('next_check_due', sql.DateTime2, dto.next_check_due || new Date(Date.now() + 8 * 60 * 60 * 1000));

    const result = await request.query(`
      INSERT INTO ${DB_TABLES.EIGHT_HOUR_MONITORING}
        (admission_id, check_time, hours_elapsed, status, checked_by, notes, next_check_due, created_at, created_by)
      VALUES
        (@admission_id, @check_time, @hours_elapsed, @status, @checked_by, @notes, @next_check_due, GETDATE(), @checked_by)
      SELECT *
      FROM ${DB_TABLES.EIGHT_HOUR_MONITORING}
      WHERE monitoring_id = SCOPE_IDENTITY()
    `);

    return result.recordset[0] || { monitoring_id: 0n } as EightHourMonitoringEntity;
  }

  async updateMonitoringCheck(monitoring_id: bigint, dto: UpdateEightHourMonitoringDto): Promise<EightHourMonitoringEntity> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('monitoring_id', sql.BigInt, monitoring_id);

    const updates: string[] = [];
    if (dto.check_time !== undefined) {
      updates.push('check_time = @check_time');
      request.input('check_time', sql.DateTime2, dto.check_time);
    }
    if (dto.hours_elapsed !== undefined) {
      updates.push('hours_elapsed = @hours_elapsed');
      request.input('hours_elapsed', sql.Int, dto.hours_elapsed);
    }
    if (dto.status !== undefined) {
      updates.push('status = @status');
      request.input('status', sql.VarChar(50), dto.status);
    }
    if (dto.notes !== undefined) {
      updates.push('notes = @notes');
      request.input('notes', sql.NVarChar(sql.MAX), dto.notes);
    }
    if (dto.next_check_due !== undefined) {
      updates.push('next_check_due = @next_check_due');
      request.input('next_check_due', sql.DateTime2, dto.next_check_due);
    }
    if (updates.length === 0) return { monitoring_id: 0n } as EightHourMonitoringEntity;

    updates.push('updated_at = GETDATE()');
    updates.push('updated_by = @updated_by');
    request.input('updated_by', sql.VarChar(50), dto.checked_by || 'system');

    const result = await request.query(`
      UPDATE ${DB_TABLES.EIGHT_HOUR_MONITORING}
      SET ${updates.join(', ')}
      WHERE monitoring_id = @monitoring_id
      SELECT *
      FROM ${DB_TABLES.EIGHT_HOUR_MONITORING}
      WHERE monitoring_id = @monitoring_id
    `);

    return result.recordset[0] || { monitoring_id: 0n } as EightHourMonitoringEntity;
  }

  // ========================================================================
  // STATISTICS
  // ========================================================================

  async getStats(): Promise<EightHourMonitoringStatsResponse> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const result = await request.query(`
      SELECT
        (SELECT COUNT(*) FROM ${DB_TABLES.EIGHT_HOUR_MONITORING}) as total_checks,
        (SELECT COUNT(*) FROM ${DB_TABLES.EIGHT_HOUR_MONITORING} WHERE CAST(check_time AS DATE) = CAST(GETDATE() AS DATE)) as checks_today,
        (SELECT COUNT(*) FROM ${DB_TABLES.EIGHT_HOUR_MONITORING} WHERE status = 'PENDING') as pending_checks,
        (SELECT COUNT(*) FROM ${DB_TABLES.EIGHT_HOUR_MONITORING} WHERE status = 'COMPLETED') as completed_checks,
        (SELECT COUNT(*) FROM ${DB_TABLES.EIGHT_HOUR_MONITORING} WHERE next_check_due < GETDATE()) as overdue_checks,
        (SELECT TOP 1 checked_by FROM ${DB_TABLES.EIGHT_HOUR_MONITORING} GROUP BY checked_by ORDER BY COUNT(*) DESC) as top_checker
    `);

    const stats = result.recordset[0];

    return {
      total_checks: stats?.total_checks || 0,
      checks_today: stats?.checks_today || 0,
      pending_checks: stats?.pending_checks || 0,
      completed_checks: stats?.completed_checks || 0,
      overdue_checks: stats?.overdue_checks || 0,
      top_checker: stats?.top_checker || null
    };
  }

  // ========================================================================
  // AUTOMATED SCANNING (CRON JOBS)
  // ========================================================================

  /**
   * Get all overdue 8-hour monitoring checks
   * Called by cron job every hour
   * Returns checks where next_check_due < now and status != COMPLETED
   */
  async getOverdue8HMChecks(): Promise<EightHourMonitoringRecord[]> {
    try {
      const pool = await connectionManager.getPool();
      const request = pool.request();

      const result = await request.query(`
        SELECT
          monitoring_id, admission_id, check_time, hours_elapsed, status,
          checked_by, notes, next_check_due, created_at, updated_at
        FROM ${DB_TABLES.EIGHT_HOUR_MONITORING}
        WHERE next_check_due < GETDATE()
        AND status != 'COMPLETED'
        AND status != 'CANCELLED'
        ORDER BY next_check_due ASC
      `);

      return result.recordset as EightHourMonitoringRecord[];
    } catch (error) {
      console.error('[8HM Repository Error] Failed to get overdue checks:', error);
      return [];
    }
  }

  /**
   * Mark overdue checks with escalation flag
   * Called after detecting overdue checks
   */
  async escalateOverdueChecks(): Promise<{ escalated_count: number; error?: string }> {
    try {
      const pool = await connectionManager.getPool();
      const request = pool.request();

      // Update overdue checks to OVERDUE status
      const result = await request.query(`
        UPDATE ${DB_TABLES.EIGHT_HOUR_MONITORING}
        SET status = 'OVERDUE',
            updated_at = GETDATE(),
            updated_by = 'system'
        WHERE next_check_due < GETDATE()
        AND status NOT IN ('COMPLETED', 'CANCELLED', 'OVERDUE')
      `);

      return {
        escalated_count: result.rowsAffected[0] || 0
      };
    } catch (error: any) {
      return {
        escalated_count: 0,
        error: error.message
      };
    }
  }
}
