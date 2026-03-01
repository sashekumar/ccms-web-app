import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LookupService } from '../../../core/services/lookup.service';
import { Lookup, LookupFilters, CreateLookupDto, UpdateLookupDto, LookupCategory, LookupMetadata, CreateLookupMetadataDto, UpdateLookupMetadataDto } from '../../../shared/models/lookup.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../common/components/status-badge/status-badge.component';

@Component({
  selector: 'app-lookup-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Lookup Values</h1>
          <p class="mt-1 text-sm text-gray-600">Manage lookup value master data</p>
        </div>
        <button
          *hasPermission="'LOOKUP_MGMT.CREATE'"
          (click)="openCreateModal()"
          class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-white transition hover:opacity-90"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Lookup
        </button>
      </div>

      <!-- Filters -->
      <div class="mb-6 rounded-lg bg-white p-4 shadow">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select
              [(ngModel)]="filters.category_id"
              (ngModelChange)="onCategoryChange()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="undefined">All Categories</option>
              <option *ngFor="let cat of categories" [ngValue]="cat.category_id">{{ cat.category_name }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              [(ngModel)]="filters.search"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Lookup code or value"
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
              <option [ngValue]="undefined">All Lookups</option>
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
      <app-loading-spinner *ngIf="loading" message="Loading lookups..."></app-loading-spinner>

      <!-- Lookups Table -->
      <div *ngIf="!loading && lookups.length > 0" class="overflow-hidden rounded-lg bg-white shadow">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Value</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Sort Order</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr *ngFor="let lookup of lookups" class="transition hover:bg-gray-50">
                <td class="whitespace-nowrap px-6 py-4"><div class="text-sm text-gray-900">{{ lookup.category_name }}</div></td>
                <td class="whitespace-nowrap px-6 py-4"><div class="text-sm font-medium text-gray-900">{{ lookup.lookup_code }}</div></td>
                <td class="whitespace-nowrap px-6 py-4"><div class="text-sm text-gray-900">{{ lookup.lookup_value }}</div></td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ lookup.sort_order }}</td>
                <td class="whitespace-nowrap px-6 py-4">
                  <app-status-badge [active]="lookup.is_active"></app-status-badge>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button *hasPermission="'LOOKUP_MGMT.MANAGE_METADATA'" (click)="openMetadataModal(lookup)" class="mr-3 text-purple-600 hover:text-purple-900" title="Manage Metadata">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                  </button>
                  <button *hasPermission="'LOOKUP_MGMT.UPDATE'" (click)="editLookup(lookup)" class="mr-3 text-indigo-600 hover:text-indigo-900" title="Edit">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button *hasPermission="'LOOKUP_MGMT.DELETE'" (click)="deleteLookup(lookup)" class="text-red-600 hover:text-red-900" title="Delete">
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
      <div *ngIf="!loading && lookups.length === 0" class="rounded-lg bg-white p-12 text-center shadow">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No lookups found</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new lookup value.</p>
      </div>
    </div>

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
              <label class="block text-sm font-medium text-gray-700">Category *</label>
              <select
                [(ngModel)]="selectedCategoryMode"
                (ngModelChange)="onCategoryModeChange()"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              >
                <option value="">Select category...</option>
                <option *ngFor="let cat of categories" [value]="cat.category_id">{{ cat.category_name }}</option>
                <option value="new">+ Add New Category</option>
              </select>
            </div>

            <!-- New Category Fields -->
            <div *ngIf="!editingLookup && selectedCategoryMode === 'new'" class="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div>
                <label class="block text-sm font-medium text-gray-700">New Category Name *</label>
                <input
                  type="text"
                  [(ngModel)]="formData.new_category_name"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                  placeholder="e.g., ADMISSION_TYPES"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Category Description</label>
                <textarea
                  [(ngModel)]="formData.new_category_description"
                  rows="2"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                  placeholder="Enter description"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Legacy Category ID</label>
                <input
                  type="text"
                  [(ngModel)]="formData.new_category_legacy_id"
                  pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                  placeholder="e.g., 12345678-1234-1234-1234-123456789012"
                  title="Must be a valid GUID format or leave empty"
                />
                <p class="mt-1 text-xs text-gray-400">Optional: Valid GUID format or leave empty</p>
              </div>
            </div>

            <!-- Lookup Code -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Lookup Code *</label>
              <input
                type="text"
                [(ngModel)]="formData.lookup_code"
                [disabled]="!!editingLookup"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72] disabled:bg-gray-100"
                placeholder="e.g., IP"
                maxlength="20"
              />
            </div>

            <!-- Lookup Value -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Lookup Value *</label>
              <input
                type="text"
                [(ngModel)]="formData.lookup_value"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                placeholder="e.g., In-Patient"
                maxlength="255"
              />
            </div>

            <!-- Sort Order (auto-filled, read-only for create) -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Sort Order {{ !editingLookup ? '(Auto-calculated)' : '' }}</label>
              <input
                type="number"
                [(ngModel)]="formData.sort_order"
                [readonly]="!editingLookup"
                placeholder="{{ !editingLookup ? 'Will be calculated automatically' : '' }}"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72] disabled:bg-gray-100"
                [class.bg-gray-100]="!editingLookup"
              />
            </div>

            <!-- Legacy Lookup ID -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Legacy Lookup ID</label>
              <input
                type="text"
                [(ngModel)]="formData.legacy_lookup_id"
                pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                placeholder="e.g., 12345678-1234-1234-1234-123456789012"
                title="Must be a valid GUID format or leave empty"
              />
              <p class="mt-1 text-xs text-gray-500">Optional: Valid GUID format (e.g., 12345678-1234-1234-1234-123456789012) or leave empty</p>
            </div>

            <!-- Active Status -->
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
        
        <!-- Modal Footer (Fixed) -->
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
              [disabled]="saving || !isFormValid()"
              class="flex-1 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
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
              <div>
                <label class="block text-sm font-medium text-gray-700">Key *</label>
                <input
                  type="text"
                  [(ngModel)]="metadataFormData.metadata_key"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                  placeholder="e.g., display_color"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Value *</label>
                <input
                  type="text"
                  [(ngModel)]="metadataFormData.metadata_value"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                  placeholder="e.g., #2563eb"
                />
              </div>
            </div>
            <div class="mt-3 flex justify-end">
              <button
                (click)="saveMetadata()"
                [disabled]="savingMetadata || !isMetadataFormValid()"
                class="rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {{ savingMetadata ? 'Adding...' : editingMetadata ? 'Update Metadata' : 'Add Metadata' }}
              </button>
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
  private searchSubject$ = new Subject<string>();

  lookups: Lookup[] = [];
  categories: LookupCategory[] = [];
  loading = false;
  showModal = false;
  saving = false;
  editingLookup: Lookup | null = null;
  selectedCategoryMode: string = '';  // Tracks category selection: category_id or 'new'

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

  filters: LookupFilters = { page: 1, limit: 10, sort_by: 'sort_order', sort_order: 'ASC' };
  pagination = { total: 0, page: 1, limit: 10, totalPages: 0 };
  formData: any = { 
    lookup_code: '', 
    lookup_value: '', 
    sort_order: null as any, 
    legacy_lookup_id: '', 
    is_active: true 
  };

  constructor(private lookupService: LookupService, private logger: LoggerService, private toast: ToastService) {
    this.searchSubject$.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filters.page = 1;
      this.loadLookups();
    });
  }

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
      },
      error: (error) => {
        this.logger.error('Error loading categories', error);
        this.toast.error('Failed to load categories');
      }
    });
  }

  onCategoryChange(): void {
    this.filters.page = 1;
    this.loadLookups();
  }

  onSearchChange(search: string): void {
    this.searchSubject$.next(search);
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.loadLookups();
  }

  loadLookups(): void {
    this.loading = true;
    this.lookupService.getLookups(this.filters).pipe(
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
      error: (error) => {
        this.logger.error('Error loading lookups', error);
        this.toast.error('Failed to load lookups');
        this.loading = false;
      }
    });
  }

  previousPage(): void {
    if (this.pagination.page > 1) {
      this.filters.page = this.pagination.page - 1;
      this.loadLookups();
    }
  }

  nextPage(): void {
    if (this.pagination.page < this.pagination.totalPages) {
      this.filters.page = this.pagination.page + 1;
      this.loadLookups();
    }
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadLookups();
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
    return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total);
  }

  openCreateModal(): void {
    this.editingLookup = null;
    this.selectedCategoryMode = '';
    this.formData = {
      lookup_code: '',
      lookup_value: '',
      sort_order: null as any, // Will be auto-calculated by backend
      legacy_lookup_id: '',
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
      legacy_lookup_id: lookup.legacy_lookup_id || '',
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
      this.formData.new_category_legacy_id = '';
    } else if (this.selectedCategoryMode) {
      // Selected existing category
      this.formData.category_id = parseInt(this.selectedCategoryMode);
      delete this.formData.new_category_name;
      delete this.formData.new_category_description;
      delete this.formData.new_category_legacy_id;
    } else {
      // No selection
      delete this.formData.category_id;
      delete this.formData.new_category_name;
      delete this.formData.new_category_description;
      delete this.formData.new_category_legacy_id;
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

  private isValidGuid(guid: string): boolean {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidRegex.test(guid);
  }

  save(): void {
    if (!this.isFormValid()) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    // Validate Legacy Lookup ID if provided
    if (this.formData.legacy_lookup_id && this.formData.legacy_lookup_id.trim() !== '') {
      if (!this.isValidGuid(this.formData.legacy_lookup_id)) {
        this.toast.error('Legacy Lookup ID must be a valid GUID format (e.g., 12345678-1234-1234-1234-123456789012)');
        return;
      }
    } else {
      // Convert empty string to undefined for API call
      this.formData.legacy_lookup_id = undefined;
    }

    // Validate Legacy Category ID if provided (for inline category creation)
    if (this.selectedCategoryMode === 'new' && this.formData.new_category_legacy_id && this.formData.new_category_legacy_id.trim() !== '') {
      if (!this.isValidGuid(this.formData.new_category_legacy_id)) {
        this.toast.error('Legacy Category ID must be a valid GUID format (e.g., 12345678-1234-1234-1234-123456789012)');
        return;
      }
    } else if (this.selectedCategoryMode === 'new') {
      // Convert empty string to undefined for API call
      this.formData.new_category_legacy_id = undefined;
    }

    this.saving = true;

    if (this.editingLookup) {
      // Update existing lookup
      const updateData: UpdateLookupDto = {
        category_id: this.formData.category_id,
        lookup_code: this.formData.lookup_code,
        lookup_value: this.formData.lookup_value,
        sort_order: this.formData.sort_order,
        legacy_lookup_id: this.formData.legacy_lookup_id,
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
        error: (error) => {
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
        legacy_lookup_id: this.formData.legacy_lookup_id,
        is_active: this.formData.is_active
      };

      if (this.selectedCategoryMode === 'new') {
        createData.new_category_name = this.formData.new_category_name;
        createData.new_category_description = this.formData.new_category_description;
        createData.new_category_legacy_id = this.formData.new_category_legacy_id;
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
        error: (error) => {
          this.logger.error('Error creating lookup', error);
          this.toast.error(error.error?.message || 'Failed to create lookup');
          this.saving = false;
        }
      });
    }
  }

  deleteLookup(lookup: Lookup): void {
    if (confirm(`Are you sure you want to delete lookup "${lookup.lookup_value}"?`)) {
      this.lookupService.deleteLookup(lookup.lookup_id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadLookups();
          this.toast.success('Lookup deleted successfully');
        },
        error: (error) => {
          this.logger.error('Error deleting lookup', error);
          this.toast.error(error.error?.message || 'Failed to delete lookup');
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
      error: (error) => {
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
        error: (error) => {
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
        error: (error) => {
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
    if (confirm(`Are you sure you want to delete metadata "${meta.metadata_key}"?`)) {
      this.lookupService.deleteMetadata(meta.metadata_id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadMetadataForLookup(this.selectedLookupForMetadata!.lookup_id);
          this.toast.success('Metadata deleted successfully');
        },
        error: (error) => {
          this.logger.error('Error deleting metadata', error);
          this.toast.error(error.error?.message || 'Failed to delete metadata');
        }
      });
    }
  }
}
