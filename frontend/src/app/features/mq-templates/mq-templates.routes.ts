import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard.functional';
import { permissionGuard } from '../../core/guards/permission.guard';

export const mqTemplatesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./mq-template-list/mq-template-list.component').then(m => m.MqTemplateListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['MQ_TEMPLATES_MGMT', 'VIEW'] },
    title: 'MQ Templates - CCMS'
  }
];
