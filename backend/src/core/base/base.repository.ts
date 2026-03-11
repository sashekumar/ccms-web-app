import sql from 'mssql';
import { connectionManager } from '../database/connection-manager';

/**
 * Query options for repository methods
 */
export interface QueryOptions {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  filters?: Record<string, unknown>;
}

/**
 * Base Repository Pattern
 * Provides common CRUD operations for all repositories
 * Eliminates code duplication across feature repositories
 * 
 * @template T - The entity type this repository works with
 */
export abstract class BaseRepository<T> {
  protected tableName: string;
  protected primaryKey: string;
  protected useSoftDelete: boolean;

  /**
   * @param tableName - Database table name
   * @param primaryKey - Primary key column name (default: 'id')
   * @param useSoftDelete - Whether to use soft delete (is_deleted column) or hard delete (default: true)
   */
  constructor(tableName: string, primaryKey: string = 'id', useSoftDelete: boolean = false) {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.useSoftDelete = useSoftDelete;
  }

  /**
   * Find all records with optional filters and pagination
   */
  public async findAll(options?: QueryOptions): Promise<T[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    // Build WHERE clause
    const whereClauses: string[] = [];
    
    if (this.useSoftDelete) {
      whereClauses.push('is_deleted = 0');
    }

    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          whereClauses.push(`${key} = @${key}`);
          request.input(key, value);
        }
      });
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Sorting
    const sortBy = options?.sort_by || this.primaryKey;
    const sortOrder = options?.sort_order || 'DESC';
    const orderBy = `ORDER BY ${sortBy} ${sortOrder}`;

    // Pagination
    let paginationClause = '';
    if (options?.page && options?.limit) {
      const offset = (options.page - 1) * options.limit;
      request.input('offset', sql.Int, offset);
      request.input('limit', sql.Int, options.limit);
      paginationClause = 'OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    }

    const query = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ${orderBy}
      ${paginationClause}
    `;

    const result = await request.query(query);
    return result.recordset as T[];
  }

  /**
   * Find a single record by primary key
   */
  public async findById(id: string | number): Promise<T | null> {
    const pool = await connectionManager.getPool();
    const whereClauses: string[] = [`${this.primaryKey} = @id`];
    
    if (this.useSoftDelete) {
      whereClauses.push('is_deleted = 0');
    }
    
    const result = await pool.request()
      .input('id', id)
      .query(`
        SELECT * FROM ${this.tableName}
        WHERE ${whereClauses.join(' AND ')}
      `);

    return result.recordset[0] || null;
  }

  /**
   * Find a single record by conditions
   */
  public async findOne(conditions: Record<string, unknown>): Promise<T | null> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const whereClauses: string[] = [];
    
    if (this.useSoftDelete) {
      whereClauses.push('is_deleted = 0');
    }

    Object.entries(conditions).forEach(([key, value]) => {
      whereClauses.push(`${key} = @${key}`);
      request.input(key, value);
    });

    const whereClause = whereClauses.join(' AND ');

    const result = await request.query(`
      SELECT TOP 1 * FROM ${this.tableName}
      WHERE ${whereClause}
    `);

    return result.recordset[0] || null;
  }

  /**
   * Create a new record
   * @param data - Record data to insert
   * @param createdBy - Username of the user creating the record
   */
  public async create(data: Partial<T>, createdBy?: string): Promise<T> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const columns: string[] = [];
    const values: string[] = [];

    Object.entries(data).forEach(([key, value]) => {
      columns.push(key);
      values.push(`@${key}`);
      request.input(key, value);
    });

    // Add audit fields
    columns.push('created_at');
    values.push('GETDATE()');
    
    if (createdBy) {
      columns.push('created_by');
      values.push('@created_by');
      request.input('created_by', sql.VarChar(50), createdBy);
    }
    
    if (this.useSoftDelete) {
      columns.push('is_deleted');
      values.push('0');
    }

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      OUTPUT INSERTED.*
      VALUES (${values.join(', ')})
    `;

    const result = await request.query(query);
    return result.recordset[0] as T;
  }

  /**
   * Update a record by primary key
   * @param id - Primary key value
   * @param data - Record data to update
   * @param updatedBy - Username of the user updating the record
   */
  public async update(id: string | number, data: Partial<T>, updatedBy?: string): Promise<T> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const setClauses: string[] = [];

    Object.entries(data).forEach(([key, value]) => {
      setClauses.push(`${key} = @${key}`);
      request.input(key, value);
    });

    // Update audit fields
    setClauses.push('updated_at = GETDATE()');
    
    if (updatedBy) {
      setClauses.push('updated_by = @updated_by');
      request.input('updated_by', sql.VarChar(50), updatedBy);
    }

    request.input('id', id);
    
    const whereClauses: string[] = [`${this.primaryKey} = @id`];
    if (this.useSoftDelete) {
      whereClauses.push('is_deleted = 0');
    }

    const query = `
      UPDATE ${this.tableName}
      SET ${setClauses.join(', ')}
      OUTPUT INSERTED.*
      WHERE ${whereClauses.join(' AND ')}
    `;

    const result = await request.query(query);
    return result.recordset[0] as T;
  }

  /**
   * Soft delete a record by primary key (or hard delete if useSoftDelete is false)
   */
  public async delete(id: string | number): Promise<void> {
    const pool = await connectionManager.getPool();
    
    if (this.useSoftDelete) {
      // Soft delete
      await pool.request()
        .input('id', id)
        .query(`
          UPDATE ${this.tableName}
          SET is_deleted = 1, updated_at = GETDATE()
          WHERE ${this.primaryKey} = @id
        `);
    } else {
      // Hard delete
      await pool.request()
        .input('id', id)
        .query(`
          DELETE FROM ${this.tableName}
          WHERE ${this.primaryKey} = @id
        `);
    }
  }

  /**
   * Count total records with optional filters
   */
  public async count(filters?: Record<string, unknown>): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const whereClauses: string[] = [];
    
    if (this.useSoftDelete) {
      whereClauses.push('is_deleted = 0');
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          whereClauses.push(`${key} = @${key}`);
          request.input(key, value);
        }
      });
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await pool.request().query(`
      SELECT COUNT(*) as total FROM ${this.tableName}
      ${whereClause}
    `);

    return result.recordset[0].total;
  }

  /**
   * Check if a record exists by primary key
   */
  public async exists(id: string | number): Promise<boolean> {
    const record = await this.findById(id);
    return record !== null;
  }

  /**
   * Execute custom query with parameters
   * Use this for complex queries not covered by base methods
   */
  protected async executeQuery<R = unknown>(
    query: string,
    parameters?: Record<string, unknown>
  ): Promise<R[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (parameters) {
      Object.entries(parameters).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.query(query);
    return result.recordset as R[];
  }

  /**
   * Execute stored procedure
   */
  protected async executeProcedure<R = unknown>(
    procedureName: string,
    parameters?: Record<string, unknown>
  ): Promise<R[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (parameters) {
      Object.entries(parameters).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.execute(procedureName);
    return result.recordset as R[];
  }
}
