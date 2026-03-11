import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ClauseService } from '../../../core/services/clause.service';
import { Clause, ClauseFilters, CreateClauseDto, UpdateClauseDto } from '../../../shared/models/clause.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../common/components/status-badge/status-badge.component';

@Component({
  selector: 'app-clause-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Clause Management</h1>
          <p class="mt-1 text-sm text-gray-600">Manage clause master data</p>
        </div>
        <button
          *hasPermission="'CLAUSE_MGMT.CREATE'"
          (click)="openCreateModal()"
          class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-white transition hover:opacity-90"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Clause
        </button>
      </div>

      <!-- Filters -->
      <div class="mb-6 rounded-lg bg-white p-4 shadow">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              [(ngModel)]="filters.search"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Clause code or description"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              [(ngModel)]="filters.is_active"
              (ngModelChange)="onFilterChange()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="undefined">All Clauses</option>
              <option [ngValue]="true">Active</option>
              <option [ngValue]="false">Inactive</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Items per page</label>
            <select
              [(ngModel)]="filters.limit"
              (ngModelChange)="onFilterChange()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="10">10</option>
              <option [ngValue]="25">25</option>
              <option [ngValue]="50">50</option>
              <option [ngValue]="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loading" message="Loading clauses..."></app-loading-spinner>

      <!-- Clauses Table -->
      <div *ngIf="!loading" class="overflow-hidden rounded-lg bg-white shadow">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Clause Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr *ngFor="let clause of clauses" class="transition hover:bg-gray-50">
                <td class="whitespace-nowrap px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">{{ clause.clause_code }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ clause.clause_text }}</div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <app-status-badge [active]="clause.is_active"></app-status-badge>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    *hasPermission="'CLAUSE_MGMT.UPDATE'"
                    (click)="editClause(clause)"
                    class="mr-3 text-indigo-600 hover:text-indigo-900"
                    title="Edit"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    *hasPermission="'CLAUSE_MGMT.DELETE'"
                    (click)="deleteClause(clause)"
                    class="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination (same as bank component) -->
        <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div class="flex flex-1 justify-between sm:hidden">
            <button
              (click)="previousPage()"
              [disabled]="pagination.page === 1"
              [class.opacity-50]="pagination.page === 1"
              [class.cursor-not-allowed]="pagination.page === 1"
              class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              (click)="nextPage()"
              [disabled]="pagination.page >= pagination.totalPages"
              [class.opacity-50]="pagination.page >= pagination.totalPages"
              [class.cursor-not-allowed]="pagination.page >= pagination.totalPages"
              class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{{ getStartItem() }}</span>
                to
                <span class="font-medium">{{ getEndItem() }}</span>
                of
                <span class="font-medium">{{ pagination.total }}</span>
                results
              </p>
            </div>
            <div>
              <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  (click)="previousPage()"
                  [disabled]="pagination.page === 1"
                  class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                  </svg>
                </button>
                <button
                  *ngFor="let page of getPageNumbers()"
                  (click)="goToPage(page)"
                  [class.bg-[#1e3c72]]="page === pagination.page"
                  [class.text-white]="page === pagination.page"
                  [class.text-gray-900]="page !== pagination.page"
                  [class.hover:bg-gray-50]="page !== pagination.page"
                  class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0"
                >
                  {{ page }}
                </button>
                <button
                  (click)="nextPage()"
                  [disabled]="pagination.page >= pagination.totalPages"
                  class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Next</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && clauses.length === 0" class="rounded-lg bg-white p-12 text-center shadow">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No clauses found</h3>
        <p class="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4" (click)="closeModal()">
      <div class="w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="flex-shrink-0 border-b border-gray-200 px-6 py-4">
          <h3 class="text-lg font-semibold leading-6 text-gray-900">
            {{ editingClause ? 'Edit Clause' : 'Create Clause' }}
          </h3>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Clause Code <span class="text-red-500">*</span></label>
              <input
                type="text"
                [(ngModel)]="formData.clause_code"
                [disabled]="!!editingClause"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72] disabled:bg-gray-100"
                placeholder="e.g., CLS001"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Clause Text <span class="text-red-500">*</span></label>
              <textarea
                [(ngModel)]="formData.clause_text"
                rows="3"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                placeholder="Enter clause text"
              ></textarea>
            </div>

            <div class="flex items-center">
              <input
                type="checkbox"
                [(ngModel)]="formData.is_active"
                id="is_active"
                class="h-4 w-4 rounded border-gray-300 text-[#1e3c72] focus:ring-[#1e3c72]"
              />
              <label for="is_active" class="ml-2 block text-sm text-gray-700">Active</label>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex-shrink-0 border-t border-gray-200 px-6 py-4">
          <div class="flex gap-3">
            <button
              type="button"
              (click)="closeModal()"
              [disabled]="saving"
              class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="save()"
              [disabled]="saving"
              class="flex-1 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClauseListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  clauses: Clause[] = [];
  loading = false;
  showModal = false;
  saving = false;
  editingClause: Clause | null = null;

  filters: ClauseFilters = {
    page: 1,
    limit: 10,
    sort_by: 'clause_id',
    sort_order: 'DESC'
  };

  pagination = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  };

  formData: CreateClauseDto | UpdateClauseDto = {
    clause_code: '',
    clause_text: '',
    is_active: true
  };

  constructor(
    private clauseService: ClauseService,
    private logger: LoggerService,
    private toast: ToastService
  ) {
    this.searchSubject$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.filters.page = 1;
        this.loadClauses();
      });
  }

  ngOnInit(): void {
    this.loadClauses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClauses(): void {
    this.loading = true;
    this.clauseService.getClauses(this.filters)
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
        error: (error) => {
          this.logger.error('Error loading clauses', error);
          this.toast.error('Failed to load clauses. Please try again.');
          this.loading = false;
        }
      });
  }

  onSearchChange(search: string): void {
    this.searchSubject$.next(search);
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.loadClauses();
  }

  previousPage(): void {
    if (this.pagination.page > 1) {
      this.filters.page = this.pagination.page - 1;
      this.loadClauses();
    }
  }

  nextPage(): void {
    if (this.pagination.page < this.pagination.totalPages) {
      this.filters.page = this.pagination.page + 1;
      this.loadClauses();
    }
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadClauses();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.page;

    if (totalPages <= maxPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftOffset = Math.floor(maxPages / 2);
      let start = Math.max(1, currentPage - leftOffset);
      const end = Math.min(totalPages, start + maxPages - 1);

      if (end - start < maxPages - 1) {
        start = Math.max(1, end - maxPages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  getStartItem(): number {
    return (this.pagination.page - 1) * this.pagination.limit + 1;
  }

  getEndItem(): number {
    const end = this.pagination.page * this.pagination.limit;
    return Math.min(end, this.pagination.total);
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
        legacy_config_id: '',
        is_active: true
      };
    }
  }

  private isValidGuid(guid: string): boolean {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidRegex.test(guid);
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
          error: (error) => {
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
          error: (error) => {
            this.logger.error('Error creating clause', error);
            this.saving = false;
            this.toast.error(error.error?.message || 'Failed to create clause');
          }
        });
    }
  }

  deleteClause(clause: Clause): void {
    if (confirm(`Are you sure you want to delete clause "${clause.clause_code}"?`)) {
      this.clauseService.deleteClause(clause.clause_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadClauses();
            this.toast.success('Clause deleted successfully');
          },
          error: (error) => {
            this.logger.error('Error deleting clause', error);
            this.toast.error(error.error?.message || 'Failed to delete clause');
          }
        });
    }
  }
}
