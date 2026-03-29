import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, LoadingSpinnerComponent, FormsModule],
  templateUrl: './monitoring-dashboard.component.html'
})
export class MonitoringDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Main tab management
  activeTab: 'alerts' | 'checks' = 'alerts';

  // LOS Alerts with multi-level tabs
  alerts: LOSAlert[] = [];
  loadingAlerts = false;
  alertsPage = 1;
  alertsLimit = 10;
  alertsTotal = 0;
  alertsTotalPages = 0;
  activeLevelTab: 'all' | 1 | 2 | 3 = 'all';
  expandedAlertIds: Set<number> = new Set();
  
  // Alert filtering
  alertSearchTerm = '';
  alertStatusFilter: 'all' | 'ACTIVE' | 'ACKNOWLEDGED' = 'all';

  // 8HM Checks with multi-level tabs
  checks: EightHourCheck[] = [];
  loadingChecks = false;
  checksPage = 1;
  checksLimit = 10;
  checksTotal = 0;
  checksTotalPages = 0;
  activeStatusTab: 'all' | 'STABLE' | 'REQUIRES_ATTENTION' | 'CRITICAL' = 'all';
  expandedCheckIds: Set<number> = new Set();
  
  // Check filtering
  checkSearchTerm = '';
  checkStatusFilter: 'all' | 'STABLE' | 'REQUIRES_ATTENTION' | 'CRITICAL' = 'all';

  // Acknowledge Alert Modal
  showAckModal = false;
  ackAlertId: number | null = null;
  ackNotes = '';
  ackLoading = false;

  // Record Check Modal
  showCheckModal = false;
  checkAdmissionId: number | null = null;
  checkStatus = 'STABLE';
  checkNotes = '';
  checkLoading = false;

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
   * Switch between main tabs
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
   * Switch alert level sub-tab (Task 13)
   */
  switchLevelTab(level: 'all' | 1 | 2 | 3): void {
    this.activeLevelTab = level;
    this.alertsPage = 1;
    this.loadAlerts();
  }

  /**
   * Switch check status sub-tab (Task 15)
   */
  switchStatusTab(status: 'all' | 'STABLE' | 'REQUIRES_ATTENTION' | 'CRITICAL'): void {
    this.activeStatusTab = status;
    this.checksPage = 1;
    this.loadChecks();
  }

  /**
   * Toggle alert expansion (Task 14)
   */
  toggleAlertExpanded(alertId: number): void {
    if (this.expandedAlertIds.has(alertId)) {
      this.expandedAlertIds.delete(alertId);
    } else {
      this.expandedAlertIds.add(alertId);
    }
  }

  /**
   * Check if alert is expanded (Task 14)
   */
  isAlertExpanded(alertId: number): boolean {
    return this.expandedAlertIds.has(alertId);
  }

  /**
   * Toggle check expansion (Task 14)
   */
  toggleCheckExpanded(checkId: number): void {
    if (this.expandedCheckIds.has(checkId)) {
      this.expandedCheckIds.delete(checkId);
    } else {
      this.expandedCheckIds.add(checkId);
    }
  }

  /**
   * Check if check is expanded (Task 14)
   */
  isCheckExpanded(checkId: number): boolean {
    return this.expandedCheckIds.has(checkId);
  }

  /**
   * Filter alerts by search term (Task 16)
   */
  applyAlertFilter(): void {
    this.alertsPage = 1;
    this.loadAlerts();
  }

  /**
   * Filter checks by search term (Task 16)
   */
  applyCheckFilter(): void {
    this.checksPage = 1;
    this.loadChecks();
  }

  /**
   * Get filtered alerts for display
   */
  getFilteredAlerts(): LOSAlert[] {
    return this.alerts.filter(alert => {
      // Filter by level
      if (this.activeLevelTab !== 'all' && alert.alert_level !== this.activeLevelTab) {
        return false;
      }
      // Filter by status
      if (this.alertStatusFilter !== 'all' && alert.status !== this.alertStatusFilter) {
        return false;
      }
      // Filter by search term
      if (this.alertSearchTerm.trim()) {
        const term = this.alertSearchTerm.toLowerCase();
        return (
          alert.member_name?.toLowerCase().includes(term) ||
          alert.hospital_name?.toLowerCase().includes(term) ||
          alert.claim_ref_no?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }

  /**
   * Get filtered checks for display
   */
  getFilteredChecks(): EightHourCheck[] {
    return this.checks.filter(check => {
      // Filter by status
      if (this.activeStatusTab !== 'all' && check.status !== this.activeStatusTab) {
        return false;
      }
      // Filter by search term
      if (this.checkSearchTerm.trim()) {
        const term = this.checkSearchTerm.toLowerCase();
        return (
          check.member_name?.toLowerCase().includes(term) ||
          check.hospital_name?.toLowerCase().includes(term) ||
          check.claim_ref_no?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }

  /**
   * Get count of alerts by level
   */
  getAlertCountByLevel(level: 1 | 2 | 3): number {
    return this.alerts.filter(a => a.alert_level === level).length;
  }

  /**
   * Get count of checks by status
   */
  getCheckCountByStatus(status: 'STABLE' | 'REQUIRES_ATTENTION' | 'CRITICAL'): number {
    return this.checks.filter(c => c.status === status).length;
  }

  /**
   * Load LOS alerts
   */
  loadAlerts(): void {
    this.loadingAlerts = true;
    
    const filters: MonitoringFilters = {
      page: this.alertsPage,
      limit: this.alertsLimit,
      sortBy: 'triggered_at',
      sortOrder: 'DESC'
    };

    // Add level filter if specific level selected (Task 13)
    if (this.activeLevelTab !== 'all') {
      filters.alertLevel = this.activeLevelTab;
    }

    // Add search term if provided (Task 16)
    if (this.alertSearchTerm.trim()) {
      filters.searchTerm = this.alertSearchTerm;
    }

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

    // Add status filter if specific status selected (Task 15)
    if (this.activeStatusTab !== 'all') {
      filters.checkStatus = this.activeStatusTab;
    }

    // Add search term if provided (Task 16)
    if (this.checkSearchTerm.trim()) {
      filters.searchTerm = this.checkSearchTerm;
    }

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
   * Open acknowledge modal
   */
  acknowledgeAlert(alertId: number): void {
    this.ackAlertId = alertId;
    this.ackNotes = '';
    this.showAckModal = true;
  }

  /**
   * Submit acknowledgment
   */
  submitAcknowledge(): void {
    if (!this.ackAlertId) return;
    this.ackLoading = true;

    this.monitoringService.acknowledgeAlert({ alert_id: this.ackAlertId, notes: this.ackNotes || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.ackLoading = false;
          this.showAckModal = false;
          this.toast.success('Alert acknowledged successfully');
          this.loadAlerts();
        },
        error: (error) => {
          this.ackLoading = false;
          this.logger.error('Error acknowledging alert:', error);
          this.toast.error(error.error?.message || 'Failed to acknowledge alert');
        }
      });
  }

  /**
   * Open record check modal
   */
  recordCheck(admissionId: number): void {
    this.checkAdmissionId = admissionId;
    this.checkStatus = 'STABLE';
    this.checkNotes = '';
    this.showCheckModal = true;
  }

  /**
   * Submit monitoring check
   */
  submitCheck(): void {
    if (!this.checkAdmissionId || !this.checkStatus) return;
    this.checkLoading = true;

    this.monitoringService.recordCheck({
      admission_id: this.checkAdmissionId,
      status: this.checkStatus,
      notes: this.checkNotes || undefined
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.checkLoading = false;
        this.showCheckModal = false;
        this.toast.success('Check recorded successfully');
        this.loadChecks();
      },
      error: (error) => {
        this.checkLoading = false;
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
