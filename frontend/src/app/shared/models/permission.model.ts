/**
 * Permission-related models and interfaces
 */

export interface Category {
  category_id: number;
  category_name: string;
  category_code: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

export interface Role {
  role_id: number;
  role_name: string;
  role_code: string;
  description: string | null;
  is_system_role: boolean;
  is_active: boolean;
  created_at: Date;
  created_by: string;
}

export interface Module {
  module_id: number;
  module_name: string;
  module_code: string;
  description: string | null;

  category_id: number | null;
  icon: string | null;
  route: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

export interface Action {
  action_id: number;
  action_name: string;
  action_code: string;
  description: string | null;
  is_active: boolean;
}

export interface ModuleAction {
  module_action_id: number;
  module_id: number;
  action_id: number;
  action_label: string | null;
  is_active: boolean;
  created_at: Date;
  module_name?: string;
  module_code?: string;
  action_name?: string;
  action_code?: string;
}

export interface UserPermission {
  user_id: number;
  username: string;
  role_id: number;
  role_name: string;
  role_code: string;
  module_id: number;
  module_code: string;
  module_name: string;
  module_route: string | null;
  action_id: number;
  action_code: string;
  action_name: string;
}

export interface ModulePermissions {
  module_code: string;
  module_name: string;
  module_route: string | null;
  icon: string | null;
  display_order?: number;
  actions: {
    action_code: string;
    action_name: string;
  }[];
}

export interface CategoryPermissions {
  category_code: string | null;
  category_name: string | null;
  category_icon: string | null;
  display_order: number;
  modules: ModulePermissions[];
}

export interface UserPermissionsResponse {
  categories: CategoryPermissions[];
  uncategorized_modules: ModulePermissions[];
  // Keep old structure for backward compatibility
  modules?: ModulePermissions[];
}

export interface PermissionCheck {
  has_permission: boolean;
}

export interface RolePermissionSummary {
  role_id: number;
  role_name: string;
  role_code: string;
  module_id: number;
  module_code: string;
  module_name: string;
  action_id: number;
  action_code: string;
  action_name: string;
  module_action_id: number;
  permission_key: string;
  permission_label: string;
  granted: boolean;
}

export interface AssignRoleDto {
  user_id: number;
  role_id: number;
  expires_at?: Date | null;
}

export interface CreateRoleDto {
  role_name: string;
  role_code: string;
  description?: string;
}

export interface UpdateRoleDto {
  role_name?: string;
  role_code?: string;
  description?: string;
  is_active?: boolean;
}

export interface GrantPermissionDto {
  role_id: number;
  module_action_id: number;
}

export interface RevokePermissionDto {
  role_id: number;
  module_action_id: number;
}

// Module DTOs
export interface CreateModuleDto {
  module_name: string;
  module_code: string;
  description?: string;
  category_id?: number;
  icon?: string;
  route?: string;
  display_order: number;
}

export interface UpdateModuleDto {
  module_name?: string;
  module_code?: string;
  description?: string;
  category_id?: number;
  icon?: string;
  route?: string;
  display_order?: number;
  is_active?: boolean;
}

// Action DTOs
export interface CreateActionDto {
  action_name: string;
  action_code: string;
  description?: string;
}

export interface UpdateActionDto {
  action_name?: string;
  action_code?: string;
  description?: string;
  is_active?: boolean;
}

// Module Action DTOs
export interface CreateModuleActionDto {
  module_id: number;
  action_id: number;
  action_label?: string;
}

export interface UpdateModuleActionDto {
  module_id?: number;
  action_id?: number;
  action_label?: string;
  is_active?: boolean;
}

// Permission Matrix Item (for role permissions matrix)
export interface PermissionMatrixItem {
  module_action_id: number;
  module_id: number;
  module_code: string;
  module_name: string;
  action_id: number;
  action_code: string;
  action_name: string;
  action_label: string | null;
  granted: boolean;
  category_id: number | null;
  category_name: string | null;
  display_order: number;
}
