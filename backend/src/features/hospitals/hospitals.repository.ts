import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { Hospital, HospitalListItem, HospitalFilters, PaginatedHospitals, HospitalStats } from './hospitals.types';
import { BaseRepository } from '../../core/base/base.repository';

export class HospitalsRepository extends BaseRepository<Hospital> {
  constructor() {
    super(DB_TABLES.HOSPITALS, 'hospital_id', false);
  }
  
  /**
   * Get paginated list of hospitals with filters
   */
  public async getHospitals(filters: HospitalFilters): Promise<PaginatedHospitals> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereClauses: string[] = [];

    if (filters.search) {
      whereClauses.push(`(hospital_code LIKE @search OR hospital_name LIKE @search)`);
      request.input('search', sql.NVarChar(255), `%${filters.search}%`);
    }

    if (filters.hospitalType) {
      whereClauses.push('hospital_type = @hospitalType');
      request.input('hospitalType', sql.VarChar(50), filters.hospitalType);
    }

    if (filters.isPanel !== undefined) {
      whereClauses.push('is_panel = @isPanel');
      request.input('isPanel', sql.Bit, filters.isPanel);
    }

    if (filters.panelStatus) {
      whereClauses.push('panel_status = @panelStatus');
      request.input('panelStatus', sql.VarChar(50), filters.panelStatus);
    }

    if (filters.isDeleted !== undefined) {
      whereClauses.push('is_deleted = @isDeleted');
      request.input('isDeleted', sql.Bit, filters.isDeleted);
    } else {
      // By default, exclude deleted hospitals
      whereClauses.push('is_deleted = 0');
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Sorting
    const sortBy = filters.sortBy || 'hospital_id';
    const sortOrder = filters.sortOrder || 'DESC';
    const orderBy = `ORDER BY ${sortBy} ${sortOrder}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${DB_TABLES.HOSPITALS}
      ${whereClause}
    `;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    // Get hospitals
    const query = `
      SELECT 
        hospital_id,
        legacy_hospital_id,
        hospital_name,
        hospital_code,
        hospital_type,
        is_panel,
        panel_status,
        accreditation_status,
        is_deleted
      FROM ${DB_TABLES.HOSPITALS}
      ${whereClause}
      ${orderBy}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    const hospitals: HospitalListItem[] = result.recordset.map((row: any) => ({
      hospital_id: row.hospital_id,
      legacy_hospital_id: row.legacy_hospital_id,
      hospital_name: row.hospital_name,
      hospital_code: row.hospital_code,
      hospital_type: row.hospital_type,
      is_panel: row.is_panel,
      panel_status: row.panel_status,
      accreditation_status: row.accreditation_status,
      is_deleted: row.is_deleted
    }));

    // Get stats
    const stats = await this.getHospitalStats(filters);

    return {
      hospitals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats
    };
  }

  /**
   * Get hospital statistics based on filters
   */
  public async getHospitalStats(filters: HospitalFilters): Promise<HospitalStats> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    // Build WHERE clause (same as getHospitals)
    const whereClauses: string[] = [];

    if (filters.search) {
      whereClauses.push(`(hospital_code LIKE @search OR hospital_name LIKE @search)`);
      request.input('search', sql.NVarChar(255), `%${filters.search}%`);
    }

    if (filters.hospitalType) {
      whereClauses.push('hospital_type = @hospitalType');
      request.input('hospitalType', sql.VarChar(50), filters.hospitalType);
    }

    if (filters.isPanel !== undefined) {
      whereClauses.push('is_panel = @isPanel');
      request.input('isPanel', sql.Bit, filters.isPanel);
    }

    if (filters.panelStatus) {
      whereClauses.push('panel_status = @panelStatus');
      request.input('panelStatus', sql.VarChar(50), filters.panelStatus);
    }

    if (filters.isDeleted !== undefined) {
      whereClauses.push('is_deleted = @isDeleted');
      request.input('isDeleted', sql.Bit, filters.isDeleted);
    } else {
      // By default, exclude deleted hospitals
      whereClauses.push('is_deleted = 0');
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get aggregate stats
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_panel = 1 THEN 1 ELSE 0 END) as panel,
        SUM(CASE WHEN is_panel = 0 THEN 1 ELSE 0 END) as nonPanel,
        SUM(CASE WHEN is_deleted = 0 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) as inactive
      FROM ${DB_TABLES.HOSPITALS}
      ${whereClause}
    `;

    const result = await request.query(query);
    const row = result.recordset[0];

    return {
      total: row.total || 0,
      panel: row.panel || 0,
      nonPanel: row.nonPanel || 0,
      active: row.active || 0,
      inactive: row.inactive || 0
    };
  }

  /**
   * Get hospital by ID
   */
  public async getHospitalById(hospitalId: number): Promise<Hospital | null> {
    return await this.findById(hospitalId);
  }

  /**
   * Check if hospital code exists
   */
  public async hospitalCodeExists(hospitalCode: string, excludeHospitalId?: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    let query = `
      SELECT COUNT(*) as count 
      FROM ${DB_TABLES.HOSPITALS} 
      WHERE hospital_code = @hospitalCode
    `;

    if (excludeHospitalId) {
      query += ' AND hospital_id != @excludeHospitalId';
      request.input('excludeHospitalId', sql.BigInt, excludeHospitalId);
    }

    request.input('hospitalCode', sql.VarChar(50), hospitalCode);
    const result = await request.query(query);

    return result.recordset[0].count > 0;
  }

  /**
   * Create new hospital
   */
  public async createHospital(
    hospitalName: string,
    hospitalCode: string | undefined,
    hospitalType: string | undefined,
    regNo: string | undefined,
    bankId: number | undefined,
    bankAccNo: string | undefined,
    legacyHospitalId: string | undefined,
    isPanel: boolean,
    panelStatus: string | undefined,
    panelEffectiveDate: Date | undefined,
    accreditationStatus: string | undefined,
    accreditationExpiry: Date | undefined,
    isDeleted: boolean,
    createdBy: string | undefined
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const request = pool.request()
      .input('hospitalName', sql.NVarChar(255), hospitalName)
      .input('isPanel', sql.Bit, isPanel)
      .input('isDeleted', sql.Bit, isDeleted);

   // Build dynamic query based on provided fields
    const fields: string[] = ['hospital_name', 'is_panel', 'is_deleted'];
    const values: string[] = ['@hospitalName', '@isPanel', '@isDeleted'];

    if (hospitalCode) {
      fields.push('hospital_code');
      values.push('@hospitalCode');
      request.input('hospitalCode', sql.VarChar(50), hospitalCode);
    }

    if (hospitalType) {
      fields.push('hospital_type');
      values.push('@hospitalType');
      request.input('hospitalType', sql.VarChar(50), hospitalType);
    }

    if (regNo) {
      fields.push('reg_no');
      values.push('@regNo');
      request.input('regNo', sql.VarChar(50), regNo);
    }

    if (bankId) {
      fields.push('bank_id');
      values.push('@bankId');
      request.input('bankId', sql.Int, bankId);
    }

    if (bankAccNo) {
      fields.push('bank_acc_no');
      values.push('@bankAccNo');
      request.input('bankAccNo', sql.VarChar(50), bankAccNo);
    }

    if (legacyHospitalId) {
      fields.push('legacy_hospital_id');
      values.push('@legacyHospitalId');
      request.input('legacyHospitalId', sql.UniqueIdentifier, legacyHospitalId);
    }

    if (panelStatus) {
      fields.push('panel_status');
      values.push('@panelStatus');
      request.input('panelStatus', sql.VarChar(50), panelStatus);
    }

    if (panelEffectiveDate) {
      fields.push('panel_effective_date');
      values.push('@panelEffectiveDate');
      request.input('panelEffectiveDate', sql.Date, panelEffectiveDate);
    }

    if (accreditationStatus) {
      fields.push('accreditation_status');
      values.push('@accreditationStatus');
      request.input('accreditationStatus', sql.VarChar(50), accreditationStatus);
    }

    if (accreditationExpiry) {
      fields.push('accreditation_expiry');
      values.push('@accreditationExpiry');
      request.input('accreditationExpiry', sql.Date, accreditationExpiry);
    }

    if (createdBy) {
      fields.push('created_by');
      values.push('@createdBy');
      request.input('createdBy', sql.VarChar(50), createdBy);
    }

    const query = `
      INSERT INTO ${DB_TABLES.HOSPITALS} (
        ${fields.join(', ')}
      )
      OUTPUT INSERTED.hospital_id
      VALUES (
        ${values.join(', ')}
      )
    `;
    
    const result = await request.query(query);
    return result.recordset[0].hospital_id;
  }

  /**
   * Update hospital
   */
  public async updateHospital(
    hospitalId: number,
    hospitalName: string | undefined,
    hospitalCode: string | undefined,
    hospitalType: string | undefined,
    regNo: string | undefined,
    bankId: number | undefined,
    bankAccNo: string | undefined,
    legacyHospitalId: string | undefined,
    isPanel: boolean | undefined,
    panelStatus: string | undefined,
    panelEffectiveDate: Date | undefined,
    accreditationStatus: string | undefined,
    accreditationExpiry: Date | undefined,
    isDeleted: boolean | undefined,
    updatedBy: string | undefined
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (hospitalName !== undefined) {
      updates.push('hospital_name = @hospitalName');
      request.input('hospitalName', sql.NVarChar(255), hospitalName);
    }

    if (hospitalCode !== undefined) {
      if (hospitalCode) {
        updates.push('hospital_code = @hospitalCode');
        request.input('hospitalCode', sql.VarChar(50), hospitalCode);
      } else {
        updates.push('hospital_code = NULL');
      }
    }

    if (hospitalType !== undefined) {
      if (hospitalType) {
        updates.push('hospital_type = @hospitalType');
        request.input('hospitalType', sql.VarChar(50), hospitalType);
      } else {
        updates.push('hospital_type = NULL');
      }
    }

    if (regNo !== undefined) {
      if (regNo) {
        updates.push('reg_no = @regNo');
        request.input('regNo', sql.VarChar(50), regNo);
      } else {
        updates.push('reg_no = NULL');
      }
    }

    if (bankId !== undefined) {
      if (bankId) {
        updates.push('bank_id = @bankId');
        request.input('bankId', sql.Int, bankId);
      } else {
        updates.push('bank_id = NULL');
      }
    }

    if (bankAccNo !== undefined) {
      if (bankAccNo) {
        updates.push('bank_acc_no = @bankAccNo');
        request.input('bankAccNo', sql.VarChar(50), bankAccNo);
      } else {
        updates.push('bank_acc_no = NULL');
      }
    }

    if (legacyHospitalId !== undefined) {
      if (legacyHospitalId) {
        updates.push('legacy_hospital_id = @legacyHospitalId');
        request.input('legacyHospitalId', sql.UniqueIdentifier, legacyHospitalId);
      } else {
        updates.push('legacy_hospital_id = NULL');
      }
    }

    if (isPanel !== undefined) {
      updates.push('is_panel = @isPanel');
      request.input('isPanel', sql.Bit, isPanel);
    }

    if (panelStatus !== undefined) {
      if (panelStatus) {
        updates.push('panel_status = @panelStatus');
        request.input('panelStatus', sql.VarChar(50), panelStatus);
      } else {
        updates.push('panel_status = NULL');
      }
    }

    if (panelEffectiveDate !== undefined) {
      if (panelEffectiveDate) {
        updates.push('panel_effective_date = @panelEffectiveDate');
        request.input('panelEffectiveDate', sql.Date, panelEffectiveDate);
      } else {
        updates.push('panel_effective_date = NULL');
      }
    }

    if (accreditationStatus !== undefined) {
      if (accreditationStatus) {
        updates.push('accreditation_status = @accreditationStatus');
        request.input('accreditationStatus', sql.VarChar(50), accreditationStatus);
      } else {
        updates.push('accreditation_status = NULL');
      }
    }

    if (accreditationExpiry !== undefined) {
      if (accreditationExpiry) {
        updates.push('accreditation_expiry = @accreditationExpiry');
        request.input('accreditationExpiry', sql.Date, accreditationExpiry);
      } else {
        updates.push('accreditation_expiry = NULL');
      }
    }

    if (isDeleted !== undefined) {
      updates.push('is_deleted = @isDeleted');
      request.input('isDeleted', sql.Bit, isDeleted);
    }

    if (updatedBy !== undefined) {
      updates.push('updated_by = @updatedBy');
      request.input('updatedBy', sql.VarChar(50), updatedBy);
    }

    // Always set updated_at
    updates.push('updated_at = GETDATE()');

    if (updates.length === 0) {
      return; // Nothing to update
    }

    request.input('hospitalId', sql.BigInt, hospitalId);

    await request.query(`
      UPDATE ${DB_TABLES.HOSPITALS}
      SET ${updates.join(', ')}
      WHERE hospital_id = @hospitalId
    `);
  }

  /**
   * Delete hospital (soft delete)
   */
  public async deleteHospital(hospitalId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('hospitalId', sql.BigInt, hospitalId)
      .query(`
        UPDATE ${DB_TABLES.HOSPITALS}
        SET is_deleted = 1, updated_at = GETDATE()
        WHERE hospital_id = @hospitalId
      `);
  }
}
