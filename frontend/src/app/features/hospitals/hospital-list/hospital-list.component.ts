import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HospitalService } from '../../../core/services/hospital.service';
import {
  HospitalListItem,
  HospitalStats
} from '../../../shared/models/hospital.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';
import { APP_ROUTES } from '../../../core/constants/routes.constants';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { DataTableComponent, DataTableColumn, DataTableAction, DataTableFilter, DataTablePagination, DataTableFilterState, DataTableRowActionEvent } from '../../../shared/components/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-hospital-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, DataTableComponent, ConfirmDialogComponent, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Hospital Management</h1>
          <p class="mt-1 text-sm text-gray-600">Manage hospital records and information</p>
        </div>
        <app-button
          *hasPermission="PERMISSIONS.CREATE"
          variant="primary"
          iconLeft="fas fa-plus"
          (click)="createHospital()"
        >
          Create Hospital
        </app-button>
      </div>

      <!-- Stats Cards -->
      <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- Total Hospitals -->
        <div class="rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Hospitals</p>
              <p class="mt-2 text-3xl font-bold text-gray-900">{{ stats.total }}</p>
            </div>
            <div class="rounded-full bg-gradient-to-br from-[#1e3c72] to-[#2a5298] p-3">
              <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Panel Hospitals -->
        <div class="rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Panel Hospitals</p>
              <p class="mt-2 text-3xl font-bold text-green-600">{{ stats.panel }}</p>
            </div>
            <div class="rounded-full bg-gradient-to-br from-green-500 to-green-600 p-3">
              <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Non-Panel Hospitals -->
        <div class="rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Non-Panel</p>
              <p class="mt-2 text-3xl font-bold text-gray-600">{{ stats.nonPanel }}</p>
            </div>
            <div class="rounded-full bg-gradient-to-br from-gray-500 to-gray-600 p-3">
              <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Active Hospitals -->
        <div class="rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Active</p>
              <p class="mt-2 text-3xl font-bold text-blue-600">{{ stats.active }}</p>
            </div>
            <div class="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-3">
              <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- DataTable with Filters -->
      <app-data-table
        [rows]="hospitals"
        [columns]="columns"
        [filters]="tableFilters"
        [rowActions]="rowActions"
        [pagination]="pagination"
        [loading]="loading"
        [idKey]="'hospital_id'"
        (filterChange)="onFilterChange($event)"
        (rowAction)="onRowAction($event)"
        (cellToggle)="onTogglePanelStatus($event)"
        emptyMessage="No hospitals found"
        [emptySubMessage]="currentFilters.search ? 'Try adjusting your search criteria.' : 'Get started by creating a new hospital.'"
        [emptyIconPath]="'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'"
      ></app-data-table>
    </div>

    <!-- Delete Confirmation Dialog -->
    <app-confirm-dialog
      *ngIf="showDeleteConfirm"
      [isOpen]="showDeleteConfirm"
      title="Confirm Delete"
      [message]="'Are you sure you want to delete the hospital ' + (hospitalToDelete?.hospital_name || '') + '? This action cannot be undone.'"
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="danger"
      (confirmed)="performDelete()"
      (cancelled)="cancelDelete()"
    />

    <!-- Panel Status Toggle Confirmation Dialog -->
    <app-confirm-dialog
      *ngIf="showPanelToggleConfirm"
      [isOpen]="showPanelToggleConfirm"
      title="Confirm Panel Status Change"
      [message]="'Are you sure you want to change ' + (hospitalToToggle?.hospital?.hospital_name || '') + ' to ' + (hospitalToToggle?.newValue ? 'Panel' : 'Non-Panel') + ' status?'"
      confirmLabel="Yes, Change Status"
      cancelLabel="Cancel"
      variant="warn"
      (confirmed)="performPanelToggle()"
      (cancelled)="cancelPanelToggle()"
    />
  `,
  styles: []
})
export class HospitalListComponent implements OnInit, OnDestroy {
  // Permission constants (exposed to template)
  readonly PERMISSIONS = PERMISSIONS.HOSPITAL_MANAGEMENT;

  hospitals: HospitalListItem[] = [];
  loading = false;
  showDeleteConfirm = false;
  showPanelToggleConfirm = false;
  hospitalToDelete: HospitalListItem | null = null;
  hospitalToToggle: { hospital: HospitalListItem; newValue: boolean } | null = null;
  currentFilters: any = {};

  stats: HospitalStats = {
    total: 0,
    panel: 0,
    nonPanel: 0,
    active: 0,
    inactive: 0
  };

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
      placeholder: 'Hospital name or code...',
      inputType: 'string'
    },
    {
      key: 'hospital_type',
      label: 'Hospital Type',
      type: 'select',
      placeholder: 'All Types',
      options: [] // Will be populated from lookup service
    },
    {
      key: 'is_panel',
      label: 'Panel Status',
      type: 'select',
      placeholder: 'All',
      options: [
        { value: '', label: 'All' },
        { value: 'true', label: 'Panel' },
        { value: 'false', label: 'Non-Panel' }
      ]
    }
  ];

  columns: DataTableColumn[] = [
    {
      key: 'hospital_name',
      label: 'Hospital Name',
      type: 'avatar',
      sortable: true
    },
    {
      key: 'hospital_code',
      label: 'Hospital Code',
      type: 'text',
      sortable: true,
      emptyText: '-'
    },
    {
      key: 'hospital_type',
      label: 'Type',
      type: 'text',
      sortable: true,
      emptyText: '-'
    },
    {
      key: 'is_panel',
      label: 'Panel Status',
      type: 'toggle',
      sortable: true,
      toggleActiveLabel: 'Panel',
      toggleInactiveLabel: 'Non-Panel'
    },
    {
      key: 'accreditation_status',
      label: 'Accreditation Status',
      type: 'text',
      sortable: true,
      emptyText: '-'
    }
  ];

  rowActions: DataTableAction[] = [
    {
      id: 'view',
      title: 'View Hospital',
      iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      color: 'blue',
      permission: 'HOSPITAL_MGMT.VIEW'
    },
    {
      id: 'edit',
      title: 'Edit Hospital',
      iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'indigo',
      permission: 'HOSPITAL_MGMT.UPDATE'
    },
    {
      id: 'delete',
      title: 'Delete Hospital',
      iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'red',
      permission: 'HOSPITAL_MGMT.DELETE'
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private hospitalService: HospitalService,
    private router: Router,
    private logger: LoggerService,
    private toast: ToastService,
    private lookupService: LookupService
  ) {}

  ngOnInit(): void {
    // Populate hospital types in filter options
    this.lookupService.getHospitalTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        const hospitalTypeFilter = this.tableFilters.find(f => f.key === 'hospital_type');
        if (hospitalTypeFilter) {
          hospitalTypeFilter.options = [
            { value: '', label: 'All Types' },
            ...items.map(item => ({ value: item.lookup_code, label: item.lookup_value }))
          ];
        }
      });

    this.loadHospitals();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load hospitals with current filters
   */
  loadHospitals(): void {
    this.loading = true;
    
    const requestFilters = {
      ...this.currentFilters,
      page: this.pagination.page,
      limit: this.pagination.limit,
      sort_by: 'hospital_name',
      sort_order: 'ASC'
    };
    
    this.logger.info('Loading hospitals with filters:', requestFilters);

    this.hospitalService.getHospitals(requestFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.hospitals = result.hospitals;
          this.pagination = {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
          };

          // Use stats from API response
          this.stats = result.stats;

          this.loading = false;
          this.logger.info('Hospitals loaded successfully');
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error loading hospitals:', error);
          this.toast.error('Failed to load hospitals');
        }
      });
  }

  /**
   * Handle filter change from data-table
   */
  onFilterChange(filters: DataTableFilterState): void {
    this.logger.debug('Filter changed:', filters);
    
    // Store all filter values
    this.currentFilters = {
      search: filters['search'] || undefined,
      hospital_type: filters['hospital_type'] || undefined,
      is_panel: filters['is_panel'] === 'true' ? true : filters['is_panel'] === 'false' ? false : undefined
    };
    
    // Update pagination from filters
    this.pagination = {
      ...this.pagination,
      page: filters.page,
      limit: filters.limit
    };
    
    // Reload with new filters
    this.loadHospitals();
  }

  /**
   * Handle row action clicks
   */
  onRowAction(event: DataTableRowActionEvent): void {
    const hospital = event.row as HospitalListItem;
    
    switch (event.action) {
      case 'view':
        this.viewHospital(hospital.hospital_id);
        break;
      case 'edit':
        this.editHospital(hospital.hospital_id);
        break;
      case 'delete':
        this.hospitalToDelete = hospital;
        this.showDeleteConfirm = true;
        break;
    }
  }

  /**
   * Perform delete after confirmation
   */
  performDelete(): void {
    if (!this.hospitalToDelete) return;
    
    const hospital = this.hospitalToDelete;
    this.showDeleteConfirm = false;
    this.loading = true;
    
    this.hospitalService.deleteHospital(hospital.hospital_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`Hospital "${hospital.hospital_name}" deleted successfully`);
          this.hospitalToDelete = null;
          this.loadHospitals();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error deleting hospital:', error);
          this.toast.error('Failed to delete hospital');
        }
      });
  }

  /**
   * Cancel delete confirmation
   */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.hospitalToDelete = null;
  }

  /**
   * Handle panel status toggle
   */
  onTogglePanelStatus(event: { row: any; column: any; newValue: boolean }): void {
    const hospital = event.row as HospitalListItem;
    const newPanelStatus = event.newValue;
    
    // Show confirmation dialog
    this.hospitalToToggle = { hospital, newValue: newPanelStatus };
    this.showPanelToggleConfirm = true;
  }

  /**
   * Perform panel status toggle after confirmation
   */
  performPanelToggle(): void {
    if (!this.hospitalToToggle) return;
    
    const { hospital, newValue } = this.hospitalToToggle;
    this.showPanelToggleConfirm = false;
    
    this.logger.debug(`Toggling hospital ${hospital.hospital_id} panel status to: ${newValue}`);
    
    this.hospitalService.updateHospital(hospital.hospital_id, { is_panel: newValue })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          hospital.is_panel = newValue;
          this.toast.success(`Hospital "${hospital.hospital_name}" panel status updated to ${newValue ? 'Panel' : 'Non-Panel'}`);
          this.hospitalToToggle = null;
          // Reload to update stats
          this.loadHospitals();
        },
        error: (error) => {
          this.logger.error('Error updating panel status:', error);
          this.toast.error('Failed to update panel status');
          this.hospitalToToggle = null;
          // Reload to revert the optimistic update
          this.loadHospitals();
        }
      });
  }

  /**
   * Cancel panel status toggle
   */
  cancelPanelToggle(): void {
    this.showPanelToggleConfirm = false;
    this.hospitalToToggle = null;
  }

  /**
   * Navigate to create hospital page
   */
  createHospital(): void {
    this.router.navigate([APP_ROUTES.HOSPITALS.CREATE]);
  }

  /**
   * Navigate to view hospital page
   */
  viewHospital(hospital_id: string): void {
    this.router.navigate([APP_ROUTES.HOSPITALS.DETAIL(hospital_id)]);
  }

  /**
   * Navigate to edit hospital page
   */
  editHospital(hospital_id: string): void {
    this.router.navigate([APP_ROUTES.HOSPITALS.EDIT(hospital_id)]);
  }
}
