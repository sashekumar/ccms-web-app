import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LookupService } from '../../../core/services/lookup.service';
import { LookupMetadata, LookupMetadataFilters, CreateLookupMetadataDto, UpdateLookupMetadataDto, LookupCategory, Lookup } from '../../../shared/models/lookup.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-lookup-metadata-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoadingSpinnerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Lookup Metadata</h1>
          <p class="mt-1 text-sm text-gray-600">Manage lookup metadata for extended properties</p>
        </div>
        <button
          *hasPermission="'LOOKUP_MGMT.MANAGE_METADATA'"
          (click)="openCreateModal()"
          [disabled]="!selectedLookupId"
          class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Metadata
        </button>
      </div>

      <!-- Filters -->
      <div class="mb-6 rounded-lg bg-white p-4 shadow">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Category *</label>
            <select
              [(ngModel)]="selectedCategoryId"
              (ngModelChange)="onCategoryChange()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="undefined">Select category...</option>
              <option *ngFor="let cat of categories" [ngValue]="cat.category_id">{{ cat.category_name }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Lookup *</label>
            <select
              [(ngModel)]="selectedLookupId"
              (ngModelChange)="onLookupChange()"
              [disabled]="!selectedCategoryId"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72] disabled:bg-gray-100"
            >
              <option [ngValue]="undefined">Select lookup...</option>
              <option *ngFor="let lk of lookups" [ngValue]="lk.lookup_id">{{ lk.lookup_value }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Selection Prompt -->
      <div *ngIf="!selectedLookupId && !loading" class="rounded-lg bg-white p-12 text-center shadow">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Please select a lookup</h3>
        <p class="mt-1 text-sm text-gray-500">Choose a category and lookup from the dropdowns above to view metadata.</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading && selectedLookupId" class="flex items-center justify-center py-12">
        <app-loading-spinner></app-loading-spinner>
      </div>

      <!-- Metadata Table -->
      <div *ngIf="!loading && selectedLookupId" class="overflow-hidden rounded-lg bg-white shadow">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Key</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Value</th>
                <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr *ngFor="let meta of metadata" class="transition hover:bg-gray-50">
                <td class="whitespace-nowrap px-6 py-4"><div class="text-sm font-medium text-gray-900">{{ meta.metadata_key }}</div></td>
                <td class="px-6 py-4"><div class="text-sm text-gray-900 break-words max-w-md">{{ meta.metadata_value }}</div></td>
                <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button *hasPermission="'LOOKUP_MGMT.MANAGE_METADATA'" (click)="editMetadata(meta)" class="mr-3 text-indigo-600 hover:text-indigo-900" title="Edit">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button *hasPermission="'LOOKUP_MGMT.MANAGE_METADATA'" (click)="deleteMetadata(meta)" class="text-red-600 hover:text-red-900" title="Delete">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div><p class="text-sm text-gray-700">Showing <span class="font-medium">{{ getStartItem() }}</span> to <span class="font-medium">{{ getEndItem() }}</span> of <span class="font-medium">{{ pagination.total }}</span> results</p></div>
            <div>
              <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button (click)="previousPage()" [disabled]="pagination.page === 1" class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><span class="sr-only">Previous</span><svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd"/></svg></button>
                <button *ngFor="let page of getPageNumbers()" (click)="goToPage(page)" [class.bg-[#1e3c72]]="page === pagination.page" [class.text-white]="page === pagination.page" [class.text-gray-900]="page !== pagination.page" class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300">{{ page }}</button>
                <button (click)="nextPage()" [disabled]="pagination.page >= pagination.totalPages" class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><span class="sr-only">Next</span><svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/></svg></button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && selectedLookupId && metadata.length === 0" class="rounded-lg bg-white p-12 text-center shadow">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No metadata found</h3>
        <p class="mt-1 text-sm text-gray-500">Add metadata to extend this lookup with additional properties.</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4" (click)="closeModal()">
      <div class="w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="flex-shrink-0 border-b border-gray-200 px-6 py-4">
          <h3 class="text-lg font-semibold leading-6 text-gray-900">
            {{ editingMetadata ? 'Edit Metadata' : 'Add Metadata' }}
          </h3>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Metadata Key *</label>
              <input 
                type="text" 
                [(ngModel)]="formData.metadata_key" 
                [disabled]="!!editingMetadata" 
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72] disabled:bg-gray-100" 
                placeholder="e.g., color, icon, url"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Metadata Value *</label>
              <textarea 
                [(ngModel)]="formData.metadata_value" 
                rows="3" 
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]" 
                placeholder="Enter value"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex-shrink-0 border-t border-gray-200 px-6 py-4">
          <div class="flex gap-3">
            <button 
              (click)="closeModal()" 
              [disabled]="saving" 
              class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
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
export class LookupMetadataListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  metadata: LookupMetadata[] = [];
  categories: LookupCategory[] = [];
  lookups: Lookup[] = [];
  selectedCategoryId?: number;
  selectedLookupId?: number;
  loading = false;
  showModal = false;
  saving = false;
  editingMetadata: LookupMetadata | null = null;

  filters: LookupMetadataFilters = { page: 1, limit: 10, sort_by: 'metadata_id', sort_order: 'ASC' };
  pagination = { total: 0, page: 1, limit: 10, totalPages: 0 };
  formData: CreateLookupMetadataDto | UpdateLookupMetadataDto = { lookup_id: 0, metadata_key: '', metadata_value: '' };

  constructor(
    private lookupService: LookupService,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void { this.loadCategories(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadCategories(): void {
    this.lookupService.getCategories({ is_active: true, limit: 1000 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => { this.categories = result.categories; },
      error: (error) => {
        this.logger.error('Error loading categories:', error);
        this.toast.error('Failed to load categories');
      }
    });
  }

  onCategoryChange(): void { this.selectedLookupId = undefined; this.lookups = []; this.metadata = []; if (this.selectedCategoryId) this.loadLookups(); }

  loadLookups(): void {
    if (!this.selectedCategoryId) return;
    this.lookupService.getAllLookupsByCategory(this.selectedCategoryId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => { this.lookups = result.lookups; },
      error: (error) => {
        this.logger.error('Error loading lookups:', error);
        this.toast.error('Failed to load lookups');
      }
    });
  }

  onLookupChange(): void { this.filters.lookup_id = this.selectedLookupId; this.filters.page = 1; this.loadMetadata(); }
  onFilterChange(): void { this.filters.page = 1; this.loadMetadata(); }

  loadMetadata(): void {
    if (!this.selectedLookupId) return;
    this.loading = true;
    this.lookupService.getMetadata(this.filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => { this.metadata = result.metadata; this.pagination = { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages }; this.loading = false; },
      error: (error) => {
        this.logger.error('Error loading metadata:', error);
        this.toast.error('Failed to load metadata');
        this.loading = false;
      }
    });
  }

  previousPage(): void { if (this.pagination.page > 1) { this.filters.page = this.pagination.page - 1; this.loadMetadata(); } }
  nextPage(): void { if (this.pagination.page < this.pagination.totalPages) { this.filters.page = this.pagination.page + 1; this.loadMetadata(); } }
  goToPage(page: number): void { this.filters.page = page; this.loadMetadata(); }

  getPageNumbers(): number[] {
    const pages: number[] = []; const maxPages = 5; const totalPages = this.pagination.totalPages; const currentPage = this.pagination.page;
    if (totalPages <= maxPages) { for (let i = 1; i <= totalPages; i++) pages.push(i); } else {
      const leftOffset = Math.floor(maxPages / 2); let start = Math.max(1, currentPage - leftOffset); const end = Math.min(totalPages, start + maxPages - 1);
      if (end - start < maxPages - 1) start = Math.max(1, end - maxPages + 1);
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }

  getStartItem(): number { return (this.pagination.page - 1) * this.pagination.limit + 1; }
  getEndItem(): number { return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total); }

  openCreateModal(): void { this.editingMetadata = null; this.formData = { lookup_id: this.selectedLookupId!, metadata_key: '', metadata_value: '' }; this.showModal = true; }
  editMetadata(meta: LookupMetadata): void { this.editingMetadata = meta; this.formData = { lookup_id: meta.lookup_id, metadata_key: meta.metadata_key, metadata_value: meta.metadata_value }; this.showModal = true; }
  closeModal(): void { if (!this.saving) { this.showModal = false; this.editingMetadata = null; this.formData = { lookup_id: this.selectedLookupId!, metadata_key: '', metadata_value: '' }; } }

  save(): void {
    if (!this.formData.metadata_key || !this.formData.metadata_value) { this.toast.error('Please fill in all required fields'); return; }
    this.saving = true;
    if (this.editingMetadata) {
      this.lookupService.updateMetadata(this.editingMetadata.metadata_id, this.formData).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.saving = false; this.closeModal(); this.loadMetadata(); this.toast.success('Metadata updated successfully'); },
        error: (error) => {
          this.logger.error('Error updating metadata:', error);
          this.toast.error(error.error?.message || 'Failed to update metadata');
          this.saving = false;
        }
      });
    } else {
      this.lookupService.createMetadata(this.formData as CreateLookupMetadataDto).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.saving = false; this.closeModal(); this.loadMetadata(); this.toast.success('Metadata created successfully'); },
        error: (error) => {
          this.logger.error('Error creating metadata:', error);
          this.toast.error(error.error?.message || 'Failed to create metadata');
          this.saving = false;
        }
      });
    }
  }

  deleteMetadata(meta: LookupMetadata): void {
    if (confirm(`Are you sure you want to delete metadata "${meta.metadata_key}"?`)) {
      this.lookupService.deleteMetadata(meta.metadata_id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.loadMetadata(); this.toast.success('Metadata deleted successfully'); },
        error: (error) => {
          this.logger.error('Error deleting metadata:', error);
          this.toast.error(error.error?.message || 'Failed to delete metadata');
        }
      });
    }
  }
}
