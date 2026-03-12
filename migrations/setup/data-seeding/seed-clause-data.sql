-- ============================================================================
-- CCMS Clauses/Terms Data Seeding Script
-- Purpose: Populate insurance policy clauses and terms
-- Created: March 13, 2026
-- ============================================================================

USE db_ccms;
GO

PRINT '========================================';
PRINT 'Starting Clauses Data Seeding...';
PRINT '========================================';
PRINT '';

-- Clear existing clause data (for re-running script)
DELETE FROM ccms_m_clauses;

PRINT 'Creating insurance policy clauses...';

SET IDENTITY_INSERT ccms_m_clauses ON;

INSERT INTO ccms_m_clauses (clause_id, clause_category, clause_code, clause_text, is_active, created_by)
VALUES 
    -- General Exclusions
    (1, 'EXCLUSION', 'EXC-001', 'Pre-existing conditions diagnosed before policy effective date are excluded for the first 12 months of coverage.', 1, 'SYSTEM'),
    (2, 'EXCLUSION', 'EXC-002', 'Treatment of congenital conditions and birth defects are excluded unless specifically covered by rider.', 1, 'SYSTEM'),
    (3, 'EXCLUSION', 'EXC-003', 'Cosmetic surgery, plastic surgery and aesthetic procedures are excluded unless medically necessary.', 1, 'SYSTEM'),
    (4, 'EXCLUSION', 'EXC-004', 'Dental treatment and oral surgery are excluded unless arising from accident.', 1, 'SYSTEM'),
    (5, 'EXCLUSION', 'EXC-005', 'HIV/AIDS and sexually transmitted diseases are excluded from coverage.', 1, 'SYSTEM'),
    (6, 'EXCLUSION', 'EXC-006', 'Treatment resulting from illegal activities, drug abuse, or alcohol abuse is excluded.', 1, 'SYSTEM'),
    (7, 'EXCLUSION', 'EXC-007', 'War, terrorism, and nuclear contamination related injuries are excluded.', 1, 'SYSTEM'),
    (8, 'EXCLUSION', 'EXC-008', 'Experimental or investigational treatment not approved by relevant authorities is excluded.', 1, 'SYSTEM'),
    
    -- Waiting Periods
    (9, 'WAITING_PERIOD', 'WAIT-001', 'General waiting period: 30 days from policy effective date for illness-related claims.', 1, 'SYSTEM'),
    (10, 'WAITING_PERIOD', 'WAIT-002', 'Specified illness waiting period: 120 days for specified illnesses including cancer, kidney failure, heart attack, stroke.', 1, 'SYSTEM'),
    (11, 'WAITING_PERIOD', 'WAIT-003', 'Maternity waiting period: 12 months from policy effective date for normal delivery and caesarean section.', 1, 'SYSTEM'),
    
    -- Coverage Terms
    (12, 'COVERAGE', 'COV-001', 'Inpatient hospitalization room and board coverage up to policy limit per disability.', 1, 'SYSTEM'),
    (13, 'COVERAGE', 'COV-002', 'Intensive Care Unit (ICU) charges covered up to policy limit per disability.', 1, 'SYSTEM'),
    (14, 'COVERAGE', 'COV-003', 'Surgical procedures covered including surgeon fees, anesthetist fees, and operating theatre charges.', 1, 'SYSTEM'),
    (15, 'COVERAGE', 'COV-004', 'Daycare procedures covered for treatments not requiring overnight hospitalization.', 1, 'SYSTEM'),
    (16, 'COVERAGE', 'COV-005', 'Emergency outpatient accident treatment covered within 24 hours of accident.', 1, 'SYSTEM'),
    (17, 'COVERAGE', 'COV-006', 'Ambulance services covered for emergency transportation to nearest hospital.', 1, 'SYSTEM'),
    (18, 'COVERAGE', 'COV-007', 'Pre-hospitalization outpatient treatment covered 60 days before admission.', 1, 'SYSTEM'),
    (19, 'COVERAGE', 'COV-008', 'Post-hospitalization outpatient treatment covered 90 days after discharge.', 1, 'SYSTEM'),
    
    -- Benefit Limits
    (20, 'LIMIT', 'LIM-001', 'Annual overall limit applies per policy year for all covered benefits.', 1, 'SYSTEM'),
    (21, 'LIMIT', 'LIM-002', 'Lifetime overall limit applies for the entire duration of policy coverage.', 1, 'SYSTEM'),
    (22, 'LIMIT', 'LIM-003', 'Sub-limits apply to specific benefits as stated in the policy schedule.', 1, 'SYSTEM'),
    (23, 'LIMIT', 'LIM-004', 'Room and board limit applies per day of hospitalization as per policy schedule.', 1, 'SYSTEM'),
    
    -- Claim Procedures
    (24, 'CLAIM_PROC', 'CLM-001', 'All claims must be submitted within 30 days from date of discharge or completion of treatment.', 1, 'SYSTEM'),
    (25, 'CLAIM_PROC', 'CLM-002', 'Original receipts, medical reports and supporting documents must be submitted for claim processing.', 1, 'SYSTEM'),
    (26, 'CLAIM_PROC', 'CLM-003', 'Pre-authorization required for all planned hospitalization and surgical procedures.', 1, 'SYSTEM'),
    (27, 'CLAIM_PROC', 'CLM-004', 'Emergency admission must be notified to insurer within 24 hours of admission.', 1, 'SYSTEM'),
    
    -- Co-Payment Terms
    (28, 'COPAY', 'CPAY-001', 'Co-payment applies to all claims as stated in policy schedule.', 1, 'SYSTEM'),
    (29, 'COPAY', 'CPAY-002', 'Deductible amount applies per disability before benefit payable.', 1, 'SYSTEM'),
    
    -- Renewal Terms
    (30, 'RENEWAL', 'REN-001', 'Policy is renewable annually subject to payment of premium and insurer acceptance.', 1, 'SYSTEM'),
    (31, 'RENEWAL', 'REN-002', 'Premium rates may be revised upon renewal based on age, claims experience and medical inflation.', 1, 'SYSTEM'),
    
    -- Cancellation Terms
    (32, 'CANCELLATION', 'CANC-001', 'Policy may be cancelled by policyholder with 30 days written notice.', 1, 'SYSTEM'),
    (33, 'CANCELLATION', 'CANC-002', 'Insurer may cancel policy for non-payment of premium or misrepresentation of material facts.', 1, 'SYSTEM'),
    
    -- General Conditions
    (34, 'GENERAL', 'GEN-001', 'Policyholder must disclose all material facts and pre-existing conditions at time of application.', 1, 'SYSTEM'),
    (35, 'GENERAL', 'GEN-002', 'Treatment must be medically necessary as determined by qualified medical practitioner.', 1, 'SYSTEM'),
    (36, 'GENERAL', 'GEN-003', 'Coverage is valid worldwide unless specifically excluded in policy schedule.', 1, 'SYSTEM'),
    (37, 'GENERAL', 'GEN-004', 'Policy terms and conditions are governed by Malaysian laws and regulations.', 1, 'SYSTEM');

SET IDENTITY_INSERT ccms_m_clauses OFF;

PRINT '  ✓ Created 37 policy clauses';
GO

-- ============================================================================
-- VERIFICATION & SUMMARY
-- ============================================================================

PRINT '';
PRINT '========================================';
PRINT 'Clauses Data Seeding Summary:';
PRINT '========================================';

SELECT 
    clause_category AS Category,
    COUNT(*) AS ClauseCount
FROM ccms_m_clauses
WHERE is_active = 1
GROUP BY clause_category
ORDER BY clause_category;

PRINT '';
PRINT 'Total Active Clauses:';
SELECT COUNT(*) AS TotalClauses FROM ccms_m_clauses WHERE is_active = 1;

PRINT '';
PRINT '========================================';
PRINT '✓ Clauses Data Seeding Completed Successfully!';
PRINT '========================================';
GO
