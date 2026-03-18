-- ============================================================================
-- CCMS Lookup Data Seeding Script
-- Purpose: Populate lookup categories and lookup values for dropdown fields
-- Created: March 3, 2026
-- ============================================================================

USE db_ccms;
GO

PRINT '========================================';
PRINT 'Starting Lookup Data Seeding...';
PRINT '========================================';
PRINT '';

-- ============================================================================
-- SECTION 1: LOOKUP CATEGORIES
-- ============================================================================

PRINT 'Creating Lookup Categories...';

-- Clear existing data (for re-running script)
DELETE FROM ccms_m_lookup_metadata;
DELETE FROM ccms_m_lookups;
DELETE FROM ccms_m_lookup_categories;

-- Insert Lookup Categories
INSERT INTO ccms_m_lookup_categories (category_name, description, is_active)
VALUES 
    ('RELATIONSHIPS', 'Family relationship types for dependents', 1),
    ('MEMBER_STATUS', 'Member account status types', 1),
    ('MEMBER_TYPE', 'Member classification types', 1),
    ('GENDER', 'Gender classifications', 1),
    ('CLAIM_STATUS', 'Claim processing status types', 1),
    ('CLAIM_TYPE', 'Type of claim (Inpatient, Outpatient, etc.)', 1),
    ('ADMISSION_TYPE', 'Type of hospital admission', 1),
    ('ADDRESS_TYPE', 'Address classification types', 1),
    ('CONTACT_TYPE', 'Contact method types', 1),
    ('POLICY_STATUS', 'Policy status types', 1),
    ('DIAGNOSIS_CATEGORY', 'Medical diagnosis categories', 1),
    ('TREATMENT_TYPE', 'Type of medical treatment', 1),
    ('PAYMENT_METHOD', 'Payment methods', 1),
    ('DOCUMENT_TYPE', 'Types of documents', 1),
    ('REJECTION_REASON', 'Claim rejection reason codes', 1),
    ('COUNTRY', 'Country list', 1),
    ('STATE_REGION', 'States and regions', 1),
    ('PRODUCT_TYPE', 'Insurance product types', 1),
    ('BILL_TYPE', 'Hospital billing types', 1),
    ('WARD_CLASS', 'Hospital ward classifications', 1),
    ('HOSPITAL_TYPE', 'Hospital classification types', 1),
    ('ACCREDITATION_STATUS', 'Hospital accreditation status types', 1),
    ('HOSPITAL_CODE_TYPE', 'Hospital code types', 1),
    ('HOSPITAL_STAFF_TYPE', 'Hospital staff position types', 1),
    ('HOSPITAL_CONTACT_TYPE', 'Hospital contact method types', 1),
    ('HOSPITAL_FEE_TYPE', 'Hospital fee types', 1),
    ('PRODUCT_LIMIT_TYPE', 'Product/Policy limit types', 1),
    ('COPAY_TYPE', 'Copayment types', 1),
    ('COPAY_APPLIES_TO', 'Copayment application scope', 1),
    ('ROOM_TYPE', 'Types of hospital room accommodation', 1),
    ('EHM_STATUS', 'Enhanced Healthcare Management status tracking', 1),
    ('DEFERMENT_STATUS', 'Deferment processing status', 1),
    ('ALERT_LEVEL', 'LOS Alert Levels', 1),
    ('MQ_CATEGORY', 'Categories for Medical Questionnaire Templates', 1);

PRINT '  ✓ Created 34 lookup categories';
GO

-- ============================================================================
-- SECTION 2: RELATIONSHIPS
-- ============================================================================

PRINT 'Populating RELATIONSHIPS lookups...';

DECLARE @RelationshipCategoryId INT;
SELECT @RelationshipCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'RELATIONSHIPS';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@RelationshipCategoryId, 'SPOUSE', 'Spouse', 1, 1),
    (@RelationshipCategoryId, 'CHILD', 'Child', 2, 1),
    (@RelationshipCategoryId, 'SON', 'Son', 3, 1),
    (@RelationshipCategoryId, 'DAUGHTER', 'Daughter', 4, 1),
    (@RelationshipCategoryId, 'PARENT', 'Parent', 5, 1),
    (@RelationshipCategoryId, 'FATHER', 'Father', 6, 1),
    (@RelationshipCategoryId, 'MOTHER', 'Mother', 7, 1),
    (@RelationshipCategoryId, 'SIBLING', 'Sibling', 8, 1),
    (@RelationshipCategoryId, 'BROTHER', 'Brother', 9, 1),
    (@RelationshipCategoryId, 'SISTER', 'Sister', 10, 1),
    (@RelationshipCategoryId, 'GRANDPARENT', 'Grandparent', 11, 1),
    (@RelationshipCategoryId, 'GRANDCHILD', 'Grandchild', 12, 1),
    (@RelationshipCategoryId, 'GUARDIAN', 'Legal Guardian', 13, 1),
    (@RelationshipCategoryId, 'OTHER', 'Other', 99, 1);

PRINT '  ✓ Created 14 relationship types';
GO

-- ============================================================================
-- SECTION 3: MEMBER STATUS
-- ============================================================================

PRINT 'Populating MEMBER_STATUS lookups...';

DECLARE @MemberStatusCategoryId INT;
SELECT @MemberStatusCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'MEMBER_STATUS';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@MemberStatusCategoryId, 'ACTIVE', 'Active', 1, 1),
    (@MemberStatusCategoryId, 'INACTIVE', 'Inactive', 2, 1),
    (@MemberStatusCategoryId, 'SUSPENDED', 'Suspended', 3, 1),
    (@MemberStatusCategoryId, 'PENDING', 'Pending Activation', 4, 1),
    (@MemberStatusCategoryId, 'TERMINATED', 'Terminated', 5, 1),
    (@MemberStatusCategoryId, 'DECEASED', 'Deceased', 6, 1);

PRINT '  ✓ Created 6 member status types';
GO

-- ============================================================================
-- SECTION 4: MEMBER TYPE
-- ============================================================================

PRINT 'Populating MEMBER_TYPE lookups...';

DECLARE @MemberTypeCategoryId INT;
SELECT @MemberTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'MEMBER_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@MemberTypeCategoryId, 'PRINCIPAL', 'Principal Member', 1, 1),
    (@MemberTypeCategoryId, 'EMPLOYEE', 'Employee', 2, 1),
    (@MemberTypeCategoryId, 'DEPENDENT', 'Dependent', 3, 1),
    (@MemberTypeCategoryId, 'SPOUSE_ONLY', 'Spouse Only', 4, 1),
    (@MemberTypeCategoryId, 'FAMILY', 'Employee and Family', 5, 1),
    (@MemberTypeCategoryId, 'INDIVIDUAL', 'Individual', 6, 1);

PRINT '  ✓ Created 6 member types';
GO

-- ============================================================================
-- SECTION 5: GENDER
-- ============================================================================

PRINT 'Populating GENDER lookups...';

DECLARE @GenderCategoryId INT;
SELECT @GenderCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'GENDER';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@GenderCategoryId, 'M', 'Male', 1, 1),
    (@GenderCategoryId, 'F', 'Female', 2, 1),
    (@GenderCategoryId, 'U', 'Unspecified', 3, 1);

PRINT '  ✓ Created 3 gender types';
GO

-- ============================================================================
-- SECTION 6: CLAIM STATUS
-- ============================================================================

PRINT 'Populating CLAIM_STATUS lookups...';

DECLARE @ClaimStatusCategoryId INT;
SELECT @ClaimStatusCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'CLAIM_STATUS';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@ClaimStatusCategoryId, 'DRAFT', 'Draft', 1, 1),
    (@ClaimStatusCategoryId, 'SUBMITTED', 'Submitted', 2, 1),
    (@ClaimStatusCategoryId, 'PENDING_REVIEW', 'Pending Review', 3, 1),
    (@ClaimStatusCategoryId, 'UNDER_REVIEW', 'Under Review', 4, 1),
    (@ClaimStatusCategoryId, 'APPROVED', 'Approved', 5, 1),
    (@ClaimStatusCategoryId, 'PARTIALLY_APPROVED', 'Partially Approved', 6, 1),
    (@ClaimStatusCategoryId, 'REJECTED', 'Rejected', 7, 1),
    (@ClaimStatusCategoryId, 'PAID', 'Paid', 8, 1),
    (@ClaimStatusCategoryId, 'CLOSED', 'Closed', 9, 1),
    (@ClaimStatusCategoryId, 'CANCELLED', 'Cancelled', 10, 1),
    (@ClaimStatusCategoryId, 'PENDING_INFO', 'Pending Additional Information', 11, 1);

PRINT '  ✓ Created 11 claim status types';
GO

-- ============================================================================
-- SECTION 7: CLAIM TYPE
-- ============================================================================

PRINT 'Populating CLAIM_TYPE lookups...';

DECLARE @ClaimTypeCategoryId INT;
SELECT @ClaimTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'CLAIM_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@ClaimTypeCategoryId, 'INPATIENT', 'Inpatient', 1, 1),
    (@ClaimTypeCategoryId, 'OUTPATIENT', 'Outpatient', 2, 1),
    (@ClaimTypeCategoryId, 'DAYCARE', 'Day Care', 3, 1),
    (@ClaimTypeCategoryId, 'EMERGENCY', 'Emergency', 4, 1),
    (@ClaimTypeCategoryId, 'MATERNITY', 'Maternity', 5, 1),
    (@ClaimTypeCategoryId, 'DENTAL', 'Dental', 6, 1),
    (@ClaimTypeCategoryId, 'OPTICAL', 'Optical', 7, 1),
    (@ClaimTypeCategoryId, 'REIMBURSEMENT', 'Reimbursement', 8, 1);

PRINT '  ✓ Created 8 claim types';
GO

-- ============================================================================
-- SECTION 8: ADMISSION TYPE
-- ============================================================================

PRINT 'Populating ADMISSION_TYPE lookups...';

DECLARE @AdmissionTypeCategoryId INT;
SELECT @AdmissionTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'ADMISSION_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@AdmissionTypeCategoryId, 'EMERGENCY', 'Emergency Admission', 1, 1),
    (@AdmissionTypeCategoryId, 'ELECTIVE', 'Elective Admission', 2, 1),
    (@AdmissionTypeCategoryId, 'DAYCASE', 'Day Case', 3, 1),
    (@AdmissionTypeCategoryId, 'MATERNITY', 'Maternity', 4, 1),
    (@AdmissionTypeCategoryId, 'PLANNED', 'Planned Surgery', 5, 1),
    (@AdmissionTypeCategoryId, 'OBSERVATION', 'Observation', 6, 1);

PRINT '  ✓ Created 6 admission types';
GO

-- ============================================================================
-- SECTION 9: ADDRESS TYPE
-- ============================================================================

PRINT 'Populating ADDRESS_TYPE lookups...';

DECLARE @AddressTypeCategoryId INT;
SELECT @AddressTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'ADDRESS_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@AddressTypeCategoryId, 'PRIMARY', 'Primary Address', 1, 1),
    (@AddressTypeCategoryId, 'BILLING', 'Billing Address', 2, 1),
    (@AddressTypeCategoryId, 'SHIPPING', 'Shipping Address', 3, 1),
    (@AddressTypeCategoryId, 'MAILING', 'Mailing Address', 4, 1),
    (@AddressTypeCategoryId, 'WORK', 'Work Address', 5, 1),
    (@AddressTypeCategoryId, 'OTHER', 'Other', 99, 1);

PRINT '  ✓ Created 6 address types';
GO

-- ============================================================================
-- SECTION 10: CONTACT TYPE
-- ============================================================================

PRINT 'Populating CONTACT_TYPE lookups...';

DECLARE @ContactTypeCategoryId INT;
SELECT @ContactTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'CONTACT_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@ContactTypeCategoryId, 'EMAIL', 'Email', 1, 1),
    (@ContactTypeCategoryId, 'PHONE', 'Phone', 2, 1),
    (@ContactTypeCategoryId, 'MOBILE', 'Mobile', 3, 1),
    (@ContactTypeCategoryId, 'FAX', 'Fax', 4, 1),
    (@ContactTypeCategoryId, 'WHATSAPP', 'WhatsApp', 5, 1),
    (@ContactTypeCategoryId, 'OTHER', 'Other', 99, 1);

PRINT '  ✓ Created 6 contact types';
GO

-- ============================================================================
-- SECTION 11: POLICY STATUS
-- ============================================================================

PRINT 'Populating POLICY_STATUS lookups...';

DECLARE @PolicyStatusCategoryId INT;
SELECT @PolicyStatusCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'POLICY_STATUS';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@PolicyStatusCategoryId, 'ACTIVE', 'Active', 1, 1),
    (@PolicyStatusCategoryId, 'INFORCE', 'In Force', 2, 1),
    (@PolicyStatusCategoryId, 'INACTIVE', 'Inactive', 3, 1),
    (@PolicyStatusCategoryId, 'SUSPENDED', 'Suspended', 4, 1),
    (@PolicyStatusCategoryId, 'CANCELLED', 'Cancelled', 5, 1),
    (@PolicyStatusCategoryId, 'EXPIRED', 'Expired', 6, 1),
    (@PolicyStatusCategoryId, 'PENDING', 'Pending', 7, 1),
    (@PolicyStatusCategoryId, 'TRANSFERRED', 'Transferred', 8, 1),
    (@PolicyStatusCategoryId, 'LAPSED', 'Lapsed', 9, 1);

PRINT '  ✓ Created 9 policy status types';
GO

-- ============================================================================
-- SECTION 12: PAYMENT METHOD
-- ============================================================================

PRINT 'Populating PAYMENT_METHOD lookups...';

DECLARE @PaymentMethodCategoryId INT;
SELECT @PaymentMethodCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'PAYMENT_METHOD';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@PaymentMethodCategoryId, 'BANK_TRANSFER', 'Bank Transfer', 1, 1),
    (@PaymentMethodCategoryId, 'CHEQUE', 'Cheque', 2, 1),
    (@PaymentMethodCategoryId, 'CASH', 'Cash', 3, 1),
    (@PaymentMethodCategoryId, 'CREDIT_CARD', 'Credit Card', 4, 1),
    (@PaymentMethodCategoryId, 'DEBIT_CARD', 'Debit Card', 5, 1),
    (@PaymentMethodCategoryId, 'ONLINE_BANKING', 'Online Banking', 6, 1),
    (@PaymentMethodCategoryId, 'EWALLET', 'E-Wallet', 7, 1);

PRINT '  ✓ Created 7 payment methods';
GO

-- ============================================================================
-- SECTION 13: DOCUMENT TYPE
-- ============================================================================

PRINT 'Populating DOCUMENT_TYPE lookups...';

DECLARE @DocumentTypeCategoryId INT;
SELECT @DocumentTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'DOCUMENT_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@DocumentTypeCategoryId, 'NRIC', 'National ID Card (NRIC)', 1, 1),
    (@DocumentTypeCategoryId, 'PASSPORT', 'Passport', 2, 1),
    (@DocumentTypeCategoryId, 'BIRTH_CERT', 'Birth Certificate', 3, 1),
    (@DocumentTypeCategoryId, 'MEDICAL_REPORT', 'Medical Report', 4, 1),
    (@DocumentTypeCategoryId, 'INVOICE', 'Invoice/Receipt', 5, 1),
    (@DocumentTypeCategoryId, 'DISCHARGE_SUMMARY', 'Discharge Summary', 6, 1),
    (@DocumentTypeCategoryId, 'LAB_REPORT', 'Laboratory Report', 7, 1),
    (@DocumentTypeCategoryId, 'PRESCRIPTION', 'Prescription', 8, 1),
    (@DocumentTypeCategoryId, 'POLICE_REPORT', 'Police Report', 9, 1),
    (@DocumentTypeCategoryId, 'AUTHORIZATION', 'Authorization Letter', 10, 1),
    (@DocumentTypeCategoryId, 'OTHER', 'Other', 99, 1);

PRINT '  ✓ Created 11 document types';
GO

-- ============================================================================
-- SECTION 14: STATE/REGION (Malaysia)
-- ============================================================================

PRINT 'Populating STATE_REGION lookups...';

DECLARE @StateRegionCategoryId INT;
SELECT @StateRegionCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'STATE_REGION';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@StateRegionCategoryId, 'JHR', 'Johor', 1, 1),
    (@StateRegionCategoryId, 'KDH', 'Kedah', 2, 1),
    (@StateRegionCategoryId, 'KTN', 'Kelantan', 3, 1),
    (@StateRegionCategoryId, 'KUL', 'Kuala Lumpur', 4, 1),
    (@StateRegionCategoryId, 'LBN', 'Labuan', 5, 1),
    (@StateRegionCategoryId, 'MLK', 'Melaka', 6, 1),
    (@StateRegionCategoryId, 'NSN', 'Negeri Sembilan', 7, 1),
    (@StateRegionCategoryId, 'PHG', 'Pahang', 8, 1),
    (@StateRegionCategoryId, 'PNG', 'Penang', 9, 1),
    (@StateRegionCategoryId, 'PRK', 'Perak', 10, 1),
    (@StateRegionCategoryId, 'PLS', 'Perlis', 11, 1),
    (@StateRegionCategoryId, 'PJY', 'Putrajaya', 12, 1),
    (@StateRegionCategoryId, 'SBH', 'Sabah', 13, 1),
    (@StateRegionCategoryId, 'SWK', 'Sarawak', 14, 1),
    (@StateRegionCategoryId, 'SGR', 'Selangor', 15, 1),
    (@StateRegionCategoryId, 'TRG', 'Terengganu', 16, 1);

PRINT '  ✓ Created 16 Malaysian states/regions';
GO

-- ============================================================================
-- SECTION 15: WARD CLASS
-- ============================================================================

PRINT 'Populating WARD_CLASS lookups...';

DECLARE @WardClassCategoryId INT;
SELECT @WardClassCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'WARD_CLASS';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@WardClassCategoryId, 'WARD1', 'First Class Ward', 1, 1),
    (@WardClassCategoryId, 'WARD2', 'Second Class Ward', 2, 1),
    (@WardClassCategoryId, 'WARD3', 'Third Class Ward', 3, 1),
    (@WardClassCategoryId, 'ICU', 'Intensive Care Unit (ICU)', 4, 1),
    (@WardClassCategoryId, 'NICU', 'Neonatal ICU (NICU)', 5, 1),
    (@WardClassCategoryId, 'HDU', 'High Dependency Unit (HDU)', 6, 1),
    (@WardClassCategoryId, 'MATERNITY', 'Maternity Ward', 7, 1),
    (@WardClassCategoryId, 'DAYCARE', 'Day Care', 8, 1);

PRINT '  ✓ Created 8 ward classes';
GO

-- ============================================================================
-- SECTION 16: HOSPITAL TYPE
-- ============================================================================

PRINT 'Populating HOSPITAL_TYPE lookups...';

DECLARE @HospitalTypeCategoryId INT;
SELECT @HospitalTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'HOSPITAL_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@HospitalTypeCategoryId, 'GOVERNMENT', 'Government', 1, 1),
    (@HospitalTypeCategoryId, 'PRIVATE', 'Private', 2, 1),
    (@HospitalTypeCategoryId, 'UNIVERSITY', 'University', 3, 1);

PRINT '  ✓ Created 3 hospital types';
GO

-- ============================================================================
-- SECTION 17: ACCREDITATION STATUS
-- ============================================================================

PRINT 'Populating ACCREDITATION_STATUS lookups...';

DECLARE @AccreditationStatusCategoryId INT;
SELECT @AccreditationStatusCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'ACCREDITATION_STATUS';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@AccreditationStatusCategoryId, 'JCI', 'JCI Accredited', 1, 1),
    (@AccreditationStatusCategoryId, 'MSQH', 'MSQH Accredited', 2, 1),
    (@AccreditationStatusCategoryId, 'NONE', 'Not Accredited', 3, 1);

PRINT '  ✓ Created 3 accreditation status types';
GO

-- ============================================================================
-- SECTION 18: HOSPITAL CODE TYPE
-- ============================================================================

PRINT 'Populating HOSPITAL_CODE_TYPE lookups...';

DECLARE @HospitalCodeTypeCategoryId INT;
SELECT @HospitalCodeTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'HOSPITAL_CODE_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@HospitalCodeTypeCategoryId, 'ZURICH_HOSP_CODE', 'Zurich Hospital Code', 1, 1),
    (@HospitalCodeTypeCategoryId, 'FWD_HOSP_CODE', 'FWD Hospital Code', 2, 1),
    (@HospitalCodeTypeCategoryId, 'INSURER_CODE', 'Insurer Code', 3, 1),
    (@HospitalCodeTypeCategoryId, 'OTHER', 'Other', 99, 1);

PRINT '  ✓ Created 4 hospital code types';
GO

-- ============================================================================
-- SECTION 19: HOSPITAL STAFF TYPE
-- ============================================================================

PRINT 'Populating HOSPITAL_STAFF_TYPE lookups...';

DECLARE @HospitalStaffTypeCategoryId INT;
SELECT @HospitalStaffTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'HOSPITAL_STAFF_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@HospitalStaffTypeCategoryId, 'DOCTOR', 'Doctor', 1, 1),
    (@HospitalStaffTypeCategoryId, 'NURSE', 'Nurse', 2, 1),
    (@HospitalStaffTypeCategoryId, 'ADMIN', 'Administrative Staff', 3, 1),
    (@HospitalStaffTypeCategoryId, 'TECHNICIAN', 'Technician', 4, 1),
    (@HospitalStaffTypeCategoryId, 'OTHER', 'Other', 99, 1);

PRINT '  ✓ Created 5 hospital staff types';
GO

-- ============================================================================
-- SECTION 20: HOSPITAL CONTACT TYPE
-- ============================================================================

PRINT 'Populating HOSPITAL_CONTACT_TYPE lookups...';

DECLARE @HospitalContactTypeCategoryId INT;
SELECT @HospitalContactTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'HOSPITAL_CONTACT_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@HospitalContactTypeCategoryId, 'EMAIL', 'Email', 1, 1),
    (@HospitalContactTypeCategoryId, 'MOBILE', 'Mobile', 2, 1),
    (@HospitalContactTypeCategoryId, 'PHONE', 'Phone', 3, 1),
    (@HospitalContactTypeCategoryId, 'EXT', 'Extension', 4, 1);

PRINT '  ✓ Created 4 hospital contact types';
GO

-- ============================================================================
-- SECTION 21: HOSPITAL FEE TYPE
-- ============================================================================

PRINT 'Populating HOSPITAL_FEE_TYPE lookups...';

DECLARE @HospitalFeeTypeCategoryId INT;
SELECT @HospitalFeeTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'HOSPITAL_FEE_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@HospitalFeeTypeCategoryId, 'TPA', 'TPA Fee', 1, 1),
    (@HospitalFeeTypeCategoryId, 'WAKALAH', 'Wakalah Fee', 2, 1),
    (@HospitalFeeTypeCategoryId, 'MMA', 'MMA Fee', 3, 1),
    (@HospitalFeeTypeCategoryId, 'CONSULTATION', 'Consultation Fee', 4, 1),
    (@HospitalFeeTypeCategoryId, 'PROCEDURE', 'Procedure Fee', 5, 1),
    (@HospitalFeeTypeCategoryId, 'OTHER', 'Other', 99, 1);

PRINT '  ✓ Created 6 hospital fee types';
GO

-- ============================================================================
-- SECTION 22: PRODUCT LIMIT TYPE
-- ============================================================================

PRINT 'Populating PRODUCT_LIMIT_TYPE lookups...';

DECLARE @ProductLimitTypeCategoryId INT;
SELECT @ProductLimitTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'PRODUCT_LIMIT_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@ProductLimitTypeCategoryId, 'ANNUAL', 'Annual Limit', 1, 1),
    (@ProductLimitTypeCategoryId, 'LIFETIME', 'Lifetime Limit', 2, 1),
    (@ProductLimitTypeCategoryId, 'ROOM_BOARD', 'Room & Board Limit', 3, 1),
    (@ProductLimitTypeCategoryId, 'SURGICAL', 'Surgical Limit', 4, 1),
    (@ProductLimitTypeCategoryId, 'OUTPATIENT', 'Outpatient Limit', 5, 1),
    (@ProductLimitTypeCategoryId, 'INPATIENT', 'Inpatient Limit', 6, 1),
    (@ProductLimitTypeCategoryId, 'OTHER', 'Other Limit', 99, 1);

PRINT '  ✓ Created 7 product limit types';
GO

-- ============================================================================
-- SECTION 23: COPAY TYPE
-- ============================================================================

PRINT 'Populating COPAY_TYPE lookups...';

DECLARE @CopayTypeCategoryId INT;
SELECT @CopayTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'COPAY_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@CopayTypeCategoryId, 'PERCENTAGE', 'Percentage (%)', 1, 1),
    (@CopayTypeCategoryId, 'FIXED', 'Fixed Amount', 2, 1);

PRINT '  ✓ Created 2 copay types';
GO

-- ============================================================================
-- SECTION 24: COPAY APPLIES TO
-- ============================================================================

PRINT 'Populating COPAY_APPLIES_TO lookups...';

DECLARE @CopayAppliesToCategoryId INT;
SELECT @CopayAppliesToCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'COPAY_APPLIES_TO';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@CopayAppliesToCategoryId, 'ALL', 'All Services', 1, 1),
    (@CopayAppliesToCategoryId, 'OUTPATIENT', 'Outpatient', 2, 1),
    (@CopayAppliesToCategoryId, 'INPATIENT', 'Inpatient', 3, 1),
    (@CopayAppliesToCategoryId, 'CONSULTATION', 'Consultation', 4, 1),
    (@CopayAppliesToCategoryId, 'PROCEDURE', 'Procedure', 5, 1),
    (@CopayAppliesToCategoryId, 'MEDICATION', 'Medication', 6, 1),
    (@CopayAppliesToCategoryId, 'DIAGNOSTIC', 'Diagnostic Tests', 7, 1),
    (@CopayAppliesToCategoryId, 'OTHER', 'Other', 99, 1);

PRINT '  ✓ Created 8 copay applies to types';
GO

-- ============================================================================
-- SECTION 25: DIAGNOSIS CATEGORY
-- ============================================================================

PRINT 'Populating DIAGNOSIS_CATEGORY lookups...';

DECLARE @DiagnosisCategoryId INT;
SELECT @DiagnosisCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'DIAGNOSIS_CATEGORY';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@DiagnosisCategoryId, 'INFECTIOUS', 'Infectious and Parasitic Diseases', 1, 1),
    (@DiagnosisCategoryId, 'NEOPLASMS', 'Neoplasms', 2, 1),
    (@DiagnosisCategoryId, 'BLOOD', 'Diseases of the Blood', 3, 1),
    (@DiagnosisCategoryId, 'ENDOCRINE', 'Endocrine, Nutritional and Metabolic Diseases', 4, 1),
    (@DiagnosisCategoryId, 'MENTAL', 'Mental and Behavioural Disorders', 5, 1),
    (@DiagnosisCategoryId, 'NERVOUS', 'Diseases of the Nervous System', 6, 1),
    (@DiagnosisCategoryId, 'EYE', 'Diseases of the Eye and Adnexa', 7, 1),
    (@DiagnosisCategoryId, 'EAR', 'Diseases of the Ear and Mastoid Process', 8, 1),
    (@DiagnosisCategoryId, 'CIRCULATORY', 'Diseases of the Circulatory System', 9, 1),
    (@DiagnosisCategoryId, 'RESPIRATORY', 'Diseases of the Respiratory System', 10, 1),
    (@DiagnosisCategoryId, 'DIGESTIVE', 'Diseases of the Digestive System', 11, 1),
    (@DiagnosisCategoryId, 'SKIN', 'Diseases of the Skin and Subcutaneous Tissue', 12, 1),
    (@DiagnosisCategoryId, 'MUSCULOSKELETAL', 'Diseases of the Musculoskeletal System', 13, 1),
    (@DiagnosisCategoryId, 'GENITOURINARY', 'Diseases of the Genitourinary System', 14, 1),
    (@DiagnosisCategoryId, 'MATERNITY', 'Pregnancy, Childbirth and the Puerperium', 15, 1),
    (@DiagnosisCategoryId, 'CONGENITAL', 'Congenital Malformations', 16, 1),
    (@DiagnosisCategoryId, 'SYMPTOMS', 'Symptoms, Signs and Abnormal Findings', 17, 1),
    (@DiagnosisCategoryId, 'INJURY', 'Injury, Poisoning and Certain Other Consequences', 18, 1),
    (@DiagnosisCategoryId, 'EXTERNAL', 'External Causes of Morbidity and Mortality', 19, 1),
    (@DiagnosisCategoryId, 'HEALTH_STATUS', 'Factors Influencing Health Status', 20, 1);

PRINT '  ✓ Created 20 diagnosis categories';
GO

-- ============================================================================
-- SECTION 26: ROOM TYPE
-- ============================================================================

PRINT 'Populating ROOM_TYPE lookups...';

DECLARE @RoomTypeCategoryId INT;
SELECT @RoomTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'ROOM_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@RoomTypeCategoryId, 'STANDARD_WARD', 'Standard Ward (4+ beds)', 1, 1),
    (@RoomTypeCategoryId, 'TWIN_SHARING', 'Twin Sharing (2 beds)', 2, 1),
    (@RoomTypeCategoryId, 'SINGLE_ROOM', 'Single Room (1 bed)', 3, 1),
    (@RoomTypeCategoryId, 'DELUXE_ROOM', 'Deluxe Room', 4, 1),
    (@RoomTypeCategoryId, 'ICU', 'Intensive Care Unit (ICU)', 5, 1),
    (@RoomTypeCategoryId, 'SUITE', 'Suite', 6, 1);

PRINT '  ✓ Created 6 room types';
GO

-- ============================================================================
-- SECTION 27: EHM STATUS
-- ============================================================================

PRINT 'Populating EHM_STATUS lookups...';

DECLARE @EhmStatusCategoryId INT;
SELECT @EhmStatusCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'EHM_STATUS';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@EhmStatusCategoryId, 'NOT_APPLICABLE', 'Not Applicable', 1, 1),
    (@EhmStatusCategoryId, 'PENDING', 'Pending EHM Review', 2, 1),
    (@EhmStatusCategoryId, 'IN_PROGRESS', 'EHM In Progress', 3, 1),
    (@EhmStatusCategoryId, 'COMPLETED', 'EHM Completed', 4, 1),
    (@EhmStatusCategoryId, 'ESCALATED', 'Escalated to Medical Review', 5, 1);

PRINT '  ✓ Created 5 EHM statuses';
GO

-- ============================================================================
-- SECTION 28: DEFERMENT STATUS
-- ============================================================================

PRINT 'Populating DEFERMENT_STATUS lookups...';

DECLARE @DefermentStatusCategoryId INT;
SELECT @DefermentStatusCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'DEFERMENT_STATUS';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@DefermentStatusCategoryId, 'NOT_DEFERRED', 'Not Deferred', 1, 1),
    (@DefermentStatusCategoryId, 'PENDING_DEFERMENT', 'Pending Deferment', 2, 1),
    (@DefermentStatusCategoryId, 'DEFERRED', 'Deferred', 3, 1),
    (@DefermentStatusCategoryId, 'DEFERMENT_RESOLVED', 'Deferment Resolved', 4, 1),
    (@DefermentStatusCategoryId, 'DEFERMENT_CANCELLED', 'Deferment Cancelled', 5, 1);

PRINT '  ✓ Created 5 deferment statuses';
GO

-- ============================================================================
-- SECTION 29: ALERT LEVEL
-- ============================================================================

PRINT 'Populating ALERT_LEVEL lookups...';

DECLARE @AlertLevelCategoryId INT;
SELECT @AlertLevelCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'ALERT_LEVEL';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@AlertLevelCategoryId, '1', 'Level 1 - Warning', 1, 1),
    (@AlertLevelCategoryId, '2', 'Level 2 - Critical', 2, 1),
    (@AlertLevelCategoryId, '3', 'Level 3 - Extremely Critical', 3, 1);

PRINT '  ✓ Created 3 alert levels';
GO

-- ============================================================================
-- SECTION 30: TREATMENT TYPE
-- ============================================================================

PRINT 'Populating TREATMENT_TYPE lookups...';

DECLARE @TreatmentTypeCategoryId INT;
SELECT @TreatmentTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'TREATMENT_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@TreatmentTypeCategoryId, 'SURGICAL', 'Surgical', 1, 1),
    (@TreatmentTypeCategoryId, 'MEDICAL', 'Medical', 2, 1),
    (@TreatmentTypeCategoryId, 'DENTAL', 'Dental', 3, 1),
    (@TreatmentTypeCategoryId, 'PHYSIOTHERAPY', 'Physiotherapy', 4, 1),
    (@TreatmentTypeCategoryId, 'MATERNITY', 'Maternity', 5, 1),
    (@TreatmentTypeCategoryId, 'CHEMOTHERAPY', 'Chemotherapy', 6, 1),
    (@TreatmentTypeCategoryId, 'RADIOTHERAPY', 'Radiotherapy', 7, 1);

PRINT '  ✓ Created 7 treatment types';
GO

-- ============================================================================
-- SECTION 31: REJECTION REASON
-- ============================================================================

PRINT 'Populating REJECTION_REASON lookups...';

DECLARE @RejectionReasonCategoryId INT;
SELECT @RejectionReasonCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'REJECTION_REASON';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@RejectionReasonCategoryId, 'NOT_COVERED', 'Service Not Covered', 1, 1),
    (@RejectionReasonCategoryId, 'LIMIT_EXCEEDED', 'Benefit Limit Exceeded', 2, 1),
    (@RejectionReasonCategoryId, 'PRE_EXISTING', 'Pre-existing Condition', 3, 1),
    (@RejectionReasonCategoryId, 'WAITING_PERIOD', 'Waiting Period Not Served', 4, 1),
    (@RejectionReasonCategoryId, 'INVALID_DOCS', 'Invalid or Missing Documents', 5, 1),
    (@RejectionReasonCategoryId, 'LATE_SUBMISSION', 'Late Submission', 6, 1),
    (@RejectionReasonCategoryId, 'POLICY_INACTIVE', 'Policy Inactive or Cancelled', 7, 1);

PRINT '  ✓ Created 7 rejection reasons';
GO

-- ============================================================================
-- SECTION 32: COUNTRY
-- ============================================================================

PRINT 'Populating COUNTRY lookups...';

DECLARE @CountryCategoryId INT;
SELECT @CountryCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'COUNTRY';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@CountryCategoryId, 'MY', 'Malaysia', 1, 1),
    (@CountryCategoryId, 'SG', 'Singapore', 2, 1),
    (@CountryCategoryId, 'BN', 'Brunei', 3, 1),
    (@CountryCategoryId, 'ID', 'Indonesia', 4, 1),
    (@CountryCategoryId, 'TH', 'Thailand', 5, 1);

PRINT '  ✓ Created 5 countries';
GO

-- ============================================================================
-- SECTION 33: PRODUCT TYPE
-- ============================================================================

PRINT 'Populating PRODUCT_TYPE lookups...';

DECLARE @ProductTypeCategoryId INT;
SELECT @ProductTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'PRODUCT_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@ProductTypeCategoryId, 'MEDICAL', 'Medical Insurance', 1, 1),
    (@ProductTypeCategoryId, 'LIFE', 'Life Insurance', 2, 1),
    (@ProductTypeCategoryId, 'PA', 'Personal Accident', 3, 1),
    (@ProductTypeCategoryId, 'TRAVEL', 'Travel Insurance', 4, 1),
    (@ProductTypeCategoryId, 'CRITICAL_ILLNESS', 'Critical Illness', 5, 1);

PRINT '  ✓ Created 5 product types';
GO

-- ============================================================================
-- SECTION 34: BILL TYPE
-- ============================================================================

PRINT 'Populating BILL_TYPE lookups...';

DECLARE @BillTypeCategoryId INT;
SELECT @BillTypeCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'BILL_TYPE';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@BillTypeCategoryId, 'FINAL', 'Final Bill', 1, 1),
    (@BillTypeCategoryId, 'INTERIM', 'Interim Bill', 2, 1),
    (@BillTypeCategoryId, 'DEPOSIT', 'Deposit Receipt', 3, 1),
    (@BillTypeCategoryId, 'SUPPLEMENTARY', 'Supplementary Bill', 4, 1),
    (@BillTypeCategoryId, 'CREDIT_NOTE', 'Credit Note', 5, 1);

PRINT '  ✓ Created 5 bill types';
GO

-- ============================================================================
-- SECTION 35: MQ CATEGORIES
-- ============================================================================

PRINT 'Populating MQ_CATEGORY lookups...';

DECLARE @MqCategoryCategoryId INT;
SELECT @MqCategoryCategoryId = category_id FROM ccms_m_lookup_categories WHERE category_name = 'MQ_CATEGORY';

INSERT INTO ccms_m_lookups (category_id, lookup_code, lookup_value, sort_order, is_active)
VALUES 
    (@MqCategoryCategoryId, 'ADMISSION', 'Kemasukan (Admission)', 10, 1),
    (@MqCategoryCategoryId, 'BILLING', 'Pebilan (Billing)', 20, 1),
    (@MqCategoryCategoryId, 'ACCIDENT', 'Kemalangan (Accident)', 30, 1),
    (@MqCategoryCategoryId, 'DOCS', 'Dokumen (Docs)', 40, 1),
    (@MqCategoryCategoryId, 'CLINICAL', 'Klinikal (Clinical)', 50, 1);

PRINT '  ✓ Created 5 MQ categories';
GO

-- ============================================================================
-- VERIFICATION & SUMMARY
-- ============================================================================

PRINT '';
PRINT '========================================';
PRINT 'Lookup Data Seeding Summary:';
PRINT '========================================';

SELECT 
    lc.category_name,
    COUNT(l.lookup_id) AS lookup_count
FROM ccms_m_lookup_categories lc
LEFT JOIN ccms_m_lookups l ON lc.category_id = l.category_id
GROUP BY lc.category_name, lc.category_id
ORDER BY lc.category_name;

PRINT '';
PRINT '========================================';
PRINT '✓ Lookup Data Seeding Completed Successfully!';
PRINT '========================================';
PRINT '';
PRINT 'NOTE: Run the following seed scripts in order:';
PRINT '  1. seed-bank-data.sql (Bank master data)';
PRINT '  2. seed-clause-data.sql (Policy clauses/terms)';
PRINT '  3. seed-product-data.sql (Products with limits and copay)';
PRINT '  4. seed-hospital-data.sql (Hospitals with child tables)';
PRINT '  5. seed-member-data.sql (Policy holders with child tables)';
PRINT '';
GO
