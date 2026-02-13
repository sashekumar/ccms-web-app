import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard.functional';
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
        path: 'claims',
        loadChildren: () => import('./features/claims/claims.routes').then(m => m.claimsRoutes)
      },
      {
        path: 'policies',
        loadChildren: () => import('./features/policies/policies.routes').then(m => m.policiesRoutes)
      },
      {
        path: 'collections',
        loadComponent: () => import('./features/collections/collections.component').then(m => m.CollectionsComponent),
        title: 'Collections - CCMS'
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes').then(m => m.usersRoutes)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        title: 'Reports - CCMS'
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Profile - CCMS'
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Settings - CCMS'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
