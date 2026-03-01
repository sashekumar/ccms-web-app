import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BaseApiService, ApiResponse } from './base-api.service';
import { environment } from '../../../environments/environment';

// Test entity type
interface TestEntity {
  id: number;
  name: string;
  email: string;
}

// Concrete implementation for testing
@Injectable()
class TestApiService extends BaseApiService<TestEntity> {
  constructor(http: HttpClient) {
    super(http, '/test-entities');
  }
}

describe('BaseApiService', () => {
  let service: TestApiService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TestApiService]
    });

    service = TestBed.inject(TestApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding HTTP requests
  });

  describe('Constructor', () => {
    it('should construct endpoint URL correctly', () => {
      expect(service['endpoint']).toBe(`${apiUrl}/test-entities`);
    });
  });

  describe('getAll()', () => {
    it('should retrieve all entities', () => {
      const mockEntities: TestEntity[] = [
        { id: 1, name: 'Entity 1', email: 'entity1@test.com' },
        { id: 2, name: 'Entity 2', email: 'entity2@test.com' }
      ];

      const mockResponse: ApiResponse<TestEntity[]> = {
        success: true,
        message: 'Entities retrieved',
        data: mockEntities
      };

      service.getAll().subscribe({
        next: (entities) => {
          expect(entities).toEqual(mockEntities);
          expect(entities.length).toBe(2);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty array response', () => {
      const mockResponse: ApiResponse<TestEntity[]> = {
        success: true,
        data: []
      };

      service.getAll().subscribe({
        next: (entities) => {
          expect(entities).toEqual([]);
          expect(entities.length).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities`);
      req.flush(mockResponse);
    });

    it('should handle error response', () => {
      const errorMessage = 'Failed to fetch entities';

      service.getAll().subscribe({
        next: () => {
          throw new Error('Should have failed');
        },
        error: (error) => {
          expect(error.message).toContain(errorMessage);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities`);
      req.flush({ message: errorMessage }, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getById()', () => {
    it('should retrieve entity by numeric ID', () => {
      const mockEntity: TestEntity = { id: 1, name: 'Test Entity', email: 'test@test.com' };
      const mockResponse: ApiResponse<TestEntity> = {
        success: true,
        data: mockEntity
      };

      service.getById(1).subscribe({
        next: (entity) => {
          expect(entity).toEqual(mockEntity);
          expect(entity.id).toBe(1);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should retrieve entity by string ID', () => {
      const mockEntity: TestEntity = { id: 1, name: 'Test Entity', email: 'test@test.com' };
      const mockResponse: ApiResponse<TestEntity> = {
        success: true,
        data: mockEntity
      };

      service.getById('abc-123').subscribe({
        next: (entity) => {
          expect(entity).toEqual(mockEntity);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities/abc-123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle 404 not found', () => {
      service.getById(999).subscribe({
        next: () => {
          throw new Error('Should have failed');
        },
        error: (error) => {
          expect(error.message).toContain('not found');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities/999`);
      req.flush({ message: 'Entity not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('create()', () => {
    it('should create new entity', () => {
      const newEntity: Partial<TestEntity> = { name: 'New Entity', email: 'new@test.com' };
      const createdEntity: TestEntity = { id: 3, name: 'New Entity', email: 'new@test.com' };
      const mockResponse: ApiResponse<TestEntity> = {
        success: true,
        message: 'Entity created',
        data: createdEntity
      };

      service.create(newEntity).subscribe({
        next: (entity) => {
          expect(entity).toEqual(createdEntity);
          expect(entity.id).toBe(3);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newEntity);
      req.flush(mockResponse);
    });

    it('should handle validation errors', () => {
      const invalidEntity: Partial<TestEntity> = { name: '', email: 'invalid' };

      service.create(invalidEntity).subscribe({
        next: () => {
          throw new Error('Should have failed');
        },
        error: (error) => {
          expect(error.message).toContain('Validation');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities`);
      req.flush(
        { message: 'Validation failed', error: 'Invalid data' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('update()', () => {
    it('should update existing entity', () => {
      const updates: Partial<TestEntity> = { name: 'Updated Name' };
      const updatedEntity: TestEntity = { id: 1, name: 'Updated Name', email: 'test@test.com' };
      const mockResponse: ApiResponse<TestEntity> = {
        success: true,
        message: 'Entity updated',
        data: updatedEntity
      };

      service.update(1, updates).subscribe({
        next: (entity) => {
          expect(entity).toEqual(updatedEntity);
          expect(entity.name).toBe('Updated Name');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush(mockResponse);
    });

    it('should handle update of non-existent entity', () => {
      const updates: Partial<TestEntity> = { name: 'Updated Name' };

      service.update(999, updates).subscribe({
        next: () => {
          throw new Error('Should have failed');
        },
        error: (error) => {
          expect(error.message).toContain('not found');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities/999`);
      req.flush({ message: 'Entity not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('delete()', () => {
    it('should delete entity', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        message: 'Entity deleted',
        data: undefined as any
      };

      service.delete(1).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle deletion of non-existent entity', () => {
      service.delete(999).subscribe({
        next: () => {
          throw new Error('Should have failed');
        },
        error: (error) => {
          expect(error.message).toContain('not found');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities/999`);
      req.flush({ message: 'Entity not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Error Handling', () => {
    it('should handle client-side errors', () => {
      service.getAll().subscribe({
        next: () => {
          throw new Error('Should have failed');
        },
        error: (error) => {
          expect(error.message).toContain('Server error: 0 - Network error');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities`);
      req.error(new ProgressEvent('error'), { statusText: 'Network error' });
    });

    it('should handle server errors with error field', () => {
      service.getAll().subscribe({
        next: () => {
          throw new Error('Should have failed');
        },
        error: (error) => {
          expect(error.message).toBe('Custom error message');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities`);
      req.flush({ error: 'Custom error message' }, { status: 500, statusText: 'Server Error' });
    });

    it('should handle server errors with message field', () => {
      service.getAll().subscribe({
        next: () => {
          throw new Error('Should have failed');
        },
        error: (error) => {
          expect(error.message).toBe('Custom message');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities`);
      req.flush({ message: 'Custom message' }, { status: 500, statusText: 'Server Error' });
    });

    it('should handle generic server errors', () => {
      service.getAll().subscribe({
        next: () => {
          throw new Error('Should have failed');
        },
        error: (error) => {
          expect(error.message).toContain('Server error: 503');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/test-entities`);
      req.flush(null, { status: 503, statusText: 'Service Unavailable' });
    });
  });
});
