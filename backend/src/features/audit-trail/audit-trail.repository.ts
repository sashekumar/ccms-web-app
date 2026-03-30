/**
 * Audit Trail - Repository
 * Database operations for audit logs and admission logs
 */
import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { BaseRepository } from '../../core/base/base.repository';
import { DB_TABLES } from '../../core/constants';
import { AuditLogEntity, AdmissionLogEntity } from './entities/audit-trail.entity';
import {
  AuditLogFilters,
  AdmissionLogFilters,
  CreateAuditLogDto,
  CreateAdmissionLogDto,
  UpdateAuditLogDto,
  UpdateAdmissionLogDto,
  AuditLogRecord,
  AdmissionLogRecord,
  AuditTrailStatsResponse
} from './dto/audit-trail.dto';

export class AuditTrailRepository extends BaseRepository<AuditLogEntity> {
  constructor() {
    super(DB_TABLES.AUDIT_LOGS, 'audit_id', false);
  }

  // ========================================================================
  // AUDIT LOGS OPERATIONS
  // ========================================================================

  async getAuditLogs(
    filters: AuditLogFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: AuditLogRecord[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const offset = (page - 1) * limit;
    const where: string[] = [];

    if (filters.table_name) {
      where.push('table_name = @table_name');
      request.input('table_name', sql.VarChar(100), filters.table_name);
    }
    if (filters.record_id !== undefined) {
      where.push('record_id = @record_id');
      request.input('record_id', sql.BigInt, filters.record_id);
    }
    if (filters.action_type) {
      where.push('action_type = @action_type');
      request.input('action_type', sql.VarChar(20), filters.action_type);
    }
    if (filters.changed_by) {
      where.push('changed_by = @changed_by');
      request.input('changed_by', sql.VarChar(50), filters.changed_by);
    }
    if (filters.changed_after) {
      where.push('changed_at >= @changed_after');
      request.input('changed_after', sql.DateTime2, new Date(filters.changed_after));
    }
    if (filters.changed_before) {
      where.push('changed_at <= @changed_before');
      request.input('changed_before', sql.DateTime2, new Date(filters.changed_before));
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await request.query(`
      SELECT COUNT(*) as total FROM ${DB_TABLES.AUDIT_LOGS} ${whereClause}
    `);
    const total = countResult.recordset[0]?.total || 0;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT
        audit_id, table_name, record_id, action_type,
        old_value, new_value, changed_by, changed_at
      FROM ${DB_TABLES.AUDIT_LOGS}
      ${whereClause}
      ORDER BY changed_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset as AuditLogRecord[],
      total
    };
  }

  async createAuditLog(dto: CreateAuditLogDto): Promise<AuditLogEntity> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('table_name', sql.VarChar(100), dto.table_name);
    request.input('record_id', sql.BigInt, dto.record_id);
    request.input('action_type', sql.VarChar(20), dto.action_type);
    request.input('old_value', sql.NVarChar(sql.MAX), dto.old_value || null);
    request.input('new_value', sql.NVarChar(sql.MAX), dto.new_value || null);
    request.input('changed_by', sql.VarChar(50), dto.changed_by);
    request.input('created_by', sql.VarChar(50), dto.changed_by);

    const result = await request.query(`
      INSERT INTO ${DB_TABLES.AUDIT_LOGS}
        (table_name, record_id, action_type, old_value, new_value, changed_by, changed_at, created_at, created_by)
      VALUES
        (@table_name, @record_id, @action_type, @old_value, @new_value, @changed_by, GETDATE(), GETDATE(), @created_by)
      SELECT *
      FROM ${DB_TABLES.AUDIT_LOGS}
      WHERE audit_id = SCOPE_IDENTITY()
    `);

    return result.recordset[0] || { audit_id: 0n } as AuditLogEntity;
  }

  async updateAuditLog(audit_id: bigint, dto: UpdateAuditLogDto): Promise<AuditLogEntity> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('audit_id', sql.BigInt, audit_id);
    request.input('old_value', sql.NVarChar(sql.MAX), dto.old_value || null);
    request.input('new_value', sql.NVarChar(sql.MAX), dto.new_value || null);

    const result = await request.query(`
      UPDATE ${DB_TABLES.AUDIT_LOGS}
      SET
        old_value = ISNULL(@old_value, old_value),
        new_value = ISNULL(@new_value, new_value),
        updated_at = GETDATE(),
        updated_by = 'system'
      WHERE audit_id = @audit_id
      SELECT *
      FROM ${DB_TABLES.AUDIT_LOGS}
      WHERE audit_id = @audit_id
    `);

    return result.recordset[0] || { audit_id: 0n } as AuditLogEntity;
  }

  // ========================================================================
  // ADMISSION LOG OPERATIONS
  // ========================================================================

  async getAdmissionLogs(
    filters: AdmissionLogFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: AdmissionLogRecord[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const offset = (page - 1) * limit;
    const where: string[] = [];

    if (filters.admission_id !== undefined) {
      where.push('admission_id = @admission_id');
      request.input('admission_id', sql.BigInt, filters.admission_id);
    }
    if (filters.change_type) {
      where.push('change_type = @change_type');
      request.input('change_type', sql.VarChar(50), filters.change_type);
    }
    if (filters.changed_by) {
      where.push('changed_by = @changed_by');
      request.input('changed_by', sql.VarChar(50), filters.changed_by);
    }
    if (filters.changed_after) {
      where.push('changed_at >= @changed_after');
      request.input('changed_after', sql.DateTime2, new Date(filters.changed_after));
    }
    if (filters.changed_before) {
      where.push('changed_at <= @changed_before');
      request.input('changed_before', sql.DateTime2, new Date(filters.changed_before));
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await request.query(`
      SELECT COUNT(*) as total FROM ${DB_TABLES.ADMISSION_LOG} ${whereClause}
    `);
    const total = countResult.recordset[0]?.total || 0;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT
        log_id, admission_id, change_type, change_description,
        changed_by, changed_at
      FROM ${DB_TABLES.ADMISSION_LOG}
      ${whereClause}
      ORDER BY changed_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset as AdmissionLogRecord[],
      total
    };
  }

  async createAdmissionLog(dto: CreateAdmissionLogDto): Promise<AdmissionLogEntity> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('admission_id', sql.BigInt, dto.admission_id);
    request.input('change_type', sql.VarChar(50), dto.change_type);
    request.input('change_description', sql.NVarChar(sql.MAX), dto.change_description || null);
    request.input('changed_by', sql.VarChar(50), dto.changed_by);
    request.input('created_by', sql.VarChar(50), dto.changed_by);

    const result = await request.query(`
      INSERT INTO ${DB_TABLES.ADMISSION_LOG}
        (admission_id, change_type, change_description, changed_by, changed_at, created_at, created_by)
      VALUES
        (@admission_id, @change_type, @change_description, @changed_by, GETDATE(), GETDATE(), @created_by)
      SELECT *
      FROM ${DB_TABLES.ADMISSION_LOG}
      WHERE log_id = SCOPE_IDENTITY()
    `);

    return result.recordset[0] || { log_id: 0n } as AdmissionLogEntity;
  }

  async updateAdmissionLog(log_id: bigint, dto: UpdateAdmissionLogDto): Promise<AdmissionLogEntity> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('log_id', sql.BigInt, log_id);
    request.input('change_description', sql.NVarChar(sql.MAX), dto.change_description || null);

    const result = await request.query(`
      UPDATE ${DB_TABLES.ADMISSION_LOG}
      SET
        change_description = ISNULL(@change_description, change_description),
        updated_at = GETDATE(),
        updated_by = 'system'
      WHERE log_id = @log_id
      SELECT *
      FROM ${DB_TABLES.ADMISSION_LOG}
      WHERE log_id = @log_id
    `);

    return result.recordset[0] || { log_id: 0n } as AdmissionLogEntity;
  }

  async getStats(): Promise<AuditTrailStatsResponse> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const result = await request.query(`
      SELECT
        (SELECT COUNT(*) FROM ${DB_TABLES.AUDIT_LOGS}) as total_audit_entries,
        (SELECT COUNT(*) FROM ${DB_TABLES.ADMISSION_LOG}) as total_admission_entries,
        (SELECT COUNT(*) FROM ${DB_TABLES.AUDIT_LOGS} WHERE CAST(changed_at AS DATE) = CAST(GETDATE() AS DATE)) as audit_entries_today,
        (SELECT COUNT(*) FROM ${DB_TABLES.ADMISSION_LOG} WHERE CAST(changed_at AS DATE) = CAST(GETDATE() AS DATE)) as admission_entries_today,
        (SELECT TOP 1 table_name FROM ${DB_TABLES.AUDIT_LOGS} GROUP BY table_name ORDER BY COUNT(*) DESC) as top_modified_table,
        (SELECT TOP 1 changed_by FROM ${DB_TABLES.AUDIT_LOGS} GROUP BY changed_by ORDER BY COUNT(*) DESC) as top_modifier
    `);

    return result.recordset[0] || {
      total_audit_entries: 0,
      total_admission_entries: 0,
      audit_entries_today: 0,
      admission_entries_today: 0,
      top_modified_table: null,
      top_modifier: null
    };
  }
}
