import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { Bank, BankListItem, BankFilters, PaginatedBanks } from './banks.types';
import { BaseRepository } from '../../core/base/base.repository';

export class BanksRepository extends BaseRepository<Bank> {
  constructor() {
    super(DB_TABLES.BANKS, 'bank_id', false);
  }
  
  /**
   * Get paginated list of banks with filters
   */
  public async getBanks(filters: BankFilters): Promise<PaginatedBanks> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereClauses: string[] = [];

    if (filters.search) {
      whereClauses.push(`(bank_code LIKE @search OR bank_name LIKE @search)`);
      request.input('search', sql.NVarChar(200), `%${filters.search}%`);
    }

    if (filters.isActive !== undefined) {
      whereClauses.push('is_active = @isActive');
      request.input('isActive', sql.Bit, filters.isActive);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Sorting
    const sortBy = filters.sortBy || 'bank_id';
    const sortOrder = filters.sortOrder || 'DESC';
    const orderBy = `ORDER BY ${sortBy} ${sortOrder}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${DB_TABLES.BANKS}
      ${whereClause}
    `;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    // Get banks
    const query = `
      SELECT 
        bank_id,
        legacy_bank_id,
        bank_code,
        bank_name,
        is_active
      FROM ${DB_TABLES.BANKS}
      ${whereClause}
      ${orderBy}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    const banks: BankListItem[] = result.recordset.map((row: any) => ({
      bank_id: row.bank_id,
      legacy_bank_id: row.legacy_bank_id,
      bank_code: row.bank_code,
      bank_name: row.bank_name,
      is_active: row.is_active
    }));

    return {
      banks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get bank by ID
   */
  public async getBankById(bankId: number): Promise<Bank | null> {
    return await this.findById(bankId);
  }

  /**
   * Check if bank code exists
   */
  public async bankCodeExists(bankCode: string, excludeBankId?: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    let query = `
      SELECT COUNT(*) as count 
      FROM ${DB_TABLES.BANKS} 
      WHERE bank_code = @bankCode
    `;

    if (excludeBankId) {
      query += ' AND bank_id != @excludeBankId';
      request.input('excludeBankId', sql.BigInt, excludeBankId);
    }

    request.input('bankCode', sql.VarChar(50), bankCode);
    const result = await request.query(query);

    return result.recordset[0].count > 0;
  }

  /**
   * Create new bank
   */
  public async createBank(
    bankCode: string,
    bankName: string,
    legacyBankId: string | undefined,
    isActive: boolean
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('bankCode', sql.VarChar(50), bankCode)
      .input('bankName', sql.NVarChar(255), bankName)
      .input('isActive', sql.Bit, isActive);
      
    let query = '';
    if (legacyBankId) {
      request.input('legacyBankId', sql.UniqueIdentifier, legacyBankId);
      query = `
        INSERT INTO ${DB_TABLES.BANKS} (
          bank_code, bank_name, legacy_bank_id, is_active
        )
        OUTPUT INSERTED.bank_id
        VALUES (
          @bankCode, @bankName, @legacyBankId, @isActive
        )
      `;
    } else {
      query = `
        INSERT INTO ${DB_TABLES.BANKS} (
          bank_code, bank_name, is_active
        )
        OUTPUT INSERTED.bank_id
        VALUES (
          @bankCode, @bankName, @isActive
        )
      `;
    }
    
    const result = await request.query(query);
    return result.recordset[0].bank_id;
  }

  /**
   * Update bank
   */
  public async updateBank(
    bankId: number,
    bankCode: string | undefined,
    bankName: string | undefined,
    legacyBankId: string | undefined,
    isActive: boolean | undefined
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (bankCode !== undefined) {
      updates.push('bank_code = @bankCode');
      request.input('bankCode', sql.VarChar(50), bankCode);
    }

    if (bankName !== undefined) {
      updates.push('bank_name = @bankName');
      request.input('bankName', sql.NVarChar(255), bankName);
    }

    if (legacyBankId !== undefined) {
      if (legacyBankId) {
        updates.push('legacy_bank_id = @legacyBankId');
        request.input('legacyBankId', sql.UniqueIdentifier, legacyBankId);
      } else {
        updates.push('legacy_bank_id = NULL');
      }
    }

    if (isActive !== undefined) {
      updates.push('is_active = @isActive');
      request.input('isActive', sql.Bit, isActive);
    }

    if (updates.length === 0) {
      return; // Nothing to update
    }

    request.input('bankId', sql.BigInt, bankId);

    await request.query(`
      UPDATE ${DB_TABLES.BANKS}
      SET ${updates.join(', ')}
      WHERE bank_id = @bankId
    `);
  }

  /**
   * Delete bank (soft delete - deactivate)
   */
  public async deleteBank(bankId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('bankId', sql.BigInt, bankId)
      .query(`
        UPDATE ${DB_TABLES.BANKS}
        SET is_active = 0
        WHERE bank_id = @bankId
      `);
  }
}
