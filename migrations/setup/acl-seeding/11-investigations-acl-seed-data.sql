-- ============================================================================
-- CCMS ACL Seed Data: Investigations Module
-- ============================================================================
-- Purpose: Sets up all access control configurations for the Investigations module
-- Module: INVESTIGATIONS
-- Route: /investigations
-- Tables: ccms_investigations, ccms_investigation_request, ccms_investigation_call_log
-- 
-- Actions: 2 permissions
--   - VIEW: View investigation cases, requests, and call logs
--   - UPDATE: Create, update, close investigations and manage requests
-- 
-- Business Rules:
--   - Investigations dashboard provides a consolidated view of all investigation cases
--   - Officers with VIEW permission can see all investigations
--   - Officers with UPDATE permission can create, manage, and close investigations
-- ============================================================================

USE db_ccms;
GO

SET NOCOUNT ON;
PRINT '============================================================================';
PRINT 'CCMS ACL Setup: Investigations Module';
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

-- Check which actions already exist
DECLARE @ExistingActions TABLE (action_code VARCHAR(50));
INSERT INTO @ExistingActions
SELECT action_code FROM ccms_acl_actions 
WHERE action_code IN ('VIEW', 'UPDATE');

-- Insert VIEW if not exists (reusable across modules)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'VIEW')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('View', 'VIEW', 'View and read data', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: VIEW';
END
ELSE
    PRINT '  ℹ Action already exists: VIEW';

-- Insert UPDATE if not exists (reusable across modules)
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

-- Check if module already exists
IF EXISTS (SELECT 1 FROM ccms_acl_modules WHERE module_code = 'INVESTIGATIONS')
BEGIN
    SELECT @ModuleId = module_id FROM ccms_acl_modules WHERE module_code = 'INVESTIGATIONS';
    PRINT '  ℹ Module already exists: INVESTIGATIONS (ID: ' + CAST(@ModuleId AS VARCHAR) + ')';
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
        'Medical Investigation Management',     -- module_name
        'INVESTIGATIONS',                       -- module_code
        NULL,                                   -- category_id (NULL = uncategorized, top-level menu)
        'magnifying-glass',                     -- icon (FontAwesome icon name)
        '/investigations',                      -- route
        60,                                     -- display_order (after Escalations=55)
        1,                                      -- is_active
        GETDATE(),                              -- created_at
        'admin'                                 -- created_by
    );
    
    SELECT @ModuleId = SCOPE_IDENTITY();
    PRINT '  ✓ Created module: INVESTIGATIONS (ID: ' + CAST(@ModuleId AS VARCHAR) + ')';
END

PRINT '';

-- ============================================================================
-- STEP 3: Link Actions to Module
-- ============================================================================
PRINT 'Step 3: Linking actions to module...';

-- Get action IDs
DECLARE @ActionView INT, @ActionUpdate INT;

SELECT @ActionView = action_id FROM ccms_acl_actions WHERE action_code = 'VIEW';
SELECT @ActionUpdate = action_id FROM ccms_acl_actions WHERE action_code = 'UPDATE';

-- Link VIEW
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionView)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionView, 'View Investigations', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW';
END
ELSE
    PRINT '  ℹ Action already linked: VIEW';

-- Link UPDATE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionUpdate)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionUpdate, 'Manage Investigations', 1, GETDATE(), 'admin');
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

-- Get module-action IDs
DECLARE @ModuleActionIds TABLE (module_action_id INT, action_code VARCHAR(50));
INSERT INTO @ModuleActionIds
SELECT ma.module_action_id, a.action_code
FROM ccms_acl_module_actions ma
INNER JOIN ccms_acl_actions a ON ma.action_id = a.action_id
WHERE ma.module_id = @ModuleId;

-- Grant permissions
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

-- Count module-actions
DECLARE @ModuleActionCount INT;
SELECT @ModuleActionCount = COUNT(*) FROM ccms_acl_module_actions WHERE module_id = @ModuleId;
PRINT 'Actions linked to INVESTIGATIONS module: ' + CAST(@ModuleActionCount AS VARCHAR);

-- Count role permissions
DECLARE @PermissionCount INT;
SELECT @PermissionCount = COUNT(*) 
FROM ccms_acl_role_permissions rp
INNER JOIN ccms_acl_module_actions ma ON rp.module_action_id = ma.module_action_id
WHERE ma.module_id = @ModuleId AND rp.role_id = @SuperAdminRoleId;
PRINT 'Permissions granted to Super Admin: ' + CAST(@PermissionCount AS VARCHAR);

PRINT '';

IF @ModuleActionCount = 2 AND @PermissionCount = 2
BEGIN
    PRINT '✓✓✓ SUCCESS: Investigations module ACL setup complete! ✓✓✓';
    PRINT '';
    PRINT 'Module Details:';
    PRINT '  - Module Code: INVESTIGATIONS';
    PRINT '  - Display Name: Medical Investigation Management';
    PRINT '  - Route: /investigations';
    PRINT '  - Icon: magnifying-glass';
    PRINT '  - Actions: 2 (VIEW, UPDATE)';
    PRINT '  - Super Admin: All 2 permissions granted';
    PRINT '';
    PRINT 'Permission Summary:';
    PRINT '  - VIEW: View all investigation cases, requests, and call logs';
    PRINT '  - UPDATE: Create, manage, and close investigations, add requests and calls';
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
