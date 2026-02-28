import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES, DB_VIEWS, DB_PROCEDURES } from '../../core/constants';
import {
  Role,
  Module,
  Action,
  UserPermission,
  UserPermissionsResponse,
  RolePermissionSummary,
  AssignRoleDto,
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  ModuleActionWithDetails
} from './permissions.types';

export class PermissionsRepository {
  /**
   * Check if user has specific permission
   */
  public async checkUserPermission(
    userId: number,
    moduleCode: string,
    actionCode: string
  ): Promise<boolean> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('user_id', sql.BigInt, userId);
    request.input('module_code', sql.NVarChar(50), moduleCode);
    request.input('action_code', sql.NVarChar(50), actionCode);

    const result = await request.execute(DB_PROCEDURES.CHECK_USER_PERMISSION);
    
    return result.recordset.length > 0;
  }

  /**
   * Get all permissions for a user
   */
  public async getUserPermissions(userId: number): Promise<UserPermission[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT 
          user_id, username, full_name, role_id, role_name, role_code,
          module_id, module_name, module_code, module_icon, module_route, module_display_order,
          category_id, category_name, category_code, category_icon, category_display_order,
          action_id, action_name, action_code, module_action_id, action_label,
          permission_id, granted, role_active, role_expires_at
        FROM ${DB_VIEWS.USER_PERMISSIONS}
        WHERE user_id = @userId
          AND granted = 1
          AND is_permission_active = 1
        ORDER BY module_name, action_name
      `);

    return result.recordset;
  }

  /**
   * Get user permissions formatted for frontend
   * Groups modules by categories for dynamic menu generation
   */
  public async getUserPermissionsFormatted(userId: number): Promise<UserPermissionsResponse> {
    const permissions = await this.getUserPermissions(userId);
    
    // Group by category and module
    const categoriesMap = new Map<string | null, {
      category_code: string | null;
      category_name: string | null;
      category_icon: string | null;
      display_order: number;
      modules: Map<string, {
        module_code: string;
        module_name: string;
        module_route: string | null;
        icon: string | null;
        display_order: number;
        actions: { action_code: string; action_name: string }[];
      }>;
    }>();

    permissions.forEach(perm => {
      const categoryKey = perm.category_code || null;
      
      // Get or create category
      if (!categoriesMap.has(categoryKey)) {
        categoriesMap.set(categoryKey, {
          category_code: perm.category_code || null,
          category_name: perm.category_name || null,
          category_icon: perm.category_icon || null,
          display_order: perm.category_display_order || 999,
          modules: new Map()
        });
      }
      
      const category = categoriesMap.get(categoryKey)!;
      
      // Get or create module in this category
      if (!category.modules.has(perm.module_code)) {
        category.modules.set(perm.module_code, {
          module_code: perm.module_code,
          module_name: perm.module_name,
          module_route: perm.module_route,
          icon: perm.module_icon,
          display_order: perm.module_display_order || 999,
          actions: []
        });
      }
      
      const module = category.modules.get(perm.module_code)!;
      // Add action if not already present
      if (!module.actions.some(a => a.action_code === perm.action_code)) {
        module.actions.push({
          action_code: perm.action_code,
          action_name: perm.action_name
        });
      }
    });

    // Convert to array and sort categories by display_order
    const categoriesArray = Array.from(categoriesMap.entries())
      .filter(([key]) => key !== null) // Filter out uncategorized
      .map(([_, category]) => ({
        category_code: category.category_code,
        category_name: category.category_name,
        category_icon: category.category_icon,
        display_order: category.display_order,
        modules: Array.from(category.modules.values()).sort((a, b) => a.display_order - b.display_order)
      }))
      .sort((a, b) => a.display_order - b.display_order);

    // Get uncategorized modules and sort by display_order
    const uncategorized = categoriesMap.get(null);
    const uncategorizedModules = uncategorized 
      ? Array.from(uncategorized.modules.values()).sort((a, b) => a.display_order - b.display_order)
      : [];

    return {
      categories: categoriesArray,
      uncategorized_modules: uncategorizedModules
    };
  }

  /**
   * Assign role to user
   */
  public async assignRole(dto: AssignRoleDto, assignedBy: string): Promise<void> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('user_id', sql.BigInt, dto.user_id);
    request.input('role_id', sql.BigInt, dto.role_id);
    request.input('assigned_by', sql.VarChar(50), assignedBy);
    request.input('expires_at', sql.DateTime2, dto.expires_at || null);

    await request.execute(DB_PROCEDURES.ASSIGN_ROLE_TO_USER);
  }

  /**
   * Detach role from user
   */
  public async detachRole(userId: number, roleId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('roleId', sql.BigInt, roleId)
      .query(`
        UPDATE ${DB_TABLES.USER_ROLES}
        SET is_active = 0
        WHERE user_id = @userId AND role_id = @roleId
      `);
  }

  /**
   * Get user's assigned roles
   */
  public async getUserRoles(userId: number): Promise<number[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT role_id 
        FROM ${DB_TABLES.USER_ROLES}
        WHERE user_id = @userId 
          AND is_active = 1
          AND (expires_at IS NULL OR expires_at > GETDATE())
      `);

    return result.recordset.map((r: { role_id: number }) => r.role_id);

    return result.recordset;
  }

  /**
   * Get all roles
   */
  public async getAllRoles(): Promise<Role[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .query(`
        SELECT 
          role_id, role_name, role_code, description, is_system_role, is_active,
          created_at, updated_at, created_by, updated_by
        FROM ${DB_TABLES.ROLES}
        ORDER BY role_name
      `);

    return result.recordset;
  }

  /**
   * Get role by ID
   */
  public async getRoleById(roleId: number): Promise<Role | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('roleId', sql.BigInt, roleId)
      .query(`
        SELECT 
          role_id, role_name, role_code, description, is_system_role, is_active,
          created_at, updated_at, created_by, updated_by
        FROM ${DB_TABLES.ROLES}
        WHERE role_id = @roleId
      `);

    return result.recordset[0] || null;
  }

  /**
   * Get role permissions
   */
  public async getRolePermissions(roleId: number): Promise<RolePermissionSummary[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('roleId', sql.BigInt, roleId)
      .query(`
        SELECT 
          role_id, role_name, role_code, module_id, module_name, module_code,
          action_id, action_name, action_code, module_action_id, 
          permission_key, permission_label, granted
        FROM ${DB_VIEWS.ROLE_PERMISSIONS}
        WHERE role_id = @roleId
        ORDER BY module_name, action_name
      `);

    return result.recordset;
  }

  /**
   * Get all module-action combinations with permission status for a role
   */
  public async getRolePermissionsMatrix(roleId: number): Promise<any[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('roleId', sql.BigInt, roleId)
      .query(`
        SELECT 
          ma.module_action_id,
          m.module_id,
          m.module_name,
          m.module_code,
          a.action_id,
          a.action_name,
          a.action_code,
          ma.action_label,
          CASE WHEN rp.permission_id IS NOT NULL AND rp.granted = 1 THEN 1 ELSE 0 END AS granted
        FROM ${DB_TABLES.MODULE_ACTIONS} ma
        INNER JOIN ${DB_TABLES.MODULES} m ON ma.module_id = m.module_id
        INNER JOIN ${DB_TABLES.ACTIONS} a ON ma.action_id = a.action_id
        LEFT JOIN ${DB_TABLES.ROLE_PERMISSIONS} rp ON ma.module_action_id = rp.module_action_id AND rp.role_id = @roleId
        WHERE m.is_active = 1 
          AND a.is_active = 1 
          AND ma.is_active = 1
        ORDER BY m.display_order, m.module_name, a.action_name
      `);

    return result.recordset;
  }

  /**
   * Get all modules
   */
  public async getAllModules(): Promise<Module[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request().query(`
      SELECT 
        module_id, module_name, module_code, description, category_id, 
        icon, route, display_order, is_active, created_at, updated_at
      FROM ${DB_TABLES.MODULES}
      WHERE is_active = 1
      ORDER BY display_order, module_name
    `);

    return result.recordset;
  }

  /**
   * Get all actions
   */
  public async getAllActions(): Promise<Action[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request().query(`
      SELECT 
        action_id, action_name, action_code, description, 
        is_active, created_at, updated_at
      FROM ${DB_TABLES.ACTIONS}
      WHERE is_active = 1
      ORDER BY action_name
    `);

    return result.recordset;
  }

  /**
   * Grant permission to role
   */
  public async grantPermission(roleId: number, moduleActionId: number, grantedBy: string): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('roleId', sql.BigInt, roleId)
      .input('moduleActionId', sql.BigInt, moduleActionId)
      .input('grantedBy', sql.VarChar(50), grantedBy)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM ${DB_TABLES.ROLE_PERMISSIONS}
          WHERE role_id = @roleId AND module_action_id = @moduleActionId
        )
        BEGIN
          INSERT INTO ${DB_TABLES.ROLE_PERMISSIONS} (role_id, module_action_id, granted, created_by)
          VALUES (@roleId, @moduleActionId, 1, @grantedBy)
        END
        ELSE
        BEGIN
          UPDATE ${DB_TABLES.ROLE_PERMISSIONS}
          SET granted = 1
          WHERE role_id = @roleId AND module_action_id = @moduleActionId
        END
      `);
  }

  /**
   * Revoke permission from role
   */
  public async revokePermission(roleId: number, moduleActionId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('roleId', sql.BigInt, roleId)
      .input('moduleActionId', sql.BigInt, moduleActionId)
      .query(`
        UPDATE ${DB_TABLES.ROLE_PERMISSIONS}
        SET granted = 0
        WHERE role_id = @roleId AND module_action_id = @moduleActionId
      `);
  }

  /**
   * Create new role
   */
  public async createRole(
    roleName: string,
    roleCode: string,
    description: string | null,
    createdBy: string
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('roleName', sql.NVarChar(100), roleName)
      .input('roleCode', sql.NVarChar(50), roleCode)
      .input('description', sql.NVarChar(500), description)
      .input('createdBy', sql.VarChar(50), createdBy)
      .query(`
        INSERT INTO ${DB_TABLES.ROLES} (role_name, role_code, description, is_system_role, created_by)
        OUTPUT INSERTED.role_id
        VALUES (@roleName, @roleCode, @description, 0, @createdBy)
      `);

    return result.recordset[0].role_id;
  }

  /**
   * Update role
   */
  public async updateRole(
    roleId: number,
    roleName: string | undefined,
    roleCode: string | undefined,
    description: string | null | undefined,
    isActive: boolean | undefined,
    updatedBy: string
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (roleName !== undefined) {
      updates.push('role_name = @roleName');
      request.input('roleName', sql.NVarChar(100), roleName);
    }
    if (roleCode !== undefined) {
      updates.push('role_code = @roleCode');
      request.input('roleCode', sql.NVarChar(50), roleCode);
    }
    if (description !== undefined) {
      updates.push('description = @description');
      request.input('description', sql.NVarChar(500), description);
    }
    if (isActive !== undefined) {
      updates.push('is_active = @isActive');
      request.input('isActive', sql.Bit, isActive);
    }

    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');
    request.input('updatedBy', sql.VarChar(50), updatedBy);
    request.input('roleId', sql.BigInt, roleId);

    await request.query(`
      UPDATE ${DB_TABLES.ROLES}
      SET ${updates.join(', ')}
      WHERE role_id = @roleId
    `);
  }

  /**
   * Delete role (only non-system roles)
   */
  public async deleteRole(roleId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('roleId', sql.BigInt, roleId)
      .query(`
        DELETE FROM ${DB_TABLES.ROLES}
        WHERE role_id = @roleId AND is_system_role = 0
      `);
  }

  /**
   * Create module
   */
  public async createModule(
    moduleName: string,
    moduleCode: string,
    description: string | undefined,
    categoryId: number | undefined,
    icon: string | undefined,
    route: string | undefined,
    displayOrder: number | undefined,
    createdBy: string
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('moduleName', sql.NVarChar(100), moduleName)
      .input('moduleCode', sql.NVarChar(50), moduleCode)
      .input('description', sql.NVarChar(500), description || null)
      .input('categoryId', sql.BigInt, categoryId || null)
      .input('icon', sql.NVarChar(50), icon || null)
      .input('route', sql.NVarChar(255), route || null)
      .input('displayOrder', sql.Int, displayOrder || 0)
      .input('createdBy', sql.VarChar(50), createdBy)
      .query(`
        INSERT INTO ${DB_TABLES.MODULES} (module_name, module_code, description, category_id, icon, route, display_order, is_active, created_by)
        OUTPUT INSERTED.module_id
        VALUES (@moduleName, @moduleCode, @description, @categoryId, @icon, @route, @displayOrder, 1, @createdBy)
      `);

    return result.recordset[0].module_id;
  }

  /**
   * Update module
   */
  public async updateModule(
    moduleId: number,
    moduleName: string | undefined,
    moduleCode: string | undefined,
    description: string | null | undefined,
    categoryId: number | null | undefined,
    icon: string | null | undefined,
    route: string | null | undefined,
    displayOrder: number | undefined,
    isActive: boolean | undefined,
    updatedBy: string
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (moduleName !== undefined) {
      updates.push('module_name = @moduleName');
      request.input('moduleName', sql.NVarChar(100), moduleName);
    }
    if (moduleCode !== undefined) {
      updates.push('module_code = @moduleCode');
      request.input('moduleCode', sql.NVarChar(50), moduleCode);
    }
    if (description !== undefined) {
      updates.push('description = @description');
      request.input('description', sql.NVarChar(500), description);
    }
    if (categoryId !== undefined) {
      updates.push('category_id = @categoryId');
      request.input('categoryId', sql.BigInt, categoryId);
    }
    if (icon !== undefined) {
      updates.push('icon = @icon');
      request.input('icon', sql.NVarChar(50), icon);
    }
    if (route !== undefined) {
      updates.push('route = @route');
      request.input('route', sql.NVarChar(255), route);
    }
    if (displayOrder !== undefined) {
      updates.push('display_order = @displayOrder');
      request.input('displayOrder', sql.Int, displayOrder);
    }
    if (isActive !== undefined) {
      updates.push('is_active = @isActive');
      request.input('isActive', sql.Bit, isActive);
    }

    if (updates.length === 0) return;

    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');
    request.input('updatedBy', sql.VarChar(50), updatedBy);
    request.input('moduleId', sql.BigInt, moduleId);

    await request.query(`
      UPDATE ${DB_TABLES.MODULES}
      SET ${updates.join(', ')}
      WHERE module_id = @moduleId
    `);
  }

  /**
   * Delete module
   */
  public async deleteModule(moduleId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .query(`
        DELETE FROM ${DB_TABLES.MODULES}
        WHERE module_id = @moduleId
      `);
  }

  /**
   * Create action
   */
  public async createAction(
    actionName: string,
    actionCode: string,
    description: string | undefined,
    createdBy: string
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('actionName', sql.NVarChar(100), actionName)
      .input('actionCode', sql.NVarChar(50), actionCode)
      .input('description', sql.NVarChar(500), description || null)
      .input('createdBy', sql.VarChar(50), createdBy)
      .query(`
        INSERT INTO ${DB_TABLES.ACTIONS} (action_name, action_code, description, is_active, created_by)
        OUTPUT INSERTED.action_id
        VALUES (@actionName, @actionCode, @description, 1, @createdBy)
      `);

    return result.recordset[0].action_id;
  }

  /**
   * Update action
   */
  public async updateAction(
    actionId: number,
    actionName: string | undefined,
    actionCode: string | undefined,
    description: string | null | undefined,
    isActive: boolean | undefined,
    updatedBy: string
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (actionName !== undefined) {
      updates.push('action_name = @actionName');
      request.input('actionName', sql.NVarChar(100), actionName);
    }
    if (actionCode !== undefined) {
      updates.push('action_code = @actionCode');
      request.input('actionCode', sql.NVarChar(50), actionCode);
    }
    if (description !== undefined) {
      updates.push('description = @description');
      request.input('description', sql.NVarChar(500), description);
    }
    if (isActive !== undefined) {
      updates.push('is_active = @isActive');
      request.input('isActive', sql.Bit, isActive);
    }

    if (updates.length === 0) return;

    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');
    request.input('updatedBy', sql.VarChar(50), updatedBy);
    request.input('actionId', sql.BigInt, actionId);

    await request.query(`
      UPDATE ${DB_TABLES.ACTIONS}
      SET ${updates.join(', ')}
      WHERE action_id = @actionId
    `);
  }

  /**
   * Delete action
   */
  public async deleteAction(actionId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('actionId', sql.BigInt, actionId)
      .query(`
        DELETE FROM ${DB_TABLES.ACTIONS}
        WHERE action_id = @actionId
      `);
  }

  /**
   * Get all module-actions
   */
  public async getAllModuleActions(): Promise<ModuleActionWithDetails[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .query(`
        SELECT 
          ma.module_action_id,
          ma.module_id,
          ma.action_id,
          ma.action_label,
          ma.is_active,
          ma.created_at,
          m.module_name,
          m.module_code,
          a.action_name,
          a.action_code
        FROM ${DB_TABLES.MODULE_ACTIONS} ma
        INNER JOIN ${DB_TABLES.MODULES} m ON ma.module_id = m.module_id
        INNER JOIN ${DB_TABLES.ACTIONS} a ON ma.action_id = a.action_id
        ORDER BY m.module_name, a.action_name
      `);

    return result.recordset;
  }

  /**
   * Create module-action
   */
  public async createModuleAction(
    moduleId: number,
    actionId: number,
    actionLabel: string | undefined,
    createdBy: string
  ): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .input('actionId', sql.BigInt, actionId)
      .input('actionLabel', sql.NVarChar(100), actionLabel || null)
      .input('createdBy', sql.VarChar(50), createdBy)
      .query(`
        INSERT INTO ${DB_TABLES.MODULE_ACTIONS} (module_id, action_id, action_label, is_active, created_by)
        OUTPUT INSERTED.module_action_id
        VALUES (@moduleId, @actionId, @actionLabel, 1, @createdBy)
      `);

    return result.recordset[0].module_action_id;
  }

  /**
   * Update module-action
   */
  public async updateModuleAction(
    moduleActionId: number,
    actionLabel: string | null | undefined,
    isActive: boolean | undefined,
    updatedBy: string
  ): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    if (actionLabel !== undefined) {
      updates.push('action_label = @actionLabel');
      request.input('actionLabel', sql.NVarChar(100), actionLabel);
    }
    if (isActive !== undefined) {
      updates.push('is_active = @isActive');
      request.input('isActive', sql.Bit, isActive);
    }

    if (updates.length === 0) return;

    updates.push('updated_by = @updatedBy');
    updates.push('updated_at = GETDATE()');
    request.input('updatedBy', sql.VarChar(50), updatedBy);
    request.input('moduleActionId', sql.BigInt, moduleActionId);

    await request.query(`
      UPDATE ${DB_TABLES.MODULE_ACTIONS}
      SET ${updates.join(', ')}
      WHERE module_action_id = @moduleActionId
    `);
  }

  /**
   * Delete module-action
   */
  public async deleteModuleAction(moduleActionId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('moduleActionId', sql.BigInt, moduleActionId)
      .query(`
        DELETE FROM ${DB_TABLES.MODULE_ACTIONS}
        WHERE module_action_id = @moduleActionId
      `);
  }

  // ============================================================================
  // CATEGORY MANAGEMENT
  // ============================================================================

  /**
   * Get all categories
   */
  public async getAllCategories(): Promise<Category[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.request().query(`
      SELECT 
        category_id,
        category_name,
        category_code,
        description,
        icon,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM ${DB_TABLES.CATEGORIES}
      ORDER BY display_order, category_name
    `);

    return result.recordset;
  }

  /**
   * Get category by ID
   */
  public async getCategoryById(categoryId: number): Promise<Category | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('categoryId', sql.BigInt, categoryId)
      .query(`
        SELECT 
          category_id,
          category_name,
          category_code,
          description,
          icon,
          display_order,
          is_active,
          created_at,
          updated_at
        FROM ${DB_TABLES.CATEGORIES}
        WHERE category_id = @categoryId
      `);

    return result.recordset[0] || null;
  }

  /**
   * Create new category
   */
  public async createCategory(dto: CreateCategoryDto): Promise<number> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('category_name', sql.NVarChar(100), dto.category_name)
      .input('category_code', sql.NVarChar(50), dto.category_code)
      .input('description', sql.NVarChar(500), dto.description || null)
      .input('icon', sql.NVarChar(50), dto.icon || null)
      .input('display_order', sql.Int, dto.display_order)
      .query(`
        INSERT INTO ${DB_TABLES.CATEGORIES} (category_name, category_code, description, icon, display_order)
        OUTPUT INSERTED.category_id
        VALUES (@category_name, @category_code, @description, @icon, @display_order)
      `);

    return result.recordset[0].category_id;
  }

  /**
   * Update category
   */
  public async updateCategory(categoryId: number, dto: UpdateCategoryDto): Promise<void> {
    const updates: string[] = [];
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('categoryId', sql.BigInt, categoryId);

    if (dto.category_name !== undefined) {
      updates.push('category_name = @category_name');
      request.input('category_name', sql.NVarChar(100), dto.category_name);
    }

    if (dto.category_code !== undefined) {
      updates.push('category_code = @category_code');
      request.input('category_code', sql.NVarChar(50), dto.category_code);
    }

    if (dto.description !== undefined) {
      updates.push('description = @description');
      request.input('description', sql.NVarChar(500), dto.description);
    }

    if (dto.icon !== undefined) {
      updates.push('icon = @icon');
      request.input('icon', sql.NVarChar(50), dto.icon);
    }

    if (dto.display_order !== undefined) {
      updates.push('display_order = @display_order');
      request.input('display_order', sql.Int, dto.display_order);
    }

    if (dto.is_active !== undefined) {
      updates.push('is_active = @is_active');
      request.input('is_active', sql.Bit, dto.is_active);
    }

    if (updates.length === 0) {
      return;
    }

    updates.push('updated_at = GETDATE()');

    await request.query(`
      UPDATE ${DB_TABLES.CATEGORIES}
      SET ${updates.join(', ')}
      WHERE category_id = @categoryId
    `);
  }

  /**
   * Delete category
   */
  public async deleteCategory(categoryId: number): Promise<void> {
    const pool = await connectionManager.getPool();
    await pool.request()
      .input('categoryId', sql.BigInt, categoryId)
      .query(`
        DELETE FROM ${DB_TABLES.CATEGORIES}
        WHERE category_id = @categoryId
      `);
  }
}
