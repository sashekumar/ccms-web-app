import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ClauseService } from './clause.service';
import { ApiResponse } from './base-api.service';
import { Clause, ClauseFilters, PaginatedClauses, CreateClauseDto, UpdateClauseDto } from '../../shared/models/clause.model';
import { environment } from '../../../environments/environment';

describe('ClauseService', () => {
  let service: ClauseService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  const mockClause: Clause = {
    clause_id: 1,
    clause_code: 'CL001',
    clause_text: 'Test Clause',
    is_active: true
  };

  const mockClauses: PaginatedClauses = {
    clauses: [
      {
        clause_id: 1,
        clause_code: 'CL001',
        clause_text: 'Test Clause',
        is_active: true
      },
      {
        clause_id: 2,
        clause_code: 'CL002',
        clause_text: 'Test Clause 2',
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
      providers: [ClauseService]
    });

    service = TestBed.inject(ClauseService);
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

  describe('getClauses()', () => {
    it('should retrieve paginated clauses with filters', () => {
      const filters: ClauseFilters = {
        search: 'test',
        page: 1,
        limit: 10,
        is_active: true
      };

      const mockResponse: ApiResponse<PaginatedClauses> = {
        success: true,
        message: 'Clauses retrieved',
        data: mockClauses
      };

      service.getClauses(filters).subscribe({
        next: (result) => {
          expect(result).toEqual(mockClauses);
          expect(result.clauses.length).toBe(2);
          expect(result.total).toBe(2);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/list`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filters);
      req.flush(mockResponse);
    });

    it('should handle empty filters', () => {
      const mockResponse: ApiResponse<PaginatedClauses> = {
        success: true,
        data: mockClauses
      };

      service.getClauses().subscribe({
        next: (result) => {
          expect(result).toEqual(mockClauses);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/list`);
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should handle empty results', () => {
      const emptyResult: PaginatedClauses = {
        clauses: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };

      const mockResponse: ApiResponse<PaginatedClauses> = {
        success: true,
        data: emptyResult
      };

      service.getClauses({ search: 'nonexistent' }).subscribe({
        next: (result) => {
          expect(result.clauses.length).toBe(0);
          expect(result.total).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/list`);
      req.flush(mockResponse);
    });
  });

  describe('getClauseById()', () => {
    it('should retrieve clause by ID', () => {
      const mockResponse: ApiResponse<Clause> = {
        success: true,
        data: mockClause
      };

      service.getClauseById(1).subscribe({
        next: (clause) => {
          expect(clause).toEqual(mockClause);
          expect(clause.clause_id).toBe(1);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/get`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ clause_id: 1 });
      req.flush(mockResponse);
    });

    it('should handle clause not found', async () => {
      const testPromise = new Promise<void>((resolve, reject) => {
        service.getClauseById(999).subscribe({
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

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/get`);
      req.flush({ message: 'Clause not found' }, { status: 404, statusText: 'Not Found' });

      await testPromise;
    });
  });

  describe('createClause()', () => {
    it('should create a new clause', () => {
      const createDto: CreateClauseDto = {
        clause_code: 'NEW001',
        clause_text: 'New Clause',
        is_active: true
      };

      const mockResponse: ApiResponse<{ clause_id: number }> = {
        success: true,
        message: 'Clause created',
        data: { clause_id: 3 }
      };

      service.createClause(createDto).subscribe({
        next: (result) => {
          expect(result).toBe(3);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });

    it('should handle duplicate clause code error', async () => {
      const createDto: CreateClauseDto = {
        clause_code: 'CL001',
        clause_text: 'Duplicate Clause',
        is_active: true
      };

      const testPromise = new Promise<void>((resolve, reject) => {
        service.createClause(createDto).subscribe({
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

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/create`);
      req.flush({ message: 'Clause code already exists' }, { status: 409, statusText: 'Conflict' });

      await testPromise;
    });
  });

  describe('updateClause()', () => {
    it('should update an existing clause', () => {
      const updateDto: UpdateClauseDto = {
        clause_text: 'Updated Clause Text'
      };

      const mockResponse: ApiResponse<void> = {
        success: true,
        message: 'Clause updated',
        data: undefined as any
      };

      service.updateClause(1, updateDto).subscribe({
        next: () => {
          expect(true).toBe(true);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/update`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ clause_id: 1, ...updateDto });
      req.flush(mockResponse);
    });

    it('should handle update of non-existent clause', async () => {
      const updateDto: UpdateClauseDto = {
        clause_text: 'Updated Text'
      };

      const testPromise = new Promise<void>((resolve, reject) => {
        service.updateClause(999, updateDto).subscribe({
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

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/update`);
      req.flush({ message: 'Clause not found' }, { status: 404, statusText: 'Not Found' });

      await testPromise;
    });
  });

  describe('deleteClause()', () => {
    it('should delete a clause', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        message: 'Clause deleted',
        data: undefined as any
      };

      service.deleteClause(1).subscribe({
        next: () => {
          expect(true).toBe(true);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/delete`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ clause_id: 1 });
      req.flush(mockResponse);
    });

    it('should handle delete of non-existent clause', async () => {
      const testPromise = new Promise<void>((resolve, reject) => {
        service.deleteClause(999).subscribe({
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

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/delete`);
      req.flush({ message: 'Clause not found' }, { status: 404, statusText: 'Not Found' });

      await testPromise;
    });
  });

  describe('checkClauseCode()', () => {
    it('should check if clause code is available', () => {
      const mockResponse: ApiResponse<{ available: boolean }> = {
        success: true,
        data: { available: true }
      };

      service.checkClauseCode('NEW001').subscribe({
        next: (result) => {
          expect(result).toBe(true);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/check-code`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ clause_code: 'NEW001' });
      req.flush(mockResponse);
    });

    it('should check clause code with exclusion', () => {
      const mockResponse: ApiResponse<{ available: boolean }> = {
        success: true,
        data: { available: true }
      };

      service.checkClauseCode('CL001', 1).subscribe({
        next: (result) => {
          expect(result).toBe(true);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/check-code`);
      expect(req.request.body).toEqual({ clause_code: 'CL001', exclude_clause_id: 1 });
      req.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const testPromise = new Promise<void>((resolve, reject) => {
        service.getClauses().subscribe({
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

      const req = httpMock.expectOne(`${apiUrl}/master/clauses/list`);
      req.error(new ProgressEvent('Network error'));

      await testPromise;
    });
  });
});
