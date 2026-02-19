import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { map, take, switchMap, filter } from 'rxjs/operators';
import { PermissionService } from '../services/permission.service';
import { APP_ROUTES } from '../constants';

/**
 * Functional permission guard
 * 
 * Usage in routes:
 * {
 *   path: 'users',
 *   component: UserListComponent,
 *   canActivate: [permissionGuard],
 *   data: { 
 *     permission: ['USER_MANAGEMENT', 'VIEW'] // or 'USER_MANAGEMENT.VIEW'
 *   }
 * }
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const permission = route.data['permission'];

  if (!permission) {
    console.error('Permission guard requires "permission" in route data');
    router.navigate([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
    return false;
  }

  let moduleCode: string;
  let actionCode: string;

  if (typeof permission === 'string') {
    const parts = permission.split('.');
    if (parts.length !== 2) {
      console.error(`Invalid permission format: ${permission}`);
      router.navigate([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
      return false;
    }
    [moduleCode, actionCode] = parts;
  } else if (Array.isArray(permission) && permission.length === 2) {
    [moduleCode, actionCode] = permission;
  } else {
    console.error('Invalid permission format in route data');
    router.navigate([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
    return false;
  }

  // Helper function to check if permissions are loaded
  const hasPermissionsLoaded = (perms: any): boolean => {
    if (!perms) return false;
    const categoryModules = perms.categories?.reduce((sum: number, cat: any) => sum + cat.modules.length, 0) || 0;
    const uncategorized = perms.uncategorized_modules?.length || 0;
    const oldStructure = perms.modules?.length || 0;
    return (categoryModules + uncategorized + oldStructure) > 0;
  };

  // Wait for permissions to be loaded, then check
  console.log(`🛡️ Permission guard activated for: ${moduleCode}.${actionCode}`);
  return permissionService.userPermissions$.pipe(
    switchMap(permissions => {
      // If permissions not loaded yet, load them first
      if (!hasPermissionsLoaded(permissions)) {
        console.log('⏳ Permissions not loaded yet, triggering load...');
        return permissionService.loadUserPermissions().pipe(
          switchMap(() => {
            console.log('🔄 Permissions loaded, now checking access...');
            return permissionService.hasPermission(moduleCode, actionCode);
          })
        );
      }
      // Permissions already loaded, check directly
      const totalModules = (permissions?.categories?.reduce((sum: number, cat: any) => sum + cat.modules.length, 0) || 0) +
                          (permissions?.uncategorized_modules?.length || 0) +
                          (permissions?.modules?.length || 0);
      console.log(`📦 Permissions already loaded (${totalModules} modules), checking access...`);
      return permissionService.hasPermission(moduleCode, actionCode);
    }),
    take(1),
    map(hasPermission => {
      if (!hasPermission) {
        console.warn(`❌ GUARD DENIED: Access denied for permission: ${moduleCode}.${actionCode}`);
        console.warn('🚫 Redirecting to /unauthorized');
        router.navigate([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
        return false;
      }
      console.log(`✅ GUARD APPROVED: Access granted for permission: ${moduleCode}.${actionCode}`);
      return true;
    })
  );
};

/**
 * Permission guard for multiple permissions (ANY)
 * User needs at least one of the specified permissions
 * 
 * Usage:
 * {
 *   path: 'data',
 *   component: DataComponent,
 *   canActivate: [permissionAnyGuard],
 *   data: { 
 *     permissions: [
 *       ['MODULE1', 'VIEW'],
 *       ['MODULE2', 'VIEW']
 *     ]
 *   }
 * }
 */
export const permissionAnyGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const permissions = route.data['permissions'] as [string, string][];

  if (!permissions || !Array.isArray(permissions)) {
    console.error('Permission ANY guard requires "permissions" array in route data');
    router.navigate([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
    return false;
  }

  // Helper function to check if permissions are loaded
  const hasPermissionsLoaded = (perms: any): boolean => {
    if (!perms) return false;
    const categoryModules = perms.categories?.reduce((sum: number, cat: any) => sum + cat.modules.length, 0) || 0;
    const uncategorized = perms.uncategorized_modules?.length || 0;
    const oldStructure = perms.modules?.length || 0;
    return (categoryModules + uncategorized + oldStructure) > 0;
  };

  // Wait for permissions to be loaded, then check
  return permissionService.userPermissions$.pipe(
    switchMap(userPerms => {
      // If permissions not loaded yet, load them first
      if (!hasPermissionsLoaded(userPerms)) {
        console.log('⏳ Permissions not loaded, loading now...');
        return permissionService.loadUserPermissions().pipe(
          switchMap(() => permissionService.hasAnyPermission(permissions))
        );
      }
      // Permissions already loaded, check directly
      return permissionService.hasAnyPermission(permissions);
    }),
    take(1),
    map(hasPermission => {
      if (!hasPermission) {
        console.warn('❌ Access denied: User lacks any of the required permissions');
        router.navigate([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
        return false;
      }
      return true;
    })
  );
};

/**
 * Permission guard for multiple permissions (ALL)
 * User needs all of the specified permissions
 * 
 * Usage:
 * {
 *   path: 'critical',
 *   component: CriticalComponent,
 *   canActivate: [permissionAllGuard],
 *   data: { 
 *     permissions: [
 *       ['MODULE1', 'UPDATE'],
 *       ['MODULE2', 'APPROVE']
 *     ]
 *   }
 * }
 */
export const permissionAllGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const permissions = route.data['permissions'] as [string, string][];

  if (!permissions || !Array.isArray(permissions)) {
    console.error('Permission ALL guard requires "permissions" array in route data');
    router.navigate([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
    return false;
  }

  // Helper function to check if permissions are loaded
  const hasPermissionsLoaded = (perms: any): boolean => {
    if (!perms) return false;
    const categoryModules = perms.categories?.reduce((sum: number, cat: any) => sum + cat.modules.length, 0) || 0;
    const uncategorized = perms.uncategorized_modules?.length || 0;
    const oldStructure = perms.modules?.length || 0;
    return (categoryModules + uncategorized + oldStructure) > 0;
  };

  // Wait for permissions to be loaded, then check
  return permissionService.userPermissions$.pipe(
    switchMap(userPerms => {
      // If permissions not loaded yet, load them first
      if (!hasPermissionsLoaded(userPerms)) {
        console.log('⏳ Permissions not loaded, loading now...');
        return permissionService.loadUserPermissions().pipe(
          switchMap(() => permissionService.hasAllPermissions(permissions))
        );
      }
      // Permissions already loaded, check directly
      return permissionService.hasAllPermissions(permissions);
    }),
    take(1),
    map(hasPermission => {
      if (!hasPermission) {
        console.warn('❌ Access denied: User lacks all required permissions');
        router.navigate([APP_ROUTES.PUBLIC.UNAUTHORIZED]);
        return false;
      }
      return true;
    })
  );
};
