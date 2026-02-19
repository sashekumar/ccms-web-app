import { Request, Response, NextFunction } from 'express';
import { PermissionsService } from '../features/permissions/permissions.service';

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
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
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
        res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${moduleCode}.${actionCode}`
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message
      });
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
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
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
        res.status(403).json({
          success: false,
          message: `Access denied. Required permissions: ${permissionList}`
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message
      });
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
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
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
        res.status(403).json({
          success: false,
          message: `Access denied. Required permissions: ${permissionList}`
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message
      });
    }
  };
};
