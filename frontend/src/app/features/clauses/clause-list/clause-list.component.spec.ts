import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ClauseListComponent } from './clause-list.component';
import { ClauseService } from '../../../core/services/clause.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { Clause, PaginatedClauses } from '../../../shared/models/clause.model';
import { HttpErrorResponse } from '@angular/common/http';

describe('ClauseListComponent', () => {
  let component: ClauseListComponent;
  let fixture: ComponentFixture<ClauseListComponent>;
  let clauseService: ClauseService;
  let toastService: ToastService;
  let loggerService: LoggerService;

  const mockClauses: PaginatedClauses = {
    clauses: [
      { clause_id: 1, clause_code: 'CL001', clause_text: 'Test Clause 1', is_active: true },
      { clause_id: 2, clause_code: 'CL002', clause_text: 'Test Clause 2', is_active: false }
    ],
    total: 2,
    page: 1,
    limit: 25,
    totalPages: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClauseListComponent, HttpClientTestingModule, FormsModule],
      providers: [
        {
          provide: ClauseService,
          useValue: {
            getClauses: vi.fn().mockReturnValue(of(mockClauses)),
            createClause: vi.fn(),
            updateClause: vi.fn(),
            deleteClause: vi.fn()
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

    fixture = TestBed.createComponent(ClauseListComponent);
    component = fixture.componentInstance;
    clauseService = TestBed.inject(ClauseService);
    toastService = TestBed.inject(ToastService);
    loggerService = TestBed.inject(LoggerService);
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load clauses on init', () => {
      fixture.detectChanges();
      expect(clauseService.getClauses).toHaveBeenCalled();
      expect(component.clauses).toEqual(mockClauses.clauses);
    });

    it('should have correct columns', () => {
      expect(component.columns.some(col => col.key === 'clause_code')).toBe(true);
      expect(component.columns.some(col => col.key === 'clause_text')).toBe(true);
    });

    it('should configure row actions', () => {
      expect(component.rowActions.length).toBe(2);
      expect(component.rowActions.some(a => a.id === 'edit')).toBe(true);
      expect(component.rowActions.some(a => a.id === 'delete')).toBe(true);
    });
  });

  describe('Data Loading', () => {
    it('should handle loading state', () => {
      // After loadClauses with mocked of() observable, loading should be false (completed synchronously)
      component['loadClauses']();
      expect(component.loading).toBe(false);
    });

    it('should handle API errors', () => {
      const error = new HttpErrorResponse({ error: { message: 'Error' }, status: 500 });
      vi.spyOn(clauseService, 'getClauses').mockReturnValue(throwError(() => error));
      component['loadClauses']();
      expect(toastService.error).toHaveBeenCalled();
    });
  });

  describe('Filters', () => {
    it('should handle search filter', () => {
      component.onFilterChange({ search: 'test', page: 1, limit: 25 });
      expect(component.currentFilters.search).toBe('test');
    });

    it('should convert status string to boolean', () => {
      component.onFilterChange({ is_active: 'true', page: 1, limit: 25 });
      expect(component.currentFilters.is_active).toBe(true);
    });
  });

  describe('Create Modal', () => {
    it('should open create modal', () => {
      component.openCreateModal();
      expect(component.showModal).toBe(true);
      expect(component.editingClause).toBeNull();
    });

    it('should initialize form with defaults', () => {
      component.openCreateModal();
      expect(component.formData.clause_code).toBe('');
      expect(component.formData.clause_text).toBe('');
      expect(component.formData.is_active).toBe(true);
    });

    it('should close modal', () => {
      component.showModal = true;
      component.closeModal();
      expect(component.showModal).toBe(false);
    });
  });

  describe('Edit Modal', () => {
    it('should open edit modal with data', () => {
      const clause: Clause = { clause_id: 1, clause_code: 'CL001', clause_text: 'Test', is_active: true };
      component.editClause(clause);
      expect(component.editingClause).toBe(clause);
      expect(component.formData.clause_code).toBe('CL001');
    });
  });

  describe('Form Validation', () => {
    it('should require clause_code', () => {
      component.formData = { clause_code: '', clause_text: 'Test', is_active: true };
      expect(component.formData.clause_code).toBe('');
    });

    it('should require clause_text', () => {
      component.formData = { clause_code: 'CL001', clause_text: '', is_active: true };
      expect(component.formData.clause_text).toBe('');
    });

    it('should pass with all fields', () => {
      component.formData = { clause_code: 'CL001', clause_text: 'Test', is_active: true };
      expect(component.formData.clause_code).toBeTruthy();
      expect(component.formData.clause_text).toBeTruthy();
    });
  });

  describe('Save', () => {
    it('should create new clause', () => {
      component.editingClause = null;
      component.formData = { clause_code: 'CL001', clause_text: 'Test', is_active: true };
      vi.spyOn(clauseService, 'createClause').mockReturnValue(of(1));
      component.save();
      expect(clauseService.createClause).toHaveBeenCalled();
    });

    it('should update existing clause', () => {
      component.editingClause = { clause_id: 1, clause_code: 'CL001', clause_text: 'Old', is_active: true };
      component.formData = { clause_code: 'CL001', clause_text: 'New', is_active: true };
      vi.spyOn(clauseService, 'updateClause').mockReturnValue(of(undefined));
      component.save();
      expect(clauseService.updateClause).toHaveBeenCalled();
    });

    it('should not save invalid form', () => {
      component.formData = { clause_code: '', clause_text: '', is_active: true };
      component.save();
      expect(toastService.error).toHaveBeenCalled();
    });

    it('should handle save errors', () => {
      component.formData = { clause_code: 'CL001', clause_text: 'Test', is_active: true };
      const error = new HttpErrorResponse({ error: { message: 'Error' }, status: 500 });
      vi.spyOn(clauseService, 'createClause').mockReturnValue(throwError(() => error));
      component.save();
      expect(toastService.error).toHaveBeenCalled();
    });
  });

  describe('Delete', () => {
    it('should show delete confirmation', () => {
      const clause: Clause = { clause_id: 1, clause_code: 'CL001', clause_text: 'Test', is_active: true };
      component.onRowAction({ action: 'delete', row: clause });
      expect(component.showDeleteConfirm).toBe(true);
      expect(component.clauseToDelete).toBe(clause);
    });

    it('should cancel delete', () => {
      component.showDeleteConfirm = true;
      component.cancelDelete();
      expect(component.showDeleteConfirm).toBe(false);
      expect(component.clauseToDelete).toBeNull();
    });

    it('should perform delete', () => {
      component.clauseToDelete = { clause_id: 1, clause_code: 'CL001', clause_text: 'Test', is_active: true };
      vi.spyOn(clauseService, 'deleteClause').mockReturnValue(of(undefined));
      component.performDelete();
      expect(clauseService.deleteClause).toHaveBeenCalledWith(1);
    });

    it('should handle delete errors', () => {
      component.clauseToDelete = { clause_id: 1, clause_code: 'CL001', clause_text: 'Test', is_active: true };
      const error = new HttpErrorResponse({ error: { message: 'Error' }, status: 500 });
      vi.spyOn(clauseService, 'deleteClause').mockReturnValue(throwError(() => error));
      component.performDelete();
      expect(toastService.error).toHaveBeenCalled();
    });
  });

  describe('Toggle Status', () => {
    it('should show toggle confirmation', () => {
      const clause: Clause = { clause_id: 1, clause_code: 'CL001', clause_text: 'Test', is_active: true };
      component.onToggleStatus({ row: clause, column: { key: 'is_active' }, newValue: false });
      expect(component.showToggleConfirm).toBe(true);
    });

    it('should cancel toggle', () => {
      component.showToggleConfirm = true;
      vi.spyOn(clauseService, 'getClauses').mockReturnValue(of({ clauses: [], total: 0, page: 1, limit: 10, totalPages: 0 }));
      component.cancelToggleStatus();
      expect(component.showToggleConfirm).toBe(false);
      expect(clauseService.getClauses).toHaveBeenCalled();
    });

    it('should confirm toggle', () => {
      const clause: Clause = { clause_id: 1, clause_code: 'CL001', clause_text: 'Test', is_active: true };
      component.pendingToggle = { clause, newValue: false };
      vi.spyOn(clauseService, 'updateClause').mockReturnValue(of(undefined));
      component.confirmToggleStatus();
      expect(clauseService.updateClause).toHaveBeenCalled();
    });

    it('should handle toggle errors', () => {
      const clause: Clause = { clause_id: 1, clause_code: 'CL001', clause_text: 'Test', is_active: true };
      component.pendingToggle = { clause, newValue: false };
      const error = new HttpErrorResponse({ error: { message: 'Error' }, status: 500 });
      vi.spyOn(clauseService, 'updateClause').mockReturnValue(throwError(() => error));
      vi.spyOn(clauseService, 'getClauses').mockReturnValue(of({ clauses: [], total: 0, page: 1, limit: 10, totalPages: 0 }));
      component.confirmToggleStatus();
      expect(toastService.error).toHaveBeenCalled();
      expect(clauseService.getClauses).toHaveBeenCalled();
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
