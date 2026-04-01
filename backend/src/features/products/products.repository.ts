import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { Product, ProductListItem, ProductFilters, PaginatedProducts, CreateProductDto, UpdateProductDto } from './products.types';
import { BaseRepository } from '../../core/base/base.repository';

export class ProductsRepository extends BaseRepository<Product> {
  constructor() {
    super(DB_TABLES.PRODUCTS, 'product_id', false);
  }
  
  /**
   * Get paginated list of products with filters
   */
  public async getProducts(filters: ProductFilters): Promise<PaginatedProducts> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereClauses: string[] = [];

    if (filters.search) {
      whereClauses.push(`(plan_code LIKE @search OR plan_name LIKE @search)`);
      request.input('search', sql.NVarChar(255), `%${filters.search}%`);
    }

    if (filters.insurer_name) {
      whereClauses.push('insurer_name LIKE @insurerName');
      request.input('insurerName', sql.NVarChar(255), `%${filters.insurer_name}%`);
    }

    if (filters.is_active !== undefined) {
      whereClauses.push('is_active = @isActive');
      request.input('isActive', sql.Bit, filters.is_active);
    }
    // No default filter - show all products by default

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Sorting
    const sortBy = filters.sort_by || 'product_id';
    const sortOrder = filters.sort_order || 'DESC';
    const orderBy = `ORDER BY ${sortBy} ${sortOrder}`;

    // Overall stats query (not affected by filters)
    const statsQuery = `
      SELECT 
        COUNT(*) as total_count,
        SUM(CAST(is_active as INT)) as active_count,
        SUM(CAST(CASE WHEN is_active = 0 THEN 1 ELSE 0 END as INT)) as inactive_count
      FROM ${DB_TABLES.PRODUCTS}
    `;

    // Filtered count query
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM ${DB_TABLES.PRODUCTS}
      ${whereClause}
    `;

    // Data query
    const dataQuery = `
      SELECT 
        product_id,
        legacy_product_id,
        insurer_name,
        plan_code,
        plan_name,
        is_active
      FROM ${DB_TABLES.PRODUCTS}
      ${whereClause}
      ${orderBy}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const [statsResult, countResult, dataResult] = await Promise.all([
      request.query(statsQuery),
      request.query(countQuery),
      request.query(dataQuery)
    ]);

    const stats = statsResult.recordset[0];
    const total = countResult.recordset[0].total;
    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.recordset as ProductListItem[],
      pagination: {
        total,
        page,
        limit,
        totalPages
      },
      stats: {
        total: stats.total_count || 0,
        active: stats.active_count || 0,
        inactive: stats.inactive_count || 0
      }
    };
  }

  /**
   * Get product by ID
   */
  public async getProductById(productId: number): Promise<Product | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('product_id', sql.BigInt, productId)
      .query(`
        SELECT 
          product_id,
          legacy_product_id,
          insurer_name,
          plan_code,
          plan_name,
          is_active,
          created_at
        FROM ${DB_TABLES.PRODUCTS}
        WHERE product_id = @product_id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Check if plan code exists (for validation)
   */
  public async checkPlanCodeExists(planCode: string, excludeId?: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('plan_code', sql.VarChar(50), planCode);

    let query = `
      SELECT COUNT(*) as count 
      FROM ${DB_TABLES.PRODUCTS}
      WHERE plan_code = @plan_code
    `;

    if (excludeId) {
      request.input('exclude_id', sql.BigInt, excludeId);
      query += ` AND product_id != @exclude_id`;
    }

    const result = await request.query(query);
    return result.recordset[0].count > 0;
  }

  /**
   * Create new product
   */
  public async createProduct(dto: CreateProductDto, createdBy: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('plan_code', sql.VarChar(50), dto.plan_code)
      .input('plan_name', sql.NVarChar(255), dto.plan_name || null)
      .input('insurer_name', sql.NVarChar(255), dto.insurer_name || null)
      .input('is_active', sql.Bit, dto.is_active !== undefined ? dto.is_active : true)
      .input('createdBy', sql.VarChar(50), createdBy)
      .query(`
        INSERT INTO ${DB_TABLES.PRODUCTS} (
          plan_code,
          plan_name,
          insurer_name,
          is_active,
          created_by
        )
        VALUES (
          @plan_code,
          @plan_name,
          @insurer_name,
          @is_active,
          @createdBy
        );
        SELECT SCOPE_IDENTITY() AS product_id;
      `);

    return result.recordset[0].product_id;
  }

  /**
   * Update product
   */
  public async updateProduct(productId: number, dto: UpdateProductDto, updatedBy: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request().input('product_id', sql.BigInt, productId);

    const setClauses: string[] = [];

    if (dto.plan_code !== undefined) {
      setClauses.push('plan_code = @plan_code');
      request.input('plan_code', sql.VarChar(50), dto.plan_code);
    }

    if (dto.plan_name !== undefined) {
      setClauses.push('plan_name = @plan_name');
      request.input('plan_name', sql.NVarChar(255), dto.plan_name);
    }

    if (dto.insurer_name !== undefined) {
      setClauses.push('insurer_name = @insurer_name');
      request.input('insurer_name', sql.NVarChar(255), dto.insurer_name);
    }

    if (dto.is_active !== undefined) {
      setClauses.push('is_active = @is_active');
      request.input('is_active', sql.Bit, dto.is_active);
    }

    if (setClauses.length === 0) {
      return false;
    }

    // Add audit fields
    setClauses.push('updated_by = @updatedBy');
    setClauses.push('updated_at = GETDATE()');
    request.input('updatedBy', sql.VarChar(50), updatedBy);

    const result = await request.query(`
      UPDATE ${DB_TABLES.PRODUCTS}
      SET ${setClauses.join(', ')}
      WHERE product_id = @product_id
    `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Activate product (set is_active = 1)
   */
  public async activateProduct(productId: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('product_id', sql.BigInt, productId)
      .query(`
        UPDATE ${DB_TABLES.PRODUCTS}
        SET is_active = 1
        WHERE product_id = @product_id
      `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Deactivate product (set is_active = 0) - soft delete
   */
  public async deactivateProduct(productId: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('product_id', sql.BigInt, productId)
      .query(`
        UPDATE ${DB_TABLES.PRODUCTS}
        SET is_active = 0
        WHERE product_id = @product_id
      `);

    return result.rowsAffected[0] > 0;
  }
}
