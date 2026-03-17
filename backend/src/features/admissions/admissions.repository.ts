import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { BaseRepository } from '../../core/base/base.repository';
import {
  Admission,
  AdmissionListItem,
  AdmissionFilters,
  PaginatedAdmissions
} from './entities/admission.entity';
import {
  CreateAdmissionDto,
  UpdateAdmissionDto,
  ApproveAdmissionDto,
  RejectAdmissionDto,
  SendMedicalQueryDto,
  RespondToMQDto,
  DeferAdmissionDto,
  ResolveDefermentDto
} from './dto/admission.dto';
import { CreateRemarkDto } from '../remarks/entities/remark.entity';

/**
 * Admissions Repository
 * Handles database operations for ccms_admissions table
 * 
 * Key Features:
 * - CRUD operations
 * - GL auto-generation (GL-YYYY-NNNN format)
 * - Workflow tracking via ccms_remarks
 * - Transaction support for approve/reject
 * - Row-level locking for GL generation
 * 
 * v7 Schema Compliance: All operations strictly follow ccms_admissions structure
 */
export class AdmissionsRepository extends BaseRepository<Admission> {
  constructor() {
    super(DB_TABLES.ADMISSIONS, 'admission_id', false);
  }
  
  /**
   * Get paginated list of admissions with filters and joined data
   */
  public async getAdmissions(filters: AdmissionFilters): Promise<PaginatedAdmissions> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereClauses: string[] = ['a.is_deleted = 0']; // Default: exclude deleted

    if (filters.admission_status) {
      whereClauses.push('a.admission_status = @admissionStatus');
      request.input('admissionStatus', sql.VarChar(50), filters.admission_status);
    }

    if (filters.admission_type) {
      whereClauses.push('a.admission_type = @admissionType');
      request.input('admissionType', sql.VarChar(50), filters.admission_type);
    }

    if (filters.room_type) {
      whereClauses.push('a.room_type = @roomType');
      request.input('roomType', sql.VarChar(50), filters.room_type);
    }

    if (filters.claim_id) {
      whereClauses.push('a.claim_id = @claimId');
      request.input('claimId', sql.BigInt, filters.claim_id);
    }

    if (filters.admission_date_from) {
      whereClauses.push('a.admission_date >= @admissionDateFrom');
      request.input('admissionDateFrom', sql.DateTime, filters.admission_date_from);
    }

    if (filters.admission_date_to) {
      whereClauses.push('a.admission_date <= @admissionDateTo');
      request.input('admissionDateTo', sql.DateTime, filters.admission_date_to);
    }

    if (filters.has_alert !== undefined) {
      whereClauses.push('a.alert_flag = @hasAlert');
      request.input('hasAlert', sql.Bit, filters.has_alert);
    }

    if (filters.search) {
      whereClauses.push(`(
        c.claim_ref_no LIKE @search OR 
        a.gl_ref_no LIKE @search OR
        m.full_name LIKE @search OR
        h.hospital_name LIKE @search
      )`);
      request.input('search', sql.NVarChar(255), `%${filters.search}%`);
    }

    if (filters.is_deleted !== undefined) {
      whereClauses[0] = 'a.is_deleted = @isDeleted';
      request.input('isDeleted', sql.Bit, filters.is_deleted);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Sorting
    const sortBy = filters.sort_by || 'admission_id';
    const sortOrder = filters.sort_order || 'DESC';
    const orderBy = `ORDER BY a.${sortBy} ${sortOrder}`;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${DB_TABLES.ADMISSIONS} a
      LEFT JOIN ${DB_TABLES.CLAIMS} c ON a.claim_id = c.claim_id
      LEFT JOIN ${DB_TABLES.MEMBERS} m ON c.member_id = m.member_id
      LEFT JOIN ${DB_TABLES.HOSPITALS} h ON c.hospital_id = h.hospital_id
      ${whereClause}
    `;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    // Data query
    const dataQuery = `
      SELECT 
        a.admission_id,
        a.claim_id,
        a.gl_ref_no,
        a.admission_date,
        a.discharge_date,
        a.los_days,
        a.admission_status,
        a.admission_type,
        a.room_type,
        a.room_rate,
        a.alert_flag,
        a.created_at,
        a.created_by,
        c.claim_ref_no,
        m.full_name as member_name,
        h.hospital_name
      FROM ${DB_TABLES.ADMISSIONS} a
      LEFT JOIN ${DB_TABLES.CLAIMS} c ON a.claim_id = c.claim_id
      LEFT JOIN ${DB_TABLES.MEMBERS} m ON c.member_id = m.member_id
      LEFT JOIN ${DB_TABLES.HOSPITALS} h ON c.hospital_id = h.hospital_id
      ${whereClause}
      ${orderBy}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(dataQuery);

    const admissions: AdmissionListItem[] = result.recordset.map((row: any) => ({
      admission_id: row.admission_id,
      claim_id: row.claim_id,
      gl_ref_no: row.gl_ref_no,
      admission_date: row.admission_date,
      discharge_date: row.discharge_date,
      los_days: row.los_days,
      admission_status: row.admission_status,
      admission_type: row.admission_type,
      room_type: row.room_type,
      room_rate: row.room_rate,
      alert_flag: row.alert_flag,
      created_at: row.created_at,
      created_by: row.created_by,
      claim_ref_no: row.claim_ref_no,
      member_name: row.member_name,
      hospital_name: row.hospital_name
    }));

    return {
      admissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get admission by ID with related data
   */
  public async getAdmissionById(admissionId: number): Promise<Admission | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('admissionId', sql.BigInt, admissionId)
      .query(`
        SELECT 
          a.*,
          c.claim_ref_no,
          c.member_id,
          c.hospital_id,
          c.policy_record_id,
          c.total_billed as estimated_amount,
          c.disability_code as diagnosis,
          c.disability_category as diagnosis_category,
          m.full_name as member_name,
          h.hospital_name,
          ISNULL(cu.username, a.created_by) as created_by_username,
          ISNULL(uu.username, a.updated_by) as updated_by_username
        FROM ${DB_TABLES.ADMISSIONS} a
        LEFT JOIN ${DB_TABLES.CLAIMS} c ON a.claim_id = c.claim_id
        LEFT JOIN ${DB_TABLES.MEMBERS} m ON c.member_id = m.member_id
        LEFT JOIN ${DB_TABLES.HOSPITALS} h ON c.hospital_id = h.hospital_id
        LEFT JOIN ${DB_TABLES.USERS} cu ON a.created_by = CAST(cu.user_id AS VARCHAR(50))
        LEFT JOIN ${DB_TABLES.USERS} uu ON a.updated_by = CAST(uu.user_id AS VARCHAR(50))
        WHERE a.admission_id = @admissionId
      `);

    return result.recordset[0] || null;
  }

  /**
   * Create new admission with auto-claim creation
   * 
   * Workflow:
   * 1. Auto-generate claim_ref_no (CLM-YYYY-NNNN)
   * 2. Create claim record in ccms_claims
   * 3. Create admission record linked to new claim
   * 4. Initial status: PENDING_APPROVAL
   * 
   * Transaction-based to ensure atomicity
   * 
   * @returns Object with { admissionId, claimId, claimRefNo }
   */
  public async createAdmission(
    dto: CreateAdmissionDto, 
    createdBy: string
  ): Promise<{ admissionId: number; claimId: number; claimRefNo: string }> {
    const pool = await connectionManager.getPool();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // Step 1: Generate claim reference number (CLM-YYYY-NNNN)
      const claimRefNo = await this.generateClaimRefNo(transaction);

      // Step 2: Create claim record
      const claimResult = await transaction.request()
        .input('claimRefNo', sql.VarChar(50), claimRefNo)
        .input('memberId', sql.BigInt, dto.member_id)
        .input('hospitalId', sql.BigInt, dto.hospital_id)
        .input('policyRecordId', sql.BigInt, dto.policy_record_id || null)
        .input('claimStatus', sql.VarChar(50), 'PENDING')
        .input('claimMode', sql.VarChar(20), 'CASHLESS')
        .input('totalBilled', sql.Money, dto.estimated_amount || 0)
        .input('disabilityCategory', sql.VarChar(100), dto.diagnosis_category || null)
        .input('createdBy', sql.VarChar(50), createdBy)
        .query(`
          INSERT INTO ${DB_TABLES.CLAIMS} (
            claim_ref_no, member_id, hospital_id, policy_record_id,
            claim_status, claim_mode, total_billed, disability_category, created_by
          )
          OUTPUT INSERTED.claim_id
          VALUES (
            @claimRefNo, @memberId, @hospitalId, @policyRecordId,
            @claimStatus, @claimMode, @totalBilled, @disabilityCategory, @createdBy
          )
        `);

      const claimId = claimResult.recordset[0].claim_id;

      // Step 3: Create admission record
      const admissionResult = await transaction.request()
        .input('claimId', sql.BigInt, claimId)
        .input('admissionDate', sql.DateTime, dto.admission_date)
        .input('dischargeDate', sql.DateTime, dto.discharge_date || null)
        .input('admissionStatus', sql.VarChar(50), 'PENDING_APPROVAL')
        .input('admissionType', sql.VarChar(50), dto.admission_type)
        .input('roomType', sql.VarChar(50), dto.room_type)
        .input('roomRate', sql.Money, dto.room_rate || null)
        .input('icuDays', sql.Int, dto.icu_days || null)
        .input('icuRate', sql.Money, dto.icu_rate || null)
        .input('ehmStatus', sql.VarChar(50), dto.ehm_status || 'NOT_APPLICABLE')
        .input('defermentStatus', sql.VarChar(50), dto.deferment_status || 'NOT_DEFERRED')
        .input('alertFlag', sql.Bit, dto.alert_flag ? 1 : 0)
        .input('createdBy', sql.VarChar(50), createdBy)
        .query(`
          INSERT INTO ${DB_TABLES.ADMISSIONS} (
            claim_id, admission_date, discharge_date, admission_status,
            admission_type, room_type, room_rate, icu_days, icu_rate,
            ehm_status, deferment_status, alert_flag, created_by
          )
          OUTPUT INSERTED.admission_id
          VALUES (
            @claimId, @admissionDate, @dischargeDate, @admissionStatus,
            @admissionType, @roomType, @roomRate, @icuDays, @icuRate,
            @ehmStatus, @defermentStatus, @alertFlag, @createdBy
          )
        `);

      const admissionId = admissionResult.recordset[0].admission_id;

      // Step 4: Create initial remark (creation record for workflow history)
      const createRemarkText = `Admission created by ${createdBy}. Claim Reference: ${claimRefNo}. Status: Pending Approval. Admission Type: ${dto.admission_type}, Room Type: ${dto.room_type}${dto.estimated_amount ? `, Estimated Amount: RM ${dto.estimated_amount.toFixed(2)}` : ''}`;
      
      await transaction.request()
        .input('refType', sql.VarChar(50), 'ADMISSION')
        .input('refId', sql.BigInt, admissionId)
        .input('refDesc', sql.VarChar(100), `Admission ${admissionId} created`)
        .input('actionFor', sql.VarChar(50), 'CREATION')
        .input('remarkText', sql.NVarChar(sql.MAX), createRemarkText)
        .input('createdBy', sql.VarChar(50), createdBy)
        .query(`
          INSERT INTO ${DB_TABLES.REMARKS} (
            ref_type, ref_id, ref_desc, action_for, remark_text, created_by
          )
          VALUES (
            @refType, @refId, @refDesc, @actionFor, @remarkText, @createdBy
          )
        `);

      await transaction.commit();

      return { admissionId, claimId, claimRefNo };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update admission details
   * Cannot update: admission_id, claim_id, gl_ref_no, admission_status
   */
  public async updateAdmission(
    admissionId: number,
    dto: UpdateAdmissionDto,
    updatedBy: string
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (dto.admission_date !== undefined) {
      updates.push('admission_date = @admissionDate');
      request.input('admissionDate', sql.DateTime, dto.admission_date);
    }

    if (dto.discharge_date !== undefined) {
      updates.push('discharge_date = @dischargeDate');
      request.input('dischargeDate', sql.DateTime, dto.discharge_date);
    }

    if (dto.admission_type !== undefined) {
      updates.push('admission_type = @admissionType');
      request.input('admissionType', sql.VarChar(50), dto.admission_type);
    }

    if (dto.room_type !== undefined) {
      updates.push('room_type = @roomType');
      request.input('roomType', sql.VarChar(50), dto.room_type);
    }

    if (dto.room_rate !== undefined) {
      updates.push('room_rate = @roomRate');
      request.input('roomRate', sql.Money, dto.room_rate);
    }

    if (dto.icu_days !== undefined) {
      updates.push('icu_days = @icuDays');
      request.input('icuDays', sql.Int, dto.icu_days);
    }

    if (dto.icu_rate !== undefined) {
      updates.push('icu_rate = @icuRate');
      request.input('icuRate', sql.Money, dto.icu_rate);
    }

    if (dto.ehm_status !== undefined) {
      updates.push('ehm_status = @ehmStatus');
      request.input('ehmStatus', sql.VarChar(50), dto.ehm_status);
    }

    if (dto.deferment_status !== undefined) {
      updates.push('deferment_status = @defermentStatus');
      request.input('defermentStatus', sql.VarChar(50), dto.deferment_status);
    }

    if (dto.alert_flag !== undefined) {
      updates.push('alert_flag = @alertFlag');
      request.input('alertFlag', sql.Bit, dto.alert_flag ? 1 : 0);
    }

    if (updates.length === 0) {
      return; // Nothing to update
    }

    // Add audit fields
    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');
    request.input('updatedBy', sql.VarChar(50), updatedBy);
    request.input('admissionId', sql.BigInt, admissionId);

    await request.query(`
      UPDATE ${DB_TABLES.ADMISSIONS}
      SET ${updates.join(', ')}
      WHERE admission_id = @admissionId
    `);
  }

  /**
   * Approve admission (generates GL) - Transaction-based
   * 
   * Steps:
   * 1. Lock GL generation to prevent race conditions
   * 2. Generate next GL number (GL-YYYY-NNNN)
   * 3. Update admission: status=APPROVED, gl_ref_no=generated
   * 4. Insert remark in ccms_remarks (ref_type='ADMISSION', action_for='APPROVAL')
   * 
   * Returns: Generated GL reference number
   */
  public async approveAdmission(
    admissionId: number,
    dto: ApproveAdmissionDto,
    approvedBy: string
  ): Promise<string> {
    const pool = await connectionManager.getPool();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // Step 1: Generate GL number with row-level lock
      const glRefNo = await this.generateGLNumber(transaction);

      // Step 2: Update admission status and GL
      await transaction.request()
        .input('admissionId', sql.BigInt, admissionId)
        .input('glRefNo', sql.VarChar(50), glRefNo)
        .input('updatedBy', sql.VarChar(50), approvedBy)
        .query(`
          UPDATE ${DB_TABLES.ADMISSIONS}
          SET admission_status = 'APPROVED',
              gl_ref_no = @glRefNo,
              updated_by = @updatedBy,
              updated_at = GETDATE()
          WHERE admission_id = @admissionId
        `);

      // Step 3: Insert remark (workflow tracking)
      const remarkText = dto.remarks || 'Admission approved';
      await transaction.request()
        .input('refType', sql.VarChar(50), 'ADMISSION')
        .input('refId', sql.BigInt, admissionId)
        .input('refDesc', sql.VarChar(100), `Admission ${admissionId} approval`)
        .input('actionFor', sql.VarChar(50), 'APPROVAL')
        .input('remarkText', sql.NVarChar(sql.MAX), remarkText)
        .input('createdBy', sql.VarChar(50), approvedBy)
        .query(`
          INSERT INTO ${DB_TABLES.REMARKS} (
            ref_type, ref_id, ref_desc, action_for, remark_text, created_by
          )
          VALUES (
            @refType, @refId, @refDesc, @actionFor, @remarkText, @createdBy
          )
        `);

      await transaction.commit();
      return glRefNo;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Reject admission - Transaction-based
   * 
   * Steps:
   * 1. Update admission: status=REJECTED
   * 2. Insert remark in ccms_remarks (ref_type='ADMISSION', action_for='REJECTION')
   */
  public async rejectAdmission(
    admissionId: number,
    dto: RejectAdmissionDto,
    rejectedBy: string
  ): Promise<void> {
    const pool = await connectionManager.getPool();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // Step 1: Update admission status
      await transaction.request()
        .input('admissionId', sql.BigInt, admissionId)
        .input('updatedBy', sql.VarChar(50), rejectedBy)
        .query(`
UPDATE ${DB_TABLES.ADMISSIONS}
          SET admission_status = 'REJECTED',
              updated_by = @updatedBy,
              updated_at = GETDATE()
          WHERE admission_id = @admissionId
        `);

      // Step 2: Insert remark (workflow tracking)
      await transaction.request()
        .input('refType', sql.VarChar(50), 'ADMISSION')
        .input('refId', sql.BigInt, admissionId)
        .input('refDesc', sql.VarChar(100), `Admission ${admissionId} rejection`)
        .input('actionFor', sql.VarChar(50), 'REJECTION')
        .input('remarkText', sql.NVarChar(sql.MAX), dto.rejectionReason)
        .input('createdBy', sql.VarChar(50), rejectedBy)
        .query(`
          INSERT INTO ${DB_TABLES.REMARKS} (
            ref_type, ref_id, ref_desc, action_for, remark_text, created_by
          )
          VALUES (
            @refType, @refId, @refDesc, @actionFor, @remarkText, @createdBy
          )
        `);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Soft delete admission
   */
  public async deleteAdmission(admissionId: number, deletedBy: string): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('admissionId', sql.BigInt, admissionId)
      .input('deletedBy', sql.VarChar(50), deletedBy)
      .query(`
        UPDATE ${DB_TABLES.ADMISSIONS}
        SET is_deleted = 1,
            updated_by = @deletedBy,
            updated_at = GETDATE()
        WHERE admission_id = @admissionId
      `);
  }

  /**
   * Generate GL reference number with format: GL-YYYY-NNNN
   * Uses row-level lock to prevent race conditions
   * 
   * Examples: GL-2026-0001, GL-2026-0123, GL-2027-0001
   */
  private async generateGLNumber(transaction: sql.Transaction): Promise<string> {
    const year = new Date().getFullYear();
    
    // Get last GL number for this year with pessimistic lock
    const result = await transaction.request()
      .input('pattern', sql.VarChar(20), `GL-${year}-%`)
      .query(`
        SELECT TOP 1 gl_ref_no
        FROM ${DB_TABLES.ADMISSIONS} WITH (UPDLOCK, ROWLOCK)
        WHERE gl_ref_no LIKE @pattern
        ORDER BY gl_ref_no DESC
      `);

    let nextNumber = 1;

    if (result.recordset.length > 0) {
      const lastGL = result.recordset[0].gl_ref_no;
      const lastNumber = parseInt(lastGL.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    // Format: GL-YYYY-NNNN (zero-padded 4 digits)
    const glRefNo = `GL-${year}-${nextNumber.toString().padStart(4, '0')}`;
    return glRefNo;
  }

  /**
   * Generate Claim reference number with format: CLM-YYYY-NNNNN
   * Uses row-level lock to prevent race conditions
   * 
   * Examples: CLM-2026-00001, CLM-2026-00123, CLM-2027-00001
   */
  private async generateClaimRefNo(transaction: sql.Transaction): Promise<string> {
    const year = new Date().getFullYear();
    
    // Get last claim number for this year with pessimistic lock
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

    // Format: CLM-YYYY-NNNNN (zero-padded 5 digits)
    const claimRefNo = `CLM-${year}-${nextNumber.toString().padStart(5, '0')}`;
    return claimRefNo;
  }

  /**
   * Get remarks for an admission (workflow history)
   */
  public async getAdmissionRemarks(admissionId: number): Promise<any[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('admissionId', sql.BigInt, admissionId)
      .query(`
        SELECT 
          r.remark_id,
          r.action_for,
          r.remark_text,
          r.created_by,
          r.created_at,
          ISNULL(u.username, r.created_by) as created_by_username
        FROM ${DB_TABLES.REMARKS} r
        LEFT JOIN ${DB_TABLES.USERS} u ON r.created_by = CAST(u.user_id AS VARCHAR(50))
        WHERE r.ref_type = 'ADMISSION' AND r.ref_id = @admissionId
        ORDER BY r.created_at DESC
      `);

    return result.recordset;
  }

  /**
   * Send Medical Query to hospital
   * Updates status to PENDING_MQ and creates MQ_SENT remark
   */
  public async sendMedicalQuery(
    admissionId: number,
    queryText: string,
    dueDate: Date | string | undefined,
    sentBy: string
  ): Promise<void> {
    const pool = await connectionManager.getPool();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // Step 1: Update admission status
      await transaction.request()
        .input('admissionId', sql.BigInt, admissionId)
        .input('updatedBy', sql.VarChar(50), sentBy)
        .query(`
          UPDATE ${DB_TABLES.ADMISSIONS}
          SET admission_status = 'PENDING_MQ',
              updated_at = GETDATE(),
              updated_by = @updatedBy
          WHERE admission_id = @admissionId
        `);

      // Step 2: Create MQ_SENT remark
      const remarkText = `Medical Query sent${dueDate ? ` (Due: ${new Date(dueDate).toLocaleDateString()})` : ''}. Query: ${queryText}`;
      
      await transaction.request()
        .input('refType', sql.VarChar(50), 'ADMISSION')
        .input('refId', sql.BigInt, admissionId)
        .input('refDesc', sql.NVarChar(255), `MQ for Admission ${admissionId}`)
        .input('actionFor', sql.VarChar(50), 'MQ_SENT')
        .input('remarkText', sql.NVarChar(sql.MAX), remarkText)
        .input('createdBy', sql.VarChar(50), sentBy)
        .query(`
          INSERT INTO ${DB_TABLES.REMARKS} (
            ref_type, ref_id, ref_desc, action_for, remark_text, created_by, created_at
          ) VALUES (
            @refType, @refId, @refDesc, @actionFor, @remarkText, @createdBy, GETDATE()
          )
        `);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Respond to Medical Query (from hospital)
   * Updates status to MQ_RESPONDED and creates MQ_RESPONSE remark
   */
  public async respondToMQ(
    admissionId: number,
    responseText: string,
    respondedBy: string
  ): Promise<void> {
    const pool = await connectionManager.getPool();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // Step 1: Update admission status
      await transaction.request()
        .input('admissionId', sql.BigInt, admissionId)
        .input('updatedBy', sql.VarChar(50), respondedBy)
        .query(`
          UPDATE ${DB_TABLES.ADMISSIONS}
          SET admission_status = 'MQ_RESPONDED',
              updated_at = GETDATE(),
              updated_by = @updatedBy
          WHERE admission_id = @admissionId
        `);

      // Step 2: Create MQ_RESPONSE remark
      const remarkText = `Medical Query response received. Response: ${responseText}`;
      
      await transaction.request()
        .input('refType', sql.VarChar(50), 'ADMISSION')
        .input('refId', sql.BigInt, admissionId)
        .input('refDesc', sql.NVarChar(255), `MQ Response for Admission ${admissionId}`)
        .input('actionFor', sql.VarChar(50), 'MQ_RESPONSE')
        .input('remarkText', sql.NVarChar(sql.MAX), remarkText)
        .input('createdBy', sql.VarChar(50), respondedBy)
        .query(`
          INSERT INTO ${DB_TABLES.REMARKS} (
            ref_type, ref_id, ref_desc, action_for, remark_text, created_by, created_at
          ) VALUES (
            @refType, @refId, @refDesc, @actionFor, @remarkText, @createdBy, GETDATE()
          )
        `);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Defer admission for additional review
   * Updates deferment_status and creates DEFERMENT remark
   */
  public async deferAdmission(
    admissionId: number,
    defermentReason: string,
    followUpDate: Date | string | undefined,
    assignedTo: string | undefined,
    deferredBy: string
  ): Promise<void> {
    const pool = await connectionManager.getPool();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // Step 1: Update deferment status
      await transaction.request()
        .input('admissionId', sql.BigInt, admissionId)
        .input('updatedBy', sql.VarChar(50), deferredBy)
        .query(`
          UPDATE ${DB_TABLES.ADMISSIONS}
          SET deferment_status = 'PENDING_DEFERMENT',
              updated_at = GETDATE(),
              updated_by = @updatedBy
          WHERE admission_id = @admissionId
        `);

      // Step 2: Create DEFERMENT remark
      let remarkText = `Case deferred. Reason: ${defermentReason}`;
      if (followUpDate) remarkText += `. Follow-up: ${new Date(followUpDate).toLocaleDateString()}`;
      if (assignedTo) remarkText += `. Assigned to: ${assignedTo}`;
      
      await transaction.request()
        .input('refType', sql.VarChar(50), 'ADMISSION')
        .input('refId', sql.BigInt, admissionId)
        .input('refDesc', sql.NVarChar(255), `Deferment for Admission ${admissionId}`)
        .input('actionFor', sql.VarChar(50), 'DEFERMENT')
        .input('remarkText', sql.NVarChar(sql.MAX), remarkText)
        .input('createdBy', sql.VarChar(50), deferredBy)
        .query(`
          INSERT INTO ${DB_TABLES.REMARKS} (
            ref_type, ref_id, ref_desc, action_for, remark_text, created_by, created_at
          ) VALUES (
            @refType, @refId, @refDesc, @actionFor, @remarkText, @createdBy, GETDATE()
          )
        `);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Resolve deferment
   * Updates deferment_status and creates DEFERMENT_RESOLVED remark
   */
  public async resolveDeferment(
    admissionId: number,
    resolutionNotes: string,
    resolvedBy: string
  ): Promise<void> {
    const pool = await connectionManager.getPool();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // Step 1: Update deferment status
      await transaction.request()
        .input('admissionId', sql.BigInt, admissionId)
        .input('updatedBy', sql.VarChar(50), resolvedBy)
        .query(`
          UPDATE ${DB_TABLES.ADMISSIONS}
          SET deferment_status = 'DEFERMENT_RESOLVED',
              updated_at = GETDATE(),
              updated_by = @updatedBy
          WHERE admission_id = @admissionId
        `);

      // Step 2: Create DEFERMENT_RESOLVED remark
      const remarkText = `Deferment resolved. Resolution: ${resolutionNotes}`;
      
      await transaction.request()
        .input('refType', sql.VarChar(50), 'ADMISSION')
        .input('refId', sql.BigInt, admissionId)
        .input('refDesc', sql.NVarChar(255), `Deferment Resolution for Admission ${admissionId}`)
        .input('actionFor', sql.VarChar(50), 'DEFERMENT_RESOLVED')
        .input('remarkText', sql.NVarChar(sql.MAX), remarkText)
        .input('createdBy', sql.VarChar(50), resolvedBy)
        .query(`
          INSERT INTO ${DB_TABLES.REMARKS} (
            ref_type, ref_id, ref_desc, action_for, remark_text, created_by, created_at
          ) VALUES (
            @refType, @refId, @refDesc, @actionFor, @remarkText, @createdBy, GETDATE()
          )
        `);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
    }
  }

  public async getGlobalMQHistory(filters: any = {}): Promise<any[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    
    // We want the LATEST MQ-related remark for each admission to determine its current status
    const query = `
      WITH LatestMQ AS (
        SELECT 
          r.remark_id,
          r.ref_id as admission_id,
          r.action_for,
          r.remark_text,
          r.created_at,
          r.created_by,
          ROW_NUMBER() OVER(PARTITION BY r.ref_id ORDER BY r.created_at DESC) as rn
        FROM ${DB_TABLES.REMARKS} r
        WHERE r.ref_type = 'ADMISSION' 
          AND (r.action_for IN ('MQ_SENT', 'MQ_GENERATED', 'MQ_CLOSED', 'MQ_RESPONSE') 
               OR r.remark_text LIKE '%[GENERATED MQ]%')
      )
      SELECT 
        lmq.remark_id,
        lmq.admission_id,
        lmq.action_for,
        lmq.remark_text,
        lmq.created_at,
        lmq.created_by,
        u.username as created_by_username,
        c.claim_ref_no,
        m.full_name as patient_name,
        h.hospital_name
      FROM LatestMQ lmq
      INNER JOIN ${DB_TABLES.ADMISSIONS} a ON lmq.admission_id = a.admission_id
      INNER JOIN ${DB_TABLES.CLAIMS} c ON a.claim_id = c.claim_id
      INNER JOIN ${DB_TABLES.MEMBERS} m ON c.member_id = m.member_id
      INNER JOIN ${DB_TABLES.HOSPITALS} h ON c.hospital_id = h.hospital_id
      LEFT JOIN ${DB_TABLES.USERS} u ON lmq.created_by = CAST(u.user_id AS VARCHAR(50))
      WHERE lmq.rn = 1
      ORDER BY lmq.created_at DESC
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  public async updateMQStatus(admissionId: number, status: string, updatedBy: string): Promise<void> {
    const pool = await connectionManager.getPool();
    const actionFor = status === 'CLOSED' ? 'MQ_CLOSED' : 'MQ_SENT';
    const remarkText = `MQ Status manually updated to: ${status} by ${updatedBy}`;

    await pool.request()
      .input('refType', sql.VarChar(50), 'ADMISSION')
      .input('refId', sql.BigInt, admissionId)
      .input('refDesc', sql.VarChar(100), `MQ Status Update`)
      .input('actionFor', sql.VarChar(50), actionFor)
      .input('remarkText', sql.NVarChar(sql.MAX), remarkText)
      .input('createdBy', sql.VarChar(50), updatedBy)
      .query(`
        INSERT INTO ${DB_TABLES.REMARKS} (
          ref_type, ref_id, ref_desc, action_for, remark_text, created_by
        )
        VALUES (@refType, @refId, @refDesc, @actionFor, @remarkText, @createdBy)
      `);
  }
}
