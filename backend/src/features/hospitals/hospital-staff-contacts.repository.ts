import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { HospitalStaffContact } from './hospital-staff-contacts.types';
import { BaseRepository } from '../../core/base/base.repository';

export class HospitalStaffContactsRepository extends BaseRepository<HospitalStaffContact> {
  constructor() {
    super(DB_TABLES.HOSPITAL_STAFF_CONTACTS, 'contact_id', false);
  }

  /**
   * Get all contacts for a staff member
   */
  public async getContactsByStaffId(staffId: number): Promise<HospitalStaffContact[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT 
        contact_id,
        legacy_hospital_contact_id,
        staff_id,
        contact_type,
        contact_value,
        is_primary
      FROM ${DB_TABLES.HOSPITAL_STAFF_CONTACTS}
      WHERE staff_id = @staffId
      ORDER BY is_primary DESC, contact_type ASC
    `;

    request.input('staffId', sql.BigInt, staffId);
    const result = await request.query(query);

    return result.recordset;
  }

  /**
   * Get contact by ID
   */
  public async getContactById(contactId: number): Promise<HospitalStaffContact | null> {
    return await this.findById(contactId);
  }

  /**
   * Create staff contact
   */
  public async createContact(
    staffId: number,
    contactType: string,
    contactValue: string | undefined,
    isPrimary: boolean,
    createdBy: string
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('staffId', sql.BigInt, staffId)
      .input('contactType', sql.VarChar(50), contactType)
      .input('isPrimary', sql.Bit, isPrimary)
      .input('createdBy', sql.VarChar(50), createdBy);

    const fields: string[] = ['staff_id', 'contact_type', 'is_primary', 'created_by'];
    const values: string[] = ['@staffId', '@contactType', '@isPrimary', '@createdBy'];

    if (contactValue) {
      fields.push('contact_value');
      values.push('@contactValue');
      request.input('contactValue', sql.VarChar(100), contactValue);
    }

    const query = `
      INSERT INTO ${DB_TABLES.HOSPITAL_STAFF_CONTACTS} (${fields.join(', ')})
      OUTPUT INSERTED.contact_id
      VALUES (${values.join(', ')})
    `;

    const result = await request.query(query);
    return result.recordset[0].contact_id;
  }

  /**
   * Update staff contact
   */
  public async updateContact(
    contactId: number,
    contactType: string | undefined,
    contactValue: string | undefined,
    isPrimary: boolean | undefined,
    updatedBy: string
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (contactType !== undefined) {
      updates.push('contact_type = @contactType');
      request.input('contactType', sql.VarChar(50), contactType);
    }

    if (contactValue !== undefined) {
      updates.push('contact_value = @contactValue');
      request.input('contactValue', sql.VarChar(100), contactValue || null);
    }

    if (isPrimary !== undefined) {
      updates.push('is_primary = @isPrimary');
      request.input('isPrimary', sql.Bit, isPrimary);
    }

    if (updates.length === 0) return;

    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');
    request.input('updatedBy', sql.VarChar(50), updatedBy);

    request.input('contactId', sql.BigInt, contactId);

    await request.query(`
      UPDATE ${DB_TABLES.HOSPITAL_STAFF_CONTACTS}
      SET ${updates.join(', ')}
      WHERE contact_id = @contactId
    `);
  }

  /**
   * Delete staff contact
   */
  public async deleteContact(contactId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('contactId', sql.BigInt, contactId)
      .query(`
        DELETE FROM ${DB_TABLES.HOSPITAL_STAFF_CONTACTS}
        WHERE contact_id = @contactId
      `);
  }

  /**
   * Clear primary flag from all contacts of a staff member
   */
  public async clearPrimaryFlags(staffId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('staffId', sql.BigInt, staffId)
      .query(`
        UPDATE ${DB_TABLES.HOSPITAL_STAFF_CONTACTS}
        SET is_primary = 0
        WHERE staff_id = @staffId
      `);
  }
}
