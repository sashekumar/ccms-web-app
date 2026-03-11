import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, throwError, Observable } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../../core/services/product.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductListItem, PaginatedProducts, ProductFilters } from '../../../shared/models/product.model';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productService: any;
  let router: any;
  let toastService: any;
  let loggerService: any;

  const mockProductListItem: ProductListItem = {
    product_id: '1',
    plan_code: 'TEST001',
    plan_name: 'Test Plan',
    insurer_name: 'Test Insurer',
    is_active: true,
    legacy_product_id: 'LEG001'
  };

  const mockPaginatedProducts: PaginatedProducts = {
    products: [mockProductListItem],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1
  };

  beforeEach(async () => {
    productService = {
      getProducts: vi.fn().mockReturnValue(of(mockPaginatedProducts)),
      deleteProduct: vi.fn().mockReturnValue(of(null)),
      activateProduct: vi.fn().mockReturnValue(of(null)),
      deactivateProduct: vi.fn().mockReturnValue(of(null))
    };

    router = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    toastService = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn()
    };

    loggerService = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ProductListComponent, FormsModule],
      providers: [
        { provide: ProductService, useValue: productService },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toastService },
        { provide: LoggerService, useValue: loggerService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be a standalone component', () => {
      const componentMetadata = (ProductListComponent as any).ɵcmp;
      expect(componentMetadata.standalone).toBe(true);
    });
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.products).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.stats.total).toBe(0);
      expect(component.filters.page).toBe(1);
      expect(component.filters.limit).toBe(25);
    });

    it('should load products on init', () => {
      fixture.detectChanges();
      
      expect(productService.getProducts).toHaveBeenCalled();
      expect(component.products).toEqual([mockProductListItem]);
      expect(component.stats.total).toBe(1);
    });
  });

  describe('loadProducts()', () => {
    it('should load products successfully', () => {
      component.loadProducts();

      expect(component.loading).toBe(false);
      expect(productService.getProducts).toHaveBeenCalledWith(component.filters);
      expect(component.products).toEqual([mockProductListItem]);
      expect(component.stats.total).toBe(1);
      expect(component.stats.active).toBe(1);
      expect(component.stats.inactive).toBe(0);
    });

    it('should set loading state during fetch', () => {
      let loadingDuringFetch = false;
      productService.getProducts.mockReturnValue(
        new Observable(subscriber => {
          loadingDuringFetch = component.loading;
          subscriber.next(mockPaginatedProducts);
          subscriber.complete();
        })
      );

      component.loadProducts();
      expect(loadingDuringFetch).toBe(true);
    });

    it('should handle empty results', () => {
      const emptyResults: PaginatedProducts = {
        products: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };
      productService.getProducts.mockReturnValue(of(emptyResults));

      component.loadProducts();

      expect(component.products.length).toBe(0);
      expect(component.stats.total).toBe(0);
    });

    it('should handle errors', () => {
      const error = new Error('Failed to load');
      productService.getProducts.mockReturnValue(throwError(() => error));

      component.loadProducts();

      expect(component.loading).toBe(false);
      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith('Failed to load products');
    });

    it('should calculate active/inactive stats correctly', () => {
      const mixedProducts: PaginatedProducts = {
        products: [
          { ...mockProductListItem, product_id: '1', is_active: true },
          { ...mockProductListItem, product_id: '2', is_active: false },
          { ...mockProductListItem, product_id: '3', is_active: true }
        ],
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      productService.getProducts.mockReturnValue(of(mixedProducts));

      component.loadProducts();

      expect(component.stats.total).toBe(3);
      expect(component.stats.active).toBe(2);
      expect(component.stats.inactive).toBe(1);
    });
  });

  describe('Search Functionality', () => {
    it('should filter products by search term', () => {
      component.filters.search = 'Test';
      component.filters.page = 1;
      component.loadProducts();

      expect(productService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Test', page: 1 })
      );
    });

    it('should handle search input', () => {
      expect(() => component.onSearchChange('Test')).not.toThrow();
    });

    it('should reset to page 1 when search changes', () => {
      component.filters.page = 3;
      component.onFilterChange();

      expect(component.filters.page).toBe(1);
    });
  });

  describe('Filter Functionality', () => {
    it('should apply insurer filter', () => {
      component.filters.insurer_name = 'Test Insurer';
      component.onFilterChange();

      expect(productService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ insurer_name: 'Test Insurer' })
      );
    });

    it('should apply active status filter', () => {
      component.filters.is_active = true;
      component.onFilterChange();

      expect(productService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true })
      );
    });

    it('should reset to page 1 when filters change', () => {
      component.filters.page = 5;
      component.onFilterChange();

      expect(component.filters.page).toBe(1);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.pagination.totalPages = 5;
      component.pagination.page = 1;
      component.filters.page = 1;
    });

    it('should navigate to next page', () => {
      component.nextPage();

      expect(component.filters.page).toBe(2);
      expect(productService.getProducts).toHaveBeenCalled();
    });

    it('should not navigate beyond last page', () => {
      component.pagination.page = 5;
      component.filters.page = 5;
      component.nextPage();

      expect(component.filters.page).toBe(5);
    });

    it('should navigate to previous page', () => {
      component.pagination.page = 3;
      component.filters.page = 3;
      component.previousPage();

      expect(component.filters.page).toBe(2);
      expect(productService.getProducts).toHaveBeenCalled();
    });

    it('should not navigate before first page', () => {
      component.pagination.page = 1;
      component.filters.page = 1;
      component.previousPage();

      expect(component.filters.page).toBe(1);
    });

    it('should navigate to specific page', () => {
      component.goToPage(3);

      expect(component.filters.page).toBe(3);
      expect(productService.getProducts).toHaveBeenCalled();
    });

    it('should set page directly without validation', () => {
      component.goToPage(0);
      expect(component.filters.page).toBe(0);

      component.goToPage(10);
      expect(component.filters.page).toBe(10);
    });

    it('should update when items per page changes', () => {
      component.filters.page = 3;
      component.filters.limit = 25;
      component.onFilterChange();

      expect(component.filters.page).toBe(1);
      expect(productService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 25 })
      );
    });

    it('should calculate page numbers correctly', () => {
      component.pagination.totalPages = 10;
      component.pagination.page = 5;
      
      const pages = component.getPageNumbers();
      
      expect(pages).toContain(5);
      expect(pages.length).toBeLessThanOrEqual(5);
    });

    it('should calculate start index correctly', () => {
      component.pagination.page = 2;
      component.pagination.limit = 25;
      
      expect(component.getStartIndex()).toBe(26);
    });

    it('should calculate end index correctly', () => {
      component.pagination.page = 1;
      component.pagination.limit = 25;
      component.pagination.total = 100;
      
      expect(component.getEndIndex()).toBe(25);
    });

    it('should calculate end index for last partial page', () => {
      component.pagination.page = 2;
      component.pagination.limit = 25;
      component.pagination.total = 30;
      
      expect(component.getEndIndex()).toBe(30);
    });
  });

  describe('Navigation', () => {
    it('should navigate to create product page', () => {
      component.createProduct();

      expect(router.navigate).toHaveBeenCalledWith(['/products/create']);
    });

    it('should navigate to view product page', () => {
      component.viewProduct('1');

      expect(router.navigate).toHaveBeenCalledWith(['/products/view', '1']);
    });

    it('should navigate to edit product page', () => {
      component.editProduct('1');

      expect(router.navigate).toHaveBeenCalledWith(['/products/edit', '1']);
    });
  });

  describe('Activate/Deactivate Functionality', () => {
    it('should call confirm before activating', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      component.activateProduct(mockProductListItem);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to activate TEST001?');
      expect(productService.activateProduct).not.toHaveBeenCalled();
    });

    it('should activate product when confirmed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.activateProduct(mockProductListItem);

      expect(productService.activateProduct).toHaveBeenCalledWith('1');
    });

    it('should reload products after successful activation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const loadSpy = vi.spyOn(component, 'loadProducts');

      component.activateProduct(mockProductListItem);

      expect(toastService.success).toHaveBeenCalledWith('Product activated successfully');
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should handle activation errors', () => {
      const error = new Error('Activation failed');
      productService.activateProduct.mockReturnValue(throwError(() => error));
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.activateProduct(mockProductListItem);

      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith('Failed to activate product');
    });

    it('should call confirm before deactivating', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      component.deactivateProduct(mockProductListItem);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to deactivate TEST001?');
      expect(productService.deactivateProduct).not.toHaveBeenCalled();
    });

    it('should deactivate product when confirmed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.deactivateProduct(mockProductListItem);

      expect(productService.deactivateProduct).toHaveBeenCalledWith('1');
    });

    it('should reload products after successful deactivation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const loadSpy = vi.spyOn(component, 'loadProducts');

      component.deactivateProduct(mockProductListItem);

      expect(toastService.success).toHaveBeenCalledWith('Product deactivated successfully');
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should handle deactivation errors', () => {
      const error = new Error('Deactivation failed');
      productService.deactivateProduct.mockReturnValue(throwError(() => error));
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.deactivateProduct(mockProductListItem);

      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith('Failed to deactivate product');
    });
  });

  describe('Delete Functionality', () => {
    it('should call confirm before deleting', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      component.deleteProduct(mockProductListItem);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete TEST001?');
      expect(productService.deleteProduct).not.toHaveBeenCalled();
    });

    it('should delete product when confirmed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.deleteProduct(mockProductListItem);

      expect(productService.deleteProduct).toHaveBeenCalledWith('1');
    });

    it('should reload products after successful deletion', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const loadSpy = vi.spyOn(component, 'loadProducts');

      component.deleteProduct(mockProductListItem);

      expect(toastService.success).toHaveBeenCalledWith('Product deleted successfully');
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should handle delete errors', () => {
      const error = new Error('Delete failed');
      productService.deleteProduct.mockReturnValue(throwError(() => error));
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.deleteProduct(mockProductListItem);

      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith('Failed to delete product');
    });
  });

  describe('Stats Display', () => {
    it('should display correct statistics', () => {
      fixture.detectChanges();

      expect(component.stats.total).toBe(1);
      expect(component.stats.active).toBe(1);
      expect(component.stats.inactive).toBe(0);
    });

    it('should update stats when filters change', () => {
      const updatedStats: PaginatedProducts = {
        products: [
          { ...mockProductListItem, product_id: '1', is_active: true },
          { ...mockProductListItem, product_id: '2', is_active: false },
          { ...mockProductListItem, product_id: '3', is_active: true },
          { ...mockProductListItem, product_id: '4', is_active: false },
          { ...mockProductListItem, product_id: '5', is_active: true }
        ],
        total: 5,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      productService.getProducts.mockReturnValue(of(updatedStats));

      component.loadProducts();

      expect(component.stats.total).toBe(5);
      expect(component.stats.active).toBe(3);
      expect(component.stats.inactive).toBe(2);
    });
  });

  describe('Helper Methods', () => {
    it('should get initials from plan code', () => {
      const initials = component.getInitials('TEST PLAN');
      expect(initials).toBe('TP');
    });

    it('should get initials from single word code', () => {
      const initials = component.getInitials('PLAN');
      expect(initials).toBe('P');
    });

    it('should handle plan codes with multiple words', () => {
      const initials = component.getInitials('ABC DEF GHI');
      expect(initials).toBe('AD');
    });
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const subscription = component['destroy$'];
      const completeSpy = vi.spyOn(subscription, 'next');

      component.ngOnDestroy();

      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      const networkError = { status: 0, message: 'Network error' };
      productService.getProducts.mockReturnValue(throwError(() => networkError));

      component.loadProducts();

      expect(component.loading).toBe(false);
      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalled();
    });

    it('should handle 500 server errors', () => {
      const serverError = { status: 500, message: 'Internal server error' };
      productService.getProducts.mockReturnValue(throwError(() => serverError));

      component.loadProducts();

      expect(component.loading).toBe(false);
      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalled();
    });
  });

  describe('Permissions', () => {
    it('should check CREATE permission for create button', () => {
      expect(component.PERMISSIONS.CREATE).toBeDefined();
      expect(component.PERMISSIONS.CREATE).toBe('POLICY_MANAGEMENT.CREATE');
    });

    it('should check VIEW permission for view action', () => {
      expect(component.PERMISSIONS.VIEW).toBeDefined();
      expect(component.PERMISSIONS.VIEW).toBe('POLICY_MANAGEMENT.VIEW');
    });

    it('should check UPDATE permission for edit action', () => {
      expect(component.PERMISSIONS.UPDATE).toBeDefined();
      expect(component.PERMISSIONS.UPDATE).toBe('POLICY_MANAGEMENT.UPDATE');
    });

    it('should check DELETE permission for delete action', () => {
      expect(component.PERMISSIONS.DELETE).toBeDefined();
      expect(component.PERMISSIONS.DELETE).toBe('POLICY_MANAGEMENT.DELETE');
    });

    it('should check ACTIVATE permission for activate action', () => {
      expect(component.PERMISSIONS.ACTIVATE).toBeDefined();
      expect(component.PERMISSIONS.ACTIVATE).toBe('POLICY_MANAGEMENT.ACTIVATE');
    });

    it('should check DEACTIVATE permission for deactivate action', () => {
      expect(component.PERMISSIONS.DEACTIVATE).toBeDefined();
      expect(component.PERMISSIONS.DEACTIVATE).toBe('POLICY_MANAGEMENT.DEACTIVATE');
    });
  });
});
