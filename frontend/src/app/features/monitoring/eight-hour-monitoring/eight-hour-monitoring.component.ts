import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { EightHourMonitoringService } from '../../../shared/services/eight-hour-monitoring/eight-hour-monitoring.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { EightHourMonitoringRecord, EightHourMonitoringFilters } from '../../../shared/models/eight-hour-monitoring/eight-hour-monitoring.model';

/**
 * 8-Hour Monitoring Component
 * Displays monitoring checks that need to be completed within 8-hour window
 * Checks: Pre-auth, Coverage verification, Documentation review, Claim eligibility
 */
@Component({
  selector: 'app-eight-hour-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './eight-hour-monitoring.component.html'
})
export class EightHourMonitoringComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  Math = Math;

  // Monitoring checks data
  checks: EightHourMonitoringRecord[] = [];
  loadingChecks = false;
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  // Status filtering
  activeStatusTab: 'all' | 'PENDING' | 'COMPLETED' | 'OVERDUE' = 'all';
  statusCounts = {
    all: 0,
    PENDING: 0,
    COMPLETED: 0,
    OVERDUE: 0
  };

  // Search & Filters
  searchTerm = '';
  admissionIdFilter = '';
  checkedByFilter = '';
  sortBy = 'created_at';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  // Action modals
  showRecordCheckModal = false;
  selectedCheck: EightHourMonitoringRecord | null = null;
  checkNotes = '';
  modalLoading = false;

  // Statistics
  stats = {
    total_checks: 0,
    checks_today: 0,
    pending_checks: 0,
    completed_checks: 0,
    overdue_checks: 0,
    top_checker: null as string | null
  };

  constructor(
    private eightHourService: EightHourMonitoringService,
    private toast: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadChecks();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load 8-hour monitoring checks with current filters
   */
  loadChecks(): void {
    this.loadingChecks = true;

    const filters: EightHourMonitoringFilters = {
      admission_id: this.admissionIdFilter ? BigInt(this.admissionIdFilter) : undefined,
      checked_by: this.checkedByFilter || undefined,
      status: this.activeStatusTab !== 'all' ? this.activeStatusTab : undefined,
      search: this.searchTerm || undefined
    };

    this.eightHourService.getChecks(this.page, this.limit, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.checks = response.data;
          this.total = response.total;
          this.totalPages = response.pages;
          this.updateStatusCounts();
          this.loadingChecks = false;
        },
        error: (error) => {
          this.logger.error('Error loading 8-hour monitoring checks', error);
          this.toast.error('Error loading checks');
          this.loadingChecks = false;
        }
      });
  }

  /**
   * Load 8-hour monitoring statistics
   */
  loadStats(): void {
    this.eightHourService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.stats = response.data;
        },
        error: (error) => {
          this.logger.error('Error loading 8-hour monitoring stats', error);
        }
      });
  }

  /**
   * Apply filters and reload checks
   */
  applyFilters(): void {
    this.page = 1;
    this.loadChecks();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.admissionIdFilter = '';
    this.checkedByFilter = '';
    this.sortBy = 'created_at';
    this.sortOrder = 'DESC';
    this.page = 1;
    this.activeStatusTab = 'all';
    this.loadChecks();
  }

  /**
   * Switch to different status tab
   */
  switchStatusTab(status: 'all' | 'PENDING' | 'COMPLETED' | 'OVERDUE'): void {
    this.activeStatusTab = status;
    this.page = 1;
    this.loadChecks();
  }

  /**
   * Select check for detail viewing
   */
  selectCheckForDetail(check: EightHourMonitoringRecord): void {
    this.selectedCheck = check;
  }

  /**
   * Open record check modal
   */
  openRecordCheckModal(check: EightHourMonitoringRecord): void {
    this.selectedCheck = check;
    this.showRecordCheckModal = true;
    this.checkNotes = '';
  }

  /**
   * Close record check modal
   */
  closeRecordCheckModal(): void {
    this.showRecordCheckModal = false;
    this.selectedCheck = null;
    this.checkNotes = '';
  }

  /**
   * Record check completion
   */
  recordCheckCompletion(): void {
    if (!this.selectedCheck) {
      this.toast.warning('No check selected');
      return;
    }

    this.modalLoading = true;

    this.eightHourService.recordCheck(
      this.selectedCheck.monitoring_id,
      this.checkNotes
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Check recorded successfully');
          this.closeRecordCheckModal();
          this.loadChecks();
          this.loadStats();
          this.modalLoading = false;
        },
        error: (error) => {
          this.logger.error('Error recording check', error);
          this.toast.error('Error recording check');
          this.modalLoading = false;
        }
      });
  }

  /**
   * Get status badge color
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get time remaining in hours
   */
  getTimeRemaining(dueAt: Date): string {
    const now = new Date();
    const dueDate = new Date(dueAt);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffHours < 0) {
      return `Overdue by ${Math.abs(diffHours)}h`;
    }
    return `${diffHours}h remaining`;
  }

  /**
   * Update status counts
   */
  private updateStatusCounts(): void {
    this.statusCounts.all = this.total;
    this.statusCounts.PENDING = this.checks.filter(c => c.status === 'PENDING').length;
    this.statusCounts.COMPLETED = this.checks.filter(c => c.status === 'COMPLETED').length;
    this.statusCounts.OVERDUE = this.checks.filter(c => c.status === 'OVERDUE').length;
  }

  /**
   * Previous page
   */
  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadChecks();
    }
  }

  /**
   * Next page
   */
  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadChecks();
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
   * TrackBy function for checks list
   */
  trackByCheckId(index: number, check: EightHourMonitoringRecord): bigint {
    return check.monitoring_id;
  }
}
