import { describe, it, expect } from 'vitest';
import {
  AUTH_ENDPOINTS,
  USERS_ENDPOINTS,
  PERMISSIONS_ENDPOINTS,
  API_ENDPOINTS,
  buildApiUrl,
  getApiBaseUrl,
  buildFullUrl
} from './api-endpoints.constants';

describe('API Endpoint Constants', () => {
  describe('AUTH_ENDPOINTS', () =>{ 
    it('should have all authentication endpoints', () => {
      expect(AUTH_ENDPOINTS.LOGIN).toBe('auth/login');
      expect(AUTH_ENDPOINTS.LOGOUT).toBe('auth/logout');
      expect(AUTH_ENDPOINTS.REFRESH).toBe('auth/refresh');
      expect(AUTH_ENDPOINTS.ME).toBe('auth/me');
      expect(AUTH_ENDPOINTS.CSRF_TOKEN).toBe('auth/csrf-token');
      expect(AUTH_ENDPOINTS.CHANGE_PASSWORD).toBe('auth/change-password');
    });
  });

  describe('USERS_ENDPOINTS', () => {
    it('should have basic user endpoints', () => {
      expect(USERS_ENDPOINTS.LIST).toBe('users/list');
      expect(USERS_ENDPOINTS.CREATE).toBe('users');
      expect(USERS_ENDPOINTS.CHECK_USERNAME).toBe('users/check-username');
    });

    it('should have parameterized user endpoints', () => {
      expect(USERS_ENDPOINTS.getById(123)).toBe('users/123');
      expect(USERS_ENDPOINTS.update(456)).toBe('users/456');
      expect(USERS_ENDPOINTS.delete(789)).toBe('users/789');
    });
  });

  describe('PERMISSIONS_ENDPOINTS', () => {
    it('should have basic permission endpoints', () => {
      expect(PERMISSIONS_ENDPOINTS.CHECK).toBe('permissions/check');
      expect(PERMISSIONS_ENDPOINTS.GRANT).toBe('permissions/grant');
      expect(PERMISSIONS_ENDPOINTS.REVOKE).toBe('permissions/revoke');
    });

    it('should have user permission endpoints', () => {
      expect(PERMISSIONS_ENDPOINTS.USER.GET_CURRENT).toBe('permissions/user');
      expect(PERMISSIONS_ENDPOINTS.USER.ASSIGN_ROLE).toBe('permissions/assign-role');
      expect(PERMISSIONS_ENDPOINTS.USER.getById(1)).toBe('permissions/user/1');
      expect(PERMISSIONS_ENDPOINTS.USER.detachRole(1, 2)).toBe('permissions/detach-role/1/2');
      expect(PERMISSIONS_ENDPOINTS.USER.getRoles(1)).toBe('permissions/user/1/roles');
    });

    it('should have role management endpoints', () => {
      expect(PERMISSIONS_ENDPOINTS.ROLES.LIST).toBe('permissions/roles/list');
      expect(PERMISSIONS_ENDPOINTS.ROLES.GET).toBe('permissions/roles/get');
      expect(PERMISSIONS_ENDPOINTS.ROLES.CREATE).toBe('permissions/roles/create');
      expect(PERMISSIONS_ENDPOINTS.ROLES.UPDATE).toBe('permissions/roles/update');
      expect(PERMISSIONS_ENDPOINTS.ROLES.DELETE).toBe('permissions/roles/delete');
      expect(PERMISSIONS_ENDPOINTS.ROLES.PERMISSIONS).toBe('permissions/roles/permissions');
      expect(PERMISSIONS_ENDPOINTS.ROLES.PERMISSIONS_MATRIX).toBe('permissions/roles/permissions-matrix');
    });

    it('should have category management endpoints', () => {
      expect(PERMISSIONS_ENDPOINTS.CATEGORIES.LIST).toBe('permissions/categories');
      expect(PERMISSIONS_ENDPOINTS.CATEGORIES.CREATE).toBe('permissions/categories');
      expect(PERMISSIONS_ENDPOINTS.CATEGORIES.getById(1)).toBe('permissions/categories/1');
      expect(PERMISSIONS_ENDPOINTS.CATEGORIES.update(2)).toBe('permissions/categories/2');
      expect(PERMISSIONS_ENDPOINTS.CATEGORIES.delete(3)).toBe('permissions/categories/3');
    });

    it('should have module management endpoints', () => {
      expect(PERMISSIONS_ENDPOINTS.MODULES.LIST).toBe('permissions/modules/list');
      expect(PERMISSIONS_ENDPOINTS.MODULES.CREATE).toBe('permissions/modules/create');
      expect(PERMISSIONS_ENDPOINTS.MODULES.UPDATE).toBe('permissions/modules/update');
      expect(PERMISSIONS_ENDPOINTS.MODULES.DELETE).toBe('permissions/modules/delete');
    });

    it('should have action management endpoints', () => {
      expect(PERMISSIONS_ENDPOINTS.ACTIONS.LIST).toBe('permissions/actions/list');
      expect(PERMISSIONS_ENDPOINTS.ACTIONS.CREATE).toBe('permissions/actions/create');
      expect(PERMISSIONS_ENDPOINTS.ACTIONS.UPDATE).toBe('permissions/actions/update');
      expect(PERMISSIONS_ENDPOINTS.ACTIONS.DELETE).toBe('permissions/actions/delete');
    });

    it('should have module-action management endpoints', () => {
      expect(PERMISSIONS_ENDPOINTS.MODULE_ACTIONS.LIST).toBe('permissions/module-actions/list');
      expect(PERMISSIONS_ENDPOINTS.MODULE_ACTIONS.CREATE).toBe('permissions/module-actions/create');
      expect(PERMISSIONS_ENDPOINTS.MODULE_ACTIONS.UPDATE).toBe('permissions/module-actions/update');
      expect(PERMISSIONS_ENDPOINTS.MODULE_ACTIONS.DELETE).toBe('permissions/module-actions/delete');
    });
  });

  describe('API_ENDPOINTS', () => {
    it('should consolidate all endpoint groups', () => {
      expect(API_ENDPOINTS.AUTH).toEqual(AUTH_ENDPOINTS);
      expect(API_ENDPOINTS.USERS).toEqual(USERS_ENDPOINTS);
      expect(API_ENDPOINTS.PERMISSIONS).toEqual(PERMISSIONS_ENDPOINTS);
    });
  });

  describe('buildApiUrl', () => {
    it('should return endpoint without query params when params are empty', () => {
      const result = buildApiUrl('/api/users');
      expect(result).toBe('/api/users');
    });

    it('should build URL with single query parameter', () => {
      const result = buildApiUrl('/api/users', { page: 1 });
      expect(result).toBe('/api/users?page=1');
    });

    it('should build URL with multiple query parameters', () => {
      const result = buildApiUrl('/api/users', { page: 1, limit: 10 });
      expect(result).toContain('page=1');
      expect(result).toContain('limit=10');
      expect(result).toContain('?');
      expect(result).toContain('&');
    });

    it('should handle boolean parameters', () => {
      const result = buildApiUrl('/api/users', { active: true });
      expect(result).toBe('/api/users?active=true');
    });

    it('should encode special characters', () => {
      const result = buildApiUrl('/api/users', { search: 'john doe' });
      expect(result).toBe('/api/users?search=john%20doe');
    });

    it('should filter out undefined values', () => {
      const result = buildApiUrl('/api/users', { page: 1, limit: undefined as any });
      expect(result).toBe('/api/users?page=1');
    });

    it('should filter out null values', () => {
      const result = buildApiUrl('/api/users', { page: 1, limit: null as any });
      expect(result).toBe('/api/users?page=1');
    });

    it('should filter out empty string values', () => {
      const result = buildApiUrl('/api/users', { page: 1, search: '' });
      expect(result).toBe('/api/users?page=1');
    });

    it('should handle zero as a valid value', () => {
      const result = buildApiUrl('/api/users', { page: 0 });
      expect(result).toBe('/api/users?page=0');
    });

    it('should handle false as a valid value', () => {
      const result = buildApiUrl('/api/users', { active: false });
      expect(result).toBe('/api/users?active=false');
    });
  });

  describe('getApiBaseUrl', () => {
    it('should return empty string as base URL', () => {
      const result = getApiBaseUrl();
      expect(result).toBe('');
    });
  });

  describe('buildFullUrl', () => {
    it('should build full URL with protocol and host in browser', () => {
      const result = buildFullUrl('/api/users');
      // Should contain current window location
      expect(result).toContain('://');
      expect(result).toContain('/api/users');
    });

    it('should handle relative paths', () => {
      const result = buildFullUrl('/api/download/report');
      expect(result).toContain('/api/download/report');
    });
  });
});
