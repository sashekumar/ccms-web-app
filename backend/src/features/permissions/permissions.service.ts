const NodeCache = require('node-cache');
import { PermissionsRepository } from './permissions.repository';
import { CategoriesRepository, ModulesRepository, ActionsRepository } from './repositories';
import {
  UserPermissionsResponse,
  PermissionCheck,
  Role,
  Module,
  Action,
  RolePermissionSummary,
  AssignRoleDto,
  CreateRoleDto,
  UpdateRoleDto,
  GrantPermissionDto,
  RevokePermissionDto,
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateModuleDto,
  UpdateModuleDto,
  CreateActionDto,
  UpdateActionDto,
  CreateModuleActionDto,
  UpdateModuleActionDto,
  ModuleActionWithDetails
} from './permissions.types';

// 5-minute cache TTL for permissions
const PERMISSION_CACHE_TTL = 300;

export class PermissionsService {
  private permissionCache: typeof NodeCache;
  private repository: PermissionsRepository;
  private categoriesRepo: CategoriesRepository;
  private modulesRepo: ModulesRepository;
  private actionsRepo: ActionsRepository;

  constructor() {
    this.permissionCache = new NodeCache({ stdTTL: PERMISSION_CACHE_TTL, checkperiod: 60 });
    this.repository = new PermissionsRepository();
    this.categoriesRepo = new CategoriesRepository();
    this.modulesRepo = new ModulesRepository();
    this.actionsRepo = new ActionsRepository();
  }

  /**
   * Check if user has specific permission
   */
  public async checkPermission(userId: number, moduleCode: string, actionCode: string): Promise<PermissionCheck> {
    const cacheKey = `perm:${userId}:${moduleCode}:${actionCode}`;
    const cached = this.permissionCache.get(cacheKey) as boolean | undefined;

    if (cached !== undefined) {
      return { has_permission: cached };
    }

    const hasPermission = await this.repository.checkUserPermission(userId, moduleCode, actionCode);
    this.permissionCache.set(cacheKey, hasPermission);

    return { has_permission: hasPermission };
  }

  /**
   * Get all user permissions with caching
   */
  public async getUserPermissions(userId: number): Promise<UserPermissionsResponse> {
    const cacheKey = `user-perms:${userId}`;
    const cached = this.permissionCache.get(cacheKey) as UserPermissionsResponse | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const permissions = await this.repository.getUserPermissionsFormatted(userId);
    this.permissionCache.set(cacheKey, permissions);

    return permissions;
  }

  /**
   * Assign role to user
   */
  public async assignRole(dto: AssignRoleDto, assignedBy: string): Promise<void> {
    // Validate role exists
    const role = await this.repository.getRoleById(dto.role_id);
    if (!role) {
      throw new Error('Role not found');
    }

    await this.repository.assignRole(dto, assignedBy);
    
    // Clear user permission cache
    this.clearUserPermissionCache(dto.user_id);
  }

  /**
   * Detach role from user
   */
  public async detachRole(userId: number, roleId: number): Promise<void> {
    await this.repository.detachRole(userId, roleId);
    
    // Clear user permission cache
    this.clearUserPermissionCache(userId);
  }

  /**
   * Get user's assigned roles
   */
  public async getUserRoles(userId: number): Promise<number[]> {
    return await this.repository.getUserRoles(userId);
  }

  /**
   * Get all roles
   */
  public async getAllRoles(): Promise<Role[]> {
    const cacheKey = 'all-roles';
    const cached = this.permissionCache.get(cacheKey) as Role[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const roles = await this.repository.getAllRoles();
    this.permissionCache.set(cacheKey, roles, 600); // 10-minute cache for roles

    return roles;
  }

  /**
   * Get role by ID
   */
  public async getRoleById(roleId: number): Promise<Role | null> {
    return await this.repository.getRoleById(roleId);
  }

  /**
   * Get role permissions
   */
  public async getRolePermissions(roleId: number): Promise<RolePermissionSummary[]> {
    const cacheKey = `role-perms:${roleId}`;
    const cached = this.permissionCache.get(cacheKey) as RolePermissionSummary[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const permissions = await this.repository.getRolePermissions(roleId);
    this.permissionCache.set(cacheKey, permissions);

    return permissions;
  }

  /**
   * Get role permissions matrix (all module-action combinations with grant status)
   */
  public async getRolePermissionsMatrix(roleId: number): Promise<any[]> {
    const cacheKey = `role-perms-matrix:${roleId}`;
    const cached = this.permissionCache.get(cacheKey) as any[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const permissions = await this.repository.getRolePermissionsMatrix(roleId);
    this.permissionCache.set(cacheKey, permissions);

    return permissions;
  }

  /**
   * Get all modules
   */
  public async getAllModules(): Promise<Module[]> {
    const cacheKey = 'all-modules';
    const cached = this.permissionCache.get(cacheKey) as Module[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const modules = await this.modulesRepo.findAll({
      sortBy: 'display_order',
      sortOrder: 'ASC'
    });
    this.permissionCache.set(cacheKey, modules, 600); // 10-minute cache

    return modules;
  }

  /**
   * Get all actions
   */
  public async getAllActions(): Promise<Action[]> {
    const cacheKey = 'all-actions';
    const cached = this.permissionCache.get(cacheKey) as Action[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const actions = await this.actionsRepo.findAll({
      sortBy: 'action_name',
      sortOrder: 'ASC'
    });
    this.permissionCache.set(cacheKey, actions, 600); // 10-minute cache

    return actions;
  }

  /**
   * Grant permission to role
   */
  public async grantPermission(dto: GrantPermissionDto, grantedBy: string): Promise<void> {
    await this.repository.grantPermission(dto.role_id, dto.module_action_id, grantedBy);
    
    // Clear role permission cache
    this.clearRolePermissionCache(dto.role_id);
  }

  /**
   * Revoke permission from role
   */
  public async revokePermission(dto: RevokePermissionDto): Promise<void> {
    await this.repository.revokePermission(dto.role_id, dto.module_action_id);
    
    // Clear role permission cache
    this.clearRolePermissionCache(dto.role_id);
  }

  /**
   * Create new role
   */
  public async createRole(dto: CreateRoleDto, createdBy: string): Promise<number> {
    const roleId = await this.repository.createRole(
      dto.role_name,
      dto.role_code,
      dto.description || null,
      createdBy
    );
    
    // Clear all roles cache
    this.permissionCache.del('all-roles');
    
    return roleId;
  }

  /**
   * Update role
   */
  public async updateRole(roleId: number, dto: UpdateRoleDto, updatedBy: string): Promise<void> {
    // Prevent updating system roles
    const role = await this.repository.getRoleById(roleId);
    if (role && role.is_system_role) {
      throw new Error('Cannot modify system roles');
    }

    await this.repository.updateRole(
      roleId,
      dto.role_name,
      dto.role_code,
      dto.description,
      dto.is_active,
      updatedBy
    );
    
    // Clear caches
    this.permissionCache.del('all-roles');
    this.clearRolePermissionCache(roleId);
  }

  /**
   * Delete role
   */
  public async deleteRole(roleId: number): Promise<void> {
    // Additional check: prevent deletion of system roles
    const role = await this.repository.getRoleById(roleId);
    if (role && role.is_system_role) {
      throw new Error('Cannot delete system roles');
    }

    await this.repository.deleteRole(roleId);
    
    // Clear caches
    this.permissionCache.del('all-roles');
    this.clearRolePermissionCache(roleId);
  }

  /**
   * Clear user permission cache
   */
  private clearUserPermissionCache(userId: number): void {
    const keys = this.permissionCache.keys();
    const userCacheKeys = keys.filter((key: string) => 
      key.startsWith(`perm:${userId}:`) || key === `user-perms:${userId}`
    );
    this.permissionCache.del(userCacheKeys);
  }

  /**
   * Clear role permission cache and cascade to users
   */
  private clearRolePermissionCache(roleId: number): void {
    // Clear role-specific cache
    this.permissionCache.del(`role-perms:${roleId}`);
    
    // Clear ALL user permission caches since we don't track role->user mappings in cache
    // This is a trade-off between complexity and performance
    const keys = this.permissionCache.keys();
    const userCacheKeys = keys.filter((key: string) => key.startsWith('perm:') || key.startsWith('user-perms:'));
    this.permissionCache.del(userCacheKeys);
  }

  /**
   * Clear all permission caches (for admin operations)
   */
  public clearAllCaches(): void {
    this.permissionCache.flushAll();
  }

  /**
   * Create module
   */
  public async createModule(data: CreateModuleDto, createdBy: string): Promise<number> {
    const module = await this.modulesRepo.create({
      module_name: data.moduleName,
      module_code: data.moduleCode,
      description: data.description || null,
      category_id: data.categoryId || null,
      icon: data.icon || null,
      route: data.route || null,
      display_order: data.displayOrder || 0,
      is_active: true
    });
    
    // Clear modules cache
    this.permissionCache.del('all-modules');
    
    return module.module_id;
  }

  /**
   * Update module
   */
  public async updateModule(moduleId: number, data: UpdateModuleDto, updatedBy: string): Promise<void> {
    const updateData: Partial<Module> = {};
    
    if (data.moduleName !== undefined) updateData.module_name = data.moduleName;
    if (data.moduleCode !== undefined) updateData.module_code = data.moduleCode;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.route !== undefined) updateData.route = data.route;
    if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    await this.modulesRepo.update(moduleId, updateData);
    
    // Clear modules cache
    this.permissionCache.del('all-modules');
  }

  /**
   * Delete module
   */
  public async deleteModule(moduleId: number): Promise<void> {
    await this.modulesRepo.delete(moduleId);
    
    // Clear modules cache
    this.permissionCache.del('all-modules');
  }

  /**
   * Create action
   */
  public async createAction(data: CreateActionDto, createdBy: string): Promise<number> {
    const action = await this.actionsRepo.create({
      action_name: data.actionName,
      action_code: data.actionCode,
      description: data.description || null,
      is_active: true
    });
    
    // Clear actions cache
    this.permissionCache.del('all-actions');
    
    return action.action_id;
  }

  /**
   * Update action
   */
  public async updateAction(actionId: number, data: UpdateActionDto, updatedBy: string): Promise<void> {
    const updateData: Partial<Action> = {};
    
    if (data.actionName !== undefined) updateData.action_name = data.actionName;
    if (data.actionCode !== undefined) updateData.action_code = data.actionCode;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    await this.actionsRepo.update(actionId, updateData);
    
    // Clear actions cache
    this.permissionCache.del('all-actions');
  }

  /**
   * Delete action
   */
  public async deleteAction(actionId: number): Promise<void> {
    await this.actionsRepo.delete(actionId);
    
    // Clear actions cache
    this.permissionCache.del('all-actions');
  }

  /**
   * Get all module-actions
   */
  public async getAllModuleActions(): Promise<ModuleActionWithDetails[]> {
    const cacheKey = 'all-module-actions';
    const cached = this.permissionCache.get(cacheKey) as ModuleActionWithDetails[] | undefined;

    if (cached) {
      return cached;
    }

    const moduleActions = await this.repository.getAllModuleActions();
    this.permissionCache.set(cacheKey, moduleActions);

    return moduleActions;
  }

  /**
   * Create module-action
   */
  public async createModuleAction(data: CreateModuleActionDto, createdBy: string): Promise<number> {
    const moduleActionId = await this.repository.createModuleAction(
      data.moduleId,
      data.actionId,
      data.actionLabel,
      createdBy
    );
    
    // Clear caches
    this.permissionCache.del('all-module-actions');
   // Clear role permissions matrix cache since it depends on module-actions
    const keys = this.permissionCache.keys();
    const matrixKeys = keys.filter((key: string) => key.startsWith('role-perms-matrix:'));
    this.permissionCache.del(matrixKeys);
    
    return moduleActionId;
  }

  /**
   * Update module-action
   */
  public async updateModuleAction(moduleActionId: number, data: UpdateModuleActionDto, updatedBy: string): Promise<void> {
    await this.repository.updateModuleAction(
      moduleActionId,
      data.actionLabel,
      data.isActive,
      updatedBy
    );
    
    // Clear caches
    this.permissionCache.del('all-module-actions');
    // Clear role permissions matrix cache
    const keys = this.permissionCache.keys();
    const matrixKeys = keys.filter((key: string) => key.startsWith('role-perms-matrix:'));
    this.permissionCache.del(matrixKeys);
  }

  /**
   * Delete module-action
   */
  public async deleteModuleAction(moduleActionId: number): Promise<void> {
    await this.repository.deleteModuleAction(moduleActionId);
    
    // Clear caches
    this.permissionCache.del('all-module-actions');
    // Clear role permissions matrix cache
    const keys = this.permissionCache.keys();
    const matrixKeys = keys.filter((key: string) => key.startsWith('role-perms-matrix:'));
    this.permissionCache.del(matrixKeys);
  }

  // ============================================================================
  // CATEGORY MANAGEMENT
  // ============================================================================

  /**
   * Get all categories
   */
  public async getAllCategories(): Promise<Category[]> {
    const cached = this.permissionCache.get('all-categories') as Category[] | undefined;
    if (cached) {
      return cached;
    }

    const categories = await this.categoriesRepo.findAll({
      sortBy: 'display_order',
      sortOrder: 'ASC'
    });
    this.permissionCache.set('all-categories', categories);
    return categories;
  }

  /**
   * Get category by ID
   */
  public async getCategoryById(categoryId: number): Promise<Category | null> {
    return await this.categoriesRepo.findById(categoryId);
  }

  /**
   * Create new category
   */
  public async createCategory(dto: CreateCategoryDto): Promise<number> {
    const category = await this.categoriesRepo.create(dto);
    
    // Clear cache
    this.permissionCache.del('all-categories');
    // Clear user permissions cache to refresh menu
    const keys = this.permissionCache.keys();
    const userPermKeys = keys.filter((key: string) => key.startsWith('user-perms:'));
    this.permissionCache.del(userPermKeys);
    
    return category.category_id;
  }

  /**
   * Update category
   */
  public async updateCategory(categoryId: number, dto: UpdateCategoryDto): Promise<void> {
    await this.categoriesRepo.update(categoryId, dto);
    
    // Clear cache
    this.permissionCache.del('all-categories');
    // Clear user permissions cache to refresh menu
    const keys = this.permissionCache.keys();
    const userPermKeys = keys.filter((key: string) => key.startsWith('user-perms:'));
    this.permissionCache.del(userPermKeys);
  }

  /**
   * Delete category
   */
  public async deleteCategory(categoryId: number): Promise<void> {
    await this.categoriesRepo.delete(categoryId);
    
    // Clear cache
    this.permissionCache.del('all-categories');
    // Clear user permissions cache to refresh menu
    const keys = this.permissionCache.keys();
    const userPermKeys = keys.filter((key: string) => key.startsWith('user-perms:'));
    this.permissionCache.del(userPermKeys);
  }
}
