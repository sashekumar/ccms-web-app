import { MonitoringRepository } from './monitoring.repository';
import { LOSAlert, EightHourCheck, MonitoringFilters, AcknowledgeAlertDto, RecordCheckDto } from './dto/monitoring.dto';

/**
 * Monitoring Service
 * Business logic for 8-Hour Monitoring and LOS Alerts
 */
export class MonitoringService {
  private repository: MonitoringRepository;

  constructor() {
    this.repository = new MonitoringRepository();
  }

  /**
   * Get active LOS alerts with pagination
   */
  async getLOSAlerts(filters: MonitoringFilters = {}): Promise<{
    alerts: LOSAlert[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const result = await this.repository.getLOSAlerts(filters);

    return {
      alerts: result.alerts,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  /**
   * Acknowledge LOS alert
   */
  async acknowledgeAlert(dto: AcknowledgeAlertDto, acknowledgedBy: string): Promise<void> {
    if (!dto.alert_id || isNaN(dto.alert_id)) {
      throw new Error('Invalid alert ID');
    }

    await this.repository.acknowledgeAlert(dto.alert_id, acknowledgedBy, dto.notes);
  }

  /**
   * Get 8-hour monitoring checks
   */
  async get8HMChecks(filters: MonitoringFilters = {}): Promise<{
    checks: EightHourCheck[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const result = await this.repository.get8HMChecks(filters);

    return {
      checks: result.checks,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  /**
   * Record 8-hour monitoring check
   */
  async recordCheck(dto: RecordCheckDto, checkedBy: string): Promise<void> {
    if (!dto.admission_id || isNaN(dto.admission_id)) {
      throw new Error('Invalid admission ID');
    }

    if (!dto.status || dto.status.trim() === '') {
      throw new Error('Status is required');
    }

    // Validate status values
    const validStatuses = ['STABLE', 'REQUIRES_ATTENTION', 'CRITICAL'];
    if (!validStatuses.includes(dto.status)) {
      throw new Error('Invalid status. Must be STABLE, REQUIRES_ATTENTION, or CRITICAL');
    }

    await this.repository.recordCheck(dto.admission_id, dto.status, checkedBy, dto.notes);
  }
}
