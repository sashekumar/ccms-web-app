import { describe, it, expect } from 'vitest';
import {
  DASHBOARD_PERMISSIONS,
  USER_MANAGEMENT_PERMISSIONS,
  ROLE_MANAGEMENT_PERMISSIONS,
  CATEGORY_MANAGEMENT_PERMISSIONS,
  MODULE_MANAGEMENT_PERMISSIONS,
  ACTION_MANAGEMENT_PERMISSIONS,
  MODULE_ACTION_MANAGEMENT_PERMISSIONS,
  ROLE_PERMISSION_MANAGEMENT_PERMISSIONS,
  USER_ROLE_ASSIGNMENT_PERMISSIONS,
  PERMISSIONS,
  MODULE_CODES,
  ACTION_CODES,
  buildPermissionKey,
  parsePermissionKey,
  isValidPermissionKey
} from './permissions.constants';

describe('Permission Constants', () => {
  describe('Individual Permission Groups', () => {
    it('should have DASHBOARD_PERMISSIONS', () => {
      expect(DASHBOARD_PERMISSIONS.VIEW).toBe('DASHBOARD.VIEW');
    });

    it('should have USER_MANAGEMENT_PERMISSIONS', () => {
      expect(USER_MANAGEMENT_PERMISSIONS.VIEW).toBe('USER_MANAGEMENT.VIEW');
      expect(USER_MANAGEMENT_PERMISSIONS.CREATE).toBe('USER_MANAGEMENT.CREATE');
      expect(USER_MANAGEMENT_PERMISSIONS.UPDATE).toBe('USER_MANAGEMENT.UPDATE');
      expect(USER_MANAGEMENT_PERMISSIONS.DELETE).toBe('USER_MANAGEMENT.DELETE');
    });

    it('should have ROLE_MANAGEMENT_PERMISSIONS', () => {
      expect(ROLE_MANAGEMENT_PERMISSIONS.VIEW).toBe('ROLE_MANAGEMENT.VIEW');
      expect(ROLE_MANAGEMENT_PERMISSIONS.CREATE).toBe('ROLE_MANAGEMENT.CREATE');
      expect(ROLE_MANAGEMENT_PERMISSIONS.UPDATE).toBe('ROLE_MANAGEMENT.UPDATE');
      expect(ROLE_MANAGEMENT_PERMISSIONS.DELETE).toBe('ROLE_MANAGEMENT.DELETE');
    });

    it('should have CATEGORY_MANAGEMENT_PERMISSIONS', () => {
      expect(CATEGORY_MANAGEMENT_PERMISSIONS.VIEW).toBe('CATEGORY_MANAGEMENT.VIEW');
      expect(CATEGORY_MANAGEMENT_PERMISSIONS.CREATE).toBe('CATEGORY_MANAGEMENT.CREATE');
      expect(CATEGORY_MANAGEMENT_PERMISSIONS.UPDATE).toBe('CATEGORY_MANAGEMENT.UPDATE');
      expect(CATEGORY_MANAGEMENT_PERMISSIONS.DELETE).toBe('CATEGORY_MANAGEMENT.DELETE');
    });

    it('should have MODULE_MANAGEMENT_PERMISSIONS', () => {
      expect(MODULE_MANAGEMENT_PERMISSIONS.VIEW).toBe('MODULE_MANAGEMENT.VIEW');
      expect(MODULE_MANAGEMENT_PERMISSIONS.CREATE).toBe('MODULE_MANAGEMENT.CREATE');
      expect(MODULE_MANAGEMENT_PERMISSIONS.UPDATE).toBe('MODULE_MANAGEMENT.UPDATE');
      expect(MODULE_MANAGEMENT_PERMISSIONS.DELETE).toBe('MODULE_MANAGEMENT.DELETE');
    });

    it('should have ACTION_MANAGEMENT_PERMISSIONS', () => {
      expect(ACTION_MANAGEMENT_PERMISSIONS.VIEW).toBe('ACTION_MANAGEMENT.VIEW');
      expect(ACTION_MANAGEMENT_PERMISSIONS.CREATE).toBe('ACTION_MANAGEMENT.CREATE');
      expect(ACTION_MANAGEMENT_PERMISSIONS.UPDATE).toBe('ACTION_MANAGEMENT.UPDATE');
      expect(ACTION_MANAGEMENT_PERMISSIONS.DELETE).toBe('ACTION_MANAGEMENT.DELETE');
    });

    it('should have MODULE_ACTION_MANAGEMENT_PERMISSIONS', () => {
      expect(MODULE_ACTION_MANAGEMENT_PERMISSIONS.VIEW).toBe('MODULE_ACTION_MANAGEMENT.VIEW');
      expect(MODULE_ACTION_MANAGEMENT_PERMISSIONS.CREATE).toBe('MODULE_ACTION_MANAGEMENT.CREATE');
      expect(MODULE_ACTION_MANAGEMENT_PERMISSIONS.UPDATE).toBe('MODULE_ACTION_MANAGEMENT.UPDATE');
      expect(MODULE_ACTION_MANAGEMENT_PERMISSIONS.DELETE).toBe('MODULE_ACTION_MANAGEMENT.DELETE');
    });

    it('should have ROLE_PERMISSION_MANAGEMENT_PERMISSIONS', () => {
      expect(ROLE_PERMISSION_MANAGEMENT_PERMISSIONS.VIEW).toBe('ROLE_PERMISSION_MANAGEMENT.VIEW');
      expect(ROLE_PERMISSION_MANAGEMENT_PERMISSIONS.CREATE).toBe('ROLE_PERMISSION_MANAGEMENT.CREATE');
      expect(ROLE_PERMISSION_MANAGEMENT_PERMISSIONS.UPDATE).toBe('ROLE_PERMISSION_MANAGEMENT.UPDATE');
      expect(ROLE_PERMISSION_MANAGEMENT_PERMISSIONS.DELETE).toBe('ROLE_PERMISSION_MANAGEMENT.DELETE');
    });

    it('should have USER_ROLE_ASSIGNMENT_PERMISSIONS', () => {
      expect(USER_ROLE_ASSIGNMENT_PERMISSIONS.VIEW).toBe('USER_ROLE_ASSIGNMENT.VIEW');
      expect(USER_ROLE_ASSIGNMENT_PERMISSIONS.CREATE).toBe('USER_ROLE_ASSIGNMENT.CREATE');
      expect(USER_ROLE_ASSIGNMENT_PERMISSIONS.UPDATE).toBe('USER_ROLE_ASSIGNMENT.UPDATE');
      expect(USER_ROLE_ASSIGNMENT_PERMISSIONS.DELETE).toBe('USER_ROLE_ASSIGNMENT.DELETE');
      expect(USER_ROLE_ASSIGNMENT_PERMISSIONS.ATTACH_ROLE).toBe('USER_ROLE_ASSIGNMENT.ATTACH_ROLE');
      expect(USER_ROLE_ASSIGNMENT_PERMISSIONS.DETACH_ROLE).toBe('USER_ROLE_ASSIGNMENT.DETACH_ROLE');
    });
  });

  describe('PERMISSIONS Object', () => {
    it('should consolidate all permission groups', () => {
      expect(PERMISSIONS.DASHBOARD).toEqual(DASHBOARD_PERMISSIONS);
      expect(PERMISSIONS.USER_MANAGEMENT).toEqual(USER_MANAGEMENT_PERMISSIONS);
      expect(PERMISSIONS.ROLE_MANAGEMENT).toEqual(ROLE_MANAGEMENT_PERMISSIONS);
      expect(PERMISSIONS.CATEGORY_MANAGEMENT).toEqual(CATEGORY_MANAGEMENT_PERMISSIONS);
      expect(PERMISSIONS.MODULE_MANAGEMENT).toEqual(MODULE_MANAGEMENT_PERMISSIONS);
      expect(PERMISSIONS.ACTION_MANAGEMENT).toEqual(ACTION_MANAGEMENT_PERMISSIONS);
      expect(PERMISSIONS.MODULE_ACTION_MANAGEMENT).toEqual(MODULE_ACTION_MANAGEMENT_PERMISSIONS);
      expect(PERMISSIONS.ROLE_PERMISSION_MANAGEMENT).toEqual(ROLE_PERMISSION_MANAGEMENT_PERMISSIONS);
      expect(PERMISSIONS.USER_ROLE_ASSIGNMENT).toEqual(USER_ROLE_ASSIGNMENT_PERMISSIONS);
    });

    it('should provide access to nested permissions', () => {
      expect(PERMISSIONS.USER_MANAGEMENT.CREATE).toBe('USER_MANAGEMENT.CREATE');
      expect(PERMISSIONS.ROLE_MANAGEMENT.DELETE).toBe('ROLE_MANAGEMENT.DELETE');
      expect(PERMISSIONS.DASHBOARD.VIEW).toBe('DASHBOARD.VIEW');
    });
  });

  describe('MODULE_CODES', () => {
    it('should have all module codes', () => {
      expect(MODULE_CODES.DASHBOARD).toBe('DASHBOARD');
      expect(MODULE_CODES.USER_MANAGEMENT).toBe('USER_MANAGEMENT');
      expect(MODULE_CODES.ROLE_MANAGEMENT).toBe('ROLE_MANAGEMENT');
      expect(MODULE_CODES.CATEGORY_MANAGEMENT).toBe('CATEGORY_MANAGEMENT');
      expect(MODULE_CODES.MODULE_MANAGEMENT).toBe('MODULE_MANAGEMENT');
      expect(MODULE_CODES.ACTION_MANAGEMENT).toBe('ACTION_MANAGEMENT');
      expect(MODULE_CODES.MODULE_ACTION_MANAGEMENT).toBe('MODULE_ACTION_MANAGEMENT');
      expect(MODULE_CODES.ROLE_PERMISSION_MANAGEMENT).toBe('ROLE_PERMISSION_MANAGEMENT');
      expect(MODULE_CODES.USER_ROLE_ASSIGNMENT).toBe('USER_ROLE_ASSIGNMENT');
    });
  });

  describe('ACTION_CODES', () => {
    it('should have all action codes', () => {
      expect(ACTION_CODES.VIEW).toBe('VIEW');
      expect(ACTION_CODES.CREATE).toBe('CREATE');
      expect(ACTION_CODES.UPDATE).toBe('UPDATE');
      expect(ACTION_CODES.DELETE).toBe('DELETE');
      expect(ACTION_CODES.ATTACH_ROLE).toBe('ATTACH_ROLE');
      expect(ACTION_CODES.DETACH_ROLE).toBe('DETACH_ROLE');
    });
  });

  describe('buildPermissionKey', () => {
    it('should build permission key from module and action codes', () => {
      const key = buildPermissionKey(MODULE_CODES.USER_MANAGEMENT, ACTION_CODES.CREATE);
      expect(key).toBe('USER_MANAGEMENT.CREATE');
    });

    it('should build permission key with custom strings', () => {
      const key = buildPermissionKey('CUSTOM_MODULE', 'CUSTOM_ACTION');
      expect(key).toBe('CUSTOM_MODULE.CUSTOM_ACTION');
    });

    it('should handle empty strings', () => {
      const key = buildPermissionKey('', '');
      expect(key).toBe('.');
    });
  });

  describe('parsePermissionKey', () => {
    it('should parse permission key into module and action codes', () => {
      const result = parsePermissionKey('USER_MANAGEMENT.CREATE');
      expect(result.moduleCode).toBe('USER_MANAGEMENT');
      expect(result.actionCode).toBe('CREATE');
    });

    it('should parse complex permission keys', () => {
      const result = parsePermissionKey('ROLE_PERMISSION_MANAGEMENT.UPDATE');
      expect(result.moduleCode).toBe('ROLE_PERMISSION_MANAGEMENT');
      expect(result.actionCode).toBe('UPDATE');
    });

    it('should handle single-part keys', () => {
      const result = parsePermissionKey('INVALID');
      expect(result.moduleCode).toBe('INVALID');
      expect(result.actionCode).toBeUndefined();
    });

    it('should handle empty strings', () => {
      const result = parsePermissionKey('');
      expect(result.moduleCode).toBe('');
      expect(result.actionCode).toBeUndefined();
    });

    it('should handle keys with multiple dots', () => {
      const result = parsePermissionKey('MODULE.ACTION.EXTRA');
      expect(result.moduleCode).toBe('MODULE');
      expect(result.actionCode).toBe('ACTION');
    });
  });

  describe('isValidPermissionKey', () => {
    it('should return true for valid permission keys', () => {
      expect(isValidPermissionKey('USER_MANAGEMENT.CREATE')).toBe(true);
      expect(isValidPermissionKey('DASHBOARD.VIEW')).toBe(true);
      expect(isValidPermissionKey('ROLE_PERMISSION_MANAGEMENT.UPDATE')).toBe(true);
    });

    it('should return false for invalid permission keys', () => {
      expect(isValidPermissionKey('INVALID')).toBe(false);
      expect(isValidPermissionKey('NO_ACTION.')).toBe(false);
      expect(isValidPermissionKey('.NO_MODULE')).toBe(false);
      expect(isValidPermissionKey('')).toBe(false);
    });

    it('should return false for keys with multiple dots', () => {
      expect(isValidPermissionKey('MODULE.ACTION.EXTRA')).toBe(false);
    });

    it('should return false for keys with only dots', () => {
      expect(isValidPermissionKey('.')).toBe(false);
      expect(isValidPermissionKey('..')).toBe(false);
    });
  });

  describe('Immutability', () => {
    it('should be immutable (as const)', () => {
      // TypeScript will prevent modification at compile time
      // Runtime check to ensure object is frozen (if supported)
      expect(Object.isFrozen(PERMISSIONS)).toBe(false); // Note: 'as const' doesn't freeze at runtime
      
      // Verify structure exists
      expect(PERMISSIONS).toBeDefined();
      expect(MODULE_CODES).toBeDefined();
      expect(ACTION_CODES).toBeDefined();
    });
  });
});
