import { Request, Response } from 'express';
import { StopLossService } from './stop-loss.service';
import { StopLossFilters, CreateStopLossDto, UpdateStopLossDto } from './dto/stop-loss.dto';
import { ResponseUtil } from '../../core/utils/response.util';
import { getErrorMessage } from '../../core/utils/error.util';
import { logger } from '../../core/utils/logger.util';

/**
 * Stop Loss Controller
 * Permissions: STOP_LOSS.VIEW | STOP_LOSS.UPDATE
 */
export class StopLossController {
  private service: StopLossService;

  constructor() {
    this.service = new StopLossService();
  }

  /**
   * POST /api/stop-loss
   * Body: StopLossFilters
   */
  public getStopLossRecords = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: StopLossFilters = {
        product_id: req.body.product_id ? Number(req.body.product_id) : undefined,
        period_type: req.body.period_type,
        is_history_record: req.body.is_history_record,
        date_from: req.body.date_from,
        date_to: req.body.date_to,
        page: req.body.page ?? 1,
        limit: req.body.limit ?? 10,
        sortBy: req.body.sortBy ?? 'period_date',
        sortOrder: req.body.sortOrder ?? 'DESC',
        searchTerm: req.body.searchTerm
      };
      const result = await this.service.getStopLossRecords(filters);
      ResponseUtil.success(res, result, 'Stop loss records retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error fetching stop loss records:', error);
      ResponseUtil.error(res, 'Error fetching stop loss records', 500, getErrorMessage(error));
    }
  };

  /**
   * POST /api/stop-loss/stats
   */
  public getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.service.getStats();
      ResponseUtil.success(res, stats, 'Stop loss statistics retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching stop loss statistics', 500, getErrorMessage(error));
    }
  };

  /**
   * POST /api/stop-loss/:id
   */
  public getStopLossById = async (req: Request, res: Response): Promise<void> => {
    try {
      const slId = parseInt(req.params.id);
      if (isNaN(slId)) { ResponseUtil.error(res, 'Invalid stop loss ID', 400); return; }
      const record = await this.service.getStopLossById(slId);
      ResponseUtil.success(res, record, 'Stop loss record retrieved successfully');
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      ResponseUtil.error(res, msg.includes('not found') ? msg : 'Error fetching stop loss record', msg.includes('not found') ? 404 : 500, msg);
    }
  };

  /**
   * POST /api/stop-loss/create
   * Body: CreateStopLossDto
   */
  public createStopLoss = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      if (!req.body.product_id || isNaN(Number(req.body.product_id))) {
        ResponseUtil.error(res, 'product_id is required and must be numeric', 400); return;
      }
      if (!req.body.period_type || !req.body.period_date) {
        ResponseUtil.error(res, 'period_type and period_date are required', 400); return;
      }
      const dto: CreateStopLossDto = req.body;
      const record = await this.service.createStopLoss(dto, userId);
      ResponseUtil.success(res, record, 'Stop loss record created successfully', 201);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating stop loss record', 500, getErrorMessage(error));
    }
  };

  /**
   * PUT /api/stop-loss/:id
   * Body: UpdateStopLossDto
   */
  public updateStopLoss = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const slId = parseInt(req.params.id);
      if (isNaN(slId)) { ResponseUtil.error(res, 'Invalid stop loss ID', 400); return; }
      const dto: UpdateStopLossDto = req.body;
      const record = await this.service.updateStopLoss(slId, dto, userId);
      ResponseUtil.success(res, record, 'Stop loss record updated successfully');
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      ResponseUtil.error(res, 'Error updating stop loss record', msg.includes('not found') ? 404 : 500, msg);
    }
  };
}
