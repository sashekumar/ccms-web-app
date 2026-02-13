import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role Guard (Functional) - Check user roles for route access
 * Usage in route: canActivate: [roleGuard], data: { roles: [1, 2] } // Use role IDs
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as number[];
  
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const hasRole = requiredRoles.some(roleId => authService.hasRole(roleId));
  
  if (hasRole) {
    return true;
  }

  // User doesn't have required role
  router.navigate(['/unauthorized']);
  return false;
};
