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

    if (filters.insurerName) {
      whereClauses.push('insurer_name = @insurerName');
      request.input('insurerName', sql.NVarChar(255), filters.insurerName);
    }

    if (filters.isActive !== undefined) {
      whereClauses.push('is_active = @isActive');
      request.input('isActive', sql.Bit, filters.isActive);
    } else {
      // By default, show only active products
      whereClauses.push('is_active = 1');
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Sorting
    const sortBy = filters.sortBy || 'product_id';
    const sortOrder = filters.sortOrder || 'DESC';
    const orderBy = `ORDER BY ${sortBy} ${sortOrder}`;

    // Count query
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

    const [countResult, dataResult] = await Promise.all([
      request.query(countQuery),
      request.query(dataQuery)
    ]);

    const total = countResult.recordset[0].total;
    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.recordset as ProductListItem[],
      pagination: {
        total,
        page,
        limit,
        totalPages
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
  public async createProduct(dto: CreateProductDto): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('plan_code', sql.VarChar(50), dto.plan_code)
      .input('plan_name', sql.NVarChar(255), dto.plan_name || null)
      .input('insurer_name', sql.NVarChar(255), dto.insurer_name || null)
      .input('is_active', sql.Bit, dto.is_active !== undefined ? dto.is_active : true)
      .input('legacy_product_id', sql.UniqueIdentifier, dto.legacy_product_id || null)
      .query(`
        INSERT INTO ${DB_TABLES.PRODUCTS} (
          plan_code,
          plan_name,
          insurer_name,
          is_active,
          legacy_product_id,
          created_at
        )
        VALUES (
          @plan_code,
          @plan_name,
          @insurer_name,
          @is_active,
          @legacy_product_id,
          GETDATE()
        );
        SELECT SCOPE_IDENTITY() AS product_id;
      `);

    return result.recordset[0].product_id;
  }

  /**
   * Update product
   */
  public async updateProduct(productId: number, dto: UpdateProductDto): Promise<boolean> {
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

    if (dto.legacy_product_id !== undefined) {
      setClauses.push('legacy_product_id = @legacy_product_id');
      request.input('legacy_product_id', sql.UniqueIdentifier, dto.legacy_product_id);
    }

    if (setClauses.length === 0) {
      return false;
    }

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
