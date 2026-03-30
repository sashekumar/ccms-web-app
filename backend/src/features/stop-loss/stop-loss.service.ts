import { BaseService } from '../../core/base/base.service';
import { StopLossRepository } from './stop-loss.repository';
import { StopLossEntity } from './entities/stop-loss.entity';
import { StopLossFilters, CreateStopLossDto, UpdateStopLossDto } from './dto/stop-loss.dto';
import { logger } from '../../core/utils/logger.util';

export class StopLossService extends BaseService<StopLossEntity> {
  protected repository: StopLossRepository;

  constructor() {
    const repository = new StopLossRepository();
    super(repository);
    this.repository = repository;
  }

  async getStopLossRecords(filters: StopLossFilters): Promise<any> {
    try {
      const result = await this.repository.getStopLossRecords(filters);
      return {
        data: result.data,
        total: result.total,
        totalPages: Math.ceil(result.total / (filters.limit || 10)),
        page: filters.page || 1
      };
    } catch (error) {
      logger.error('Error fetching stop loss records:', error);
      throw new Error('Failed to fetch stop loss records');
    }
  }

  async getStopLossById(slId: number): Promise<any> {
    try {
      const record = await this.repository.getStopLossById(slId);
      if (!record) throw new Error(`Stop Loss record ${slId} not found`);
      return record;
    } catch (error) {
      logger.error(`Error fetching stop loss record ${slId}:`, error);
      throw error;
    }
  }

  async createStopLoss(dto: CreateStopLossDto, userId: string): Promise<any> {
    try {
      const slId = await this.repository.createStopLoss(dto, userId);
      logger.info(`Stop Loss record created: SL-${slId} for product ${dto.product_id}`);
      return await this.getStopLossById(slId);
    } catch (error) {
      logger.error('Error creating stop loss record:', error);
      throw error;
    }
  }

  async updateStopLoss(slId: number, dto: UpdateStopLossDto, userId: string): Promise<any> {
    try {
      const existing = await this.repository.getStopLossById(slId);
      if (!existing) throw new Error(`Stop Loss record ${slId} not found`);
      await this.repository.updateStopLoss(slId, dto, userId);
      logger.info(`Stop Loss record updated: SL-${slId} by ${userId}`);
      return await this.getStopLossById(slId);
    } catch (error) {
      logger.error(`Error updating stop loss record ${slId}:`, error);
      throw error;
    }
  }

  async getStats(): Promise<any> {
    try {
      return await this.repository.getStats();
    } catch (error) {
      logger.error('Error fetching stop loss stats:', error);
      throw new Error('Failed to fetch stop loss statistics');
    }
  }
}
