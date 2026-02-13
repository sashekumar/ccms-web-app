import { database } from '../../core/database/database.service';
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
        role_id,
        permissions_json,
        is_active,
        last_login
      FROM ccms_users
      WHERE username = @username
    `;

    return database.findOne<User>(query, { username });
  }

  /**
   * Update last login timestamp
   */
  public async updateLastLogin(userId: number): Promise<void> {
    const query = `
      UPDATE ccms_users
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
        role_id,
        permissions_json,
        is_active,
        last_login
      FROM ccms_users
      WHERE user_id = @userId
    `;

    return database.findOne<User>(query, { userId });
  }
}
