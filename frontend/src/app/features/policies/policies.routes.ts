import { Routes } from '@angular/router';

/**
 * Policies feature routes
 * TODO: Create actual components for these routes
 */
export const policiesRoutes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
  // TODO: Uncomment when components are created
  // {
  //   path: 'list',
  //   loadComponent: () => import('./policies-list/policies-list.component').then(m => m.PoliciesListComponent),
  //   title: 'Policies - CCMS'
  // }
];
