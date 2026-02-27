-- ============================================================================
-- CCMS Users - Seed Test Data (v6)
-- Creates initial Super Admin user and assigns role
-- ============================================================================
-- PREREQUISITES (Run in this order):
--   1. ccms_new_schema_2026_v6.sql (creates tables with integrated ACL system)
--   2. This file (creates admin user and assigns Super Admin role)
-- ============================================================================

USE db_ccms;
GO

PRINT '';
PRINT '==================================================';
PRINT 'CCMS USERS - SEED TEST DATA';
PRINT '==================================================';
PRINT '';

-- ============================================================================
-- Check if ccms_users table exists
-- ============================================================================

IF OBJECT_ID('ccms_users', 'U') IS NULL
BEGIN
    PRINT 'ERROR: ccms_users table does not exist!';
    PRINT 'Please run ccms_new_schema_2026_v6.sql first to create the table structure.';
    PRINT '';
    RAISERROR('ccms_users table not found', 16, 1);
    RETURN;
END

-- ============================================================================
-- Clear existing user data (optional - comment out if you want to keep existing users)
-- ============================================================================

PRINT 'Clearing existing user data...';

-- Disable foreign key constraints temporarily
IF OBJECT_ID('ccms_acl_user_roles', 'U') IS NOT NULL
BEGIN
    ALTER TABLE ccms_acl_user_roles NOCHECK CONSTRAINT ALL;
    DELETE FROM ccms_acl_user_roles;
    PRINT '  - Cleared ccms_acl_user_roles';
END

-- Clear users
DELETE FROM ccms_users;
PRINT '  - Cleared ccms_users';

-- Reset identity seed
DBCC CHECKIDENT ('ccms_users', RESEED, 0);
PRINT '  - Reset identity seed';

-- Re-enable foreign key constraints
IF OBJECT_ID('ccms_acl_user_roles', 'U') IS NOT NULL
BEGIN
    ALTER TABLE ccms_acl_user_roles CHECK CONSTRAINT ALL;
END

PRINT '';

-- ============================================================================
-- Seed Test Users (One per role)
-- ============================================================================
-- Default Password: Password123! (all users)
-- Bcrypt Hash: $2b$10$EhnDGo5anEg7Mc/I9rioF.wdA7bE2zMVHpO5deGiNa3kt1Kp0dQLa
-- 
-- NOTE: Only Super Admin user is created initially
-- Other users will be created by Super Admin using the User Management interface
-- ============================================================================

PRINT 'Seeding Super Admin user...';

SET IDENTITY_INSERT ccms_users ON;

INSERT INTO ccms_users (
    user_id, 
    username, 
    password_hash, 
    full_name, 
    is_active, 
    last_login
) VALUES
-- Super Admin
(1, 'admin', '$2b$10$EhnDGo5anEg7Mc/I9rioF.wdA7bE2zMVHpO5deGiNa3kt1Kp0dQLa', 'System Administrator', 1, NULL);

SET IDENTITY_INSERT ccms_users OFF;

PRINT '  ✓ Created Super Admin user: admin';
PRINT '';

-- ============================================================================
-- AUTO-ASSIGN SUPER ADMIN ROLE
-- ============================================================================

PRINT '';
PRINT '================================================================';
PRINT 'ASSIGNING SUPER ADMIN ROLE';
PRINT '================================================================';
PRINT '';

-- Get Super Admin user ID
DECLARE @superAdminUserId BIGINT = (SELECT user_id FROM ccms_users WHERE username = 'admin');

-- Assign Super Admin role (role_id: 1)
IF @superAdminUserId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ccms_acl_user_roles WHERE user_id = @superAdminUserId AND role_id = 1)
    BEGIN
        INSERT INTO ccms_acl_user_roles (user_id, role_id, is_active, assigned_by, assigned_at)
        VALUES (@superAdminUserId, 1, 1, 'SYSTEM', GETDATE());
        PRINT '  ✓ Assigned Super Admin role to admin';
    END
    ELSE
        PRINT '  - admin already has Super Admin role';
END
ELSE
    PRINT '  ⚠ User "admin" not found';

PRINT '';
PRINT 'Role assignment completed!';
PRINT '';

-- Display role assignments
IF EXISTS (SELECT 1 FROM ccms_acl_user_roles)
BEGIN
    PRINT 'Current Role Assignment:';
    SELECT 
        u.username,
        u.full_name,
        r.role_name,
        ur.is_active,
        ur.assigned_at
    FROM ccms_acl_user_roles ur
    INNER JOIN ccms_users u ON ur.user_id = u.user_id
    INNER JOIN ccms_acl_roles r ON ur.role_id = r.role_id
    WHERE ur.is_active = 1
    ORDER BY r.role_id;
END
ELSE
BEGIN
    PRINT '⚠ No role assignments found!';
    PRINT 'Make sure ccms_acl_user_roles table exists (run permission-control-schema.sql first).';
END

PRINT '';

-- ============================================================================
-- Verify and display user list
-- ============================================================================

PRINT 'Created User:';
SELECT 
    user_id,
    username,
    full_name,
    is_active
FROM ccms_users
ORDER BY user_id;
GO

PRINT '';
PRINT '==================================================';
PRINT 'USER SUMMARY';
PRINT '==================================================';
PRINT '';

DECLARE @totalUsers INT = (SELECT COUNT(*) FROM ccms_users WHERE is_active = 1);
PRINT 'Total Active Users: ' + CAST(@totalUsers AS VARCHAR(10));
PRINT '';
PRINT 'User List:';
PRINT '  ID | Username           | Full Name                    | Active';
PRINT '  ---|--------------------|-----------------------------|--------';

DECLARE @msg NVARCHAR(MAX) = '';
SELECT @msg = @msg + 
    '  ' + RIGHT('   ' + CAST(user_id AS VARCHAR(3)), 3) + 
    ' | ' + LEFT(username + SPACE(18), 18) + 
    ' | ' + LEFT(full_name + SPACE(27), 27) + 
    ' | ' + CAST(is_active AS VARCHAR(1)) + CHAR(13) + CHAR(10)
FROM ccms_users
WHERE is_active = 1
ORDER BY user_id;

PRINT @msg;

PRINT '';
PRINT '==================================================';  
PRINT 'NOTES';
PRINT '==================================================';
PRINT '- Default password: Password123!';
PRINT '- ✅ Bcrypt hash included (ready to use)';
PRINT '- ✅ Super Admin role assigned';
PRINT '- ✅ Super Admin has FULL ACCESS to permission system';
PRINT '- ✅ v6: role_id and permissions_json removed (uses ACL only)';
PRINT '- Roles are managed via ccms_acl_user_roles table';
PRINT '';
PRINT 'Prerequisites (must run in order):';
PRINT '  1. ccms_new_schema_2026_v6.sql (includes ACL tables)';
PRINT '  2. This file (users-seed-data.sql)';
PRINT '';
PRINT 'Initial System Access:';
PRINT '  Username: admin';
PRINT '  Password: Password123!';
PRINT '  Role: Super Admin';
PRINT '';
PRINT 'Super Admin Can Now:';
PRINT '  → Create additional users (User Management)';
PRINT '  → Create business roles (Role Management)';
PRINT '  → Create categories (Category Management)';
PRINT '  → Create business modules (Module Management)';
PRINT '  → Create custom actions (Action Management)';
PRINT '  → Link modules to actions (Module Action Management)';
PRINT '  → Assign permissions to roles (Role Permission Management)';
PRINT '  → Assign roles to users (User Role Assignment)';
PRINT '';
GO

PRINT '';
PRINT '================================================================';
PRINT 'SETUP COMPLETED SUCCESSFULLY';
PRINT '================================================================';
PRINT '';
PRINT 'User and role assignment completed!';
