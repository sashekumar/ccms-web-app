import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import {
  LookupCategory,
  LookupCategoryListItem,
  LookupCategoryFilters,
  PaginatedLookupCategories,
  Lookup,
  LookupListItem,
  LookupFilters,
  PaginatedLookups,
  LookupMetadata,
  LookupMetadataListItem,
  LookupMetadataFilters,
  PaginatedLookupMetadata
} from './lookups.types';

export class LookupsRepository {
  // ========================================================================
  // LOOKUP CATEGORIES
  // ========================================================================

  /**
   * Get paginated list of lookup categories with filters
   */
  public async getLookupCategories(filters: LookupCategoryFilters): Promise<PaginatedLookupCategories> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];

    if (filters.search) {
      whereClauses.push(`(lc.category_name LIKE @search OR lc.description LIKE @search)`);
      request.input('search', sql.NVarChar(500), `%${filters.search}%`);
    }

    if (filters.is_active !== undefined) {
      whereClauses.push('lc.is_active = @isActive');
      request.input('isActive', sql.Bit, filters.is_active);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sortBy = filters.sort_by || 'category_id';
    const sortOrder = filters.sort_order || 'DESC';
    const orderBy = `ORDER BY lc.${sortBy} ${sortOrder}`;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${DB_TABLES.LOOKUP_CATEGORIES} lc
      ${whereClause}
    `;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    const query = `
      SELECT 
        lc.category_id,
        lc.category_name,
        lc.description,
        lc.is_active,
        COUNT(l.lookup_id) as lookup_count
      FROM ${DB_TABLES.LOOKUP_CATEGORIES} lc
      LEFT JOIN ${DB_TABLES.LOOKUPS} l ON lc.category_id = l.category_id
      ${whereClause}
      GROUP BY lc.category_id, lc.category_name, lc.description, lc.is_active
      ${orderBy}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    const categories: LookupCategoryListItem[] = result.recordset.map((row: any) => ({
      category_id: row.category_id,
      category_name: row.category_name,
      description: row.description,
      is_active: row.is_active,
      lookup_count: row.lookup_count
    }));

    return {
      categories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get lookup category by ID
   */
  public async getLookupCategoryById(categoryId: number): Promise<LookupCategory | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('categoryId', sql.BigInt, categoryId)
      .query(`
        SELECT * FROM ${DB_TABLES.LOOKUP_CATEGORIES}
        WHERE category_id = @categoryId
      `);

    return result.recordset[0] || null;
  }

  /**
   * Check if category name exists
   */
  public async categoryNameExists(categoryName: string, excludeCategoryId?: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    let query = `
      SELECT COUNT(*) as count 
      FROM ${DB_TABLES.LOOKUP_CATEGORIES} 
      WHERE category_name = @categoryName
    `;

    if (excludeCategoryId) {
      query += ' AND category_id != @excludeCategoryId';
      request.input('excludeCategoryId', sql.Int, excludeCategoryId);
    }

    request.input('categoryName', sql.NVarChar(100), categoryName);
    const result = await request.query(query);

    return result.recordset[0].count > 0;
  }

  /**
   * Get next sort order for a category
   */
  public async getNextSortOrder(categoryId: number): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .query(`
        SELECT ISNULL(MAX(sort_order), 0) + 1 as next_sort_order
        FROM ${DB_TABLES.LOOKUPS}
        WHERE category_id = @categoryId
      `);

    return result.recordset[0].next_sort_order;
  }

  /**
   * Create new lookup category
   */
  public async createLookupCategory(
    categoryName: string,
    description: string | undefined,
    isActive: boolean,
    createdBy: string
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('categoryName', sql.NVarChar(100), categoryName)
      .input('description', sql.NVarChar(255), description || null)
      .input('isActive', sql.Bit, isActive)
      .input('createdBy', sql.VarChar(50), createdBy);

    const result = await request.query(`
        INSERT INTO ${DB_TABLES.LOOKUP_CATEGORIES} (
          category_name, description, is_active, created_by
        )
        OUTPUT INSERTED.category_id
        VALUES (
          @categoryName, @description, @isActive, @createdBy
        )
      `);

    return result.recordset[0].category_id;
  }

  /**
   * Update lookup category
   */
  public async updateLookupCategory(
    categoryId: number,
    categoryName: string | undefined,
    description: string |undefined,
    isActive: boolean | undefined,
    updatedBy: string
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (categoryName !== undefined) {
      updates.push('category_name = @categoryName');
      request.input('categoryName', sql.NVarChar(100), categoryName);
    }

    if (description !== undefined) {
      updates.push('description = @description');
      request.input('description', sql.NVarChar(255), description || null);
    }

    if (isActive !== undefined) {
      updates.push('is_active = @isActive');
      request.input('isActive', sql.Bit, isActive);
    }

    if (updates.length === 0) return;

    // Add audit fields
    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');
    request.input('updatedBy', sql.VarChar(50), updatedBy);

    request.input('categoryId', sql.Int, categoryId);

    await request.query(`
      UPDATE ${DB_TABLES.LOOKUP_CATEGORIES}
      SET ${updates.join(', ')}
      WHERE category_id = @categoryId
    `);
  }

  /**
   * Delete lookup category (soft delete)
   */
  public async deleteLookupCategory(categoryId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .query(`
        UPDATE ${DB_TABLES.LOOKUP_CATEGORIES}
        SET is_active = 0
        WHERE category_id = @categoryId
      `);
  }

  // ========================================================================
  // LOOKUPS
  // ========================================================================

  /**
   * Get paginated list of lookups with filters
   */
  public async getLookups(filters: LookupFilters): Promise<PaginatedLookups> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];

    if (filters.search) {
      whereClauses.push(`(l.lookup_code LIKE @search OR l.lookup_value LIKE @search)`);
      request.input('search', sql.NVarChar(500), `%${filters.search}%`);
    }

    if (filters.category_id) {
      whereClauses.push('l.category_id = @categoryId');
      request.input('categoryId', sql.BigInt, filters.category_id);
    }

    if (filters.is_active !== undefined) {
      whereClauses.push('l.is_active = @isActive');
      request.input('isActive', sql.Bit, filters.is_active);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sortBy = filters.sort_by || 'sort_order';
    const sortOrder = filters.sort_order || 'ASC';
    const orderBy = `ORDER BY l.${sortBy} ${sortOrder}`;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${DB_TABLES.LOOKUPS} l
      ${whereClause}
    `;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    const query = `
      SELECT 
        l.lookup_id,
        l.category_id,
        lc.category_name,
        l.lookup_code,
        l.lookup_value,
        l.sort_order,
        l.is_active,
        COUNT(lm.metadata_id) as metadata_count
      FROM ${DB_TABLES.LOOKUPS} l
      INNER JOIN ${DB_TABLES.LOOKUP_CATEGORIES} lc ON l.category_id = lc.category_id
      LEFT JOIN ${DB_TABLES.LOOKUP_METADATA} lm ON l.lookup_id = lm.lookup_id
      ${whereClause}
      GROUP BY l.lookup_id, l.category_id, lc.category_name, 
               l.lookup_code, l.lookup_value, l.sort_order, l.is_active
      ${orderBy}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    const lookups: LookupListItem[] = result.recordset.map((row: any) => ({
      lookup_id: row.lookup_id,
      category_id: row.category_id,
      category_name: row.category_name,
      lookup_code: row.lookup_code,
      lookup_value: row.lookup_value,
      sort_order: row.sort_order,
      is_active: row.is_active,
      metadata_count: row.metadata_count
    }));

    return {
      lookups,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get lookup by ID
   */
  public async getLookupById(lookupId: number): Promise<Lookup | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('lookupId', sql.BigInt, lookupId)
      .query(`
        SELECT * FROM ${DB_TABLES.LOOKUPS}
        WHERE lookup_id = @lookupId
      `);

    return result.recordset[0] || null;
  }

  /**
   * Get lookups by category
   */
  public async getLookupsByCategory(categoryId: number, isActive?: boolean): Promise<Lookup[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    let query = `
      SELECT * FROM ${DB_TABLES.LOOKUPS}
      WHERE category_id = @categoryId
    `;

    if (isActive !== undefined) {
      query += ' AND is_active = @isActive';
      request.input('isActive', sql.Bit, isActive);
    }

    query += ' ORDER BY sort_order ASC';

    request.input('categoryId', sql.Int, categoryId);
    const result = await request.query(query);

    return result.recordset;
  }

  /**
   * Get lookups by category name (for public dropdown access)
   */
  public async getLookupsByCategoryName(categoryName: string, isActive?: boolean): Promise<Lookup[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    let query = `
      SELECT l.* FROM ${DB_TABLES.LOOKUPS} l
      INNER JOIN ${DB_TABLES.LOOKUP_CATEGORIES} c ON l.category_id = c.category_id
      WHERE c.category_name = @categoryName
    `;

    if (isActive !== undefined) {
      query += ' AND l.is_active = @isActive';
      request.input('isActive', sql.Bit, isActive);
    }

    query += ' ORDER BY l.sort_order ASC';

    request.input('categoryName', sql.NVarChar(100), categoryName);
    const result = await request.query(query);

    return result.recordset;
  }

  /**
   * Check if lookup code exists within category
   */
  public async lookupCodeExists(categoryId: number, lookupCode: string, excludeLookupId?: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    let query = `
      SELECT COUNT(*) as count 
      FROM ${DB_TABLES.LOOKUPS} 
      WHERE category_id = @categoryId AND lookup_code = @lookupCode
    `;

    if (excludeLookupId) {
      query += ' AND lookup_id != @excludeLookupId';
      request.input('excludeLookupId', sql.Int, excludeLookupId);
    }

    request.input('categoryId', sql.BigInt, categoryId);
    request.input('lookupCode', sql.VarChar(50), lookupCode);
    const result = await request.query(query);

    return result.recordset[0].count > 0;
  }

  /**
   * Create new lookup
   */
  public async createLookup(
    categoryId: number,
    lookupCode: string,
    lookupValue: string,
    sortOrder: number,
    isActive: boolean,
    createdBy: string
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('categoryId', sql.Int, categoryId)
      .input('lookupCode', sql.VarChar(20), lookupCode)
      .input('lookupValue', sql.NVarChar(255), lookupValue)
      .input('sortOrder', sql.Int, sortOrder)
      .input('isActive', sql.Bit, isActive)
      .input('createdBy', sql.VarChar(50), createdBy);

    const result = await request.query(`
        INSERT INTO ${DB_TABLES.LOOKUPS} (
          category_id, lookup_code, lookup_value, sort_order, is_active, created_by
        )
        OUTPUT INSERTED.lookup_id
        VALUES (
          @categoryId, @lookupCode, @lookupValue, @sortOrder, @isActive, @createdBy
        )
      `);

    return result.recordset[0].lookup_id;
  }

  /**
   * Update lookup
   */
  public async updateLookup(
    lookupId: number,
    categoryId: number | undefined,
    lookupCode: string | undefined,
    lookupValue: string | undefined,
    sortOrder: number | undefined,
    isActive: boolean | undefined,
    updatedBy: string
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (categoryId !== undefined) {
      updates.push('category_id = @categoryId');
      request.input('categoryId', sql.Int, categoryId);
    }

    if (lookupCode !== undefined) {
      updates.push('lookup_code = @lookupCode');
      request.input('lookupCode', sql.VarChar(20), lookupCode);
    }

    if (lookupValue !== undefined) {
      updates.push('lookup_value = @lookupValue');
      request.input('lookupValue', sql.NVarChar(255), lookupValue);
    }

    if (sortOrder !== undefined) {
      updates.push('sort_order = @sortOrder');
      request.input('sortOrder', sql.Int, sortOrder);
    }

    if (isActive !== undefined) {
      updates.push('is_active = @isActive');
      request.input('isActive', sql.Bit, isActive);
    }

    if (updates.length === 0) return;

    // Add audit fields
    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');
    request.input('updatedBy', sql.VarChar(50), updatedBy);

    request.input('lookupId', sql.Int, lookupId);

    await request.query(`
      UPDATE ${DB_TABLES.LOOKUPS}
      SET ${updates.join(', ')}
      WHERE lookup_id = @lookupId
    `);
  }

  /**
   * Delete lookup (soft delete)
   */
  public async deleteLookup(lookupId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('lookupId', sql.Int, lookupId)
      .query(`
        UPDATE ${DB_TABLES.LOOKUPS}
        SET is_active = 0
        WHERE lookup_id = @lookupId
      `);
  }

  // ========================================================================
  // LOOKUP METADATA
  // ========================================================================

  /**
   * Get paginated list of lookup metadata with filters
   */
  public async getLookupMetadata(filters: LookupMetadataFilters): Promise<PaginatedLookupMetadata> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];

    if (filters.search) {
      whereClauses.push(`(lm.metadata_key LIKE @search OR lm.metadata_value LIKE @search)`);
      request.input('search', sql.NVarChar(500), `%${filters.search}%`);
    }

    if (filters.lookup_id) {
      whereClauses.push('lm.lookup_id = @lookupId');
      request.input('lookupId', sql.BigInt, filters.lookup_id);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sortBy = filters.sort_by || 'metadata_id';
    const sortOrder = filters.sort_order || 'DESC';
    const orderBy = `ORDER BY lm.${sortBy} ${sortOrder}`;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${DB_TABLES.LOOKUP_METADATA} lm
      ${whereClause}
    `;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    const query = `
      SELECT 
        lm.metadata_id,
        lm.lookup_id,
        l.lookup_code,
        l.lookup_value,
        lc.category_name,
        lm.metadata_key,
        lm.metadata_value
      FROM ${DB_TABLES.LOOKUP_METADATA} lm
      INNER JOIN ${DB_TABLES.LOOKUPS} l ON lm.lookup_id = l.lookup_id
      INNER JOIN ${DB_TABLES.LOOKUP_CATEGORIES} lc ON l.category_id = lc.category_id
      ${whereClause}
      ${orderBy}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    const metadata: LookupMetadataListItem[] = result.recordset.map((row: any) => ({
      metadata_id: row.metadata_id,
      lookup_id: row.lookup_id,
      lookup_code: row.lookup_code,
      lookup_value: row.lookup_value,
      category_name: row.category_name,
      metadata_key: row.metadata_key,
      metadata_value: row.metadata_value
    }));

    return {
      metadata,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get lookup metadata by ID
   */
  public async getLookupMetadataById(metadataId: number): Promise<LookupMetadata | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('metadataId', sql.BigInt, metadataId)
      .query(`
        SELECT * FROM ${DB_TABLES.LOOKUP_METADATA}
        WHERE metadata_id = @metadataId
      `);

    return result.recordset[0] || null;
  }

  /**
   * Check if metadata key exists for lookup
   */
  public async metadataKeyExists(lookupId: number, metadataKey: string, excludeMetadataId?: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    let query = `
      SELECT COUNT(*) as count 
      FROM ${DB_TABLES.LOOKUP_METADATA} 
      WHERE lookup_id = @lookupId AND metadata_key = @metadataKey
    `;

    if (excludeMetadataId) {
      query += ' AND metadata_id != @excludeMetadataId';
      request.input('excludeMetadataId', sql.BigInt, excludeMetadataId);
    }

    request.input('lookupId', sql.BigInt, lookupId);
    request.input('metadataKey', sql.VarChar(100), metadataKey);
    const result = await request.query(query);

    return result.recordset[0].count > 0;
  }

  /**
   * Create new lookup metadata
   */
  public async createLookupMetadata(
    lookupId: number,
    metadataKey: string,
    metadataValue: string,
    createdBy: string
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('lookupId', sql.Int, lookupId)
      .input('metadataKey', sql.NVarChar(100), metadataKey)
      .input('metadataValue', sql.NVarChar(500), metadataValue)
      .input('createdBy', sql.VarChar(50), createdBy)
      .query(`
        INSERT INTO ${DB_TABLES.LOOKUP_METADATA} (
          lookup_id, metadata_key, metadata_value, created_by
        )
        OUTPUT INSERTED.metadata_id
        VALUES (
          @lookupId, @metadataKey, @metadataValue, @createdBy
        )
      `);

    return result.recordset[0].metadata_id;
  }

  /**
   * Update lookup metadata
   */
  public async updateLookupMetadata(
    metadataId: number,
    metadataKey: string | undefined,
    metadataValue: string | undefined,
    updatedBy: string
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (metadataKey !== undefined) {
      updates.push('metadata_key = @metadataKey');
      request.input('metadataKey', sql.NVarChar(100), metadataKey);
    }

    if (metadataValue !== undefined) {
      updates.push('metadata_value = @metadataValue');
      request.input('metadataValue', sql.NVarChar(500), metadataValue);
    }

    if (updates.length === 0) return;

    // Add audit fields
    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');
    request.input('updatedBy', sql.VarChar(50), updatedBy);

    request.input('metadataId', sql.Int, metadataId);

    await request.query(`
      UPDATE ${DB_TABLES.LOOKUP_METADATA}
      SET ${updates.join(', ')}
      WHERE metadata_id = @metadataId
    `);
  }

  /**
   * Delete lookup metadata (hard delete)
   */
  public async deleteLookupMetadata(metadataId: number, deletedBy: string): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('metadataId', sql.BigInt, metadataId)
      .query(`
        DELETE FROM ${DB_TABLES.LOOKUP_METADATA}
        WHERE metadata_id = @metadataId
      `);
  }
}
