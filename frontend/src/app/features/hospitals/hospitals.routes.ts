import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { authGuard } from '../../core/guards/auth.guard.functional';

/**
 * Hospitals management routes
 */
export const hospitalsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./hospital-list/hospital-list.component').then(m => m.HospitalListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['HOSPITAL_MGMT', 'VIEW'] },
    title: 'Hospitals - CCMS'
  },
  {
    path: 'create',
    loadComponent: () => import('./hospital-form/hospital-form.component').then(m => m.HospitalFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['HOSPITAL_MGMT', 'CREATE'] },
    title: 'Create Hospital - CCMS'
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./hospital-form/hospital-form.component').then(m => m.HospitalFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['HOSPITAL_MGMT', 'UPDATE'] },
    title: 'Edit Hospital - CCMS'
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./hospital-view/hospital-view.component').then(m => m.HospitalViewComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['HOSPITAL_MGMT', 'VIEW'] },
    title: 'View Hospital - CCMS'
  }
];
