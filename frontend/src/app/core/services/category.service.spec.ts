import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { CategoryService, CreateCategoryDto, UpdateCategoryDto } from './category.service';
import { LoggerService } from './logger.service';
import { Category } from '../../shared/models/permission.model';
import { ApiResponse } from './base-api.service';
import { environment } from '../../../environments/environment';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;
  let loggerServiceMock: { error: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; debug: ReturnType<typeof vi.fn> };
  const apiUrl = environment.apiUrl;

  const mockCategory: Category = {
    category_id: 1,
    category_code: 'CAT001',
    category_name: 'Test Category',
    description: 'Test Description',
    icon: 'test-icon',
    display_order: 1,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'system',
    updated_by: null
  };

  beforeEach(() => {
    loggerServiceMock = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CategoryService,
        { provide: LoggerService, useValue: loggerServiceMock }
      ]
    });

    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have correct endpoint', () => {
      expect(service['endpoint']).toBe(`${apiUrl}/permissions/categories`);
    });
  });

  describe('getAllCategories()', () => {
    it('should retrieve all categories', () => {
      const mockCategories: Category[] = [
        mockCategory,
        { ...mockCategory, category_id: 2, category_code: 'CAT002', category_name: 'Category 2' }
      ];

      const mockResponse: ApiResponse<Category[]> = {
        success: true,
        data: mockCategories
      };

      service.getAllCategories().subscribe({
        next: (categories) => {
          expect(categories).toEqual(mockCategories);
          expect(categories.length).toBe(2);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/permissions/categories`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty categories list', () => {
      const mockResponse: ApiResponse<Category[]> = {
        success: true,
        data: []
      };

      service.getAllCategories().subscribe({
        next: (categories) => {
          expect(categories).toEqual([]);
          expect(categories.length).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/permissions/categories`);
      req.flush(mockResponse);
    });
  });

  describe('getCategoryById()', () => {
    it('should retrieve category by ID', () => {
      const mockResponse: ApiResponse<Category> = {
        success: true,
        data: mockCategory
      };

      service.getCategoryById(1).subscribe({
        next: (category) => {
          expect(category).toEqual(mockCategory);
          expect(category.category_id).toBe(1);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/permissions/categories/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle category not found', async () => {
      const testPromise = new Promise<void>((resolve, reject) => {
        service.getCategoryById(999).subscribe({
          next: () => reject(new Error('Should have failed')),
          error: (error) => {
            try {
              expect(error.message).toContain('not found');
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      const req = httpMock.expectOne(`${apiUrl}/permissions/categories/999`);
      req.flush({ message: 'Category not found' }, { status: 404, statusText: 'Not Found' });

      await testPromise;
    });
  });

  describe('createCategory()', () => {
    it('should create new category and return category_id', () => {
      const newCategoryData: CreateCategoryDto = {
        category_code: 'CAT003',
        category_name: 'New Category',
        description: 'New Description',
        icon: 'new-icon',
        display_order: 3
      };

      const mockResponse: ApiResponse<{ category_id: number }> = {
        success: true,
        message: 'Category created',
        data: { category_id: 3 }
      };

      service.createCategory(newCategoryData).subscribe({
        next: (categoryId) => {
          expect(categoryId).toBe(3);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/permissions/categories`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCategoryData);
      req.flush(mockResponse);
    });

    it('should handle validation errors', async () => {
      const invalidCategory: CreateCategoryDto = {
        category_code: '',
        category_name: '',
        display_order: -1
      };

      const testPromise = new Promise<void>((resolve, reject) => {
        service.createCategory(invalidCategory).subscribe({
          next: () => reject(new Error('Should have failed')),
          error: (error) => {
            try {
              expect(error.message).toBeTruthy();
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      const req = httpMock.expectOne(`${apiUrl}/permissions/categories`);
      req.flush(
        { message: 'Validation failed', error: 'Invalid data' },
        { status: 400, statusText: 'Bad Request' }
      );

      await testPromise;
    });
  });

  describe('updateCategory()', () => {
    it('should update category', () => {
      const updates: UpdateCategoryDto = {
        category_name: 'Updated Category',
        description: 'Updated Description',
        is_active: false
      };

      const mockResponse: ApiResponse<void> = {
        success: true,
        message: 'Category updated',
        data: undefined as any
      };

      service.updateCategory(1, updates).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/permissions/categories/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush(mockResponse);
    });

    it('should handle update of non-existent category', async () => {
      const updates: UpdateCategoryDto = {
        category_name: 'Updated Category'
      };

      const testPromise = new Promise<void>((resolve, reject) => {
        service.updateCategory(999, updates).subscribe({
          next: () => reject(new Error('Should have failed')),
          error: (error) => {
            try {
              expect(error.message).toContain('not found');
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      const req = httpMock.expectOne(`${apiUrl}/permissions/categories/999`);
      req.flush({ message: 'Category not found' }, { status: 404, statusText: 'Not Found' });

      await testPromise;
    });
  });

  describe('deleteCategory()', () => {
    it('should delete category', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        message: 'Category deleted',
        data: undefined as any
      };

      service.deleteCategory(1).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/permissions/categories/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle deletion of non-existent category', async () => {
      const testPromise = new Promise<void>((resolve, reject) => {
        service.deleteCategory(999).subscribe({
          next: () => reject(new Error('Should have failed')),
          error: (error) => {
            try {
              expect(error.message).toContain('not found');
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      const req = httpMock.expectOne(`${apiUrl}/permissions/categories/999`);
      req.flush({ message: 'Category not found' }, { status: 404, statusText: 'Not Found' });

      await testPromise;
    });
  });

  describe('BaseApiService Integration', () => {
    it('should inherit getAll method', () => {
      const mockResponse: ApiResponse<Category[]> = {
        success: true,
        data: [mockCategory]
      };

      service.getAll().subscribe({
        next: (categories) => {
          expect(categories).toEqual([mockCategory]);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/permissions/categories`);
      req.flush(mockResponse);
    });

    it('should inherit getById method', () => {
      const mockResponse: ApiResponse<Category> = {
        success: true,
        data: mockCategory
      };

      service.getById(1).subscribe({
        next: (category) => {
          expect(category).toEqual(mockCategory);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/permissions/categories/1`);
      req.flush(mockResponse);
    });

    it('should inherit delete method', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        data: undefined as any
      };

      service.delete(1).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/permissions/categories/1`);
      req.flush(mockResponse);
    });
  });
});
