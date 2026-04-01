import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { CreateProductDto, UpdateProductDto, Product } from '../../../shared/models/product.model';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { APP_ROUTES } from '../../../core/constants/routes.constants';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { TextInputComponent } from '../../../shared/components/ui/text-input/text-input.component';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, TextInputComponent, CheckboxComponent],
  templateUrl: './product-form.component.html',
  styles: []
})
export class ProductFormComponent implements OnInit, OnDestroy {
  isEditMode = false;
  productId: string | null = null;
  loading = false;
  saving = false;

  // Plan code validation
  planCodeInvalid = false;
  checkingPlanCode = false;
  private planCodeCheckSubject$ = new Subject<string>();

  formData: CreateProductDto = {
    plan_code: '',
    plan_name: '',
    insurer_name: '',
    is_active: true
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    // Get product ID from route if editing
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.productId = id;
      this.loadProduct(id);
    }

    // Setup plan code validation (debounced)
    this.planCodeCheckSubject$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(code => {
        this.checkPlanCode(code);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load product data for editing
   */
  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProductById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product: Product) => {
          this.formData = {
            plan_code: product.plan_code,
            plan_name: product.plan_name || '',
            insurer_name: product.insurer_name || '',
            is_active: product.is_active
          };
          this.loading = false;
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
   * Handle plan code change (for uniqueness validation)
   */
  onPlanCodeChange(code: string): void {
    if (!code || code.trim() === '' || this.isEditMode) {
      this.planCodeInvalid = false;
      return;
    }
    this.planCodeCheckSubject$.next(code);
  }

  /**
   * Check if plan code already exists
   */
  checkPlanCode(code: string): void {
    if (!code || code.trim() === '') return;

    this.checkingPlanCode = true;
    this.productService.checkPlanCode(code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.planCodeInvalid = result.exists;
          this.checkingPlanCode = false;
        },
        error: (error) => {
          this.logger.error('Error checking plan code:', error);
          this.checkingPlanCode = false;
        }
      });
  }

  /**
   * Save product (create or update)
   */
  save(): void {
    if (this.saving || this.planCodeInvalid) return;

    this.saving = true;

    if (this.isEditMode && this.productId) {
      // Update existing product
      const updateData: UpdateProductDto = {
        plan_name: this.formData.plan_name,
        insurer_name: this.formData.insurer_name,
        is_active: this.formData.is_active
      };

      this.productService.updateProduct(this.productId, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Product updated successfully');
            this.saving = false;
            this.goBack();
          },
          error: (error: any) => {
            this.logger.error('Error updating product:', error);
            this.toast.error('Failed to update product');
            this.saving = false;
          }
        });
    } else {
      // Create new product
      this.productService.createProduct(this.formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Product created successfully');
            this.saving = false;
            this.goBack();
          },
          error: (error: any) => {
            this.logger.error('Error creating product:', error);
            this.toast.error('Failed to create product');
            this.saving = false;
          }
        });
    }
  }

  /**
   * Navigate back to product list
   */
  goBack(): void {
    this.router.navigate([APP_ROUTES.PRODUCTS.LIST]);
  }
}
