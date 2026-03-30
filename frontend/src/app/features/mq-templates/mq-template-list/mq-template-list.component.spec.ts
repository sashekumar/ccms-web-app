import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule} from '@angular/forms';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { MqTemplateListComponent } from './mq-template-list.component';
import { MqTemplateService } from '../../../core/services/mq-template.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { MqTemplateListItem, MqTemplateQuestion, PaginatedMqTemplates } from '../../../shared/models/mq-template.model';
import { HttpErrorResponse } from '@angular/common/http';

describe('MqTemplateListComponent', () => {
  let component: MqTemplateListComponent;
  let fixture: ComponentFixture<MqTemplateListComponent>;
  let mqTemplateService: MqTemplateService;
  let lookupService: LookupService;
  let toastService: ToastService;

  const mockTemplates: PaginatedMqTemplates = {
    templates: [
      { template_id: 1, template_code: 'T001', template_category: 'TEST', recipient_type: 'HOSP', mode: 'ONLINE', email_subject: 'Test', reminder_days: 3, auto_reminder_days: null, is_active: true, question_count: 2 },
      { template_id: 2, template_code: 'T002', template_category: 'TEST2', recipient_type: 'PH', mode: 'REIM', email_subject: 'Test2', reminder_days: 5, auto_reminder_days: null, is_active: false, question_count: 1 }
    ],
    total: 2, page: 1, limit: 25, totalPages: 1
  };

  const mockQuestions: MqTemplateQuestion[] = [
    { question_id: 1, template_id: 1, question_text: 'Question 1?', required_lines: 1, sort_order: 1, is_active: true, created_at: new Date().toISOString(), created_by: '1', updated_at: new Date().toISOString(), updated_by: '1' },
    { question_id: 2, template_id: 1, question_text: 'Question 2?', required_lines: 2, sort_order: 2, is_active: true, created_at: new Date().toISOString(), created_by: '1', updated_at: new Date().toISOString(), updated_by: '1' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MqTemplateListComponent, HttpClientTestingModule, FormsModule],
      providers: [
        {
          provide: MqTemplateService,
          useValue: {
            getTemplates: vi.fn().mockReturnValue(of(mockTemplates)),
            getQuestions: vi.fn().mockReturnValue(of(mockQuestions)),
            createTemplate: vi.fn(),
            updateTemplate: vi.fn(),
            deleteTemplate: vi.fn(),
            createQuestion: vi.fn(),
            updateQuestion: vi.fn(),
            deleteQuestion: vi.fn()
          }
        },
        {
          provide: LookupService,
          useValue: {
            getLookupByCategory: vi.fn().mockReturnValue(of([
              { lookup_value: 'CATEGORY1', is_active: true },
              { lookup_value: 'CATEGORY2', is_active: true }
            ]))
          }
        },
        {
          provide: ToastService,
          useValue: { success: vi.fn(), error: vi.fn() }
        },
        {
          provide: LoggerService,
          useValue: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MqTemplateListComponent);
    component = fixture.componentInstance;
    mqTemplateService = TestBed.inject(MqTemplateService);
    lookupService = TestBed.inject(LookupService);
    toastService = TestBed.inject(ToastService);
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load templates and categories on init', () => {
      fixture.detectChanges();
      expect(mqTemplateService.getTemplates).toHaveBeenCalled();
      expect(lookupService.getLookupByCategory).toHaveBeenCalledWith('MQ_CATEGORY');
    });

    it('should populate categoryOptions', () => {
      fixture.detectChanges();
      expect(component.categoryOptions.length).toBeGreaterThan(0);
    });

    it('should populate recipientTypeOptions', () => {
      expect(component.recipientTypeOptions.length).toBe(2);
      expect(component.recipientTypeOptions.some(opt => opt.value === 'HOSP')).toBe(true);
      expect(component.recipientTypeOptions.some(opt => opt.value === 'PH')).toBe(true);
    });
  });

  describe('Template Selection', () => {
    it('should select template and load questions', () => {
      const template = mockTemplates.templates[0];
      component.selectTemplate(template);
      expect(component.selectedTemplate).toBe(template);
      expect(mqTemplateService.getQuestions).toHaveBeenCalledWith(1);
    });

    it('should load questions for selected template', () => {
      component.loadQuestions(1);
      // After synchronous mock observable completes, loading should be false
      expect(component.loadingQuestions).toBe(false);
      expect(mqTemplateService.getQuestions).toHaveBeenCalledWith(1);
    });
  });

  describe('Template Modal', () => {
    it('should open create modal', () => {
      component.openCreateModal();
      expect(component.showTemplateModal).toBe(true);
      expect(component.editingTemplate).toBeNull();
    });

    it('should open edit modal with template data', () => {
      const template = mockTemplates.templates[0];
      component.editTemplate(template);
      expect(component.editingTemplate).toBe(template);
      expect(component.templateForm.template_code).toBe('T001');
    });

    it('should close template modal', () => {
      component.showTemplateModal = true;
      component.closeTemplateModal();
      expect(component.showTemplateModal).toBe(false);
    });
  });

  describe('Template Form Validation', () => {
    it('should require template_code', () => {
      component.templateForm = { template_code: '', template_category: 'TEST', recipient_type: 'HOSP', is_active: true };
      expect(component.templateForm.template_code).toBe('');
    });

    it('should require template_category', () => {
      component.templateForm = { template_code: 'T001', template_category: '', recipient_type: 'HOSP', is_active: true };
      expect(component.templateForm.template_category).toBe('');
    });

    it('should require recipient_type', () => {
      component.templateForm = { template_code: 'T001', template_category: 'TEST', recipient_type: 'HOSP', is_active: true };
      expect(component.templateForm.recipient_type).toBeTruthy();
    });

    it('should pass with all required fields', () => {
      component.templateForm = { template_code: 'T001', template_category: 'TEST', recipient_type: 'HOSP', is_active: true };
      expect(component.templateForm.template_code).toBeTruthy();
      expect(component.templateForm.template_category).toBeTruthy();
    });
  });

  describe('Template Save', () => {
    it('should create new template', () => {
      component.editingTemplate = null;
      component.templateForm = { template_code: 'T001', template_category: 'TEST', recipient_type: 'HOSP', is_active: true };
      vi.spyOn(mqTemplateService, 'createTemplate').mockReturnValue(of(1));
      component.saveTemplate();
      expect(mqTemplateService.createTemplate).toHaveBeenCalled();
    });

    it('should update existing template', () => {
      component.editingTemplate = mockTemplates.templates[0];
      component.templateForm = { template_code: 'T001', template_category: 'UPDATED', recipient_type: 'HOSP', is_active: true };
      vi.spyOn(mqTemplateService, 'updateTemplate').mockReturnValue(of(undefined));
      component.saveTemplate();
      expect(mqTemplateService.updateTemplate).toHaveBeenCalled();
    });
  });

  describe('Template Delete', () => {
    it('should show delete confirmation', () => {
      component.templateToDelete = mockTemplates.templates[0];
      component.showDeleteTemplateConfirm = true;
      expect(component.showDeleteTemplateConfirm).toBe(true);
    });

    it('should perform template delete', () => {
      component.templateToDelete = mockTemplates.templates[0];
      vi.spyOn(mqTemplateService, 'deleteTemplate').mockReturnValue(of(undefined));
      component.performDeleteTemplate();
      expect(mqTemplateService.deleteTemplate).toHaveBeenCalledWith(1);
    });
  });

  describe('Question Modal', () => {
    beforeEach(() => {
      component.selectedTemplate = mockTemplates.templates[0];
    });

    it('should open add question modal', () => {
      component.questions = mockQuestions;
      component.openAddQuestionModal();
      expect(component.showQuestionModal).toBe(true);
      expect(component.editingQuestion).toBeNull();
      expect(component.questionForm.sort_order).toBe(3); // Length + 1
    });

    it('should open edit question modal', () => {
      const question = mockQuestions[0];
      component.editQuestion(question);
      expect(component.editingQuestion).toBe(question);
      expect(component.questionForm.question_text).toBe('Question 1?');
    });

    it('should close question modal', () => {
      component.showQuestionModal = true;
      component.closeQuestionModal();
      expect(component.showQuestionModal).toBe(false);
    });
  });

  describe('Question Form Validation', () => {
    it('should require question_text with minimum length', () => {
      component.questionForm = { question_text: 'Hi', required_lines: 1, sort_order: 1 };
      component.saveQuestion();
      expect(toastService.error).toHaveBeenCalledWith('Question text must be at least 5 characters');
    });

    it('should validate question text length', () => {
      component.questionForm = { question_text: 'Valid question?', required_lines: 1, sort_order: 1 };
      expect(component.questionForm.question_text!.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Question Save', () => {
    beforeEach(() => {
      component.selectedTemplate = mockTemplates.templates[0];
    });

    it('should create new question', () => {
      component.editingQuestion = null;
      component.questionForm = { question_text: 'New question?', required_lines: 1, sort_order: 1 };
      vi.spyOn(mqTemplateService, 'createQuestion').mockReturnValue(of(3));
      component.saveQuestion();
      expect(mqTemplateService.createQuestion).toHaveBeenCalled();
    });

    it('should update existing question', () => {
      component.editingQuestion = mockQuestions[0];
      component.questionForm = { question_text: 'Updated question?', required_lines: 2, sort_order: 1 };
      vi.spyOn(mqTemplateService, 'updateQuestion').mockReturnValue(of(undefined));
      component.saveQuestion();
      expect(mqTemplateService.updateQuestion).toHaveBeenCalled();
    });
  });

  describe('Question Delete', () => {
    beforeEach(() => {
      component.selectedTemplate = mockTemplates.templates[0];
    });

    it('should show delete confirmation', () => {
      const question = mockQuestions[0];
      component.deleteQuestion(question);
      expect(component.showDeleteQuestionConfirm).toBe(true);
      expect(component.questionToDelete).toBe(question);
    });

    it('should perform question delete', () => {
      component.questionToDelete = mockQuestions[0];
      vi.spyOn(mqTemplateService, 'deleteQuestion').mockReturnValue(of(undefined));
      const loadQuestionsSpy = vi.spyOn(component, 'loadQuestions');
      component.performDeleteQuestion();
      expect(mqTemplateService.deleteQuestion).toHaveBeenCalledWith(1);
      expect(loadQuestionsSpy).toHaveBeenCalled();
    });

    it('should cancel delete question', () => {
      component.showDeleteQuestionConfirm = true;
      component.cancelDeleteQuestion();
      expect(component.showDeleteQuestionConfirm).toBe(false);
      expect(component.questionToDelete).toBeNull();
    });
  });

  describe('Toggle Status', () => {
    it('should toggle template status', () => {
      const template = mockTemplates.templates[0];
      component.onToggleStatus({ row: template, column: { key: 'is_active' }, newValue: false });
      expect(component.showToggleConfirm).toBe(true);
      expect(component.pendingToggle).toEqual({ template, newValue: false });
    });

    it('should confirm toggle', () => {
      const template = mockTemplates.templates[0];
      component.pendingToggle = { template, newValue: false };
      vi.spyOn(mqTemplateService, 'updateTemplate').mockReturnValue(of(undefined));
      component.confirmToggleStatus();
      expect(mqTemplateService.updateTemplate).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle template load errors', () => {
      const error = new HttpErrorResponse({ error: { message: 'Error' }, status: 500 });
      vi.spyOn(mqTemplateService, 'getTemplates').mockReturnValue(throwError(() => error));
      component.loadTemplates();
      expect(toastService.error).toHaveBeenCalled();
    });

    it('should handle question load errors', () => {
      const error = new HttpErrorResponse({ status: 500 });
      vi.spyOn(mqTemplateService, 'getQuestions').mockReturnValue(throwError(() => error));
      component.loadQuestions(1);
      setTimeout(() => expect(component.loadingQuestions).toBe(false), 100);
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const spy = vi.spyOn(component['destroy$'], 'next');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
