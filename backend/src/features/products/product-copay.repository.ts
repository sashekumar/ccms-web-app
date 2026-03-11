import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { ProductCopay, CreateProductCopayDto, UpdateProductCopayDto } from './product-copay.types';
import { BaseRepository } from '../../core/base/base.repository';

export class ProductCopayRepository extends BaseRepository<ProductCopay> {
  constructor() {
    super(DB_TABLES.PRODUCT_COPAY, 'copay_id', false);
  }
  
  /**
   * Get all copay rules for a product
   */
  public async getCopayByProductId(productId: number): Promise<ProductCopay[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('product_id', sql.BigInt, productId)
      .query(`
        SELECT 
          copay_id,
          legacy_product_copay_id,
          product_id,
          copay_type,
          copay_value,
          applies_to,
          is_active
        FROM ${DB_TABLES.PRODUCT_COPAY}
        WHERE product_id = @product_id
        ORDER BY copay_id
      `);

    return result.recordset;
  }

  /**
   * Get copay by ID
   */
  public async getCopayById(copayId: number): Promise<ProductCopay | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('copay_id', sql.BigInt, copayId)
      .query(`
        SELECT 
          copay_id,
          legacy_product_copay_id,
          product_id,
          copay_type,
          copay_value,
          applies_to,
          is_active
        FROM ${DB_TABLES.PRODUCT_COPAY}
        WHERE copay_id = @copay_id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Create new product copay rule
   */
  public async createCopay(dto: CreateProductCopayDto, createdBy: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('product_id', sql.BigInt, dto.product_id)
      .input('copay_type', sql.VarChar(50), dto.copay_type || null)
      .input('copay_value', sql.Decimal(10, 2), dto.copay_value || null)
      .input('applies_to', sql.NVarChar(255), dto.applies_to || null)
      .input('is_active', sql.Bit, dto.is_active !== undefined ? dto.is_active : true)
      .input('createdBy', sql.VarChar(50), createdBy)
      .query(`
        INSERT INTO ${DB_TABLES.PRODUCT_COPAY} (
          product_id,
          copay_type,
          copay_value,
          applies_to,
          is_active,
          created_by
        )
        VALUES (
          @product_id,
          @copay_type,
          @copay_value,
          @applies_to,
          @is_active,
          @createdBy
        );
        SELECT SCOPE_IDENTITY() AS copay_id;
      `);

    return result.recordset[0].copay_id;
  }

  /**
   * Update product copay rule
   */
  public async updateCopay(copayId: number, dto: UpdateProductCopayDto, updatedBy: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request().input('copay_id', sql.BigInt, copayId);

    const setClauses: string[] = [];

    if (dto.copay_type !== undefined) {
      setClauses.push('copay_type = @copay_type');
      request.input('copay_type', sql.VarChar(50), dto.copay_type);
    }

    if (dto.copay_value !== undefined) {
      setClauses.push('copay_value = @copay_value');
      request.input('copay_value', sql.Decimal(10, 2), dto.copay_value);
    }

    if (dto.applies_to !== undefined) {
      setClauses.push('applies_to = @applies_to');
      request.input('applies_to', sql.NVarChar(255), dto.applies_to);
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
      UPDATE ${DB_TABLES.PRODUCT_COPAY}
      SET ${setClauses.join(', ')}
      WHERE copay_id = @copay_id
    `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Delete product copay rule (hard delete)
   */
  public async deleteCopay(copayId: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('copay_id', sql.BigInt, copayId)
      .query(`
        DELETE FROM ${DB_TABLES.PRODUCT_COPAY}
        WHERE copay_id = @copay_id
      `);

    return result.rowsAffected[0] > 0;
  }
}
