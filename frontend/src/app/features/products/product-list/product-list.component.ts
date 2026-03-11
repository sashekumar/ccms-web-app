import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import {
  ProductListItem,
  ProductFilters
} from '../../../shared/models/product.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';

interface ProductStats {
  total: number;
  active: number;
  inactive: number;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoadingSpinnerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Policy Management</h1>
          <p class="mt-1 text-sm text-gray-600">Manage insurance products and policies</p>
        </div>
        <button
          *hasPermission="PERMISSIONS.CREATE"
          (click)="createProduct()"
          class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-white transition hover:opacity-90"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Product
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <!-- Total Products -->
        <div class="rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Products</p>
              <p class="mt-2 text-3xl font-bold text-gray-900">{{ stats.total }}</p>
            </div>
            <div class="rounded-full bg-gradient-to-br from-[#1e3c72] to-[#2a5298] p-3">
              <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Active Products -->
        <div class="rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Active Products</p>
              <p class="mt-2 text-3xl font-bold text-green-600">{{ stats.active }}</p>
            </div>
            <div class="rounded-full bg-gradient-to-br from-green-500 to-green-600 p-3">
              <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Inactive Products -->
        <div class="rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Inactive Products</p>
              <p class="mt-2 text-3xl font-bold text-gray-600">{{ stats.inactive }}</p>
            </div>
            <div class="rounded-full bg-gradient-to-br from-gray-500 to-gray-600 p-3">
              <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="mb-6 rounded-lg bg-white p-4 shadow">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <!-- Search -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              [(ngModel)]="filters.search"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Plan code or name"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            />
          </div>

          <!-- Insurer Filter -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Insurer</label>
            <input
              type="text"
              [(ngModel)]="filters.insurer_name"
              (ngModelChange)="onFilterChange()"
              placeholder="Filter by insurer"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            />
          </div>

          <!-- Active Status Filter -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              [(ngModel)]="filters.is_active"
              (ngModelChange)="onFilterChange()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="undefined">All</option>
              <option [ngValue]="true">Active</option>
              <option [ngValue]="false">Inactive</option>
            </select>
          </div>

          <!-- Items per page -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Items per page</label>
            <select
              [(ngModel)]="filters.limit"
              (ngModelChange)="onFilterChange()"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
            >
              <option [ngValue]="10">10</option>
              <option [ngValue]="25">25</option>
              <option [ngValue]="50">50</option>
              <option [ngValue]="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-spinner *ngIf="loading" message="Loading products..."></app-loading-spinner>

      <!-- Products Table -->
      <div *ngIf="!loading" class="overflow-hidden rounded-lg bg-white shadow">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Plan Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Plan Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Insurer</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr *ngFor="let product of products" class="transition hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-[#1e3c72] to-[#2a5298] flex items-center justify-center">
                      <span class="text-white font-semibold text-sm">{{ getInitials(product.plan_code) }}</span>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ product.plan_code }}</div>
                      <div *ngIf="product.legacy_product_id" class="text-xs text-gray-500">Legacy: {{ product.legacy_product_id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ product.plan_name || '-' }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ product.insurer_name || '-' }}</div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span *ngIf="product.is_active" class="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    Active
                  </span>
                  <span *ngIf="!product.is_active" class="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                    Inactive
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    *hasPermission="PERMISSIONS.VIEW"
                    (click)="viewProduct(product.product_id)"
                    class="mr-3 text-blue-600 hover:text-blue-900"
                    title="View"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </button>
                  <button
                    *hasPermission="PERMISSIONS.UPDATE"
                    (click)="editProduct(product.product_id)"
                    class="mr-3 text-indigo-600 hover:text-indigo-900"
                    title="Edit"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <ng-container *ngIf="!product.is_active">
                    <button
                      *hasPermission="PERMISSIONS.ACTIVATE"
                      (click)="activateProduct(product)"
                      class="mr-3 text-green-600 hover:text-green-900"
                      title="Activate"
                    >
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </button>
                  </ng-container>
                  <ng-container *ngIf="product.is_active">
                    <button
                      *hasPermission="PERMISSIONS.DEACTIVATE"
                      (click)="deactivateProduct(product)"
                      class="mr-3 text-orange-600 hover:text-orange-900"
                      title="Deactivate"
                    >
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </button>
                  </ng-container>
                  <button
                    *hasPermission="PERMISSIONS.DELETE"
                    (click)="deleteProduct(product)"
                    class="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div *ngIf="products.length === 0" class="py-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ filters.search ? 'Try adjusting your search criteria.' : 'Get started by creating a new product.' }}
          </p>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div class="flex flex-1 justify-between sm:hidden">
            <button
              (click)="previousPage()"
              [disabled]="pagination.page === 1"
              [class.opacity-50]="pagination.page === 1"
              [class.cursor-not-allowed]="pagination.page === 1"
              class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              (click)="nextPage()"
              [disabled]="pagination.page >= pagination.totalPages"
              [class.opacity-50]="pagination.page >= pagination.totalPages"
              [class.cursor-not-allowed]="pagination.page >= pagination.totalPages"
              class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{{ getStartIndex() }}</span>
                to
                <span class="font-medium">{{ getEndIndex() }}</span>
                of
                <span class="font-medium">{{ pagination.total }}</span>
                results
              </p>
            </div>
            <div>
              <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  (click)="previousPage()"
                  [disabled]="pagination.page === 1"
                  [class.opacity-50]="pagination.page === 1"
                  [class.cursor-not-allowed]="pagination.page === 1"
                  class="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                
                <button
                  *ngFor="let page of getPageNumbers()"
                  (click)="goToPage(page)"
                  [class.bg-[#1e3c72]]="page === pagination.page"
                  [class.text-white]="page === pagination.page"
                  [class.border-[#1e3c72]]="page === pagination.page"
                  [class.text-gray-500]="page !== pagination.page"
                  [class.border-gray-300]="page !== pagination.page"
                  [class.hover:bg-gray-50]="page !== pagination.page"
                  class="relative inline-flex items-center border px-4 py-2 text-sm font-medium"
                >
                  {{ page }}
                </button>
                
                <button
                  (click)="nextPage()"
                  [disabled]="pagination.page >= pagination.totalPages"
                  [class.opacity-50]="pagination.page >= pagination.totalPages"
                  [class.cursor-not-allowed]="pagination.page >= pagination.totalPages"
                  class="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span class="sr-only">Next</span>
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ProductListComponent implements OnInit, OnDestroy {
  // Permission constants (exposed to template)
  readonly PERMISSIONS = PERMISSIONS.POLICY_MANAGEMENT;

  products: ProductListItem[] = [];
  loading = false;
  stats: ProductStats = {
    total: 0,
    active: 0,
    inactive: 0
  };

  filters: ProductFilters = {
    search: '',
    page: 1,
    limit: 25,
    sort_by: 'plan_code',
    sort_order: 'ASC'
  };

  pagination = {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  };

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private productService: ProductService,
    private router: Router,
    private logger: LoggerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    // Setup search debounce
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.filters.search = searchTerm;
        this.filters.page = 1;
        this.loadProducts();
      });

    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load products with current filters
   */
  loadProducts(): void {
    this.loading = true;
    this.logger.info('Loading products with filters:', this.filters);

    this.productService.getProducts(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.products = result.products;
          this.pagination = {
            page: result.page,
            limit: result.limit || this.filters.limit || 25,
            total: result.total,
            totalPages: result.totalPages
          };

          // Calculate stats from response or products
          this.stats = {
            total: result.total,
            active: this.products.filter(p => p.is_active).length,
            inactive: this.products.filter(p => !p.is_active).length
          };

          this.loading = false;
          this.logger.info('Products loaded successfully');
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error loading products:', error);
          this.toast.error('Failed to load products');
        }
      });
  }

  /**
   * Handle search input change
   */
  onSearchChange(searchTerm: string): void {
    this.searchSubject$.next(searchTerm);
  }

  /**
   * Handle filter change
   */
  onFilterChange(): void {
    this.filters.page = 1;
    this.loadProducts();
  }

  /**
   * Navigate to create product page
   */
  createProduct(): void {
    this.router.navigate(['/products/create']);
  }

  /**
   * Navigate to view product page
   */
  viewProduct(product_id: string): void {
    this.router.navigate(['/products/view', product_id]);
  }

  /**
   * Navigate to edit product page
   */
  editProduct(product_id: string): void {
    this.router.navigate(['/products/edit', product_id]);
  }

  /**
   * Activate product
   */
  activateProduct(product: ProductListItem): void {
    if (!confirm(`Are you sure you want to activate ${product.plan_code}?`)) {
      return;
    }

    this.loading = true;
    this.productService.activateProduct(product.product_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Product activated successfully');
          this.loadProducts();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error activating product:', error);
          this.toast.error('Failed to activate product');
        }
      });
  }

  /**
   * Deactivate product
   */
  deactivateProduct(product: ProductListItem): void {
    if (!confirm(`Are you sure you want to deactivate ${product.plan_code}?`)) {
      return;
    }

    this.loading = true;
    this.productService.deactivateProduct(product.product_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Product deactivated successfully');
          this.loadProducts();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error deactivating product:', error);
          this.toast.error('Failed to deactivate product');
        }
      });
  }

  /**
   * Delete product
   */
  deleteProduct(product: ProductListItem): void {
    if (!confirm(`Are you sure you want to delete ${product.plan_code}?`)) {
      return;
    }

    this.loading = true;
    this.productService.deleteProduct(product.product_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Product deleted successfully');
          this.loadProducts();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error deleting product:', error);
          this.toast.error('Failed to delete product');
        }
      });
  }

  /**
   * Get initials for avatar
   */
  getInitials(code: string): string {
    return code
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Pagination methods
   */
  previousPage(): void {
    if (this.pagination.page > 1) {
      this.filters.page = this.pagination.page - 1;
      this.loadProducts();
    }
  }

  nextPage(): void {
    if (this.pagination.page < this.pagination.totalPages) {
      this.filters.page = this.pagination.page + 1;
      this.loadProducts();
    }
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadProducts();
  }

  getPageNumbers(): number[] {
    const maxPages = 5;
    const pages: number[] = [];
    let startPage = Math.max(1, this.pagination.page - Math.floor(maxPages / 2));
    let endPage = Math.min(this.pagination.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getStartIndex(): number {
    return (this.pagination.page - 1) * this.pagination.limit + 1;
  }

  getEndIndex(): number {
    return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total);
  }
}
