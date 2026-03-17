import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { BaseRepository } from '../../core/base/base.repository';
import { LOSAlert, EightHourCheck, MonitoringFilters } from './dto/monitoring.dto';

/**
 * Monitoring Repository
 * Database operations for 8-Hour Monitoring and LOS Alerts
 */
export class MonitoringRepository extends BaseRepository<LOSAlert> {
  constructor() {
    super('ccms_los_alerts', 'alert_id', false);
  }

  /**
   * Get active LOS alerts with pagination
   */
  async getLOSAlerts(filters: MonitoringFilters = {}): Promise<{ alerts: LOSAlert[], total: number }> {
    const pool = await connectionManager.getPool();
    
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const sortBy = filters.sortBy || 'triggered_at';
    const sortOrder = filters.sortOrder || 'DESC';

    let whereConditions: string[] = ['ad.is_deleted = 0'];
    
    if (filters.admissionStatus) {
      whereConditions.push('ad.admission_status = @admissionStatus');
    }
    if (filters.alertLevel) {
      whereConditions.push('a.alert_level = @alertLevel');
    }
    if (filters.alertStatus) {
      whereConditions.push('a.status = @alertStatus');
    }
    if (filters.hospitalId) {
      whereConditions.push('c.hospital_id = @hospitalId');
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ccms_los_alerts a
      INNER JOIN ccms_admissions ad ON a.admission_id = ad.admission_id
      INNER JOIN ccms_claims c ON ad.claim_id = c.claim_id
      ${whereClause}
    `;

    const countResult = await pool.request()
      .input('admissionStatus', sql.VarChar(50), filters.admissionStatus)
      .input('alertLevel', sql.Int, filters.alertLevel)
      .input('alertStatus', sql.VarChar(20), filters.alertStatus)
      .input('hospitalId', sql.Int, filters.hospitalId)
      .query(countQuery);

    const total = countResult.recordset[0].total;

    // Get paginated alerts
    const query = `
      SELECT 
        a.alert_id,
        a.admission_id,
        a.alert_level,
        a.triggered_at,
        a.current_los,
        a.threshold_days,
        a.status,
        a.notes,
        a.acknowledged_by,
        a.acknowledged_at,
        c.claim_ref_no,
        m.full_name AS member_name,
        h.hospital_name,
        ad.admission_status
      FROM ccms_los_alerts a
      INNER JOIN ccms_admissions ad ON a.admission_id = ad.admission_id
      INNER JOIN ccms_claims c ON ad.claim_id = c.claim_id
      LEFT JOIN ccms_members m ON c.member_id = m.member_id
      LEFT JOIN ccms_hospitals h ON c.hospital_id = h.hospital_id
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await pool.request()
      .input('admissionStatus', sql.VarChar(50), filters.admissionStatus)
      .input('alertLevel', sql.Int, filters.alertLevel)
      .input('alertStatus', sql.VarChar(20), filters.alertStatus)
      .input('hospitalId', sql.Int, filters.hospitalId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(query);

    return {
      alerts: result.recordset,
      total
    };
  }

  /**
   * Acknowledge LOS alert
   */
  async acknowledgeAlert(alertId: number, acknowledgedBy: string, notes?: string): Promise<void> {
    const pool = await connectionManager.getPool();

    const query = `
      UPDATE ccms_los_alerts
      SET 
        status = 'ACKNOWLEDGED',
        acknowledged_by = @acknowledgedBy,
        acknowledged_at = GETDATE(),
        notes = @notes
      WHERE alert_id = @alertId
    `;

    await pool.request()
      .input('alertId', sql.Int, alertId)
      .input('acknowledgedBy', sql.VarChar(50), acknowledgedBy)
      .input('notes', sql.VarChar(sql.MAX), notes)
      .query(query);
  }

  /**
   * Get 8-hour monitoring checks
   */
  async get8HMChecks(filters: MonitoringFilters = {}): Promise<{ checks: EightHourCheck[], total: number }> {
    const pool = await connectionManager.getPool();
    
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const sortBy = filters.sortBy || 'check_time';
    const sortOrder = filters.sortOrder || 'DESC';

    let whereConditions: string[] = ['ad.is_deleted = 0', 'ad.discharge_date IS NULL'];
    
    if (filters.admissionStatus) {
      whereConditions.push('ad.admission_status = @admissionStatus');
    }
    if (filters.hospitalId) {
      whereConditions.push('c.hospital_id = @hospitalId');
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ccms_8hm_monitoring m
      INNER JOIN ccms_admissions ad ON m.admission_id = ad.admission_id
      INNER JOIN ccms_claims c ON ad.claim_id = c.claim_id
      ${whereClause}
    `;

    const countResult = await pool.request()
      .input('admissionStatus', sql.VarChar(50), filters.admissionStatus)
      .input('hospitalId', sql.Int, filters.hospitalId)
      .query(countQuery);

    const total = countResult.recordset[0].total;

    // Get paginated checks
    const query = `
      SELECT 
        m.monitoring_id,
        m.admission_id,
        m.check_time,
        m.hours_elapsed,
        m.status,
        m.checked_by,
        m.notes,
        m.next_check_due,
        c.claim_ref_no,
        mem.full_name AS member_name,
        h.hospital_name,
        ad.admission_status
      FROM ccms_8hm_monitoring m
      INNER JOIN ccms_admissions ad ON m.admission_id = ad.admission_id
      INNER JOIN ccms_claims c ON ad.claim_id = c.claim_id
      LEFT JOIN ccms_members mem ON c.member_id = mem.member_id
      LEFT JOIN ccms_hospitals h ON c.hospital_id = h.hospital_id
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await pool.request()
      .input('admissionStatus', sql.VarChar(50), filters.admissionStatus)
      .input('hospitalId', sql.Int, filters.hospitalId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(query);

    return {
      checks: result.recordset,
      total
    };
  }

  /**
   * Record 8-hour monitoring check
   */
  async recordCheck(admissionId: number, status: string, checkedBy: string, notes?: string): Promise<void> {
    const pool = await connectionManager.getPool();

    // Calculate hours elapsed since admission
    const hoursQuery = `
      SELECT DATEDIFF(HOUR, admission_date, GETDATE()) as hours_elapsed
      FROM ccms_admissions
      WHERE admission_id = @admissionId
    `;

    const hoursResult = await pool.request()
      .input('admissionId', sql.Int, admissionId)
      .query(hoursQuery);

    const hoursElapsed = hoursResult.recordset[0]?.hours_elapsed || 0;

    // Calculate next check due (8 hours from now)
    const query = `
      INSERT INTO ccms_8hm_monitoring (
        admission_id,
        check_time,
        hours_elapsed,
        status,
        checked_by,
        notes,
        next_check_due
      )
      VALUES (
        @admissionId,
        GETDATE(),
        @hoursElapsed,
        @status,
        @checkedBy,
        @notes,
        DATEADD(HOUR, 8, GETDATE())
      )
    `;

    await pool.request()
      .input('admissionId', sql.Int, admissionId)
      .input('hoursElapsed', sql.Int, hoursElapsed)
      .input('status', sql.VarChar(50), status)
      .input('checkedBy', sql.VarChar(50), checkedBy)
      .input('notes', sql.VarChar(sql.MAX), notes)
      .query(query);
  }
}
