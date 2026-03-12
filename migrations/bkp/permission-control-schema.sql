-- ============================================================================
-- CCMS Permission Control System (ACL - Access Control List)
-- ============================================================================
-- Purpose: Role-based access control (RBAC) with modular permissions
-- Structure: Modules -> Actions -> Module Actions -> Roles -> Users
-- Table Prefix: ccms_acl_* (Access Control List tables)
-- ============================================================================

-- ============================================================================
-- DROP EXISTING OBJECTS (for clean re-run)
-- ============================================================================

-- Drop stored procedures
IF OBJECT_ID('sp_assign_role_to_user', 'P') IS NOT NULL DROP PROCEDURE sp_assign_role_to_user;
IF OBJECT_ID('sp_get_user_permissions_json', 'P') IS NOT NULL DROP PROCEDURE sp_get_user_permissions_json;
IF OBJECT_ID('sp_check_user_permission', 'P') IS NOT NULL DROP PROCEDURE sp_check_user_permission;
GO

-- Drop views
IF OBJECT_ID('vw_acl_user_permissions', 'V') IS NOT NULL DROP VIEW vw_acl_user_permissions;
IF OBJECT_ID('vw_acl_role_permissions', 'V') IS NOT NULL DROP VIEW vw_acl_role_permissions;
GO

-- Drop tables (in reverse order of dependencies)
IF OBJECT_ID('ccms_acl_user_roles', 'U') IS NOT NULL DROP TABLE ccms_acl_user_roles;
IF OBJECT_ID('ccms_acl_role_permissions', 'U') IS NOT NULL DROP TABLE ccms_acl_role_permissions;
IF OBJECT_ID('ccms_acl_module_actions', 'U') IS NOT NULL DROP TABLE ccms_acl_module_actions;
IF OBJECT_ID('ccms_acl_actions', 'U') IS NOT NULL DROP TABLE ccms_acl_actions;
IF OBJECT_ID('ccms_acl_modules', 'U') IS NOT NULL DROP TABLE ccms_acl_modules;
IF OBJECT_ID('ccms_acl_categories', 'U') IS NOT NULL DROP TABLE ccms_acl_categories;
IF OBJECT_ID('ccms_acl_roles', 'U') IS NOT NULL DROP TABLE ccms_acl_roles;
GO

PRINT 'Existing permission control objects dropped successfully.';
GO

-- ============================================================================
-- 1. ROLES TABLE (ACL - Access Control List)
-- Purpose: Stores system and business roles for RBAC
-- Note: role_id=1 is Super Admin (system role, cannot be deleted)
-- ============================================================================
CREATE TABLE ccms_acl_roles (
    role_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    role_name NVARCHAR(100) NOT NULL UNIQUE,           -- Display name (e.g., 'Super Admin', 'Manager')
    role_code NVARCHAR(50) NOT NULL UNIQUE,            -- Programmatic identifier (e.g., 'SUPER_ADMIN')
    description NVARCHAR(500) NULL,                    -- Role purpose and responsibilities
    is_system_role BIT NOT NULL DEFAULT 0,             -- 1=Protected system role (cannot be deleted)
    is_active BIT NOT NULL DEFAULT 1,                  -- 0=Deactivated (role assignments become inactive)
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),   -- Record creation timestamp
    updated_at DATETIME2 NULL,                         -- Last modification timestamp
    created_by VARCHAR(50) NULL,                       -- Username of creator
    updated_by VARCHAR(50) NULL                        -- Username of last modifier
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_roles_code ON ccms_acl_roles(role_code);
CREATE NONCLUSTERED INDEX idx_ccms_acl_roles_active ON ccms_acl_roles(is_active);
GO

-- ============================================================================
-- 2. CATEGORIES TABLE (ACL - Access Control List)
-- Purpose: Groups related modules in the navigation menu
-- Example: 'System Administration' contains User, Role, Module Management
-- ============================================================================
CREATE TABLE ccms_acl_categories (
    category_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    category_name NVARCHAR(100) NOT NULL UNIQUE,       -- Display name (e.g., 'System Administration')
    category_code NVARCHAR(50) NOT NULL UNIQUE,        -- Programmatic identifier (e.g., 'SYSTEM_ADMIN')
    description NVARCHAR(500) NULL,                    -- Category purpose
    icon NVARCHAR(50) NULL,                            -- FontAwesome icon class (e.g., 'cog', 'shield-alt')
    display_order INT NOT NULL DEFAULT 0,              -- Menu ordering (lower = appears first)
    is_active BIT NOT NULL DEFAULT 1,                  -- 0=Hidden from menu
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),   -- Record creation timestamp
    updated_at DATETIME2 NULL,                         -- Last modification timestamp
    created_by VARCHAR(50) NULL,                       -- Who created this category (user_id as string)
    updated_by VARCHAR(50) NULL                        -- Who last modified this category (user_id as string)
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_categories_code ON ccms_acl_categories(category_code);
CREATE NONCLUSTERED INDEX idx_ccms_acl_categories_active ON ccms_acl_categories(is_active);
CREATE NONCLUSTERED INDEX idx_ccms_acl_categories_order ON ccms_acl_categories(display_order);
GO

-- ============================================================================
-- 3. MODULES TABLE (ACL - Access Control List)
-- Purpose: Application features/pages that can be secured with permissions
-- Note: Modules with category_id=NULL appear as top-level menu items (e.g., Dashboard)
-- ============================================================================
CREATE TABLE ccms_acl_modules (
    module_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    module_name NVARCHAR(100) NOT NULL UNIQUE,         -- Display name (e.g., 'User Management')
    module_code NVARCHAR(50) NOT NULL UNIQUE,          -- Programmatic identifier (e.g., 'USER_MANAGEMENT')
    description NVARCHAR(500) NULL,                    -- Module purpose and functionality
    category_id BIGINT NULL,                           -- FK to ccms_categories (NULL = uncategorized/top-level)
    icon NVARCHAR(50) NULL,                            -- FontAwesome icon class (e.g., 'users', 'shield-alt')
    route NVARCHAR(200) NULL,                          -- Frontend route path (e.g., '/admin/users')
    display_order INT NOT NULL DEFAULT 0,              -- Menu ordering within category (lower = appears first)
    is_active BIT NOT NULL DEFAULT 1,                  -- 0=Hidden from menu and permission checks
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),   -- Record creation timestamp
    updated_at DATETIME2 NULL,                         -- Last modification timestamp
    created_by VARCHAR(50) NULL,                       -- Who created this module (user_id as string)
    updated_by VARCHAR(50) NULL,                       -- Who last modified this module (user_id as string)
    
    CONSTRAINT fk_ccms_acl_modules_category FOREIGN KEY (category_id) 
        REFERENCES ccms_acl_categories(category_id)
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_modules_code ON ccms_acl_modules(module_code);
CREATE NONCLUSTERED INDEX idx_ccms_acl_modules_active ON ccms_acl_modules(is_active);
CREATE NONCLUSTERED INDEX idx_ccms_acl_modules_category ON ccms_acl_modules(category_id);
GO

-- ============================================================================
-- 4. ACTIONS TABLE (ACL - Access Control List)
-- Purpose: Generic operations that can be performed (VIEW, CREATE, UPDATE, DELETE, etc.)
-- Note: Actions are reusable across modules via ccms_acl_module_actions bridge table
-- ============================================================================
CREATE TABLE ccms_acl_actions (
    action_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    action_name NVARCHAR(100) NOT NULL UNIQUE,         -- Display name (e.g., 'View', 'Create', 'Delete')
    action_code NVARCHAR(50) NOT NULL UNIQUE,          -- Programmatic identifier (e.g., 'VIEW', 'CREATE')
    description NVARCHAR(500) NULL,                    -- Action purpose
    is_active BIT NOT NULL DEFAULT 1,                  -- 0=Action unavailable system-wide
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),   -- Record creation timestamp
    updated_at DATETIME2 NULL,                         -- Last modification timestamp
    created_by VARCHAR(50) NULL,                       -- Who created this action (user_id as string)
    updated_by VARCHAR(50) NULL                        -- Who last modified this action (user_id as string)
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_actions_code ON ccms_acl_actions(action_code);
CREATE NONCLUSTERED INDEX idx_ccms_acl_actions_active ON ccms_acl_actions(is_active);
GO

-- ============================================================================
-- 5. MODULE ACTIONS TABLE (ACL Bridge Table)
-- Purpose: Links actions to specific modules with optional custom labels
-- Example: Module='User Management' + Action='CREATE' = 'Create User' permission
-- ============================================================================
CREATE TABLE ccms_acl_module_actions (
    module_action_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    module_id BIGINT NOT NULL,                         -- FK to ccms_modules
    action_id BIGINT NOT NULL,                         -- FK to ccms_actions
    action_label NVARCHAR(200) NULL,                   -- Custom display label (e.g., 'Create New User')
    is_active BIT NOT NULL DEFAULT 1,                  -- 0=Permission unavailable for assignment
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),   -- Record creation timestamp
    updated_at DATETIME2 NULL,                         -- Last modification timestamp
    created_by VARCHAR(50) NULL,                       -- Who created this module-action link (user_id as string)
    updated_by VARCHAR(50) NULL,                       -- Who last modified this module-action link (user_id as string)
    
    CONSTRAINT fk_ccms_acl_module_actions_module FOREIGN KEY (module_id) 
        REFERENCES ccms_acl_modules(module_id) ON DELETE CASCADE,
    CONSTRAINT fk_ccms_acl_module_actions_action FOREIGN KEY (action_id) 
        REFERENCES ccms_acl_actions(action_id) ON DELETE CASCADE,
    CONSTRAINT uq_ccms_acl_module_actions UNIQUE (module_id, action_id)  -- One action per module
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_module_actions_module ON ccms_acl_module_actions(module_id);
CREATE NONCLUSTERED INDEX idx_ccms_acl_module_actions_action ON ccms_acl_module_actions(action_id);
CREATE NONCLUSTERED INDEX idx_ccms_acl_module_actions_active ON ccms_acl_module_actions(is_active);
GO

-- ============================================================================
-- 6. ROLE PERMISSIONS TABLE (ACL Bridge Table)
-- Purpose: Assigns specific module-action permissions to roles
-- Example: Role='Super Admin' has permission for 'User Management.CREATE'
-- ============================================================================
CREATE TABLE ccms_acl_role_permissions (
    permission_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    role_id BIGINT NOT NULL,                           -- FK to ccms_roles
    module_action_id BIGINT NOT NULL,                  -- FK to ccms_module_actions
    granted BIT NOT NULL DEFAULT 1,                    -- 1=Permission granted, 0=Explicit denial
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),   -- When permission was assigned
    created_by VARCHAR(50) NULL,                       -- Username who assigned permission
    
    CONSTRAINT fk_ccms_acl_role_permissions_role FOREIGN KEY (role_id) 
        REFERENCES ccms_acl_roles(role_id) ON DELETE CASCADE,
    CONSTRAINT fk_ccms_acl_role_permissions_module_action FOREIGN KEY (module_action_id) 
        REFERENCES ccms_acl_module_actions(module_action_id) ON DELETE CASCADE,
    CONSTRAINT uq_ccms_acl_role_permissions UNIQUE (role_id, module_action_id)  -- One permission per role-action
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_role_permissions_role ON ccms_acl_role_permissions(role_id);
CREATE NONCLUSTERED INDEX idx_ccms_acl_role_permissions_module_action ON ccms_acl_role_permissions(module_action_id);
CREATE NONCLUSTERED INDEX idx_ccms_acl_role_permissions_granted ON ccms_acl_role_permissions(granted);
GO

-- ============================================================================
-- 7. USER ROLES TABLE (ACL Bridge Table)
-- Purpose: Assigns roles to users (many-to-many relationship)
-- Note: Users can have multiple active roles; permissions are combined
-- ============================================================================
CREATE TABLE ccms_acl_user_roles (
    user_role_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,                           -- FK to ccms_users
    role_id BIGINT NOT NULL,                           -- FK to ccms_roles
    is_active BIT NOT NULL DEFAULT 1,                  -- 0=Assignment suspended (permissions removed)
    assigned_at DATETIME2 NOT NULL DEFAULT GETDATE(),  -- When role was assigned to user
    assigned_by VARCHAR(50) NULL,                      -- Username who performed assignment
    expires_at DATETIME2 NULL,                         -- Optional expiration (NULL = permanent)
    
    CONSTRAINT fk_ccms_acl_user_roles_role FOREIGN KEY (role_id) 
        REFERENCES ccms_acl_roles(role_id) ON DELETE CASCADE,
    CONSTRAINT uq_ccms_acl_user_roles UNIQUE (user_id, role_id)  -- One assignment per user-role pair
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_user_roles_user ON ccms_acl_user_roles(user_id);
CREATE NONCLUSTERED INDEX idx_ccms_acl_user_roles_role ON ccms_acl_user_roles(role_id);
CREATE NONCLUSTERED INDEX idx_ccms_acl_user_roles_active ON ccms_acl_user_roles(is_active);
CREATE NONCLUSTERED INDEX idx_ccms_acl_user_roles_expires ON ccms_acl_user_roles(expires_at);
GO

-- ============================================================================
-- Add Foreign Key to ccms_users
-- ============================================================================
ALTER TABLE ccms_acl_user_roles
ADD CONSTRAINT fk_ccms_acl_user_roles_user 
    FOREIGN KEY (user_id) REFERENCES ccms_users(user_id) ON DELETE CASCADE;
GO

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- ============================================================================
-- Seed Roles
-- ============================================================================
SET IDENTITY_INSERT ccms_acl_roles ON;
INSERT INTO ccms_acl_roles (role_id, role_name, role_code, description, is_system_role, is_active) VALUES
(1, 'Super Admin', 'SUPER_ADMIN', 'Full system access with all permissions including user management', 1, 1);
SET IDENTITY_INSERT ccms_acl_roles OFF;
GO

-- ============================================================================
-- Seed Categories
-- ============================================================================
SET IDENTITY_INSERT ccms_acl_categories ON;
INSERT INTO ccms_acl_categories (category_id, category_name, category_code, description, icon, display_order, is_active) VALUES
(1, 'System Administration', 'SYSTEM_ADMIN', 'System administration and permission control', 'cog', 100, 1);
SET IDENTITY_INSERT ccms_acl_categories OFF;
GO

-- ============================================================================
-- Seed Modules
-- ============================================================================
INSERT INTO ccms_acl_modules (module_name, module_code, description, icon, route, display_order, category_id) VALUES
('Dashboard', 'DASHBOARD', 'Main dashboard and analytics', 'tachometer-alt', '/dashboard', 1, NULL),
('User Management', 'USER_MANAGEMENT', 'Manage system users', 'users', '/admin/users', 10, 1),
('Role Management', 'ROLE_MANAGEMENT', 'Manage user roles', 'shield-alt', '/admin/roles', 20, 1),
('Category Management', 'CATEGORY_MANAGEMENT', 'Manage module categories', 'folder', '/admin/categories', 25, 1),
('Module Management', 'MODULE_MANAGEMENT', 'Manage application modules', 'cube', '/admin/modules', 30, 1),
('Action Management', 'ACTION_MANAGEMENT', 'Manage module actions', 'bolt', '/admin/actions', 40, 1),
('Module Action Management', 'MODULE_ACTION_MANAGEMENT', 'Link actions to modules', 'link', '/admin/module-actions', 50, 1),
('Role Permission Management', 'ROLE_PERMISSION_MANAGEMENT', 'Assign permissions to roles', 'key', '/admin/role-permissions', 60, 1),
('User Role Assignment', 'USER_ROLE_ASSIGNMENT', 'Assign roles to users', 'user-tag', '/admin/user-roles', 70, 1);
GO

-- ============================================================================
-- Seed Actions
-- ============================================================================
INSERT INTO ccms_acl_actions (action_name, action_code, description) VALUES
('View', 'VIEW', 'View/Read access to module'),
('Create', 'CREATE', 'Create new records'),
('Update', 'UPDATE', 'Update existing records'),
('Delete', 'DELETE', 'Delete records'),
('Approve', 'APPROVE', 'Approve pending items'),
('Reject', 'REJECT', 'Reject pending items'),
('Submit', 'SUBMIT', 'Submit for review'),
('Export', 'EXPORT', 'Export data'),
('Import', 'IMPORT', 'Import data'),
('Print', 'PRINT', 'Print documents'),
('Audit', 'AUDIT', 'Audit trail access'),
('Assign', 'ASSIGN', 'Assign tasks to users'),
('Settle', 'SETTLE', 'Settle/finalize transactions'),
('Reopen', 'REOPEN', 'Reopen closed items'),
('Comment', 'COMMENT', 'Add comments/notes'),
('Attach Role', 'ATTACH_ROLE', 'Attach/assign role to user'),
('Detach Role', 'DETACH_ROLE', 'Detach/remove role from user');
GO

-- ============================================================================
-- Seed Module Actions
-- ============================================================================
DECLARE @superAdminRoleId BIGINT = 1;

DECLARE @dashboardModuleId BIGINT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'DASHBOARD');
DECLARE @userMgmtModuleId BIGINT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'USER_MANAGEMENT');
DECLARE @roleMgmtModuleId BIGINT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'ROLE_MANAGEMENT');
DECLARE @moduleMgmtModuleId BIGINT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'MODULE_MANAGEMENT');
DECLARE @actionMgmtModuleId BIGINT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'ACTION_MANAGEMENT');
DECLARE @moduleActionMgmtModuleId BIGINT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'MODULE_ACTION_MANAGEMENT');
DECLARE @rolePermMgmtModuleId BIGINT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'ROLE_PERMISSION_MANAGEMENT');
DECLARE @userRoleAssignModuleId BIGINT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'USER_ROLE_ASSIGNMENT');
DECLARE @categoryMgmtModuleId BIGINT = (SELECT module_id FROM ccms_acl_modules WHERE module_code = 'CATEGORY_MANAGEMENT');
DECLARE @viewActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'VIEW');
DECLARE @createActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'CREATE');
DECLARE @updateActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'UPDATE');
DECLARE @deleteActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'DELETE');

INSERT INTO ccms_acl_module_actions (module_id, action_id, action_label) VALUES
(@dashboardModuleId, @viewActionId, 'View Dashboard'),
(@userMgmtModuleId, @viewActionId, 'View Users'),
(@userMgmtModuleId, @createActionId, 'Create User'),
(@userMgmtModuleId, @updateActionId, 'Update User'),
(@userMgmtModuleId, @deleteActionId, 'Delete User'),
(@roleMgmtModuleId, @viewActionId, 'View Roles'),
(@roleMgmtModuleId, @createActionId, 'Create Role'),
(@roleMgmtModuleId, @updateActionId, 'Update Role'),
(@roleMgmtModuleId, @deleteActionId, 'Delete Role'),
(@moduleMgmtModuleId, @viewActionId, 'View Modules'),
(@moduleMgmtModuleId, @createActionId, 'Create Module'),
(@moduleMgmtModuleId, @updateActionId, 'Update Module'),
(@moduleMgmtModuleId, @deleteActionId, 'Delete Module'),
(@actionMgmtModuleId, @viewActionId, 'View Actions'),
(@actionMgmtModuleId, @createActionId, 'Create Action'),
(@actionMgmtModuleId, @updateActionId, 'Update Action'),
(@actionMgmtModuleId, @deleteActionId, 'Delete Action'),
(@moduleActionMgmtModuleId, @viewActionId, 'View Module Actions'),
(@moduleActionMgmtModuleId, @createActionId, 'Create Module Action'),
(@moduleActionMgmtModuleId, @updateActionId, 'Update Module Action'),
(@moduleActionMgmtModuleId, @deleteActionId, 'Delete Module Action'),
(@rolePermMgmtModuleId, @viewActionId, 'View Role Permissions'),
(@rolePermMgmtModuleId, @createActionId, 'Assign Permission'),
(@rolePermMgmtModuleId, @updateActionId, 'Update Permission'),
(@rolePermMgmtModuleId, @deleteActionId, 'Revoke Permission'),
(@userRoleAssignModuleId, @viewActionId, 'View User Roles'),
(@userRoleAssignModuleId, @createActionId, 'Assign Role'),
(@userRoleAssignModuleId, @updateActionId, 'Update Assignment'),
(@userRoleAssignModuleId, @deleteActionId, 'Revoke Role'),
(@categoryMgmtModuleId, @viewActionId, 'View Categories'),
(@categoryMgmtModuleId, @createActionId, 'Create Category'),
(@categoryMgmtModuleId, @updateActionId, 'Update Category'),
(@categoryMgmtModuleId, @deleteActionId, 'Delete Category');

-- ============================================================================
-- Seed Role Permissions
-- ============================================================================
INSERT INTO ccms_acl_role_permissions (role_id, module_action_id, granted, created_by) 
SELECT @superAdminRoleId, module_action_id, 1, 'SYSTEM'
FROM ccms_acl_module_actions
WHERE module_id IN (
    @dashboardModuleId,
    @userMgmtModuleId,
    @roleMgmtModuleId,
    @moduleMgmtModuleId,
    @actionMgmtModuleId,
    @moduleActionMgmtModuleId,
    @rolePermMgmtModuleId,
    @userRoleAssignModuleId,
    @categoryMgmtModuleId
);

GO

-- ============================================================================
-- UTILITY VIEWS
-- ============================================================================

-- ============================================================================
-- View: vw_acl_user_permissions
-- Purpose: Flattened view of all active permissions for each user
-- Usage: Check user permissions, build dynamic menus, permission-based UI
-- Performance: Indexed on foreign keys; consider caching results
-- ============================================================================
CREATE VIEW vw_acl_user_permissions AS
SELECT 
    u.user_id,
    u.username,
    u.full_name,
    ur.role_id,
    r.role_name,
    r.role_code,
    m.module_id,
    m.module_name,
    m.module_code,
    m.icon AS module_icon,
    m.route AS module_route,
    m.display_order AS module_display_order,
    m.category_id,
    c.category_name,
    c.category_code,
    c.icon AS category_icon,
    c.display_order AS category_display_order,
    a.action_id,
    a.action_name,
    a.action_code,
    ma.module_action_id,
    ma.action_label,
    rp.permission_id,
    rp.granted,
    ur.is_active AS role_active,
    ur.expires_at AS role_expires_at
FROM ccms_users u
INNER JOIN ccms_acl_user_roles ur ON u.user_id = ur.user_id
INNER JOIN ccms_acl_roles r ON ur.role_id = r.role_id
INNER JOIN ccms_acl_role_permissions rp ON r.role_id = rp.role_id
INNER JOIN ccms_acl_module_actions ma ON rp.module_action_id = ma.module_action_id
INNER JOIN ccms_acl_modules m ON ma.module_id = m.module_id
LEFT JOIN ccms_acl_categories c ON m.category_id = c.category_id
INNER JOIN ccms_acl_actions a ON ma.action_id = a.action_id
WHERE ur.is_active = 1                             -- User role assignment is active
  AND r.is_active = 1                              -- Role is active
  AND m.is_active = 1                              -- Module is active
  AND a.is_active = 1                              -- Action is active
  AND ma.is_active = 1                             -- Module-action link is active
  AND rp.granted = 1                               -- Permission is granted (not denied)
  AND (ur.expires_at IS NULL OR ur.expires_at > GETDATE());  -- Role not expired
GO

-- ============================================================================
-- View: vw_acl_role_permissions
-- Purpose: Summary of all permissions assigned to each role
-- Usage: Role management UI, permission audit reports
-- ============================================================================
CREATE VIEW vw_acl_role_permissions AS
SELECT 
    r.role_id,
    r.role_name,
    r.role_code,
    m.module_id,
    m.module_name,
    m.module_code,
    a.action_id,
    a.action_name,
    a.action_code,
    ma.module_action_id,
    CONCAT(m.module_code, '.', a.action_code) AS permission_key,  -- e.g., 'USER_MANAGEMENT.CREATE'
    COALESCE(ma.action_label, CONCAT(a.action_name, ' ', m.module_name)) AS permission_label,
    rp.granted
FROM ccms_acl_roles r
INNER JOIN ccms_acl_role_permissions rp ON r.role_id = rp.role_id
INNER JOIN ccms_acl_module_actions ma ON rp.module_action_id = ma.module_action_id
INNER JOIN ccms_acl_modules m ON ma.module_id = m.module_id
INNER JOIN ccms_acl_actions a ON ma.action_id = a.action_id
WHERE r.is_active = 1
  AND m.is_active = 1
  AND a.is_active = 1
  AND ma.is_active = 1;
GO

-- ============================================================================
-- HELPER STORED PROCEDURES
-- ============================================================================

-- ============================================================================
-- Stored Procedure: sp_check_user_permission
-- Purpose: Fast permission check for a specific user, module, and action
-- Usage: Backend middleware, API endpoint guards
-- Returns: 1 row if granted, 0 rows if denied
-- ============================================================================
CREATE PROCEDURE sp_check_user_permission
    @user_id BIGINT,
    @module_code NVARCHAR(50),
    @action_code NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 1 AS has_permission
    FROM vw_acl_user_permissions
    WHERE user_id = @user_id
      AND module_code = @module_code
      AND action_code = @action_code
      AND granted = 1;
END;
GO

-- ============================================================================
-- Stored Procedure: sp_get_user_permissions_json
-- Purpose: Returns all permissions for a user in JSON format
-- Usage: Frontend menu building, permission caching
-- Returns: JSON array of modules with nested actions
-- ============================================================================
CREATE PROCEDURE sp_get_user_permissions_json
    @user_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        module_code,
        module_name,
        (
            SELECT action_code, action_name
            FROM vw_acl_user_permissions vp2
            WHERE vp2.user_id = @user_id
              AND vp2.module_code = vp1.module_code
            FOR JSON PATH
        ) AS actions
    FROM vw_acl_user_permissions vp1
    WHERE user_id = @user_id
    GROUP BY module_code, module_name
    FOR JSON PATH;
END;
GO

-- ============================================================================
-- Stored Procedure: sp_assign_role_to_user
-- Purpose: Assigns a role to a user with optional expiration
-- Usage: User role management, temporary access grants
-- Logic: Updates existing assignment if found, inserts new if not
-- ============================================================================
CREATE PROCEDURE sp_assign_role_to_user
    @user_id BIGINT,
    @role_id BIGINT,
    @assigned_by VARCHAR(50),
    @expires_at DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Update existing assignment if found
        IF EXISTS (SELECT 1 FROM ccms_acl_user_roles WHERE user_id = @user_id AND role_id = @role_id)
        BEGIN
            UPDATE ccms_acl_user_roles
            SET is_active = 1,
                assigned_at = GETDATE(),
                assigned_by = @assigned_by,
                expires_at = @expires_at
            WHERE user_id = @user_id AND role_id = @role_id;
        END
        -- Create new assignment if not found
        ELSE
        BEGIN
            INSERT INTO ccms_acl_user_roles (user_id, role_id, assigned_by, expires_at)
            VALUES (@user_id, @role_id, @assigned_by, @expires_at);
        END
        
        SELECT 'SUCCESS' AS status, 'Role assigned successfully' AS message;
    END TRY
    BEGIN CATCH
        SELECT 'ERROR' AS status, ERROR_MESSAGE() AS message;
    END CATCH
END;
GO

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

PRINT '';
PRINT '================================================================';
PRINT 'Permission Control Schema Created Successfully!';
PRINT '================================================================';
PRINT '';
PRINT 'ACL TABLES CREATED (Access Control List):';
PRINT '  1. ccms_acl_categories (Module categories)';
PRINT '  2. ccms_acl_roles (System roles)';
PRINT '  3. ccms_acl_modules (Application modules with category FK)';
PRINT '  4. ccms_acl_actions (CRUD actions)';
PRINT '  5. ccms_acl_module_actions (Module-action mappings)';
PRINT '  6. ccms_acl_role_permissions (Role-permission assignments)';
PRINT '  7. ccms_acl_user_roles (User-role assignments)';
PRINT '';
PRINT 'VIEWS CREATED:';
PRINT '  1. vw_acl_user_permissions (Full permission details with categories)';
PRINT '  2. vw_acl_role_permissions (Role permission summary)';
PRINT '';
PRINT 'STORED PROCEDURES CREATED:';
PRINT '  1. sp_check_user_permission';
PRINT '  2. sp_get_user_permissions_json';
PRINT '  3. sp_assign_role_to_user';
PRINT '';
PRINT 'SEEDED DATA:';
PRINT '  - 1 Category: System Administration';
PRINT '  - 17 Actions (VIEW, CREATE, UPDATE, DELETE, APPROVE, etc.)';
PRINT '  - 1 Role: Super Admin';
PRINT '  - 9 Modules (1 Dashboard + 8 Permission Control)';
PRINT '  - 33 Module Actions';
PRINT '  - Super Admin has full access to all modules';
PRINT '';
PRINT 'IMPORTANT NOTES:';
PRINT '  - Dashboard remains uncategorized for top-level menu access';
PRINT '  - All permission control modules organized under System Administration';
PRINT '  - Super Admin has complete control over the entire system';
PRINT '';
PRINT '================================================================';
PRINT 'NEXT STEPS:';
PRINT '  1. Run users-seed-data.sql to complete system setup';
PRINT '  2. Verify: SELECT * FROM ccms_acl_categories;';
PRINT '  3. Verify: SELECT * FROM ccms_acl_modules ORDER BY category_id, display_order;';
PRINT '  4. Login as Super Admin to configure permissions';
PRINT '================================================================';
GO
