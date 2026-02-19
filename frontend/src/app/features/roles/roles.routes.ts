import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard.functional';
import { permissionGuard } from '../../core/guards/permission.guard';

export const rolesRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['ROLE_MANAGEMENT', 'VIEW'] },
    loadComponent: () => import('./role-list/role-list.component').then(m => m.RoleListComponent)
  },
  {
    path: 'create',
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['ROLE_MANAGEMENT', 'CREATE'] },
    loadComponent: () => import('./role-form/role-form.component').then(m => m.RoleFormComponent)
  },
  {
    path: 'edit/:id',
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['ROLE_MANAGEMENT', 'UPDATE'] },
    loadComponent: () => import('./role-form/role-form.component').then(m => m.RoleFormComponent)
  },
  {
    path: 'permissions/:id',
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['ROLE_PERMISSION_MANAGEMENT', 'VIEW'] },
    loadComponent: () => import('./role-permissions/role-permissions.component').then(m => m.RolePermissionsComponent)
  }
];
