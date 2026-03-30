import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InvestigationService } from '../../../core/services/investigations/investigation.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { InvestigationResponse, InvestigationFilters } from '../../../shared/models/investigation.model';

/**
 * Investigation Dashboard Component
 * Displays investigation cases with filtering, pagination, and status tracking
 * Manages investigation lifecycle: OPEN → IN_PROGRESS → UNDER_REVIEW → COMPLETED → CLOSED
 */
@Component({
  selector: 'app-investigations-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, FormsModule],
  templateUrl: './investigations-dashboard.component.html'
})
export class InvestigationsDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  Math = Math; // Make Math available in template

  // Investigations data
  investigations: InvestigationResponse[] = [];
  loadingInvestigations = false;
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  // Status filtering
  activeStatusTab: 'all' | 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CLOSED' = 'all';
  statusCounts = {
    all: 0,
    OPEN: 0,
    IN_PROGRESS: 0,
    UNDER_REVIEW: 0,
    COMPLETED: 0,
    CLOSED: 0
  };

  // Search & Filters
  searchTerm = '';
  claimIdFilter = '';
  clinicIdFilter = '';
  priorityFilter: 'all' | 'PRIORITY' | 'NORMAL' = 'all';
  sortBy = 'created_at';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  // Expanded rows
  expandedInvestigationIds: Set<number> = new Set();

  // Action modals
  showActionModal = false;
  selectedInvestigation: InvestigationResponse | null = null;
  actionType: 'UPDATE_STATUS' | 'ADD_REQUEST' | 'ADD_CALL' | null = null;
  
  // Modal data
  newStatus: string = '';
  findings: string = '';
  requestType: string = '';
  requestedFrom: string = '';
  expectedDate: string = '';
  requestDescription: string = '';
  
  callDate: string = new Date().toISOString().split('T')[0];
  calledParty: string = '';
  callDuration: number = 0;
  callNotes: string = '';
  
  modalLoading = false;

  constructor(
    private investigationService: InvestigationService,
    private router: Router,
    private toast: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadInvestigations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load investigations with current filters
   */
  loadInvestigations(): void {
    this.loadingInvestigations = true;

    const filters: InvestigationFilters = {
      page: this.page,
      limit: this.limit,
      status: this.activeStatusTab !== 'all' ? this.activeStatusTab : undefined,
      searchTerm: this.searchTerm || undefined,
      claim_id: this.claimIdFilter ? Number(this.claimIdFilter) : undefined,
      clinic_id: this.clinicIdFilter ? Number(this.clinicIdFilter) : undefined,
      sortBy: this.sortBy as 'created_at' | 'status' | 'expected_date',
      sortOrder: this.sortOrder
    };

    this.investigationService
      .getInvestigations(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.investigations = data.investigations;
          this.total = data.total;
          this.totalPages = Math.ceil(this.total / this.limit);
          this.loadingInvestigations = false;
          this.logger.info(`Loaded ${this.investigations.length} investigations`);
          
          // Load statistics for status counts
          this.loadStatistics();
        },
        error: (error) => {
          this.loadingInvestigations = false;
          this.logger.error('Error loading investigations:', error);
          this.toast.error('Failed to load investigations');
        }
      });
  }

  /**
   * Load investigation statistics for status counts
   */
  loadStatistics(): void {
    this.investigationService
      .getInvestigationStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.statusCounts = {
            all: stats.total,
            OPEN: stats.open_count || 0,
            IN_PROGRESS: stats.in_progress_count || 0,
            UNDER_REVIEW: stats.under_review_count || 0,
            COMPLETED: stats.completed_count || 0,
            CLOSED: 0
          };
          this.logger.info('Investigation statistics loaded');
        },
        error: (error) => {
          this.logger.warn('Error loading statistics:', error);
        }
      });
  }

  /**
   * Switch status tab
   */
  switchStatusTab(status: 'all' | 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CLOSED'): void {
    this.activeStatusTab = status;
    this.page = 1;
    this.loadInvestigations();
  }

  /**
   * Apply search and filters
   */
  applyFilters(): void {
    this.page = 1;
    this.loadInvestigations();
  }

  /**
   * Clear filters
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.claimIdFilter = '';
    this.clinicIdFilter = '';
    this.priorityFilter = 'all';
    this.activeStatusTab = 'all';
    this.sortBy = 'created_at';
    this.sortOrder = 'DESC';
    this.page = 1;
    this.loadInvestigations();
  }

  /**
   * Pagination: Go to next page
   */
  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadInvestigations();
    }
  }

  /**
   * Pagination: Go to previous page
   */
  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadInvestigations();
    }
  }

  /**
   * Toggle row expansion
   */
  toggleExpanded(ixId: number): void {
    if (this.expandedInvestigationIds.has(ixId)) {
      this.expandedInvestigationIds.delete(ixId);
    } else {
      this.expandedInvestigationIds.add(ixId);
    }
  }

  /**
   * Check if row is expanded
   */
  isExpanded(ixId: number): boolean {
    return this.expandedInvestigationIds.has(ixId);
  }

  /**
   * View investigation details
   */
  viewInvestigationDetails(ixId: number): void {
    this.router.navigate(['/investigations', ixId]);
  }

  /**
   * Open action modal
   */
  openActionModal(investigation: InvestigationResponse, action: 'UPDATE_STATUS' | 'ADD_REQUEST' | 'ADD_CALL'): void {
    this.selectedInvestigation = investigation;
    this.actionType = action;
    this.showActionModal = true;
    
    // Reset modal data
    this.newStatus = investigation.status;
    this.findings = investigation.findings || '';
    this.requestType = '';
    this.requestedFrom = '';
    this.expectedDate = '';
    this.requestDescription = '';
    this.callDate = new Date().toISOString().split('T')[0];
    this.calledParty = '';
    this.callDuration = 0;
    this.callNotes = '';
  }

  /**
   * Close action modal
   */
  closeActionModal(): void {
    this.showActionModal = false;
    this.selectedInvestigation = null;
    this.actionType = null;
  }

  /**
   * Save investigation update
   */
  saveInvestigationUpdate(): void {
    if (!this.selectedInvestigation) return;

    this.modalLoading = true;
    const updates = {
      status: this.newStatus as 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CLOSED',
      findings: this.findings
    };

    this.investigationService
      .updateInvestigation(this.selectedInvestigation.ix_id, updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.modalLoading = false;
          this.toast.success('Investigation updated successfully');
          this.closeActionModal();
          this.loadInvestigations();
        },
        error: (error: any) => {
          this.modalLoading = false;
          this.logger.error('Error updating investigation:', error);
          this.toast.error('Failed to update investigation');
        }
      });
  }

  /**
   * Add investigation request
   */
  addInvestigationRequest(): void {
    if (!this.selectedInvestigation || !this.requestType || !this.requestedFrom) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    this.modalLoading = true;
    const request = {
      ix_id: this.selectedInvestigation.ix_id,
      request_type: this.requestType as 'MEDICAL_RECORDS' | 'DISCHARGE_SUMMARY' | 'INVESTIGATION_REPORT' | 'SUPPORTING_DOCUMENTS' | 'CONSULTATION_NOTES' | 'FINANCIAL_DOCUMENTS',
      requested_from: this.requestedFrom,
      expected_date: this.expectedDate || new Date().toISOString().split('T')[0],
      description: this.requestDescription
    };

    this.investigationService
      .addInvestigationRequest(this.selectedInvestigation.ix_id, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.modalLoading = false;
          this.toast.success('Investigation request added successfully');
          this.closeActionModal();
          this.loadInvestigations();
        },
        error: (error: any) => {
          this.modalLoading = false;
          this.logger.error('Error adding investigation request:', error);
          this.toast.error('Failed to add investigation request');
        }
      });
  }

  /**
   * Add call log entry
   */
  addCallLog(): void {
    if (!this.selectedInvestigation || !this.calledParty) {
      this.toast.error('Please enter called party name');
      return;
    }

    this.modalLoading = true;
    const callLog = {
      ix_id: this.selectedInvestigation.ix_id,
      call_date: this.callDate,
      called_party: this.calledParty,
      call_duration: this.callDuration,
      call_notes: this.callNotes
    };

    this.investigationService
      .addCallLog(this.selectedInvestigation.ix_id, callLog)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.modalLoading = false;
          this.toast.success('Call log added successfully');
          this.closeActionModal();
          this.loadInvestigations();
        },
        error: (error: any) => {
          this.modalLoading = false;
          this.logger.error('Error adding call log:', error);
          this.toast.error('Failed to add call log');
        }
      });
  }

  /**
   * Get status badge color
   */
  getStatusBadgeColor(status: string): string {
    const colors: Record<string, string> = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      UNDER_REVIEW: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get priority badge class
   */
  getPriorityBadgeClass(isPriority: boolean): string {
    return isPriority ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
  }
}
