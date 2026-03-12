-- ============================================================================
-- CCMS Bank Master Data Seeding Script
-- Purpose: Populate Malaysian banks for bank account selections
-- Created: March 13, 2026
-- ============================================================================

USE db_ccms;
GO

PRINT '========================================';
PRINT 'Starting Bank Data Seeding...';
PRINT '========================================';
PRINT '';

-- Clear existing bank data (for re-running script)
DELETE FROM ccms_m_banks;

PRINT 'Creating Malaysian banks...';

SET IDENTITY_INSERT ccms_m_banks ON;

INSERT INTO ccms_m_banks (bank_id, bank_name, bank_code, is_active, created_by)
VALUES 
    (1, 'Maybank (Malayan Banking Berhad)', 'MBB', 1, 'SYSTEM'),
    (2, 'CIMB Bank Berhad', 'CIMB', 1, 'SYSTEM'),
    (3, 'Public Bank Berhad', 'PBB', 1, 'SYSTEM'),
    (4, 'RHB Bank Berhad', 'RHB', 1, 'SYSTEM'),
    (5, 'Hong Leong Bank Berhad', 'HLB', 1, 'SYSTEM'),
    (6, 'AmBank (M) Berhad', 'AMBANK', 1, 'SYSTEM'),
    (7, 'Bank Rakyat', 'BKRM', 1, 'SYSTEM'),
    (8, 'HSBC Bank Malaysia Berhad', 'HSBC', 1, 'SYSTEM'),
    (9, 'Standard Chartered Bank Malaysia Berhad', 'SCB', 1, 'SYSTEM'),
    (10, 'OCBC Bank (Malaysia) Berhad', 'OCBC', 1, 'SYSTEM'),
    (11, 'United Overseas Bank (Malaysia) Bhd', 'UOB', 1, 'SYSTEM'),
    (12, 'Citibank Berhad', 'CITI', 1, 'SYSTEM'),
    (13, 'Bank Islam Malaysia Berhad', 'BIMB', 1, 'SYSTEM'),
    (14, 'Affin Bank Berhad', 'AFFIN', 1, 'SYSTEM'),
    (15, 'Alliance Bank Malaysia Berhad', 'ABMB', 1, 'SYSTEM');

SET IDENTITY_INSERT ccms_m_banks OFF;

PRINT '  ✓ Created 15 Malaysian banks';
GO

-- ============================================================================
-- VERIFICATION & SUMMARY
-- ============================================================================

PRINT '';
PRINT '========================================';
PRINT 'Bank Data Seeding Summary:';
PRINT '========================================';

SELECT 'Total Banks' AS Entity, COUNT(*) AS Count FROM ccms_m_banks WHERE is_active = 1;

PRINT '';
PRINT 'Bank List:';
SELECT bank_id, bank_name, bank_code FROM ccms_m_banks ORDER BY bank_name;

PRINT '';
PRINT '========================================';
PRINT '✓ Bank Data Seeding Completed Successfully!';
PRINT '========================================';
GO
