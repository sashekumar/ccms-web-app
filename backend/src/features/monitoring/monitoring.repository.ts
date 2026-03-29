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

  /**
   * Create new LOS alert
   * TASK 1: Create LOS alert for admission
   */
  async createLOSAlert(
    admissionId: number,
    alertLevel: 1 | 2 | 3,
    currentLOS: number,
    thresholdDays: number
  ): Promise<number> {
    const pool = await connectionManager.getPool();

    const query = `
      INSERT INTO ccms_los_alerts (
        admission_id,
        alert_level,
        triggered_at,
        current_los,
        threshold_days,
        status,
        created_at,
        updated_at
      )
      VALUES (
        @admissionId,
        @alertLevel,
        GETDATE(),
        @currentLOS,
        @thresholdDays,
        'ACTIVE',
        GETDATE(),
        GETDATE()
      );
      SELECT SCOPE_IDENTITY() as alert_id;
    `;

    const result = await pool.request()
      .input('admissionId', sql.Int, admissionId)
      .input('alertLevel', sql.Int, alertLevel)
      .input('currentLOS', sql.Int, currentLOS)
      .input('thresholdDays', sql.Int, thresholdDays)
      .query(query);

    return result.recordset[0].alert_id;
  }

  /**
   * Check if alert already exists for admission at specific level
   * TASK 1: Check existing alert
   */
  async checkExistingAlert(admissionId: number, alertLevel: number): Promise<boolean> {
    const pool = await connectionManager.getPool();

    const query = `
      SELECT COUNT(*) as count
      FROM ccms_los_alerts
      WHERE admission_id = @admissionId
        AND alert_level = @alertLevel
        AND status IN ('ACTIVE', 'ACKNOWLEDGED')
    `;

    const result = await pool.request()
      .input('admissionId', sql.Int, admissionId)
      .input('alertLevel', sql.Int, alertLevel)
      .query(query);

    return result.recordset[0].count > 0;
  }

  /**
   * Upgrade alert from one level to another
   * TASK 1: Upgrade existing alert to higher level
   */
  async upgradeAlert(
    admissionId: number,
    fromLevel: number,
    toLevel: number,
    newLOS: number
  ): Promise<void> {
    const pool = await connectionManager.getPool();

    const thresholdDays = toLevel === 2 ? 14 : toLevel === 3 ? 21 : 7;

    const query = `
      UPDATE ccms_los_alerts
      SET 
        alert_level = @toLevel,
        current_los = @newLOS,
        threshold_days = @thresholdDays,
        updated_at = GETDATE()
      WHERE admission_id = @admissionId
        AND alert_level = @fromLevel
        AND status IN ('ACTIVE', 'ACKNOWLEDGED')
    `;

    await pool.request()
      .input('admissionId', sql.Int, admissionId)
      .input('fromLevel', sql.Int, fromLevel)
      .input('toLevel', sql.Int, toLevel)
      .input('newLOS', sql.Int, newLOS)
      .input('thresholdDays', sql.Int, thresholdDays)
      .query(query);
  }

  /**
   * Initialize 8HM monitoring for new admission
   * TASK 2: Initialize monitoring on admission create
   */
  async initialize8HMMonitoring(admissionId: number, admissionDatetime: Date): Promise<void> {
    const pool = await connectionManager.getPool();

    // Calculate next check due (8 hours after admission)
    const query = `
      INSERT INTO ccms_8hm_monitoring (
        admission_id,
        check_time,
        hours_elapsed,
        status,
        next_check_due,
        created_at,
        updated_at
      )
      VALUES (
        @admissionId,
        NULL,
        0,
        'Pending',
        DATEADD(HOUR, 8, @admissionDatetime),
        GETDATE(),
        GETDATE()
      )
    `;

    await pool.request()
      .input('admissionId', sql.Int, admissionId)
      .input('admissionDatetime', sql.DateTime2, admissionDatetime)
      .query(query);
  }

  /**
   * Complete 8HM monitoring when admission is discharged
   * TASK 2: Mark all pending checks as completed
   */
  async complete8HMMonitoring(admissionId: number): Promise<void> {
    const pool = await connectionManager.getPool();

    const query = `
      UPDATE ccms_8hm_monitoring
      SET 
        status = 'Completed',
        updated_at = GETDATE()
      WHERE admission_id = @admissionId
        AND status = 'Pending'
    `;

    await pool.request()
      .input('admissionId', sql.Int, admissionId)
      .query(query);
  }

  /**
   * Resolve all LOS alerts when admission is discharged
   * TASK 2: Mark active/acknowledged alerts as resolved
   */
  async resolveLOSAlerts(admissionId: number): Promise<void> {
    const pool = await connectionManager.getPool();

    const query = `
      UPDATE ccms_los_alerts
      SET 
        status = 'RESOLVED',
        resolved_at = GETDATE(),
        updated_at = GETDATE()
      WHERE admission_id = @admissionId
        AND status IN ('ACTIVE', 'ACKNOWLEDGED')
    `;

    await pool.request()
      .input('admissionId', sql.Int, admissionId)
      .query(query);
  }

  /**
   * Get overdue 8HM checks (past next_check_due time)
   * TASK 3: Find checks that need attention
   */
  async getOverdue8HMChecks(): Promise<any[]> {
    const pool = await connectionManager.getPool();

    const query = `
      SELECT 
        m.monitoring_id,
        m.admission_id,
        m.next_check_due,
        m.status,
        DATEDIFF(HOUR, m.next_check_due, GETDATE()) as hours_overdue,
        c.claim_ref_no,
        mem.full_name as patient_name,
        mem.ic_number as patient_ic,
        h.hospital_name,
        ad.admission_date
      FROM ccms_8hm_monitoring m
      INNER JOIN ccms_admissions ad ON m.admission_id = ad.admission_id
      INNER JOIN ccms_claims c ON ad.claim_id = c.claim_id
      LEFT JOIN ccms_members mem ON c.member_id = mem.member_id
      LEFT JOIN ccms_hospitals h ON c.hospital_id = h.hospital_id
      WHERE m.status = 'Pending'
        AND m.next_check_due <= GETDATE()
        AND ad.discharge_date IS NULL
        AND ad.is_deleted = 0
      ORDER BY m.next_check_due ASC
    `;

    const result = await pool.request().query(query);
    return result.recordset;
  }

  /**
   * Get active admissions (not discharged)
   * TASK 3: Used by LOS scanner to check all active cases
   */
  async getActiveAdmissions(): Promise<any[]> {
    const pool = await connectionManager.getPool();

    const query = `
      SELECT 
        ad.admission_id,
        ad.admission_date,
        DATEDIFF(DAY, ad.admission_date, GETDATE()) as current_los,
        c.claim_ref_no,
        mem.full_name as patient_name,
        h.hospital_name
      FROM ccms_admissions ad
      INNER JOIN ccms_claims c ON ad.claim_id = c.claim_id
      LEFT JOIN ccms_members mem ON c.member_id = mem.member_id
      LEFT JOIN ccms_hospitals h ON c.hospital_id = h.hospital_id
      WHERE ad.discharge_date IS NULL
        AND ad.is_deleted = 0
        AND ad.admission_status NOT IN ('Cancelled', 'Rejected')
      ORDER BY ad.admission_date ASC
    `;

    const result = await pool.request().query(query);
    return result.recordset;
  }

  /**
   * Get alert count for admission (helper for tracking)
   * TASK 3: Helper method for service layer
   */
  async getAlertCount(admissionId: number): Promise<number> {
    const pool = await connectionManager.getPool();

    const query = `
      SELECT COUNT(*) as count
      FROM ccms_los_alerts
      WHERE admission_id = @admissionId
        AND status IN ('ACTIVE', 'ACKNOWLEDGED')
    `;

    const result = await pool.request()
      .input('admissionId', sql.Int, admissionId)
      .query(query);

    return result.recordset[0].count;
  }

  /**
   * Get latest alert for admission
   * TASK 3: Helper to check if alert was upgraded
   */
  async getLatestAlert(admissionId: number): Promise<any> {
    const pool = await connectionManager.getPool();

    const query = `
      SELECT TOP 1 *
      FROM ccms_los_alerts
      WHERE admission_id = @admissionId
        AND status IN ('ACTIVE', 'ACKNOWLEDGED')
      ORDER BY created_at DESC, alert_level DESC
    `;

    const result = await pool.request()
      .input('admissionId', sql.Int, admissionId)
      .query(query);

    return result.recordset[0] || null;
  }
}
