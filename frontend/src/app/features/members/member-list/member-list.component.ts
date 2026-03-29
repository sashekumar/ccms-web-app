import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MemberService } from '../../../core/services/member.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';

import { MemberListItem, MemberFilters } from '../../../shared/models/member.model';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';
import { APP_ROUTES } from '../../../core/constants/routes.constants';

@Component({
  selector: 'app-member-list',
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
          <h1 class="text-3xl font-bold text-gray-900">Policy Holders</h1>
          <p class="mt-2 text-sm text-gray-600">Manage member information and policies</p>
        </div>
        <button 
          *hasPermission="PERMISSIONS.CREATE"
          (click)="createMember()"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#1e3c72] hover:bg-[#2a5298] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72] transition-colors duration-200">
          <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Member
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <!-- Total Members -->
        <div class="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-blue-100">Total Members</p>
              <p class="text-3xl font-bold">{{ stats.total }}</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-full p-3">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Active Members -->
        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-green-100">Active Members</p>
              <p class="text-3xl font-bold">{{ stats.active }}</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-full p-3">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Deleted Members -->
        <div class="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-red-100">Deleted Members</p>
              <p class="text-3xl font-bold">{{ stats.deleted }}</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-full p-3">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="md:col-span-1">
            <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              id="search"
              [(ngModel)]="filters.search"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Name, IC number, or member number"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
            />
          </div>

          <!-- Member Type Filter -->
          <div class="md:col-span-1">
            <label for="memberType" class="block text-sm font-medium text-gray-700 mb-2">Member Type</label>
            <select
              id="memberType"
              [(ngModel)]="filters.member_type"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
            >
              <option value="">All Types</option>
              <option value="Principal">Principal</option>
              <option value="Dependent">Dependent</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="md:col-span-1">
            <label for="status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              id="status"
              [(ngModel)]="filters.is_deleted"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
            >
              <option [ngValue]="undefined">All</option>
              <option [ngValue]="false">Active</option>
              <option [ngValue]="true">Deleted</option>
            </select>
          </div>

          <!-- Items per page -->
          <div class="md:col-span-1">
            <label for="limit" class="block text-sm font-medium text-gray-700 mb-2">Items per page</label>
            <select
              id="limit"
              [(ngModel)]="filters.limit"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
            >
              <option [ngValue]="10">10</option>
              <option [ngValue]="25">25</option>
              <option [ngValue]="50">50</option>
              <option [ngValue]="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading Spinner -->
      <app-loading-spinner *ngIf="loading"></app-loading-spinner>

      <!-- Members Table -->
      <div *ngIf="!loading" class="bg-white shadow overflow-hidden rounded-lg">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member Type
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enrollment Date
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let member of members" class="hover:bg-gray-50 transition-colors duration-150">
              <!-- Member Info (Avatar + Name + IC) -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gradient-to-r from-[#1e3c72] to-[#2a5298] flex items-center justify-center text-white font-semibold">
                      {{ getInitials(member.full_name) }}
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ member.full_name }}</div>
                    <div class="text-sm text-gray-500">IC: {{ member.ic_no }}</div>
                  </div>
                </div>
              </td>

              <!-- Member Type -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900">{{ member.member_type }}</span>
              </td>

              <!-- Enrollment Date -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900">{{ member.enrollment_date | date:'dd/MM/yyyy' }}</span>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  *ngIf="!member.is_deleted"
                  class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
                <span 
                  *ngIf="member.is_deleted"
                  class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                  Deleted
                </span>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <!-- View Button -->
                  <button
                    *hasPermission="PERMISSIONS.VIEW"
                    (click)="viewMember(member.member_id)"
                    class="text-blue-600 hover:text-blue-900 transition-colors duration-150"
                    title="View Member">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  <!-- Edit Button (only if not deleted) -->
                  <ng-container *hasPermission="PERMISSIONS.UPDATE">
                    <button
                      *ngIf="!member.is_deleted"
                      [attr.disabled]="member.is_deleted ? true : null"
                      (click)="editMember(member.member_id)"
                      class="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                      title="Edit Member">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </ng-container>

                  <!-- Delete Button (only if not deleted) -->
                  <ng-container *hasPermission="PERMISSIONS.DELETE">
                    <button
                      *ngIf="!member.is_deleted"
                      [attr.disabled]="member.is_deleted ? true : null"
                      (click)="deleteMember(member)"
                      class="text-red-600 hover:text-red-900 transition-colors duration-150"
                      title="Delete Member">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </ng-container>

                  <!-- Restore Button (only if deleted) -->
                  <ng-container *hasPermission="PERMISSIONS.DEACTIVATE">
                    <button
                      *ngIf="member.is_deleted"
                      (click)="restoreMember(member)"
                      class="text-green-600 hover:text-green-900 transition-colors duration-150"
                      title="Restore Member">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </ng-container>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div *ngIf="members.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No members found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ filters.search || filters.member_type || filters.is_deleted !== undefined ? 'Try adjusting your filters' : 'Get started by creating a new member' }}
          </p>
          <div class="mt-6" *hasPermission="PERMISSIONS.CREATE">
            <button
              (click)="createMember()"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#1e3c72] hover:bg-[#2a5298] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72]">
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Member
            </button>
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="members.length > 0" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              (click)="previousPage()"
              [disabled]="pagination.page === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button
              (click)="nextPage()"
              [disabled]="pagination.page === pagination.totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{{ getStartIndex() }}</span>
                to
                <span class="font-medium">{{ getEndIndex() }}</span>
                of
                <span class="font-medium">{{ pagination.total }}</span>
                results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  (click)="previousPage()"
                  [disabled]="pagination.page === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                
                <button
                  *ngFor="let page of getPageNumbers()"
                  (click)="goToPage(page)"
                  [class.bg-[#1e3c72]]="page === pagination.page"
                  [class.text-white]="page === pagination.page"
                  [class.bg-white]="page !== pagination.page"
                  [class.text-gray-700]="page !== pagination.page"
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium hover:bg-gray-50">
                  {{ page }}
                </button>
                
                <button
                  (click)="nextPage()"
                  [disabled]="pagination.page === pagination.totalPages"
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
export class MemberListComponent implements OnInit, OnDestroy {
  readonly PERMISSIONS = PERMISSIONS.POLICY_HOLDERS;

  members: MemberListItem[] = [];
  loading = false;
  stats = {
    total: 0,
    active: 0,
    deleted: 0
  };

  filters: MemberFilters = {
    search: '',
    member_type: '',
    member_status: undefined,
    is_deleted: undefined,
    page: 1,
    limit: 25
  };

  pagination = {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  };

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private memberService: MemberService,
    private router: Router,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    // Setup search debouncing
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.filters.search = searchTerm;
        this.filters.page = 1;
        this.loadMembers();
      });

    this.loadMembers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load members with current filters
   */
  loadMembers(): void {
    this.loading = true;
    this.logger.info('Loading members with filters:', this.filters);

    this.memberService.getMembers(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.members = result.members;
          this.pagination = {
            page: result.page,
            limit: result.limit || this.filters.limit || 25,
            total: result.total,
            totalPages: result.totalPages
          };

          // Calculate stats from response
          this.stats = {
            total: result.stats?.total_members || result.total,
            active: result.stats?.active_members || this.members.filter(m => !m.is_deleted).length,
            deleted: result.stats?.deleted_members || this.members.filter(m => m.is_deleted).length
          };

          this.loading = false;
          this.logger.info('Members loaded successfully');
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error loading members:', error);
          this.toast.error('Failed to load members');
        }
      });
  }

  /**
   * Handle search input change
   */
  onSearchChange(searchTerm: string): void {
    this.searchSubject$.next(searchTerm);
  }

  /**
   * Handle filter change
   */
  onFilterChange(): void {
    this.filters.page = 1;
    this.loadMembers();
  }

  /**
   * Navigate to create member page
   */
  createMember(): void {
    this.router.navigate([APP_ROUTES.MEMBERS.CREATE]);
  }

  /**
   * Navigate to view member page
   */
  viewMember(member_id: string): void {
    this.router.navigate([APP_ROUTES.MEMBERS.DETAIL(member_id)]);
  }

  /**
   * Navigate to edit member page
   */
  editMember(member_id: string): void {
    this.router.navigate([APP_ROUTES.MEMBERS.EDIT(member_id)]);
  }

  /**
   * Delete member (soft delete)
   */
  deleteMember(member: MemberListItem): void {
    if (!confirm(`Are you sure you want to delete ${member.full_name}?`)) {
      return;
    }

    this.loading = true;
    this.memberService.deleteMember(member.member_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Member deleted successfully');
          this.loadMembers();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error deleting member:', error);
          this.toast.error('Failed to delete member');
        }
      });
  }

  /**
   * Restore deleted member
   */
  restoreMember(member: MemberListItem): void {
    if (!confirm(`Are you sure you want to restore ${member.full_name}?`)) {
      return;
    }

    this.loading = true;
    this.memberService.restoreMember(member.member_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Member restored successfully');
          this.loadMembers();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error restoring member:', error);
          this.toast.error('Failed to restore member');
        }
      });
  }

  /**
   * Get initials for avatar
   */
  getInitials(name: string): string {
    if (!name) return '??';
    const words = name.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return '??';
    if (words.length === 1) {
      // For single word, return first 2 characters
      return words[0].substring(0, 2).toUpperCase();
    }
    // For multiple words, return first character of each word (up to 2)
    return words
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Pagination methods
   */
  previousPage(): void {
    if (this.pagination.page > 1) {
      this.filters.page = this.pagination.page - 1;
      this.loadMembers();
    }
  }

  nextPage(): void {
    if (this.pagination.page < this.pagination.totalPages) {
      this.filters.page = this.pagination.page + 1;
      this.loadMembers();
    }
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadMembers();
  }

  getPageNumbers(): number[] {
    const maxPages = 5;
    const pages: number[] = [];
    let startPage = Math.max(1, this.pagination.page - Math.floor(maxPages / 2));
    let endPage = Math.min(this.pagination.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getStartIndex(): number {
    return (this.pagination.page - 1) * this.pagination.limit + 1;
  }

  getEndIndex(): number {
    return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total);
  }
}


