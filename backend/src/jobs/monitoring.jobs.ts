import * as cron from 'node-cron';
import { MonitoringService } from '../features/monitoring/monitoring.service';

/**
 * Monitoring Jobs
 * TASKS 7-9: Scheduled jobs for automated monitoring
 * 
 * Jobs:
 * - Daily LOS Alert Scan (00:00 daily)
 * - Hourly 8HM Overdue Check (every hour)
 */
export class MonitoringJobs {
  private monitoringService: MonitoringService;

  constructor() {
    this.monitoringService = new MonitoringService();
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
        const result = await this.monitoringService.scanAndTriggerLOSAlerts();
        
        console.log('[Cron - LOS Scanner] Scan completed:');
        console.log(`  - Admissions scanned: ${result.scanned}`);
        console.log(`  - Alerts created: ${result.alertsCreated}`);
        console.log(`  - Alerts upgraded: ${result.alertsUpgraded}`);
        console.log(`  - Errors: ${result.errors}`);
        
        if (result.errors > 0) {
          console.warn(`[Cron - LOS Scanner] WARNING: ${result.errors} errors occurred during scan`);
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
   * Identifies overdue checks and logs for notification system
   */
  startHourly8HMCheck(): void {
    cron.schedule('0 * * * *', async () => {
      const timestamp = new Date().toISOString();
      console.log(`\n[Cron - 8HM Check] Running at ${timestamp}`);
      
      try {
        const overdueChecks = await this.monitoringService.getOverdue8HMChecks();
        
        if (overdueChecks.length === 0) {
          console.log('[Cron - 8HM Check] No overdue checks found');
          return;
        }

        console.log(`[Cron - 8HM Check] Found ${overdueChecks.length} overdue checks:`);
        
        // Log details for monitoring
        overdueChecks.forEach(check => {
          const hoursOverdue = check.hours_overdue;
          const severity = hoursOverdue > 4 ? '🔴 CRITICAL' : 
                          hoursOverdue > 2 ? '🟡 WARNING' : 
                          '🟢 NOTICE';
          
          console.log(`  ${severity} - Admission ${check.admission_id} (${check.patient_name})`);
          console.log(`    Hospital: ${check.hospital_name}`);
          console.log(`    Overdue by: ${hoursOverdue} hours`);
          console.log(`    Next check was due: ${check.next_check_due}`);
        });

        // TODO: Integrate with notification service to send alerts
        // For now, we're logging. Future enhancement:
        // - Send email to monitoring officers
        // - Send SMS for critical (>4 hours overdue)
        // - Create escalation records for >6 hours overdue
        
        console.log('[Cron - 8HM Check] Overdue check scan completed');
      } catch (error) {
        console.error('[Cron - 8HM Check] FAILED:', error);
      }
    }, {
      timezone: 'Asia/Kuala_Lumpur'
    });

    console.log('[Cron - 8HM Check] Hourly 8HM overdue check job registered (every hour)');
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
    
    console.log('\n✅ All monitoring jobs started successfully');
    console.log('========================================\n');
  }

  /**
   * Manual trigger for testing (optional)
   * Can be called via admin API endpoint
   */
  async manualLOSScan(): Promise<any> {
    console.log('[Manual Trigger] LOS scan initiated');
    return await this.monitoringService.scanAndTriggerLOSAlerts();
  }

  /**
   * Manual trigger for 8HM check (optional)
   */
  async manual8HMCheck(): Promise<any[]> {
    console.log('[Manual Trigger] 8HM check initiated');
    return await this.monitoringService.getOverdue8HMChecks();
  }
}
