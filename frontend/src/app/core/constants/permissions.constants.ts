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
// MASTER DATA PERMISSIONS
// ============================================================================

export const BANK_MANAGEMENT_PERMISSIONS = {
  VIEW: 'BANK_MGMT.VIEW',
  CREATE: 'BANK_MGMT.CREATE',
  UPDATE: 'BANK_MGMT.UPDATE',
  DELETE: 'BANK_MGMT.DELETE'
} as const;

export const CLAUSE_MANAGEMENT_PERMISSIONS = {
  VIEW: 'CLAUSE_MGMT.VIEW',
  CREATE: 'CLAUSE_MGMT.CREATE',
  UPDATE: 'CLAUSE_MGMT.UPDATE',
  DELETE: 'CLAUSE_MGMT.DELETE'
} as const;

export const LOOKUP_MANAGEMENT_PERMISSIONS = {
  VIEW: 'LOOKUP_MGMT.VIEW',
  CREATE: 'LOOKUP_MGMT.CREATE',
  UPDATE: 'LOOKUP_MGMT.UPDATE',
  DELETE: 'LOOKUP_MGMT.DELETE'
} as const;

// ============================================================================
// FEATURE PERMISSIONS (Business/Application Features)
// ============================================================================

export const HOSPITAL_MANAGEMENT_PERMISSIONS = {
  // Main Hospital Operations
  VIEW: 'HOSPITAL_MGMT.VIEW',
  CREATE: 'HOSPITAL_MGMT.CREATE',
  UPDATE: 'HOSPITAL_MGMT.UPDATE',
  DELETE: 'HOSPITAL_MGMT.DELETE',
  
  // Address Management
  VIEW_ADDRESS: 'HOSPITAL_MGMT.VIEW_ADDRESS',
  MANAGE_ADDRESS: 'HOSPITAL_MGMT.MANAGE_ADDRESS',
  
  // Code Management
  VIEW_CODES: 'HOSPITAL_MGMT.VIEW_CODES',
  MANAGE_CODES: 'HOSPITAL_MGMT.MANAGE_CODES',
  
  // Staff Management
  VIEW_STAFF: 'HOSPITAL_MGMT.VIEW_STAFF',
  MANAGE_STAFF: 'HOSPITAL_MGMT.MANAGE_STAFF',
  
  // Staff Contact Management
  VIEW_CONTACT: 'HOSPITAL_MGMT.VIEW_CONTACT',
  MANAGE_CONTACT: 'HOSPITAL_MGMT.MANAGE_CONTACT',
  
  // Fee Schedule Management
  VIEW_FEES: 'HOSPITAL_MGMT.VIEW_FEES',
  MANAGE_FEES: 'HOSPITAL_MGMT.MANAGE_FEES'
} as const;

export const POLICY_MANAGEMENT_PERMISSIONS = {
  // Main Product Operations
  VIEW: 'POLICY_MANAGEMENT.VIEW',
  CREATE: 'POLICY_MANAGEMENT.CREATE',
  UPDATE: 'POLICY_MANAGEMENT.UPDATE',
  DELETE: 'POLICY_MANAGEMENT.DELETE',
  ACTIVATE: 'POLICY_MANAGEMENT.ACTIVATE',
  DEACTIVATE: 'POLICY_MANAGEMENT.DEACTIVATE',
  
  // Limits Management
  VIEW_LIMITS: 'POLICY_MANAGEMENT.VIEW_LIMITS',
  MANAGE_LIMITS: 'POLICY_MANAGEMENT.MANAGE_LIMITS',
  
  // Copay Management
  VIEW_COPAY: 'POLICY_MANAGEMENT.VIEW_COPAY',
  MANAGE_COPAY: 'POLICY_MANAGEMENT.MANAGE_COPAY',

  // LOS Threshold Management
  VIEW_THRESHOLDS: 'POLICY_MANAGEMENT.VIEW_THRESHOLDS',
  MANAGE_THRESHOLDS: 'POLICY_MANAGEMENT.MANAGE_THRESHOLDS'
} as const;

export const POLICY_HOLDERS_PERMISSIONS = {
  // Main Member Operations
  VIEW: 'POLICY_HOLDERS.VIEW',
  CREATE: 'POLICY_HOLDERS.CREATE',
  UPDATE: 'POLICY_HOLDERS.UPDATE',
  DELETE: 'POLICY_HOLDERS.DELETE',
  DEACTIVATE: 'POLICY_HOLDERS.DEACTIVATE',
  
  // Address Management
  VIEW_ADDRESSES: 'POLICY_HOLDERS.VIEW_ADDRESSES',
  MANAGE_ADDRESSES: 'POLICY_HOLDERS.MANAGE_ADDRESSES',
  
  // Contact Management
  VIEW_CONTACTS: 'POLICY_HOLDERS.VIEW_CONTACTS',
  MANAGE_CONTACTS: 'POLICY_HOLDERS.MANAGE_CONTACTS',
  
  // Policy Management
  VIEW_POLICIES: 'POLICY_HOLDERS.VIEW_POLICIES',
  MANAGE_POLICIES: 'POLICY_HOLDERS.MANAGE_POLICIES',
  
  // Dependent Management
  VIEW_DEPENDENTS: 'POLICY_HOLDERS.VIEW_DEPENDENTS',
  MANAGE_DEPENDENTS: 'POLICY_HOLDERS.MANAGE_DEPENDENTS',
  
  // PEC Management
  VIEW_PEC: 'POLICY_HOLDERS.VIEW_PEC',
  MANAGE_PEC: 'POLICY_HOLDERS.MANAGE_PEC'
} as const;

export const ADMISSIONS_PERMISSIONS = {
  // Main Admission Operations
  VIEW: 'ADMISSIONS.VIEW',
  CREATE: 'ADMISSIONS.CREATE',
  UPDATE: 'ADMISSIONS.UPDATE',
  DELETE: 'ADMISSIONS.DELETE',
  APPROVE: 'ADMISSIONS.APPROVE'
} as const;

export const CLAIMS_PERMISSIONS = {
  // Main Claims Operations
  VIEW: 'CLAIMS.VIEW',
  UPDATE: 'CLAIMS.UPDATE'
} as const;

export const MQ_OPERATIONS_PERMISSIONS = {
  VIEW: 'MQ_OPERATIONS.VIEW',
  MANAGE: 'MQ_OPERATIONS.CREATE',
  GENERATE: 'MQ_OPERATIONS.GENERATE',
  SEND_EMAIL: 'MQ_OPERATIONS.SEND_EMAIL'
} as const;

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
  USER_ROLE_ASSIGNMENT: USER_ROLE_ASSIGNMENT_PERMISSIONS,
  
  // Master Data
  BANK_MANAGEMENT: BANK_MANAGEMENT_PERMISSIONS,
  CLAUSE_MANAGEMENT: CLAUSE_MANAGEMENT_PERMISSIONS,
  LOOKUP_MANAGEMENT: LOOKUP_MANAGEMENT_PERMISSIONS,
  
  // Business Features
  HOSPITAL_MANAGEMENT: HOSPITAL_MANAGEMENT_PERMISSIONS,
  POLICY_MANAGEMENT: POLICY_MANAGEMENT_PERMISSIONS,
  POLICY_HOLDERS: POLICY_HOLDERS_PERMISSIONS,
  ADMISSIONS: ADMISSIONS_PERMISSIONS,
  CLAIMS: CLAIMS_PERMISSIONS,
  MQ_OPERATIONS: MQ_OPERATIONS_PERMISSIONS
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
  USER_ROLE_ASSIGNMENT: 'USER_ROLE_ASSIGNMENT',
  MQ_OPERATIONS: 'MQ_OPERATIONS'
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
