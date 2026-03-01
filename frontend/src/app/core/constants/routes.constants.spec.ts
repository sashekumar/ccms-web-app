import { describe, it, expect } from 'vitest';
import {
  AUTH_ROUTES,
  PUBLIC_ROUTES,
  MAIN_ROUTES,
  ADMIN_ROUTES,
  APP_ROUTES,
  buildRoute,
  matchesRoute,
  extractRouteParams
} from './routes.constants';

describe('Route Constants', () => {
  describe('AUTH_ROUTES', () => {
    it('should have all authentication routes', () => {
      expect(AUTH_ROUTES.BASE).toBe('auth');
      expect(AUTH_ROUTES.LOGIN).toBe('auth/login');
      expect(AUTH_ROUTES.LOGOUT).toBe('auth/logout');
      expect(AUTH_ROUTES.FORGOT_PASSWORD).toBe('auth/forgot-password');
      expect(AUTH_ROUTES.RESET_PASSWORD).toBe('auth/reset-password');
    });
  });

  describe('PUBLIC_ROUTES', () => {
    it('should have all public routes', () => {
      expect(PUBLIC_ROUTES.HOME).toBe('');
      expect(PUBLIC_ROUTES.UNAUTHORIZED).toBe('unauthorized');
      expect(PUBLIC_ROUTES.NOT_FOUND).toBe('404');
    });
  });

  describe('MAIN_ROUTES', () => {
    it('should have main application routes', () => {
      expect(MAIN_ROUTES.DASHBOARD).toBe('dashboard');
    });
  });

  describe('ADMIN_ROUTES', () => {
    it('should have all admin routes', () => {
      expect(ADMIN_ROUTES.BASE).toBe('admin');
      expect(ADMIN_ROUTES.USERS).toBe('admin/users');
      expect(ADMIN_ROUTES.ROLES).toBe('admin/roles');
      expect(ADMIN_ROUTES.CATEGORIES).toBe('admin/categories');
      expect(ADMIN_ROUTES.MODULES).toBe('admin/modules');
      expect(ADMIN_ROUTES.ACTIONS).toBe('admin/actions');
      expect(ADMIN_ROUTES.MODULE_ACTIONS).toBe('admin/module-actions');
      expect(ADMIN_ROUTES.ROLE_PERMISSIONS).toBe('admin/role-permissions');
      expect(ADMIN_ROUTES.USER_ROLES).toBe('admin/user-roles');
    });
  });

  describe('APP_ROUTES', () => {
    it('should consolidate all route groups', () => {
      expect(APP_ROUTES.AUTH).toEqual(AUTH_ROUTES);
      expect(APP_ROUTES.PUBLIC).toEqual(PUBLIC_ROUTES);
      expect(APP_ROUTES.MAIN).toEqual(MAIN_ROUTES);
      expect(APP_ROUTES.ADMIN).toEqual(ADMIN_ROUTES);
    });
  });

  describe('buildRoute', () => {
    it('should build route with single parameter', () => {
      const result = buildRoute('users/:id', { id: 123 });
      expect(result).toBe('users/123');
    });

    it('should build route with multiple parameters', () => {
      const result = buildRoute('users/:id/edit/:action', { id: 123, action: 'approve' });
      expect(result).toBe('users/123/edit/approve');
    });

    it('should handle boolean parameters', () => {
      const result = buildRoute('settings/:enabled', { enabled: true });
      expect(result).toBe('settings/true');
    });

    it('should throw error for missing parameter', () => {
      expect(() => buildRoute('users/:id', {})).toThrow('Missing parameter: id');
    });

    it('should throw error for null parameter', () => {
      expect(() => buildRoute('users/:id', { id: null as any })).toThrow();
    });

    it('should handle routes without parameters', () => {
      const result = buildRoute('users/list', {});
      expect(result).toBe('users/list');
    });
  });

  describe('matchesRoute', () => {
    it('should match route with single parameter', () => {
      expect(matchesRoute('users/123', 'users/:id')).toBe(true);
    });

    it('should match route with multiple parameters', () => {
      expect(matchesRoute('users/123/edit/approve', 'users/:id/edit/:action')).toBe(true);
    });

    it('should not match different routes', () => {
      expect(matchesRoute('users/123', 'roles/:id')).toBe(false);
    });

    it('should not match if parameter count differs', () => {
      expect(matchesRoute('users/123', 'users/:id/edit/:action')).toBe(false);
    });

    it('should match exact routes without parameters', () => {
      expect(matchesRoute('users/list', 'users/list')).toBe(true);
    });
  });

  describe('extractRouteParams', () => {
    it('should extract single parameter', () => {
      const result = extractRouteParams('users/123', 'users/:id');
      expect(result).toEqual({ id: '123' });
    });

    it('should extract multiple parameters', () => {
      const result = extractRouteParams('users/123/edit/approve', 'users/:id/edit/:action');
      expect(result).toEqual({ id: '123', action: 'approve' });
    });

    it('should return empty object for non-matching route', () => {
      const result = extractRouteParams('users/123', 'roles/:id');
      expect(result).toEqual({});
    });

    it('should return empty object for route without parameters', () => {
      const result = extractRouteParams('users/list', 'users/list');
      expect(result).toEqual({});
    });

    it('should handle complex parameter names', () => {
      const result = extractRouteParams('claims/123/documents/456', 'claims/:claimId/documents/:docId');
      expect(result).toEqual({ claimId: '123', docId: '456' });
    });
  });
});
