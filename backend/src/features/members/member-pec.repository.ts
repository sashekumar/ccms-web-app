import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { MemberPEC, CreateMemberPECDto, UpdateMemberPECDto } from './member-pec.types';
import { BaseRepository } from '../../core/base/base.repository';

export class MemberPECRepository extends BaseRepository<MemberPEC> {
  constructor() {
    super(DB_TABLES.MEMBER_PEC_CONDITIONS, 'pec_id', false);
  }
  
  /**
   * Get all PEC conditions for a dependent
   */
  public async getPECsByDependentId(dependentId: string): Promise<MemberPEC[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('dependent_id', sql.BigInt, dependentId)
      .query(`
        SELECT 
          pec_id,
          legacy_pec_id,
          dependent_id,
          condition_code,
          condition_name,
          diagnosis_date,
          is_excluded,
          notes
        FROM ${DB_TABLES.MEMBER_PEC_CONDITIONS}
        WHERE dependent_id = @dependent_id
        ORDER BY diagnosis_date DESC, pec_id DESC
      `);

    return result.recordset;
  }

  /**
   * Get PEC condition by ID
   */
  public async getPECById(pecId: string): Promise<MemberPEC | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('pec_id', sql.BigInt, pecId)
      .query(`
        SELECT 
          pec_id,
          legacy_pec_id,
          dependent_id,
          condition_code,
          condition_name,
          diagnosis_date,
          is_excluded,
          notes
        FROM ${DB_TABLES.MEMBER_PEC_CONDITIONS}
        WHERE pec_id = @pec_id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Create new PEC condition
   */
  public async createPEC(dto: CreateMemberPECDto, createdBy?: string): Promise<string> {
    const pool = await connectionManager.getPool();
    
    const request = pool.request()
      .input('dependent_id', sql.BigInt, dto.dependent_id)
      .input('condition_code', sql.VarChar(50), dto.condition_code || null)
      .input('condition_name', sql.NVarChar(255), dto.condition_name || null)
      .input('diagnosis_date', sql.Date, dto.diagnosis_date || null)
      .input('is_excluded', sql.Bit, dto.is_excluded !== undefined ? dto.is_excluded : true)
      .input('notes', sql.NVarChar(sql.MAX), dto.notes || null);
    
    if (createdBy) {
      request.input('createdBy', sql.VarChar(50), createdBy);
    }
    
    const result = await request.query(`
        INSERT INTO ${DB_TABLES.MEMBER_PEC_CONDITIONS} (
          dependent_id,
          condition_code,
          condition_name,
          diagnosis_date,
          is_excluded,
          notes${createdBy ? ',\n          created_by' : ''}
        )
        VALUES (
          @dependent_id,
          @condition_code,
          @condition_name,
          @diagnosis_date,
          @is_excluded,
          @notes${createdBy ? ',\n          @createdBy' : ''}
        );
        SELECT CAST(SCOPE_IDENTITY() AS VARCHAR) AS pec_id;
      `);

    return result.recordset[0].pec_id;
  }

  /**
   * Update PEC condition
   */
  public async updatePEC(pecId: string, dto: UpdateMemberPECDto, updatedBy?: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request().input('pec_id', sql.BigInt, pecId);

    const setClauses: string[] = [];

    if (dto.condition_code !== undefined) {
      setClauses.push('condition_code = @condition_code');
      request.input('condition_code', sql.VarChar(50), dto.condition_code);
    }

    if (dto.condition_name !== undefined) {
      setClauses.push('condition_name = @condition_name');
      request.input('condition_name', sql.NVarChar(255), dto.condition_name);
    }

    if (dto.diagnosis_date !== undefined) {
      setClauses.push('diagnosis_date = @diagnosis_date');
      request.input('diagnosis_date', sql.Date, dto.diagnosis_date);
    }

    if (dto.is_excluded !== undefined) {
      setClauses.push('is_excluded = @is_excluded');
      request.input('is_excluded', sql.Bit, dto.is_excluded);
    }

    if (dto.notes !== undefined) {
      setClauses.push('notes = @notes');
      request.input('notes', sql.NVarChar(sql.MAX), dto.notes);
    }

    if (updatedBy) {
      setClauses.push('updated_by = @updatedBy');
      request.input('updatedBy', sql.VarChar(50), updatedBy);
    }

    setClauses.push('updated_at = GETDATE()');

    if (setClauses.length === 1) { // Only updated_at
      return false;
    }

    const result = await request.query(`
      UPDATE ${DB_TABLES.MEMBER_PEC_CONDITIONS}
      SET ${setClauses.join(', ')}
      WHERE pec_id = @pec_id
    `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Delete PEC condition (hard delete)
   */
  public async deletePEC(pecId: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('pec_id', sql.BigInt, pecId)
      .query(`
        DELETE FROM ${DB_TABLES.MEMBER_PEC_CONDITIONS}
        WHERE pec_id = @pec_id
      `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Toggle PEC excluded status
   */
  public async setPECExcludedStatus(pecId: string, isExcluded: boolean): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('pec_id', sql.BigInt, pecId)
      .input('is_excluded', sql.Bit, isExcluded)
      .query(`
        UPDATE ${DB_TABLES.MEMBER_PEC_CONDITIONS}
        SET is_excluded = @is_excluded
        WHERE pec_id = @pec_id
      `);

    return result.rowsAffected[0] > 0;
  }
}
