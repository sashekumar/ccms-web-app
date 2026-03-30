import { BaseService } from '../../core/base/base.service';
import { LOSMonitoringRepository } from './los-monitoring.repository';
import { LOSAlertEntity } from './entities/los-monitoring.entity';
import { LOSMonitoringFilters, CreateLOSAlertDto, UpdateLOSAlertDto } from './dto/los-monitoring.dto';

export class LOSMonitoringService extends BaseService<LOSAlertEntity> {
  private readonly repo: LOSMonitoringRepository;

  constructor() {
    const repo = new LOSMonitoringRepository();
    super(repo);
    this.repo = repo;
  }

  async getLOSAlerts(filters: LOSMonitoringFilters, page: number = 1, limit: number = 10) {
    return this.repo.getLOSAlerts(filters, page, limit);
  }

  async getAdmissionLOSAlerts(admission_id: bigint) {
    return this.repo.getAdmissionLOSAlerts(admission_id);
  }

  async createLOSAlert(dto: CreateLOSAlertDto) {
    return this.repo.createLOSAlert(dto);
  }

  async updateLOSAlert(alert_id: bigint, dto: UpdateLOSAlertDto) {
    return this.repo.updateLOSAlert(alert_id, dto);
  }

  async getStats() {
    return this.repo.getStats();
  }

  // ===================================
  // AUTOMATED SCANNING
  // ===================================

  async scanAndTriggerLOSAlerts() {
    return this.repo.scanAndTriggerLOSAlerts();
  }
}
