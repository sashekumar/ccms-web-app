import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LookupService } from './lookup.service';
import {
  LookupCategory,
  Lookup,
  LookupMetadata,
  PaginatedLookupCategories,
  PaginatedLookups,
  PaginatedLookupMetadata,
  LookupCategoryFilters,
  LookupFilters,
  LookupMetadataFilters,
  CreateLookupCategoryDto,
  UpdateLookupCategoryDto,
  CreateLookupDto,
  UpdateLookupDto,
  CreateLookupMetadataDto,
  UpdateLookupMetadataDto
} from '../../shared/models/lookup.model';
import { environment } from '../../../environments/environment';

describe('LookupService', () => {
  let service: LookupService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  const mockCategory: LookupCategory = {
    category_id: 1,
    legacy_category_id: 'CAT001',
    category_name: 'Test Category',
    description: 'Test Description',
    is_active: true
  };

  const mockCategories: PaginatedLookupCategories = {
    categories: [mockCategory],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1
  };

  const mockLookup: Lookup = {
    lookup_id: 1,
    legacy_lookup_id: 'LU001',
    category_id: 1,
    lookup_code: 'CODE001',
    lookup_value: 'Test Lookup',
    sort_order: 1,
    is_active: true,
    created_at: new Date(),
    category_name: 'Test Category'
  };

  const mockLookups: PaginatedLookups = {
    lookups: [mockLookup],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1
  };

  const mockMetadata: LookupMetadata = {
    metadata_id: 1,
    lookup_id: 1,
    metadata_key: 'KEY001',
    metadata_value: 'Value 001',
    lookup_code: 'CODE001',
    lookup_value: 'Test Lookup'
  };

  const mockMetadataList: PaginatedLookupMetadata = {
    metadata: [mockMetadata],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LookupService]
    });

    service = TestBed.inject(LookupService);
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

  // ==================== CATEGORY TESTS ====================
  describe('Category Operations', () => {
    describe('getCategories()', () => {
      it('should retrieve paginated categories with filters', () => {
        const filters: LookupCategoryFilters = {
          search: 'test',
          page: 1,
          limit: 10,
          is_active: true
        };

        const mockResponse = {
          success: true,
          data: mockCategories
        };

        service.getCategories(filters).subscribe({
          next: (result) => {
            expect(result).toEqual(mockCategories);
            expect(result.categories.length).toBe(1);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/categories/list`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(filters);
        req.flush(mockResponse);
      });
    });

    describe('getCategoryById()', () => {
      it('should retrieve category by ID', () => {
        const mockResponse = {
          success: true,
          data: { category: mockCategory }
        };

        service.getCategoryById(1).subscribe({
          next: (result) => {
            expect(result.category).toEqual(mockCategory);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/categories/single`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ category_id: 1 });
        req.flush(mockResponse);
      });
    });

    describe('createCategory()', () => {
      it('should create a new category', () => {
        const createDto: CreateLookupCategoryDto = {
          category_name: 'New Category',
          is_active: true
        };

        const mockResponse = {
          success: true,
          data: { category_id: 3 },
          message: 'Category created'
        };

        service.createCategory(createDto).subscribe({
          next: (result) => {
            expect(result.category_id).toBe(3);
            expect(result.message).toBe('Category created');
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/categories/create`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(createDto);
        req.flush(mockResponse);
      });
    });

    describe('updateCategory()', () => {
      it('should update an existing category', () => {
        const updateDto: UpdateLookupCategoryDto = {
          category_name: 'Updated Category'
        };

        const mockResponse = {
          success: true,
          message: 'Category updated'
        };

        service.updateCategory(1, updateDto).subscribe({
          next: (result) => {
            expect(result.message).toBe('Category updated');
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/categories/update`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ category_id: 1, ...updateDto });
        req.flush(mockResponse);
      });
    });

    describe('deleteCategory()', () => {
      it('should delete a category', () => {
        const mockResponse = {
          success: true,
          message: 'Category deleted'
        };

        service.deleteCategory(1).subscribe({
          next: (result) => {
            expect(result.message).toBe('Category deleted');
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/categories/delete`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ category_id: 1 });
        req.flush(mockResponse);
      });
    });

    describe('checkCategoryCode()', () => {
      it('should check if category code exists (available)', () => {
        const mockResponse = {
          success: true,
          data: { available: true }
        };

        service.checkCategoryCode('NEW001').subscribe({
          next: (result) => {
            expect(result.exists).toBe(false);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/categories/check-code`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ category_code: 'NEW001', exclude_category_id: undefined });
        req.flush(mockResponse);
      });

      it('should check category code with exclusion', () => {
        const mockResponse = {
          success: true,
          data: { available: false }
        };

        service.checkCategoryCode('CAT001', 1).subscribe({
          next: (result) => {
            expect(result.exists).toBe(true);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/categories/check-code`);
        expect(req.request.body).toEqual({ category_code: 'CAT001', exclude_category_id: 1 });
        req.flush(mockResponse);
      });
    });
  });

  // ==================== LOOKUP TESTS ====================
  describe('Lookup Operations', () => {
    describe('getLookups()', () => {
      it('should retrieve paginated lookups with filters', () => {
        const filters: LookupFilters = {
          search: 'test',
          page: 1,
          limit: 10,
          category_id: 1
        };

        const mockResponse = {
          success: true,
          data: mockLookups
        };

        service.getLookups(filters).subscribe({
          next: (result) => {
            expect(result).toEqual(mockLookups);
            expect(result.lookups.length).toBe(1);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/list`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(filters);
        req.flush(mockResponse);
      });
    });

    describe('getAllLookupsByCategory()', () => {
      it('should retrieve all lookups for a category', () => {
        const mockResponse = {
          success: true,
          data: { lookups: [mockLookup] }
        };

        service.getAllLookupsByCategory(1).subscribe({
          next: (result) => {
            expect(result.lookups).toEqual([mockLookup]);
            expect(result.lookups.length).toBe(1);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/all`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ category_id: 1 });
        req.flush(mockResponse);
      });
    });

    describe('getLookupById()', () => {
      it('should retrieve lookup by ID', () => {
        const mockResponse = {
          success: true,
          data: { lookup: mockLookup }
        };

        service.getLookupById(1).subscribe({
          next: (result) => {
            expect(result.lookup).toEqual(mockLookup);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/single`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ lookup_id: 1 });
        req.flush(mockResponse);
      });
    });

    describe('createLookup()', () => {
      it('should create a new lookup', () => {
        const createDto: CreateLookupDto = {
          category_id: 1,
          lookup_code: 'NEW001',
          lookup_value: 'New Lookup',
          sort_order: 1,
          is_active: true
        };

        const mockResponse = {
          success: true,
          data: { lookup_id: 3 },
          message: 'Lookup created'
        };

        service.createLookup(createDto).subscribe({
          next: (result) => {
            expect(result.lookup_id).toBe(3);
            expect(result.message).toBe('Lookup created');
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/create`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(createDto);
        req.flush(mockResponse);
      });
    });

    describe('updateLookup()', () => {
      it('should update an existing lookup', () => {
        const updateDto: UpdateLookupDto = {
          lookup_value: 'Updated Lookup'
        };

        const mockResponse = {
          success: true,
          message: 'Lookup updated'
        };

        service.updateLookup(1, updateDto).subscribe({
          next: (result) => {
            expect(result.message).toBe('Lookup updated');
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/update`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ lookup_id: 1, ...updateDto });
        req.flush(mockResponse);
      });
    });

    describe('deleteLookup()', () => {
      it('should delete a lookup', () => {
        const mockResponse = {
          success: true,
          message: 'Lookup deleted'
        };

        service.deleteLookup(1).subscribe({
          next: (result) => {
            expect(result.message).toBe('Lookup deleted');
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/delete`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ lookup_id: 1 });
        req.flush(mockResponse);
      });
    });

    describe('checkLookupCode()', () => {
      it('should check if lookup code exists in category', () => {
        const mockResponse = {
          success: true,
          data: { available: true }
        };

        service.checkLookupCode(1, 'NEW001').subscribe({
          next: (result) => {
            expect(result.exists).toBe(false);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/check-code`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ category_id: 1, lookup_code: 'NEW001', exclude_lookup_id: undefined });
        req.flush(mockResponse);
      });

      it('should check lookup code with exclusion', () => {
        const mockResponse = {
          success: true,
          data: { available: false }
        };

        service.checkLookupCode(1, 'CODE001', 1).subscribe({
          next: (result) => {
            expect(result.exists).toBe(true);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/check-code`);
        expect(req.request.body).toEqual({ category_id: 1, lookup_code: 'CODE001', exclude_lookup_id: 1 });
        req.flush(mockResponse);
      });
    });
  });

  // ==================== METADATA TESTS ====================
  describe('Metadata Operations', () => {
    describe('getMetadata()', () => {
      it('should retrieve paginated metadata with filters', () => {
        const filters: LookupMetadataFilters = {
          metadata_key: 'test',
          page: 1,
          limit: 10,
          lookup_id: 1
        };

        const mockResponse = {
          success: true,
          data: mockMetadataList
        };

        service.getMetadata(filters).subscribe({
          next: (result) => {
            expect(result).toEqual(mockMetadataList);
            expect(result.metadata.length).toBe(1);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/metadata/list`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(filters);
        req.flush(mockResponse);
      });
    });

    describe('getMetadataById()', () => {
      it('should retrieve metadata by ID', () => {
        const mockResponse = {
          success: true,
          data: { metadata: mockMetadata }
        };

        service.getMetadataById(1).subscribe({
          next: (result) => {
            expect(result.metadata).toEqual(mockMetadata);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/metadata/single`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ metadata_id: 1 });
        req.flush(mockResponse);
      });
    });

    describe('createMetadata()', () => {
      it('should create a new metadata entry', () => {
        const createDto: CreateLookupMetadataDto = {
          lookup_id: 1,
          metadata_key: 'NEW_KEY',
          metadata_value: 'New Value'
        };

        const mockResponse = {
          success: true,
          data: { metadata_id: 3 },
          message: 'Metadata created'
        };

        service.createMetadata(createDto).subscribe({
          next: (result) => {
            expect(result.metadata_id).toBe(3);
            expect(result.message).toBe('Metadata created');
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/metadata/create`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(createDto);
        req.flush(mockResponse);
      });
    });

    describe('updateMetadata()', () => {
      it('should update an existing metadata entry', () => {
        const updateDto: UpdateLookupMetadataDto = {
          metadata_value: 'Updated Value'
        };

        const mockResponse = {
          success: true,
          message: 'Metadata updated'
        };

        service.updateMetadata(1, updateDto).subscribe({
          next: (result) => {
            expect(result.message).toBe('Metadata updated');
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/metadata/update`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ metadata_id: 1, ...updateDto });
        req.flush(mockResponse);
      });
    });

    describe('deleteMetadata()', () => {
      it('should delete a metadata entry', () => {
        const mockResponse = {
          success: true,
          message: 'Metadata deleted'
        };

        service.deleteMetadata(1).subscribe({
          next: (result) => {
            expect(result.message).toBe('Metadata deleted');
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/metadata/delete`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ metadata_id: 1 });
        req.flush(mockResponse);
      });
    });

    describe('checkMetadataKey()', () => {
      it('should check if metadata key exists for lookup', () => {
        const mockResponse = {
          success: true,
          data: { available: true }
        };

        service.checkMetadataKey(1, 'NEW_KEY').subscribe({
          next: (result) => {
            expect(result.exists).toBe(false);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/metadata/check-key`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ lookup_id: 1, metadata_key: 'NEW_KEY', exclude_metadata_id: undefined });
        req.flush(mockResponse);
      });

      it('should check metadata key with exclusion', () => {
        const mockResponse = {
          success: true,
          data: { available: false }
        };

        service.checkMetadataKey(1, 'KEY001', 1).subscribe({
          next: (result) => {
            expect(result.exists).toBe(true);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}/master/lookups/metadata/check-key`);
        expect(req.request.body).toEqual({ lookup_id: 1, metadata_key: 'KEY001', exclude_metadata_id: 1 });
        req.flush(mockResponse);
      });
    });
  });

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const testPromise = new Promise<void>((resolve, reject) => {
        service.getCategories().subscribe({
          next: () => reject(new Error('Should have failed')),
          error: (error) => {
            try {
              expect(error.status).toBe(0);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      const req = httpMock.expectOne(`${apiUrl}/master/lookups/categories/list`);
      req.error(new ProgressEvent('Network error'));

      await testPromise;
    });
  });
});
