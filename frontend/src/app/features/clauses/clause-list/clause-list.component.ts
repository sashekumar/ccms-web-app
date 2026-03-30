import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ClauseService } from '../../../core/services/clause.service';
import { Clause, ClauseFilters, CreateClauseDto, UpdateClauseDto } from '../../../shared/models/clause.model';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent, DataTableColumn, DataTableAction, DataTableFilter, DataTablePagination, DataTableFilterState, DataTableRowActionEvent } from '../../../shared/components/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { TextInputComponent } from '../../../shared/components/ui/text-input/text-input.component';
import { TextAreaComponent } from '../../../shared/components/ui/text-area/text-area.component';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-clause-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ConfirmDialogComponent, TextInputComponent, TextAreaComponent, CheckboxComponent, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Clause Management</h1>
          <p class="mt-1 text-sm text-gray-600">Manage clause master data</p>
        </div>
        <app-button variant="primary" (click)="openCreateModal()">
          <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Clause
        </app-button>
      </div>

      <!-- DataTable -->
      <app-data-table
        [rows]="clauses"
        [columns]="columns"
        [filters]="tableFilters"
        [rowActions]="rowActions"
        [pagination]="pagination"
        [loading]="loading"
        (filterChange)="onFilterChange($event)"
        (rowAction)="onRowAction($event)"
        (cellToggle)="onToggleStatus($event)"
        emptyMessage="No clauses found"
        emptyDescription="Try adjusting your search or filter criteria."
      ></app-data-table>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4" (click)="closeModal()">
      <div class="w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl" (click)="$event.stopPropagation()">
        <div class="flex-shrink-0 border-b border-gray-200 px-6 py-4">
          <h3 class="text-lg font-semibold leading-6 text-gray-900">{{ editingClause ? 'Edit Clause' : 'Create Clause' }}</h3>
        </div>
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div class="space-y-4">
            <app-text-input
              [(ngModel)]="formData.clause_code"
              label="Clause Code"
              placeholder="e.g., CLS001"
              [required]="true"
              [disabled]="!!editingClause"
              inputType="string"
            ></app-text-input>
            <app-text-area
              [(ngModel)]="formData.clause_text"
              label="Clause Text"
              placeholder="Enter clause text"
              [required]="true"
              [rows]="3"
            ></app-text-area>
            <app-checkbox
              [(ngModel)]="formData.is_active"
              label="Active"
              labelSize="sm"
            ></app-checkbox>
          </div>
        </div>
        <div class="flex-shrink-0 border-t border-gray-200 px-6 py-4">
          <div class="flex gap-3">
            <app-button type="button" variant="outline" (click)="closeModal()" [disabled]="saving">Cancel</app-button>
            <app-button type="button" variant="primary" (click)="save()" [disabled]="saving" [loading]="saving">{{ saving ? 'Saving...' : 'Save' }}</app-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle Status Confirmation Dialog -->
    <app-confirm-dialog
      *ngIf="showToggleConfirm"
      [isOpen]="showToggleConfirm"
      title="Confirm Status Change"
      [message]="'Are you sure you want to ' + (pendingToggle?.newValue ? 'activate' : 'deactivate') + ' this clause?'"
      confirmLabel="Yes, proceed"
      cancelLabel="Cancel"
      variant="warn"
      (confirmed)="confirmToggleStatus()"
      (cancelled)="cancelToggleStatus()"
    />

    <!-- Delete Confirmation Dialog -->
    <app-confirm-dialog
      *ngIf="showDeleteConfirm"
      [isOpen]="showDeleteConfirm"
      title="Confirm Delete"
      [message]="'Are you sure you want to delete the clause ' + (clauseToDelete?.clause_code || '') + '? This action cannot be undone.'"
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="danger"
      (confirmed)="performDelete()"
      (cancelled)="cancelDelete()"
    />
  `,
  styles: []
})
export class ClauseListComponent implements OnInit, OnDestroy {
  clauses: Clause[] = [];
  loading = false;
  saving = false;
  showModal = false;
  showDeleteConfirm = false;
  showToggleConfirm = false;
  editingClause: Clause | null = null;
  clauseToDelete: Clause | null = null;
  pendingToggle: { clause: Clause; newValue: boolean } | null = null;
  currentFilters: any = {};

  private destroy$ = new Subject<void>();

  pagination: DataTablePagination = {
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 0
  };

  tableFilters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by clause code or description...',
      inputType: 'string'
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { value: '', label: 'All Clauses' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    }
  ];

  columns: DataTableColumn[] = [
    {
      key: 'clause_code',
      label: 'Clause Code',
      type: 'text',
      sortable: true
    },
    {
      key: 'clause_text',
      label: 'Description',
      type: 'text',
      sortable: false
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'toggle',
      sortable: true
    }
  ];

  rowActions: DataTableAction[] = [
    {
      id: 'edit',
      title: 'Edit Clause',
      iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'indigo',
      permission: 'CLAUSE_MGMT.UPDATE'
    },
    {
      id: 'delete',
      title: 'Delete Clause',
      iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'red',
      permission: 'CLAUSE_MGMT.DELETE'
    }
  ];

  formData: CreateClauseDto | UpdateClauseDto = {
    clause_code: '',
    clause_text: '',
    is_active: true
  };

  constructor(
    private clauseService: ClauseService,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadClauses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadClauses(): void {
    this.loading = true;
    this.clauseService.getClauses({
      ...this.currentFilters,
      page: this.pagination.page,
      limit: this.pagination.limit,
      sort_by: 'clause_id',
      sort_order: 'DESC'
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.clauses = result.clauses;
          this.pagination = {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
          };
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error loading clauses', error);
          this.toast.error('Failed to load clauses. Please try again.');
          this.loading = false;
        }
      });
  }

  onFilterChange(filters: DataTableFilterState): void {
    this.logger.debug('Filter changed:', filters);
    
    // Store all filter values
    this.currentFilters = {
      search: filters['search'] || undefined,
      is_active: filters['is_active'] === 'true' ? true : filters['is_active'] === 'false' ? false : undefined
    };
    
    this.pagination = {
      ...this.pagination,
      page: filters.page,
      limit: filters.limit
    };
    this.loadClauses();
  }

  onToggleStatus(event: { row: any; column: any; newValue: boolean }): void {
    const clause = event.row as Clause;
    const newValue = event.newValue;
    this.pendingToggle = { clause, newValue };
    this.showToggleConfirm = true;
  }

  confirmToggleStatus(): void {
    if (!this.pendingToggle) return;
    const { clause, newValue } = this.pendingToggle;
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    
    this.clauseService.updateClause(clause.clause_id, { is_active: newValue })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          clause.is_active = newValue;
          const label = newValue ? 'activated' : 'deactivated';
          this.toast.success(`Clause "${clause.clause_code}" has been ${label} successfully.`);
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error updating clause status:', error);
          this.toast.error('Failed to update clause status. Please try again.');
          this.loadClauses();
        }
      });
  }

  cancelToggleStatus(): void {
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    this.loadClauses();
  }

  onRowAction(event: DataTableRowActionEvent): void {
    const clause = event.row as Clause;
    switch (event.action) {
      case 'edit':
        this.editClause(clause);
        break;
      case 'delete':
        this.confirmDelete(clause);
        break;
    }
  }

  confirmDelete(clause: Clause): void {
    this.clauseToDelete = clause;
    this.showDeleteConfirm = true;
  }

  performDelete(): void {
    if (!this.clauseToDelete) return;
    
    this.clauseService.deleteClause(this.clauseToDelete.clause_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`Clause "${this.clauseToDelete!.clause_code}" deleted successfully`);
          this.showDeleteConfirm = false;
          this.clauseToDelete = null;
          this.loadClauses();
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error deleting clause', error);
          this.toast.error(error.error?.message || 'Failed to delete clause');
        }
      });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.clauseToDelete = null;
  }

  openCreateModal(): void {
    this.editingClause = null;
    this.formData = {
      clause_code: '',
      clause_text: '',
      is_active: true
    };
    this.showModal = true;
  }

  editClause(clause: Clause): void {
    this.editingClause = clause;
    this.formData = {
      clause_code: clause.clause_code,
      clause_text: clause.clause_text,
      is_active: clause.is_active
    };
    this.showModal = true;
  }

  closeModal(): void {
    if (!this.saving) {
      this.showModal = false;
      this.editingClause = null;
      this.formData = {
        clause_code: '',
        clause_text: '',
        is_active: true
      };
    }
  }

  save(): void {
    if (!this.formData.clause_code || !this.formData.clause_text) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    this.saving = true;

    if (this.editingClause) {
      this.clauseService.updateClause(this.editingClause.clause_id, this.formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.saving = false;
            this.closeModal();
            this.loadClauses();
            this.toast.success('Clause updated successfully');
          },
          error: (error: HttpErrorResponse) => {
            this.logger.error('Error updating clause', error);
            this.saving = false;
            this.toast.error(error.error?.message || 'Failed to update clause');
          }
        });
    } else {
      this.clauseService.createClause(this.formData as CreateClauseDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.saving = false;
            this.closeModal();
            this.loadClauses();
            this.toast.success('Clause created successfully');
          },
          error: (error: HttpErrorResponse) => {
            this.logger.error('Error creating clause', error);
            this.saving = false;
            this.toast.error(error.error?.message || 'Failed to create clause');
          }
        });
    }
  }
}
