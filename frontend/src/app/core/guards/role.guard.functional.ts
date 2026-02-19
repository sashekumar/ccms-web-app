import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role Guard (Functional) - DEPRECATED
 * @deprecated This guard is deprecated. Use permissionGuard with permission-based access control instead.
 * 
 * This guard now always returns true to avoid breaking existing routes.
 * Migrate to: canActivate: [permissionGuard], data: { permission: { module: 'MODULE_CODE', action: 'ACTION_CODE' } }
 */
export const roleGuard: CanActivateFn = (route, state) => {
  console.warn('roleGuard is deprecated. Use permissionGuard with permission-based access control instead.');
  
  // Always allow - this guard is deprecated
  return true;
};
