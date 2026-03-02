import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { HospitalStaff } from './hospital-staff.types';
import { BaseRepository } from '../../core/base/base.repository';

export class HospitalStaffRepository extends BaseRepository<HospitalStaff> {
  constructor() {
    super(DB_TABLES.HOSPITAL_STAFF, 'staff_id', false);
  }

  /**
   * Get all staff for a hospital
   */
  public async getStaffByHospitalId(hospitalId: number): Promise<HospitalStaff[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT 
        staff_id,
        legacy_hospital_staff_id,
        hospital_id,
        staff_name,
        staff_type,
        specialty,
        is_active
      FROM ${DB_TABLES.HOSPITAL_STAFF}
      WHERE hospital_id = @hospitalId
      ORDER BY staff_name ASC
    `;

    request.input('hospitalId', sql.BigInt, hospitalId);
    const result = await request.query(query);

    return result.recordset;
  }

  /**
   * Get staff by ID
   */
  public async getStaffById(staffId: number): Promise<HospitalStaff | null> {
    return await this.findById(staffId);
  }

  /**
   * Create hospital staff
   */
  public async createStaff(
    hospitalId: number,
    staffName: string,
    staffType: string | undefined,
    specialty: string | undefined,
    isActive: boolean,
    legacyStaffId: string | undefined
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('hospitalId', sql.BigInt, hospitalId)
      .input('staffName', sql.NVarChar(255), staffName)
      .input('isActive', sql.Bit, isActive);

    const fields: string[] = ['hospital_id', 'staff_name', 'is_active'];
    const values: string[] = ['@hospitalId', '@staffName', '@isActive'];

    if (staffType) {
      fields.push('staff_type');
      values.push('@staffType');
      request.input('staffType', sql.VarChar(50), staffType);
    }

    if (specialty) {
      fields.push('specialty');
      values.push('@specialty');
      request.input('specialty', sql.NVarChar(255), specialty);
    }

    if (legacyStaffId) {
      fields.push('legacy_hospital_staff_id');
      values.push('@legacyStaffId');
      request.input('legacyStaffId', sql.UniqueIdentifier, legacyStaffId);
    }

    const query = `
      INSERT INTO ${DB_TABLES.HOSPITAL_STAFF} (${fields.join(', ')})
      OUTPUT INSERTED.staff_id
      VALUES (${values.join(', ')})
    `;

    const result = await request.query(query);
    return result.recordset[0].staff_id;
  }

  /**
   * Update hospital staff
   */
  public async updateStaff(
    staffId: number,
    staffName: string | undefined,
    staffType: string | undefined,
    specialty: string | undefined,
    isActive: boolean | undefined
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (staffName !== undefined) {
      updates.push('staff_name = @staffName');
      request.input('staffName', sql.NVarChar(255), staffName);
    }

    if (staffType !== undefined) {
      updates.push('staff_type = @staffType');
      request.input('staffType', sql.VarChar(50), staffType || null);
    }

    if (specialty !== undefined) {
      updates.push('specialty = @specialty');
      request.input('specialty', sql.NVarChar(255), specialty || null);
    }

    if (isActive !== undefined) {
      updates.push('is_active = @isActive');
      request.input('isActive', sql.Bit, isActive);
    }

    if (updates.length === 0) return;

    request.input('staffId', sql.BigInt, staffId);

    await request.query(`
      UPDATE ${DB_TABLES.HOSPITAL_STAFF}
      SET ${updates.join(', ')}
      WHERE staff_id = @staffId
    `);
  }

  /**
   * Delete hospital staff
   */
  public async deleteStaff(staffId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('staffId', sql.BigInt, staffId)
      .query(`
        DELETE FROM ${DB_TABLES.HOSPITAL_STAFF}
        WHERE staff_id = @staffId
      `);
  }
}
