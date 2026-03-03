import { Routes } from '@angular/router';

import { MemberListComponent } from './member-list/member-list.component';
import { MemberViewComponent } from './member-view/member-view.component';
import { MemberFormComponent } from './member-form/member-form.component';

/**
 * Member (Policy Holder) routes
 * 
 * Route structure:
 * - /members              -> List all members
 * - /members/create       -> Create new member
 * - /members/:id          -> View member details
 * - /members/:id/edit     -> Edit member
 * 
 * Note: AuthGuard and PermissionGuard should be applied at app.routes.ts level
 */
export const MEMBER_ROUTES: Routes = [
  {
    path: '',
    component: MemberListComponent,
    data: {
      title: 'Policy Holders',
      permissions: ['POLICY_HOLDERS.VIEW']
    }
  },
  {
    path: 'create',
    component: MemberFormComponent,
    data: {
      title: 'Create Policy Holder',
      permissions: ['POLICY_HOLDERS.CREATE']
    }
  },
  {
    path: ':id',
    component: MemberViewComponent,
    data: {
      title: 'Policy Holder Details',
      permissions: ['POLICY_HOLDERS.VIEW']
    }
  },
  {
    path: ':id/edit',
    component: MemberFormComponent,
    data: {
      title: 'Edit Policy Holder',
      permissions: ['POLICY_HOLDERS.UPDATE']
    }
  }
];
