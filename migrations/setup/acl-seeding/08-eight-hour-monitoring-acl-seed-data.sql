-- ============================================================================
-- CCMS ACL Seed Data: Eight Hour Monitoring Module
-- ============================================================================
-- Module: EIGHT_HOUR_MON | order=100 | icon=clock | route=/eight-hour-monitoring
-- Actions: VIEW (read), UPDATE (create/modify)
-- ============================================================================

USE db_ccms;
GO

SET NOCOUNT ON;
PRINT '============================================================================';
PRINT 'CCMS ACL Setup: Eight Hour Monitoring Module';
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
-- STEP 1: Create Actions (if not exist)
-- ============================================================================
PRINT 'Step 1: Creating ACL actions...';

DECLARE @ExistingActions TABLE (action_code VARCHAR(50));
INSERT INTO @ExistingActions
SELECT action_code FROM ccms_acl_actions WHERE action_code IN ('VIEW', 'UPDATE');

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

IF EXISTS (SELECT 1 FROM ccms_acl_modules WHERE module_code = 'EIGHT_HOUR_MON')
BEGIN
    SELECT @ModuleId = module_id FROM ccms_acl_modules WHERE module_code = 'EIGHT_HOUR_MON';
    PRINT '  ℹ Module already exists: EIGHT_HOUR_MON (ID: ' + CAST(@ModuleId AS VARCHAR) + ')';
END
ELSE
BEGIN
    INSERT INTO ccms_acl_modules (
        module_name, module_code, category_id, icon, route, display_order, is_active, created_at, created_by
    )
    VALUES (
        'Eight Hour Monitoring', 'EIGHT_HOUR_MON', NULL, 'clock', '/eight-hour-monitoring', 100, 1, GETDATE(), 'admin'
    );

    SELECT @ModuleId = SCOPE_IDENTITY();
    PRINT '  ✓ Created module: EIGHT_HOUR_MON (ID: ' + CAST(@ModuleId AS VARCHAR) + ')';
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
    VALUES (@ModuleId, @ActionView, 'View Monitoring Checks', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW';
END
ELSE
    PRINT '  ℹ Action already linked: VIEW';

IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionUpdate)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionUpdate, 'Record Monitoring Checks', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: UPDATE';
END
ELSE
    PRINT '  ℹ Action already linked: UPDATE';

PRINT '';

-- ============================================================================
-- STEP 4: Grant Permissions to Super Admin Role
-- ============================================================================
PRINT 'Step 4: Granting permissions to Super Admin role...';

DECLARE @SuperAdminRoleId INT = 1;
DECLARE @ModuleActionIds TABLE (module_action_id INT, action_code VARCHAR(50));
INSERT INTO @ModuleActionIds
SELECT ma.module_action_id, a.action_code
FROM ccms_acl_module_actions ma
INNER JOIN ccms_acl_actions a ON ma.action_id = a.action_id
WHERE ma.module_id = @ModuleId;

DECLARE @MAId INT, @ActionCode VARCHAR(50);
DECLARE permission_cursor CURSOR FOR SELECT module_action_id, action_code FROM @ModuleActionIds;

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

DECLARE @ActionsCount INT, @PermissionsCount INT;
SELECT @ActionsCount = COUNT(*) FROM ccms_acl_module_actions WHERE module_id = @ModuleId;
SELECT @PermissionsCount = COUNT(*) FROM ccms_acl_role_permissions rp 
  INNER JOIN ccms_acl_module_actions ma ON rp.module_action_id = ma.module_action_id 
  WHERE ma.module_id = @ModuleId AND rp.role_id = @SuperAdminRoleId;

PRINT 'Actions linked to EIGHT_HOUR_MON: ' + CAST(@ActionsCount AS VARCHAR);
PRINT 'Permissions granted to Super Admin: ' + CAST(@PermissionsCount AS VARCHAR);
PRINT '';
PRINT '============================================================================';
PRINT 'CCMS ACL Setup: Eight Hour Monitoring Module - Completed Successfully';
PRINT '============================================================================';
