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
import { APP_ROUTES } from '../../../core/constants/routes.constants';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { DataTableComponent, DataTableColumn, DataTableFilter, DataTablePagination, DataTableAction } from '../../../shared/components/ui/data-table/data-table.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';

interface ProductStats {
  total: number;
  active: number;
  inactive: number;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, DataTableComponent, ButtonComponent, ConfirmDialogComponent],
  templateUrl: './product-list.component.html',
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

  pagination: DataTablePagination = {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  };

  // Data table configuration
  columns: DataTableColumn[] = [
    {
      key: 'plan_code',
      label: 'Plan Code',
      type: 'avatar',
      sortable: true,
      avatarSubKey: 'legacy_product_id',
      avatarSubPrefix: 'Legacy: '
    },
    {
      key: 'plan_name',
      label: 'Plan Name',
      type: 'text',
      sortable: true
    },
    {
      key: 'insurer_name',
      label: 'Insurer',
      type: 'text',
      sortable: true
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'toggle',
      sortable: true,
      toggleActiveLabel: 'Active',
      toggleInactiveLabel: 'Inactive'
    }
  ];

  tableFilters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Plan code or name...',
      inputType: 'string'
    },
    {
      key: 'insurer_name',
      label: 'Insurer',
      type: 'search',
      placeholder: 'Filter by insurer...',
      inputType: 'string'
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      placeholder: 'All',
      options: [
        { value: '', label: 'All' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    }
  ];

  rowActions: DataTableAction[] = [
    {
      id: 'view',
      title: 'View Product',
      iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      color: 'blue',
      permission: PERMISSIONS.POLICY_MANAGEMENT.VIEW
    },
    {
      id: 'edit',
      title: 'Edit Product',
      iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'indigo',
      permission: PERMISSIONS.POLICY_MANAGEMENT.UPDATE
    },
    {
      id: 'delete',
      title: 'Delete Product',
      iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'red',
      permission: PERMISSIONS.POLICY_MANAGEMENT.DELETE
    }
  ];

  // Confirmation dialog state
  showDeleteConfirm = false;
  productToDelete: ProductListItem | null = null;

  // Status toggle confirmation
  showStatusToggleConfirm = false;
  productToToggle: { product: ProductListItem; newValue: boolean } | null = null;

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

          // Use stats from API response (not affected by filters)
          if (result.stats) {
            this.stats = {
              total: result.stats.total,
              active: result.stats.active,
              inactive: result.stats.inactive
            };
          }

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
   * Handle table filter change
   */
  onTableFilterChange(filterValues: Record<string, any>): void {
    const newPage = filterValues['page'] || 1;
    
    // Convert string boolean values to actual booleans for is_active filter
    const processedFilters = { ...filterValues };
    if (processedFilters['is_active'] === 'true') {
      processedFilters['is_active'] = true;
    } else if (processedFilters['is_active'] === 'false') {
      processedFilters['is_active'] = false;
    } else if (processedFilters['is_active'] === '' || processedFilters['is_active'] === null) {
      // Set to undefined so we can properly clear it
      processedFilters['is_active'] = undefined;
    }
    
    this.filters = {
      ...this.filters,
      ...processedFilters,
      page: newPage
    };
    
    // Remove undefined filters to properly clear them from the state
    if (this.filters.is_active === undefined) {
      delete this.filters.is_active;
    }
    if (this.filters.search === undefined || this.filters.search === '') {
      delete this.filters.search;
    }
    if (this.filters.insurer_name === undefined || this.filters.insurer_name === '') {
      delete this.filters.insurer_name;
    }
    
    this.loadProducts();
  }

  /**
   * Handle table row action
   */
  onRowAction(event: { action: string; row: any }): void {
    const product = event.row as ProductListItem;

    switch (event.action) {
      case 'view':
        this.viewProduct(product.product_id);
        break;
      case 'edit':
        this.editProduct(product.product_id);
        break;
      case 'delete':
        this.productToDelete = product;
        this.showDeleteConfirm = true;
        break;
    }
  }

  /**
   * Handle status toggle
   */
  onToggleActiveStatus(event: { row: any; column: any; newValue: boolean }): void {
    const product = event.row as ProductListItem;
    const newStatus = event.newValue;
    
    // Show confirmation dialog
    this.productToToggle = { product, newValue: newStatus };
    this.showStatusToggleConfirm = true;
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
    this.router.navigate([APP_ROUTES.PRODUCTS.CREATE]);
  }

  /**
   * Navigate to view product page
   */
  viewProduct(product_id: string): void {
    this.router.navigate([APP_ROUTES.PRODUCTS.DETAIL(product_id)]);
  }

  /**
   * Navigate to edit product page
   */
  editProduct(product_id: string): void {
    this.router.navigate([APP_ROUTES.PRODUCTS.EDIT(product_id)]);
  }

  /**
   * Confirm delete product
   */
  confirmDelete(): void {
    if (!this.productToDelete) return;

    this.loading = true;
    this.productService.deleteProduct(this.productToDelete.product_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Product deleted successfully');
          this.loadProducts();
          this.showDeleteConfirm = false;
          this.productToDelete = null;
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error deleting product:', error);
          this.toast.error('Failed to delete product');
          this.showDeleteConfirm = false;
          this.productToDelete = null;
        }
      });
  }

  /**
   * Cancel delete
   */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.productToDelete = null;
  }

  /**
   * Perform status toggle after confirmation
   */
  performStatusToggle(): void {
    if (!this.productToToggle) return;
    
    const { product, newValue } = this.productToToggle;
    this.showStatusToggleConfirm = false;
    
    this.logger.debug(`Toggling product ${product.product_id} status to: ${newValue}`);
    
    // Use activate/deactivate methods based on new value
    const apiCall = newValue 
      ? this.productService.activateProduct(product.product_id)
      : this.productService.deactivateProduct(product.product_id);
    
    apiCall
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          product.is_active = newValue;
          this.toast.success(`Product "${product.plan_code}" ${newValue ? 'activated' : 'deactivated'} successfully`);
          this.productToToggle = null;
          // Reload to update stats
          this.loadProducts();
        },
        error: (error) => {
          this.logger.error('Error updating product status:', error);
          this.toast.error('Failed to update product status');
          this.productToToggle = null;
          // Reload to revert the optimistic update
          this.loadProducts();
        }
      });
  }

  /**
   * Cancel status toggle
   */
  cancelStatusToggle(): void {
    this.showStatusToggleConfirm = false;
    this.productToToggle = null;
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
