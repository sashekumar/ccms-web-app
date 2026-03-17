import { Routes } from '@angular/router';

import { AdmissionListComponent } from './admission-list/admission-list.component';
import { AdmissionDetailComponent } from './admission-detail/admission-detail.component';
import { AdmissionFormComponent } from './admission-form/admission-form.component';

/**
 * Admissions routes
 * 
 * Route structure:
 * - /admissions              -> List all admissions
 * - /admissions/create       -> Create new admission
 * - /admissions/:id          -> View admission details
 * - /admissions/:id/edit     -> Edit admission
 * 
 * Note: AuthGuard and PermissionGuard should be applied at app.routes.ts level
 */
export const ADMISSIONS_ROUTES: Routes = [
  {
    path: '',
    component: AdmissionListComponent,
    data: {
      title: 'Admissions',
      permissions: ['ADMISSIONS.VIEW']
    }
  },
  {
    path: 'create',
    component: AdmissionFormComponent,
    data: {
      title: 'Create Admission',
      permissions: ['ADMISSIONS.CREATE']
    }
  },
  {
    path: ':id',
    component: AdmissionDetailComponent,
    data: {
      title: 'Admission Details',
      permissions: ['ADMISSIONS.VIEW']
    }
  },
  {
    path: ':id/edit',
    component: AdmissionFormComponent,
    data: {
      title: 'Edit Admission',
      permissions: ['ADMISSIONS.UPDATE']
    }
  }
];
