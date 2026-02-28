import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants';
import {
  UserPermissionsResponse,
  PermissionCheck,
  Role,
  Module,
  Action,
  ModuleAction,
  RolePermissionSummary,
  AssignRoleDto,
  CreateRoleDto,
  UpdateRoleDto,
  GrantPermissionDto,
  RevokePermissionDto,
  CreateModuleDto,
  UpdateModuleDto,
  CreateActionDto,
  UpdateActionDto,
  CreateModuleActionDto,
  UpdateModuleActionDto,
  PermissionMatrixItem,
  ModulePermissions
} from '../../shared/models/permission.model';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Permission Service - Handles permission checks and management
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  // Cache for user permissions
  private userPermissionsSubject = new BehaviorSubject<UserPermissionsResponse | null>(null);
  public userPermissions$ = this.userPermissionsSubject.asObservable();
  
  // Cache for permission checks (format: "MODULE_CODE.ACTION_CODE" => boolean)
  private permissionCache = new Map<string, boolean>();
  
  // Cache timestamp for invalidation
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private api: ApiService) {}

  /**
   * Load current user's permissions
   */
  loadUserPermissions(): Observable<UserPermissionsResponse> {
    return this.api.get<ApiResponse<UserPermissionsResponse>>(
      API_ENDPOINTS.PERMISSIONS.USER.GET_CURRENT
    ).pipe(
      map(response => {
        return response.data;
      }),
      tap(permissions => {
        // Calculate total modules from both categories and uncategorized
        const categoryModuleCount = permissions.categories?.reduce((sum, cat) => sum + cat.modules.length, 0) || 0;
        const uncategorizedCount = permissions.uncategorized_modules?.length || 0;
        const oldStructureCount = permissions.modules?.length || 0;
        const totalModules = categoryModuleCount + uncategorizedCount || oldStructureCount;
        
        this.userPermissionsSubject.next(permissions);
        this.cacheTimestamp = Date.now();
      }),
      catchError(error => {
        console.error('❌ Error loading user permissions:', error);
        return of({ 
          categories: [], 
          uncategorized_modules: [],
          modules: [] 
        } as UserPermissionsResponse);
      })
    );
  }

  /**
   * Get current user's permissions (from cache or server)
   */
  getUserPermissions(forceRefresh: boolean = false): Observable<UserPermissionsResponse> {
    const cachedPermissions = this.userPermissionsSubject.value;
    const isCacheValid = this.isCacheValid();

    if (!forceRefresh && cachedPermissions && isCacheValid) {
      return of(cachedPermissions);
    }

    return this.loadUserPermissions();
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(moduleCode: string, actionCode: string): Observable<boolean> {
    const cacheKey = `${moduleCode}.${actionCode}`;
    
    // Check cache first
    if (this.isCacheValid() && this.permissionCache.has(cacheKey)) {
      const cached = this.permissionCache.get(cacheKey)!;
      return of(cached);
    }

    // Check from user permissions in memory
    const userPermissions = this.userPermissionsSubject.value;
    const categoryModuleCount = userPermissions?.categories?.reduce((sum, cat) => sum + cat.modules.length, 0) || 0;
    const uncategorizedCount = userPermissions?.uncategorized_modules?.length || 0;
    const oldStructureCount = userPermissions?.modules?.length || 0;
    const totalModules = categoryModuleCount + uncategorizedCount || oldStructureCount;
    
    if (userPermissions && this.isCacheValid()) {
      const hasAccess = this.checkPermissionInMemory(userPermissions, moduleCode, actionCode);
      this.permissionCache.set(cacheKey, hasAccess);
      return of(hasAccess);
    }

    // Fallback to API call
    return this.api.get<ApiResponse<PermissionCheck>>(
      `${API_ENDPOINTS.PERMISSIONS.CHECK}?moduleCode=${moduleCode}&actionCode=${actionCode}`
    ).pipe(
      map(response => response.data.has_permission),
      tap(hasAccess => {
        this.permissionCache.set(cacheKey, hasAccess);
      }),
      catchError(error => {
        console.error('Error checking permission:', error);
        return of(false);
      })
    );
  }

  /**
   * Check permission synchronously from cached data
   */
  hasPermissionSync(moduleCode: string, actionCode: string): boolean {
    const cacheKey = `${moduleCode}.${actionCode}`;
    
    if (this.isCacheValid() && this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    const userPermissions = this.userPermissionsSubject.value;
    if (userPermissions && this.isCacheValid()) {
      const hasAccess = this.checkPermissionInMemory(userPermissions, moduleCode, actionCode);
      this.permissionCache.set(cacheKey, hasAccess);
      return hasAccess;
    }

    return false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: [string, string][]): Observable<boolean> {
    const userPermissions = this.userPermissionsSubject.value;
    
    if (userPermissions && this.isCacheValid()) {
      const hasAny = permissions.some(([moduleCode, actionCode]) => 
        this.checkPermissionInMemory(userPermissions, moduleCode, actionCode)
      );
      return of(hasAny);
    }

    // Fallback to checking each permission
    return new Observable(observer => {
      const checks = permissions.map(([moduleCode, actionCode]) => 
        this.hasPermission(moduleCode, actionCode)
      );
      
      Promise.all(checks.map(obs => obs.toPromise())).then(results => {
        observer.next(results.some(r => r === true));
        observer.complete();
      });
    });
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: [string, string][]): Observable<boolean> {
    const userPermissions = this.userPermissionsSubject.value;
    
    if (userPermissions && this.isCacheValid()) {
      const hasAll = permissions.every(([moduleCode, actionCode]) => 
        this.checkPermissionInMemory(userPermissions, moduleCode, actionCode)
      );
      return of(hasAll);
    }

    // Fallback to checking each permission
    return new Observable(observer => {
      const checks = permissions.map(([moduleCode, actionCode]) => 
        this.hasPermission(moduleCode, actionCode)
      );
      
      Promise.all(checks.map(obs => obs.toPromise())).then(results => {
        observer.next(results.every(r => r === true));
        observer.complete();
      });
    });
  }

  /**
   * Get permissions for a specific user (admin only)
   */
  getUserPermissionsById(userId: number): Observable<UserPermissionsResponse> {
    return this.api.get<ApiResponse<UserPermissionsResponse>>(
      API_ENDPOINTS.PERMISSIONS.USER.getById(userId)
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading user permissions:', error);
        throw error;
      })
    );
  }

  /**
   * Assign role to user
   */
  assignRole(dto: AssignRoleDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PERMISSIONS.USER.ASSIGN_ROLE,
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error assigning role:', error);
        throw error;
      })
    );
  }

  /**
   * Detach role from user
   */
  detachRole(userId: number, roleId: number): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.PERMISSIONS.USER.detachRole(userId, roleId)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error detaching role:', error);
        throw error;
      })
    );
  }

  /**
   * Get user's assigned roles
   */
  getUserRoles(userId: number): Observable<number[]> {
    return this.api.get<ApiResponse<{ roleIds: number[] }>>(
      API_ENDPOINTS.PERMISSIONS.USER.getRoles(userId)
    ).pipe(
      map(response => response.data.roleIds),
      catchError(error => {
        console.error('Error getting user roles:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all roles
   */
  getAllRoles(): Observable<Role[]> {
    return this.api.post<ApiResponse<Role[]>>(
      API_ENDPOINTS.PERMISSIONS.ROLES.LIST,
      {}
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading roles:', error);
        return of([]);
      })
    );
  }

  /**
   * Get role by ID
   */
  getRoleById(roleId: number): Observable<Role> {
    return this.api.post<ApiResponse<Role>>(
      API_ENDPOINTS.PERMISSIONS.ROLES.GET,
      { roleId }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading role:', error);
        throw error;
      })
    );
  }

  /**
   * Get role permissions
   */
  getRolePermissions(roleId: number): Observable<RolePermissionSummary[]> {
    return this.api.post<ApiResponse<RolePermissionSummary[]>>(
      API_ENDPOINTS.PERMISSIONS.ROLES.PERMISSIONS,
      { roleId }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading role permissions:', error);
        return of([]);
      })
    );
  }

  /**
   * Get role permissions matrix (all module-action combinations with grant status)
   */
  getRolePermissionsMatrix(roleId: number): Observable<PermissionMatrixItem[]> {
    return this.api.post<ApiResponse<PermissionMatrixItem[]>>(
      API_ENDPOINTS.PERMISSIONS.ROLES.PERMISSIONS_MATRIX,
      { roleId }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading role permissions matrix:', error);
        return of([]);
      })
    );
  }

  /**
   * Create new role
   */
  createRole(dto: CreateRoleDto): Observable<number> {
    return this.api.post<ApiResponse<{ roleId: number }>>(
      API_ENDPOINTS.PERMISSIONS.ROLES.CREATE,
      dto
    ).pipe(
      map(response => response.data.roleId),
      catchError(error => {
        console.error('Error creating role:', error);
        throw error;
      })
    );
  }

  /**
   * Update role
   */
  updateRole(roleId: number, dto: UpdateRoleDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PERMISSIONS.ROLES.UPDATE,
      { roleId, ...dto }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error updating role:', error);
        throw error;
      })
    );
  }

  /**
   * Delete role
   */
  deleteRole(roleId: number): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PERMISSIONS.ROLES.DELETE,
      { roleId }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting role:', error);
        throw error;
      })
    );
  }

  /**
   * Get all modules
   */
  getAllModules(): Observable<Module[]> {
    return this.api.post<ApiResponse<Module[]>>(
      API_ENDPOINTS.PERMISSIONS.MODULES.LIST,
      {}
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading modules:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all actions
   */
  getAllActions(): Observable<Action[]> {
    return this.api.post<ApiResponse<Action[]>>(
      API_ENDPOINTS.PERMISSIONS.ACTIONS.LIST,
      {}
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading actions:', error);
        return of([]);
      })
    );
  }

  /**
   * Grant permission to role
   */
  grantPermission(dto: GrantPermissionDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PERMISSIONS.GRANT,
      dto
    ).pipe(
      map(() => undefined),
      tap(() => this.clearCache()),
      catchError(error => {
        console.error('Error granting permission:', error);
        throw error;
      })
    );
  }

  /**
   * Revoke permission from role
   */
  revokePermission(dto: RevokePermissionDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PERMISSIONS.REVOKE,
      dto
    ).pipe(
      map(() => undefined),
      tap(() => this.clearCache()),
      catchError(error => {
        console.error('Error revoking permission:', error);
        throw error;
      })
    );
  }

  /**
   * Create module
   */
  createModule(data: CreateModuleDto): Observable<number> {
    return this.api.post<ApiResponse<{ moduleId: number }>>(
      API_ENDPOINTS.PERMISSIONS.MODULES.CREATE,
      data
    ).pipe(
      map(response => response.data.moduleId),
      catchError(error => {
        console.error('Error creating module:', error);
        throw error;
      })
    );
  }

  /**
   * Update module
   */
  updateModule(moduleId: number, data: UpdateModuleDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PERMISSIONS.MODULES.UPDATE,
      { moduleId, ...data }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error updating module:', error);
        throw error;
      })
    );
  }

  /**
   * Delete module
   */
  deleteModule(moduleId: number): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PERMISSIONS.MODULES.DELETE,
      { moduleId }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting module:', error);
        throw error;
      })
    );
  }

  /**
   * Create action
   */
  createAction(data: CreateActionDto): Observable<number> {
    return this.api.post<ApiResponse<{ actionId: number }>>(
      API_ENDPOINTS.PERMISSIONS.ACTIONS.CREATE,
      data
    ).pipe(
      map(response => response.data.actionId),
      catchError(error => {
        console.error('Error creating action:', error);
        throw error;
      })
    );
  }

  /**
   * Update action
   */
  updateAction(actionId: number, data: UpdateActionDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PERMISSIONS.ACTIONS.UPDATE,
      { actionId, ...data }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error updating action:', error);
        throw error;
      })
    );
  }

  /**
   * Delete action
   */
  deleteAction(actionId: number): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PERMISSIONS.ACTIONS.DELETE,
      { actionId }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting action:', error);
        throw error;
      })
    );
  }

  /**
   * Get all module-actions
   */
  getAllModuleActions(): Observable<ModuleAction[]> {
    return this.api.post<ApiResponse<ModuleAction[]>>(
      API_ENDPOINTS.PERMISSIONS.MODULE_ACTIONS.LIST,
      {}
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading module-actions:', error);
        return of([]);
      })
    );
  }

  /**
   * Create module-action
   */
  createModuleAction(data: CreateModuleActionDto): Observable<number> {
    return this.api.post<ApiResponse<{ moduleActionId: number }>>(
      API_ENDPOINTS.PERMISSIONS.MODULE_ACTIONS.CREATE,
      data
    ).pipe(
      map(response => response.data.moduleActionId),
      catchError(error => {
        console.error('Error creating module-action:', error);
        throw error;
      })
    );
  }

  /**
   * Update module-action
   */
  updateModuleAction(moduleActionId: number, data: UpdateModuleActionDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PERMISSIONS.MODULE_ACTIONS.UPDATE,
      { moduleActionId, ...data }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error updating module-action:', error);
        throw error;
      })
    );
  }

  /**
   * Delete module-action
   */
  deleteModuleAction(moduleActionId: number): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.PERMISSIONS.MODULE_ACTIONS.DELETE,
      { moduleActionId }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting module-action:', error);
        throw error;
      })
    );
  }

  /**
   * Clear permission cache
   */
  clearCache(): void {
    this.permissionCache.clear();
    this.cacheTimestamp = 0;
  }

  /**
   * Clear all cached data
   */
  clearAllData(): void {
    this.userPermissionsSubject.next(null);
    this.clearCache();
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_DURATION;
  }

  /**
   * Check permission in memory from cached user permissions
   * Handles both category-based and flat module structures
   */
  private checkPermissionInMemory(
    permissions: UserPermissionsResponse,
    moduleCode: string,
    actionCode: string
  ): boolean {
    // Collect all modules from categories and uncategorized, or use old flat structure
    const allModules: ModulePermissions[] = [];
    
    if (permissions.categories) {
      // New category-based structure
      permissions.categories.forEach(cat => {
        allModules.push(...cat.modules);
      });
      if (permissions.uncategorized_modules) {
        allModules.push(...permissions.uncategorized_modules);
      }
    } else if (permissions.modules) {
      // Old flat structure
      allModules.push(...permissions.modules);
    }
    
    const module = allModules.find(m => m.module_code === moduleCode);
    if (!module) {
      return false;
    }
    
    const hasAction = module.actions.some((a: { action_code: string }) => a.action_code === actionCode);
    return hasAction;
  }
}
