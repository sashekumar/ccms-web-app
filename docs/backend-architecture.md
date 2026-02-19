# Backend Architecture - Node.js/Express API

## Overview
A scalable, maintainable, and secure backend API using MVC architecture with strict layer isolation. The architecture emphasizes reusability, database abstraction for future technology switching, and protection against SQL injection through centralized query generation.

## Technology Stack
- **Runtime**: Node.js (LTS version - v20.x)
- **Framework**: Express.js
- **Language**: TypeScript (Strict mode)
- **Database**: MS SQL Server (with abstraction layer for future flexibility)
- **Authentication**: JWT (JSON Web Tokens) with httpOnly cookies
- **CSRF Protection**: Token-based CSRF validation for login
- **Password Hashing**: bcrypt with 12 salt rounds
- **Validation**: Joi
- **Testing**: Jest
- **API Documentation**: Swagger/OpenAPI
- **Caching/Sessions**: In-memory where appropriate

## Key Features
- ✅ **MVC Architecture**: Clear separation of concerns
- ✅ **Layer Isolation**: Controllers → Services → Repositories → Database
- ✅ **Database Abstraction**: Easy switch between SQL Server, PostgreSQL, MySQL
- ✅ **SQL Injection Protection**: Centralized parameterized query builder
- ✅ **Connection Pooling**: Optimized database connections
- ✅ **Transaction Management**: ACID compliance with rollback support
- ✅ **Centralized Error Handling**: Consistent error responses
- ✅ **Security First**: Input validation, authentication, authorization
- ✅ **API Versioning**: Support for multiple API versions

## 🎯 Commonization & Reusability Strategy

**CRITICAL PRINCIPLE**: All database operations, connections, and queries MUST be centralized for:
- **Database technology independence** - Switch from SQL Server to PostgreSQL in one place
- **SQL injection prevention** - All queries parameterized through query builder
- **Connection management** - Single connection pool configuration
- **Transaction control** - Consistent transaction handling across app
- **Query optimization** - Monitor and optimize queries centrally

### Commonized Database Layer Components

#### ✅ Database Connection Manager (Singleton)
- **ConnectionManager**: Single connection pool instance
- **Transaction Manager**: Consistent transaction handling
- **Query Builder**: Parameterized query generation

#### ✅ Base Repository Pattern
- **BaseRepository<T>**: Generic CRUD operations
- Prevents duplicate database logic
- All repositories extend base for consistency

#### ✅ Database Abstraction Layer
- **Database Interface**: Technology-agnostic interface
- **SQL Server Implementation**: Current implementation
- **Easy Migration**: Switch to PostgreSQL/MySQL by changing implementation

#### ✅ Query Generator
- **QueryBuilder**: Safe query construction
- **Parameter binding**: Automatic SQL injection prevention
- **Dynamic filters**: Build complex WHERE clauses safely

#### ✅ Constants Management
- **Database Constants**: Centralized table, view, procedure names
- **Route Constants**: API endpoint paths
- **Single source of truth**: Change once, update everywhere
- **Typo prevention**: TypeScript catches errors at compile time

**Structure**:
```
core/
  ├── constants/
      ├── database.constants.ts      # DB tables, views, procedures
      ├── routes.constants.ts        # API routes
      └── index.ts                   # Barrel export
```

**Example**:
```typescript
// database.constants.ts
export const DB_TABLES = {
  USERS: 'ccms_users',
  ROLES: 'ccms_roles',
  PERMISSIONS: 'ccms_role_permissions'
} as const;

// Usage in repository
import { DB_TABLES } from '../../core/constants';

class UserRepository {
  async findAll() {
    return this.execute(`SELECT * FROM ${DB_TABLES.USERS}`);
  }
}
```

**Benefits**:
- ✅ No typos in SQL queries
- ✅ Easy database object refactoring
- ✅ Self-documenting code
- ✅ TypeScript autocomplete support

**For detailed documentation**, see [coding-standards.md - Constants Management Pattern](./coding-standards.md).

---

## Project Structure

```
backend/
├── src/
│   ├── config/                          # Configuration
│   │   ├── database.config.ts          # DB connection config
│   │   ├── app.config.ts               # App settings
│   │   ├── jwt.config.ts               # JWT configuration
│   │   └── environment.ts              # Environment variables
│   │
│   ├── core/                            # Core/Shared functionality
│   │   ├── database/                   # Database layer (CRITICAL)
│   │   │   ├── connection-manager.ts   # Connection pool manager
│   │   │   ├── transaction-manager.ts  # Transaction handling
│   │   │   ├── query-builder.ts        # SQL query builder
│   │   │   ├── database.interface.ts   # DB abstraction interface
│   │   │   └── implementations/
│   │   │       ├── mssql.implementation.ts  # SQL Server implementation
│   │   │       ├── postgres.implementation.ts (Future)
│   │   │       └── mysql.implementation.ts (Future)
│   │   │
│   │   ├── base/                       # Base classes
│   │   │   ├── base.repository.ts      # Generic repository
│   │   │   ├── base.controller.ts      # Generic controller
│   │   │   └── base.service.ts         # Generic service
│   │   │
│   │   ├── middleware/                 # Global middleware
│   │   │   ├── auth.middleware.ts      # JWT authentication
│   │   │   ├── error.middleware.ts     # Error handling
│   │   │   ├── logger.middleware.ts    # Request logging
│   │   │   ├── validator.middleware.ts # Input validation
│   │   │   └── rate-limit.middleware.ts # Rate limiting
│   │   │
│   │   └── utils/                      # Core utilities
│   │       ├── logger.util.ts          # Logging utility
│   │       ├── response.util.ts        # Response formatter
│   │       ├── crypto.util.ts          # Encryption/Hashing
│   │       ├── date.util.ts            # Date utilities
│   │       └── error.util.ts           # Error utilities
│   │
│   ├── common/                          # Shared business logic
│   │   ├── validators/                 # Reusable validators
│   │   │   ├── common.validators.ts    # Common validation schemas
│   │   │   ├── pagination.validator.ts
│   │   │   └── id.validator.ts
│   │   │
│   │   ├── middleware/                 # Common middleware
│   │   │   ├── validate-id.middleware.ts
│   │   │   ├── pagination.middleware.ts
│   │   │   └── role-check.middleware.ts
│   │   │
│   │   ├── types/                      # Common types
│   │   │   ├── pagination.types.ts
│   │   │   ├── query.types.ts
│   │   │   └── response.types.ts
│   │   │
│   │   └── errors/                     # Custom errors
│   │       ├── app.error.ts
│   │       ├── validation.error.ts
│   │       ├── database.error.ts
│   │       └── not-found.error.ts
│   │
│   ├── features/                        # Feature modules (MVC per feature)
│   │   ├── auth/                       # Authentication feature
│   │   │   ├── auth.controller.ts      # HTTP handlers
│   │   │   ├── auth.service.ts         # Business logic
│   │   │   ├── auth.repository.ts      # Data access
│   │   │   ├── auth.routes.ts          # Route definitions
│   │   │   ├── auth.validator.ts       # Input validation
│   │   │   ├── auth.types.ts           # Type definitions
│   │   │   └── auth.middleware.ts      # Feature-specific middleware
│   │   │
│   │   ├── users/                      # Users feature
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── users.validator.ts
│   │   │   └── users.types.ts
│   │   │
│   │   ├── claims/                     # Claims feature
│   │   │   ├── claims.controller.ts
│   │   │   ├── claims.service.ts
│   │   │   ├── claims.repository.ts
│   │   │   ├── claims.routes.ts
│   │   │   ├── claims.validator.ts
│   │   │   └── claims.types.ts
│   │   │
│   │   └── [other-features]/
│   │
│   ├── routes/                          # Route aggregation
│   │   └── index.ts                    # Combine all routes
│   │
│   ├── app.ts                          # Express app setup
│   └── server.ts                       # Server entry point
│
├── tests/                               # Tests
│   ├── unit/                           # Unit tests
│   ├── integration/                    # Integration tests
│   └── fixtures/                       # Test data
│
├── migrations/                          # Database migrations
│   └── sql/
│
├── .env.example                        # Environment template
├── package.json
├── tsconfig.json
└── jest.config.js
```

---

## 🗄️ DATABASE LAYER - Core Architecture

### 1. Connection Manager (Singleton - CRITICAL)

**Purpose**: Centralized database connection pool management for entire application.

```typescript
// core/database/connection-manager.ts
import * as mssql from 'mssql';
import { databaseConfig } from '@/config/database.config';
import { Logger } from '@/core/utils/logger.util';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private pool: mssql.ConnectionPool | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  /**
   * Initialize connection pool
   */
  public async connect(): Promise<void> {
    if (this.isConnected && this.pool) {
      Logger.info('Database already connected');
      return;
    }

    try {
      const config: mssql.config = {
        user: databaseConfig.user,
        password: databaseConfig.password,
        server: databaseConfig.server,
        database: databaseConfig.database,
        port: databaseConfig.port,
        options: {
          encrypt: databaseConfig.encrypt,
          trustServerCertificate: databaseConfig.trustServerCertificate,
          enableArithAbort: true,
          requestTimeout: 30000
        },
        pool: {
          max: 10,           // Maximum connections
          min: 2,            // Minimum connections
          idleTimeoutMillis: 30000
        }
      };

      this.pool = await new mssql.ConnectionPool(config).connect();
      this.isConnected = true;

      Logger.info('Database connection pool established');

      // Handle pool errors
      this.pool.on('error', (err) => {
        Logger.error('Database pool error:', err);
        this.isConnected = false;
      });

    } catch (error) {
      Logger.error('Failed to connect to database:', error);
      throw new Error('Database connection failed');
    }
  }

  /**
   * Get connection pool
   */
  public getPool(): mssql.ConnectionPool {
    if (!this.pool || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool;
  }

  /**
   * Close connection pool
   */
  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      this.isConnected = false;
      Logger.info('Database connection pool closed');
    }
  }

  /**
   * Check if connected
   */
  public isConnectionActive(): boolean {
    return this.isConnected;
  }

  /**
   * Test connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const pool = this.getPool();
      await pool.request().query('SELECT 1');
      return true;
    } catch (error) {
      Logger.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const connectionManager = ConnectionManager.getInstance();
```

### 2. Transaction Manager (CRITICAL)

**Purpose**: Consistent transaction handling with automatic rollback on errors.

```typescript
// core/database/transaction-manager.ts
import * as mssql from 'mssql';
import { connectionManager } from './connection-manager';
import { Logger } from '@/core/utils/logger.util';

export class TransactionManager {
  
  /**
   * Execute operations within a transaction
   * Automatically commits on success, rolls back on error
   */
  public static async execute<T>(
    callback: (transaction: mssql.Transaction) => Promise<T>
  ): Promise<T> {
    const pool = connectionManager.getPool();
    const transaction = new mssql.Transaction(pool);

    try {
      // Begin transaction
      await transaction.begin(mssql.ISOLATION_LEVEL.READ_COMMITTED);
      Logger.debug('Transaction started');

      // Execute callback with transaction
      const result = await callback(transaction);

      // Commit transaction
      await transaction.commit();
      Logger.debug('Transaction committed');

      return result;

    } catch (error) {
      // Rollback on error
      try {
        await transaction.rollback();
        Logger.debug('Transaction rolled back');
      } catch (rollbackError) {
        Logger.error('Transaction rollback failed:', rollbackError);
      }

      Logger.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Execute multiple operations in transaction
   */
  public static async executeMultiple<T>(
    operations: ((transaction: mssql.Transaction) => Promise<any>)[]
  ): Promise<T[]> {
    return this.execute(async (transaction) => {
      const results: T[] = [];
      
      for (const operation of operations) {
        const result = await operation(transaction);
        results.push(result);
      }
      
      return results;
    });
  }
}

// Usage Example:
/*
await TransactionManager.execute(async (transaction) => {
  const request = new mssql.Request(transaction);
  
  await request.query('INSERT INTO users ...');
  await request.query('INSERT INTO audit_log ...');
  
  // If any query fails, entire transaction rolls back
});
*/
```

### 3. Query Builder (SQL Injection Prevention - CRITICAL)

**Purpose**: Generate safe, parameterized SQL queries. All queries MUST go through this builder.

```typescript
// core/database/query-builder.ts
import * as mssql from 'mssql';

export interface WhereCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL';
  value?: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface OrderBy {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class QueryBuilder {
  private tableName: string;
  private selectFields: string[] = ['*'];
  private whereConditions: WhereCondition[] = [];
  private orderByClause: OrderBy[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private paramCounter: number = 0;
  private parameters: Record<string, any> = {};

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Select specific fields
   */
  public select(...fields: string[]): this {
    this.selectFields = fields;
    return this;
  }

  /**
   * Add WHERE condition
   */
  public where(field: string, operator: WhereCondition['operator'], value?: any, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    this.whereConditions.push({ field, operator, value, logicalOperator });
    return this;
  }

  /**
   * Add multiple WHERE conditions
   */
  public whereMultiple(conditions: Omit<WhereCondition, 'logicalOperator'>[], logicalOperator: 'AND' | 'OR' = 'AND'): this {
    conditions.forEach((condition, index) => {
      this.where(
        condition.field,
        condition.operator,
        condition.value,
        index === 0 ? 'AND' : logicalOperator
      );
    });
    return this;
  }

  /**
   * Add ORDER BY
   */
  public orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByClause.push({ field, direction });
    return this;
  }

  /**
   * Add pagination
   */
  public paginate(page: number, limit: number): this {
    this.offsetValue = (page - 1) * limit;
    this.limitValue = limit;
    return this;
  }

  /**
   * Build SELECT query
   */
  public buildSelect(): { query: string; parameters: Record<string, any> } {
    const fields = this.selectFields.join(', ');
    let query = `SELECT ${fields} FROM ${this.tableName}`;

    // Build WHERE clause
    if (this.whereConditions.length > 0) {
      query += this.buildWhereClause();
    }

    // Build ORDER BY clause
    if (this.orderByClause.length > 0) {
      const orderBy = this.orderByClause
        .map(o => `${o.field} ${o.direction}`)
        .join(', ');
      query += ` ORDER BY ${orderBy}`;
    }

    // Build pagination (SQL Server syntax)
    if (this.offsetValue !== undefined && this.limitValue !== undefined) {
      if (this.orderByClause.length === 0) {
        query += ` ORDER BY (SELECT NULL)`; // SQL Server requires ORDER BY for OFFSET
      }
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      this.parameters['offset'] = this.offsetValue;
      this.parameters['limit'] = this.limitValue;
    }

    return { query, parameters: this.parameters };
  }

  /**
   * Build INSERT query
   */
  public buildInsert(data: Record<string, any>): { query: string; parameters: Record<string, any> } {
    const fields = Object.keys(data);
    const columns = fields.join(', ');
    const values = fields.map(field => {
      const paramName = this.generateParamName(field);
      this.parameters[paramName] = data[field];
      return `@${paramName}`;
    }).join(', ');

    const query = `INSERT INTO ${this.tableName} (${columns}) OUTPUT INSERTED.* VALUES (${values})`;
    
    return { query, parameters: this.parameters };
  }

  /**
   * Build UPDATE query
   */
  public buildUpdate(data: Record<string, any>): { query: string; parameters: Record<string, any> } {
    const fields = Object.keys(data);
    const setClause = fields.map(field => {
      const paramName = this.generateParamName(field);
      this.parameters[paramName] = data[field];
      return `${field} = @${paramName}`;
    }).join(', ');

    let query = `UPDATE ${this.tableName} SET ${setClause}`;

    // Build WHERE clause
    if (this.whereConditions.length > 0) {
      query += this.buildWhereClause();
    }

    query += ` OUTPUT INSERTED.*`;

    return { query, parameters: this.parameters };
  }

  /**
   * Build DELETE query (soft delete recommended)
   */
  public buildDelete(): { query: string; parameters: Record<string, any> } {
    let query = `UPDATE ${this.tableName} SET deleted_at = GETDATE(), is_deleted = 1`;

    // Build WHERE clause
    if (this.whereConditions.length > 0) {
      query += this.buildWhereClause();
    }

    return { query, parameters: this.parameters };
  }

  /**
   * Build COUNT query
   */
  public buildCount(): { query: string; parameters: Record<string, any> } {
    let query = `SELECT COUNT(*) as total FROM ${this.tableName}`;

    // Build WHERE clause
    if (this.whereConditions.length > 0) {
      query += this.buildWhereClause();
    }

    return { query, parameters: this.parameters };
  }

  /**
   * Build WHERE clause with parameters
   */
  private buildWhereClause(): string {
    let whereClause = ' WHERE ';
    
    this.whereConditions.forEach((condition, index) => {
      // Add logical operator
      if (index > 0) {
        whereClause += ` ${condition.logicalOperator} `;
      }

      // Build condition
      if (condition.operator === 'IS NULL' || condition.operator === 'IS NOT NULL') {
        whereClause += `${condition.field} ${condition.operator}`;
      } else if (condition.operator === 'IN' || condition.operator === 'NOT IN') {
        const paramName = this.generateParamName(condition.field);
        this.parameters[paramName] = condition.value;
        whereClause += `${condition.field} ${condition.operator} (@${paramName})`;
      } else if (condition.operator === 'LIKE') {
        const paramName = this.generateParamName(condition.field);
        this.parameters[paramName] = `%${condition.value}%`;
        whereClause += `${condition.field} LIKE @${paramName}`;
      } else {
        const paramName = this.generateParamName(condition.field);
        this.parameters[paramName] = condition.value;
        whereClause += `${condition.field} ${condition.operator} @${paramName}`;
      }
    });

    return whereClause;
  }

  /**
   * Generate unique parameter name
   */
  private generateParamName(field: string): string {
    this.paramCounter++;
    return `${field}_${this.paramCounter}`;
  }

  /**
   * Reset builder state
   */
  public reset(): this {
    this.selectFields = ['*'];
    this.whereConditions = [];
    this.orderByClause = [];
    this.limitValue = undefined;
    this.offsetValue = undefined;
    this.paramCounter = 0;
    this.parameters = {};
    return this;
  }
}

// Usage Example:
/*
const builder = new QueryBuilder('users');
const { query, parameters } = builder
  .select('id', 'name', 'email')
  .where('status', '=', 'active')
  .where('role', 'IN', ['admin', 'user'])
  .orderBy('created_at', 'DESC')
  .paginate(1, 10)
  .buildSelect();

// Automatically generates safe parameterized query:
// SELECT id, name, email FROM users 
// WHERE status = @status_1 AND role IN (@role_2) 
// ORDER BY created_at DESC 
// OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
*/
```

### 4. Database Interface (Technology Abstraction - CRITICAL)

**Purpose**: Define database operations independent of specific technology.

```typescript
// core/database/database.interface.ts
export interface QueryResult<T = any> {
  recordset: T[];
  rowsAffected: number[];
}

export interface IDatabase {
  /**
   * Execute raw query with parameters
   */
  executeQuery<T = any>(query: string, parameters?: Record<string, any>): Promise<QueryResult<T>>;

  /**
   * Execute query within transaction
   */
  executeInTransaction<T = any>(
    queries: { query: string; parameters?: Record<string, any> }[]
  ): Promise<QueryResult<T>[]>;

  /**
   * Get single record
   */
  findOne<T = any>(query: string, parameters?: Record<string, any>): Promise<T | null>;

  /**
   * Get multiple records
   */
  findMany<T = any>(query: string, parameters?: Record<string, any>): Promise<T[]>;

  /**
   * Insert record
   */
  insert<T = any>(query: string, parameters?: Record<string, any>): Promise<T>;

  /**
   * Update records
   */
  update<T = any>(query: string, parameters?: Record<string, any>): Promise<T[]>;

  /**
   * Delete records (soft delete)
   */
  delete(query: string, parameters?: Record<string, any>): Promise<number>;

  /**
   * Execute stored procedure
   */
  executeStoredProcedure<T = any>(
    procedureName: string,
    parameters?: Record<string, any>
  ): Promise<QueryResult<T>>;

  /**
   * Begin transaction
   */
  beginTransaction(): Promise<any>;

  /**
   * Commit transaction
   */
  commitTransaction(transaction: any): Promise<void>;

  /**
   * Rollback transaction
   */
  rollbackTransaction(transaction: any): Promise<void>;
}
```

### 5. MS SQL Server Implementation

```typescript
// core/database/implementations/mssql.implementation.ts
import * as mssql from 'mssql';
import { IDatabase, QueryResult } from '../database.interface';
import { connectionManager } from '../connection-manager';
import { TransactionManager } from '../transaction-manager';
import { Logger } from '@/core/utils/logger.util';
import { DatabaseError } from '@/common/errors/database.error';

export class MsSqlDatabase implements IDatabase {
  
  /**
   * Execute raw query with parameters (SAFE from SQL injection)
   */
  public async executeQuery<T = any>(
    query: string,
    parameters?: Record<string, any>
  ): Promise<QueryResult<T>> {
    try {
      const pool = connectionManager.getPool();
      const request = pool.request();

      // Bind parameters
      if (parameters) {
        Object.entries(parameters).forEach(([key, value]) => {
          request.input(key, value);
        });
      }

      const result = await request.query(query);
      
      Logger.debug('Query executed:', { query, parameters, rowCount: result.rowsAffected[0] });
      
      return result;
    } catch (error) {
      Logger.error('Query execution failed:', { query, parameters, error });
      throw new DatabaseError('Query execution failed', error);
    }
  }

  /**
   * Execute queries within transaction
   */
  public async executeInTransaction<T = any>(
    queries: { query: string; parameters?: Record<string, any> }[]
  ): Promise<QueryResult<T>[]> {
    return TransactionManager.execute(async (transaction) => {
      const results: QueryResult<T>[] = [];

      for (const { query, parameters } of queries) {
        const request = new mssql.Request(transaction);

        if (parameters) {
          Object.entries(parameters).forEach(([key, value]) => {
            request.input(key, value);
          });
        }

        const result = await request.query(query);
        results.push(result);
      }

      return results;
    });
  }

  /**
   * Get single record
   */
  public async findOne<T = any>(
    query: string,
    parameters?: Record<string, any>
  ): Promise<T | null> {
    const result = await this.executeQuery<T>(query, parameters);
    return result.recordset[0] || null;
  }

  /**
   * Get multiple records
   */
  public async findMany<T = any>(
    query: string,
    parameters?: Record<string, any>
  ): Promise<T[]> {
    const result = await this.executeQuery<T>(query, parameters);
    return result.recordset;
  }

  /**
   * Insert record
   */
  public async insert<T = any>(
    query: string,
    parameters?: Record<string, any>
  ): Promise<T> {
    const result = await this.executeQuery<T>(query, parameters);
    return result.recordset[0];
  }

  /**
   * Update records
   */
  public async update<T = any>(
    query: string,
    parameters?: Record<string, any>
  ): Promise<T[]> {
    const result = await this.executeQuery<T>(query, parameters);
    return result.recordset;
  }

  /**
   * Delete records (soft delete)
   */
  public async delete(
    query: string,
    parameters?: Record<string, any>
  ): Promise<number> {
    const result = await this.executeQuery(query, parameters);
    return result.rowsAffected[0];
  }

  /**
   * Execute stored procedure
   */
  public async executeStoredProcedure<T = any>(
    procedureName: string,
    parameters?: Record<string, any>
  ): Promise<QueryResult<T>> {
    try {
      const pool = connectionManager.getPool();
      const request = pool.request();

      if (parameters) {
        Object.entries(parameters).forEach(([key, value]) => {
          request.input(key, value);
        });
      }

      const result = await request.execute(procedureName);
      
      Logger.debug('Stored procedure executed:', { procedureName, parameters });
      
      return result;
    } catch (error) {
      Logger.error('Stored procedure execution failed:', { procedureName, parameters, error });
      throw new DatabaseError('Stored procedure execution failed', error);
    }
  }

  /**
   * Begin transaction
   */
  public async beginTransaction(): Promise<mssql.Transaction> {
    const pool = connectionManager.getPool();
    const transaction = new mssql.Transaction(pool);
    await transaction.begin();
    return transaction;
  }

  /**
   * Commit transaction
   */
  public async commitTransaction(transaction: mssql.Transaction): Promise<void> {
    await transaction.commit();
  }

  /**
   * Rollback transaction
   */
  public async rollbackTransaction(transaction: mssql.Transaction): Promise<void> {
    await transaction.rollback();
  }
}

// Export singleton instance
export const database = new MsSqlDatabase();
```

---

## ⚡ DATABASE QUERY OPTIMIZATION & PERFORMANCE

### Overview

Database performance is critical for CCMS application scalability. This section covers optimization strategies, best practices, and performance monitoring techniques specific to MS SQL Server.

**Performance Goals**:
- 🎯 API responses < 200ms (p95)
- 🎯 Complex queries < 500ms
- 🎯 Database CPU < 70%
- 🎯 Connection pool utilization < 80%

---

### 1. Indexing Strategy

#### When to Create Indexes

**✅ Create indexes for**:
```typescript
// Foreign keys (for JOINs)
CREATE INDEX idx_claims_user_id ON claims(user_id);
CREATE INDEX idx_claims_policy_id ON claims(policy_id);

// Frequently queried columns
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_created_at ON claims(created_at);

// Composite indexes for common query patterns
CREATE INDEX idx_claims_status_created ON claims(status, created_at DESC);
CREATE INDEX idx_claims_user_status ON claims(user_id, status);

// INCLUDE non-key columns for covering indexes
CREATE INDEX idx_claims_covering 
ON claims(user_id, status) 
INCLUDE (claim_number, amount, created_at);
```

**❌ Avoid indexes on**:
- Small tables (< 1000 rows)
- Columns with low cardinality (few distinct values like boolean)
- Frequently updated columns (heavy write overhead)
- Large VARCHAR/TEXT columns

#### Index Types in MS SQL Server

```sql
-- Clustered index (one per table, determines physical order)
CREATE CLUSTERED INDEX idx_claims_pk ON claims(claim_id);

-- Non-clustered index (multiple allowed)
CREATE NONCLUSTERED INDEX idx_claims_status ON claims(status);

-- Unique index (enforce uniqueness)
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Filtered index (subset of rows)
CREATE INDEX idx_active_claims 
ON claims(created_at) 
WHERE status = 'ACTIVE';

-- Full-text index (for text search)
CREATE FULLTEXT INDEX ON claims(description) 
KEY INDEX idx_claims_pk;
```

#### Index Maintenance

```typescript
// features/database/services/index-maintenance.service.ts
import { database } from '@/core/database/implementations/mssql.implementation';

export class IndexMaintenanceService {
  /**
   * Rebuild fragmented indexes
   * Run weekly in off-peak hours
   */
  async rebuildFragmentedIndexes(): Promise<void> {
    const query = `
      SELECT 
        OBJECT_NAME(ips.object_id) AS TableName,
        i.name AS IndexName,
        ips.avg_fragmentation_in_percent
      FROM sys.dm_db_index_physical_stats(
        DB_ID(), NULL, NULL, NULL, 'LIMITED'
      ) ips
      INNER JOIN sys.indexes i 
        ON ips.object_id = i.object_id 
        AND ips.index_id = i.index_id
      WHERE ips.avg_fragmentation_in_percent > 30
        AND i.name IS NOT NULL;
    `;

    const fragmented = await database.query(query);

    for (const row of fragmented) {
      const rebuildQuery = `
        ALTER INDEX ${row.IndexName} 
        ON ${row.TableName} 
        REBUILD WITH (ONLINE = ON);
      `;
      await database.query(rebuildQuery);
    }
  }

  /**
   * Update statistics for query optimizer
   * Run daily
   */
  async updateStatistics(): Promise<void> {
    await database.query('EXEC sp_updatestats;');
  }

  /**
   * Find missing indexes (SQL Server suggestions)
   */
  async findMissingIndexes(): Promise<any[]> {
    const query = `
      SELECT TOP 10
        OBJECT_NAME(mid.object_id) AS TableName,
        mid.equality_columns,
        mid.inequality_columns,
        mid.included_columns,
        migs.avg_user_impact,
        migs.user_seeks + migs.user_scans AS total_operations
      FROM sys.dm_db_missing_index_details mid
      INNER JOIN sys.dm_db_missing_index_groups mig 
        ON mid.index_handle = mig.index_handle
      INNER JOIN sys.dm_db_missing_index_group_stats migs 
        ON mig.index_group_handle = migs.group_handle
      WHERE mid.database_id = DB_ID()
      ORDER BY migs.avg_user_impact DESC;
    `;

    return await database.query(query);
  }
}
```

---

### 2. Query Optimization Patterns

#### SELECT Only Required Columns

```typescript
// ❌ BAD: Select all columns
const claims = await this.queryBuilder
  .select('*')
  .from('claims')
  .where('user_id', userId)
  .execute();

// ✅ GOOD: Select specific columns
const claims = await this.queryBuilder
  .select(['claim_id', 'claim_number', 'status', 'amount', 'created_at'])
  .from('claims')
  .where('user_id', userId)
  .execute();

// ✅ BEST: Use projection in repository
interface ClaimListDto {
  claimId: string;
  claimNumber: string;
  status: string;
  amount: number;
  createdAt: Date;
}

async findByUserId(userId: string): Promise<ClaimListDto[]> {
  return await this.queryBuilder
    .select(['claim_id', 'claim_number', 'status', 'amount', 'created_at'])
    .from('claims')
    .where('user_id', userId)
    .execute<ClaimListDto>();
}
```

#### Use WHERE Clause Effectively

```typescript
// ✅ GOOD: Filter at database level
const activeClaims = await this.queryBuilder
  .select(['claim_id', 'claim_number'])
  .from('claims')
  .where('status', 'ACTIVE')
  .whereGreaterThan('amount', 1000)
  .execute();

// ❌ BAD: Filter in application
const allClaims = await this.queryBuilder.select('*').from('claims').execute();
const activeClaims = allClaims.filter(c => c.status === 'ACTIVE' && c.amount > 1000);
```

#### Optimize JOINs

```typescript
// ✅ GOOD: Use INNER JOIN for related data
const claimsWithUsers = await this.queryBuilder
  .select([
    'c.claim_id',
    'c.claim_number',
    'u.email',
    'u.full_name'
  ])
  .from('claims', 'c')
  .join('users', 'u', 'c.user_id', 'u.user_id')
  .where('c.status', 'ACTIVE')
  .execute();

// ✅ LEFT JOIN only when needed
const usersWithClaimCount = await database.query(`
  SELECT 
    u.user_id,
    u.email,
    COUNT(c.claim_id) as claim_count
  FROM users u
  LEFT JOIN claims c ON u.user_id = c.user_id
  GROUP BY u.user_id, u.email
  HAVING COUNT(c.claim_id) > 0
`);

// ❌ BAD: Multiple separate queries (N+1 problem - see next section)
```

#### Avoid UNION when possible

```typescript
// ❌ SLOWER: UNION (removes duplicates)
const query1 = `SELECT claim_id FROM claims WHERE status = 'PENDING'`;
const query2 = `SELECT claim_id FROM claims WHERE amount > 10000`;
const combined = `${query1} UNION ${query2}`;

// ✅ FASTER: UNION ALL (if duplicates OK)
const combined = `${query1} UNION ALL ${query2}`;

// ✅ BEST: Single query with OR
const claims = await this.queryBuilder
  .select(['claim_id'])
  .from('claims')
  .where((qb) => {
    qb.where('status', 'PENDING')
      .orWhere('amount', '>', 10000);
  })
  .execute();
```

#### Use EXISTS instead of IN for large datasets

```typescript
// ❌ SLOWER: IN clause with subquery
const query = `
  SELECT * FROM claims 
  WHERE user_id IN (
    SELECT user_id FROM users WHERE role = 'ADMIN'
  )
`;

// ✅ FASTER: EXISTS
const query = `
  SELECT c.* FROM claims c
  WHERE EXISTS (
    SELECT 1 FROM users u 
    WHERE u.user_id = c.user_id 
    AND u.role = 'ADMIN'
  )
`;
```

---

### 3. N+1 Query Problem

#### Problem Identification

```typescript
// ❌ BAD: N+1 queries (1 query + N queries for each result)
export class ClaimService {
  async getClaimsWithUsers(): Promise<any[]> {
    // Query 1: Get all claims
    const claims = await this.claimRepository.findAll();

    // Query 2...N+1: Get user for each claim
    for (const claim of claims) {
      claim.user = await this.userRepository.findById(claim.userId);
    }

    return claims;
  }
}
// If 100 claims → 101 database queries! 🔴
```

#### Solution 1: JOIN in Repository

```typescript
// ✅ GOOD: Single query with JOIN
export class ClaimRepository extends BaseRepository<Claim> {
  async findAllWithUsers(): Promise<any[]> {
    const query = `
      SELECT 
        c.claim_id,
        c.claim_number,
        c.amount,
        c.status,
        u.user_id,
        u.email,
        u.full_name
      FROM claims c
      INNER JOIN users u ON c.user_id = u.user_id
    `;

    return await database.query(query);
  }
}

export class ClaimService {
  async getClaimsWithUsers(): Promise<any[]> {
    // Single query! ✅
    return await this.claimRepository.findAllWithUsers();
  }
}
```

#### Solution 2: Batch Loading (DataLoader Pattern)

```typescript
// features/claims/repositories/claim.repository.ts
export class ClaimRepository extends BaseRepository<Claim> {
  /**
   * Load users for multiple claims in single query
   */
  async loadUsersForClaims(claims: Claim[]): Promise<Map<string, User>> {
    const userIds = [...new Set(claims.map(c => c.userId))];

    const users = await this.queryBuilder
      .select(['user_id', 'email', 'full_name'])
      .from('users')
      .whereIn('user_id', userIds)
      .execute<User>();

    // Create lookup map
    const userMap = new Map<string, User>();
    users.forEach(user => userMap.set(user.userId, user));

    return userMap;
  }
}

export class ClaimService {
  async getClaimsWithUsers(): Promise<any[]> {
    // Query 1: Get all claims
    const claims = await this.claimRepository.findAll();

    // Query 2: Get all related users (batch)
    const userMap = await this.claimRepository.loadUsersForClaims(claims);

    // Map users to claims
    return claims.map(claim => ({
      ...claim,
      user: userMap.get(claim.userId)
    }));
  }
}
// 100 claims → 2 queries instead of 101! ✅
```

#### Solution 3: Database Views

```sql
-- Create view for common join
CREATE VIEW vw_claims_with_users AS
SELECT 
  c.claim_id,
  c.claim_number,
  c.amount,
  c.status,
  c.created_at,
  u.user_id,
  u.email,
  u.full_name,
  u.role
FROM claims c
INNER JOIN users u ON c.user_id = u.user_id;
```

```typescript
// Use view in repository
export class ClaimRepository extends BaseRepository<Claim> {
  async findAllWithUsers(): Promise<any[]> {
    return await this.queryBuilder
      .select('*')
      .from('vw_claims_with_users')
      .execute();
  }
}
```

---

### 4. Pagination Performance

#### Offset-Based Pagination (Simple but slow for large offsets)

```typescript
// ❌ PROBLEM: OFFSET becomes slow for deep pages
export class ClaimRepository extends BaseRepository<Claim> {
  async findPaginated(page: number, limit: number): Promise<Claim[]> {
    const offset = (page - 1) * limit;

    // For page 1000 with limit 20: OFFSET 19980
    // SQL Server must scan 19980 rows then skip them! 🔴
    return await this.queryBuilder
      .select('*')
      .from('claims')
      .orderBy('created_at', 'DESC')
      .limit(limit)
      .offset(offset)
      .execute();
  }
}
```

#### Cursor-Based Pagination (Fast for large datasets)

```typescript
// ✅ GOOD: Cursor-based pagination (keyset pagination)
export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export class ClaimRepository extends BaseRepository<Claim> {
  async findPaginatedByCursor(
    cursor?: string,
    limit: number = 20
  ): Promise<PaginatedResult<Claim>> {
    let query = this.queryBuilder
      .select(['claim_id', 'claim_number', 'amount', 'created_at'])
      .from('claims')
      .orderBy('created_at', 'DESC')
      .limit(limit + 1); // Fetch one extra to check if more exist

    if (cursor) {
      // Decode cursor (base64 encoded timestamp:id)
      const [timestamp, claimId] = Buffer.from(cursor, 'base64')
        .toString('utf-8')
        .split(':');

      // WHERE created_at < cursor OR (created_at = cursor AND claim_id < cursor_id)
      query = query.where(qb => {
        qb.whereLessThan('created_at', new Date(timestamp))
          .orWhere(qb2 => {
            qb2.where('created_at', new Date(timestamp))
               .whereLessThan('claim_id', claimId);
          });
      });
    }

    const results = await query.execute<Claim>();
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    let nextCursor: string | undefined;
    if (hasMore) {
      const lastItem = data[data.length - 1];
      // Encode cursor
      nextCursor = Buffer.from(
        `${lastItem.createdAt.toISOString()}:${lastItem.claimId}`
      ).toString('base64');
    }

    return {
      data,
      nextCursor,
      hasMore
    };
  }
}

// Controller usage
export class ClaimController extends BaseController {
  async getPaginated(req: Request, res: Response): Promise<void> {
    const { cursor, limit = 20 } = req.query;

    const result = await this.claimService.findPaginatedByCursor(
      cursor as string,
      Number(limit)
    );

    this.success(res, result);
  }
}
```

#### Indexed Pagination

```sql
-- Create composite index for pagination
CREATE INDEX idx_claims_pagination 
ON claims(created_at DESC, claim_id DESC);

-- Query uses index efficiently
SELECT claim_id, claim_number, amount, created_at
FROM claims
WHERE created_at < @cursor_date
  OR (created_at = @cursor_date AND claim_id < @cursor_id)
ORDER BY created_at DESC, claim_id DESC
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;
```

---

### 5. Query Execution Plans

#### Enable Query Plan Analysis

```typescript
// features/database/services/query-analyzer.service.ts
import { database } from '@/core/database/implementations/mssql.implementation';

export class QueryAnalyzerService {
  /**
   * Analyze query execution plan
   */
  async analyzeQuery(query: string): Promise<any> {
    // Set showplan on
    await database.query('SET SHOWPLAN_ALL ON');

    try {
      const plan = await database.query(query);
      await database.query('SET SHOWPLAN_ALL OFF');
      return plan;
    } catch (error) {
      await database.query('SET SHOWPLAN_ALL OFF');
      throw error;
    }
  }

  /**
   * Get actual execution statistics
   */
  async getExecutionStats(query: string): Promise<any> {
    await database.query('SET STATISTICS TIME ON');
    await database.query('SET STATISTICS IO ON');

    const result = await database.query(query);

    await database.query('SET STATISTICS TIME OFF');
    await database.query('SET STATISTICS IO OFF');

    return result;
  }

  /**
   * Find slow queries from plan cache
   */
  async findSlowQueries(minDurationMs: number = 1000): Promise<any[]> {
    const query = `
      SELECT TOP 20
        qs.execution_count,
        qs.total_elapsed_time / 1000000.0 AS total_elapsed_time_sec,
        qs.total_elapsed_time / qs.execution_count / 1000000.0 AS avg_elapsed_time_sec,
        qs.total_worker_time / 1000000.0 AS total_cpu_time_sec,
        qs.total_logical_reads,
        qs.total_physical_reads,
        SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
          ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(st.text)
            ELSE qs.statement_end_offset
          END - qs.statement_start_offset)/2) + 1) AS query_text
      FROM sys.dm_exec_query_stats qs
      CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
      WHERE qs.total_elapsed_time / qs.execution_count / 1000000.0 > @minDuration
      ORDER BY qs.total_elapsed_time DESC
    `;

    return await database.query(query, { minDuration: minDurationMs / 1000 });
  }
}
```

#### Reading Execution Plans

**Key Metrics to Check**:
```
1. Scan vs Seek
   ✅ Index Seek: Fast (uses index)
   ❌ Table Scan: Slow (reads entire table)
   ❌ Index Scan: Slower (reads entire index)

2. Actual vs Estimated Rows
   ❌ Large difference → Outdated statistics → Run UPDATE STATISTICS

3. Warnings
   ❌ Missing Index
   ❌ Implicit Conversion (wrong data type in WHERE)
   ❌ Sort operation (add index on ORDER BY column)

4. Cost Percentage
   - Focus on operations with highest cost %
```

---

### 6. Connection Pool Management

#### Optimal Pool Configuration

```typescript
// config/database.config.ts
export const databaseConfig = {
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ccms',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  pool: {
    // Maximum connections in pool
    // Formula: (Core Count * 2) + Effective Spindle Count
    // For 4-core server: (4 * 2) + 1 = 9
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    
    // Minimum connections to maintain
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    
    // Max time (ms) to wait for connection
    acquireTimeoutMillis: 30000,
    
    // Idle timeout - release unused connections
    idleTimeoutMillis: 30000,
    
    // Connection lifetime - prevent stale connections
    createTimeoutMillis: 30000,
    
    // Retry failed connections
    createRetryIntervalMillis: 200
  },

  options: {
    // Request timeout (30 seconds)
    requestTimeout: 30000,
    
    // Connection timeout
    connectionTimeout: 15000,
    
    // Enable TCP keep-alive
    enableArithAbort: true,
    
    // Encrypt connection (Production)
    encrypt: process.env.NODE_ENV === 'production',
    
    // Trust server certificate (Dev only)
    trustServerCertificate: process.env.NODE_ENV !== 'production'
  }
};
```

#### Monitor Connection Pool

```typescript
// features/monitoring/services/database-monitor.service.ts
import { database } from '@/core/database/implementations/mssql.implementation';

export class DatabaseMonitorService {
  /**
   * Get connection pool statistics
   */
  async getPoolStats(): Promise<any> {
    const pool = database.getPool();

    return {
      size: pool.size,
      available: pool.available,
      pending: pool.pending,
      borrowed: pool.borrowed,
      
      // Calculate utilization
      utilization: ((pool.borrowed / pool.size) * 100).toFixed(2) + '%',
      
      // Warnings
      warnings: this.getPoolWarnings(pool)
    };
  }

  private getPoolWarnings(pool: any): string[] {
    const warnings: string[] = [];

    // High utilization warning
    const utilization = (pool.borrowed / pool.size) * 100;
    if (utilization > 80) {
      warnings.push(`High pool utilization: ${utilization.toFixed(0)}%`);
    }

    // Pending connections warning
    if (pool.pending > 5) {
      warnings.push(`${pool.pending} pending connection requests`);
    }

    // Pool exhaustion
    if (pool.available === 0) {
      warnings.push('Connection pool exhausted');
    }

    return warnings;
  }

  /**
   * Get active connections from SQL Server
   */
  async getActiveConnections(): Promise<any[]> {
    const query = `
      SELECT 
        session_id,
        login_name,
        host_name,
        program_name,
        status,
        cpu_time,
        memory_usage,
        total_elapsed_time,
        last_request_start_time
      FROM sys.dm_exec_sessions
      WHERE database_id = DB_ID()
        AND is_user_process = 1
      ORDER BY last_request_start_time DESC
    `;

    return await database.query(query);
  }

  /**
   * Kill long-running query (use with caution)
   */
  async killSession(sessionId: number): Promise<void> {
    await database.query(`KILL ${sessionId}`);
  }
}
```

---

### 8. Monitoring & Profiling

#### Application-Level Query Logging

```typescript
// core/database/query-logger.ts
import { logger } from '@/core/utils/logger.util';

export class QueryLogger {
  private slowQueryThreshold = 1000; // 1 second

  /**
   * Log query execution
   */
  logQuery(query: string, duration: number, params?: any): void {
    const logData = {
      query: this.sanitizeQuery(query),
      durationMs: duration,
      params: this.sanitizeParams(params),
      timestamp: new Date().toISOString()
    };

    if (duration > this.slowQueryThreshold) {
      logger.warn('Slow query detected', logData);
    } else {
      logger.debug('Query executed', logData);
    }
  }

  /**
   * Remove sensitive data from logs
   */
  private sanitizeQuery(query: string): string {
    // Remove values from INSERT/UPDATE statements
    return query.replace(/VALUES\s*\([^)]+\)/gi, 'VALUES (...)');
  }

  /**
   * Sanitize parameters
   */
  private sanitizeParams(params: any): any {
    if (!params) return undefined;

    const sanitized = { ...params };
    const sensitiveKeys = ['password', 'token', 'secret', 'ssn', 'credit_card'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

export const queryLogger = new QueryLogger();
```

#### Integrate Query Logger in QueryBuilder

```typescript
// core/database/query-builder.ts (Enhancement)
import { queryLogger } from './query-logger';

export class QueryBuilder {
  async execute<T = any>(): Promise<T[]> {
    const startTime = Date.now();
    const queryString = this.buildQuery();

    try {
      const result = await database.query(queryString, this.parameters);
      const duration = Date.now() - startTime;

      // Log query performance
      queryLogger.logQuery(queryString, duration, this.parameters);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Query execution failed', {
        query: queryString,
        duration,
        error: error.message
      });
      throw error;
    }
  }
}
```

#### Performance Metrics Endpoint

```typescript
// features/monitoring/controllers/metrics.controller.ts
import { Request, Response } from 'express';
import { DatabaseMonitorService } from '../services/database-monitor.service';
import { QueryAnalyzerService } from '@/features/database/services/query-analyzer.service';

export class MetricsController {
  private dbMonitor = new DatabaseMonitorService();
  private queryAnalyzer = new QueryAnalyzerService();

  /**
   * GET /api/metrics/database
   * Database performance metrics
   */
  async getDatabaseMetrics(req: Request, res: Response): Promise<void> {
    const [poolStats, activeConnections, slowQueries] = await Promise.all([
      this.dbMonitor.getPoolStats(),
      this.dbMonitor.getActiveConnections(),
      this.queryAnalyzer.findSlowQueries(1000)
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      connectionPool: poolStats,
      activeConnections: activeConnections.length,
      slowQueries: slowQueries.length,
      details: {
        connections: activeConnections,
        slowQueries: slowQueries.slice(0, 5) // Top 5
      }
    });
  }

  /**
   * GET /api/metrics/health
   * Health check with database status
   */
  async getHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Test database connection
      await database.query('SELECT 1');

      const poolStats = await this.dbMonitor.getPoolStats();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          poolUtilization: poolStats.utilization,
          warnings: poolStats.warnings
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error.message
        }
      });
    }
  }
}
```

#### SQL Server Query Store (Production)

```sql
-- Enable Query Store for automatic query performance tracking
ALTER DATABASE ccms
SET QUERY_STORE = ON
(
  OPERATION_MODE = READ_WRITE,
  CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30),
  DATA_FLUSH_INTERVAL_SECONDS = 900,
  MAX_STORAGE_SIZE_MB = 1000,
  INTERVAL_LENGTH_MINUTES = 60,
  SIZE_BASED_CLEANUP_MODE = AUTO,
  QUERY_CAPTURE_MODE = AUTO
);

-- View top slow queries from Query Store
SELECT TOP 10
  q.query_id,
  qt.query_sql_text,
  rs.avg_duration / 1000.0 AS avg_duration_ms,
  rs.avg_logical_io_reads,
  rs.count_executions,
  rs.last_execution_time
FROM sys.query_store_query q
JOIN sys.query_store_query_text qt ON q.query_text_id = qt.query_text_id
JOIN sys.query_store_plan p ON q.query_id = p.query_id
JOIN sys.query_store_runtime_stats rs ON p.plan_id = rs.plan_id
WHERE rs.avg_duration > 1000000 -- 1 second in microseconds
ORDER BY rs.avg_duration DESC;
```

---

### Performance Testing Checklist

```typescript
/**
 * Performance benchmarks for CCMS application
 * 
 * ✅ Before deploying to production, verify:
 * 
 * 1. API Response Times
 *    - Simple queries: < 100ms (p95)
 *    - Complex queries: < 500ms (p95)
 *    - List endpoints: < 200ms (p95)
 * 
 * 2. Database Metrics
 *    - Connection pool utilization: < 80%
 *    - Query execution: < 100ms average
 *    - Index usage: All foreign keys indexed
 *    - No table scans on production data
 * 
 * 3. Caching
 *    - Cache hit ratio: > 70%
 *    - Reference data cached
 *    - Cache invalidation tested
 * 
 * 4. Load Testing
 *    - 100 concurrent users: < 500ms (p95)
 *    - 1000 requests/minute: stable
 *    - No connection pool exhaustion
 * 
 * 5. Query Analysis
 *    - All slow queries identified
 *    - Execution plans reviewed
 *    - Missing indexes addressed
 *    - N+1 queries eliminated
 * 
 * 6. Monitoring
 *    - Slow query logging enabled
 *    - Database metrics tracked
 *    - Alerts configured for issues
 */
```

---

### Quick Reference: Performance Optimization

| Issue | Solution | Priority |
|-------|----------|----------|
| Table scans | Add indexes on WHERE/JOIN columns | 🔴 Critical |
| N+1 queries | Use JOINs or batch loading | 🔴 Critical |
| Large OFFSET | Use cursor-based pagination | 🟡 High |
| SELECT * | Select only required columns | 🟡 High |
| Missing indexes | Check missing index DMVs | 🔴 Critical |
| Slow queries | Analyze execution plans | 🔴 Critical |
| Connection exhaustion | Tune pool size, find leaks | 🔴 Critical |
| Outdated statistics | UPDATE STATISTICS regularly | 🟡 High |
| Index fragmentation | Rebuild indexes weekly | 🟢 Medium |
| Lock contention | Use READ COMMITTED SNAPSHOT | 🟡 High |
| Large result sets | Implement pagination | 🟡 High |

---

## 📐 MVC ARCHITECTURE - Layer Isolation

### Layer Responsibilities

```
Request → Controller → Service → Repository → Database
                                              ↓
Response ← Controller ← Service ← Repository ← Database
```

**Rules**:
- Controllers NEVER talk to repositories directly
- Services contain ALL business logic
- Repositories ONLY handle database operations
- Each layer communicates only with adjacent layers

### Base Repository Pattern (CRITICAL)

```typescript
// core/base/base.repository.ts
import { QueryBuilder } from '../database/query-builder';
import { database } from '../database/implementations/mssql.implementation';
import { PaginationOptions } from '@/common/types/pagination.types';

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
}

export abstract class BaseRepository<T> {
  protected tableName: string;
  protected primaryKey: string = 'id';

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Find all records with optional filters
   */
  public async findAll(options?: QueryOptions): Promise<T[]> {
    const builder = new QueryBuilder(this.tableName);
    
    // Apply soft delete filter
    builder.where('is_deleted', '=', 0);

    // Apply filters
    if (options?.filters) {
      Object.entries(options.filters).forEach(([field, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'string') {
            builder.where(field, 'LIKE', value);
          } else if (Array.isArray(value)) {
            builder.where(field, 'IN', value);
          } else {
            builder.where(field, '=', value);
          }
        }
      });
    }

    // Apply sorting
    if (options?.sortBy) {
      builder.orderBy(options.sortBy, options.sortOrder || 'ASC');
    }

    // Apply pagination
    if (options?.page && options?.limit) {
      builder.paginate(options.page, options.limit);
    }

    const { query, parameters } = builder.buildSelect();
    return database.findMany<T>(query, parameters);
  }

  /**
   * Find record by ID
   */
  public async findById(id: string | number): Promise<T | null> {
    const builder = new QueryBuilder(this.tableName);
    const { query, parameters } = builder
      .where(this.primaryKey, '=', id)
      .where('is_deleted', '=', 0)
      .buildSelect();

    return database.findOne<T>(query, parameters);
  }

  /**
   * Find single record by conditions
   */
  public async findOne(conditions: Record<string, any>): Promise<T | null> {
    const builder = new QueryBuilder(this.tableName);
    builder.where('is_deleted', '=', 0);

    Object.entries(conditions).forEach(([field, value]) => {
      builder.where(field, '=', value);
    });

    const { query, parameters } = builder.buildSelect();
    return database.findOne<T>(query, parameters);
  }

  /**
   * Create new record
   */
  public async create(data: Partial<T>): Promise<T> {
    const builder = new QueryBuilder(this.tableName);
    const dataWithDefaults = {
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
      is_deleted: 0
    };

    const { query, parameters } = builder.buildInsert(dataWithDefaults);
    return database.insert<T>(query, parameters);
  }

  /**
   * Update record by ID
   */
  public async update(id: string | number, data: Partial<T>): Promise<T> {
    const builder = new QueryBuilder(this.tableName);
    const dataWithTimestamp = {
      ...data,
      updated_at: new Date()
    };

    const { query, parameters } = builder
      .where(this.primaryKey, '=', id)
      .where('is_deleted', '=', 0)
      .buildUpdate(dataWithTimestamp);

    const results = await database.update<T>(query, parameters);
    return results[0];
  }

  /**
   * Soft delete record
   */
  public async delete(id: string | number): Promise<void> {
    const builder = new QueryBuilder(this.tableName);
    const { query, parameters } = builder
      .where(this.primaryKey, '=', id)
      .buildDelete();

    await database.delete(query, parameters);
  }

  /**
   * Hard delete record (use with caution)
   */
  public async hardDelete(id: string | number): Promise<void> {
    const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = @id`;
    await database.delete(query, { id });
  }

  /**
   * Count records
   */
  public async count(filters?: Record<string, any>): Promise<number> {
    const builder = new QueryBuilder(this.tableName);
    builder.where('is_deleted', '=', 0);

    if (filters) {
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          builder.where(field, '=', value);
        }
      });
    }

    const { query, parameters } = builder.buildCount();
    const result = await database.findOne<{ total: number }>(query, parameters);
    return result?.total || 0;
  }

  /**
   * Check if record exists
   */
  public async exists(id: string | number): Promise<boolean> {
    const record = await this.findById(id);
    return record !== null;
  }

  /**
   * Execute custom query (use Query Builder)
   */
  protected async executeCustomQuery<R = any>(
    query: string,
    parameters?: Record<string, any>
  ): Promise<R[]> {
    return database.findMany<R>(query, parameters);
  }
}
```

**Usage in Feature Repository:**

```typescript
// features/users/users.repository.ts
import { BaseRepository } from '@/core/base/base.repository';
import { User } from './users.types';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users'); // Table name
  }

  /**
   * Feature-specific method: Find by email
   */
  public async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  /**
   * Feature-specific method: Find active users by role
   */
  public async findByRole(role: string): Promise<User[]> {
    return this.findAll({
      filters: { role, status: 'active' }
    });
  }

  /**
   * Feature-specific method with custom query
   */
  public async findUsersWithClaims(): Promise<any[]> {
    const query = `
      SELECT u.*, COUNT(c.id) as claim_count
      FROM users u
      LEFT JOIN claims c ON u.id = c.user_id
      WHERE u.is_deleted = 0
      GROUP BY u.id, u.name, u.email
      ORDER BY claim_count DESC
    `;
    
    return this.executeCustomQuery(query);
  }
}
```

### Base Service Pattern

```typescript
// core/base/base.service.ts
import { BaseRepository } from './base.repository';

export abstract class BaseService<T> {
  protected repository: BaseRepository<T>;

  constructor(repository: BaseRepository<T>) {
    this.repository = repository;
  }

  /**
   * Get all records
   */
  public async getAll(options?: any): Promise<T[]> {
    return this.repository.findAll(options);
  }

  /**
   * Get by ID
   */
  public async getById(id: string | number): Promise<T | null> {
    return this.repository.findById(id);
  }

  /**
   * Create new record
   */
  public async create(data: Partial<T>): Promise<T> {
    // Add business logic validation here
    return this.repository.create(data);
  }

  /**
   * Update record
   */
  public async update(id: string | number, data: Partial<T>): Promise<T> {
    // Add business logic validation here
    return this.repository.update(id, data);
  }

  /**
   * Delete record
   */
  public async delete(id: string | number): Promise<void> {
    return this.repository.delete(id);
  }
}
```

**Usage in Feature Service:**

```typescript
// features/users/users.service.ts
import { BaseService } from '@/core/base/base.service';
import { UserRepository } from './users.repository';
import { User, CreateUserDto, UpdateUserDto } from './users.types';
import { CryptoUtil } from '@/core/utils/crypto.util';
import { AppError } from '@/common/errors/app.error';

export class UserService extends BaseService<User> {
  private userRepository: UserRepository;

  constructor() {
    const repository = new UserRepository();
    super(repository);
    this.userRepository = repository;
  }

  /**
   * Override create to add business logic
   */
  public async create(data: CreateUserDto): Promise<User> {
    // Business logic: Check if email already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }

    // Business logic: Hash password
    const hashedPassword = await CryptoUtil.hashPassword(data.password);

    // Create user
    return this.userRepository.create({
      ...data,
      password: hashedPassword,
      status: 'active'
    });
  }

  /**
   * Business logic method: Authenticate user
   */
  public async authenticate(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await CryptoUtil.comparePassword(password, user.password);
    
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    if (user.status !== 'active') {
      throw new AppError('Account is inactive', 403);
    }

    return user;
  }

  /**
   * Business logic method: Change password
   */
  public async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValidPassword = await CryptoUtil.comparePassword(oldPassword, user.password);
    
    if (!isValidPassword) {
      throw new AppError('Invalid old password', 400);
    }

    const hashedPassword = await CryptoUtil.hashPassword(newPassword);
    await this.userRepository.update(userId, { password: hashedPassword } as any);
  }
}
```

### Base Controller Pattern

```typescript
// core/base/base.controller.ts
import { Request, Response, NextFunction } from 'express';
import { BaseService } from './base.service';
import { ResponseUtil } from '../utils/response.util';

export abstract class BaseController<T> {
  protected service: BaseService<T>;

  constructor(service: BaseService<T>) {
    this.service = service;
  }

  /**
   * Get all records
   */
  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, sortBy, sortOrder, ...filters } = req.query;
      
      const options = {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: sortBy as string,
        sortOrder: (sortOrder as 'ASC' | 'DESC') || 'ASC',
        filters
      };

      const records = await this.service.getAll(options);
      ResponseUtil.success(res, records, 'Records retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get by ID
   */
  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const record = await this.service.getById(id);
      
      if (!record) {
        ResponseUtil.error(res, 'Record not found', 404);
        return;
      }

      ResponseUtil.success(res, record, 'Record retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create record
   */
  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await this.service.create(req.body);
      ResponseUtil.success(res, record, 'Record created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update record
   */
  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const record = await this.service.update(id, req.body);
      ResponseUtil.success(res, record, 'Record updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete record
   */
  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      ResponseUtil.success(res, null, 'Record deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
```

**Usage in Feature Controller:**

```typescript
// features/users/users.controller.ts
import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@/core/base/base.controller';
import { UserService } from './users.service';
import { User } from './users.types';
import { ResponseUtil } from '@/core/utils/response.util';

export class UserController extends BaseController<User> {
  private userService: UserService;

  constructor() {
    const service = new UserService();
    super(service);
    this.userService = service;
  }

  /**
   * Custom endpoint: Login
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const user = await this.userService.authenticate(email, password);
      
      // Generate JWT token (implement in AuthService)
      const token = 'generated-jwt-token';
      
      ResponseUtil.success(res, { user, token }, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Custom endpoint: Change password
   */
  public changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id; // From auth middleware
      const { oldPassword, newPassword } = req.body;
      
      await this.userService.changePassword(userId, oldPassword, newPassword);
      
      ResponseUtil.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  };
}
```

---

## � JWT AUTHENTICATION & SECURITY

### JWT Service (Token Generation & Verification)

```typescript
// core/auth/jwt.service.ts
import jwt from 'jsonwebtoken';
import { jwtConfig } from '@/config/jwt.config';
import { User } from '@/features/users/users.types';
import { Logger } from '@/core/utils/logger.util';

export interface TokenPayload {
  userId: number;
  role: string;
  email: string;
  tokenType: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export class JwtService {
  /**
   * Generate access token (15 minutes)
   */
  public static generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
      tokenType: 'access'
    };

    return jwt.sign(payload, jwtConfig.secret, {
      algorithm: jwtConfig.algorithm,
      expiresIn: jwtConfig.accessTokenExpiry,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
  }

  /**
   * Generate refresh token (7 days)
   */
  public static generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
      tokenType: 'refresh'
    };

    return jwt.sign(payload, jwtConfig.secret, {
      algorithm: jwtConfig.algorithm,
      expiresIn: jwtConfig.refreshTokenExpiry,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
  }

  /**
   * Verify token
   */
  public static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, jwtConfig.secret, {
        algorithms: [jwtConfig.algorithm], // ✅ Force algorithm (prevent algorithm confusion attack)
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      }) as TokenPayload;
    } catch (error) {
      Logger.error('Token verification failed:', error);
      throw new Error('Invalid token');
    }
  }

  /**
   * Decode token without verification (for reading claims)
   */
  public static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      Logger.error('Token decode failed:', error);
      return null;
    }
  }

  /**
   * Get token expiration timestamp
   */
  public static getTokenExpiration(token: string): number | null {
    const decoded = this.decodeToken(token);
    return decoded?.exp || null;
  }
}
```

### CSRF Token Service (Login Protection)

**Purpose**: Protect login endpoint from Cross-Site Request Forgery attacks.

```typescript
// core/auth/csrf.service.ts
import crypto from 'crypto';

interface CsrfToken {
  token: string;
  timestamp: number;
}

export class CsrfService {
  private static tokens = new Map<string, CsrfToken>();
  private static TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a new CSRF token
   */
  public static generateToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    
    this.tokens.set(token, {
      token,
      timestamp: Date.now()
    });

    // Cleanup expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  /**
   * Validate CSRF token (one-time use)
   */
  public static validateToken(token: string): boolean {
    const storedToken = this.tokens.get(token);

    if (!storedToken) {
      return false;
    }

    // Check if token has expired
    const isExpired = Date.now() - storedToken.timestamp > this.TOKEN_EXPIRY;
    
    if (isExpired) {
      this.tokens.delete(token);
      return false;
    }

    // Token is valid, remove it (one-time use)
    this.tokens.delete(token);
    return true;
  }

  /**
   * Cleanup expired tokens
   */
  private static cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now - data.timestamp > this.TOKEN_EXPIRY) {
        this.tokens.delete(token);
      }
    }
  }
}
```

### Authentication Middleware (httpOnly Cookies)

```typescript
// core/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { JwtService, TokenPayload } from '@/core/auth/jwt.service';
import { ResponseUtil } from '@/core/utils/response.util';
import { Logger } from '@/core/utils/logger.util';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authentication middleware - Reads token from httpOnly cookie
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Read access token from httpOnly cookie
    const token = req.cookies.accessToken;

    if (!token) {
      ResponseUtil.error(res, 'Authentication required', 401);
      return;
    }

    // Verify token
    const payload = JwtService.verifyToken(token);

    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    Logger.error('Authentication failed:', error);
    ResponseUtil.error(res, 'Invalid or expired token', 401);
  }
};

/**
 * Optional authentication - Doesn't fail if no token
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.accessToken;

    if (token) {
      const payload = JwtService.verifyToken(token);
      req.user = payload;
    }
    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};
```

### Auth Feature (Login, Logout, Refresh)

```typescript
// features/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ResponseUtil } from '@/core/utils/response.util';
import { jwtConfig } from '@/config/jwt.config';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Login - Sets httpOnly cookies
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      // Set access token cookie (httpOnly - XSS protection)
      res.cookie('accessToken', result.accessToken, {
        ...jwtConfig.cookie,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      // Set refresh token cookie (httpOnly - XSS protection)
      res.cookie('refreshToken', result.refreshToken, {
        ...jwtConfig.cookie,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return user data (NO tokens in response body)
      ResponseUtil.success(
        res,
        {
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            name: result.user.name
          }
        },
        'Login successful'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout - Blacklist token and clear cookies
   */
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies.accessToken;
      
      if (token) {
        await this.authService.logout(token);
      }

      // Clear cookies
      res.clearCookie('accessToken', { ...jwtConfig.cookie });
      res.clearCookie('refreshToken', { ...jwtConfig.cookie });

      ResponseUtil.success(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token using refresh token
   */
  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        ResponseUtil.error(res, 'Refresh token required', 401);
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      // Set new access token cookie
      res.cookie('accessToken', result.accessToken, {
        ...jwtConfig.cookie,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      ResponseUtil.success(res, null, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user info
   */
  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        ResponseUtil.error(res, 'User not found', 401);
        return;
      }

      const user = await this.authService.getCurrentUser(userId);
      
      ResponseUtil.success(
        res,
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        },
        'User retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change password - Invalidates all tokens
   */
  public changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { oldPassword, newPassword } = req.body;

      if (!userId) {
        ResponseUtil.error(res, 'User not found', 401);
        return;
      }

      await this.authService.changePassword(userId, oldPassword, newPassword);

      // Clear current cookies (user must login again)
      res.clearCookie('accessToken', { ...jwtConfig.cookie });
      res.clearCookie('refreshToken', { ...jwtConfig.cookie });

      ResponseUtil.success(res, null, 'Password changed successfully. Please login again.');
    } catch (error) {
      next(error);
    }
  };
}
```

```typescript
// features/auth/auth.service.ts
import { UserRepository } from '@/features/users/users.repository';
import { User } from '@/features/users/users.types';
import { JwtService } from '@/core/auth/jwt.service';
import { TokenBlacklistService } from '@/core/auth/token-blacklist.service';
import { CryptoUtil } from '@/core/utils/crypto.util';
import { AppError } from '@/common/errors/app.error';
import { Logger } from '@/core/utils/logger.util';

export interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
}

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Login - Authenticate and generate tokens
   */
  public async login(email: string, password: string): Promise<LoginResult> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await CryptoUtil.comparePassword(password, user.password);
    
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new AppError('Account is inactive', 403);
    }

    // Generate tokens
    const accessToken = JwtService.generateAccessToken(user);
    const refreshToken = JwtService.generateRefreshToken(user);

    Logger.info(`User logged in: ${user.email}`);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  /**
   * Logout - Blacklist token
   */
  public async logout(token: string): Promise<void> {
    await TokenBlacklistService.blacklistToken(token);
    Logger.info('User logged out');
  }

  /**
   * Refresh access token
   */
  public async refreshToken(refreshToken: string): Promise<RefreshResult> {
    try {
      // Check if refresh token is blacklisted
      const isBlacklisted = await TokenBlacklistService.isBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new AppError('Refresh token has been revoked', 401);
      }

      // Verify refresh token
      const payload = JwtService.verifyToken(refreshToken);

      if (payload.tokenType !== 'refresh') {
        throw new AppError('Invalid token type', 401);
      }

      // Check if user tokens are invalidated
      const areTokensInvalidated = await TokenBlacklistService.areUserTokensInvalidated(payload.userId);
      if (areTokensInvalidated) {
        throw new AppError('All tokens have been invalidated. Please login again.', 401);
      }

      // Get user
      const user = await this.userRepository.findById(payload.userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.status !== 'active') {
        throw new AppError('Account is inactive', 403);
      }

      // Generate new access token
      const accessToken = JwtService.generateAccessToken(user);

      return { accessToken };
    } catch (error) {
      Logger.error('Token refresh failed:', error);
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  /**
   * Get current user
   */
  public async getCurrentUser(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Change password - Invalidate all tokens
   */
  public async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify old password
    const isValidPassword = await CryptoUtil.comparePassword(oldPassword, user.password);
    
    if (!isValidPassword) {
      throw new AppError('Invalid old password', 400);
    }

    // Hash new password
    const hashedPassword = await CryptoUtil.hashPassword(newPassword);

    // Update password
    await this.userRepository.update(userId, { password: hashedPassword } as any);

    // Invalidate all user tokens
    await TokenBlacklistService.blacklistUserTokens(userId);

    Logger.info(`Password changed for user: ${user.email}`);
  }
}
```

```typescript
// features/auth/auth.routes.ts
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '@/core/middleware/auth.middleware';
import { validateRequest } from '@/core/middleware/validator.middleware';
import { loginSchema, changePasswordSchema } from './auth.validator';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refresh);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);
router.post('/change-password', authMiddleware, validateRequest(changePasswordSchema), authController.changePassword);

export default router;
```

```typescript
// features/auth/auth.validator.ts
import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  })
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'any.required': 'Old password is required'
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'New password must be at least 8 characters',
    'any.required': 'New password is required'
  })
});
```

### Crypto Utility (Password Hashing)

```typescript
// core/utils/crypto.util.ts
import bcrypt from 'bcrypt';

export class CryptoUtil {
  private static SALT_ROUNDS = 12;

  /**
   * Hash password
   */
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

---

## �🛣️ ROUTING & MIDDLEWARE

### Feature Routes

```typescript
// features/users/users.routes.ts
import { Router } from 'express';
import { UserController } from './users.controller';
import { authMiddleware } from '@/core/middleware/auth.middleware';
import { requireRole } from '@/common/middleware/role-check.middleware';
import { validateRequest } from '@/core/middleware/validator.middleware';
import { createUserSchema, updateUserSchema, loginSchema } from './users.validator';

const router = Router();
const userController = new UserController();

// Public routes
router.post('/login', validateRequest(loginSchema), userController.login);

// Protected routes
router.use(authMiddleware); // All routes below require authentication

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', requireRole('admin'), validateRequest(createUserSchema), userController.create);
router.put('/:id', requireRole('admin'), validateRequest(updateUserSchema), userController.update);
router.delete('/:id', requireRole('admin'), userController.delete);
router.post('/change-password', userController.changePassword);

export default router;
```

### Route Aggregation

```typescript
// routes/index.ts
import { Router } from 'express';
import userRoutes from '@/features/users/users.routes';
import claimRoutes from '@/features/claims/claims.routes';
import authRoutes from '@/features/auth/auth.routes';

const router = Router();

// API versioning
router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/claims', claimRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;
```

---

## 🔐 JWT AUTHENTICATION & SECURITY

### Overview

**Authentication Strategy:**
- **Algorithm**: HS256 (Symmetric key signing)
- **Token Storage**: httpOnly Cookies (XSS protection)
- **Token Expiration**: 15 min access / 7 day refresh
- **Token Refresh**: ✅ **IMPLEMENTED** - Automatic refresh on access token expiry
- **Frontend Auto-Refresh**: ✅ **IMPLEMENTED** - Error interceptor handles 401 and refreshes automatically
- **Revocation**: Logout clears httpOnly cookies (client-side only)
- **Payload**: userId, username only (minimal payload for security)

**Current Implementation Status:**
- ✅ JWT token generation (access + refresh)
- ✅ httpOnly cookie storage
- ✅ Token refresh endpoint (`/auth/refresh`)
- ✅ Frontend automatic token refresh on expiry
- ✅ User stays logged in for 7 days without interruption
- ❌ Token blacklisting (logout clears cookies only)
- ❌ Token invalidation on password change

### JWT Service (Token Generation & Verification)

```typescript
// core/auth/jwt.service.ts
import jwt from 'jsonwebtoken';
import { jwtConfig } from '@/config/jwt.config';
import { User } from '@/features/users/users.types';
import { Logger } from '@/core/utils/logger.util';

export interface TokenPayload {
  userId: number;
  role: string;
  email: string;
  tokenType: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export class JwtService {
  /**
   * Generate access token (15 minutes)
   */
  public static generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
      tokenType: 'access'
    };

    return jwt.sign(payload, jwtConfig.secret, {
      algorithm: jwtConfig.algorithm,
      expiresIn: jwtConfig.accessTokenExpiry,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
  }

  /**
   * Generate refresh token (7 days)
   */
  public static generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
      tokenType: 'refresh'
    };

    return jwt.sign(payload, jwtConfig.secret, {
      algorithm: jwtConfig.algorithm,
      expiresIn: jwtConfig.refreshTokenExpiry,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
  }

  /**
   * Verify token
   */
  public static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, jwtConfig.secret, {
        algorithms: [jwtConfig.algorithm], // ✅ Force algorithm (prevent algorithm confusion attack)
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      }) as TokenPayload;
    } catch (error) {
      Logger.error('Token verification failed:', error);
      throw new Error('Invalid token');
    }
  }

  /**
   * Decode token without verification (for reading claims)
   */
  public static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      Logger.error('Token decode failed:', error);
      return null;
    }
  }

  /**
   * Get token expiration timestamp
   */
  public static getTokenExpiration(token: string): number | null {
    const decoded = this.decodeToken(token);
    return decoded?.exp || null;
  }
}
```

### Authentication Middleware (httpOnly Cookies)

```typescript
// core/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { JwtService, TokenPayload } from '@/core/auth/jwt.service';
import { ResponseUtil } from '@/core/utils/response.util';
import { Logger } from '@/core/utils/logger.util';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authentication middleware - Reads token from httpOnly cookie
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Read access token from httpOnly cookie
    const token = req.cookies.accessToken;

    if (!token) {
      ResponseUtil.error(res, 'Authentication required', 401);
      return;
    }

    // Verify token
    const payload = JwtService.verifyToken(token);

    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    Logger.error('Authentication failed:', error);
    ResponseUtil.error(res, 'Invalid or expired token', 401);
  }
};

/**
 * Optional authentication - Doesn't fail if no token
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.accessToken;

    if (token) {
      const payload = JwtService.verifyToken(token);
      req.user = payload;
    }
    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};
```

### Auth Feature Implementation

```typescript
// features/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ResponseUtil } from '@/core/utils/response.util';
import { jwtConfig } from '@/config/jwt.config';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Login - Sets httpOnly cookies
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      // Set access token cookie (httpOnly - XSS protection)
      res.cookie('accessToken', result.accessToken, {
        ...jwtConfig.cookie,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      // Set refresh token cookie (httpOnly - XSS protection)
      res.cookie('refreshToken', result.refreshToken, {
        ...jwtConfig.cookie,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return user data (NO tokens in response body)
      ResponseUtil.success(
        res,
        {
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            name: result.user.name
          }
        },
        'Login successful'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout - Blacklist token and clear cookies
   */
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies.accessToken;
      
      if (token) {
        await this.authService.logout(token);
      }

      // Clear cookies
      res.clearCookie('accessToken', { ...jwtConfig.cookie });
      res.clearCookie('refreshToken', { ...jwtConfig.cookie });

      ResponseUtil.success(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token using refresh token
   */
  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        ResponseUtil.error(res, 'Refresh token required', 401);
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      // Set new access token cookie
      res.cookie('accessToken', result.accessToken, {
        ...jwtConfig.cookie,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      ResponseUtil.success(res, null, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user info
   */
  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        ResponseUtil.error(res, 'User not found', 401);
        return;
      }

      const user = await this.authService.getCurrentUser(userId);
      
      ResponseUtil.success(
        res,
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        },
        'User retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change password - Invalidates all tokens
   */
  public changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { oldPassword, newPassword } = req.body;

      if (!userId) {
        ResponseUtil.error(res, 'User not found', 401);
        return;
      }

      await this.authService.changePassword(userId, oldPassword, newPassword);

      // Clear current cookies (user must login again)
      res.clearCookie('accessToken', { ...jwtConfig.cookie });
      res.clearCookie('refreshToken', { ...jwtConfig.cookie });

      ResponseUtil.success(res, null, 'Password changed successfully. Please login again.');
    } catch (error) {
      next(error);
    }
  };
}
```

```typescript
// features/auth/auth.service.ts
import { UserRepository } from '@/features/users/users.repository';
import { User } from '@/features/users/users.types';
import { JwtService } from '@/core/auth/jwt.service';
import { TokenBlacklistService } from '@/core/auth/token-blacklist.service';
import { CryptoUtil } from '@/core/utils/crypto.util';
import { AppError } from '@/common/errors/app.error';
import { Logger } from '@/core/utils/logger.util';

export interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
}

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Login - Authenticate and generate tokens
   */
  public async login(email: string, password: string): Promise<LoginResult> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await CryptoUtil.comparePassword(password, user.password);
    
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new AppError('Account is inactive', 403);
    }

    // Generate tokens
    const accessToken = JwtService.generateAccessToken(user);
    const refreshToken = JwtService.generateRefreshToken(user);

    Logger.info(`User logged in: ${user.email}`);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  /**
   * Logout - Blacklist token
   */
  public async logout(token: string): Promise<void> {
    await TokenBlacklistService.blacklistToken(token);
    Logger.info('User logged out');
  }

  /**
   * Refresh access token
   */
  public async refreshToken(refreshToken: string): Promise<RefreshResult> {
    try {
      // Check if refresh token is blacklisted
      const isBlacklisted = await TokenBlacklistService.isBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new AppError('Refresh token has been revoked', 401);
      }

      // Verify refresh token
      const payload = JwtService.verifyToken(refreshToken);

      if (payload.tokenType !== 'refresh') {
        throw new AppError('Invalid token type', 401);
      }

      // Check if user tokens are invalidated
      const areTokensInvalidated = await TokenBlacklistService.areUserTokensInvalidated(payload.userId);
      if (areTokensInvalidated) {
        throw new AppError('All tokens have been invalidated. Please login again.', 401);
      }

      // Get user
      const user = await this.userRepository.findById(payload.userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.status !== 'active') {
        throw new AppError('Account is inactive', 403);
      }

      // Generate new access token
      const accessToken = JwtService.generateAccessToken(user);

      return { accessToken };
    } catch (error) {
      Logger.error('Token refresh failed:', error);
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  /**
   * Get current user
   */
  public async getCurrentUser(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Change password - Invalidate all tokens
   */
  public async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify old password
    const isValidPassword = await CryptoUtil.comparePassword(oldPassword, user.password);
    
    if (!isValidPassword) {
      throw new AppError('Invalid old password', 400);
    }

    // Hash new password
    const hashedPassword = await CryptoUtil.hashPassword(newPassword);

    // Update password
    await this.userRepository.update(userId, { password: hashedPassword } as any);

    // Invalidate all user tokens
    await TokenBlacklistService.blacklistUserTokens(userId);

    Logger.info(`Password changed for user: ${user.email}`);
  }
}
```

```typescript
// features/auth/auth.routes.ts
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '@/core/middleware/auth.middleware';
import { validateRequest } from '@/core/middleware/validator.middleware';
import { loginSchema, changePasswordSchema } from './auth.validator';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refresh);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);
router.post('/change-password', authMiddleware, validateRequest(changePasswordSchema), authController.changePassword);

export default router;
```

```typescript
// features/auth/auth.validator.ts
import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  })
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'any.required': 'Old password is required'
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'New password must be at least 8 characters',
    'any.required': 'New password is required'
  })
});
```

### Crypto Utility (Password Hashing)

```typescript
// core/utils/crypto.util.ts
import bcrypt from 'bcrypt';

export class CryptoUtil {
  private static SALT_ROUNDS = 12;

  /**
   * Hash password
   */
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

### Frontend Integration (Angular HttpClient)

```typescript
// Angular service example (for reference)
// auth.service.ts (Frontend)
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post('/api/v1/auth/login', { email, password }, {
      withCredentials: true // ✅ Required to send/receive cookies
    });
  }

  logout() {
    return this.http.post('/api/v1/auth/logout', {}, {
      withCredentials: true
    });
  }

  getCurrentUser() {
    return this.http.get('/api/v1/auth/me', {
      withCredentials: true
    });
  }
}

// HTTP Interceptor (Frontend)
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Clone request with credentials
    const authReq = req.clone({
      withCredentials: true // ✅ Automatically include cookies
    });
    return next.handle(authReq);
  }
}
```

### JWT Security Summary

**Complete Authentication Flow:**

```
1. Login (POST /api/v1/auth/login)
   ├─ Validate credentials
   ├─ Generate access token (15 min) + refresh token (7 days)
   ├─ Set httpOnly cookies (XSS protection)
   └─ Return user data (NO tokens in body)

2. Authenticated Request (GET /api/v1/claims)
   ├─ Read accessToken from httpOnly cookie
   ├─ Verify JWT signature (HS256)
   ├─ Check token expiry
   └─ Attach user to request

3. Token Refresh (POST /api/v1/auth/refresh)
   ├─ Read refreshToken from httpOnly cookie
   ├─ Verify refresh token
   ├─ Generate new access token
   └─ Set new accessToken cookie

4. Logout (POST /api/v1/auth/logout)
   ├─ Clear httpOnly cookies
   └─ Token remains valid until expiry (15 min max)

5. Password Change (POST /api/v1/auth/change-password)
   ├─ Update password in database
   ├─ Clear current cookies
   └─ User must re-login (tokens remain valid until expiry)
```

**Security Features:**

| Feature | Implementation | Protection | Status |
|---------|---------------|-----------|--------|
| **XSS Protection** | httpOnly cookies | JavaScript cannot access tokens | ✅ Active |
| **CSRF Protection** | SameSite=strict | Cookies only sent from same origin | ✅ Active |
| **SQL Injection** | Parameterized queries | QueryBuilder prevents injection | ✅ Active |
| **Token Theft** | Short expiry (15 min) | Limited damage window | ✅ Active |
| **Auto Token Refresh** | 7-day refresh token | Seamless user experience | ✅ Active |
| **Client-Side Logout** | Clear cookies | Tokens remain valid until expiry | ✅ Active |
| **Password Change** | Invalidate all sessions | All devices must re-login | ⚠️ Planned |
| **Algorithm Attack** | Force HS256 | Prevent algorithm confusion | ✅ Active |
| **HTTPS Only** | Secure cookies in prod | Cookies only over HTTPS | ✅ Active |

**Key Configuration:**
- **Algorithm**: HS256 (Symmetric)
- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- **Storage**: httpOnly cookies
- **Revocation**: Client-side cookie clearing (tokens valid until expiry)
- **Payload**: userId, username only (minimal for security)

**Performance:**
- JWT verify: ~0.5ms per request
- Total overhead: ~0.5ms per authenticated request

---

## 🔐 SECURITY & UTILITIES

### Response Utility

```typescript
// core/utils/response.util.ts
import { Response } from 'express';

export class ResponseUtil {
  public static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  public static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    errors?: any[]
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  public static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Success'
  ): Response {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    });
  }
}
```

### Error Middleware

```typescript
// core/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@/core/utils/logger.util';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  Logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || [],
    timestamp: new Date().toISOString()
  });
};
```

---

## 🚀 APPLICATION SETUP

### App.ts

```typescript
// src/app.ts
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './core/middleware/error.middleware';
import { connectionManager } from './core/database/connection-manager';
import { Logger } from './core/utils/logger.util';

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // CORS - Allow credentials for httpOnly cookies
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:4200',
      credentials: true // ✅ Required for cookies
    }));
    
    this.app.use(helmet());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser()); // ✅ Required to parse cookies
    this.app.use(morgan('combined'));
  }

  private initializeRoutes(): void {
    this.app.use('/api', routes);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async connectDatabase(): Promise<void> {
    try {
      await connectionManager.connect();
      Logger.info('Database connected successfully');
    } catch (error) {
      Logger.error('Database connection failed:', error);
      throw error;
    }
  }

  public async disconnectDatabase(): Promise<void> {
    await connectionManager.disconnect();
  }
}
```

### Server.ts

```typescript
// src/server.ts
import { App } from './app';
import { Logger } from './core/utils/logger.util';
import { config } from './config/app.config';

const app = new App();

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await app.connectDatabase();

    // Start server
    const PORT = config.port || 3000;
    app.app.listen(PORT, () => {
      Logger.info(`Server running on port ${PORT}`);
      Logger.info(`Environment: ${config.environment}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      Logger.info('SIGTERM received, closing server...');
      await app.disconnectDatabase();
      process.exit(0);
    });

  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

---

## 📋 CONFIGURATION

### Database Config

```typescript
// config/database.config.ts
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export const databaseConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'db_ccms',
  port: parseInt(process.env.DB_PORT || '1433'),
  encrypt: process.env.DB_ENCRYPT === 'true',
  trustServerCertificate: process.env.DB_TRUST_CERTIFICATE === 'true',
  
  // Connection pool settings
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000')
  }
};
```

### JWT Configuration

```typescript
// config/jwt.config.ts
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export const jwtConfig = {
  // HS256 - Symmetric key signing
  secret: process.env.JWT_SECRET || 'change-this-secret-in-production-min-32-chars',
  algorithm: 'HS256' as const,
  
  // Token expiration
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',  // 15 minutes
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d', // 7 days
  
  // Token issuer and audience
  issuer: 'ccms-api',
  audience: 'ccms-web',
  
  // Cookie settings (httpOnly - XSS protection)
  cookie: {
    httpOnly: true,           // ✅ Not accessible to JavaScript
    secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in production
    sameSite: 'strict' as const, // ✅ CSRF protection
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/'
  }
};
```

### TypeScript Configuration

**tsconfig.json** (Strict Mode - Recommended):
```json
{
  "compilerOptions": {
    // Language and Environment
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    
    // Module Resolution
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@core/*": ["src/core/*"],
      "@common/*": ["src/common/*"],
      "@features/*": ["src/features/*"],
      "@config/*": ["src/config/*"]
    },
    "resolveJsonModule": true,
    
    // Emit
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": true,
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    
    // Type Checking (STRICT MODE - Critical for type safety)
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    
    // Interop Constraints
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    
    // Completeness
    "skipLibCheck": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}
```

### Package.json with TypeScript Setup

```json
{
  "name": "ccms-backend-api",
  "version": "1.0.0",
  "description": "Claims & Case Management System - Backend API",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "dev:watch": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "build:clean": "rimraf dist && tsc",
    "start": "node dist/server.js",
    "start:prod": "NODE_ENV=production node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "type-check": "tsc --noEmit"
  },
  "keywords": ["ccms", "claims", "management", "api"],
  "author": "CCMS Team",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mssql": "^10.0.2",
    "dotenv": "^16.4.1",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "joi": "^17.12.0",
    "winston": "^3.11.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "cookie-parser": "^1.4.6",
    "express-rate-limit": "^7.1.5",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.5",
    "@types/express": "^4.17.21",
    "@types/mssql": "^9.1.4",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "@types/cookie-parser": "^1.4.6",
    "@types/compression": "^1.7.5",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "nodemon": "^3.0.3",
    "rimraf": "^5.0.5",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.4",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

### ESLint Configuration (.eslintrc.json)

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "plugins": ["@typescript-eslint"],
  "env": {
    "node": true,
    "es2022": true
  },
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/strict-boolean-expressions": "warn",
    "no-console": "warn"
  }
}
```

### Prettier Configuration (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Jest Configuration (jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1'
  }
};
```

### Development Workflow

**1. Initial Setup:**
```bash
# Clone repository
git clone <repository-url>
cd ccms-backend-api

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Create database
# Run SQL scripts to create tables
```

**2. Development:**
```bash
# Run in development mode (auto-restart on changes)
npm run dev

# Type checking without running
npm run type-check

# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format
```

**3. Building:**
```bash
# Build TypeScript to JavaScript
npm run build

# Clean build
npm run build:clean
```

**4. Production:**
```bash
# Build first
npm run build

# Run production server
npm start
# or
npm run start:prod
```

**5. Testing:**
```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### TypeScript Path Aliases

**Usage in code:**
```typescript
// Instead of: import { UserRepository } from '../../../features/users/users.repository';
// Use clean paths:
import { UserRepository } from '@features/users/users.repository';
import { QueryBuilder } from '@core/database/query-builder';
import { ResponseUtil } from '@core/utils/response.util';
import { commonValidators } from '@common/validators/common.validators';
import { databaseConfig } from '@config/database.config';
```

### Environment Configuration Strategy

#### Backend: Single .env File (Platform-Managed Variables)

**Approach**: Use ONE `.env` file for local development. UAT/Production environments use platform-managed environment variables (Azure App Service, AWS, Docker, etc.).

```
backend/
├── .env                    # Local development only (not committed)
└── .env.example           # Template (committed to Git)
```

**How It Works:**

```bash
# Local Development
# 1. Copy template and configure for local environment
cp .env.example .env
# 2. Edit .env with local settings (localhost, development database)
npm run dev

# UAT/Production Deployment
# - NO .env file needed
# - Environment variables set by hosting platform or CI/CD pipeline
# - Azure App Service → Application Settings
# - AWS → Environment Variables
# - Docker → docker-compose.yml or Docker environment variables
```

**Environment Files:**

**.env.example** (Template - Committed to Git):
```bash
# ============================================
# CCMS Backend API - Environment Template
# ============================================
# Copy this file to .env and configure for LOCAL DEVELOPMENT
# DO NOT commit .env files with actual credentials

# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database (MS SQL Server)
DB_USER=sa
DB_PASSWORD=your-password-here
DB_SERVER=localhost
DB_DATABASE=db_ccms
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_CERTIFICATE=true
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_POOL_IDLE_TIMEOUT=30000

# JWT Authentication (HS256)
JWT_SECRET=your-jwt-secret-key-min-32-chars-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cookies
COOKIE_DOMAIN=
FRONTEND_URL=http://localhost:4200

# CORS
CORS_ORIGIN=http://localhost:4200

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_PATH=./uploads

# Email (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@ccms.com
```

**.env** (Local Development - NOT Committed):
```bash
# ============================================
# LOCAL DEVELOPMENT ENVIRONMENT
# ============================================
# This file is for your local machine only
# Customize values below for your local setup

NODE_ENV=development
PORT=3000
API_VERSION=v1

DB_USER=sa
DB_PASSWORD=LocalDev123!
DB_SERVER=localhost
DB_DATABASE=ccms_dev
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_CERTIFICATE=true
DB_POOL_MAX=5
DB_POOL_MIN=1
DB_POOL_IDLE_TIMEOUT=30000

JWT_SECRET=dev-secret-key-not-for-production-use-only
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

COOKIE_DOMAIN=
FRONTEND_URL=http://localhost:4200

CORS_ORIGIN=http://localhost:4200

LOG_LEVEL=debug
LOG_FILE_PATH=./logs

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

MAX_FILE_SIZE_MB=10
UPLOAD_PATH=./uploads
```

**gitignore Configuration:**
```bash
# .gitignore
.env
node_modules/
dist/
logs/
uploads/

# Only commit template
!.env.example
```

---

### UAT/Production Environment Variables

**DON'T create .env.uat or .env.production files**. Instead, configure environment variables in your hosting platform:

#### Option 1: Azure App Service (Recommended for Azure)

**Azure Portal → App Service → Configuration → Application Settings:**

```plaintext
NODE_ENV = uat  (or production)
PORT = 8080
API_VERSION = v1

DB_USER = ccms_uat_user
DB_PASSWORD = [Secure Value - Hidden]
DB_SERVER = uat-sqlserver.database.windows.net
DB_DATABASE = ccms_uat
DB_PORT = 1433
DB_ENCRYPT = true
DB_TRUST_CERTIFICATE = false
DB_POOL_MAX = 10
DB_POOL_MIN = 2
DB_POOL_IDLE_TIMEOUT = 30000

JWT_SECRET = [Secure Value - Hidden - Min 64 chars]
JWT_ACCESS_EXPIRY = 15m
JWT_REFRESH_EXPIRY = 7d

COOKIE_DOMAIN = .company.com
FRONTEND_URL = https://ccms-uat.company.com

CORS_ORIGIN = https://ccms-uat.company.com

LOG_LEVEL = info
LOG_FILE_PATH = /home/LogFiles

RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100

MAX_FILE_SIZE_MB = 10
UPLOAD_PATH = /home/uploads
```

**Azure CLI Alternative:**
```bash
# Set environment variables via Azure CLI
az webapp config appsettings set --resource-group myResourceGroup --name ccms-api-uat --settings \
  NODE_ENV=uat \
  DB_SERVER=uat-sqlserver.database.windows.net \
  DB_DATABASE=ccms_uat \
  JWT_SECRET=your-secure-secret
```

#### Option 2: Docker/Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  ccms-api:
    image: ccms-backend:latest
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_USER: ccms_prod_user
      DB_PASSWORD: ${DB_PASSWORD}  # From .env or host environment
      DB_SERVER: prod-sqlserver.company.com
      DB_DATABASE: ccms_production
      DB_ENCRYPT: true
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: https://ccms.company.com
      CORS_ORIGIN: https://ccms.company.com
      LOG_LEVEL: warn
    volumes:
      - ./logs:/var/log/ccms
      - ./uploads:/var/ccms/uploads
    restart: unless-stopped
```

**Run with environment variables:**
```bash
# Pass secrets via environment variables
docker-compose up -d

# Or use .env file for Docker (NOT committed to Git)
# Docker Compose automatically reads .env in the same directory
echo "DB_PASSWORD=prod_password" >> .env
echo "JWT_SECRET=jwt_secret_here" >> .env
```

#### Option 3: AWS Elastic Beanstalk

**AWS Console → Elastic Beanstalk → Configuration → Software:**

Add environment variables through the console, or use `.ebextensions/environment.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
    DB_SERVER: prod-db.xxxxx.us-east-1.rds.amazonaws.com
    DB_DATABASE: ccms_production
    DB_ENCRYPT: true
    FRONTEND_URL: https://ccms.company.com
    LOG_LEVEL: warn
```

**AWS CLI:**
```bash
aws elasticbeanstalk update-environment \
  --environment-name ccms-api-production \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=NODE_ENV,Value=production \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_SERVER,Value=prod-db.xxxxx.rds.amazonaws.com
```

#### Option 4: CI/CD Pipeline (GitHub Actions, Azure DevOps, GitLab CI)

**GitHub Actions Example (.github/workflows/deploy-uat.yml):**
```yaml
name: Deploy to UAT

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: ccms-api-uat
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .
      
      # Environment variables are already set in Azure App Service
      # Secrets stored in GitHub Secrets
```

**Environment Variables from GitHub Secrets:**
- Repository → Settings → Secrets and variables → Actions
- Create secrets: `DB_PASSWORD`, `JWT_SECRET`
- Reference in workflow: `${{ secrets.DB_PASSWORD }}`

---

### How Environment Variables Are Loaded

**config/environment.ts:**
```typescript
// config/environment.ts
import dotenv from 'dotenv';

// Load .env file (only in local development)
// In UAT/Production, environment variables come from platform
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  
  database: {
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    server: process.env.DB_SERVER!,
    database: process.env.DB_DATABASE!,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERTIFICATE === 'true',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10)
    }
  },
  
  jwt: {
    secret: process.env.JWT_SECRET!,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  
  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_DATABASE',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}
```

**Usage in application:**
```typescript
// config/database.config.ts
import { env } from './environment';

export const databaseConfig = env.database;
```

```typescript
// config/jwt.config.ts
import { env } from './environment';

export const jwtConfig = {
  secret: env.jwt.secret,
  algorithm: 'HS256' as const,
  accessTokenExpiry: env.jwt.accessExpiry,
  refreshTokenExpiry: env.jwt.refreshExpiry,
  issuer: 'ccms-api',
  audience: 'ccms-web-app',
  cookie: {
    httpOnly: true,
    secure: env.nodeEnv === 'production', // HTTPS only in production
    sameSite: 'strict' as const,
    path: '/'
  }
};
```

---

### Deployment Checklist

#### Local Development
- [ ] Copy `.env.example` to `.env`
- [ ] Configure local database
- [ ] Use development JWT secret (can be simple)
- [ ] Run `npm run dev`

#### UAT Deployment
- [ ] Set all environment variables in Azure/AWS/Docker
- [ ] Use UAT database connection string
- [ ] Generate strong JWT secret (min 64 chars)
- [ ] Enable SSL/TLS for database (`DB_ENCRYPT=true`)
- [ ] Set `NODE_ENV=uat`
- [ ] Configure CORS for UAT frontend URL
- [ ] Set `LOG_LEVEL=info`
- [ ] Build and deploy: `npm run build && npm start`

#### Production Deployment
- [ ] Set all environment variables in Azure/AWS/Docker
- [ ] Use production database (high availability)
- [ ] Generate cryptographically secure JWT secret
- [ ] Enable SSL/TLS for all connections
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS for production frontend URL
- [ ] Set `LOG_LEVEL=warn` (only errors and warnings)
- [ ] Enable monitoring and APM
- [ ] Set up automated backups
- [ ] Configure secrets rotation schedule
- [ ] Build and deploy: `npm run build && npm run start:prod`

---

## 🎨 FRONTEND ENVIRONMENT CONFIGURATION (Angular)

### Frontend: Multiple Environment Files

**Location**: `frontend/src/environments/`

```
frontend/
└── src/
    └── environments/
        ├── environment.ts           # Local Development (default)
        ├── environment.uat.ts       # UAT
        └── environment.prod.ts      # Production
```

### Environment Files

**environment.ts** (Local Development):
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  environmentName: 'LOCAL',
  
  // API Configuration
  apiUrl: 'http://localhost:3000/api/v1',
  apiTimeout: 30000, // 30 seconds
  
  // Features
  enableDebugMode: true,
  enableMockData: false,
  enableConsoleLogging: true,
  
  // Authentication
  tokenRefreshInterval: 840000, // 14 minutes (refresh before 15 min expiry)
  sessionTimeoutWarning: 120000, // 2 minutes warning
  
  // File Upload
  maxFileSize: 10485760, // 10MB in bytes
  allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.png', '.xlsx'],
  
  // Pagination
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
  
  // UI Configuration
  appTitle: 'CCMS - Development',
  companyName: 'Company Name',
  supportEmail: 'dev-support@company.com',
  
  // External Services
  googleMapsApiKey: '',
  analyticsId: '',
  
  // Feature Flags
  features: {
    enableAdvancedSearch: true,
    enableBulkOperations: true,
    enableExportToPdf: true,
    enableNotifications: true,
    enableDarkMode: false
  },
  
  // Logging
  logLevel: 'debug',
  logToConsole: true,
  logToServer: false,
  
  // Cache
  cacheTimeout: 300000, // 5 minutes
  enableCaching: false
};
```

**environment.uat.ts** (UAT):
```typescript
// src/environments/environment.uat.ts
export const environment = {
  production: false,
  environmentName: 'UAT',
  
  // API Configuration
  apiUrl: 'https://api-uat.company.com/api/v1',
  apiTimeout: 30000,
  
  // Features
  enableDebugMode: true, // Keep debug enabled for UAT testing
  enableMockData: false,
  enableConsoleLogging: false, // Disable console logs in UAT
  
  // Authentication
  tokenRefreshInterval: 840000, // 14 minutes
  sessionTimeoutWarning: 120000,
  
  // File Upload
  maxFileSize: 10485760, // 10MB
  allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.png', '.xlsx'],
  
  // Pagination
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
  
  // UI Configuration
  appTitle: 'CCMS - UAT',
  companyName: 'Company Name',
  supportEmail: 'uat-support@company.com',
  
  // External Services
  googleMapsApiKey: 'UAT_GOOGLE_MAPS_API_KEY',
  analyticsId: 'UA-XXXXXXX-2', // UAT Analytics
  
  // Feature Flags
  features: {
    enableAdvancedSearch: true,
    enableBulkOperations: true,
    enableExportToPdf: true,
    enableNotifications: true,
    enableDarkMode: true
  },
  
  // Logging
  logLevel: 'info',
  logToConsole: false,
  logToServer: true, // Send logs to server in UAT
  
  // Cache
  cacheTimeout: 600000, // 10 minutes
  enableCaching: true
};
```

**environment.prod.ts** (Production):
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  environmentName: 'PRODUCTION',
  
  // API Configuration
  apiUrl: 'https://api.company.com/api/v1',
  apiTimeout: 30000,
  
  // Features
  enableDebugMode: false, // ⚠️ Must be false in production
  enableMockData: false,
  enableConsoleLogging: false, // ⚠️ Disable all console logs
  
  // Authentication
  tokenRefreshInterval: 840000, // 14 minutes
  sessionTimeoutWarning: 120000,
  
  // File Upload
  maxFileSize: 10485760, // 10MB
  allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.png', '.xlsx'],
  
  // Pagination
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
  
  // UI Configuration
  appTitle: 'CCMS',
  companyName: 'Company Name',
  supportEmail: 'support@company.com',
  
  // External Services
  googleMapsApiKey: 'PROD_GOOGLE_MAPS_API_KEY',
  analyticsId: 'UA-XXXXXXX-1', // Production Analytics
  
  // Feature Flags
  features: {
    enableAdvancedSearch: true,
    enableBulkOperations: true,
    enableExportToPdf: true,
    enableNotifications: true,
    enableDarkMode: true
  },
  
  // Logging
  logLevel: 'error', // Only log errors in production
  logToConsole: false,
  logToServer: true, // Send critical errors to monitoring service
  
  // Cache
  cacheTimeout: 900000, // 15 minutes
  enableCaching: true
};
```

### Angular Configuration (angular.json)

**Update Build Configurations:**

```json
{
  "projects": {
    "ccms-web-app": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              "optimization": true,
              "outputHashing": "all",
              "sourceMap": false,
              "namedChunks": false,
              "extractLicenses": true,
              "vendorChunk": false,
              "buildOptimizer": true,
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kb",
                  "maximumError": "1mb"
                }
              ]
            },
            "uat": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.uat.ts"
                }
              ],
              "optimization": true,
              "outputHashing": "all",
              "sourceMap": true,
              "namedChunks": false,
              "extractLicenses": true,
              "vendorChunk": false,
              "buildOptimizer": true
            },
            "development": {
              "optimization": false,
              "sourceMap": true,
              "namedChunks": true,
              "extractLicenses": false,
              "vendorChunk": true,
              "buildOptimizer": false
            }
          }
        },
        "serve": {
          "configurations": {
            "production": {
              "buildTarget": "ccms-web-app:build:production"
            },
            "uat": {
              "buildTarget": "ccms-web-app:build:uat"
            },
            "development": {
              "buildTarget": "ccms-web-app:build:development"
            }
          }
        }
      }
    }
  }
}
```

### Build Commands

**package.json Scripts:**
```json
{
  "scripts": {
    "start": "ng serve",
    "start:uat": "ng serve --configuration=uat",
    "start:prod": "ng serve --configuration=production",
    
    "build": "ng build",
    "build:uat": "ng build --configuration=uat",
    "build:prod": "ng build --configuration=production",
    
    "test": "ng test",
    "lint": "ng lint"
  }
}
```

**Usage:**
```bash
# Local Development
npm start
# or
ng serve

# UAT Build
npm run build:uat
# Output: dist/ccms-web-app (with UAT config)

# Production Build
npm run build:prod
# Output: dist/ccms-web-app (with Production config)
```

### Using Environment in Angular Code

**Import and Use:**
```typescript
// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl; // ✅ Automatically switches based on build

  constructor(private http: HttpClient) {
    if (environment.enableDebugMode) {
      console.log(`API URL: ${this.apiUrl}`);
      console.log(`Environment: ${environment.environmentName}`);
    }
  }

  login(email: string, password: string) {
    return this.http.post(`${this.apiUrl}/auth/login`, 
      { email, password }, 
      { 
        withCredentials: true,
        timeout: environment.apiTimeout 
      }
    );
  }

  getClaims(page: number = 1, limit: number = environment.defaultPageSize) {
    return this.http.get(`${this.apiUrl}/claims`, {
      params: { page, limit },
      withCredentials: true
    });
  }
}
```

**Feature Flag Example:**
```typescript
// src/app/features/claims/claims.component.ts
import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-claims',
  templateUrl: './claims.component.html'
})
export class ClaimsComponent {
  canExportPdf = environment.features.enableExportToPdf;
  canBulkEdit = environment.features.enableBulkOperations;

  exportToPdf() {
    if (!this.canExportPdf) {
      console.warn('PDF export is disabled in this environment');
      return;
    }
    // Export logic
  }
}
```

**Conditional Debug Logging:**
```typescript
// src/app/core/utils/logger.util.ts
import { environment } from '../../../environments/environment';

export class Logger {
  static debug(message: string, ...args: any[]) {
    if (environment.enableConsoleLogging && environment.logLevel === 'debug') {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  static info(message: string, ...args: any[]) {
    if (environment.enableConsoleLogging) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  static error(message: string, ...args: any[]) {
    console.error(`[ERROR] ${message}`, ...args);
    
    if (environment.logToServer) {
      // Send to monitoring service
      this.sendToServer('error', message, args);
    }
  }

  private static sendToServer(level: string, message: string, data: any) {
    // Send logs to backend monitoring endpoint
  }
}
```

### Frontend Deployment Strategy

**Deployment Workflow:**

```bash
# 1. UAT Deployment
npm run build:uat
# Deploy dist/ folder to UAT server
# Frontend URL: https://ccms-uat.company.com
# API URL: https://api-uat.company.com/api/v1

# 2. Production Deployment
npm run build:prod
# Deploy dist/ folder to Production server
# Frontend URL: https://ccms.company.com
# API URL: https://api.company.com/api/v1
```

**Docker Deployment Example:**
```dockerfile
# Dockerfile (Multi-stage for Angular)
FROM node:20 AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Build for specific environment (ARG)
ARG ENVIRONMENT=production
RUN npm run build:${ENVIRONMENT}

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist/ccms-web-app /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build for UAT
docker build --build-arg ENVIRONMENT=uat -t ccms-frontend:uat .

# Build for Production
docker build --build-arg ENVIRONMENT=production -t ccms-frontend:prod .
```

---

## 🔒 ENVIRONMENT SECURITY BEST PRACTICES

### Backend (.env)

1. **Never commit .env files to Git**
   ```bash
   # .gitignore
   .env
   .env.local
   .env.uat
   .env.production
   ```

2. **Use strong secrets in production**
   ```bash
   # Generate secure JWT secret
   openssl rand -base64 64
   ```

3. **Rotate secrets regularly**
   - JWT secrets: Every 6 months
   - Database passwords: Every 3 months

4. **Use environment variable management**
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault

### Frontend (environment.ts)

1. **Never store secrets in frontend**
   - ❌ No API keys that should be server-side
   - ❌ No database credentials
   - ❌ No sensitive tokens

2. **Public API keys only**
   - ✅ Google Maps API Key (with domain restriction)
   - ✅ Analytics ID (public anyway)
   - ✅ Feature flags

3. **Frontend files ARE public**
   - Anyone can view source code
   - Only include public configuration
   - Sensitive operations must be backend

---

## 📦 ENVIRONMENT SUMMARY

| Aspect | Backend | Frontend |
|--------|---------|----------|
| **Files** | Single `.env` (local only) | Multiple `.ts` files |
| **Local Dev** | `.env` file with local settings | `environment.ts` (default) |
| **UAT** | Platform environment variables (Azure/AWS/Docker) | `ng build --configuration=uat` |
| **Production** | Platform environment variables (Azure/AWS/Docker) | `ng build --configuration=production` |
| **Switching** | Set via hosting platform or CI/CD | Build configuration in `angular.json` |
| **Secrets** | ✅ Can store secrets (platform-managed) | ❌ NO secrets ever |
| **Git Commit** | ❌ Never commit `.env` | ✅ All environment files committed |
| **Deployment** | Environment variables injected by platform | Build once per environment |

**Key Difference:**
- **Backend**: ONE `.env` file for local dev only. UAT/Production use platform-managed environment variables (no .env files needed on servers).
- **Frontend**: Multiple environment files (`environment.ts`, `environment.uat.ts`, `environment.prod.ts`) committed to Git, replaced during build.

---

## 🎯 KEY BENEFITS OF THIS ARCHITECTURE

### 1. Database Technology Independence
**Change database in 3 steps:**
1. Install new database driver (e.g., `pg` for PostgreSQL)
2. Create new implementation of `IDatabase` interface
3. Update database config

```typescript
// Just change this one line:
export const database = new PostgresDatabase(); // Instead of MsSqlDatabase
// Entire app now uses PostgreSQL!
```

### 2. SQL Injection Prevention
**All queries automatically parameterized:**
- QueryBuilder ensures all values are parameterized
- No string concatenation in SQL
- Safe from injection attacks

### 3. Single Point of Control
- **Database Connection**: Change in `ConnectionManager` → affects entire app
- **Transaction Logic**: Change in `TransactionManager` → all transactions updated
- **Query Building**: Change in `QueryBuilder` → all queries updated

### 4. Easy Testing
- Mock `IDatabase` interface for unit tests
- Test repositories without real database
- Test services without repositories

### 5. Maintainability
- Clear layer separation
- No cross-layer dependencies
- Easy to locate and fix bugs
- Consistent patterns across features

### 6. TypeScript Type Safety
**Zero Runtime Overhead, Maximum Development Safety:**
- **Compile-Time Error Detection**: Catch 15-20% more bugs before runtime
- **IDE Autocomplete**: IntelliSense for all methods, properties, and parameters
- **Refactoring Safety**: Rename symbols with confidence - compiler catches all usages
- **Self-Documenting Code**: Type signatures serve as inline documentation
- **Production Performance**: TypeScript compiles to JavaScript - identical bundle size, memory usage, and speed
- **Strict Mode Enabled**: Eliminates `null`/`undefined` errors with strict null checks

```typescript
// TypeScript catches this at compile time:
const user: User = await userService.findById(123);
console.log(user.emaill); // ❌ Error: Property 'emaill' does not exist. Did you mean 'email'?

// JavaScript only fails at runtime:
const user = await userService.findById(123);
console.log(user.emaill); // ✅ No error until runtime → undefined
```

**Development Benefits:**
- 1-5 second compilation delay during development (using ts-node-dev hot reload)
- Zero production penalty - compiled JavaScript is identical to hand-written JS
- Team collaboration improved with explicit contracts (interfaces)
- Reduced debugging time - many errors caught before `npm run dev`

---

## 📚 ARCHITECTURE SUMMARY

### Commonization Checklist ✅

Before creating any database code, ask:

1. **Is this a CRUD operation?**
   - ✅ Extend `BaseRepository<T>` - don't rewrite CRUD logic

2. **Is this a database query?**
   - ✅ Use `QueryBuilder` - never write raw SQL with string concatenation
   - ✅ Use parameters - prevents SQL injection

3. **Is this a transaction?**
   - ✅ Use `TransactionManager.execute()` - automatic rollback on error

4. **Is this a new database technology?**
   - ✅ Implement `IDatabase` interface - don't change existing code

5. **Is this business logic?**
   - ✅ Put in Service layer - keep Controllers thin

### Layer Communication Rules

| Layer | Can Talk To | Cannot Talk To |
|-------|-------------|----------------|
| Controller | Service, Middleware | Repository, Database |
| Service | Repository, Utils | Database, Controller |
| Repository | Database, QueryBuilder | Controller, Service |

### File Organization Quick Reference

```
✅ DO:
- Use QueryBuilder for ALL queries
- Extend BaseRepository for entities
- Put business logic in Services
- Use TransactionManager for multi-step operations
- Implement IDatabase for new DB technologies

❌ DON'T:
- Write raw SQL with string concatenation
- Put business logic in Controllers
- Access database directly from Services
- Skip parameter binding in queries
- Hard-code database-specific syntax in repositories
```

### Maintenance Workflow

**When you need to:**

| Task | Location | Effect |
|------|----------|--------|
| Change DB technology | Implement `IDatabase`, update config | Entire app switches |
| Add query protection | Update `QueryBuilder` | All queries protected |
| Change connection pool | Update `ConnectionManager` | All connections updated |
| Add transaction logic | Update `TransactionManager` | All transactions updated |
| Fix SQL injection | Update `QueryBuilder` parameter binding | All queries fixed |
| Add new entity | Extend `BaseRepository<T>` | CRUD operations ready |

---

## 🚀 QUICK START GUIDE

### Step 1: Initialize Project

```bash
# Create project directory
mkdir ccms-backend-api
cd ccms-backend-api

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express mssql dotenv jsonwebtoken bcrypt joi winston cors helmet morgan cookie-parser compression express-rate-limit

# Install TypeScript and dev dependencies
npm install -D typescript @types/node @types/express @types/mssql @types/jsonwebtoken @types/bcrypt @types/cors @types/morgan @types/cookie-parser @types/compression ts-node-dev nodemon rimraf @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint prettier jest @types/jest ts-jest

# Initialize TypeScript
npx tsc --init
```

### Step 2: Setup Project Structure

```bash
# Create folder structure (including auth core folder)
mkdir -p src/{config,core/{auth,database/{implementations},base,middleware,utils},common/{validators,middleware,types,errors},features/{auth,users},routes}

# Create files
touch src/server.ts
touch src/app.ts
touch .env
touch .env.example
```

### Step 3: Configure TypeScript (tsconfig.json)

Copy the TypeScript configuration from the Configuration section above.

### Step 4: Setup Environment Variables (.env)

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DB_USER=sa
DB_PASSWORD=YourPassword123
DB_SERVER=localhost
DB_DATABASE=db_ccms
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_CERTIFICATE=true
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_POOL_IDLE_TIMEOUT=30000

# JWT Authentication (HS256)
JWT_SECRET=your-jwt-secret-key-change-in-production-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cookies
COOKIE_DOMAIN=
FRONTEND_URL=http://localhost:4200

# Logging
LOG_LEVEL=debug
```

### Step 5: Create Database Connection

Follow the **ConnectionManager** implementation from the Configuration section.

### Step 6: Implement JWT Authentication

```bash
# Create auth core services
touch src/core/auth/jwt.service.ts
touch src/core/middleware/auth.middleware.ts
touch src/core/utils/crypto.util.ts

# Create auth feature
mkdir -p src/features/auth
touch src/features/auth/{auth.controller.ts,auth.service.ts,auth.routes.ts,auth.validator.ts}
```

**Implementation order:**
1. `core/utils/crypto.util.ts` - Password hashing utilities
2. `config/jwt.config.ts` - JWT configuration
3. `core/auth/jwt.service.ts` - Token generation/verification
4. `core/middleware/auth.middleware.ts` - Auth middleware
5. `features/auth/auth.service.ts` - Auth business logic
6. `features/auth/auth.controller.ts` - Login/logout/refresh endpoints
7. `features/auth/auth.routes.ts` - Auth routes

**Reference**: See complete code in the **JWT Authentication & Security** section above.

### Step 7: Create First Feature (Example: Users)

```bash
# Create users feature structure
mkdir -p src/features/users
touch src/features/users/{users.types.ts,users.repository.ts,users.service.ts,users.controller.ts,users.routes.ts,users.validator.ts}
```

**Key files to implement (in order):**
1. `users.types.ts` - Define User interface
2. `users.repository.ts` - Extend BaseRepository<User>
3. `users.service.ts` - Extend BaseService<User> with business logic
4. `users.controller.ts` - Extend BaseController<User> with HTTP handlers
5. `users.routes.ts` - Define routes and middleware
6. `users.validator.ts` - Define Joi validation schemas

### Step 8: Run Development Server

```bash
# Add to package.json scripts:
# "dev": "ts-node-dev --respawn --transpile-only src/server.ts"

npm run dev

# Server should start at http://localhost:3000
```

### Step 9: Test API

```bash
# Health check
curl http://localhost:3000/api/health

# Login (get httpOnly cookies)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  -c cookies.txt  # Save cookies

# Get current user (using saved cookies)
curl http://localhost:3000/api/v1/auth/me \
  -b cookies.txt  # Load cookies

# Create user (authenticated request)
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}' \
  -b cookies.txt  # Include auth cookie

# Logout
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -b cookies.txt

# Refresh token
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -b cookies.txt
```

**Using Postman/Thunder Client:**
1. Enable "Automatically follow redirects"
2. Enable "Save cookies"  
3. Login once - cookies automatically sent with subsequent requests

### TypeScript Development Tips

**1. Use Strict Mode** (already configured in tsconfig.json)
```typescript
// Compiler will catch these errors:
let user: User | null = getUserById('123');
console.log(user.name); // ❌ Error: Object is possibly 'null'

// Must handle null:
console.log(user?.name); // ✅ Safe
```

**2. Use Path Aliases**
```typescript
// Instead of relative paths:
import { UserRepository } from '../../../features/users/users.repository';

// Use clean aliases:
import { UserRepository } from '@features/users/users.repository';
```

**3. Type Your Database Results**
```typescript
// Always specify return type:
const users = await database.findMany<User>(query, params);
// Now 'users' has full User type information
```

**4. Use Generics for Reusability**
```typescript
// Base repository works for any entity:
class UserRepository extends BaseRepository<User> { }
class ClaimRepository extends BaseRepository<Claim> { }
```

**5. Let TypeScript Infer When Possible**
```typescript
// Don't over-annotate:
const users: User[] = await repository.findAll(); // Redundant

// TypeScript already knows:
const users = await repository.findAll(); // users is User[]
```

### Common TypeScript Patterns in CCMS

**1. Optional Chaining**
```typescript
const email = user?.profile?.email ?? 'not-provided@example.com';
```

**2. Type Guards**
```typescript
function isUser(obj: any): obj is User {
  return 'id' in obj && 'email' in obj;
}

if (isUser(data)) {
  // TypeScript knows data is User here
  console.log(data.email);
}
```

**3. Utility Types**
```typescript
// Partial - make all properties optional
const updateData: Partial<User> = { name: 'New Name' };

// Pick - select specific properties
type UserCredentials = Pick<User, 'email' | 'password'>;

// Omit - exclude specific properties
type UserWithoutPassword = Omit<User, 'password'>;

// Record - create object type
type UserRoles = Record<string, string[]>;
```

**4. Async/Await with Types**
```typescript
async function getUser(id: string): Promise<User | null> {
  return await userRepository.findById(id);
}
```

### Debugging TypeScript in VS Code

**launch.json (for debugging):**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug TypeScript",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/src/server.ts"],
      "cwd": "${workspaceFolder}",
      "protocol": "inspector",
      "sourceMaps": true
    }
  ]
}
```

### Next Steps

1. ✅ Setup project structure
2. ✅ Configure TypeScript
3. ✅ Implement database layer (ConnectionManager, QueryBuilder, BaseRepository)
4. ✅ Create base classes (BaseController, BaseService, BaseRepository)
5. ✅ Implement authentication feature
6. ✅ Add middleware (auth, error handling, validation)
7. ✅ Create user management feature
8. ✅ Implement claims management features
9. ✅ Add role-based access control
10. ✅ Write tests
11. ✅ Setup CI/CD
12. ✅ Deploy to production

---

**This architecture ensures CCMS backend remains secure, maintainable, scalable, and database-technology independent as requirements evolve.**
