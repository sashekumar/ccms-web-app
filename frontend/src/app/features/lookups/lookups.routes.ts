import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { authGuard } from '../../core/guards/auth.guard.functional';

/**
 * Lookups management routes
 * Categories are now managed inline during lookup creation
 */
export const lookupsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'values',
    pathMatch: 'full'
  },
  // Category management now handled inline during lookup creation
  // {
  //   path: 'categories',
  //   loadComponent: () => import('./lookup-category-list/lookup-category-list.component').then(m => m.LookupCategoryListComponent),
  //   canActivate: [authGuard, permissionGuard],
  //   data: { permission: ['LOOKUP_MGMT', 'VIEW'] },
  //   title: 'Lookup Categories - CCMS'
  // },
  {
    path: 'values',
    loadComponent: () => import('./lookup-list/lookup-list.component').then(m => m.LookupListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['LOOKUP_MGMT', 'VIEW'] },
    title: 'Lookup Values - CCMS'
  },
  {
    path: 'metadata',
    loadComponent: () => import('./lookup-metadata-list/lookup-metadata-list.component').then(m => m.LookupMetadataListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['LOOKUP_MGMT', 'MANAGE_METADATA'] },
    title: 'Lookup Metadata - CCMS'
  }
];
