import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FwdAccumulationService } from '../../../core/services/fwd-accumulation/fwd-accumulation.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import {
  FwdAccumulationType,
  FwdAccumulationStatsResponse,
  FwdClientRecord, FwdDisabilityRecord, FwdOnetimeRecord, FwdPaRecord
} from '../../../shared/models/fwd-accumulation/fwd-accumulation.model';

/**
 * FWD Accumulation Tracking Dashboard Component
 * Displays 4 sub-type tabs: Client, Disability, Onetime, PA.
 * Follows the single standard UI pattern used across all CCMS modules.
 */
@Component({
  selector: 'app-fwd-accumulation-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, FormsModule],
  templateUrl: './fwd-accumulation-dashboard.component.html'
})
export class FwdAccumulationDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  Math = Math;

  stats: FwdAccumulationStatsResponse | null = null;
  loadingStats = false;

  activeTab: FwdAccumulationType = 'CLIENT';
  readonly tabOptions: readonly FwdAccumulationType[] = ['CLIENT', 'DISABILITY', 'ONETIME', 'PA'];

  loading = false;
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;
  searchTerm = '';

  // Tab-specific data
  clientRecords: FwdClientRecord[] = [];
  disabilityRecords: FwdDisabilityRecord[] = [];
  onetimeRecords: FwdOnetimeRecord[] = [];
  paRecords: FwdPaRecord[] = [];

  // Detail side panel
  selectedClientRecord: FwdClientRecord | null = null;
  selectedDisabilityRecord: FwdDisabilityRecord | null = null;
  selectedOnetimeRecord: FwdOnetimeRecord | null = null;
  selectedPaRecord: FwdPaRecord | null = null;

  constructor(
    private fwdService: FwdAccumulationService,
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
    this.fwdService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (s) => { this.stats = s; this.loadingStats = false; },
        error: (err) => { this.logger.error('Failed to load FWD stats', err); this.loadingStats = false; }
      });
  }

  loadCurrentTab(): void {
    this.loading = true;
    const filters: any = {};
    if (this.searchTerm) filters['searchTerm'] = this.searchTerm;

    switch (this.activeTab) {
      case 'CLIENT':
        this.fwdService.getClientRecords(this.page, this.pageSize, filters)
          .pipe(takeUntil(this.destroy$))
          .subscribe({ next: (r) => { this.clientRecords = r.data; this.total = r.total; this.totalPages = Math.ceil(r.total / this.pageSize); this.loading = false; }, error: () => this.loading = false });
        break;
      case 'DISABILITY':
        this.fwdService.getDisabilityRecords(this.page, this.pageSize, filters)
          .pipe(takeUntil(this.destroy$))
          .subscribe({ next: (r) => { this.disabilityRecords = r.data; this.total = r.total; this.totalPages = Math.ceil(r.total / this.pageSize); this.loading = false; }, error: () => this.loading = false });
        break;
      case 'ONETIME':
        this.fwdService.getOnetimeRecords(this.page, this.pageSize, filters)
          .pipe(takeUntil(this.destroy$))
          .subscribe({ next: (r) => { this.onetimeRecords = r.data; this.total = r.total; this.totalPages = Math.ceil(r.total / this.pageSize); this.loading = false; }, error: () => this.loading = false });
        break;
      case 'PA':
        this.fwdService.getPaRecords(this.page, this.pageSize, filters)
          .pipe(takeUntil(this.destroy$))
          .subscribe({ next: (r) => { this.paRecords = r.data; this.total = r.total; this.totalPages = Math.ceil(r.total / this.pageSize); this.loading = false; }, error: () => this.loading = false });
        break;
    }
  }

  // ============================================================================
  // TAB & FILTER
  // ============================================================================

  setTab(tab: FwdAccumulationType): void {
    this.activeTab = tab;
    this.page = 1;
    this.searchTerm = '';
    this.clearSelections();
    this.loadCurrentTab();
  }

  onSearch(): void {
    this.page = 1;
    this.loadCurrentTab();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.page = 1;
    this.loadCurrentTab();
  }

  clearSelections(): void {
    this.selectedClientRecord = null;
    this.selectedDisabilityRecord = null;
    this.selectedOnetimeRecord = null;
    this.selectedPaRecord = null;
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
  // SELECTION (detail panel)
  // ============================================================================

  selectClient(r: FwdClientRecord): void {
    this.selectedClientRecord = this.selectedClientRecord?.client_acc_id === r.client_acc_id ? null : r;
  }

  selectDisability(r: FwdDisabilityRecord): void {
    this.selectedDisabilityRecord = this.selectedDisabilityRecord?.disability_acc_id === r.disability_acc_id ? null : r;
  }

  selectOnetime(r: FwdOnetimeRecord): void {
    this.selectedOnetimeRecord = this.selectedOnetimeRecord?.onetime_acc_id === r.onetime_acc_id ? null : r;
  }

  selectPa(r: FwdPaRecord): void {
    this.selectedPaRecord = this.selectedPaRecord?.pa_acc_id === r.pa_acc_id ? null : r;
  }

  get hasSelection(): boolean {
    return !!(this.selectedClientRecord || this.selectedDisabilityRecord || this.selectedOnetimeRecord || this.selectedPaRecord);
  }

  closeDetail(): void {
    this.clearSelections();
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  formatCurrency(value: number | undefined): string {
    if (value == null) return '-';
    const formatted = new Intl.NumberFormat('en-MY', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(value);
    return 'RM ' + formatted;
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  getMonthName(month: number | undefined): string {
    if (!month) return '-';
    return new Date(2000, month - 1, 1).toLocaleString('en-MY', { month: 'long' });
  }
}
