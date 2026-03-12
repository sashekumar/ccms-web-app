/*
==============================================================================
CCMS (CLAIMS & CASE MANAGEMENT SYSTEM) - FULL NORMALIZED SCHEMA WITH ACL (v7)
Total Tables: 78 (71 Business Tables + 7 ACL Tables)
REPLACES: 164 Legacy Tables
ACL: Access Control List (Role-Based Access Control)
==============================================================================
VERSION HISTORY:
- v5: Full normalized schema (72 tables)
- v6: v5 + ACL Permission Control System (78 tables)
- v7: v6 + Audit columns (created_by/updated_by) added to ALL ACL tables

IMPROVEMENTS IN v7:
- ✅ Added: created_by, updated_by to ccms_acl_categories
- ✅ Added: created_by, updated_by to ccms_acl_modules
- ✅ Added: created_by, updated_by to ccms_acl_actions
- ✅ Added: created_by, updated_by to ccms_acl_module_actions
- ✅ Consistent audit trail across ALL ACL tables
- ✅ All ACL tables now track who created/modified records
==============================================================================
*/

USE db_ccms;
GO

-- ============================================================================
-- DROP EXISTING OBJECTS (for clean re-run)
-- ============================================================================

PRINT '';
PRINT '================================================================';
PRINT 'DROPPING EXISTING TABLES (IF ANY)';
PRINT '================================================================';
PRINT '';

-- Drop ACL (Access Control List) views and procedures first
IF OBJECT_ID('vw_acl_user_permissions', 'V') IS NOT NULL DROP VIEW vw_acl_user_permissions;
IF OBJECT_ID('vw_acl_role_permissions', 'V') IS NOT NULL DROP VIEW vw_acl_role_permissions;
IF OBJECT_ID('sp_check_user_permission', 'P') IS NOT NULL DROP PROCEDURE sp_check_user_permission;
IF OBJECT_ID('sp_get_user_permissions_json', 'P') IS NOT NULL DROP PROCEDURE sp_get_user_permissions_json;
IF OBJECT_ID('sp_assign_role_to_user', 'P') IS NOT NULL DROP PROCEDURE sp_assign_role_to_user;

-- Drop ALL foreign key constraints first to avoid dependency issues
PRINT 'Dropping all foreign key constraints...';
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'ALTER TABLE ' + QUOTENAME(SCHEMA_NAME(fk.schema_id)) + '.' + 
              QUOTENAME(OBJECT_NAME(fk.parent_object_id)) + 
              ' DROP CONSTRAINT ' + QUOTENAME(fk.name) + ';' + CHAR(13)
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.parent_object_id) LIKE 'ccms_%';

IF @sql <> ''
BEGIN
    EXEC sp_executesql @sql;
    PRINT '  ✓ All foreign key constraints dropped';
END
ELSE
BEGIN
    PRINT '  ✓ No foreign key constraints found';
END

-- Drop ACL (Access Control List) tables
IF OBJECT_ID('ccms_acl_user_roles', 'U') IS NOT NULL DROP TABLE ccms_acl_user_roles;
IF OBJECT_ID('ccms_acl_role_permissions', 'U') IS NOT NULL DROP TABLE ccms_acl_role_permissions;
IF OBJECT_ID('ccms_acl_module_actions', 'U') IS NOT NULL DROP TABLE ccms_acl_module_actions;
IF OBJECT_ID('ccms_acl_actions', 'U') IS NOT NULL DROP TABLE ccms_acl_actions;
IF OBJECT_ID('ccms_acl_modules', 'U') IS NOT NULL DROP TABLE ccms_acl_modules;
IF OBJECT_ID('ccms_acl_categories', 'U') IS NOT NULL DROP TABLE ccms_acl_categories;
IF OBJECT_ID('ccms_acl_roles', 'U') IS NOT NULL DROP TABLE ccms_acl_roles;

-- Drop business tables (in reverse dependency order)
IF OBJECT_ID('ccms_fwd_accumulation_pa', 'U') IS NOT NULL DROP TABLE ccms_fwd_accumulation_pa;
IF OBJECT_ID('ccms_fwd_accumulation_onetime', 'U') IS NOT NULL DROP TABLE ccms_fwd_accumulation_onetime;
IF OBJECT_ID('ccms_fwd_accumulation_disability', 'U') IS NOT NULL DROP TABLE ccms_fwd_accumulation_disability;
IF OBJECT_ID('ccms_fwd_accumulation_client', 'U') IS NOT NULL DROP TABLE ccms_fwd_accumulation_client;
IF OBJECT_ID('ccms_claim_durations', 'U') IS NOT NULL DROP TABLE ccms_claim_durations;
IF OBJECT_ID('ccms_claim_processing_milestones', 'U') IS NOT NULL DROP TABLE ccms_claim_processing_milestones;
IF OBJECT_ID('ccms_claim_status_log', 'U') IS NOT NULL DROP TABLE ccms_claim_status_log;
IF OBJECT_ID('ccms_stop_loss_data', 'U') IS NOT NULL DROP TABLE ccms_stop_loss_data;
IF OBJECT_ID('ccms_query_template_questions', 'U') IS NOT NULL DROP TABLE ccms_query_template_questions;
IF OBJECT_ID('ccms_query_templates', 'U') IS NOT NULL DROP TABLE ccms_query_templates;
IF OBJECT_ID('ccms_reminders', 'U') IS NOT NULL DROP TABLE ccms_reminders;
IF OBJECT_ID('ccms_documents', 'U') IS NOT NULL DROP TABLE ccms_documents;
IF OBJECT_ID('ccms_checklists', 'U') IS NOT NULL DROP TABLE ccms_checklists;
IF OBJECT_ID('ccms_investigation_call_log', 'U') IS NOT NULL DROP TABLE ccms_investigation_call_log;
IF OBJECT_ID('ccms_investigation_request_history', 'U') IS NOT NULL DROP TABLE ccms_investigation_request_history;
IF OBJECT_ID('ccms_investigation_request', 'U') IS NOT NULL DROP TABLE ccms_investigation_request;
IF OBJECT_ID('ccms_investigations', 'U') IS NOT NULL DROP TABLE ccms_investigations;
IF OBJECT_ID('ccms_escalation_settlement', 'U') IS NOT NULL DROP TABLE ccms_escalation_settlement;
IF OBJECT_ID('ccms_escalation_updates', 'U') IS NOT NULL DROP TABLE ccms_escalation_updates;
IF OBJECT_ID('ccms_escalation_nature', 'U') IS NOT NULL DROP TABLE ccms_escalation_nature;
IF OBJECT_ID('ccms_escalation_source', 'U') IS NOT NULL DROP TABLE ccms_escalation_source;
IF OBJECT_ID('ccms_escalations', 'U') IS NOT NULL DROP TABLE ccms_escalations;
IF OBJECT_ID('ccms_ra_matrix', 'U') IS NOT NULL DROP TABLE ccms_ra_matrix;
IF OBJECT_ID('ccms_claim_upload_error', 'U') IS NOT NULL DROP TABLE ccms_claim_upload_error;
IF OBJECT_ID('ccms_claim_upload_payment_details', 'U') IS NOT NULL DROP TABLE ccms_claim_upload_payment_details;
IF OBJECT_ID('ccms_claim_upload_offer', 'U') IS NOT NULL DROP TABLE ccms_claim_upload_offer;
IF OBJECT_ID('ccms_claim_upload_notification_details', 'U') IS NOT NULL DROP TABLE ccms_claim_upload_notification_details;
IF OBJECT_ID('ccms_claim_upload_batch', 'U') IS NOT NULL DROP TABLE ccms_claim_upload_batch;
IF OBJECT_ID('ccms_claim_uploads', 'U') IS NOT NULL DROP TABLE ccms_claim_uploads;
IF OBJECT_ID('ccms_multi_payment_advice_details', 'U') IS NOT NULL DROP TABLE ccms_multi_payment_advice_details;
IF OBJECT_ID('ccms_multi_payment_advice', 'U') IS NOT NULL DROP TABLE ccms_multi_payment_advice;
IF OBJECT_ID('ccms_pa_payments', 'U') IS NOT NULL DROP TABLE ccms_pa_payments;
IF OBJECT_ID('ccms_pa_uncovered_charges', 'U') IS NOT NULL DROP TABLE ccms_pa_uncovered_charges;
IF OBJECT_ID('ccms_pa_consultation_breakdown_history', 'U') IS NOT NULL DROP TABLE ccms_pa_consultation_breakdown_history;
IF OBJECT_ID('ccms_pa_consultation_breakdown', 'U') IS NOT NULL DROP TABLE ccms_pa_consultation_breakdown;
IF OBJECT_ID('ccms_pa_summary', 'U') IS NOT NULL DROP TABLE ccms_pa_summary;
IF OBJECT_ID('ccms_pa_line_items', 'U') IS NOT NULL DROP TABLE ccms_pa_line_items;
IF OBJECT_ID('ccms_payment_advice', 'U') IS NOT NULL DROP TABLE ccms_payment_advice;
IF OBJECT_ID('ccms_8hm_monitoring', 'U') IS NOT NULL DROP TABLE ccms_8hm_monitoring;
IF OBJECT_ID('ccms_los_alerts', 'U') IS NOT NULL DROP TABLE ccms_los_alerts;
IF OBJECT_ID('ccms_los_alert_thresholds', 'U') IS NOT NULL DROP TABLE ccms_los_alert_thresholds;
IF OBJECT_ID('ccms_remarks', 'U') IS NOT NULL DROP TABLE ccms_remarks;
IF OBJECT_ID('ccms_admission_assessments', 'U') IS NOT NULL DROP TABLE ccms_admission_assessments;
IF OBJECT_ID('ccms_admissions', 'U') IS NOT NULL DROP TABLE ccms_admissions;
IF OBJECT_ID('ccms_claims', 'U') IS NOT NULL DROP TABLE ccms_claims;
IF OBJECT_ID('ccms_member_pec_conditions', 'U') IS NOT NULL DROP TABLE ccms_member_pec_conditions;
IF OBJECT_ID('ccms_member_dependents', 'U') IS NOT NULL DROP TABLE ccms_member_dependents;
IF OBJECT_ID('ccms_member_policies', 'U') IS NOT NULL DROP TABLE ccms_member_policies;
IF OBJECT_ID('ccms_member_contacts', 'U') IS NOT NULL DROP TABLE ccms_member_contacts;
IF OBJECT_ID('ccms_member_addresses', 'U') IS NOT NULL DROP TABLE ccms_member_addresses;
IF OBJECT_ID('ccms_members', 'U') IS NOT NULL DROP TABLE ccms_members;
IF OBJECT_ID('ccms_product_copay', 'U') IS NOT NULL DROP TABLE ccms_product_copay;
IF OBJECT_ID('ccms_product_limits', 'U') IS NOT NULL DROP TABLE ccms_product_limits;
IF OBJECT_ID('ccms_products', 'U') IS NOT NULL DROP TABLE ccms_products;
IF OBJECT_ID('ccms_fee_schedules', 'U') IS NOT NULL DROP TABLE ccms_fee_schedules;
IF OBJECT_ID('ccms_hospital_staff_contacts', 'U') IS NOT NULL DROP TABLE ccms_hospital_staff_contacts;
IF OBJECT_ID('ccms_hospital_staff', 'U') IS NOT NULL DROP TABLE ccms_hospital_staff;
IF OBJECT_ID('ccms_hospital_codes', 'U') IS NOT NULL DROP TABLE ccms_hospital_codes;
IF OBJECT_ID('ccms_hospital_addresses', 'U') IS NOT NULL DROP TABLE ccms_hospital_addresses;
IF OBJECT_ID('ccms_hospitals', 'U') IS NOT NULL DROP TABLE ccms_hospitals;
IF OBJECT_ID('ccms_m_clauses', 'U') IS NOT NULL DROP TABLE ccms_m_clauses;
IF OBJECT_ID('ccms_m_lookup_metadata', 'U') IS NOT NULL DROP TABLE ccms_m_lookup_metadata;
IF OBJECT_ID('ccms_m_lookups', 'U') IS NOT NULL DROP TABLE ccms_m_lookups;
IF OBJECT_ID('ccms_m_lookup_categories', 'U') IS NOT NULL DROP TABLE ccms_m_lookup_categories;
IF OBJECT_ID('ccms_m_banks', 'U') IS NOT NULL DROP TABLE ccms_m_banks;
IF OBJECT_ID('ccms_audit_logs', 'U') IS NOT NULL DROP TABLE ccms_audit_logs;
IF OBJECT_ID('ccms_sys_doc_sequences', 'U') IS NOT NULL DROP TABLE ccms_sys_doc_sequences;
IF OBJECT_ID('ccms_system_version', 'U') IS NOT NULL DROP TABLE ccms_system_version;
IF OBJECT_ID('ccms_log_notifications', 'U') IS NOT NULL DROP TABLE ccms_log_notifications;
IF OBJECT_ID('ccms_admission_log', 'U') IS NOT NULL DROP TABLE ccms_admission_log;
IF OBJECT_ID('ccms_users', 'U') IS NOT NULL DROP TABLE ccms_users;

PRINT 'All existing tables dropped successfully.';
PRINT '';

GO

-- ============================================================================
-- SECTION 1: MASTER LOOKUPS & CONFIGURATION
-- Consolidates: dt_Config, dt_Email_Config, DT_STATE, dt_Admission_Types, 
-- dt_Master_Reject_Diagnosis, DT_IC, DT_SUB_IC, DT_IC_INDEX
-- ============================================================================

PRINT 'Creating Master Lookups & Configuration tables...';

-- Replaces: Multiple legacy lookup tables (dt_Admission_Types, dt_Master_Reject_Diagnosis, DT_IC, DT_SUB_IC, etc.)
CREATE TABLE ccms_m_lookup_categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_category_id UNIQUEIDENTIFIER NULL,    -- Maps to legacy lookup category source (for data migration verification)
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(255),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_m_lookup_categories_legacy_id ON ccms_m_lookup_categories(legacy_category_id) WHERE legacy_category_id IS NOT NULL;

-- Replaces: All legacy lookup tables (dt_Admission_Types, dt_Master_Reject_Diagnosis, DT_IC, DT_SUB_IC, DT_IC_INDEX, DT_STATE)
CREATE TABLE ccms_m_lookups (
    lookup_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_lookup_id UNIQUEIDENTIFIER NULL,     -- Maps to original lookup record from legacy tables (for data migration verification)
    category_id INT NOT NULL,
    lookup_code VARCHAR(50) NOT NULL,
    lookup_value NVARCHAR(MAX) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_Lookup_Category FOREIGN KEY (category_id) REFERENCES ccms_m_lookup_categories(category_id),
    CONSTRAINT UQ_Lookup_Code UNIQUE (category_id, lookup_code)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_m_lookups_legacy_id ON ccms_m_lookups(legacy_lookup_id) WHERE legacy_lookup_id IS NOT NULL;

-- Replaces: Extra attributes from legacy lookup tables (e.g., insurer-specific codes, additional metadata)
CREATE TABLE ccms_m_lookup_metadata (
    metadata_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    lookup_id INT NOT NULL,
    metadata_key VARCHAR(100) NOT NULL,
    metadata_value NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_LookupMeta_Lookup FOREIGN KEY (lookup_id) REFERENCES ccms_m_lookups(lookup_id),
    CONSTRAINT UQ_LookupMeta_Key UNIQUE (lookup_id, metadata_key)
);

-- Replaces: dt_Bank_Details (core bank data)
CREATE TABLE ccms_m_banks (
    bank_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_bank_id UNIQUEIDENTIFIER NULL,       -- Maps to dt_Bank_Details.ID (for data migration verification)
    bank_name NVARCHAR(255) NOT NULL UNIQUE,
    bank_code VARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_m_banks_legacy_id ON ccms_m_banks(legacy_bank_id) WHERE legacy_bank_id IS NOT NULL;

-- Replaces: dt_Config (clause-related config entries)
CREATE TABLE ccms_m_clauses (
    clause_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_config_id UNIQUEIDENTIFIER NULL,     -- Maps to dt_Config.ID (for data migration verification)
    clause_category VARCHAR(50),
    clause_code VARCHAR(20) NOT NULL UNIQUE,
    clause_text NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_m_clauses_legacy_id ON ccms_m_clauses(legacy_config_id) WHERE legacy_config_id IS NOT NULL;

PRINT '  ✓ Master Lookups created (5 tables)';
GO

-- ============================================================================
-- SECTION 2: PROVIDERS (HOSPITALS & DOCTORS)
-- Consolidates: dt_Hospital, DT_HOSPITAL_CONTACTS, dt_Hospital_Doctors, 
-- dt_Fee_Schedule, dt_TPAFee, dt_WakalahFee, dt_Doctor_Remarks
-- ============================================================================

PRINT 'Creating Provider tables...';

-- Replaces: dt_Hospital (core hospital/provider data)
CREATE TABLE ccms_hospitals (
    hospital_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_hospital_id UNIQUEIDENTIFIER NULL,   -- Maps to dt_Hospital.ID (for data migration verification)
    hospital_name NVARCHAR(255) NOT NULL,
    hospital_code VARCHAR(50),
    hospital_type VARCHAR(50),
    reg_no VARCHAR(50),
    bank_id INT,
    bank_acc_no VARCHAR(50),
    is_panel BIT DEFAULT 0,
    panel_status VARCHAR(50),
    panel_effective_date DATE,
    accreditation_status VARCHAR(50),
    accreditation_expiry DATE,
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    updated_at DATETIME2,
    updated_by VARCHAR(50),
    is_deleted BIT DEFAULT 0,
    CONSTRAINT FK_Hosp_Bank FOREIGN KEY (bank_id) REFERENCES ccms_m_banks(bank_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_hospitals_legacy_id ON ccms_hospitals(legacy_hospital_id) WHERE legacy_hospital_id IS NOT NULL;

-- Replaces: dt_Hospital (address fields normalized out)
CREATE TABLE ccms_hospital_addresses (
    address_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_hospital_address_id UNIQUEIDENTIFIER NULL, -- Maps to address record from dt_Hospital (for data migration verification)
    hospital_id BIGINT NOT NULL,
    address_type VARCHAR(50) DEFAULT 'PRIMARY',
    street_line1 NVARCHAR(255),
    street_line2 NVARCHAR(255),
    city NVARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_primary BIT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_HospAddr_Hosp FOREIGN KEY (hospital_id) REFERENCES ccms_hospitals(hospital_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_hospital_addresses_legacy_id ON ccms_hospital_addresses(legacy_hospital_address_id) WHERE legacy_hospital_address_id IS NOT NULL;

-- Replaces: dt_Hospital (insurer-specific codes normalized out: ZURICH_HOSP_CODE, FWD_HOSP_CODE, etc.)
CREATE TABLE ccms_hospital_codes (
    code_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_hospital_code_id UNIQUEIDENTIFIER NULL, -- Maps to code record from dt_Hospital (for data migration verification)
    hospital_id BIGINT NOT NULL,
    code_type VARCHAR(50), -- ZURICH_HOSP_CODE, FWD_HOSP_CODE, INSURER_CODE
    code_value VARCHAR(100),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_HospCode_Hosp FOREIGN KEY (hospital_id) REFERENCES ccms_hospitals(hospital_id),
    CONSTRAINT UQ_HospCode UNIQUE (hospital_id, code_type)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_hospital_codes_legacy_id ON ccms_hospital_codes(legacy_hospital_code_id) WHERE legacy_hospital_code_id IS NOT NULL;

-- Replaces: dt_Hospital_Doctors
CREATE TABLE ccms_hospital_staff (
    staff_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_hospital_staff_id UNIQUEIDENTIFIER NULL, -- Maps to dt_Hospital_Doctors.ID (for data migration verification)
    hospital_id BIGINT NOT NULL,
    staff_name NVARCHAR(255) NOT NULL,
    staff_type VARCHAR(50),
    specialty NVARCHAR(255),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_Staff_Hosp FOREIGN KEY (hospital_id) REFERENCES ccms_hospitals(hospital_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_hospital_staff_legacy_id ON ccms_hospital_staff(legacy_hospital_staff_id) WHERE legacy_hospital_staff_id IS NOT NULL;

-- Replaces: DT_HOSPITAL_CONTACTS, dt_Hospital_Doctors (contact fields normalized out)
CREATE TABLE ccms_hospital_staff_contacts (
    contact_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_hospital_contact_id UNIQUEIDENTIFIER NULL, -- Maps to DT_HOSPITAL_CONTACTS.ID (for data migration verification)
    staff_id BIGINT NOT NULL,
    contact_type VARCHAR(50), -- EMAIL, MOBILE, PHONE, EXT
    contact_value VARCHAR(100),
    is_primary BIT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_StaffContact_Staff FOREIGN KEY (staff_id) REFERENCES ccms_hospital_staff(staff_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_hospital_staff_contacts_legacy_id ON ccms_hospital_staff_contacts(legacy_hospital_contact_id) WHERE legacy_hospital_contact_id IS NOT NULL;

-- Replaces: dt_Fee_Schedule, dt_TPAFee, dt_WakalahFee
CREATE TABLE ccms_fee_schedules (
    fee_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_fee_schedule_id UNIQUEIDENTIFIER NULL, -- Maps to dt_Fee_Schedule.ID or dt_TPAFee.ID or dt_WakalahFee.ID (for data migration verification)
    hospital_id BIGINT,
    fee_type VARCHAR(50), -- TPA, Wakalah, MMA
    item_code VARCHAR(50),
    description NVARCHAR(MAX),
    amount MONEY,
    effective_date DATE,
    expiry_date DATE,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_Fee_Hosp FOREIGN KEY (hospital_id) REFERENCES ccms_hospitals(hospital_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_fee_schedules_legacy_id ON ccms_fee_schedules(legacy_fee_schedule_id) WHERE legacy_fee_schedule_id IS NOT NULL;

PRINT '  ✓ Provider tables created (6 tables)';
GO

-- ============================================================================
-- SECTION 3: PRODUCTS & MEMBERS
-- Consolidates: dt_Product, dt_Product_Details, dt_Product_Downgrade_Mapping,
-- dt_PolicyHolder, dt_PolicyHolder_Dependents, dt_PolicyHolder_Policy, 
-- dt_policyno_details, dt_Policy_Change_Mapping, DT_PH_DEP_PEC
-- ============================================================================

PRINT 'Creating Products & Members tables...';

-- Replaces: dt_Product (core product/plan data)
CREATE TABLE ccms_products (
    product_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_product_id UNIQUEIDENTIFIER NULL,     -- Maps to dt_Product.ID (for data migration verification)
    insurer_name NVARCHAR(255),
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    plan_name NVARCHAR(255),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_products_legacy_id ON ccms_products(legacy_product_id) WHERE legacy_product_id IS NOT NULL;

-- Replaces: dt_Product_Details (limit fields normalized out)
CREATE TABLE ccms_product_limits (
    limit_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_product_limit_id UNIQUEIDENTIFIER NULL, -- Maps to dt_Product_Details limit record (for data migration verification)
    product_id BIGINT NOT NULL,
    limit_type VARCHAR(50), -- ANNUAL, LIFETIME, ROOM_BOARD, SURGICAL
    limit_amount MONEY,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_ProdLimit_Prod FOREIGN KEY (product_id) REFERENCES ccms_products(product_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_product_limits_legacy_id ON ccms_product_limits(legacy_product_limit_id) WHERE legacy_product_limit_id IS NOT NULL;

-- Replaces: dt_Product_Details (copay fields normalized out)
CREATE TABLE ccms_product_copay (
    copay_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_product_copay_id UNIQUEIDENTIFIER NULL, -- Maps to dt_Product_Details copay record (for data migration verification)
    product_id BIGINT NOT NULL,
    copay_type VARCHAR(50), -- PERCENTAGE, FIXED
    copay_value DECIMAL(10,2),
    applies_to NVARCHAR(255), -- Description of what this copay applies to
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_ProdCopay_Prod FOREIGN KEY (product_id) REFERENCES ccms_products(product_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_product_copay_legacy_id ON ccms_product_copay(legacy_product_copay_id) WHERE legacy_product_copay_id IS NOT NULL;

-- Replaces: dt_PolicyHolder (core member/policyholder data)
CREATE TABLE ccms_members (
    member_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_member_id UNIQUEIDENTIFIER NULL,      -- Maps to dt_PolicyHolder.ID (for data migration verification)
    external_guid UNIQUEIDENTIFIER NULL,          -- No default - populated only during data migration
    full_name NVARCHAR(255) NOT NULL,
    ic_no VARCHAR(20) NOT NULL UNIQUE,
    fwd_member_no VARCHAR(50),
    fwd_client_no VARCHAR(50),
    client_id VARCHAR(50),
    dob DATE,
    gender BIT,
    member_type VARCHAR(50),
    member_status VARCHAR(50),
    bank_id INT,
    bank_acc_no VARCHAR(50),
    enrollment_date DATETIME2 DEFAULT GETDATE(),
    termination_date DATE,
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    updated_at DATETIME2,
    updated_by VARCHAR(50),
    is_deleted BIT DEFAULT 0,
    CONSTRAINT FK_Member_Bank FOREIGN KEY (bank_id) REFERENCES ccms_m_banks(bank_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_members_legacy_id ON ccms_members(legacy_member_id) WHERE legacy_member_id IS NOT NULL;

-- Replaces: dt_PolicyHolder (address fields normalized out)
CREATE TABLE ccms_member_addresses (
    address_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_member_address_id UNIQUEIDENTIFIER NULL, -- Maps to address record from dt_PolicyHolder (for data migration verification)
    member_id BIGINT NOT NULL,
    address_type VARCHAR(50) DEFAULT 'PRIMARY',
    street_line1 NVARCHAR(255),
    street_line2 NVARCHAR(255),
    city NVARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    is_primary BIT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_MemAddr_Mem FOREIGN KEY (member_id) REFERENCES ccms_members(member_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_member_addresses_legacy_id ON ccms_member_addresses(legacy_member_address_id) WHERE legacy_member_address_id IS NOT NULL;

-- Replaces: dt_PolicyHolder (contact fields normalized out: EMAIL, MOBILE, PHONE, FAX)
CREATE TABLE ccms_member_contacts (
    contact_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_member_contact_id UNIQUEIDENTIFIER NULL, -- Maps to contact record from dt_PolicyHolder (for data migration verification)
    member_id BIGINT NOT NULL,
    contact_type VARCHAR(50), -- EMAIL, MOBILE, PHONE, FAX
    contact_value VARCHAR(100),
    is_primary BIT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_MemContact_Mem FOREIGN KEY (member_id) REFERENCES ccms_members(member_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_member_contacts_legacy_id ON ccms_member_contacts(legacy_member_contact_id) WHERE legacy_member_contact_id IS NOT NULL;

-- Replaces: dt_PolicyHolder_Policy, dt_policyno_details
CREATE TABLE ccms_member_policies (
    policy_record_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_policy_id UNIQUEIDENTIFIER NULL,      -- Maps to dt_PolicyHolder_Policy.ID (for data migration verification)
    member_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    policy_no VARCHAR(100) NOT NULL,
    effective_date DATE,
    expiry_date DATE,
    status VARCHAR(50),
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    deleted_at DATETIME2 NULL,
    deleted_by VARCHAR(50) NULL,
    CONSTRAINT FK_Pol_Mem FOREIGN KEY (member_id) REFERENCES ccms_members(member_id),
    CONSTRAINT FK_Pol_Prod FOREIGN KEY (product_id) REFERENCES ccms_products(product_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_member_policies_legacy_id ON ccms_member_policies(legacy_policy_id) WHERE legacy_policy_id IS NOT NULL;

-- Replaces: dt_PolicyHolder_Dependents
CREATE TABLE ccms_member_dependents (
    dependent_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_dependent_id UNIQUEIDENTIFIER NULL,   -- Maps to dt_PolicyHolder_Dependents.ID (for data migration verification)
    principal_member_id BIGINT NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    ic_no VARCHAR(20),
    relationship_id INT,
    dob DATE,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_Dep_Princ FOREIGN KEY (principal_member_id) REFERENCES ccms_members(member_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_member_dependents_legacy_id ON ccms_member_dependents(legacy_dependent_id) WHERE legacy_dependent_id IS NOT NULL;

-- Replaces: DT_PH_DEP_PEC
CREATE TABLE ccms_member_pec_conditions (
    pec_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_pec_id UNIQUEIDENTIFIER NULL,         -- Maps to DT_PH_DEP_PEC.ID (for data migration verification)
    dependent_id BIGINT NOT NULL,
    condition_code VARCHAR(50),
    condition_name NVARCHAR(255),
    diagnosis_date DATE,
    is_excluded BIT DEFAULT 1,
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_PEC_Dep FOREIGN KEY (dependent_id) REFERENCES ccms_member_dependents(dependent_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_member_pec_conditions_legacy_id ON ccms_member_pec_conditions(legacy_pec_id) WHERE legacy_pec_id IS NOT NULL;

PRINT '  ✓ Products & Members tables created (9 tables)';
GO

-- ============================================================================
-- SECTION 4: CLAIMS & ADMISSIONS (The Core Workflow)
-- Consolidates: dt_Claim, dt_Admission, dt_Admission_Assessment, 
-- dt_Claim_Remarks, dt_LOS_Alert, dt_8HM_Monitoring
-- ============================================================================

PRINT 'Creating Claims & Admissions tables...';

-- Replaces: dt_Claim (core claim/reimbursement data)
CREATE TABLE ccms_claims (
    claim_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_claim_id UNIQUEIDENTIFIER NULL,       -- Maps to dt_Claim.ID (for data migration verification)
    claim_ref_no VARCHAR(50) NOT NULL UNIQUE,
    fwd_claim_ref_no VARCHAR(50),
    file_no VARCHAR(50),
    member_id BIGINT NOT NULL,
    patient_type VARCHAR(20),
    patient_id BIGINT,
    policy_record_id BIGINT,
    hospital_id BIGINT,
    doctor_id BIGINT,
    diagnosis_id BIGINT,
    disability_code VARCHAR(50),
    disability_category VARCHAR(100),
    claim_status_id INT,
    claim_status VARCHAR(50),
    claim_mode VARCHAR(20),
    priority_level INT DEFAULT 0,
    total_billed MONEY DEFAULT 0,
    total_approved MONEY DEFAULT 0,
    pre_auth_required BIT DEFAULT 0,
    pre_auth_no VARCHAR(50),
    rejection_type VARCHAR(50),
    rejection_reason NVARCHAR(MAX),
    rejection_date DATETIME2,
    sla_days INT,
    sla_deadline DATETIME2,
    sla_status VARCHAR(20),
    approval_authority VARCHAR(50),
    approval_date DATETIME2,
    batch_no VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    updated_at DATETIME2,
    updated_by VARCHAR(50),
    deleted_at DATETIME2,
    deleted_by VARCHAR(50),
    is_deleted BIT DEFAULT 0,
    payee_name NVARCHAR(255),
    payee_ic_no VARCHAR(20),
    payee_bank_name NVARCHAR(100),
    payee_bank_account_no VARCHAR(50),
    is_ec_case BIT DEFAULT 0,
    ec_status VARCHAR(50),
    ec_notification_date DATETIME2,
    ec_closed_date DATETIME2,
    document_received_at DATETIME2,
    CONSTRAINT FK_Claim_Member FOREIGN KEY (member_id) REFERENCES ccms_members(member_id),
    CONSTRAINT FK_Claim_Policy FOREIGN KEY (policy_record_id) REFERENCES ccms_member_policies(policy_record_id),
    CONSTRAINT FK_Claim_Hospital FOREIGN KEY (hospital_id) REFERENCES ccms_hospitals(hospital_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_claims_legacy_id ON ccms_claims(legacy_claim_id) WHERE legacy_claim_id IS NOT NULL;

-- Replaces: dt_Admission (GL/admission-specific data)
CREATE TABLE ccms_admissions (
    admission_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_admission_id UNIQUEIDENTIFIER NULL,   -- Maps to dt_Admission.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    gl_ref_no VARCHAR(50),
    admission_date DATETIME,
    discharge_date DATETIME,
    los_days AS (DATEDIFF(day, admission_date, discharge_date)),
    admission_status VARCHAR(50),
    admission_type VARCHAR(50),
    room_type VARCHAR(50),
    room_rate MONEY,
    icu_days INT,
    icu_rate MONEY,
    ehm_status VARCHAR(50),
    deferment_status VARCHAR(50),
    alert_flag BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    updated_at DATETIME2,
    updated_by VARCHAR(50),
    is_deleted BIT DEFAULT 0,
    CONSTRAINT FK_Adm_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_admissions_legacy_id ON ccms_admissions(legacy_admission_id) WHERE legacy_admission_id IS NOT NULL;

-- Replaces: dt_Admission_Assessment (dynamic assessment fields normalized to EAV pattern)
CREATE TABLE ccms_admission_assessments (
    assessment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_assessment_id UNIQUEIDENTIFIER NULL,  -- Maps to dt_Admission_Assessment record (for data migration verification)
    admission_id BIGINT NOT NULL,
    field_name VARCHAR(100),
    field_value NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_Assess_Adm FOREIGN KEY (admission_id) REFERENCES ccms_admissions(admission_id),
    CONSTRAINT UQ_Assessment UNIQUE (admission_id, field_name)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_admission_assessments_legacy_id ON ccms_admission_assessments(legacy_assessment_id) WHERE legacy_assessment_id IS NOT NULL;

-- Replaces: dt_Claim_Remarks, dt_Reminder_MQ_HOSP.REMINDER_REMARKS, dt_Reminder_MQ_PH.REMINDER_REMARKS
-- Generic polymorphic remarks table supporting multiple entity types
CREATE TABLE ccms_remarks (
    remark_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_remark_id UNIQUEIDENTIFIER NULL,      -- Maps to dt_Claim_Remarks.ID or reminder remarks (for data migration verification)
    ref_type VARCHAR(50) NOT NULL,        -- CLAIM, ADMISSION, ESCALATION, INVESTIGATION, PA, REMINDER, etc.
    ref_id BIGINT NOT NULL,               -- ID of the referenced entity
    ref_desc VARCHAR(100),                -- Description/title of reference
    action_for VARCHAR(50),               -- Purpose: INVESTIGATION, APPROVAL, CLARIFICATION, FOLLOW_UP, MQ_RESPONSE, etc.
    remark_text NVARCHAR(MAX),            -- The actual remark content
    created_by VARCHAR(50),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_by VARCHAR(50),
    updated_at DATETIME2 NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_remarks_legacy_id ON ccms_remarks(legacy_remark_id) WHERE legacy_remark_id IS NOT NULL;

-- Replaces: dt_Config (LOS alert configuration)
CREATE TABLE ccms_los_alert_thresholds (
    threshold_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_los_threshold_id UNIQUEIDENTIFIER NULL, -- Maps to dt_Config LOS threshold record (for data migration verification)
    product_id BIGINT,
    diagnosis_category VARCHAR(100),
    threshold_days INT,
    alert_level INT,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_LOSThreshold_Prod FOREIGN KEY (product_id) REFERENCES ccms_products(product_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_los_alert_thresholds_legacy_id ON ccms_los_alert_thresholds(legacy_los_threshold_id) WHERE legacy_los_threshold_id IS NOT NULL;

-- Replaces: dt_LOS_Alert (Length of Stay alerts)
CREATE TABLE ccms_los_alerts (
    alert_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_los_alert_id UNIQUEIDENTIFIER NULL,    -- Maps to dt_LOS_Alert.ID (for data migration verification)
    admission_id BIGINT NOT NULL,
    alert_level INT,
    triggered_at DATETIME2 DEFAULT GETDATE(),
    current_los INT,
    threshold_days INT,
    status VARCHAR(20),
    acknowledged_by VARCHAR(50),
    acknowledged_at DATETIME2,
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_LOSAlert_Adm FOREIGN KEY (admission_id) REFERENCES ccms_admissions(admission_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_los_alerts_legacy_id ON ccms_los_alerts(legacy_los_alert_id) WHERE legacy_los_alert_id IS NOT NULL;

-- Replaces: dt_8HM_Monitoring (8-hour monitoring checks)
CREATE TABLE ccms_8hm_monitoring (
    monitoring_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_8hm_monitoring_id UNIQUEIDENTIFIER NULL, -- Maps to dt_8HM_Monitoring.ID (for data migration verification)
    admission_id BIGINT NOT NULL,
    check_time DATETIME2,
    hours_elapsed INT,
    status VARCHAR(50),
    checked_by VARCHAR(50),
    notes NVARCHAR(MAX),
    next_check_due DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_8HM_Adm FOREIGN KEY (admission_id) REFERENCES ccms_admissions(admission_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_8hm_monitoring_legacy_id ON ccms_8hm_monitoring(legacy_8hm_monitoring_id) WHERE legacy_8hm_monitoring_id IS NOT NULL;

PRINT '  ✓ Claims & Admissions tables created (8 tables)';
GO

-- ============================================================================
-- SECTION 5: FINANCIALS (PAYMENT ADVICE)
-- Consolidates: dt_Payment_Advice, dt_PA_Details, dt_PA_SOB_Summary,
-- dt_PA_Consultation_Breakdown, dt_PA_Payment, dt_Multi_Payment_Advice
-- ============================================================================

PRINT 'Creating Financial tables...';

-- Replaces: dt_Payment_Advice (core payment advice data)
CREATE TABLE ccms_payment_advice (
    pa_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_pa_id UNIQUEIDENTIFIER NULL,          -- Maps to dt_Payment_Advice.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    pa_ref_no VARCHAR(50) NOT NULL UNIQUE,
    hospital_invoice_no VARCHAR(100),
    hospital_invoice_amount MONEY,
    tax_amt MONEY DEFAULT 0,
    discount_amt MONEY DEFAULT 0,
    subtotal_ra MONEY DEFAULT 0,
    subtotal_nra MONEY DEFAULT 0,
    subtotal_ia MONEY DEFAULT 0,
    grand_total MONEY DEFAULT 0,
    grand_total_ia MONEY DEFAULT 0,
    consultation_total MONEY DEFAULT 0,
    uncovered_total MONEY DEFAULT 0,
    payment_status VARCHAR(50),
    payment_method VARCHAR(50),
    payment_date DATETIME2,
    is_shortfall BIT DEFAULT 0,
    is_multipl_pa BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    updated_at DATETIME2,
    updated_by VARCHAR(50),
    submission_batch_no VARCHAR(50),
    submission_date DATETIME2,
    finance_deferment_status VARCHAR(50),
    physical_folder_status VARCHAR(50),
    CONSTRAINT FK_PA_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_payment_advice_legacy_id ON ccms_payment_advice(legacy_pa_id) WHERE legacy_pa_id IS NOT NULL;

-- Replaces: dt_PA_Details (payment advice line items)
CREATE TABLE ccms_pa_line_items (
    item_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_pa_line_item_id UNIQUEIDENTIFIER NULL, -- Maps to dt_PA_Details.ID (for data migration verification)
    pa_id BIGINT NOT NULL,
    benefit_name NVARCHAR(255),
    billed_amt MONEY,
    approved_amt MONEY,
    non_reimb_reason NVARCHAR(MAX),
    is_consultation_breakdown BIT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_PALine_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_pa_line_items_legacy_id ON ccms_pa_line_items(legacy_pa_line_item_id) WHERE legacy_pa_line_item_id IS NOT NULL;

-- Replaces: dt_PA_SOB_Summary (statement of benefit summary)
CREATE TABLE ccms_pa_summary (
    summary_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_pa_summary_id UNIQUEIDENTIFIER NULL,   -- Maps to dt_PA_SOB_Summary.ID (for data migration verification)
    pa_id BIGINT NOT NULL,
    sob_type VARCHAR(50),
    sob_category VARCHAR(100),
    amount_ia MONEY,
    amount_ra MONEY,
    amount_nra MONEY,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_PASummary_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_pa_summary_legacy_id ON ccms_pa_summary(legacy_pa_summary_id) WHERE legacy_pa_summary_id IS NOT NULL;

-- Replaces: dt_PA_Consultation_Breakdown (consultation charges breakdown)
CREATE TABLE ccms_pa_consultation_breakdown (
    consultation_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_consultation_id UNIQUEIDENTIFIER NULL, -- Maps to dt_PA_Consultation_Breakdown.ID (for data migration verification)
    pa_id BIGINT NOT NULL,
    consultation_type VARCHAR(100),
    consultation_amount MONEY,
    doctor_id BIGINT,
    consultation_date DATE,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_Consultation_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_pa_consultation_breakdown_legacy_id ON ccms_pa_consultation_breakdown(legacy_consultation_id) WHERE legacy_consultation_id IS NOT NULL;

-- Replaces: dt_PA_Consultation_Breakdown_History (consultation changes audit trail)
CREATE TABLE ccms_pa_consultation_breakdown_history (
    history_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_consultation_history_id UNIQUEIDENTIFIER NULL, -- Maps to dt_PA_Consultation_Breakdown_History.ID (for data migration verification)
    consultation_id BIGINT NOT NULL,
    old_amount MONEY,
    new_amount MONEY,
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    CONSTRAINT FK_ConsultHistory_Cons FOREIGN KEY (consultation_id) REFERENCES ccms_pa_consultation_breakdown(consultation_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_pa_consultation_breakdown_history_legacy_id ON ccms_pa_consultation_breakdown_history(legacy_consultation_history_id) WHERE legacy_consultation_history_id IS NOT NULL;

-- Replaces: dt_PA_Uncovered_Charges (non-covered/excluded charges)
CREATE TABLE ccms_pa_uncovered_charges (
    uncovered_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_uncovered_charge_id UNIQUEIDENTIFIER NULL, -- Maps to dt_PA_Uncovered_Charges.ID (for data migration verification)
    pa_id BIGINT NOT NULL,
    charge_description NVARCHAR(MAX),
    charge_amount MONEY,
    uncovered_reason NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_Uncovered_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_pa_uncovered_charges_legacy_id ON ccms_pa_uncovered_charges(legacy_uncovered_charge_id) WHERE legacy_uncovered_charge_id IS NOT NULL;

-- Replaces: dt_PA_Payment (payment transactions)
CREATE TABLE ccms_pa_payments (
    payment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_pa_payment_id UNIQUEIDENTIFIER NULL,   -- Maps to dt_PA_Payment.ID (for data migration verification)
    pa_id BIGINT NOT NULL,
    payment_amount MONEY,
    payment_method VARCHAR(50),
    payment_date DATETIME2,
    payment_reference VARCHAR(100),
    payment_status VARCHAR(50),
    member_ic VARCHAR(20),
    member_name NVARCHAR(255),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_Payment_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_pa_payments_legacy_id ON ccms_pa_payments(legacy_pa_payment_id) WHERE legacy_pa_payment_id IS NOT NULL;

-- Replaces: dt_Multi_Payment_Advice (multiple PA header)
CREATE TABLE ccms_multi_payment_advice (
    mpa_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_mpa_id UNIQUEIDENTIFIER NULL,          -- Maps to dt_Multi_Payment_Advice.ID (for data migration verification)
    mpa_ref_no VARCHAR(50) NOT NULL UNIQUE,
    claim_id BIGINT NOT NULL,
    total_amount MONEY,
    pa_count INT,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_MPA_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_multi_payment_advice_legacy_id ON ccms_multi_payment_advice(legacy_mpa_id) WHERE legacy_mpa_id IS NOT NULL;

-- Replaces: dt_Multi_Payment_Advice_Details (multiple PA line items)
CREATE TABLE ccms_multi_payment_advice_details (
    mpa_detail_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_mpa_detail_id UNIQUEIDENTIFIER NULL,   -- Maps to dt_Multi_Payment_Advice_Details.ID (for data migration verification)
    mpa_id BIGINT NOT NULL,
    pa_id BIGINT NOT NULL,
    pa_amount MONEY,
    sequence_no INT,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_MPADetail_MPA FOREIGN KEY (mpa_id) REFERENCES ccms_multi_payment_advice(mpa_id),
    CONSTRAINT FK_MPADetail_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_multi_payment_advice_details_legacy_id ON ccms_multi_payment_advice_details(legacy_mpa_detail_id) WHERE legacy_mpa_detail_id IS NOT NULL;

PRINT '  ✓ Financial tables created (10 tables)';
GO

-- ============================================================================
-- SECTION 6: UPLOADS & EXTERNAL SYNC
-- Consolidates: dt_Claim_Upload, dt_Claim_Upload_Batch, 
-- dt_Claim_Upload_Notification_Details, dt_RA_Matrix
-- ============================================================================

PRINT 'Creating Upload & Sync tables...';

-- Replaces: dt_Claim_Upload (file upload tracking)
CREATE TABLE ccms_claim_uploads (
    upload_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_upload_id UNIQUEIDENTIFIER NULL,       -- Maps to dt_Claim_Upload.ID (for data migration verification)
    batch_no VARCHAR(50),
    file_type VARCHAR(50),
    processing_status VARCHAR(20),
    error_details NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_claim_uploads_legacy_id ON ccms_claim_uploads(legacy_upload_id) WHERE legacy_upload_id IS NOT NULL;

-- Replaces: dt_Claim_Upload_Batch (batch processing header)
CREATE TABLE ccms_claim_upload_batch (
    batch_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_batch_id UNIQUEIDENTIFIER NULL,        -- Maps to dt_Claim_Upload_Batch.ID (for data migration verification)
    batch_no VARCHAR(50) NOT NULL UNIQUE,
    file_type VARCHAR(50),
    upload_date DATETIME2 DEFAULT GETDATE(),
    uploaded_by VARCHAR(50),
    record_count INT,
    processing_status VARCHAR(20),
    error_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_claim_upload_batch_legacy_id ON ccms_claim_upload_batch(legacy_batch_id) WHERE legacy_batch_id IS NOT NULL;

-- Replaces: dt_Claim_Upload_Notification_Details (notification upload details)
CREATE TABLE ccms_claim_upload_notification_details (
    notification_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_notification_id UNIQUEIDENTIFIER NULL, -- Maps to dt_Claim_Upload_Notification_Details.ID (for data migration verification)
    batch_id BIGINT NOT NULL,
    claim_id BIGINT NOT NULL,
    insurer_claim_no VARCHAR(50),
    notification_type VARCHAR(50),
    notification_date DATETIME2,
    kiv_status VARCHAR(50),
    kiv_reason NVARCHAR(MAX),
    deleted_by VARCHAR(50),
    deleted_at DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_NotifDetail_Batch FOREIGN KEY (batch_id) REFERENCES ccms_claim_upload_batch(batch_id),
    CONSTRAINT FK_NotifDetail_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_claim_upload_notification_details_legacy_id ON ccms_claim_upload_notification_details(legacy_notification_id) WHERE legacy_notification_id IS NOT NULL;

-- Replaces: dt_Claim_Upload_Offer (offer upload details)
CREATE TABLE ccms_claim_upload_offer (
    offer_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_offer_id UNIQUEIDENTIFIER NULL,        -- Maps to dt_Claim_Upload_Offer.ID (for data migration verification)
    batch_id BIGINT NOT NULL,
    claim_id BIGINT NOT NULL,
    insurer_claim_no VARCHAR(50),
    offer_amount MONEY,
    offer_date DATETIME2,
    offer_status VARCHAR(50),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_Offer_Batch FOREIGN KEY (batch_id) REFERENCES ccms_claim_upload_batch(batch_id),
    CONSTRAINT FK_Offer_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_claim_upload_offer_legacy_id ON ccms_claim_upload_offer(legacy_offer_id) WHERE legacy_offer_id IS NOT NULL;

-- Replaces: dt_Claim_Upload_Payment_Details (payment upload details)
CREATE TABLE ccms_claim_upload_payment_details (
    payment_detail_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_payment_detail_id UNIQUEIDENTIFIER NULL, -- Maps to dt_Claim_Upload_Payment_Details.ID (for data migration verification)
    batch_id BIGINT NOT NULL,
    claim_id BIGINT NOT NULL,
    insurer_claim_no VARCHAR(50),
    approved_amount MONEY,
    paid_amount MONEY,
    short_amount MONEY DEFAULT 0,
    refund_amount MONEY DEFAULT 0,
    short_reason NVARCHAR(MAX),
    payment_date DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_PaymentDetail_Batch FOREIGN KEY (batch_id) REFERENCES ccms_claim_upload_batch(batch_id),
    CONSTRAINT FK_PaymentDetail_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_claim_upload_payment_details_legacy_id ON ccms_claim_upload_payment_details(legacy_payment_detail_id) WHERE legacy_payment_detail_id IS NOT NULL;

-- Replaces: dt_Claim_Upload_Error (upload error tracking)
CREATE TABLE ccms_claim_upload_error (
    error_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_error_id UNIQUEIDENTIFIER NULL,        -- Maps to dt_Claim_Upload_Error.ID (for data migration verification)
    batch_id BIGINT NOT NULL,
    claim_id BIGINT,
    error_code VARCHAR(20),
    error_description NVARCHAR(MAX),
    error_severity VARCHAR(20),
    error_date DATETIME2 DEFAULT GETDATE(),
    resolved BIT DEFAULT 0,
    resolution_notes NVARCHAR(MAX),
    resolved_by VARCHAR(50),
    resolved_at DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_Error_Batch FOREIGN KEY (batch_id) REFERENCES ccms_claim_upload_batch(batch_id),
    CONSTRAINT FK_Error_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_claim_upload_error_legacy_id ON ccms_claim_upload_error(legacy_error_id) WHERE legacy_error_id IS NOT NULL;

-- Replaces: dt_RA_Matrix (risk assessment matrix)
CREATE TABLE ccms_ra_matrix (
    ra_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_ra_id UNIQUEIDENTIFIER NULL,           -- Maps to dt_RA_Matrix.ID (for data migration verification)
    ra_code VARCHAR(20),
    ra_description NVARCHAR(MAX),
    ra_percentage DECIMAL(5,2),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_ra_matrix_legacy_id ON ccms_ra_matrix(legacy_ra_id) WHERE legacy_ra_id IS NOT NULL;

PRINT '  ✓ Upload & Sync tables created (8 tables)';
GO

-- ============================================================================
-- SECTION 7: WORKFLOW MODULES (ESCALATIONS, INVESTIGATIONS, CHECKLISTS)
-- Consolidates: dt_Escalation, dt_Investigation, dt_Checklist
-- ============================================================================

PRINT 'Creating Workflow tables...';

-- Replaces: dt_Escalation (escalation case data)
CREATE TABLE ccms_escalations (
    esc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_escalation_id UNIQUEIDENTIFIER NULL,   -- Maps to dt_Escalation.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    source_id INT,
    nature_id INT,
    assigned_to VARCHAR(50),
    status VARCHAR(20),
    priority VARCHAR(20),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    closed_at DATETIME2,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_Esc_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_escalations_legacy_id ON ccms_escalations(legacy_escalation_id) WHERE legacy_escalation_id IS NOT NULL;

-- Replaces: dt_Escalation_Source (escalation source lookup)
CREATE TABLE ccms_escalation_source (
    source_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_source_id UNIQUEIDENTIFIER NULL,       -- Maps to dt_Escalation_Source.ID (for data migration verification)
    source_code VARCHAR(20),
    source_description VARCHAR(100),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_escalation_source_legacy_id ON ccms_escalation_source(legacy_source_id) WHERE legacy_source_id IS NOT NULL;

-- Replaces: dt_Escalation_Nature (escalation nature lookup)
CREATE TABLE ccms_escalation_nature (
    nature_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_nature_id UNIQUEIDENTIFIER NULL,       -- Maps to dt_Escalation_Nature.ID (for data migration verification)
    nature_code VARCHAR(20),
    nature_description VARCHAR(100),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_escalation_nature_legacy_id ON ccms_escalation_nature(legacy_nature_id) WHERE legacy_nature_id IS NOT NULL;

-- Replaces: dt_Escalation_Update (escalation progress updates)
CREATE TABLE ccms_escalation_updates (
    update_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_escalation_update_id UNIQUEIDENTIFIER NULL, -- Maps to dt_Escalation_Update.ID (for data migration verification)
    esc_id BIGINT NOT NULL,
    update_description NVARCHAR(MAX),
    updated_by VARCHAR(50),
    updated_at DATETIME2 DEFAULT GETDATE(),
    remarks NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    CONSTRAINT FK_EscUpdate_Esc FOREIGN KEY (esc_id) REFERENCES ccms_escalations(esc_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_escalation_updates_legacy_id ON ccms_escalation_updates(legacy_escalation_update_id) WHERE legacy_escalation_update_id IS NOT NULL;

-- Replaces: dt_Escalation_Settlement (escalation settlement details)
CREATE TABLE ccms_escalation_settlement (
    settlement_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_settlement_id UNIQUEIDENTIFIER NULL,   -- Maps to dt_Escalation_Settlement.ID (for data migration verification)
    esc_id BIGINT NOT NULL,
    settlement_amount MONEY,
    settlement_date DATETIME2,
    settlement_status VARCHAR(50),
    approved_by VARCHAR(50),
    approved_at DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_EscSettle_Esc FOREIGN KEY (esc_id) REFERENCES ccms_escalations(esc_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_escalation_settlement_legacy_id ON ccms_escalation_settlement(legacy_settlement_id) WHERE legacy_settlement_id IS NOT NULL;

-- Replaces: dt_Investigation (investigation case data)
CREATE TABLE ccms_investigations (
    ix_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_investigation_id UNIQUEIDENTIFIER NULL, -- Maps to dt_Investigation.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    ix_status VARCHAR(50),
    clinic_id BIGINT,
    findings NVARCHAR(MAX),
    request_payment_amt MONEY,
    is_pec_found BIT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_IX_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_investigations_legacy_id ON ccms_investigations(legacy_investigation_id) WHERE legacy_investigation_id IS NOT NULL;

-- Replaces: dt_Investigation_Request (investigation document requests)
CREATE TABLE ccms_investigation_request (
    request_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_investigation_request_id UNIQUEIDENTIFIER NULL, -- Maps to dt_Investigation_Request.ID (for data migration verification)
    ix_id BIGINT NOT NULL,
    request_type VARCHAR(50),
    request_date DATETIME2,
    requested_from NVARCHAR(255),
    expected_date DATETIME2,
    received_date DATETIME2,
    status VARCHAR(50),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_IXRequest_IX FOREIGN KEY (ix_id) REFERENCES ccms_investigations(ix_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_investigation_request_legacy_id ON ccms_investigation_request(legacy_investigation_request_id) WHERE legacy_investigation_request_id IS NOT NULL;

-- Replaces: dt_Investigation_Request_History (request status change history)
CREATE TABLE ccms_investigation_request_history (
    history_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_request_history_id UNIQUEIDENTIFIER NULL, -- Maps to dt_Investigation_Request_History.ID (for data migration verification)
    request_id BIGINT NOT NULL,
    status_change VARCHAR(50),
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    CONSTRAINT FK_IXReqHist_Req FOREIGN KEY (request_id) REFERENCES ccms_investigation_request(request_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_investigation_request_history_legacy_id ON ccms_investigation_request_history(legacy_request_history_id) WHERE legacy_request_history_id IS NOT NULL;

-- Replaces: dt_Investigation_Call_Log (investigation call tracking)
CREATE TABLE ccms_investigation_call_log (
    call_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_call_log_id UNIQUEIDENTIFIER NULL,     -- Maps to dt_Investigation_Call_Log.ID (for data migration verification)
    ix_id BIGINT NOT NULL,
    call_date DATETIME2,
    called_party NVARCHAR(255),
    call_duration INT,
    call_notes NVARCHAR(MAX),
    called_by VARCHAR(50),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_IXCall_IX FOREIGN KEY (ix_id) REFERENCES ccms_investigations(ix_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_investigation_call_log_legacy_id ON ccms_investigation_call_log(legacy_call_log_id) WHERE legacy_call_log_id IS NOT NULL;

-- Replaces: dt_Checklist (dynamic checklist items)
CREATE TABLE ccms_checklists (
    checklist_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_checklist_id UNIQUEIDENTIFIER NULL,    -- Maps to dt_Checklist.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    checklist_type VARCHAR(50),
    check_key VARCHAR(100),
    check_value NVARCHAR(MAX),
    updated_by VARCHAR(50),
    updated_at DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    CONSTRAINT FK_Checklist_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_checklists_legacy_id ON ccms_checklists(legacy_checklist_id) WHERE legacy_checklist_id IS NOT NULL;

PRINT '  ✓ Workflow tables created (10 tables)';
GO

-- ============================================================================
-- SECTION 8: REMINDERS & DOCUMENTS
-- Consolidates: dt_Documents, dt_Reminder_MQ_HOSP, dt_Reminder_MQ_PH,
-- DT_QUERY_CATEGORY, DT_QUERY_DETAILS
-- ============================================================================

PRINT 'Creating Reminders & Documents tables...';

-- Replaces: dt_Documents (file attachments/uploads)
CREATE TABLE ccms_documents (
    doc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_document_id UNIQUEIDENTIFIER NULL,     -- Maps to dt_Documents.ID (for data migration verification)
    ref_type VARCHAR(20),
    ref_id BIGINT NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    file_data VARBINARY(MAX),
    doc_category VARCHAR(50),
    file_path NVARCHAR(MAX),      -- For storage on disk/cloud (alternative to file_data)
    file_extension VARCHAR(10),
    file_size_bytes BIGINT,
    is_deleted BIT DEFAULT 0,
    uploaded_at DATETIME2 DEFAULT GETDATE(),
    uploaded_by VARCHAR(50),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_documents_legacy_id ON ccms_documents(legacy_document_id) WHERE legacy_document_id IS NOT NULL;

-- Replaces: dt_Reminder_MQ_HOSP, dt_Reminder_MQ_PH (reminder tracking header)
-- Note: REMINDER_REMARKS from legacy tables → stored in ccms_remarks table (ref_type='REMINDER')
-- Note: Document references (REF_DOC_FILEID, REPLY_REF_DOC_FILEID) → stored in ccms_documents table
CREATE TABLE ccms_reminders (
    reminder_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_reminder_id UNIQUEIDENTIFIER NULL,     -- Maps to dt_Reminder_MQ_HOSP.ID or dt_Reminder_MQ_PH.ID (for data migration verification)
    ref_type VARCHAR(20),                 -- REMINDER_HOSP, REMINDER_PH, or other reminder types
    ref_id BIGINT NOT NULL,               -- ID of the reminder instance
    reminder_level INT,
    reminder_type VARCHAR(50),            -- MQ_SOURCE value (e.g., INCOMPLETE_ADMISSION_FORM, MEDICAL_QUESTIONNAIRE)
    sent_at DATETIME2,
    status VARCHAR(20),                   -- PENDING, SENT, ACKNOWLEDGED, RECEIVED, etc.
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_reminders_legacy_id ON ccms_reminders(legacy_reminder_id) WHERE legacy_reminder_id IS NOT NULL;

-- Replaces: DT_QUERY_CATEGORY (medical query template header/configuration)
CREATE TABLE ccms_query_templates (
    template_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_query_template_id UNIQUEIDENTIFIER NULL, -- Maps to DT_QUERY_CATEGORY.ID (for data migration verification)
    template_code VARCHAR(100) NOT NULL UNIQUE,
    template_category VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(20), -- HOSP (Hospital), PH (Policy Holder)
    mode VARCHAR(20), -- OL (Online), etc.
    header_message NVARCHAR(MAX),
    footer_message NVARCHAR(MAX),
    email_subject VARCHAR(255),
    template_path VARCHAR(500),
    reminder_days INT,
    auto_reminder_days INT,
    status VARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_query_templates_legacy_id ON ccms_query_templates(legacy_query_template_id) WHERE legacy_query_template_id IS NOT NULL;

-- Replaces: DT_QUERY_DETAILS (medical query template questions)
CREATE TABLE ccms_query_template_questions (
    question_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_query_question_id UNIQUEIDENTIFIER NULL, -- Maps to DT_QUERY_DETAILS.ID (for data migration verification)
    template_id BIGINT NOT NULL,
    question_text NVARCHAR(MAX) NOT NULL,
    required_lines INT DEFAULT 0, -- Number of lines for response area (0 = single line)
    sort_order INT DEFAULT 0,
    status VARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_QueryQuestion_Template FOREIGN KEY (template_id) REFERENCES ccms_query_templates(template_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_query_template_questions_legacy_id ON ccms_query_template_questions(legacy_query_question_id) WHERE legacy_query_question_id IS NOT NULL;

PRINT '  ✓ Reminders & Documents tables created (4 tables)';
GO

-- ============================================================================
-- SECTION 9: STOP LOSS MODULE
-- Consolidates: dt_StopLoss_Data
-- ============================================================================

PRINT 'Creating Stop Loss tables...';

-- Replaces: dt_StopLoss_Data (stop loss calculations)
CREATE TABLE ccms_stop_loss_data (
    sl_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_stop_loss_id UNIQUEIDENTIFIER NULL,    -- Maps to dt_StopLoss_Data.ID (for data migration verification)
    product_id BIGINT,
    period_type VARCHAR(10),
    period_date DATE,
    total_policy_count INT,
    total_gross_premium MONEY,
    claims_ol MONEY,
    claims_reim MONEY,
    tpa_fees MONEY,
    is_history_record BIT DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_SL_Prod FOREIGN KEY (product_id) REFERENCES ccms_products(product_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_stop_loss_data_legacy_id ON ccms_stop_loss_data(legacy_stop_loss_id) WHERE legacy_stop_loss_id IS NOT NULL;

PRINT '  ✓ Stop Loss tables created (1 table)';
GO

-- ============================================================================
-- SECTION 10: CLAIMS TRACKING & STATUS MANAGEMENT
-- Consolidates: dt_Claim_Status_Log, dt_Claim_Milestone, dt_Claim_Duration
-- ============================================================================

PRINT 'Creating Claims Tracking tables...';

-- Replaces: dt_Claim_Status_Log (claim status change history)
CREATE TABLE ccms_claim_status_log (
    log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_status_log_id UNIQUEIDENTIFIER NULL,   -- Maps to dt_Claim_Status_Log.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE(),
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_StatusLog_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_claim_status_log_legacy_id ON ccms_claim_status_log(legacy_status_log_id) WHERE legacy_status_log_id IS NOT NULL;

-- Replaces: dt_Claim_Milestone (processing milestone tracking)
CREATE TABLE ccms_claim_processing_milestones (
    milestone_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_milestone_id UNIQUEIDENTIFIER NULL,    -- Maps to dt_Claim_Milestone.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    milestone_name VARCHAR(100),
    milestone_date DATETIME2,
    created_by VARCHAR(50),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_Milestone_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_claim_processing_milestones_legacy_id ON ccms_claim_processing_milestones(legacy_milestone_id) WHERE legacy_milestone_id IS NOT NULL;

-- Replaces: dt_Claim_Duration (claim processing time tracking)
CREATE TABLE ccms_claim_durations (
    duration_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_duration_id UNIQUEIDENTIFIER NULL,     -- Maps to dt_Claim_Duration.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    start_date DATETIME2,
    end_date DATETIME2,
    duration_days INT,
    status VARCHAR(50),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_Duration_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_claim_durations_legacy_id ON ccms_claim_durations(legacy_duration_id) WHERE legacy_duration_id IS NOT NULL;

PRINT '  ✓ Claims Tracking tables created (3 tables)';
GO

-- ============================================================================
-- SECTION 11: FWD BENEFIT ACCUMULATION
-- Consolidates: dt_FWD_Accumulation_Client, dt_FWD_Accumulation_Disability,
-- dt_FWD_Accumulation_Onetime, dt_FWD_Accumulation_PA
-- ============================================================================

PRINT 'Creating FWD Accumulation tables...';

-- Replaces: dt_FWD_Accumulation_Client (client benefit accumulation)
CREATE TABLE ccms_fwd_accumulation_client (
    client_acc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_fwd_client_acc_id UNIQUEIDENTIFIER NULL, -- Maps to dt_FWD_Accumulation_Client.ID (for data migration verification)
    member_id BIGINT NOT NULL,
    fwd_client_no VARCHAR(50),
    period_year INT,
    period_month INT,
    accumulated_amount MONEY,
    as_at_date DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_FWDAccClient_Member FOREIGN KEY (member_id) REFERENCES ccms_members(member_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_fwd_accumulation_client_legacy_id ON ccms_fwd_accumulation_client(legacy_fwd_client_acc_id) WHERE legacy_fwd_client_acc_id IS NOT NULL;

-- Replaces: dt_FWD_Accumulation_Disability (disability benefit accumulation)
CREATE TABLE ccms_fwd_accumulation_disability (
    disability_acc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_fwd_disability_acc_id UNIQUEIDENTIFIER NULL, -- Maps to dt_FWD_Accumulation_Disability.ID (for data migration verification)
    disability_code VARCHAR(50),
    period_year INT,
    period_month INT,
    accumulated_amount MONEY,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_fwd_accumulation_disability_legacy_id ON ccms_fwd_accumulation_disability(legacy_fwd_disability_acc_id) WHERE legacy_fwd_disability_acc_id IS NOT NULL;

-- Replaces: dt_FWD_Accumulation_Onetime (one-time benefit accumulation)
CREATE TABLE ccms_fwd_accumulation_onetime (
    onetime_acc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_fwd_onetime_acc_id UNIQUEIDENTIFIER NULL, -- Maps to dt_FWD_Accumulation_Onetime.ID (for data migration verification)
    member_id BIGINT NOT NULL,
    fwd_member_no VARCHAR(50),
    benefit_code VARCHAR(50),
    accumulated_amount MONEY,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_FWDAccOnetime_Member FOREIGN KEY (member_id) REFERENCES ccms_members(member_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_fwd_accumulation_onetime_legacy_id ON ccms_fwd_accumulation_onetime(legacy_fwd_onetime_acc_id) WHERE legacy_fwd_onetime_acc_id IS NOT NULL;

-- Replaces: dt_FWD_Accumulation_PA (PA-specific benefit accumulation)
CREATE TABLE ccms_fwd_accumulation_pa (
    pa_acc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_fwd_pa_acc_id UNIQUEIDENTIFIER NULL,   -- Maps to dt_FWD_Accumulation_PA.ID (for data migration verification)
    pa_id BIGINT NOT NULL,
    claim_id BIGINT NOT NULL,
    accumulated_amount MONEY,
    as_at_date DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_FWDAccPA_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id),
    CONSTRAINT FK_FWDAccPA_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_fwd_accumulation_pa_legacy_id ON ccms_fwd_accumulation_pa(legacy_fwd_pa_acc_id) WHERE legacy_fwd_pa_acc_id IS NOT NULL;

PRINT '  ✓ FWD Accumulation tables created (4 tables)';
GO

-- ============================================================================
-- SECTION 12: ADMISSION AUDIT & LOGGING
-- Consolidates: dt_Admission_Log, dt_SMS_Tran
-- ============================================================================

PRINT 'Creating Audit & Logging tables...';

-- Replaces: dt_Admission_Log (admission change audit trail)
CREATE TABLE ccms_admission_log (
    log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_admission_log_id UNIQUEIDENTIFIER NULL, -- Maps to dt_Admission_Log.ID (for data migration verification)
    admission_id BIGINT NOT NULL,
    change_type VARCHAR(50),
    change_description NVARCHAR(MAX),
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_AdmLog_Admission FOREIGN KEY (admission_id) REFERENCES ccms_admissions(admission_id)
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_admission_log_legacy_id ON ccms_admission_log(legacy_admission_log_id) WHERE legacy_admission_log_id IS NOT NULL;

-- Replaces: dt_SMS_Tran
CREATE TABLE ccms_log_notifications (
    log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id BIGINT,
    member_id BIGINT,
    notification_type VARCHAR(50),
    recipient_target NVARCHAR(255),
    message_content NVARCHAR(MAX),
    send_status VARCHAR(50),
    sent_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL,
    CONSTRAINT FK_LogNotif_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

PRINT '  ✓ Audit & Logging tables created (2 tables)';
GO

-- ============================================================================
-- SECTION 13: SYSTEM & SECURITY (WITHOUT LEGACY PERMISSIONS)
-- Consolidated: dt_Users, dt_Audit_Log, dt_System_Version, dt_FileNo
-- Removed: dt_User_Permissions (replaced by ACL system)
-- ============================================================================

PRINT 'Creating System & Security tables...';

-- Replaces: dt_Users (user accounts) - v6: removed role_id and permissions_json
CREATE TABLE ccms_users (
    user_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_user_id UNIQUEIDENTIFIER NULL,         -- Maps to dt_Users.ID (for data migration verification)
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name NVARCHAR(255),
    is_active BIT DEFAULT 1,
    last_login DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_users_legacy_id ON ccms_users(legacy_user_id) WHERE legacy_user_id IS NOT NULL;

-- Note: ccms_user_permissions table REMOVED - replaced by ACL system (ccms_acl_* tables)

-- Replaces: dt_Audit_Log (system-wide audit trail)
CREATE TABLE ccms_audit_logs (
    audit_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_audit_log_id UNIQUEIDENTIFIER NULL,    -- Maps to dt_Audit_Log.ID (for data migration verification)
    table_name VARCHAR(100),
    record_id BIGINT,
    action_type VARCHAR(20),
    old_value NVARCHAR(MAX),
    new_value NVARCHAR(MAX),
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_audit_logs_legacy_id ON ccms_audit_logs(legacy_audit_log_id) WHERE legacy_audit_log_id IS NOT NULL;

-- Replaces: dt_System_Version (schema version tracking)
CREATE TABLE ccms_system_version (
    version_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_version_id UNIQUEIDENTIFIER NULL,      -- Maps to dt_System_Version ID (for data migration verification)
    version_no VARCHAR(20),
    release_notes NVARCHAR(MAX),
    applied_at DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);
CREATE UNIQUE NONCLUSTERED INDEX UQ_ccms_system_version_legacy_id ON ccms_system_version(legacy_version_id) WHERE legacy_version_id IS NOT NULL;

-- Replaces: dt_FileNo (Stores last running number for various prefixes)
CREATE TABLE ccms_sys_doc_sequences (
    sequence_code VARCHAR(50) PRIMARY KEY, -- e.g. 'CLAIM_REF', 'BATCH_NO'
    description NVARCHAR(255),
    prefix_format VARCHAR(20),             -- e.g. 'RE/{YYYY}/{MM}/'
    current_value BIGINT DEFAULT 0,
    last_updated DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME2 NULL,
    updated_by VARCHAR(50) NULL
);

PRINT '  ✓ System & Security tables created (4 tables - NO legacy permissions)';
GO

-- ============================================================================
-- SECTION 14: ACL (ACCESS CONTROL LIST) - ENTERPRISE RBAC SYSTEM
-- Purpose: Role-based access control with modular permissions
-- Structure: Users → Roles → Permissions → Modules → Actions
-- ============================================================================

PRINT '';
PRINT '================================================================';
PRINT 'CREATING ACL (ACCESS CONTROL LIST) PERMISSION SYSTEM';
PRINT '================================================================';
PRINT '';

-- ============================================================================
-- ACL 1: ROLES TABLE (Access Control List)
-- Purpose: Stores system and business roles for RBAC
-- Note: role_id=1 is Super Admin (system role, cannot be deleted)
-- ============================================================================
CREATE TABLE ccms_acl_roles (
    role_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    role_name NVARCHAR(100) NOT NULL UNIQUE,           -- Display name, e.g.: 'Super Admin', 'Claims Manager'
    role_code NVARCHAR(50) NOT NULL UNIQUE,            -- Code for API checks, e.g.: 'SUPER_ADMIN', 'CLAIMS_MGR'
    description NVARCHAR(500) NULL,                    -- Role purpose and responsibilities
    is_system_role BIT NOT NULL DEFAULT 0,             -- Flag: 1=System role (protected), 0=Business role (editable)
    is_active BIT NOT NULL DEFAULT 1,                  -- Flag: 1=Active, 0=Deactivated
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL,
    created_by VARCHAR(50) NULL,
    updated_by VARCHAR(50) NULL
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_roles_code ON ccms_acl_roles(role_code);
CREATE NONCLUSTERED INDEX idx_ccms_acl_roles_active ON ccms_acl_roles(is_active);

-- ============================================================================
-- ACL 2: CATEGORIES TABLE (Access Control List)
-- Purpose: Groups related modules in the navigation menu
-- Example: 'System Administration' contains User, Role, Module Management
-- ============================================================================
CREATE TABLE ccms_acl_categories (
    category_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    category_name NVARCHAR(100) NOT NULL UNIQUE,       -- Display name, e.g.: 'System Administration', 'Claims Processing'
    category_code NVARCHAR(50) NOT NULL UNIQUE,        -- Code for API checks, e.g.: 'SYSTEM_ADMIN', 'CLAIMS'
    description NVARCHAR(500) NULL,                    -- Category purpose and scope
    icon NVARCHAR(50) NULL,                            -- Icon class, e.g.: 'fa-cog', 'fa-shield-alt'
    display_order INT NOT NULL DEFAULT 0,              -- Menu order (lower numbers appear first)
    is_active BIT NOT NULL DEFAULT 1,                  -- Flag: 1=Visible in menu, 0=Hidden
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL,
    created_by VARCHAR(50) NULL,                       -- Who created this category (user_id as string)
    updated_by VARCHAR(50) NULL                        -- Who last modified this category (user_id as string)
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_categories_code ON ccms_acl_categories(category_code);
CREATE NONCLUSTERED INDEX idx_ccms_acl_categories_active ON ccms_acl_categories(is_active);
CREATE NONCLUSTERED INDEX idx_ccms_acl_categories_order ON ccms_acl_categories(display_order);

-- ============================================================================
-- ACL 3: MODULES TABLE (Access Control List)
-- Purpose: Application features/pages that can be secured with permissions
-- Note: Modules with category_id=NULL appear as top-level menu items (e.g., Dashboard)
-- ============================================================================
CREATE TABLE ccms_acl_modules (
    module_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    module_name NVARCHAR(100) NOT NULL UNIQUE,         -- Display name, e.g.: 'User Management', 'Claims Processing'
    module_code NVARCHAR(50) NOT NULL UNIQUE,          -- Code for API checks, e.g.: 'USER_MGMT', 'CLAIMS_PROC'
    description NVARCHAR(500) NULL,                    -- Module functionality description
    category_id BIGINT NULL,                           -- FK to categories (NULL=top-level like Dashboard)
    icon NVARCHAR(50) NULL,                            -- Icon class, e.g.: 'fa-users', 'fa-file-medical'
    route NVARCHAR(200) NULL,                          -- Frontend route, e.g.: '/admin/users', '/claims'
    display_order INT NOT NULL DEFAULT 0,              -- Order within category (lower first)
    is_active BIT NOT NULL DEFAULT 1,                  -- Flag: 1=Visible & accessible, 0=Hidden
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL,
    created_by VARCHAR(50) NULL,                       -- Who created this module (user_id as string)
    updated_by VARCHAR(50) NULL,                       -- Who last modified this module (user_id as string)
    
    CONSTRAINT fk_ccms_acl_modules_category FOREIGN KEY (category_id) 
        REFERENCES ccms_acl_categories(category_id)
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_modules_code ON ccms_acl_modules(module_code);
CREATE NONCLUSTERED INDEX idx_ccms_acl_modules_active ON ccms_acl_modules(is_active);
CREATE NONCLUSTERED INDEX idx_ccms_acl_modules_category ON ccms_acl_modules(category_id);

-- ============================================================================
-- ACL 4: ACTIONS TABLE (Access Control List)
-- Purpose: Generic operations that can be performed (VIEW, CREATE, UPDATE, DELETE, etc.)
-- Note: Actions are reusable across modules via ccms_acl_module_actions bridge table
-- ============================================================================
CREATE TABLE ccms_acl_actions (
    action_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    action_name NVARCHAR(100) NOT NULL UNIQUE,         -- Display name, e.g.: 'View', 'Create', 'Delete', 'Approve'
    action_code NVARCHAR(50) NOT NULL UNIQUE,          -- Code for checks, e.g.: 'VIEW', 'CREATE', 'DELETE'
    description NVARCHAR(500) NULL,                    -- What this action allows
    is_active BIT NOT NULL DEFAULT 1,                  -- Flag: 1=Available, 0=Disabled system-wide
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL,
    created_by VARCHAR(50) NULL,                       -- Who created this action (user_id as string)
    updated_by VARCHAR(50) NULL                        -- Who last modified this action (user_id as string)
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_actions_code ON ccms_acl_actions(action_code);
CREATE NONCLUSTERED INDEX idx_ccms_acl_actions_active ON ccms_acl_actions(is_active);

-- ============================================================================
-- ACL 5: MODULE ACTIONS TABLE (ACL Bridge Table)
-- Purpose: Links actions to specific modules with optional custom labels
-- Example: Module='User Management' + Action='CREATE' = 'Create User' permission
-- ============================================================================
CREATE TABLE ccms_acl_module_actions (
    module_action_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    module_id BIGINT NOT NULL,                         -- FK to modules
    action_id BIGINT NOT NULL,                         -- FK to actions
    action_label NVARCHAR(200) NULL,                   -- Custom label, e.g.: 'Create New User' (optional)
    is_active BIT NOT NULL DEFAULT 1,                  -- Flag: 1=Available for assignment, 0=Disabled
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL,                         -- When this module-action link was last modified
    created_by VARCHAR(50) NULL,                       -- Who created this module-action link (user_id as string)
    updated_by VARCHAR(50) NULL,                       -- Who last modified this module-action link (user_id as string)
    
    CONSTRAINT fk_ccms_acl_module_actions_module FOREIGN KEY (module_id) 
        REFERENCES ccms_acl_modules(module_id) ON DELETE CASCADE,
    CONSTRAINT fk_ccms_acl_module_actions_action FOREIGN KEY (action_id) 
        REFERENCES ccms_acl_actions(action_id) ON DELETE CASCADE,
    CONSTRAINT uq_ccms_acl_module_actions UNIQUE (module_id, action_id)
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_module_actions_module ON ccms_acl_module_actions(module_id);
CREATE NONCLUSTERED INDEX idx_ccms_acl_module_actions_action ON ccms_acl_module_actions(action_id);
CREATE NONCLUSTERED INDEX idx_ccms_acl_module_actions_active ON ccms_acl_module_actions(is_active);

-- ============================================================================
-- ACL 6: ROLE PERMISSIONS TABLE (ACL Bridge Table)
-- Purpose: Assigns specific module-action permissions to roles
-- Example: Role='Super Admin' has permission for 'User Management.CREATE'
-- ============================================================================
CREATE TABLE ccms_acl_role_permissions (
    permission_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    role_id BIGINT NOT NULL,                           -- FK to roles
    module_action_id BIGINT NOT NULL,                  -- FK to module actions
    granted BIT NOT NULL DEFAULT 1,                    -- Flag: 1=Granted, 0=Explicitly denied
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    created_by VARCHAR(50) NULL,                       -- Who assigned this permission
    
    CONSTRAINT fk_ccms_acl_role_permissions_role FOREIGN KEY (role_id) 
        REFERENCES ccms_acl_roles(role_id) ON DELETE CASCADE,
    CONSTRAINT fk_ccms_acl_role_permissions_module_action FOREIGN KEY (module_action_id) 
        REFERENCES ccms_acl_module_actions(module_action_id) ON DELETE CASCADE,
    CONSTRAINT uq_ccms_acl_role_permissions UNIQUE (role_id, module_action_id)
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_role_permissions_role ON ccms_acl_role_permissions(role_id);
CREATE NONCLUSTERED INDEX idx_ccms_acl_role_permissions_module_action ON ccms_acl_role_permissions(module_action_id);
CREATE NONCLUSTERED INDEX idx_ccms_acl_role_permissions_granted ON ccms_acl_role_permissions(granted);

-- ============================================================================
-- ACL 7: USER ROLES TABLE (ACL Bridge Table)
-- Purpose: Assigns roles to users (many-to-many relationship)
-- Note: Users can have multiple active roles; permissions are combined
-- ============================================================================
CREATE TABLE ccms_acl_user_roles (
    user_role_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,                           -- FK to users
    role_id BIGINT NOT NULL,                           -- FK to roles
    is_active BIT NOT NULL DEFAULT 1,                  -- Flag: 1=Active, 0=Suspended
    assigned_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    assigned_by VARCHAR(50) NULL,                      -- Who assigned this role
    expires_at DATETIME2 NULL,                         -- Expiry date (NULL=permanent)
    
    CONSTRAINT fk_ccms_acl_user_roles_role FOREIGN KEY (role_id) 
        REFERENCES ccms_acl_roles(role_id) ON DELETE CASCADE,
    CONSTRAINT fk_ccms_acl_user_roles_user FOREIGN KEY (user_id) 
        REFERENCES ccms_users(user_id) ON DELETE CASCADE,
    CONSTRAINT uq_ccms_acl_user_roles UNIQUE (user_id, role_id)
);

CREATE NONCLUSTERED INDEX idx_ccms_acl_user_roles_user ON ccms_acl_user_roles(user_id);
CREATE NONCLUSTERED INDEX idx_ccms_acl_user_roles_role ON ccms_acl_user_roles(role_id);
CREATE NONCLUSTERED INDEX idx_ccms_acl_user_roles_active ON ccms_acl_user_roles(is_active);
CREATE NONCLUSTERED INDEX idx_ccms_acl_user_roles_expires ON ccms_acl_user_roles(expires_at);

PRINT '  ✓ ACL tables created (7 tables)';
GO

-- ============================================================================
-- SECTION 15: INDEXES FOR PERFORMANCE
-- ============================================================================

PRINT '';
PRINT 'Creating performance indexes...';

CREATE INDEX IX_Claims_Member ON ccms_claims(member_id);
CREATE INDEX IX_Claims_Hospital ON ccms_claims(hospital_id);
CREATE INDEX IX_Claims_Status ON ccms_claims(claim_status, is_deleted);
CREATE INDEX IX_Claims_CreatedAt ON ccms_claims(created_at DESC);

CREATE INDEX IX_Admissions_Claim ON ccms_admissions(claim_id);
CREATE INDEX IX_Admissions_Status ON ccms_admissions(admission_status);

CREATE INDEX IX_PaymentAdvice_Claim ON ccms_payment_advice(claim_id);
CREATE INDEX IX_PaymentAdvice_Status ON ccms_payment_advice(payment_status);

CREATE INDEX IX_MemberPolicies_Member ON ccms_member_policies(member_id);
CREATE INDEX IX_MemberPolicies_Product ON ccms_member_policies(product_id);

CREATE INDEX IX_ClaimStatusLog_Claim ON ccms_claim_status_log(claim_id);
CREATE INDEX IX_ClaimStatusLog_Time ON ccms_claim_status_log(changed_at DESC);

CREATE INDEX IX_Remarks_Ref ON ccms_remarks(ref_type, ref_id);
CREATE INDEX IX_Remarks_CreatedAt ON ccms_remarks(created_at DESC);

CREATE INDEX IX_AuditLogs_Table ON ccms_audit_logs(table_name, record_id);
CREATE INDEX IX_AuditLogs_Time ON ccms_audit_logs(changed_at DESC);

PRINT '  ✓ Performance indexes created';
PRINT '';

GO

-- ============================================================================
-- SECTION 15: ACL SEED DATA, VIEWS & STORED PROCEDURES
-- ============================================================================

PRINT '';
PRINT '================================================================';
PRINT 'SECTION 15: ACL SEED DATA, VIEWS & STORED PROCEDURES';
PRINT '================================================================';
PRINT '';

-- ============================================================================
-- SEED DATA: ACL Roles (Access Control List - Enterprise RBAC)
-- ============================================================================

PRINT 'Seeding ACL Roles...';

SET IDENTITY_INSERT ccms_acl_roles ON;

INSERT INTO ccms_acl_roles (role_id, role_name, role_code, description, is_system_role, is_active) VALUES
(1, 'Super Admin', 'SUPER_ADMIN', 'Full system access with all permissions', 1, 1);

SET IDENTITY_INSERT ccms_acl_roles OFF;

PRINT '  ✓ Seeded 1 role (Super Admin)';

-- ============================================================================
-- SEED DATA: ACL Categories
-- ============================================================================

PRINT 'Seeding ACL Categories...';

SET IDENTITY_INSERT ccms_acl_categories ON;

INSERT INTO ccms_acl_categories (category_id, category_name, category_code, description, icon, display_order) VALUES
(1, 'System Administration', 'SYSTEM_ADMIN', 'System administration and permission control', 'cog', 100);

SET IDENTITY_INSERT ccms_acl_categories OFF;

PRINT '  ✓ Seeded 1 category (System Administration)';

-- ============================================================================
-- SEED DATA: ACL Modules
-- ============================================================================

PRINT 'Seeding ACL Modules...';

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

PRINT '  ✓ Seeded 9 modules (Dashboard + 8 ACL management modules)';

-- ============================================================================
-- SEED DATA: ACL Actions
-- ============================================================================

PRINT 'Seeding ACL Actions...';

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

PRINT '  ✓ Seeded 17 actions (VIEW, CREATE, UPDATE, DELETE, etc.)';

-- ============================================================================
-- SEED DATA: ACL Module-Action Mappings
-- ============================================================================

PRINT 'Seeding ACL Module-Action Mappings...';

-- Get module and action IDs for mapping
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
DECLARE @attachRoleActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'ATTACH_ROLE');
DECLARE @detachRoleActionId BIGINT = (SELECT action_id FROM ccms_acl_actions WHERE action_code = 'DETACH_ROLE');

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
(@userRoleAssignModuleId, @attachRoleActionId, 'Assign Role'),
(@userRoleAssignModuleId, @updateActionId, 'Update Assignment'),
(@userRoleAssignModuleId, @detachRoleActionId, 'Revoke Role'),
(@categoryMgmtModuleId, @viewActionId, 'View Categories'),
(@categoryMgmtModuleId, @createActionId, 'Create Category'),
(@categoryMgmtModuleId, @updateActionId, 'Update Category'),
(@categoryMgmtModuleId, @deleteActionId, 'Delete Category');

PRINT '  ✓ Seeded 33 module-action mappings';

-- ============================================================================
-- SEED DATA: ACL Role Permissions (Grant Super Admin all permissions)
-- ============================================================================

PRINT 'Seeding ACL Role Permissions...';

-- Grant Super Admin all module-action permissions
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

DECLARE @PermissionCount INT = (SELECT COUNT(*) FROM ccms_acl_role_permissions WHERE role_id = 1);
PRINT '  ✓ Granted ' + CAST(@PermissionCount AS VARCHAR) + ' permissions to Super Admin role';

-- ============================================================================
-- ACL VIEWS: User and Role Permission Views
-- ============================================================================

PRINT 'Creating ACL Views...';

-- View: User Permissions (shows all permissions for all users)
IF OBJECT_ID('vw_acl_user_permissions', 'V') IS NOT NULL DROP VIEW vw_acl_user_permissions;
GO

CREATE VIEW vw_acl_user_permissions AS
SELECT 
    u.user_id,
    u.username,
    u.full_name,
    r.role_id,
    r.role_name,
    r.role_code,
    c.category_id,
    c.category_name,
    c.category_code,
    c.icon as category_icon,
    c.display_order as category_display_order,
    m.module_id,
    m.module_name,
    m.module_code,
    m.icon as module_icon,
    m.route as module_route,
    m.display_order as module_display_order,
    a.action_id,
    a.action_name,
    a.action_code,
    ma.module_action_id,
    ma.action_label,
    rp.permission_id,
    rp.granted,
    r.is_active as role_active,
    ur.assigned_at as role_assigned_at,
    ur.expires_at as role_expires_at,
    CASE 
        WHEN ur.expires_at IS NULL OR ur.expires_at > GETDATE() THEN 1 
        ELSE 0 
    END as is_permission_active
FROM ccms_users u
INNER JOIN ccms_acl_user_roles ur ON u.user_id = ur.user_id
INNER JOIN ccms_acl_roles r ON ur.role_id = r.role_id AND r.is_active = 1
INNER JOIN ccms_acl_role_permissions rp ON r.role_id = rp.role_id
INNER JOIN ccms_acl_module_actions ma ON rp.module_action_id = ma.module_action_id
INNER JOIN ccms_acl_modules m ON ma.module_id = m.module_id AND m.is_active = 1
LEFT JOIN ccms_acl_categories c ON m.category_id = c.category_id
INNER JOIN ccms_acl_actions a ON ma.action_id = a.action_id
WHERE u.is_active = 1 AND ur.is_active = 1;
GO

PRINT '  ✓ Created view: vw_acl_user_permissions';

-- View: Role Permissions (shows all permissions for each role)
IF OBJECT_ID('vw_acl_role_permissions', 'V') IS NOT NULL DROP VIEW vw_acl_role_permissions;
GO

CREATE VIEW vw_acl_role_permissions AS
SELECT 
    r.role_id,
    r.role_name,
    r.role_code,
    r.description as role_description,
    r.is_system_role,
    c.category_id,
    c.category_name,
    c.category_code,
    c.icon as category_icon,
    c.display_order as category_display_order,
    m.module_id,
    m.module_name,
    m.module_code,
    m.icon as module_icon,
    m.route as module_route,
    m.display_order as module_display_order,
    a.action_id,
    a.action_name,
    a.action_code,
    ma.module_action_id,
    ma.action_label,
    rp.permission_id,
    rp.granted,
    rp.created_at as permission_assigned_at
FROM ccms_acl_roles r
INNER JOIN ccms_acl_role_permissions rp ON r.role_id = rp.role_id
INNER JOIN ccms_acl_module_actions ma ON rp.module_action_id = ma.module_action_id
INNER JOIN ccms_acl_modules m ON ma.module_id = m.module_id AND m.is_active = 1
LEFT JOIN ccms_acl_categories c ON m.category_id = c.category_id
INNER JOIN ccms_acl_actions a ON ma.action_id = a.action_id
WHERE r.is_active = 1;
GO

PRINT '  ✓ Created view: vw_acl_role_permissions';

-- ============================================================================
-- ACL STORED PROCEDURES: Permission Check & Management
-- ============================================================================

PRINT 'Creating ACL Stored Procedures...';

-- Procedure: Check if user has specific permission
IF OBJECT_ID('sp_check_user_permission', 'P') IS NOT NULL DROP PROCEDURE sp_check_user_permission;
GO

CREATE PROCEDURE sp_check_user_permission
    @user_id BIGINT,
    @module_code NVARCHAR(50),
    @action_code NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 1 
            ELSE 0 
        END as HasPermission
    FROM vw_acl_user_permissions
    WHERE user_id = @user_id
        AND module_code = @module_code
        AND action_code = @action_code
        AND granted = 1
        AND is_permission_active = 1;
END;
GO

PRINT '  ✓ Created procedure: sp_check_user_permission';

-- Procedure: Get all permissions for a user as JSON
IF OBJECT_ID('sp_get_user_permissions_json', 'P') IS NOT NULL DROP PROCEDURE sp_get_user_permissions_json;
GO

CREATE PROCEDURE sp_get_user_permissions_json
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        category_name,
        module_name,
        module_route,
        action_code,
        granted
    FROM vw_acl_user_permissions
    WHERE user_id = @UserId
        AND granted = 1
        AND is_permission_active = 1
    ORDER BY category_name, module_name, action_code
    FOR JSON PATH, ROOT('permissions');
END;
GO

PRINT '  ✓ Created procedure: sp_get_user_permissions_json';

-- Procedure: Assign role to user
IF OBJECT_ID('sp_assign_role_to_user', 'P') IS NOT NULL DROP PROCEDURE sp_assign_role_to_user;
GO

CREATE PROCEDURE sp_assign_role_to_user
    @UserId INT,
    @RoleId INT,
    @AssignedBy INT,
    @ExpiresAt DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if assignment already exists
    IF EXISTS (SELECT 1 FROM ccms_acl_user_roles 
               WHERE user_id = @UserId AND role_id = @RoleId)
    BEGIN
        -- Update existing assignment
        UPDATE ccms_acl_user_roles
        SET assigned_by = @AssignedBy,
            assigned_at = GETDATE(),
            expires_at = @ExpiresAt
        WHERE user_id = @UserId AND role_id = @RoleId;
        
        SELECT 'Role assignment updated successfully' as Message;
    END
    ELSE
    BEGIN
        -- Insert new assignment
        INSERT INTO ccms_acl_user_roles (user_id, role_id, assigned_by, expires_at)
        VALUES (@UserId, @RoleId, @AssignedBy, @ExpiresAt);
        
        SELECT 'Role assigned successfully' as Message;
    END
END;
GO

PRINT '  ✓ Created procedure: sp_assign_role_to_user';

PRINT '';
PRINT '================================================================';
PRINT 'SECTION 15 COMPLETED: ACL SEED DATA, VIEWS & PROCEDURES';
PRINT '================================================================';
PRINT '';

GO

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

PRINT '';
PRINT '================================================================';
PRINT '✅ CCMS SCHEMA v6 CREATED SUCCESSFULLY!';
PRINT '================================================================';
PRINT '';
PRINT 'SCHEMA SUMMARY:';
PRINT '  • Total Tables: 78';
PRINT '    - Business Tables: 71';
PRINT '    - ACL Tables: 7';
PRINT '  • Replaces: 164 Legacy Tables';
PRINT '  • Architecture: Full Normalized + Enterprise RBAC';
PRINT '';
PRINT 'BUSINESS TABLES (71):';
PRINT '  Section 1: Master Lookups & Configuration (5 tables)';
PRINT '  Section 2: Providers (6 tables)';
PRINT '  Section 3: Products & Members (9 tables)';
PRINT '  Section 4: Claims & Admissions (8 tables)';
PRINT '  Section 5: Financials (10 tables)';
PRINT '  Section 6: Uploads & External Sync (8 tables)';
PRINT '  Section 7: Workflow Modules (10 tables)';
PRINT '  Section 8: Reminders & Documents (4 tables)';
PRINT '  Section 9: Stop Loss (1 table)';
PRINT '  Section 10: Claims Tracking (3 tables)';
PRINT '  Section 11: FWD Accumulation (4 tables)';
PRINT '  Section 12: Audit & Logging (2 tables)';
PRINT '  Section 13: System & Security (4 tables)';
PRINT '';
PRINT 'ACL TABLES (7) - Access Control List:';
PRINT '  1. ccms_acl_roles - System and business roles';
PRINT '  2. ccms_acl_categories - Module categories for navigation';
PRINT '  3. ccms_acl_modules - Application features/pages';
PRINT '  4. ccms_acl_actions - Generic operations (VIEW, CREATE, etc.)';
PRINT '  5. ccms_acl_module_actions - Module-action mappings';
PRINT '  6. ccms_acl_role_permissions - Role-permission assignments';
PRINT '  7. ccms_acl_user_roles - User-role assignments';
PRINT '';
PRINT 'KEY IMPROVEMENTS IN v6:';
PRINT '  ✅ Removed legacy ccms_user_permissions table';
PRINT '  ✅ Removed role_id column from ccms_users';
PRINT '  ✅ Removed permissions_json column from ccms_users';
PRINT '  ✅ Added enterprise-grade RBAC with ACL tables';
PRINT '  ✅ Multiple roles per user support';
PRINT '  ✅ Role expiration support';
PRINT '  ✅ Module-based permission organization';
PRINT '  ✅ Category-based navigation structure';
PRINT '  ✅ Granular action-level access control';
PRINT '  ✅ ACL seed data, views, and procedures included';
PRINT '';
PRINT 'ACL COMPONENTS INCLUDED IN v6:';
PRINT '  ✅ Seed Data: 1 role (Super Admin), 1 category, 9 modules, 17 actions';
PRINT '  ✅ Module-Action Mappings: 33 combinations';
PRINT '  ✅ Super Admin Permissions: All 33 permissions granted';
PRINT '  ✅ Views: vw_acl_user_permissions, vw_acl_role_permissions';
PRINT '  ✅ Procedures: sp_check_user_permission, sp_get_user_permissions_json, sp_assign_role_to_user';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '  1. Run users-seed-data.sql to create Super Admin user';
PRINT '  2. Verify ACL setup: SELECT * FROM ccms_acl_roles;';
PRINT '  3. Verify permissions: SELECT * FROM vw_acl_role_permissions WHERE role_id = 1;';
PRINT '  4. Test permission check: EXEC sp_check_user_permission @user_id=1, @module_code=''DASHBOARD'', @action_code=''VIEW'';';
PRINT '  5. Begin data migration from legacy system';
PRINT '';
PRINT '================================================================';
PRINT 'Schema creation completed at: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '================================================================';
PRINT '';
GO
