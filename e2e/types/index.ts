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
