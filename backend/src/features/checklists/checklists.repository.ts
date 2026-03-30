/**
 * Checklists - Repository
 * Database operations for checklists
 */

import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { BaseRepository } from '../../core/base/base.repository';
import { DB_TABLES } from '../../core/constants';
import { ChecklistEntity } from './entities/checklists.entity';
import {
  ChecklistFilters,
  CreateChecklistDto,
  UpdateChecklistDto,
  ChecklistRecord,
  ChecklistsStatsResponse
} from './dto/checklists.dto';

export class ChecklistsRepository extends BaseRepository<ChecklistEntity> {
  constructor() {
    super(DB_TABLES.CHECKLISTS, 'checklist_id', false);
  }

  // ========================================================================
  // CHECKLIST OPERATIONS
  // ========================================================================

  async getChecklists(
    filters: ChecklistFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: ChecklistRecord[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const offset = (page - 1) * limit;
    const where: string[] = [];

    if (filters.claim_id !== undefined) {
      where.push('claim_id = @claim_id');
      request.input('claim_id', sql.BigInt, filters.claim_id);
    }
    if (filters.checklist_type) {
      where.push('checklist_type = @checklist_type');
      request.input('checklist_type', sql.VarChar(50), filters.checklist_type);
    }
    if (filters.check_key) {
      where.push('check_key = @check_key');
      request.input('check_key', sql.VarChar(100), filters.check_key);
    }
    if (filters.modified_by) {
      where.push('updated_by = @updated_by');
      request.input('updated_by', sql.VarChar(50), filters.modified_by);
    }
    if (filters.updated_after) {
      where.push('updated_at >= @updated_after');
      request.input('updated_after', sql.DateTime2, new Date(filters.updated_after));
    }
    if (filters.updated_before) {
      where.push('updated_at <= @updated_before');
      request.input('updated_before', sql.DateTime2, new Date(filters.updated_before));
    }
    if (filters.search) {
      where.push('(check_key LIKE @search OR check_value LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${filters.search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await request.query(`
      SELECT COUNT(*) as total FROM ${DB_TABLES.CHECKLISTS} ${whereClause}
    `);
    const total = countResult.recordset[0]?.total || 0;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT
        checklist_id, claim_id, checklist_type, check_key, check_value,
        updated_by, updated_at, created_at
      FROM ${DB_TABLES.CHECKLISTS}
      ${whereClause}
      ORDER BY updated_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset as ChecklistRecord[],
      total
    };
  }

  async getClaimChecklists(claim_id: bigint): Promise<ChecklistRecord[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('claim_id', sql.BigInt, claim_id);

    const result = await request.query(`
      SELECT
        checklist_id, claim_id, checklist_type, check_key, check_value,
        updated_by, updated_at, created_at
      FROM ${DB_TABLES.CHECKLISTS}
      WHERE claim_id = @claim_id
      ORDER BY checklist_type, check_key
    `);

    return result.recordset as ChecklistRecord[];
  }

  async createChecklist(dto: CreateChecklistDto): Promise<ChecklistEntity> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('claim_id', sql.BigInt, dto.claim_id);
    request.input('checklist_type', sql.VarChar(50), dto.checklist_type || null);
    request.input('check_key', sql.VarChar(100), dto.check_key);
    request.input('check_value', sql.NVarChar(sql.MAX), dto.check_value || null);
    request.input('updated_by', sql.VarChar(50), dto.updated_by);
    request.input('created_by', sql.VarChar(50), dto.updated_by);

    const result = await request.query(`
      INSERT INTO ${DB_TABLES.CHECKLISTS}
        (claim_id, checklist_type, check_key, check_value, updated_by, updated_at, created_at, created_by)
      VALUES
        (@claim_id, @checklist_type, @check_key, @check_value, @updated_by, GETDATE(), GETDATE(), @created_by)
      SELECT *
      FROM ${DB_TABLES.CHECKLISTS}
      WHERE checklist_id = SCOPE_IDENTITY()
    `);

    return result.recordset[0] || { checklist_id: 0n } as ChecklistEntity;
  }

  async updateChecklist(checklist_id: bigint, dto: UpdateChecklistDto): Promise<ChecklistEntity> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('checklist_id', sql.BigInt, checklist_id);

    const updates: string[] = [];
    if (dto.check_value !== undefined) {
      updates.push('check_value = @check_value');
      request.input('check_value', sql.NVarChar(sql.MAX), dto.check_value);
    }
    if (dto.checklist_type !== undefined) {
      updates.push('checklist_type = @checklist_type');
      request.input('checklist_type', sql.VarChar(50), dto.checklist_type);
    }
    if (updates.length === 0) return { checklist_id: 0n } as ChecklistEntity;

    updates.push('updated_at = GETDATE()');
    updates.push("updated_by = @updated_by");
    request.input('updated_by', sql.VarChar(50), dto.updated_by || 'system');

    const result = await request.query(`
      UPDATE ${DB_TABLES.CHECKLISTS}
      SET ${updates.join(', ')}
      WHERE checklist_id = @checklist_id
      SELECT *
      FROM ${DB_TABLES.CHECKLISTS}
      WHERE checklist_id = @checklist_id
    `);

    return result.recordset[0] || { checklist_id: 0n } as ChecklistEntity;
  }

  async deleteChecklist(checklist_id: bigint): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('checklist_id', sql.BigInt, checklist_id);

    const result = await request.query(`
      DELETE FROM ${DB_TABLES.CHECKLISTS}
      WHERE checklist_id = @checklist_id
    `);

    return result.rowsAffected[0] > 0;
  }

  // ========================================================================
  // STATISTICS
  // ========================================================================

  async getStats(): Promise<ChecklistsStatsResponse> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const result = await request.query(`
      SELECT
        (SELECT COUNT(*) FROM ${DB_TABLES.CHECKLISTS}) as total_checklists,
        (SELECT COUNT(DISTINCT claim_id) FROM ${DB_TABLES.CHECKLISTS}) as total_claims_with_checklists,
        (SELECT COUNT(*) FROM ${DB_TABLES.CHECKLISTS} WHERE CAST(updated_at AS DATE) = CAST(GETDATE() AS DATE)) as checklists_today,
        (SELECT TOP 1 updated_by FROM ${DB_TABLES.CHECKLISTS} GROUP BY updated_by ORDER BY COUNT(*) DESC) as top_modifier
    `);

    const stats = result.recordset[0];

    // Get checklist types breakdown
    const typesResult = await request.query(`
      SELECT checklist_type as type, COUNT(*) as count
      FROM ${DB_TABLES.CHECKLISTS}
      WHERE checklist_type IS NOT NULL
      GROUP BY checklist_type
      ORDER BY count DESC
    `);

    return {
      total_checklists: stats?.total_checklists || 0,
      total_claims_with_checklists: stats?.total_claims_with_checklists || 0,
      checklists_today: stats?.checklists_today || 0,
      checklist_types: typesResult.recordset || [],
      top_modifier: stats?.top_modifier || null
    };
  }
}
