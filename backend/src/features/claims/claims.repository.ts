import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { BaseRepository } from '../../core/base/base.repository';
import { Claim, ClaimFilters, PaginatedClaims } from './entities/claim.entity';
import { UpdateClaimDto } from './dto/claim.dto';

export class ClaimsRepository extends BaseRepository<Claim> {
  constructor() {
    super(DB_TABLES.CLAIMS, 'claim_id', false);
  }
  
  public async getClaims(filters: ClaimFilters): Promise<PaginatedClaims> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['c.is_deleted = 0'];

    if (filters.status && filters.status !== 'ALL') {
      whereClauses.push('c.claim_status = @status');
      request.input('status', sql.VarChar(50), filters.status);
    }

    if (filters.mode) {
      whereClauses.push('c.claim_mode = @mode');
      request.input('mode', sql.VarChar(50), filters.mode);
    }

    if (filters.patient_type) {
      whereClauses.push('c.patient_type = @patientType');
      request.input('patientType', sql.VarChar(20), filters.patient_type);
    }

    if (filters.search) {
      whereClauses.push(`(
        c.claim_ref_no LIKE @search OR 
        m.full_name LIKE @search OR
        h.hospital_name LIKE @search
      )`);
      request.input('search', sql.NVarChar(255), `%${filters.search}%`);
    }

    if (filters.dateFrom) {
      whereClauses.push('c.created_at >= @dateFrom');
      request.input('dateFrom', sql.DateTime2, filters.dateFrom);
    }

    if (filters.dateTo) {
      whereClauses.push('c.created_at <= @dateTo');
      request.input('dateTo', sql.DateTime2, filters.dateTo);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${DB_TABLES.CLAIMS} c
      LEFT JOIN ${DB_TABLES.MEMBERS} m ON c.member_id = m.member_id
      LEFT JOIN ${DB_TABLES.HOSPITALS} h ON c.hospital_id = h.hospital_id
      ${whereClause}
    `;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    const dataQuery = `
      SELECT 
        c.*,
        m.full_name as member_name,
        m.ic_no as member_ic_no,
        h.hospital_name
      FROM ${DB_TABLES.CLAIMS} c
      LEFT JOIN ${DB_TABLES.MEMBERS} m ON c.member_id = m.member_id
      LEFT JOIN ${DB_TABLES.HOSPITALS} h ON c.hospital_id = h.hospital_id
      ${whereClause}
      ORDER BY c.created_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(dataQuery);

    return {
      data: result.recordset,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  public async getClaimById(claimId: number): Promise<Claim | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('claimId', sql.BigInt, claimId)
      .query(`
        SELECT 
          c.*,
          m.full_name as member_name,
          m.ic_no as member_ic_no,
          h.hospital_name
        FROM ${DB_TABLES.CLAIMS} c
        LEFT JOIN ${DB_TABLES.MEMBERS} m ON c.member_id = m.member_id
        LEFT JOIN ${DB_TABLES.HOSPITALS} h ON c.hospital_id = h.hospital_id
        WHERE c.claim_id = @claimId AND c.is_deleted = 0
      `);

    return result.recordset[0] || null;
  }

  public async updateClaim(
    claimId: number, 
    dto: UpdateClaimDto, 
    updatedBy: string
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (dto.claim_status !== undefined) {
      updates.push('claim_status = @status');
      request.input('status', sql.VarChar(50), dto.claim_status);
    }
    
    if (dto.total_billed !== undefined) {
      updates.push('total_billed = @totalBilled');
      request.input('totalBilled', sql.Money, dto.total_billed);
    }

    if (dto.total_approved !== undefined) {
      updates.push('total_approved = @totalApproved');
      request.input('totalApproved', sql.Money, dto.total_approved);
    }

    if (dto.rejection_type !== undefined) {
      updates.push('rejection_type = @rejectionType');
      request.input('rejectionType', sql.VarChar(50), dto.rejection_type);
    }

    if (dto.rejection_reason !== undefined) {
      updates.push('rejection_reason = @rejectionReason');
      request.input('rejectionReason', sql.NVarChar(sql.MAX), dto.rejection_reason);
    }

    if (dto.approval_authority !== undefined) {
      updates.push('approval_authority = @approvalAuthority');
      request.input('approvalAuthority', sql.VarChar(50), dto.approval_authority);
    }

    if (dto.payee_name !== undefined) {
      updates.push('payee_name = @payeeName');
      request.input('payeeName', sql.NVarChar(255), dto.payee_name);
    }

    if (dto.payee_ic_no !== undefined) {
      updates.push('payee_ic_no = @payeeIcNo');
      request.input('payeeIcNo', sql.VarChar(20), dto.payee_ic_no);
    }

    if (dto.payee_bank_name !== undefined) {
      updates.push('payee_bank_name = @payeeBankName');
      request.input('payeeBankName', sql.NVarChar(100), dto.payee_bank_name);
    }

    if (dto.payee_bank_account_no !== undefined) {
      updates.push('payee_bank_account_no = @payeeAccountNo');
      request.input('payeeAccountNo', sql.VarChar(50), dto.payee_bank_account_no);
    }

    if (dto.document_received_at !== undefined) {
      updates.push('document_received_at = @docReceivedAt');
      request.input('docReceivedAt', sql.DateTime2, dto.document_received_at);
    }

    if (updates.length === 0) {
      return; 
    }

    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');
    
    request.input('updatedBy', sql.VarChar(50), updatedBy);
    request.input('claimId', sql.BigInt, claimId);

    await request.query(`
      UPDATE ${DB_TABLES.CLAIMS}
      SET ${updates.join(', ')}
      WHERE claim_id = @claimId
    `);
  }

  public async deleteClaim(claimId: number, deletedBy: string): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('claimId', sql.BigInt, claimId)
      .input('deletedBy', sql.VarChar(50), deletedBy)
      .query(`
        UPDATE ${DB_TABLES.CLAIMS}
        SET is_deleted = 1,
            deleted_at = GETDATE(),
            deleted_by = @deletedBy
        WHERE claim_id = @claimId
      `);
  }
}
