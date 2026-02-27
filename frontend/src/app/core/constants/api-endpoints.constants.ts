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
const API_BASE = '';

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE}/auth/login`,
  LOGOUT: `${API_BASE}/auth/logout`,
  REFRESH: `${API_BASE}/auth/refresh`,
  ME: `${API_BASE}/auth/me`,
  CSRF_TOKEN: `${API_BASE}/auth/csrf-token`,
  CHANGE_PASSWORD: `${API_BASE}/auth/change-password`
} as const;

// ============================================================================
// USER MANAGEMENT ENDPOINTS
// ============================================================================

export const USERS_ENDPOINTS = {
  LIST: `${API_BASE}/users/list`,
  CREATE: `${API_BASE}/users`,
  CHECK_USERNAME: `${API_BASE}/users/check-username`,
  
  // Parameterized endpoints
  getById: (id: number) => `${API_BASE}/users/${id}`,
  update: (id: number) => `${API_BASE}/users/${id}`,
  delete: (id: number) => `${API_BASE}/users/${id}`
} as const;

// ============================================================================
// PERMISSION MANAGEMENT ENDPOINTS
// ============================================================================

export const PERMISSIONS_ENDPOINTS = {
  // Permission checks
  CHECK: `${API_BASE}/permissions/check`,
  GRANT: `${API_BASE}/permissions/grant`,
  REVOKE: `${API_BASE}/permissions/revoke`,
  
  // User Permissions
  USER: {
    GET_CURRENT: `${API_BASE}/permissions/user`,
    ASSIGN_ROLE: `${API_BASE}/permissions/assign-role`,
    
    getById: (userId: number) => `${API_BASE}/permissions/user/${userId}`,
    detachRole: (userId: number, roleId: number) => `${API_BASE}/permissions/detach-role/${userId}/${roleId}`,
    getRoles: (userId: number) => `${API_BASE}/permissions/user/${userId}/roles`
  },
  
  // Role Management
  ROLES: {
    LIST: `${API_BASE}/permissions/roles/list`,
    GET: `${API_BASE}/permissions/roles/get`,
    CREATE: `${API_BASE}/permissions/roles/create`,
    UPDATE: `${API_BASE}/permissions/roles/update`,
    DELETE: `${API_BASE}/permissions/roles/delete`,
    PERMISSIONS: `${API_BASE}/permissions/roles/permissions`,
    PERMISSIONS_MATRIX: `${API_BASE}/permissions/roles/permissions-matrix`
  },
  
  // Category Management
  CATEGORIES: {
    LIST: `${API_BASE}/permissions/categories`,
    CREATE: `${API_BASE}/permissions/categories`,
    
    getById: (id: number) => `${API_BASE}/permissions/categories/${id}`,
    update: (id: number) => `${API_BASE}/permissions/categories/${id}`,
    delete: (id: number) => `${API_BASE}/permissions/categories/${id}`
  },
  
  // Module Management
  MODULES: {
    LIST: `${API_BASE}/permissions/modules/list`,
    CREATE: `${API_BASE}/permissions/modules/create`,
    UPDATE: `${API_BASE}/permissions/modules/update`,
    DELETE: `${API_BASE}/permissions/modules/delete`
  },
  
  // Action Management
  ACTIONS: {
    LIST: `${API_BASE}/permissions/actions/list`,
    CREATE: `${API_BASE}/permissions/actions/create`,
    UPDATE: `${API_BASE}/permissions/actions/update`,
    DELETE: `${API_BASE}/permissions/actions/delete`
  },
  
  // Module Action Management
  MODULE_ACTIONS: {
    LIST: `${API_BASE}/permissions/module-actions/list`,
    CREATE: `${API_BASE}/permissions/module-actions/create`,
    UPDATE: `${API_BASE}/permissions/module-actions/update`,
    DELETE: `${API_BASE}/permissions/module-actions/delete`
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
  PERMISSIONS: PERMISSIONS_ENDPOINTS
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
export function buildApiUrl(endpoint: string, params?: Record<string, any>): string {
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
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}${endpoint}`;
}
