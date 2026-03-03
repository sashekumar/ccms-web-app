import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { MemberAddress, CreateMemberAddressDto, UpdateMemberAddressDto } from './member-addresses.types';
import { BaseRepository } from '../../core/base/base.repository';

export class MemberAddressesRepository extends BaseRepository<MemberAddress> {
  constructor() {
    super(DB_TABLES.MEMBER_ADDRESSES, 'address_id', false);
  }
  
  /**
   * Get all addresses for a member
   */
  public async getAddressesByMemberId(memberId: string): Promise<MemberAddress[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('member_id', sql.BigInt, memberId)
      .query(`
        SELECT 
          address_id,
          legacy_member_address_id,
          member_id,
          address_type,
          street_line1,
          street_line2,
          city,
          state,
          postal_code,
          country,
          is_primary
        FROM ${DB_TABLES.MEMBER_ADDRESSES}
        WHERE member_id = @member_id
        ORDER BY is_primary DESC, address_id ASC
      `);

    return result.recordset;
  }

  /**
   * Get address by ID
   */
  public async getAddressById(addressId: string): Promise<MemberAddress | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('address_id', sql.BigInt, addressId)
      .query(`
        SELECT 
          address_id,
          legacy_member_address_id,
          member_id,
          address_type,
          street_line1,
          street_line2,
          city,
          state,
          postal_code,
          country,
          is_primary
        FROM ${DB_TABLES.MEMBER_ADDRESSES}
        WHERE address_id = @address_id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Create new member address
   */
  public async createAddress(dto: CreateMemberAddressDto): Promise<string> {
    const pool = await connectionManager.getPool();
    
    // If this is the primary address, unset others first
    if (dto.is_primary) {
      await this.unsetPrimaryForMember(dto.member_id);
    }
    
    const result = await pool.request()
      .input('member_id', sql.BigInt, dto.member_id)
      .input('address_type', sql.VarChar(50), dto.address_type || 'PRIMARY')
      .input('street_line1', sql.NVarChar(255), dto.street_line1 || null)
      .input('street_line2', sql.NVarChar(255), dto.street_line2 || null)
      .input('city', sql.NVarChar(100), dto.city || null)
      .input('state', sql.VarChar(50), dto.state || null)
      .input('postal_code', sql.VarChar(20), dto.postal_code || null)
      .input('country', sql.VarChar(100), dto.country || null)
      .input('is_primary', sql.Bit, dto.is_primary || false)
      .input('legacy_member_address_id', sql.UniqueIdentifier, dto.legacy_member_address_id || null)
      .query(`
        INSERT INTO ${DB_TABLES.MEMBER_ADDRESSES} (
          member_id,
          address_type,
          street_line1,
          street_line2,
          city,
          state,
          postal_code,
          country,
          is_primary,
          legacy_member_address_id
        )
        VALUES (
          @member_id,
          @address_type,
          @street_line1,
          @street_line2,
          @city,
          @state,
          @postal_code,
          @country,
          @is_primary,
          @legacy_member_address_id
        );
        SELECT CAST(SCOPE_IDENTITY() AS VARCHAR) AS address_id;
      `);

    return result.recordset[0].address_id;
  }

  /**
   * Update member address
   */
  public async updateAddress(addressId: string, dto: UpdateMemberAddressDto): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request().input('address_id', sql.BigInt, addressId);

    // If making this primary, get member_id first and unset others
    if (dto.is_primary) {
      const address = await this.getAddressById(addressId);
      if (address) {
        await this.unsetPrimaryForMember(address.member_id);
      }
    }

    const setClauses: string[] = [];

    if (dto.address_type !== undefined) {
      setClauses.push('address_type = @address_type');
      request.input('address_type', sql.VarChar(50), dto.address_type);
    }

    if (dto.street_line1 !== undefined) {
      setClauses.push('street_line1 = @street_line1');
      request.input('street_line1', sql.NVarChar(255), dto.street_line1);
    }

    if (dto.street_line2 !== undefined) {
      setClauses.push('street_line2 = @street_line2');
      request.input('street_line2', sql.NVarChar(255), dto.street_line2);
    }

    if (dto.city !== undefined) {
      setClauses.push('city = @city');
      request.input('city', sql.NVarChar(100), dto.city);
    }

    if (dto.state !== undefined) {
      setClauses.push('state = @state');
      request.input('state', sql.VarChar(50), dto.state);
    }

    if (dto.postal_code !== undefined) {
      setClauses.push('postal_code = @postal_code');
      request.input('postal_code', sql.VarChar(20), dto.postal_code);
    }

    if (dto.country !== undefined) {
      setClauses.push('country = @country');
      request.input('country', sql.VarChar(100), dto.country);
    }

    if (dto.is_primary !== undefined) {
      setClauses.push('is_primary = @is_primary');
      request.input('is_primary', sql.Bit, dto.is_primary);
    }

    if (dto.legacy_member_address_id !== undefined) {
      setClauses.push('legacy_member_address_id = @legacy_member_address_id');
      request.input('legacy_member_address_id', sql.UniqueIdentifier, dto.legacy_member_address_id);
    }

    if (setClauses.length === 0) {
      return false;
    }

    const result = await request.query(`
      UPDATE ${DB_TABLES.MEMBER_ADDRESSES}
      SET ${setClauses.join(', ')}
      WHERE address_id = @address_id
    `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Delete member address (hard delete)
   */
  public async deleteAddress(addressId: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('address_id', sql.BigInt, addressId)
      .query(`
        DELETE FROM ${DB_TABLES.MEMBER_ADDRESSES}
        WHERE address_id = @address_id
      `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Set an address as primary (and unset others)
   */
  public async setPrimaryAddress(memberId: string, addressId: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    
    // Transaction to ensure atomicity
    const transaction = pool.transaction();
    await transaction.begin();
    
    try {
      // Unset all primary addresses for this member
      await transaction.request()
        .input('member_id', sql.BigInt, memberId)
        .query(`
          UPDATE ${DB_TABLES.MEMBER_ADDRESSES}
          SET is_primary = 0
          WHERE member_id = @member_id
        `);

      // Set the specified address as primary
      const result = await transaction.request()
        .input('address_id', sql.BigInt, addressId)
        .input('member_id', sql.BigInt, memberId)
        .query(`
          UPDATE ${DB_TABLES.MEMBER_ADDRESSES}
          SET is_primary = 1
          WHERE address_id = @address_id AND member_id = @member_id
        `);

      await transaction.commit();
      return result.rowsAffected[0] > 0;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Helper: Unset primary flag for all addresses of a member
   */
  private async unsetPrimaryForMember(memberId: string): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('member_id', sql.BigInt, memberId)
      .query(`
        UPDATE ${DB_TABLES.MEMBER_ADDRESSES}
        SET is_primary = 0
        WHERE member_id = @member_id
      `);
  }
}
