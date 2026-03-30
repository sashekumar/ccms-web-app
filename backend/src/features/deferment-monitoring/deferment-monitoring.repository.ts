/**
 * Deferment Monitoring - Repository
 * Database operations for deferred claims
 */

import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { BaseRepository } from '../../core/base/base.repository';
import { DB_TABLES } from '../../core/constants';
import { DefermentMonitoringEntity } from './entities/deferment-monitoring.entity';
import {
  DefermentMonitoringFilters,
  DefermentMonitoringRecord,
  DefermentMonitoringStatsResponse
} from './dto/deferment-monitoring.dto';

export class DefermentMonitoringRepository extends BaseRepository<DefermentMonitoringEntity> {
  constructor() {
    // Note: Deferment is tracked through admissions table
    super(DB_TABLES.ADMISSIONS, 'admission_id', false);
  }

  // ========================================================================
  // DEFERMENT OPERATIONS
  // ========================================================================

  async getDefermentCases(
    filters: DefermentMonitoringFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: DefermentMonitoringRecord[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const offset = (page - 1) * limit;
    const where: string[] = ['a.deferment_status IS NOT NULL AND a.deferment_status != \'\''];

    if (filters.admission_id !== undefined) {
      where.push('a.admission_id = @admission_id');
      request.input('admission_id', sql.BigInt, filters.admission_id);
    }
    if (filters.claim_id !== undefined) {
      where.push('a.claim_id = @claim_id');
      request.input('claim_id', sql.BigInt, filters.claim_id);
    }
    if (filters.deferment_status) {
      where.push('a.deferment_status = @deferment_status');
      request.input('deferment_status', sql.VarChar(50), filters.deferment_status);
    }
    if (filters.escalation_status) {
      where.push('e.status = @escalation_status');
      request.input('escalation_status', sql.VarChar(50), filters.escalation_status);
    }
    if (filters.escalated_to) {
      where.push('e.assigned_to = @escalated_to');
      request.input('escalated_to', sql.VarChar(50), filters.escalated_to);
    }
    if (filters.search) {
      where.push('(a.notes LIKE @search OR a.deferment_status LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${filters.search}%`);
    }

    const whereClause = where.join(' AND ');

    const countResult = await request.query(`
      SELECT COUNT(DISTINCT a.admission_id) as total
      FROM ${DB_TABLES.ADMISSIONS} a
      LEFT JOIN ${DB_TABLES.ESCALATIONS} e ON a.admission_id = e.admission_id
      WHERE ${whereClause}
    `);
    const total = countResult.recordset[0]?.total || 0;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT DISTINCT
        a.admission_id, a.claim_id, a.member_id,
        a.deferment_status, a.additional_notes as deferment_reason,
        a.expected_discharge_date as expected_resolution_date,
        e.escalation_id, e.status as escalation_status, e.assigned_to as escalated_to,
        ISNULL(e.updated_by, a.updated_by) as last_updated_by,
        ISNULL(e.updated_at, a.updated_at) as updated_at, a.created_at
      FROM ${DB_TABLES.ADMISSIONS} a
      LEFT JOIN ${DB_TABLES.ESCALATIONS} e ON a.admission_id = e.admission_id
      WHERE ${whereClause}
      ORDER BY a.updated_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset as DefermentMonitoringRecord[],
      total
    };
  }

  async getAdmissionDeferment(admission_id: bigint): Promise<DefermentMonitoringRecord | null> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('admission_id', sql.BigInt, admission_id);

    const result = await request.query(`
      SELECT
        a.admission_id, a.claim_id, a.member_id,
        a.deferment_status, a.additional_notes as deferment_reason,
        a.expected_discharge_date as expected_resolution_date,
        e.escalation_id, e.status as escalation_status, e.assigned_to as escalated_to,
        ISNULL(e.updated_by, a.updated_by) as last_updated_by,
        ISNULL(e.updated_at, a.updated_at) as updated_at, a.created_at
      FROM ${DB_TABLES.ADMISSIONS} a
      LEFT JOIN ${DB_TABLES.ESCALATIONS} e ON a.admission_id = e.admission_id
      WHERE a.admission_id = @admission_id AND a.deferment_status IS NOT NULL
    `);

    return result.recordset[0] as DefermentMonitoringRecord || null;
  }

  async updateDefermentCase(admission_id: bigint, deferment_status: string, updated_by: string, notes?: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('admission_id', sql.BigInt, admission_id);
    request.input('deferment_status', sql.VarChar(50), deferment_status);
    request.input('updated_by', sql.VarChar(50), updated_by);
    request.input('notes', sql.NVarChar(sql.MAX), notes || null);

    const result = await request.query(`
      UPDATE ${DB_TABLES.ADMISSIONS}
      SET deferment_status = @deferment_status,
          additional_notes = ISNULL(@notes, additional_notes),
          updated_by = @updated_by,
          updated_at = GETDATE()
      WHERE admission_id = @admission_id
    `);

    return result.rowsAffected[0] > 0;
  }

  // ========================================================================
  // STATISTICS
  // ========================================================================

  async getStats(): Promise<DefermentMonitoringStatsResponse> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const result = await request.query(`
      SELECT
        (SELECT COUNT(*) FROM ${DB_TABLES.ADMISSIONS} WHERE deferment_status IS NOT NULL) as total_deferred,
        (SELECT COUNT(*) FROM ${DB_TABLES.ADMISSIONS} WHERE deferment_status = 'PENDING') as pending_deferrals,
        (SELECT COUNT(*) FROM ${DB_TABLES.ADMISSIONS} WHERE deferment_status = 'UNDER_REVIEW') as under_review_deferrals,
        (SELECT COUNT(*) FROM ${DB_TABLES.ADMISSIONS} WHERE deferment_status = 'RESOLVED') as resolved_deferrals,
        (SELECT COUNT(*) FROM ${DB_TABLES.ADMISSIONS} WHERE deferment_status = 'CLOSED') as closed_deferrals,
        (SELECT COUNT(*) FROM ${DB_TABLES.ADMISSIONS} WHERE deferment_status IS NOT NULL AND expected_discharge_date < GETDATE()) as overdue_deferrals,
        (SELECT TOP 1 additional_notes FROM ${DB_TABLES.ADMISSIONS} WHERE deferment_status IS NOT NULL GROUP BY additional_notes ORDER BY COUNT(*) DESC) as top_deferment_reason,
        (SELECT AVG(CAST(DATEDIFF(day, created_at, updated_at) AS FLOAT)) FROM ${DB_TABLES.ADMISSIONS} WHERE deferment_status IN ('RESOLVED', 'CLOSED')) as average_resolution_time_days
    `);

    const stats = result.recordset[0];

    return {
      total_deferred: stats?.total_deferred || 0,
      pending_deferrals: stats?.pending_deferrals || 0,
      under_review_deferrals: stats?.under_review_deferrals || 0,
      resolved_deferrals: stats?.resolved_deferrals || 0,
      closed_deferrals: stats?.closed_deferrals || 0,
      overdue_deferrals: stats?.overdue_deferrals || 0,
      top_deferment_reason: stats?.top_deferment_reason || null,
      average_resolution_time_days: Math.round(stats?.average_resolution_time_days || 0)
    };
  }

  // ========================================================================
  // AUTOMATED SCANNING (CRON JOBS)
  // ========================================================================

  /**
   * Get all overdue deferment requests
   * Called by cron job daily at 00:00
   * Returns deferment cases where expected_resolution_date < now and status is not RESOLVED/CLOSED
   */
  async getOverdueDefermentRequests(): Promise<DefermentMonitoringRecord[]> {
    try {
      const pool = await connectionManager.getPool();
      const request = pool.request();

      const result = await request.query(`
        SELECT
          a.admission_id, a.claim_id, a.member_id,
          a.deferment_status, a.additional_notes as deferment_reason,
          a.expected_discharge_date as expected_resolution_date,
          e.escalation_id, e.status as escalation_status, e.assigned_to as escalated_to,
          ISNULL(e.updated_by, a.updated_by) as last_updated_by,
          ISNULL(e.updated_at, a.updated_at) as updated_at, a.created_at
        FROM ${DB_TABLES.ADMISSIONS} a
        LEFT JOIN ${DB_TABLES.ESCALATIONS} e ON a.admission_id = e.admission_id
        WHERE a.deferment_status IS NOT NULL
        AND a.deferment_status NOT IN ('RESOLVED', 'CLOSED')
        AND a.expected_discharge_date < GETDATE()
        ORDER BY a.expected_discharge_date ASC
      `);

      return result.recordset as DefermentMonitoringRecord[];
    } catch (error) {
      console.error('[Deferment Repository Error] Failed to get overdue deferment requests:', error);
      return [];
    }
  }

  /**
   * Mark overdue deferment requests as ESCALATED
   * Called after detecting overdue requests
   */
  async escalateOverdueDeferments(): Promise<{ escalated_count: number; error?: string }> {
    try {
      const pool = await connectionManager.getPool();
      const request = pool.request();

      // Update overdue deferrals that are not already escalated
      const result = await request.query(`
        UPDATE ${DB_TABLES.ADMISSIONS}
        SET deferment_status = 'ESCALATED',
            updated_by = 'system',
            updated_at = GETDATE()
        WHERE deferment_status IS NOT NULL
        AND deferment_status NOT IN ('RESOLVED', 'CLOSED', 'ESCALATED')
        AND expected_discharge_date < GETDATE()
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
