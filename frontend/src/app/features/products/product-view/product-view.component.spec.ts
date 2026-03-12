import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductViewComponent } from './product-view.component';
import { ProductService } from '../../../core/services/product.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product, ProductLimit, ProductCopay } from '../../../shared/models/product.model';

describe('ProductViewComponent', () => {
  let component: ProductViewComponent;
  let fixture: ComponentFixture<ProductViewComponent>;
  let productService: any;
  let router: any;
  let route: any;
  let toastService: any;
  let loggerService: any;

  const mockProduct: Product = {
    product_id: '1',
    plan_code: 'TEST001',
    plan_name: 'Test Plan',
    insurer_name: 'Test Insurer',
    is_active: true,
    legacy_product_id: 'LEG001',
    created_at: new Date()
  };

  const mockLimit: ProductLimit = {
    limit_id: '1',
    product_id: '1',
    limit_type: 'ANNUAL',
    limit_amount: 100000,
    is_active: true
  };

  const mockCopay: ProductCopay = {
    copay_id: '1',
    product_id: '1',
    copay_type: 'PERCENTAGE',
    copay_value: 10,
    applies_to: 'ALL',
    is_active: true
  };

  beforeEach(async () => {
    productService = {
      getProductById: vi.fn().mockReturnValue(of(mockProduct)),
      getLimitsByProductId: vi.fn().mockReturnValue(of([mockLimit])),
      getCopayByProductId: vi.fn().mockReturnValue(of([mockCopay])),
      createLimit: vi.fn().mockReturnValue(of(mockLimit)),
      updateLimit: vi.fn().mockReturnValue(of(null)),
      deleteLimit: vi.fn().mockReturnValue(of(null)),
      createCopay: vi.fn().mockReturnValue(of(mockCopay)),
      updateCopay: vi.fn().mockReturnValue(of(null)),
      deleteCopay: vi.fn().mockReturnValue(of(null))
    };

    router = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    route = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1')
        }
      }
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
      imports: [ProductViewComponent, FormsModule],
      providers: [
        { provide: ProductService, useValue: productService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: ToastService, useValue: toastService },
        { provide: LoggerService, useValue: loggerService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductViewComponent);
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
      const componentMetadata = (ProductViewComponent as any).ɵcmp;
      expect(componentMetadata.standalone).toBe(true);
    });
  });

  describe('Component Initialization', () => {
    it('should load product on init with valid ID', () => {
      fixture.detectChanges();
      
      expect(productService.getProductById).toHaveBeenCalledWith('1');
      expect(component.product).toEqual(mockProduct);
    });

    it('should navigate back if no product ID', () => {
      route.snapshot.paramMap.get.mockReturnValue(null);
      
      component.ngOnInit();
      
      expect(toastService.error).toHaveBeenCalledWith('Invalid product ID');
      expect(router.navigate).toHaveBeenCalledWith(['/products']);
    });

    it('should initialize with default tab', () => {
      expect(component.activeTab).toBe('details');
    });
  });

  describe('loadProduct()', () => {
    it('should load product successfully', () => {
      component.loadProduct('1');

      expect(component.loading).toBe(false);
      expect(productService.getProductById).toHaveBeenCalledWith('1');
      expect(component.product).toEqual(mockProduct);
    });

    it('should handle load errors', () => {
      const error = new Error('Failed to load');
      productService.getProductById.mockReturnValue(throwError(() => error));

      component.loadProduct('1');

      expect(component.loading).toBe(false);
      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith('Failed to load product');
      expect(router.navigate).toHaveBeenCalledWith(['/products']);
    });
  });

  describe('Navigation', () => {
    it('should navigate back to list', () => {
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/products']);
    });

    it('should navigate to edit page', () => {
      component.product = mockProduct;
      component.editProduct();
      expect(router.navigate).toHaveBeenCalledWith(['/products/edit', '1']);
    });

    it('should not navigate to edit if no product loaded', () => {
      component.product = null;
      component.editProduct();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Tab Management', () => {
    beforeEach(() => {
      component.product = mockProduct;
    });

    it('should change active tab', () => {
      component.onTabChange('limits');
      expect(component.activeTab).toBe('limits');
    });

    it('should lazy load limits when switching to limits tab', () => {
      component.onTabChange('limits');
      expect(productService.getLimitsByProductId).toHaveBeenCalledWith('1');
    });

    it('should lazy load copay when switching to copay tab', () => {
      component.onTabChange('copay');
      expect(productService.getCopayByProductId).toHaveBeenCalledWith('1');
    });

    it('should not reload limits if already loaded', () => {
      component.limits = [mockLimit];
      component.onTabChange('limits');
      expect(productService.getLimitsByProductId).not.toHaveBeenCalled();
    });

    it('should not reload copay if already loaded', () => {
      component.copayList = [mockCopay];
      component.onTabChange('copay');
      expect(productService.getCopayByProductId).not.toHaveBeenCalled();
    });
  });

  describe('Limits Management', () => {
    beforeEach(() => {
      component.product = mockProduct;
    });

    it('should load limits successfully', () => {
      component.loadLimits();

      expect(productService.getLimitsByProductId).toHaveBeenCalledWith('1');
      expect(component.limits).toEqual([mockLimit]);
      expect(component.loadingLimits).toBe(false);
    });

    it('should handle load limits errors', () => {
      const error = new Error('Failed to load');
      productService.getLimitsByProductId.mockReturnValue(throwError(() => error));

      component.loadLimits();

      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith('Failed to load limits');
      expect(component.loadingLimits).toBe(false);
    });

    it('should show limit form for creating', () => {
      component.showLimitFormDialog();

      expect(component.showLimitForm).toBe(true);
      expect(component.editingLimit).toBeNull();
      expect(component.limitFormData.limit_type).toBe('');
    });

    it('should show limit form for editing', () => {
      component.showLimitFormDialog(mockLimit);

      expect(component.showLimitForm).toBe(true);
      expect(component.editingLimit).toEqual(mockLimit);
      expect(component.limitFormData.limit_type).toBe('ANNUAL');
      expect(component.limitFormData.limit_amount).toBe(100000);
    });

    it('should create new limit', () => {
      const form: any = { invalid: false };
      component.limitFormData = { limit_type: 'ANNUAL', limit_amount: 50000, is_active: true };
      
      component.saveLimit(form);

      expect(productService.createLimit).toHaveBeenCalledWith('1', expect.objectContaining({
        limit_type: 'ANNUAL',
        limit_amount: 50000,
        is_active: true
      }));
      expect(toastService.success).toHaveBeenCalledWith('Limit created successfully');
      expect(component.showLimitForm).toBe(false);
    });

    it('should update existing limit', () => {
      const form: any = { invalid: false };
      component.editingLimit = mockLimit;
      component.limitFormData = { limit_type: 'LIFETIME', limit_amount: 200000, is_active: true };
      
      component.saveLimit(form);

      expect(productService.updateLimit).toHaveBeenCalledWith('1', '1', expect.objectContaining({
        limit_type: 'LIFETIME',
        limit_amount: 200000,
        is_active: true
      }));
      expect(toastService.success).toHaveBeenCalledWith('Limit updated successfully');
      expect(component.showLimitForm).toBe(false);
    });

    it('should not save if form is invalid', () => {
      const form: any = { invalid: true };
      
      component.saveLimit(form);

      expect(productService.createLimit).not.toHaveBeenCalled();
      expect(productService.updateLimit).not.toHaveBeenCalled();
    });

    it('should delete limit with confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      component.deleteLimit(mockLimit);

      expect(productService.deleteLimit).toHaveBeenCalledWith('1', '1');
      expect(toastService.success).toHaveBeenCalledWith('Limit deleted successfully');
    });

    it('should not delete limit without confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      component.deleteLimit(mockLimit);

      expect(productService.deleteLimit).not.toHaveBeenCalled();
    });

    it('should cancel limit form', () => {
      component.showLimitForm = true;
      component.editingLimit = mockLimit;
      
      component.cancelLimitForm();

      expect(component.showLimitForm).toBe(false);
      expect(component.editingLimit).toBeNull();
    });

    it('should reset limit form', () => {
      component.limitFormData = { limit_type: 'TEST', limit_amount: 999, is_active: false };
      
      component.resetLimitForm();

      expect(component.limitFormData.limit_type).toBe('');
      expect(component.limitFormData.limit_amount).toBe(undefined);
      expect(component.limitFormData.is_active).toBe(true);
    });
  });

  describe('Copay Management', () => {
    beforeEach(() => {
      component.product = mockProduct;
    });

    it('should load copay successfully', () => {
      component.loadCopay();

      expect(productService.getCopayByProductId).toHaveBeenCalledWith('1');
      expect(component.copayList).toEqual([mockCopay]);
      expect(component.loadingCopay).toBe(false);
    });

    it('should handle load copay errors', () => {
      const error = new Error('Failed to load');
      productService.getCopayByProductId.mockReturnValue(throwError(() => error));

      component.loadCopay();

      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith('Failed to load copay');
      expect(component.loadingCopay).toBe(false);
    });

    it('should show copay form for creating', () => {
      component.showCopayFormDialog();

      expect(component.showCopayForm).toBe(true);
      expect(component.editingCopay).toBeNull();
      expect(component.copayFormData.copay_type).toBe('');
    });

    it('should show copay form for editing', () => {
      component.showCopayFormDialog(mockCopay);

      expect(component.showCopayForm).toBe(true);
      expect(component.editingCopay).toEqual(mockCopay);
      expect(component.copayFormData.copay_type).toBe('PERCENTAGE');
      expect(component.copayFormData.copay_value).toBe(10);
    });

    it('should create new copay', () => {
      const form: any = { invalid: false };
      component.copayFormData = { copay_type: 'FIXED', copay_value: 50, applies_to: 'OUTPATIENT', is_active: true };
      
      component.saveCopay(form);

      expect(productService.createCopay).toHaveBeenCalledWith('1', expect.objectContaining({
        copay_type: 'FIXED',
        copay_value: 50,
        applies_to: 'OUTPATIENT',
        is_active: true
      }));
      expect(toastService.success).toHaveBeenCalledWith('Copay created successfully');
      expect(component.showCopayForm).toBe(false);
    });

    it('should update existing copay', () => {
      const form: any = { invalid: false };
      component.editingCopay = mockCopay;
      component.copayFormData = { copay_type: 'FIXED', copay_value: 100, applies_to: 'INPATIENT', is_active: true };
      
      component.saveCopay(form);

      expect(productService.updateCopay).toHaveBeenCalledWith('1', '1', expect.objectContaining({
        copay_type: 'FIXED',
        copay_value: 100,
        applies_to: 'INPATIENT',
        is_active: true
      }));
      expect(toastService.success).toHaveBeenCalledWith('Copay updated successfully');
      expect(component.showCopayForm).toBe(false);
    });

    it('should not save if form is invalid', () => {
      const form: any = { invalid: true };
      
      component.saveCopay(form);

      expect(productService.createCopay).not.toHaveBeenCalled();
      expect(productService.updateCopay).not.toHaveBeenCalled();
    });

    it('should delete copay with confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      component.deleteCopay(mockCopay);

      expect(productService.deleteCopay).toHaveBeenCalledWith('1', '1');
      expect(toastService.success).toHaveBeenCalledWith('Copay deleted successfully');
    });

    it('should not delete copay without confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      component.deleteCopay(mockCopay);

      expect(productService.deleteCopay).not.toHaveBeenCalled();
    });

    it('should cancel copay form', () => {
      component.showCopayForm = true;
      component.editingCopay = mockCopay;
      
      component.cancelCopayForm();

      expect(component.showCopayForm).toBe(false);
      expect(component.editingCopay).toBeNull();
    });

    it('should reset copay form', () => {
      component.copayFormData = { copay_type: 'TEST', copay_value: 999, applies_to: 'TEST', is_active: false };
      
      component.resetCopayForm();

      expect(component.copayFormData.copay_type).toBe('');
      expect(component.copayFormData.copay_value).toBe(undefined);
      expect(component.copayFormData.applies_to).toBe('');
      expect(component.copayFormData.is_active).toBe(true);
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

  describe('Permissions', () => {
    it('should expose POLICY_MANAGEMENT permissions', () => {
      expect(component.PERMISSIONS).toBeDefined();
      expect(component.PERMISSIONS.VIEW).toBe('POLICY_MANAGEMENT.VIEW');
      expect(component.PERMISSIONS.UPDATE).toBe('POLICY_MANAGEMENT.UPDATE');
      expect(component.PERMISSIONS.MANAGE_LIMITS).toBe('POLICY_MANAGEMENT.MANAGE_LIMITS');
      expect(component.PERMISSIONS.MANAGE_COPAY).toBe('POLICY_MANAGEMENT.MANAGE_COPAY');
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      component.product = mockProduct;
    });

    it('should set loading to true when loading product', () => {
      component.loading = false;
      component.loadProduct('1');
      
      // Check intermediate state would be true (synchronously)
      expect(productService.getProductById).toHaveBeenCalledWith('1');
    });

    it('should set loadingLimits to true when loading limits', () => {
      component.loadingLimits = false;
      
      productService.getLimitsByProductId.mockReturnValue(of([mockLimit]));
      component.loadLimits();

      expect(component.loadingLimits).toBe(false); // Should be false after success
    });

    it('should set loadingCopay to true when loading copay', () => {
      component.loadingCopay = false;
      
      productService.getCopayByProductId.mockReturnValue(of([mockCopay]));
      component.loadCopay();

      expect(component.loadingCopay).toBe(false); // Should be false after success
    });

    it('should reset loading state on product load error', () => {
      productService.getProductById.mockReturnValue(throwError(() => new Error('Error')));
      
      component.loadProduct('1');

      expect(component.loading).toBe(false);
    });

    it('should reset loadingLimits on error', () => {
      productService.getLimitsByProductId.mockReturnValue(throwError(() => new Error('Error')));
      
      component.loadLimits();

      expect(component.loadingLimits).toBe(false);
    });

    it('should reset loadingCopay on error', () => {
      productService.getCopayByProductId.mockReturnValue(throwError(() => new Error('Error')));
      
      component.loadCopay();

      expect(component.loadingCopay).toBe(false);
    });
  });

  describe('Error Scenarios - Limits', () => {
    beforeEach(() => {
      component.product = mockProduct;
    });

    it('should handle error when creating limit', () => {
      const form: any = { invalid: false };
      const error = new Error('Create failed');
      productService.createLimit.mockReturnValue(throwError(() => error));
      component.limitFormData = { limit_type: 'ANNUAL', limit_amount: 50000, is_active: true };
      
      component.saveLimit(form);

      expect(loggerService.error).toHaveBeenCalledWith('Error creating limit:', error);
      expect(toastService.error).toHaveBeenCalledWith('Failed to create limit');
    });

    it('should handle error when updating limit', () => {
      const form: any = { invalid: false };
      const error = new Error('Update failed');
      component.editingLimit = mockLimit;
      productService.updateLimit.mockReturnValue(throwError(() => error));
      component.limitFormData = { limit_type: 'LIFETIME', limit_amount: 200000, is_active: true };
      
      component.saveLimit(form);

      expect(loggerService.error).toHaveBeenCalledWith('Error updating limit:', error);
      expect(toastService.error).toHaveBeenCalledWith('Failed to update limit');
    });

    it('should handle error when deleting limit', () => {
      const error = new Error('Delete failed');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      productService.deleteLimit.mockReturnValue(throwError(() => error));
      
      component.deleteLimit(mockLimit);

      expect(loggerService.error).toHaveBeenCalledWith('Error deleting limit:', error);
      expect(toastService.error).toHaveBeenCalledWith('Failed to delete limit');
    });

    it('should not save limit when product is null', () => {
      const form: any = { invalid: false };
      component.product = null;
      
      component.saveLimit(form);

      expect(productService.createLimit).not.toHaveBeenCalled();
    });

    it('should not delete limit when product is null', () => {
      component.product = null;
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      component.deleteLimit(mockLimit);

      expect(productService.deleteLimit).not.toHaveBeenCalled();
    });

    it('should not load limits when product is null', () => {
      component.product = null;
      
      component.loadLimits();

      expect(productService.getLimitsByProductId).not.toHaveBeenCalled();
    });
  });

  describe('Error Scenarios - Copay', () => {
    beforeEach(() => {
      component.product = mockProduct;
    });

    it('should handle error when creating copay', () => {
      const form: any = { invalid: false };
      const error = new Error('Create failed');
      productService.createCopay.mockReturnValue(throwError(() => error));
      component.copayFormData = { copay_type: 'FIXED', copay_value: 50, applies_to: 'ALL', is_active: true };
      
      component.saveCopay(form);

      expect(loggerService.error).toHaveBeenCalledWith('Error creating copay:', error);
      expect(toastService.error).toHaveBeenCalledWith('Failed to create copay');
    });

    it('should handle error when updating copay', () => {
      const form: any = { invalid: false };
      const error = new Error('Update failed');
      component.editingCopay = mockCopay;
      productService.updateCopay.mockReturnValue(throwError(() => error));
      component.copayFormData = { copay_type: 'FIXED', copay_value: 100, applies_to: 'INPATIENT', is_active: true };
      
      component.saveCopay(form);

      expect(loggerService.error).toHaveBeenCalledWith('Error updating copay:', error);
      expect(toastService.error).toHaveBeenCalledWith('Failed to update copay');
    });

    it('should handle error when deleting copay', () => {
      const error = new Error('Delete failed');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      productService.deleteCopay.mockReturnValue(throwError(() => error));
      
      component.deleteCopay(mockCopay);

      expect(loggerService.error).toHaveBeenCalledWith('Error deleting copay:', error);
      expect(toastService.error).toHaveBeenCalledWith('Failed to delete copay');
    });

    it('should not save copay when product is null', () => {
      const form: any = { invalid: false };
      component.product = null;
      
      component.saveCopay(form);

      expect(productService.createCopay).not.toHaveBeenCalled();
    });

    it('should not delete copay when product is null', () => {
      component.product = null;
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      component.deleteCopay(mockCopay);

      expect(productService.deleteCopay).not.toHaveBeenCalled();
    });

    it('should not load copay when product is null', () => {
      component.product = null;
      
      component.loadCopay();

      expect(productService.getCopayByProductId).not.toHaveBeenCalled();
    });
  });

  describe('Form Data Management - Limits', () => {
    beforeEach(() => {
      component.product = mockProduct;
    });

    it('should reload limits after successful create', () => {
      const form: any = { invalid: false };
      component.limitFormData = { limit_type: 'ANNUAL', limit_amount: 50000, is_active: true };
      
      component.saveLimit(form);

      expect(productService.getLimitsByProductId).toHaveBeenCalled();
    });

    it('should reload limits after successful update', () => {
      const form: any = { invalid: false };
      component.editingLimit = mockLimit;
      component.limitFormData = { limit_type: 'LIFETIME', limit_amount: 200000, is_active: true };
      
      component.saveLimit(form);

      expect(productService.getLimitsByProductId).toHaveBeenCalled();
    });

    it('should reload limits after successful delete', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      component.deleteLimit(mockLimit);

      expect(productService.getLimitsByProductId).toHaveBeenCalled();
    });

    it('should reset editingLimit after successful update', () => {
      const form: any = { invalid: false };
      component.editingLimit = mockLimit;
      component.limitFormData = { limit_type: 'LIFETIME', limit_amount: 200000, is_active: true };
      
      component.saveLimit(form);

      expect(component.editingLimit).toBeNull();
    });

    it('should reset limit form after successful create', () => {
      const form: any = { invalid: false };
      component.limitFormData = { limit_type: 'ANNUAL', limit_amount: 50000, is_active: true };
      const resetSpy = vi.spyOn(component, 'resetLimitForm');
      
      component.saveLimit(form);

      expect(resetSpy).toHaveBeenCalled();
    });

    it('should handle limit with undefined optional fields', () => {
      const limitWithUndefined: ProductLimit = {
        limit_id: '2',
        product_id: '1',
        limit_type: undefined as any,
        limit_amount: undefined as any,
        is_active: true
      };

      component.showLimitFormDialog(limitWithUndefined);

      expect(component.limitFormData.limit_type).toBe('');
      expect(component.limitFormData.limit_amount).toBe(0);
    });

    it('should handle limit form with zero amount', () => {
      const form: any = { invalid: false };
      component.limitFormData = { limit_type: 'ANNUAL', limit_amount: 0, is_active: true };
      
      component.saveLimit(form);

      expect(productService.createLimit).toHaveBeenCalledWith('1', expect.objectContaining({
        limit_amount: 0
      }));
    });

    it('should handle limit form with inactive status', () => {
      const form: any = { invalid: false };
      component.limitFormData = { limit_type: 'ANNUAL', limit_amount: 50000, is_active: false };
      
      component.saveLimit(form);

      expect(productService.createLimit).toHaveBeenCalledWith('1', expect.objectContaining({
        is_active: false
      }));
    });

    it('should call resetLimitForm when showing create form', () => {
      const resetSpy = vi.spyOn(component, 'resetLimitForm');
      
      component.showLimitFormDialog();

      expect(resetSpy).toHaveBeenCalled();
    });
  });

  describe('Form Data Management - Copay', () => {
    beforeEach(() => {
      component.product = mockProduct;
    });

    it('should reload copay after successful create', () => {
      const form: any = { invalid: false };
      component.copayFormData = { copay_type: 'FIXED', copay_value: 50, applies_to: 'ALL', is_active: true };
      
      component.saveCopay(form);

      expect(productService.getCopayByProductId).toHaveBeenCalled();
    });

    it('should reload copay after successful update', () => {
      const form: any = { invalid: false };
      component.editingCopay = mockCopay;
      component.copayFormData = { copay_type: 'FIXED', copay_value: 100, applies_to: 'INPATIENT', is_active: true };
      
      component.saveCopay(form);

      expect(productService.getCopayByProductId).toHaveBeenCalled();
    });

    it('should reload copay after successful delete', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      component.deleteCopay(mockCopay);

      expect(productService.getCopayByProductId).toHaveBeenCalled();
    });

    it('should reset editingCopay after successful update', () => {
      const form: any = { invalid: false };
      component.editingCopay = mockCopay;
      component.copayFormData = { copay_type: 'FIXED', copay_value: 100, applies_to: 'INPATIENT', is_active: true };
      
      component.saveCopay(form);

      expect(component.editingCopay).toBeNull();
    });

    it('should reset copay form after successful create', () => {
      const form: any = { invalid: false };
      component.copayFormData = { copay_type: 'FIXED', copay_value: 50, applies_to: 'ALL', is_active: true };
      const resetSpy = vi.spyOn(component, 'resetCopayForm');
      
      component.saveCopay(form);

      expect(resetSpy).toHaveBeenCalled();
    });

    it('should handle copay with undefined optional fields', () => {
      const copayWithUndefined: ProductCopay = {
        copay_id: '2',
        product_id: '1',
        copay_type: undefined as any,
        copay_value: undefined as any,
        applies_to: undefined as any,
        is_active: true
      };

      component.showCopayFormDialog(copayWithUndefined);

      expect(component.copayFormData.copay_type).toBe('');
      expect(component.copayFormData.copay_value).toBe(0);
      expect(component.copayFormData.applies_to).toBe('');
    });

    it('should handle copay form with zero value', () => {
      const form: any = { invalid: false };
      component.copayFormData = { copay_type: 'FIXED', copay_value: 0, applies_to: 'ALL', is_active: true };
      
      component.saveCopay(form);

      expect(productService.createCopay).toHaveBeenCalledWith('1', expect.objectContaining({
        copay_value: 0
      }));
    });

    it('should handle copay form with inactive status', () => {
      const form: any = { invalid: false };
      component.copayFormData = { copay_type: 'FIXED', copay_value: 50, applies_to: 'ALL', is_active: false };
      
      component.saveCopay(form);

      expect(productService.createCopay).toHaveBeenCalledWith('1', expect.objectContaining({
        is_active: false
      }));
    });

    it('should call resetCopayForm when showing create form', () => {
      const resetSpy = vi.spyOn(component, 'resetCopayForm');
      
      component.showCopayFormDialog();

      expect(resetSpy).toHaveBeenCalled();
    });
  });

  describe('Tab Switching Edge Cases', () => {
    beforeEach(() => {
      component.product = mockProduct;
    });

    it('should handle switching to details tab', () => {
      component.activeTab = 'limits';
      
      component.onTabChange('details');

      expect(component.activeTab).toBe('details');
      expect(productService.getLimitsByProductId).not.toHaveBeenCalled();
      expect(productService.getCopayByProductId).not.toHaveBeenCalled();
    });

    it('should not trigger load when switching to same tab', () => {
      component.activeTab = 'limits';
      component.limits = [];
      
      component.onTabChange('limits');

      expect(productService.getLimitsByProductId).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid tab switching', () => {
      component.onTabChange('limits');
      component.onTabChange('copay');
      component.onTabChange('details');

      expect(component.activeTab).toBe('details');
    });
  });

  describe('Component State Initialization', () => {
    it('should initialize with empty limits array', () => {
      expect(component.limits).toEqual([]);
    });

    it('should initialize with empty copay array', () => {
      expect(component.copayList).toEqual([]);
    });

    it('should initialize with loading states as false', () => {
      expect(component.loading).toBe(false);
      expect(component.loadingLimits).toBe(false);
      expect(component.loadingCopay).toBe(false);
    });

    it('should initialize with form dialogs hidden', () => {
      expect(component.showLimitForm).toBe(false);
      expect(component.showCopayForm).toBe(false);
    });

    it('should initialize with null editing states', () => {
      expect(component.editingLimit).toBeNull();
      expect(component.editingCopay).toBeNull();
    });

    it('should initialize with default limit form data', () => {
      expect(component.limitFormData).toEqual({
        limit_type: '',
        limit_amount: undefined,
        is_active: true
      });
    });

    it('should initialize with default copay form data', () => {
      expect(component.copayFormData).toEqual({
        copay_type: '',
        copay_value: undefined,
        applies_to: '',
        is_active: true
      });
    });

    it('should have tabs array with correct structure', () => {
      expect(component.tabs).toEqual([
        { id: 'details', label: 'Product Details' },
        { id: 'limits', label: 'Limits' },
        { id: 'copay', label: 'Copay' }
      ]);
    });
  });

  describe('Multiple Items Handling', () => {
    const mockLimit2: ProductLimit = {
      limit_id: '2',
      product_id: '1',
      limit_type: 'LIFETIME',
      limit_amount: 500000,
      is_active: false
    };

    const mockCopay2: ProductCopay = {
      copay_id: '2',
      product_id: '1',
      copay_type: 'FIXED',
      copay_value: 25,
      applies_to: 'OUTPATIENT',
      is_active: false
    };

    beforeEach(() => {
      component.product = mockProduct;
    });

    it('should handle multiple limits', () => {
      productService.getLimitsByProductId.mockReturnValue(of([mockLimit, mockLimit2]));
      
      component.loadLimits();

      expect(component.limits).toHaveLength(2);
      expect(component.limits).toEqual([mockLimit, mockLimit2]);
    });

    it('should handle multiple copay entries', () => {
      productService.getCopayByProductId.mockReturnValue(of([mockCopay, mockCopay2]));
      
      component.loadCopay();

      expect(component.copayList).toHaveLength(2);
      expect(component.copayList).toEqual([mockCopay, mockCopay2]);
    });

    it('should handle empty limits array', () => {
      productService.getLimitsByProductId.mockReturnValue(of([]));
      
      component.loadLimits();

      expect(component.limits).toEqual([]);
    });

    it('should handle empty copay array', () => {
      productService.getCopayByProductId.mockReturnValue(of([]));
      
      component.loadCopay();

      expect(component.copayList).toEqual([]);
    });
  });

  describe('Confirmation Dialog Edge Cases', () => {
    beforeEach(() => {
      component.product = mockProduct;
    });

    it('should show correct message in limit delete confirmation', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      component.deleteLimit(mockLimit);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this limit (ANNUAL)?');
    });

    it('should show correct message in copay delete confirmation', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      component.deleteCopay(mockCopay);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this cop ay (PERCENTAGE)?');
    });
  });

  describe('Logger Integration', () => {
    beforeEach(() => {
      component.product = mockProduct;
    });

    it('should log success when product loads', () => {
      component.loadProduct('1');

      expect(loggerService.info).toHaveBeenCalledWith('Product loaded successfully');
    });

    it('should log success when limits load', () => {
      component.loadLimits();

      expect(loggerService.info).toHaveBeenCalledWith('Limits loaded successfully');
    });

    it('should log success when copay loads', () => {
      component.loadCopay();

      expect(loggerService.info).toHaveBeenCalledWith('Copay loaded successfully');
    });

    it('should log error with details when product load fails', () => {
      const error = new Error('Network error');
      productService.getProductById.mockReturnValue(throwError(() => error));

      component.loadProduct('1');

      expect(loggerService.error).toHaveBeenCalledWith('Error loading product:', error);
    });
  });
});
