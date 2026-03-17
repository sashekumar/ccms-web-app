import { MqTemplatesRepository } from './mq-templates.repository';
import {
  CreateMqTemplateDto,
  UpdateMqTemplateDto,
  MqTemplateFilters,
  PaginatedMqTemplates,
  MqTemplate,
  MqTemplateWithQuestions,
  MqTemplateQuestion,
  CreateMqQuestionDto,
  UpdateMqQuestionDto
} from './mq-templates.types';

export class MqTemplatesService {
  private repository: MqTemplatesRepository;

  constructor() {
    this.repository = new MqTemplatesRepository();
  }

  // ─── Templates ─────────────────────────────────────────────────────────────

  public async getTemplates(filters: MqTemplateFilters): Promise<PaginatedMqTemplates> {
    return this.repository.getTemplates(filters);
  }

  public async getTemplateById(id: number): Promise<MqTemplate | null> {
    return this.repository.getTemplateById(id);
  }

  public async getTemplateWithQuestions(id: number): Promise<MqTemplateWithQuestions | null> {
    return this.repository.getTemplateWithQuestions(id);
  }

  public async getBuilderData(): Promise<{ hospital: any[]; policyholder: any[] }> {
    return this.repository.getAllTemplatesForBuilder();
  }

  public async createTemplate(dto: CreateMqTemplateDto, createdBy: string): Promise<number> {
    if (!dto.template_code || dto.template_code.length < 2 || dto.template_code.length > 100) {
      throw new Error('template_code must be between 2 and 100 characters');
    }
    if (!dto.template_category || dto.template_category.length < 2) {
      throw new Error('template_category is required');
    }
    if (!['HOSP', 'PH'].includes(dto.recipient_type)) {
      throw new Error('recipient_type must be HOSP or PH');
    }

    const exists = await this.repository.templateCodeExists(dto.template_code);
    if (exists) throw new Error('Template code already exists');

    return this.repository.createTemplate(dto, createdBy);
  }

  public async updateTemplate(id: number, dto: UpdateMqTemplateDto, updatedBy: string): Promise<void> {
    const template = await this.repository.getTemplateById(id);
    if (!template) throw new Error('Template not found');

    if (dto.template_code) {
      const exists = await this.repository.templateCodeExists(dto.template_code, id);
      if (exists) throw new Error('Template code already exists');
    }

    if (dto.recipient_type && !['HOSP', 'PH'].includes(dto.recipient_type)) {
      throw new Error('recipient_type must be HOSP or PH');
    }

    return this.repository.updateTemplate(id, dto, updatedBy);
  }

  public async deleteTemplate(id: number): Promise<void> {
    const template = await this.repository.getTemplateById(id);
    if (!template) throw new Error('Template not found');
    return this.repository.deleteTemplate(id);
  }

  // ─── Questions ─────────────────────────────────────────────────────────────

  public async getQuestions(templateId: number): Promise<MqTemplateQuestion[]> {
    return this.repository.getQuestionsByTemplateId(templateId);
  }

  public async createQuestion(dto: CreateMqQuestionDto, createdBy: string): Promise<number> {
    const template = await this.repository.getTemplateById(dto.template_id);
    if (!template) throw new Error('Template not found');

    if (!dto.question_text || dto.question_text.trim().length < 5) {
      throw new Error('question_text must be at least 5 characters');
    }

    return this.repository.createQuestion(dto, createdBy);
  }

  public async updateQuestion(questionId: number, dto: UpdateMqQuestionDto, updatedBy: string): Promise<void> {
    const question = await this.repository.getQuestionById(questionId);
    if (!question) throw new Error('Question not found');
    return this.repository.updateQuestion(questionId, dto, updatedBy);
  }

  public async deleteQuestion(questionId: number): Promise<void> {
    const question = await this.repository.getQuestionById(questionId);
    if (!question) throw new Error('Question not found');
    return this.repository.deleteQuestion(questionId);
  }
}
