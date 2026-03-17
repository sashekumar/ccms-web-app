import { Request, Response } from 'express';
import { MqTemplatesService } from './mq-templates.service';
import { ResponseUtil } from '../../core/utils/response.util';
import { getErrorMessage } from '../../core/utils/error.util';

export class MqTemplatesController {
  private service: MqTemplatesService;

  constructor() {
    this.service = new MqTemplatesService();
  }

  // ─── Templates ─────────────────────────────────────────────────────────────

  /** POST /api/master/mq-templates/list */
  public getTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        search: req.body.search,
        recipient_type: req.body.recipient_type,
        is_active: req.body.is_active,
        page: req.body.page ?? 1,
        limit: req.body.limit ?? 10,
        sort_by: req.body.sort_by ?? 'template_id',
        sort_order: req.body.sort_order ?? 'ASC'
      };
      const result = await this.service.getTemplates(filters);
      ResponseUtil.success(res, result, 'Templates retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching templates', 500, getErrorMessage(error));
    }
  };

  /** POST /api/master/mq-templates/get */
  public getTemplateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { template_id } = req.body;
      if (!template_id) { ResponseUtil.error(res, 'template_id is required', 400); return; }

      const template = await this.service.getTemplateById(Number(template_id));
      if (!template) { ResponseUtil.notFound(res, 'Template not found'); return; }

      ResponseUtil.success(res, template, 'Template retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching template', 500, getErrorMessage(error));
    }
  };

  /** POST /api/master/mq-templates/get-with-questions */
  public getTemplateWithQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { template_id } = req.body;
      if (!template_id) { ResponseUtil.error(res, 'template_id is required', 400); return; }

      const data = await this.service.getTemplateWithQuestions(Number(template_id));
      if (!data) { ResponseUtil.notFound(res, 'Template not found'); return; }

      ResponseUtil.success(res, data, 'Template retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching template', 500, getErrorMessage(error));
    }
  };

  /** GET /api/master/mq-templates/builder */
  public getBuilderData = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.service.getBuilderData();
      ResponseUtil.success(res, data, 'Builder data retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching builder data', 500, getErrorMessage(error));
    }
  };

  /** POST /api/master/mq-templates/create */
  public createTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user?.userId?.toString();
      const id = await this.service.createTemplate(req.body, createdBy);
      ResponseUtil.success(res, { template_id: id }, 'Template created successfully', 201);
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      if (msg.includes('already exists')) { ResponseUtil.conflict(res, msg); return; }
      if (msg.includes('must be') || msg.includes('required')) { ResponseUtil.error(res, msg, 400); return; }
      ResponseUtil.error(res, 'Error creating template', 500, msg);
    }
  };

  /** PUT /api/master/mq-templates/update */
  public updateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user?.userId?.toString();
      const { template_id, ...dto } = req.body;
      if (!template_id) { ResponseUtil.error(res, 'template_id is required', 400); return; }

      await this.service.updateTemplate(Number(template_id), dto, updatedBy);
      ResponseUtil.success(res, null, 'Template updated successfully');
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      if (msg === 'Template not found') { ResponseUtil.notFound(res, msg); return; }
      if (msg.includes('already exists')) { ResponseUtil.conflict(res, msg); return; }
      ResponseUtil.error(res, 'Error updating template', 500, msg);
    }
  };

  /** POST /api/master/mq-templates/delete */
  public deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { template_id } = req.body;
      if (!template_id) { ResponseUtil.error(res, 'template_id is required', 400); return; }

      await this.service.deleteTemplate(Number(template_id));
      ResponseUtil.success(res, null, 'Template deleted successfully');
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      if (msg === 'Template not found') { ResponseUtil.notFound(res, msg); return; }
      ResponseUtil.error(res, 'Error deleting template', 500, msg);
    }
  };

  // ─── Questions ─────────────────────────────────────────────────────────────

  /** POST /api/master/mq-templates/questions/list */
  public getQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { template_id } = req.body;
      if (!template_id) { ResponseUtil.error(res, 'template_id is required', 400); return; }

      const questions = await this.service.getQuestions(Number(template_id));
      ResponseUtil.success(res, questions, 'Questions retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching questions', 500, getErrorMessage(error));
    }
  };

  /** POST /api/master/mq-templates/questions/create */
  public createQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user?.userId?.toString();
      const id = await this.service.createQuestion(req.body, createdBy);
      ResponseUtil.success(res, { question_id: id }, 'Question created successfully', 201);
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      if (msg.includes('not found')) { ResponseUtil.notFound(res, msg); return; }
      if (msg.includes('must be') || msg.includes('required')) { ResponseUtil.error(res, msg, 400); return; }
      ResponseUtil.error(res, 'Error creating question', 500, msg);
    }
  };

  /** PUT /api/master/mq-templates/questions/update */
  public updateQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user?.userId?.toString();
      const { question_id, ...dto } = req.body;
      if (!question_id) { ResponseUtil.error(res, 'question_id is required', 400); return; }

      await this.service.updateQuestion(Number(question_id), dto, updatedBy);
      ResponseUtil.success(res, null, 'Question updated successfully');
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      if (msg === 'Question not found') { ResponseUtil.notFound(res, msg); return; }
      ResponseUtil.error(res, 'Error updating question', 500, msg);
    }
  };

  /** POST /api/master/mq-templates/questions/delete */
  public deleteQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { question_id } = req.body;
      if (!question_id) { ResponseUtil.error(res, 'question_id is required', 400); return; }

      await this.service.deleteQuestion(Number(question_id));
      ResponseUtil.success(res, null, 'Question deleted successfully');
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      if (msg === 'Question not found') { ResponseUtil.notFound(res, msg); return; }
      ResponseUtil.error(res, 'Error deleting question', 500, msg);
    }
  };
}
