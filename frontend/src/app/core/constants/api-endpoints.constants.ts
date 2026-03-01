/**
 * API Endpoint Constants
 * 
 * Centralized API endpoint configuration for the entire application.
 * Use these constants instead of hardcoded URLs to:
 * - Enable type-safe API calls
 * - Prevent typos in endpoints
 * - Make API refactoring easier
 * - Document API structure
 * - Easy environment switching (dev/staging/prod)
 * 
 * @example
 * ```typescript
 * // Simple endpoint
 * this.http.post(API_ENDPOINTS.USERS.CREATE, userData);
 * 
 * // Parameterized endpoint
 * this.http.get(API_ENDPOINTS.USERS.getById(userId));
 * 
 * // Nested endpoints
 * this.http.post(API_ENDPOINTS.PERMISSIONS.ROLES.CREATE, roleData);
 * ```
 */

// Base API path - empty because environment.apiUrl already includes '/api'
// Note: All endpoints are relative paths without leading slash to avoid double slashes
const API_BASE = '';

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

export const AUTH_ENDPOINTS = {
  LOGIN: `auth/login`,
  LOGOUT: `auth/logout`,
  REFRESH: `auth/refresh`,
  ME: `auth/me`,
  CSRF_TOKEN: `auth/csrf-token`,
  CHANGE_PASSWORD: `auth/change-password`
} as const;

// ============================================================================
// USER MANAGEMENT ENDPOINTS
// ============================================================================

export const USERS_ENDPOINTS = {
  LIST: `users/list`,
  CREATE: `users`,
  CHECK_USERNAME: `users/check-username`,
  
  // Parameterized endpoints
  getById: (id: number) => `users/${id}`,
  update: (id: number) => `users/${id}`,
  delete: (id: number) => `users/${id}`
} as const;

// ============================================================================
// PERMISSION MANAGEMENT ENDPOINTS
// ============================================================================

export const PERMISSIONS_ENDPOINTS = {
  // Permission checks
  CHECK: `permissions/check`,
  GRANT: `permissions/grant`,
  REVOKE: `permissions/revoke`,
  
  // User Permissions
  USER: {
    GET_CURRENT: `permissions/user`,
    ASSIGN_ROLE: `permissions/assign-role`,
    
    getById: (userId: number) => `permissions/user/${userId}`,
    detachRole: (userId: number, roleId: number) => `permissions/detach-role/${userId}/${roleId}`,
    getRoles: (userId: number) => `permissions/user/${userId}/roles`
  },
  
  // Role Management
  ROLES: {
    LIST: `permissions/roles/list`,
    GET: `permissions/roles/get`,
    CREATE: `permissions/roles/create`,
    UPDATE: `permissions/roles/update`,
    DELETE: `permissions/roles/delete`,
    PERMISSIONS: `permissions/roles/permissions`,
    PERMISSIONS_MATRIX: `permissions/roles/permissions-matrix`
  },
  
  // Category Management
  CATEGORIES: {
    LIST: `permissions/categories`,
    CREATE: `permissions/categories`,
    
    getById: (id: number) => `permissions/categories/${id}`,
    update: (id: number) => `permissions/categories/${id}`,
    delete: (id: number) => `permissions/categories/${id}`
  },
  
  // Module Management
  MODULES: {
    LIST: `permissions/modules/list`,
    CREATE: `permissions/modules/create`,
    UPDATE: `permissions/modules/update`,
    DELETE: `permissions/modules/delete`
  },
  
  // Action Management
  ACTIONS: {
    LIST: `permissions/actions/list`,
    CREATE: `permissions/actions/create`,
    UPDATE: `permissions/actions/update`,
    DELETE: `permissions/actions/delete`
  },
  
  // Module Action Management
  MODULE_ACTIONS: {
    LIST: `permissions/module-actions/list`,
    CREATE: `permissions/module-actions/create`,
    UPDATE: `permissions/module-actions/update`,
    DELETE: `permissions/module-actions/delete`
  }
} as const;

// ============================================================================
// MASTER DATA ENDPOINTS
// ============================================================================

export const BANKS_ENDPOINTS = {
  LIST: `master/banks/list`,
  GET: `master/banks/get`,
  CREATE: `master/banks/create`,
  UPDATE: `master/banks/update`,
  DELETE: `master/banks/delete`,
  CHECK_CODE: `master/banks/check-code`
} as const;

export const CLAUSES_ENDPOINTS = {
  LIST: `master/clauses/list`,
  GET: `master/clauses/get`,
  CREATE: `master/clauses/create`,
  UPDATE: `master/clauses/update`,
  DELETE: `master/clauses/delete`,
  CHECK_CODE: `master/clauses/check-code`
} as const;

export const LOOKUPS_ENDPOINTS = {
  // Category Management
  CATEGORIES: {
    LIST: `master/lookups/categories/list`,
    SINGLE: `master/lookups/categories/single`,
    CREATE: `master/lookups/categories/create`,
    UPDATE: `master/lookups/categories/update`,
    DELETE: `master/lookups/categories/delete`,
    CHECK_CODE: `master/lookups/categories/check-code`
  },
  
  // Lookup Management
  LIST: `master/lookups/list`,
  ALL: `master/lookups/all`,
  SINGLE: `master/lookups/single`,
  CREATE: `master/lookups/create`,
  UPDATE: `master/lookups/update`,
  DELETE: `master/lookups/delete`,
  CHECK_CODE: `master/lookups/check-code`,
  
  // Metadata Management
  METADATA: {
    LIST: `master/lookups/metadata/list`,
    SINGLE: `master/lookups/metadata/single`,
    CREATE: `master/lookups/metadata/create`,
    UPDATE: `master/lookups/metadata/update`,
    DELETE: `master/lookups/metadata/delete`,
    CHECK_KEY: `master/lookups/metadata/check-key`
  }
} as const;

// ============================================================================
// FEATURE ENDPOINTS (Business/Application Features)
// ============================================================================
// Note: Add API endpoints here as features are implemented

// ============================================================================
// CONSOLIDATED API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USERS: USERS_ENDPOINTS,
  PERMISSIONS: PERMISSIONS_ENDPOINTS,
  BANKS: BANKS_ENDPOINTS,
  CLAUSES: CLAUSES_ENDPOINTS,
  LOOKUPS: LOOKUPS_ENDPOINTS
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build API URL with query parameters
 * 
 * @example
 * ```typescript
 * buildApiUrl('/api/users/list', { page: 1, limit: 10, search: 'john' })
 * // Returns: '/api/users/list?page=1&limit=10&search=john'
 * ```
 */
export function buildApiUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

/**
 * Get base API path (empty since environment.apiUrl includes it)
 * Note: Use environment.apiUrl for the full base URL including '/api'
 */
export function getApiBaseUrl(): string {
  return API_BASE;
}

/**
 * Build full URL with protocol and host (for external links or downloads)
 * 
 * @example
 * ```typescript
 * buildFullUrl('/api/download/report/123')
 * // Returns: 'http://localhost:3000/api/download/report/123'
 * ```
 */
export function buildFullUrl(endpoint: string): string {
  // SSR compatibility check
  if (typeof window === 'undefined') {
    // Fallback for SSR - return relative path or configured base URL
    return endpoint;
  }
  
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}${endpoint}`;
}
