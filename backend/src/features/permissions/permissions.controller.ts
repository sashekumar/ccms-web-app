import { Request, Response } from 'express';
import { PermissionsService } from './permissions.service';
import { 
  AssignRoleDto, 
  CreateRoleDto, 
  UpdateRoleDto,
  GrantPermissionDto,
  RevokePermissionDto,
  CreateCategoryDto,
  UpdateCategoryDto
} from './permissions.types';
import { getErrorMessage } from '../../core/utils/error.util';
import { ResponseUtil } from '../../core/utils/response.util';

export class PermissionsController {
  private service: PermissionsService;

  constructor() {
    this.service = new PermissionsService();
  }

  /**
   * Check if user has specific permission
   * GET /api/permissions/check
   * Query params: moduleCode, actionCode
   */
  public checkPermission = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId; // From auth middleware
      const { moduleCode, actionCode } = req.query;

      if (!moduleCode || !actionCode) {
        ResponseUtil.error(res, 'moduleCode and actionCode are required', 400);
        return;
      }

      const result = await this.service.checkPermission(
        userId,
        moduleCode as string,
        actionCode as string
      );

      ResponseUtil.success(res, result, 'Permission checked');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking permission', 500, getErrorMessage(error));
    }
  };

  /**
   * Get all permissions for current user
   * GET /api/permissions/user
   * Optional header: X-Active-Role-Id for role-specific permissions
   */
  public getUserPermissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      
      // Check for active role ID in header (for role switching)
      const activeRoleIdHeader = req.headers['x-active-role-id'];
      const activeRoleId = activeRoleIdHeader ? parseInt(activeRoleIdHeader as string, 10) : undefined;

      const permissions = await this.service.getUserPermissions(userId, activeRoleId);

      ResponseUtil.success(res, permissions, 'User permissions retrieved');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching user permissions', 500, getErrorMessage(error));
    }
  };

  /**
   * Get permissions for specific user (admin only)
   * GET /api/permissions/user/:userId
   */
  public getUserPermissionsById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        ResponseUtil.error(res, 'Invalid user ID', 400);
        return;
      }

      const permissions = await this.service.getUserPermissions(userId);

      ResponseUtil.success(res, permissions, 'User permissions retrieved');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching user permissions', 500, getErrorMessage(error));
    }
  };

  /**
   * Assign role to user
   * POST /api/permissions/assign-role
   * Body: { userId, roleId, expiresAt? }
   */
  public assignRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const assignedBy = (req as any).user.username;
      const dto: AssignRoleDto = req.body;

      if (!dto.user_id || !dto.role_id) {
        ResponseUtil.error(res, 'user_id and role_id are required', 400);
        return;
      }

      await this.service.assignRole(dto, assignedBy);

      ResponseUtil.success(res, 'Role assigned successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error assigning role', 500, getErrorMessage(error));
    }
  };

  /**
   * Detach role from user
   * DELETE /api/permissions/detach-role/:userId/:roleId
   */
  public detachRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      const roleId = parseInt(req.params.roleId);

      if (isNaN(userId) || isNaN(roleId)) {
        ResponseUtil.error(res, 'Invalid user ID or role ID', 400);
        return;
      }

      await this.service.detachRole(userId, roleId);

      ResponseUtil.success(res, 'Role detached successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error detaching role', 500, getErrorMessage(error));
    }
  };

  /**
   * Get user's assigned roles
   * GET /api/permissions/user/:userId/roles
   */
  public getUserRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        ResponseUtil.error(res, 'Invalid user ID', 400);
        return;
      }

      const roleIds = await this.service.getUserRoles(userId);

      ResponseUtil.success(res, { roleIds }, 'User roles retrieved');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching user roles', 500, getErrorMessage(error));
    }
  };

  /**
   * Get all roles
   * GET /api/roles
   */
  public getAllRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      const roles = await this.service.getAllRoles();

      ResponseUtil.success(res, roles, 'Roles retrieved');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching roles', 500, getErrorMessage(error));
    }
  };

  /**
   * Get role by ID
   * POST /api/permissions/roles/get
   * Body: { roleId }
   */
  public getRoleById = async (req: Request, res: Response): Promise<void> => {
    try {
      const roleId = parseInt(req.body.roleId);

      if (isNaN(roleId)) {
        ResponseUtil.error(res, 'Invalid role ID', 400);
        return;
      }

      const role = await this.service.getRoleById(roleId);

      if (!role) {
        ResponseUtil.notFound(res, 'Role not found');
        return;
      }

      ResponseUtil.success(res, role, 'Role retrieved');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching role', 500, getErrorMessage(error));
    }
  };

  /**
   * Get role permissions
   * POST /api/permissions/roles/permissions
   * Body: { roleId }
   */
  public getRolePermissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const roleId = parseInt(req.body.roleId);

      if (isNaN(roleId)) {
        ResponseUtil.error(res, 'Invalid role ID', 400);
        return;
      }

      const permissions = await this.service.getRolePermissions(roleId);

      ResponseUtil.success(res, permissions, 'Role permissions retrieved');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching role permissions', 500, getErrorMessage(error));
    }
  };

  /**
   * Get role permissions matrix (all module-action combinations with grant status)
   * POST /api/permissions/roles/permissions-matrix
   * Body: { roleId }
   */
  public getRolePermissionsMatrix = async (req: Request, res: Response): Promise<void> => {
    try {
      const roleId = parseInt(req.body.roleId);

      if (isNaN(roleId)) {
        ResponseUtil.error(res, 'Invalid role ID', 400);
        return;
      }

      const permissions = await this.service.getRolePermissionsMatrix(roleId);

      ResponseUtil.success(res, permissions, 'Role permissions matrix retrieved');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching role permissions matrix', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new role
   * POST /api/roles
   * Body: { roleName, roleCode, description? }
   */
  public createRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user.username;
      const dto: CreateRoleDto = req.body;

      if (!dto.role_name || !dto.role_code) {
        ResponseUtil.error(res, 'role_name and role_code are required', 400);
        return;
      }

      const roleId = await this.service.createRole(dto, createdBy);

      ResponseUtil.success(res, { roleId }, 'Role created successfully', 201);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating role', 500, getErrorMessage(error));
    }
  };

  /**
   * Update role
   * POST /api/permissions/roles/update
   * Body: { roleId, roleName?, roleCode?, description?, isActive? }
   */
  public updateRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user.username;
      const roleId = parseInt(req.body.roleId);
      const dto: UpdateRoleDto = req.body;

      if (isNaN(roleId)) {
        ResponseUtil.error(res, 'Invalid role ID', 400);
        return;
      }

      await this.service.updateRole(roleId, dto, updatedBy);

      ResponseUtil.success(res, 'Role updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage === 'Cannot modify system roles') {
        ResponseUtil.forbidden(res, errorMessage);
        return;
      }

      ResponseUtil.error(res, 'Error updating role', 500, errorMessage);
    }
  };

  /**
   * Delete role
   * POST /api/permissions/roles/delete
   * Body: { roleId }
   */
  public deleteRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const roleId = parseInt(req.body.roleId);

      if (isNaN(roleId)) {
        ResponseUtil.error(res, 'Invalid role ID', 400);
        return;
      }

      await this.service.deleteRole(roleId);

      ResponseUtil.success(res, 'Role deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage === 'Cannot delete system roles') {
        ResponseUtil.forbidden(res, errorMessage);
        return;
      }

      ResponseUtil.error(res, 'Error deleting role', 500, errorMessage);
    }
  };

  /**
   * Get all modules
   * GET /api/modules
   */
  public getAllModules = async (req: Request, res: Response): Promise<void> => {
    try {
      const modules = await this.service.getAllModules();

      ResponseUtil.success(res, modules, 'Modules retrieved');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching modules', 500, getErrorMessage(error));
    }
  };

  /**
   * Get all actions
   * GET /api/actions
   */
  public getAllActions = async (req: Request, res: Response): Promise<void> => {
    try {
      const actions = await this.service.getAllActions();

      ResponseUtil.success(res, actions, 'Actions retrieved');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching actions', 500, getErrorMessage(error));
    }
  };

  /**
   * Create module
   * POST /api/permissions/modules/create
   */
  public createModule = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user.username;
      const data = req.body;

      if (!data.moduleName || !data.moduleCode) {
        ResponseUtil.error(res, 'moduleName and moduleCode are required', 400);
        return;
      }

      const moduleId = await this.service.createModule(data, createdBy);

      ResponseUtil.success(res, { moduleId }, 'Module created successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating module', 500, getErrorMessage(error));
    }
  };

  /**
   * Update module
   * POST /api/permissions/modules/update
   */
  public updateModule = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user.username;
      const { moduleId, ...data } = req.body;

      if (!moduleId || isNaN(parseInt(moduleId))) {
        ResponseUtil.error(res, 'Valid moduleId is required', 400);
        return;
      }

      await this.service.updateModule(parseInt(moduleId), data, updatedBy);

      ResponseUtil.success(res, 'Module updated successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error updating module', 500, getErrorMessage(error));
    }
  };

  /**
   * Delete module
   * POST /api/permissions/modules/delete
   */
  public deleteModule = async (req: Request, res: Response): Promise<void> => {
    try {
      const moduleId = parseInt(req.body.moduleId);

      if (isNaN(moduleId)) {
        ResponseUtil.error(res, 'Valid moduleId is required', 400);
        return;
      }

      await this.service.deleteModule(moduleId);

      ResponseUtil.success(res, 'Module deleted successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deleting module', 500, getErrorMessage(error));
    }
  };

  /**
   * Create action
   * POST /api/permissions/actions/create
   */
  public createAction = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user.username;
      const data = req.body;

      if (!data.actionName || !data.actionCode) {
        ResponseUtil.error(res, 'actionName and actionCode are required', 400);
        return;
      }

      const actionId = await this.service.createAction(data, createdBy);

      ResponseUtil.success(res, { actionId }, 'Action created successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating action', 500, getErrorMessage(error));
    }
  };

  /**
   * Update action
   * POST /api/permissions/actions/update
   */
  public updateAction = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user.username;
      const { actionId, ...data } = req.body;

      if (!actionId || isNaN(parseInt(actionId))) {
        ResponseUtil.error(res, 'Valid actionId is required', 400);
        return;
      }

      await this.service.updateAction(parseInt(actionId), data, updatedBy);

      ResponseUtil.success(res, 'Action updated successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error updating action', 500, getErrorMessage(error));
    }
  };

  /**
   * Delete action
   * POST /api/permissions/actions/delete
   */
  public deleteAction = async (req: Request, res: Response): Promise<void> => {
    try {
      const actionId = parseInt(req.body.actionId);

      if (isNaN(actionId)) {
        ResponseUtil.error(res, 'Valid actionId is required', 400);
        return;
      }

      await this.service.deleteAction(actionId);

      ResponseUtil.success(res, 'Action deleted successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deleting action', 500, getErrorMessage(error));
    }
  };

  /**
   * Get all module-actions
   * POST /api/permissions/module-actions/list
   */
  public getAllModuleActions = async (req: Request, res: Response): Promise<void> => {
    try {
      const moduleActions = await this.service.getAllModuleActions();

      ResponseUtil.success(res, moduleActions, 'Module-actions retrieved');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching module-actions', 500, getErrorMessage(error));
    }
  };

  /**
   * Create module-action
   * POST /api/permissions/module-actions/create
   */
  public createModuleAction = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user.username;
      const data = req.body;

      if (!data.moduleId || !data.actionId) {
        ResponseUtil.error(res, 'moduleId and actionId are required', 400);
        return;
      }

      const moduleActionId = await this.service.createModuleAction(data, createdBy);

      ResponseUtil.success(res, { moduleActionId }, 'Module-Action created successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating module-action', 500, getErrorMessage(error));
    }
  };

  /**
   * Update module-action
   * POST /api/permissions/module-actions/update
   */
  public updateModuleAction = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user.username;
      const { moduleActionId, ...data } = req.body;

      if (!moduleActionId || isNaN(parseInt(moduleActionId))) {
        ResponseUtil.error(res, 'Valid moduleActionId is required', 400);
        return;
      }

      await this.service.updateModuleAction(parseInt(moduleActionId), data, updatedBy);

      ResponseUtil.success(res, 'Module-Action updated successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error updating module-action', 500, getErrorMessage(error));
    }
  };

  /**
   * Delete module-action
   * POST /api/permissions/module-actions/delete
   */
  public deleteModuleAction = async (req: Request, res: Response): Promise<void> => {
    try {
      const moduleActionId = parseInt(req.body.moduleActionId);

      if (isNaN(moduleActionId)) {
        ResponseUtil.error(res, 'Valid moduleActionId is required', 400);
        return;
      }

      await this.service.deleteModuleAction(moduleActionId);

      ResponseUtil.success(res, 'Module-Action deleted successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deleting module-action', 500, getErrorMessage(error));
    }
  };

  /**
   * Grant permission to role
   * POST /api/permissions/grant
   * Body: { roleId, moduleActionId }
   */
  public grantPermission = async (req: Request, res: Response): Promise<void> => {

    try {
      const grantedBy = (req as any).user.username;
      const dto: GrantPermissionDto = req.body;

      if (!dto.role_id || !dto.module_action_id) {
        ResponseUtil.error(res, 'role_id and module_action_id are required', 400);
        return;
      }

      await this.service.grantPermission(dto, grantedBy);

      ResponseUtil.success(res, 'Permission granted successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error granting permission', 500, getErrorMessage(error));
    }
  };

  /**
   * Revoke permission from role
   * POST /api/permissions/revoke
   * Body: { roleId, moduleActionId }
   */
  public revokePermission = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: RevokePermissionDto = req.body;

      if (!dto.role_id || !dto.module_action_id) {
        ResponseUtil.error(res, 'role_id and module_action_id are required', 400);
        return;
      }

      await this.service.revokePermission(dto);

      ResponseUtil.success(res, 'Permission revoked successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error revoking permission', 500, getErrorMessage(error));
    }
  };

  // ==================== CATEGORY MANAGEMENT ====================

  /**
   * Get all categories
   * GET /api/permissions/categories
   */
  public getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await this.service.getAllCategories();

      ResponseUtil.success(res, categories, 'Categories retrieved');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching categories', 500, getErrorMessage(error));
    }
  };

  /**
   * Get category by ID
   * GET /api/permissions/categories/:categoryId
   */
  public getCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryId = parseInt(req.params.categoryId);

      if (isNaN(categoryId)) {
        ResponseUtil.error(res, 'Invalid category ID', 400);
        return;
      }

      const category = await this.service.getCategoryById(categoryId);

      if (!category) {
        ResponseUtil.notFound(res, 'Category not found');
        return;
      }

      ResponseUtil.success(res, category, 'Category retrieved');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching category', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new category
   * POST /api/permissions/categories
   * Body: { category_name, category_code, description?, icon?, display_order }
   */
  public createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user.userId.toString();
      const { category_name, category_code, description, icon, display_order } = req.body;

      // Validation
      if (!category_name || !category_code || display_order === undefined) {
        ResponseUtil.error(res, 'category_name, category_code, and display_order are required', 400);
        return;
      }

      const categoryId = await this.service.createCategory({
        category_name,
        category_code,
        description,
        icon,
        display_order
      }, createdBy);

      ResponseUtil.success(res, { category_id: categoryId }, 'Category created successfully', 201);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating category', 500, getErrorMessage(error));
    }
  };

  /**
   * Update category
   * PUT /api/permissions/categories/:categoryId
   * Body: { category_name?, category_code?, description?, icon?, display_order?, is_active? }
   */
  public updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user.userId.toString();
      const categoryId = parseInt(req.params.categoryId);

      if (isNaN(categoryId)) {
        ResponseUtil.error(res, 'Invalid category ID', 400);
        return;
      }

      const { category_name, category_code, description, icon, display_order, is_active } = req.body;

      // Check if at least one field is provided
      if (!category_name && !category_code && description === undefined && 
          icon === undefined && display_order === undefined && is_active === undefined) {
        ResponseUtil.error(res, 'At least one field must be provided for update', 400);
        return;
      }

      await this.service.updateCategory(categoryId, {
        category_name,
        category_code,
        description,
        icon,
        display_order,
        is_active
      }, updatedBy);

      ResponseUtil.success(res, 'Category updated successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error updating category', 500, getErrorMessage(error));
    }
  };

  /**
   * Delete category
   * DELETE /api/permissions/categories/:categoryId
   */
  public deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryId = parseInt(req.params.categoryId);

      if (isNaN(categoryId)) {
        ResponseUtil.error(res, 'Invalid category ID', 400);
        return;
      }

      await this.service.deleteCategory(categoryId);

      ResponseUtil.success(res, 'Category deleted successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deleting category', 500, getErrorMessage(error));
    }
  };

  /**
   * Clear all permission caches
   * POST /api/permissions/clear-cache
   */
  public clearCache = async (req: Request, res: Response): Promise<void> => {
    try {
      this.service.clearAllCaches();

      ResponseUtil.success(res, 'Permission caches cleared successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error clearing caches', 500, getErrorMessage(error));
    }
  };
}
