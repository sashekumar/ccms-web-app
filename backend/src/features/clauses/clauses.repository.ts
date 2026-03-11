import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { Clause, ClauseListItem, ClauseFilters, PaginatedClauses } from './clauses.types';
import { BaseRepository } from '../../core/base/base.repository';

export class ClausesRepository extends BaseRepository<Clause> {
  constructor() {
    super(DB_TABLES.CLAUSES, 'clause_id', false);
  }
  /**
   * Get paginated list of clauses with filters
   */
  public async getClauses(filters: ClauseFilters): Promise<PaginatedClauses> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereClauses: string[] = [];

    if (filters.search) {
      whereClauses.push(`(clause_code LIKE @search OR clause_text LIKE @search)`);
      request.input('search', sql.NVarChar(sql.MAX), `%${filters.search}%`);
    }

    if (filters.is_active !== undefined) {
      whereClauses.push('is_active = @isActive');
      request.input('isActive', sql.Bit, filters.is_active);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Sorting
    const sortBy = filters.sort_by || 'clause_id';
    const sortOrder = filters.sort_order || 'DESC';
    const orderBy = `ORDER BY ${sortBy} ${sortOrder}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${DB_TABLES.CLAUSES}
      ${whereClause}
    `;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    // Get clauses
    const query = `
      SELECT 
        clause_id,
        legacy_config_id,
        clause_category,
        clause_code,
        clause_text,
        is_active
      FROM ${DB_TABLES.CLAUSES}
      ${whereClause}
      ${orderBy}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    const clauses: ClauseListItem[] = result.recordset.map((row: any) => ({
      clause_id: row.clause_id,
      clause_code: row.clause_code,
      clause_text: row.clause_text,
      is_active: row.is_active
    }));

    return {
      clauses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get clause by ID
   */
  public async getClauseById(clauseId: number): Promise<Clause | null> {
    return await this.findById(clauseId);
  }

  /**
   * Check if clause code exists
   */
  public async clauseCodeExists(clauseCode: string, excludeClauseId?: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    let query = `
      SELECT COUNT(*) as count 
      FROM ${DB_TABLES.CLAUSES} 
      WHERE clause_code = @clauseCode
    `;

    if (excludeClauseId) {
      query += ' AND clause_id != @excludeClauseId';
      request.input('excludeClauseId', sql.BigInt, excludeClauseId);
    }

    request.input('clauseCode', sql.VarChar(50), clauseCode);
    const result = await request.query(query);

    return result.recordset[0].count > 0;
  }

  /**
   * Create new clause
   */
  public async createClause(
    clauseCode: string,
    clauseText: string,
    isActive: boolean,
    createdBy: string,
    clauseCategory?: string
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('clauseCode', sql.VarChar(20), clauseCode)
      .input('clauseText', sql.NVarChar(sql.MAX), clauseText)
      .input('isActive', sql.Bit, isActive)
      .input('createdBy', sql.VarChar(50), createdBy);
    
    let query: string;
    
    if (clauseCategory) {
      request.input('clauseCategory', sql.VarChar(50), clauseCategory);
      
      query = `
        INSERT INTO ${DB_TABLES.CLAUSES} (
          clause_code, clause_text, is_active, created_by, clause_category
        )
        OUTPUT INSERTED.clause_id
        VALUES (
          @clauseCode, @clauseText, @isActive, @createdBy, @clauseCategory
        )
      `;
    } else {
      query = `
        INSERT INTO ${DB_TABLES.CLAUSES} (
          clause_code, clause_text, is_active, created_by
        )
        OUTPUT INSERTED.clause_id
        VALUES (
          @clauseCode, @clauseText, @isActive, @createdBy
        )
      `;
    }
    
    const result = await request.query(query);
    return result.recordset[0].clause_id;
  }

  /**
   * Update clause
   */
  public async updateClause(
    clauseId: number,
    clauseCode: string | undefined,
    clauseText: string | undefined,
    isActive: boolean | undefined,
    updatedBy: string
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (clauseCode !== undefined) {
      updates.push('clause_code = @clauseCode');
      request.input('clauseCode', sql.VarChar(20), clauseCode);
    }

    if (clauseText !== undefined) {
      updates.push('clause_text = @clauseText');
      request.input('clauseText', sql.NVarChar(sql.MAX), clauseText);
    }

    if (isActive !== undefined) {
      updates.push('is_active = @isActive');
      request.input('isActive', sql.Bit, isActive);
    }

    if (updates.length === 0) {
      return; // Nothing to update
    }

    // Add audit fields
    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');
    request.input('updatedBy', sql.VarChar(50), updatedBy);

    request.input('clauseId', sql.BigInt, clauseId);

    await request.query(`
      UPDATE ${DB_TABLES.CLAUSES}
      SET ${updates.join(', ')}
      WHERE clause_id = @clauseId
    `);
  }

  /**
   * Delete clause (soft delete - deactivate)
   */
  public async deleteClause(clauseId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('clauseId', sql.BigInt, clauseId)
      .query(`
        UPDATE ${DB_TABLES.CLAUSES}
        SET is_active = 0
        WHERE clause_id = @clauseId
      `);
  }
}
