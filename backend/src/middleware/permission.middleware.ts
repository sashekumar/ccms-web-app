import { Request, Response, NextFunction } from 'express';
import { PermissionsService } from '../features/permissions/permissions.service';
import { getErrorMessage } from '../core/utils/error.util';
import { ResponseUtil } from '../core/utils/response.util';

const permissionsService = new PermissionsService();

/**
 * Middleware to check if user has required permission
 * Usage: requirePermission('MODULE_CODE', 'ACTION_CODE')
 */
export const requirePermission = (moduleCode: string, actionCode: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;

      if (!user || !user.userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // Super Admin (role_id = 1) bypass check
      if (user.roles && user.roles.includes(1)) {
        next();
        return;
      }

      const result = await permissionsService.checkPermission(
        user.userId,
        moduleCode,
        actionCode
      );

      if (!result.has_permission) {
        ResponseUtil.forbidden(res, `Access denied. Required permission: ${moduleCode}.${actionCode}`);
        return;
      }

      next();
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking permissions', 500, getErrorMessage(error));
    }
  };
};

/**
 * Middleware to check if user has ANY of the listed permissions
 * Usage: requireAnyPermission([['MODULE_CODE', 'ACTION_CODE'], ['MODULE_CODE2', 'ACTION_CODE2']])
 */
export const requireAnyPermission = (permissions: [string, string][]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;

      if (!user || !user.userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // Super Admin (role_id = 1) bypass check
      if (user.roles && user.roles.includes(1)) {
        next();
        return;
      }

      let hasAnyPermission = false;

      for (const [moduleCode, actionCode] of permissions) {
        const result = await permissionsService.checkPermission(
          user.userId,
          moduleCode,
          actionCode
        );

        if (result.has_permission) {
          hasAnyPermission = true;
          break;
        }
      }

      if (!hasAnyPermission) {
        const permissionList = permissions.map(([m, a]) => `${m}.${a}`).join(' OR ');
        ResponseUtil.forbidden(res, `Access denied. Required permissions: ${permissionList}`);
        return;
      }

      next();
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking permissions', 500, getErrorMessage(error));
    }
  };
};

/**
 * Middleware to check if user has ALL of the listed permissions
 * Usage: requireAllPermissions([['MODULE_CODE', 'ACTION_CODE'], ['MODULE_CODE2', 'ACTION_CODE2']])
 */
export const requireAllPermissions = (permissions: [string, string][]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;

      if (!user || !user.userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // Super Admin (role_id = 1) bypass check
      if (user.roles && user.roles.includes(1)) {
        next();
        return;
      }

      const checks = await Promise.all(
        permissions.map(([moduleCode, actionCode]) =>
          permissionsService.checkPermission(user.userId, moduleCode, actionCode)
        )
      );

      const hasAllPermissions = checks.every(result => result.has_permission);

      if (!hasAllPermissions) {
        const permissionList = permissions.map(([m, a]) => `${m}.${a}`).join(' AND ');
        ResponseUtil.forbidden(res, `Access denied. Required permissions: ${permissionList}`);
        return;
      }

      next();
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking permissions', 500, getErrorMessage(error));
    }
  };
};
