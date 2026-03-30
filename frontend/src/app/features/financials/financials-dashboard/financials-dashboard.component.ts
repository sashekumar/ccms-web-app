import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FinancialsService } from '../../../core/services/financials/financials.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import {
  PaymentAdviceResponse,
  PaymentAdviceStatsResponse,
  UpdatePaymentAdviceDto,
  PaymentStatus
} from '../../../shared/models/financials/financials.model';

/**
 * Financials Dashboard Component
 * Displays and manages Payment Advices with status filtering and detail view.
 * Follows the single standard UI pattern used across all CCMS modules.
 */
@Component({
  selector: 'app-financials-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, FormsModule],
  templateUrl: './financials-dashboard.component.html'
})
export class FinancialsDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Expose Math to template
  Math = Math;

  // Data
  paymentAdvices: PaymentAdviceResponse[] = [];
  stats: PaymentAdviceStatsResponse | null = null;
  loading = false;
  loadingStats = false;
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;

  // Filters
  activeStatusTab: 'all' | PaymentStatus = 'PENDING';
  searchTerm = '';
  filterIsShortfall: '' | 'true' | 'false' = '';
  filterIsMultiplPa: '' | 'true' | 'false' = '';

  // Selected record for detail view
  selectedPa: PaymentAdviceResponse | null = null;
  loadingDetail = false;

  // Update modal
  showUpdateModal = false;
  updatePaId: number | null = null;
  updatePaymentStatus: PaymentStatus | '' = '';
  updatePaymentMethod = '';
  updateSubmissionBatchNo = '';
  updatePhysicalFolderStatus = '';
  updating = false;

  readonly statusOptions: PaymentStatus[] = ['PENDING', 'APPROVED', 'PAID', 'CANCELLED', 'DEFERRED'];

  constructor(
    private financialsService: FinancialsService,
    private toast: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadPaymentAdvices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  loadPaymentAdvices(): void {
    this.loading = true;

    const filters: any = {
      payment_status: this.activeStatusTab !== 'all' ? this.activeStatusTab : undefined,
      searchTerm: this.searchTerm.trim() || undefined,
      is_shortfall: this.filterIsShortfall !== '' ? this.filterIsShortfall === 'true' : undefined,
      is_multipl_pa: this.filterIsMultiplPa !== '' ? this.filterIsMultiplPa === 'true' : undefined
    };

    this.financialsService.getPaymentAdvices(this.page, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.paymentAdvices = result.data;
          this.total = result.total;
          this.totalPages = result.totalPages;
          this.loading = false;
          this.logger.info('Payment advices loaded successfully');
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error loading payment advices:', error);
          this.toast.error('Failed to load payment advices');
        }
      });
  }

  loadStats(): void {
    this.loadingStats = true;
    this.financialsService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.loadingStats = false;
        },
        error: (error) => {
          this.loadingStats = false;
          this.logger.error('Error loading PA stats:', error);
        }
      });
  }

  // ============================================================================
  // FILTERS & TABS
  // ============================================================================

  applyFilters(): void {
    this.page = 1;
    this.loadPaymentAdvices();
  }

  switchStatusTab(status: 'all' | PaymentStatus): void {
    this.activeStatusTab = status;
    this.page = 1;
    this.loadPaymentAdvices();
  }

  // ============================================================================
  // DETAIL VIEW
  // ============================================================================

  viewDetails(pa: PaymentAdviceResponse): void {
    this.loadingDetail = true;
    this.financialsService.getPaymentAdviceById(pa.pa_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.selectedPa = detail;
          this.loadingDetail = false;
        },
        error: (error) => {
          this.loadingDetail = false;
          this.logger.error('Error loading PA detail:', error);
          this.toast.error('Failed to load payment advice details');
        }
      });
  }

  closeDetails(): void {
    this.selectedPa = null;
  }

  // ============================================================================
  // UPDATE MODAL
  // ============================================================================

  openUpdateModal(pa: PaymentAdviceResponse): void {
    this.updatePaId = pa.pa_id;
    this.updatePaymentStatus = pa.payment_status || '';
    this.updatePaymentMethod = pa.payment_method || '';
    this.updateSubmissionBatchNo = pa.submission_batch_no || '';
    this.updatePhysicalFolderStatus = pa.physical_folder_status || '';
    this.showUpdateModal = true;
  }

  closeUpdateModal(): void {
    this.showUpdateModal = false;
    this.updatePaId = null;
    this.updating = false;
  }

  submitUpdate(): void {
    if (!this.updatePaId) return;
    if (!this.updatePaymentStatus) {
      this.toast.warning('Please select a payment status');
      return;
    }

    this.updating = true;

    const dto: UpdatePaymentAdviceDto = {
      payment_status: this.updatePaymentStatus as PaymentStatus,
      payment_method: this.updatePaymentMethod || undefined,
      submission_batch_no: this.updateSubmissionBatchNo || undefined,
      physical_folder_status: this.updatePhysicalFolderStatus || undefined
    };

    this.financialsService.updatePaymentAdvice(this.updatePaId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.updating = false;
          this.showUpdateModal = false;
          this.toast.success('Payment advice updated successfully');
          this.loadPaymentAdvices();
          this.loadStats();
          if (this.selectedPa?.pa_id === this.updatePaId) {
            this.selectedPa = updated;
          }
        },
        error: (error) => {
          this.updating = false;
          this.logger.error('Error updating payment advice:', error);
          this.toast.error('Failed to update payment advice');
        }
      });
  }

  // ============================================================================
  // DISPLAY HELPERS
  // ============================================================================

  getStatusColor(status?: string): string {
    switch (status) {
      case 'PENDING':   return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':  return 'bg-blue-100 text-blue-800';
      case 'PAID':      return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'DEFERRED':  return 'bg-orange-100 text-orange-800';
      default:          return 'bg-gray-100 text-gray-800';
    }
  }

  getCountByStatus(status: string): number {
    if (status === 'all') return this.total;
    return this.paymentAdvices.filter(pa => pa.payment_status === status).length;
  }

  formatCurrency(amount?: number): string {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ============================================================================
  // PAGINATION
  // ============================================================================

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadPaymentAdvices();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadPaymentAdvices();
    }
  }

  onPriorityChange(event: Event): void {
    // Not used in financials but retained for structural parity
  }
}
