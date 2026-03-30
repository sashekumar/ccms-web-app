-- ============================================================================
-- CCMS Hospital Data Seeding Script
-- Purpose: Populate sample hospital data with all related child tables
-- Created: March 13, 2026
-- Dependencies: Run after seed-bank-data.sql
-- ============================================================================

USE db_ccms;
GO

PRINT '========================================';
PRINT 'Starting Hospital Data Seeding...';
PRINT '========================================';
PRINT '';

-- Clear existing hospital data (for re-running script)
DELETE FROM ccms_fee_schedules WHERE hospital_id IS NOT NULL;
DELETE FROM ccms_hospital_staff_contacts;
DELETE FROM ccms_hospital_staff;
DELETE FROM ccms_hospital_codes;
DELETE FROM ccms_hospital_addresses;
DELETE FROM ccms_hospitals;

PRINT 'Cleared existing hospital data';
GO

-- ============================================================================
-- SECTION 1: MAIN HOSPITALS
-- ============================================================================

PRINT 'Creating sample hospitals...';

SET IDENTITY_INSERT ccms_hospitals ON;

INSERT INTO ccms_hospitals (hospital_id, hospital_name, hospital_code, hospital_type, reg_no, bank_id, bank_acc_no, is_panel, panel_status, panel_effective_date, accreditation_status, accreditation_expiry, created_by, is_deleted, deleted_at, deleted_by)
VALUES 
    (1, 'Gleneagles Hospital Kuala Lumpur', 'GKL001', 'PRIVATE', 'REG-GKL-001', 1, '112233445566', 1, 'Active', '2020-01-01', 'JCI', '2027-12-31', 'SYSTEM', 0, NULL, NULL),
    (2, 'Pantai Hospital Kuala Lumpur', 'PKL001', 'PRIVATE', 'REG-PKL-001', 2, '223344556677', 1, 'Active', '2019-06-15', 'MSQH', '2026-06-30', 'SYSTEM', 0, NULL, NULL),
    (3, 'Prince Court Medical Centre', 'PCMC001', 'PRIVATE', 'REG-PCMC-001', 3, '334455667788', 1, 'Active', '2020-03-01', 'JCI', '2028-02-28', 'SYSTEM', 0, NULL, NULL),
    (4, 'Hospital Kuala Lumpur', 'HKL001', 'GOVERNMENT', 'REG-HKL-001', 1, '445566778899', 1, 'Active', '2018-01-01', 'MSQH', '2026-12-31', 'SYSTEM', 0, NULL, NULL),
    (5, 'University Malaya Medical Centre', 'UMMC001', 'UNIVERSITY', 'REG-UMMC-001', 4, '556677889900', 1, 'Active', '2019-08-01', 'MSQH', '2027-07-31', 'SYSTEM', 0, NULL, NULL),
    (6, 'Subang Jaya Medical Centre', 'SJMC001', 'PRIVATE', 'REG-SJMC-001', 5, '667788990011', 1, 'Active', '2020-05-01', 'JCI', '2029-04-30', 'SYSTEM', 0, NULL, NULL),
    (7, 'KPJ Damansara Specialist Hospital', 'KPJD001', 'PRIVATE', 'REG-KPJD-001', 6, '778899001122', 1, 'Active', '2019-11-01', 'MSQH', '2027-10-31', 'SYSTEM', 0, NULL, NULL),
    (8, 'Columbia Asia Hospital - Petaling Jaya', 'CAPJ001', 'PRIVATE', 'REG-CAPJ-001', 7, '889900112233', 1, 'Active', '2020-02-15', 'JCI', '2028-01-31', 'SYSTEM', 0, NULL, NULL);

SET IDENTITY_INSERT ccms_hospitals OFF;

PRINT '  ✓ Created 8 sample hospitals';
GO

-- ============================================================================
-- SECTION 2: HOSPITAL ADDRESSES
-- ============================================================================

PRINT 'Creating hospital addresses...';

INSERT INTO ccms_hospital_addresses (hospital_id, address_type, street_line1, street_line2, city, state, postal_code, country, is_primary, created_by)
VALUES 
    -- Gleneagles KL
    (1, 'PRIMARY', 'Jalan Ampang', 'Gleneagles Kuala Lumpur', 'Kuala Lumpur', 'Kuala Lumpur', '50450', 'Malaysia', 1, 'SYSTEM'),
    
    -- Pantai KL
    (2, 'PRIMARY', '8, Jalan Bukit Pantai', 'Bangsar', 'Kuala Lumpur', 'Kuala Lumpur', '59100', 'Malaysia', 1, 'SYSTEM'),
    
    -- Prince Court
    (3, 'PRIMARY', '39, Jalan Kia Peng', 'KLCC', 'Kuala Lumpur', 'Kuala Lumpur', '50450', 'Malaysia', 1, 'SYSTEM'),
    
    -- Hospital KL
    (4, 'PRIMARY', 'Jalan Pahang', 'Jalan Raja Muda Abdul Aziz', 'Kuala Lumpur', 'Kuala Lumpur', '50586', 'Malaysia', 1, 'SYSTEM'),
    
    -- UMMC
    (5, 'PRIMARY', 'Lembah Pantai', 'University Malaya', 'Kuala Lumpur', 'Kuala Lumpur', '59100', 'Malaysia', 1, 'SYSTEM'),
    
    -- SJMC
    (6, 'PRIMARY', '1, Jalan SS 12/1A', 'SS 12', 'Subang Jaya', 'Selangor', '47500', 'Malaysia', 1, 'SYSTEM'),
    
    -- KPJ Damansara
    (7, 'PRIMARY', '119, Jalan SS 20/10', 'Damansara Utama', 'Petaling Jaya', 'Selangor', '47400', 'Malaysia', 1, 'SYSTEM'),
    
    -- Columbia Asia PJ
    (8, 'PRIMARY', 'Jalan 13/6', 'Section 13', 'Petaling Jaya', 'Selangor', '46200', 'Malaysia', 1, 'SYSTEM');

PRINT '  ✓ Created 8 hospital addresses';
GO

-- ============================================================================
-- SECTION 3: HOSPITAL CODES
-- ============================================================================

PRINT 'Creating hospital codes...';

INSERT INTO ccms_hospital_codes (hospital_id, code_type, code_value, is_active, created_by)
VALUES 
    -- Gleneagles KL
    (1, 'ZURICH_HOSP_CODE', 'ZUR-GKL-001', 1, 'SYSTEM'),
    (1, 'FWD_HOSP_CODE', 'FWD-GKL-001', 1, 'SYSTEM'),
    
    -- Pantai KL
    (2, 'ZURICH_HOSP_CODE', 'ZUR-PKL-001', 1, 'SYSTEM'),
    (2, 'FWD_HOSP_CODE', 'FWD-PKL-001', 1, 'SYSTEM'),
    
    -- Prince Court
    (3, 'ZURICH_HOSP_CODE', 'ZUR-PCMC-001', 1, 'SYSTEM'),
    (3, 'FWD_HOSP_CODE', 'FWD-PCMC-001', 1, 'SYSTEM'),
    
    -- Hospital KL
    (4, 'ZURICH_HOSP_CODE', 'ZUR-HKL-001', 1, 'SYSTEM'),
    (4, 'FWD_HOSP_CODE', 'FWD-HKL-001', 1, 'SYSTEM'),
    
    -- UMMC
    (5, 'ZURICH_HOSP_CODE', 'ZUR-UMMC-001', 1, 'SYSTEM'),
    (5, 'FWD_HOSP_CODE', 'FWD-UMMC-001', 1, 'SYSTEM'),
    
    -- SJMC
    (6, 'ZURICH_HOSP_CODE', 'ZUR-SJMC-001', 1, 'SYSTEM'),
    (6, 'FWD_HOSP_CODE', 'FWD-SJMC-001', 1, 'SYSTEM'),
    
    -- KPJ Damansara
    (7, 'ZURICH_HOSP_CODE', 'ZUR-KPJD-001', 1, 'SYSTEM'),
    (7, 'FWD_HOSP_CODE', 'FWD-KPJD-001', 1, 'SYSTEM'),
    
    -- Columbia Asia PJ
    (8, 'ZURICH_HOSP_CODE', 'ZUR-CAPJ-001', 1, 'SYSTEM'),
    (8, 'FWD_HOSP_CODE', 'FWD-CAPJ-001', 1, 'SYSTEM');

PRINT '  ✓ Created 16 hospital codes';
GO

-- ============================================================================
-- SECTION 4: HOSPITAL STAFF
-- ============================================================================

PRINT 'Creating hospital staff...';

SET IDENTITY_INSERT ccms_hospital_staff ON;

INSERT INTO ccms_hospital_staff (staff_id, hospital_id, staff_name, staff_type, specialty, is_active, created_by, is_deleted, deleted_at, deleted_by)
VALUES 
    -- Gleneagles KL Staff
    (1, 1, 'Dr. Ahmad Razali', 'DOCTOR', 'Cardiology', 1, 'SYSTEM', 0, NULL, NULL),
    (2, 1, 'Dr. Siti Aminah', 'DOCTOR', 'Orthopedics', 1, 'SYSTEM', 0, NULL, NULL),
    (3, 1, 'Nurse Lim Mei Ling', 'NURSE', 'General Ward', 1, 'SYSTEM', 0, NULL, NULL),
    (4, 1, 'Sarah Johnson', 'ADMIN', 'Admissions', 1, 'SYSTEM', 0, NULL, NULL),
    
    -- Pantai KL Staff
    (5, 2, 'Dr. Kumar Subramaniam', 'DOCTOR', 'General Surgery', 1, 'SYSTEM', 0, NULL, NULL),
    (6, 2, 'Dr. Wong Lily', 'DOCTOR', 'ENT', 1, 'SYSTEM', 0, NULL, NULL),
    (7, 2, 'Nurse Fatimah', 'NURSE', 'ICU', 1, 'SYSTEM', 0, NULL, NULL),
    
    -- Prince Court Staff
    (8, 3, 'Dr. James Lee', 'DOCTOR', 'Neurology', 1, 'SYSTEM', 0, NULL, NULL),
    (9, 3, 'Dr. Priya Nair', 'DOCTOR', 'Pediatrics', 1, 'SYSTEM', 0, NULL, NULL),
    
    -- Hospital KL Staff
    (10, 4, 'Dr. Zainab Ismail', 'DOCTOR', 'Emergency Medicine', 1, 'SYSTEM', 0, NULL, NULL),
    (11, 4, 'Nurse Ravi Kumar', 'NURSE', 'Emergency Department', 1, 'SYSTEM', 0, NULL, NULL),
    
    -- UMMC Staff
    (12, 5, 'Prof. Dr. Tan Kok Seng', 'DOCTOR', 'Oncology', 1, 'SYSTEM', 0, NULL, NULL),
    (13, 5, 'Dr. Nurul Huda', 'DOCTOR', 'Radiology', 1, 'SYSTEM', 0, NULL, NULL),
    
    -- SJMC Staff
    (14, 6, 'Dr. David Chen', 'DOCTOR', 'Gastroenterology', 1, 'SYSTEM', 0, NULL, NULL),
    (15, 6, 'Nurse Amy Tan', 'NURSE', 'Day Care', 1, 'SYSTEM', 0, NULL, NULL),
    
    -- KPJ Damansara Staff
    (16, 7, 'Dr. Azman Ibrahim', 'DOCTOR', 'Obstetrics & Gynecology', 1, 'SYSTEM', 0, NULL, NULL),
    (17, 7, 'Lab Tech Raj', 'TECHNICIAN', 'Laboratory', 1, 'SYSTEM', 0, NULL, NULL),
    
    -- Columbia Asia PJ Staff
    (18, 8, 'Dr. Susan Lim', 'DOCTOR', 'Internal Medicine', 1, 'SYSTEM', 0, NULL, NULL),
    (19, 8, 'Nurse Aisha', 'NURSE', 'Maternity Ward', 1, 'SYSTEM', 0, NULL, NULL);

SET IDENTITY_INSERT ccms_hospital_staff OFF;

PRINT '  ✓ Created 19 hospital staff members';
GO

-- ============================================================================
-- SECTION 5: HOSPITAL STAFF CONTACTS
-- ============================================================================

PRINT 'Creating hospital staff contacts...';

INSERT INTO ccms_hospital_staff_contacts (staff_id, contact_type, contact_value, is_primary, created_by)
VALUES 
    -- Dr. Ahmad Razali
    (1, 'EMAIL', 'ahmad.razali@gleneagles.com.my', 1, 'SYSTEM'),
    (1, 'MOBILE', '+60123456789', 0, 'SYSTEM'),
    (1, 'EXT', '2101', 0, 'SYSTEM'),
    
    -- Dr. Siti Aminah
    (2, 'EMAIL', 'siti.aminah@gleneagles.com.my', 1, 'SYSTEM'),
    (2, 'MOBILE', '+60123456790', 0, 'SYSTEM'),
    
    -- Nurse Lim Mei Ling
    (3, 'EMAIL', 'lim.meiling@gleneagles.com.my', 1, 'SYSTEM'),
    (3, 'EXT', '3201', 0, 'SYSTEM'),
    
    -- Sarah Johnson (Admin)
    (4, 'EMAIL', 'sarah.johnson@gleneagles.com.my', 1, 'SYSTEM'),
    (4, 'PHONE', '+60321234567', 0, 'SYSTEM'),
    
    -- Dr. Kumar
    (5, 'EMAIL', 'kumar.s@pantai.com.my', 1, 'SYSTEM'),
    (5, 'MOBILE', '+60123456791', 0, 'SYSTEM'),
    
    -- Dr. Wong Lily
    (6, 'EMAIL', 'wong.lily@pantai.com.my', 1, 'SYSTEM'),
    
    -- Dr. James Lee
    (8, 'EMAIL', 'james.lee@princecourt.com', 1, 'SYSTEM'),
    (8, 'MOBILE', '+60123456792', 0, 'SYSTEM'),
    
    -- Dr. Zainab
    (10, 'EMAIL', 'zainab.ismail@hkl.gov.my', 1, 'SYSTEM'),
    (10, 'EXT', '1234', 0, 'SYSTEM'),
    
    -- Prof. Dr. Tan
    (12, 'EMAIL', 'tan.kokseng@ummc.edu.my', 1, 'SYSTEM'),
    (12, 'MOBILE', '+60123456793', 0, 'SYSTEM');

PRINT '  ✓ Created 18 hospital staff contacts';
GO

-- ============================================================================
-- SECTION 6: FEE SCHEDULES
-- ============================================================================

PRINT 'Creating fee schedules...';

INSERT INTO ccms_fee_schedules (hospital_id, fee_type, item_code, description, amount, effective_date, expiry_date, is_active, created_by)
VALUES 
    -- Gleneagles KL Fees
    (1, 'TPA', 'TPA-GKL-001', 'TPA Service Fee', 150.00, '2024-01-01', '2025-12-31', 1, 'SYSTEM'),
    (1, 'CONSULTATION', 'CONS-CARD', 'Cardiology Consultation', 250.00, '2024-01-01', '2025-12-31', 1, 'SYSTEM'),
    (1, 'PROCEDURE', 'PROC-ECG', 'ECG Test', 180.00, '2024-01-01', '2025-12-31', 1, 'SYSTEM'),
    
    -- Pantai KL Fees
    (2, 'TPA', 'TPA-PKL-001', 'TPA Service Fee', 145.00, '2024-01-01', '2025-12-31', 1, 'SYSTEM'),
    (2, 'CONSULTATION', 'CONS-SURG', 'Surgery Consultation', 300.00, '2024-01-01', '2025-12-31', 1, 'SYSTEM'),
    
    -- Prince Court Fees
    (3, 'WAKALAH', 'WAK-PC-001', 'Wakalah Fee', 200.00, '2024-01-01', '2025-12-31', 1, 'SYSTEM'),
    (3, 'CONSULTATION', 'CONS-NEURO', 'Neurology Consultation', 350.00, '2024-01-01', '2025-12-31', 1, 'SYSTEM'),
    
    -- Hospital KL Fees
    (4, 'TPA', 'TPA-HKL-001', 'TPA Service Fee', 100.00, '2024-01-01', '2025-12-31', 1, 'SYSTEM'),
    (4, 'CONSULTATION', 'CONS-ER', 'Emergency Consultation', 150.00, '2024-01-01', '2025-12-31', 1, 'SYSTEM'),
    
    -- SJMC Fees
    (6, 'TPA', 'TPA-SJMC-001', 'TPA Service Fee', 155.00, '2024-01-01', '2025-12-31', 1, 'SYSTEM'),
    (6, 'CONSULTATION', 'CONS-GASTRO', 'Gastroenterology Consultation', 280.00, '2024-01-01', '2025-12-31', 1, 'SYSTEM');

PRINT '  ✓ Created 11 fee schedules';
GO

-- ============================================================================
-- VERIFICATION & SUMMARY
-- ============================================================================

PRINT '';
PRINT '========================================';
PRINT 'Hospital Data Seeding Summary:';
PRINT '========================================';

SELECT 'Hospitals' AS Entity, COUNT(*) AS Count FROM ccms_hospitals
UNION ALL
SELECT 'Hospital Addresses', COUNT(*) FROM ccms_hospital_addresses
UNION ALL
SELECT 'Hospital Codes', COUNT(*) FROM ccms_hospital_codes
UNION ALL
SELECT 'Hospital Staff', COUNT(*) FROM ccms_hospital_staff
UNION ALL
SELECT 'Staff Contacts', COUNT(*) FROM ccms_hospital_staff_contacts
UNION ALL
SELECT 'Fee Schedules', COUNT(*) FROM ccms_fee_schedules WHERE hospital_id IS NOT NULL;

PRINT '';
PRINT '========================================';
PRINT '✓ Hospital Data Seeding Completed Successfully!';
PRINT '========================================';
GO
