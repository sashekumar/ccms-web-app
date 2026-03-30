import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { BaseRepository } from '../../core/base/base.repository';
import { Escalation, EscalationSource, EscalationNature, EscalationUpdate, EscalationFilters } from './entities/escalation.entity';
import { CreateEscalationDto, UpdateEscalationDto, AddEscalationUpdateDto, CloseEscalationDto } from './dto/escalation.dto';

export class EscalationRepository extends BaseRepository<Escalation> {
  constructor() {
    super(DB_TABLES.ESCALATIONS, 'esc_id', false);
  }

  /**
   * Get escalations with pagination and filters
   */
  async getEscalations(filters: EscalationFilters = {}): Promise<{
    escalations: Escalation[];
    total: number;
  }> {
    const pool = await connectionManager.getPool();
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = ['e.esc_id IS NOT NULL'];

    if (filters.status) {
      whereClauses.push('e.status = @status');
    }
    if (filters.priority) {
      whereClauses.push('e.priority = @priority');
    }
    if (filters.source_id) {
      whereClauses.push('e.source_id = @sourceId');
    }
    if (filters.assigned_to) {
      whereClauses.push('e.assigned_to = @assignedTo');
    }
    if (filters.search) {
      whereClauses.push('(c.claim_ref_no LIKE @search OR m.full_name LIKE @search)');
    }

    const whereClause = whereClauses.join(' AND ');

    // Count query
    const countResult = await pool.request()
      .input('status', sql.VarChar(50), filters.status)
      .input('priority', sql.VarChar(20), filters.priority)
      .input('sourceId', sql.BigInt, filters.source_id)
      .input('assignedTo', sql.VarChar(50), filters.assigned_to)
      .input('search', sql.NVarChar(255), filters.search ? `%${filters.search}%` : '%')
      .query(`
        SELECT COUNT(*) as total
        FROM ${DB_TABLES.ESCALATIONS} e
        INNER JOIN ${DB_TABLES.CLAIMS} c ON e.claim_id = c.claim_id
        LEFT JOIN ${DB_TABLES.MEMBERS} m ON c.member_id = m.member_id
        WHERE ${whereClause}
      `);

    const total = countResult.recordset[0]?.total || 0;

    // Data query
    const result = await pool.request()
      .input('status', sql.VarChar(50), filters.status)
      .input('priority', sql.VarChar(20), filters.priority)
      .input('sourceId', sql.BigInt, filters.source_id)
      .input('assignedTo', sql.VarChar(50), filters.assigned_to)
      .input('search', sql.NVarChar(255), filters.search ? `%${filters.search}%` : '%')
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT 
          e.esc_id, e.legacy_escalation_id, e.claim_id, e.source_id, e.nature_id,
          e.assigned_to, e.status, e.priority,
          e.created_at, e.created_by, e.closed_at, e.updated_at, e.updated_by,
          c.claim_ref_no,
          s.source_code, s.source_description,
          n.nature_code, n.nature_description,
          m.full_name as member_name,
          h.hospital_name
        FROM ${DB_TABLES.ESCALATIONS} e
        INNER JOIN ${DB_TABLES.CLAIMS} c ON e.claim_id = c.claim_id
        LEFT JOIN ccms_escalation_source s ON e.source_id = s.source_id
        LEFT JOIN ccms_escalation_nature n ON e.nature_id = n.nature_id
        LEFT JOIN ${DB_TABLES.MEMBERS} m ON c.member_id = m.member_id
        LEFT JOIN ${DB_TABLES.HOSPITALS} h ON c.hospital_id = h.hospital_id
        WHERE ${whereClause}
        ORDER BY e.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    return {
      escalations: result.recordset,
      total
    };
  }

  /**
   * Get escalation by ID
   */
  async getEscalationById(escalationId: number): Promise<Escalation | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('escalationId', sql.BigInt, escalationId)
      .query(`
        SELECT 
          e.esc_id, e.legacy_escalation_id, e.claim_id, e.source_id, e.nature_id,
          e.assigned_to, e.status, e.priority,
          e.created_at, e.created_by, e.closed_at, e.updated_at, e.updated_by,
          c.claim_ref_no,
          s.source_code, s.source_description,
          n.nature_code, n.nature_description
        FROM ${DB_TABLES.ESCALATIONS} e
        INNER JOIN ${DB_TABLES.CLAIMS} c ON e.claim_id = c.claim_id
        LEFT JOIN ccms_escalation_source s ON e.source_id = s.source_id
        LEFT JOIN ccms_escalation_nature n ON e.nature_id = n.nature_id
        WHERE e.esc_id = @escalationId
      `);

    return result.recordset[0] || null;
  }

  /**
   * Create escalation (UNASSIGNED - manual assignment by officer later)
   */
  async createEscalation(dto: CreateEscalationDto, createdBy: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('claimId', sql.BigInt, dto.claim_id)
      .input('sourceId', sql.BigInt, dto.source_id || null)
      .input('natureId', sql.BigInt, dto.nature_id || null)
      .input('priority', sql.VarChar(20), dto.priority)
      .input('status', sql.VarChar(50), 'UNASSIGNED')
      .input('createdBy', sql.VarChar(50), createdBy)
      .query(`
        INSERT INTO ${DB_TABLES.ESCALATIONS} (
          claim_id, source_id, nature_id, priority, status, created_by
        )
        OUTPUT INSERTED.esc_id
        VALUES (@claimId, @sourceId, @natureId, @priority, @status, @createdBy)
      `);

    return result.recordset[0].esc_id;
  }

  /**
   * Update escalation (assign, change priority, update status)
   */
  async updateEscalation(escalationId: number, dto: UpdateEscalationDto, updatedBy: string): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (dto.assigned_to !== undefined) {
      updates.push('assigned_to = @assignedTo');
      request.input('assignedTo', sql.VarChar(50), dto.assigned_to || null);
      if (dto.assigned_to) {
        updates.push('status = @status');
        request.input('status', sql.VarChar(50), 'ASSIGNED');
      }
    }

    if (dto.priority !== undefined) {
      updates.push('priority = @priority');
      request.input('priority', sql.VarChar(20), dto.priority);
    }

    if (dto.status !== undefined) {
      updates.push('status = @status');
      request.input('status', sql.VarChar(50), dto.status);
    }

    if (updates.length === 0) return;

    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');

    request.input('escalationId', sql.BigInt, escalationId);
    request.input('updatedBy', sql.VarChar(50), updatedBy);

    await request.query(`
      UPDATE ${DB_TABLES.ESCALATIONS}
      SET ${updates.join(', ')}
      WHERE esc_id = @escalationId
    `);
  }

  /**
   * Add escalation update/remark
   */
  async addEscalationUpdate(escalationId: number, dto: AddEscalationUpdateDto, createdBy: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('escalationId', sql.BigInt, escalationId)
      .input('updateDescription', sql.NVarChar(sql.MAX), dto.update_description)
      .input('remarks', sql.NVarChar(sql.MAX), dto.remarks || null)
      .input('createdBy', sql.VarChar(50), createdBy)
      .query(`
        INSERT INTO ccms_escalation_updates (
          esc_id, update_description, remarks, created_by
        )
        OUTPUT INSERTED.update_id
        VALUES (@escalationId, @updateDescription, @remarks, @createdBy)
      `);

    return result.recordset[0].update_id;
  }

  /**
   * Close escalation
   */
  async closeEscalation(escalationId: number, dto: CloseEscalationDto, closedBy: string): Promise<void> {
    const pool = await connectionManager.getPool();

    // Add closing update if remarks provided
    if (dto.remarks) {
      await this.addEscalationUpdate(escalationId, {
        update_description: 'Escalation closed',
        remarks: dto.remarks
      }, closedBy);
    }

    // Close escalation
    await pool.request()
      .input('escalationId', sql.BigInt, escalationId)
      .input('closedBy', sql.VarChar(50), closedBy)
      .query(`
        UPDATE ${DB_TABLES.ESCALATIONS}
        SET status = 'CLOSED', closed_at = GETDATE(), updated_by = @closedBy, updated_at = GETDATE()
        WHERE esc_id = @escalationId
      `);
  }

  /**
   * Get escalation updates for an escalation
   */
  async getEscalationUpdates(escalationId: number): Promise<EscalationUpdate[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('escalationId', sql.BigInt, escalationId)
      .query(`
        SELECT 
          update_id, esc_id, update_description, updated_by, updated_at, remarks, created_at, created_by
        FROM ccms_escalation_updates
        WHERE esc_id = @escalationId
        ORDER BY created_at DESC
      `);

    return result.recordset;
  }

  /**
   * Get escalation sources lookup
   */
  async getEscalationSources(): Promise<EscalationSource[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .query(`
        SELECT source_id, source_code, source_description, is_active
        FROM ccms_escalation_source
        WHERE is_active = 1
        ORDER BY source_code
      `);

    return result.recordset;
  }

  /**
   * Get escalation natures/types lookup
   */
  async getEscalationNatures(): Promise<EscalationNature[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .query(`
        SELECT nature_id, nature_code, nature_description, is_active
        FROM ccms_escalation_nature
        WHERE is_active = 1
        ORDER BY nature_code
      `);

    return result.recordset;
  }

  /**
   * Check if escalation already exists for claim+source combination
   */
  async checkExistingEscalation(claimId: number, sourceId: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('claimId', sql.BigInt, claimId)
      .input('sourceId', sql.BigInt, sourceId)
      .query(`
        SELECT 1
        FROM ${DB_TABLES.ESCALATIONS}
        WHERE claim_id = @claimId AND source_id = @sourceId AND status != 'CLOSED'
      `);

    return result.recordset.length > 0;
  }
}
