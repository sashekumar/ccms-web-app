import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { BankService } from '../../../core/services/bank.service';
import { Bank, BankFilters, CreateBankDto, UpdateBankDto } from '../../../shared/models/bank.model';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent, DataTableColumn, DataTableAction, DataTableFilter, DataTablePagination, DataTableFilterState, DataTableRowActionEvent } from '../../../shared/components/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { TextInputComponent } from '../../../shared/components/ui/text-input/text-input.component';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-bank-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ConfirmDialogComponent, TextInputComponent, CheckboxComponent, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Bank Management</h1>
          <p class="mt-1 text-sm text-gray-600">Manage bank master data</p>
        </div>
        <app-button variant="primary" (click)="openCreateModal()">
          <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Bank
        </app-button>
      </div>

      <!-- DataTable -->
      <app-data-table
        [rows]="banks"
        [columns]="columns"
        [filters]="tableFilters"
        [rowActions]="rowActions"
        [pagination]="pagination"
        [loading]="loading"
        (filterChange)="onFilterChange($event)"
        (rowAction)="onRowAction($event)"
        (cellToggle)="onToggleStatus($event)"
        emptyMessage="No banks found"
        emptyDescription="Try adjusting your search or filter criteria."
      ></app-data-table>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4" (click)="closeModal()">
      <div class="w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl" (click)="$event.stopPropagation()">
        <div class="flex-shrink-0 border-b border-gray-200 px-6 py-4">
          <h3 class="text-lg font-semibold leading-6 text-gray-900">{{ editingBank ? 'Edit Bank' : 'Create Bank' }}</h3>
        </div>
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div class="space-y-4">
            <app-text-input
              [(ngModel)]="formData.bank_code"
              label="Bank Code"
              placeholder="e.g., BDO001"
              [required]="true"
              [disabled]="!!editingBank"
              inputType="string"
            ></app-text-input>
            <app-text-input
              [(ngModel)]="formData.bank_name"
              label="Bank Name"
              placeholder="e.g., Banco de Oro"
              [required]="true"
              inputType="string"
            ></app-text-input>
            <app-checkbox
              [(ngModel)]="formData.is_active"
              label="Active"
              labelSize="sm"
            ></app-checkbox>
          </div>
        </div>
        <div class="flex-shrink-0 border-t border-gray-200 px-6 py-4">
          <div class="flex gap-3">
            <app-button
              type="button"
              variant="outline"
              (click)="closeModal()"
              [disabled]="saving"
            >Cancel</app-button>
            <app-button
              type="button"
              variant="primary"
              (click)="save()"
              [disabled]="saving"
              [loading]="saving"
            >{{ saving ? 'Saving...' : 'Save' }}</app-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle Status Confirmation Dialog -->
    <app-confirm-dialog
      *ngIf="showToggleConfirm"
      [isOpen]="showToggleConfirm"
      title="Confirm Status Change"
      [message]="'Are you sure you want to ' + (pendingToggle?.newValue ? 'activate' : 'deactivate') + ' this bank?'"
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
      [message]="'Are you sure you want to delete the bank ' + (bankToDelete?.bank_name || '') + '? This action cannot be undone.'"
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="danger"
      (confirmed)="performDelete()"
      (cancelled)="cancelDelete()"
    />
  `,
  styles: []
})
export class BankListComponent implements OnInit, OnDestroy {
  banks: Bank[] = [];
  loading = false;
  saving = false;
  showModal = false;
  showDeleteConfirm = false;
  showToggleConfirm = false;
  editingBank: Bank | null = null;
  bankToDelete: Bank | null = null;
  pendingToggle: { bank: Bank; newValue: boolean } | null = null;
  currentFilters: any = {};

  private destroy$ = new Subject<void>();

  // DataTable Configuration
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
      placeholder: 'Search by bank code or name...',
      inputType: 'string'
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { value: '', label: 'All Banks' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    }
  ];

  columns: DataTableColumn[] = [
    {
      key: 'bank_code',
      label: 'Bank Code',
      type: 'text',
      sortable: true
    },
    {
      key: 'bank_name',
      label: 'Bank Name',
      type: 'text',
      sortable: true
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
      title: 'Edit Bank',
      iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'indigo',
      permission: 'BANK_MGMT.UPDATE'
    },
    {
      id: 'delete',
      title: 'Delete Bank',
      iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'red',
      permission: 'BANK_MGMT.DELETE'
    }
  ];

  formData: CreateBankDto | UpdateBankDto = {
    bank_code: '',
    bank_name: '',
    is_active: true
  };

  constructor(
    private bankService: BankService,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadBanks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBanks(): void {
    this.loading = true;
    this.bankService.getBanks({
      ...this.currentFilters,
      page: this.pagination.page,
      limit: this.pagination.limit,
      sort_by: 'bank_id',
      sort_order: 'DESC'
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.banks = result.banks;
          this.pagination = {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
          };
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error loading banks', error);
          this.toast.error('Failed to load banks. Please try again.');
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
    
    // Update pagination from filters
    this.pagination = {
      ...this.pagination,
      page: filters.page,
      limit: filters.limit
    };
    
    // Reload with new filters
    this.loadBanks();
  }

  onToggleStatus(event: { row: any; column: any; newValue: boolean }): void {
    const bank = event.row as Bank;
    const newValue = event.newValue;
    this.pendingToggle = { bank, newValue };
    this.showToggleConfirm = true;
  }

  confirmToggleStatus(): void {
    if (!this.pendingToggle) return;
    const { bank, newValue } = this.pendingToggle;
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    
    this.logger.debug(`Toggling bank ${bank.bank_id} status to: ${newValue}`);
    
    this.bankService.updateBank(bank.bank_id, { is_active: newValue })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          bank.is_active = newValue;
          const label = newValue ? 'activated' : 'deactivated';
          this.toast.success(`Bank "${bank.bank_name}" has been ${label} successfully.`);
          this.logger.info(`Bank ${bank.bank_id} status updated to: ${newValue}`);
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error updating bank status:', error);
          this.toast.error('Failed to update bank status. Please try again.');
          this.loadBanks();
        }
      });
  }

  cancelToggleStatus(): void {
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    this.loadBanks();
  }

  onRowAction(event: DataTableRowActionEvent): void {
    const bank = event.row as Bank;
    switch (event.action) {
      case 'edit':
        this.editBank(bank);
        break;
      case 'delete':
        this.confirmDelete(bank);
        break;
    }
  }

  confirmDelete(bank: Bank): void {
    this.bankToDelete = bank;
    this.showDeleteConfirm = true;
  }

  performDelete(): void {
    if (!this.bankToDelete) return;
    
    this.bankService.deleteBank(this.bankToDelete.bank_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`Bank "${this.bankToDelete!.bank_name}" deleted successfully`);
          this.showDeleteConfirm = false;
          this.bankToDelete = null;
          this.loadBanks();
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error deleting bank', error);
          this.toast.error(error.error?.message || 'Failed to delete bank');
        }
      });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.bankToDelete = null;
  }

  openCreateModal(): void {
    this.editingBank = null;
    this.formData = {
      bank_code: '',
      bank_name: '',
      is_active: true
    };
    this.showModal = true;
  }

  editBank(bank: Bank): void {
    this.editingBank = bank;
    this.formData = {
      bank_code: bank.bank_code,
      bank_name: bank.bank_name,
      is_active: bank.is_active
    };
    this.showModal = true;
  }

  closeModal(): void {
    if (!this.saving) {
      this.showModal = false;
      this.editingBank = null;
      this.formData = {
        bank_code: '',
        bank_name: '',
        is_active: true
      };
    }
  }

  save(): void {
    if (!this.formData.bank_code || !this.formData.bank_name) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    this.saving = true;

    if (this.editingBank) {
      this.bankService.updateBank(this.editingBank.bank_id, this.formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.saving = false;
            this.closeModal();
            this.loadBanks();
            this.toast.success('Bank updated successfully');
          },
          error: (error: HttpErrorResponse) => {
            this.logger.error('Error updating bank', error);
            this.saving = false;
            this.toast.error(error.error?.message || 'Failed to update bank');
          }
        });
    } else {
      this.bankService.createBank(this.formData as CreateBankDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.saving = false;
            this.closeModal();
            this.loadBanks();
            this.toast.success('Bank created successfully');
          },
          error: (error: HttpErrorResponse) => {
            this.logger.error('Error creating bank', error);
            this.saving = false;
            this.toast.error(error.error?.message || 'Failed to create bank');
          }
        });
    }
  }
}
