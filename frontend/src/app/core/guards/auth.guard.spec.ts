import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceMock: any;
  let routerMock: any;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: vi.fn(),
      redirectUrl: ''
    };

    routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    route = {} as ActivatedRouteSnapshot;
    state = { url: '/protected-route' } as RouterStateSnapshot;
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(guard).toBeTruthy();
    });
  });

  describe('canActivate() - Authenticated User', () => {
    it('should allow access when user is authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);

      const result = guard.canActivate(route, state);

      expect(result).toBe(true);
      expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should not store redirect URL when authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);
      authServiceMock.redirectUrl = '';

      guard.canActivate(route, state);

      expect(authServiceMock.redirectUrl).toBe('');
    });
  });

  describe('canActivate() - Unauthenticated User', () => {
    it('should deny access when user is not authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);

      const result = guard.canActivate(route, state);

      expect(result).toBe(false);
      expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
    });

    it('should redirect to login page when not authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);

      guard.canActivate(route, state);

      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should store the attempted URL for redirect after login', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);
      const attemptedUrl = '/admin/users';
      state = { url: attemptedUrl } as RouterStateSnapshot;

      guard.canActivate(route, state);

      expect(authServiceMock.redirectUrl).toBe(attemptedUrl);
    });

    it('should store complex URL with query params', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);
      const attemptedUrl = '/admin/users?page=2&filter=active';
      state = { url: attemptedUrl } as RouterStateSnapshot;

      guard.canActivate(route, state);

      expect(authServiceMock.redirectUrl).toBe(attemptedUrl);
    });
  });

  describe('Route Protection Scenarios', () => {
    it('should protect dashboard route', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);
      state = { url: '/dashboard' } as RouterStateSnapshot;

      const result = guard.canActivate(route, state);

      expect(result).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
      expect(authServiceMock.redirectUrl).toBe('/dashboard');
    });

    it('should protect admin routes', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);
      state = { url: '/admin/roles' } as RouterStateSnapshot;

      const result = guard.canActivate(route, state);

      expect(result).toBe(false);
      expect(authServiceMock.redirectUrl).toBe('/admin/roles');
    });

    it('should allow access to protected route when authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);
      state = { url: '/admin/users' } as RouterStateSnapshot;

      const result = guard.canActivate(route, state);

      expect(result).toBe(true);
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Guard Calls', () => {
    it('should consistently check authentication on each call', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);

      guard.canActivate(route, state);
      guard.canActivate(route, state);
      guard.canActivate(route, state);

      expect(authServiceMock.isAuthenticated).toHaveBeenCalledTimes(3);
    });

    it('should update redirect URL for each unauthenticated attempt', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);

      guard.canActivate(route, { url: '/route1' } as RouterStateSnapshot);
      expect(authServiceMock.redirectUrl).toBe('/route1');

      guard.canActivate(route, { url: '/route2' } as RouterStateSnapshot);
      expect(authServiceMock.redirectUrl).toBe('/route2');

      guard.canActivate(route, { url: '/route3' } as RouterStateSnapshot);
      expect(authServiceMock.redirectUrl).toBe('/route3');
    });
  });
});
