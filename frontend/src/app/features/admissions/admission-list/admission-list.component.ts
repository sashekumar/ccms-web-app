import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AdmissionService } from '../../../core/services/admission.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { LookupService } from '../../../shared/services/lookup.service';

import { AdmissionListItem, AdmissionFilters } from '../../../shared/models/admission.model';
import { LookupItem } from '../../../shared/services/lookup.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';
import { APP_ROUTES } from '../../../core/constants/routes.constants';

@Component({
  selector: 'app-admission-list',
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
          <h1 class="text-3xl font-bold text-gray-900">Admissions</h1>
          <p class="mt-2 text-sm text-gray-600">Manage admission records and approvals</p>
        </div>
        <button 
          *hasPermission="PERMISSIONS.CREATE"
          (click)="createAdmission()"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#1e3c72] hover:bg-[#2a5298] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72] transition-colors duration-200">
          <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Admission
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <!-- Total Admissions -->
        <div class="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-blue-100">Total Admissions</p>
              <p class="text-3xl font-bold">{{ stats.total }}</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-full p-3">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Pending Admissions -->
        <div class="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-yellow-100">Pending Approval</p>
              <p class="text-3xl font-bold">{{ stats.pending }}</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-full p-3">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Approved Admissions -->
        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-green-100">Approved</p>
              <p class="text-3xl font-bold">{{ stats.approved }}</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-full p-3">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Rejected Admissions -->
        <div class="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-red-100">Rejected</p>
              <p class="text-3xl font-bold">{{ stats.rejected }}</p>
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
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <!-- Search -->
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

          <!-- Admission Type Filter -->
          <div class="md:col-span-1">
            <label for="admissionType" class="block text-sm font-medium text-gray-700 mb-2">Admission Type</label>
            <select
              id="admissionType"
            [(ngModel)]="filters.admissionType"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
            >
              <option [value]="''">All Types</option>
              <option *ngFor="let type of admissionTypes" [value]="type.lookup_value">
                {{ type.lookup_code }}
              </option>
            </select>
          </div>

          <!-- Room Type Filter -->
          <div class="md:col-span-1">
            <label for="roomType" class="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
            <select
              id="roomType"
            [(ngModel)]="filters.roomType"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
            >
              <option [value]="''">All Room Types</option>
              <option *ngFor="let type of roomTypes" [value]="type.lookup_value">
                {{ type.lookup_code }}
              </option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="md:col-span-1">
            <label for="status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              id="status"
            [(ngModel)]="filters.admissionStatus"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
            >
              <option [value]="''">All Status</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PENDING_MQ">Pending MQ</option>
              <option value="MQ_RESPONDED">MQ Responded</option>
            </select>
          </div>
        </div>

        <!-- Date Range Filters -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Admission Date From -->
          <div class="md:col-span-1">
            <label for="admissionDateFrom" class="block text-sm font-medium text-gray-700 mb-2">Admission From</label>
            <input
              type="date"
              id="admissionDateFrom"
              [(ngModel)]="filters.admissionDateFrom"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
            />
          </div>

          <!-- Admission Date To -->
          <div class="md:col-span-1">
            <label for="admissionDateTo" class="block text-sm font-medium text-gray-700 mb-2">Admission To</label>
            <input
              type="date"
              id="admissionDateTo"
              [(ngModel)]="filters.admissionDateTo"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
            />
          </div>

          <!-- Is Deleted Filter -->
          <div class="md:col-span-1">
            <label for="isDeleted" class="block text-sm font-medium text-gray-700 mb-2">Deleted Status</label>
            <select
              id="isDeleted"
              [(ngModel)]="filters.isDeleted"
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

      <!-- Admissions Table -->
      <div *ngIf="!loading" class="bg-white shadow overflow-hidden rounded-lg">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claim / Member
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hospital
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admission Date
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discharge Date
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LOS Days
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type / Room
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GL Reference
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let admission of admissions" class="hover:bg-gray-50 transition-colors duration-150">
                <!-- Claim / Member Info -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gradient-to-r from-[#1e3c72] to-[#2a5298] flex items-center justify-center text-white font-semibold text-xs">
                        {{ getInitials(admission.member_name) }}
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ admission.claim_ref_no || 'N/A' }}</div>
                      <div class="text-sm text-gray-500">{{ admission.member_name }}</div>
                    </div>
                  </div>
                </td>

                <!-- Hospital -->
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ admission.hospital_name }}</div>
                </td>

                <!-- Admission Date -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">{{ admission.admission_date | date:'dd/MM/yyyy' }}</span>
                </td>

                <!-- Discharge Date -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">{{ admission.discharge_date ? (admission.discharge_date | date:'dd/MM/yyyy') : '-' }}</span>
                </td>

                <!-- LOS Days -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">{{ getLOS(admission) }}</span>
                </td>

                <!-- Type / Room -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ getLookupName(admissionTypes, admission.admission_type) }}</div>
                  <div class="text-xs text-gray-500">{{ getLookupName(roomTypes, admission.room_type) }}</div>
                </td>

                <!-- Status -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    [ngClass]="{
                      'bg-yellow-100 text-yellow-800': admission.admission_status === 'PENDING_APPROVAL' || admission.admission_status === 'PENDING_MQ',
                      'bg-green-100 text-green-800': admission.admission_status === 'APPROVED',
                      'bg-red-100 text-red-800': admission.admission_status === 'REJECTED',
                      'bg-blue-100 text-blue-800': admission.admission_status === 'MQ_RESPONDED',
                      'bg-gray-100 text-gray-800': !admission.admission_status
                    }"
                    class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ formatStatus(admission.admission_status) }}
                  </span>
                </td>

                <!-- GL Reference -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-mono text-gray-900">{{ admission.gl_ref_no || '-' }}</span>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <!-- View Button -->
                    <button
                      *hasPermission="PERMISSIONS.VIEW"
                      (click)="viewAdmission(admission.admission_id)"
                      class="text-blue-600 hover:text-blue-900 transition-colors duration-150"
                      title="View Admission">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    <!-- Edit Button (only if pending and not deleted) -->
                    <ng-container *hasPermission="PERMISSIONS.UPDATE">
                      <button
                        *ngIf="!admission.is_deleted && canEdit(admission.admission_status)"
                        (click)="editAdmission(admission.admission_id)"
                        class="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                        title="Edit Admission">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </ng-container>

                    <!-- Approve Button (only if pending and not deleted) -->
                    <ng-container *hasPermission="PERMISSIONS.APPROVE">
                      <button
                        *ngIf="!admission.is_deleted && canApprove(admission.admission_status)"
                        (click)="approveAdmission(admission)"
                        class="text-green-600 hover:text-green-900 transition-colors duration-150"
                        title="Approve Admission">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </ng-container>

                    <!-- Reject Button (only if pending and not deleted) -->
                    <ng-container *hasPermission="PERMISSIONS.APPROVE">
                      <button
                        *ngIf="!admission.is_deleted && canReject(admission.admission_status)"
                        (click)="rejectAdmission(admission)"
                        class="text-orange-600 hover:text-orange-900 transition-colors duration-150"
                        title="Reject Admission">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </ng-container>

                    <!-- Delete Button (only if pending and not deleted) -->
                    <ng-container *hasPermission="PERMISSIONS.DELETE">
                      <button
                        *ngIf="!admission.is_deleted && canDelete(admission.admission_status)"
                        (click)="deleteAdmission(admission)"
                        class="text-red-600 hover:text-red-900 transition-colors duration-150"
                        title="Delete Admission">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </ng-container>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div *ngIf="admissions.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No admissions found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ hasActiveFilters() ? 'Try adjusting your filters' : 'Get started by creating a new admission' }}
          </p>
          <div class="mt-6" *hasPermission="PERMISSIONS.CREATE">
            <button
              (click)="createAdmission()"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#1e3c72] hover:bg-[#2a5298] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72]">
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Admission
            </button>
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="admissions.length > 0" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
export class AdmissionListComponent implements OnInit, OnDestroy {
  readonly PERMISSIONS = PERMISSIONS.ADMISSIONS;

  admissions: AdmissionListItem[] = [];
  admissionTypes: LookupItem[] = [];
  roomTypes: LookupItem[] = [];
  loading = false;
  
  stats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  };

  filters: AdmissionFilters = {
    search: '',
    admissionType: '',
    roomType: '',
    admissionStatus: '',
    admissionDateFrom: '',
    admissionDateTo: '',
    isDeleted: undefined,
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
    private admissionService: AdmissionService,
    private lookupService: LookupService,
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
        this.loadAdmissions();
      });

    this.loadLookups();
    this.loadAdmissions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load lookup data for dropdowns
   */
  loadLookups(): void {
    this.lookupService.getAdmissionTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => this.admissionTypes = types,
        error: (error) => this.logger.error('Error loading admission types:', error)
      });

    this.lookupService.getRoomTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => this.roomTypes = types,
        error: (error) => this.logger.error('Error loading room types:', error)
      });
  }

  /**
   * Load admissions with current filters
   */
  loadAdmissions(): void {
    this.loading = true;
    this.logger.info('Loading admissions with filters:', this.filters);

    this.admissionService.getAdmissions(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.admissions = result.admissions;
          this.pagination = {
            page: result.page,
            limit: result.limit || this.filters.limit || 25,
            total: result.total,
            totalPages: result.totalPages
          };

          // Calculate stats from response
          this.stats = {
            total: result.total,
            pending: this.admissions.filter(a => a.admission_status === 'PENDING_APPROVAL' || a.admission_status === 'PENDING_MQ').length,
            approved: this.admissions.filter(a => a.admission_status === 'APPROVED').length,
            rejected: this.admissions.filter(a => a.admission_status === 'REJECTED').length
          };

          this.loading = false;
          this.logger.info('Admissions loaded successfully');
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error loading admissions:', error);
          this.toast.error('Failed to load admissions');
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
    this.loadAdmissions();
  }

  /**
   * Navigate to create admission page
   */
  createAdmission(): void {
    this.router.navigate([APP_ROUTES.ADMISSIONS.CREATE]);
  }

  /**
   * Navigate to view admission page
   */
  viewAdmission(admission_id: number): void {
    this.router.navigate([APP_ROUTES.ADMISSIONS.DETAIL(admission_id)]);
  }

  /**
   * Navigate to edit admission page
   */
  editAdmission(admission_id: number): void {
    this.router.navigate([APP_ROUTES.ADMISSIONS.EDIT(admission_id)]);
  }

  /**
   * Approve admission
   */
  approveAdmission(admission: AdmissionListItem): void {
    const remarks = prompt('Optional remarks for approval:');
    if (remarks === null) return; // User cancelled

    this.loading = true;
    this.admissionService.approveAdmission(admission.admission_id, { remarks: remarks || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (glRefNo) => {
          this.toast.success(`Admission approved successfully. GL: ${glRefNo}`);
          this.loadAdmissions();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error approving admission:', error);
          this.toast.error(error.error?.message || 'Failed to approve admission');
        }
      });
  }

  /**
   * Reject admission
   */
  rejectAdmission(admission: AdmissionListItem): void {
    const reason = prompt('Please enter rejection reason (required):');
    if (!reason || reason.trim() === '') {
      this.toast.error('Rejection reason is required');
      return;
    }

    if (!confirm(`Are you sure you want to reject this admission?`)) {
      return;
    }

    this.loading = true;
    this.admissionService.rejectAdmission(admission.admission_id, { rejectionReason: reason })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Admission rejected successfully');
          this.loadAdmissions();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error rejecting admission:', error);
          this.toast.error(error.error?.message || 'Failed to reject admission');
        }
      });
  }

  /**
   * Delete admission (soft delete)
   */
  deleteAdmission(admission: AdmissionListItem): void {
    if (!confirm(`Are you sure you want to delete this admission?`)) {
      return;
    }

    this.loading = true;
    this.admissionService.deleteAdmission(admission.admission_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Admission deleted successfully');
          this.loadAdmissions();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error deleting admission:', error);
          this.toast.error(error.error?.message || 'Failed to delete admission');
        }
      });
  }

  /**
   * Check if admission can be edited
   */
  canEdit(status: string | null | undefined): boolean {
    return status === 'PENDING_APPROVAL' || status === 'PENDING_MQ' || status === 'MQ_RESPONDED';
  }

  /**
   * Check if admission can be approved
   */
  canApprove(status: string | null | undefined): boolean {
    return status === 'PENDING_APPROVAL' || status === 'PENDING_MQ' || status === 'MQ_RESPONDED';
  }

  /**
   * Check if admission can be rejected
   */
  canReject(status: string | null | undefined): boolean {
    return status === 'PENDING_APPROVAL' || status === 'PENDING_MQ' || status === 'MQ_RESPONDED';
  }

  /**
   * Check if admission can be deleted
   */
  canDelete(status: string | null | undefined): boolean {
    return status === 'PENDING_APPROVAL' || !status;
  }

  /**
   * Get initials for avatar
   */
  getInitials(name: string | null | undefined): string {
    if (!name) return '??';
    const words = name.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return '??';
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Get lookup name by value
   */
  getLookupName(lookups: LookupItem[], value: string | null | undefined): string {
    if (!value) return 'N/A';
    const lookup = lookups.find(l => l.lookup_value === value);
    return lookup ? lookup.lookup_code : value;
  }

  /**
   * Format status for display
   */
  formatStatus(status: string | null | undefined): string {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Get Length of Stay (LOS)
   * If discharged: returns actual LOS from database
   * If still admitted: calculates current LOS (days since admission)
   */
  getLOS(admission: AdmissionListItem): string {
    if (!admission.admission_date) return '-';
    
    // If discharged, use database-calculated LOS
    if (admission.discharge_date && admission.los_days !== null && admission.los_days !== undefined) {
      return admission.los_days.toString();
    }
    
    // If still admitted, calculate current LOS (days since admission until today)
    const admissionDate = new Date(admission.admission_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - admissionDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays}`;
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return !!(
      this.filters.search ||
      this.filters.admissionType ||
      this.filters.roomType ||
      this.filters.admissionStatus ||
      this.filters.admissionDateFrom ||
      this.filters.admissionDateTo ||
      this.filters.isDeleted !== undefined
    );
  }

  /**
   * Pagination methods
   */
  previousPage(): void {
    if (this.pagination.page > 1) {
      this.filters.page = this.pagination.page - 1;
      this.loadAdmissions();
    }
  }

  nextPage(): void {
    if (this.pagination.page < this.pagination.totalPages) {
      this.filters.page = this.pagination.page + 1;
      this.loadAdmissions();
    }
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadAdmissions();
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


