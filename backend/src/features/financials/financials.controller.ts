import { Request, Response } from 'express';
import { FinancialsService } from './financials.service';
import { PaymentAdviceFilters, CreatePaymentAdviceDto, UpdatePaymentAdviceDto } from './dto/financials.dto';
import { ResponseUtil } from '../../core/utils/response.util';
import { getErrorMessage } from '../../core/utils/error.util';
import { logger } from '../../core/utils/logger.util';

/**
 * Financials Controller
 * Handles HTTP requests for Payment Advice management.
 *
 * Permissions:
 * - FINANCIALS.VIEW: View payment advices, detail, stats
 * - FINANCIALS.UPDATE: Create and update payment advices
 */
export class FinancialsController {
  private service: FinancialsService;

  constructor() {
    this.service = new FinancialsService();
  }

  /**
   * Get payment advices with filters
   * POST /api/financials
   * Permission: FINANCIALS.VIEW
   * Body: PaymentAdviceFilters
   */
  public getPaymentAdvices = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: PaymentAdviceFilters = {
        payment_status: req.body.payment_status,
        claim_id: req.body.claim_id ? Number(req.body.claim_id) : undefined,
        pa_ref_no: req.body.pa_ref_no,
        is_shortfall: req.body.is_shortfall,
        is_multipl_pa: req.body.is_multipl_pa,
        finance_deferment_status: req.body.finance_deferment_status,
        submission_batch_no: req.body.submission_batch_no,
        date_from: req.body.date_from,
        date_to: req.body.date_to,
        page: req.body.page ?? 1,
        limit: req.body.limit ?? 10,
        sortBy: req.body.sortBy ?? 'created_at',
        sortOrder: req.body.sortOrder ?? 'DESC',
        searchTerm: req.body.searchTerm
      };

      const result = await this.service.getPaymentAdvices(filters);
      ResponseUtil.success(res, result, 'Payment advices retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error fetching payment advices:', error);
      ResponseUtil.error(res, 'Error fetching payment advices', 500, getErrorMessage(error));
    }
  };

  /**
   * Get payment advice statistics
   * POST /api/financials/stats
   * Permission: FINANCIALS.VIEW
   */
  public getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.service.getStats();
      ResponseUtil.success(res, stats, 'Payment advice statistics retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error fetching payment advice stats:', error);
      ResponseUtil.error(res, 'Error fetching payment advice statistics', 500, getErrorMessage(error));
    }
  };

  /**
   * Get payment advice by ID (with sub-entities)
   * POST /api/financials/:id
   * Permission: FINANCIALS.VIEW
   */
  public getPaymentAdviceById = async (req: Request, res: Response): Promise<void> => {
    try {
      const paId = parseInt(req.params.id);
      if (isNaN(paId)) {
        ResponseUtil.error(res, 'Invalid payment advice ID', 400);
        return;
      }

      const pa = await this.service.getPaymentAdviceById(paId);
      ResponseUtil.success(res, pa, 'Payment advice retrieved successfully');
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      if (errorMsg.includes('not found')) {
        ResponseUtil.error(res, errorMsg, 404);
      } else {
        ResponseUtil.error(res, 'Error fetching payment advice', 500, errorMsg);
      }
    }
  };

  /**
   * Create payment advice
   * POST /api/financials/create
   * Permission: FINANCIALS.UPDATE
   * Body: CreatePaymentAdviceDto
   */
  public createPaymentAdvice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';

      if (!req.body.claim_id || isNaN(Number(req.body.claim_id))) {
        ResponseUtil.error(res, 'claim_id is required and must be numeric', 400);
        return;
      }

      if (!req.body.pa_ref_no || typeof req.body.pa_ref_no !== 'string') {
        ResponseUtil.error(res, 'pa_ref_no is required', 400);
        return;
      }

      const dto: CreatePaymentAdviceDto = req.body;
      const pa = await this.service.createPaymentAdvice(dto, userId);
      ResponseUtil.success(res, pa, 'Payment advice created successfully', 201);
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      ResponseUtil.error(
        res,
        errorMsg.includes('already exists') ? 'PA reference number already exists' : 'Error creating payment advice',
        errorMsg.includes('already exists') ? 409 : 500,
        errorMsg
      );
    }
  };

  /**
   * Update payment advice
   * PUT /api/financials/:id
   * Permission: FINANCIALS.UPDATE
   * Body: UpdatePaymentAdviceDto
   */
  public updatePaymentAdvice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const paId = parseInt(req.params.id);

      if (isNaN(paId)) {
        ResponseUtil.error(res, 'Invalid payment advice ID', 400);
        return;
      }

      const dto: UpdatePaymentAdviceDto = req.body;
      const pa = await this.service.updatePaymentAdvice(paId, dto, userId);
      ResponseUtil.success(res, pa, 'Payment advice updated successfully');
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      ResponseUtil.error(
        res,
        'Error updating payment advice',
        errorMsg.includes('not found') ? 404 : 500,
        errorMsg
      );
    }
  };
}
