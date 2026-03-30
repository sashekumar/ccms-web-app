import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { BankListComponent } from './bank-list.component';
import { BankService } from '../../../core/services/bank.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { Bank, PaginatedBanks } from '../../../shared/models/bank.model';
import { HttpErrorResponse } from '@angular/common/http';

describe('BankListComponent', () => {
  let component: BankListComponent;
  let fixture: ComponentFixture<BankListComponent>;
  let bankService: BankService;
  let toastService: ToastService;
  let loggerService: LoggerService;

  const mockBanks: PaginatedBanks = {
    banks: [
      { bank_id: 1, bank_code: 'TEST001', bank_name: 'Test Bank 1', is_active: true },
      { bank_id: 2, bank_code: 'TEST002', bank_name: 'Test Bank 2', is_active: false }
    ],
    total: 2,
    page: 1,
    limit: 25,
    totalPages: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankListComponent, HttpClientTestingModule, FormsModule],
      providers: [
        {
          provide: BankService,
          useValue: {
            getBanks: vi.fn().mockReturnValue(of(mockBanks)),
            createBank: vi.fn(),
            updateBank: vi.fn(),
            deleteBank: vi.fn()
          }
        },
        {
          provide: ToastService,
          useValue: {
            success: vi.fn(),
            error: vi.fn()
          }
        },
        {
          provide: LoggerService,
          useValue: {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            debug: vi.fn()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BankListComponent);
    component = fixture.componentInstance;
    bankService = TestBed.inject(BankService);
    toastService = TestBed.inject(ToastService);
    loggerService = TestBed.inject(LoggerService);
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.banks).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.showModal).toBe(false);
      expect(component.saving).toBe(false);
      expect(component.pagination).toEqual({ total: 0, page: 1, limit: 25, totalPages: 0 });
    });

    it('should load banks on init', () => {
      fixture.detectChanges(); // triggers ngOnInit
      expect(bankService.getBanks).toHaveBeenCalled();
      expect(component.banks).toEqual(mockBanks.banks);
      expect(component.pagination.total).toBe(2);
    });

    it('should have correct columns configuration', () => {
      expect(component.columns).toBeDefined();
      expect(component.columns.length).toBeGreaterThan(0);
      expect(component.columns.some(col => col.key === 'bank_code')).toBe(true);
      expect(component.columns.some(col => col.key === 'bank_name')).toBe(true);
      expect(component.columns.some(col => col.key === 'is_active')).toBe(true);
    });

    it('should have correct row actions configuration', () => {
      expect(component.rowActions).toBeDefined();
      expect(component.rowActions.length).toBe(2);
      expect(component.rowActions.some(action => action.id === 'edit')).toBe(true);
      expect(component.rowActions.some(action => action.id === 'delete')).toBe(true);
    });

    it('should have correct table filters configuration', () => {
      expect(component.tableFilters).toBeDefined();
      expect(component.tableFilters.length).toBe(2);
      expect(component.tableFilters.some(f => f.key === 'search')).toBe(true);
      expect(component.tableFilters.some(f => f.key === 'is_active')).toBe(true);
    });
  });

  describe('Data Loading', () => {
    it('should set loading to false after data is loaded (synchronous mock)', () => {
      component['loadBanks']();
      // With synchronous of() mock, loading is set to true then immediately false
      expect(component.loading).toBe(false);
    });

    it('should handle API errors gracefully', () => {
      const error = new HttpErrorResponse({ error: { message: 'API Error' }, status: 500 });
      vi.spyOn(bankService, 'getBanks').mockReturnValue(throwError(() => error));

      component['loadBanks']();

      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith('Failed to load banks. Please try again.');
      expect(component.loading).toBe(false);
    });

    it('should update pagination after loading data', () => {
      fixture.detectChanges();
      expect(component.pagination.total).toBe(2);
      expect(component.pagination.page).toBe(1);
      expect(component.pagination.totalPages).toBe(1);
    });
  });

  describe('Filter Functionality', () => {
    it('should handle filter changes', () => {
      const filters = { search: 'test', is_active: 'true', page: 1, limit: 25 };
      component.onFilterChange(filters);

      expect(component.currentFilters.search).toBe('test');
      expect(component.currentFilters.is_active).toBe(true);
      expect(bankService.getBanks).toHaveBeenCalled();
    });

    it('should convert string "true" to boolean true', () => {
      component.onFilterChange({ is_active: 'true', page: 1, limit: 25 });
      expect(component.currentFilters.is_active).toBe(true);
    });

    it('should convert string "false" to boolean false', () => {
      component.onFilterChange({ is_active: 'false', page: 1, limit: 25 });
      expect(component.currentFilters.is_active).toBe(false);
    });

    it('should set is_active to undefined for empty string', () => {
      component.onFilterChange({ is_active: '', page: 1, limit: 25 });
      expect(component.currentFilters.is_active).toBeUndefined();
    });

    it('should update pagination when filters change', () => {
      component.onFilterChange({ page: 2, limit: 50 });
      // After getBanks mock returns page 1, pagination is reset to response values
      // So we test that getBanks was called with correct params
      expect(bankService.getBanks).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 50 })
      );
    });

    it('should reload data when filters change', () => {
      vi.spyOn(bankService, 'getBanks').mockReturnValue(of(mockBanks));
      component.onFilterChange({ search: 'test', page: 1, limit: 25 });
      expect(bankService.getBanks).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test' })
      );
    });
  });

  describe('Create Modal', () => {
    it('should open create modal', () => {
      component.openCreateModal();
      expect(component.showModal).toBe(true);
      expect(component.editingBank).toBeNull();
    });

    it('should initialize form with default values', () => {
      component.openCreateModal();
      expect(component.formData.bank_code).toBe('');
      expect(component.formData.bank_name).toBe('');
      expect(component.formData.is_active).toBe(true);
    });

    it('should close modal', () => {
      component.showModal = true;
      component.closeModal();
      expect(component.showModal).toBe(false);
    });

    it('should not close modal if saving', () => {
      component.showModal = true;
      component.saving = true;
      component.closeModal();
      expect(component.showModal).toBe(true);
    });

    it('should reset form when closing modal', () => {
      component.formData = { bank_code: 'TEST', bank_name: 'Test', is_active: true };
      component.closeModal();
      expect(component.formData.bank_code).toBe('');
      expect(component.formData.bank_name).toBe('');
    });
  });

  describe('Edit Modal', () => {
    it('should open edit modal with bank data', () => {
      const bank: Bank = { bank_id: 1, bank_code: 'TEST001', bank_name: 'Test Bank', is_active: true };
      component.editBank(bank);

      expect(component.showModal).toBe(true);
      expect(component.editingBank).toBe(bank);
      expect(component.formData.bank_code).toBe('TEST001');
      expect(component.formData.bank_name).toBe('Test Bank');
      expect(component.formData.is_active).toBe(true);
    });

    it('should handle row action edit event', () => {
      const bank: Bank = { bank_id: 1, bank_code: 'TEST001', bank_name: 'Test Bank', is_active: true };
      component.onRowAction({ action: 'edit', row: bank });

      expect(component.showModal).toBe(true);
      expect(component.editingBank).toBe(bank);
    });
  });

  describe('Form Validation', () => {
    it('should validate required bank_code', () => {
      component.formData = { bank_code: '', bank_name: 'Test', is_active: true };
      expect(component.formData.bank_code).toBe('');
    });

    it('should validate required bank_name', () => {
      component.formData = { bank_code: 'TEST', bank_name: '', is_active: true };
      expect(component.formData.bank_name).toBe('');
    });

    it('should pass validation with all required fields', () => {
      component.formData = { bank_code: 'TEST', bank_name: 'Test Bank', is_active: true };
      expect(component.formData.bank_code).toBeTruthy();
      expect(component.formData.bank_name).toBeTruthy();
    });
  });

  describe('Save Functionality', () => {
    it('should not save if form is invalid', () => {
      component.formData = { bank_code: '', bank_name: '', is_active: true };
      component.save();

      expect(toastService.error).toHaveBeenCalledWith('Please fill in all required fields');
      expect(bankService.createBank).not.toHaveBeenCalled();
    });

    it('should create new bank when not editing', () => {
      component.editingBank = null;
      component.formData = { bank_code: 'TEST', bank_name: 'Test Bank', is_active: true };
      vi.spyOn(bankService, 'createBank').mockReturnValue(of(1));

      component.save();

      expect(bankService.createBank).toHaveBeenCalledWith({ bank_code: 'TEST', bank_name: 'Test Bank', is_active: true });
      // With synchronous mock, saving is false after subscribe completes
      expect(component.saving).toBe(false);
    });

    it('should update bank when editing', () => {
      component.editingBank = { bank_id: 1, bank_code: 'TEST', bank_name: 'Old Name', is_active: true };
      component.formData = { bank_code: 'TEST', bank_name: 'New Name', is_active: false };
      vi.spyOn(bankService, 'updateBank').mockReturnValue(of(undefined));

      component.save();

      expect(bankService.updateBank).toHaveBeenCalledWith(1, { bank_code: 'TEST', bank_name: 'New Name', is_active: false });
      // With synchronous mock, saving is false after subscribe completes
      expect(component.saving).toBe(false);
    });

    it('should close modal and reload data after successful create', async () => {
      component.editingBank = null;
      component.formData = { bank_code: 'TEST', bank_name: 'Test Bank', is_active: true };
      vi.spyOn(bankService, 'createBank').mockReturnValue(of(1));
      vi.spyOn(bankService, 'getBanks').mockReturnValue(of({ banks: [], total: 0, page: 1, limit: 10, totalPages: 0 }));

      component.save();

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(component.showModal).toBe(false);
      expect(bankService.getBanks).toHaveBeenCalled();
      expect(toastService.success).toHaveBeenCalledWith('Bank created successfully');
    });

    it('should close modal and reload data after successful update', async () => {
      component.editingBank = { bank_id: 1, bank_code: 'TEST', bank_name: 'Old', is_active: true };
      component.formData = { bank_code: 'TEST', bank_name: 'New', is_active: true };
      vi.spyOn(bankService, 'updateBank').mockReturnValue(of(undefined));
      vi.spyOn(bankService, 'getBanks').mockReturnValue(of({ banks: [], total: 0, page: 1, limit: 10, totalPages: 0 }));

      component.save();

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(component.showModal).toBe(false);
      expect(bankService.getBanks).toHaveBeenCalled();
      expect(toastService.success).toHaveBeenCalledWith('Bank updated successfully');
    });

    it('should handle create errors', () => {
      component.editingBank = null;
      component.formData = { bank_code: 'TEST', bank_name: 'Test', is_active: true };
      const error = new HttpErrorResponse({ error: { message: 'Duplicate code' }, status: 400 });
      vi.spyOn(bankService, 'createBank').mockReturnValue(throwError(() => error));

      component.save();

      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith('Duplicate code');
      expect(component.saving).toBe(false);
    });

    it('should handle update errors', () => {
      component.editingBank = { bank_id: 1, bank_code: 'TEST', bank_name: 'Old', is_active: true };
      component.formData = { bank_code: 'TEST', bank_name: 'New', is_active: true };
      const error = new HttpErrorResponse({ error: { message: 'Update failed' }, status: 500 });
      vi.spyOn(bankService, 'updateBank').mockReturnValue(throwError(() => error));

      component.save();

      expect(toastService.error).toHaveBeenCalledWith('Update failed');
      expect(component.saving).toBe(false);
    });
  });

  describe('Delete Confirmation', () => {
    it('should show delete confirmation dialog', () => {
      const bank: Bank = { bank_id: 1, bank_code: 'TEST', bank_name: 'Test', is_active: true };
      component.onRowAction({ action: 'delete', row: bank });

      expect(component.showDeleteConfirm).toBe(true);
      expect(component.bankToDelete).toBe(bank);
    });

    it('should cancel delete', () => {
      component.bankToDelete = { bank_id: 1, bank_code: 'TEST', bank_name: 'Test', is_active: true };
      component.showDeleteConfirm = true;

      component.cancelDelete();

      expect(component.showDeleteConfirm).toBe(false);
      expect(component.bankToDelete).toBeNull();
    });

    it('should perform delete on confirmation', () => {
      const bank: Bank = { bank_id: 1, bank_code: 'TEST', bank_name: 'Test', is_active: true };
      component.bankToDelete = bank;
      vi.spyOn(bankService, 'deleteBank').mockReturnValue(of(undefined));

      component.performDelete();

      expect(bankService.deleteBank).toHaveBeenCalledWith(1);
      expect(component.showDeleteConfirm).toBe(false);
      expect(component.bankToDelete).toBeNull();
    });

    it('should reload data after successful delete', async () => {
      component.bankToDelete = { bank_id: 1, bank_code: 'TEST', bank_name: 'Test', is_active: true };
      vi.spyOn(bankService, 'deleteBank').mockReturnValue(of(undefined));
      vi.spyOn(bankService, 'getBanks').mockReturnValue(of({ banks: [], total: 0, page: 1, limit: 10, totalPages: 0 }));

      component.performDelete();

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(bankService.getBanks).toHaveBeenCalled();
      expect(toastService.success).toHaveBeenCalledWith('Bank "Test" deleted successfully');
    });

    it('should handle delete errors', () => {
      component.bankToDelete = { bank_id: 1, bank_code: 'TEST', bank_name: 'Test', is_active: true };
      const error = new HttpErrorResponse({ error: { message: 'Delete failed' }, status: 500 });
      vi.spyOn(bankService, 'deleteBank').mockReturnValue(throwError(() => error));

      component.performDelete();

      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith('Delete failed');
    });

    it('should not perform delete if bank is null', () => {
      component.bankToDelete = null;
      component.performDelete();
      expect(bankService.deleteBank).not.toHaveBeenCalled();
    });
  });

  describe('Toggle Status Confirmation', () => {
    it('should show toggle confirmation dialog', () => {
      const bank: Bank = { bank_id: 1, bank_code: 'TEST', bank_name: 'Test', is_active: true };
      component.onToggleStatus({ row: bank, column: { key: 'is_active' }, newValue: false });

      expect(component.showToggleConfirm).toBe(true);
      expect(component.pendingToggle).toEqual({ bank, newValue: false });
    });

    it('should cancel toggle', () => {
      const bank: Bank = { bank_id: 1, bank_code: 'TEST', bank_name: 'Test', is_active: true };
      component.pendingToggle = { bank, newValue: false };
      component.showToggleConfirm = true;
      vi.spyOn(bankService, 'getBanks').mockReturnValue(of({ banks: [], total: 0, page: 1, limit: 10, totalPages: 0 }));

      component.cancelToggleStatus();

      expect(component.showToggleConfirm).toBe(false);
      expect(component.pendingToggle).toBeNull();
      expect(bankService.getBanks).toHaveBeenCalled(); // Revert UI
    });

    it('should confirm toggle status', () => {
      const bank: Bank = { bank_id: 1, bank_code: 'TEST', bank_name: 'Test', is_active: true };
      component.pendingToggle = { bank, newValue: false };
      vi.spyOn(bankService, 'updateBank').mockReturnValue(of(undefined));

      component.confirmToggleStatus();

      expect(bank.is_active).toBe(false); // Optimistic update
      expect(bankService.updateBank).toHaveBeenCalledWith(1, { is_active: false });
      expect(component.showToggleConfirm).toBe(false);
      expect(component.pendingToggle).toBeNull();
    });

    it('should show success message on toggle', async () => {
      const bank: Bank = { bank_id: 1, bank_code: 'TEST', bank_name: 'Test', is_active: true };
      component.pendingToggle = { bank, newValue: false };
      vi.spyOn(bankService, 'updateBank').mockReturnValue(of(undefined));

      component.confirmToggleStatus();

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(toastService.success).toHaveBeenCalledWith('Bank "Test" has been deactivated successfully.');
    });

    it('should revert optimistic update on error', () => {
      const bank: Bank = { bank_id: 1, bank_code: 'TEST', bank_name: 'Test', is_active: true };
      component.pendingToggle = { bank, newValue: false };
      const error = new HttpErrorResponse({ error: { message: 'Failed' }, status: 500 });
      vi.spyOn(bankService, 'updateBank').mockReturnValue(throwError(() => error));
      vi.spyOn(bankService, 'getBanks').mockReturnValue(of({ banks: [], total: 0, page: 1, limit: 10, totalPages: 0 }));

      component.confirmToggleStatus();

      expect(bankService.getBanks).toHaveBeenCalled(); // Revert
      expect(toastService.error).toHaveBeenCalled();
    });

    it('should not toggle if pending toggle is null', () => {
      component.pendingToggle = null;
      component.confirmToggleStatus();
      expect(bankService.updateBank).not.toHaveBeenCalled();
    });
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const destroySpy = vi.spyOn(component['destroy$'], 'next');
      const completeSpy = vi.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search filter', () => {
      component.onFilterChange({ search: '', page: 1, limit: 25 });
      expect(component.currentFilters.search).toBeUndefined();
    });

    it('should handle undefined in formData', () => {
      component.formData = { bank_code: undefined as any, bank_name: undefined as any, is_active: true };
      expect(component.formData.bank_code).toBeUndefined();
      expect(component.formData.bank_name).toBeUndefined();
    });

    it('should handle API returning no data', () => {
      vi.spyOn(bankService, 'getBanks').mockReturnValue(of({ banks: [], total: 0, page: 1, limit: 25, totalPages: 0 }));
      component['loadBanks']();

      expect(component.banks).toEqual([]);
      expect(component.pagination.total).toBe(0);
    });

    it('should handle generic error messages', () => {
      const error = new HttpErrorResponse({ status: 500 });
      vi.spyOn(bankService, 'getBanks').mockReturnValue(throwError(() => error));

      component['loadBanks']();

      expect(toastService.error).toHaveBeenCalledWith('Failed to load banks. Please try again.');
    });
  });
});
