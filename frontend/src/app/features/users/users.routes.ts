import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard.functional';

/**
 * Users management routes
 * TODO: Create actual components for these routes
 */
export const usersRoutes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
  // TODO: Uncomment when components are created
  // {
  //   path: 'list',
  //   loadComponent: () => import('./users-list/users-list.component').then(m => m.UsersListComponent),
  //   canActivate: [roleGuard],
  //   data: { roles: ['admin', 'manager'] },
  //   title: 'Users - CCMS'
  // }
];
