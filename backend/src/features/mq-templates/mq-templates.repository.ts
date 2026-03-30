import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import {
  MqTemplate,
  MqTemplateListItem,
  MqTemplateQuestion,
  MqTemplateFilters,
  PaginatedMqTemplates,
  MqTemplateWithQuestions
} from './mq-templates.types';

export class MqTemplatesRepository {

  // ─── Templates ─────────────────────────────────────────────────────────────

  public async getTemplates(filters: MqTemplateFilters): Promise<PaginatedMqTemplates> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];

    if (filters.search) {
      whereClauses.push(`(t.template_code LIKE @search OR t.template_category LIKE @search)`);
      request.input('search', sql.NVarChar(200), `%${filters.search}%`);
    }

    if (filters.recipient_type) {
      whereClauses.push(`t.recipient_type = @recipientType`);
      request.input('recipientType', sql.VarChar(20), filters.recipient_type);
    }

    if (filters.is_active !== undefined) {
      whereClauses.push(`t.is_active = @isActive`);
      request.input('isActive', sql.Bit, filters.is_active);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sortBy = filters.sort_by || 'template_id';
    const sortOrder = filters.sort_order || 'ASC';

    const countResult = await request.query(`
      SELECT COUNT(*) as total FROM ${DB_TABLES.MQ_TEMPLATES} t ${whereClause}
    `);
    const total = countResult.recordset[0].total;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT
        t.template_id,
        t.template_code,
        t.template_category,
        t.recipient_type,
        t.mode,
        t.email_subject,
        t.reminder_days,
        t.auto_reminder_days,
        t.is_active,
        COUNT(q.question_id) as question_count
      FROM ${DB_TABLES.MQ_TEMPLATES} t
      LEFT JOIN ${DB_TABLES.MQ_TEMPLATE_QUESTIONS} q ON q.template_id = t.template_id AND q.is_active = 1
      ${whereClause}
      GROUP BY t.template_id, t.template_code, t.template_category, t.recipient_type, t.mode, t.email_subject, t.reminder_days, t.auto_reminder_days, t.is_active
      ORDER BY ${sortBy} ${sortOrder}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const templates: MqTemplateListItem[] = result.recordset.map((row: any) => ({
      template_id: row.template_id,
      template_code: row.template_code,
      template_category: row.template_category,
      recipient_type: row.recipient_type,
      mode: row.mode,
      email_subject: row.email_subject,
      reminder_days: row.reminder_days,
      auto_reminder_days: row.auto_reminder_days,
      question_count: row.question_count,
      is_active: row.is_active
    }));

    return { templates, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getTemplateById(templateId: number): Promise<MqTemplate | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('templateId', sql.BigInt, templateId)
      .query(`SELECT * FROM ${DB_TABLES.MQ_TEMPLATES} WHERE template_id = @templateId`);
    return result.recordset[0] || null;
  }

  public async getTemplateWithQuestions(templateId: number): Promise<MqTemplateWithQuestions | null> {
    const pool = await connectionManager.getPool();
    const tResult = await pool.request()
      .input('templateId', sql.BigInt, templateId)
      .query(`SELECT * FROM ${DB_TABLES.MQ_TEMPLATES} WHERE template_id = @templateId`);

    if (!tResult.recordset[0]) return null;
    const template = tResult.recordset[0] as MqTemplate;

    const qResult = await pool.request()
      .input('templateId', sql.BigInt, templateId)
      .query(`
        SELECT * FROM ${DB_TABLES.MQ_TEMPLATE_QUESTIONS}
        WHERE template_id = @templateId AND is_active = 1
        ORDER BY sort_order ASC
      `);

    return { ...template, questions: qResult.recordset as MqTemplateQuestion[] };
  }

  /**
   * Get all active templates with questions grouped by recipient_type (for the MQ Builder)
   */
  public async getAllTemplatesForBuilder(): Promise<{ hospital: any[]; policyholder: any[] }> {
    const pool = await connectionManager.getPool();
    const result = await pool.request().query(`
      SELECT
        t.template_id,
        t.template_code,
        t.template_category,
        t.recipient_type,
        q.question_id,
        q.question_text,
        q.required_lines,
        q.sort_order
      FROM ${DB_TABLES.MQ_TEMPLATES} t
      LEFT JOIN ${DB_TABLES.MQ_TEMPLATE_QUESTIONS} q
        ON q.template_id = t.template_id AND q.is_active = 1
      WHERE t.is_active = 1
      ORDER BY t.recipient_type, t.template_id, q.sort_order ASC
    `);

    const hospitalMap = new Map<number, any>();
    const policyholderMap = new Map<number, any>();

    for (const row of result.recordset) {
      const map = row.recipient_type === 'HOSP' ? hospitalMap : policyholderMap;
      if (!map.has(row.template_id)) {
        map.set(row.template_id, {
          template_id: row.template_id,
          template_code: row.template_code,
          category: row.template_category,
          items: []
        });
      }
      if (row.question_id) {
        map.get(row.template_id).items.push({
          id: `${row.template_code}_${row.question_id}`,
          question_id: row.question_id,
          text: row.question_text,
          lines: row.required_lines
        });
      }
    }

    return {
      hospital: Array.from(hospitalMap.values()),
      policyholder: Array.from(policyholderMap.values())
    };
  }

  public async templateCodeExists(code: string, excludeId?: number): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request().input('code', sql.VarChar(100), code);
    let query = `SELECT COUNT(*) as cnt FROM ${DB_TABLES.MQ_TEMPLATES} WHERE template_code = @code`;
    if (excludeId) {
      query += ` AND template_id != @excludeId`;
      request.input('excludeId', sql.BigInt, excludeId);
    }
    const result = await request.query(query);
    return result.recordset[0].cnt > 0;
  }

  public async createTemplate(dto: any, createdBy: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('code', sql.VarChar(100), dto.template_code)
      .input('category', sql.NVarChar(255), dto.template_category)
      .input('recipientType', sql.VarChar(20), dto.recipient_type)
      .input('mode', sql.VarChar(20), dto.mode || null)
      .input('header', sql.NVarChar(sql.MAX), dto.header_message || null)
      .input('footer', sql.NVarChar(sql.MAX), dto.footer_message || null)
      .input('emailSubject', sql.VarChar(255), dto.email_subject || null)
      .input('reminderDays', sql.Int, dto.reminder_days ?? null)
      .input('autoReminderDays', sql.Int, dto.auto_reminder_days ?? null)
      .input('isActive', sql.Bit, dto.is_active !== undefined ? dto.is_active : true)
      .input('createdBy', sql.VarChar(50), createdBy)
      .query(`
        INSERT INTO ${DB_TABLES.MQ_TEMPLATES}
          (template_code, template_category, recipient_type, mode, header_message, footer_message, email_subject, reminder_days, auto_reminder_days, is_active, created_by)
        OUTPUT INSERTED.template_id
        VALUES (@code, @category, @recipientType, @mode, @header, @footer, @emailSubject, @reminderDays, @autoReminderDays, @isActive, @createdBy)
      `);
    return result.recordset[0].template_id;
  }

  public async updateTemplate(templateId: number, dto: any, updatedBy: string): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request().input('templateId', sql.BigInt, templateId);

    if (dto.template_code !== undefined)     { updates.push('template_code = @code');          request.input('code', sql.VarChar(100), dto.template_code); }
    if (dto.template_category !== undefined) { updates.push('template_category = @category');  request.input('category', sql.NVarChar(255), dto.template_category); }
    if (dto.recipient_type !== undefined)    { updates.push('recipient_type = @recipientType'); request.input('recipientType', sql.VarChar(20), dto.recipient_type); }
    if (dto.mode !== undefined)              { updates.push('mode = @mode');                   request.input('mode', sql.VarChar(20), dto.mode); }
    if (dto.header_message !== undefined)    { updates.push('header_message = @header');       request.input('header', sql.NVarChar(sql.MAX), dto.header_message); }
    if (dto.footer_message !== undefined)    { updates.push('footer_message = @footer');       request.input('footer', sql.NVarChar(sql.MAX), dto.footer_message); }
    if (dto.email_subject !== undefined)     { updates.push('email_subject = @emailSubject');  request.input('emailSubject', sql.VarChar(255), dto.email_subject); }
    if (dto.reminder_days !== undefined)     { updates.push('reminder_days = @reminderDays');  request.input('reminderDays', sql.Int, dto.reminder_days); }
    if (dto.auto_reminder_days !== undefined){ updates.push('auto_reminder_days = @autoReminderDays'); request.input('autoReminderDays', sql.Int, dto.auto_reminder_days); }
    if (dto.is_active !== undefined)         { updates.push('is_active = @isActive');          request.input('isActive', sql.Bit, dto.is_active); }

    if (updates.length === 0) return;
    updates.push('updated_at = GETDATE()', 'updated_by = @updatedBy');
    request.input('updatedBy', sql.VarChar(50), updatedBy);

    await request.query(`
      UPDATE ${DB_TABLES.MQ_TEMPLATES} SET ${updates.join(', ')} WHERE template_id = @templateId
    `);
  }

  public async deleteTemplate(templateId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('templateId', sql.BigInt, templateId)
      .query(`UPDATE ${DB_TABLES.MQ_TEMPLATES} SET is_active = 0 WHERE template_id = @templateId`);
  }

  // ─── Questions ─────────────────────────────────────────────────────────────

  public async getQuestionsByTemplateId(templateId: number): Promise<MqTemplateQuestion[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('templateId', sql.BigInt, templateId)
      .query(`
        SELECT * FROM ${DB_TABLES.MQ_TEMPLATE_QUESTIONS}
        WHERE template_id = @templateId AND is_active = 1
        ORDER BY sort_order ASC
      `);
    return result.recordset as MqTemplateQuestion[];
  }

  public async getQuestionById(questionId: number): Promise<MqTemplateQuestion | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('questionId', sql.BigInt, questionId)
      .query(`SELECT * FROM ${DB_TABLES.MQ_TEMPLATE_QUESTIONS} WHERE question_id = @questionId`);
    return result.recordset[0] || null;
  }

  public async createQuestion(dto: any, createdBy: string): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('templateId', sql.BigInt, dto.template_id)
      .input('questionText', sql.NVarChar(sql.MAX), dto.question_text)
      .input('requiredLines', sql.Int, dto.required_lines ?? 1)
      .input('sortOrder', sql.Int, dto.sort_order ?? 0)
      .input('isActive', sql.Bit, dto.is_active !== undefined ? dto.is_active : true)
      .input('createdBy', sql.VarChar(50), createdBy)
      .query(`
        INSERT INTO ${DB_TABLES.MQ_TEMPLATE_QUESTIONS}
          (template_id, question_text, required_lines, sort_order, is_active, created_by)
        OUTPUT INSERTED.question_id
        VALUES (@templateId, @questionText, @requiredLines, @sortOrder, @isActive, @createdBy)
      `);
    return result.recordset[0].question_id;
  }

  public async updateQuestion(questionId: number, dto: any, updatedBy: string): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request().input('questionId', sql.BigInt, questionId);

    if (dto.question_text !== undefined)  { updates.push('question_text = @questionText');  request.input('questionText', sql.NVarChar(sql.MAX), dto.question_text); }
    if (dto.required_lines !== undefined) { updates.push('required_lines = @requiredLines'); request.input('requiredLines', sql.Int, dto.required_lines); }
    if (dto.sort_order !== undefined)     { updates.push('sort_order = @sortOrder');        request.input('sortOrder', sql.Int, dto.sort_order); }
    if (dto.is_active !== undefined)      { updates.push('is_active = @isActive');          request.input('isActive', sql.Bit, dto.is_active); }

    if (updates.length === 0) return;
    updates.push('updated_at = GETDATE()', 'updated_by = @updatedBy');
    request.input('updatedBy', sql.VarChar(50), updatedBy);

    await request.query(`
      UPDATE ${DB_TABLES.MQ_TEMPLATE_QUESTIONS} SET ${updates.join(', ')} WHERE question_id = @questionId
    `);
  }

  public async deleteQuestion(questionId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('questionId', sql.BigInt, questionId)
      .query(`UPDATE ${DB_TABLES.MQ_TEMPLATE_QUESTIONS} SET is_active = 0 WHERE question_id = @questionId`);
  }
}
