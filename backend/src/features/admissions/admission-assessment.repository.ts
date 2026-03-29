import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants/database.constants';
import { AdmissionAssessment, UpsertAdmissionAssessmentsDto } from './dto/admission-assessment.dto';

const TABLE = DB_TABLES.ADMISSION_ASSESSMENTS;

export class AdmissionAssessmentRepository {
  /**
   * Get all assessment fields for an admission
   */
  public async getByAdmissionId(admissionId: number): Promise<AdmissionAssessment[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('admission_id', sql.BigInt, admissionId)
      .query(`
        SELECT
          assessment_id,
          admission_id,
          field_name,
          field_value,
          created_at,
          created_by,
          updated_at,
          updated_by
        FROM ${TABLE}
        WHERE admission_id = @admission_id
        ORDER BY field_name
      `);
    return result.recordset;
  }

  /**
   * Bulk upsert assessment fields using MERGE
   * Inserts new rows; updates existing rows (matched on admission_id + field_name)
   */
  public async upsertAssessments(dto: UpsertAdmissionAssessmentsDto, performedBy: string): Promise<void> {
    if (!dto.fields || dto.fields.length === 0) return;

    const pool = await connectionManager.getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const field of dto.fields) {
        await transaction.request()
          .input('admission_id', sql.BigInt, dto.admission_id)
          .input('field_name', sql.VarChar(100), field.field_name)
          .input('field_value', sql.NVarChar(sql.MAX), field.field_value ?? null)
          .input('performedBy', sql.VarChar(50), performedBy)
          .query(`
            MERGE ${TABLE} AS target
            USING (SELECT @admission_id AS admission_id, @field_name AS field_name) AS source
              ON target.admission_id = source.admission_id
             AND target.field_name  = source.field_name
            WHEN MATCHED THEN
              UPDATE SET
                field_value = @field_value,
                updated_at  = GETDATE(),
                updated_by  = @performedBy
            WHEN NOT MATCHED THEN
              INSERT (admission_id, field_name, field_value, created_by, created_at)
              VALUES (@admission_id, @field_name, @field_value, @performedBy, GETDATE());
          `);
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
