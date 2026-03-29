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

  /**
   * Trigger LOS alerts for a specific admission
   * TASK 4: Check admission LOS and create/upgrade alerts as needed
   */
  async triggerLOSAlertsForAdmission(admissionId: number): Promise<void> {
    // Get active admissions to find this one
    const admissions = await this.repository.getActiveAdmissions();
    const admission = admissions.find(a => a.admission_id === admissionId);

    if (!admission) {
      // Admission not found or already discharged
      return;
    }

    const currentLOS = admission.current_los;

    // Determine what alert level is needed
    let alertLevel: 1 | 2 | 3 | null = null;
    let thresholdDays: number = 0;

    if (currentLOS >= 21) {
      alertLevel = 3;
      thresholdDays = 21;
    } else if (currentLOS >= 14) {
      alertLevel = 2;
      thresholdDays = 14;
    } else if (currentLOS >= 7) {
      alertLevel = 1;
      thresholdDays = 7;
    }

    if (!alertLevel) {
      // LOS is less than 7 days, no alert needed
      return;
    }

    // Check for existing alerts at each level
    const hasLevel3 = await this.repository.checkExistingAlert(admissionId, 3);
    const hasLevel2 = await this.repository.checkExistingAlert(admissionId, 2);
    const hasLevel1 = await this.repository.checkExistingAlert(admissionId, 1);

    // Logic for creating or upgrading alerts
    if (alertLevel === 3 && !hasLevel3) {
      if (hasLevel2) {
        // Upgrade Level 2 → Level 3
        await this.repository.upgradeAlert(admissionId, 2, 3, currentLOS);
      } else {
        // Create new Level 3 alert
        await this.repository.createLOSAlert(admissionId, 3, currentLOS, 21);
      }
    } else if (alertLevel === 2 && !hasLevel2 && !hasLevel3) {
      if (hasLevel1) {
        // Upgrade Level 1 → Level 2
        await this.repository.upgradeAlert(admissionId, 1, 2, currentLOS);
      } else {
        // Create new Level 2 alert
        await this.repository.createLOSAlert(admissionId, 2, currentLOS, 14);
      }
    } else if (alertLevel === 1 && !hasLevel1 && !hasLevel2 && !hasLevel3) {
      // Create new Level 1 alert
      await this.repository.createLOSAlert(admissionId, 1, currentLOS, 7);
    }
    // If alert already exists at required or higher level, do nothing
  }

  /**
   * Scan all active admissions and trigger LOS alerts
   * TASK 5: Batch process for scheduled job
   */
  async scanAndTriggerLOSAlerts(): Promise<{
    scanned: number;
    alertsCreated: number;
    alertsUpgraded: number;
    errors: number;
  }> {
    const activeAdmissions = await this.repository.getActiveAdmissions();
    
    let alertsCreated = 0;
    let alertsUpgraded = 0;
    let errors = 0;

    for (const admission of activeAdmissions) {
      try {
        // Get count before
        const beforeCount = await this.repository.getAlertCount(admission.admission_id);
        const beforeAlert = await this.repository.getLatestAlert(admission.admission_id);
        
        // Trigger alert logic
        await this.triggerLOSAlertsForAdmission(admission.admission_id);
        
        // Get count after
        const afterCount = await this.repository.getAlertCount(admission.admission_id);
        const afterAlert = await this.repository.getLatestAlert(admission.admission_id);
        
        if (afterCount > beforeCount) {
          // New alert created
          alertsCreated++;
        } else if (afterAlert && beforeAlert && afterAlert.alert_level > beforeAlert.alert_level) {
          // Alert was upgraded
          alertsUpgraded++;
        }
      } catch (error) {
        console.error(`Error processing admission ${admission.admission_id}:`, error);
        errors++;
        // Continue with next admission
      }
    }

    return {
      scanned: activeAdmissions.length,
      alertsCreated,
      alertsUpgraded,
      errors
    };
  }

  /**
   * Get overdue 8HM checks for notifications
   * TASK 5: Helper for cron job
   */
  async getOverdue8HMChecks(): Promise<any[]> {
    return await this.repository.getOverdue8HMChecks();
  }
}
