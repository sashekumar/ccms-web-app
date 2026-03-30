import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { LookupService } from '../../../core/services/lookup.service';
import { Lookup, LookupFilters, CreateLookupDto, UpdateLookupDto, LookupCategory, LookupMetadata, CreateLookupMetadataDto, UpdateLookupMetadataDto } from '../../../shared/models/lookup.model';
import { DataTableComponent, DataTableColumn, DataTableAction, DataTableFilter, DataTablePagination, DataTableFilterState, DataTableRowActionEvent } from '../../../shared/components/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { TextInputComponent } from '../../../shared/components/ui/text-input/text-input.component';
import { TextAreaComponent } from '../../../shared/components/ui/text-area/text-area.component';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/ui/dropdown/dropdown.component';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-lookup-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ConfirmDialogComponent, TextInputComponent, TextAreaComponent, CheckboxComponent, ButtonComponent, DropdownComponent, LoadingSpinnerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Lookup Values</h1>
          <p class="mt-1 text-sm text-gray-600">Manage lookup value master data</p>
        </div>
        <app-button variant="primary" (click)="openCreateModal()">
          <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Lookup
        </app-button>
      </div>

      <!-- Data Table -->
      <app-data-table
        [rows]="lookups"
        [columns]="columns"
        [filters]="tableFilters"
        [rowActions]="rowActions"
        [pagination]="pagination"
        [loading]="loading"
        (filterChange)="onFilterChange($event)"
        (cellToggle)="onToggleStatus($event)"
        (rowAction)="onRowAction($event)"
      ></app-data-table>
    </div>

    <!-- Toggle Status Confirmation Dialog -->
    <app-confirm-dialog
      *ngIf="showToggleConfirm"
      [isOpen]="showToggleConfirm"
      title="Confirm Status Change"
      [message]="'Are you sure you want to ' + (pendingToggle?.newValue ? 'activate' : 'deactivate') + ' ' + (pendingToggle?.lookup?.lookup_value || 'this lookup') + '?'"
      confirmLabel="Yes, Change Status"
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
      [message]="'Are you sure you want to delete ' + (lookupToDelete?.lookup_value || 'this lookup') + '? This action cannot be undone.'"
      confirmLabel="Yes, Delete"
      cancelLabel="Cancel"
      variant="danger"
      (confirmed)="performDelete()"
      (cancelled)="cancelDelete()"
    />

    <!-- Delete Metadata Confirmation Dialog -->
    <app-confirm-dialog
      *ngIf="showDeleteMetadataConfirm"
      [isOpen]="showDeleteMetadataConfirm"
      title="Confirm Delete"
      [message]="'Are you sure you want to delete metadata ' + (metadataToDelete?.metadata_key || 'this metadata') + '? This action cannot be undone.'"
      confirmLabel="Yes, Delete"
      cancelLabel="Cancel"
      variant="danger"
      (confirmed)="performDeleteMetadata()"
      (cancelled)="cancelDeleteMetadata()"
    />

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4" (click)="closeModal()">
      <div class="mx-auto w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl" (click)="$event.stopPropagation()">
        <!-- Modal Header (Fixed) -->
        <div class="flex-shrink-0 border-b border-gray-200 px-6 py-4">
          <h3 class="text-lg font-semibold leading-6 text-gray-900">{{ editingLookup ? 'Edit Lookup' : 'Create Lookup' }}</h3>
        </div>
        
        <!-- Modal Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div class="space-y-4">
            <!-- Category Selection (only for create) -->
            <div *ngIf="!editingLookup">
              <app-dropdown
                [(ngModel)]="selectedCategoryMode"
                (ngModelChange)="onCategoryModeChange()"
                [options]="categoryOptions"
                label="Category"
                placeholder="Select category..."
                [required]="true"
              ></app-dropdown>
            </div>

            <!-- New Category Fields -->
            <div *ngIf="!editingLookup && selectedCategoryMode === 'new'" class="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <app-text-input
                [(ngModel)]="formData.new_category_name"
                label="New Category Name"
                placeholder="e.g., ADMISSION_TYPES"
                [required]="true"
                inputType="string"
              ></app-text-input>
              
              <app-text-area
                [(ngModel)]="formData.new_category_description"
                label="Category Description"
                placeholder="Enter description"
                [rows]="2"
              ></app-text-area>
            </div>

            <!-- Lookup Code -->
            <app-text-input
              [(ngModel)]="formData.lookup_code"
              label="Lookup Code"
              placeholder="e.g., IP"
              [required]="true"
              [disabled]="!!editingLookup"
              inputType="string"
              maxlength="20"
            ></app-text-input>

            <!-- Lookup Value -->
            <app-text-input
              [(ngModel)]="formData.lookup_value"
              label="Lookup Value"
              placeholder="e.g., In-Patient"
              [required]="true"
              inputType="string"
              maxlength="255"
            ></app-text-input>

            <!-- Sort Order (auto-filled, read-only for create) -->
            <div>
              <app-text-input
                [(ngModel)]="formData.sort_order"
                [label]="'Sort Order' + (!editingLookup ? ' (Auto-calculated)' : '')"
                [placeholder]="!editingLookup ? 'Will be calculated automatically' : ''"
                [disabled]="!editingLookup"
                inputType="number"
              ></app-text-input>
            </div>

            <!-- Active Status -->
            <app-checkbox
              [(ngModel)]="formData.is_active"
              label="Active"
              labelSize="sm"
            ></app-checkbox>
          </div>
        </div>
        
        <!-- Modal Footer (Fixed) -->
        <div class="flex-shrink-0 border-t border-gray-200 px-6 py-4">
          <div class="flex gap-3">
            <app-button
              type="button"
              variant="outline"
              (click)="closeModal()"
              [disabled]="saving"
              class="flex-1"
            >
              Cancel
            </app-button>
            <app-button
              type="button"
              variant="primary"
              (click)="save()"
              [disabled]="saving || !isFormValid()"
              [loading]="saving"
              class="flex-1"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </app-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Metadata Management Modal -->
    <div *ngIf="showMetadataModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4" (click)="closeMetadataModal()">
      <div class="mx-auto w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl" (click)="$event.stopPropagation()">
        <!-- Modal Header (Fixed) -->
        <div class="flex-shrink-0 border-b border-gray-200 px-6 py-4">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold leading-6 text-gray-900">Manage Metadata</h3>
              <p class="mt-1 text-sm text-gray-600">{{ selectedLookupForMetadata?.lookup_value }} ({{ selectedLookupForMetadata?.lookup_code }})</p>
            </div>
            <button (click)="closeMetadataModal()" class="flex-shrink-0 text-gray-400 hover:text-gray-600">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        
        <!-- Modal Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto px-6 py-4">

          <!-- Add Metadata Form -->
          <div class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 class="mb-3 text-sm font-medium text-gray-700">Add New Metadata</h4>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <app-text-input
                [(ngModel)]="metadataFormData.metadata_key"
                label="Key"
                placeholder="e.g., display_color"
                [required]="true"
                inputType="string"
              ></app-text-input>
              
              <app-text-input
                [(ngModel)]="metadataFormData.metadata_value"
                label="Value"
                placeholder="e.g., #2563eb"
                [required]="true"
                inputType="string"
              ></app-text-input>
            </div>
            <div class="mt-3 flex justify-end">
              <app-button
                variant="primary"
                (click)="saveMetadata()"
                [disabled]="savingMetadata || !isMetadataFormValid()"
                [loading]="savingMetadata"
              >
                {{ editingMetadata ? 'Update Metadata' : 'Add Metadata' }}
              </app-button>
            </div>
          </div>

          <!-- Metadata List -->
          <div>
            <app-loading-spinner *ngIf="loadingMetadata" message="Loading metadata..."></app-loading-spinner>

            <div *ngIf="!loadingMetadata && lookupMetadata.length === 0" class="py-8 text-center text-sm text-gray-500">
              No metadata found. Add your first metadata entry above.
            </div>

            <div *ngIf="!loadingMetadata && lookupMetadata.length > 0" class="space-y-2">
              <div *ngFor="let meta of lookupMetadata" class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50">
                <div class="flex-1">
                  <div class="text-sm font-medium text-gray-900">{{ meta.metadata_key }}</div>
                  <div class="mt-1 text-sm text-gray-600">{{ meta.metadata_value }}</div>
                </div>
                <div class="flex gap-2">
                  <button (click)="editMetadataItem(meta)" class="text-indigo-600 hover:text-indigo-900" title="Edit">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button (click)="deleteMetadataItem(meta)" class="text-red-600 hover:text-red-900" title="Delete">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LookupListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  lookups: Lookup[] = [];
  categories: LookupCategory[] = [];
  categoryOptions: DropdownOption[] = [];
  loading = false;
  showModal = false;
  saving = false;
  editingLookup: Lookup | null = null;
  selectedCategoryMode: string = '';  // Tracks category selection: category_id or 'new'
  currentFilters: any = {};

  // Confirmation dialogs
  showDeleteConfirm = false;
  showToggleConfirm = false;
  showDeleteMetadataConfirm = false;
  lookupToDelete: Lookup | null = null;
  metadataToDelete: LookupMetadata | null = null;
  pendingToggle: { lookup: Lookup; newValue: boolean } | null = null;

  // DataTable configuration
  pagination: DataTablePagination = { total: 0, page: 1, limit: 25, totalPages: 0 };

  tableFilters: DataTableFilter[] = [
    { key: 'search', label: 'Search', type: 'search', placeholder: 'Lookup code or value', inputType: 'string' },
    { key: 'category_id', label: 'Category', type: 'select', placeholder: 'All Categories', options: [] },
    { key: 'is_active', label: 'Status', type: 'select', placeholder: 'All Statuses',
      options: [
        { value: '', label: 'All Lookups' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    }
  ];

  columns: DataTableColumn[] = [
    { key: 'category_name', label: 'Category', type: 'text', sortable: true },
    { key: 'lookup_code', label: 'Code', type: 'text', sortable: true },
    { key: 'lookup_value', label: 'Value', type: 'text', sortable: true },
    { key: 'sort_order', label: 'Sort Order', type: 'text', sortable: true },
    { key: 'is_active', label: 'Status', type: 'toggle', sortable: true }
  ];

  rowActions: DataTableAction[] = [
    { id: 'metadata', title: 'Manage Metadata', iconPath: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', color: 'purple', permission: 'LOOKUP_MGMT.MANAGE_METADATA' },
    { id: 'edit', title: 'Edit', iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'indigo', permission: 'LOOKUP_MGMT.UPDATE' },
    { id: 'delete', title: 'Delete', iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', color: 'red', permission: 'LOOKUP_MGMT.DELETE' }
  ];
  
  // Metadata management
  showMetadataModal = false;
  loadingMetadata = false;
  savingMetadata = false;
  selectedLookupForMetadata: Lookup | null = null;
  lookupMetadata: LookupMetadata[] = [];
  editingMetadata: LookupMetadata | null = null;
  metadataFormData: any = {
    metadata_key: '',
    metadata_value: ''
  };

  formData: any = { 
    lookup_code: '', 
    lookup_value: '', 
    sort_order: null as any, 
    is_active: true 
  };

  constructor(private lookupService: LookupService, private logger: LoggerService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadLookups();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.lookupService.getCategories({ is_active: true, limit: 1000 }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.categories = result.categories;
        
        // Build category options for dropdown with "new" option at the end
        this.categoryOptions = [
          ...result.categories.map(cat => ({ 
            value: cat.category_id.toString(), 
            label: cat.category_name 
          })),
          { value: 'new', label: '+ Add New Category' }
        ];
        
        // Update category filter options
        const categoryFilter = this.tableFilters.find(f => f.key === 'category_id');
        if (categoryFilter) {
          categoryFilter.options = [
            { value: '', label: 'All Categories' },
            ...result.categories.map(cat => ({ value: cat.category_id.toString(), label: cat.category_name }))
          ];
        }
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('Error loading categories', error);
        this.toast.error('Failed to load categories');
      }
    });
  }

  onFilterChange(filters: DataTableFilterState): void {
    // Store all filter values
    this.currentFilters = {
      search: filters['search'] || undefined,
      category_id: filters['category_id'] ? parseInt(filters['category_id'], 10) : undefined,
      is_active: filters['is_active'] === 'true' ? true : filters['is_active'] === 'false' ? false : undefined
    };
    
    this.pagination = { ...this.pagination, page: filters.page, limit: filters.limit };
    this.loadLookups();
  }

  onToggleStatus(event: { row: any; column: any; newValue: boolean }): void {
    const lookup = event.row as Lookup;
    this.pendingToggle = { lookup, newValue: event.newValue };
    this.showToggleConfirm = true;
  }

  confirmToggleStatus(): void {
    if (!this.pendingToggle) return;

    const { lookup, newValue } = this.pendingToggle;
    this.showToggleConfirm = false;
    this.pendingToggle = null;

    // Optimistic update
    lookup.is_active = newValue;

    this.lookupService.updateLookup(lookup.lookup_id, { is_active: newValue }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.toast.success(`${lookup.lookup_value} ${newValue ? 'activated' : 'deactivated'} successfully`);
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('Error updating lookup status', error);
        this.toast.error(error.error?.message || 'Failed to update lookup status');
        this.loadLookups(); // Revert optimistic update
      }
    });
  }

  cancelToggleStatus(): void {
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    this.loadLookups(); // Revert UI
  }

  onRowAction(event: DataTableRowActionEvent): void {
    const lookup = event.row as Lookup;
    switch (event.action) {
      case 'metadata':
        this.openMetadataModal(lookup);
        break;
      case 'edit':
        this.editLookup(lookup);
        break;
      case 'delete':
        this.lookupToDelete = lookup;
        this.showDeleteConfirm = true;
        break;
    }
  }

  performDelete(): void {
    if (!this.lookupToDelete) return;

    const lookup = this.lookupToDelete;
    this.showDeleteConfirm = false;
    this.lookupToDelete = null;

    this.lookupService.deleteLookup(lookup.lookup_id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loadLookups();
        this.toast.success('Lookup deleted successfully');
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('Error deleting lookup', error);
        this.toast.error(error.error?.message || 'Failed to delete lookup');
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.lookupToDelete = null;
  }

  loadLookups(): void {
    this.loading = true;
    const filters: LookupFilters = {
      ...this.currentFilters,
      page: this.pagination.page,
      limit: this.pagination.limit,
      sort_by: 'sort_order',
      sort_order: 'ASC'
    };

    this.lookupService.getLookups(filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.lookups = result.lookups;
        this.pagination = {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        };
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('Error loading lookups', error);
        this.toast.error('Failed to load lookups');
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.editingLookup = null;
    this.selectedCategoryMode = '';
    this.formData = {
      lookup_code: '',
      lookup_value: '',
      sort_order: null as any, // Will be auto-calculated by backend
      is_active: true
    };
    this.showModal = true;
  }

  editLookup(lookup: Lookup): void {
    this.editingLookup = lookup;
    this.selectedCategoryMode = lookup.category_id.toString();
    this.formData = {
      category_id: lookup.category_id,
      lookup_code: lookup.lookup_code,
      lookup_value: lookup.lookup_value,
      sort_order: lookup.sort_order,
      is_active: lookup.is_active
    };
    this.showModal = true;
  }

  closeModal(): void {
    if (!this.saving) {
      this.showModal = false;
      this.editingLookup = null;
      this.selectedCategoryMode = '';
      this.formData = {
        lookup_code: '',
        lookup_value: '',
        sort_order: null as any,
        legacy_lookup_id: '',
        is_active: true
      };
    }
  }

  onCategoryModeChange(): void {
    if (this.selectedCategoryMode === 'new') {
      // Creating new category - clear category_id
      delete this.formData.category_id;
      this.formData.new_category_name = '';
      this.formData.new_category_description = '';
    } else if (this.selectedCategoryMode) {
      // Selected existing category
      this.formData.category_id = parseInt(this.selectedCategoryMode);
      delete this.formData.new_category_name;
      delete this.formData.new_category_description;
    } else {
      // No selection
      delete this.formData.category_id;
      delete this.formData.new_category_name;
      delete this.formData.new_category_description;
    }
  }

  isFormValid(): boolean {
    if (!this.formData.lookup_code || !this.formData.lookup_value) {
      return false;
    }

    if (!this.editingLookup) {
      // For create: must have either category_id or new_category_name
      if (this.selectedCategoryMode === 'new') {
        return !!this.formData.new_category_name;
      } else {
        return !!this.formData.category_id;
      }
    }

    return true;
  }

  save(): void {
    if (!this.isFormValid()) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    this.saving = true;

    if (this.editingLookup) {
      // Update existing lookup
      const updateData: UpdateLookupDto = {
        category_id: this.formData.category_id,
        lookup_code: this.formData.lookup_code,
        lookup_value: this.formData.lookup_value,
        sort_order: this.formData.sort_order,
        is_active: this.formData.is_active
      };

      this.lookupService.updateLookup(this.editingLookup.lookup_id, updateData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadLookups();
          this.toast.success('Lookup updated successfully');
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error updating lookup', error);
          this.toast.error(error.error?.message || 'Failed to update lookup');
          this.saving = false;
        }
      });
    } else {
      // Create new lookup (with optional inline category creation)
      const createData: CreateLookupDto = {
        lookup_code: this.formData.lookup_code,
        lookup_value: this.formData.lookup_value,
        is_active: this.formData.is_active
      };

      if (this.selectedCategoryMode === 'new') {
        createData.new_category_name = this.formData.new_category_name;
        createData.new_category_description = this.formData.new_category_description;
      } else {
        createData.category_id = this.formData.category_id;
      }

      this.lookupService.createLookup(createData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadCategories();  // Refresh categories in case new one was created
          this.loadLookups();
          this.toast.success('Lookup created successfully');
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error creating lookup', error);
          this.toast.error(error.error?.message || 'Failed to create lookup');
          this.saving = false;
        }
      });
    }
  }

  // ==================== Metadata Management Methods ====================

  openMetadataModal(lookup: Lookup): void {
    this.selectedLookupForMetadata = lookup;
    this.showMetadataModal = true;
    this.editingMetadata = null;
    this.metadataFormData = {
      metadata_key: '',
      metadata_value: ''
    };
    this.loadMetadataForLookup(lookup.lookup_id);
  }

  closeMetadataModal(): void {
    if (!this.savingMetadata) {
      this.showMetadataModal = false;
      this.selectedLookupForMetadata = null;
      this.lookupMetadata = [];
      this.editingMetadata = null;
      this.metadataFormData = {
        metadata_key: '',
        metadata_value: ''
      };
    }
  }

  loadMetadataForLookup(lookupId: number): void {
    this.loadingMetadata = true;
    this.lookupService.getMetadata({ lookup_id: lookupId, limit: 1000 }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.lookupMetadata = result.metadata;
        this.loadingMetadata = false;
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('Error loading metadata', error);
        this.toast.error('Failed to load metadata');
        this.loadingMetadata = false;
      }
    });
  }

  isMetadataFormValid(): boolean {
    return !!(this.metadataFormData.metadata_key && this.metadataFormData.metadata_value);
  }

  saveMetadata(): void {
    if (!this.isMetadataFormValid() || !this.selectedLookupForMetadata) {
      return;
    }

    this.savingMetadata = true;

    if (this.editingMetadata) {
      // Update existing metadata
      const updateData: UpdateLookupMetadataDto = {
        metadata_key: this.metadataFormData.metadata_key,
        metadata_value: this.metadataFormData.metadata_value
      };

      this.lookupService.updateMetadata(this.editingMetadata.metadata_id, updateData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.savingMetadata = false;
          this.editingMetadata = null;
          this.metadataFormData = { metadata_key: '', metadata_value: '' };
          this.loadMetadataForLookup(this.selectedLookupForMetadata!.lookup_id);
          this.toast.success('Metadata updated successfully');
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error updating metadata', error);
          this.toast.error(error.error?.message || 'Failed to update metadata');
          this.savingMetadata = false;
        }
      });
    } else {
      // Create new metadata
      const createData: CreateLookupMetadataDto = {
        lookup_id: this.selectedLookupForMetadata.lookup_id,
        metadata_key: this.metadataFormData.metadata_key,
        metadata_value: this.metadataFormData.metadata_value
      };

      this.lookupService.createMetadata(createData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.savingMetadata = false;
          this.metadataFormData = { metadata_key: '', metadata_value: '' };
          this.loadMetadataForLookup(this.selectedLookupForMetadata!.lookup_id);
          this.toast.success('Metadata added successfully');
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error creating metadata', error);
          this.toast.error(error.error?.message || 'Failed to add metadata');
          this.savingMetadata = false;
        }
      });
    }
  }

  editMetadataItem(meta: LookupMetadata): void {
    this.editingMetadata = meta;
    this.metadataFormData = {
      metadata_key: meta.metadata_key,
      metadata_value: meta.metadata_value
    };
  }

  deleteMetadataItem(meta: LookupMetadata): void {
    this.metadataToDelete = meta;
    this.showDeleteMetadataConfirm = true;
  }

  performDeleteMetadata(): void {
    if (!this.metadataToDelete) return;

    const meta = this.metadataToDelete;
    this.showDeleteMetadataConfirm = false;
    this.metadataToDelete = null;

    this.lookupService.deleteMetadata(meta.metadata_id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loadMetadataForLookup(this.selectedLookupForMetadata!.lookup_id);
        this.toast.success('Metadata deleted successfully');
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('Error deleting metadata', error);
        this.toast.error(error.error?.message || 'Failed to delete metadata');
      }
    });
  }

  cancelDeleteMetadata(): void {
    this.showDeleteMetadataConfirm = false;
    this.metadataToDelete = null;
  }
}
