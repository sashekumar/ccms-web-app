/**
 * Application Route Constants
 * 
 * Centralized routing configuration for the entire application.
 * Use these constants instead of hardcoded route strings to:
 * - Enable type-safe navigation
 * - Prevent typos in routes
 * - Make route refactoring easier
 * - Document application structure
 * 
 * @example
 * ```typescript
 * // In components
 * this.router.navigate([APP_ROUTES.ADMIN.USERS]);
 * 
 * // In templates
 * <a [routerLink]="APP_ROUTES.ADMIN.ROLES">Roles</a>
 * 
 * // In route configuration
 * { path: APP_ROUTES.ADMIN.USERS, component: UsersComponent }
 * 
 * // With parameters
 * this.router.navigate([APP_ROUTES.USERS.detail(userId)]);
 * ```
 */

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

export const AUTH_ROUTES = {
  BASE: 'auth',
  LOGIN: 'auth/login',
  LOGOUT: 'auth/logout',
  FORGOT_PASSWORD: 'auth/forgot-password',
  RESET_PASSWORD: 'auth/reset-password'
} as const;

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

export const PUBLIC_ROUTES = {
  HOME: '',
  UNAUTHORIZED: 'unauthorized',
  NOT_FOUND: '404'
} as const;

// ============================================================================
// MAIN ROUTES
// ============================================================================

export const MAIN_ROUTES = {
  DASHBOARD: 'dashboard'
} as const;

// ============================================================================
// ADMIN ROUTES (System Administration)
// ============================================================================

export const ADMIN_ROUTES = {
  BASE: 'admin',
  
  // User Management
  USERS: 'admin/users',
  
  // Permission Control System
  ROLES: 'admin/roles',
  CATEGORIES: 'admin/categories',
  MODULES: 'admin/modules',
  ACTIONS: 'admin/actions',
  MODULE_ACTIONS: 'admin/module-actions',
  ROLE_PERMISSIONS: 'admin/role-permissions',
  USER_ROLES: 'admin/user-roles'
} as const;

// ============================================================================
// CLAIMS MANAGEMENT ROUTES
// ============================================================================

export const CLAIMS_ROUTES = {
  BASE: 'claims',
  LIST: 'claims',
  CREATE: 'claims/new',
  DETAIL: (id: string | number) => `claims/${id}`,
  EDIT: (id: string | number) => `claims/${id}/edit`
} as const;

// ============================================================================
// ADMISSIONS MANAGEMENT ROUTES
// ============================================================================

export const ADMISSIONS_ROUTES = {
  BASE: 'admissions',
  LIST: 'admissions',
  CREATE: 'admissions/create',
  DETAIL: (id: string | number) => `admissions/${id}`,
  EDIT: (id: string | number) => `admissions/${id}/edit`
} as const;

// ============================================================================
// MEMBERS / POLICY HOLDERS ROUTES
// ============================================================================

export const MEMBERS_ROUTES = {
  BASE: 'members',
  LIST: 'members',
  CREATE: 'members/create',
  DETAIL: (id: string | number) => `members/${id}`,
  EDIT: (id: string | number) => `members/${id}/edit`
} as const;

// ============================================================================
// HOSPITALS MANAGEMENT ROUTES
// ============================================================================

export const HOSPITALS_ROUTES = {
  BASE: 'hospitals',
  LIST: 'hospitals',
  CREATE: 'hospitals/create',
  DETAIL: (id: string | number) => `hospitals/view/${id}`,
  EDIT: (id: string | number) => `hospitals/edit/${id}`
} as const;

// ============================================================================
// PRODUCTS / POLICIES MANAGEMENT ROUTES
// ============================================================================

export const PRODUCTS_ROUTES = {
  BASE: 'products',
  LIST: 'products',
  CREATE: 'products/create',
  DETAIL: (id: string | number) => `products/view/${id}`,
  EDIT: (id: string | number) => `products/edit/${id}`
} as const;

// ============================================================================
// ADMIN - USERS SUBMODULE
// ============================================================================

export const ADMIN_USERS_ROUTES = {
  BASE: 'admin/users',
  LIST: 'admin/users',
  CREATE: 'admin/users/create',
  DETAIL: (id: string | number) => `admin/users/view/${id}`,
  EDIT: (id: string | number) => `admin/users/edit/${id}`,
  ROLES: (id: string | number) => `admin/users/roles/${id}`
} as const;

// ============================================================================
// ADMIN - ROLES SUBMODULE
// ============================================================================

export const ADMIN_ROLES_ROUTES = {
  BASE: 'admin/roles',
  LIST: 'admin/roles',
  CREATE: 'admin/roles/create',
  EDIT: (id: string | number) => `admin/roles/edit/${id}`,
  PERMISSIONS: (id: string | number) => `admin/roles/permissions/${id}`
} as const;

// ============================================================================
// CONSOLIDATED APP ROUTES
// ============================================================================

export const APP_ROUTES = {
  AUTH: AUTH_ROUTES,
  PUBLIC: PUBLIC_ROUTES,
  MAIN: MAIN_ROUTES,
  ADMIN: ADMIN_ROUTES,
  // Feature routes
  CLAIMS: CLAIMS_ROUTES,
  ADMISSIONS: ADMISSIONS_ROUTES,
  MEMBERS: MEMBERS_ROUTES,
  HOSPITALS: HOSPITALS_ROUTES,
  PRODUCTS: PRODUCTS_ROUTES,
  // Admin submodule routes
  ADMIN_USERS: ADMIN_USERS_ROUTES,
  ADMIN_ROLES: ADMIN_ROLES_ROUTES
} as const;

// ============================================================================
// ROUTE HELPER FUNCTIONS
// ============================================================================

/**
 * Build a route with parameters
 * 
 * @example
 * ```typescript
 * buildRoute('claims/detail/:id', { id: 123 })
 * // Returns: 'claims/detail/123'
 * 
 * buildRoute('claims/:id/edit/:action', { id: 123, action: 'approve' })
 * // Returns: 'claims/123/edit/approve'
 * ```
 */
export function buildRoute(template: string, params: Record<string, string | number | boolean>): string {
  return template.replace(/:(\w+)/g, (_, key) => {
    const value = params[key];
    if (value === undefined || value === null) {
      throw new Error(`Missing parameter: ${key} for route: ${template}`);
    }
    return String(value);
  });
}

/**
 * Check if a route path matches a template
 * 
 * @example
 * ```typescript
 * matchesRoute('claims/detail/123', 'claims/detail/:id')
 * // Returns: true
 * ```
 */
export function matchesRoute(path: string, template: string): boolean {
  const pattern = template.replace(/:(\w+)/g, '([^/]+)');
  const regex = new RegExp(`^${pattern}$`);
  return regex.test(path);
}

/**
 * Extract parameters from a route path
 * 
 * @example
 * ```typescript
 * extractRouteParams('claims/detail/123', 'claims/detail/:id')
 * // Returns: { id: '123' }
 * ```
 */
export function extractRouteParams(path: string, template: string): Record<string, string> {
  const paramNames: string[] = [];
  const pattern = template.replace(/:(\w+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  
  const regex = new RegExp(`^${pattern}$`);
  const match = path.match(regex);
  
  if (!match) {
    return {};
  }
  
  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });
  
  return params;
}
