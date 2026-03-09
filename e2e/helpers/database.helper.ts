import sql from 'mssql';
import { User, Role } from '../types';

/**
 * Database Helper - Manages test database operations
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Used across all test suites for DB operations
 * - COMMONIZATION: Centralized database logic
 * - DRY: No duplicate database code in tests
 * 
 * Responsibilities:
 * - Initialize database connection
 * - Seed test data
 * - Clean up test data
 * - Execute queries for test setup
 */

export class DatabaseHelper {
  private static pool: sql.ConnectionPool | null = null;
  
  // Test database configuration
  private static readonly config: sql.config = {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'db_ccms',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Password123',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  /**
   * Initialize database connection pool
   */
  static async initialize(): Promise<void> {
    if (!this.pool) {
      this.pool = await sql.connect(this.config);
    }
  }

  /**
   * Close database connection pool
   */
  static async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }

  /**
   * Execute SQL query
   * @param query - SQL query string
   * @param params - Query parameters
   */
  static async executeQuery<T = any>(
    query: string,
    params?: Record<string, any>
  ): Promise<sql.IResult<T>> {
    if (!this.pool) {
      await this.initialize();
    }

    const request = this.pool!.request();

    // Add parameters if provided
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    return await request.query<T>(query);
  }

  /**
   * Seed initial test data (users, roles, permissions)
   * Note: Admin user already exists from migration script
   */
  static async seedInitialData(): Promise<void> {
    // Admin user already exists from users-seed-data.sql migration
    // username: admin, password: Password123!, user_id: 1
    console.log('ℹ️  Using existing admin user from migration (username: admin)');

    // Only seed additional test users if needed
    await this.seedAdditionalTestUsers();

    console.log('✅ Initial test data verified');
  }

  /**
   * Seed additional test users (if needed for specific tests)
   * Admin user already exists from migration: username='admin', password='Password123!'
   */
  private static async seedAdditionalTestUsers(): Promise<void> {
    // Verify admin user exists
    const adminExists = await this.executeQuery(
      'SELECT user_id FROM ccms_users WHERE username = @username',
      { username: 'admin' }
    );

    if (adminExists.recordset.length === 0) {
      console.warn('⚠️  Admin user not found! Please run users-seed-data.sql migration first.');
      return;
    }

    console.log('✅ Admin user verified (user_id: ' + adminExists.recordset[0].user_id + ')');

    // Additional test users can be added here if needed
    // For now, we'll use the existing admin user for all tests
  }





  /**
   * Clean up test data created during tests
   * Note: Preserves admin user and roles from migration
   */
  static async cleanupAllTestData(): Promise<void> {
    // Only clean up test data, preserve admin user (user_id = 1)
    // Delete test users created during tests (not the admin user)
    await this.executeQuery(`
      DELETE FROM ccms_acl_user_roles 
      WHERE user_id > 1 AND user_id IN (
        SELECT user_id FROM ccms_users WHERE username LIKE 'test%' OR username LIKE '%_test'
      )
    `);
    
    await this.executeQuery(`
      DELETE FROM ccms_users 
      WHERE user_id > 1 AND (username LIKE 'test%' OR username LIKE '%_test')
    `);
    
    // Don't delete roles - they're part of the schema
    console.log('✅ Test data cleaned (preserved admin user and core data)');
  }

  /**
   * Clean up specific test data
   * @param table - Table name
   * @param condition - WHERE condition
   * @param params - Condition parameters
   */
  static async cleanupTestData(
    table: string,
    condition: string,
    params?: Record<string, any>
  ): Promise<void> {
    await this.executeQuery(`DELETE FROM ${table} WHERE ${condition}`, params);
  }

  /**
   * Get user by username
   * @param username - Username
   */
  static async getUserByUsername(username: string): Promise<User | null> {
    const result = await this.executeQuery(
      'SELECT * FROM ccms_users WHERE username = @username',
      { username }
    );
    return result.recordset[0] || null;
  }

  /**
   * Get role by code
   * @param code - Role code
   */
  static async getRoleByCode(code: string): Promise<Role | null> {
    const result = await this.executeQuery(
      'SELECT * FROM ccms_roles WHERE role_code = @code',
      { code }
    );
    return result.recordset[0] || null;
  }

  /**
   * Create test user
   * @param userData - User data
   */
  static async createTestUser(userData: {
    username: string;
    password_hash: string;
    full_name: string;
  }): Promise<number> {
    const result = await this.executeQuery(`
      INSERT INTO ccms_users 
      (username, password_hash, full_name, is_active, last_login)
      OUTPUT INSERTED.user_id
      VALUES 
      (@username, @password_hash, @full_name, 1, NULL)
    `, userData);

    return result.recordset[0]?.user_id;
  }

  /**
   * Delete test user
   * @param username - Username
   */
  static async deleteTestUser(username: string): Promise<void> {
    await this.executeQuery('DELETE FROM ccms_users WHERE username = @username AND user_id > 1', { username });
  }

  /**
   * Truncate table (use with caution!)
   * @param table - Table name
   */
  static async truncateTable(table: string): Promise<void> {
    await this.executeQuery(`TRUNCATE TABLE ${table}`);
  }

  /**
   * Get table row count
   * @param table - Table name
   * @param condition - Optional WHERE condition
   * @param params - Condition parameters
   */
  static async getRowCount(
    table: string,
    condition?: string,
    params?: Record<string, any>
  ): Promise<number> {
    const query = condition 
      ? `SELECT COUNT(*) as count FROM ${table} WHERE ${condition}`
      : `SELECT COUNT(*) as count FROM ${table}`;
    
    const result = await this.executeQuery(query, params);
    return result.recordset[0]?.count || 0;
  }
}
