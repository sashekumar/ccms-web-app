/**
 * E2E Test Type Definitions
 * 
 * Following coding-standards.md principles:
 * - Type safety: Proper TypeScript types for all API responses
 * - Maintainability: Single source of truth for test types
 */

/**
 * User entity from API
 */
export interface User {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Role entity from API
 */
export interface Role {
  role_id: number;
  role_code: string;
  role_name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Permission entity from API
 */
export interface Permission {
  permission_id: number;
  module_code: string;
  action_code: string;
  permission_name: string;
  description?: string;
  is_active: boolean;
}

/**
 * Login response from API
 */
export interface LoginResponse {
  token: string;
  user: User;
  permissions?: Permission[];
}

/**
 * API error response
 */
export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
}

/**
 * ACL Category entity from API
 */
export interface Category {
  category_id: number;
  category_code: string;
  category_name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * ACL Module entity from API
 */
export interface Module {
  module_id: number;
  module_code: string;
  module_name: string;
  category_id: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * ACL Action entity from API
 */
export interface Action {
  action_id: number;
  action_code: string;
  action_name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * ACL Module-Action mapping from API
 */
export interface ModuleAction {
  module_action_id: number;
  module_id: number;
  action_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Test user credentials
 */
export interface TestCredentials {
  username: string;
  password: string;
}

/**
 * Create/Update user request
 */
export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  is_active?: boolean;
  role_id?: number;
}

/**
 * Create/Update role request
 */
export interface CreateRoleRequest {
  role_code: string;
  role_name: string;
  description?: string;
  is_active?: boolean;
}
