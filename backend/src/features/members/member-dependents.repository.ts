import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { MemberDependent, CreateMemberDependentDto, UpdateMemberDependentDto } from './member-dependents.types';
import { BaseRepository } from '../../core/base/base.repository';

export class MemberDependentsRepository extends BaseRepository<MemberDependent> {
  constructor() {
    super(DB_TABLES.MEMBER_DEPENDENTS, 'dependent_id', false);
  }
  
  /**
   * Get all dependents for a member
   */
  public async getDependentsByMemberId(memberId: string): Promise<MemberDependent[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('principal_member_id', sql.BigInt, memberId)
      .query(`
        SELECT 
          dependent_id,
          legacy_dependent_id,
          principal_member_id,
          full_name,
          ic_no,
          relationship_id,
          dob,
          is_active
        FROM ${DB_TABLES.MEMBER_DEPENDENTS}
        WHERE principal_member_id = @principal_member_id
        ORDER BY is_active DESC, dependent_id ASC
      `);

    return result.recordset;
  }

  /**
   * Get dependent by ID
   */
  public async getDependentById(dependentId: string): Promise<MemberDependent | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('dependent_id', sql.BigInt, dependentId)
      .query(`
        SELECT 
          dependent_id,
          legacy_dependent_id,
          principal_member_id,
          full_name,
          ic_no,
          relationship_id,
          dob,
          is_active
        FROM ${DB_TABLES.MEMBER_DEPENDENTS}
        WHERE dependent_id = @dependent_id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Create new member dependent
   */
  public async createDependent(dto: CreateMemberDependentDto, createdBy?: string): Promise<string> {
    const pool = await connectionManager.getPool();
    
    const request = pool.request()
      .input('principal_member_id', sql.BigInt, dto.principal_member_id)
      .input('full_name', sql.NVarChar(255), dto.full_name)
      .input('ic_no', sql.VarChar(20), dto.ic_no || null)
      .input('relationship_id', sql.Int, dto.relationship_id || null)
      .input('dob', sql.Date, dto.dob || null)
      .input('is_active', sql.Bit, dto.is_active !== undefined ? dto.is_active : true);
    
    if (createdBy) {
      request.input('createdBy', sql.VarChar(50), createdBy);
    }
    
    const result = await request.query(`
        INSERT INTO ${DB_TABLES.MEMBER_DEPENDENTS} (
          principal_member_id,
          full_name,
          ic_no,
          relationship_id,
          dob,
          is_active${createdBy ? ',\n          created_by' : ''}
        )
        VALUES (
          @principal_member_id,
          @full_name,
          @ic_no,
          @relationship_id,
          @dob,
          @is_active${createdBy ? ',\n          @createdBy' : ''}
        );
        SELECT CAST(SCOPE_IDENTITY() AS VARCHAR) AS dependent_id;
      `);

    return result.recordset[0].dependent_id;
  }

  /**
   * Update member dependent
   */
  public async updateDependent(dependentId: string, dto: UpdateMemberDependentDto, updatedBy?: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request().input('dependent_id', sql.BigInt, dependentId);

    const setClauses: string[] = [];

    if (dto.full_name !== undefined) {
      setClauses.push('full_name = @full_name');
      request.input('full_name', sql.NVarChar(255), dto.full_name);
    }

    if (dto.ic_no !== undefined) {
      setClauses.push('ic_no = @ic_no');
      request.input('ic_no', sql.VarChar(20), dto.ic_no);
    }

    if (dto.relationship_id !== undefined) {
      setClauses.push('relationship_id = @relationship_id');
      request.input('relationship_id', sql.Int, dto.relationship_id);
    }

    if (dto.dob !== undefined) {
      setClauses.push('dob = @dob');
      request.input('dob', sql.Date, dto.dob);
    }

    if (dto.is_active !== undefined) {
      setClauses.push('is_active = @is_active');
      request.input('is_active', sql.Bit, dto.is_active);
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
      UPDATE ${DB_TABLES.MEMBER_DEPENDENTS}
      SET ${setClauses.join(', ')}
      WHERE dependent_id = @dependent_id
    `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Delete member dependent (hard delete)
   * Note: This will cascade delete PEC conditions due to FK constraint
   */
  public async deleteDependent(dependentId: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('dependent_id', sql.BigInt, dependentId)
      .query(`
        DELETE FROM ${DB_TABLES.MEMBER_DEPENDENTS}
        WHERE dependent_id = @dependent_id
      `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Toggle dependent active status
   */
  public async setDependentActiveStatus(dependentId: string, isActive: boolean): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('dependent_id', sql.BigInt, dependentId)
      .input('is_active', sql.Bit, isActive)
      .query(`
        UPDATE ${DB_TABLES.MEMBER_DEPENDENTS}
        SET is_active = @is_active
        WHERE dependent_id = @dependent_id
      `);

    return result.rowsAffected[0] > 0;
  }
}
