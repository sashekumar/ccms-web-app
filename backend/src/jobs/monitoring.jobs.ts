import * as cron from 'node-cron';
import { EightHourMonitoringService } from '../features/eight-hour-monitoring/eight-hour-monitoring.service';
import { LOSMonitoringService } from '../features/los-monitoring/los-monitoring.service';
import { DefermentMonitoringService } from '../features/deferment-monitoring/deferment-monitoring.service';

/**
 * Monitoring Jobs
 * TASKS 7-9: Scheduled jobs for automated monitoring
 * 
 * Jobs:
 * - Daily LOS Alert Scan (00:00 daily)
 * - Hourly 8HM Overdue Check (every hour at the top of the hour)
 * - Daily Deferment Escalation Check (02:00 daily)
 */
export class MonitoringJobs {
  private eightHourMonitoringService: EightHourMonitoringService;
  private losMonitoringService: LOSMonitoringService;
  private defermentMonitoringService: DefermentMonitoringService;

  constructor() {
    this.eightHourMonitoringService = new EightHourMonitoringService();
    this.losMonitoringService = new LOSMonitoringService();
    this.defermentMonitoringService = new DefermentMonitoringService();
  }

  /**
   * TASK 8: Daily LOS Alert Scanner
   * Runs every day at midnight (00:00)
   * Scans all active admissions and creates/upgrades LOS alerts
   */
  startDailyLOSScan(): void {
    cron.schedule('0 0 * * *', async () => {
      const timestamp = new Date().toISOString();
      console.log(`\n[Cron - LOS Scanner] Starting at ${timestamp}`);
      
      try {
        const result = await this.losMonitoringService.scanAndTriggerLOSAlerts();
        
        if (result.error) {
          console.error('[Cron - LOS Scanner] Error occurred:', result.error);
        } else {
          console.log(`[Cron - LOS Scanner] ✅ Scan completed successfully`);
          console.log(`  - Alerts Triggered: ${result.alerts_triggered}`);
          console.log(`  - Alerts Upgraded: ${result.alerts_upgraded}`);
        }
      } catch (error) {
        console.error('[Cron - LOS Scanner] FAILED:', error);
      }
    }, {
      timezone: 'Asia/Kuala_Lumpur'
    });

    console.log('[Cron - LOS Scanner] Daily LOS alert scan job registered (00:00 daily)');
  }

  /**
   * TASK 9: Hourly 8HM Overdue Check
   * Runs every hour at the top of the hour
   * Detects overdue checks and escalates them
   */
  startHourly8HMCheck(): void {
    cron.schedule('0 * * * *', async () => {
      const timestamp = new Date().toISOString();
      console.log(`\n[Cron - 8HM Check] Running at ${timestamp}`);
      
      try {
        // Get all overdue checks
        const overdueChecks = await this.eightHourMonitoringService.getOverdue8HMChecks();
        
        if (overdueChecks.length === 0) {
          console.log('[Cron - 8HM Check] ✅ No overdue checks found');
          return;
        }

        console.log(`[Cron - 8HM Check] Found ${overdueChecks.length} overdue checks`);
        
        // Escalate the overdue checks
        const escalationResult = await this.eightHourMonitoringService.escalateOverdueChecks();
        
        if (escalationResult.error) {
          console.error('[Cron - 8HM Check] Error during escalation:', escalationResult.error);
        } else {
          console.log(`[Cron - 8HM Check] ✅ Escalated ${escalationResult.escalated_count} checks to OVERDUE status`);
          
          // Log details of escalated checks
          for (const check of overdueChecks.slice(0, 5)) {
            console.log(`  - Admission ${check.admission_id}: Check ${check.monitoring_id} (due: ${check.next_check_due})`);
          }
          
          if (overdueChecks.length > 5) {
            console.log(`  ... and ${overdueChecks.length - 5} more`);
          }
        }
      } catch (error) {
        console.error('[Cron - 8HM Check] FAILED:', error);
      }
    }, {
      timezone: 'Asia/Kuala_Lumpur'
    });

    console.log('[Cron - 8HM Check] Hourly 8HM overdue check job registered (every hour)');
  }

  /**
   * Daily Deferment Escalation Check
   * Runs daily at 02:00
   * Escalates overdue deferment requests
   */
  startDailyDefermentCheck(): void {
    cron.schedule('0 2 * * *', async () => {
      const timestamp = new Date().toISOString();
      console.log(`\n[Cron - Deferment Check] Starting at ${timestamp}`);
      
      try {
        // Get all overdue deferment requests
        const overdueDeferments = await this.defermentMonitoringService.getOverdueDefermentRequests();
        
        if (overdueDeferments.length === 0) {
          console.log('[Cron - Deferment Check] ✅ No overdue deferments found');
          return;
        }

        console.log(`[Cron - Deferment Check] Found ${overdueDeferments.length} overdue deferment requests`);
        
        // Escalate the overdue deferments
        const escalationResult = await this.defermentMonitoringService.escalateOverdueDeferments();
        
        if (escalationResult.error) {
          console.error('[Cron - Deferment Check] Error during escalation:', escalationResult.error);
        } else {
          console.log(`[Cron - Deferment Check] ✅ Escalated ${escalationResult.escalated_count} deferments to ESCALATED status`);
          
          // Log details of escalated deferments
          for (const deferment of overdueDeferments.slice(0, 5)) {
            console.log(`  - Admission ${deferment.admission_id}: Expected resolution ${deferment.expected_resolution_date}`);
          }
          
          if (overdueDeferments.length > 5) {
            console.log(`  ... and ${overdueDeferments.length - 5} more`);
          }
        }
      } catch (error) {
        console.error('[Cron - Deferment Check] FAILED:', error);
      }
    }, {
      timezone: 'Asia/Kuala_Lumpur'
    });

    console.log('[Cron - Deferment Check] Daily deferment escalation check job registered (02:00 daily)');
  }

  /**
   * Start all monitoring jobs
   * Called from server.ts on application startup
   */
  startAll(): void {
    console.log('\n========================================');
    console.log('MONITORING JOBS INITIALIZATION');
    console.log('========================================');
    
    this.startDailyLOSScan();
    this.startHourly8HMCheck();
    this.startDailyDefermentCheck();
    
    console.log('\n✅ All monitoring jobs started successfully');
    console.log('========================================\n');
  }

  /**
   * Manual trigger for testing (optional)
   * Can be called via admin API endpoint
   */
  async manualLOSScan(): Promise<any> {
    console.log('[Manual Trigger] Starting manual LOS scan...');
    const result = await this.losMonitoringService.scanAndTriggerLOSAlerts();
    console.log(`[Manual Trigger] LOS scan completed - Alerts Triggered: ${result.alerts_triggered}, Upgraded: ${result.alerts_upgraded}`);
    return result;
  }

  /**
   * Manual trigger for 8HM check (optional)
   */
  async manual8HMCheck(): Promise<any> {
    console.log('[Manual Trigger] Starting manual 8HM overdue check...');
    const overdueChecks = await this.eightHourMonitoringService.getOverdue8HMChecks();
    console.log(`[Manual Trigger] Found ${overdueChecks.length} overdue checks`);
    
    if (overdueChecks.length > 0) {
      const escalationResult = await this.eightHourMonitoringService.escalateOverdueChecks();
      console.log(`[Manual Trigger] Escalated ${escalationResult.escalated_count} checks`);
      return { checks_found: overdueChecks.length, checks_escalated: escalationResult.escalated_count };
    }
    
    return { checks_found: 0, checks_escalated: 0 };
  }

  /**
   * Manual trigger for deferment check (optional)
   */
  async manualDefermentCheck(): Promise<any> {
    console.log('[Manual Trigger] Starting manual deferment check...');
    const overdueDeferments = await this.defermentMonitoringService.getOverdueDefermentRequests();
    console.log(`[Manual Trigger] Found ${overdueDeferments.length} overdue deferments`);
    
    if (overdueDeferments.length > 0) {
      const escalationResult = await this.defermentMonitoringService.escalateOverdueDeferments();
      console.log(`[Manual Trigger] Escalated ${escalationResult.escalated_count} deferments`);
      return { deferments_found: overdueDeferments.length, deferments_escalated: escalationResult.escalated_count };
    }
    
    return { deferments_found: 0, deferments_escalated: 0 };
  }
}
