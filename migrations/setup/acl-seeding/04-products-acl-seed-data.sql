/*
==============================================================================
CCMS - PRODUCTS (POLICY MANAGEMENT) MODULE - ACL SEED DATA
Purpose: Add Policy Management module with 10 granular permissions
Module: Policy Management (Uncategorized - Top Level Menu)
Route: /products
Actions: VIEW, VIEW_LIMITS, VIEW_COPAY, VIEW_THRESHOLDS, CREATE, UPDATE, DELETE, MANAGE_LIMITS, MANAGE_COPAY, MANAGE_THRESHOLDS, ACTIVATE, DEACTIVATE
==============================================================================
Dependencies: ccms_new_schema_2026_v8.sql (ACL tables must exist)
Idempotent: Yes (safe to run multiple times)
==============================================================================
*/

USE db_ccms;
GO

PRINT '';
PRINT '================================================================';
PRINT 'PRODUCTS (POLICY MANAGEMENT) - ACL SEED DATA';
PRINT '================================================================';
PRINT '';

-- ============================================================================
-- SECTION 1: PREREQUISITES CHECK
-- ============================================================================

PRINT 'Checking prerequisites...';

-- Check if ACL tables exist
IF OBJECT_ID('ccms_acl_roles', 'U') IS NULL
BEGIN
    PRINT '  ✗ ERROR: ccms_acl_roles table does not exist';
    PRINT '  → Please run ccms_new_schema_2026_v8.sql first';
    RETURN;
END

IF OBJECT_ID('ccms_acl_modules', 'U') IS NULL
BEGIN
    PRINT '  ✗ ERROR: ccms_acl_modules table does not exist';
    PRINT '  → Please run ccms_new_schema_2026_v8.sql first';
    RETURN;
END

IF OBJECT_ID('ccms_acl_actions', 'U') IS NULL
BEGIN
    PRINT '  ✗ ERROR: ccms_acl_actions table does not exist';
    PRINT '  → Please run ccms_new_schema_2026_v8.sql first';
    RETURN;
END

PRINT '  ✓ All ACL tables exist';

-- Check if Policy Management module already exists
IF EXISTS (SELECT 1 FROM ccms_acl_modules WHERE module_code = 'POLICY_MANAGEMENT')
BEGIN
    PRINT '  ⚠ WARNING: Policy Management module already exists';
    PRINT '  → This script will skip module creation and update permissions only';
END
ELSE
BEGIN
    PRINT '  ✓ Policy Management module does not exist (will be created)';
END

PRINT '';

-- ============================================================================
-- SECTION 2: ADD NEW ACTIONS (IF NOT EXISTS)
-- ============================================================================

PRINT 'Adding new actions...';

-- Action 1: VIEW_LIMITS
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'VIEW_LIMITS')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('View Limits', 'VIEW_LIMITS', 'View product benefit limits (read-only)', 1, GETDATE(), 'admin');
    PRINT '  ✓ Added action: VIEW_LIMITS';
END
ELSE
BEGIN
    PRINT '  → Action already exists: VIEW_LIMITS';
END

-- Action 2: VIEW_COPAY
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'VIEW_COPAY')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('View Copay', 'VIEW_COPAY', 'View copayment rules (read-only)', 1, GETDATE(), 'admin');
    PRINT '  ✓ Added action: VIEW_COPAY';
END
ELSE
BEGIN
    PRINT '  → Action already exists: VIEW_COPAY';
END

-- Action 3: MANAGE_LIMITS
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'MANAGE_LIMITS')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Manage Limits', 'MANAGE_LIMITS', 'Add/edit/delete product benefit limits', 1, GETDATE(), 'admin');
    PRINT '  ✓ Added action: MANAGE_LIMITS';
END
ELSE
BEGIN
    PRINT '  → Action already exists: MANAGE_LIMITS';
END

-- Action 4: MANAGE_COPAY
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'MANAGE_COPAY')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Manage Copay', 'MANAGE_COPAY', 'Add/edit/delete copayment rules', 1, GETDATE(), 'admin');
    PRINT '  ✓ Added action: MANAGE_COPAY';
END
ELSE
BEGIN
    PRINT '  → Action already exists: MANAGE_COPAY';
END

-- Action 5: ACTIVATE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'ACTIVATE')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Activate', 'ACTIVATE', 'Activate products for policy issuance', 1, GETDATE(), 'admin');
    PRINT '  ✓ Added action: ACTIVATE';
END
ELSE
BEGIN
    PRINT '  → Action already exists: ACTIVATE';
END

-- Action 6: DEACTIVATE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'DEACTIVATE')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Deactivate', 'DEACTIVATE', 'Deactivate/disable products', 1, GETDATE(), 'admin');
    PRINT '  ✓ Added action: DEACTIVATE';
END
ELSE
BEGIN
    PRINT '  → Action already exists: DEACTIVATE';
END

-- Action 7: VIEW_THRESHOLDS
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'VIEW_THRESHOLDS')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('View Thresholds', 'VIEW_THRESHOLDS', 'View LOS alert thresholds (read-only)', 1, GETDATE(), 'admin');
    PRINT '  ✓ Added action: VIEW_THRESHOLDS';
END
ELSE
BEGIN
    PRINT '  → Action already exists: VIEW_THRESHOLDS';
END

-- Action 8: MANAGE_THRESHOLDS
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'MANAGE_THRESHOLDS')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Manage Thresholds', 'MANAGE_THRESHOLDS', 'Add/edit/delete LOS alert thresholds', 1, GETDATE(), 'admin');
    PRINT '  ✓ Added action: MANAGE_THRESHOLDS';
END
ELSE
BEGIN
    PRINT '  → Action already exists: MANAGE_THRESHOLDS';
END

PRINT '';

-- ============================================================================
-- SECTION 3: ADD POLICY MANAGEMENT MODULE (IF NOT EXISTS)
-- ============================================================================

PRINT 'Adding Policy Management module...';

DECLARE @policyMgmtModuleId BIGINT;

IF NOT EXISTS (SELECT 1 FROM ccms_acl_modules WHERE module_code = 'POLICY_MANAGEMENT')
BEGIN
    INSERT INTO ccms_acl_modules (
        module_name, 
        module_code, 
        category_id, 
        icon, 
        route, 
        display_order, 
        is_active, 
        created_at, 
        created_by
    )
    VALUES (
        'Policy Management',        -- module_name
        'POLICY_MANAGEMENT',        -- module_code
        NULL,                       -- category_id (NULL = uncategorized, top-level menu)
        'file-contract',            -- icon (FontAwesome icon name)
        '/products',                -- route
        15,                         -- display_order
        1,                          -- is_active
        GETDATE(),                  -- created_at
        'admin'                     -- created_by
    );
    
    SET @policyMgmtModuleId = SCOPE_IDENTITY();
    PRINT '  ✓ Created module: Policy Management (module_id=' + CAST(@policyMgmtModuleId AS VARCHAR) + ')';
END
ELSE
BEGIN
    SELECT @policyMgmtModuleId = module_id 
    FROM ccms_acl_modules 
    WHERE module_code = 'POLICY_MANAGEMENT';
    
    PRINT '  → Module already exists: Policy Management (module_id=' + CAST(@policyMgmtModuleId AS VARCHAR) + ')';
END

PRINT '';

-- ============================================================================
-- SECTION 4: LINK ACTIONS TO MODULE (10 MODULE-ACTION LINKS)
-- ============================================================================

PRINT 'Linking actions to Policy Management module...';

-- Get action IDs
DECLARE @viewActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'VIEW');
DECLARE @viewLimitsActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'VIEW_LIMITS');
DECLARE @viewCopayActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'VIEW_COPAY');
DECLARE @createActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'CREATE');
DECLARE @updateActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'UPDATE');
DECLARE @deleteActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'DELETE');
DECLARE @manageLimitsActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_LIMITS');
DECLARE @manageCopayActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_COPAY');
DECLARE @activateActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'ACTIVATE');
DECLARE @deactivateActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'DEACTIVATE');
DECLARE @viewThresholdsActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'VIEW_THRESHOLDS');
DECLARE @manageThresholdsActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_THRESHOLDS');

-- Verify all required actions exist
IF @viewActionId IS NULL OR @viewLimitsActionId IS NULL OR @viewCopayActionId IS NULL
   OR @createActionId IS NULL OR @updateActionId IS NULL OR @deleteActionId IS NULL
   OR @manageLimitsActionId IS NULL OR @manageCopayActionId IS NULL
   OR @activateActionId IS NULL OR @deactivateActionId IS NULL
   OR @viewThresholdsActionId IS NULL OR @manageThresholdsActionId IS NULL
BEGIN
    PRINT '  ✗ ERROR: One or more required actions do not exist';
    PRINT '  → Required actions: VIEW, VIEW_LIMITS, VIEW_COPAY, VIEW_THRESHOLDS, CREATE, UPDATE, DELETE, MANAGE_LIMITS, MANAGE_COPAY, MANAGE_THRESHOLDS, ACTIVATE, DEACTIVATE';
    RETURN;
END

-- Link 1: VIEW
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @policyMgmtModuleId AND action_id = @viewActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@policyMgmtModuleId, @viewActionId, 'View Products', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW → "View Products"';
END
ELSE
BEGIN
    PRINT '  → Action already linked: VIEW';
END

-- Link 2: VIEW_LIMITS
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @policyMgmtModuleId AND action_id = @viewLimitsActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@policyMgmtModuleId, @viewLimitsActionId, 'View Product Limits', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW_LIMITS → "View Product Limits"';
END
ELSE
BEGIN
    PRINT '  → Action already linked: VIEW_LIMITS';
END

-- Link 3: VIEW_COPAY
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @policyMgmtModuleId AND action_id = @viewCopayActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@policyMgmtModuleId, @viewCopayActionId, 'View Copay Rules', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW_COPAY → "View Copay Rules"';
END
ELSE
BEGIN
    PRINT '  → Action already linked: VIEW_COPAY';
END

-- Link 4: CREATE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @policyMgmtModuleId AND action_id = @createActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@policyMgmtModuleId, @createActionId, 'Create Product', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: CREATE → "Create Product"';
END
ELSE
BEGIN
    PRINT '  → Action already linked: CREATE';
END

-- Link 5: UPDATE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @policyMgmtModuleId AND action_id = @updateActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@policyMgmtModuleId, @updateActionId, 'Edit Product', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: UPDATE → "Edit Product"';
END
ELSE
BEGIN
    PRINT '  → Action already linked: UPDATE';
END

-- Link 6: DELETE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @policyMgmtModuleId AND action_id = @deleteActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@policyMgmtModuleId, @deleteActionId, 'Delete Product', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: DELETE → "Delete Product"';
END
ELSE
BEGIN
    PRINT '  → Action already linked: DELETE';
END

-- Link 7: MANAGE_LIMITS
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @policyMgmtModuleId AND action_id = @manageLimitsActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@policyMgmtModuleId, @manageLimitsActionId, 'Manage Product Limits', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: MANAGE_LIMITS → "Manage Product Limits"';
END
ELSE
BEGIN
    PRINT '  → Action already linked: MANAGE_LIMITS';
END

-- Link 8: MANAGE_COPAY
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @policyMgmtModuleId AND action_id = @manageCopayActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@policyMgmtModuleId, @manageCopayActionId, 'Manage Copay Rules', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: MANAGE_COPAY → "Manage Copay Rules"';
END
ELSE
BEGIN
    PRINT '  → Action already linked: MANAGE_COPAY';
END

-- Link 9: ACTIVATE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @policyMgmtModuleId AND action_id = @activateActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@policyMgmtModuleId, @activateActionId, 'Activate Product', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: ACTIVATE → "Activate Product"';
END
ELSE
BEGIN
    PRINT '  → Action already linked: ACTIVATE';
END

-- Link 10: DEACTIVATE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @policyMgmtModuleId AND action_id = @deactivateActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@policyMgmtModuleId, @deactivateActionId, 'Deactivate Product', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: DEACTIVATE → "Deactivate Product"';
END
ELSE
BEGIN
    PRINT '  → Action already linked: DEACTIVATE';
END

-- Link 11: VIEW_THRESHOLDS
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @policyMgmtModuleId AND action_id = @viewThresholdsActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@policyMgmtModuleId, @viewThresholdsActionId, 'View LOS Thresholds', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW_THRESHOLDS → "View LOS Thresholds"';
END
ELSE
BEGIN
    PRINT '  → Action already linked: VIEW_THRESHOLDS';
END

-- Link 12: MANAGE_THRESHOLDS
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @policyMgmtModuleId AND action_id = @manageThresholdsActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@policyMgmtModuleId, @manageThresholdsActionId, 'Manage LOS Thresholds', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: MANAGE_THRESHOLDS → "Manage LOS Thresholds"';
END
ELSE
BEGIN
    PRINT '  → Action already linked: MANAGE_THRESHOLDS';
END

PRINT '';

-- ============================================================================
-- SECTION 5: GRANT ALL 10 PERMISSIONS TO SUPER ADMIN ROLE
-- ============================================================================

PRINT 'Granting permissions to Super Admin role...';

DECLARE @superAdminRoleId BIGINT = 1; -- Super Admin role (role_id=1)
DECLARE @moduleActionId BIGINT;
DECLARE @permissionsGranted INT = 0;

-- Get all module-action IDs for Policy Management
DECLARE module_action_cursor CURSOR FOR
    SELECT module_action_id 
    FROM ccms_acl_module_actions 
    WHERE module_id = @policyMgmtModuleId 
    AND is_active = 1;

OPEN module_action_cursor;
FETCH NEXT FROM module_action_cursor INTO @moduleActionId;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Grant permission if not already granted
    IF NOT EXISTS (
        SELECT 1 
        FROM ccms_acl_role_permissions 
        WHERE role_id = @superAdminRoleId 
        AND module_action_id = @moduleActionId
    )
    BEGIN
        INSERT INTO ccms_acl_role_permissions (role_id, module_action_id, granted, created_at, created_by)
        VALUES (@superAdminRoleId, @moduleActionId, 1, GETDATE(), 'admin');
        
        SET @permissionsGranted = @permissionsGranted + 1;
    END
    
    FETCH NEXT FROM module_action_cursor INTO @moduleActionId;
END

CLOSE module_action_cursor;
DEALLOCATE module_action_cursor;

IF @permissionsGranted > 0
BEGIN
    PRINT '  ✓ Granted ' + CAST(@permissionsGranted AS VARCHAR) + ' new permission(s) to Super Admin';
END
ELSE
BEGIN
    PRINT '  → All permissions already granted to Super Admin';
END

PRINT '';

-- ============================================================================
-- SECTION 6: VERIFICATION QUERIES
-- ============================================================================

PRINT '================================================================';
PRINT 'VERIFICATION RESULTS';
PRINT '================================================================';
PRINT '';

-- Verify module creation
PRINT '1. Policy Management Module:';
SELECT 
    module_id,
    module_name,
    module_code,
    category_id AS category_id_null_means_uncategorized,
    route,
    display_order,
    is_active,
    created_by,
    created_at
FROM ccms_acl_modules
WHERE module_code = 'POLICY_MANAGEMENT';

PRINT '';
PRINT '2. New Actions Added:';
SELECT 
    action_id,
    action_name,
    action_code,
    description,
    is_active,
    created_by,
    created_at
FROM ccms_acl_actions
WHERE action_code IN ('VIEW_LIMITS', 'VIEW_COPAY', 'MANAGE_LIMITS', 'MANAGE_COPAY', 'ACTIVATE', 'DEACTIVATE', 'VIEW_THRESHOLDS', 'MANAGE_THRESHOLDS');

PRINT '';
PRINT '3. Module-Action Links (10 expected):';
SELECT 
    ma.module_action_id,
    m.module_name,
    a.action_code,
    ma.action_label,
    ma.is_active,
    ma.created_by
FROM ccms_acl_module_actions ma
INNER JOIN ccms_acl_modules m ON ma.module_id = m.module_id
INNER JOIN ccms_acl_actions a ON ma.action_id = a.action_id
WHERE m.module_code = 'POLICY_MANAGEMENT'
ORDER BY a.action_code;

PRINT '';
PRINT '4. Super Admin Permissions (10 expected):';
SELECT 
    rp.permission_id,
    r.role_name,
    m.module_name,
    a.action_code,
    ma.action_label,
    rp.granted,
    rp.created_by
FROM ccms_acl_role_permissions rp
INNER JOIN ccms_acl_roles r ON rp.role_id = r.role_id
INNER JOIN ccms_acl_module_actions ma ON rp.module_action_id = ma.module_action_id
INNER JOIN ccms_acl_modules m ON ma.module_id = m.module_id
INNER JOIN ccms_acl_actions a ON ma.action_id = a.action_id
WHERE r.role_id = 1 -- Super Admin
AND m.module_code = 'POLICY_MANAGEMENT'
ORDER BY a.action_code;

PRINT '';
PRINT '================================================================';
PRINT 'PRODUCTS (POLICY MANAGEMENT) ACL SETUP COMPLETED SUCCESSFULLY';
PRINT '================================================================';
PRINT '';
PRINT 'Summary:';
PRINT '  • Module: Policy Management (uncategorized)';
PRINT '  • Route: /products';
PRINT '  • Actions: 12 (VIEW, VIEW_LIMITS, VIEW_COPAY, VIEW_THRESHOLDS, CREATE, UPDATE, DELETE, MANAGE_LIMITS, MANAGE_COPAY, MANAGE_THRESHOLDS, ACTIVATE, DEACTIVATE)';
PRINT '  • Super Admin: All 12 permissions granted';
PRINT '';
PRINT 'Permission Model:';
PRINT '  • VIEW = View products only';
PRINT '  • VIEW_LIMITS = View product limits (read-only)';
PRINT '  • VIEW_COPAY = View copay rules (read-only)';
PRINT '  • VIEW_THRESHOLDS = View LOS thresholds (read-only)';
PRINT '  • MANAGE_LIMITS = Full CRUD on product limits';
PRINT '  • MANAGE_COPAY = Full CRUD on copay rules';
PRINT '  • MANAGE_THRESHOLDS = Full CRUD on LOS thresholds';
PRINT '';
PRINT 'Next Steps:';
PRINT '  1. Implement backend types, repositories, services, controller';
PRINT '  2. Implement frontend models, services, components';
PRINT '  3. Add routing and navigation menu item';
PRINT '  4. Implement permission guards in frontend';
PRINT '';

GO
