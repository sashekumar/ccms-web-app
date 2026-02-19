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
        res.status(400).json({ 
          success: false, 
          message: 'moduleCode and actionCode are required' 
        });
        return;
      }

      const result = await this.service.checkPermission(
        userId,
        moduleCode as string,
        actionCode as string
      );

      res.json({ 
        success: true, 
        data: result 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error checking permission', 
        error: error.message 
      });
    }
  };

  /**
   * Get all permissions for current user
   * GET /api/permissions/user
   */
  public getUserPermissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;

      const permissions = await this.service.getUserPermissions(userId);

      res.json({ 
        success: true, 
        data: permissions 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching user permissions', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
        return;
      }

      const permissions = await this.service.getUserPermissions(userId);

      res.json({ 
        success: true, 
        data: permissions 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching user permissions', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'user_id and role_id are required' 
        });
        return;
      }

      await this.service.assignRole(dto, assignedBy);

      res.json({ 
        success: true, 
        message: 'Role assigned successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error assigning role', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID or role ID' 
        });
        return;
      }

      await this.service.detachRole(userId, roleId);

      res.json({ 
        success: true, 
        message: 'Role detached successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error detaching role', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
        return;
      }

      const roleIds = await this.service.getUserRoles(userId);

      res.json({ 
        success: true, 
        data: { roleIds } 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching user roles', 
        error: error.message 
      });
    }
  };

  /**
   * Get all roles
   * GET /api/roles
   */
  public getAllRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      const roles = await this.service.getAllRoles();

      res.json({ 
        success: true, 
        data: roles 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching roles', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Invalid role ID' 
        });
        return;
      }

      const role = await this.service.getRoleById(roleId);

      if (!role) {
        res.status(404).json({ 
          success: false, 
          message: 'Role not found' 
        });
        return;
      }

      res.json({ 
        success: true, 
        data: role 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching role', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Invalid role ID' 
        });
        return;
      }

      const permissions = await this.service.getRolePermissions(roleId);

      res.json({ 
        success: true, 
        data: permissions 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching role permissions', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Invalid role ID' 
        });
        return;
      }

      const permissions = await this.service.getRolePermissionsMatrix(roleId);

      res.json({ 
        success: true, 
        data: permissions 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching role permissions matrix', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'role_name and role_code are required' 
        });
        return;
      }

      const roleId = await this.service.createRole(dto, createdBy);

      res.status(201).json({ 
        success: true, 
        message: 'Role created successfully', 
        data: { roleId } 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error creating role', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Invalid role ID' 
        });
        return;
      }

      await this.service.updateRole(roleId, dto, updatedBy);

      res.json({ 
        success: true, 
        message: 'Role updated successfully' 
      });
    } catch (error: any) {
      if (error.message === 'Cannot modify system roles') {
        res.status(403).json({ 
          success: false, 
          message: error.message 
        });
        return;
      }

      res.status(500).json({ 
        success: false, 
        message: 'Error updating role', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Invalid role ID' 
        });
        return;
      }

      await this.service.deleteRole(roleId);

      res.json({ 
        success: true, 
        message: 'Role deleted successfully' 
      });
    } catch (error: any) {
      if (error.message === 'Cannot delete system roles') {
        res.status(403).json({ 
          success: false, 
          message: error.message 
        });
        return;
      }

      res.status(500).json({ 
        success: false, 
        message: 'Error deleting role', 
        error: error.message 
      });
    }
  };

  /**
   * Get all modules
   * GET /api/modules
   */
  public getAllModules = async (req: Request, res: Response): Promise<void> => {
    try {
      const modules = await this.service.getAllModules();

      res.json({ 
        success: true, 
        data: modules 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching modules', 
        error: error.message 
      });
    }
  };

  /**
   * Get all actions
   * GET /api/actions
   */
  public getAllActions = async (req: Request, res: Response): Promise<void> => {
    try {
      const actions = await this.service.getAllActions();

      res.json({ 
        success: true, 
        data: actions 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching actions', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'moduleName and moduleCode are required' 
        });
        return;
      }

      const moduleId = await this.service.createModule(data, createdBy);

      res.json({ 
        success: true, 
        message: 'Module created successfully',
        data: { moduleId }
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error creating module', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Valid moduleId is required' 
        });
        return;
      }

      await this.service.updateModule(parseInt(moduleId), data, updatedBy);

      res.json({ 
        success: true, 
        message: 'Module updated successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error updating module', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Valid moduleId is required' 
        });
        return;
      }

      await this.service.deleteModule(moduleId);

      res.json({ 
        success: true, 
        message: 'Module deleted successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting module', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'actionName and actionCode are required' 
        });
        return;
      }

      const actionId = await this.service.createAction(data, createdBy);

      res.json({ 
        success: true, 
        message: 'Action created successfully',
        data: { actionId }
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error creating action', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Valid actionId is required' 
        });
        return;
      }

      await this.service.updateAction(parseInt(actionId), data, updatedBy);

      res.json({ 
        success: true, 
        message: 'Action updated successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error updating action', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Valid actionId is required' 
        });
        return;
      }

      await this.service.deleteAction(actionId);

      res.json({ 
        success: true, 
        message: 'Action deleted successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting action', 
        error: error.message 
      });
    }
  };

  /**
   * Get all module-actions
   * POST /api/permissions/module-actions/list
   */
  public getAllModuleActions = async (req: Request, res: Response): Promise<void> => {
    try {
      const moduleActions = await this.service.getAllModuleActions();

      res.json({ 
        success: true, 
        data: moduleActions 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching module-actions', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'moduleId and actionId are required' 
        });
        return;
      }

      const moduleActionId = await this.service.createModuleAction(data, createdBy);

      res.json({ 
        success: true, 
        message: 'Module-Action created successfully',
        data: { moduleActionId }
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error creating module-action', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Valid moduleActionId is required' 
        });
        return;
      }

      await this.service.updateModuleAction(parseInt(moduleActionId), data, updatedBy);

      res.json({ 
        success: true, 
        message: 'Module-Action updated successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error updating module-action', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Valid moduleActionId is required' 
        });
        return;
      }

      await this.service.deleteModuleAction(moduleActionId);

      res.json({ 
        success: true, 
        message: 'Module-Action deleted successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting module-action', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'role_id and module_action_id are required' 
        });
        return;
      }

      await this.service.grantPermission(dto, grantedBy);

      res.json({ 
        success: true, 
        message: 'Permission granted successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error granting permission', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'role_id and module_action_id are required' 
        });
        return;
      }

      await this.service.revokePermission(dto);

      res.json({ 
        success: true, 
        message: 'Permission revoked successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error revoking permission', 
        error: error.message 
      });
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

      res.json({ 
        success: true, 
        data: categories 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching categories', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Invalid category ID' 
        });
        return;
      }

      const category = await this.service.getCategoryById(categoryId);

      if (!category) {
        res.status(404).json({ 
          success: false, 
          message: 'Category not found' 
        });
        return;
      }

      res.json({ 
        success: true, 
        data: category 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching category', 
        error: error.message 
      });
    }
  };

  /**
   * Create new category
   * POST /api/permissions/categories
   * Body: { category_name, category_code, description?, icon?, display_order }
   */
  public createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category_name, category_code, description, icon, display_order } = req.body;

      // Validation
      if (!category_name || !category_code || display_order === undefined) {
        res.status(400).json({ 
          success: false, 
          message: 'category_name, category_code, and display_order are required' 
        });
        return;
      }

      const categoryId = await this.service.createCategory({
        category_name,
        category_code,
        description,
        icon,
        display_order
      });

      res.status(201).json({ 
        success: true, 
        message: 'Category created successfully',
        data: { category_id: categoryId }
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error creating category', 
        error: error.message 
      });
    }
  };

  /**
   * Update category
   * PUT /api/permissions/categories/:categoryId
   * Body: { category_name?, category_code?, description?, icon?, display_order?, is_active? }
   */
  public updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryId = parseInt(req.params.categoryId);

      if (isNaN(categoryId)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid category ID' 
        });
        return;
      }

      const { category_name, category_code, description, icon, display_order, is_active } = req.body;

      // Check if at least one field is provided
      if (!category_name && !category_code && description === undefined && 
          icon === undefined && display_order === undefined && is_active === undefined) {
        res.status(400).json({ 
          success: false, 
          message: 'At least one field must be provided for update' 
        });
        return;
      }

      await this.service.updateCategory(categoryId, {
        category_name,
        category_code,
        description,
        icon,
        display_order,
        is_active
      });

      res.json({ 
        success: true, 
        message: 'Category updated successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error updating category', 
        error: error.message 
      });
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
        res.status(400).json({ 
          success: false, 
          message: 'Invalid category ID' 
        });
        return;
      }

      await this.service.deleteCategory(categoryId);

      res.json({ 
        success: true, 
        message: 'Category deleted successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting category', 
        error: error.message 
      });
    }
  };

  /**
   * Clear all permission caches
   * POST /api/permissions/clear-cache
   */
  public clearCache = async (req: Request, res: Response): Promise<void> => {
    try {
      this.service.clearAllCaches();

      res.json({ 
        success: true, 
        message: 'Permission caches cleared successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Error clearing caches', 
        error: error.message 
      });
    }
  };
}
