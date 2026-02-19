/**
 * Permission Key Constants
 * 
 * Centralized permission keys for access control throughout the application.
 * Use these constants instead of hardcoded strings to:
 * - Prevent typos in permission checks
 * - Enable type-safe permission checking
 * - Document available permissions
 * - Make permission refactoring easier
 * 
 * Format: MODULE_CODE.ACTION_CODE
 * 
 * @example
 * ```typescript
 * // In directives
 * <button *hasPermission="PERMISSIONS.USER_MANAGEMENT.CREATE">Create</button>
 * 
 * // In components
 * if (this.permissionService.hasPermission(PERMISSIONS.USER_MANAGEMENT.DELETE)) {
 *   // Show delete button
 * }
 * 
 * // In route guards
 * canActivate: [PermissionGuard],
 * data: { permission: PERMISSIONS.ROLE_MANAGEMENT.VIEW }
 * ```
 */

// ============================================================================
// MAIN APPLICATION PERMISSIONS
// ============================================================================

export const DASHBOARD_PERMISSIONS = {
  VIEW: 'DASHBOARD.VIEW'
} as const;

// ============================================================================
// SYSTEM ADMINISTRATION PERMISSIONS
// ============================================================================

export const USER_MANAGEMENT_PERMISSIONS = {
  VIEW: 'USER_MANAGEMENT.VIEW',
  CREATE: 'USER_MANAGEMENT.CREATE',
  UPDATE: 'USER_MANAGEMENT.UPDATE',
  DELETE: 'USER_MANAGEMENT.DELETE'
} as const;

export const ROLE_MANAGEMENT_PERMISSIONS = {
  VIEW: 'ROLE_MANAGEMENT.VIEW',
  CREATE: 'ROLE_MANAGEMENT.CREATE',
  UPDATE: 'ROLE_MANAGEMENT.UPDATE',
  DELETE: 'ROLE_MANAGEMENT.DELETE'
} as const;

export const CATEGORY_MANAGEMENT_PERMISSIONS = {
  VIEW: 'CATEGORY_MANAGEMENT.VIEW',
  CREATE: 'CATEGORY_MANAGEMENT.CREATE',
  UPDATE: 'CATEGORY_MANAGEMENT.UPDATE',
  DELETE: 'CATEGORY_MANAGEMENT.DELETE'
} as const;

export const MODULE_MANAGEMENT_PERMISSIONS = {
  VIEW: 'MODULE_MANAGEMENT.VIEW',
  CREATE: 'MODULE_MANAGEMENT.CREATE',
  UPDATE: 'MODULE_MANAGEMENT.UPDATE',
  DELETE: 'MODULE_MANAGEMENT.DELETE'
} as const;

export const ACTION_MANAGEMENT_PERMISSIONS = {
  VIEW: 'ACTION_MANAGEMENT.VIEW',
  CREATE: 'ACTION_MANAGEMENT.CREATE',
  UPDATE: 'ACTION_MANAGEMENT.UPDATE',
  DELETE: 'ACTION_MANAGEMENT.DELETE'
} as const;

export const MODULE_ACTION_MANAGEMENT_PERMISSIONS = {
  VIEW: 'MODULE_ACTION_MANAGEMENT.VIEW',
  CREATE: 'MODULE_ACTION_MANAGEMENT.CREATE',
  UPDATE: 'MODULE_ACTION_MANAGEMENT.UPDATE',
  DELETE: 'MODULE_ACTION_MANAGEMENT.DELETE'
} as const;

export const ROLE_PERMISSION_MANAGEMENT_PERMISSIONS = {
  VIEW: 'ROLE_PERMISSION_MANAGEMENT.VIEW',
  CREATE: 'ROLE_PERMISSION_MANAGEMENT.CREATE',
  UPDATE: 'ROLE_PERMISSION_MANAGEMENT.UPDATE',
  DELETE: 'ROLE_PERMISSION_MANAGEMENT.DELETE'
} as const;

export const USER_ROLE_ASSIGNMENT_PERMISSIONS = {
  VIEW: 'USER_ROLE_ASSIGNMENT.VIEW',
  CREATE: 'USER_ROLE_ASSIGNMENT.CREATE',
  UPDATE: 'USER_ROLE_ASSIGNMENT.UPDATE',
  DELETE: 'USER_ROLE_ASSIGNMENT.DELETE',
  ATTACH_ROLE: 'USER_ROLE_ASSIGNMENT.ATTACH_ROLE',
  DETACH_ROLE: 'USER_ROLE_ASSIGNMENT.DETACH_ROLE'
} as const;

// ============================================================================
// FEATURE PERMISSIONS (Business/Application Features)
// ============================================================================
// Note: Add permission constants here as features are implemented and added to database

// ============================================================================
// CONSOLIDATED PERMISSIONS
// ============================================================================

export const PERMISSIONS = {
  DASHBOARD: DASHBOARD_PERMISSIONS,
  
  // System Administration
  USER_MANAGEMENT: USER_MANAGEMENT_PERMISSIONS,
  ROLE_MANAGEMENT: ROLE_MANAGEMENT_PERMISSIONS,
  CATEGORY_MANAGEMENT: CATEGORY_MANAGEMENT_PERMISSIONS,
  MODULE_MANAGEMENT: MODULE_MANAGEMENT_PERMISSIONS,
  ACTION_MANAGEMENT: ACTION_MANAGEMENT_PERMISSIONS,
  MODULE_ACTION_MANAGEMENT: MODULE_ACTION_MANAGEMENT_PERMISSIONS,
  ROLE_PERMISSION_MANAGEMENT: ROLE_PERMISSION_MANAGEMENT_PERMISSIONS,
  USER_ROLE_ASSIGNMENT: USER_ROLE_ASSIGNMENT_PERMISSIONS
} as const;

// ============================================================================
// MODULE CODES (for programmatic access)
// ============================================================================

export const MODULE_CODES = {
  DASHBOARD: 'DASHBOARD',
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  ROLE_MANAGEMENT: 'ROLE_MANAGEMENT',
  CATEGORY_MANAGEMENT: 'CATEGORY_MANAGEMENT',
  MODULE_MANAGEMENT: 'MODULE_MANAGEMENT',
  ACTION_MANAGEMENT: 'ACTION_MANAGEMENT',
  MODULE_ACTION_MANAGEMENT: 'MODULE_ACTION_MANAGEMENT',
  ROLE_PERMISSION_MANAGEMENT: 'ROLE_PERMISSION_MANAGEMENT',
  USER_ROLE_ASSIGNMENT: 'USER_ROLE_ASSIGNMENT'
} as const;

// ============================================================================
// ACTION CODES (for programmatic access)
// ============================================================================

export const ACTION_CODES = {
  VIEW: 'VIEW',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ATTACH_ROLE: 'ATTACH_ROLE',
  DETACH_ROLE: 'DETACH_ROLE'
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build permission key from module and action codes
 * 
 * @example
 * ```typescript
 * buildPermissionKey(MODULE_CODES.USER_MANAGEMENT, ACTION_CODES.CREATE)
 * // Returns: 'USER_MANAGEMENT.CREATE'
 * ```
 */
export function buildPermissionKey(moduleCode: string, actionCode: string): string {
  return `${moduleCode}.${actionCode}`;
}

/**
 * Parse permission key into module and action codes
 * 
 * @example
 * ```typescript
 * parsePermissionKey('USER_MANAGEMENT.CREATE')
 * // Returns: { moduleCode: 'USER_MANAGEMENT', actionCode: 'CREATE' }
 * ```
 */
export function parsePermissionKey(permissionKey: string): { moduleCode: string; actionCode: string } {
  const [moduleCode, actionCode] = permissionKey.split('.');
  return { moduleCode, actionCode };
}

/**
 * Check if permission key is valid
 * 
 * @example
 * ```typescript
 * isValidPermissionKey('USER_MANAGEMENT.CREATE') // true
 * isValidPermissionKey('INVALID') // false
 * ```
 */
export function isValidPermissionKey(permissionKey: string): boolean {
  const parts = permissionKey.split('.');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PermissionKey = string;
export type ModuleCode = typeof MODULE_CODES[keyof typeof MODULE_CODES];
export type ActionCode = typeof ACTION_CODES[keyof typeof ACTION_CODES];
