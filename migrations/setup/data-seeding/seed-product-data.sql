-- ============================================================================
-- CCMS Product Data Seeding Script
-- Purpose: Populate insurance products with limits and copay child tables
-- Created: March 13, 2026
-- Note: Run after seed-bank-data.sql
-- ============================================================================

USE db_ccms;
GO

PRINT '========================================';
PRINT 'Starting Product Data Seeding...';
PRINT '========================================';
PRINT '';

-- Clear existing product data (for re-running script)
DELETE FROM ccms_los_alert_thresholds;
DELETE FROM ccms_product_copay;
DELETE FROM ccms_product_limits;
DELETE FROM ccms_products;

PRINT 'Creating insurance products...';

-- ============================================================================
-- SECTION 1: MAIN PRODUCTS
-- ============================================================================

SET IDENTITY_INSERT ccms_products ON;

INSERT INTO ccms_products (product_id, insurer_name, plan_code, plan_name, is_active, created_by)
VALUES 
    (1, 'Great Eastern', 'CUEPACSCARE (GAKUM)-0431', 'CUEPACSCARE (GAKUM) Plan', 1, 'SYSTEM'),
    (2, 'Great Eastern', 'CUEPACSCARE (MONTHLY)-0531', 'CUEPACSCARE Monthly Plan', 1, 'SYSTEM'),
    (3, 'Great Eastern', 'EMPLOYEE AND FAMILY ONLY', 'Employee and Family Plan', 1, 'SYSTEM'),
    (4, 'Allianz Malaysia', 'MEDICALCARE PLUS-001', 'MedicalCare Plus', 1, 'SYSTEM'),
    (5, 'Allianz Malaysia', 'FAMILY SHIELD-002', 'Family Shield Plan', 1, 'SYSTEM'),
    (6, 'AIA Malaysia', 'HEALTH GUARD-HG100', 'Health Guard Basic', 1, 'SYSTEM'),
    (7, 'AIA Malaysia', 'MEDICAL PROTECTOR-MP200', 'Medical Protector Plus', 1, 'SYSTEM'),
    (8, 'Prudential', 'PRUHEALTH PREMIER-PHP001', 'PruHealth Premier', 1, 'SYSTEM'),
    (9, 'Prudential', 'FAMILY CARE-FC002', 'Family Care Plan', 1, 'SYSTEM'),
    (10, 'Zurich Takaful', 'ZI-CARE BASIC-ZCB100', 'Zi-Care Basic', 1, 'SYSTEM'),
    (11, 'Zurich Takaful', 'ZI-CARE PLATINUM-ZCP200', 'Zi-Care Platinum', 1, 'SYSTEM');

SET IDENTITY_INSERT ccms_products OFF;

PRINT '  ✓ Created 11 insurance products';
GO

-- ============================================================================
-- SECTION 2: PRODUCT LIMITS
-- ============================================================================

PRINT 'Creating product limits...';

INSERT INTO ccms_product_limits (product_id, limit_type, limit_amount, is_active, created_by, is_deleted, deleted_at, deleted_by)
VALUES 
    -- CUEPACSCARE (GAKUM) - Product 1
    (1, 'Annual', 150000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (1, 'Room & Board', 180.00, 1, 'SYSTEM', 0, NULL, NULL),
    (1, 'Surgical', 50000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (1, 'Outpatient', 5000.00, 1, 'SYSTEM', 0, NULL, NULL),
    
    -- CUEPACSCARE (MONTHLY) - Product 2
    (2, 'Annual', 100000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (2, 'Room & Board', 150.00, 1, 'SYSTEM', 0, NULL, NULL),
    (2, 'Surgical', 30000.00, 1, 'SYSTEM', 0, NULL, NULL),
    
    -- EMPLOYEE AND FAMILY - Product 3
    (3, 'Annual', 200000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (3, 'Lifetime', 500000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (3, 'Room & Board', 200.00, 1, 'SYSTEM', 0, NULL, NULL),
    (3, 'Inpatient', 150000.00, 1, 'SYSTEM', 0, NULL, NULL),
    
    -- Allianz MedicalCare Plus - Product 4
    (4, 'Annual', 300000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (4, 'Lifetime', 1000000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (4, 'Room & Board', 250.00, 1, 'SYSTEM', 0, NULL, NULL),
    (4, 'Surgical', 100000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (4, 'Outpatient', 10000.00, 1, 'SYSTEM', 0, NULL, NULL),
    
    -- Allianz Family Shield - Product 5
    (5, 'Annual', 250000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (5, 'Room & Board', 200.00, 1, 'SYSTEM', 0, NULL, NULL),
    (5, 'Inpatient', 180000.00, 1, 'SYSTEM', 0, NULL, NULL),
    
    -- AIA Health Guard - Product 6
    (6, 'Annual', 180000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (6, 'Lifetime', 600000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (6, 'Room & Board', 180.00, 1, 'SYSTEM', 0, NULL, NULL),
    (6, 'Surgical', 60000.00, 1, 'SYSTEM', 0, NULL, NULL),
    
    -- AIA Medical Protector - Product 7
    (7, 'Annual', 350000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (7, 'Lifetime', 1500000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (7, 'Room & Board', 300.00, 1, 'SYSTEM', 0, NULL, NULL),
    (7, 'Surgical', 120000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (7, 'Outpatient', 15000.00, 1, 'SYSTEM', 0, NULL, NULL),
    
    -- Prudential PruHealth Premier - Product 8
    (8, 'Annual', 400000.00, 1, 'SYSTEM', 0, NULL, NULL),
    (8, 'Lifetime', 2000000.00, 1, 'SYSTEM'),
    (8, 'Room & Board', 350.00, 1, 'SYSTEM'),
    (8, 'Inpatient', 300000.00, 1, 'SYSTEM'),
    (8, 'Outpatient', 20000.00, 1, 'SYSTEM'),
    
    -- Prudential Family Care - Product 9
    (9, 'Annual', 220000.00, 1, 'SYSTEM'),
    (9, 'Room & Board', 200.00, 1, 'SYSTEM'),
    (9, 'Inpatient', 160000.00, 1, 'SYSTEM'),
    
    -- Zurich Zi-Care Basic - Product 10
    (10, 'Annual', 120000.00, 1, 'SYSTEM'),
    (10, 'Room & Board', 150.00, 1, 'SYSTEM'),
    (10, 'Surgical', 40000.00, 1, 'SYSTEM'),
    
    -- Zurich Zi-Care Platinum - Product 11
    (11, 'Annual', 500000.00, 1, 'SYSTEM'),
    (11, 'Lifetime', 2500000.00, 1, 'SYSTEM'),
    (11, 'Room & Board', 400.00, 1, 'SYSTEM'),
    (11, 'Surgical', 150000.00, 1, 'SYSTEM'),
    (11, 'Outpatient', 25000.00, 1, 'SYSTEM');

PRINT '  ✓ Created 44 product limits';
GO

-- ============================================================================
-- SECTION 3: PRODUCT CO-PAY
-- ============================================================================

PRINT 'Creating product co-pay...';

INSERT INTO ccms_product_copay (product_id, copay_type, copay_value, applies_to, is_active, created_by)
VALUES 
    -- CUEPACSCARE (GAKUM) - Product 1
    (1, 'Percentage %', 10.00, 'All Services', 1, 'SYSTEM'),
    (1, 'Fixed Amount', 50.00, 'Outpatient', 1, 'SYSTEM'),
    
    -- CUEPACSCARE (MONTHLY) - Product 2
    (2, 'Percentage %', 15.00, 'All Services', 1, 'SYSTEM'),
    
    -- EMPLOYEE AND FAMILY - Product 3
    (3, 'Percentage %', 5.00, 'Outpatient', 1, 'SYSTEM'),
    (3, 'Fixed Amount', 100.00, 'Consultation', 1, 'SYSTEM'),
    
    -- Allianz MedicalCare Plus - Product 4
    (4, 'Percentage %', 10.00, 'Outpatient', 1, 'SYSTEM'),
    (4, 'Percentage %', 5.00, 'Inpatient', 1, 'SYSTEM'),
    (4, 'Fixed Amount', 50.00, 'Medication', 1, 'SYSTEM'),
    
    -- Allianz Family Shield - Product 5
    (5, 'Percentage %', 15.00, 'All Services', 1, 'SYSTEM'),
    (5, 'Fixed Amount', 100.00, 'Diagnostic Tests', 1, 'SYSTEM'),
    
    -- AIA Health Guard - Product 6
    (6, 'Percentage %', 10.00, 'All Services', 1, 'SYSTEM'),
    (6, 'Fixed Amount', 50.00, 'Consultation', 1, 'SYSTEM'),
    
    -- AIA Medical Protector - Product 7
    (7, 'Percentage %', 5.00, 'All Services', 1, 'SYSTEM'),
    (7, 'Fixed Amount', 30.00, 'Medication', 1, 'SYSTEM'),
    
    -- Prudential PruHealth Premier - Product 8
    (8, 'Percentage %', 5.00, 'Outpatient', 1, 'SYSTEM'),
    (8, 'Fixed Amount', 100.00, 'Consultation', 1, 'SYSTEM'),
    
    -- Prudential Family Care - Product 9
    (9, 'Percentage %', 10.00, 'All Services', 1, 'SYSTEM'),
    (9, 'Fixed Amount', 80.00, 'Diagnostic Tests', 1, 'SYSTEM'),
    
    -- Zurich Zi-Care Basic - Product 10
    (10, 'Percentage %', 20.00, 'All Services', 1, 'SYSTEM'),
    
    -- Zurich Zi-Care Platinum - Product 11
    (11, 'Percentage %', 5.00, 'Outpatient', 1, 'SYSTEM'),
    (11, 'Fixed Amount', 50.00, 'Consultation', 1, 'SYSTEM');

PRINT '  ✓ Created 22 product co-pay entries';
GO

-- ============================================================================
-- SECTION 4: PRODUCT LOS THRESHOLDS
-- ============================================================================

PRINT 'Creating product LOS thresholds...';

INSERT INTO ccms_los_alert_thresholds (product_id, diagnosis_category, threshold_days, alert_level, is_active, created_by)
VALUES 
    -- CUEPACSCARE (GAKUM) - Product 1 (Default is 5 days, Infectious 3 days, Respiratory 4 days)
    (1, NULL, 5, 1, 1, 'SYSTEM'),
    (1, 'INFECTIOUS', 3, 2, 1, 'SYSTEM'),
    (1, 'RESPIRATORY', 4, 1, 1, 'SYSTEM'),
    
    -- CUEPACSCARE (MONTHLY) - Product 2 (Default is 4 days)
    (2, NULL, 4, 1, 1, 'SYSTEM'),
    (2, 'MATERNITY', 3, 2, 1, 'SYSTEM'),
    
    -- EMPLOYEE AND FAMILY - Product 3
    (3, NULL, 6, 1, 1, 'SYSTEM'),
    (3, 'NEOPLASMS', 7, 2, 1, 'SYSTEM'),
    
    -- Allianz MedicalCare Plus - Product 4
    (4, NULL, 5, 1, 1, 'SYSTEM'),
    (4, 'CIRCULATORY', 5, 2, 1, 'SYSTEM'),

    -- Allianz Family Shield - Product 5
    (5, NULL, 6, 1, 1, 'SYSTEM'),
    (5, 'MATERNITY', 4, 2, 1, 'SYSTEM'),

    -- AIA Health Guard - Product 6
    (6, NULL, 5, 1, 1, 'SYSTEM'),
    (6, 'DIGESTIVE', 3, 2, 1, 'SYSTEM'),

    -- AIA Medical Protector - Product 7
    (7, NULL, 7, 1, 1, 'SYSTEM'),
    (7, 'INJURY', 4, 2, 1, 'SYSTEM'),
    
    -- Prudential PruHealth Premier - Product 8 (Generous thresholds)
    (8, NULL, 7, 1, 1, 'SYSTEM'),
    (8, 'INJURY', 5, 1, 1, 'SYSTEM'),

    -- Prudential Family Care - Product 9
    (9, NULL, 5, 1, 1, 'SYSTEM'),
    (9, 'RESPIRATORY', 5, 2, 1, 'SYSTEM'),

    -- Zurich Zi-Care Basic - Product 10
    (10, NULL, 4, 1, 1, 'SYSTEM'),
    (10, 'INFECTIOUS', 3, 2, 1, 'SYSTEM'),
    
    -- Zurich Zi-Care Platinum - Product 11
    (11, NULL, 7, 1, 1, 'SYSTEM');

PRINT '  ✓ Created 22 product LOS thresholds';
GO

-- ============================================================================
-- VERIFICATION & SUMMARY
-- ============================================================================

PRINT '';
PRINT '========================================';
PRINT 'Product Data Seeding Summary:';
PRINT '========================================';

SELECT 'Products' AS Entity, COUNT(*) AS Count FROM ccms_products WHERE is_active = 1
UNION ALL
SELECT 'Product Limits', COUNT(*) FROM ccms_product_limits WHERE is_active = 1
UNION ALL
SELECT 'Product Co-pay', COUNT(*) FROM ccms_product_copay WHERE is_active = 1
UNION ALL
SELECT 'LOS Thresholds', COUNT(*) FROM ccms_los_alert_thresholds WHERE is_active = 1;

PRINT '';
PRINT 'Products with Child Data:';
SELECT 
    p.product_id,
    p.insurer_name,
    p.plan_code,
    COUNT(DISTINCT pl.limit_id) AS LimitCount,
    COUNT(DISTINCT pc.copay_id) AS CopayCount,
    COUNT(DISTINCT pt.threshold_id) AS ThresholdCount
FROM ccms_products p
LEFT JOIN ccms_product_limits pl ON p.product_id = pl.product_id AND pl.is_active = 1
LEFT JOIN ccms_product_copay pc ON p.product_id = pc.product_id AND pc.is_active = 1
LEFT JOIN ccms_los_alert_thresholds pt ON p.product_id = pt.product_id AND pt.is_active = 1
WHERE p.is_active = 1
GROUP BY p.product_id, p.insurer_name, p.plan_code
ORDER BY p.product_id;

PRINT '';
PRINT '========================================';
PRINT '✓ Product Data Seeding Completed Successfully!';
PRINT '========================================';
GO
