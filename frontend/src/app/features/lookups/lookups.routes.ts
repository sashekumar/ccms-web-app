import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { authGuard } from '../../core/guards/auth.guard.functional';

/**
 * Lookups management routes
 * Categories and metadata are now managed inline during lookup management
 */
export const lookupsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'values',
    pathMatch: 'full'
  },
  {
    path: 'values',
    loadComponent: () => import('./lookup-list/lookup-list.component').then(m => m.LookupListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['LOOKUP_MGMT', 'VIEW'] },
    title: 'Lookup Values - CCMS'
  }
];
