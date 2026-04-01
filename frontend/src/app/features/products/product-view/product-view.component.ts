import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, Observable, map } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductLimit, ProductCopay, CreateProductLimitDto, UpdateProductLimitDto, CreateProductCopayDto, UpdateProductCopayDto, ProductLosThreshold, CreateProductLosThresholdDto, UpdateProductLosThresholdDto } from '../../../shared/models/product.model';
import { LookupService, LookupItem } from '../../../shared/services/lookup.service';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';
import { APP_ROUTES } from '../../../core/constants/routes.constants';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ToggleComponent } from '../../../shared/components/ui/toggle/toggle.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/ui/dropdown/dropdown.component';
import { TextInputComponent } from '../../../shared/components/ui/text-input/text-input.component';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox.component';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';

// Form data interfaces without product_id
interface LimitFormData {
  limit_type: string;
  limit_amount: number;
  is_active: boolean;
}

interface CopayFormData {
  copay_type: string;
  copay_value: number;
  applies_to: string;
  is_active: boolean;
}

interface ThresholdFormData {
  diagnosis_category: string;
  threshold_days: number;
  alert_level: number;
  is_active: boolean;
}

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    HasPermissionDirective, 
    LoadingSpinnerComponent, 
    ButtonComponent, 
    BadgeComponent, 
    ToggleComponent,
    DropdownComponent, 
    TextInputComponent, 
    CheckboxComponent, 
    ConfirmDialogComponent
  ],
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
  limitFormData: LimitFormData = {
    limit_type: '',
    limit_amount: 0,
    is_active: true
  };

  // Limit delete confirmation
  showDeleteLimitConfirm = false;
  limitToDelete: ProductLimit | null = null;

  // Dynamic lookups from database (transformed to DropdownOption[])
  limitTypes$: Observable<DropdownOption[]>;

  // Copay
  copayList: ProductCopay[] = [];
  loadingCopay = false;
  showCopayForm = false;
  editingCopay: ProductCopay | null = null;
  copayFormData: CopayFormData = {
    copay_type: '',
    copay_value: 0,
    applies_to: '',
    is_active: true
  };

  // Copay delete confirmation
  showDeleteCopayConfirm = false;
  copayToDelete: ProductCopay | null = null;

  // Dynamic lookups from database (transformed to DropdownOption[])
  copayTypes$: Observable<DropdownOption[]>;
  copayAppliesTo$: Observable<DropdownOption[]>;

  // Thresholds
  thresholds: ProductLosThreshold[] = [];
  loadingThresholds = false;
  showThresholdForm = false;
  editingThreshold: ProductLosThreshold | null = null;
  thresholdFormData: ThresholdFormData = {
    diagnosis_category: '',
    threshold_days: 1,
    alert_level: 1,
    is_active: true
  };

  // Threshold delete confirmation
  showDeleteThresholdConfirm = false;
  thresholdToDelete: ProductLosThreshold | null = null;

  // Status toggle confirmation
  showStatusToggleConfirm = false;
  statusToToggle: { newValue: boolean } | null = null;

  // Limit status toggle confirmation
  showLimitStatusToggleConfirm = false;
  limitStatusToToggle: { limit: ProductLimit; newValue: boolean } | null = null;

  // Copay status toggle confirmation
  showCopayStatusToggleConfirm = false;
  copayStatusToToggle: { copay: ProductCopay; newValue: boolean } | null = null;

  // Threshold status toggle confirmation
  showThresholdStatusToggleConfirm = false;
  thresholdStatusToToggle: { threshold: ProductLosThreshold; newValue: boolean } | null = null;

  diagnosisCategories$: Observable<DropdownOption[]>;
  alertLevels$: Observable<DropdownOption[]>;

  tabs = [
    { id: 'details', label: 'Product Details' },
    { id: 'limits', label: 'Limits' },
    { id: 'copay', label: 'Copay' },
    { id: 'thresholds', label: 'LOS Alert Thresholds' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private lookupService: LookupService,
    private logger: LoggerService,
    private toast: ToastService
  ) {
    // Initialize dynamic lookups and transform to DropdownOption format
    this.limitTypes$ = this.lookupService.getLimitTypes().pipe(
      map(items => items.map(item => ({ value: item.lookup_code, label: item.lookup_value })))
    );
    this.copayTypes$ = this.lookupService.getCopayTypes().pipe(
      map(items => items.map(item => ({ value: item.lookup_code, label: item.lookup_value })))
    );
    this.copayAppliesTo$ = this.lookupService.getCopayAppliesTo().pipe(
      map(items => items.map(item => ({ value: item.lookup_code, label: item.lookup_value })))
    );
    this.diagnosisCategories$ = this.lookupService.getDiagnosisCategories().pipe(
      map(items => items.map(item => ({ value: item.lookup_code, label: item.lookup_value })))
    );
    this.alertLevels$ = this.lookupService.getAlertLevels().pipe(
      map(items => items.map(item => ({ value: +item.lookup_code, label: item.lookup_value })))
    );
  }

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
    this.router.navigate([APP_ROUTES.PRODUCTS.LIST]);
  }

  /**
   * Navigate to edit page
   */
  editProduct(): void {
    if (this.product) {
      this.router.navigate([APP_ROUTES.PRODUCTS.EDIT(this.product.product_id)]);
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
    } else if (tabId === 'thresholds' && this.thresholds.length === 0) {
      this.loadThresholds();
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
        is_active: Boolean(limit.is_active)
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
   * Prompt delete limit confirmation
   */
  promptDeleteLimit(limit: ProductLimit): void {
    this.limitToDelete = limit;
    this.showDeleteLimitConfirm = true;
  }

  /**
   * Confirm delete limit
   */
  confirmDeleteLimit(): void {
    if (!this.product || !this.limitToDelete) return;

    this.productService.deleteLimit(this.product.product_id, this.limitToDelete.limit_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Limit deleted successfully');
          this.showDeleteLimitConfirm = false;
          this.limitToDelete = null;
          this.loadLimits();
        },
        error: (error) => {
          this.logger.error('Error deleting limit:', error);
          this.toast.error('Failed to delete limit');
          this.showDeleteLimitConfirm = false;
          this.limitToDelete = null;
        }
      });
  }

  /**
   * Cancel delete limit
   */
  cancelDeleteLimit(): void {
    this.showDeleteLimitConfirm = false;
    this.limitToDelete = null;
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
        is_active: Boolean(copay.is_active)
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
   * Prompt delete copay confirmation
   */
  promptDeleteCopay(copay: ProductCopay): void {
    this.copayToDelete = copay;
    this.showDeleteCopayConfirm = true;
  }

  /**
   * Confirm delete copay
   */
  confirmDeleteCopay(): void {
    if (!this.product || !this.copayToDelete) return;

    this.productService.deleteCopay(this.product.product_id, this.copayToDelete.copay_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Copay deleted successfully');
          this.showDeleteCopayConfirm = false;
          this.copayToDelete = null;
          this.loadCopay();
        },
        error: (error) => {
          this.logger.error('Error deleting copay:', error);
          this.toast.error('Failed to delete copay');
          this.showDeleteCopayConfirm = false;
          this.copayToDelete = null;
        }
      });
  }

  /**
   * Cancel delete copay
   */
  cancelDeleteCopay(): void {
    this.showDeleteCopayConfirm = false;
    this.copayToDelete = null;
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

  // ============================================================================
  // LOS THRESHOLDS MANAGEMENT
  // ============================================================================

  loadThresholds(): void {
    if (!this.product) return;

    this.loadingThresholds = true;
    this.productService.getThresholdsByProductId(this.product.product_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (thresholds) => {
          this.thresholds = thresholds;
          this.loadingThresholds = false;
          this.logger.info('Thresholds loaded successfully');
        },
        error: (error) => {
          this.logger.error('Error loading thresholds:', error);
          this.toast.error('Failed to load LOS thresholds');
          this.loadingThresholds = false;
        }
      });
  }

  showThresholdFormDialog(threshold?: ProductLosThreshold): void {
    if (threshold) {
      this.editingThreshold = threshold;
      this.thresholdFormData = {
        diagnosis_category: threshold.diagnosis_category || '',
        threshold_days: threshold.threshold_days || 1,
        alert_level: threshold.alert_level || 1,
        is_active: Boolean(threshold.is_active)
      };
    } else {
      this.editingThreshold = null;
      this.resetThresholdForm();
    }
    this.showThresholdForm = true;
  }

  saveThreshold(form: any): void {
    if (!this.product || form.invalid) return;

    const productId = this.product.product_id;
    const thresholdData = { ...(this.thresholdFormData as CreateProductLosThresholdDto) };

    if (this.editingThreshold) {
      const updateData: UpdateProductLosThresholdDto = thresholdData;
      this.productService.updateThreshold(productId, this.editingThreshold.threshold_id, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Threshold updated successfully');
            this.showThresholdForm = false;
            this.editingThreshold = null;
            this.resetThresholdForm();
            this.loadThresholds();
          },
          error: (error) => {
            this.logger.error('Error updating threshold:', error);
            this.toast.error('Failed to update threshold');
          }
        });
    } else {
      this.productService.createThreshold(productId, thresholdData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Threshold created successfully');
            this.showThresholdForm = false;
            this.resetThresholdForm();
            this.loadThresholds();
          },
          error: (error) => {
            this.logger.error('Error creating threshold:', error);
            this.toast.error('Failed to create threshold');
          }
        });
    }
  }

  /**
   * Prompt delete threshold confirmation
   */
  promptDeleteThreshold(threshold: ProductLosThreshold): void {
    this.thresholdToDelete = threshold;
    this.showDeleteThresholdConfirm = true;
  }

  /**
   * Confirm delete threshold
   */
  confirmDeleteThreshold(): void {
    if (!this.product || !this.thresholdToDelete) return;

    this.productService.deleteThreshold(this.product.product_id, this.thresholdToDelete.threshold_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Threshold deleted successfully');
          this.showDeleteThresholdConfirm = false;
          this.thresholdToDelete = null;
          this.loadThresholds();
        },
        error: (error) => {
          this.logger.error('Error deleting threshold:', error);
          this.toast.error('Failed to delete threshold');
          this.showDeleteThresholdConfirm = false;
          this.thresholdToDelete = null;
        }
      });
  }

  /**
   * Cancel delete threshold
   */
  cancelDeleteThreshold(): void {
    this.showDeleteThresholdConfirm = false;
    this.thresholdToDelete = null;
  }

  cancelThresholdForm(): void {
    this.showThresholdForm = false;
    this.editingThreshold = null;
    this.resetThresholdForm();
  }

  resetThresholdForm(): void {
    this.thresholdFormData = {
      diagnosis_category: '',
      threshold_days: 1,
      alert_level: 1,
      is_active: true
    };
  }

  // ============================================================================
  // STATUS TOGGLE
  // ============================================================================

  /**
   * Handle status toggle change
   */
  onStatusToggle(newValue: boolean): void {
    // Show confirmation dialog
    this.statusToToggle = { newValue };
    this.showStatusToggleConfirm = true;
  }

  /**
   * Confirm status toggle
   */
  confirmStatusToggle(): void {
    if (!this.product || !this.statusToToggle) return;

    const { newValue } = this.statusToToggle;
    const productId = this.product.product_id;
    
    this.logger.debug(`Toggling product ${productId} status to: ${newValue}`);
    
    // Use activate/deactivate methods based on new value
    const apiCall = newValue 
      ? this.productService.activateProduct(productId)
      : this.productService.deactivateProduct(productId);
    
    apiCall
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.product) {
            this.product.is_active = newValue;
          }
          this.toast.success(`Product ${newValue ? 'activated' : 'deactivated'} successfully`);
          this.showStatusToggleConfirm = false;
          this.statusToToggle = null;
        },
        error: (error) => {
          this.logger.error('Error updating product status:', error);
          this.toast.error('Failed to update product status');
          this.showStatusToggleConfirm = false;
          this.statusToToggle = null;
          // Reload product to revert the optimistic update
          if (this.product) {
            this.loadProduct(String(this.product.product_id));
          }
        }
      });
  }

  /**
   * Cancel status toggle
   */
  cancelStatusToggle(): void {
    this.showStatusToggleConfirm = false;
    this.statusToToggle = null;
  }

  // ============================================================================
  // LIMIT STATUS TOGGLE
  // ============================================================================

  /**
   * Handle limit status toggle
   */
  onLimitStatusToggle(limit: ProductLimit, newValue: boolean): void {
    this.limitStatusToToggle = { limit, newValue };
    this.showLimitStatusToggleConfirm = true;
  }

  /**
   * Confirm limit status toggle
   */
  confirmLimitStatusToggle(): void {
    if (!this.product || !this.limitStatusToToggle) return;

    const { limit, newValue } = this.limitStatusToToggle;
    const updateData: UpdateProductLimitDto = {
      limit_type: limit.limit_type ?? undefined,
      limit_amount: limit.limit_amount ?? undefined,
      is_active: newValue
    };

    this.productService.updateLimit(this.product.product_id, limit.limit_id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          limit.is_active = newValue;
          this.toast.success(`Limit ${newValue ? 'activated' : 'deactivated'} successfully`);
          this.showLimitStatusToggleConfirm = false;
          this.limitStatusToToggle = null;
        },
        error: (error) => {
          this.logger.error('Error updating limit status:', error);
          this.toast.error('Failed to update limit status');
          this.showLimitStatusToggleConfirm = false;
          this.limitStatusToToggle = null;
          this.loadLimits();
        }
      });
  }

  /**
   * Cancel limit status toggle
   */
  cancelLimitStatusToggle(): void {
    this.showLimitStatusToggleConfirm = false;
    this.limitStatusToToggle = null;
  }

  // ============================================================================
  // COPAY STATUS TOGGLE
  // ============================================================================

  /**
   * Handle copay status toggle
   */
  onCopayStatusToggle(copay: ProductCopay, newValue: boolean): void {
    this.copayStatusToToggle = { copay, newValue };
    this.showCopayStatusToggleConfirm = true;
  }

  /**
   * Confirm copay status toggle
   */
  confirmCopayStatusToggle(): void {
    if (!this.product || !this.copayStatusToToggle) return;

    const { copay, newValue } = this.copayStatusToToggle;
    const updateData: UpdateProductCopayDto = {
      copay_type: copay.copay_type ?? undefined,
      copay_value: copay.copay_value ?? undefined,
      applies_to: copay.applies_to ?? undefined,
      is_active: newValue
    };

    this.productService.updateCopay(this.product.product_id, copay.copay_id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          copay.is_active = newValue;
          this.toast.success(`Copay ${newValue ? 'activated' : 'deactivated'} successfully`);
          this.showCopayStatusToggleConfirm = false;
          this.copayStatusToToggle = null;
        },
        error: (error) => {
          this.logger.error('Error updating copay status:', error);
          this.toast.error('Failed to update copay status');
          this.showCopayStatusToggleConfirm = false;
          this.copayStatusToToggle = null;
          this.loadCopay();
        }
      });
  }

  /**
   * Cancel copay status toggle
   */
  cancelCopayStatusToggle(): void {
    this.showCopayStatusToggleConfirm = false;
    this.copayStatusToToggle = null;
  }

  // ============================================================================
  // THRESHOLD STATUS TOGGLE
  // ============================================================================

  /**
   * Handle threshold status toggle
   */
  onThresholdStatusToggle(threshold: ProductLosThreshold, newValue: boolean): void {
    this.thresholdStatusToToggle = { threshold, newValue };
    this.showThresholdStatusToggleConfirm = true;
  }

  /**
   * Confirm threshold status toggle
   */
  confirmThresholdStatusToggle(): void {
    if (!this.product || !this.thresholdStatusToToggle) return;

    const { threshold, newValue } = this.thresholdStatusToToggle;
    const updateData: UpdateProductLosThresholdDto = {
      diagnosis_category: threshold.diagnosis_category ?? undefined,
      threshold_days: threshold.threshold_days ?? undefined,
      alert_level: threshold.alert_level ?? undefined,
      is_active: newValue
    };

    this.productService.updateThreshold(this.product.product_id, threshold.threshold_id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          threshold.is_active = newValue;
          this.toast.success(`Threshold ${newValue ? 'activated' : 'deactivated'} successfully`);
          this.showThresholdStatusToggleConfirm = false;
          this.thresholdStatusToToggle = null;
        },
        error: (error) => {
          this.logger.error('Error updating threshold status:', error);
          this.toast.error('Failed to update threshold status');
          this.showThresholdStatusToggleConfirm = false;
          this.thresholdStatusToToggle = null;
          this.loadThresholds();
        }
      });
  }

  /**
   * Cancel threshold status toggle
   */
  cancelThresholdStatusToggle(): void {
    this.showThresholdStatusToggleConfirm = false;
    this.thresholdStatusToToggle = null;
  }

  /**
   * Check if copay type is percentage
   */
  isCopayTypePercentage(): boolean {
    return this.copayFormData.copay_type === 'PERCENTAGE';
  }

  /**
   * Get copay value label based on type
   */
  getCopayValueLabel(): string {
    return this.isCopayTypePercentage() ? 'Copay Value (%)' : 'Copay Value';
  }

  /**
   * Get copay value placeholder based on type
   */
  getCopayValuePlaceholder(): string {
    return this.isCopayTypePercentage() ? '0' : '0.00';
  }

  /**
   * Format copay value for display based on copay type
   */
  formatCopayValue(copay: ProductCopay): string {
    if (copay.copay_value === null || copay.copay_value === undefined) return '-';
    
    // Check if copay type is percentage
    if (copay.copay_type === 'PERCENTAGE') {
      return copay.copay_value.toFixed(2) + '%';
    } else {
      // Fixed amount - show as currency
      const formatted = new Intl.NumberFormat('en-MY', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).format(copay.copay_value);
      return 'RM ' + formatted;
    }
  }
}
