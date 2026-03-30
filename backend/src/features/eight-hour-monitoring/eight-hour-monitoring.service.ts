import { BaseService } from '../../core/base/base.service';
import { EightHourMonitoringRepository } from './eight-hour-monitoring.repository';
import { EightHourMonitoringEntity } from './entities/eight-hour-monitoring.entity';
import { EightHourMonitoringFilters, CreateEightHourMonitoringDto, UpdateEightHourMonitoringDto } from './dto/eight-hour-monitoring.dto';

export class EightHourMonitoringService extends BaseService<EightHourMonitoringEntity> {
  private readonly repo: EightHourMonitoringRepository;

  constructor() {
    const repo = new EightHourMonitoringRepository();
    super(repo);
    this.repo = repo;
  }

  async getMonitoringChecks(filters: EightHourMonitoringFilters, page: number = 1, limit: number = 10) {
    return this.repo.getMonitoringChecks(filters, page, limit);
  }

  async getAdmissionMonitoringChecks(admission_id: bigint) {
    return this.repo.getAdmissionMonitoringChecks(admission_id);
  }

  async createMonitoringCheck(dto: CreateEightHourMonitoringDto) {
    return this.repo.createMonitoringCheck(dto);
  }

  async updateMonitoringCheck(monitoring_id: bigint, dto: UpdateEightHourMonitoringDto) {
    return this.repo.updateMonitoringCheck(monitoring_id, dto);
  }

  async getStats() {
    return this.repo.getStats();
  }

  // ===================================
  // AUTOMATED SCANNING
  // ===================================

  async getOverdue8HMChecks() {
    return this.repo.getOverdue8HMChecks();
  }

  async escalateOverdueChecks() {
    return this.repo.escalateOverdueChecks();
  }
}
