import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProductService } from './product.service';
import {
  Product,
  ProductListItem,
  PaginatedProducts,
  ProductFilters,
  ProductLimit,
  ProductCopay,
  ProductLosThreshold
} from '../../shared/models/product.model';
import {
  mockProduct,
  mockProductListItem,
  mockPaginatedProducts,
  mockLimit,
  mockCopay
} from '../../features/products/testing/product-test-helpers';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });

    service = TestBed.inject(ProductService);
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

  describe('getProducts()', () => {
    it('should return paginated products', () => {
      const filters: ProductFilters = { page: 1, limit: 10 };

      service.getProducts(filters).subscribe(result => {
        expect(result).toEqual(mockPaginatedProducts);
        expect(result.products.length).toBe(1);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/list') && request.method === 'POST'
      );

      expect(req.request.body).toEqual(filters);
      req.flush({ 
        success: true, 
        data: { 
          data: mockPaginatedProducts.products,
          pagination: {
            total: mockPaginatedProducts.total,
            page: mockPaginatedProducts.page,
            limit: mockPaginatedProducts.limit,
            totalPages: mockPaginatedProducts.totalPages
          }
        } 
      });
    });

    it('should handle empty filters', () => {
      service.getProducts({}).subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('products/list') && request.method === 'POST'
      );

      expect(req.request.body).toEqual({});
      req.flush({ 
        success: true, 
        data: { 
          data: mockPaginatedProducts.products,
          pagination: {
            total: mockPaginatedProducts.total,
            page: mockPaginatedProducts.page,
            limit: mockPaginatedProducts.limit,
            totalPages: mockPaginatedProducts.totalPages
          }
        } 
      });
    });
  });

  describe('getProductById()', () => {
    it('should return a single product', () => {
      service.getProductById('1').subscribe(result => {
        expect(result).toEqual(mockProduct);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/get') && request.method === 'POST'
      );

      expect(req.request.body).toEqual({ product_id: '1' });
      req.flush({ success: true, data: mockProduct });
    });
  });

  describe('checkPlanCode()', () => {
    it('should check if plan code exists', () => {
      service.checkPlanCode('TEST001').subscribe(result => {
        expect(result.exists).toBe(false);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/check-code') && request.method === 'POST'
      );

      expect(req.request.body).toEqual({ plan_code: 'TEST001' });
      req.flush({ success: true, data: { exists: false } });
    });

    it('should return true when code exists', () => {
      service.checkPlanCode('EXISTING').subscribe(result => {
        expect(result.exists).toBe(true);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/check-code')
      );

      req.flush({ success: true, data: { exists: true } });
    });
  });

  describe('createProduct()', () => {
    it('should create a new product', () => {
      const newProduct = {
        plan_code: 'NEW001',
        plan_name: 'New Plan',
        insurer_name: 'New Insurer',
        is_active: true
      };

      service.createProduct(newProduct).subscribe(result => {
        expect(result).toEqual(mockProduct.product_id);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/create') && request.method === 'POST'
      );

      expect(req.request.body).toEqual(newProduct);
      req.flush({ success: true, data: { product_id: mockProduct.product_id } });
    });
  });

  describe('updateProduct()', () => {
    it('should update an existing product', () => {
      const updates = {
        plan_name: 'Updated Plan',
        is_active: false
      };

      service.updateProduct('1', updates).subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('products/update') && request.method === 'PUT'
      );

      expect(req.request.body).toEqual({
        product_id: '1',
        ...updates
      });
      req.flush({ success: true, data: null });
    });
  });

  describe('deleteProduct()', () => {
    it('should delete a product', () => {
      service.deleteProduct('1').subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('products/delete') && request.method === 'POST'
      );

      expect(req.request.body).toEqual({ product_id: '1' });
      req.flush({ success: true, data: null });
    });
  });

  describe('activateProduct()', () => {
    it('should activate a product', () => {
      service.activateProduct('1').subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/activate') && request.method === 'POST'
      );

      req.flush({ success: true, data: null });
    });
  });

  describe('deactivateProduct()', () => {
    it('should deactivate a product', () => {
      service.deactivateProduct('1').subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/deactivate') && request.method === 'POST'
      );

      req.flush({ success: true, data: null });
    });
  });

  describe('Limits Management', () => {
    it('should get limits by product ID', () => {
      service.getLimitsByProductId('1').subscribe(result => {
        expect(result).toEqual([mockLimit]);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/limits/list') && request.method === 'POST'
      );

      req.flush({ success: true, data: [mockLimit] });
    });

    it('should get limit by ID', () => {
      service.getLimitById('1', 'limit1').subscribe(result => {
        expect(result).toEqual(mockLimit);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/limits/get') && request.method === 'POST'
      );

      expect(req.request.body).toEqual({ limit_id: 'limit1' });
      req.flush({ success: true, data: mockLimit });
    });

    it('should create a limit', () => {
      const newLimit = {
        product_id: '1',
        limit_type: 'ANNUAL',
        limit_amount: 100000,
        is_active: true
      };

      service.createLimit('1', newLimit).subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/limits') && request.method === 'POST'
      );

      expect(req.request.body).toEqual(newLimit);
      req.flush({ success: true, data: mockLimit });
    });

    it('should update a limit', () => {
      const updates = {
        limit_amount: 200000
      };

      service.updateLimit('1', 'limit1', updates).subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/limits/limit1') && request.method === 'PUT'
      );

      expect(req.request.body).toEqual(updates);
      req.flush({ success: true, data: null });
    });

    it('should delete a limit', () => {
      service.deleteLimit('1', 'limit1').subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/limits/limit1') && request.method === 'DELETE'
      );

      req.flush({ success: true, data: null });
    });
  });

  describe('Copay Management', () => {
    it('should get copay by product ID', () => {
      service.getCopayByProductId('1').subscribe(result => {
        expect(result).toEqual([mockCopay]);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/copay/list') && request.method === 'POST'
      );

      req.flush({ success: true, data: [mockCopay] });
    });

    it('should get copay by ID', () => {
      service.getCopayById('1', 'copay1').subscribe(result => {
        expect(result).toEqual(mockCopay);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/copay/get') && request.method === 'POST'
      );

      expect(req.request.body).toEqual({ copay_id: 'copay1' });
      req.flush({ success: true, data: mockCopay });
    });

    it('should create a copay', () => {
      const newCopay = {
        product_id: '1',
        copay_type: 'PERCENTAGE',
        copay_value: 10,
        applies_to: 'ALL',
        is_active: true
      };

      service.createCopay('1', newCopay).subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/copay') && request.method === 'POST'
      );

      expect(req.request.body).toEqual(newCopay);
      req.flush({ success: true, data: mockCopay });
    });

    it('should update a copay', () => {
      const updates = {
        copay_value: 20
      };

      service.updateCopay('1', 'copay1', updates).subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/copay/copay1') && request.method === 'PUT'
      );

      expect(req.request.body).toEqual(updates);
      req.flush({ success: true, data: null });
    });

    it('should delete a copay', () => {
      service.deleteCopay('1', 'copay1').subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/copay/copay1') && request.method === 'DELETE'
      );

      req.flush({ success: true, data: null });
    });
  });

  describe('LOS Threshold Management', () => {
    const mockThreshold: ProductLosThreshold = {
      threshold_id: 'thresh1',
      product_id: '1',
      diagnosis_category: 'General',
      threshold_days: 5,
      alert_level: 1,
      is_active: true
    };

    it('should get thresholds by product ID', () => {
      service.getThresholdsByProductId('1').subscribe(result => {
        expect(result).toEqual([mockThreshold]);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/thresholds/list') && request.method === 'POST'
      );
      req.flush({ success: true, data: [mockThreshold] });
    });

    it('should handle error when getting thresholds', () => {
      service.getThresholdsByProductId('1').subscribe({
        error: (err) => expect(err).toBeDefined()
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/thresholds/list')
      );
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should get threshold by ID', () => {
      service.getThresholdById('1', 'thresh1').subscribe(result => {
        expect(result).toEqual(mockThreshold);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/thresholds/get') && request.method === 'POST'
      );
      expect(req.request.body).toEqual({ threshold_id: 'thresh1' });
      req.flush({ success: true, data: mockThreshold });
    });

    it('should handle error when getting threshold by ID', () => {
      service.getThresholdById('1', 'invalid').subscribe({
        error: (err) => expect(err).toBeDefined()
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/thresholds/get')
      );
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should create a threshold', () => {
      const dto = { diagnosis_category: 'Cardiac', threshold_days: 7, alert_level: 2, is_active: true };

      service.createThreshold('1', dto).subscribe(result => {
        expect(result).toBe('thresh2');
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/thresholds') &&
        !request.url.includes('thresholds/list') &&
        !request.url.includes('thresholds/get') &&
        request.method === 'POST'
      );
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true, data: { threshold_id: 'thresh2' } });
    });

    it('should handle error when creating threshold', () => {
      service.createThreshold('1', {}).subscribe({
        error: (err) => expect(err).toBeDefined()
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/thresholds') &&
        !request.url.includes('thresholds/list') &&
        !request.url.includes('thresholds/get') &&
        request.method === 'POST'
      );
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
    });

    it('should update a threshold', () => {
      const updates = { threshold_days: 10, alert_level: 3 };

      service.updateThreshold('1', 'thresh1', updates).subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/thresholds/thresh1') && request.method === 'PUT'
      );
      expect(req.request.body).toEqual(updates);
      req.flush({ success: true, data: null });
    });

    it('should handle error when updating threshold', () => {
      service.updateThreshold('1', 'thresh1', {}).subscribe({
        error: (err) => expect(err).toBeDefined()
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/thresholds/thresh1') && request.method === 'PUT'
      );
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
    });

    it('should delete a threshold', () => {
      service.deleteThreshold('1', 'thresh1').subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/thresholds/thresh1') && request.method === 'DELETE'
      );
      req.flush({ success: true, data: null });
    });

    it('should handle error when deleting threshold', () => {
      service.deleteThreshold('1', 'thresh1').subscribe({
        error: (err) => expect(err).toBeDefined()
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/1/thresholds/thresh1') && request.method === 'DELETE'
      );
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', () => {
      service.getProductById('invalid').subscribe({
        next: () => {
          throw new Error('should have failed');
        },
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/get')
      );

      req.flush({ success: false, message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle network errors', () => {
      service.getProducts({}).subscribe({
        next: () => {
          throw new Error('should have failed');
        },
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('products/list')
      );

      req.error(new ProgressEvent('Network error'));
    });
  });
});
