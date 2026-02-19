import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard.functional';
import { permissionGuard } from './core/guards/permission.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent),
    title: 'Access Denied - CCMS'
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard - CCMS'
      },
      {
        path: 'admin/users',
        loadChildren: () => import('./features/users/users.routes').then(m => m.usersRoutes)
      },
      {
        path: 'admin/roles',
        loadChildren: () => import('./features/roles/roles.routes').then(m => m.rolesRoutes)
      },
      {
        path: 'admin/categories',
        loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent),
        canActivate: [authGuard, permissionGuard],
        data: { permission: ['CATEGORY_MANAGEMENT', 'VIEW'] },
        title: 'Categories - CCMS'
      },
      {
        path: 'admin/modules',
        loadComponent: () => import('./features/modules/modules.component').then(m => m.ModulesComponent),
        canActivate: [authGuard, permissionGuard],
        data: { permission: ['MODULE_MANAGEMENT', 'VIEW'] },
        title: 'Modules - CCMS'
      },
      {
        path: 'admin/actions',
        loadComponent: () => import('./features/actions/actions.component').then(m => m.ActionsComponent),
        canActivate: [authGuard, permissionGuard],
        data: { permission: ['ACTION_MANAGEMENT', 'VIEW'] },
        title: 'Actions - CCMS'
      },
      {
        path: 'admin/module-actions',
        loadComponent: () => import('./features/module-actions/module-actions.component').then(m => m.ModuleActionsComponent),
        canActivate: [authGuard, permissionGuard],
        data: { permission: ['MODULE_ACTION_MANAGEMENT', 'VIEW'] },
        title: 'Module Actions - CCMS'
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Profile - CCMS'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
