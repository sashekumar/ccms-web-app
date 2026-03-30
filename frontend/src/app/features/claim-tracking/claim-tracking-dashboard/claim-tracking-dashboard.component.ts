import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ClaimTrackingService } from '../../../core/services/claim-tracking/claim-tracking.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import {
  ClaimTrackingTabType,
  ClaimTrackingStatsResponse,
  StatusLogRecord, MilestoneRecord, DurationRecord
} from '../../../shared/models/claim-tracking/claim-tracking.model';

/**
 * Claim Tracking & SLA Dashboard Component
 * Displays STATUS LOG / MILESTONES / DURATIONS across all claims with SLA indicators.
 * Follows the single standard UI pattern used across all CCMS modules.
 */
@Component({
  selector: 'app-claim-tracking-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, FormsModule],
  templateUrl: './claim-tracking-dashboard.component.html'
})
export class ClaimTrackingDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  Math = Math;

  stats: ClaimTrackingStatsResponse | null = null;
  loadingStats = false;

  activeTab: ClaimTrackingTabType = 'STATUS_LOG';
  readonly tabOptions: readonly ClaimTrackingTabType[] = ['STATUS_LOG', 'MILESTONES', 'DURATIONS'];

  loading = false;
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;
  searchTerm = '';
  filterStatus = '';
  filterClaimId: number | null = null;

  // Tab data
  statusLogs: StatusLogRecord[] = [];
  milestones: MilestoneRecord[] = [];
  durations: DurationRecord[] = [];

  // Selected record detail
  selectedStatusLog: StatusLogRecord | null = null;
  selectedMilestone: MilestoneRecord | null = null;
  selectedDuration: DurationRecord | null = null;

  constructor(
    private trackingService: ClaimTrackingService,
    private toast: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadCurrentTab();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  loadStats(): void {
    this.loadingStats = true;
    this.trackingService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (s) => { this.stats = s; this.loadingStats = false; },
        error: (err) => {
          const errorMsg = 'Failed to load tracking stats';
          this.toast.error(errorMsg);
          this.logger.error(errorMsg, err);
          this.loadingStats = false;
        }
      });
  }

  loadCurrentTab(): void {
    this.loading = true;
    const base: any = {};
    if (this.searchTerm) base['searchTerm'] = this.searchTerm;
    if (this.filterClaimId) base['claim_id'] = this.filterClaimId;

    switch (this.activeTab) {
      case 'STATUS_LOG':
        this.trackingService.getStatusLogs(this.page, this.pageSize, { ...base, new_status: this.filterStatus || undefined })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (r) => { this.statusLogs = r.data; this.setPage(r.total); this.loading = false; },
            error: (err) => {
              this.toast.error('Failed to load status logs');
              this.logger.error('Failed to load status logs', err);
              this.loading = false;
            }
          });
        break;
      case 'MILESTONES':
        this.trackingService.getMilestones(this.page, this.pageSize, base)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (r) => { this.milestones = r.data; this.setPage(r.total); this.loading = false; },
            error: (err) => {
              this.toast.error('Failed to load milestones');
              this.logger.error('Failed to load milestones', err);
              this.loading = false;
            }
          });
        break;
      case 'DURATIONS':
        this.trackingService.getDurations(this.page, this.pageSize, { ...base, status: this.filterStatus || undefined })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (r) => { this.durations = r.data; this.setPage(r.total); this.loading = false; },
            error: (err) => {
              this.toast.error('Failed to load durations');
              this.logger.error('Failed to load durations', err);
              this.loading = false;
            }
          });
        break;
    }
  }

  private setPage(total: number): void {
    this.total = total;
    this.totalPages = Math.ceil(total / this.pageSize);
  }

  // ============================================================================
  // TAB & FILTER
  // ============================================================================

  setTab(tab: ClaimTrackingTabType): void {
    this.activeTab = tab;
    this.page = 1;
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterClaimId = null;
    this.clearSelections();
    this.loadCurrentTab();
  }

  onSearch(): void {
    this.page = 1;
    this.loadCurrentTab();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadCurrentTab();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterClaimId = null;
    this.page = 1;
    this.loadCurrentTab();
  }

  clearSelections(): void {
    this.selectedStatusLog = null;
    this.selectedMilestone = null;
    this.selectedDuration = null;
  }

  // ============================================================================
  // PAGINATION
  // ============================================================================

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadCurrentTab();
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // ============================================================================
  // SELECTION
  // ============================================================================

  selectStatusLog(r: StatusLogRecord): void {
    this.selectedStatusLog = this.selectedStatusLog?.log_id === r.log_id ? null : r;
  }

  selectMilestone(r: MilestoneRecord): void {
    this.selectedMilestone = this.selectedMilestone?.milestone_id === r.milestone_id ? null : r;
  }

  selectDuration(r: DurationRecord): void {
    this.selectedDuration = this.selectedDuration?.duration_id === r.duration_id ? null : r;
  }

  get hasSelection(): boolean {
    return !!(this.selectedStatusLog || this.selectedMilestone || this.selectedDuration);
  }

  closeDetail(): void {
    this.clearSelections();
  }

  // ============================================================================
  // SLA HELPERS
  // ============================================================================

  getSlaClass(days: number | undefined): string {
    if (days == null) return 'text-gray-600';
    if (days <= 7) return 'text-green-700';
    if (days <= 14) return 'text-yellow-700';
    return 'text-red-700';
  }

  getSlaBadgeClass(days: number | undefined): string {
    if (days == null) return 'bg-gray-100 text-gray-700';
    if (days <= 7) return 'bg-green-100 text-green-800';
    if (days <= 14) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  getSlaLabel(days: number | undefined): string {
    if (days == null) return 'N/A';
    if (days <= 7) return 'On Track';
    if (days <= 14) return 'Caution';
    return 'Overdue';
  }

  isOpen(record: DurationRecord): boolean {
    return !record.end_date;
  }

  // ============================================================================
  // FORMAT HELPERS
  // ============================================================================

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-MY', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  getTabLabel(tab: ClaimTrackingTabType): string {
    const labels: Record<ClaimTrackingTabType, string> = {
      STATUS_LOG: 'Status Log',
      MILESTONES: 'Milestones',
      DURATIONS: 'Durations / SLA'
    };
    return labels[tab];
  }
}
