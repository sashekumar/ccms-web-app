// Permission Control Types

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
  updated_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
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
  created_at: Date;
  updated_at: Date | null;
}

export interface ModuleAction {
  module_action_id: number;
  module_id: number;
  action_id: number;
  action_label: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface ModuleActionWithDetails extends ModuleAction {
  module_name: string;
  module_code: string;
  action_name: string;
  action_code: string;
}

export interface RolePermission {
  permission_id: number;
  role_id: number;
  module_action_id: number;
  granted: boolean;
  created_at: Date;
  created_by: string | null;
}

export interface UserRole {
  user_role_id: number;
  user_id: number;
  role_id: number;
  is_active: boolean;
  assigned_at: Date;
  assigned_by: string | null;
  expires_at: Date | null;
}

export interface UserPermission {
  user_id: number;
  username: string;
  full_name: string;
  role_id: number;
  role_name: string;
  role_code: string;
  module_id: number;
  module_name: string;
  module_code: string;
  module_icon: string | null;
  module_route: string | null;
  module_display_order: number;
  category_id: number | null;
  category_name: string | null;
  category_code: string | null;
  category_icon: string | null;
  category_display_order: number | null;
  action_id: number;
  action_name: string;
  action_code: string;
  module_action_id: number;
  action_label: string | null;
  permission_id: number;
  granted: boolean;
  role_active: boolean;
  role_expires_at: Date | null;
}

export interface PermissionCheck {
  has_permission: boolean;
}

export interface UserPermissionsResponse {
  categories: {
    category_code: string | null;
    category_name: string | null;
    category_icon: string | null;
    display_order: number;
    modules: {
      module_code: string;
      module_name: string;
      module_route: string | null;
      icon: string | null;
      display_order: number;
      actions: {
        action_code: string;
        action_name: string;
      }[];
    }[];
  }[];
  // Modules without category (for backward compatibility)
  uncategorized_modules: {
    module_code: string;
    module_name: string;
    module_route: string | null;
    icon: string | null;
    display_order: number;
    actions: {
      action_code: string;
      action_name: string;
    }[];
  }[];
}

export interface RolePermissionSummary {
  role_id: number;
  role_name: string;
  role_code: string;
  module_id: number;
  module_name: string;
  module_code: string;
  action_id: number;
  action_name: string;
  action_code: string;
  module_action_id: number;
  permission_key: string;
  permission_label: string;
  granted: boolean;
}

export interface RolePermissionSummary {
  role_id: number;
  role_name: string;
  module_code: string;
  module_name: string;
  action_code: string;
  action_name: string;
  granted: boolean;
}

export interface AssignRoleDto {
  user_id: number;
  role_id: number;
  expires_at?: Date;
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

export interface CreateModuleDto {
  moduleName: string;
  moduleCode: string;
  description?: string;
  categoryId?: number;
  icon?: string;
  route?: string;
  displayOrder?: number;
}

export interface UpdateModuleDto {
  moduleName?: string;
  moduleCode?: string;
  description?: string;
  categoryId?: number;
  icon?: string;
  route?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CreateActionDto {
  actionName: string;
  actionCode: string;
  description?: string;
}

export interface UpdateActionDto {
  actionName?: string;
  actionCode?: string;
  description?: string;
  isActive?: boolean;
}

export interface GrantPermissionDto {
  role_id: number;
  module_action_id: number;
}

export interface RevokePermissionDto {
  role_id: number;
  module_action_id: number;
}

export interface CreateModuleActionDto {
  moduleId: number;
  actionId: number;
  actionLabel?: string;
}

export interface UpdateModuleActionDto {
  actionLabel?: string | null;
  isActive?: boolean;
}

export interface CreateCategoryDto {
  category_name: string;
  category_code: string;
  description?: string | null;
  icon?: string | null;
  display_order: number;
}

export interface UpdateCategoryDto {
  category_name?: string;
  category_code?: string;
  description?: string | null;
  icon?: string | null;
  display_order?: number;
  is_active?: boolean;
}
