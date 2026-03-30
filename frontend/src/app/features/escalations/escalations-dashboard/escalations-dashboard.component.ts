import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { EscalationService } from '../../../core/services/escalations/escalation.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { EscalationResponse, UpdateEscalationDto } from '../../../shared/models/escalation.model';

/**
 * Escalations Dashboard Component
 * Displays and manages escalations with assignment and status tracking
 */
@Component({
  selector: 'app-escalations-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, FormsModule],
  templateUrl: './escalations-dashboard.component.html'
})
export class EscalationsDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Expose Math to template
  Math = Math;

  // Escalations list
  escalations: EscalationResponse[] = [];
  loading = false;
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;

  // Tab and filtering
  activeStatusTab: 'all' | 'UNASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED' = 'UNASSIGNED';
  activePriorityFilter: 'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'all';
  searchTerm = '';

  // Selected escalation for details view
  selectedEscalation: EscalationResponse | null = null;
  selectedEscalationUpdates: any[] = [];
  loadingUpdates = false;

  // Assignment modal
  showAssignModal = false;
  assignEscalationId: number | null = null;
  assigneeId: number | null = null;
  assignRemarks = '';
  assigning = false;

  // Update modal
  showUpdateModal = false;
  updateEscalationId: number | null = null;
  updateText = '';
  updateType: 'INTERNAL_NOTE' | 'STATUS_CHANGE' | 'ACTION_TAKEN' = 'INTERNAL_NOTE';
  addingUpdate = false;

  // Close modal
  showCloseModal = false;
  closeEscalationId: number | null = null;
  closeRemarks = '';
  closing = false;

  // Reference data
  priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  statusOptions = ['UNASSIGNED', 'ASSIGNED', 'RESOLVED', 'CLOSED'];

  constructor(
    private escalationService: EscalationService,
    private toast: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadEscalations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load escalations with current filters
   */
  loadEscalations(): void {
    this.loading = true;

    const filters: any = {
      status: this.activeStatusTab !== 'all' ? this.activeStatusTab : undefined,
      priority: this.activePriorityFilter !== 'all' ? this.activePriorityFilter : undefined
    };

    this.escalationService.getEscalations(this.page, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.escalations = data.data;
          this.total = data.total;
          this.totalPages = data.totalPages;
          this.loading = false;
          this.logger.info('Escalations loaded successfully');
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error loading escalations:', error);
          this.toast.error('Failed to load escalations');
        }
      });
  }

  /**
   * Apply filters and reload
   */
  applyFilters(): void {
    this.page = 1;
    this.loadEscalations();
  }

  /**
   * Switch status filter tab
   */
  switchStatusTab(status: 'all' | 'UNASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED'): void {
    this.activeStatusTab = status;
    this.page = 1;
    this.loadEscalations();
  }

  /**
   * Switch priority filter
   */
  switchPriorityFilter(priority: 'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): void {
    this.activePriorityFilter = priority;
    this.page = 1;
    this.loadEscalations();
  }

  /**
   * Get filtered escalations for display
   */
  getFilteredEscalations(): EscalationResponse[] {
    return this.escalations.filter(e => {
      // Filter by search term
      if (this.searchTerm.trim()) {
        const term = this.searchTerm.toLowerCase();
        return (
          e.source_name?.toLowerCase().includes(term) ||
          e.nature_name?.toLowerCase().includes(term) ||
          e.remarks?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }

  /**
   * Get priority color badge
   */
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get status color badge
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'UNASSIGNED':
        return 'bg-red-100 text-red-800';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-amber-100 text-amber-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get count of escalations by status (for tab badges)
   */
  getEscalationCountByStatus(status: string): number {
    if (status === 'all') return this.total;
    return this.escalations.filter(e => e.status === status).length;
  }

  /**
   * Get count of escalations by priority
   */
  getEscalationCountByPriority(priority: string): number {
    if (priority === 'all') return this.total;
    return this.escalations.filter(e => e.priority === priority).length;
  }

  /**
   * View escalation details
   */
  viewDetails(escalation: EscalationResponse): void {
    this.selectedEscalation = escalation;
    this.loadEscalationUpdates(escalation.id);
  }

  /**
   * Load escalation updates
   */
  loadEscalationUpdates(escalationId: number): void {
    this.loadingUpdates = true;

    this.escalationService.getEscalationUpdates(escalationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updates) => {
          this.selectedEscalationUpdates = updates;
          this.loadingUpdates = false;
        },
        error: (error) => {
          this.loadingUpdates = false;
          this.logger.error('Error loading escalation updates:', error);
          this.toast.error('Failed to load escalation updates');
        }
      });
  }

  /**
   * Close details view
   */
  closeDetails(): void {
    this.selectedEscalation = null;
    this.selectedEscalationUpdates = [];
  }

  /**
   * Open assign modal
   */
  openAssignModal(escalation: EscalationResponse): void {
    if (escalation.status === 'CLOSED') {
      this.toast.warning('Cannot assign closed escalation');
      return;
    }
    this.assignEscalationId = escalation.id;
    this.assigneeId = escalation.assigned_to || null;
    this.assignRemarks = '';
    this.showAssignModal = true;
  }

  /**
   * Assign escalation
   */
  assignEscalation(): void {
    if (!this.assignEscalationId || !this.assigneeId) {
      this.toast.warning('Please select an assignee');
      return;
    }

    this.assigning = true;

    this.escalationService.assignEscalation(this.assignEscalationId, this.assigneeId, this.assignRemarks)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.assigning = false;
          this.showAssignModal = false;
          this.toast.success('Escalation assigned successfully');
          this.loadEscalations();
          if (this.selectedEscalation?.id === this.assignEscalationId) {
            this.selectedEscalation = updated;
          }
        },
        error: (error) => {
          this.assigning = false;
          this.logger.error('Error assigning escalation:', error);
          this.toast.error('Failed to assign escalation');
        }
      });
  }

  /**
   * Open update modal
   */
  openUpdateModal(escalation: EscalationResponse): void {
    if (escalation.status === 'CLOSED') {
      this.toast.warning('Cannot update closed escalation');
      return;
    }
    this.updateEscalationId = escalation.id;
    this.updateText = '';
    this.updateType = 'INTERNAL_NOTE';
    this.showUpdateModal = true;
  }

  /**
   * Add escalation update
   */
  addUpdate(): void {
    if (!this.updateEscalationId || !this.updateText.trim()) {
      this.toast.warning('Please enter an update');
      return;
    }

    this.addingUpdate = true;

    const updateDto = {
      update_text: this.updateText,
      escalation_type: this.updateType
    };

    this.escalationService.addEscalationUpdate(this.updateEscalationId, updateDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.addingUpdate = false;
          this.showUpdateModal = false;
          this.toast.success('Update added successfully');
          if (this.selectedEscalation?.id === this.updateEscalationId) {
            this.loadEscalationUpdates(this.updateEscalationId);
          }
        },
        error: (error) => {
          this.addingUpdate = false;
          this.logger.error('Error adding update:', error);
          this.toast.error('Failed to add update');
        }
      });
  }

  /**
   * Open close modal
   */
  openCloseModal(escalation: EscalationResponse): void {
    if (escalation.status === 'CLOSED') {
      this.toast.warning('Escalation is already closed');
      return;
    }
    this.closeEscalationId = escalation.id;
    this.closeRemarks = '';
    this.showCloseModal = true;
  }

  /**
   * Close escalation
   */
  closeEscalation(): void {
    if (!this.closeEscalationId || !this.closeRemarks.trim()) {
      this.toast.warning('Please enter closure remarks');
      return;
    }

    this.closing = true;

    const closeDto = {
      remarks: this.closeRemarks
    };

    this.escalationService.closeEscalation(this.closeEscalationId, closeDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (closed) => {
          this.closing = false;
          this.showCloseModal = false;
          this.toast.success('Escalation closed successfully');
          this.loadEscalations();
          if (this.selectedEscalation?.id === this.closeEscalationId) {
            this.closeDetails();
          }
        },
        error: (error) => {
          this.closing = false;
          this.logger.error('Error closing escalation:', error);
          this.toast.error('Failed to close escalation');
        }
      });
  }

  /**
   * Change priority
   */
  changePriority(escalation: EscalationResponse, newPriority: string): void {
    if (escalation.status === 'CLOSED') {
      this.toast.warning('Cannot change priority of closed escalation');
      return;
    }

    const updateDto: UpdateEscalationDto = {
      priority: newPriority as any
    };

    this.escalationService.updateEscalation(escalation.id, updateDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.toast.success('Priority updated successfully');
          this.loadEscalations();
          if (this.selectedEscalation?.id === escalation.id) {
            this.selectedEscalation = updated;
          }
        },
        error: (error) => {
          this.logger.error('Error updating priority:', error);
          this.toast.error('Failed to update priority');
        }
      });
  }

  /**
   * Pagination next page
   */
  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadEscalations();
    }
  }

  /**
   * Pagination previous page
   */
  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadEscalations();
    }
  }

  /**
   * Handle priority change from select dropdown
   */
  onPriorityChange(event: Event): void {
    if (!this.selectedEscalation) return;
    const target = event.target as HTMLSelectElement;
    const newPriority = target.value;
    this.changePriority(this.selectedEscalation, newPriority);
  }

  /**
   * Format date for display
   */
  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  }
}
