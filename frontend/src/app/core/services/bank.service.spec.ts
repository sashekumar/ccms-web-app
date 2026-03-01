import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BankService, ApiResponse } from './bank.service';
import { Bank, BankFilters, PaginatedBanks, CreateBankDto, UpdateBankDto } from '../../shared/models/bank.model';
import { environment } from '../../../environments/environment';

describe('BankService', () => {
  let service: BankService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  const mockBank: Bank = {
    bank_id: 1,
    bank_code: 'TEST001',
    bank_name: 'Test Bank',
    is_active: true
  };

  const mockBanks: PaginatedBanks = {
    banks: [
      {
        bank_id: 1,
        bank_code: 'TEST001',
        bank_name: 'Test Bank',
        is_active: true
      },
      {
        bank_id: 2,
        bank_code: 'TEST002',
        bank_name: 'Test Bank 2',
        is_active: false
      }
    ],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BankService]
    });

    service = TestBed.inject(BankService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('getBanks()', () => {
    it('should retrieve paginated banks with filters', () => {
      const filters: BankFilters = {
        search: 'test',
        page: 1,
        limit: 10,
        is_active: true
      };

      const mockResponse: ApiResponse<PaginatedBanks> = {
        success: true,
        message: 'Banks retrieved',
        data: mockBanks
      };

      service.getBanks(filters).subscribe({
        next: (result) => {
          expect(result).toEqual(mockBanks);
          expect(result.banks.length).toBe(2);
          expect(result.total).toBe(2);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/list`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filters);
      req.flush(mockResponse);
    });

    it('should handle empty filters', () => {
      const mockResponse: ApiResponse<PaginatedBanks> = {
        success: true,
        data: mockBanks
      };

      service.getBanks().subscribe({
        next: (result) => {
          expect(result).toEqual(mockBanks);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/list`);
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should handle empty results', () => {
      const emptyResult: PaginatedBanks = {
        banks: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };

      const mockResponse: ApiResponse<PaginatedBanks> = {
        success: true,
        data: emptyResult
      };

      service.getBanks({ search: 'nonexistent' }).subscribe({
        next: (result) => {
          expect(result.banks.length).toBe(0);
          expect(result.total).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/list`);
      req.flush(mockResponse);
    });
  });

  describe('getBankById()', () => {
    it('should retrieve bank by ID', () => {
      const mockResponse: ApiResponse<Bank> = {
        success: true,
        data: mockBank
      };

      service.getBankById(1).subscribe({
        next: (bank) => {
          expect(bank).toEqual(mockBank);
          expect(bank.bank_id).toBe(1);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/get`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ bank_id: 1 });
      req.flush(mockResponse);
    });

    it('should handle bank not found', async () => {
      const testPromise = new Promise<void>((resolve, reject) => {
        service.getBankById(999).subscribe({
          next: () => reject(new Error('Should have failed')),
          error: (error) => {
            try {
              expect(error.status).toBe(404);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/get`);
      req.flush({ message: 'Bank not found' }, { status: 404, statusText: 'Not Found' });

      await testPromise;
    });
  });

  describe('createBank()', () => {
    it('should create a new bank', () => {
      const createDto: CreateBankDto = {
        bank_code: 'NEW001',
        bank_name: 'New Bank',
        is_active: true
      };

      const mockResponse: ApiResponse<{ bank_id: number }> = {
        success: true,
        message: 'Bank created',
        data: { bank_id: 3 }
      };

      service.createBank(createDto).subscribe({
        next: (result) => {
          expect(result).toBe(3);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });

    it('should handle duplicate bank code error', async () => {
      const createDto: CreateBankDto = {
        bank_code: 'TEST001',
        bank_name: 'Duplicate Bank',
        is_active: true
      };

      const testPromise = new Promise<void>((resolve, reject) => {
        service.createBank(createDto).subscribe({
          next: () => reject(new Error('Should have failed')),
          error: (error) => {
            try {
              expect(error.status).toBe(409);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/create`);
      req.flush({ message: 'Bank code already exists' }, { status: 409, statusText: 'Conflict' });

      await testPromise;
    });
  });

  describe('updateBank()', () => {
    it('should update an existing bank', () => {
      const updateDto: UpdateBankDto = {
        bank_name: 'Updated Bank Name'
      };

      const mockResponse: ApiResponse<void> = {
        success: true,
        message: 'Bank updated',
        data: undefined as any
      };

      service.updateBank(1, updateDto).subscribe({
        next: () => {
          expect(true).toBe(true);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/update`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ bank_id: 1, ...updateDto });
      req.flush(mockResponse);
    });

    it('should handle update of non-existent bank', async () => {
      const updateDto: UpdateBankDto = {
        bank_name: 'Updated Name'
      };

      const testPromise = new Promise<void>((resolve, reject) => {
        service.updateBank(999, updateDto).subscribe({
          next: () => reject(new Error('Should have failed')),
          error: (error) => {
            try {
              expect(error.status).toBe(404);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/update`);
      req.flush({ message: 'Bank not found' }, { status: 404, statusText: 'Not Found' });

      await testPromise;
    });
  });

  describe('deleteBank()', () => {
    it('should delete a bank', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        message: 'Bank deleted',
        data: undefined as any
      };

      service.deleteBank(1).subscribe({
        next: () => {
          expect(true).toBe(true);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/delete`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ bank_id: 1 });
      req.flush(mockResponse);
    });

    it('should handle delete of non-existent bank', async () => {
      const testPromise = new Promise<void>((resolve, reject) => {
        service.deleteBank(999).subscribe({
          next: () => reject(new Error('Should have failed')),
          error: (error) => {
            try {
              expect(error.status).toBe(404);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/delete`);
      req.flush({ message: 'Bank not found' }, { status: 404, statusText: 'Not Found' });

      await testPromise;
    });
  });

  describe('checkBankCode()', () => {
    it('should check if bank code is available', () => {
      const mockResponse: ApiResponse<{ available: boolean }> = {
        success: true,
        data: { available: true }
      };

      service.checkBankCode('NEW001').subscribe({
        next: (result) => {
          expect(result).toBe(true);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/check-code`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ bank_code: 'NEW001' });
      req.flush(mockResponse);
    });

    it('should check bank code with exclusion', () => {
      const mockResponse: ApiResponse<{ available: boolean }> = {
        success: true,
        data: { available: true }
      };

      service.checkBankCode('TEST001', 1).subscribe({
        next: (result) => {
          expect(result).toBe(true);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/check-code`);
      expect(req.request.body).toEqual({ bank_code: 'TEST001', exclude_bank_id: 1 });
      req.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const testPromise = new Promise<void>((resolve, reject) => {
        service.getBanks().subscribe({
          next: () => reject(new Error('Should have failed')),
          error: (error) => {
            try {
              expect(error).toBeTruthy();
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      const req = httpMock.expectOne(`${apiUrl}/master/banks/list`);
      req.error(new ProgressEvent('Network error'));

      await testPromise;
    });
  });
});
