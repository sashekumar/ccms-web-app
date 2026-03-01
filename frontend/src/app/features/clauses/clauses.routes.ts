import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { authGuard } from '../../core/guards/auth.guard.functional';

/**
 * Clauses management routes
 */
export const clausesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./clause-list/clause-list.component').then(m => m.ClauseListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['CLAUSE_MGMT', 'VIEW'] },
    title: 'Clauses - CCMS'
  }
];
