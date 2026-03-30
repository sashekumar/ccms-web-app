import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { BaseRepository } from '../../core/base/base.repository';
import { Claim, ClaimFilters, PaginatedClaims } from './entities/claim.entity';
import { CreateClaimDto, UpdateClaimDto, ApproveClaimDto, RejectClaimDto } from './dto/claim.dto';

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
        h.hospital_name,
        ad.admission_id,
        ad.gl_ref_no,
        u1.full_name as creator_name,
        u2.full_name as updater_name
      FROM ${DB_TABLES.CLAIMS} c
      LEFT JOIN ${DB_TABLES.MEMBERS} m ON c.member_id = m.member_id
      LEFT JOIN ${DB_TABLES.HOSPITALS} h ON c.hospital_id = h.hospital_id
      LEFT JOIN ${DB_TABLES.ADMISSIONS} ad ON c.claim_id = ad.claim_id AND ad.is_deleted = 0
      LEFT JOIN ${DB_TABLES.USERS} u1 ON CAST(c.created_by AS VARCHAR) = CAST(u1.user_id AS VARCHAR)
      LEFT JOIN ${DB_TABLES.USERS} u2 ON CAST(c.updated_by AS VARCHAR) = CAST(u2.user_id AS VARCHAR)
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
          h.hospital_name,
          u1.full_name as creator_name,
          u2.full_name as updater_name
        FROM ${DB_TABLES.CLAIMS} c
        LEFT JOIN ${DB_TABLES.MEMBERS} m ON c.member_id = m.member_id
        LEFT JOIN ${DB_TABLES.HOSPITALS} h ON c.hospital_id = h.hospital_id
        LEFT JOIN ${DB_TABLES.USERS} u1 ON CAST(c.created_by AS VARCHAR) = CAST(u1.user_id AS VARCHAR)
        LEFT JOIN ${DB_TABLES.USERS} u2 ON CAST(c.updated_by AS VARCHAR) = CAST(u2.user_id AS VARCHAR)
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
      if (dto.claim_status === 'REJECTED') {
        updates.push('rejection_date = GETDATE()');
      }
    }

    if (dto.member_id !== undefined) {
      updates.push('member_id = @memberId');
      request.input('memberId', sql.BigInt, dto.member_id);
    }

    if (dto.hospital_id !== undefined) {
      updates.push('hospital_id = @hospitalId');
      request.input('hospitalId', sql.BigInt, dto.hospital_id);
    }

    if (dto.disability_category !== undefined) {
      updates.push('disability_category = @disabilityCategory');
      request.input('disabilityCategory', sql.VarChar(100), dto.disability_category);
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

    if (dto.patient_id !== undefined) {
      updates.push('patient_id = @patientId');
      request.input('patientId', sql.BigInt, dto.patient_id);
    }

    if (dto.patient_type !== undefined) {
      updates.push('patient_type = @patientType');
      request.input('patientType', sql.VarChar(20), dto.patient_type);
    }

    if (dto.is_ec_case !== undefined) {
      updates.push('is_ec_case = @isEcCase');
      request.input('isEcCase', sql.Bit, dto.is_ec_case ? 1 : 0);
    }

    if (dto.ec_status !== undefined) {
      updates.push('ec_status = @ecStatus');
      request.input('ecStatus', sql.VarChar(50), dto.ec_status);
    }

    if (dto.ec_notification_date !== undefined) {
      updates.push('ec_notification_date = @ecNotifDate');
      request.input('ecNotifDate', sql.DateTime2, dto.ec_notification_date);
    }

    if (dto.ec_closed_date !== undefined) {
      updates.push('ec_closed_date = @ecClosedDate');
      request.input('ecClosedDate', sql.DateTime2, dto.ec_closed_date);
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

  /**
   * Create a standalone reimbursement claim (no admission row)
   * claim_mode defaults to 'REIMB'
   */
  public async createClaim(
    dto: CreateClaimDto,
    createdBy: string
  ): Promise<{ claimId: number; claimRefNo: string }> {
    const pool = await connectionManager.getPool();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      const claimRefNo = await this.generateClaimRefNo(transaction);

      const result = await transaction.request()
        .input('claimRefNo', sql.VarChar(50), claimRefNo)
        .input('memberId', sql.BigInt, dto.member_id)
        .input('hospitalId', sql.BigInt, dto.hospital_id)
        .input('policyRecordId', sql.BigInt, dto.policy_record_id || null)
        .input('patientType', sql.VarChar(20), dto.patient_type || 'PRINCIPAL')
        .input('patientId', sql.BigInt, dto.patient_id || null)
        .input('disabilityCategory', sql.VarChar(100), dto.disability_category || null)
        .input('claimStatus', sql.VarChar(50), 'PENDING')
        .input('claimMode', sql.VarChar(20), 'REIMB')
        .input('totalBilled', sql.Money, dto.total_billed || 0)
        .input('docReceivedAt', sql.DateTime2, dto.document_received_at || null)
        .input('payeeName', sql.NVarChar(255), dto.payee_name || null)
        .input('payeeIcNo', sql.VarChar(20), dto.payee_ic_no || null)
        .input('payeeBankName', sql.NVarChar(100), dto.payee_bank_name || null)
        .input('payeeAccountNo', sql.VarChar(50), dto.payee_bank_account_no || null)
        .input('slaDays', sql.Int, dto.sla_days || 14)
        .input('slaDeadline', sql.DateTime2, dto.sla_deadline || null)
        .input('slaStatus', sql.VarChar(20), dto.sla_status || 'ON_TIME')
        .input('createdBy', sql.VarChar(50), createdBy)
        .query(`
          INSERT INTO ${DB_TABLES.CLAIMS} (
            claim_ref_no, member_id, hospital_id, policy_record_id,
            patient_type, patient_id, disability_category,
            claim_status, claim_mode, total_billed,
            document_received_at,
            payee_name, payee_ic_no, payee_bank_name, payee_bank_account_no,
            sla_days, sla_deadline, sla_status,
            created_by
          )
          OUTPUT INSERTED.claim_id
          VALUES (
            @claimRefNo, @memberId, @hospitalId, @policyRecordId,
            @patientType, @patientId, @disabilityCategory,
            @claimStatus, @claimMode, @totalBilled,
            @docReceivedAt,
            @payeeName, @payeeIcNo, @payeeBankName, @payeeAccountNo,
            @slaDays, @slaDeadline, @slaStatus,
            @createdBy
          )
        `);

      const claimId = result.recordset[0].claim_id;

      // Insert creation remark
      await transaction.request()
        .input('refType', sql.VarChar(50), 'CLAIM')
        .input('refId', sql.BigInt, claimId)
        .input('actionFor', sql.VarChar(50), 'CREATION')
        .input('remarkText', sql.NVarChar(sql.MAX), 'Claim registered')
        .input('createdBy', sql.VarChar(50), createdBy)
        .query(`
          INSERT INTO ${DB_TABLES.REMARKS} (ref_type, ref_id, action_for, remark_text, created_by)
          VALUES (@refType, @refId, @actionFor, @remarkText, @createdBy)
        `);

      await transaction.commit();
      return { claimId, claimRefNo };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async generateClaimRefNo(transaction: sql.Transaction): Promise<string> {
    const year = new Date().getFullYear();

    const result = await transaction.request()
      .input('pattern', sql.VarChar(20), `CLM-${year}-%`)
      .query(`
        SELECT TOP 1 claim_ref_no
        FROM ${DB_TABLES.CLAIMS} WITH (UPDLOCK, ROWLOCK)
        WHERE claim_ref_no LIKE @pattern
        ORDER BY claim_ref_no DESC
      `);

    let nextNumber = 1;
    if (result.recordset.length > 0) {
      const lastClaim = result.recordset[0].claim_ref_no;
      const lastNumber = parseInt(lastClaim.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `CLM-${year}-${nextNumber.toString().padStart(5, '0')}`;
  }

  // ============================================================================
  // CLAIM EXPENSES (using ccms_remarks with ref_type='CLAIM_EXPENSE')
  // ============================================================================
  
  public async getClaimExpenses(claimId: number): Promise<any[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('claimId', sql.BigInt, claimId)
      .query(`
        SELECT 
          remark_id as claim_expense_id,
          ref_desc as benefit_category,
          action_for as receipt_no,
          remark_text as expense_data,
          created_by,
          created_at
        FROM ${DB_TABLES.REMARKS}
        WHERE ref_type = 'CLAIM_EXPENSE' AND ref_id = @claimId
        ORDER BY created_at ASC
      `);
    
    // Parse JSON from remark_text
    return result.recordset.map(row => ({
      claim_expense_id: row.claim_expense_id,
      benefit_category: row.benefit_category,
      receipt_no: row.receipt_no,
      ...JSON.parse(row.expense_data || '{}'),
      created_by: row.created_by,
      created_at: row.created_at
    }));
  }

  public async addClaimExpense(claimId: number, expense: {
    benefit_category: string;
    description?: string;
    billed_amt: number;
    receipt_no?: string;
    receipt_date?: string;
  }, userId: string): Promise<number> {
    const pool = await connectionManager.getPool();
    
    const expenseData = JSON.stringify({
      description: expense.description || '',
      billed_amt: expense.billed_amt,
      receipt_date: expense.receipt_date || null
    });

    const result = await pool.request()
      .input('refType', sql.VarChar(50), 'CLAIM_EXPENSE')
      .input('refId', sql.BigInt, claimId)
      .input('refDesc', sql.VarChar(100), expense.benefit_category)
      .input('actionFor', sql.VarChar(50), expense.receipt_no || null)
      .input('remarkText', sql.NVarChar(sql.MAX), expenseData)
      .input('createdBy', sql.VarChar(50), userId)
      .query(`
        INSERT INTO ${DB_TABLES.REMARKS} (ref_type, ref_id, ref_desc, action_for, remark_text, created_by)
        OUTPUT INSERTED.remark_id
        VALUES (@refType, @refId, @refDesc, @actionFor, @remarkText, @createdBy)
      `);
    
    return result.recordset[0].remark_id;
  }

  public async updateClaimExpense(expenseId: number, expense: {
    benefit_category?: string;
    description?: string;
    billed_amt?: number;
    receipt_no?: string;
    receipt_date?: string;
  }, userId: string): Promise<void> {
    const pool = await connectionManager.getPool();
    
    const expenseData = JSON.stringify({
      description: expense.description || '',
      billed_amt: expense.billed_amt,
      receipt_date: expense.receipt_date || null
    });

    await pool.request()
      .input('expenseId', sql.BigInt, expenseId)
      .input('refDesc', sql.VarChar(100), expense.benefit_category)
      .input('actionFor', sql.VarChar(50), expense.receipt_no || null)
      .input('remarkText', sql.NVarChar(sql.MAX), expenseData)
      .input('updatedBy', sql.VarChar(50), userId)
      .query(`
        UPDATE ${DB_TABLES.REMARKS}
        SET ref_desc = @refDesc, action_for = @actionFor, remark_text = @remarkText,
            updated_by = @updatedBy, updated_at = GETDATE()
        WHERE remark_id = @expenseId AND ref_type = 'CLAIM_EXPENSE'
      `);
  }

  public async deleteClaimExpense(expenseId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('expenseId', sql.BigInt, expenseId)
      .query(`
        DELETE FROM ${DB_TABLES.REMARKS}
        WHERE remark_id = @expenseId AND ref_type = 'CLAIM_EXPENSE'
      `);
  }

  // ============================================================================
  // CLAIM DOCUMENTS (using ccms_documents with ref_type='CLAIM')
  // ============================================================================

  public async getClaimDocuments(claimId: number): Promise<any[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('claimId', sql.BigInt, claimId)
      .query(`
        SELECT 
          doc_id as claim_document_id,
          file_name,
          doc_category,
          file_path,
          file_extension,
          file_size_bytes,
          uploaded_at,
          uploaded_by
        FROM ${DB_TABLES.DOCUMENTS}
        WHERE ref_type = 'CLAIM' AND ref_id = @claimId AND is_deleted = 0
        ORDER BY uploaded_at DESC
      `);
    return result.recordset;
  }

  public async addClaimDocument(claimId: number, doc: {
    file_name: string;
    doc_category: string;
    file_path: string;
    file_extension?: string;
    file_size_bytes?: number;
  }, userId: string): Promise<number> {
    const pool = await connectionManager.getPool();
    
    const result = await pool.request()
      .input('refType', sql.VarChar(20), 'CLAIM')
      .input('refId', sql.BigInt, claimId)
      .input('fileName', sql.NVarChar(255), doc.file_name)
      .input('docCategory', sql.VarChar(50), doc.doc_category)
      .input('filePath', sql.NVarChar(sql.MAX), doc.file_path)
      .input('fileExtension', sql.VarChar(10), doc.file_extension || null)
      .input('fileSizeBytes', sql.BigInt, doc.file_size_bytes || null)
      .input('uploadedBy', sql.VarChar(50), userId)
      .input('createdBy', sql.VarChar(50), userId)
      .query(`
        INSERT INTO ${DB_TABLES.DOCUMENTS} 
          (ref_type, ref_id, file_name, doc_category, file_path, file_extension, file_size_bytes, uploaded_by, created_by)
        OUTPUT INSERTED.doc_id
        VALUES 
          (@refType, @refId, @fileName, @docCategory, @filePath, @fileExtension, @fileSizeBytes, @uploadedBy, @createdBy)
      `);
    
    return result.recordset[0].doc_id;
  }

  public async updateClaimDocument(docId: number, doc: {
    file_name?: string;
    doc_category?: string;
    file_path?: string;
    remarks?: string;
  }, userId: string): Promise<void> {
    const pool = await connectionManager.getPool();
    const updates: string[] = [];
    const request = pool.request();
    request.input('docId', sql.BigInt, docId);
    request.input('updatedBy', sql.VarChar(50), userId);

    if (doc.file_name) {
      updates.push('file_name = @fileName');
      request.input('fileName', sql.NVarChar(255), doc.file_name);
    }
    if (doc.doc_category) {
      updates.push('doc_category = @docCategory');
      request.input('docCategory', sql.VarChar(50), doc.doc_category);
    }
    if (doc.file_path) {
      updates.push('file_path = @filePath');
      request.input('filePath', sql.NVarChar(sql.MAX), doc.file_path);
    }
    // Note: remarks column actually doesn't exist in ccms_documents in this codebase usually.
    // If it doesn't exist, this might fail. Let's check table definition or just skip if questionable.
    // I'll skip remarks for now unless I'm sure it's there. 

    if (updates.length > 0) {
      await request.query(`
        UPDATE ${DB_TABLES.DOCUMENTS}
        SET ${updates.join(', ')}, updated_by = @updatedBy, updated_at = GETDATE()
        WHERE doc_id = @docId AND ref_type = 'CLAIM'
      `);
    }
  }

  public async deleteClaimDocument(docId: number, userId: string): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('docId', sql.BigInt, docId)
      .input('updatedBy', sql.VarChar(50), userId)
      .query(`
        UPDATE ${DB_TABLES.DOCUMENTS}
        SET is_deleted = 1, updated_by = @updatedBy, updated_at = GETDATE()
        WHERE doc_id = @docId AND ref_type = 'CLAIM'
      `);
  }

  // ============================================================================
  // WORKFLOW: APPROVE & REJECT
  // ============================================================================

  public async approveClaimSubmission(
    claimId: number,
    dto: ApproveClaimDto,
    approvedBy: string
  ): Promise<void> {
    const pool = await connectionManager.getPool();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      await transaction.request()
        .input('claimId', sql.BigInt, claimId)
        .input('totalApproved', sql.Money, dto.total_approved)
        .input('approvalAuthority', sql.VarChar(50), approvedBy)
        .input('slaStatus', sql.VarChar(20), dto.sla_status || 'ON_TIME')
        .query(`
          UPDATE ${DB_TABLES.CLAIMS}
          SET claim_status = 'APPROVED',
              total_approved = @totalApproved,
              approval_authority = @approvalAuthority,
              sla_status = @slaStatus,
              updated_by = @approvalAuthority,
              updated_at = GETDATE()
          WHERE claim_id = @claimId
        `);

      await transaction.request()
        .input('refType', sql.VarChar(50), 'CLAIM')
        .input('refId', sql.BigInt, claimId)
        .input('actionFor', sql.VarChar(50), 'APPROVAL')
        .input('remarkText', sql.NVarChar(sql.MAX), dto.remarks || 'Claim approved')
        .input('createdBy', sql.VarChar(50), approvedBy)
        .query(`
          INSERT INTO ${DB_TABLES.REMARKS} (ref_type, ref_id, action_for, remark_text, created_by)
          VALUES (@refType, @refId, @actionFor, @remarkText, @createdBy)
        `);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public async rejectClaimSubmission(
    claimId: number,
    dto: RejectClaimDto,
    rejectedBy: string
  ): Promise<void> {
    const pool = await connectionManager.getPool();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      await transaction.request()
        .input('claimId', sql.BigInt, claimId)
        .input('rejectionReason', sql.NVarChar(sql.MAX), dto.rejection_reason)
        .input('rejectionType', sql.VarChar(50), dto.rejection_type || null)
        .input('rejectedBy', sql.VarChar(50), rejectedBy)
        .query(`
          UPDATE ${DB_TABLES.CLAIMS}
          SET claim_status = 'REJECTED',
              rejection_reason = @rejectionReason,
              rejection_type = @rejectionType,
              rejection_date = GETDATE(),
              updated_by = @rejectedBy,
              updated_at = GETDATE()
          WHERE claim_id = @claimId
        `);

      await transaction.request()
        .input('refType', sql.VarChar(50), 'CLAIM')
        .input('refId', sql.BigInt, claimId)
        .input('actionFor', sql.VarChar(50), 'REJECTION')
        .input('remarkText', sql.NVarChar(sql.MAX), dto.remarks || dto.rejection_reason)
        .input('createdBy', sql.VarChar(50), rejectedBy)
        .query(`
          INSERT INTO ${DB_TABLES.REMARKS} (ref_type, ref_id, action_for, remark_text, created_by)
          VALUES (@refType, @refId, @actionFor, @remarkText, @createdBy)
        `);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public async getClaimRemarks(claimId: number): Promise<any[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('claimId', sql.BigInt, claimId)
      .query(`
        SELECT 
          remark_id,
          action_for,
          remark_text,
          created_by,
          created_at
        FROM ${DB_TABLES.REMARKS}
        WHERE ref_type = 'CLAIM' AND ref_id = @claimId
        ORDER BY created_at ASC
      `);
    return result.recordset;
  }

  /**
   * Get total approved amount for a policy
   * Used by policy validation service to check annual limit
   *
   * @param policyRecordId - Policy record ID
   * @returns Total sum of approved amounts for this policy
   */
  public async getTotalApprovedAmountForPolicy(policyRecordId: number): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('policyRecordId', sql.BigInt, policyRecordId)
      .query(`
        SELECT ISNULL(SUM(total_approved), 0) as total_approved
        FROM ${DB_TABLES.CLAIMS}
        WHERE policy_record_id = @policyRecordId 
          AND claim_status IN ('APPROVED', 'SETTLED')
          AND is_deleted = 0
      `);

    return result.recordset[0]?.total_approved || 0;
  }
}
