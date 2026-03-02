-- ============================================================================
-- Add Hospital Management Module to ACL System
-- Date: March 2, 2026
-- ============================================================================
-- PREREQUISITES: ccms_new_schema_2026_v7.sql must be executed first
-- ============================================================================

USE db_ccms;
GO

PRINT '';
PRINT '==================================================';
PRINT 'ADDING HOSPITAL MANAGEMENT MODULE';
PRINT '==================================================';
PRINT '';

-- ============================================================================
-- Add Hospital Management Module (Uncategorised)
-- ============================================================================

PRINT 'Adding Hospital Management module...';

-- Check if module already exists
IF EXISTS (SELECT 1 FROM ccms_acl_modules WHERE module_code = 'HOSPITAL_MGMT')
BEGIN
    PRINT '  - Hospital Management module already exists, skipping...';
END
ELSE
BEGIN
    INSERT INTO ccms_acl_modules (module_name, module_code, description, category_id, route, icon, display_order) VALUES
    ('Hospital Management', 'HOSPITAL_MGMT', 'Manage hospitals and healthcare providers', NULL, '/hospitals', 'hospital', 15);
    
    PRINT '  ✓ Added Hospital Management module (uncategorised)';
END

-- ============================================================================
-- Add Hospital-Specific Actions (if not exists)
-- ============================================================================

PRINT '';
PRINT 'Adding Hospital Management specific actions...';

-- 1. Address Actions (View + Manage)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'VIEW_ADDRESS')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description) VALUES
    ('View Address', 'VIEW_ADDRESS', 'View hospital addresses (readonly)');
    PRINT '  ✓ Added VIEW_ADDRESS action';
END
ELSE
    PRINT '  - VIEW_ADDRESS action already exists';

IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'MANAGE_ADDRESS')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description) VALUES
    ('Manage Address', 'MANAGE_ADDRESS', 'Add, edit, delete hospital addresses');
    PRINT '  ✓ Added MANAGE_ADDRESS action';
END
ELSE
    PRINT '  - MANAGE_ADDRESS action already exists';

-- 2. Codes Actions (View + Manage)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'VIEW_CODES')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description) VALUES
    ('View Codes', 'VIEW_CODES', 'View hospital insurer codes (readonly)');
    PRINT '  ✓ Added VIEW_CODES action';
END
ELSE
    PRINT '  - VIEW_CODES action already exists';

IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'MANAGE_CODES')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description) VALUES
    ('Manage Codes', 'MANAGE_CODES', 'Add, edit, delete hospital insurer codes');
    PRINT '  ✓ Added MANAGE_CODES action';
END
ELSE
    PRINT '  - MANAGE_CODES action already exists';

-- 3. Staff Actions (View + Manage)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'VIEW_STAFF')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description) VALUES
    ('View Staff', 'VIEW_STAFF', 'View hospital staff (readonly)');
    PRINT '  ✓ Added VIEW_STAFF action';
END
ELSE
    PRINT '  - VIEW_STAFF action already exists';

IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'MANAGE_STAFF')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description) VALUES
    ('Manage Staff', 'MANAGE_STAFF', 'Add, edit, delete hospital staff');
    PRINT '  ✓ Added MANAGE_STAFF action';
END
ELSE
    PRINT '  - MANAGE_STAFF action already exists';

-- 4. Contact Actions (View + Manage)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'VIEW_CONTACT')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description) VALUES
    ('View Contact', 'VIEW_CONTACT', 'View staff contacts (readonly)');
    PRINT '  ✓ Added VIEW_CONTACT action';
END
ELSE
    PRINT '  - VIEW_CONTACT action already exists';

IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'MANAGE_CONTACT')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description) VALUES
    ('Manage Contact', 'MANAGE_CONTACT', 'Add, edit, delete staff contacts');
    PRINT '  ✓ Added MANAGE_CONTACT action';
END
ELSE
    PRINT '  - MANAGE_CONTACT action already exists';

-- 5. Fee Actions (View + Manage)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'VIEW_FEES')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description) VALUES
    ('View Fees', 'VIEW_FEES', 'View fee schedules (readonly)');
    PRINT '  ✓ Added VIEW_FEES action';
END
ELSE
    PRINT '  - VIEW_FEES action already exists';

IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'MANAGE_FEES')
BEGIN
    INSERT INTO ccms_acl_actions (action_name, action_code, description) VALUES
    ('Manage Fees', 'MANAGE_FEES', 'Add, edit, delete fee schedules');
    PRINT '  ✓ Added MANAGE_FEES action';
END
ELSE
    PRINT '  - MANAGE_FEES action already exists';

-- ============================================================================
-- Get Module and Action IDs
-- ============================================================================

PRINT '';
PRINT 'Getting module and action IDs...';

DECLARE @hospitalMgmtModuleId INT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'HOSPITAL_MGMT');

-- Standard CRUD Actions
DECLARE @viewActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'VIEW');
DECLARE @createActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'CREATE');
DECLARE @updateActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'UPDATE');
DECLARE @deleteActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'DELETE');

-- Sub-Entity View Actions (Readonly)
DECLARE @viewAddressActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'VIEW_ADDRESS');
DECLARE @viewCodesActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'VIEW_CODES');
DECLARE @viewStaffActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'VIEW_STAFF');
DECLARE @viewContactActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'VIEW_CONTACT');
DECLARE @viewFeesActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'VIEW_FEES');

-- Sub-Entity Manage Actions (Full CRUD)
DECLARE @manageAddressActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_ADDRESS');
DECLARE @manageCodesActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_CODES');
DECLARE @manageStaffActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_STAFF');
DECLARE @manageContactActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_CONTACT');
DECLARE @manageFeesActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_FEES');

IF @hospitalMgmtModuleId IS NULL
BEGIN
    PRINT '  ✗ ERROR: Hospital Management module not found';
    RETURN;
END

IF @viewActionId IS NULL OR @createActionId IS NULL OR @updateActionId IS NULL OR @deleteActionId IS NULL
BEGIN
    PRINT '  ✗ ERROR: One or more standard actions (VIEW, CREATE, UPDATE, DELETE) not found';
    RETURN;
END

IF @viewAddressActionId IS NULL OR @viewCodesActionId IS NULL OR @viewStaffActionId IS NULL 
   OR @viewContactActionId IS NULL OR @viewFeesActionId IS NULL
BEGIN
    PRINT '  ✗ ERROR: One or more VIEW_* (readonly) actions not found';
    RETURN;
END

IF @manageAddressActionId IS NULL OR @manageCodesActionId IS NULL OR @manageStaffActionId IS NULL 
   OR @manageContactActionId IS NULL OR @manageFeesActionId IS NULL
BEGIN
    PRINT '  ✗ ERROR: One or more MANAGE_* actions not found';
    RETURN;
END

PRINT '  ✓ Retrieved all action IDs successfully';
PRINT '    - Hospital Management Module ID: ' + CAST(@hospitalMgmtModuleId AS VARCHAR);
PRINT '    - Standard Actions (4): VIEW, CREATE, UPDATE, DELETE';
PRINT '    - Readonly Actions (5): VIEW_ADDRESS, VIEW_CODES, VIEW_STAFF, VIEW_CONTACT, VIEW_FEES';
PRINT '    - Manage Actions (5): MANAGE_ADDRESS, MANAGE_CODES, MANAGE_STAFF, MANAGE_CONTACT, MANAGE_FEES';

-- ============================================================================
-- Create Module-Action Mappings
-- ============================================================================

PRINT '';
PRINT 'Creating module-action mappings...';

-- 1. Hospital Management + VIEW (View hospitals)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @viewActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @viewActionId, 'View hospitals and their details');
    PRINT '  ✓ Mapped: Hospital Management → VIEW';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → VIEW';

-- 2. Hospital Management + CREATE (Create hospitals)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @createActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @createActionId, 'Create new hospital records');
    PRINT '  ✓ Mapped: Hospital Management → CREATE';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → CREATE';

-- 3. Hospital Management + UPDATE (Update hospitals)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @updateActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @updateActionId, 'Update existing hospital records');
    PRINT '  ✓ Mapped: Hospital Management → UPDATE';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → UPDATE';

-- 4. Hospital Management + DELETE (Delete hospitals)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @deleteActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @deleteActionId, 'Delete hospital records (soft delete)');
    PRINT '  ✓ Mapped: Hospital Management → DELETE';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → DELETE';

-- 5. Hospital Management + VIEW_ADDRESS (View addresses - Readonly)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @viewAddressActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @viewAddressActionId, 'View hospital addresses (readonly)');
    PRINT '  ✓ Mapped: Hospital Management → VIEW_ADDRESS';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → VIEW_ADDRESS';

-- 6. Hospital Management + MANAGE_ADDRESS (Manage addresses - Full CRUD)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @manageAddressActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @manageAddressActionId, 'Add, edit, delete hospital addresses');
    PRINT '  ✓ Mapped: Hospital Management → MANAGE_ADDRESS';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → MANAGE_ADDRESS';

-- 7. Hospital Management + VIEW_CODES (View codes - Readonly)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @viewCodesActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @viewCodesActionId, 'View hospital insurer codes (readonly)');
    PRINT '  ✓ Mapped: Hospital Management → VIEW_CODES';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → VIEW_CODES';

-- 8. Hospital Management + MANAGE_CODES (Manage codes - Full CRUD)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @manageCodesActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @manageCodesActionId, 'Add, edit, delete hospital insurer codes');
    PRINT '  ✓ Mapped: Hospital Management → MANAGE_CODES';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → MANAGE_CODES';

-- 9. Hospital Management + VIEW_STAFF (View staff - Readonly)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @viewStaffActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @viewStaffActionId, 'View hospital staff (readonly)');
    PRINT '  ✓ Mapped: Hospital Management → VIEW_STAFF';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → VIEW_STAFF';

-- 10. Hospital Management + MANAGE_STAFF (Manage staff - Full CRUD)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @manageStaffActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @manageStaffActionId, 'Add, edit, delete hospital staff');
    PRINT '  ✓ Mapped: Hospital Management → MANAGE_STAFF';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → MANAGE_STAFF';

-- 11. Hospital Management + VIEW_CONTACT (View contacts - Readonly)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @viewContactActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @viewContactActionId, 'View staff contacts (readonly)');
    PRINT '  ✓ Mapped: Hospital Management → VIEW_CONTACT';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → VIEW_CONTACT';

-- 12. Hospital Management + MANAGE_CONTACT (Manage contacts - Full CRUD)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @manageContactActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @manageContactActionId, 'Add, edit, delete staff contacts');
    PRINT '  ✓ Mapped: Hospital Management → MANAGE_CONTACT';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → MANAGE_CONTACT';

-- 13. Hospital Management + VIEW_FEES (View fees - Readonly)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @viewFeesActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @viewFeesActionId, 'View fee schedules (readonly)');
    PRINT '  ✓ Mapped: Hospital Management → VIEW_FEES';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → VIEW_FEES';

-- 14. Hospital Management + MANAGE_FEES (Manage fees - Full CRUD)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @hospitalMgmtModuleId AND action_id = @manageFeesActionId)
BEGIN
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
    (@hospitalMgmtModuleId, @manageFeesActionId, 'Add, edit, delete fee schedules');
    PRINT '  ✓ Mapped: Hospital Management → MANAGE_FEES';
END
ELSE
    PRINT '  - Mapping already exists: Hospital Management → MANAGE_FEES';

-- ============================================================================
-- Assign Permissions to Super Admin Role
-- ============================================================================

PRINT '';
PRINT 'Assigning permissions to Super Admin role...';

DECLARE @superAdminRoleId INT = 1; -- Super Admin role_id

-- Get all Module-Action IDs
DECLARE @hospitalViewId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @viewActionId);
DECLARE @hospitalCreateId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @createActionId);
DECLARE @hospitalUpdateId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @updateActionId);
DECLARE @hospitalDeleteId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @deleteActionId);

DECLARE @hospitalViewAddressId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @viewAddressActionId);
DECLARE @hospitalManageAddressId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @manageAddressActionId);

DECLARE @hospitalViewCodesId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @viewCodesActionId);
DECLARE @hospitalManageCodesId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @manageCodesActionId);

DECLARE @hospitalViewStaffId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @viewStaffActionId);
DECLARE @hospitalManageStaffId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @manageStaffActionId);

DECLARE @hospitalViewContactId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @viewContactActionId);
DECLARE @hospitalManageContactId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @manageContactActionId);

DECLARE @hospitalViewFeesId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @viewFeesActionId);
DECLARE @hospitalManageFeesId INT = (SELECT ma.module_action_id FROM ccms_acl_module_actions ma WHERE ma.module_id = @hospitalMgmtModuleId AND ma.action_id = @manageFeesActionId);

-- Assign all 14 permissions to Super Admin
-- Standard CRUD (4 permissions)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalViewId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalViewId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → VIEW';
END

IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalCreateId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalCreateId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → CREATE';
END

IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalUpdateId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalUpdateId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → UPDATE';
END

IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalDeleteId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalDeleteId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → DELETE';
END

-- Address (2 permissions: View + Manage)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalViewAddressId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalViewAddressId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → VIEW_ADDRESS';
END

IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalManageAddressId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalManageAddressId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → MANAGE_ADDRESS';
END

-- Codes (2 permissions: View + Manage)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalViewCodesId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalViewCodesId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → VIEW_CODES';
END

IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalManageCodesId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalManageCodesId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → MANAGE_CODES';
END

-- Staff (2 permissions: View + Manage)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalViewStaffId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalViewStaffId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → VIEW_STAFF';
END

IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalManageStaffId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalManageStaffId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → MANAGE_STAFF';
END

-- Contact (2 permissions: View + Manage)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalViewContactId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalViewContactId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → VIEW_CONTACT';
END

IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalManageContactId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalManageContactId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → MANAGE_CONTACT';
END

-- Fees (2 permissions: View + Manage)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalViewFeesId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalViewFeesId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → VIEW_FEES';
END

IF NOT EXISTS (SELECT 1 FROM ccms_acl_role_permissions WHERE role_id = @superAdminRoleId AND module_action_id = @hospitalManageFeesId)
BEGIN
    INSERT INTO ccms_acl_role_permissions (role_id, module_action_id) VALUES (@superAdminRoleId, @hospitalManageFeesId);
    PRINT '  ✓ Assigned: Super Admin → Hospital Management → MANAGE_FEES';
END

-- ============================================================================
-- Verification
-- ============================================================================

PRINT '';
PRINT '==================================================';
PRINT 'VERIFICATION';
PRINT '==================================================';

PRINT '';
PRINT '1. Hospital Management module:';
SELECT 
    module_id,
    module_name,
    module_code,
    route,
    icon,
    display_order,
    CASE WHEN category_id IS NULL THEN 'Uncategorised' ELSE CAST(category_id AS VARCHAR) END AS category_id,
    is_active
FROM ccms_acl_modules 
WHERE module_code = 'HOSPITAL_MGMT';

PRINT '';
PRINT '2. Hospital-specific actions (10 new actions):';
SELECT 
    action_id,
    action_name,
    action_code,
    description
FROM ccms_acl_actions 
WHERE action_code IN ('VIEW_ADDRESS', 'MANAGE_ADDRESS', 'VIEW_CODES', 'MANAGE_CODES', 
                      'VIEW_STAFF', 'MANAGE_STAFF', 'VIEW_CONTACT', 'MANAGE_CONTACT', 
                      'VIEW_FEES', 'MANAGE_FEES')
ORDER BY action_id;

PRINT '';
PRINT '3. Module-Action mappings (14 total):';
SELECT 
    ma.module_action_id,
    m.module_name,
    a.action_name,
    a.action_code,
    ma.action_label,
    ma.is_active
FROM ccms_acl_module_actions ma
JOIN ccms_acl_modules m ON ma.module_id = m.module_id
JOIN ccms_acl_actions a ON ma.action_id = a.action_id
WHERE m.module_code = 'HOSPITAL_MGMT'
ORDER BY a.action_id;

PRINT '';
PRINT '4. Super Admin role permissions (14 total):';
SELECT 
    r.role_name,
    m.module_name,
    a.action_name,
    a.action_code,
    rp.created_at
FROM ccms_acl_role_permissions rp
JOIN ccms_acl_module_actions ma ON rp.module_action_id = ma.module_action_id
JOIN ccms_acl_modules m ON ma.module_id = m.module_id
JOIN ccms_acl_actions a ON ma.action_id = a.action_id
JOIN ccms_acl_roles r ON rp.role_id = r.role_id
WHERE m.module_code = 'HOSPITAL_MGMT' AND r.role_id = 1
ORDER BY a.action_id;

PRINT '';
PRINT '==================================================';
PRINT 'HOSPITAL MANAGEMENT MODULE SETUP COMPLETED';
PRINT 'Module: Hospital Management (Uncategorised)';
PRINT 'Permissions: 14 total';
PRINT '  - Standard CRUD: VIEW, CREATE, UPDATE, DELETE (4)';
PRINT '  - Readonly Access: VIEW_ADDRESS, VIEW_CODES, VIEW_STAFF, VIEW_CONTACT, VIEW_FEES (5)';
PRINT '  - Full Management: MANAGE_ADDRESS, MANAGE_CODES, MANAGE_STAFF, MANAGE_CONTACT, MANAGE_FEES (5)';
PRINT 'Super Admin: All 14 permissions granted';
PRINT '==================================================';
PRINT '';

GO
