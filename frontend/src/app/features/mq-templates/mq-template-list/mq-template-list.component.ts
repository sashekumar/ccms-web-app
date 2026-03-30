import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MqTemplateService } from '../../../core/services/mq-template.service';
import {
  MqTemplateListItem,
  MqTemplateQuestion,
  CreateMqTemplateDto,
  UpdateMqTemplateDto,
  CreateMqQuestionDto,
  MqTemplateFilters
} from '../../../shared/models/mq-template.model';
import { DataTableComponent, DataTableColumn, DataTableAction, DataTableFilter, DataTablePagination, DataTableFilterState, DataTableRowActionEvent } from '../../../shared/components/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { TextInputComponent } from '../../../shared/components/ui/text-input/text-input.component';
import { TextAreaComponent } from '../../../shared/components/ui/text-area/text-area.component';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/ui/dropdown/dropdown.component';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { LookupService, LookupItem } from '../../../shared/services/lookup.service';

@Component({
  selector: 'app-mq-template-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ConfirmDialogComponent, TextInputComponent, TextAreaComponent, CheckboxComponent, ButtonComponent, DropdownComponent, LoadingSpinnerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">

      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">MQ Templates</h1>
          <p class="mt-1 text-sm text-gray-600">Manage Medical Questionnaire templates and questions</p>
        </div>
        <app-button variant="primary" (click)="openCreateModal()">
          <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          New Template
        </app-button>
      </div>

      <!-- Two-column layout: Template list + Questions panel -->
      <div class="flex gap-6">

        <!-- Templates Table -->
        <div class="flex-1">
          <app-data-table
            [rows]="templates"
            [columns]="columns"
            [filters]="tableFilters"
            [rowActions]="rowActions"
            [pagination]="pagination"
            [loading]="loading"
            (filterChange)="onFilterChange($event)"
            (cellToggle)="onToggleStatus($event)"
            (rowAction)="onRowAction($event)"
          ></app-data-table>
        </div>

        <!-- Questions Side Panel -->
        <div *ngIf="selectedTemplate" class="w-96 flex-shrink-0 rounded-lg bg-white shadow">
          <div class="border-b border-gray-200 px-5 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-gray-900">{{ selectedTemplate.template_category }}</h3>
                <p class="text-xs text-gray-500">{{ selectedTemplate.recipient_type === 'HOSP' ? 'Hospital' : 'Policy Holder' }} · {{ questions.length }} question(s)</p>
              </div>
              <app-button 
                (click)="openAddQuestionModal()"
                variant="primary"
                size="sm">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Add Q
              </app-button>
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
                <button (click)="editQuestion(q)"
                  class="rounded p-1 text-indigo-500 hover:bg-indigo-50">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button (click)="deleteQuestion(q)"
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

    <!-- Toggle Status Confirmation Dialog -->
    <app-confirm-dialog
      *ngIf="showToggleConfirm"
      [isOpen]="showToggleConfirm"
      title="Confirm Status Change"
      [message]="'Are you sure you want to ' + (pendingToggle?.newValue ? 'activate' : 'deactivate') + ' ' + (pendingToggle?.template?.template_category || 'this template') + '?'"
      confirmLabel="Yes, Change Status"
      cancelLabel="Cancel"
      variant="warn"
      (confirmed)="confirmToggleStatus()"
      (cancelled)="cancelToggleStatus()"
    />

    <!-- Delete Template Confirmation Dialog -->
    <app-confirm-dialog
      *ngIf="showDeleteTemplateConfirm"
      [isOpen]="showDeleteTemplateConfirm"
      title="Confirm Delete"
      [message]="'Are you sure you want to delete template ' + (templateToDelete?.template_category || 'this') + '? This action cannot be undone.'"
      confirmLabel="Yes, Delete"
      cancelLabel="Cancel"
      variant="danger"
      (confirmed)="performDeleteTemplate()"
      (cancelled)="cancelDeleteTemplate()"
    />

    <!-- Delete Question Confirmation Dialog -->
    <app-confirm-dialog
      *ngIf="showDeleteQuestionConfirm"
      [isOpen]="showDeleteQuestionConfirm"
      title="Confirm Delete"
      message="Are you sure you want to delete this question? This action cannot be undone."
      confirmLabel="Yes, Delete"
      cancelLabel="Cancel"
      variant="danger"
      (confirmed)="performDeleteQuestion()"
      (cancelled)="cancelDeleteQuestion()"
    />

    <!-- ─── Template Modal ─────────────────────────────────────────────────── -->
    <div *ngIf="showTemplateModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4" (click)="closeTemplateModal()">
      <div class="w-full max-w-lg rounded-lg bg-white shadow-xl" (click)="$event.stopPropagation()">
        <div class="border-b border-gray-200 px-6 py-4">
          <h3 class="text-lg font-semibold text-gray-900">{{ editingTemplate ? 'Edit Template' : 'Create Template' }}</h3>
        </div>
        <div class="px-6 py-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <app-text-input
              [(ngModel)]="templateForm.template_code"
              label="Template Code"
              placeholder="e.g., HOSP_ADM"
              [required]="true"
              [disabled]="!!editingTemplate"
              inputType="string"
              class="uppercase"
            ></app-text-input>
            
            <app-dropdown
              [(ngModel)]="templateForm.recipient_type"
              label="Recipient"
              placeholder="Select recipient"
              [required]="true"
              [options]="recipientTypeOptions"
            ></app-dropdown>
          </div>
          <app-dropdown
            [(ngModel)]="templateForm.template_category"
            label="Category"
            placeholder="Select Category"
            [required]="true"
            [options]="categoryOptions"
          ></app-dropdown>
          <app-text-input
            [(ngModel)]="templateForm.email_subject"
            label="Email Subject"
            placeholder="e.g., Medical Clarification Request"
            inputType="string"
          ></app-text-input>
          
          <div class="grid grid-cols-2 gap-4">
            <app-text-input
              [(ngModel)]="templateForm.reminder_days"
              label="Reminder Days"
              placeholder="e.g., 7"
              inputType="number"
            ></app-text-input>
            
            <app-text-input
              [(ngModel)]="templateForm.auto_reminder_days"
              label="Auto-Reminder Days"
              placeholder="e.g., 14"
              inputType="number"
            ></app-text-input>
          </div>
          <app-checkbox
            [(ngModel)]="templateForm.is_active"
            label="Active"
            labelSize="sm"
          ></app-checkbox>
        </div>
        <div class="flex gap-3 border-t border-gray-200 px-6 py-4">
          <app-button
            type="button"
            variant="outline"
            (click)="closeTemplateModal()"
            [disabled]="saving"
            class="flex-1"
          >
            Cancel
          </app-button>
          <app-button
            type="button"
            variant="primary"
            (click)="saveTemplate()"
            [disabled]="saving"
            [loading]="saving"
            class="flex-1"
          >
            {{ saving ? 'Saving...' : 'Save' }}
          </app-button>
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
          <app-text-area
            [(ngModel)]="questionForm.question_text"
            label="Question Text"
            placeholder="Enter the question text..."
            [required]="true"
            [rows]="4"
          ></app-text-area>
          
          <div class="grid grid-cols-2 gap-4">
            <app-text-input
              [(ngModel)]="questionForm.required_lines"
              label="Response Lines"
              placeholder="1"
              inputType="number"
            ></app-text-input>
            
            <app-text-input
              [(ngModel)]="questionForm.sort_order"
              label="Sort Order"
              placeholder="0"
              inputType="number"
            ></app-text-input>
          </div>
        </div>
        <div class="flex gap-3 border-t border-gray-200 px-6 py-4">
          <app-button
            type="button"
            variant="outline"
            (click)="closeQuestionModal()"
            [disabled]="saving"
            class="flex-1"
          >
            Cancel
          </app-button>
          <app-button
            type="button"
            variant="primary"
            (click)="saveQuestion()"
            [disabled]="saving"
            [loading]="saving"
            class="flex-1"
          >
            {{ saving ? 'Saving...' : 'Save' }}
          </app-button>
        </div>
      </div>
    </div>
  `
})
export class MqTemplateListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  templates: MqTemplateListItem[] = [];
  loading = false;
  saving = false;
  currentFilters: any = {};

  // Confirmation dialogs
  showToggleConfirm = false;
  showDeleteTemplateConfirm = false;
  showDeleteQuestionConfirm = false;
  templateToDelete: MqTemplateListItem | null = null;
  questionToDelete: MqTemplateQuestion | null = null;
  pendingToggle: { template: MqTemplateListItem; newValue: boolean } | null = null;

  // DataTable configuration
  pagination: DataTablePagination = { total: 0, page: 1, limit: 25, totalPages: 0 };

  tableFilters: DataTableFilter[] = [
    { key: 'search', label: 'Search', type: 'search', placeholder: 'Template code or category', inputType: 'string' },
    { key: 'recipient_type', label: 'Recipient Type', type: 'select', placeholder: 'All Types',
      options: [
        { value: '', label: 'All Types' },
        { value: 'HOSP', label: 'Hospital' },
        { value: 'PH', label: 'Policy Holder' }
      ]
    },
    { key: 'is_active', label: 'Status', type: 'select', placeholder: 'All Statuses',
      options: [
        { value: '', label: 'All' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    }
  ];

  columns: DataTableColumn[] = [
    { key: 'template_code', label: 'Code', type: 'text', sortable: true },
    { key: 'template_category', label: 'Category', type: 'text', sortable: true },
    { 
      key: 'recipient_type', 
      label: 'Recipient', 
      type: 'badge', 
      sortable: true,
      badgeMap: {
        'HOSP': { label: 'Hospital', color: 'blue' },
        'PH': { label: 'Policy Holder', color: 'green' }
      }
    },
    { key: 'question_count', label: 'Questions', type: 'number', sortable: true, align: 'center' },
    { key: 'is_active', label: 'Status', type: 'toggle', sortable: true }
  ];

  rowActions: DataTableAction[] = [
    { id: 'view', title: 'View Questions', iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color: 'blue' },
    { id: 'edit', title: 'Edit', iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'indigo', permission: 'MQ_TEMPLATES_MGMT.UPDATE' },
    { id: 'delete', title: 'Delete', iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', color: 'red', permission: 'MQ_TEMPLATES_MGMT.DELETE' }
  ];

  // Questions panel
  selectedTemplate: MqTemplateListItem | null = null;
  questions: MqTemplateQuestion[] = [];
  loadingQuestions = false;

  // Template modal
  showTemplateModal = false;
  editingTemplate: MqTemplateListItem | null = null;
  templateForm: Partial<CreateMqTemplateDto> = { recipient_type: 'HOSP', is_active: true };
  mqCategories: LookupItem[] = [];
  
  // Dropdown options
  recipientTypeOptions: DropdownOption[] = [
    { value: 'HOSP', label: 'Hospital' },
    { value: 'PH', label: 'Policy Holder' }
  ];
  categoryOptions: DropdownOption[] = [];

  // Question modal
  showQuestionModal = false;
  editingQuestion: MqTemplateQuestion | null = null;
  questionForm: Partial<CreateMqQuestionDto & { question_id?: number }> = { required_lines: 1, sort_order: 0 };

  constructor(
    private mqTemplateService: MqTemplateService,
    private lookupService: LookupService,
    private toast: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void { 
    this.loadTemplates(); 
    this.loadMqCategories();
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadMqCategories(): void {
    this.lookupService.getLookupByCategory('MQ_CATEGORY')
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.mqCategories = items;
        this.categoryOptions = items.map(cat => ({
          value: cat.lookup_value,
          label: cat.lookup_value
        }));
      });
  }

  // ─── Templates ─────────────────────────────────────────────────────────────

  onFilterChange(filters: DataTableFilterState): void {
    // Store all filter values
    this.currentFilters = {
      search: filters['search'] || undefined,
      recipient_type: filters['recipient_type'] || undefined,
      is_active: filters['is_active'] === 'true' ? true : filters['is_active'] === 'false' ? false : undefined
    };
    
    this.pagination = { ...this.pagination, page: filters.page, limit: filters.limit };
    this.loadTemplates();
  }

  onToggleStatus(event: { row: any; column: any; newValue: boolean }): void {
    const template = event.row as MqTemplateListItem;
    this.pendingToggle = { template, newValue: event.newValue };
    this.showToggleConfirm = true;
  }

  confirmToggleStatus(): void {
    if (!this.pendingToggle) return;

    const { template, newValue } = this.pendingToggle;
    this.showToggleConfirm = false;
    this.pendingToggle = null;

    // Optimistic update
    template.is_active = newValue;

    this.mqTemplateService.updateTemplate(template.template_id, { is_active: newValue } as UpdateMqTemplateDto).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.toast.success(`${template.template_category} ${newValue ? 'activated' : 'deactivated'} successfully`);
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('Error updating template status', error);
        this.toast.error(error.error?.message || 'Failed to update template status');
        this.loadTemplates(); // Revert optimistic update
      }
    });
  }

  cancelToggleStatus(): void {
    this.showToggleConfirm = false;
    this.pendingToggle = null;
    this.loadTemplates(); // Revert UI
  }

  onRowAction(event: DataTableRowActionEvent): void {
    const template = event.row as MqTemplateListItem;
    switch (event.action) {
      case 'view':
        this.selectTemplate(template);
        break;
      case 'edit':
        this.editTemplate(template);
        break;
      case 'delete':
        this.templateToDelete = template;
        this.showDeleteTemplateConfirm = true;
        break;
    }
  }

  performDeleteTemplate(): void {
    if (!this.templateToDelete) return;

    const template = this.templateToDelete;
    this.showDeleteTemplateConfirm = false;
    this.templateToDelete = null;

    this.mqTemplateService.deleteTemplate(template.template_id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        if (this.selectedTemplate?.template_id === template.template_id) {
          this.selectedTemplate = null;
          this.questions = [];
        }
        this.loadTemplates();
        this.toast.success('Template deleted');
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('Error deleting template', error);
        this.toast.error(error.error?.message || 'Failed to delete template');
      }
    });
  }

  cancelDeleteTemplate(): void {
    this.showDeleteTemplateConfirm = false;
    this.templateToDelete = null;
  }

  loadTemplates(): void {
    this.loading = true;
    const filters: MqTemplateFilters = {
      ...this.currentFilters,
      page: this.pagination.page,
      limit: this.pagination.limit,
      sort_by: 'template_id',
      sort_order: 'ASC'
    };

    this.mqTemplateService.getTemplates(filters)
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
        error: (error: HttpErrorResponse) => { this.logger.error('Error loading templates', error); this.toast.error('Failed to load templates'); this.loading = false; }
      });
  }

  selectTemplate(tmpl: MqTemplateListItem): void {
    this.selectedTemplate = tmpl;
    this.loadQuestions(tmpl.template_id);
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
      error: (error: HttpErrorResponse) => { this.saving = false; this.toast.error(error.error?.message || 'Failed to save template'); }
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
      error: (error: HttpErrorResponse) => { this.saving = false; this.toast.error(error.error?.message || 'Failed to save question'); }
    });
  }

  performDeleteQuestion(): void {
    if (!this.questionToDelete) return;

    const question = this.questionToDelete;
    this.showDeleteQuestionConfirm = false;
    this.questionToDelete = null;

    this.mqTemplateService.deleteQuestion(question.question_id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loadQuestions(this.selectedTemplate!.template_id);
        this.toast.success('Question deleted');
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('Error deleting question', error);
        this.toast.error(error.error?.message || 'Failed to delete question');
      }
    });
  }

  cancelDeleteQuestion(): void {
    this.showDeleteQuestionConfirm = false;
    this.questionToDelete = null;
  }

  deleteQuestion(q: MqTemplateQuestion): void {
    this.questionToDelete = q;
    this.showDeleteQuestionConfirm = true;
  }
}
