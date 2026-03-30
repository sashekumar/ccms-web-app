-- ============================================================================
-- CCMS ACL Seed Data: Admissions Module
-- ============================================================================
-- Purpose: Sets up all access control configurations for the Admissions module
-- Module: ADMISSIONS
-- Route: /admissions
-- Tables: ccms_admissions
-- 
-- Actions: 5 permissions
--   - VIEW: View admissions list and details
--   - CREATE: Create new admissions
--   - UPDATE: Update admission information (blocked after approval)
--   - DELETE: Delete admissions (blocked after approval)
--   - APPROVE: Approve or reject admissions and generate Guarantee Letter (GL)
-- 
-- Business Rules:
--   - Cannot edit or delete admission after approval
--   - APPROVE permission is separate from CRUD for role-based access control
--   - GL auto-generation on approval: Format GL-YYYY-NNNN
-- ============================================================================

USE db_ccms;
GO

SET NOCOUNT ON;
PRINT '============================================================================';
PRINT 'CCMS ACL Setup: Admissions Module';
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
WHERE action_code IN ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE');

-- Insert VIEW if not exists (reusable across modules)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'VIEW')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('View', 'VIEW', 'View and read data', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: VIEW';
END
ELSE
    PRINT '  ℹ Action already exists: VIEW';

-- Insert CREATE if not exists (reusable across modules)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'CREATE')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Create', 'CREATE', 'Create new records', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: CREATE';
END
ELSE
    PRINT '  ℹ Action already exists: CREATE';

-- Insert UPDATE if not exists (reusable across modules)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'UPDATE')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Update', 'UPDATE', 'Update existing records', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: UPDATE';
END
ELSE
    PRINT '  ℹ Action already exists: UPDATE';

-- Insert DELETE if not exists (reusable across modules)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'DELETE')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Delete', 'DELETE', 'Delete records', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: DELETE';
END
ELSE
    PRINT '  ℹ Action already exists: DELETE';

-- Insert APPROVE if not exists (reusable for approval workflows)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'APPROVE')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Approve', 'APPROVE', 'Approve or reject records (workflow action)', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: APPROVE';
END
ELSE
    PRINT '  ℹ Action already exists: APPROVE';

PRINT '';

-- ============================================================================
-- STEP 2: Create Module
-- ============================================================================
PRINT 'Step 2: Creating module...';

DECLARE @ModuleId INT;

-- Check if module already exists
IF EXISTS (SELECT 1 FROM ccms_acl_modules WHERE module_code = 'ADMISSIONS')
BEGIN
    SELECT @ModuleId = module_id FROM ccms_acl_modules WHERE module_code = 'ADMISSIONS';
    PRINT '  ℹ Module already exists: ADMISSIONS (ID: ' + CAST(@ModuleId AS VARCHAR) + ')';
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
        'Admissions',               -- module_name
        'ADMISSIONS',               -- module_code
        NULL,                       -- category_id (NULL = uncategorized, top-level menu)
        'file-medical-alt',         -- icon (FontAwesome icon name)
        '/admissions',              -- route
        30,                         -- display_order (after Members=20, before Claims=40)
        1,                          -- is_active
        GETDATE(),                  -- created_at
        'admin'                     -- created_by
    );
    
    SELECT @ModuleId = SCOPE_IDENTITY();
    PRINT '  ✓ Created module: ADMISSIONS (ID: ' + CAST(@ModuleId AS VARCHAR) + ')';
END

PRINT '';

-- ============================================================================
-- STEP 3: Link Actions to Module
-- ============================================================================
PRINT 'Step 3: Linking actions to module...';

-- Get action IDs
DECLARE @ActionView INT, @ActionCreate INT, @ActionUpdate INT, @ActionDelete INT, @ActionApprove INT;

SELECT @ActionView = action_id FROM ccms_acl_actions WHERE action_code = 'VIEW';
SELECT @ActionCreate = action_id FROM ccms_acl_actions WHERE action_code = 'CREATE';
SELECT @ActionUpdate = action_id FROM ccms_acl_actions WHERE action_code = 'UPDATE';
SELECT @ActionDelete = action_id FROM ccms_acl_actions WHERE action_code = 'DELETE';
SELECT @ActionApprove = action_id FROM ccms_acl_actions WHERE action_code = 'APPROVE';

-- Link VIEW
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionView)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionView, 'View Admissions', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW';
END
ELSE
    PRINT '  ℹ Action already linked: VIEW';

-- Link CREATE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionCreate)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionCreate, 'Create Admission', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: CREATE';
END
ELSE
    PRINT '  ℹ Action already linked: CREATE';

-- Link UPDATE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionUpdate)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionUpdate, 'Update Admission', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: UPDATE';
END
ELSE
    PRINT '  ℹ Action already linked: UPDATE';

-- Link DELETE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionDelete)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionDelete, 'Delete Admission', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: DELETE';
END
ELSE
    PRINT '  ℹ Action already linked: DELETE';

-- Link APPROVE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionApprove)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionApprove, 'Approve Admission', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: APPROVE';
END
ELSE
    PRINT '  ℹ Action already linked: APPROVE';

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

-- Grant all 5 permissions
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

-- Count actions
DECLARE @ActionCount INT;
SELECT @ActionCount = COUNT(*) FROM ccms_acl_actions 
WHERE action_code IN ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE');
PRINT 'Total relevant actions in system: ' + CAST(@ActionCount AS VARCHAR);

-- Count module-actions
DECLARE @ModuleActionCount INT;
SELECT @ModuleActionCount = COUNT(*) FROM ccms_acl_module_actions WHERE module_id = @ModuleId;
PRINT 'Actions linked to ADMISSIONS module: ' + CAST(@ModuleActionCount AS VARCHAR);

-- Count role permissions
DECLARE @PermissionCount INT;
SELECT @PermissionCount = COUNT(*) 
FROM ccms_acl_role_permissions rp
INNER JOIN ccms_acl_module_actions ma ON rp.module_action_id = ma.module_action_id
WHERE ma.module_id = @ModuleId AND rp.role_id = @SuperAdminRoleId;
PRINT 'Permissions granted to Super Admin: ' + CAST(@PermissionCount AS VARCHAR);

PRINT '';

IF @ModuleActionCount = 5 AND @PermissionCount = 5
BEGIN
    PRINT '✓✓✓ SUCCESS: Admissions module ACL setup complete! ✓✓✓';
    PRINT '';
    PRINT 'Module Details:';
    PRINT '  - Module Code: ADMISSIONS';
    PRINT '  - Display Name: Admissions';
    PRINT '  - Route: /admissions';
    PRINT '  - Icon: file-medical-alt';
    PRINT '  - Actions: 5 (VIEW, CREATE, UPDATE, DELETE, APPROVE)';
    PRINT '  - Super Admin: All 5 permissions granted';
    PRINT '';
    PRINT 'Permission Summary:';
    PRINT '  - VIEW: View admissions list and details';
    PRINT '  - CREATE: Create new admission entries';
    PRINT '  - UPDATE: Edit pending admissions (blocked after approval)';
    PRINT '  - DELETE: Soft-delete pending admissions (blocked after approval)';
    PRINT '  - APPROVE: Approve/reject admissions and generate GL';
    PRINT '';
    PRINT 'Next Steps:';
    PRINT '  1. Run admission table migration (create ccms_admissions table)';
    PRINT '  2. Implement backend (entity, service, controller)';
    PRINT '  3. Implement frontend (components, service, routing)';
    PRINT '  4. Test admission workflow: Create → Approve → Generate GL';
    PRINT '';
    PRINT 'Note: Users may need to logout and login for menu changes to appear.';
END
ELSE
BEGIN
    PRINT '✗✗✗ WARNING: Setup incomplete! ✗✗✗';
    PRINT 'Expected 5 module-actions and 5 permissions, but found:';
    PRINT '  - Module-actions: ' + CAST(@ModuleActionCount AS VARCHAR);
    PRINT '  - Permissions: ' + CAST(@PermissionCount AS VARCHAR);
    PRINT 'Please review the output above for errors.';
END

PRINT '';
PRINT '============================================================================';
PRINT 'ACL Setup Complete';
PRINT '============================================================================';

SET NOCOUNT OFF;
