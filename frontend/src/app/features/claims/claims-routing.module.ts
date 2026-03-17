import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClaimListComponent } from './claim-list/claim-list.component';
import { ClaimFormComponent } from './claim-form/claim-form.component';
import { authGuard } from '../../core/guards/auth.guard.functional';
import { permissionGuard } from '../../core/guards/permission.guard';

const routes: Routes = [
  {
    path: '',
    component: ClaimListComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['CLAIMS', 'VIEW'] }
  },
  {
    path: ':id',
    component: ClaimFormComponent, // Used for viewing and editing based on route params
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['CLAIMS', 'VIEW'] }
  },
  {
    path: ':id/edit',
    component: ClaimFormComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: ['CLAIMS', 'UPDATE'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClaimsRoutingModule {}
