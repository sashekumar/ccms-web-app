import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { ClaimService } from '../../../core/services/claims/claim.service';
import { MemberService } from '../../../core/services/member.service';
import { HospitalService } from '../../../core/services/hospital.service';
import { BankService } from '../../../core/services/bank.service';
import { ToastService } from '../../../core/services/toast.service';
import { UploadService } from '../../../core/services/upload.service';
import { LookupService, LookupItem } from '../../../shared/services/lookup.service';
import { Claim, CreateClaimDto, UpdateClaimDto } from '../../../shared/models/claims/claim.model';
import { MemberListItem, MemberDependent } from '../../../shared/models/member.model';
import { HospitalListItem } from '../../../shared/models/hospital.model';
import { Bank } from '../../../shared/models/bank.model';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';
import { APP_ROUTES } from '../../../core/constants/routes.constants';

@Component({
  selector: 'app-claim-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <button
              (click)="goBack()"
              class="mb-2 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to List
            </button>
            <h1 class="text-3xl font-bold text-gray-900">
              {{ claimId === 0 ? 'New Reimbursement Claim' : isCreateMode ? 'Edit Claim' : 'Claim Details' }}
            </h1>
            <p class="mt-2 text-sm text-gray-600" *ngIf="claimData">
              {{ claimData.claim_ref_no || 'N/A' }} - {{ getMemberName() }}
            </p>
          </div>
          
          <!-- Action Buttons (View Mode) -->
          <div class="flex space-x-3" *ngIf="!isCreateMode && claimData">
            <button
              (click)="onDeleteClaim()"
              class="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
            <button
              (click)="enterEditMode()"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72]">
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>
      </div>

      <!-- View Mode: Tabs and Details -->
      <div *ngIf="!isCreateMode && claimData">
        <!-- Status Badge -->
        <div class="mb-6">
          <span 
            [ngClass]="{
              'bg-yellow-100 text-yellow-800': claimData.claim_status === 'PENDING' || claimData.claim_status === 'UNDER_REVIEW',
              'bg-green-100 text-green-800': claimData.claim_status === 'APPROVED',
              'bg-red-100 text-red-800': claimData.claim_status === 'REJECTED',
              'bg-blue-100 text-blue-800': claimData.claim_status === 'PROCESSING',
              'bg-gray-100 text-gray-800': !claimData.claim_status
            }"
            class="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full">
            {{ formatStatus(claimData.claim_status) }}
          </span>
          <span *ngIf="claimData.is_ec_case" class="ml-2 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
            EC Case
          </span>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              *ngFor="let tab of tabs"
              (click)="switchTab(tab.id)"
              [class.border-[#1e3c72]]="activeTab === tab.id"
              [class.text-[#1e3c72]]="activeTab === tab.id"
              [class.border-transparent]="activeTab !== tab.id"
              [class.text-gray-500]="activeTab !== tab.id"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-gray-700 hover:border-gray-300 transition-colors duration-150">
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="bg-white shadow rounded-lg p-6">
          <!-- Claim Info Tab -->
          <div *ngIf="activeTab === 'info'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Member & Patient Information -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Member & Patient</h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Member</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ getMemberName() }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Patient Type</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ claimData.patient_type || 'N/A' }}</dd>
                  </div>
                  <div *ngIf="claimData.patient_type === 'DEPENDENT'">
                    <dt class="text-sm font-medium text-gray-500">Patient (Dependent)</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ getPatientName() }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Diagnosis Category</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ getLookupValue(diagnosisCategories, claimData.disability_category) }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Hospital Information -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Hospital</h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Hospital Name</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ getHospitalName() }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Document Received</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ claimData.document_received_at ? (claimData.document_received_at | date:'dd/MM/yyyy') : 'N/A' }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Payee Information -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Payee Details</h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Payee Name</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ claimData.payee_name || 'N/A' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Payee IC No</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ claimData.payee_ic_no || 'N/A' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Bank Name</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ claimData.payee_bank_name || 'N/A' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Account Number</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ claimData.payee_bank_account_no || 'N/A' }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Financial Information -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Financial Details</h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Total Billed</dt>
                    <dd class="mt-1 text-sm font-semibold text-blue-900">{{ claimData.total_billed || 0 | number:'1.2-2' }} MYR</dd>
                  </div>
                  <div *ngIf="claimData.total_approved !== null && claimData.total_approved !== undefined">
                    <dt class="text-sm font-medium text-gray-500">Total Approved</dt>
                    <dd class="mt-1 text-sm font-semibold text-green-900">{{ claimData.total_approved | number:'1.2-2' }} MYR</dd>
                  </div>
                  <div *ngIf="claimData.claim_status === 'REJECTED' && claimData.rejection_reason">
                    <dt class="text-sm font-medium text-gray-500">Rejection Reason</dt>
                    <dd class="mt-1 text-sm text-red-600">{{ claimData.rejection_reason }}</dd>
                  </div>
                </dl>
              </div>

              <!-- EC Case Information -->
              <div *ngIf="claimData.is_ec_case" class="md:col-span-2">
                <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">EC Case Details</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <dl class="space-y-3">
                    <div>
                      <dt class="text-sm font-medium text-gray-500">EC Status</dt>
                      <dd class="mt-1 text-sm text-gray-900">{{ claimData.ec_status || 'N/A' }}</dd>
                    </div>
                    <div *ngIf="claimData.ec_notification_date">
                      <dt class="text-sm font-medium text-gray-500">EC Notification Date</dt>
                      <dd class="mt-1 text-sm text-gray-900">{{ claimData.ec_notification_date | date:'dd/MM/yyyy HH:mm' }}</dd>
                    </div>
                  </dl>
                  <dl class="space-y-3">
                    <div *ngIf="claimData.ec_closed_date">
                      <dt class="text-sm font-medium text-gray-500">EC Closed Date</dt>
                      <dd class="mt-1 text-sm text-gray-900">{{ claimData.ec_closed_date | date:'dd/MM/yyyy HH:mm' }}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <!-- Audit Information -->
              <div class="md:col-span-2">
                <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Audit Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <dl class="space-y-3">
                    <div>
                      <dt class="text-sm font-medium text-gray-500">Created At</dt>
                      <dd class="mt-1 text-sm text-gray-900">{{ claimData.created_at | date:'dd/MM/yyyy HH:mm:ss' }}</dd>
                    </div>
                    <div *ngIf="claimData.created_by">
                      <dt class="text-sm font-medium text-gray-500">Created By</dt>
                      <dd class="mt-1 text-sm text-gray-900">{{ claimData.created_by }}</dd>
                    </div>
                  </dl>
                  <dl class="space-y-3">
                    <div *ngIf="claimData.updated_at">
                      <dt class="text-sm font-medium text-gray-500">Updated At</dt>
                      <dd class="mt-1 text-sm text-gray-900">{{ claimData.updated_at | date:'dd/MM/yyyy HH:mm:ss' }}</dd>
                    </div>
                    <div *ngIf="claimData.updated_by">
                      <dt class="text-sm font-medium text-gray-500">Updated By</dt>
                      <dd class="mt-1 text-sm text-gray-900">{{ claimData.updated_by }}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Expenses Tab (Placeholder) -->
          <div *ngIf="activeTab === 'expenses'">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Expense Items</h3>
            
            <div *ngIf="loadingExpenses" class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3c72] mx-auto"></div>
              <p class="mt-2 text-sm text-gray-500">Loading expenses...</p>
            </div>

            <div *ngIf="!loadingExpenses && claimExpenses.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No expense items</h3>
              <p class="mt-1 text-sm text-gray-500">No expenses have been added to this claim yet.</p>
            </div>

            <div *ngIf="!loadingExpenses && claimExpenses.length > 0" class="space-y-4">
              <div *ngFor="let expense of claimExpenses; let i = index" 
                class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-150">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Item {{ i + 1 }}</span>
                  <span class="text-sm font-semibold text-blue-900">{{ expense.billed_amt | number:'1.2-2' }} MYR</span>
                </div>
                <dl class="space-y-2">
                  <div>
                    <dt class="text-xs font-medium text-gray-500">Benefit Category</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ getLookupValue(benefitCategories, expense.benefit_category) }}</dd>
                  </div>
                  <div *ngIf="expense.description">
                    <dt class="text-xs font-medium text-gray-500">Description</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ expense.description }}</dd>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div *ngIf="expense.receipt_no">
                      <dt class="text-xs font-medium text-gray-500">Receipt No</dt>
                      <dd class="mt-1 text-sm text-gray-900">{{ expense.receipt_no }}</dd>
                    </div>
                    <div *ngIf="expense.receipt_date">
                      <dt class="text-xs font-medium text-gray-500">Receipt Date</dt>
                      <dd class="mt-1 text-sm text-gray-900">{{ expense.receipt_date | date:'dd/MM/yyyy' }}</dd>
                    </div>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <!-- Documents Tab -->
          <div *ngIf="activeTab === 'documents'">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Supporting Documents</h3>
            
            <div *ngIf="loadingDocuments" class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3c72] mx-auto"></div>
              <p class="mt-2 text-sm text-gray-500">Loading documents...</p>
            </div>

            <div *ngIf="!loadingDocuments && claimDocuments.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No documents</h3>
              <p class="mt-1 text-sm text-gray-500">No documents have been uploaded for this claim yet.</p>
            </div>

            <div *ngIf="!loadingDocuments && claimDocuments.length > 0" class="space-y-3">
              <div *ngFor="let doc of claimDocuments" 
                class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0">
                    <svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ doc.file_name }}</p>
                    <p class="text-xs text-gray-500">{{ getLookupValue(documentTypes, doc.doc_category) }}</p>
                    <p class="text-xs text-gray-400" *ngIf="doc.file_size_bytes">{{ formatFileSize(doc.file_size_bytes) }}</p>
                  </div>
                </div>
                <a *ngIf="doc.file_path" 
                  [href]="doc.file_path" 
                  target="_blank"
                  class="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ã¢â€â‚¬Ã¢â€â‚¬ CREATE FORM Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ -->
      <form *ngIf="isCreateMode || claimId === 0" [formGroup]="createForm" (ngSubmit)="onCreateSubmit()" class="space-y-6">

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- LEFT: Patient & Hospital -->
          <div class="bg-white rounded-lg shadow-lg">
            <div class="bg-blue-50 px-6 py-4 border-b border-blue-100 rounded-t-lg">
              <h2 class="text-lg font-semibold text-blue-800"><i class="fas fa-user-md mr-2"></i>Patient & Hospital</h2>
            </div>
            <div class="p-6 space-y-4">

              <!-- Member -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Member (Patient) <span class="text-red-500">*</span></label>
                <select formControlName="member_id"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                  [class.border-red-500]="createForm.get('member_id')?.invalid && createForm.get('member_id')?.touched">
                  <option value="">-- Select Member --</option>
                  <option *ngFor="let m of members" [value]="m.member_id">
                    {{ m.full_name }} ({{ m.ic_no }})
                  </option>
                </select>
                <p *ngIf="createForm.get('member_id')?.invalid && createForm.get('member_id')?.touched" class="mt-1 text-sm text-red-600">Member is required</p>
              </div>

              <!-- Patient Type -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Patient Type</label>
                <select formControlName="patient_type"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72]">
                  <option value="PRINCIPAL">Principal</option>
                  <option value="DEPENDENT">Dependent</option>
                </select>
              </div>

              <!-- Patient (Dependent) - shown when patient_type is DEPENDENT -->
              <div *ngIf="createForm.get('patient_type')?.value === 'DEPENDENT'">
                <label class="block text-sm font-medium text-gray-700 mb-1">Select Dependent <span class="text-red-500">*</span></label>
                <select formControlName="patient_id"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72]">
                  <option value="">-- Select Dependent --</option>
                  <option *ngFor="let d of dependents" [value]="d.dependent_id">{{ d.full_name }} ({{ d.ic_no || 'No IC' }})</option>
                </select>
                <p *ngIf="dependents.length === 0 && createForm.get('member_id')?.value" class="mt-1 text-sm text-gray-500">No dependents found for this member</p>
              </div>

              <!-- Hospital -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Hospital <span class="text-red-500">*</span></label>
                <select formControlName="hospital_id"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                  [class.border-red-500]="createForm.get('hospital_id')?.invalid && createForm.get('hospital_id')?.touched">
                  <option value="">-- Select Hospital --</option>
                  <option *ngFor="let h of hospitals" [value]="h.hospital_id">
                    {{ h.hospital_name }}
                  </option>
                </select>
                <p *ngIf="createForm.get('hospital_id')?.invalid && createForm.get('hospital_id')?.touched" class="mt-1 text-sm text-red-600">Hospital is required</p>
              </div>

              <!-- Disability Category -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Disability / Diagnosis Category</label>
                <select formControlName="disability_category"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72]">
                  <option value="">-- Select Category --</option>
                  <option *ngFor="let dc of diagnosisCategories" [value]="dc.lookup_code">{{ dc.lookup_value }}</option>
                </select>
              </div>

              <!-- Document Received Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Document Received Date</label>
                <input type="date" formControlName="document_received_at"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72]" />
              </div>

            </div>
          </div>

          <!-- RIGHT: Payee & Payment -->
          <div class="bg-white rounded-lg shadow-lg">
            <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
              <h2 class="text-lg font-semibold text-gray-800"><i class="fas fa-university mr-2"></i>Payee & Payment Info</h2>
            </div>
            <div class="p-6 space-y-4">

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Payee Name</label>
                <input type="text" formControlName="payee_name" placeholder="Full name as per IC / account"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72]" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Payee IC / Passport No</label>
                <input type="text" formControlName="payee_ic_no" placeholder="e.g. 880101-14-5678"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72]" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <select formControlName="payee_bank_name"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72]">
                  <option value="">-- Select Bank --</option>
                  <option *ngFor="let b of banks" [value]="b.bank_name">{{ b.bank_name }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Bank Account No</label>
                <input type="text" formControlName="payee_bank_account_no" placeholder="e.g. 1234567890"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72]" />
              </div>

                <div class="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 md:col-span-2">
                  <p class="text-xs font-medium text-blue-600 mb-1"><i class="fas fa-calculator mr-1"></i>Total Billed (RM)</p>
                  <p class="text-xl font-bold text-blue-900">{{ createForm.get('total_billed')?.value | number:'1.2-2' }}</p>
                </div>

            </div>
          </div>

        </div>

        <!-- ROW 2: Expense Line Items (full width) -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-800"><i class="fas fa-receipt mr-2"></i>Expense Line Items</h2>
            <button type="button" (click)="addExpense()"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow-sm">
              <i class="fas fa-plus mr-2"></i> Add Expense
            </button>
          </div>
          <div class="p-6">

            <div *ngIf="expenses.length === 0" class="flex flex-col items-center justify-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <i class="fas fa-receipt text-3xl mb-2 text-gray-300"></i>
              <span>No expenses added yet. Click <strong>"+ Add Expense"</strong> to add itemised billing.</span>
            </div>

            <div formArrayName="expenses" class="space-y-3">
              <div *ngFor="let exp of expenses.controls; let i = index" [formGroupName]="i"
                class="border border-gray-200 rounded-lg bg-gray-50 p-4">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Item {{ i + 1 }}</span>
                  <button type="button" (click)="removeExpense(i)"
                    class="inline-flex items-center px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors">
                    <i class="fas fa-trash mr-1"></i> Remove
                  </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Benefit Category</label>
                    <select formControlName="benefit_category"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-[#1e3c72] focus:border-[#1e3c72]">
                      <option value="">-- Select Category --</option>
                      <option *ngFor="let cat of benefitCategories" [value]="cat.lookup_code">{{ cat.lookup_value }}</option>
                    </select>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <input type="text" formControlName="description" placeholder="e.g. Ward charges for 3 nights"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-[#1e3c72] focus:border-[#1e3c72]" />
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Amount (RM)</label>
                    <input type="number" formControlName="billed_amt" step="0.01" min="0" placeholder="0.00"
                      (change)="onExpenseAmountChange()"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-[#1e3c72] focus:border-[#1e3c72] text-right" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Receipt No</label>
                    <input type="text" formControlName="receipt_no" placeholder="e.g. R-00123"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-[#1e3c72] focus:border-[#1e3c72]" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Receipt Date</label>
                    <input type="date" formControlName="receipt_date"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-[#1e3c72] focus:border-[#1e3c72]" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- ROW 3: Supporting Documents (full width) -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-800"><i class="fas fa-paperclip mr-2"></i>Supporting Documents</h2>
              <p class="text-xs text-gray-500 mt-0.5">List all physical documents submitted with this claim.</p>
            </div>
            <button type="button" (click)="addDocument()"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm">
              <i class="fas fa-plus mr-2"></i> Add Document
            </button>
          </div>
          <div class="p-6">

            <div *ngIf="documents.length === 0" class="flex flex-col items-center justify-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <i class="fas fa-folder-open text-3xl mb-2 text-gray-300"></i>
              <span>No documents listed yet. Click <strong>"+ Add Document"</strong> to add supporting documents.</span>
            </div>

            <div formArrayName="documents" class="space-y-3">
              <div *ngFor="let doc of documents.controls; let i = index" [formGroupName]="i"
                class="border border-gray-200 rounded-lg bg-gray-50 p-4">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Document {{ i + 1 }}</span>
                  <button type="button" (click)="removeDocument(i)"
                    class="inline-flex items-center px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors">
                    <i class="fas fa-trash mr-1"></i> Remove
                  </button>
                </div>
                <!-- Row 1: Type + Name + Remarks -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Document Type <span class="text-red-500">*</span></label>
                    <select formControlName="doc_type"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-[#1e3c72] focus:border-[#1e3c72]">
                      <option value="">-- Select Type --</option>
                      <option *ngFor="let dt of documentTypes" [value]="dt.lookup_code">{{ dt.lookup_value }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Document Name / Reference <span class="text-red-500">*</span></label>
                    <input type="text" formControlName="doc_name" placeholder="e.g. Hospital Invoice INV-20250101"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-[#1e3c72] focus:border-[#1e3c72]" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                    <input type="text" formControlName="remarks" placeholder="Optional notes"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-[#1e3c72] focus:border-[#1e3c72]" />
                  </div>
                </div>
                <!-- Row 2: File picker -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Attach File</label>
                  <div class="flex items-center gap-3">
                    <label [for]="'file-' + i"
                      class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                      <i class="fas fa-paperclip text-indigo-500"></i> Choose File
                    </label>
                    <input [id]="'file-' + i" type="file" class="hidden"
                      (change)="onDocumentFileSelected($event, i)" />
                    <span class="text-sm truncate" [class.text-gray-500]="!hasFileMissingWarning(i)" [class.text-amber-600]="hasFileMissingWarning(i)">
                      {{ getDocumentFileName(i) }}
                    </span>
                    <!-- Warning for file name without actual file -->
                    <span *ngIf="hasFileMissingWarning(i)" class="inline-flex items-center gap-1 px-2 py-1 text-xs text-amber-700 bg-amber-50 rounded border border-amber-200" title="File name exists but file not uploaded. Please re-select the file.">
                      <i class="fas fa-exclamation-triangle"></i> Missing File
                    </span>
                    <!-- View button - shown when file is selected or exists -->
                    <button *ngIf="canViewDocument(i)" type="button"
                      (click)="viewDocument(i)"
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                      <i class="fas fa-eye"></i> View
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>


        <!-- Actions -->
        <div class="flex justify-end space-x-3 pb-4">
          <button type="button" (click)="goBack()"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm">
            {{ isCreateMode ? 'Cancel' : 'Back to List' }}
          </button>
          <button *ngIf="!isCreateMode && claimData" type="button" (click)="enterEditMode()"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <i class="fas fa-edit mr-2"></i> Edit
          </button>
          <button *ngIf="isCreateMode" type="submit" [disabled]="createForm.invalid || saving"
            class="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1e3c72] hover:bg-[#2a5298] disabled:bg-gray-400 disabled:cursor-not-allowed">
            <svg *ngIf="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ saving ? (claimId > 0 ? 'Saving...' : 'Submitting...') : (claimId > 0 ? 'Save Changes' : 'Submit Claim') }}
          </button>
        </div>

      </form>

    </div>
  `
})
export class ClaimFormComponent implements OnInit {
  PERMISSIONS = PERMISSIONS;

  claimData: Claim | null = null;
  claimId: number = 0;
  isCreateMode: boolean = false;
  saving = false;

  // View mode tabs
  activeTab: string = 'info';
  tabs = [
    { id: 'info', label: 'Claim Information' },
    { id: 'expenses', label: 'Expense Items' },
    { id: 'documents', label: 'Documents' }
  ];

  claimStatuses: LookupItem[] = [];
  diagnosisCategories: LookupItem[] = [];
  benefitCategories: LookupItem[] = [];
  documentTypes: LookupItem[] = [];
  banks: Bank[] = [];
  dependents: MemberDependent[] = [];

  // Loaded sub-resources (for view mode)
  claimExpenses: any[] = [];
  claimDocuments: any[] = [];
  loadingExpenses = false;
  loadingDocuments = false;
  
  // Store File objects for preview (index -> File object)
  documentFileObjects: Map<number, File> = new Map();

  // IDs of records removed from form during editing (to be deleted from DB on save)
  private deletedExpenseIds: number[] = [];
  private deletedDocumentIds: number[] = [];

  createForm: FormGroup;
  members: MemberListItem[] = [];
  hospitals: HospitalListItem[] = [];
  policies: any[] = [];

  constructor(
    private fb: FormBuilder,
    private claimService: ClaimService,
    private memberService: MemberService,
    private hospitalService: HospitalService,
    private bankService: BankService,
    private lookupService: LookupService,
    private toastService: ToastService,
    private uploadService: UploadService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.createForm = this.fb.group({
      member_id: ['', Validators.required],
      hospital_id: ['', Validators.required],
      patient_type: ['PRINCIPAL'],
      patient_id: [''],
      policy_record_id: [''],
      claim_mode: ['REIMBURSEMENT'],
      priority_level: [0],
      disability_category: [''],
      disability_code: [''],
      pre_auth_required: [false],
      pre_auth_no: [''],
      document_received_at: [new Date().toISOString().split('T')[0]],
      total_billed: [0, [Validators.required, Validators.min(0)]],
      payee_name: [''],
      payee_ic_no: [''],
      payee_bank_name: [''],
      payee_bank_account_no: [''],
      expenses: this.fb.array([]),
      documents: this.fb.array([]),
      claim_status: ['PENDING'],
      total_approved: [0, [Validators.min(0)]],
      rejection_reason: [''],
      is_ec_case: [false],
      ec_status: [''],
      ec_notification_date: [''],
      ec_closed_date: ['']
    });

    this.createForm.get('claim_status')?.valueChanges.subscribe(status => {
      const reasonCtrl = this.createForm.get('rejection_reason');
      if (status === 'REJECTED') {
        reasonCtrl?.setValidators([Validators.required]);
      } else {
        reasonCtrl?.clearValidators();
      }
      reasonCtrl?.updateValueAndValidity();
    });

    this.createForm.get('member_id')?.valueChanges.subscribe(memberId => {
      this.loadDependents(memberId);
    });

    this.createForm.get('patient_type')?.valueChanges.subscribe(patientType => {
      if (patientType === 'PRINCIPAL') {
        this.createForm.get('patient_id')?.setValue('');
      }
    });
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.endsWith('/new') || url.includes('/claims/new')) {
      this.isCreateMode = true;
      this.loadLookups();
      this.loadCreateDropdowns();
      return;
    }

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.claimId = +params['id'];
        if (this.route.snapshot.queryParamMap.get('mode') === 'edit') {
          this.isCreateMode = true;
        }

        // Load all dropdowns AND claim data in parallel so that when we patch
        // the form, every select already has its options available.
        forkJoin({
          statuses:  this.lookupService.getLookupByCategory('CLAIM_STATUS').pipe(catchError(() => of([]))),
          diagnoses: this.lookupService.getLookupByCategory('DIAGNOSIS_CATEGORY').pipe(catchError(() => of([]))),
          benefits:  this.lookupService.getLookupByCategory('BENEFIT_CATEGORY').pipe(catchError(() => of([]))),
          docTypes:  this.lookupService.getLookupByCategory('CLAIM_DOCUMENT_TYPE').pipe(catchError(() => of([]))),
          members:   this.memberService.getMembers({ limit: 500 } as any).pipe(catchError(() => of({ members: [] }))),
          hospitals: this.hospitalService.getHospitals({ limit: 500 } as any).pipe(catchError(() => of({}))),
          banks:     this.bankService.getBanks({ limit: 500, is_active: true }).pipe(catchError(() => of({ banks: [] }))),
          claim:     this.claimService.getClaimById(this.claimId)
        }).subscribe({
          next: ({ statuses, diagnoses, benefits, docTypes, members, hospitals, banks, claim }) => {
            this.claimStatuses      = (statuses as any) || [];
            this.diagnosisCategories = (diagnoses as any) || [];
            this.benefitCategories  = (benefits as any) || [];
            this.documentTypes      = (docTypes as any) || [];
            this.members    = (members as any).members || [];
            this.hospitals  = (hospitals as any).data || (hospitals as any).hospitals || [];
            this.banks      = (banks as any).banks || [];

            if (claim.success && claim.data) {
              this.claimData = claim.data;
              this.patchCreateForm(claim.data);
              if (!this.isCreateMode) this.createForm.disable();
              
              // Load expenses and documents for view mode
              this.loadClaimExpenses(this.claimId);
              this.loadClaimDocuments(this.claimId);
            }
          },
          error: () => this.toastService.error('Failed to load claim')
        });
      }
    });
  }

  /**
   * Load expenses for the claim (view mode + populate FormArray for edit mode)
   */
  private loadClaimExpenses(claimId: number): void {
    this.loadingExpenses = true;
    this.claimService.getClaimExpenses(claimId).subscribe({
      next: (res) => {
        this.claimExpenses = res.data || [];
        this.loadingExpenses = false;
        
        // If in edit mode, populate the FormArray
        if (this.isCreateMode && this.claimExpenses.length > 0) {
          // Clear existing expenses
          while (this.expenses.length > 0) {
            this.expenses.removeAt(0);
          }
          
          // Add each expense to FormArray
          this.claimExpenses.forEach(expense => {
            this.expenses.push(this.fb.group({
              expense_id: [expense.expense_id || null], // ID from ccms_remarks
              benefit_category: [expense.benefit_category || '', Validators.required],
              description: [expense.description || ''],
              billed_amt: [expense.billed_amt || null, [Validators.min(0)]],
              receipt_no: [expense.receipt_no || ''],
              receipt_date: [expense.receipt_date || '']
            }));
          });
          
          // Reset deletion arrays on fresh load
          this.deletedExpenseIds = [];
          
          // Recalculate total
          this.updateTotalBilled();
        }
      },
      error: (err) => {
        console.error('Failed to load expenses:', err);
        this.claimExpenses = [];
        this.loadingExpenses = false;
      }
    });
  }

  /**
   * Load documents for the claim (view mode + populate FormArray for edit mode)
   */
  private loadClaimDocuments(claimId: number): void {
    this.loadingDocuments = true;
    this.claimService.getClaimDocuments(claimId).subscribe({
      next: (res) => {
        this.claimDocuments = res.data || [];
        this.loadingDocuments = false;
        
        // If in edit mode, populate the FormArray
        if (this.isCreateMode && this.claimDocuments.length > 0) {
          // Clear existing documents
          while (this.documents.length > 0) {
            this.documents.removeAt(0);
          }
          
          // Add each document to FormArray with file_path preserved
          this.claimDocuments.forEach(doc => {
            this.documents.push(this.fb.group({
              doc_type: [doc.doc_category || '', Validators.required],
              doc_name: [doc.file_name || '', Validators.required],
              remarks: [doc.remarks || ''],
              selected_file: [doc.file_name || ''], // Show existing filename
              existing_file_path: [doc.file_path || ''], // Store file_path for viewing
              doc_id: [doc.doc_id || null] // Track existing document ID
            }));
          });

          // Reset deletion arrays on fresh load
          this.deletedDocumentIds = [];
        }
      },
      error: (err) => {
        console.error('Failed to load documents:', err);
        this.claimDocuments = [];
        this.loadingDocuments = false;
      }
    });
  }

  loadLookups(): void {
    this.lookupService.getLookupByCategory('CLAIM_STATUS').subscribe({
      next: (data) => { this.claimStatuses = data || []; },
      error: (err) => console.error('Failed to load CLAIM_STATUS:', err)
    });
    this.lookupService.getLookupByCategory('DIAGNOSIS_CATEGORY').subscribe({
      next: (data) => { this.diagnosisCategories = data || []; },
      error: (err) => console.error('Failed to load DIAGNOSIS_CATEGORY:', err)
    });
    this.lookupService.getLookupByCategory('BENEFIT_CATEGORY').subscribe({
      next: (data) => { this.benefitCategories = data || []; },
      error: (err) => console.error('Failed to load BENEFIT_CATEGORY:', err)
    });
    this.lookupService.getLookupByCategory('CLAIM_DOCUMENT_TYPE').subscribe({
      next: (data) => { this.documentTypes = data || []; },
      error: (err) => console.error('Failed to load CLAIM_DOCUMENT_TYPE:', err)
    });
  }

  loadCreateDropdowns(): void {
    this.memberService.getMembers({ limit: 500 } as any).subscribe({
      next: (res) => { this.members = res.members || []; },
      error: () => this.toastService.error('Failed to load members')
    });
    this.hospitalService.getHospitals({ limit: 500 } as any).subscribe({
      next: (res) => { this.hospitals = (res as any).data || (res as any).hospitals || []; },
      error: () => this.toastService.error('Failed to load hospitals')
    });
    this.bankService.getBanks({ limit: 500, is_active: true }).subscribe({
      next: (res) => { this.banks = res.banks || []; },
      error: () => this.toastService.error('Failed to load banks')
    });
  }

  loadDependents(memberId: string | number): void {
    if (!memberId) { this.dependents = []; this.policies = []; return; }
    this.memberService.getDependentsByMemberId(String(memberId)).subscribe({
      next: (deps) => { this.dependents = deps || []; },
      error: () => { this.dependents = []; }
    });
    this.memberService.getPoliciesByMemberId(String(memberId)).subscribe({
      next: (pols: any) => { this.policies = pols || []; },
      error: () => { this.policies = []; }
    });
  }

  loadClaim(id: number): void {
    if (!id) return;
    this.claimService.getClaimById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.claimData = res.data;
          this.patchCreateForm(res.data);
          if (!this.isCreateMode) {
            this.createForm.disable();
          }
        }
      },
      error: () => this.toastService.error('Failed to load claim details')
    });
    this.loadClaimExpenses(id);
    this.loadClaimDocuments(id);
  }

  patchCreateForm(data: Claim): void {
    const docDate = data.document_received_at
      ? new Date(data.document_received_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Use emitEvent:false so member_id valueChanges does NOT fire loadDependents
    // (we handle dependent loading manually below to ensure patient_id is set after options load)
    this.createForm.patchValue({
      member_id: data.member_id ? String(data.member_id) : '',
      hospital_id: data.hospital_id || '',
      patient_type: data.patient_type || 'PRINCIPAL',
      patient_id: '',
      disability_category: data.disability_category || '',
      document_received_at: docDate,
      total_billed: data.total_billed || 0,
      payee_name: data.payee_name || '',
      payee_ic_no: data.payee_ic_no || '',
      payee_bank_name: data.payee_bank_name || '',
      payee_bank_account_no: data.payee_bank_account_no || '',
      claim_status: data.claim_status || 'PENDING',
      total_approved: data.total_approved || 0,
      rejection_reason: data.rejection_reason || '',
      is_ec_case: data.is_ec_case || false,
      ec_status: data.ec_status || '',
      ec_notification_date: data.ec_notification_date ? new Date(data.ec_notification_date).toISOString().slice(0, 16) : '',
      ec_closed_date: data.ec_closed_date ? new Date(data.ec_closed_date).toISOString().slice(0, 16) : ''
    }, { emitEvent: false });

    // Load dependents, then set patient_id so the select has options before the value is applied
    if (data.member_id) {
      this.memberService.getDependentsByMemberId(String(data.member_id)).subscribe({
        next: (deps) => {
          this.dependents = deps || [];
          if (data.patient_type === 'DEPENDENT' && data.patient_id) {
            // Use String() to ensure it matches the [value] type in the select options
            this.createForm.get('patient_id')?.setValue(String(data.patient_id), { emitEvent: false });
          }
        },
        error: () => { this.dependents = []; }
      });
      this.memberService.getPoliciesByMemberId(String(data.member_id)).subscribe({
        next: (pols: any) => { this.policies = pols || []; },
        error: () => { this.policies = []; }
      });
    }
  }

  onCreateSubmit(): void {
    if (this.createForm.invalid) return;
    this.saving = true;
    const fv = this.createForm.value;

    if (this.claimId > 0) {
      // UPDATE existing claim
      const dto: UpdateClaimDto = {
        claim_status: fv.claim_status,
        member_id: fv.member_id ? +fv.member_id : undefined,
        hospital_id: fv.hospital_id ? +fv.hospital_id : undefined,
        patient_type: fv.patient_type || 'PRINCIPAL',
        patient_id: fv.patient_type === 'DEPENDENT' && fv.patient_id ? +fv.patient_id : undefined,
        disability_category: fv.disability_category || undefined,
        total_billed: fv.total_billed,
        total_approved: fv.total_approved,
        payee_name: fv.payee_name,
        payee_ic_no: fv.payee_ic_no,
        payee_bank_name: fv.payee_bank_name,
        payee_bank_account_no: fv.payee_bank_account_no,
        is_ec_case: fv.is_ec_case || false,
        ec_status: fv.is_ec_case ? fv.ec_status : undefined
      };
      if (fv.document_received_at) dto.document_received_at = new Date(fv.document_received_at).toISOString();
      if (fv.claim_status === 'REJECTED') dto.rejection_reason = fv.rejection_reason;
      if (fv.is_ec_case && fv.ec_notification_date) dto.ec_notification_date = new Date(fv.ec_notification_date).toISOString();
      if (fv.is_ec_case && fv.ec_status === 'CLOSED' && fv.ec_closed_date) dto.ec_closed_date = new Date(fv.ec_closed_date).toISOString();

      this.claimService.updateClaim(this.claimId, dto).subscribe({
        next: (res) => {
          if (res.success) {
            // After update, save expenses and documents
            this.saveExpensesAndDocuments(this.claimId);
          }
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Failed to update claim');
          this.saving = false;
        }
      });
      return;
    }

    // CREATE new claim
    const dto: CreateClaimDto = {
      member_id: +fv.member_id,
      hospital_id: +fv.hospital_id,
      patient_type: fv.patient_type || 'PRINCIPAL',
      patient_id: fv.patient_type === 'DEPENDENT' && fv.patient_id ? +fv.patient_id : undefined,
      disability_category: fv.disability_category || undefined,
      total_billed: fv.total_billed || 0,
      payee_name: fv.payee_name || undefined,
      payee_ic_no: fv.payee_ic_no || undefined,
      payee_bank_name: fv.payee_bank_name || undefined,
      payee_bank_account_no: fv.payee_bank_account_no || undefined
    };
    if (fv.document_received_at) {
      dto.document_received_at = new Date(fv.document_received_at).toISOString();
    }

    this.claimService.createClaim(dto).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const newId = (res.data as any)?.claim_id;
          if (newId) {
            // After creating, save expenses and documents (this method also handles navigation)
            this.saveExpensesAndDocuments(newId);
          } else {
            const claimRef = (res.data as any)?.claim_ref_no || '';
            const createdId = (res.data as any)?.claim_id;
            this.toastService.success(`Claim ${claimRef} created successfully`);
            this.saving = false;
            
            if (createdId) {
              this.router.navigate([APP_ROUTES.CLAIMS.DETAIL(createdId)]);
            } else {
              this.router.navigate([APP_ROUTES.CLAIMS.LIST]);
            }
          }
        }
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to create claim');
        this.saving = false;
      }
    });
  }

  onDeleteClaim(): void {
    if (!this.claimData || this.claimId === 0) return;
    
    if (confirm('Are you sure you want to delete this claim? This action cannot be undone.')) {
      this.saving = true;
      this.claimService.deleteClaim(this.claimId).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Claim deleted successfully');
            this.router.navigate([APP_ROUTES.CLAIMS.LIST]);
          } else {
            this.toastService.error(res.message || 'Failed to delete claim');
            this.saving = false;
          }
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error deleting claim');
          this.saving = false;
        }
      });
    }
  }

  /**
   * Save expenses and documents after claim is created/updated
   * Handles additions, updates (for dirty records), and deletions
   */
  private saveExpensesAndDocuments(claimId: number): void {
    const operations: Observable<any>[] = [];

    // 1. EXPENSES: Additions and Updates
    this.expenses.controls.forEach(ctrl => {
      const fv = ctrl.value;
      const expenseId = fv.expense_id;
      
      if (!expenseId) {
        // Simple case: no ID means it's a newly added item in current form session
        if (fv.benefit_category && fv.billed_amt) {
          operations.push(this.claimService.addClaimExpense(claimId, {
            benefit_category: fv.benefit_category,
            description: fv.description || '',
            billed_amt: parseFloat(fv.billed_amt) || 0,
            receipt_no: fv.receipt_no || '',
            receipt_date: fv.receipt_date || ''
          }));
        }
      } else if (ctrl.dirty) {
        // ID exists and record was modified (dirty)
        operations.push(this.claimService.updateClaimExpense(claimId, expenseId, {
          benefit_category: fv.benefit_category,
          description: fv.description || '',
          billed_amt: parseFloat(fv.billed_amt) || 0,
          receipt_no: fv.receipt_no || '',
          receipt_date: fv.receipt_date || ''
        }));
      }
    });

    // 2. EXPENSES: Deletions
    this.deletedExpenseIds.forEach(id => {
      operations.push(this.claimService.deleteClaimExpense(claimId, id));
    });

    // 3. DOCUMENTS: Logic for additions, replacements and deletions
    this.documents.controls.forEach(doc => {
      const docId = doc.get('doc_id')?.value;
      const fileCtrl = doc.get('selected_file');
      const existingFilePath = doc.get('existing_file_path')?.value;
      
      // Case 1: Existing document with NEW file selected - delete old, upload new
      if (docId && fileCtrl?.value instanceof File) {
        const file = fileCtrl.value as File;
        
        const deleteAndAdd = this.claimService.deleteClaimDocument(claimId, docId).pipe(
          switchMap(() => this.uploadService.uploadFile(file, 'claim-documents')),
          catchError(err => {
            console.error('File upload failed:', err);
            return of(null);
          }),
          switchMap(uploadResult => {
            const data = (uploadResult as any)?.data || uploadResult;
            if (data && (data.url || data.relativePath)) {
              return this.claimService.addClaimDocument(claimId, {
                file_name: doc.value.doc_name || data.originalName || file.name,
                doc_category: doc.value.doc_type,
                file_path: data.url || data.relativePath,
                file_extension: data.originalName?.split('.').pop() || file.name.split('.').pop() || '',
                file_size_bytes: data.size || file.size
              });
            }
            return of(null);
          })
        );
        operations.push(deleteAndAdd);
      }
      // Case 2: New document (no doc_id) with file selected - just add
      else if (!docId && fileCtrl?.value instanceof File) {
        const file = fileCtrl.value as File;
        
        const uploadAndAdd = this.uploadService.uploadFile(file, 'claim-documents').pipe(
          catchError(err => {
            console.error('File upload failed:', err);
            return of(null);
          }),
          switchMap(uploadResult => {
            const data = (uploadResult as any)?.data || uploadResult;
            if (data && (data.url || data.relativePath || data.fileName)) {
              return this.claimService.addClaimDocument(claimId, {
                file_name: doc.value.doc_name || data.originalName || data.fileName || data.original_name || file.name,
                doc_category: doc.value.doc_type,
                file_path: data.url || data.relativePath || data.fileName || '',
                file_extension: (data.originalName || data.fileName || file.name).split('.').pop() || '',
                file_size_bytes: data.size || file.size
              });
            }
            return of(null);
          })
        );
        operations.push(uploadAndAdd);
      }
      // Case 3: Metadata update (not implemented for simplicity here, assume keep as is)
    });

    // 4. DOCUMENTS: Deletions
    this.deletedDocumentIds.forEach(id => {
      operations.push(this.claimService.deleteClaimDocument(claimId, id));
    });

    if (operations.length === 0) {
      this.toastService.success('Claim saved successfully');
      this.saving = false;
      this.router.navigate([APP_ROUTES.CLAIMS.DETAIL(claimId)]);
      return;
    }

    forkJoin(operations).subscribe({
      next: () => {
        this.toastService.success(this.claimId > 0 ? 'Claim updated successfully' : 'Claim created successfully');
        this.saving = false;
        
        // Navigation back to view mode
        if (this.claimId > 0) {
           this.exitEditMode();
           this.loadClaim(this.claimId); // Refresh data to show in view mode
        } else {
           this.router.navigate([APP_ROUTES.CLAIMS.DETAIL(claimId)]);
        }
      },
      error: (err) => {
        console.error('Save operations failed:', err);
        this.toastService.error('Claim saved but some attachments/expenses failed');
        this.saving = false;
        
        if (this.claimId > 0) {
           this.exitEditMode();
           this.loadClaim(this.claimId);
        } else {
           this.router.navigate([APP_ROUTES.CLAIMS.DETAIL(claimId)]);
        }
      }
    });
  }


  enterEditMode(): void {
    this.isCreateMode = true;
    this.createForm.enable();
    // All dropdowns already loaded via forkJoin on init — just re-patch the form
    if (this.claimData) {
      this.patchCreateForm(this.claimData);
    }
    
    // Load expenses and documents into FormArrays for editing
    if (this.claimId > 0) {
      this.loadClaimExpenses(this.claimId);
      this.loadClaimDocuments(this.claimId);
    }
    
    this.router.navigate([], { queryParams: { mode: 'edit' }, replaceUrl: true });
  }

  exitEditMode(): void {
    this.isCreateMode = false;
    this.createForm.disable();
    this.router.navigate([], { queryParams: { mode: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  goBack(): void {
    this.router.navigate([APP_ROUTES.CLAIMS.LIST]);
  }

  get expenses(): FormArray {
    return this.createForm.get('expenses') as FormArray;
  }

  addExpense(): void {
    this.expenses.push(this.fb.group({
      expense_id: [null],
      benefit_category: ['', Validators.required],
      description: [''],
      billed_amt: [null, [Validators.min(0)]],
      receipt_no: [''],
      receipt_date: ['']
    }));
    this.updateTotalBilled();
  }

  removeExpense(index: number): void {
    const expenseId = this.expenses.at(index).get('expense_id')?.value;
    if (expenseId) {
      this.deletedExpenseIds.push(expenseId);
    }
    this.expenses.removeAt(index);
    this.updateTotalBilled();
  }

  updateTotalBilled(): void {
    const total = this.expenses.controls.reduce((sum, ctrl) => {
      return sum + (parseFloat(ctrl.get('billed_amt')?.value) || 0);
    }, 0);
    this.createForm.get('total_billed')?.setValue(total, { emitEvent: false });
  }

  onExpenseAmountChange(): void {
    this.updateTotalBilled();
  }

  getBenefitCategoryLabel(code: string): string {
    const cat = this.benefitCategories.find(c => c.lookup_code === code);
    return cat ? cat.lookup_value : code;
  }

  get documents(): FormArray {
    return this.createForm.get('documents') as FormArray;
  }

  addDocument(): void {
    this.documents.push(this.fb.group({
      doc_type: ['', Validators.required],
      doc_name: ['', Validators.required],
      remarks: [''],
      selected_file: [''],
      existing_file_path: [''], // For existing documents
      doc_id: [null] // Track if this is an existing document
    }));
  }

  onDocumentFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const docGroup = this.documents.at(index);
      // Store the File object for later upload AND for preview
      docGroup.get('selected_file')?.setValue(file);
      this.documentFileObjects.set(index, file);
      if (!docGroup.get('doc_name')?.value) {
        docGroup.get('doc_name')?.setValue(file.name);
      }
    }
  }

  /**
   * Check if a document at given index can be viewed
   */
  canViewDocument(index: number): boolean {
    // Check if there's a File object (newly selected)
    if (this.documentFileObjects.has(index)) {
      return true;
    }
    
    // Check if there's an existing document with file_path (from form control)
    if (this.documents && this.documents.length > index) {
      const docGroup = this.documents.at(index);
      const existingFilePath = docGroup?.get('existing_file_path')?.value;
      if (existingFilePath) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * View/Preview a document
   */
  viewDocument(index: number): void {
    // Check for newly selected file (File object)
    if (this.documentFileObjects.has(index)) {
      const file = this.documentFileObjects.get(index)!;
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
      // Clean up the object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
      return;
    }
    
    // Check for existing document file_path (from form control)
    const docGroup = this.documents.at(index);
    const existingFilePath = docGroup?.get('existing_file_path')?.value;
    if (existingFilePath) {
      window.open(existingFilePath, '_blank');
      return;
    }
    
    this.toastService.error('No file available to view');
  }

  /**
   * Get display name for document file
   */
  getDocumentFileName(index: number): string {
    const formValue = this.documents.at(index).get('selected_file')?.value;
    
    // If it's a File object, get its name
    if (formValue instanceof File) {
      return formValue.name;
    }
    
    // If it's a string (from edit mode), return it
    if (typeof formValue === 'string' && formValue) {
      return formValue;
    }
    
    return 'No file chosen';
  }

  /**
   * Check if document has filename but missing actual file
   */
  hasFileMissingWarning(index: number): boolean {
    // Skip warning if there's a newly selected file
    if (this.documentFileObjects.has(index)) {
      return false;
    }
    
    const docGroup = this.documents.at(index);
    const fileName = docGroup?.get('selected_file')?.value;
    const filePath = docGroup?.get('existing_file_path')?.value;
    
    // Warning: has filename but no file path (file never uploaded)
    return !!fileName && fileName !== 'No file chosen' && !filePath;
  }

  removeDocument(index: number): void {
    const docId = this.documents.at(index).get('doc_id')?.value;
    if (docId) {
      this.deletedDocumentIds.push(docId);
    }
    // Clean up File object if exists
    if (this.documentFileObjects.has(index)) {
      this.documentFileObjects.delete(index);
    }
    this.documents.removeAt(index);
  }

  // View mode helper methods
  switchTab(tabId: string): void {
    this.activeTab = tabId;
  }

  formatStatus(status: string | null | undefined): string {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getMemberName(): string {
    const member = this.members.find(m => String(m.member_id) === String(this.claimData?.member_id));
    return member ? `${member.full_name} (${member.ic_no})` : 'N/A';
  }

  getPatientName(): string {
    const patient = this.dependents.find(d => String(d.dependent_id) === String(this.claimData?.patient_id));
    return patient ? `${patient.full_name} (${patient.ic_no || 'No IC'})` : 'N/A';
  }

  getHospitalName(): string {
    const hospital = this.hospitals.find(h => String(h.hospital_id) === String(this.claimData?.hospital_id));
    return hospital ? hospital.hospital_name : 'N/A';
  }

  getLookupValue(lookups: LookupItem[], code: string | null | undefined): string {
    if (!code) return 'N/A';
    const lookup = lookups.find(l => l.lookup_code === code);
    return lookup ? lookup.lookup_value : code;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
