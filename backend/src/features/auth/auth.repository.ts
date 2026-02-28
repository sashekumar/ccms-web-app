import { BaseRepository } from '../../core/base/base.repository';
import { database } from '../../core/database/database.service';
import { DB_TABLES } from '../../core/constants';
import { User } from './auth.types';

/**
 * Auth Repository
 * Extends BaseRepository to inherit standard CRUD operations
 * Adds authentication-specific queries
 */
export class AuthRepository extends BaseRepository<User> {
  constructor() {
    // ccms_users table with user_id as primary key, no soft delete
    super(DB_TABLES.USERS, 'user_id', false);
  }

  /**
   * Find user by username (auth-specific)
   */
  public async findByUsername(username: string): Promise<User | null> {
    const query = `
      SELECT 
        user_id,
        username,
        password_hash,
        full_name,
        is_active,
        last_login
      FROM ${this.tableName}
      WHERE username = @username
    `;

    return database.findOne<User>(query, { username });
  }

  /**
   * Update last login timestamp (auth-specific)
   */
  public async updateLastLogin(userId: number): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET last_login = GETDATE()
      WHERE user_id = @userId
    `;

    await database.executeQuery(query, { userId });
  }

  /**
   * Get user roles (auth-specific)
   */
  public async getUserRoles(userId: number): Promise<any[]> {
    const query = `
      SELECT 
        r.role_id,
        r.role_name,
        r.role_code
      FROM ${DB_TABLES.USER_ROLES} ur
      INNER JOIN ${DB_TABLES.ROLES} r ON ur.role_id = r.role_id
      WHERE ur.user_id = @userId
        AND ur.is_active = 1
        AND r.is_active = 1
        AND (ur.expires_at IS NULL OR ur.expires_at > GETDATE())
    `;

    const result = await database.executeQuery(query, { userId });
    return result.recordset || [];
  }
}
