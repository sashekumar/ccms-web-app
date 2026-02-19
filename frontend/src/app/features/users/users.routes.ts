import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { authGuard } from '../../core/guards/auth.guard.functional';

/**
 * Users management routes
 */
export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./user-list/user-list.component').then(m => m.UserListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['USER_MANAGEMENT', 'VIEW'] },
    title: 'Users - CCMS'
  },
  {
    path: 'create',
    loadComponent: () => import('./user-form/user-form.component').then(m => m.UserFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['USER_MANAGEMENT', 'CREATE'] },
    title: 'Create User - CCMS'
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./user-form/user-form.component').then(m => m.UserFormComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['USER_MANAGEMENT', 'UPDATE'] },
    title: 'Edit User - CCMS'
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./user-view/user-view.component').then(m => m.UserViewComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['USER_MANAGEMENT', 'VIEW'] },
    title: 'View User - CCMS'
  },
  {
    path: 'roles/:id',
    loadComponent: () => import('./user-roles/user-roles.component').then(m => m.UserRolesComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['USER_ROLE_ASSIGNMENT', 'ATTACH_ROLE'] },
    title: 'Manage User Roles - CCMS'
  }
];
