import { Request, Response } from 'express';
import { MonitoringService } from './monitoring.service';
import { LOSAlert, MonitoringFilters, AcknowledgeAlertDto, RecordCheckDto } from './dto/monitoring.dto';
import { ResponseUtil } from '../../core/utils/response.util';
import { getErrorMessage } from '../../core/utils/error.util';
import { logger } from '../../core/utils/logger.util';
/**
 * Monitoring Controller
 * Handles HTTP requests for 8-Hour Monitoring and LOS Alerts
 * Not extending BaseController due to specialized monitoring logic
 * 
 * Permissions Required:
 * - ADMISSIONS.VIEW: View alerts and checks
 * - ADMISSIONS.UPDATE: Acknowledge alerts and record checks
 */
export class MonitoringController {
  private service: MonitoringService;

  constructor() {
    this.service = new MonitoringService();
  }

  /**
   * Get active LOS alerts
   * POST /api/monitoring/los-alerts
   * Permission: ADMISSIONS.VIEW
   * Body: MonitoringFilters
   */
  public getLOSAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: MonitoringFilters = {
        admissionStatus: req.body.admissionStatus,
        alertLevel: req.body.alertLevel,
        alertStatus: req.body.alertStatus,
        hospitalId: req.body.hospitalId,
        page: req.body.page ?? 1,
        limit: req.body.limit ?? 10,
        sortBy: req.body.sortBy ?? 'triggered_at',
        sortOrder: req.body.sortOrder ?? 'DESC'
      };

      const result = await this.service.getLOSAlerts(filters);

      ResponseUtil.success(res, result, 'LOS alerts retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching LOS alerts', 500, getErrorMessage(error));
    }
  };

  /**
   * Acknowledge LOS alert
   * POST /api/monitoring/acknowledge-alert
   * Permission: ADMISSIONS.UPDATE
   * Body: { alert_id: number, notes?: string }
   */
  public acknowledgeAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      
      if (!req.body.alert_id || isNaN(req.body.alert_id)) {
        ResponseUtil.error(res, 'Invalid alert ID', 400);
        return;
      }

      const dto: AcknowledgeAlertDto = {
        alert_id: req.body.alert_id,
        notes: req.body.notes
      };

      await this.service.acknowledgeAlert(dto, userId);

      ResponseUtil.success(res, null, 'Alert acknowledged successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      ResponseUtil.error(res, 'Error acknowledging alert', 500, errorMessage);
    }
  };

  /**
   * Get 8-hour monitoring checks
   * POST /api/monitoring/8hm-checks
   * Permission: ADMISSIONS.VIEW
   * Body: MonitoringFilters
   */
  public get8HMChecks = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: MonitoringFilters = {
        admissionStatus: req.body.admissionStatus,
        hospitalId: req.body.hospitalId,
        page: req.body.page ?? 1,
        limit: req.body.limit ?? 10,
        sortBy: req.body.sortBy ?? 'check_time',
        sortOrder: req.body.sortOrder ?? 'DESC'
      };

      const result = await this.service.get8HMChecks(filters);

      ResponseUtil.success(res, result, '8-hour monitoring checks retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching monitoring checks', 500, getErrorMessage(error));
    }
  };

  /**
   * Record 8-hour monitoring check
   * POST /api/monitoring/record-check
   * Permission: ADMISSIONS.UPDATE
   * Body: { admission_id: number, status: string, notes?: string }
   */
  public recordCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      
      if (!req.body.admission_id || isNaN(req.body.admission_id)) {
        ResponseUtil.error(res, 'Invalid admission ID', 400);
        return;
      }

      if (!req.body.status || req.body.status.trim() === '') {
        ResponseUtil.error(res, 'Status is required', 400);
        return;
      }

      const dto: RecordCheckDto = {
        admission_id: req.body.admission_id,
        status: req.body.status,
        notes: req.body.notes
      };

      await this.service.recordCheck(dto, userId);

      ResponseUtil.success(res, null, 'Monitoring check recorded successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('Invalid status')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error recording monitoring check', 500, errorMessage);
    }
  };

  /**
   * Manually trigger LOS alert scan (Admin only)
   * POST /api/monitoring/scan-los-alerts
   * Permission: ADMISSIONS.ADMIN
   * TASK 6: Admin endpoint to manually trigger alert generation
   */
  public scanLOSAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[Manual Scan] Starting LOS alert scan...');
      
      const result = await this.service.scanAndTriggerLOSAlerts();
      
      logger.info('[Manual Scan] Scan completed:', result);

      ResponseUtil.success(
        res,
        result,
        `LOS scan completed: ${result.scanned} scanned, ${result.alertsCreated} created, ${result.alertsUpgraded} upgraded`
      );
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('[Manual Scan] Error:', errorMessage);
      ResponseUtil.error(res, 'Error scanning LOS alerts', 500, errorMessage);
    }
  };
}
