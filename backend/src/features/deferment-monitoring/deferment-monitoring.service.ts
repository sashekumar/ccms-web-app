import { BaseService } from '../../core/base/base.service';
import { DefermentMonitoringRepository } from './deferment-monitoring.repository';
import { DefermentMonitoringEntity } from './entities/deferment-monitoring.entity';
import { DefermentMonitoringFilters, CreateDefermentDto, UpdateDefermentDto } from './dto/deferment-monitoring.dto';

export class DefermentMonitoringService extends BaseService<DefermentMonitoringEntity> {
  private readonly repo: DefermentMonitoringRepository;

  constructor() {
    const repo = new DefermentMonitoringRepository();
    super(repo);
    this.repo = repo;
  }

  async getDefermentCases(filters: DefermentMonitoringFilters, page: number = 1, limit: number = 10) {
    return this.repo.getDefermentCases(filters, page, limit);
  }

  async getAdmissionDeferment(admission_id: bigint) {
    return this.repo.getAdmissionDeferment(admission_id);
  }

  async updateDefermentCase(admission_id: bigint, deferment_status: string, updated_by: string, notes?: string) {
    return this.repo.updateDefermentCase(admission_id, deferment_status, updated_by, notes);
  }

  async getStats() {
    return this.repo.getStats();
  }

  // ===================================
  // AUTOMATED SCANNING
  // ===================================

  async getOverdueDefermentRequests() {
    return this.repo.getOverdueDefermentRequests();
  }

  async escalateOverdueDeferments() {
    return this.repo.escalateOverdueDeferments();
  }
}
