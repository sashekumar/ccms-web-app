import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ClaimService } from '../../../core/services/claims/claim.service';
import { ToastService } from '../../../core/services/toast.service';
import { LookupService, LookupItem } from '../../../shared/services/lookup.service';
import { Claim, ClaimFilters } from '../../../shared/models/claims/claim.model';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';

@Component({
  selector: 'app-claim-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    HasPermissionDirective
  ],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Claims</h1>
          <p class="mt-2 text-sm text-gray-600">View and progress claims records tracking reimbursement and cashless status.</p>
        </div>
      </div>

      <!-- Stats Cards (Hardcoded layout for demonstration) -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-blue-100">Total Claims</p>
              <p class="text-3xl font-bold">{{ stats.total }}</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-full p-3">
              <i class="fas fa-file-invoice text-xl w-6 h-6 text-center leading-6"></i>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-yellow-100">Pending</p>
              <p class="text-3xl font-bold">{{ stats.pending }}</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-green-100">Approved</p>
              <p class="text-3xl font-bold">{{ stats.approved }}</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-red-100">Rejected</p>
              <p class="text-3xl font-bold">{{ stats.rejected }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          
          <div class="md:col-span-1">
            <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              id="search"
              [(ngModel)]="filters.search"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Claim ref, member, hospital"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
            />
          </div>

          <div class="md:col-span-1">
            <label for="status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              id="status"
              [(ngModel)]="filters.status"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
            >
              <option value="ALL">All Statuses</option>
              <option *ngFor="let s of claimStatuses" [value]="s.lookup_value">{{ s.lookup_code }}</option>
            </select>
          </div>

          <div class="md:col-span-1">
            <label for="mode" class="block text-sm font-medium text-gray-700 mb-2">Claim Mode</label>
            <select
              id="mode"
              [(ngModel)]="filters.mode"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
            >
              <option value="">All Modes</option>
              <option value="CASHLESS">CASHLESS</option>
              <option value="REIMB">REIMB</option>
            </select>
          </div>
          
          <div class="md:col-span-1 flex items-end">
            <button 
              (click)="clearFilters()"
              class="w-full px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72]"
            >
              Clear Filters
            </button>
          </div>

        </div>
      </div>

      <!-- Data Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden relative min-h-[400px]">
        <app-loading-spinner *ngIf="loading"></app-loading-spinner>
        
        <div class="overflow-x-auto" *ngIf="!loading">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref No</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let claim of claims" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ claim.claim_ref_no }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ claim.created_at | date:'mediumDate' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ claim.member_name }}
                  <div class="text-xs text-gray-500">{{ claim.member_ic_no }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ claim.hospital_name || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    [ngClass]="{
                      'bg-yellow-100 text-yellow-800': claim.claim_status === 'PENDING',
                      'bg-green-100 text-green-800': claim.claim_status === 'APPROVED',
                      'bg-red-100 text-red-800': claim.claim_status === 'REJECTED'
                    }">
                    {{ claim.claim_status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ claim.claim_mode }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <!-- View Button -->
                    <button
                      (click)="viewClaim(claim.claim_id)"
                      class="text-blue-600 hover:text-blue-900 transition-colors duration-150"
                      title="View Claim">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    <!-- Edit Button -->
                    <ng-container *hasPermission="PERMISSIONS.CLAIMS.UPDATE">
                      <button
                        (click)="editClaim(claim.claim_id)"
                        class="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                        title="Edit Claim">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </ng-container>
                  </div>
                </td>
              </tr>
              
              <tr *ngIf="claims.length === 0">
                <td colspan="7" class="px-6 py-10 text-center text-gray-500">
                  No claims found matching your criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6" *ngIf="totalPages > 1">
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">{{ ((currentPage - 1) * itemsPerPage) + 1 }}</span> to <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, totalItems) }}</span> of <span class="font-medium">{{ totalItems }}</span> results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  (click)="changePage(currentPage - 1)"
                  [disabled]="currentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                
                <ng-container *ngFor="let page of getPageNumbers()">
                  <button
                    (click)="changePage(page)"
                    [ngClass]="page === currentPage ? 'z-10 bg-[#1e3c72] text-white border-[#1e3c72]' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300'"
                    class="relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                    {{ page }}
                  </button>
                </ng-container>

                <button
                  (click)="changePage(currentPage + 1)"
                  [disabled]="currentPage === totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span class="sr-only">Next</span>
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClaimListComponent implements OnInit, OnDestroy {
  PERMISSIONS = PERMISSIONS;
  Math = Math;
  
  claims: Claim[] = [];
  loading = true;
  totalItems = 0;
  itemsPerPage = 10;
  currentPage = 1;
  totalPages = 0;
  
  claimStatuses: LookupItem[] = [];
  
  stats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  };

  filters: ClaimFilters = {
    search: '',
    status: 'ALL',
    mode: '',
    page: 1,
    limit: 10
  };

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private claimService: ClaimService,
    private lookupService: LookupService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filters.page = 1;
      this.loadClaims();
    });
  }

  ngOnInit(): void {
    this.loadLookups();
    this.loadClaims();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLookups(): void {
    this.lookupService.getLookupByCategory('CLAIM_STATUS')
      .subscribe((res: any) => {
        if (res.success && res.data) {
          this.claimStatuses = res.data;
        }
      });
  }

  loadClaims(): void {
    this.loading = true;
    this.claimService.getClaims(this.filters).subscribe({
      next: (response) => {
        this.claims = response.data;
        this.totalItems = response.pagination?.total || 0;
        this.totalPages = response.pagination?.totalPages || 0;
        this.currentPage = response.pagination?.page || 1;
        
        // In a real app we might fetch global stats via a separate endpoint,
        // but for now we loosely calculate client side or leave generic values
        this.stats.total = this.totalItems;
        this.stats.pending = this.claims.filter(c => c.claim_status === 'PENDING').length;
        this.stats.approved = this.claims.filter(c => c.claim_status === 'APPROVED').length;
        this.stats.rejected = this.claims.filter(c => c.claim_status === 'REJECTED').length;
      },
      error: (err) => {
        this.toastService.error('Failed to load claims');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onSearchChange(value: string | undefined): void {
    this.searchSubject.next(value || '');
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.loadClaims();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: 'ALL',
      mode: '',
      page: 1,
      limit: 10
    };
    this.loadClaims();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.filters.page = page;
      this.loadClaims();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  viewClaim(id: number): void {
    this.router.navigate(['/claims', id]);
  }

  editClaim(id: number): void {
    this.router.navigate(['/claims', id, 'edit']);
  }
}
