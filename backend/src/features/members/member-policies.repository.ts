import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { MemberPolicy, CreateMemberPolicyDto, UpdateMemberPolicyDto } from './member-policies.types';
import { BaseRepository } from '../../core/base/base.repository';

export class MemberPoliciesRepository extends BaseRepository<MemberPolicy> {
  constructor() {
    super(DB_TABLES.MEMBER_POLICIES, 'policy_record_id', false);
  }
  
  /**
   * Get all policies for a member
   */
  public async getPoliciesByMemberId(memberId: string): Promise<MemberPolicy[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('member_id', sql.BigInt, memberId)
      .query(`
        SELECT 
          policy_record_id,
          legacy_policy_id,
          member_id,
          product_id,
          policy_no,
          effective_date,
          expiry_date,
          status,
          is_deleted
        FROM ${DB_TABLES.MEMBER_POLICIES}
        WHERE member_id = @member_id AND is_deleted = 0
        ORDER BY effective_date DESC, policy_record_id DESC
      `);

    return result.recordset;
  }

  /**
   * Get policy by ID
   */
  public async getPolicyById(policyRecordId: string): Promise<MemberPolicy | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('policy_record_id', sql.BigInt, policyRecordId)
      .query(`
        SELECT 
          policy_record_id,
          legacy_policy_id,
          member_id,
          product_id,
          policy_no,
          effective_date,
          expiry_date,
          status,
          is_deleted
        FROM ${DB_TABLES.MEMBER_POLICIES}
        WHERE policy_record_id = @policy_record_id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Generate unique policy number
   */
  private async generatePolicyNo(memberId: string): Promise<string> {
    const pool = await connectionManager.getPool();
    
    // Get the max sequence for this member to ensure uniqueness
    const result = await pool.request()
      .input('member_id', sql.BigInt, memberId)
      .query(`
        SELECT COUNT(*) + 1 as seq
        FROM ${DB_TABLES.MEMBER_POLICIES}
        WHERE member_id = @member_id
      `);
    
    const seq = result.recordset[0].seq;
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Format: POL-{MemberID}-{YYYYMM}-{Sequence}
    return `POL-${memberId}-${year}${month}-${String(seq).padStart(3, '0')}`;
  }

  /**
   * Check if policy number already exists
   */
  public async checkPolicyNoExists(policyNo: string, excludePolicyRecordId?: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('policy_no', sql.VarChar(100), policyNo);
    
    let query = `
      SELECT COUNT(*) as count
      FROM ${DB_TABLES.MEMBER_POLICIES}
      WHERE policy_no = @policy_no AND is_deleted = 0
    `;
    
    if (excludePolicyRecordId) {
      query += ' AND policy_record_id != @exclude_id';
      request.input('exclude_id', sql.BigInt, excludePolicyRecordId);
    }
    
    const result = await request.query(query);
    return result.recordset[0].count > 0;
  }

  /**
   * Create new member policy
   */
  public async createPolicy(dto: CreateMemberPolicyDto, createdBy?: string): Promise<string> {
    const pool = await connectionManager.getPool();
    
    // Auto-generate policy_no if not provided
    const policyNo = dto.policy_no || await this.generatePolicyNo(dto.member_id);
    
    const request = pool.request()
      .input('member_id', sql.BigInt, dto.member_id)
      .input('product_id', sql.BigInt, dto.product_id)
      .input('policy_no', sql.VarChar(100), policyNo)
      .input('effective_date', sql.Date, dto.effective_date || null)
      .input('expiry_date', sql.Date, dto.expiry_date || null)
      .input('status', sql.VarChar(50), dto.status || null);
    
    if (createdBy) {
      request.input('createdBy', sql.VarChar(50), createdBy);
    }
    
    const result = await request.query(`
        INSERT INTO ${DB_TABLES.MEMBER_POLICIES} (
          member_id,
          product_id,
          policy_no,
          effective_date,
          expiry_date,
          status,
          is_deleted${createdBy ? ',\n          created_by' : ''}
        )
        VALUES (
          @member_id,
          @product_id,
          @policy_no,
          @effective_date,
          @expiry_date,
          @status,
          0${createdBy ? ',\n          @createdBy' : ''}
        );
        SELECT CAST(SCOPE_IDENTITY() AS VARCHAR) AS policy_record_id;
      `);

    return result.recordset[0].policy_record_id;
  }

  /**
   * Update member policy
   */
  public async updatePolicy(policyRecordId: string, dto: UpdateMemberPolicyDto, updatedBy?: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request().input('policy_record_id', sql.BigInt, policyRecordId);

    const setClauses: string[] = [];

    if (dto.product_id !== undefined) {
      setClauses.push('product_id = @product_id');
      request.input('product_id', sql.BigInt, dto.product_id);
    }

    if (dto.policy_no !== undefined) {
      setClauses.push('policy_no = @policy_no');
      request.input('policy_no', sql.VarChar(100), dto.policy_no);
    }

    if (dto.effective_date !== undefined) {
      setClauses.push('effective_date = @effective_date');
      request.input('effective_date', sql.Date, dto.effective_date);
    }

    if (dto.expiry_date !== undefined) {
      setClauses.push('expiry_date = @expiry_date');
      request.input('expiry_date', sql.Date, dto.expiry_date);
    }

    if (dto.status !== undefined) {
      setClauses.push('status = @status');
      request.input('status', sql.VarChar(50), dto.status);
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
      UPDATE ${DB_TABLES.MEMBER_POLICIES}
      SET ${setClauses.join(', ')}
      WHERE policy_record_id = @policy_record_id
    `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Delete member policy (soft delete)
   */
  public async deletePolicy(policyRecordId: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('policy_record_id', sql.BigInt, policyRecordId)
      .query(`
        UPDATE ${DB_TABLES.MEMBER_POLICIES}
        SET is_deleted = 1
        WHERE policy_record_id = @policy_record_id
      `);

    return result.rowsAffected[0] > 0;
  }
}
