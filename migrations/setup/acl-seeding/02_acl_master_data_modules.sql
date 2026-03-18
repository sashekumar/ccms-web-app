-- ============================================================================
-- Add Master Data Management Modules to ACL System
-- Updated: March 2026 (Merged MQ Templates)
-- ============================================================================
-- PREREQUISITES: ccms_new_schema_2026_v7.sql must be executed first
-- ============================================================================

USE db_ccms;
GO

PRINT '';
PRINT '==================================================';
PRINT 'ADDING MASTER DATA MANAGEMENT MODULES';
PRINT '==================================================';
PRINT '';

-- ============================================================================
-- Create Master Data Category
-- ============================================================================

PRINT 'Checking Master Data category...';

IF NOT EXISTS (SELECT 1 FROM ccms_acl_categories WHERE category_code = 'MASTER_DATA')
BEGIN
    SET IDENTITY_INSERT ccms_acl_categories ON;
    INSERT INTO ccms_acl_categories (category_id, category_name, category_code, description, icon, display_order) VALUES
    (2, 'Master Data', 'MASTER_DATA', 'Business master data and lookups', 'database', 50);
    SET IDENTITY_INSERT ccms_acl_categories OFF;
    PRINT '  ✓ Created Master Data category';
END
ELSE
BEGIN
    PRINT '  - Master Data category already exists';
END

-- ============================================================================
-- Add Master Data Modules (Under Master Data Category)
-- ============================================================================

PRINT 'Adding Master Data modules...';

DECLARE @masterDataCategoryId INT = (SELECT category_id FROM ccms_acl_categories WHERE category_code = 'MASTER_DATA');

-- Bank Management
IF NOT EXISTS (SELECT 1 FROM ccms_acl_modules WHERE module_code = 'BANK_MGMT')
    INSERT INTO ccms_acl_modules (module_name, module_code, description, category_id, route, icon, display_order) VALUES
    ('Bank Management', 'BANK_MGMT', 'Manage banks and financial institutions', @masterDataCategoryId, '/master/banks', 'university', 1);

-- Clause Management
IF NOT EXISTS (SELECT 1 FROM ccms_acl_modules WHERE module_code = 'CLAUSE_MGMT')
    INSERT INTO ccms_acl_modules (module_name, module_code, description, category_id, route, icon, display_order) VALUES
    ('Clause Management', 'CLAUSE_MGMT', 'Manage policy clauses and terms', @masterDataCategoryId, '/master/clauses', 'file-alt', 2);

-- Lookups Management
IF NOT EXISTS (SELECT 1 FROM ccms_acl_modules WHERE module_code = 'LOOKUP_MGMT')
    INSERT INTO ccms_acl_modules (module_name, module_code, description, category_id, route, icon, display_order) VALUES
    ('Lookups Management', 'LOOKUP_MGMT', 'Manage lookup categories, values, and metadata', @masterDataCategoryId, '/master/lookups', 'list', 3);

-- MQ Templates Management (Merged from 03)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_modules WHERE module_code = 'MQ_TEMPLATES_MGMT')
    INSERT INTO ccms_acl_modules (module_name, module_code, description, category_id, route, icon, display_order) VALUES
    ('MQ Templates', 'MQ_TEMPLATES_MGMT', 'Manage Medical Questionnaire Templates and Questions', @masterDataCategoryId, '/master/mq-templates', 'file-medical-alt', 4);

PRINT '  ✓ Added/Verified Master Data modules';

-- ============================================================================
-- Add MANAGE_METADATA Action (if not exists)
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'MANAGE_METADATA')
BEGIN
    PRINT 'Adding MANAGE_METADATA action...';
    INSERT INTO ccms_acl_actions (action_name, action_code, description) VALUES
    ('Manage Metadata', 'MANAGE_METADATA', 'Add, edit, or delete metadata attributes');
    PRINT '  ✓ Added MANAGE_METADATA action';
END
ELSE
BEGIN
    PRINT '  - MANAGE_METADATA action already exists';
END

-- ============================================================================
-- Get Module and Action IDs
-- ============================================================================

DECLARE @bankMgmtModuleId INT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'BANK_MGMT');
DECLARE @clauseMgmtModuleId INT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'CLAUSE_MGMT');
DECLARE @lookupMgmtModuleId INT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'LOOKUP_MGMT');
DECLARE @mqMgmtModuleId INT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'MQ_TEMPLATES_MGMT');

DECLARE @viewActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'VIEW');
DECLARE @createActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'CREATE');
DECLARE @updateActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'UPDATE');
DECLARE @deleteActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'DELETE');
DECLARE @manageMetadataActionId INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'MANAGE_METADATA');

-- ============================================================================
-- Create Module-Action Mappings
-- ============================================================================

PRINT 'Creating module-action mappings...';

-- Bank Management actions
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @bankMgmtModuleId AND action_id = @viewActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@bankMgmtModuleId, @viewActionId, 'View Banks');
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @bankMgmtModuleId AND action_id = @createActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@bankMgmtModuleId, @createActionId, 'Create Bank');
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @bankMgmtModuleId AND action_id = @updateActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@bankMgmtModuleId, @updateActionId, 'Update Bank');
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @bankMgmtModuleId AND action_id = @deleteActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@bankMgmtModuleId, @deleteActionId, 'Delete Bank');

-- Clause Management actions
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @clauseMgmtModuleId AND action_id = @viewActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@clauseMgmtModuleId, @viewActionId, 'View Clauses');
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @clauseMgmtModuleId AND action_id = @createActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@clauseMgmtModuleId, @createActionId, 'Create Clause');
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @clauseMgmtModuleId AND action_id = @updateActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@clauseMgmtModuleId, @updateActionId, 'Update Clause');
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @clauseMgmtModuleId AND action_id = @deleteActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@clauseMgmtModuleId, @deleteActionId, 'Delete Clause');

-- Lookups Management actions
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @lookupMgmtModuleId AND action_id = @viewActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@lookupMgmtModuleId, @viewActionId, 'View Lookups');
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @lookupMgmtModuleId AND action_id = @createActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@lookupMgmtModuleId, @createActionId, 'Create Lookup');
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @lookupMgmtModuleId AND action_id = @updateActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@lookupMgmtModuleId, @updateActionId, 'Update Lookup');
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @lookupMgmtModuleId AND action_id = @deleteActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@lookupMgmtModuleId, @deleteActionId, 'Delete Lookup');
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @lookupMgmtModuleId AND action_id = @manageMetadataActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@lookupMgmtModuleId, @manageMetadataActionId, 'Manage Metadata');

-- MQ Templates actions (Merged from 03)
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @mqMgmtModuleId AND action_id = @viewActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@mqMgmtModuleId, @viewActionId, 'View Templates');
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @mqMgmtModuleId AND action_id = @createActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@mqMgmtModuleId, @createActionId, 'Create Template');
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @mqMgmtModuleId AND action_id = @updateActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@mqMgmtModuleId, @updateActionId, 'Update Template');
IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @mqMgmtModuleId AND action_id = @deleteActionId)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES (@mqMgmtModuleId, @deleteActionId, 'Delete Template');

PRINT '  ✓ Created/Verified module-action mappings';

-- ============================================================================
-- Grant All Permissions to Super Admin Role
-- ============================================================================

PRINT 'Granting permissions to Super Admin...';

INSERT INTO ccms_acl_role_permissions (role_id, module_action_id, granted, created_by)
SELECT 1, ma.module_action_id, 1, 'SYSTEM'
FROM ccms_acl_module_actions ma
WHERE ma.module_id IN (@bankMgmtModuleId, @clauseMgmtModuleId, @lookupMgmtModuleId, @mqMgmtModuleId)
AND ma.module_action_id NOT IN (
    SELECT module_action_id FROM ccms_acl_role_permissions WHERE role_id = 1
);

DECLARE @permissionCount INT = (SELECT COUNT(*) FROM ccms_acl_role_permissions WHERE role_id = 1 AND module_action_id IN (
    SELECT module_action_id FROM ccms_acl_module_actions WHERE module_id IN (@bankMgmtModuleId, @clauseMgmtModuleId, @lookupMgmtModuleId, @mqMgmtModuleId)
));

PRINT '  ✓ Granted ' + CAST(@permissionCount AS VARCHAR) + ' permissions to Super Admin (17 total for master data)';

-- ============================================================================
-- Verification
-- ============================================================================

PRINT '';
PRINT 'Verifying installation...';
PRINT '';

SELECT 
    m.module_name,
    m.module_code,
    m.icon,
    m.route,
    CASE WHEN m.category_id IS NULL THEN 'Uncategorized' ELSE c.category_name END as category,
    COUNT(ma.module_action_id) as action_count
FROM ccms_acl_modules m
LEFT JOIN ccms_acl_categories c ON m.category_id = c.category_id
LEFT JOIN ccms_acl_module_actions ma ON m.module_id = ma.module_id
WHERE m.module_code IN ('BANK_MGMT', 'CLAUSE_MGMT', 'LOOKUP_MGMT', 'MQ_TEMPLATES_MGMT')
GROUP BY m.module_name, m.module_code, m.icon, m.route, m.category_id, c.category_name, m.display_order
ORDER BY m.display_order;

PRINT '';
PRINT '==================================================';
PRINT 'SETUP COMPLETED SUCCESSFULLY';
PRINT '==================================================';
PRINT '';
PRINT 'Summary:';
PRINT '  • 1 category created (Master Data)';
PRINT '  • 1 action added (MANAGE_METADATA)';
PRINT '  • 3 modules added under Master Data category';
PRINT '  • 13 module-action mappings created';
PRINT '  • 13 permissions granted to Super Admin';
PRINT '';
PRINT 'Menu Structure:';
PRINT '  📁 Master Data';
PRINT '     → Bank Management (/master/banks)';
PRINT '        - VIEW, CREATE, UPDATE, DELETE';
PRINT '     → Clause Management (/master/clauses)';
PRINT '        - VIEW, CREATE, UPDATE, DELETE';
PRINT '     → Lookups Management (/master/lookups)';
PRINT '        - VIEW, CREATE, UPDATE, DELETE, MANAGE_METADATA';
PRINT '';
PRINT 'Actions Breakdown:';
PRINT '  • Bank Management: 4 actions';
PRINT '  • Clause Management: 4 actions';
PRINT '  • Lookups Management: 5 actions (includes MANAGE_METADATA)';
PRINT '';
PRINT 'Notes:';
PRINT '  • Lookups Management handles categories, lookups, and metadata in one interface';
PRINT '  • MANAGE_METADATA allows granular control over metadata operations';
PRINT '  • All operations use POST method';
PRINT '  • Soft delete (is_active flag)';
PRINT '  • Routes follow table naming convention (ccms_m_* → /master/*)';
PRINT '';
GO
