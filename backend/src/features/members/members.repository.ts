import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { 
  Member, 
  MemberListItem, 
  MemberFilters, 
  PaginatedMembers, 
  CreateMemberDto, 
  UpdateMemberDto 
} from './members.types';
import { BaseRepository } from '../../core/base/base.repository';

export class MembersRepository extends BaseRepository<Member> {
  constructor() {
    super(DB_TABLES.MEMBERS, 'member_id', false);
  }
  
  /**
   * Get paginated list of members with filters
   */
  public async getMembers(filters: MemberFilters): Promise<PaginatedMembers> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereClauses: string[] = ['is_deleted = 0']; // Default: show non-deleted

    if (filters.search) {
      whereClauses.push(`(full_name LIKE @search OR ic_no LIKE @search OR fwd_member_no LIKE @search)`);
      request.input('search', sql.NVarChar(255), `%${filters.search}%`);
    }

    if (filters.member_type) {
      whereClauses.push('member_type = @memberType');
      request.input('memberType', sql.VarChar(50), filters.member_type);
    }

    if (filters.member_status) {
      whereClauses.push('member_status = @memberStatus');
      request.input('memberStatus', sql.VarChar(50), filters.member_status);
    }

    if (filters.enrollment_date_from) {
      whereClauses.push('enrollment_date >= @enrollmentFrom');
      request.input('enrollmentFrom', sql.DateTime2, filters.enrollment_date_from);
    }

    if (filters.enrollment_date_to) {
      whereClauses.push('enrollment_date <= @enrollmentTo');
      request.input('enrollmentTo', sql.DateTime2, filters.enrollment_date_to);
    }

    if (filters.is_deleted !== undefined) {
      whereClauses[0] = 'is_deleted = @isDeleted';
      request.input('isDeleted', sql.Bit, filters.is_deleted);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Sorting
    const sortBy = filters.sort_by || 'member_id';
    const sortOrder = filters.sort_order || 'DESC';
    const orderBy = `ORDER BY ${sortBy} ${sortOrder}`;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM ${DB_TABLES.MEMBERS}
      ${whereClause}
    `;

    // Stats query
    const statsQuery = `
      SELECT 
        COUNT(*) as total_members,
        SUM(CASE WHEN is_deleted = 0 THEN 1 ELSE 0 END) as active_members,
        SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) as deleted_members
      FROM ${DB_TABLES.MEMBERS}
    `;

    // Data query
    const dataQuery = `
      SELECT 
        member_id,
        full_name,
        ic_no,
        member_type,
        member_status,
        enrollment_date,
        fwd_member_no,
        client_id,
        is_deleted
      FROM ${DB_TABLES.MEMBERS}
      ${whereClause}
      ${orderBy}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const [countResult, statsResult, dataResult] = await Promise.all([
      request.query(countQuery),
      request.query(statsQuery),
      request.query(dataQuery)
    ]);

    const total = countResult.recordset[0].total;
    const totalPages = Math.ceil(total / limit);
    const stats = statsResult.recordset[0];

    return {
      data: dataResult.recordset as MemberListItem[],
      pagination: {
        total,
        page,
        limit,
        total_pages: totalPages
      },
      stats: {
        total_members: stats.total_members || 0,
        active_members: stats.active_members || 0,
        deleted_members: stats.deleted_members || 0
      }
    };
  }

  /**
   * Get member by ID
   */
  public async getMemberById(memberId: string): Promise<Member | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('memberId', sql.BigInt, memberId)
      .query(`
        SELECT 
          member_id,
          legacy_member_id,
          external_guid,
          full_name,
          ic_no,
          fwd_member_no,
          fwd_client_no,
          client_id,
          dob,
          gender,
          member_type,
          member_status,
          bank_id,
          bank_acc_no,
          enrollment_date,
          termination_date,
          created_at,
          created_by,
          updated_at,
          updated_by,
          is_deleted
        FROM ${DB_TABLES.MEMBERS}
        WHERE member_id = @memberId
      `);

    return result.recordset[0] || null;
  }

  /**
   * Check if IC number already exists (for uniqueness validation)
   */
  public async checkICExists(icNo: string, excludeMemberId?: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('icNo', sql.VarChar(20), icNo);

    let query = `
      SELECT COUNT(*) as count 
      FROM ${DB_TABLES.MEMBERS}
      WHERE ic_no = @icNo
    `;

    if (excludeMemberId) {
      query += ' AND member_id != @memberId';
      request.input('memberId', sql.BigInt, excludeMemberId);
    }

    const result = await request.query(query);
    return result.recordset[0].count > 0;
  }

  /**
   * Create new member
   */
  public async createMember(data: CreateMemberDto, createdBy?: string): Promise<string> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    // Build dynamic query based on provided fields
    const fields: string[] = ['full_name', 'ic_no'];
    const values: string[] = ['@fullName', '@icNo'];

    request.input('fullName', sql.NVarChar(255), data.full_name);
    request.input('icNo', sql.VarChar(20), data.ic_no);

    if (data.fwd_member_no) {
      fields.push('fwd_member_no');
      values.push('@fwdMemberNo');
      request.input('fwdMemberNo', sql.VarChar(50), data.fwd_member_no);
    }

    if (data.fwd_client_no) {
      fields.push('fwd_client_no');
      values.push('@fwdClientNo');
      request.input('fwdClientNo', sql.VarChar(50), data.fwd_client_no);
    }

    if (data.client_id) {
      fields.push('client_id');
      values.push('@clientId');
      request.input('clientId', sql.VarChar(50), data.client_id);
    }

    if (data.dob) {
      fields.push('dob');
      values.push('@dob');
      request.input('dob', sql.Date, data.dob);
    }

    if (data.gender !== undefined) {
      fields.push('gender');
      values.push('@gender');
      request.input('gender', sql.Bit, data.gender);
    }

    if (data.member_type) {
      fields.push('member_type');
      values.push('@memberType');
      request.input('memberType', sql.VarChar(50), data.member_type);
    }

    if (data.member_status) {
      fields.push('member_status');
      values.push('@memberStatus');
      request.input('memberStatus', sql.VarChar(50), data.member_status);
    }

    if (data.bank_id) {
      fields.push('bank_id');
      values.push('@bankId');
      request.input('bankId', sql.Int, data.bank_id);
    }

    if (data.bank_acc_no) {
      fields.push('bank_acc_no');
      values.push('@bankAccNo');
      request.input('bankAccNo', sql.VarChar(50), data.bank_acc_no);
    }

    if (data.enrollment_date) {
      fields.push('enrollment_date');
      values.push('@enrollmentDate');
      request.input('enrollmentDate', sql.DateTime2, data.enrollment_date);
    }

    if (data.termination_date) {
      fields.push('termination_date');
      values.push('@terminationDate');
      request.input('terminationDate', sql.Date, data.termination_date);
    }

    if (createdBy) {
      fields.push('created_by');
      values.push('@createdBy');
      request.input('createdBy', sql.VarChar(50), createdBy);
    }

    const query = `
      INSERT INTO ${DB_TABLES.MEMBERS} (${fields.join(', ')})
      OUTPUT INSERTED.member_id
      VALUES (${values.join(', ')})
    `;

    const result = await request.query(query);
    return result.recordset[0].member_id.toString();
  }

  /**
   * Update member
   */
  public async updateMember(memberId: string, data: UpdateMemberDto, updatedBy?: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const setClauses: string[] = [];

    request.input('memberId', sql.BigInt, memberId);

    if (data.full_name) {
      setClauses.push('full_name = @fullName');
      request.input('fullName', sql.NVarChar(255), data.full_name);
    }

    if (data.ic_no) {
      setClauses.push('ic_no = @icNo');
      request.input('icNo', sql.VarChar(20), data.ic_no);
    }

    if (data.fwd_member_no !== undefined) {
      setClauses.push('fwd_member_no = @fwdMemberNo');
      request.input('fwdMemberNo', sql.VarChar(50), data.fwd_member_no);
    }

    if (data.fwd_client_no !== undefined) {
      setClauses.push('fwd_client_no = @fwdClientNo');
      request.input('fwdClientNo', sql.VarChar(50), data.fwd_client_no);
    }

    if (data.client_id !== undefined) {
      setClauses.push('client_id = @clientId');
      request.input('clientId', sql.VarChar(50), data.client_id);
    }

    if (data.dob !== undefined) {
      setClauses.push('dob = @dob');
      request.input('dob', sql.Date, data.dob);
    }

    if (data.gender !== undefined) {
      setClauses.push('gender = @gender');
      request.input('gender', sql.Bit, data.gender);
    }

    if (data.member_type !== undefined) {
      setClauses.push('member_type = @memberType');
      request.input('memberType', sql.VarChar(50), data.member_type);
    }

    if (data.member_status !== undefined) {
      setClauses.push('member_status = @memberStatus');
      request.input('memberStatus', sql.VarChar(50), data.member_status);
    }

    if (data.bank_id !== undefined) {
      setClauses.push('bank_id = @bankId');
      request.input('bankId', sql.Int, data.bank_id);
    }

    if (data.bank_acc_no !== undefined) {
      setClauses.push('bank_acc_no = @bankAccNo');
      request.input('bankAccNo', sql.VarChar(50), data.bank_acc_no);
    }

    if (data.enrollment_date !== undefined) {
      setClauses.push('enrollment_date = @enrollmentDate');
      request.input('enrollmentDate', sql.DateTime2, data.enrollment_date);
    }

    if (data.termination_date !== undefined) {
      setClauses.push('termination_date = @terminationDate');
      request.input('terminationDate', sql.Date, data.termination_date);
    }

    if (updatedBy) {
      setClauses.push('updated_by = @updatedBy');
      request.input('updatedBy', sql.VarChar(50), updatedBy);
    }

    setClauses.push('updated_at = GETDATE()');

    if (setClauses.length === 1) { // Only updated_at
      return false; // Nothing to update
    }

    const query = `
      UPDATE ${DB_TABLES.MEMBERS}
      SET ${setClauses.join(', ')}
      WHERE member_id = @memberId
    `;

    const result = await request.query(query);
    return result.rowsAffected[0] > 0;
  }

  /**
   * Soft delete member
   */
  public async deleteMember(memberId: string, deletedBy?: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('memberId', sql.BigInt, memberId);

    if (deletedBy) {
      request.input('deletedBy', sql.VarChar(50), deletedBy);
      const result = await request.query(`
        UPDATE ${DB_TABLES.MEMBERS}
        SET is_deleted = 1, deleted_at = GETDATE(), deleted_by = @deletedBy
        WHERE member_id = @memberId
      `);
      return result.rowsAffected[0] > 0;
    } else {
      const result = await request.query(`
        UPDATE ${DB_TABLES.MEMBERS}
        SET is_deleted = 1, deleted_at = GETDATE()
        WHERE member_id = @memberId
      `);
      return result.rowsAffected[0] > 0;
    }
  }

  /**
   * Activate or deactivate member
   */
  public async setMemberDeletedStatus(memberId: string, isDeleted: boolean): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('memberId', sql.BigInt, memberId)
      .input('isDeleted', sql.Bit, isDeleted)
      .query(`
        UPDATE ${DB_TABLES.MEMBERS}
        SET is_deleted = @isDeleted,
            deleted_at = CASE WHEN @isDeleted = 1 THEN GETDATE() ELSE NULL END
        WHERE member_id = @memberId
      `);
    
    return result.rowsAffected[0] > 0;
  }
}
