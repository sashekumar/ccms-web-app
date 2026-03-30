import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { StopLossService } from '../../../core/services/stop-loss/stop-loss.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import {
  StopLossRecord,
  StopLossStatsResponse,
  UpdateStopLossDto,
  PeriodType
} from '../../../shared/models/stop-loss/stop-loss.model';

/**
 * Stop Loss Management Dashboard Component
 * Displays stop loss records with CURRENT / HISTORY / ALL tab filtering.
 * Follows the single standard UI pattern used across all CCMS modules.
 */
@Component({
  selector: 'app-stop-loss-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, FormsModule],
  templateUrl: './stop-loss-dashboard.component.html'
})
export class StopLossDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Expose Math to template
  Math = Math;

  // Data
  records: StopLossRecord[] = [];
  stats: StopLossStatsResponse | null = null;
  loading = false;
  loadingStats = false;
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;

  // Filters
  activeTab: 'CURRENT' | 'HISTORY' | 'ALL' = 'CURRENT';
  searchTerm = '';
  filterPeriodType: '' | PeriodType = '';
  filterProductId: number | null = null;

  // Selected record for detail panel
  selectedRecord: StopLossRecord | null = null;

  // Update modal
  showUpdateModal = false;
  updateSlId: number | null = null;
  updateForm: UpdateStopLossDto = {};
  updating = false;

  readonly periodTypeOptions: PeriodType[] = ['MONTHLY', 'QUARTERLY', 'ANNUAL'];
  readonly tabOptions: readonly ('CURRENT' | 'HISTORY' | 'ALL')[] = ['CURRENT', 'HISTORY', 'ALL'];

  constructor(
    private stopLossService: StopLossService,
    private toast: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadRecords();
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
    this.stopLossService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.loadingStats = false;
        },
        error: (err) => {
          this.logger.error('Failed to load stop loss stats', err);
          this.loadingStats = false;
        }
      });
  }

  loadRecords(): void {
    this.loading = true;
    const filters: any = {};
    if (this.activeTab === 'CURRENT') filters['is_history_record'] = false;
    if (this.activeTab === 'HISTORY') filters['is_history_record'] = true;
    if (this.searchTerm) filters['searchTerm'] = this.searchTerm;
    if (this.filterPeriodType) filters['period_type'] = this.filterPeriodType;
    if (this.filterProductId) filters['product_id'] = this.filterProductId;

    this.stopLossService.getStopLossRecords(this.page, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.records = res.data;
          this.total = res.total;
          this.totalPages = Math.ceil(res.total / this.pageSize);
          this.loading = false;
        },
        error: (err) => {
          this.logger.error('Failed to load stop loss records', err);
          this.loading = false;
        }
      });
  }

  // ============================================================================
  // TAB & FILTER CONTROLS
  // ============================================================================

  setTab(tab: 'CURRENT' | 'HISTORY' | 'ALL'): void {
    this.activeTab = tab;
    this.page = 1;
    this.loadRecords();
  }

  onSearch(): void {
    this.page = 1;
    this.loadRecords();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadRecords();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterPeriodType = '';
    this.filterProductId = null;
    this.page = 1;
    this.loadRecords();
  }

  // ============================================================================
  // PAGINATION
  // ============================================================================

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadRecords();
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // ============================================================================
  // DETAIL PANEL
  // ============================================================================

  selectRecord(record: StopLossRecord): void {
    this.selectedRecord = this.selectedRecord?.sl_id === record.sl_id ? null : record;
  }

  closeDetail(): void {
    this.selectedRecord = null;
  }

  // ============================================================================
  // UPDATE MODAL
  // ============================================================================

  openUpdateModal(record: StopLossRecord): void {
    this.updateSlId = record.sl_id;
    this.updateForm = {
      product_id: record.product_id,
      period_type: record.period_type,
      period_date: record.period_date,
      total_policy_count: record.total_policy_count,
      total_gross_premium: record.total_gross_premium,
      claims_ol: record.claims_ol,
      claims_reim: record.claims_reim,
      tpa_fees: record.tpa_fees,
      is_history_record: record.is_history_record
    };
    this.showUpdateModal = true;
  }

  closeUpdateModal(): void {
    this.showUpdateModal = false;
    this.updateSlId = null;
    this.updateForm = {};
  }

  submitUpdate(): void {
    if (!this.updateSlId) return;
    this.updating = true;
    this.stopLossService.updateStopLoss(this.updateSlId, this.updateForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Stop loss record updated successfully');
          this.updating = false;
          this.closeUpdateModal();
          this.loadStats();
          this.loadRecords();
        },
        error: (err) => {
          this.logger.error('Failed to update stop loss record', err);
          this.toast.error('Failed to update stop loss record');
          this.updating = false;
        }
      });
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  formatCurrency(value: number | undefined): string {
    if (value == null) return '-';
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(value);
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  getPeriodLabel(record: StopLossRecord): string {
    if (!record.period_date) return '-';
    const d = new Date(record.period_date);
    if (record.period_type === 'MONTHLY') {
      return d.toLocaleDateString('en-MY', { year: 'numeric', month: 'long' });
    }
    if (record.period_type === 'ANNUAL') {
      return d.getFullYear().toString();
    }
    return this.formatDate(record.period_date);
  }
}
