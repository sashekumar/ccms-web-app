import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AdmissionService } from '../../../core/services/admission.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { LookupService } from '../../../shared/services/lookup.service';

import { Admission, AdmissionWithRemarks, AdmissionRemark, RespondToMQDto, AdmissionAssessment, AssessmentFieldDto, UpsertAssessmentDto, ASSESSMENT_FIELDS } from '../../../shared/models/admission.model';
import { LookupItem } from '../../../shared/services/lookup.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';
import { APP_ROUTES } from '../../../core/constants/routes.constants';
import { MqBuilderModalComponent } from '../../../shared/components/mq-builder-modal/mq-builder-modal.component';
import { MqPrintService } from '../../../core/services/mq-print.service';
import { UploadService } from '../../../core/services/upload.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    HasPermissionDirective,
    MqBuilderModalComponent,
    FormsModule
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
            <h1 class="text-3xl font-bold text-gray-900">Admission Details</h1>
            <p class="mt-2 text-sm text-gray-600" *ngIf="admission">
              {{ admission.claim_ref_no || 'N/A' }} - {{ admission.member_name }}
            </p>
          </div>
          <div class="flex space-x-3">
            <!-- Edit Button -->
            <ng-container *hasPermission="PERMISSIONS.UPDATE">
              <button
                *ngIf="admission && !admission.is_deleted && canEdit(admission.admission_status)"
                (click)="editAdmission()"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72]">
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
              </button>
            </ng-container>

            <!-- Approve Button -->
            <ng-container *hasPermission="PERMISSIONS.APPROVE">
              <button
                *ngIf="admission && !admission.is_deleted && canApprove(admission.admission_status)"
                (click)="approveAdmission()"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Approve
              </button>
            </ng-container>

            <!-- Reject Button -->
            <ng-container *hasPermission="PERMISSIONS.APPROVE">
              <button
                *ngIf="admission && !admission.is_deleted && canReject(admission.admission_status)"
                (click)="rejectAdmission()"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Reject
              </button>
            </ng-container>

            <!-- Send MQ Button -->
            <ng-container *hasPermission="PERMISSIONS_MQ.MANAGE">
              <button
                *ngIf="admission && !admission.is_deleted && canSendMQ(admission.admission_status)"
                (click)="sendMedicalQuery()"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Send MQ
              </button>
            </ng-container>

            <!-- Defer Button -->
            <ng-container *hasPermission="PERMISSIONS.APPROVE">
              <button
                *ngIf="admission && !admission.is_deleted && canDefer(admission.admission_status)"
                (click)="deferAdmission()"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Defer
              </button>
            </ng-container>

            <!-- Resolve Deferment Button -->
            <ng-container *hasPermission="PERMISSIONS.APPROVE">
              <button
                *ngIf="admission && !admission.is_deleted && canResolveDeferment(admission.deferment_status)"
                (click)="resolveDeferment()"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resolve Deferment
              </button>
            </ng-container>

            <!-- Delete Button -->
            <ng-container *hasPermission="PERMISSIONS.DELETE">
              <button
                *ngIf="admission && !admission.is_deleted && canDelete(admission.admission_status)"
                (click)="deleteAdmission()"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
              </button>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Loading Spinner -->
      <app-loading-spinner *ngIf="loading"></app-loading-spinner>

      <!-- Content -->
      <div *ngIf="!loading && admission">
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
          <!-- Admission Info Tab -->
          <div *ngIf="activeTab === 'info'">
            <!-- Status Badge -->
            <div class="mb-6">
              <span 
                [ngClass]="{
                  'bg-yellow-100 text-yellow-800': admission.admission_status === 'PENDING_APPROVAL' || admission.admission_status === 'PENDING_MQ',
                  'bg-green-100 text-green-800': admission.admission_status === 'APPROVED',
                  'bg-red-100 text-red-800': admission.admission_status === 'REJECTED',
                  'bg-blue-100 text-blue-800': admission.admission_status === 'MQ_RESPONDED',
                  'bg-gray-100 text-gray-800': !admission.admission_status
                }"
                class="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full">
                {{ formatStatus(admission.admission_status) }}
              </span>
              <span *ngIf="admission.is_deleted" class="ml-2 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                Deleted
              </span>
            </div>

            <!-- GL Reference (if approved) -->
            <div *ngIf="admission.gl_ref_no" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm font-medium text-green-900">GL Reference:</span>
                <span class="ml-2 text-sm font-mono text-green-900">{{ admission.gl_ref_no }}</span>
              </div>
            </div>

            <!-- Admission Details Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Claim Information -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Claim Information</h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Claim Reference</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ admission.claim_ref_no || 'N/A' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Member Name</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ admission.member_name }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Hospital</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ admission.hospital_name }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Admission Dates -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Admission Dates</h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Admission Date</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ admission.admission_date | date:'dd/MM/yyyy' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Discharge Date</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ admission.discharge_date ? (admission.discharge_date | date:'dd/MM/yyyy') : 'Not discharged' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Length of Stay (Days)</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ getLOS(admission) }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Admission Type & Room -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Admission Details</h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Admission Type</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ getLookupName(admissionTypes, admission.admission_type) }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Room Type</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ getLookupName(roomTypes, admission.room_type) }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Room Rate</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ admission.room_rate ? (admission.room_rate | currency:'MYR':'symbol':'1.2-2') : 'N/A' }}</dd>
                  </div>
                </dl>
              </div>

              <!-- ICU Details -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">ICU Details</h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">ICU Days</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ admission.icu_days || '0' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">ICU Rate</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ admission.icu_rate ? (admission.icu_rate | currency:'MYR':'symbol':'1.2-2') : 'N/A' }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Status & Flags -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Status & Alerts</h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">EHM Status</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ getLookupName(ehmStatuses, admission.ehm_status) }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Deferment Status</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ getLookupName(defermentStatuses, admission.deferment_status) }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Alert Flag</dt>
                    <dd class="mt-1">
                      <span *ngIf="admission.alert_flag" class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        ALERT
                      </span>
                      <span *ngIf="!admission.alert_flag" class="text-sm text-gray-500">No alert</span>
                    </dd>
                  </div>
                </dl>
              </div>

              <!-- Audit Information -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Audit Information</h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Created At</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ admission.created_at | date:'dd/MM/yyyy HH:mm:ss' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Created By</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ admission.created_by_username || admission.created_by || 'N/A' }}</dd>
                  </div>
                  <div *ngIf="admission.updated_at">
                    <dt class="text-sm font-medium text-gray-500">Updated At</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ admission.updated_at | date:'dd/MM/yyyy HH:mm:ss' }}</dd>
                  </div>
                  <div *ngIf="admission.updated_by">
                    <dt class="text-sm font-medium text-gray-500">Updated By</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ admission.updated_by_username || admission.updated_by }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <!-- Workflow History Tab -->
          <div *ngIf="activeTab === 'history'">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Workflow History</h3>
            
            <div *ngIf="loadingRemarks" class="text-center py-8">
              <app-loading-spinner></app-loading-spinner>
            </div>

            <div *ngIf="!loadingRemarks && remarks.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No workflow history</h3>
              <p class="mt-1 text-sm text-gray-500">This admission has no workflow history yet.</p>
            </div>

            <div *ngIf="!loadingRemarks && remarks.length > 0" class="space-y-4">
              <div *ngFor="let remark of remarks" class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-150">
                <div class="flex items-start">
                  <!-- Icon based on action -->
                  <div class="flex-shrink-0">
                    <div 
                      [ngClass]="{
                        'bg-green-100 text-green-600': remark.action_for === 'APPROVAL',
                        'bg-red-100 text-red-600': remark.action_for === 'REJECTION',
                        'bg-blue-100 text-blue-600': remark.action_for === 'MQ_SENT',
                        'bg-indigo-100 text-indigo-600': remark.action_for === 'MQ_RESPONSE',
                        'bg-yellow-100 text-yellow-600': remark.action_for === 'DEFERMENT',
                        'bg-purple-100 text-purple-600': remark.action_for === 'DEFERMENT_RESOLVED',
                        'bg-cyan-100 text-cyan-600': remark.action_for === 'CREATION',
                        'bg-gray-100 text-gray-600': !remark.action_for
                      }"
                      class="rounded-full p-2">
                      <svg *ngIf="remark.action_for === 'APPROVAL'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <svg *ngIf="remark.action_for === 'REJECTION'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <svg *ngIf="remark.action_for === 'MQ_SENT'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <svg *ngIf="remark.action_for === 'MQ_RESPONSE'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <svg *ngIf="remark.action_for === 'DEFERMENT'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <svg *ngIf="remark.action_for === 'DEFERMENT_RESOLVED'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <svg *ngIf="remark.action_for === 'CREATION'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      <svg *ngIf="!remark.action_for || (remark.action_for !== 'APPROVAL' && remark.action_for !== 'REJECTION' && remark.action_for !== 'MQ_SENT' && remark.action_for !== 'MQ_RESPONSE' && remark.action_for !== 'DEFERMENT' && remark.action_for !== 'DEFERMENT_RESOLVED' && remark.action_for !== 'CREATION')" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>

                  <!-- Content -->
                  <div class="ml-4 flex-1">
                    <div class="flex items-center justify-between">
                      <h4 class="text-sm font-medium text-gray-900">{{ formatAction(remark.action_for) }}</h4>
                      <span class="text-xs text-gray-500">{{ remark.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    <p class="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{{ remark.remark_text }}</p>
                    
                    <!-- Attachment Link in History -->
                    <div *ngIf="getAttachmentUrl(remark)" class="mt-3 flex items-center">
                      <a 
                        [href]="getAttachmentUrl(remark)" 
                        target="_blank"
                        class="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all border border-slate-200"
                      >
                        <svg class="w-3.5 h-3.5 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        View Attachment
                      </a>
                    </div>
                    
                    <p class="mt-1 text-xs text-gray-500">by {{ remark.created_by_username || remark.created_by || 'System' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Medical Queries Tab (Management) -->
          <div *ngIf="activeTab === 'queries'">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-bold text-gray-900">Generated Medical Questionnaires</h3>
                <p class="text-xs text-gray-500 mt-1">Manage and track manual status of sent MQs</p>
              </div>
              <button 
                *ngIf="admission && canSendMQ(admission.admission_status)"
                (click)="sendMedicalQuery()"
                class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-all"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                New Query
              </button>
            </div>

            <div *ngIf="getFilteredMQRemarks().length === 0" class="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div class="p-6 bg-white rounded-full inline-block mb-4 shadow-sm">
                <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">No MQs generated yet</h3>
              <p class="text-sm text-gray-500 mt-1">Start by adding a new medical questionnaire</p>
            </div>

            <div *ngIf="getFilteredMQRemarks().length > 0" class="space-y-6">
              <div *ngFor="let mq of getFilteredMQRemarks(); let i = index" class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div class="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                  <div class="flex items-center space-x-4">
                    <div>
                      <h4 class="text-sm font-bold text-gray-900">Medical Questionnaire</h4>
                      <p class="text-xs text-gray-500">{{ mq.created_at | date:'dd MMM yyyy, HH:mm' }}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-3">
                    <!-- Status Indicator/Management -->
                    <ng-container *ngIf="getLatestMQStatus(mq) !== 'CLOSED'; else closedBadge">
                      <select 
                        (change)="updateMQStatus(mq, $any($event.target).value)" 
                        class="text-xs font-bold px-3 py-1.5 rounded-lg border-gray-200 focus:ring-blue-500 bg-white"
                        [ngClass]="{
                          'text-yellow-600 bg-yellow-50': (getLatestMQStatus(mq) === 'SENT' || getLatestMQStatus(mq) === 'FOLLOW_UP'),
                          'text-blue-600 bg-blue-50': getLatestMQStatus(mq) === 'RECEIVED'
                        }"
                      >
                        <option value="SENT" [selected]="getLatestMQStatus(mq) === 'SENT'">SENT</option>
                        <option value="FOLLOW_UP" [selected]="getLatestMQStatus(mq) === 'FOLLOW_UP'">FOLLOW UP</option>
                        <option value="RECEIVED" disabled [selected]="getLatestMQStatus(mq) === 'RECEIVED'">RECEIVED (AUTO)</option>
                        <option value="CLOSED" [disabled]="getLatestMQStatus(mq) !== 'RECEIVED'">RESOLVE / CLOSE</option>
                      </select>
                    </ng-container>

                    <ng-template #closedBadge>
                      <div class="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-black uppercase tracking-wider flex items-center border border-green-100">
                        <svg class="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                        Closed / Resolved
                      </div>
                    </ng-template>

                    <button 
                      (click)="viewMQ(mq)"
                      class="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100"
                      title="View Details"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>

                    <button 
                      (click)="downloadMQ(mq)"
                      class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100"
                      title="Download MQ PDF"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5m0 0l5-5m-5 5V3" /></svg>
                    </button>

                    <button 
                      *ngIf="canRespondToMQ(mq)"
                      (click)="openResponseModal(mq)"
                      class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center shadow-sm"
                    >
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                      Respond
                    </button>
                  </div>
                </div>
                <div class="p-5">
                  <!-- Query Text -->
                  <p class="text-sm text-gray-600 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap font-medium mb-3">
                    {{ mq.remark_text }}
                  </p>
                  
                  <!-- Response Section -->
                  <div *ngIf="getMQResponse(mq) as resp" class="mt-4 pt-4 border-t border-gray-100">
                    <div class="flex items-center space-x-2 mb-2">
                      <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      <span class="text-[10px] font-black text-green-600 uppercase tracking-widest">Hospital Response Received</span>
                      <span class="text-[10px] text-gray-400 ml-auto">{{ resp.created_at | date:'dd MMM yyyy, HH:mm' }}</span>
                    </div>
                    <div class="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                      <p class="text-xs text-slate-800 font-bold whitespace-pre-wrap">
                        {{ getCleanResponse(resp.remark_text) }}
                      </p>
                      
                      <!-- Attachment from Response -->
                      <div *ngIf="getAttachmentUrl(resp)" class="mt-3 flex">
                        <a 
                          [href]="getAttachmentUrl(resp)" 
                          target="_blank"
                          class="inline-flex items-center px-3 py-1.5 bg-white text-emerald-700 rounded-lg text-xs font-black shadow-sm border border-emerald-100 hover:bg-emerald-100 transition-all"
                        >
                          <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                          Open Attached Documents
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Legacy/Manual Attachment Link (if no full response object but tag exists) -->
                  <div *ngIf="!getMQResponse(mq) && getAttachmentUrl(mq)" class="mt-3 flex items-center">
                    <a 
                      [href]="getAttachmentUrl(mq)" 
                      target="_blank"
                      class="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all border border-slate-200"
                    >
                      <svg class="w-3.5 h-3.5 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      View Scans / Attachment
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Assessment Tab -->
          <div *ngIf="activeTab === 'assessment'">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-bold text-gray-900">Clinical Assessment</h3>
                <p class="text-xs text-gray-500 mt-1">Diagnosis, medical necessity, and clinical notes</p>
              </div>
              <button
                *hasPermission="PERMISSIONS.UPDATE"
                (click)="saveAssessments()"
                [disabled]="savingAssessment || !assessmentDirty"
                class="inline-flex items-center px-4 py-2 bg-[#1e3c72] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#2a5298] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg *ngIf="!savingAssessment" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                <svg *ngIf="savingAssessment" class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                {{ savingAssessment ? 'Saving...' : 'Save Assessment' }}
              </button>
            </div>

            <!-- Loading -->
            <div *ngIf="loadingAssessment" class="flex justify-center py-20">
              <app-loading-spinner></app-loading-spinner>
            </div>

            <!-- Assessment Form -->
            <div *ngIf="!loadingAssessment" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ng-container *ngFor="let field of ASSESSMENT_FIELDS">
                <div [class.md:col-span-2]="field.type === 'textarea'" class="flex flex-col">
                  <label class="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">{{ field.label }}</label>

                  <!-- Text input -->
                  <input
                    *ngIf="field.type === 'text'"
                    type="text"
                    [(ngModel)]="assessmentForm[field.key]"
                    (ngModelChange)="onAssessmentChange()"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3c72] focus:border-transparent"
                    [placeholder]="'Enter ' + field.label"
                  />

                  <!-- Textarea -->
                  <textarea
                    *ngIf="field.type === 'textarea'"
                    rows="3"
                    [(ngModel)]="assessmentForm[field.key]"
                    (ngModelChange)="onAssessmentChange()"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3c72] focus:border-transparent resize-none"
                    [placeholder]="'Enter ' + field.label"
                  ></textarea>

                  <!-- Select -->
                  <select
                    *ngIf="field.type === 'select'"
                    [(ngModel)]="assessmentForm[field.key]"
                    (ngModelChange)="onAssessmentChange()"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3c72] focus:border-transparent"
                  >
                    <option value="">-- Select --</option>
                    <option *ngFor="let opt of $any(field).options" [value]="opt">{{ opt }}</option>
                  </select>
                </div>
              </ng-container>
            </div>
          </div>

        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading && !admission" class="bg-white shadow rounded-lg p-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Admission not found</h3>
        <p class="mt-1 text-sm text-gray-500">The admission you're looking for doesn't exist or has been deleted.</p>
        <div class="mt-6">
          <button
            (click)="goBack()"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#1e3c72] hover:bg-[#2a5298] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72]">
            Go Back
          </button>
        </div>
      </div>
    </div>

    <!-- MQ Builder Modal -->
    <app-mq-builder-modal
      [show]="showMqBuilder"
      [recipientType]="mqRecipientType"
      [refNo]="admission?.claim_ref_no || ''"
      [admissionId]="admission?.admission_id"
      (close)="showMqBuilder = false"
      (generate)="onMqGenerate($event)"
      (email)="onMqEmail($event)"
    ></app-mq-builder-modal>

    <!-- MQ Viewer Modal -->
    <div *ngIf="showMQViewModal" class="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Overlay -->
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" (click)="closeMQView()"></div>

        <!-- Center modal -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div class="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full animate-in fade-in zoom-in duration-200">
          <!-- Header -->
          <div class="bg-white px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="text-xl font-black text-slate-900 tracking-tight">Medical Questionnaire Details</h3>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Generated: {{ selectedMQ?.created_at | date:'dd MMM yyyy, HH:mm' }}</p>
            </div>
            <button (click)="closeMQView()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <!-- Body -->
          <div class="p-8">
            <div class="bg-blue-50/30 rounded-3xl p-8 border border-blue-100/50 mb-6">
              <div class="flex items-center space-x-2 mb-4">
                <span class="w-2 h-6 bg-blue-600 rounded-full"></span>
                <h4 class="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Sent Questionnaire Content</h4>
              </div>
              <p class="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium bg-white/50 p-6 rounded-2xl border border-white">
                {{ selectedMQ?.remark_text }}
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-slate-50/50 px-8 py-6 border-t border-slate-100 flex justify-end">
            <button (click)="closeMQView()" class="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-95">
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Response Modal -->
    <div *ngIf="showResponseModal" class="fixed inset-0 z-[9999] overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="showResponseModal = false"></div>
        <div class="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full animate-in fade-in zoom-in duration-200">
          <div class="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 flex items-center justify-between">
            <h3 class="text-xl font-bold text-white">Submit MQ Response</h3>
            <button (click)="showResponseModal = false" class="text-white/80 hover:text-white transition-all">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="p-8">
            <div class="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <span class="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Original Query Details</span>
              <p class="text-sm text-slate-700 line-clamp-2 italic">{{ respondingMQ?.remark_text }}</p>
            </div>

            <div class="mb-6">
              <label class="block text-sm font-bold text-slate-800 mb-2">Summary of Medical Info <span class="text-red-500">*</span></label>
              <textarea 
                [(ngModel)]="responseSummary"
                placeholder="Briefly describe the medical info received from the hospital..." 
                class="w-full px-4 py-3 rounded-xl border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 min-h-[120px] text-sm transition-all"
              ></textarea>
            </div>

            <div class="mb-6">
              <label class="block text-sm font-bold text-slate-800 mb-2">Attachment (Scanned Copy)</label>
              <div 
                (click)="fileInput.click()"
                class="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all group"
              >
                <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" accept=".pdf,.jpg,.jpeg,.png">
                <div *ngIf="!selectedFile" class="flex flex-col items-center">
                  <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg class="w-6 h-6 text-slate-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <p class="text-sm font-medium text-slate-600">Click to browse or drag and drop</p>
                  <p class="text-xs text-slate-400 mt-1">PDF, JPG, PNG (Max 10MB)</p>
                </div>
                <div *ngIf="selectedFile" class="flex items-center justify-center space-x-3">
                  <div class="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div class="text-left">
                    <p class="text-sm font-bold text-slate-800">{{ selectedFile.name }}</p>
                    <p class="text-xs text-slate-500">{{ (selectedFile.size / 1024 / 1024) | number:'1.1-2' }} MB</p>
                  </div>
                  <button (click)="$event.stopPropagation(); selectedFile = null" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              
              <!-- Progress Bar -->
              <div *ngIf="isUploading" class="mt-4">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-blue-600">Uploading...</span>
                  <span class="text-xs font-bold text-blue-600">{{ uploadProgress }}%</span>
                </div>
                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-600 rounded-full transition-all duration-300" [style.width.%]="uploadProgress"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button 
              (click)="showResponseModal = false"
              class="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              (click)="submitMQResponse()"
              [disabled]="!responseSummary || isUploading"
              class="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 hover:translate-y-[-2px] active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center"
            >
              <svg *ngIf="!isUploading" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <svg *ngIf="isUploading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ isUploading ? 'Processing...' : 'Submit Response' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Final Decision Modal (Approve/Reject/Defer/Resolve Deferment) -->
    <div *ngIf="showDecisionModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" (click)="showDecisionModal = false"></div>
        
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300 border border-slate-100">
          <!-- Modal Header -->
          <div [ngClass]="{
            'bg-green-600': decisionType === 'APPROVE',
            'bg-red-600': decisionType === 'REJECT',
            'bg-yellow-600': decisionType === 'DEFER',
            'bg-purple-600': decisionType === 'RESOLVE_DEFERMENT'
          }" class="px-8 py-6 text-white relative flex flex-col">
            <h3 class="text-2xl font-bold flex items-center">
              <svg *ngIf="decisionType === 'APPROVE'" class="w-7 h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <svg *ngIf="decisionType === 'REJECT'" class="w-7 h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <svg *ngIf="decisionType === 'DEFER'" class="w-7 h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <svg *ngIf="decisionType === 'RESOLVE_DEFERMENT'" class="w-7 h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {{ decisionType === 'APPROVE' ? 'Approve Admission' : decisionType === 'REJECT' ? 'Reject Admission' : decisionType === 'DEFER' ? 'Defer Admission' : 'Resolve Deferment' }}
            </h3>
            <p class="text-white/80 mt-1 text-sm font-medium">Finalize the workflow state of this admission request.</p>
            <button (click)="showDecisionModal = false" class="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="px-8 py-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <!-- Approval Fields -->
            <ng-container *ngIf="decisionType === 'APPROVE'">
              <div class="grid grid-cols-2 gap-6">
                <!-- Approved Amount -->
                <div class="col-span-2 sm:col-span-1">
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Approved Amount (RM)</label>
                  <div class="relative group">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-green-600 transition-colors">RM</span>
                    <input 
                      type="number" 
                      [(ngModel)]="decisionData.approvedAmount" 
                      class="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-0 focus:border-green-500 font-bold text-slate-800 transition-all outline-none"
                    >
                  </div>
                  <p class="text-[10px] text-slate-400 mt-2 italic">* Initially populated from estimation</p>
                </div>

                <!-- EHM Status -->
                <div class="col-span-2 sm:col-span-1">
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">8hr Monitoring (EHM)</label>
                  <select 
                    [(ngModel)]="decisionData.ehmStatus"
                    class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-0 focus:border-green-500 font-bold text-slate-800 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="NOT_APPLICABLE">Not Applicable</option>
                    <option value="REQUIRED">Required</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <!-- Discharge Date / Expected Stay -->
                <div class="col-span-2 sm:col-span-1">
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expected Discharge</label>
                  <input 
                    type="date" 
                    [(ngModel)]="decisionData.dischargeDate"
                    class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-0 focus:border-green-500 font-bold text-slate-800 transition-all outline-none"
                  >
                </div>

                <!-- Alert Flag Toggle -->
                <div class="col-span-2 sm:col-span-1 flex items-center space-x-3 pt-6">
                  <button 
                    (click)="decisionData.alertFlag = !decisionData.alertFlag"
                    class="w-12 h-6 rounded-full transition-colors relative shadow-inner"
                    [ngClass]="decisionData.alertFlag ? 'bg-green-500' : 'bg-slate-300'"
                  >
                    <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-md" [style.transform]="decisionData.alertFlag ? 'translateX(24px)' : 'translateX(0)'"></div>
                  </button>
                  <span class="text-sm font-bold" [ngClass]="decisionData.alertFlag ? 'text-green-600' : 'text-slate-500'">
                    Enable LOS Alerts
                  </span>
                </div>
              </div>

              <!-- General Remarks -->
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Approval Remarks</label>
                <textarea 
                  [(ngModel)]="decisionData.remarks"
                  rows="3"
                  class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-0 focus:border-green-500 font-medium text-slate-800 transition-all outline-none resize-none"
                  placeholder="Additional notes for the hospital or internal history..."
                ></textarea>
              </div>
            </ng-container>

            <!-- Rejection Fields -->
            <ng-container *ngIf="decisionType === 'REJECT'">
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rejection Reason <span class="text-red-500">*</span></label>
                <textarea 
                  [(ngModel)]="decisionData.rejectionReason"
                  rows="4"
                  class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-0 focus:border-red-500 font-medium text-slate-800 transition-all outline-none resize-none"
                  placeholder="State the clear reason for rejection (Policy exclusion, non-medical, etc)..."
                ></textarea>
                <div class="flex items-start mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                  <svg class="w-5 h-5 text-red-500 mr-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p class="text-xs text-red-700 leading-relaxed font-bold">Rejection is permanent and will trigger an immediate notification to the hospital. Ensure the reason is detailed and accurate.</p>
                </div>
              </div>
            </ng-container>

            <!-- Deferment Fields -->
            <ng-container *ngIf="decisionType === 'DEFER'">
              <div class="space-y-6">
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deferment Reason <span class="text-red-500">*</span></label>
                  <textarea 
                    [(ngModel)]="decisionData.defermentReason"
                    rows="3"
                    class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-0 focus:border-yellow-500 font-medium text-slate-800 transition-all outline-none resize-none"
                    placeholder="Why is this case being deferred? (Awaiting specialist report, missing docs...)"
                  ></textarea>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Follow-up Expected By</label>
                  <input 
                    type="date" 
                    [(ngModel)]="decisionData.followUpDate"
                    class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-0 focus:border-yellow-500 font-bold text-slate-800 transition-all outline-none"
                  >
                </div>
              </div>
            </ng-container>

            <!-- Resolve Deferment Fields -->
            <ng-container *ngIf="decisionType === 'RESOLVE_DEFERMENT'">
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Resolution Notes <span class="text-red-500">*</span></label>
                <textarea 
                  [(ngModel)]="decisionData.resolutionNotes"
                  rows="4"
                  class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-0 focus:border-purple-500 font-medium text-slate-800 transition-all outline-none resize-none"
                  placeholder="Describe how the deferment issue was resolved (e.g., received specialist report, documents verified)..."
                ></textarea>
                <div class="flex items-start mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <svg class="w-5 h-5 text-purple-500 mr-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p class="text-xs text-purple-700 leading-relaxed font-bold">Resolving the deferment will allow the admission to proceed for approval or rejection. The resolution notes will be recorded in the workflow history.</p>
                </div>
              </div>
            </ng-container>
          </div>

          <div class="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-4">
            <button 
              (click)="showDecisionModal = false"
              class="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              (click)="submitDecision()"
              [disabled]="(decisionType === 'REJECT' && !decisionData.rejectionReason) || (decisionType === 'DEFER' && !decisionData.defermentReason) || (decisionType === 'RESOLVE_DEFERMENT' && !decisionData.resolutionNotes) || loading"
              [ngClass]="{
                'bg-green-600 shadow-green-200': decisionType === 'APPROVE',
                'bg-red-600 shadow-red-200': decisionType === 'REJECT',
                'bg-yellow-600 shadow-yellow-200': decisionType === 'DEFER',
                'bg-purple-600 shadow-purple-200': decisionType === 'RESOLVE_DEFERMENT'
              }"
              class="px-8 py-2.5 text-white font-bold rounded-xl transition-all shadow-lg hover:translate-y-[-2px] active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center"
            >
              <svg *ngIf="!loading" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <svg *ngIf="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Confirm {{ decisionType === 'APPROVE' ? 'Approval' : decisionType === 'REJECT' ? 'Rejection' : decisionType === 'DEFER' ? 'Deferment' : 'Resolution' }}
            </button>
          </div>
        </div>
      </div>
  `
})
export class AdmissionDetailComponent implements OnInit, OnDestroy {
  readonly PERMISSIONS = PERMISSIONS.ADMISSIONS;
  readonly PERMISSIONS_MQ = PERMISSIONS.MQ_OPERATIONS;

  admission: Admission | null = null;
  remarks: AdmissionRemark[] = [];
  admissionTypes: LookupItem[] = [];
  roomTypes: LookupItem[] = [];
  ehmStatuses: LookupItem[] = [];
  defermentStatuses: LookupItem[] = [];
  
  loading = false;
  loadingRemarks = false;
  activeTab: 'info' | 'history' | 'queries' | 'assessment' = 'info';

  // MQ Builder
  showMqBuilder = false;
  mqRecipientType: 'HOSP' | 'PH' = 'HOSP';

  // MQ Viewer
  selectedMQ: AdmissionRemark | null = null;
  showMQViewModal = false;

  tabs: Array<{ id: 'info' | 'history' | 'queries' | 'assessment', label: string }> = [
    { id: 'info', label: 'Admission Information' },
    { id: 'history', label: 'Workflow History' },
    { id: 'queries', label: 'Medical Queries' },
    { id: 'assessment', label: 'Assessment' }
  ];

  // Assessment state
  assessments: AdmissionAssessment[] = [];
  assessmentForm: Record<string, string> = {};
  loadingAssessment = false;
  savingAssessment = false;
  assessmentDirty = false;
  readonly ASSESSMENT_FIELDS = ASSESSMENT_FIELDS;

  private destroy$ = new Subject<void>();
  private admissionId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private admissionService: AdmissionService,
    private lookupService: LookupService,
    private logger: LoggerService,
    private toast: ToastService,
    private printService: MqPrintService,
    private uploadService: UploadService
  ) {}

  // Decision Modal State
  showDecisionModal = false;
  decisionType: 'APPROVE' | 'REJECT' | 'DEFER' | 'RESOLVE_DEFERMENT' = 'APPROVE';
  decisionData = {
    approvedAmount: 0,
    ehmStatus: 'NOT_APPLICABLE',
    dischargeDate: '',
    alertFlag: true,
    remarks: '',
    rejectionReason: '',
    defermentReason: '',
    followUpDate: '',
    resolutionNotes: ''
  };

  // Response Modal State
  showResponseModal = false;
  responseSummary = '';
  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  respondingMQ: AdmissionRemark | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.admissionId = parseInt(id, 10);
      this.loadLookups();
      this.loadAdmission();
    } else {
      this.toast.error('Invalid admission ID');
      this.goBack();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load lookup data
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

    this.lookupService.getEhmStatuses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statuses) => this.ehmStatuses = statuses,
        error: (error) => this.logger.error('Error loading EHM statuses:', error)
      });

    this.lookupService.getDefermentStatuses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statuses) => this.defermentStatuses = statuses,
        error: (error) => this.logger.error('Error loading deferment statuses:', error)
      });
  }

  /**
   * Load admission details
   */
  loadAdmission(): void {
    if (!this.admissionId) return;

    this.loading = true;
    this.admissionService.getAdmissionById(this.admissionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (admission) => {
          this.admission = admission;
          this.loading = false;
          this.logger.info('Admission loaded successfully');
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error loading admission:', error);
          this.toast.error('Failed to load admission details');
        }
      });
  }

  /**
   * Switch tabs and load data as needed
   */
  switchTab(tabId: 'info' | 'history' | 'queries' | 'assessment'): void {
    this.activeTab = tabId;
    
    // Load remarks when switching tabs as needed
    if ((tabId === 'history' || tabId === 'queries') && this.remarks.length === 0 && !this.loadingRemarks) {
      this.loadRemarks();
    }

    // Load assessments lazily
    if (tabId === 'assessment' && this.assessments.length === 0 && !this.loadingAssessment) {
      this.loadAssessments();
    }
  }

  /**
   * Load workflow remarks
   */
  loadRemarks(): void {
    if (!this.admissionId) return;

    this.loadingRemarks = true;
    this.admissionService.getAdmissionWithRemarks(this.admissionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.remarks = data.remarks || [];
          this.loadingRemarks = false;
          this.logger.info('Remarks loaded successfully');
        },
        error: (error) => {
          this.loadingRemarks = false;
          this.logger.error('Error loading remarks:', error);
          this.toast.error('Failed to load workflow history');
        }
      });
  }

  // ============================================================================
  // ASSESSMENTS
  // ============================================================================

  loadAssessments(): void {
    if (!this.admissionId) return;
    this.loadingAssessment = true;
    this.admissionService.getAdmissionAssessments(this.admissionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.assessments = data;
          // Populate form from saved data
          this.assessmentForm = {};
          for (const field of data) {
            this.assessmentForm[field.field_name] = field.field_value ?? '';
          }
          this.assessmentDirty = false;
          this.loadingAssessment = false;
        },
        error: (error) => {
          this.loadingAssessment = false;
          this.logger.error('Error loading assessments:', error);
          this.toast.error('Failed to load assessment data');
        }
      });
  }

  saveAssessments(): void {
    if (!this.admissionId) return;
    this.savingAssessment = true;
    const fields: AssessmentFieldDto[] = ASSESSMENT_FIELDS.map(f => ({
      field_name: f.key,
      field_value: this.assessmentForm[f.key] ?? null
    }));
    this.admissionService.upsertAdmissionAssessments({ admission_id: this.admissionId, fields })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.savingAssessment = false;
          this.assessmentDirty = false;
          this.toast.success('Assessment saved successfully');
        },
        error: (error) => {
          this.savingAssessment = false;
          this.logger.error('Error saving assessments:', error);
          this.toast.error('Failed to save assessment data');
        }
      });
  }

  onAssessmentChange(): void {
    this.assessmentDirty = true;
  }

  /**
   * Navigate back to list
   */
  goBack(): void {
    this.router.navigate([APP_ROUTES.ADMISSIONS.LIST]);
  }

  /**
   * Navigate to edit page
   */
  editAdmission(): void {
    if (!this.admissionId) return;
    this.router.navigate([APP_ROUTES.ADMISSIONS.EDIT(this.admissionId)]);
  }

  /**
   * Open Approval Dialog
   */
  approveAdmission(): void {
    if (!this.admissionId || !this.admission) return;
    this.decisionType = 'APPROVE';
    this.decisionData = {
      approvedAmount: this.admission.estimated_amount || 0,
      ehmStatus: this.admission.ehm_status || 'NOT_APPLICABLE',
      dischargeDate: this.admission.discharge_date ? new Date(this.admission.discharge_date).toISOString().split('T')[0] : '',
      alertFlag: this.admission.alert_flag ?? true,
      remarks: '',
      rejectionReason: '',
      defermentReason: '',
      followUpDate: '',
      resolutionNotes: ''
    };
    this.showDecisionModal = true;
  }

  /**
   * Open Rejection Dialog
   */
  rejectAdmission(): void {
    if (!this.admissionId) return;
    this.decisionType = 'REJECT';
    this.decisionData.rejectionReason = '';
    this.showDecisionModal = true;
  }

  /**
   * Delete admission
   */
  deleteAdmission(): void {
    if (!this.admissionId) return;

    if (!confirm(`Are you sure you want to delete this admission?`)) {
      return;
    }

    this.loading = true;
    this.admissionService.deleteAdmission(this.admissionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Admission deleted successfully');
          this.goBack();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error deleting admission:', error);
          this.toast.error(error.error?.message || 'Failed to delete admission');
        }
      });
  }

  /**
   * Send Medical Query to hospital
   */
  sendMedicalQuery(): void {
    if (!this.admission) return;
    this.mqRecipientType = 'HOSP';
    this.showMqBuilder = true;
  }

  /**
   * Handle MQ Generation
   */
  onMqGenerate(questions: any[]): void {
    if (!this.admissionId) return;
    this.showMqBuilder = false;
    
    // Concatenate questions for history record
    const queryText = '[GENERATED MQ]\n' + questions.map((q, i) => `${i + 1}. ${q.text}`).join('\n');
    
    this.loading = true;
    // We reuse sendMedicalQuery but prefix it to show it was locally generated/downloaded
    this.admissionService.sendMedicalQuery(this.admissionId, { queryText })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Medical questionnaire generated and saved to history');
          
          // Also trigger download of the generated PDF
          this.printService.print({
            refNo: this.admission?.claim_ref_no || 'MQ-DOC',
            recipientType: this.mqRecipientType,
            questions: questions.map(q => ({ text: q.text, lines: q.lines || 3 })),
            date: new Date(),
            patientName: this.admission?.member_name,
            hospitalName: this.admission?.hospital_name
          });
          
          this.loadAdmission();
          this.loadRemarks(); // Refresh history tab if needed
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error generating MQ:', error);
          this.toast.error(error.error?.message || 'Failed to generate MQ');
        }
      });
  }

  /**
   * Handle MQ Email
   */
  onMqEmail(questions: any[]): void {
    if (!this.admissionId) return;
    this.showMqBuilder = false;
    
    // Concatenate questions for the existing sendMedicalQuery API
    const queryText = questions.map((q, i) => `${i + 1}. ${q.text}`).join('\n');
    
    this.loading = true;
    this.admissionService.sendMedicalQuery(this.admissionId, { queryText })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Medical questionnaire sent successfully');
          this.loadAdmission();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error sending MQ:', error);
          this.toast.error(error.error?.message || 'Failed to send MQ');
        }
      });
  }

  /**
   * Respond to Medical Query (REMOVED - Manual process)
   */
  // respondToMQ(): void { ... }

  /**
   * Open Deferment Dialog
   */
  deferAdmission(): void {
    if (!this.admissionId) return;
    this.decisionType = 'DEFER';
    this.decisionData.defermentReason = '';
    this.decisionData.followUpDate = '';
    this.showDecisionModal = true;
  }

  /**
   * Submit the final decision (Approve/Reject/Defer)
   */
  submitDecision(): void {
    if (!this.admissionId) return;
    
    this.loading = true;
    this.showDecisionModal = false;

    if (this.decisionType === 'APPROVE') {
      this.admissionService.approveAdmission(this.admissionId, {
        approved_amount: this.decisionData.approvedAmount,
        ehm_status: this.decisionData.ehmStatus,
        discharge_date: this.decisionData.dischargeDate || undefined,
        alert_flag: this.decisionData.alertFlag,
        remarks: this.decisionData.remarks || undefined
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (glRefNo) => {
          this.toast.success(`Admission approved successfully. GL: ${glRefNo}`);
          this.loadAdmission();
          this.loadRemarks();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error approving admission:', error);
          this.toast.error(error.error?.message || 'Failed to approve admission');
        }
      });
    } else if (this.decisionType === 'REJECT') {
      this.admissionService.rejectAdmission(this.admissionId, {
        rejectionReason: this.decisionData.rejectionReason
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Admission rejected successfully');
          this.loadAdmission();
          this.loadRemarks();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error rejecting admission:', error);
          this.toast.error(error.error?.message || 'Failed to reject admission');
        }
      });
    } else if (this.decisionType === 'DEFER') {
      this.admissionService.deferAdmission(this.admissionId, {
        defermentReason: this.decisionData.defermentReason,
        followUpDate: this.decisionData.followUpDate || undefined
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Admission deferred successfully');
          this.loadAdmission();
          this.loadRemarks();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error deferring admission:', error);
          this.toast.error(error.error?.message || 'Failed to defer admission');
        }
      });
    } else if (this.decisionType === 'RESOLVE_DEFERMENT') {
      this.admissionService.resolveDeferment(this.admissionId, {
        resolutionNotes: this.decisionData.resolutionNotes
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Deferment resolved successfully');
          this.loadAdmission();
          this.loadRemarks();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error resolving deferment:', error);
          this.toast.error(error.error?.message || 'Failed to resolve deferment');
        }
      });
    }
  }

  /**
   * Open Resolve Deferment Dialog
   */
  resolveDeferment(): void {
    if (!this.admissionId) return;
    this.decisionType = 'RESOLVE_DEFERMENT';
    this.decisionData.resolutionNotes = '';
    this.showDecisionModal = true;
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
   * Check if medical query can be sent
   * Allowed up until approval or rejection
   */
  canSendMQ(status: string | null | undefined): boolean {
    if (!status) return true;
    const finalStatuses = ['APPROVED', 'REJECTED', 'DISCHARGED', 'CANCELLED'];
    return !finalStatuses.includes(status);
  }


  /**
   * Check if admission can be deferred
   */
  canDefer(status: string | null | undefined): boolean {
    return status === 'PENDING_APPROVAL' || status === 'MQ_RESPONDED';
  }

  /**
   * Check if deferment can be resolved
   */
  canResolveDeferment(defermentStatus: string | null | undefined): boolean {
    return defermentStatus === 'PENDING_DEFERMENT';
  }

  /**
   * Get lookup name by value
   */
  getLookupName(lookups: LookupItem[], value: string | null | undefined): string {
    if (!value) return 'N/A';
    const lookup = lookups.find(l => l.lookup_value === value);
    return lookup ? lookup.lookup_code : value;
  }

  getFilteredMQRemarks(): AdmissionRemark[] {
    const mqs = this.remarks.filter(r => 
      r.action_for === 'MQ_SENT' || 
      (r.remark_text && r.remark_text.includes('[GENERATED MQ]'))
    );
    // Sort oldest first for numbering (MQ 1, 2, 3...)
    return [...mqs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  viewMQ(mq: AdmissionRemark): void {
    this.selectedMQ = mq;
    this.showMQViewModal = true;
  }

  closeMQView(): void {
    this.selectedMQ = null;
    this.showMQViewModal = false;
  }

  // MQ Response UI Logic
  canRespondToMQ(mq: AdmissionRemark): boolean {
    const status = this.getLatestMQStatus(mq);
    // Only allow responding if the MQ is currently SENT or FOLLOW_UP
    // If it's already RECEIVED or CLOSED, hospitals cannot respond again.
    const isRespondableStatus = status === 'SENT' || status === 'FOLLOW_UP';
    return isRespondableStatus && (mq.remark_text?.includes('[GENERATED MQ]') || false);
  }

  openResponseModal(mq: AdmissionRemark): void {
    this.respondingMQ = mq;
    this.responseSummary = '';
    this.selectedFile = null;
    this.showResponseModal = true;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.toast.error('File size exceeds 10MB limit');
        return;
      }
      this.selectedFile = file;
    }
  }

  submitMQResponse(): void {
    if (!this.admissionId || !this.responseSummary) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    if (this.selectedFile) {
      // First upload file
      this.uploadService.uploadWithProgress(this.selectedFile, 'mq-responses')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            if (res.status === 'progress') {
              this.uploadProgress = res.message;
            } else if (res.status === 'success') {
              // res.body.data contains: { fileName, originalName, mimeType, size, url, relativePath }
              this.finalizeMQSubmission(res.body.data);
            }
          },
          error: (err) => {
            this.isUploading = false;
            this.toast.error('File upload failed');
            this.logger.error('Upload error', err);
          }
        });
    } else {
      this.finalizeMQSubmission();
    }
  }

  private finalizeMQSubmission(uploadResult?: any): void {
    if (!this.admissionId) return;

    const dto: RespondToMQDto = { 
      responseText: this.responseSummary
    };

    if (uploadResult) {
      dto.document = {
        fileName: uploadResult.originalName || uploadResult.fileName,
        filePath: uploadResult.url,
        fileSize: uploadResult.size,
        fileExtension: uploadResult.originalName ? uploadResult.originalName.split('.').pop() || '' : ''
      };
    }

    this.admissionService.respondToMQ(this.admissionId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isUploading = false;
          this.showResponseModal = false;
          this.toast.success('MQ response submitted successfully');
          this.loadRemarks();
          this.loadAdmission();
        },
        error: (err) => {
          this.isUploading = false;
          this.toast.error('Failed to submit response');
          this.logger.error('Response error', err);
        }
      });
  }

  getAttachmentUrl(remark: AdmissionRemark): string | null {
    if (!remark) return null;
    
    // Prioritize the dedicated database field from ccms_documents
    if (remark.attachment_url) return remark.attachment_url;

    // Fallback for legacy tags if still present
    if (!remark.remark_text) return null;
    const match = remark.remark_text.match(/\[ATTACHMENT: (.*?)\]/);
    return match ? match[1] : null;
  }

  /**
   * Get the status for a SPECIFIC MQ chain
   * Uses a "Time Window" to prevent statuses from leaking across MQs
   */
  getLatestMQStatus(mq: AdmissionRemark): string {
    if (!mq) return 'SENT';

    const startTime = new Date(mq.created_at).getTime();
    
    // Find when the NEXT MQ was sent (to define the end of this MQ's window)
    const allMQs = this.getFilteredMQRemarks();
    const currentIndex = allMQs.findIndex(m => m.remark_id === mq.remark_id);
    const nextMQ = allMQs[currentIndex + 1];
    const endTime = nextMQ ? new Date(nextMQ.created_at).getTime() : Infinity;

    // Filter remarks that belong ONLY to this MQ's window
    const windowRemarks = this.remarks.filter(r => {
      const rTime = new Date(r.created_at).getTime();
      return rTime >= startTime && rTime < endTime;
    });

    // Find the latest status action in THIS specific window
    const latest = windowRemarks.find(r => 
      r.action_for === 'MQ_SENT' || 
      r.action_for === 'MQ_FOLLOW_UP' || 
      r.action_for === 'MQ_RESPONSE' || 
      r.action_for === 'MQ_CLOSED'
    );

    if (!latest) return 'SENT';
    
    if (latest.action_for === 'MQ_RESPONSE') return 'RECEIVED';
    if (latest.action_for === 'MQ_FOLLOW_UP') return 'FOLLOW_UP';
    if (latest.action_for === 'MQ_CLOSED') return 'CLOSED';
    return 'SENT';
  }

  /**
   * Find the response remark for a specific MQ window
   */
  getMQResponse(mq: AdmissionRemark): AdmissionRemark | null {
    if (!mq) return null;

    const startTime = new Date(mq.created_at).getTime();
    const allMQs = this.getFilteredMQRemarks();
    const currentIndex = allMQs.findIndex(m => m.remark_id === mq.remark_id);
    const nextMQ = allMQs[currentIndex + 1];
    const endTime = nextMQ ? new Date(nextMQ.created_at).getTime() : Infinity;

    // Find all response remarks in this window
    const windowResponses = this.remarks.filter(r => {
      const rTime = new Date(r.created_at).getTime();
      return rTime >= startTime && rTime < endTime && r.action_for === 'MQ_RESPONSE';
    });

    if (windowResponses.length === 0) return null;

    // Prioritize: 
    // 1. A remark that has an actual database attachment URL
    // 2. A remark that doesn't look like an automated status update
    // 3. Fallback to the latest response found
    const realResponse = windowResponses.find(r => r.attachment_url) || 
                         windowResponses.find(r => !r.remark_text?.includes('MQ Status manually updated')) ||
                         windowResponses[0];

    return realResponse || null;
  }

  /**
   * Clean up technical prefix from response text
   */
  getCleanResponse(text: string | null | undefined): string {
    if (!text) return '';
    return text.replace(/^Medical Query response received\. Response:\s*/, '').replace(/\[ATTACHMENT: .*?\]/, '').trim();
  }

  /**
   * Update the manual status of a generated MQ
   */
  updateMQStatus(mq: AdmissionRemark, status: string): void {
    if (!this.admissionId) return;

    // Prevent any status changes if THIS MQ is already CLOSED
    if (this.getLatestMQStatus(mq) === 'CLOSED' && status !== 'CLOSED') {
      this.toast.error('Cannot change status of a closed/resolved MQ');
      return;
    }

    this.admissionService.updateMQStatus(this.admissionId, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`MQ status updated to: ${status}`);
          this.loadRemarks(); // Reload to update UI and lock if closed
        }
      });
  }

  downloadMQ(mq: AdmissionRemark): void {
    if (!mq.remark_text) {
      this.toast.error('No questionnaire content found');
      return;
    }

    // Parse questions from remark_text
    const lines = mq.remark_text.split('\n');
    const questions = lines
      .filter(line => /^\d+\.\s/.test(line))
      .map(line => ({
        text: line.replace(/^\d+\.\s/, ''),
        lines: 3
      }));

    if (questions.length === 0) {
      questions.push({
        text: mq.remark_text.replace('[GENERATED MQ]', '').trim(),
        lines: 3
      });
    }

    this.printService.print({
      refNo: this.admission?.claim_ref_no || 'MQ-DOC',
      recipientType: mq.remark_text.toLowerCase().includes('policyholder') ? 'PH' : 'HOSP',
      questions: questions,
      date: mq.created_at ? new Date(mq.created_at) : new Date(),
      patientName: this.admission?.member_name,
      hospitalName: this.admission?.hospital_name
    });
  }

  formatStatus(status: string | null | undefined): string {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Format action for display
   */
  formatAction(action: string | null | undefined): string {
    if (!action) return 'General Remark';
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Get Length of Stay (LOS)
   * If discharged: returns actual LOS from database
   * If still admitted: calculates current LOS (days since admission)
   */
  getLOS(admission: Admission | null): string {
    if (!admission || !admission.admission_date) return 'N/A';
    
    // If discharged, use database-calculated LOS
    if (admission.discharge_date && admission.los_days !== null && admission.los_days !== undefined) {
      return admission.los_days.toString();
    }
    
    // If still admitted, calculate current LOS (days since admission until today)
    const admissionDate = new Date(admission.admission_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - admissionDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} (ongoing)`;
  }

  /**
   * Handle tab change
   */
  onTabChange(tabId: 'info' | 'history'): void {
    this.activeTab = tabId;
    if (tabId === 'history' && this.remarks.length === 0) {
      this.loadRemarks();
    }
  }
}


