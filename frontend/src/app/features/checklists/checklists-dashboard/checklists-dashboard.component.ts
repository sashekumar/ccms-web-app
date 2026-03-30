/**
 * Checklists Dashboard Component
 * Displays checklists with filtering and pagination
 * Modernized with DataTableComponent
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ChecklistsService } from '../../../core/services/checklists/checklists.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { 
  DataTableComponent,
  DataTableColumn,
  DataTableAction,
  DataTablePagination,
  DataTableFilter,
  DataTableFilterState,
  DataTableRowActionEvent,
  DataTableSort
} from '../../../shared/components/ui/data-table/data-table.component';
import {
  ChecklistRecord,
  ChecklistsStatsResponse
} from '../../../shared/models/checklists/checklists.model';

@Component({
  selector: 'app-checklists-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent
  ],
  templateUrl: './checklists-dashboard.component.html'
})
export class ChecklistsDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  checklists: ChecklistRecord[] = [];
  loading = false;

  // Pagination
  pagination: DataTablePagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  };

  // Filters
  filters: DataTableFilter[] = [];
  currentFilters: DataTableFilterState = {
    page: 1,
    limit: 10
  };

  // DataTable Configuration
  columns: DataTableColumn[] = [];
  rowActions: DataTableAction[] = [];

  // Stats
  stats = {
    total: 0,
    claims: 0,
    today: 0,
    types: [] as Array<{ type: string; count: number }>
  };

  // Detail Panel
  selectedChecklist: ChecklistRecord | null = null;
  showDetailPanel = false;

  constructor(
    private checklistsService: ChecklistsService,
    private toast: ToastService,
    private logger: LoggerService
  ) {
    this.initializeColumns();
    this.initializeFilters();
    this.initializeRowActions();
  }

  ngOnInit(): void {
    this.loadChecklists();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeColumns(): void {
    this.columns = [
      {
        key: 'checklist_id',
        label: 'Checklist ID',
        type: 'text',
        sortable: true
      },
      {
        key: 'claim_id',
        label: 'Claim ID',
        type: 'text',
        sortable: true
      },
      {
        key: 'checklist_type',
        label: 'Type',
        type: 'text',
        sortable: true
      },
      {
        key: 'check_key',
        label: 'Check Key',
        type: 'text',
        sortable: true
      },
      {
        key: 'check_value',
        label: 'Check Value',
        type: 'text',
        sortable: false
      },
      {
        key: 'updated_by',
        label: 'Updated By',
        type: 'text',
        sortable: false
      },
      {
        key: 'updated_at',
        label: 'Updated At',
        type: 'date',
        sortable: true
      }
    ];
  }

  private initializeFilters(): void {
    this.filters = [
      {
        key: 'search',
        label: 'Search',
        type: 'search',
        placeholder: 'Search checklists...',
        inputType: 'string'
      },
      {
        key: 'checklist_type',
        label: 'Type',
        type: 'search',
        placeholder: 'Checklist type...',
        inputType: 'string'
      },
      {
        key: 'check_key',
        label: 'Check Key',
        type: 'search',
        placeholder: 'Check key...',
        inputType: 'string'
      }
    ];
  }

  private initializeRowActions(): void {
    this.rowActions = [
      {
        id: 'view',
        title: 'View Details',
        iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
        color: 'blue',
        permission: 'CHECKLISTS.VIEW'
      }
    ];
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  loadChecklists(): void {
    this.loading = true;

    const filters: any = {};

    // Apply filters
    if (this.currentFilters['search']) {
      filters.search = this.currentFilters['search'];
    }
    if (this.currentFilters['checklist_type']) {
      filters.checklist_type = this.currentFilters['checklist_type'];
    }
    if (this.currentFilters['check_key']) {
      filters.check_key = this.currentFilters['check_key'];
    }

    this.checklistsService.getChecklists(
      filters,
      this.pagination.page,
      this.pagination.limit
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.checklists = response.data || [];
          this.pagination = {
            ...this.pagination,
            total: response.total || 0,
            totalPages: Math.ceil((response.total || 0) / this.pagination.limit)
          };
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error loading checklists', error);
          this.toast.error('Failed to load checklists');
        }
      });
  }

  loadStats(): void {
    this.checklistsService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats = {
            total: data.total_checklists || 0,
            claims: data.total_claims_with_checklists || 0,
            today: data.checklists_today || 0,
            types: data.checklist_types || []
          };
        },
        error: (error) => {
          this.logger.error('Error loading stats', error);
        }
      });
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  onFilterChange(filters: DataTableFilterState): void {
    this.currentFilters = filters;
    this.pagination.page = 1;
    this.loadChecklists();
  }

  onSortChange(event: DataTableSort | null): void {
    this.logger.debug('Sort change', event);
    // Backend sorting can be implemented here if needed
  }

  onRowAction(event: DataTableRowActionEvent): void {
    const { action, row } = event;

    switch (action) {
      case 'view':
        this.viewChecklistDetails(row);
        break;
    }
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  viewChecklistDetails(checklist: ChecklistRecord): void {
    this.selectedChecklist = checklist;
    this.showDetailPanel = true;
    this.toast.info(`Viewing checklist ${checklist.checklist_id}`);
  }

  closeDetailPanel(): void {
    this.showDetailPanel = false;
    this.selectedChecklist = null;
  }
}
