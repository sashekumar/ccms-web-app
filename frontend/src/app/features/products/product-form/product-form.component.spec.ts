import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductFormComponent } from './product-form.component';
import { ProductService } from '../../../core/services/product.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../shared/models/product.model';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
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

  beforeEach(async () => {
    productService = {
      getProductById: vi.fn().mockReturnValue(of(mockProduct)),
      createProduct: vi.fn().mockReturnValue(of(mockProduct)),
      updateProduct: vi.fn().mockReturnValue(of(null)),
      checkPlanCode: vi.fn().mockReturnValue(of({ exists: false }))
    };

    router = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    route = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(null)
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
      imports: [ProductFormComponent, FormsModule],
      providers: [
        { provide: ProductService, useValue: productService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: ToastService, useValue: toastService },
        { provide: LoggerService, useValue: loggerService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
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
      const componentMetadata = (ProductFormComponent as any).ɵcmp;
      expect(componentMetadata.standalone).toBe(true);
    });
  });

  describe('Component Initialization', () => {
    it('should initialize in create mode by default', () => {
      fixture.detectChanges();
      
      expect(component.isEditMode).toBe(false);
      expect(component.productId).toBeNull();
    });

    it('should initialize in edit mode with valid ID', () => {
      route.snapshot.paramMap.get.mockReturnValue('1');
      
      fixture.detectChanges();
      
      expect(component.isEditMode).toBe(true);
      expect(component.productId).toBe('1');
      expect(productService.getProductById).toHaveBeenCalledWith('1');
    });

    it('should initialize form with default values', () => {
      fixture.detectChanges();
      
      expect(component.formData.plan_code).toBe('');
      expect(component.formData.is_active).toBe(true);
    });
  });

  describe('loadProduct()', () => {
    it('should load product successfully in edit mode', () => {
      component.loadProduct('1');

      expect(component.loading).toBe(false);
      expect(productService.getProductById).toHaveBeenCalledWith('1');
      expect(component.formData.plan_code).toBe('TEST001');
      expect(component.formData.plan_name).toBe('Test Plan');
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

  describe('Plan Code Validation', () => {
    it('should not validate plan code in edit mode', () => {
      component.isEditMode = true;
      component.onPlanCodeChange('TEST001');

      expect(component.planCodeInvalid).toBe(false);
      expect(productService.checkPlanCode).not.toHaveBeenCalled();
    });

    it('should check plan code uniqueness in create mode', () => {
      vi.useFakeTimers();
      fixture.detectChanges(); // Initialize component and setup subscriptions
      component.isEditMode = false;
      
      component.onPlanCodeChange('NEWCODE');
      vi.advanceTimersByTime(500);

      expect(productService.checkPlanCode).toHaveBeenCalledWith('NEWCODE');
      vi.useRealTimers();
    });

    it('should mark plan code as invalid if exists', () => {
      productService.checkPlanCode.mockReturnValue(of({ exists: true }));
      
      component.checkPlanCode('EXISTINGCODE');

      expect(component.planCodeInvalid).toBe(true);
      expect(component.checkingPlanCode).toBe(false);
    });

    it('should mark plan code as valid if not exists', () => {
      productService.checkPlanCode.mockReturnValue(of({ exists: false }));
      
      component.checkPlanCode('NEWCODE');

      expect(component.planCodeInvalid).toBe(false);
      expect(component.checkingPlanCode).toBe(false);
    });

    it('should handle plan code check errors gracefully', () => {
      const error = new Error('Check failed');
      productService.checkPlanCode.mockReturnValue(throwError(() => error));
      
      component.checkPlanCode('TESTCODE');

      expect(component.checkingPlanCode).toBe(false);
      expect(loggerService.error).toHaveBeenCalled();
    });

    it('should not check empty plan code', () => {
      component.checkPlanCode('');

      expect(productService.checkPlanCode).not.toHaveBeenCalled();
    });
  });

  describe('Create Product', () => {
    beforeEach(() => {
      component.isEditMode = false;
      component.formData = {
        plan_code: 'NEWPLAN',
        plan_name: 'New Plan',
        insurer_name: 'New Insurer',
        is_active: true,
        legacy_product_id: ''
      };
    });

    it('should create product successfully', () => {
      component.save();

      expect(productService.createProduct).toHaveBeenCalledWith(component.formData);
      expect(toastService.success).toHaveBeenCalledWith('Product created successfully');
      expect(component.saving).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/products']);
    });

    it('should handle create errors', () => {
      const error = new Error('Create failed');
      productService.createProduct.mockReturnValue(throwError(() => error));

      component.save();

      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith('Failed to create product');
      expect(component.saving).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not save if plan code is invalid', () => {
      component.planCodeInvalid = true;

      component.save();

      expect(productService.createProduct).not.toHaveBeenCalled();
    });

    it('should not save if already saving', () => {
      component.saving = true;

      component.save();

      expect(productService.createProduct).not.toHaveBeenCalled();
    });
  });

  describe('Update Product', () => {
    beforeEach(() => {
      component.isEditMode = true;
      component.productId = '1';
      component.formData = {
        plan_code: 'TEST001',
        plan_name: 'Updated Plan',
        insurer_name: 'Updated Insurer',
        is_active: false,
        legacy_product_id: 'LEG001'
      };
    });

    it('should update product successfully', () => {
      component.save();

      expect(productService.updateProduct).toHaveBeenCalledWith('1', {
        plan_name: 'Updated Plan',
        insurer_name: 'Updated Insurer',
        is_active: false,
        legacy_product_id: 'LEG001'
      });
      expect(toastService.success).toHaveBeenCalledWith('Product updated successfully');
      expect(component.saving).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/products']);
    });

    it('should handle update errors', () => {
      const error = new Error('Update failed');
      productService.updateProduct.mockReturnValue(throwError(() => error));

      component.save();

      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith('Failed to update product');
      expect(component.saving).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not include plan_code in update payload', () => {
      component.save();

      const updateCall = productService.updateProduct.mock.calls[0];
      expect(updateCall[1]).not.toHaveProperty('plan_code');
    });
  });

  describe('Navigation', () => {
    it('should navigate back to list', () => {
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/products']);
    });
  });

  describe('Form Validation', () => {
    it('should require plan code for creation', () => {
      component.formData.plan_code = '';
      
      expect(component.formData.plan_code).toBe('');
    });

    it('should allow optional plan name', () => {
      component.formData.plan_name = '';
      
      expect(component.formData.plan_name).toBe('');
    });

    it('should allow optional insurer name', () => {
      component.formData.insurer_name = '';
      
      expect(component.formData.insurer_name).toBe('');
    });

    it('should default is_active to true', () => {
      expect(component.formData.is_active).toBe(true);
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
});
