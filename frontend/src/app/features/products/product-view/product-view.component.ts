import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductLimit, ProductCopay, CreateProductLimitDto, UpdateProductLimitDto, CreateProductCopayDto, UpdateProductCopayDto } from '../../../shared/models/product.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoadingSpinnerComponent],
  templateUrl: './product-view.component.html',
  styles: []
})
export class ProductViewComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  loading = false;
  activeTab = 'details';

  // Permission constants (exposed to template)
  readonly PERMISSIONS = PERMISSIONS.POLICY_MANAGEMENT;

  // Limits
  limits: ProductLimit[] = [];
  loadingLimits = false;
  showLimitForm = false;
  editingLimit: ProductLimit | null = null;
  limitFormData: Partial<CreateProductLimitDto> = {
    limit_type: '',
    limit_amount: 0,
    is_active: true
  };

  // Copay
  copayList: ProductCopay[] = [];
  loadingCopay = false;
  showCopayForm = false;
  editingCopay: ProductCopay | null = null;
  copayFormData: Partial<CreateProductCopayDto> = {
    copay_type: '',
    copay_value: 0,
    applies_to: '',
    is_active: true
  };

  tabs = [
    { id: 'details', label: 'Product Details' },
    { id: 'limits', label: 'Limits' },
    { id: 'copay', label: 'Copay' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    } else {
      this.toast.error('Invalid product ID');
      this.goBack();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load product data
   */
  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProductById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          this.product = product;
          this.loading = false;
          this.logger.info('Product loaded successfully');
        },
        error: (error) => {
          this.logger.error('Error loading product:', error);
          this.toast.error('Failed to load product');
          this.loading = false;
          this.goBack();
        }
      });
  }

  /**
   * Navigate back to list
   */
  goBack(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Navigate to edit page
   */
  editProduct(): void {
    if (this.product) {
      this.router.navigate(['/products/edit', this.product.product_id]);
    }
  }

  /**
   * Handle tab change
   */
  onTabChange(tabId: string): void {
    this.activeTab = tabId;
    
    // Lazy load tab data
    if (tabId === 'limits' && this.limits.length === 0) {
      this.loadLimits();
    } else if (tabId === 'copay' && this.copayList.length === 0) {
      this.loadCopay();
    }
  }

  // ============================================================================
  // LIMITS MANAGEMENT
  // ============================================================================

  /**
   * Load product limits
   */
  loadLimits(): void {
    if (!this.product) return;

    this.loadingLimits = true;
    this.productService.getLimitsByProductId(this.product.product_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (limits) => {
          this.limits = limits;
          this.loadingLimits = false;
          this.logger.info('Limits loaded successfully');
        },
        error: (error) => {
          this.logger.error('Error loading limits:', error);
          this.toast.error('Failed to load limits');
          this.loadingLimits = false;
        }
      });
  }

  /**
   * Show limit form for creating/editing
   */
  showLimitFormDialog(limit?: ProductLimit): void {
    if (limit) {
      this.editingLimit = limit;
      this.limitFormData = {
        limit_type: limit.limit_type || '',
        limit_amount: limit.limit_amount || 0,
        is_active: limit.is_active
      };
    } else {
      this.editingLimit = null;
      this.resetLimitForm();
    }
    this.showLimitForm = true;
  }

  /**
   * Save limit (create or update)
   */
  saveLimit(form: any): void {
    if (!this.product || form.invalid) return;

    const productId = this.product.product_id;
    const limitData = { ...(this.limitFormData as CreateProductLimitDto) };

    if (this.editingLimit) {
      // Update existing limit
      const updateData: UpdateProductLimitDto = limitData;
      this.productService.updateLimit(productId, this.editingLimit.limit_id, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Limit updated successfully');
            this.showLimitForm = false;
            this.editingLimit = null;
            this.resetLimitForm();
            this.loadLimits();
          },
          error: (error) => {
            this.logger.error('Error updating limit:', error);
            this.toast.error('Failed to update limit');
          }
        });
    } else {
      // Create new limit
      this.productService.createLimit(productId, limitData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Limit created successfully');
            this.showLimitForm = false;
            this.resetLimitForm();
            this.loadLimits();
          },
          error: (error) => {
            this.logger.error('Error creating limit:', error);
            this.toast.error('Failed to create limit');
          }
        });
    }
  }

  /**
   * Delete limit
   */
  deleteLimit(limit: ProductLimit): void {
    if (!this.product) return;
    if (!confirm(`Are you sure you want to delete this limit (${limit.limit_type})?`)) {
      return;
    }

    this.productService.deleteLimit(this.product.product_id, limit.limit_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Limit deleted successfully');
          this.loadLimits();
        },
        error: (error) => {
          this.logger.error('Error deleting limit:', error);
          this.toast.error('Failed to delete limit');
        }
      });
  }

  /**
   * Cancel limit form
   */
  cancelLimitForm(): void {
    this.showLimitForm = false;
    this.editingLimit = null;
    this.resetLimitForm();
  }

  /**
   * Reset limit form
   */
  resetLimitForm(): void {
    this.limitFormData = {
      limit_type: '',
      limit_amount: 0,
      is_active: true
    };
  }

  // ============================================================================
  // COPAY MANAGEMENT
  // ============================================================================

  /**
   * Load product copay
   */
  loadCopay(): void {
    if (!this.product) return;

    this.loadingCopay = true;
    this.productService.getCopayByProductId(this.product.product_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (copay) => {
          this.copayList = copay;
          this.loadingCopay = false;
          this.logger.info('Copay loaded successfully');
        },
        error: (error) => {
          this.logger.error('Error loading copay:', error);
          this.toast.error('Failed to load copay');
          this.loadingCopay = false;
        }
      });
  }

  /**
   * Show copay form for creating/editing
   */
  showCopayFormDialog(copay?: ProductCopay): void {
    if (copay) {
      this.editingCopay = copay;
      this.copayFormData = {
        copay_type: copay.copay_type || '',
        copay_value: copay.copay_value || 0,
        applies_to: copay.applies_to || '',
        is_active: copay.is_active
      };
    } else {
      this.editingCopay = null;
      this.resetCopayForm();
    }
    this.showCopayForm = true;
  }

  /**
   * Save copay (create or update)
   */
  saveCopay(form: any): void {
    if (!this.product || form.invalid) return;

    const productId = this.product.product_id;
    const copayData = { ...(this.copayFormData as CreateProductCopayDto) };

    if (this.editingCopay) {
      // Update existing copay
      const updateData: UpdateProductCopayDto = copayData;
      this.productService.updateCopay(productId, this.editingCopay.copay_id, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Copay updated successfully');
            this.showCopayForm = false;
            this.editingCopay = null;
            this.resetCopayForm();
            this.loadCopay();
          },
          error: (error) => {
            this.logger.error('Error updating copay:', error);
            this.toast.error('Failed to update copay');
          }
        });
    } else {
      // Create new copay
      this.productService.createCopay(productId, copayData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Copay created successfully');
            this.showCopayForm = false;
            this.resetCopayForm();
            this.loadCopay();
          },
          error: (error) => {
            this.logger.error('Error creating copay:', error);
            this.toast.error('Failed to create copay');
          }
        });
    }
  }

  /**
   * Delete copay
   */
  deleteCopay(copay: ProductCopay): void {
    if (!this.product) return;
    if (!confirm(`Are you sure you want to delete this cop ay (${copay.copay_type})?`)) {
      return;
    }

    this.productService.deleteCopay(this.product.product_id, copay.copay_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Copay deleted successfully');
          this.loadCopay();
        },
        error: (error) => {
          this.logger.error('Error deleting copay:', error);
          this.toast.error('Failed to delete copay');
        }
      });
  }

  /**
   * Cancel copay form
   */
  cancelCopayForm(): void {
    this.showCopayForm = false;
    this.editingCopay = null;
    this.resetCopayForm();
  }

  /**
   * Reset copay form
   */
  resetCopayForm(): void {
    this.copayFormData = {
      copay_type: '',
      copay_value: 0,
      applies_to: '',
      is_active: true
    };
  }
}
