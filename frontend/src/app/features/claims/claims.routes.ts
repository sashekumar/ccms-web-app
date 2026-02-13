import { Routes } from '@angular/router';

/**
 * Claims feature routes
 * TODO: Create actual components for these routes
 */
export const claimsRoutes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
  // TODO: Uncomment when components are created
  // {
  //   path: 'list',
  //   loadComponent: () => import('./claims-list/claims-list.component').then(m => m.ClaimsListComponent),
  //   title: 'Claims - CCMS'
  // },
  // {
  //   path: 'create',
  //   loadComponent: () => import('./claims-create/claims-create.component').then(m => m.ClaimsCreateComponent),
  //   title: 'New Claim - CCMS'
  // }
];
