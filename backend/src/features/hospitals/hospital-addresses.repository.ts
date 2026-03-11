import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { HospitalAddress } from './hospital-addresses.types';
import { BaseRepository } from '../../core/base/base.repository';

export class HospitalAddressesRepository extends BaseRepository<HospitalAddress> {
  constructor() {
    super(DB_TABLES.HOSPITAL_ADDRESSES, 'address_id', false);
  }

  /**
   * Get all addresses for a hospital
   */
  public async getAddressesByHospitalId(hospitalId: number): Promise<HospitalAddress[]> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const query = `
      SELECT 
        address_id,
        legacy_hospital_address_id,
        hospital_id,
        address_type,
        street_line1,
        street_line2,
        city,
        state,
        postal_code,
        country,
        latitude,
        longitude,
        is_primary
      FROM ${DB_TABLES.HOSPITAL_ADDRESSES}
      WHERE hospital_id = @hospitalId
      ORDER BY is_primary DESC, address_id ASC
    `;

    request.input('hospitalId', sql.BigInt, hospitalId);
    const result = await request.query(query);

    return result.recordset;
  }

  /**
   * Get address by ID
   */
  public async getAddressById(addressId: number): Promise<HospitalAddress | null> {
    return await this.findById(addressId);
  }

  /**
   * Create hospital address
   */
  public async createAddress(
    hospitalId: number,
    addressType: string,
    streetLine1: string | undefined,
    streetLine2: string | undefined,
    city: string | undefined,
    state: string | undefined,
    postalCode: string | undefined,
    country: string | undefined,
    latitude: number | undefined,
    longitude: number | undefined,
    isPrimary: boolean,
    createdBy: string
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('hospitalId', sql.BigInt, hospitalId)
      .input('addressType', sql.VarChar(50), addressType)
      .input('isPrimary', sql.Bit, isPrimary)
      .input('createdBy', sql.VarChar(50), createdBy);

    const fields: string[] = ['hospital_id', 'address_type', 'is_primary', 'created_by'];
    const values: string[] = ['@hospitalId', '@addressType', '@isPrimary', '@createdBy'];

    if (streetLine1) {
      fields.push('street_line1');
      values.push('@streetLine1');
      request.input('streetLine1', sql.NVarChar(255), streetLine1);
    }

    if (streetLine2) {
      fields.push('street_line2');
      values.push('@streetLine2');
      request.input('streetLine2', sql.NVarChar(255), streetLine2);
    }

    if (city) {
      fields.push('city');
      values.push('@city');
      request.input('city', sql.NVarChar(100), city);
    }

    if (state) {
      fields.push('state');
      values.push('@state');
      request.input('state', sql.VarChar(50), state);
    }

    if (postalCode) {
      fields.push('postal_code');
      values.push('@postalCode');
      request.input('postalCode', sql.VarChar(20), postalCode);
    }

    if (country) {
      fields.push('country');
      values.push('@country');
      request.input('country', sql.VarChar(100), country);
    }

    if (latitude !== undefined) {
      fields.push('latitude');
      values.push('@latitude');
      request.input('latitude', sql.Decimal(10, 8), latitude);
    }

    if (longitude !== undefined) {
      fields.push('longitude');
      values.push('@longitude');
      request.input('longitude', sql.Decimal(11, 8), longitude);
    }

    const query = `
      INSERT INTO ${DB_TABLES.HOSPITAL_ADDRESSES} (${fields.join(', ')})
      OUTPUT INSERTED.address_id
      VALUES (${values.join(', ')})
    `;

    const result = await request.query(query);
    return result.recordset[0].address_id;
  }

  /**
   * Update hospital address
   */
  public async updateAddress(
    addressId: number,
    addressType: string | undefined,
    streetLine1: string | undefined,
    streetLine2: string | undefined,
    city: string | undefined,
    state: string | undefined,
    postalCode: string | undefined,
    country: string | undefined,
    latitude: number | undefined,
    longitude: number | undefined,
    isPrimary: boolean | undefined,
    updatedBy: string
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (addressType !== undefined) {
      updates.push('address_type = @addressType');
      request.input('addressType', sql.VarChar(50), addressType);
    }

    if (streetLine1 !== undefined) {
      updates.push('street_line1 = @streetLine1');
      request.input('streetLine1', sql.NVarChar(255), streetLine1 || null);
    }

    if (streetLine2 !== undefined) {
      updates.push('street_line2 = @streetLine2');
      request.input('streetLine2', sql.NVarChar(255), streetLine2 || null);
    }

    if (city !== undefined) {
      updates.push('city = @city');
      request.input('city', sql.NVarChar(100), city || null);
    }

    if (state !== undefined) {
      updates.push('state = @state');
      request.input('state', sql.VarChar(50), state || null);
    }

    if (postalCode !== undefined) {
      updates.push('postal_code = @postalCode');
      request.input('postalCode', sql.VarChar(20), postalCode || null);
    }

    if (country !== undefined) {
      updates.push('country = @country');
      request.input('country', sql.VarChar(100), country || null);
    }

    if (latitude !== undefined) {
      updates.push('latitude = @latitude');
      request.input('latitude', sql.Decimal(10, 8), latitude || null);
    }

    if (longitude !== undefined) {
      updates.push('longitude = @longitude');
      request.input('longitude', sql.Decimal(11, 8), longitude || null);
    }

    if (isPrimary !== undefined) {
      updates.push('is_primary = @isPrimary');
      request.input('isPrimary', sql.Bit, isPrimary);
    }

    if (updates.length === 0) return;

    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');
    request.input('updatedBy', sql.VarChar(50), updatedBy);

    request.input('addressId', sql.BigInt, addressId);

    await request.query(`
      UPDATE ${DB_TABLES.HOSPITAL_ADDRESSES}
      SET ${updates.join(', ')}
      WHERE address_id = @addressId
    `);
  }

  /**
   * Delete hospital address
   */
  public async deleteAddress(addressId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('addressId', sql.BigInt, addressId)
      .query(`
        DELETE FROM ${DB_TABLES.HOSPITAL_ADDRESSES}
        WHERE address_id = @addressId
      `);
  }

  /**
   * Clear primary flag from all addresses of a hospital
   */
  public async clearPrimaryFlags(hospitalId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('hospitalId', sql.BigInt, hospitalId)
      .query(`
        UPDATE ${DB_TABLES.HOSPITAL_ADDRESSES}
        SET is_primary = 0
        WHERE hospital_id = @hospitalId
      `);
  }
}
