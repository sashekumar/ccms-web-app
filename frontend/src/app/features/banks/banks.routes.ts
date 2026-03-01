import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { authGuard } from '../../core/guards/auth.guard.functional';

/**
 * Banks management routes
 */
export const banksRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./bank-list/bank-list.component').then(m => m.BankListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['BANK_MGMT', 'VIEW'] },
    title: 'Banks - CCMS'
  }
];
