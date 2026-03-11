import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { User, UserListItem, UserFilters, PaginatedUsers, UserDetailResponse } from './users.types';
import { BaseRepository } from '../../core/base/base.repository';

export class UsersRepository extends BaseRepository<User> {
  constructor() {
    super(DB_TABLES.USERS, 'user_id', false);
  }
  /**
   * Get paginated list of users with filters
   */
  public async getUsers(filters: UserFilters): Promise<PaginatedUsers> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereClauses: string[] = [];

    if (filters.search) {
      whereClauses.push(`(u.username LIKE @search OR u.full_name LIKE @search)`);
      request.input('search', sql.NVarChar(200), `%${filters.search}%`);
    }

    if (filters.is_active !== undefined) {
      whereClauses.push('u.is_active = @isActive');
      request.input('isActive', sql.Bit, filters.is_active);
    }

    if (filters.role_id) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM ${DB_TABLES.USER_ROLES} ur 
        WHERE ur.user_id = u.user_id 
          AND ur.role_id = @roleId 
          AND ur.is_active = 1
          AND (ur.expires_at IS NULL OR ur.expires_at > GETDATE())
      )`);
      request.input('roleId', sql.BigInt, filters.role_id);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Sorting
    const sortBy = filters.sort_by || 'user_id';
    const sortOrder = filters.sort_order || 'DESC';
    const orderBy = `ORDER BY u.${sortBy} ${sortOrder}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${this.tableName} u
      ${whereClause}
    `;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    // Get users with roles
    const query = `
      SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.is_active,
        u.last_login,
        r.role_id,
        r.role_name,
        r.role_code
      FROM ${this.tableName} u
      LEFT JOIN ${DB_TABLES.USER_ROLES} ur ON u.user_id = ur.user_id 
        AND ur.is_active = 1 
        AND (ur.expires_at IS NULL OR ur.expires_at > GETDATE())
      LEFT JOIN ${DB_TABLES.ROLES} r ON ur.role_id = r.role_id
      ${whereClause}
      ${orderBy}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    // Group roles by user
    const usersMap = new Map<number, UserListItem>();
    
    result.recordset.forEach((row: any) => {
      if (!usersMap.has(row.user_id)) {
        usersMap.set(row.user_id, {
          user_id: row.user_id,
          username: row.username,
          full_name: row.full_name,
          is_active: row.is_active,
          last_login: row.last_login,
          roles: []
        });
      }

      const user = usersMap.get(row.user_id)!;
      if (row.role_id) {
        user.roles.push({
          role_id: row.role_id,
          role_name: row.role_name,
          role_code: row.role_code
        });
      }
    });

    const users = Array.from(usersMap.values());

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get user by ID with roles
   */
  public async getUserById(userId: number): Promise<UserDetailResponse | null> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('userId', sql.BigInt, userId);

    const query = `
      SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.is_active,
        u.last_login,
        ur.role_id,
        r.role_name,
        r.role_code,
        ur.assigned_at,
        ur.assigned_by,
        ur.expires_at
      FROM ${this.tableName} u
      LEFT JOIN ${DB_TABLES.USER_ROLES} ur ON u.user_id = ur.user_id 
        AND ur.is_active = 1
      LEFT JOIN ${DB_TABLES.ROLES} r ON ur.role_id = r.role_id
      WHERE u.user_id = @userId
    `;

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null;
    }

    const firstRow = result.recordset[0];
    const userDetail: UserDetailResponse = {
      user: {
        user_id: firstRow.user_id,
        username: firstRow.username,
        full_name: firstRow.full_name,
        is_active: firstRow.is_active,
        last_login: firstRow.last_login
      },
      roles: result.recordset
        .filter((row: any) => row.role_id)
        .map((row: any) => ({
          role_id: row.role_id,
          role_name: row.role_name,
          role_code: row.role_code,
          assigned_at: row.assigned_at,
          assigned_by: row.assigned_by,
          expires_at: row.expires_at
        }))
    };

    return userDetail;
  }

  /**
   * Check if username exists
   */
  public async usernameExists(username: string, excludeUserId?: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    let query = `
      SELECT COUNT(*) as count 
      FROM ${this.tableName} 
      WHERE username = @username
    `;

    if (excludeUserId) {
      query += ' AND user_id != @excludeUserId';
      request.input('excludeUserId', sql.BigInt, excludeUserId);
    }

    request.input('username', sql.VarChar(50), username);
    const result = await request.query(query);

    return result.recordset[0].count > 0;
  }
}
