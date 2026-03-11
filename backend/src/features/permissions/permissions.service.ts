const NodeCache = require('node-cache');
import { PermissionsRepository } from './permissions.repository';
import { CategoriesRepository, ModulesRepository, ActionsRepository } from './repositories';
import { CACHE_KEYS, CACHE_PREFIXES, CacheKeyGenerators } from './permissions.cache-keys';
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
    const cacheKey = CacheKeyGenerators.permission(userId, moduleCode, actionCode);
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
   * @param userId User ID
   * @param roleId Optional role ID to filter permissions (for role switching)
   */
  public async getUserPermissions(userId: number, roleId?: number): Promise<UserPermissionsResponse> {
    const cacheKey = CacheKeyGenerators.userPermissions(userId, roleId);
    const cached = this.permissionCache.get(cacheKey) as UserPermissionsResponse | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const permissions = await this.repository.getUserPermissionsFormatted(userId, roleId);
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
    const cacheKey = CACHE_KEYS.ALL_ROLES;
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
    const cacheKey = CacheKeyGenerators.rolePermissions(roleId);
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
    const cacheKey = CacheKeyGenerators.rolePermissionsMatrix(roleId);
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
    const cacheKey = CACHE_KEYS.ALL_MODULES;
    const cached = this.permissionCache.get(cacheKey) as Module[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const modules = await this.modulesRepo.findAll({
      sort_by: 'display_order',
      sort_order: 'ASC'
    });
    this.permissionCache.set(cacheKey, modules, 600); // 10-minute cache

    return modules;
  }

  /**
   * Get all actions
   */
  public async getAllActions(): Promise<Action[]> {
    const cacheKey = CACHE_KEYS.ALL_ACTIONS;
    const cached = this.permissionCache.get(cacheKey) as Action[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const actions = await this.actionsRepo.findAll({
      sort_by: 'action_name',
      sort_order: 'ASC'
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
    this.permissionCache.del(CACHE_KEYS.ALL_ROLES);
    
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
    this.permissionCache.del(CACHE_KEYS.ALL_ROLES);
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
    this.permissionCache.del(CACHE_KEYS.ALL_ROLES);
    this.clearRolePermissionCache(roleId);
  }

  /**
   * Clear user permission cache
   */
  private clearUserPermissionCache(userId: number): void {
    const keys = this.permissionCache.keys();
    const userCacheKeys = keys.filter((key: string) => 
      key.startsWith(CacheKeyGenerators.userPermissionPrefix(userId)) || 
      key === CacheKeyGenerators.userPermissions(userId)
    );
    this.permissionCache.del(userCacheKeys);
  }

  /**
   * Clear role permission cache and cascade to users
   */
  private clearRolePermissionCache(roleId: number): void {
    // Clear role-specific cache
    this.permissionCache.del(CacheKeyGenerators.rolePermissions(roleId));
    this.permissionCache.del(CacheKeyGenerators.rolePermissionsMatrix(roleId));
    
    // Clear ALL user permission caches since we don't track role->user mappings in cache
    // This is a trade-off between complexity and performance
    const keys = this.permissionCache.keys();
    const userCacheKeys = keys.filter((key: string) => 
      key.startsWith(CACHE_PREFIXES.PERMISSION) || 
      key.startsWith(CACHE_PREFIXES.USER_PERMISSIONS)
    );
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
      module_name: data.module_name,
      module_code: data.module_code,
      description: data.description || null,
      category_id: data.category_id || null,
      icon: data.icon || null,
      route: data.route || null,
      display_order: data.display_order || 0,
      is_active: true
    }, createdBy);
    
    // Clear modules cache
    this.permissionCache.del(CACHE_KEYS.ALL_MODULES);
    
    return module.module_id;
  }

  /**
   * Update module
   */
  public async updateModule(moduleId: number, data: UpdateModuleDto, updatedBy: string): Promise<void> {
    const updateData: Partial<Module> = {};
    
    if (data.module_name !== undefined) updateData.module_name = data.module_name;
    if (data.module_code !== undefined) updateData.module_code = data.module_code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category_id !== undefined) updateData.category_id = data.category_id;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.route !== undefined) updateData.route = data.route;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    await this.modulesRepo.update(moduleId, updateData, updatedBy);
    
    // Clear modules cache
    this.permissionCache.del(CACHE_KEYS.ALL_MODULES);
  }

  /**
   * Delete module
   */
  public async deleteModule(moduleId: number): Promise<void> {
    await this.modulesRepo.delete(moduleId);
    
    // Clear modules cache
    this.permissionCache.del(CACHE_KEYS.ALL_MODULES);
  }

  /**
   * Create action
   */
  public async createAction(data: CreateActionDto, createdBy: string): Promise<number> {
    const action = await this.actionsRepo.create({
      action_name: data.action_name,
      action_code: data.action_code,
      description: data.description || null,
      is_active: true
    }, createdBy);
    
    // Clear actions cache
    this.permissionCache.del(CACHE_KEYS.ALL_ACTIONS);
    
    return action.action_id;
  }

  /**
   * Update action
   */
  public async updateAction(actionId: number, data: UpdateActionDto, updatedBy: string): Promise<void> {
    const updateData: Partial<Action> = {};
    
    if (data.action_name !== undefined) updateData.action_name = data.action_name;
    if (data.action_code !== undefined) updateData.action_code = data.action_code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    await this.actionsRepo.update(actionId, updateData, updatedBy);
    
    // Clear actions cache
    this.permissionCache.del(CACHE_KEYS.ALL_ACTIONS);
  }

  /**
   * Delete action
   */
  public async deleteAction(actionId: number): Promise<void> {
    await this.actionsRepo.delete(actionId);
    
    // Clear actions cache
    this.permissionCache.del(CACHE_KEYS.ALL_ACTIONS);
  }

  /**
   * Get all module-actions
   */
  public async getAllModuleActions(): Promise<ModuleActionWithDetails[]> {
    const cacheKey = CACHE_KEYS.ALL_MODULE_ACTIONS;
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
      data.module_id,
      data.action_id,
      data.action_label,
      createdBy
    );
    
    // Clear caches
    this.permissionCache.del(CACHE_KEYS.ALL_MODULE_ACTIONS);
   // Clear role permissions matrix cache since it depends on module-actions
    const keys = this.permissionCache.keys();
    const matrixKeys = keys.filter((key: string) => key.startsWith(CACHE_PREFIXES.ROLE_PERMISSIONS_MATRIX));
    this.permissionCache.del(matrixKeys);
    
    return moduleActionId;
  }

  /**
   * Update module-action
   */
  public async updateModuleAction(moduleActionId: number, data: UpdateModuleActionDto, updatedBy: string): Promise<void> {
    await this.repository.updateModuleAction(
      moduleActionId,
      data.action_label,
      data.is_active,
      updatedBy
    );
    
    // Clear caches
    this.permissionCache.del(CACHE_KEYS.ALL_MODULE_ACTIONS);
    // Clear role permissions matrix cache
    const keys = this.permissionCache.keys();
    const matrixKeys = keys.filter((key: string) => key.startsWith(CACHE_PREFIXES.ROLE_PERMISSIONS_MATRIX));
    this.permissionCache.del(matrixKeys);
  }

  /**
   * Delete module-action
   */
  public async deleteModuleAction(moduleActionId: number): Promise<void> {
    await this.repository.deleteModuleAction(moduleActionId);
    
    // Clear caches
    this.permissionCache.del(CACHE_KEYS.ALL_MODULE_ACTIONS);
    // Clear role permissions matrix cache
    const keys = this.permissionCache.keys();
    const matrixKeys = keys.filter((key: string) => key.startsWith(CACHE_PREFIXES.ROLE_PERMISSIONS_MATRIX));
    this.permissionCache.del(matrixKeys);
  }

  // ============================================================================
  // CATEGORY MANAGEMENT
  // ============================================================================

  /**
   * Get all categories
   */
  public async getAllCategories(): Promise<Category[]> {
    const cached = this.permissionCache.get(CACHE_KEYS.ALL_CATEGORIES) as Category[] | undefined;
    if (cached) {
      return cached;
    }

    const categories = await this.categoriesRepo.findAll({
      sort_by: 'display_order',
      sort_order: 'ASC'
    });
    this.permissionCache.set(CACHE_KEYS.ALL_CATEGORIES, categories);
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
  public async createCategory(dto: CreateCategoryDto, createdBy: string): Promise<number> {
    const categoryId = await this.repository.createCategory(dto, createdBy);
    
    // Clear cache
    this.permissionCache.del(CACHE_KEYS.ALL_CATEGORIES);
    // Clear user permissions cache to refresh menu
    const keys = this.permissionCache.keys();
    const userPermKeys = keys.filter((key: string) => key.startsWith(CACHE_PREFIXES.USER_PERMISSIONS));
    this.permissionCache.del(userPermKeys);
    
    return categoryId;
  }

  /**
   * Update category
   */
  public async updateCategory(categoryId: number, dto: UpdateCategoryDto, updatedBy: string): Promise<void> {
    await this.repository.updateCategory(categoryId, dto, updatedBy);
    
    // Clear cache
    this.permissionCache.del(CACHE_KEYS.ALL_CATEGORIES);
    // Clear user permissions cache to refresh menu
    const keys = this.permissionCache.keys();
    const userPermKeys = keys.filter((key: string) => key.startsWith(CACHE_PREFIXES.USER_PERMISSIONS));
    this.permissionCache.del(userPermKeys);
  }

  /**
   * Delete category
   */
  public async deleteCategory(categoryId: number): Promise<void> {
    await this.categoriesRepo.delete(categoryId);
    
    // Clear cache
    this.permissionCache.del(CACHE_KEYS.ALL_CATEGORIES);
    // Clear user permissions cache to refresh menu
    const keys = this.permissionCache.keys();
    const userPermKeys = keys.filter((key: string) => key.startsWith(CACHE_PREFIXES.USER_PERMISSIONS));
    this.permissionCache.del(userPermKeys);
  }
}
