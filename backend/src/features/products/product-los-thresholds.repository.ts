import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { ProductLosThreshold, CreateProductLosThresholdDto, UpdateProductLosThresholdDto } from './product-los-thresholds.types';
import { BaseRepository } from '../../core/base/base.repository';

const TABLE_NAME = 'ccms_los_alert_thresholds';

export class ProductLosThresholdsRepository extends BaseRepository<ProductLosThreshold> {
  constructor() {
    super(TABLE_NAME, 'threshold_id', false);
  }
  
  /**
   * Get all LOS thresholds for a product
   */
  public async getThresholdsByProductId(productId: number): Promise<ProductLosThreshold[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('product_id', sql.BigInt, productId)
      .query(`
        SELECT 
          threshold_id,
          legacy_los_threshold_id,
          product_id,
          diagnosis_category,
          threshold_days,
          alert_level,
          is_active,
          created_at
        FROM ${TABLE_NAME}
        WHERE product_id = @product_id
        ORDER BY threshold_id
      `);

    return result.recordset;
  }

  /**
   * Get LOS threshold by ID
   */
  public async getThresholdById(thresholdId: number): Promise<ProductLosThreshold | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('threshold_id', sql.BigInt, thresholdId)
      .query(`
        SELECT 
          threshold_id,
          legacy_los_threshold_id,
          product_id,
          diagnosis_category,
          threshold_days,
          alert_level,
          is_active,
          created_at
        FROM ${TABLE_NAME}
        WHERE threshold_id = @threshold_id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Create new product LOS threshold
   */
  public async createThreshold(dto: CreateProductLosThresholdDto, createdBy: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('product_id', sql.BigInt, dto.product_id)
      .input('diagnosis_category', sql.VarChar(100), dto.diagnosis_category || null)
      .input('threshold_days', sql.Int, dto.threshold_days || null)
      .input('alert_level', sql.Int, dto.alert_level || null)
      .input('is_active', sql.Bit, dto.is_active !== undefined ? dto.is_active : true)
      .input('createdBy', sql.VarChar(50), createdBy)
      .query(`
        INSERT INTO ${TABLE_NAME} (
          product_id,
          diagnosis_category,
          threshold_days,
          alert_level,
          is_active,
          created_by
        )
        OUTPUT INSERTED.threshold_id
        VALUES (
          @product_id,
          @diagnosis_category,
          @threshold_days,
          @alert_level,
          @is_active,
          @createdBy
        );
      `);

    return result.recordset[0].threshold_id;
  }

  /**
   * Update product LOS threshold
   */
  public async updateThreshold(thresholdId: number, dto: UpdateProductLosThresholdDto, updatedBy: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request().input('threshold_id', sql.BigInt, thresholdId);

    const setClauses: string[] = [];

    if (dto.diagnosis_category !== undefined) {
      setClauses.push('diagnosis_category = @diagnosis_category');
      request.input('diagnosis_category', sql.VarChar(100), dto.diagnosis_category);
    }

    if (dto.threshold_days !== undefined) {
      setClauses.push('threshold_days = @threshold_days');
      request.input('threshold_days', sql.Int, dto.threshold_days);
    }
    
    if (dto.alert_level !== undefined) {
      setClauses.push('alert_level = @alert_level');
      request.input('alert_level', sql.Int, dto.alert_level);
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
      UPDATE ${TABLE_NAME}
      SET ${setClauses.join(', ')}
      WHERE threshold_id = @threshold_id
    `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Delete product LOS threshold (hard delete)
   */
  public async deleteThreshold(thresholdId: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('threshold_id', sql.BigInt, thresholdId)
      .query(`
        DELETE FROM ${TABLE_NAME}
        WHERE threshold_id = @threshold_id
      `);

    return result.rowsAffected[0] > 0;
  }
}
