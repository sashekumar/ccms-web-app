import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { BaseRepository } from '../../core/base/base.repository';
import { InvestigationEntity, InvestigationRequestEntity, InvestigationCallLogEntity } from './investigation.entity';
import { InvestigationFilters } from './dto/investigation.dto';

/**
 * Investigation Repository
 * Handles all database operations for investigation cases, requests, and call logs
 * Extends BaseRepository for common CRUD operations
 * 
 * Features:
 * - Get investigations with filters and pagination
 * - Get investigation by ID with related requests and call logs
 * - Create investigation case
 * - Update investigation status and findings
 * - Manage investigation requests (create, update, get)
 * - Manage call logs (create, get)
 * - Get investigation statistics
 */
export class InvestigationRepository extends BaseRepository<InvestigationEntity> {
  protected readonly requestTableName = 'ccms_investigation_request';
  protected readonly requestHistoryTableName = 'ccms_investigation_request_history';
  protected readonly callLogTableName = 'ccms_investigation_call_log';

  constructor() {
    super('ccms_investigations', 'ix_id', false);
  }

  /**
   * Get investigations with filters and pagination
   */
  async getInvestigations(filters: InvestigationFilters): Promise<{ investigations: any[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereClauses: string[] = [];

    if (filters.status) {
      whereClauses.push('ix.ix_status = @status');
      request.input('status', sql.VarChar(50), filters.status);
    }

    if (filters.claimId) {
      whereClauses.push('ix.claim_id = @claimId');
      request.input('claimId', sql.BigInt, filters.claimId);
    }

    if (filters.clinicId) {
      whereClauses.push('ix.clinic_id = @clinicId');
      request.input('clinicId', sql.BigInt, filters.clinicId);
    }

    if (filters.searchTerm) {
      whereClauses.push('(c.claim_ref_no LIKE @search OR h.hospital_name LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${filters.searchTerm}%`);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${this.tableName} ix
      LEFT JOIN ccms_claims c ON ix.claim_id = c.claim_id
      LEFT JOIN ccms_hospitals h ON c.hospital_id = h.hospital_id
      ${whereClause}
    `;

    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0]?.total || 0;

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    const orderBy = `ORDER BY ix.${sortBy} ${sortOrder}`;

    // Get investigations with pagination
    const query = `
      SELECT 
        ix.ix_id,
        ix.claim_id,
        c.claim_ref_no,
        c.hospital_id as clinic_id,
        h.hospital_name as clinic_name,
        ix.ix_status as status,
        ix.findings,
        ix.is_pec_found,
        ix.request_payment_amt,
        ix.created_at,
        ix.created_by,
        ix.updated_at,
        ix.updated_by,
        DATEDIFF(DAY, ix.created_at, GETDATE()) as days_since_creation,
        (SELECT COUNT(*) FROM ${this.requestTableName} ir WHERE ir.ix_id = ix.ix_id AND ir.status = 'PENDING') as pending_requests_count,
        (SELECT COUNT(*) FROM ${this.callLogTableName} cl WHERE cl.ix_id = ix.ix_id) as call_logs_count
      FROM ${this.tableName} ix
      LEFT JOIN ccms_claims c ON ix.claim_id = c.claim_id
      LEFT JOIN ccms_hospitals h ON c.hospital_id = h.hospital_id
      ${whereClause}
      ${orderBy}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    return { investigations: result.recordset, total };
  }

  /**
   * Get investigation by ID with related data
   */
  async getInvestigationById(ixId: number): Promise<any> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT 
        ix.ix_id,
        ix.claim_id,
        c.claim_ref_no,
        c.hospital_id as clinic_id,
        h.hospital_name as clinic_name,
        ix.ix_status as status,
        ix.findings,
        ix.is_pec_found,
        ix.request_payment_amt,
        ix.created_at,
        ix.created_by,
        ix.updated_at,
        ix.updated_by,
        DATEDIFF(DAY, ix.created_at, GETDATE()) as days_since_creation
      FROM ${this.tableName} ix
      LEFT JOIN ccms_claims c ON ix.claim_id = c.claim_id
      LEFT JOIN ccms_hospitals h ON c.hospital_id = h.hospital_id
      WHERE ix.ix_id = @ixId
    `;

    request.input('ixId', sql.BigInt, ixId);

    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  /**
   * Create investigation case
   */
  async createInvestigation(investigation: any, userId: number): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      INSERT INTO ${this.tableName} 
      (claim_id, ix_status, created_at, created_by)
      VALUES (@claimId, @status, GETDATE(), @createdBy);
      SELECT CAST(SCOPE_IDENTITY() as int) as ixId;
    `;

    request.input('claimId', sql.BigInt, investigation.claim_id);
    request.input('status', sql.VarChar(50), 'OPEN');
    request.input('createdBy', sql.VarChar(50), String(userId));

    const result = await request.query(query);
    return result.recordset[0]?.ixId;
  }

  /**
   * Update investigation status and findings
   */
  async updateInvestigation(ixId: number, updates: any, userId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    // Map frontend field names to actual schema column names
    const allowedFields: { [key: string]: string } = {
      'status': 'ix_status',
      'findings': 'findings',
      'is_pec_found': 'is_pec_found',
      'request_payment_amt': 'request_payment_amt'
    };

    const setClauses: string[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields[key]) {
        const columnName = allowedFields[key];
        const paramName = this.camelToAtParam(key);
        setClauses.push(`${columnName} = @${paramName}`);
        request.input(paramName, sql.Variant, value);
      }
    }

    if (setClauses.length === 0) return;

    setClauses.push('updated_at = GETDATE()');
    setClauses.push('updated_by = @updatedBy');
    request.input('updatedBy', sql.VarChar(50), String(userId));
    request.input('ixId', sql.BigInt, ixId);

    const query = `UPDATE ${this.tableName} SET ${setClauses.join(', ')} WHERE ix_id = @ixId`;
    await request.query(query);
  }

  /**
   * Get investigation requests
   */
  async getInvestigationRequests(ixId: number): Promise<InvestigationRequestEntity[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT 
        ir.request_id,
        ir.ix_id,
        ir.request_type,
        ir.requested_from,
        ir.request_date,
        ir.expected_date,
        ir.received_date,
        ir.status,
        ir.description,
        ir.remarks
      FROM ${this.requestTableName} ir
      WHERE ir.ix_id = @ixId
      ORDER BY ir.request_date DESC
    `;

    request.input('ixId', sql.BigInt, ixId);
    const result = await request.query(query);

    return result.recordset;
  }

  /**
   * Create investigation request
   */
  async createInvestigationRequest(req: any, userId: number): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      INSERT INTO ${this.requestTableName}
      (ix_id, request_type, requested_from, request_date, expected_date, status, description)
      VALUES (@ixId, @requestType, @requestedFrom, GETDATE(), @expectedDate, @status, @description);
      SELECT CAST(SCOPE_IDENTITY() as int) as requestId;
    `;

    request.input('ixId', sql.BigInt, req.ix_id);
    request.input('requestType', sql.VarChar(50), req.request_type);
    request.input('requestedFrom', sql.NVarChar(255), req.requested_from);
    request.input('expectedDate', sql.DateTime2, req.expected_date || null);
    request.input('status', sql.VarChar(50), 'PENDING');
    request.input('description', sql.NVarChar(1000), req.description || null);

    const result = await request.query(query);
    return result.recordset[0]?.requestId;
  }

  /**
   * Update investigation request status
   */
  async updateInvestigationRequest(requestId: number, updates: any, userId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    // Record status change in history
    if (updates.status) {
      const getCurrentStatus = `SELECT status FROM ${this.requestTableName} WHERE request_id = @requestId`;
      const currentStatus = await request.query(getCurrentStatus);
      
      if (currentStatus.recordset[0]?.status !== updates.status) {
        const historyQuery = `
          INSERT INTO ${this.requestHistoryTableName}
          (request_id, status_change, changed_by, changed_at)
          VALUES (@requestId, @statusChange, @changedBy, GETDATE())
        `;
        request.input('statusChange', sql.NVarChar(255), 
          `${currentStatus.recordset[0]?.status || 'PENDING'} → ${updates.status}`);
        request.input('changedBy', sql.BigInt, userId);
        await request.query(historyQuery);
      }
    }

    // Update request
    const setClauses: string[] = [];

    if (updates.status) {
      setClauses.push('status = @status');
      request.input('status', sql.VarChar(50), updates.status);
    }

    if (updates.remarks !== undefined) {
      setClauses.push('remarks = @remarks');
      request.input('remarks', sql.NVarChar(1000), updates.remarks);
    }

    if (updates.received_date) {
      setClauses.push('received_date = @receivedDate');
      request.input('receivedDate', sql.DateTime2, updates.received_date);
    }

    if (setClauses.length === 0) return;

    request.input('requestId', sql.BigInt, requestId);
    const query = `UPDATE ${this.requestTableName} SET ${setClauses.join(', ')} WHERE request_id = @requestId`;
    await request.query(query);
  }

  /**
   * Get investigation call logs
   */
  async getInvestigationCallLogs(ixId: number): Promise<InvestigationCallLogEntity[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT 
        cl.call_id,
        cl.ix_id,
        cl.call_date,
        cl.called_party,
        cl.call_duration,
        cl.call_notes,
        u.user_name as called_by
      FROM ${this.callLogTableName} cl
      LEFT JOIN ccms_users u ON cl.called_by = u.user_id
      WHERE cl.ix_id = @ixId
      ORDER BY cl.call_date DESC
    `;

    request.input('ixId', sql.BigInt, ixId);
    const result = await request.query(query);

    return result.recordset;
  }

  /**
   * Create call log entry
   */
  async createCallLog(callLog: any, userId: number): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      INSERT INTO ${this.callLogTableName}
      (ix_id, call_date, called_party, call_duration, call_notes, called_by)
      VALUES (@ixId, @callDate, @calledParty, @callDuration, @callNotes, @calledBy);
      SELECT CAST(SCOPE_IDENTITY() as int) as callId;
    `;

    request.input('ixId', sql.BigInt, callLog.ix_id);
    request.input('callDate', sql.DateTime2, callLog.call_date || new Date());
    request.input('calledParty', sql.NVarChar(255), callLog.called_party);
    request.input('callDuration', sql.Int, callLog.call_duration);
    request.input('callNotes', sql.NVarChar(1000), callLog.call_notes);
    request.input('calledBy', sql.BigInt, userId);

    const result = await request.query(query);
    return result.recordset[0]?.callId;
  }

  /**
   * Check if investigation exists for claim
   */
  async checkExistingInvestigation(claimId: number): Promise<any> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT ix_id, ix_status as status
      FROM ${this.tableName} 
      WHERE claim_id = @claimId AND ix_status != 'CLOSED'
    `;

    request.input('claimId', sql.BigInt, claimId);
    const result = await request.query(query);

    return result.recordset[0] || null;
  }

  /**
   * Get investigation statistics
   */
  async getInvestigationStats(): Promise<any> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ix_status = 'OPEN' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN ix_status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN ix_status = 'UNDER_REVIEW' THEN 1 ELSE 0 END) as under_review_count,
        SUM(CASE WHEN ix_status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count
      FROM ${this.tableName}
      WHERE ix_status != 'CLOSED'
    `;

    const result = await request.query(query);
    return result.recordset[0] || {};
  }

  /**
   * Helper: Convert snake_case to camelCase for parameter names
   */
  private camelToAtParam(str: string): string {
    return str.replace(/_./g, (x) => x[1].toUpperCase());
  }
}
