import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { MemberContact, CreateMemberContactDto, UpdateMemberContactDto } from './member-contacts.types';
import { BaseRepository } from '../../core/base/base.repository';

export class MemberContactsRepository extends BaseRepository<MemberContact> {
  constructor() {
    super(DB_TABLES.MEMBER_CONTACTS, 'contact_id', false);
  }
  
  /**
   * Get all contacts for a member
   */
  public async getContactsByMemberId(memberId: string): Promise<MemberContact[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('member_id', sql.BigInt, memberId)
      .query(`
        SELECT 
          contact_id,
          legacy_member_contact_id,
          member_id,
          contact_type,
          contact_value,
          is_primary
        FROM ${DB_TABLES.MEMBER_CONTACTS}
        WHERE member_id = @member_id
        ORDER BY 
          CASE contact_type 
            WHEN 'EMAIL' THEN 1 
            WHEN 'MOBILE' THEN 2 
            WHEN 'PHONE' THEN 3 
            WHEN 'FAX' THEN 4 
            ELSE 5 
          END,
          is_primary DESC,
          contact_id ASC
      `);

    return result.recordset;
  }

  /**
   * Get contact by ID
   */
  public async getContactById(contactId: string): Promise<MemberContact | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('contact_id', sql.BigInt, contactId)
      .query(`
        SELECT 
          contact_id,
          legacy_member_contact_id,
          member_id,
          contact_type,
          contact_value,
          is_primary
        FROM ${DB_TABLES.MEMBER_CONTACTS}
        WHERE contact_id = @contact_id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Create new membercontact
   */
  public async createContact(dto: CreateMemberContactDto): Promise<string> {
    const pool = await connectionManager.getPool();
    
    // If this is the primary contact for this type, unset others first
    if (dto.is_primary && dto.contact_type) {
      await this.unsetPrimaryForMemberAndType(dto.member_id, dto.contact_type);
    }
    
    const result = await pool.request()
      .input('member_id', sql.BigInt, dto.member_id)
      .input('contact_type', sql.VarChar(50), dto.contact_type || null)
      .input('contact_value', sql.VarChar(100), dto.contact_value || null)
      .input('is_primary', sql.Bit, dto.is_primary || false)
      .input('legacy_member_contact_id', sql.UniqueIdentifier, dto.legacy_member_contact_id || null)
      .query(`
        INSERT INTO ${DB_TABLES.MEMBER_CONTACTS} (
          member_id,
          contact_type,
          contact_value,
          is_primary,
          legacy_member_contact_id
        )
        VALUES (
          @member_id,
          @contact_type,
          @contact_value,
          @is_primary,
          @legacy_member_contact_id
        );
        SELECT CAST(SCOPE_IDENTITY() AS VARCHAR) AS contact_id;
      `);

    return result.recordset[0].contact_id;
  }

  /**
   * Update member contact
   */
  public async updateContact(contactId: string, dto: UpdateMemberContactDto): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request().input('contact_id', sql.BigInt, contactId);

    // If making this primary, get member_id and contact_type first and unset others
    if (dto.is_primary) {
      const contact = await this.getContactById(contactId);
      if (contact && contact.contact_type) {
        const contactType = dto.contact_type || contact.contact_type;
        await this.unsetPrimaryForMemberAndType(contact.member_id, contactType);
      }
    }

    const setClauses: string[] = [];

    if (dto.contact_type !== undefined) {
      setClauses.push('contact_type = @contact_type');
      request.input('contact_type', sql.VarChar(50), dto.contact_type);
    }

    if (dto.contact_value !== undefined) {
      setClauses.push('contact_value = @contact_value');
      request.input('contact_value', sql.VarChar(100), dto.contact_value);
    }

    if (dto.is_primary !== undefined) {
      setClauses.push('is_primary = @is_primary');
      request.input('is_primary', sql.Bit, dto.is_primary);
    }

    if (dto.legacy_member_contact_id !== undefined) {
      setClauses.push('legacy_member_contact_id = @legacy_member_contact_id');
      request.input('legacy_member_contact_id', sql.UniqueIdentifier, dto.legacy_member_contact_id);
    }

    if (setClauses.length === 0) {
      return false;
    }

    const result = await request.query(`
      UPDATE ${DB_TABLES.MEMBER_CONTACTS}
      SET ${setClauses.join(', ')}
      WHERE contact_id = @contact_id
    `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Delete member contact (hard delete)
   */
  public async deleteContact(contactId: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('contact_id', sql.BigInt, contactId)
      .query(`
        DELETE FROM ${DB_TABLES.MEMBER_CONTACTS}
        WHERE contact_id = @contact_id
      `);

    return result.rowsAffected[0] > 0;
  }

  /**
   * Set a contact as primary within its type (and unset others of same type)
   */
  public async setPrimaryContact(memberId: string, contactId: string, contactType: string): Promise<boolean> {
    const pool = await connectionManager.getPool();
    
    // Transaction to ensure atomicity
    const transaction = pool.transaction();
    await transaction.begin();
    
    try {
      // Unset all primary contacts for this member and contact type
      await transaction.request()
        .input('member_id', sql.BigInt, memberId)
        .input('contact_type', sql.VarChar(50), contactType)
        .query(`
          UPDATE ${DB_TABLES.MEMBER_CONTACTS}
          SET is_primary = 0
          WHERE member_id = @member_id AND contact_type = @contact_type
        `);

      // Set the specified contact as primary
      const result = await transaction.request()
        .input('contact_id', sql.BigInt, contactId)
        .input('member_id', sql.BigInt, memberId)
        .input('contact_type', sql.VarChar(50), contactType)
        .query(`
          UPDATE ${DB_TABLES.MEMBER_CONTACTS}
          SET is_primary = 1
          WHERE contact_id = @contact_id AND member_id = @member_id AND contact_type = @contact_type
        `);

      await transaction.commit();
      return result.rowsAffected[0] > 0;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Helper: Unset primary flag for all contacts of a member for a specific type
   */
  private async unsetPrimaryForMemberAndType(memberId: string, contactType: string): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('member_id', sql.BigInt, memberId)
      .input('contact_type', sql.VarChar(50), contactType)
      .query(`
        UPDATE ${DB_TABLES.MEMBER_CONTACTS}
        SET is_primary = 0
        WHERE member_id = @member_id AND contact_type = @contact_type
      `);
  }
}
