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
        loadChildren: () => import('./features/users/users.routes').then(m => m.usersRoutes),
        canActivate: [authGuard, permissionGuard],
        data: { permission: ['USER_MANAGEMENT', 'VIEW'] }
      },
      {
        path: 'admin/roles',
        loadChildren: () => import('./features/roles/roles.routes').then(m => m.rolesRoutes),
        canActivate: [authGuard, permissionGuard],
        data: { permission: ['ROLE_MANAGEMENT', 'VIEW'] }
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
        path: 'master/banks',
        loadChildren: () => import('./features/banks/banks.routes').then(m => m.banksRoutes)
      },
      {
        path: 'master/clauses',
        loadChildren: () => import('./features/clauses/clauses.routes').then(m => m.clausesRoutes)
      },
      {
        path: 'master/lookups',
        loadChildren: () => import('./features/lookups/lookups.routes').then(m => m.lookupsRoutes)
      },
      {
        path: 'master/mq-templates',
        loadChildren: () => import('./features/mq-templates/mq-templates.routes').then(m => m.mqTemplatesRoutes),
        title: 'MQ Templates - CCMS'
      },
      {
        path: 'hospitals',
        loadChildren: () => import('./features/hospitals/hospitals.routes').then(m => m.hospitalsRoutes)
      },
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.routes').then(m => m.productsRoutes)
      },
      {
        path: 'members',
        loadChildren: () => import('./features/members/members.routes').then(m => m.MEMBER_ROUTES),
        canActivate: [authGuard, permissionGuard],
        data: { permission: ['POLICY_HOLDERS', 'VIEW'] },
        title: 'Policy Holders - CCMS'
      },
      {
        path: 'admissions',
        loadChildren: () => import('./features/admissions/admissions.routes').then(m => m.ADMISSIONS_ROUTES),
        canActivate: [authGuard, permissionGuard],
        data: { permission: ['ADMISSIONS', 'VIEW'] },
        title: 'Admissions - CCMS'
      },
      {
        path: 'claims',
        loadChildren: () => import('./features/claims/claims.module').then(m => m.ClaimsModule),
        canActivate: [authGuard, permissionGuard],
        data: { permission: ['CLAIMS', 'VIEW'] },
        title: 'Claims - CCMS'
      },
      {
        path: 'mq-operations',
        loadComponent: () => import('./features/mq-operations/mq-operations.component').then(m => m.MqOperationsComponent),
        canActivate: [authGuard, permissionGuard],
        data: { permission: ['MQ_OPERATIONS', 'VIEW'] },
        title: 'MQ Operations - CCMS'
      },
      {
        path: 'monitoring',
        loadComponent: () => import('./features/monitoring/monitoring-dashboard/monitoring-dashboard.component').then(m => m.MonitoringDashboardComponent),
        canActivate: [authGuard, permissionGuard],
        data: { permission: ['ADMISSIONS', 'VIEW'] },
        title: 'Monitoring Dashboard - CCMS'
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
