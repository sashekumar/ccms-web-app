import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard (Functional) - Protect routes from unauthorized access
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuth = authService.isAuthenticated();
  console.log(`🔐 AUTH GUARD: Checking authentication for route: ${state.url}`);
  console.log(`🔐 AUTH GUARD: Is authenticated? ${isAuth}`);
  console.log(`🔐 AUTH GUARD: Current user:`, authService['currentUserSubject'].value);

  if (isAuth) {
    console.log(`✅ AUTH GUARD: Access granted to ${state.url}`);
    return true;
  }

  // Store the attempted URL for redirecting after login
  console.log(`❌ AUTH GUARD: Not authenticated, redirecting to /auth/login`);
  authService.redirectUrl = state.url;
  router.navigate(['/auth/login']);
  return false;
};
