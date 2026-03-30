import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LOSMonitoringService } from '../../../shared/services/los-monitoring/los-monitoring.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { LOSAlertRecord, LOSMonitoringFilters } from '../../../shared/models/los-monitoring/los-monitoring.model';

/**
 * LOS (Length of Stay) Monitoring Component
 * Displays LOS alerts with monitoring, filtering, pagination, and acknowledgment
 * Alert Levels: LEVEL_1 (15 days), LEVEL_2 (20 days), LEVEL_3 (25 days)
 */
@Component({
  selector: 'app-los-monitoring',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, FormsModule],
  templateUrl: './los-monitoring.component.html'
})
export class LOSMonitoringComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  Math = Math;

  // LOS alerts data
  alerts: LOSAlertRecord[] = [];
  loadingAlerts = false;
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  // Status filtering
  activeStatusTab: 'all' | 'PENDING' | 'ACKNOWLEDGED' = 'all';
  statusCounts = {
    all: 0,
    PENDING: 0,
    ACKNOWLEDGED: 0
  };

  // Alert level counts
  levelCounts = {
    level_1: 0,
    level_2: 0,
    level_3: 0
  };

  // Search & Filters
  searchTerm = '';
  admissionIdFilter = '';
  alertLevelFilter: 'all' | 1 | 2 | 3 = 'all';
  thresholdDaysFilter = '';
  sortBy = 'triggered_at';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  // Expanded rows
  expandedAlertIds: Set<bigint> = new Set();

  // Action modals
  showAcknowledgeModal = false;
  selectedAlert: LOSAlertRecord | null = null;
  acknowledgedBy = '';
  notes = '';
  modalLoading = false;

  // Statistics
  showStats = false;
  stats = {
    total_active_alerts: 0,
    level_1_alerts: 0,
    level_2_alerts: 0,
    level_3_alerts: 0,
    acknowledged_alerts: 0,
    pending_alerts: 0,
    average_los: 0,
    highest_los: 0
  };

  constructor(
    private losService: LOSMonitoringService,
    private toast: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load LOS alerts with current filters
   */
  loadAlerts(): void {
    this.loadingAlerts = true;

    const filters: LOSMonitoringFilters = {
      admission_id: this.admissionIdFilter ? BigInt(this.admissionIdFilter) : undefined,
      alert_level: this.alertLevelFilter !== 'all' ? this.alertLevelFilter : undefined,
      status: this.activeStatusTab !== 'all' ? this.activeStatusTab : undefined,
      search: this.searchTerm || undefined
    };

    this.losService.getLOSAlerts(this.page, this.limit, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.alerts = response.data;
          this.total = response.total;
          this.totalPages = response.pages;
          this.updateStatusCounts();
          this.loadingAlerts = false;
        },
        error: (error) => {
          this.logger.error('Error loading LOS alerts', error);
          this.toast.error('Error loading LOS alerts');
          this.loadingAlerts = false;
        }
      });
  }

  /**
   * Load LOS monitoring statistics
   */
  loadStats(): void {
    this.losService.getLOSStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.stats = response.data;
          this.levelCounts = {
            level_1: response.data.level_1_alerts,
            level_2: response.data.level_2_alerts,
            level_3: response.data.level_3_alerts
          };
        },
        error: (error) => {
          this.logger.error('Error loading LOS stats', error);
        }
      });
  }

  /**
   * Apply filters and reload alerts
   */
  applyFilters(): void {
    this.page = 1;
    this.loadAlerts();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.admissionIdFilter = '';
    this.alertLevelFilter = 'all';
    this.thresholdDaysFilter = '';
    this.sortBy = 'triggered_at';
    this.sortOrder = 'DESC';
    this.page = 1;
    this.activeStatusTab = 'all';
    this.loadAlerts();
  }

  /**
   * Switch to different status tab
   */
  switchStatusTab(status: 'all' | 'PENDING' | 'ACKNOWLEDGED'): void {
    this.activeStatusTab = status;
    this.page = 1;
    this.loadAlerts();
  }

  /**
   * Toggle row expansion
   */
  toggleExpanded(alertId: bigint): void {
    if (this.expandedAlertIds.has(alertId)) {
      this.expandedAlertIds.delete(alertId);
    } else {
      this.expandedAlertIds.add(alertId);
    }
  }

  /**
   * Check if row is expanded
   */
  isExpanded(alertId: bigint): boolean {
    return this.expandedAlertIds.has(alertId);
  }

  /**
   * Open acknowledge modal
   */
  openAcknowledgeModal(alert: LOSAlertRecord): void {
    this.selectedAlert = alert;
    this.showAcknowledgeModal = true;
    this.acknowledgedBy = '';
    this.notes = '';
  }

  /**
   * Close acknowledge modal
   */
  closeAcknowledgeModal(): void {
    this.showAcknowledgeModal = false;
    this.selectedAlert = null;
    this.acknowledgedBy = '';
    this.notes = '';
  }

  /**
   * Acknowledge an LOS alert
   */
  acknowledgeAlert(): void {
    if (!this.selectedAlert || !this.acknowledgedBy.trim()) {
      this.toast.warning('Please enter acknowledged by information');
      return;
    }

    this.modalLoading = true;

    this.losService.acknowledgeLOSAlert(
      this.selectedAlert.alert_id,
      this.acknowledgedBy,
      this.notes
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Alert acknowledged successfully');
          this.closeAcknowledgeModal();
          this.loadAlerts();
          this.loadStats();
          this.modalLoading = false;
        },
        error: (error) => {
          this.logger.error('Error acknowledging alert', error);
          this.toast.error('Error acknowledging alert');
          this.modalLoading = false;
        }
      });
  }

  /**
   * Get alert level badge color
   */
  getAlertLevelClass(level: number): string {
    switch (level) {
      case 1:
        return 'bg-yellow-100 text-yellow-800';
      case 2:
        return 'bg-orange-100 text-orange-800';
      case 3:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get alert level label
   */
  getAlertLevelLabel(level: number): string {
    switch (level) {
      case 1:
        return 'LEVEL 1 (15 days)';
      case 2:
        return 'LEVEL 2 (20 days)';
      case 3:
        return 'LEVEL 3 (25 days)';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Get status badge color
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-red-100 text-red-800';
      case 'ACKNOWLEDGED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Update status counts
   */
  private updateStatusCounts(): void {
    this.statusCounts.all = this.total;
    this.statusCounts.PENDING = this.alerts.filter(a => a.status === 'PENDING').length;
    this.statusCounts.ACKNOWLEDGED = this.alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
  }

  /**
   * Previous page
   */
  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadAlerts();
    }
  }

  /**
   * Next page
   */
  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadAlerts();
    }
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * TrackBy function for alerts list
   */
  trackByAlertId(index: number, alert: LOSAlertRecord): bigint {
    return alert.alert_id;
  }
}
