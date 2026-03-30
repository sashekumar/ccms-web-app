import { BaseService } from '../../core/base/base.service';
import { FinancialsRepository } from './financials.repository';
import { PaymentAdviceEntity } from './entities/financials.entity';
import { PaymentAdviceFilters, CreatePaymentAdviceDto, UpdatePaymentAdviceDto } from './dto/financials.dto';
import { logger } from '../../core/utils/logger.util';

/**
 * Financials Service
 * Business logic for Payment Advice management.
 * Extends BaseService for common CRUD patterns.
 *
 * Responsibilities:
 * - Paginated PA listing with filters
 * - PA detail retrieval (header + sub-entities)
 * - PA creation with duplicate reference check
 * - PA status and field updates
 * - Statistics aggregation
 */
export class FinancialsService extends BaseService<PaymentAdviceEntity> {
  protected repository: FinancialsRepository;

  constructor() {
    const repository = new FinancialsRepository();
    super(repository);
    this.repository = repository;
  }

  /**
   * Get paginated payment advices with filters
   */
  async getPaymentAdvices(filters: PaymentAdviceFilters): Promise<any> {
    try {
      const result = await this.repository.getPaymentAdvices(filters);
      return {
        data: result.data,
        total: result.total,
        totalPages: Math.ceil(result.total / (filters.limit || 10)),
        page: filters.page || 1
      };
    } catch (error) {
      logger.error('Error fetching payment advices:', error);
      throw new Error('Failed to fetch payment advices');
    }
  }

  /**
   * Get full payment advice detail by ID
   * Includes line items, summary, payments, uncovered charges, consultation breakdown
   */
  async getPaymentAdviceById(paId: number): Promise<any> {
    try {
      const pa = await this.repository.getPaymentAdviceById(paId);
      if (!pa) {
        throw new Error(`Payment Advice ${paId} not found`);
      }

      const [lineItems, summary, payments, uncoveredCharges, consultationBreakdown] =
        await Promise.all([
          this.repository.getLineItems(paId),
          this.repository.getSummary(paId),
          this.repository.getPayments(paId),
          this.repository.getUncoveredCharges(paId),
          this.repository.getConsultationBreakdown(paId)
        ]);

      return {
        ...pa,
        line_items: lineItems,
        summary,
        payments,
        uncovered_charges: uncoveredCharges,
        consultation_breakdown: consultationBreakdown
      };
    } catch (error) {
      logger.error(`Error fetching payment advice ${paId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Payment Advice
   * Business Rule: pa_ref_no must be unique
   */
  async createPaymentAdvice(dto: CreatePaymentAdviceDto, userId: string): Promise<any> {
    try {
      if (!dto.pa_ref_no) {
        throw new Error('pa_ref_no is required');
      }

      const exists = await this.repository.checkPaRefNoExists(dto.pa_ref_no);
      if (exists) {
        throw new Error(`PA reference number '${dto.pa_ref_no}' already exists`);
      }

      const paId = await this.repository.createPaymentAdvice(dto, userId);
      logger.info(`Payment Advice created: PA-${paId} (ref: ${dto.pa_ref_no}) for claim ${dto.claim_id}`);

      return await this.getPaymentAdviceById(paId);
    } catch (error) {
      logger.error('Error creating payment advice:', error);
      throw error;
    }
  }

  /**
   * Update Payment Advice
   */
  async updatePaymentAdvice(paId: number, dto: UpdatePaymentAdviceDto, userId: string): Promise<any> {
    try {
      const existing = await this.repository.getPaymentAdviceById(paId);
      if (!existing) {
        throw new Error(`Payment Advice ${paId} not found`);
      }

      await this.repository.updatePaymentAdvice(paId, dto, userId);
      logger.info(`Payment Advice updated: PA-${paId} by ${userId}`);

      return await this.getPaymentAdviceById(paId);
    } catch (error) {
      logger.error(`Error updating payment advice ${paId}:`, error);
      throw error;
    }
  }

  /**
   * Get payment advice statistics
   */
  async getStats(): Promise<any> {
    try {
      return await this.repository.getStats();
    } catch (error) {
      logger.error('Error fetching payment advice stats:', error);
      throw new Error('Failed to fetch payment advice statistics');
    }
  }
}
