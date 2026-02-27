import { database } from '../../core/database/database.service';
import { DB_TABLES } from '../../core/constants';
import { User } from './auth.types';

export class AuthRepository {
  /**
   * Find user by username
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
      FROM ${DB_TABLES.USERS}
      WHERE username = @username
    `;

    return database.findOne<User>(query, { username });
  }

  /**
   * Update last login timestamp
   */
  public async updateLastLogin(userId: number): Promise<void> {
    const query = `
      UPDATE ${DB_TABLES.USERS}
      SET last_login = GETDATE()
      WHERE user_id = @userId
    `;

    await database.executeQuery(query, { userId });
  }

  /**
   * Find user by ID
   */
  public async findById(userId: number): Promise<User | null> {
    const query = `
      SELECT 
        user_id,
        username,
        password_hash,
        full_name,
        is_active,
        last_login
      FROM ${DB_TABLES.USERS}
      WHERE user_id = @userId
    `;

    return database.findOne<User>(query, { userId });
  }

  /**
   * Get user roles
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
