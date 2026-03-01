# Run the migration script
sqlcmd -S localhost -d db_ccms -E -C -i migrations/migrate-v6-to-v7.sql# Run the migration script
sqlcmd -S localhost -d db_ccms -E -C -i migrations/migrate-v6-to-v7.sql# Run the migration script
sqlcmd -S localhost -d db_ccms -E -C -i migrations/migrate-v6-to-v7.sql-- ============================================================================
-- Migration Script: v6 to v7
-- Purpose: Add audit columns (created_by, updated_by) to ACL tables
-- Date: 2026-03-01
-- ============================================================================

USE db_ccms;
GO

PRINT '';
PRINT '================================================================';
PRINT 'MIGRATION: Schema v6 → v7';
PRINT 'Adding audit columns to ACL tables';
PRINT '================================================================';
PRINT '';

-- ============================================================================
-- 1. Add audit columns to ccms_acl_categories
-- ============================================================================
PRINT 'Updating ccms_acl_categories...';

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ccms_acl_categories' AND COLUMN_NAME = 'created_by'
)
BEGIN
    ALTER TABLE ccms_acl_categories ADD created_by VARCHAR(50) NULL;
    PRINT '  ✓ Added created_by column';
END
ELSE
BEGIN
    PRINT '  ℹ created_by column already exists';
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ccms_acl_categories' AND COLUMN_NAME = 'updated_by'
)
BEGIN
    ALTER TABLE ccms_acl_categories ADD updated_by VARCHAR(50) NULL;
    PRINT '  ✓ Added updated_by column';
END
ELSE
BEGIN
    PRINT '  ℹ updated_by column already exists';
END

-- ============================================================================
-- 2. Add audit columns to ccms_acl_modules
-- ============================================================================
PRINT '';
PRINT 'Updating ccms_acl_modules...';

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ccms_acl_modules' AND COLUMN_NAME = 'created_by'
)
BEGIN
    ALTER TABLE ccms_acl_modules ADD created_by VARCHAR(50) NULL;
    PRINT '  ✓ Added created_by column';
END
ELSE
BEGIN
    PRINT '  ℹ created_by column already exists';
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ccms_acl_modules' AND COLUMN_NAME = 'updated_by'
)
BEGIN
    ALTER TABLE ccms_acl_modules ADD updated_by VARCHAR(50) NULL;
    PRINT '  ✓ Added updated_by column';
END
ELSE
BEGIN
    PRINT '  ℹ updated_by column already exists';
END

-- ============================================================================
-- 3. Add audit columns to ccms_acl_actions
-- ============================================================================
PRINT '';
PRINT 'Updating ccms_acl_actions...';

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ccms_acl_actions' AND COLUMN_NAME = 'created_by'
)
BEGIN
    ALTER TABLE ccms_acl_actions ADD created_by VARCHAR(50) NULL;
    PRINT '  ✓ Added created_by column';
END
ELSE
BEGIN
    PRINT '  ℹ created_by column already exists';
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ccms_acl_actions' AND COLUMN_NAME = 'updated_by'
)
BEGIN
    ALTER TABLE ccms_acl_actions ADD updated_by VARCHAR(50) NULL;
    PRINT '  ✓ Added updated_by column';
END
ELSE
BEGIN
    PRINT '  ℹ updated_by column already exists';
END

-- ============================================================================
-- 4. Add audit columns to ccms_acl_module_actions
-- ============================================================================
PRINT '';
PRINT 'Updating ccms_acl_module_actions...';

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ccms_acl_module_actions' AND COLUMN_NAME = 'updated_at'
)
BEGIN
    ALTER TABLE ccms_acl_module_actions ADD updated_at DATETIME2 NULL;
    PRINT '  ✓ Added updated_at column';
END
ELSE
BEGIN
    PRINT '  ℹ updated_at column already exists';
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ccms_acl_module_actions' AND COLUMN_NAME = 'created_by'
)
BEGIN
    ALTER TABLE ccms_acl_module_actions ADD created_by VARCHAR(50) NULL;
    PRINT '  ✓ Added created_by column';
END
ELSE
BEGIN
    PRINT '  ℹ created_by column already exists';
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ccms_acl_module_actions' AND COLUMN_NAME = 'updated_by'
)
BEGIN
    ALTER TABLE ccms_acl_module_actions ADD updated_by VARCHAR(50) NULL;
    PRINT '  ✓ Added updated_by column';
END
ELSE
BEGIN
    PRINT '  ℹ updated_by column already exists';
END

-- ============================================================================
-- Verification
-- ============================================================================
PRINT '';
PRINT '================================================================';
PRINT 'VERIFICATION: Checking all audit columns exist';
PRINT '================================================================';
PRINT '';

DECLARE @MissingColumns INT = 0;

-- Check ccms_acl_categories
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ccms_acl_categories' AND COLUMN_NAME = 'created_by')
BEGIN
    PRINT '✗ ccms_acl_categories.created_by is missing';
    SET @MissingColumns = @MissingColumns + 1;
END
ELSE PRINT '✓ ccms_acl_categories.created_by exists';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ccms_acl_categories' AND COLUMN_NAME = 'updated_by')
BEGIN
    PRINT '✗ ccms_acl_categories.updated_by is missing';
    SET @MissingColumns = @MissingColumns + 1;
END
ELSE PRINT '✓ ccms_acl_categories.updated_by exists';

-- Check ccms_acl_modules
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ccms_acl_modules' AND COLUMN_NAME = 'created_by')
BEGIN
    PRINT '✗ ccms_acl_modules.created_by is missing';
    SET @MissingColumns = @MissingColumns + 1;
END
ELSE PRINT '✓ ccms_acl_modules.created_by exists';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ccms_acl_modules' AND COLUMN_NAME = 'updated_by')
BEGIN
    PRINT '✗ ccms_acl_modules.updated_by is missing';
    SET @MissingColumns = @MissingColumns + 1;
END
ELSE PRINT '✓ ccms_acl_modules.updated_by exists';

-- Check ccms_acl_actions
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ccms_acl_actions' AND COLUMN_NAME = 'created_by')
BEGIN
    PRINT '✗ ccms_acl_actions.created_by is missing';
    SET @MissingColumns = @MissingColumns + 1;
END
ELSE PRINT '✓ ccms_acl_actions.created_by exists';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ccms_acl_actions' AND COLUMN_NAME = 'updated_by')
BEGIN
    PRINT '✗ ccms_acl_actions.updated_by is missing';
    SET @MissingColumns = @MissingColumns + 1;
END
ELSE PRINT '✓ ccms_acl_actions.updated_by exists';

-- Check ccms_acl_module_actions
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ccms_acl_module_actions' AND COLUMN_NAME = 'updated_at')
BEGIN
    PRINT '✗ ccms_acl_module_actions.updated_at is missing';
    SET @MissingColumns = @MissingColumns + 1;
END
ELSE PRINT '✓ ccms_acl_module_actions.updated_at exists';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ccms_acl_module_actions' AND COLUMN_NAME = 'created_by')
BEGIN
    PRINT '✗ ccms_acl_module_actions.created_by is missing';
    SET @MissingColumns = @MissingColumns + 1;
END
ELSE PRINT '✓ ccms_acl_module_actions.created_by exists';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ccms_acl_module_actions' AND COLUMN_NAME = 'updated_by')
BEGIN
    PRINT '✗ ccms_acl_module_actions.updated_by is missing';
    SET @MissingColumns = @MissingColumns + 1;
END
ELSE PRINT '✓ ccms_acl_module_actions.updated_by exists';

PRINT '';
IF @MissingColumns = 0
BEGIN
    PRINT '================================================================';
    PRINT '✓ MIGRATION SUCCESSFUL - All audit columns added';
    PRINT '================================================================';
END
ELSE
BEGIN
    PRINT '================================================================';
    PRINT '✗ MIGRATION INCOMPLETE - ' + CAST(@MissingColumns AS VARCHAR) + ' column(s) missing';
    PRINT '================================================================';
END
PRINT '';

GO
