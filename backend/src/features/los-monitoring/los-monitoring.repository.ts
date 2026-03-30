/**
 * LOS Monitoring - Repository
 * Database operations for Length of Stay alerts
 */

import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { BaseRepository } from '../../core/base/base.repository';
import { DB_TABLES } from '../../core/constants';
import { LOSAlertEntity } from './entities/los-monitoring.entity';
import {
  LOSMonitoringFilters,
  CreateLOSAlertDto,
  UpdateLOSAlertDto,
  LOSAlertRecord,
  LOSMonitoringStatsResponse
} from './dto/los-monitoring.dto';

export class LOSMonitoringRepository extends BaseRepository<LOSAlertEntity> {
  constructor() {
    super(DB_TABLES.LOS_ALERTS, 'alert_id', false);
  }

  // ========================================================================
  // LOS ALERTS OPERATIONS
  // ========================================================================

  async getLOSAlerts(
    filters: LOSMonitoringFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: LOSAlertRecord[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const offset = (page - 1) * limit;
    const where: string[] = [];

    if (filters.admission_id !== undefined) {
      where.push('admission_id = @admission_id');
      request.input('admission_id', sql.BigInt, filters.admission_id);
    }
    if (filters.alert_level !== undefined) {
      where.push('alert_level = @alert_level');
      request.input('alert_level', sql.Int, filters.alert_level);
    }
    if (filters.status) {
      where.push('status = @status');
      request.input('status', sql.VarChar(20), filters.status);
    }
    if (filters.acknowledged_by) {
      where.push('acknowledged_by = @acknowledged_by');
      request.input('acknowledged_by', sql.VarChar(50), filters.acknowledged_by);
    }
    if (filters.triggered_after) {
      where.push('triggered_at >= @triggered_after');
      request.input('triggered_after', sql.DateTime2, new Date(filters.triggered_after));
    }
    if (filters.triggered_before) {
      where.push('triggered_at <= @triggered_before');
      request.input('triggered_before', sql.DateTime2, new Date(filters.triggered_before));
    }
    if (filters.search) {
      where.push('(notes LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${filters.search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await request.query(`
      SELECT COUNT(*) as total FROM ${DB_TABLES.LOS_ALERTS} ${whereClause}
    `);
    const total = countResult.recordset[0]?.total || 0;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT
        alert_id, admission_id, alert_level, triggered_at, current_los,
        threshold_days, status, acknowledged_by, acknowledged_at, notes, created_at, updated_at
      FROM ${DB_TABLES.LOS_ALERTS}
      ${whereClause}
      ORDER BY triggered_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset as LOSAlertRecord[],
      total
    };
  }

  async getAdmissionLOSAlerts(admission_id: bigint): Promise<LOSAlertRecord[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('admission_id', sql.BigInt, admission_id);

    const result = await request.query(`
      SELECT
        alert_id, admission_id, alert_level, triggered_at, current_los,
        threshold_days, status, acknowledged_by, acknowledged_at, notes, created_at, updated_at
      FROM ${DB_TABLES.LOS_ALERTS}
      WHERE admission_id = @admission_id
      ORDER BY alert_level DESC, triggered_at DESC
    `);

    return result.recordset as LOSAlertRecord[];
  }

  async createLOSAlert(dto: CreateLOSAlertDto): Promise<LOSAlertEntity> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('admission_id', sql.BigInt, dto.admission_id);
    request.input('alert_level', sql.Int, dto.alert_level);
    request.input('current_los', sql.Int, dto.current_los);
    request.input('threshold_days', sql.Int, dto.threshold_days);
    request.input('status', sql.VarChar(20), dto.status || 'ACTIVE');
    request.input('notes', sql.NVarChar(sql.MAX), dto.notes || null);

    const result = await request.query(`
      INSERT INTO ${DB_TABLES.LOS_ALERTS}
        (admission_id, alert_level, current_los, threshold_days, status, notes, triggered_at, created_at)
      VALUES
        (@admission_id, @alert_level, @current_los, @threshold_days, @status, @notes, GETDATE(), GETDATE())
      SELECT *
      FROM ${DB_TABLES.LOS_ALERTS}
      WHERE alert_id = SCOPE_IDENTITY()
    `);

    return result.recordset[0] || { alert_id: 0n } as LOSAlertEntity;
  }

  async updateLOSAlert(alert_id: bigint, dto: UpdateLOSAlertDto): Promise<LOSAlertEntity> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('alert_id', sql.BigInt, alert_id);

    const updates: string[] = [];
    if (dto.alert_level !== undefined) {
      updates.push('alert_level = @alert_level');
      request.input('alert_level', sql.Int, dto.alert_level);
    }
    if (dto.current_los !== undefined) {
      updates.push('current_los = @current_los');
      request.input('current_los', sql.Int, dto.current_los);
    }
    if (dto.status !== undefined) {
      updates.push('status = @status');
      request.input('status', sql.VarChar(20), dto.status);
    }
    if (dto.acknowledged_by !== undefined) {
      updates.push('acknowledged_by = @acknowledged_by');
      updates.push('acknowledged_at = GETDATE()');
      request.input('acknowledged_by', sql.VarChar(50), dto.acknowledged_by);
    }
    if (dto.notes !== undefined) {
      updates.push('notes = @notes');
      request.input('notes', sql.NVarChar(sql.MAX), dto.notes);
    }
    if (updates.length === 0) return { alert_id: 0n } as LOSAlertEntity;

    updates.push('updated_at = GETDATE()');
    updates.push('updated_by = @updated_by');
    request.input('updated_by', sql.VarChar(50), dto.acknowledged_by || 'system');

    const result = await request.query(`
      UPDATE ${DB_TABLES.LOS_ALERTS}
      SET ${updates.join(', ')}
      WHERE alert_id = @alert_id
      SELECT *
      FROM ${DB_TABLES.LOS_ALERTS}
      WHERE alert_id = @alert_id
    `);

    return result.recordset[0] || { alert_id: 0n } as LOSAlertEntity;
  }

  // ========================================================================
  // STATISTICS
  // ========================================================================

  async getStats(): Promise<LOSMonitoringStatsResponse> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const result = await request.query(`
      SELECT
        (SELECT COUNT(*) FROM ${DB_TABLES.LOS_ALERTS} WHERE status = 'ACTIVE') as total_active_alerts,
        (SELECT COUNT(*) FROM ${DB_TABLES.LOS_ALERTS} WHERE alert_level = 1) as level_1_alerts,
        (SELECT COUNT(*) FROM ${DB_TABLES.LOS_ALERTS} WHERE alert_level = 2) as level_2_alerts,
        (SELECT COUNT(*) FROM ${DB_TABLES.LOS_ALERTS} WHERE alert_level = 3) as level_3_alerts,
        (SELECT COUNT(*) FROM ${DB_TABLES.LOS_ALERTS} WHERE status = 'ACKNOWLEDGED') as acknowledged_alerts,
        (SELECT COUNT(*) FROM ${DB_TABLES.LOS_ALERTS} WHERE acknowledged_by IS NULL) as pending_alerts,
        (SELECT AVG(CAST(current_los AS FLOAT)) FROM ${DB_TABLES.LOS_ALERTS} WHERE current_los IS NOT NULL) as average_los,
        (SELECT MAX(current_los) FROM ${DB_TABLES.LOS_ALERTS}) as highest_los
    `);

    const stats = result.recordset[0];

    return {
      total_active_alerts: stats?.total_active_alerts || 0,
      level_1_alerts: stats?.level_1_alerts || 0,
      level_2_alerts: stats?.level_2_alerts || 0,
      level_3_alerts: stats?.level_3_alerts || 0,
      acknowledged_alerts: stats?.acknowledged_alerts || 0,
      pending_alerts: stats?.pending_alerts || 0,
      average_los: Math.round(stats?.average_los || 0),
      highest_los: stats?.highest_los || 0
    };
  }

  // ========================================================================
  // AUTOMATED SCANNING (CRON JOBS)
  // ========================================================================

  /**
   * Scan all active admissions and trigger/upgrade LOS alerts
   * Called by cron job daily at 00:00
   * LOS Thresholds:
   * - Level 1: 7 days
   * - Level 2: 14 days
   * - Level 3: 21 days
   */
  async scanAndTriggerLOSAlerts(): Promise<{ alerts_triggered: number; alerts_upgraded: number; error?: string }> {
    try {
      const pool = await connectionManager.getPool();
      
      // Define LOS thresholds in days
      const LOS_LEVELS: { [key: number]: number } = {
        1: 7,
        2: 14,
        3: 21
      };

      // Get all active admissions
      let request = pool.request();
      const admissionsResult = await request.query(`
        SELECT
          admission_id,
          admission_date,
          DATEDIFF(day, admission_date, GETDATE()) as los_days
        FROM ${DB_TABLES.ADMISSIONS}
        WHERE discharge_status IS NULL OR discharge_status = ''
        AND admission_date IS NOT NULL
      `);

      const admissions = admissionsResult.recordset;
      let alertsTriggered = 0;
      let alertsUpgraded = 0;

      for (const admission of admissions) {
        const losDays = admission.los_days;
        const admissionId = admission.admission_id;

        // Determine alert level
        let alertLevel = 0;
        if (losDays >= LOS_LEVELS[3]) {
          alertLevel = 3;
        } else if (losDays >= LOS_LEVELS[2]) {
          alertLevel = 2;
        } else if (losDays >= LOS_LEVELS[1]) {
          alertLevel = 1;
        }

        // If alert level determined, check existing alerts
        if (alertLevel > 0) {
          // Get existing alert for this admission
          request = pool.request();
          request.input('admission_id', sql.BigInt, admissionId);
          
          const existingAlertResult = await request.query(`
            SELECT TOP 1 alert_id, alert_level, status
            FROM ${DB_TABLES.LOS_ALERTS}
            WHERE admission_id = @admission_id AND status = 'ACTIVE'
            ORDER BY alert_level DESC, triggered_at DESC
          `);

          const existingAlert = existingAlertResult.recordset[0];

          if (!existingAlert) {
            // Create new alert
            request = pool.request();
            request.input('admission_id', sql.BigInt, admissionId);
            request.input('alert_level', sql.Int, alertLevel);
            request.input('current_los', sql.Int, losDays);
            request.input('threshold_days', sql.Int, LOS_LEVELS[alertLevel]);

            await request.query(`
              INSERT INTO ${DB_TABLES.LOS_ALERTS}
                (admission_id, alert_level, current_los, threshold_days, status, triggered_at, created_at)
              VALUES
                (@admission_id, @alert_level, @current_los, @threshold_days, 'ACTIVE', GETDATE(), GETDATE())
            `);

            alertsTriggered++;
          } else if (existingAlert.alert_level < alertLevel) {
            // Upgrade existing alert
            request = pool.request();
            request.input('alert_id', sql.BigInt, existingAlert.alert_id);
            request.input('alert_level', sql.Int, alertLevel);
            request.input('current_los', sql.Int, losDays);
            request.input('threshold_days', sql.Int, LOS_LEVELS[alertLevel]);

            await request.query(`
              UPDATE ${DB_TABLES.LOS_ALERTS}
              SET alert_level = @alert_level,
                  current_los = @current_los,
                  threshold_days = @threshold_days,
                  updated_at = GETDATE()
              WHERE alert_id = @alert_id
            `);

            alertsUpgraded++;
          }
        }
      }

      return {
        alerts_triggered: alertsTriggered,
        alerts_upgraded: alertsUpgraded
      };
    } catch (error: any) {
      return {
        alerts_triggered: 0,
        alerts_upgraded: 0,
        error: error.message
      };
    }
  }
}
