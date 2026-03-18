-- ============================================================================
-- CCMS ACL Seed Data: MQ Operations Module
-- ============================================================================
-- Purpose: Sets up access control for Medical Questionnaire (MQ) Operations
-- Module: MQ_OPERATIONS
-- Route: /mq-builder
-- ============================================================================

USE db_ccms;
GO

SET NOCOUNT ON;
PRINT '============================================================================';
PRINT 'CCMS ACL Setup: MQ Operations Module';
PRINT '============================================================================';
PRINT '';

-- 1. Create Category if not exists
IF NOT EXISTS (SELECT 1 FROM ccms_acl_categories WHERE category_code = 'OPERATIONS')
BEGIN
    INSERT INTO ccms_acl_categories (category_name, category_code, icon, display_order, is_active, created_at, created_by)
    VALUES ('Operations', 'OPERATIONS', 'briefcase', 30, 1, GETDATE(), 'admin');
    PRINT '  ✓ Created category: OPERATIONS';
END

DECLARE @CategoryId INT = (SELECT category_id FROM ccms_acl_categories WHERE category_code = 'OPERATIONS');
DECLARE @ModuleId INT;

-- 2. Create Module

IF EXISTS (SELECT 1 FROM ccms_acl_modules WHERE module_code = 'MQ_OPERATIONS')
BEGIN
    SELECT @ModuleId = module_id FROM ccms_acl_modules WHERE module_code = 'MQ_OPERATIONS';
    UPDATE ccms_acl_modules SET route = '/mq-operations', category_id = @CategoryId, icon = 'file-medical' WHERE module_id = @ModuleId;
    PRINT '  ℹ Updated existing module: MQ_OPERATIONS';
END
ELSE
BEGIN
    INSERT INTO ccms_acl_modules (module_name, module_code, category_id, icon, route, display_order, is_active, created_at, created_by)
    VALUES ('MQ Operations', 'MQ_OPERATIONS', @CategoryId, 'file-medical', '/mq-operations', 45, 1, GETDATE(), 'admin');
    SELECT @ModuleId = SCOPE_IDENTITY();
    PRINT '  ✓ Created module: MQ_OPERATIONS';
END

-- 2. Ensure Actions Exist
IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'GENERATE')
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Generate', 'GENERATE', 'Generate documents or reports', 1, GETDATE(), 'admin');

IF NOT EXISTS (SELECT 1 FROM ccms_acl_actions WHERE action_code = 'SEND_EMAIL')
    INSERT INTO ccms_acl_actions (action_name, action_code, description, is_active, created_at, created_by)
    VALUES ('Send Email', 'SEND_EMAIL', 'Send documentation via email', 1, GETDATE(), 'admin');

-- 3. Link Actions
DECLARE @ActionView INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'VIEW');
DECLARE @ActionCreate INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'CREATE'); -- Used for "Manage"
DECLARE @ActionGenerate INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'GENERATE');
DECLARE @ActionEmail INT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'SEND_EMAIL');

IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionView)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionView, 'View Questionnaires', 1, GETDATE(), 'admin');

IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionCreate)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionCreate, 'Manage/Build MQ', 1, GETDATE(), 'admin');

IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionGenerate)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionGenerate, 'Generate MQ Document', 1, GETDATE(), 'admin');

IF NOT EXISTS (SELECT 1 FROM ccms_acl_module_actions WHERE module_id = @ModuleId AND action_id = @ActionEmail)
    INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label, is_active, created_at, created_by)
    VALUES (@ModuleId, @ActionEmail, 'Send MQ via Email', 1, GETDATE(), 'admin');

-- 4. Grant to Super Admin
INSERT INTO ccms_acl_role_permissions (role_id, module_action_id, granted, created_at, created_by)
SELECT 1, module_action_id, 1, GETDATE(), 'admin'
FROM ccms_acl_module_actions
WHERE module_id = @ModuleId
AND module_action_id NOT IN (SELECT module_action_id FROM ccms_acl_role_permissions WHERE role_id = 1);

PRINT '  ✓ Granted permissions to Super Admin';
GO
