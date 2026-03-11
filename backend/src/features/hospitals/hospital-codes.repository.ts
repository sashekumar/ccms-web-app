import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { HospitalCode } from './hospital-codes.types';
import { BaseRepository } from '../../core/base/base.repository';

export class HospitalCodesRepository extends BaseRepository<HospitalCode> {
  constructor() {
    super(DB_TABLES.HOSPITAL_CODES, 'code_id', false);
  }

  /**
   * Get all codes for a hospital
   */
  public async getCodesByHospitalId(hospitalId: number): Promise<HospitalCode[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT 
        code_id,
        legacy_hospital_code_id,
        hospital_id,
        code_type,
        code_value,
        is_active
      FROM ${DB_TABLES.HOSPITAL_CODES}
      WHERE hospital_id = @hospitalId
      ORDER BY code_type ASC
    `;

    request.input('hospitalId', sql.BigInt, hospitalId);
    const result = await request.query(query);

    return result.recordset;
  }

  /**
   * Get code by ID
   */
  public async getCodeById(codeId: number): Promise<HospitalCode | null> {
    return await this.findById(codeId);
  }

  /**
   * Check if code type exists for hospital
   */
  public async codeTypeExists(hospitalId: number, codeType: string, excludeCodeId?: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    let query = `
      SELECT COUNT(*) as count 
      FROM ${DB_TABLES.HOSPITAL_CODES} 
      WHERE hospital_id = @hospitalId AND code_type = @codeType
    `;

    if (excludeCodeId) {
      query += ' AND code_id != @excludeCodeId';
      request.input('excludeCodeId', sql.BigInt, excludeCodeId);
    }

    request.input('hospitalId', sql.BigInt, hospitalId);
    request.input('codeType', sql.VarChar(50), codeType);
    const result = await request.query(query);

    return result.recordset[0].count > 0;
  }

  /**
   * Create hospital code
   */
  public async createCode(
    hospitalId: number,
    codeType: string,
    codeValue: string | undefined,
    isActive: boolean,
    createdBy: string
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('hospitalId', sql.BigInt, hospitalId)
      .input('codeType', sql.VarChar(50), codeType)
      .input('isActive', sql.Bit, isActive)
      .input('createdBy', sql.VarChar(50), createdBy);

    const fields: string[] = ['hospital_id', 'code_type', 'is_active', 'created_by'];
    const values: string[] = ['@hospitalId', '@codeType', '@isActive', '@createdBy'];

    if (codeValue) {
      fields.push('code_value');
      values.push('@codeValue');
      request.input('codeValue', sql.VarChar(100), codeValue);
    }

    const query = `
      INSERT INTO ${DB_TABLES.HOSPITAL_CODES} (${fields.join(', ')})
      OUTPUT INSERTED.code_id
      VALUES (${values.join(', ')})
    `;

    const result = await request.query(query);
    return result.recordset[0].code_id;
  }

  /**
   * Update hospital code
   */
  public async updateCode(
    codeId: number,
    codeType: string | undefined,
    codeValue: string | undefined,
    isActive: boolean | undefined,
    updatedBy: string
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (codeType !== undefined) {
      updates.push('code_type = @codeType');
      request.input('codeType', sql.VarChar(50), codeType);
    }

    if (codeValue !== undefined) {
      updates.push('code_value = @codeValue');
      request.input('codeValue', sql.VarChar(100), codeValue || null);
    }

    if (isActive !== undefined) {
      updates.push('is_active = @isActive');
      request.input('isActive', sql.Bit, isActive);
    }

    if (updates.length === 0) return;

    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');
    request.input('updatedBy', sql.VarChar(50), updatedBy);

    request.input('codeId', sql.BigInt, codeId);

    await request.query(`
      UPDATE ${DB_TABLES.HOSPITAL_CODES}
      SET ${updates.join(', ')}
      WHERE code_id = @codeId
    `);
  }

  /**
   * Delete hospital code
   */
  public async deleteCode(codeId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('codeId', sql.BigInt, codeId)
      .query(`
        DELETE FROM ${DB_TABLES.HOSPITAL_CODES}
        WHERE code_id = @codeId
      `);
  }
}
