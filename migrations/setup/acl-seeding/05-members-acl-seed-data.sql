-- ============================================================================
-- CCMS ACL Seed Data: Policy Holders (Members) Module
-- ============================================================================
-- Purpose: Sets up all access control configurations for the Policy Holders module
-- Module: POLICY_HOLDERS
-- Route: /members
-- Tables: ccms_members, ccms_member_addresses, ccms_member_contacts, 
--         ccms_member_policies, ccms_member_dependents, ccms_member_pec_conditions
-- 
-- Actions: 15 granular permissions
--   - VIEW: View members list and details
--   - CREATE: Create new members
--   - UPDATE: Update member information
--   - DELETE: Delete members
--   - DEACTIVATE: Deactivate/reactivate members
--   - VIEW_ADDRESSES: Read-only view of member addresses
--   - VIEW_CONTACTS: Read-only view of member contacts
--   - VIEW_POLICIES: Read-only view of member policies
--   - VIEW_DEPENDENTS: Read-only view of dependents
--   - VIEW_PEC: Read-only view of pre-existing conditions
--   - MANAGE_ADDRESSES: Create/update/delete addresses
--   - MANAGE_CONTACTS: Create/update/delete contact information
--   - MANAGE_POLICIES: Assign/update/remove policies
--   - MANAGE_DEPENDENTS: Add/update/remove dependents
--   - MANAGE_PEC: Manage pre-existing conditions for dependents
-- ============================================================================

USE db_ccms;
GO

SET NOCOUNT ON;
PRINT '============================================================================';
PRINT 'CCMS ACL Setup: Policy Holders Module';
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
WHERE action_code IN ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE', 
                      'VIEW_ADDRESSES', 'VIEW_CONTACTS', 'VIEW_POLICIES', 'VIEW_DEPENDENTS', 'VIEW_PEC',
                      'MANAGE_ADDRESSES', 'MANAGE_CONTACTS', 'MANAGE_POLICIES', 'MANAGE_DEPENDENTS', 'MANAGE_PEC');

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

-- Insert DEACTIVATE if not exists (reusable across modules)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'DEACTIVATE')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Deactivate', 'DEACTIVATE', 'Deactivate or reactivate records', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: DEACTIVATE';
END
ELSE
    PRINT '  ℹ Action already exists: DEACTIVATE';

-- Insert VIEW_ADDRESSES (member-specific read-only)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'VIEW_ADDRESSES')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('View Addresses', 'VIEW_ADDRESSES', 'View member addresses (read-only)', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: VIEW_ADDRESSES';
END
ELSE
    PRINT '  ℹ Action already exists: VIEW_ADDRESSES';

-- Insert VIEW_CONTACTS (member-specific read-only)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'VIEW_CONTACTS')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('View Contacts', 'VIEW_CONTACTS', 'View member contacts (read-only)', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: VIEW_CONTACTS';
END
ELSE
    PRINT '  ℹ Action already exists: VIEW_CONTACTS';

-- Insert VIEW_POLICIES (member-specific read-only)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'VIEW_POLICIES')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('View Policies', 'VIEW_POLICIES', 'View member policies (read-only)', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: VIEW_POLICIES';
END
ELSE
    PRINT '  ℹ Action already exists: VIEW_POLICIES';

-- Insert VIEW_DEPENDENTS (member-specific read-only)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'VIEW_DEPENDENTS')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('View Dependents', 'VIEW_DEPENDENTS', 'View member dependents (read-only)', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: VIEW_DEPENDENTS';
END
ELSE
    PRINT '  ℹ Action already exists: VIEW_DEPENDENTS';

-- Insert VIEW_PEC (member-specific read-only)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'VIEW_PEC')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('View PEC', 'VIEW_PEC', 'View pre-existing conditions (read-only)', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: VIEW_PEC';
END
ELSE
    PRINT '  ℹ Action already exists: VIEW_PEC';

-- Insert MANAGE_ADDRESSES (member-specific)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'MANAGE_ADDRESSES')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Manage Addresses', 'MANAGE_ADDRESSES', 'Create, update, delete member addresses', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: MANAGE_ADDRESSES';
END
ELSE
    PRINT '  ℹ Action already exists: MANAGE_ADDRESSES';

-- Insert MANAGE_CONTACTS (member-specific)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'MANAGE_CONTACTS')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Manage Contacts', 'MANAGE_CONTACTS', 'Create, update, delete member contact information', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: MANAGE_CONTACTS';
END
ELSE
    PRINT '  ℹ Action already exists: MANAGE_CONTACTS';

-- Insert MANAGE_POLICIES (member-specific)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'MANAGE_POLICIES')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Manage Policies', 'MANAGE_POLICIES', 'Assign, update, remove member policies', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: MANAGE_POLICIES';
END
ELSE
    PRINT '  ℹ Action already exists: MANAGE_POLICIES';

-- Insert MANAGE_DEPENDENTS (member-specific)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'MANAGE_DEPENDENTS')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Manage Dependents', 'MANAGE_DEPENDENTS', 'Add, update, remove member dependents', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: MANAGE_DEPENDENTS';
END
ELSE
    PRINT '  ℹ Action already exists: MANAGE_DEPENDENTS';

-- Insert MANAGE_PEC (member-specific)
IF NOT EXISTS (SELECT 1 FROM @ExistingActions WHERE action_code = 'MANAGE_PEC')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Manage PEC', 'MANAGE_PEC', 'Manage pre-existing conditions for dependents', 1, GETDATE(), 'admin');
    PRINT '  ✓ Created action: MANAGE_PEC';
END
ELSE
    PRINT '  ℹ Action already exists: MANAGE_PEC';

PRINT '';

-- ============================================================================
-- STEP 2: Create Module
-- ============================================================================
PRINT 'Step 2: Creating module...';

DECLARE @ModuleId INT;

-- Check if module already exists
IF EXISTS (SELECT 1 FROM ccms_acl_modules WHERE module_code = 'POLICY_HOLDERS')
BEGIN
    SELECT @ModuleId = module_id FROM ccms_acl_modules WHERE module_code = 'POLICY_HOLDERS';
    PRINT '  ℹ Module already exists: POLICY_HOLDERS (ID: ' + CAST(@ModuleId AS VARCHAR) + ')';
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
        'Policy Holders',           -- module_name
        'POLICY_HOLDERS',           -- module_code
        NULL,                       -- category_id (NULL = uncategorized, top-level menu)
        'users',                    -- icon (FontAwesome icon name)
        '/members',                 -- route
        20,                         -- display_order
        1,                          -- is_active
        GETDATE(),                  -- created_at
        'admin'                     -- created_by
    );
    
    SELECT @ModuleId = SCOPE_IDENTITY();
    PRINT '  ✓ Created module: POLICY_HOLDERS (ID: ' + CAST(@ModuleId AS VARCHAR) + ')';
END

PRINT '';

-- ============================================================================
-- STEP 3: Link Actions to Module
-- ============================================================================
PRINT 'Step 3: Linking actions to module...';

-- Get action IDs
DECLARE @ActionView INT, @ActionCreate INT, @ActionUpdate INT, @ActionDelete INT, @ActionDeactivate INT;
DECLARE @ActionViewAddresses INT, @ActionViewContacts INT, @ActionViewPolicies INT, @ActionViewDependents INT, @ActionViewPEC INT;
DECLARE @ActionManageAddresses INT, @ActionManageContacts INT, @ActionManagePolicies INT, @ActionManageDependents INT, @ActionManagePEC INT;

SELECT @ActionView = action_id FROM ccms_acl_actions WHERE action_code = 'VIEW';
SELECT @ActionCreate = action_id FROM ccms_acl_actions WHERE action_code = 'CREATE';
SELECT @ActionUpdate = action_id FROM ccms_acl_actions WHERE action_code = 'UPDATE';
SELECT @ActionDelete = action_id FROM ccms_acl_actions WHERE action_code = 'DELETE';
SELECT @ActionDeactivate = action_id FROM ccms_acl_actions WHERE action_code = 'DEACTIVATE';
SELECT @ActionViewAddresses = action_id FROM ccms_acl_actions WHERE action_code = 'VIEW_ADDRESSES';
SELECT @ActionViewContacts = action_id FROM ccms_acl_actions WHERE action_code = 'VIEW_CONTACTS';
SELECT @ActionViewPolicies = action_id FROM ccms_acl_actions WHERE action_code = 'VIEW_POLICIES';
SELECT @ActionViewDependents = action_id FROM ccms_acl_actions WHERE action_code = 'VIEW_DEPENDENTS';
SELECT @ActionViewPEC = action_id FROM ccms_acl_actions WHERE action_code = 'VIEW_PEC';
SELECT @ActionManageAddresses = action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_ADDRESSES';
SELECT @ActionManageContacts = action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_CONTACTS';
SELECT @ActionManagePolicies = action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_POLICIES';
SELECT @ActionManageDependents = action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_DEPENDENTS';
SELECT @ActionManagePEC = action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_PEC';

-- Link VIEW
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionView)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionView, 'View Members', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW';
END
ELSE
    PRINT '  ℹ Action already linked: VIEW';

-- Link CREATE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionCreate)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionCreate, 'Create Member', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: CREATE';
END
ELSE
    PRINT '  ℹ Action already linked: CREATE';

-- Link UPDATE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionUpdate)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionUpdate, 'Update Member', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: UPDATE';
END
ELSE
    PRINT '  ℹ Action already linked: UPDATE';

-- Link DELETE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionDelete)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionDelete, 'Delete Member', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: DELETE';
END
ELSE
    PRINT '  ℹ Action already linked: DELETE';

-- Link DEACTIVATE
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionDeactivate)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionDeactivate, 'Deactivate Member', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: DEACTIVATE';
END
ELSE
    PRINT '  ℹ Action already linked: DEACTIVATE';

-- Link VIEW_ADDRESSES
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionViewAddresses)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionViewAddresses, 'View Member Addresses', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW_ADDRESSES';
END
ELSE
    PRINT '  ℹ Action already linked: VIEW_ADDRESSES';

-- Link VIEW_CONTACTS
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionViewContacts)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionViewContacts, 'View Member Contacts', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW_CONTACTS';
END
ELSE
    PRINT '  ℹ Action already linked: VIEW_CONTACTS';

-- Link VIEW_POLICIES
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionViewPolicies)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionViewPolicies, 'View Member Policies', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW_POLICIES';
END
ELSE
    PRINT '  ℹ Action already linked: VIEW_POLICIES';

-- Link VIEW_DEPENDENTS
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionViewDependents)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionViewDependents, 'View Member Dependents', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW_DEPENDENTS';
END
ELSE
    PRINT '  ℹ Action already linked: VIEW_DEPENDENTS';

-- Link VIEW_PEC
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionViewPEC)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionViewPEC, 'View Pre-Existing Conditions', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: VIEW_PEC';
END
ELSE
    PRINT '  ℹ Action already linked: VIEW_PEC';

-- Link MANAGE_ADDRESSES
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionManageAddresses)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionManageAddresses, 'Manage Member Addresses', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: MANAGE_ADDRESSES';
END
ELSE
    PRINT '  ℹ Action already linked: MANAGE_ADDRESSES';

-- Link MANAGE_CONTACTS
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionManageContacts)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionManageContacts, 'Manage Member Contacts', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: MANAGE_CONTACTS';
END
ELSE
    PRINT '  ℹ Action already linked: MANAGE_CONTACTS';

-- Link MANAGE_POLICIES
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionManagePolicies)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionManagePolicies, 'Manage Member Policies', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: MANAGE_POLICIES';
END
ELSE
    PRINT '  ℹ Action already linked: MANAGE_POLICIES';

-- Link MANAGE_DEPENDENTS
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionManageDependents)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionManageDependents, 'Manage Member Dependents', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: MANAGE_DEPENDENTS';
END
ELSE
    PRINT '  ℹ Action already linked: MANAGE_DEPENDENTS';

-- Link MANAGE_PEC
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionManagePEC)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionManagePEC, 'Manage Pre-Existing Conditions', 1, GETDATE(), 'admin');
    PRINT '  ✓ Linked action: MANAGE_PEC';
END
ELSE
    PRINT '  ℹ Action already linked: MANAGE_PEC';

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

-- Grant all 15 permissions
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
WHERE action_code IN ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE', 
                      'VIEW_ADDRESSES', 'VIEW_CONTACTS', 'VIEW_POLICIES', 'VIEW_DEPENDENTS', 'VIEW_PEC',
                      'MANAGE_ADDRESSES', 'MANAGE_CONTACTS', 'MANAGE_POLICIES', 'MANAGE_DEPENDENTS', 'MANAGE_PEC');
PRINT 'Total relevant actions in system: ' + CAST(@ActionCount AS VARCHAR);

-- Count module-actions
DECLARE @ModuleActionCount INT;
SELECT @ModuleActionCount = COUNT(*) FROM ccms_acl_module_actions WHERE module_id = @ModuleId;
PRINT 'Actions linked to POLICY_HOLDERS module: ' + CAST(@ModuleActionCount AS VARCHAR);

-- Count role permissions
DECLARE @PermissionCount INT;
SELECT @PermissionCount = COUNT(*) 
FROM ccms_acl_role_permissions rp
INNER JOIN ccms_acl_module_actions ma ON rp.module_action_id = ma.module_action_id
WHERE ma.module_id = @ModuleId AND rp.role_id = @SuperAdminRoleId;
PRINT 'Permissions granted to Super Admin: ' + CAST(@PermissionCount AS VARCHAR);

PRINT '';

IF @ModuleActionCount = 15 AND @PermissionCount = 15
BEGIN
    PRINT '✓✓✓ SUCCESS: Policy Holders module ACL setup complete! ✓✓✓';
    PRINT '';
    PRINT 'Module Details:';
    PRINT '  - Module Code: POLICY_HOLDERS';
    PRINT '  - Display Name: Policy Holders';
    PRINT '  - Route: /members';
    PRINT '  - Icon: users';
    PRINT '  - Actions: 15 (VIEW, CREATE, UPDATE, DELETE, DEACTIVATE,';
    PRINT '                  VIEW_ADDRESSES, VIEW_CONTACTS, VIEW_POLICIES, VIEW_DEPENDENTS, VIEW_PEC,';
    PRINT '                  MANAGE_ADDRESSES, MANAGE_CONTACTS, MANAGE_POLICIES, MANAGE_DEPENDENTS, MANAGE_PEC)';
    PRINT '  - Super Admin: All 15 permissions granted';
    PRINT '';
    PRINT 'Next Steps:';
    PRINT '  1. Implement backend (types, repositories, service, controller, routes)';
    PRINT '  2. Implement frontend (models, service, components, routing)';
    PRINT '  3. Test the module end-to-end';
    PRINT '';
    PRINT 'Note: Users may need to logout and login again for menu changes to appear.';
END
ELSE
BEGIN
    PRINT '✗✗✗ WARNING: Setup incomplete! ✗✗✗';
    PRINT 'Expected 15 module-actions and 15 permissions, but found:';
    PRINT '  - Module-actions: ' + CAST(@ModuleActionCount AS VARCHAR);
    PRINT '  - Permissions: ' + CAST(@PermissionCount AS VARCHAR);
    PRINT 'Please review the output above for errors.';
END

PRINT '';
PRINT '============================================================================';
PRINT 'ACL Setup Complete';
PRINT '============================================================================';

SET NOCOUNT OFF;
