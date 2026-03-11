import sql from 'mssql';

/**
 * ACL Integrity Validator - Ensures ACL system tables remain intact during tests
 * 
 * This class validates that e2e tests never corrupt the ACL permission system.
 * It captures baseline counts before tests and verifies they remain unchanged after.
 */

export interface ACLIntegritySnapshot {
  timestamp: Date;
  categoriesCount: number;
  modulesCount: number;
  actionsCount: number;
  moduleActionsCount: number;
  superAdminPermissionsCount: number;
  adminUserExists: boolean;
  adminHasSuperAdminRole: boolean;
  criticalPermissions: Map<string, boolean>; // module_code -> has VIEW permission
}

export class ACLIntegrityValidator {
  /**
   * Take a snapshot of current ACL system state
   */
  static async captureSnapshot(pool: sql.ConnectionPool): Promise<ACLIntegritySnapshot> {
    try {
      const result = await pool.request().query(`
        -- Get counts
        SELECT 
          (SELECT COUNT(*) FROM ccms_acl_categories WHERE is_active = 1) AS categories_count,
          (SELECT COUNT(*) FROM ccms_acl_modules WHERE is_active = 1) AS modules_count,
          (SELECT COUNT(*) FROM ccms_acl_actions WHERE is_active = 1) AS actions_count,
          (SELECT COUNT(*) FROM ccms_acl_module_actions WHERE is_active = 1) AS module_actions_count,
          (SELECT COUNT(*) FROM ccms_acl_role_permissions WHERE role_id = 1 AND granted = 1) AS super_admin_permissions_count,
          (SELECT COUNT(*) FROM ccms_users WHERE user_id = 1 AND is_active = 1) AS admin_user_exists,
          (SELECT COUNT(*) FROM ccms_acl_user_roles WHERE user_id = 1 AND role_id = 1 AND is_active = 1) AS admin_has_super_admin_role;
        
        -- Get critical module permissions
        SELECT 
          m.module_code,
          CASE WHEN EXISTS (
            SELECT 1 FROM vw_acl_user_permissions 
            WHERE user_id = 1 AND module_code = m.module_code AND action_code = 'VIEW' AND granted = 1
          ) THEN 1 ELSE 0 END AS has_view_permission
        FROM ccms_acl_modules m
        WHERE m.module_code IN (
          'DASHBOARD', 'USER_MANAGEMENT', 'ROLE_MANAGEMENT', 
          'CATEGORY_MANAGEMENT', 'MODULE_MANAGEMENT', 'ACTION_MANAGEMENT',
          'MODULE_ACTION_MANAGEMENT', 'ROLE_PERMISSION_MANAGEMENT', 'USER_ROLE_ASSIGNMENT'
        );
      `);

      const counts = (result.recordsets as any[])[0][0];
      const permissions = (result.recordsets as any[])[1];

      const criticalPermissions = new Map<string, boolean>();
      permissions.forEach((perm: any) => {
        criticalPermissions.set(perm.module_code, perm.has_view_permission === 1);
      });

      return {
        timestamp: new Date(),
        categoriesCount: counts.categories_count,
        modulesCount: counts.modules_count,
        actionsCount: counts.actions_count,
        moduleActionsCount: counts.module_actions_count,
        superAdminPermissionsCount: counts.super_admin_permissions_count,
        adminUserExists: counts.admin_user_exists === 1,
        adminHasSuperAdminRole: counts.admin_has_super_admin_role === 1,
        criticalPermissions
      };
    } catch (error) {
      console.error('⚠️  Error capturing ACL snapshot:', error);
      // Return a default snapshot on error
      return {
        timestamp: new Date(),
        categoriesCount: 0,
        modulesCount: 0,
        actionsCount: 0,
        moduleActionsCount: 0,
        superAdminPermissionsCount: 0,
        adminUserExists: false,
        adminHasSuperAdminRole: false,
        criticalPermissions: new Map()
      };
    }
  }

  /**
   * Compare two snapshots and report any corruption
   */
  static validateSnapshots(before: ACLIntegritySnapshot, after: ACLIntegritySnapshot): { 
    isValid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];

    // Check table counts (should never change)
    if (before.categoriesCount !== after.categoriesCount) {
      errors.push(`❌ ACL Categories changed: ${before.categoriesCount} -> ${after.categoriesCount}`);
    }
    if (before.modulesCount !== after.modulesCount) {
      errors.push(`❌ ACL Modules changed: ${before.modulesCount} -> ${after.modulesCount}`);
    }
    if (before.actionsCount !== after.actionsCount) {
      errors.push(`❌ ACL Actions changed: ${before.actionsCount} -> ${after.actionsCount}`);
    }
    if (before.moduleActionsCount !== after.moduleActionsCount) {
      errors.push(`❌ ACL Module-Action mappings changed: ${before.moduleActionsCount} -> ${after.moduleActionsCount}`);
    }
    if (before.superAdminPermissionsCount !== after.superAdminPermissionsCount) {
      errors.push(`❌ Super Admin permissions changed: ${before.superAdminPermissionsCount} -> ${after.superAdminPermissionsCount}`);
    }

    // Check admin user integrity
    if (!after.adminUserExists) {
      errors.push('❌ Admin user (user_id=1) was deleted or deactivated!');
    }
    if (!after.adminHasSuperAdminRole) {
      errors.push('❌ Admin user lost Super Admin role assignment!');
    }

    // Check critical permissions
    before.criticalPermissions.forEach((hasPermission, moduleCode) => {
      const afterPermission = after.criticalPermissions.get(moduleCode);
      if (hasPermission && !afterPermission) {
        errors.push(`❌ Admin lost VIEW permission for module: ${moduleCode}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Print snapshot details for debugging
   */
  static printSnapshot(label: string, snapshot: ACLIntegritySnapshot): void {
    console.log(`\n📊 ${label}`);
    console.log(`   Categories: ${snapshot.categoriesCount}`);
    console.log(`   Modules: ${snapshot.modulesCount}`);
    console.log(`   Actions: ${snapshot.actionsCount}`);
    console.log(`   Module-Actions: ${snapshot.moduleActionsCount}`);
    console.log(`   Super Admin Permissions: ${snapshot.superAdminPermissionsCount}`);
    console.log(`   Admin User Exists: ${snapshot.adminUserExists ? '✅' : '❌'}`);
    console.log(`   Admin Has Super Admin Role: ${snapshot.adminHasSuperAdminRole ? '✅' : '❌'}`);
    console.log(`   Critical Module Permissions:`);
    snapshot.criticalPermissions.forEach((hasPermission, moduleCode) => {
      console.log(`      ${moduleCode}: ${hasPermission ? '✅' : '❌'}`);
    });
  }
}
