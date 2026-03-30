import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DefermentService } from '../../../shared/services/deferment/deferment.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { DefermentRequest, DefermentFilters } from '../../../shared/models/deferment/deferment.model';

/**
 * Deferment Monitoring Component
 * Displays deferment requests with filtering, pagination, and approval workflow
 * Status: PENDING → APPROVED or REJECTED
 */
@Component({
  selector: 'app-deferment-monitoring',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, FormsModule],
  templateUrl: './deferment-monitoring.component.html'
})
export class DefermentMonitoringComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  Math = Math;

  // Deferments data
  deferments: DefermentRequest[] = [];
  loadingDeferments = false;
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  // Status filtering
  activeStatusTab: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'all';
  statusCounts = {
    all: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0
  };

  // Search & Filters
  searchTerm = '';
  admissionIdFilter = '';
  requestedByFilter = '';
  statusFilter: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'all';
  sortBy = 'created_at';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  // Expanded rows
  expandedDefermentIds: Set<bigint> = new Set();

  // Action modals
  showActionModal = false;
  actionType: 'APPROVE' | 'REJECT' | null = null;
  selectedDeferment: DefermentRequest | null = null;
  actionApprovedBy = '';
  actionComments = '';
  modalLoading = false;

  // Statistics
  stats = {
    total_deferments: 0,
    pending_approval: 0,
    approved_deferments: 0,
    rejected_deferments: 0,
    average_deferment_days: 0
  };

  constructor(
    private defermentService: DefermentService,
    private toast: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadDeferments();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load deferment requests with current filters
   */
  loadDeferments(): void {
    this.loadingDeferments = true;

    const filters: DefermentFilters = {
      admission_id: this.admissionIdFilter ? BigInt(this.admissionIdFilter) : undefined,
      requested_by: this.requestedByFilter || undefined,
      status: this.activeStatusTab !== 'all' ? this.activeStatusTab : undefined,
      search: this.searchTerm || undefined
    };

    this.defermentService.getDefermentRequests(this.page, this.limit, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.deferments = response.data;
          this.total = response.total;
          this.totalPages = response.pages;
          this.updateStatusCounts();
          this.loadingDeferments = false;
        },
        error: (error) => {
          this.logger.error('Error loading deferments', error);
          this.toast.error('Error loading deferments');
          this.loadingDeferments = false;
        }
      });
  }

  /**
   * Load deferment statistics
   */
  loadStats(): void {
    this.defermentService.getDefermentStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.stats = response.data;
        },
        error: (error) => {
          this.logger.error('Error loading deferment stats', error);
        }
      });
  }

  /**
   * Apply filters and reload deferments
   */
  applyFilters(): void {
    this.page = 1;
    this.loadDeferments();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.admissionIdFilter = '';
    this.requestedByFilter = '';
    this.statusFilter = 'all';
    this.sortBy = 'created_at';
    this.sortOrder = 'DESC';
    this.page = 1;
    this.activeStatusTab = 'all';
    this.loadDeferments();
  }

  /**
   * Switch to different status tab
   */
  switchStatusTab(status: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED'): void {
    this.activeStatusTab = status;
    this.page = 1;
    this.loadDeferments();
  }

  /**
   * Toggle row expansion
   */
  toggleExpanded(defermentId: bigint): void {
    if (this.expandedDefermentIds.has(defermentId)) {
      this.expandedDefermentIds.delete(defermentId);
    } else {
      this.expandedDefermentIds.add(defermentId);
    }
  }

  /**
   * Check if row is expanded
   */
  isExpanded(defermentId: bigint): boolean {
    return this.expandedDefermentIds.has(defermentId);
  }

  /**
   * Open action modal
   */
  openActionModal(deferment: DefermentRequest, action: 'APPROVE' | 'REJECT'): void {
    this.selectedDeferment = deferment;
    this.actionType = action;
    this.showActionModal = true;
    this.actionApprovedBy = '';
    this.actionComments = '';
  }

  /**
   * Close action modal
   */
  closeActionModal(): void {
    this.showActionModal = false;
    this.selectedDeferment = null;
    this.actionType = null;
    this.actionApprovedBy = '';
    this.actionComments = '';
  }

  /**
   * Approve deferment request
   */
  approveDeferment(): void {
    if (!this.selectedDeferment || !this.actionApprovedBy.trim()) {
      this.toast.warning('Please enter approval information');
      return;
    }

    this.modalLoading = true;

    this.defermentService.approveDefermentRequest(
      this.selectedDeferment.deferment_id,
      this.actionApprovedBy,
      this.actionComments
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Deferment request approved');
          this.closeActionModal();
          this.loadDeferments();
          this.loadStats();
          this.modalLoading = false;
        },
        error: (error) => {
          this.logger.error('Error approving deferment', error);
          this.toast.error('Error approving deferment');
          this.modalLoading = false;
        }
      });
  }

  /**
   * Reject deferment request
   */
  rejectDeferment(): void {
    if (!this.selectedDeferment || !this.actionApprovedBy.trim() || !this.actionComments.trim()) {
      this.toast.warning('Please enter rejection reason');
      return;
    }

    this.modalLoading = true;

    this.defermentService.rejectDefermentRequest(
      this.selectedDeferment.deferment_id,
      this.actionApprovedBy,
      this.actionComments
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Deferment request rejected');
          this.closeActionModal();
          this.loadDeferments();
          this.loadStats();
          this.modalLoading = false;
        },
        error: (error) => {
          this.logger.error('Error rejecting deferment', error);
          this.toast.error('Error rejecting deferment');
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
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Update status counts
   */
  private updateStatusCounts(): void {
    this.statusCounts.all = this.total;
    this.statusCounts.PENDING = this.deferments.filter(d => d.status === 'PENDING').length;
    this.statusCounts.APPROVED = this.deferments.filter(d => d.status === 'APPROVED').length;
    this.statusCounts.REJECTED = this.deferments.filter(d => d.status === 'REJECTED').length;
  }

  /**
   * Previous page
   */
  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadDeferments();
    }
  }

  /**
   * Next page
   */
  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadDeferments();
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
   * Calculate deferment days
   */
  calculateDefermentDays(original: Date, proposed: Date): number {
    const originalDate = new Date(original);
    const proposedDate = new Date(proposed);
    const diffTime = Math.abs(proposedDate.getTime() - originalDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * TrackBy function for deferments list
   */
  trackByDefermentId(index: number, deferment: DefermentRequest): bigint {
    return deferment.deferment_id;
  }
}
