/**
 * Centralized cache key constants for Permission Service
 * This prevents cache key mismatches and ensures consistency
 */

/**
 * Static cache keys (no parameters)
 */
export const CACHE_KEYS = {
  ALL_ROLES: 'all-roles',
  ALL_MODULES: 'all-modules',
  ALL_ACTIONS: 'all-actions',
  ALL_MODULE_ACTIONS: 'all-module-actions',
  ALL_CATEGORIES: 'all-categories',
} as const;

/**
 * Cache key prefixes for dynamic keys
 */
export const CACHE_PREFIXES = {
  PERMISSION: 'perm:',
  USER_PERMISSIONS: 'user-perms:',
  ROLE_PERMISSIONS: 'role-perms:',
  ROLE_PERMISSIONS_MATRIX: 'role-perms-matrix:',
} as const;

/**
 * Cache key generators for dynamic keys
 */
export const CacheKeyGenerators = {
  /**
   * Generate cache key for permission check
   * @param userId User ID
   * @param moduleCode Module code
   * @param actionCode Action code
   * @returns Cache key: perm:${userId}:${moduleCode}:${actionCode}
   */
  permission: (userId: number, moduleCode: string, actionCode: string): string => {
    return `${CACHE_PREFIXES.PERMISSION}${userId}:${moduleCode}:${actionCode}`;
  },

  /**
   * Generate cache key for user permissions
   * @param userId User ID
   * @param roleId Optional role ID for role-specific permissions
   * @returns Cache key: user-perms:${userId} or user-perms:${userId}:${roleId}
   */
  userPermissions: (userId: number, roleId?: number): string => {
    return roleId 
      ? `${CACHE_PREFIXES.USER_PERMISSIONS}${userId}:${roleId}`
      : `${CACHE_PREFIXES.USER_PERMISSIONS}${userId}`;
  },

  /**
   * Generate cache key for role permissions
   * @param roleId Role ID
   * @returns Cache key: role-perms:${roleId}
   */
  rolePermissions: (roleId: number): string => {
    return `${CACHE_PREFIXES.ROLE_PERMISSIONS}${roleId}`;
  },

  /**
   * Generate cache key for role permissions matrix
   * @param roleId Role ID
   * @returns Cache key: role-perms-matrix:${roleId}
   */
  rolePermissionsMatrix: (roleId: number): string => {
    return `${CACHE_PREFIXES.ROLE_PERMISSIONS_MATRIX}${roleId}`;
  },

  /**
   * Generate prefix for user-specific permission keys
   * @param userId User ID
   * @returns Prefix: perm:${userId}:
   */
  userPermissionPrefix: (userId: number): string => {
    return `${CACHE_PREFIXES.PERMISSION}${userId}:`;
  },
} as const;
