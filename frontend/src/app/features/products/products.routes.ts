import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { authGuard } from '../../core/guards/auth.guard.functional';

/**
 * Products (Policy Management) routes
 */
export const productsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./product-list/product-list.component').then(m => m.ProductListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['POLICY_MANAGEMENT', 'VIEW'] },
    title: 'Products - CCMS'
  },
  {
    path: 'create',
    loadComponent: () => import('./product-form/product-form.component').then(m => m.ProductFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['POLICY_MANAGEMENT', 'CREATE'] },
    title: 'Create Product - CCMS'
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./product-form/product-form.component').then(m => m.ProductFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['POLICY_MANAGEMENT', 'UPDATE'] },
    title: 'Edit Product - CCMS'
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./product-view/product-view.component').then(m => m.ProductViewComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['POLICY_MANAGEMENT', 'VIEW'] },
    title: 'View Product - CCMS'
  }
];
