import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { FeeSchedule, FeeScheduleFilters } from './fee-schedules.types';
import { BaseRepository } from '../../core/base/base.repository';

export class FeeSchedulesRepository extends BaseRepository<FeeSchedule> {
  constructor() {
    super(DB_TABLES.FEE_SCHEDULES, 'fee_id', false);
  }

  /**
   * Get all fee schedules for a hospital
   */
  public async getFeesByHospitalId(hospitalId: number, filters?: FeeScheduleFilters): Promise<FeeSchedule[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const whereClauses: string[] = ['hospital_id = @hospitalId'];
    request.input('hospitalId', sql.BigInt, hospitalId);

    if (filters?.feeType) {
      whereClauses.push('fee_type = @feeType');
      request.input('feeType', sql.VarChar(50), filters.feeType);
    }

    if (filters?.isActive !== undefined) {
      whereClauses.push('is_active = @isActive');
      request.input('isActive', sql.Bit, filters.isActive);
    }

    const whereClause = `WHERE ${whereClauses.join(' AND ')}`;

    const query = `
      SELECT 
        fee_id,
        legacy_fee_schedule_id,
        hospital_id,
        fee_type,
        item_code,
        description,
        amount,
        effective_date,
        expiry_date,
        is_active
      FROM ${DB_TABLES.FEE_SCHEDULES}
      ${whereClause}
      ORDER BY fee_type ASC, item_code ASC
    `;

    const result = await request.query(query);

    return result.recordset;
  }

  /**
   * Get fee schedule by ID
   */
  public async getFeeById(feeId: number): Promise<FeeSchedule | null> {
    return await this.findById(feeId);
  }

  /**
   * Create fee schedule
   */
  public async createFee(
    hospitalId: number | undefined,
    feeType: string | undefined,
    itemCode: string | undefined,
    description: string | undefined,
    amount: number | undefined,
    effectiveDate: Date | undefined,
    expiryDate: Date | undefined,
    isActive: boolean,
    legacyFeeId: string | undefined
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('isActive', sql.Bit, isActive);

    const fields: string[] = ['is_active'];
    const values: string[] = ['@isActive'];

    if (hospitalId) {
      fields.push('hospital_id');
      values.push('@hospitalId');
      request.input('hospitalId', sql.BigInt, hospitalId);
    }

    if (feeType) {
      fields.push('fee_type');
      values.push('@feeType');
      request.input('feeType', sql.VarChar(50), feeType);
    }

    if (itemCode) {
      fields.push('item_code');
      values.push('@itemCode');
      request.input('itemCode', sql.VarChar(50), itemCode);
    }

    if (description) {
      fields.push('description');
      values.push('@description');
      request.input('description', sql.NVarChar(sql.MAX), description);
    }

    if (amount !== undefined) {
      fields.push('amount');
      values.push('@amount');
      request.input('amount', sql.Money, amount);
    }

    if (effectiveDate) {
      fields.push('effective_date');
      values.push('@effectiveDate');
      request.input('effectiveDate', sql.Date, effectiveDate);
    }

    if (expiryDate) {
      fields.push('expiry_date');
      values.push('@expiryDate');
      request.input('expiryDate', sql.Date, expiryDate);
    }

    if (legacyFeeId) {
      fields.push('legacy_fee_schedule_id');
      values.push('@legacyFeeId');
      request.input('legacyFeeId', sql.UniqueIdentifier, legacyFeeId);
    }

    const query = `
      INSERT INTO ${DB_TABLES.FEE_SCHEDULES} (${fields.join(', ')})
      OUTPUT INSERTED.fee_id
      VALUES (${values.join(', ')})
    `;

    const result = await request.query(query);
    return result.recordset[0].fee_id;
  }

  /**
   * Update fee schedule
   */
  public async updateFee(
    feeId: number,
    feeType: string | undefined,
    itemCode: string | undefined,
    description: string | undefined,
    amount: number | undefined,
    effectiveDate: Date | undefined,
    expiryDate: Date | undefined,
    isActive: boolean | undefined
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (feeType !== undefined) {
      updates.push('fee_type = @feeType');
      request.input('feeType', sql.VarChar(50), feeType || null);
    }

    if (itemCode !== undefined) {
      updates.push('item_code = @itemCode');
      request.input('itemCode', sql.VarChar(50), itemCode || null);
    }

    if (description !== undefined) {
      updates.push('description = @description');
      request.input('description', sql.NVarChar(sql.MAX), description || null);
    }

    if (amount !== undefined) {
      updates.push('amount = @amount');
      request.input('amount', sql.Money, amount || null);
    }

    if (effectiveDate !== undefined) {
      updates.push('effective_date = @effectiveDate');
      request.input('effectiveDate', sql.Date, effectiveDate || null);
    }

    if (expiryDate !== undefined) {
      updates.push('expiry_date = @expiryDate');
      request.input('expiryDate', sql.Date, expiryDate || null);
    }

    if (isActive !== undefined) {
      updates.push('is_active = @isActive');
      request.input('isActive', sql.Bit, isActive);
    }

    if (updates.length === 0) return;

    request.input('feeId', sql.BigInt, feeId);

    await request.query(`
      UPDATE ${DB_TABLES.FEE_SCHEDULES}
      SET ${updates.join(', ')}
      WHERE fee_id = @feeId
    `);
  }

  /**
   * Delete fee schedule
   */
  public async deleteFee(feeId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('feeId', sql.BigInt, feeId)
      .query(`
        DELETE FROM ${DB_TABLES.FEE_SCHEDULES}
        WHERE fee_id = @feeId
      `);
  }
}
