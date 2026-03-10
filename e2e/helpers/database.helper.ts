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

    // Verify and fix permissions if needed
    await this.verifyAndFixPermissions();

    // Only seed additional test users if needed
    await this.seedAdditionalTestUsers();

    console.log('✅ Initial test data verified');
  }

  /**
   * Verify admin user has all necessary permissions, and grant if missing
   */
  private static async verifyAndFixPermissions(): Promise<void> {
    try {
      // Check if Super Admin role exists (role_id = 1)
      const roleCheck = await this.executeQuery(
        'SELECT role_id FROM ccms_acl_roles WHERE role_id = 1'
      );

      if (roleCheck.recordset.length === 0) {
        console.warn('⚠️  Super Admin role not found! Database migrations may be incomplete.');
        return;
      }

      // Check if admin user has Super Admin role assigned
      const userRoleCheck = await this.executeQuery(
        'SELECT * FROM ccms_acl_user_roles WHERE user_id = 1 AND role_id = 1'
      );

      if (userRoleCheck.recordset.length === 0) {
        console.log('🔧 Assigning Super Admin role to admin user...');
        await this.executeQuery(`
          INSERT INTO ccms_acl_user_roles (user_id, role_id, assigned_by, assigned_date, is_active)
          VALUES (1, 1, 'SYSTEM', GETDATE(), 1)
        `);
        console.log('✅ Super Admin role assigned');
      } else {
        // Ensure role is active
        const activeCheck = userRoleCheck.recordset[0];
        if (activeCheck.is_active !== 1 && activeCheck.is_active !== true) {
          await this.executeQuery(`
            UPDATE ccms_acl_user_roles 
            SET is_active = 1 
            WHERE user_id = 1 AND role_id = 1
          `);
        }
      }

      // Check and add missing audit columns if needed
      const columnCheck = await this.executeQuery(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'ccms_users'
        ORDER BY ORDINAL_POSITION
      `);
      const columns = columnCheck.recordset.map(r => r.COLUMN_NAME);

      // Add missing audit columns if they don't exist
      const requiredColumns = ['created_at', 'created_by', 'updated_at', 'updated_by'];
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log(`🔧 Adding missing audit columns to ccms_users: ${missingColumns.join(', ')}`);
        
        for (const column of missingColumns) {
          if (column === 'created_at') {
            await this.executeQuery(`
              ALTER TABLE ccms_users 
              ADD ${column} DATETIME2 NOT NULL DEFAULT GETDATE()
            `);
          } else if (column === 'updated_at') {
            await this.executeQuery(`
              ALTER TABLE ccms_users 
              ADD ${column} DATETIME2 NULL
            `);
          } else {
            // created_by, updated_by
            await this.executeQuery(`
              ALTER TABLE ccms_users 
              ADD ${column} VARCHAR(50) NULL
            `);
          }
        }
        
        console.log('✅ Audit columns added');
      }

      // Fix legacy_user_id unique constraint to handle NULL values properly
      try {
        // Check for UNIQUE constraints on legacy_user_id
        const constraintCheck = await this.executeQuery(`
          SELECT c.name as constraint_name, i.name as index_name
          FROM sys.key_constraints c
          INNER JOIN sys.indexes i ON c.parent_object_id = i.object_id AND c.unique_index_id = i.index_id
          WHERE c.parent_object_id = OBJECT_ID('ccms_users')
            AND c.type = 'UQ'
            AND EXISTS (
              SELECT 1 FROM sys.index_columns ic
              INNER JOIN sys.columns col ON ic.object_id = col.object_id AND ic.column_id = col.column_id
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id 
                AND col.name = 'legacy_user_id'
            )
        `);

        if (constraintCheck.recordset.length > 0) {
          const constraintName = constraintCheck.recordset[0].constraint_name;
          console.log(`🔧 Dropping incorrect UNIQUE constraint: ${constraintName}`);
          await this.executeQuery(`
            ALTER TABLE ccms_users 
            DROP CONSTRAINT ${constraintName}
          `);

          // Create filtered unique index
          await this.executeQuery(`
            CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_users_legacy_id 
            ON ccms_users(legacy_user_id) 
            WHERE legacy_user_id IS NOT NULL
          `);
          console.log('✅ Created proper filtered unique index on legacy_user_id');
        }
      } catch (error) {
        console.warn('⚠️  Could not fix legacy_user_id constraint:', error);
      }


      // Check if Super Admin has permissions
      const permissionCheck = await this.executeQuery(
        'SELECT COUNT(*) as count FROM ccms_acl_role_permissions WHERE role_id = 1 AND granted = 1'
      );

      const permissionCount = permissionCheck.recordset[0].count;
      
      if (permissionCount === 0) {
        console.log('🔧 Granting permissions to Super Admin role...');
        
        // Grant all permissions to Super Admin
        await this.executeQuery(`
          INSERT INTO ccms_acl_role_permissions (role_id, module_action_id, granted, created_by, created_date)
          SELECT 1, module_action_id, 1, 'SYSTEM', GETDATE()
          FROM ccms_acl_module_actions
          WHERE module_action_id NOT IN (
            SELECT module_action_id FROM ccms_acl_role_permissions WHERE role_id = 1
          )
        `);
        
        const newCount = await this.executeQuery(
          'SELECT COUNT(*) as count FROM ccms_acl_role_permissions WHERE role_id = 1 AND granted = 1'
        );
        
        console.log(`✅ Granted ${newCount.recordset[0].count} permissions to Super Admin`);
      } else {
        console.log(`✅ Super Admin has ${permissionCount} permissions`);
      }
    } catch (error) {
      console.error('Error verifying permissions:', error);
      // Don't throw - let tests continue even if permission check fails
    }
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
