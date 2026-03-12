-- ============================================================================
-- CCMS Policy Holders (Members) Data Seeding Script
-- Purpose: Populate sample policy holder data with all related child tables
-- Created: March 13, 2026
-- Dependencies: Run after seed-bank-data.sql and seed-product-data.sql
-- ============================================================================

USE db_ccms;
GO

PRINT '========================================';
PRINT 'Starting Policy Holders Data Seeding...';
PRINT '========================================';
PRINT '';

-- Clear existing member data (for re-running script)
DELETE FROM ccms_member_pec_conditions;
DELETE FROM ccms_member_dependents;
DELETE FROM ccms_member_policies;
DELETE FROM ccms_member_contacts;
DELETE FROM ccms_member_addresses;
DELETE FROM ccms_members;

PRINT 'Cleared existing policy holder data';
GO

-- ============================================================================
-- SECTION 1: MAIN MEMBERS (POLICY HOLDERS)
-- ============================================================================

PRINT 'Creating sample policy holders...';

SET IDENTITY_INSERT ccms_members ON;

INSERT INTO ccms_members (member_id, full_name, ic_no, fwd_member_no, fwd_client_no, client_id, dob, gender, member_type, member_status, bank_id, bank_acc_no, enrollment_date, created_by, is_deleted)
VALUES 
    (1, 'Ahmad bin Abdullah', '850615-08-5234', 'FWD-M-001', 'FWD-C-001', 'CLI-001', '1985-06-15', 1, 'PRINCIPAL', 'ACTIVE', 1, '1234567890', '2023-01-15', 'SYSTEM', 0),
    (2, 'Siti Nurhaliza binti Hassan', '900823-14-7856', 'FWD-M-002', 'FWD-C-002', 'CLI-002', '1990-08-23', 0, 'PRINCIPAL', 'ACTIVE', 2, '2345678901', '2023-02-20', 'SYSTEM', 0),
    (3, 'Kumar Subramaniam', '880412-10-3421', 'FWD-M-003', 'FWD-C-003', 'CLI-003', '1988-04-12', 1, 'PRINCIPAL', 'ACTIVE', 3, '3456789012', '2023-03-10', 'SYSTEM', 0),
    (4, 'Lim Mei Ling', '920705-01-2345', 'FWD-M-004', 'FWD-C-004', 'CLI-004', '1992-07-05', 0, 'PRINCIPAL', 'ACTIVE', 4, '4567890123', '2023-04-05', 'SYSTEM', 0),
    (5, 'David Chen Wei Ming', '870920-14-6789', 'FWD-M-005', 'FWD-C-005', 'CLI-005', '1987-09-20', 1, 'EMPLOYEE', 'ACTIVE', 5, '5678901234', '2023-05-12', 'SYSTEM', 0),
    (6, 'Nurul Aina binti Mohd Noor', '950318-03-4567', 'FWD-M-006', 'FWD-C-006', 'CLI-006', '1995-03-18', 0, 'EMPLOYEE', 'ACTIVE', 6, '6789012345', '2023-06-01', 'SYSTEM', 0),
    (7, 'Raj Kumar a/l Govindasamy', '840522-08-8901', 'FWD-M-007', 'FWD-C-007', 'CLI-007', '1984-05-22', 1, 'PRINCIPAL', 'ACTIVE', 7, '7890123456', '2023-07-15', 'SYSTEM', 0),
    (8, 'Wong Sook Yin', '910214-01-5678', 'FWD-M-008', 'FWD-C-008', 'CLI-008', '1991-02-14', 0, 'EMPLOYEE', 'ACTIVE', 8, '8901234567', '2023-08-20', 'SYSTEM', 0),
    (9, 'Muhammad Faizal bin Ismail', '860901-01-2341', 'FWD-M-009', 'FWD-C-009', 'CLI-009', '1986-09-01', 1, 'PRINCIPAL', 'INACTIVE', 1, '9012345678', '2023-09-10', 'SYSTEM', 0),
    (10, 'Priya Devi a/p Ramesh', '930627-02-3456', 'FWD-M-010', 'FWD-C-010', 'CLI-010', '1993-06-27', 0, 'EMPLOYEE', 'ACTIVE', 2, '0123456789', '2023-10-05', 'SYSTEM', 0);

SET IDENTITY_INSERT ccms_members OFF;

PRINT '  ✓ Created 10 sample policy holders';
GO

-- ============================================================================
-- SECTION 2: MEMBER ADDRESSES
-- ============================================================================

PRINT 'Creating member addresses...';

INSERT INTO ccms_member_addresses (member_id, address_type, street_line1, street_line2, city, state, postal_code, country, is_primary, created_by)
VALUES 
    -- Ahmad bin Abdullah
    (1, 'PRIMARY', 'No. 123, Jalan Ampang', 'Taman Melawati', 'Kuala Lumpur', 'Kuala Lumpur', '53100', 'Malaysia', 1, 'SYSTEM'),
    (1, 'MAILING', 'No. 45, Jalan Raja Chulan', 'Bukit Bintang', 'Kuala Lumpur', 'Kuala Lumpur', '50200', 'Malaysia', 0, 'SYSTEM'),
    
    -- Siti Nurhaliza
    (2, 'PRIMARY', 'No. 567, Jalan Gasing', 'Petaling Jaya', 'Petaling Jaya', 'Selangor', '46000', 'Malaysia', 1, 'SYSTEM'),
    
    -- Kumar Subramaniam
    (3, 'PRIMARY', 'No. 89, Jalan SS2/24', 'SS 2', 'Petaling Jaya', 'Selangor', '47300', 'Malaysia', 1, 'SYSTEM'),
    
    -- Lim Mei Ling
    (4, 'PRIMARY', 'No. 234, Jalan Ipoh', 'Sentul', 'Kuala Lumpur', 'Kuala Lumpur', '51200', 'Malaysia', 1, 'SYSTEM'),
    
    -- David Chen
    (5, 'PRIMARY', 'No. 78, Jalan Taman Desa', 'Taman Desa', 'Kuala Lumpur', 'Kuala Lumpur', '58100', 'Malaysia', 1, 'SYSTEM'),
    
    -- Nurul Aina
    (6, 'PRIMARY', 'No. 456, Jalan Bangsar', 'Bangsar', 'Kuala Lumpur', 'Kuala Lumpur', '59100', 'Malaysia', 1, 'SYSTEM'),
    
    -- Raj Kumar
    (7, 'PRIMARY', 'No. 90, Jalan Pudu', 'Pudu', 'Kuala Lumpur', 'Kuala Lumpur', '55100', 'Malaysia', 1, 'SYSTEM'),
    
    -- Wong Sook Yin
    (8, 'PRIMARY', 'No. 345, Jalan Kuchai Lama', 'Kuchai Lama', 'Kuala Lumpur', 'Kuala Lumpur', '58200', 'Malaysia', 1, 'SYSTEM'),
    
    -- Muhammad Faizal
    (9, 'PRIMARY', 'No. 12, Jalan Masjid India', 'Masjid India', 'Kuala Lumpur', 'Kuala Lumpur', '50100', 'Malaysia', 1, 'SYSTEM'),
    
    -- Priya Devi
    (10, 'PRIMARY', 'No. 678, Jalan Cheras', 'Taman Connaught', 'Kuala Lumpur', 'Kuala Lumpur', '56000', 'Malaysia', 1, 'SYSTEM');

PRINT '  ✓ Created 11 member addresses';
GO

-- ============================================================================
-- SECTION 3: MEMBER CONTACTS
-- ============================================================================

PRINT 'Creating member contacts...';

INSERT INTO ccms_member_contacts (member_id, contact_type, contact_value, is_primary, created_by)
VALUES 
    -- Ahmad bin Abdullah
    (1, 'EMAIL', 'ahmad.abdullah@email.com', 1, 'SYSTEM'),
    (1, 'MOBILE', '+60123456789', 1, 'SYSTEM'),
    (1, 'PHONE', '+60321234567', 0, 'SYSTEM'),
    
    -- Siti Nurhaliza
    (2, 'EMAIL', 'siti.nurhaliza@email.com', 1, 'SYSTEM'),
    (2, 'MOBILE', '+60123456790', 1, 'SYSTEM'),
    
    -- Kumar Subramaniam
    (3, 'EMAIL', 'kumar.s@email.com', 1, 'SYSTEM'),
    (3, 'MOBILE', '+60123456791', 1, 'SYSTEM'),
    
    -- Lim Mei Ling
    (4, 'EMAIL', 'lim.meiling@email.com', 1, 'SYSTEM'),
    (4, 'MOBILE', '+60123456792', 1, 'SYSTEM'),
    (4, 'WHATSAPP', '+60123456792', 0, 'SYSTEM'),
    
    -- David Chen
    (5, 'EMAIL', 'david.chen@email.com', 1, 'SYSTEM'),
    (5, 'MOBILE', '+60123456793', 1, 'SYSTEM'),
    
    -- Nurul Aina
    (6, 'EMAIL', 'nurul.aina@email.com', 1, 'SYSTEM'),
    (6, 'MOBILE', '+60123456794', 1, 'SYSTEM'),
    
    -- Raj Kumar
    (7, 'EMAIL', 'raj.kumar@email.com', 1, 'SYSTEM'),
    (7, 'MOBILE', '+60123456795', 1, 'SYSTEM'),
    
    -- Wong Sook Yin
    (8, 'EMAIL', 'wong.sookyin@email.com', 1, 'SYSTEM'),
    (8, 'MOBILE', '+60123456796', 1, 'SYSTEM'),
    
    -- Muhammad Faizal
    (9, 'EMAIL', 'faizal.ismail@email.com', 1, 'SYSTEM'),
    (9, 'MOBILE', '+60123456797', 1, 'SYSTEM'),
    
    -- Priya Devi
    (10, 'EMAIL', 'priya.devi@email.com', 1, 'SYSTEM'),
    (10, 'MOBILE', '+60123456798', 1, 'SYSTEM');

PRINT '  ✓ Created 22 member contacts';
GO

-- ============================================================================
-- SECTION 4: MEMBER POLICIES
-- ============================================================================

PRINT 'Creating member policies...';

INSERT INTO ccms_member_policies (member_id, product_id, policy_no, effective_date, expiry_date, status, created_by, is_deleted)
VALUES 
    -- Ahmad - CUEPACSCARE (GAKUM)
    (1, 1, 'POL-2023-001', '2023-01-15', '2024-01-14', 'ACTIVE', 'SYSTEM', 0),
    (1, 2, 'POL-2024-001', '2024-01-15', '2025-01-14', 'ACTIVE', 'SYSTEM', 0),
    
    -- Siti - Employee and Family
    (2, 3, 'POL-2023-002', '2023-02-20', '2024-02-19', 'ACTIVE', 'SYSTEM', 0),
    (2, 3, 'POL-2024-002', '2024-02-20', '2025-02-19', 'ACTIVE', 'SYSTEM', 0),
    
    -- Kumar - Allianz MedicalCare Plus
    (3, 4, 'POL-2023-003', '2023-03-10', '2024-03-09', 'ACTIVE', 'SYSTEM', 0),
    (3, 4, 'POL-2024-003', '2024-03-10', '2025-03-09', 'ACTIVE', 'SYSTEM', 0),
    
    -- Lim Mei Ling - AIA Health Guard
    (4, 6, 'POL-2023-004', '2023-04-05', '2024-04-04', 'ACTIVE', 'SYSTEM', 0),
    (4, 6, 'POL-2024-004', '2024-04-05', '2025-04-04', 'ACTIVE', 'SYSTEM', 0),
    
    -- David - Prudential PruHealth
    (5, 8, 'POL-2023-005', '2023-05-12', '2024-05-11', 'ACTIVE', 'SYSTEM', 0),
    (5, 9, 'POL-2024-005', '2024-05-12', '2025-05-11', 'ACTIVE', 'SYSTEM', 0),
    
    -- Nurul - Zurich ZI-Care Basic
    (6, 10, 'POL-2023-006', '2023-06-01', '2024-05-31', 'ACTIVE', 'SYSTEM', 0),
    (6, 10, 'POL-2024-006', '2024-06-01', '2025-05-31', 'ACTIVE', 'SYSTEM', 0),
    
    -- Raj - CUEPACSCARE
    (7, 1, 'POL-2023-007', '2023-07-15', '2024-07-14', 'ACTIVE', 'SYSTEM', 0),
    
    -- Wong - Allianz Family Shield
    (8, 5, 'POL-2023-008', '2023-08-20', '2024-08-19', 'ACTIVE', 'SYSTEM', 0),
    
    -- Muhammad Faizal - EXPIRED
    (9, 1, 'POL-2022-009', '2022-09-10', '2023-09-09', 'EXPIRED', 'SYSTEM', 0),
    
    -- Priya - AIA Medical Protector
    (10, 7, 'POL-2023-010', '2023-10-05', '2024-10-04', 'ACTIVE', 'SYSTEM', 0);

PRINT '  ✓ Created 16 member policies';
GO

-- ============================================================================
-- SECTION 5: MEMBER DEPENDENTS
-- ============================================================================

PRINT 'Creating member dependents...';

-- Get relationship IDs
DECLARE @SpouseRelId INT, @ChildRelId INT, @SonRelId INT, @DaughterRelId INT;
SELECT @SpouseRelId = lookup_id FROM ccms_m_lookups WHERE lookup_code = 'SPOUSE' AND category_id = (SELECT category_id FROM ccms_m_lookup_categories WHERE category_name = 'RELATIONSHIPS');
SELECT @ChildRelId = lookup_id FROM ccms_m_lookups WHERE lookup_code = 'CHILD' AND category_id = (SELECT category_id FROM ccms_m_lookup_categories WHERE category_name = 'RELATIONSHIPS');
SELECT @SonRelId = lookup_id FROM ccms_m_lookups WHERE lookup_code = 'SON' AND category_id = (SELECT category_id FROM ccms_m_lookup_categories WHERE category_name = 'RELATIONSHIPS');
SELECT @DaughterRelId = lookup_id FROM ccms_m_lookups WHERE lookup_code = 'DAUGHTER' AND category_id = (SELECT category_id FROM ccms_m_lookup_categories WHERE category_name = 'RELATIONSHIPS');

SET IDENTITY_INSERT ccms_member_dependents ON;

INSERT INTO ccms_member_dependents (dependent_id, principal_member_id, full_name, ic_no, relationship_id, dob, is_active, created_by)
VALUES 
    -- Ahmad's Dependents
    (1, 1, 'Aminah binti Hassan', '880710-08-5678', @SpouseRelId, '1988-07-10', 1, 'SYSTEM'),
    (2, 1, 'Ahmad Aqil bin Ahmad', '150320-08-1234', @SonRelId, '2015-03-20', 1, 'SYSTEM'),
    (3, 1, 'Nur Aisyah binti Ahmad', '180515-08-5679', @DaughterRelId, '2018-05-15', 1, 'SYSTEM'),
    
    -- Siti's Dependents
    (4, 2, 'Mohd Hafiz bin Rahman', '890425-14-2345', @SpouseRelId, '1989-04-25', 1, 'SYSTEM'),
    (5, 2, 'Siti Nurfarah binti Hafiz', '160805-14-6789', @DaughterRelId, '2016-08-05', 1, 'SYSTEM'),
    
    -- Kumar's Dependents
    (6, 3, 'Priya Devi a/p Kumar', '900620-10-4567', @SpouseRelId, '1990-06-20', 1, 'SYSTEM'),
    (7, 3, 'Arun Kumar a/l Kumar', '190215-10-8901', @SonRelId, '2019-02-15', 1, 'SYSTEM'),
    
    -- Lim Mei Ling's Dependents
    (8, 4, 'Chen Wei Jie', '900912-01-3456', @SpouseRelId, '1990-09-12', 1, 'SYSTEM'),
    (9, 4, 'Chen Xin Yi', '170420-01-7890', @DaughterRelId, '2017-04-20', 1, 'SYSTEM'),
    (10, 4, 'Chen Kai Wen', '200110-01-2345', @SonRelId, '2020-01-10', 1, 'SYSTEM'),
    
    -- David Chen's Dependents
    (11, 5, 'Sarah Tan Mei Hua', '890825-14-6789', @SpouseRelId, '1989-08-25', 1, 'SYSTEM'),
    (12, 5, 'Chen Li Ming', '140622-14-9012', @SonRelId, '2014-06-22', 1, 'SYSTEM'),
    
    -- Raj Kumar's Dependents
    (13, 7, 'Lakshmi a/p Raj', '850315-08-4567', @SpouseRelId, '1985-03-15', 1, 'SYSTEM'),
    (14, 7, 'Vikram a/l Raj', '120910-08-8901', @SonRelId, '2012-09-10', 1, 'SYSTEM'),
    (15, 7, 'Priya a/p Raj', '160425-08-2346', @DaughterRelId, '2016-04-25', 1, 'SYSTEM');

SET IDENTITY_INSERT ccms_member_dependents OFF;

PRINT '  ✓ Created 15 member dependents';
GO

-- ============================================================================
-- SECTION 6: MEMBER PEC CONDITIONS
-- ============================================================================

PRINT 'Creating member PEC conditions...';

INSERT INTO ccms_member_pec_conditions (dependent_id, condition_code, condition_name, diagnosis_date, is_excluded, notes, created_by)
VALUES 
    -- Ahmad's daughter - Asthma
    (3, 'J45', 'Asthma', '2019-06-10', 1, 'Childhood asthma, requires regular monitoring', 'SYSTEM'),
    
    -- Kumar's son - Eczema
    (7, 'L20', 'Atopic Dermatitis (Eczema)', '2020-03-15', 1, 'Mild eczema, seasonal flare-ups', 'SYSTEM'),
    
    -- Lim Mei Ling's daughter - Congenital Heart
    (9, 'Q24', 'Congenital Heart Defect', '2017-04-20', 1, 'VSD - Ventricular Septal Defect, under specialist care', 'SYSTEM'),
    
    -- David's son - Diabetes Type 1
    (12, 'E10', 'Type 1 Diabetes Mellitus', '2019-08-15', 1, 'Insulin dependent, requires regular monitoring', 'SYSTEM'),
    
    -- Raj's son - ADHD
    (14, 'F90', 'ADHD (Attention Deficit Hyperactivity Disorder)', '2018-05-20', 0, 'Under treatment, condition managed well', 'SYSTEM');

PRINT '  ✓ Created 5 PEC conditions';
GO

-- ============================================================================
-- VERIFICATION & SUMMARY
-- ============================================================================

PRINT '';
PRINT '========================================';
PRINT 'Policy Holders Data Seeding Summary:';
PRINT '========================================';

SELECT 'Policy Holders (Members)' AS Entity, COUNT(*) AS Count FROM ccms_members
UNION ALL
SELECT 'Member Addresses', COUNT(*) FROM ccms_member_addresses
UNION ALL
SELECT 'Member Contacts', COUNT(*) FROM ccms_member_contacts
UNION ALL
SELECT 'Member Policies', COUNT(*) FROM ccms_member_policies
UNION ALL
SELECT 'Member Dependents', COUNT(*) FROM ccms_member_dependents
UNION ALL
SELECT 'PEC Conditions', COUNT(*) FROM ccms_member_pec_conditions;

PRINT '';
PRINT 'Active Policies by Product:';
SELECT 
    p.insurer_name + ' - ' + p.plan_code AS Product,
    COUNT(mp.policy_record_id) AS PolicyCount
FROM ccms_products p
LEFT JOIN ccms_member_policies mp ON p.product_id = mp.product_id AND mp.status = 'ACTIVE' AND mp.is_deleted = 0
GROUP BY p.product_id, p.insurer_name, p.plan_code
ORDER BY PolicyCount DESC;

PRINT '';
PRINT '========================================';
PRINT '✓ Policy Holders Data Seeding Completed Successfully!';
PRINT '========================================';
GO
