import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { ProductLimit, CreateProductLimitDto, UpdateProductLimitDto } from './product-limits.types';
import { BaseRepository } from '../../core/base/base.repository';

export class ProductLimitsRepository extends BaseRepository<ProductLimit> {
  constructor() {
    super(DB_TABLES.PRODUCT_LIMITS, 'limit_id', false);
  }
  
  /**
   * Get all limits for a product
   */
  public async getLimitsByProductId(productId: number): Promise<ProductLimit[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('product_id', sql.BigInt, productId)
      .query(`
        SELECT 
          limit_id,
          legacy_product_limit_id,
          product_id,
          limit_type,
          limit_amount,
          is_active
        FROM ${DB_TABLES.PRODUCT_LIMITS}
        WHERE product_id = @product_id
        ORDER BY limit_id
      `);

    return result.recordset;
  }

  /**
   * Get limit by ID
   */
  public async getLimitById(limitId: number): Promise<ProductLimit | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('limit_id', sql.BigInt, limitId)
      .query(`
        SELECT 
          limit_id,
          legacy_product_limit_id,
          product_id,
          limit_type,
          limit_amount,
          is_active
        FROM ${DB_TABLES.PRODUCT_LIMITS}
        WHERE limit_id = @limit_id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Create new product limit
   */
  public async createLimit(dto: CreateProductLimitDto, createdBy: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('product_id', sql.BigInt, dto.product_id)
      .input('limit_type', sql.VarChar(50), dto.limit_type || null)
      .input('limit_amount', sql.Money, dto.limit_amount || null)
      .input('is_active', sql.Bit, dto.is_active !== undefined ? dto.is_active : true)
      .input('createdBy', sql.VarChar(50), createdBy)
      .query(`
        INSERT INTO ${DB_TABLES.PRODUCT_LIMITS} (
          product_id,
          limit_type,
          limit_amount,
          is_active,
          created_by
        )
        VALUES (
          @product_id,
          @limit_type,
          @limit_amount,
          @is_active,
          @createdBy
        );
        SELECT SCOPE_IDENTITY() AS limit_id;
      `);

    return result.recordset[0].limit_id;
  }

  /**
   * Update product limit
   */
  public async updateLimit(limitId: number, dto: UpdateProductLimitDto, updatedBy: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request().input('limit_id', sql.BigInt, limitId);

    const setClauses: string[] = [];

    if (dto.limit_type !== undefined) {
      setClauses.push('limit_type = @limit_type');
      request.input('limit_type', sql.VarChar(50), dto.limit_type);
    }

    if (dto.limit_amount !== undefined) {
      setClauses.push('limit_amount = @limit_amount');
      request.input('limit_amount', sql.Money, dto.limit_amount);
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
      UPDATE ${DB_TABLES.PRODUCT_LIMITS}
      SET ${setClauses.join(', ')}
      WHERE limit_id = @limit_id
    `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Delete product limit (hard delete)
   */
  public async deleteLimit(limitId: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('limit_id', sql.BigInt, limitId)
      .query(`
        DELETE FROM ${DB_TABLES.PRODUCT_LIMITS}
        WHERE limit_id = @limit_id
      `);

    return result.rowsAffected[0] > 0;
  }
}
