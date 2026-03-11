import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { CreateProductDto, UpdateProductDto, Product } from '../../../shared/models/product.model';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ isEditMode ? 'Edit Product' : 'Create Product' }}</h1>
          <p class="mt-1 text-sm text-gray-600">{{ isEditMode ? 'Update product information' : 'Add a new insurance product to the system' }}</p>
        </div>
        <button
          (click)="goBack()"
          class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to List
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="rounded-lg bg-white p-12 text-center shadow">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p class="mt-4 text-gray-600">{{ isEditMode ? 'Loading product...' : 'Saving...' }}</p>
      </div>

      <!-- Form -->
      <div *ngIf="!loading" class="rounded-lg bg-white p-6 shadow">
        <form (ngSubmit)="save()" #productForm="ngForm">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <!-- Plan Code -->
            <div>
              <label class="block text-sm font-medium text-gray-700">
                Plan Code <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="plan_code"
                [(ngModel)]="formData.plan_code"
                (ngModelChange)="onPlanCodeChange($event)"
                required
                maxlength="50"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                [class.border-red-500]="planCodeInvalid"
                placeholder="e.g., PLAN001"
                #planCodeInput="ngModel"
                [disabled]="isEditMode"
              />
              <p *ngIf="planCodeInput.invalid && planCodeInput.touched" class="mt-1 text-sm text-red-600">
                Plan code is required (max 50 characters)
              </p>
              <p *ngIf="planCodeInvalid && !planCodeInput.invalid" class="mt-1 text-sm text-red-600">
                This plan code is already in use
              </p>
              <p *ngIf="isEditMode" class="mt-1 text-xs text-gray-500">
                Plan code cannot be changed after creation
              </p>
            </div>

            <!-- Plan Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Plan Name</label>
              <input
                type="text"
                name="plan_name"
                [(ngModel)]="formData.plan_name"
                maxlength="255"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                placeholder="Descriptive plan name"
              />
            </div>

            <!-- Insurer Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Insurer Name</label>
              <input
                type="text"
                name="insurer_name"
                [(ngModel)]="formData.insurer_name"
                maxlength="255"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                placeholder="Insurance company name"
              />
            </div>

            <!-- Is Active -->
            <div class="md:col-span-2 flex items-center">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                [(ngModel)]="formData.is_active"
                class="h-4 w-4 rounded border-gray-300 text-[#1e3c72] focus:ring-[#1e3c72]"
              />
              <label for="is_active" class="ml-2 block text-sm text-gray-700">
                Active (product is available for use)
              </label>
            </div>
          </div>

          <!-- Help Text -->
          <div class="mt-6 rounded-lg bg-blue-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-blue-800">Note</h3>
                <div class="mt-2 text-sm text-blue-700">
                  <p>After creating the product, you can configure limits and copay settings from the product view page.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              (click)="goBack()"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              [disabled]="saving"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              [disabled]="productForm.invalid || saving || planCodeInvalid || checkingPlanCode"
            >
              <span *ngIf="!saving">{{ isEditMode ? 'Update Product' : 'Create Product' }}</span>
              <span *ngIf="saving">Saving...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
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
    this.router.navigate(['/products']);
  }
}
