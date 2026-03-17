import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { MqTemplateService } from '../../../core/services/mq-template.service';
import {
  MqTemplateListItem,
  MqTemplateQuestion,
  CreateMqTemplateDto,
  UpdateMqTemplateDto,
  CreateMqQuestionDto,
  MqTemplateFilters
} from '../../../shared/models/mq-template.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../common/components/status-badge/status-badge.component';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { LookupService, LookupItem } from '../../../shared/services/lookup.service';

@Component({
  selector: 'app-mq-template-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">

      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">MQ Templates</h1>
          <p class="mt-1 text-sm text-gray-600">Manage Medical Questionnaire templates and questions</p>
        </div>
        <button
          *hasPermission="'MQ_TEMPLATES_MGMT.CREATE'"
          (click)="openCreateModal()"
          class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-white transition hover:opacity-90"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          New Template
        </button>
      </div>

      <!-- Filters -->
      <div class="mb-6 rounded-lg bg-white p-4 shadow">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              [(ngModel)]="filters.search"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Template code or category"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Recipient Type</label>
            <select
              [(ngModel)]="filters.recipient_type"
              (ngModelChange)="onFilterChange()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option value="">All Types</option>
              <option value="HOSP">Hospital</option>
              <option value="PH">Policy Holder</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              [(ngModel)]="filters.is_active"
              (ngModelChange)="onFilterChange()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="undefined">All</option>
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
            </select>
          </div>
        </div>
      </div>

      <app-loading-spinner *ngIf="loading" message="Loading templates..."></app-loading-spinner>

      <!-- Two-column layout: Template list + Questions panel -->
      <div *ngIf="!loading" class="flex gap-6">

        <!-- Templates Table -->
        <div class="flex-1 overflow-hidden rounded-lg bg-white shadow">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Recipient</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Questions</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr
                  *ngFor="let tmpl of templates"
                  class="cursor-pointer transition hover:bg-blue-50"
                  [class.bg-blue-50]="selectedTemplate?.template_id === tmpl.template_id"
                  (click)="selectTemplate(tmpl)"
                >
                  <td class="whitespace-nowrap px-6 py-4 text-sm font-mono font-medium text-gray-900">{{ tmpl.template_code }}</td>
                  <td class="px-6 py-4 text-sm text-gray-900">{{ tmpl.template_category }}</td>
                  <td class="whitespace-nowrap px-6 py-4">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      [class.bg-blue-100]="tmpl.recipient_type === 'HOSP'"
                      [class.text-blue-800]="tmpl.recipient_type === 'HOSP'"
                      [class.bg-green-100]="tmpl.recipient_type === 'PH'"
                      [class.text-green-800]="tmpl.recipient_type === 'PH'"
                    >
                      {{ tmpl.recipient_type === 'HOSP' ? 'Hospital' : 'Policy Holder' }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{{ tmpl.question_count }} Qs</span>
                  </td>
                  <td class="whitespace-nowrap px-6 py-4">
                    <app-status-badge [active]="tmpl.is_active"></app-status-badge>
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium" (click)="$event.stopPropagation()">
                    <button (click)="selectTemplate(tmpl)" class="mr-3 text-blue-600 hover:text-blue-900" title="View Questions">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button *hasPermission="'MQ_TEMPLATES_MGMT.UPDATE'" (click)="editTemplate(tmpl)" class="mr-3 text-indigo-600 hover:text-indigo-900" title="Edit">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button *hasPermission="'MQ_TEMPLATES_MGMT.DELETE'" (click)="deleteTemplate(tmpl)" class="text-red-600 hover:text-red-900" title="Delete">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="templates.length === 0">
                  <td colspan="6" class="py-12 text-center text-sm text-gray-500">
                    <svg class="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    No templates found. Click a row to view questions.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
            <p class="text-sm text-gray-700">
              Showing <span class="font-medium">{{ getStartItem() }}</span> to <span class="font-medium">{{ getEndItem() }}</span> of <span class="font-medium">{{ pagination.total }}</span>
            </p>
            <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button (click)="previousPage()" [disabled]="pagination.page === 1"
                class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                </svg>
              </button>
              <button *ngFor="let page of getPageNumbers()" (click)="goToPage(page)"
                [class.bg-indigo-600]="page === pagination.page"
                [class.text-white]="page === pagination.page"
                class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20">
                {{ page }}
              </button>
              <button (click)="nextPage()" [disabled]="pagination.page >= pagination.totalPages"
                class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>

        <!-- Questions Side Panel -->
        <div *ngIf="selectedTemplate" class="w-96 flex-shrink-0 rounded-lg bg-white shadow">
          <div class="border-b border-gray-200 px-5 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-gray-900">{{ selectedTemplate.template_category }}</h3>
                <p class="text-xs text-gray-500">{{ selectedTemplate.recipient_type === 'HOSP' ? 'Hospital' : 'Policy Holder' }} · {{ questions.length }} question(s)</p>
              </div>
              <button *hasPermission="'MQ_TEMPLATES_MGMT.CREATE'" (click)="openAddQuestionModal()"
                class="flex items-center gap-1 rounded bg-[#1e3c72] px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Add Q
              </button>
            </div>
          </div>

          <app-loading-spinner *ngIf="loadingQuestions" message="Loading..."></app-loading-spinner>

          <div *ngIf="!loadingQuestions" class="divide-y divide-gray-100 overflow-y-auto" style="max-height: calc(100vh - 280px)">
            <div *ngFor="let q of questions; let i = index"
              class="group flex items-start gap-3 px-5 py-3 transition hover:bg-gray-50">
              <span class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">{{ i + 1 }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-800 leading-relaxed">{{ q.question_text }}</p>
                <p class="mt-1 text-xs text-gray-400">{{ q.required_lines }} line(s) response space</p>
              </div>
              <div class="flex flex-shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                <button *hasPermission="'MQ_TEMPLATES_MGMT.UPDATE'" (click)="editQuestion(q)"
                  class="rounded p-1 text-indigo-500 hover:bg-indigo-50">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button *hasPermission="'MQ_TEMPLATES_MGMT.DELETE'" (click)="deleteQuestion(q)"
                  class="rounded p-1 text-red-400 hover:bg-red-50">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>

            <div *ngIf="questions.length === 0" class="py-10 text-center text-sm text-gray-400">
              No questions yet. Click "Add Q" to add one.
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ─── Template Modal ─────────────────────────────────────────────────── -->
    <div *ngIf="showTemplateModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4" (click)="closeTemplateModal()">
      <div class="w-full max-w-lg rounded-lg bg-white shadow-xl" (click)="$event.stopPropagation()">
        <div class="border-b border-gray-200 px-6 py-4">
          <h3 class="text-lg font-semibold text-gray-900">{{ editingTemplate ? 'Edit Template' : 'Create Template' }}</h3>
        </div>
        <div class="px-6 py-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Template Code <span class="text-red-500">*</span></label>
              <input type="text" [(ngModel)]="templateForm.template_code" [disabled]="!!editingTemplate"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 uppercase focus:border-[#1e3c72] focus:outline-none disabled:bg-gray-100"
                placeholder="e.g., HOSP_ADM" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Recipient <span class="text-red-500">*</span></label>
              <select [(ngModel)]="templateForm.recipient_type" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none">
                <option value="HOSP">Hospital</option>
                <option value="PH">Policy Holder</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Category <span class="text-red-500">*</span></label>
            <select [(ngModel)]="templateForm.template_category"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none">
              <option value="">Select Category</option>
              <option *ngFor="let cat of mqCategories" [value]="cat.lookup_value">{{ cat.lookup_value }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email Subject</label>
            <input type="text" [(ngModel)]="templateForm.email_subject"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none"
              placeholder="e.g., Medical Clarification Request" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Reminder Days</label>
              <input type="number" [(ngModel)]="templateForm.reminder_days" min="1"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none"
                placeholder="e.g., 7" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Auto-Reminder Days</label>
              <input type="number" [(ngModel)]="templateForm.auto_reminder_days" min="1"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none"
                placeholder="e.g., 14" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="tmpl_active" [(ngModel)]="templateForm.is_active"
              class="h-4 w-4 rounded border-gray-300 text-[#1e3c72]" />
            <label for="tmpl_active" class="text-sm text-gray-700">Active</label>
          </div>
        </div>
        <div class="flex gap-3 border-t border-gray-200 px-6 py-4">
          <button (click)="closeTemplateModal()" [disabled]="saving"
            class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button (click)="saveTemplate()" [disabled]="saving"
            class="flex-1 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Question Modal ──────────────────────────────────────────────────── -->
    <div *ngIf="showQuestionModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4" (click)="closeQuestionModal()">
      <div class="w-full max-w-lg rounded-lg bg-white shadow-xl" (click)="$event.stopPropagation()">
        <div class="border-b border-gray-200 px-6 py-4">
          <h3 class="text-lg font-semibold text-gray-900">{{ editingQuestion ? 'Edit Question' : 'Add Question' }}</h3>
          <p class="text-xs text-gray-500 mt-0.5">Template: {{ selectedTemplate?.template_category }}</p>
        </div>
        <div class="px-6 py-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Question Text <span class="text-red-500">*</span></label>
            <textarea rows="4" [(ngModel)]="questionForm.question_text"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none resize-none"
              placeholder="Enter the question text..."></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Response Lines</label>
              <input type="number" [(ngModel)]="questionForm.required_lines" min="1" max="50"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none"
                placeholder="1" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Sort Order</label>
              <input type="number" [(ngModel)]="questionForm.sort_order" min="0"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none"
                placeholder="0" />
            </div>
          </div>
        </div>
        <div class="flex gap-3 border-t border-gray-200 px-6 py-4">
          <button (click)="closeQuestionModal()" [disabled]="saving"
            class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button (click)="saveQuestion()" [disabled]="saving"
            class="flex-1 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class MqTemplateListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  templates: MqTemplateListItem[] = [];
  loading = false;
  saving = false;

  // Questions panel
  selectedTemplate: MqTemplateListItem | null = null;
  questions: MqTemplateQuestion[] = [];
  loadingQuestions = false;

  // Template modal
  showTemplateModal = false;
  editingTemplate: MqTemplateListItem | null = null;
  templateForm: Partial<CreateMqTemplateDto> = { recipient_type: 'HOSP', is_active: true };
  mqCategories: LookupItem[] = [];

  // Question modal
  showQuestionModal = false;
  editingQuestion: MqTemplateQuestion | null = null;
  questionForm: Partial<CreateMqQuestionDto & { question_id?: number }> = { required_lines: 1, sort_order: 0 };

  filters: MqTemplateFilters = { page: 1, limit: 10, sort_by: 'template_id', sort_order: 'ASC', recipient_type: '' };
  pagination = { total: 0, page: 1, limit: 10, totalPages: 0 };

  constructor(
    private mqTemplateService: MqTemplateService,
    private lookupService: LookupService,
    private toast: ToastService,
    private logger: LoggerService
  ) {
    this.searchSubject$.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filters.page = 1;
      this.loadTemplates();
    });
  }

  ngOnInit(): void { 
    this.loadTemplates(); 
    this.loadMqCategories();
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadMqCategories(): void {
    this.lookupService.getLookupByCategory('MQ_CATEGORY')
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => this.mqCategories = items);
  }

  // ─── Templates ─────────────────────────────────────────────────────────────

  loadTemplates(): void {
    this.loading = true;
    this.mqTemplateService.getTemplates(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.templates = result.templates;
          this.pagination = { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages };
          this.loading = false;
          // re-select if template still in list
          if (this.selectedTemplate) {
            const still = this.templates.find(t => t.template_id === this.selectedTemplate!.template_id);
            if (still) this.selectedTemplate = still;
            else { this.selectedTemplate = null; this.questions = []; }
          }
        },
        error: err => { this.logger.error('Error loading templates', err); this.toast.error('Failed to load templates'); this.loading = false; }
      });
  }

  selectTemplate(tmpl: MqTemplateListItem): void {
    this.selectedTemplate = tmpl;
    this.loadQuestions(tmpl.template_id);
  }

  onSearchChange(val: string): void { this.searchSubject$.next(val); }
  onFilterChange(): void { this.filters.page = 1; this.loadTemplates(); }
  previousPage(): void { if (this.pagination.page > 1) { this.filters.page = this.pagination.page - 1; this.loadTemplates(); } }
  nextPage(): void { if (this.pagination.page < this.pagination.totalPages) { this.filters.page = this.pagination.page + 1; this.loadTemplates(); } }
  goToPage(page: number): void { this.filters.page = page; this.loadTemplates(); }
  getStartItem(): number { return (this.pagination.page - 1) * this.pagination.limit + 1; }
  getEndItem(): number { return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total); }
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let start = Math.max(1, this.pagination.page - Math.floor(maxPages / 2));
    const end = Math.min(this.pagination.totalPages, start + maxPages - 1);
    if (end - start < maxPages - 1) start = Math.max(1, end - maxPages + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  openCreateModal(): void {
    this.editingTemplate = null;
    this.templateForm = { template_code: '', template_category: '', recipient_type: 'HOSP', is_active: true };
    this.showTemplateModal = true;
  }

  editTemplate(tmpl: MqTemplateListItem): void {
    this.editingTemplate = tmpl;
    this.templateForm = {
      template_code: tmpl.template_code,
      template_category: tmpl.template_category,
      recipient_type: tmpl.recipient_type as 'HOSP' | 'PH',
      email_subject: tmpl.email_subject || '',
      reminder_days: tmpl.reminder_days || 0,
      auto_reminder_days: tmpl.auto_reminder_days || 0,
      is_active: tmpl.is_active
    };
    this.showTemplateModal = true;
  }

  closeTemplateModal(): void { if (!this.saving) this.showTemplateModal = false; }

  saveTemplate(): void {
    if (!this.templateForm.template_code || !this.templateForm.template_category) {
      this.toast.error('Template code and category are required'); return;
    }
    this.saving = true;
    const obs: Observable<unknown> = this.editingTemplate
      ? this.mqTemplateService.updateTemplate(this.editingTemplate.template_id, this.templateForm as UpdateMqTemplateDto)
      : this.mqTemplateService.createTemplate(this.templateForm as CreateMqTemplateDto);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false; this.closeTemplateModal(); this.loadTemplates();
        this.toast.success(this.editingTemplate ? 'Template updated' : 'Template created');
      },
      error: (err: any) => { this.saving = false; this.toast.error(err.error?.message || 'Failed to save template'); }
    });
  }

  deleteTemplate(tmpl: MqTemplateListItem): void {
    if (!confirm(`Delete template "${tmpl.template_category}"?`)) return;
    this.mqTemplateService.deleteTemplate(tmpl.template_id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        if (this.selectedTemplate?.template_id === tmpl.template_id) { this.selectedTemplate = null; this.questions = []; }
        this.loadTemplates(); this.toast.success('Template deleted');
      },
      error: err => this.toast.error(err.error?.message || 'Failed to delete template')
    });
  }

  // ─── Questions ─────────────────────────────────────────────────────────────

  loadQuestions(templateId: number): void {
    this.loadingQuestions = true;
    this.mqTemplateService.getQuestions(templateId).pipe(takeUntil(this.destroy$)).subscribe({
      next: qs => { this.questions = qs; this.loadingQuestions = false; },
      error: () => { this.loadingQuestions = false; }
    });
  }

  openAddQuestionModal(): void {
    this.editingQuestion = null;
    this.questionForm = { question_text: '', required_lines: 1, sort_order: this.questions.length + 1 };
    this.showQuestionModal = true;
  }

  editQuestion(q: MqTemplateQuestion): void {
    this.editingQuestion = q;
    this.questionForm = { question_text: q.question_text, required_lines: q.required_lines, sort_order: q.sort_order };
    this.showQuestionModal = true;
  }

  closeQuestionModal(): void { if (!this.saving) this.showQuestionModal = false; }

  saveQuestion(): void {
    if (!this.questionForm.question_text || this.questionForm.question_text.trim().length < 5) {
      this.toast.error('Question text must be at least 5 characters'); return;
    }
    this.saving = true;
    const obs: Observable<unknown> = this.editingQuestion
      ? this.mqTemplateService.updateQuestion(this.editingQuestion.question_id, {
          question_text: this.questionForm.question_text,
          required_lines: this.questionForm.required_lines,
          sort_order: this.questionForm.sort_order
        })
      : this.mqTemplateService.createQuestion({
          template_id: this.selectedTemplate!.template_id,
          question_text: this.questionForm.question_text!,
          required_lines: this.questionForm.required_lines,
          sort_order: this.questionForm.sort_order
        });

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false; this.closeQuestionModal();
        this.loadQuestions(this.selectedTemplate!.template_id);
        this.loadTemplates();
        this.toast.success(this.editingQuestion ? 'Question updated' : 'Question added');
      },
      error: (err: any) => { this.saving = false; this.toast.error(err.error?.message || 'Failed to save question'); }
    });
  }

  deleteQuestion(q: MqTemplateQuestion): void {
    if (!confirm('Delete this question?')) return;
    this.mqTemplateService.deleteQuestion(q.question_id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadQuestions(this.selectedTemplate!.template_id);
        this.loadTemplates();
        this.toast.success('Question deleted');
      },
      error: err => this.toast.error(err.error?.message || 'Failed to delete question')
    });
  }
}
