import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MonitoringService } from '../../../core/services/monitoring.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { LOSAlert, EightHourCheck, MonitoringFilters } from '../../../shared/models/monitoring.model';

/**
 * Monitoring Dashboard Component
 * Displays LOS Alerts and 8-Hour Monitoring checks
 */
@Component({
  selector: 'app-monitoring-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './monitoring-dashboard.component.html'
})
export class MonitoringDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Tab management
  activeTab: 'alerts' | 'checks' = 'alerts';

  // LOS Alerts
  alerts: LOSAlert[] = [];
  loadingAlerts = false;
  alertsPage = 1;
  alertsLimit = 10;
  alertsTotal = 0;
  alertsTotalPages = 0;

  // 8HM Checks
  checks: EightHourCheck[] = [];
  loadingChecks = false;
  checksPage = 1;
  checksLimit = 10;
  checksTotal = 0;
  checksTotalPages = 0;

  constructor(
    private monitoringService: MonitoringService,
    private toast: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Switch between tabs
   */
  switchTab(tab: 'alerts' | 'checks'): void {
    this.activeTab = tab;
    
    if (tab === 'alerts' && this.alerts.length === 0) {
      this.loadAlerts();
    } else if (tab === 'checks' && this.checks.length === 0) {
      this.loadChecks();
    }
  }

  /**
   * Load LOS alerts
   */
  loadAlerts(): void {
    this.loadingAlerts = true;
    
    const filters: MonitoringFilters = {
      alertStatus: 'ACTIVE',
      page: this.alertsPage,
      limit: this.alertsLimit,
      sortBy: 'triggered_at',
      sortOrder: 'DESC'
    };

    this.monitoringService.getLOSAlerts(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.alerts = data.alerts;
          this.alertsTotal = data.total;
          this.alertsTotalPages = data.totalPages;
          this.loadingAlerts = false;
          this.logger.info('LOS alerts loaded successfully');
        },
        error: (error) => {
          this.loadingAlerts = false;
          this.logger.error('Error loading LOS alerts:', error);
          this.toast.error('Failed to load LOS alerts');
        }
      });
  }

  /**
   * Load 8HM checks
   */
  loadChecks(): void {
    this.loadingChecks = true;
    
    const filters: MonitoringFilters = {
      page: this.checksPage,
      limit: this.checksLimit,
      sortBy: 'check_time',
      sortOrder: 'DESC'
    };

    this.monitoringService.get8HMChecks(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.checks = data.checks;
          this.checksTotal = data.total;
          this.checksTotalPages = data.totalPages;
          this.loadingChecks = false;
          this.logger.info('8HM checks loaded successfully');
        },
        error: (error) => {
          this.loadingChecks = false;
          this.logger.error('Error loading 8HM checks:', error);
          this.toast.error('Failed to load monitoring checks');
        }
      });
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: number): void {
    const notes = prompt('Optional notes for acknowledgment:');
    if (notes === null) return; // User cancelled

    this.monitoringService.acknowledgeAlert({ alert_id: alertId, notes: notes || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Alert acknowledged successfully');
          this.loadAlerts(); // Reload to show updated status
        },
        error: (error) => {
          this.logger.error('Error acknowledging alert:', error);
          this.toast.error(error.error?.message || 'Failed to acknowledge alert');
        }
      });
  }

  /**
   * Record monitoring check
   */
  recordCheck(admissionId: number): void {
    const status = prompt('Enter status (STABLE, REQUIRES_ATTENTION, CRITICAL):');
    if (!status) {
      this.toast.error('Status is required');
      return;
    }

    const validStatuses = ['STABLE', 'REQUIRES_ATTENTION', 'CRITICAL'];
    if (!validStatuses.includes(status.toUpperCase())) {
      this.toast.error('Invalid status. Must be STABLE, REQUIRES_ATTENTION, or CRITICAL');
      return;
    }

    const notes = prompt('Optional notes:');

    this.monitoringService.recordCheck({ 
      admission_id: admissionId, 
      status: status.toUpperCase(),
      notes: notes || undefined
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Check recorded successfully');
          this.loadChecks(); // Reload to show new check
        },
        error: (error) => {
          this.logger.error('Error recording check:', error);
          this.toast.error(error.error?.message || 'Failed to record check');
        }
      });
  }

  /**
   * Pagination for alerts
   */
  nextAlertsPage(): void {
    if (this.alertsPage < this.alertsTotalPages) {
      this.alertsPage++;
      this.loadAlerts();
    }
  }

  prevAlertsPage(): void {
    if (this.alertsPage > 1) {
      this.alertsPage--;
      this.loadAlerts();
    }
  }

  /**
   * Pagination for checks
   */
  nextChecksPage(): void {
    if (this.checksPage < this.checksTotalPages) {
      this.checksPage++;
      this.loadChecks();
    }
  }

  prevChecksPage(): void {
    if (this.checksPage > 1) {
      this.checksPage--;
      this.loadChecks();
    }
  }

  /**
   * Get alert level badge color
   */
  getAlertLevelClass(level: number | string): string {
    const levelStr = String(level);
    switch (levelStr) {
      case '3':
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case '2':
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case '1':
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get check status badge color
   */
  getCheckStatusClass(status: string): string {
    switch (status) {
      case 'STABLE':
        return 'bg-green-100 text-green-800';
      case 'REQUIRES_ATTENTION':
        return 'bg-yellow-100 text-yellow-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
