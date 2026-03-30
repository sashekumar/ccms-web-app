-- ============================================================================
-- CCMS ACL Seed Data: FWD Accumulation Tracking Module
-- ============================================================================
-- Purpose: Sets up all access control configurations for the FWD Accumulation module
-- Module: FWD_ACCUMULATION
-- Route: /fwd-accumulation
-- Tables: ccms_fwd_accumulation_client, ccms_fwd_accumulation_disability,
--         ccms_fwd_accumulation_onetime, ccms_fwd_accumulation_pa
--
-- Actions: 2 permissions
--   - VIEW: View FWD accumulation records and statistics
--   - UPDATE: Create and update FWD accumulation records
--
-- Business Rules:
--   - FWD Accumulation Dashboard provides a 4-tab view (Client/Disability/Onetime/PA)
--   - Officers with VIEW permission can see all records and aggregated statistics
--   - Officers with UPDATE permission can create new records and update amounts
--
-- ============================================================================

USE db_ccms;
GO

SET NOCOUNT ON;
PRINT '============================================================================';
PRINT 'CCMS ACL Setup: FWD Accumulation Tracking Module';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- STEP 0: Prerequisites Check
-- ============================================================================
PRINT 'Step 0: Checking prerequisites...';

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ccms_acl_actions')
BEGIN
    PRINT '  ✗ ERROR: ACL tables do not exist. Please run ccms_new_schema_2026_v8.sql first.';
    RAISERROR('ACL tables not found', 16, 1);
    RETURN;
END

PRINT '  ✓ ACL tables exist';
PRINT '';

-- ============================================================================
-- STEP 1: Create Missing Actions (if not already exist)
-- ============================================================================
PRINT 'Step 1: Creating ACL actions...';

DECLARE @ExistingActions TABLE (action_code VARCHAR(50));
INSERT INTO @ExistingActions
SELECT action_code FROM ccms_acl_actions
WHERE action_code IN ('VIEW', 'UPDATE');

IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'VIEW')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('View', 'VIEW', 'View and read data', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: VIEW';
END
ELSE
    PRINT '  ℹ Action already exists: VIEW';

IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'UPDATE')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Update', 'UPDATE', 'Update existing records', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: UPDATE';
END
ELSE
    PRINT '  ℹ Action already exists: UPDATE';

PRINT '';

-- ============================================================================
-- STEP 2: Create Module
-- ============================================================================
PRINT 'Step 2: Creating module...';

DECLARE @ModuleId INT;

IF EXISTS (SELECT 1 FROM ccms_acl_modules WHERE module_code = 'FWD_ACCUMULATION')
BEGIN
    SELECT @ModuleId = module_id FROM ccms_acl_modules WHERE module_code = 'FWD_ACCUMULATION';
    PRINT '  ℹ Module already exists: FWD_ACCUMULATION (ID: ' + CAST(@ModuleId AS VARCHAR) + ')';
END
ELSE
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
        'FWD Accumulation Tracking',  -- module_name
        'FWD_ACCUMULATION',           -- module_code
        NULL,                         -- category_id (NULL = uncategorized, top-level menu)
        'layer-group',                -- icon (Font Awesome icon name: fas fa-layer-group)
        '/fwd-accumulation',          -- route
        75,                           -- display_order (after Stop Loss=70)
        1,                            -- is_active
        GETDATE(),                    -- created_at
        'admin'                       -- created_by
    );

    SELECT @ModuleId = SCOPE_IDENTITY();
    PRINT '  ✓ Created module: FWD_ACCUMULATION (ID: ' + CAST(@ModuleId AS VARCHAR) + ')';
END

PRINT '';

-- ============================================================================
-- STEP 3: Link Actions to Module
-- ============================================================================
PRINT 'Step 3: Linking actions to module...';

DECLARE @ActionView INT, @ActionUpdate INT;

SELECT @ActionView = action_id FROM ccms_acl_actions WHERE action_code = 'VIEW';
SELECT @ActionUpdate = action_id FROM ccms_acl_actions WHERE action_code = 'UPDATE';

IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionView)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionView, 'View FWD Accumulation Records', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW';
END
ELSE
    PRINT '  ℹ Action already linked: VIEW';

IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionUpdate)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionUpdate, 'Manage FWD Accumulation Records', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: UPDATE';
END
ELSE
    PRINT '  ℹ Action already linked: UPDATE';

PRINT '';

-- ============================================================================
-- STEP 4: Grant Permissions to Super Admin Role
-- ============================================================================
PRINT 'Step 4: Granting permissions to Super Admin role...';

DECLARE @SuperAdminRoleId INT = 1; -- Super Admin role ID

DECLARE @ModuleActionIds TABLE (module_action_id INT, action_code VARCHAR(50));
INSERT INTO @ModuleActionIds
SELECT ma.module_action_id, a.action_code
FROM ccms_acl_module_actions ma
INNER JOIN ccms_acl_actions a ON ma.action_id = a.action_id
WHERE ma.module_id = @ModuleId;

DECLARE @MAId INT, @ActionCode VARCHAR(50);

DECLARE permission_cursor CURSOR FOR
SELECT module_action_id, action_code FROM @ModuleActionIds;

OPEN permission_cursor;
FETCH NEXT FROM permission_cursor INTO @MAId, @ActionCode;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @SuperAdminRoleId AND module_action_id = @MAId)
    BEGIN
        INSERT INTO ccms_acl_role_permissions (role_id, module_action_id, granted, created_at, created_by)
        VALUES (@SuperAdminRoleId, @MAId, 1, GETDATE(), 'admin');
        PRINT '  ✓ Granted permission: ' + @ActionCode;
    END
    ELSE
        PRINT '  ℹ Permission already granted: ' + @ActionCode;

    FETCH NEXT FROM permission_cursor INTO @MAId, @ActionCode;
END

CLOSE permission_cursor;
DEALLOCATE permission_cursor;

PRINT '';

-- ============================================================================
-- STEP 5: Verification
-- ============================================================================
PRINT 'Step 5: Verification...';
PRINT '';

DECLARE @ModuleActionCount INT;
SELECT @ModuleActionCount = COUNT(*) FROM ccms_acl_module_actions WHERE module_id = @ModuleId;
PRINT 'Actions linked to FWD_ACCUMULATION module: ' + CAST(@ModuleActionCount AS VARCHAR);

DECLARE @PermissionCount INT;
SELECT @PermissionCount = COUNT(*)
FROM ccms_acl_role_permissions rp
INNER JOIN ccms_acl_module_actions ma ON rp.module_action_id = ma.module_action_id
WHERE ma.module_id = @ModuleId AND rp.role_id = @SuperAdminRoleId;
PRINT 'Permissions granted to Super Admin: ' + CAST(@PermissionCount AS VARCHAR);

PRINT '';

IF @ModuleActionCount = 2 AND @PermissionCount = 2
BEGIN
    PRINT '✓✓✓ SUCCESS: FWD Accumulation Tracking module ACL setup complete! ✓✓✓';
    PRINT '';
    PRINT 'Module Details:';
    PRINT '  - Module Code: FWD_ACCUMULATION';
    PRINT '  - Display Name: FWD Accumulation Tracking';
    PRINT '  - Route: /fwd-accumulation';
    PRINT '  - Icon: layer-group';
    PRINT '  - Actions: 2 (VIEW, UPDATE)';
    PRINT '  - Super Admin: All 2 permissions granted';
    PRINT '';
    PRINT 'Permission Summary:';
    PRINT '  - VIEW: View all FWD accumulation records across 4 sub-types and statistics';
    PRINT '  - UPDATE: Create new records and update accumulated amounts';
    PRINT '';
    PRINT 'Note: Users may need to logout and login for menu changes to appear.';
END
ELSE
BEGIN
    PRINT '✗✗✗ WARNING: Setup incomplete! ✗✗✗';
    PRINT 'Expected 2 module-actions and 2 permissions, but found:';
    PRINT '  - Module-actions: ' + CAST(@ModuleActionCount AS VARCHAR);
    PRINT '  - Permissions: ' + CAST(@PermissionCount AS VARCHAR);
    PRINT 'Please review the output above for errors.';
END

PRINT '';
PRINT '============================================================================';
PRINT 'ACL Setup Complete';
PRINT '============================================================================';

SET NOCOUNT OFF;
