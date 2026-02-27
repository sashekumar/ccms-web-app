/*
==============================================================================
CCMS (CLAIMS & CASE MANAGEMENT SYSTEM) - FULL NORMALIZED SCHEMA (v5)
Total Tables: 72 (New) vs 164 (Legacy)
ALL TABLES NORMALIZED
==============================================================================
*/

-- 1. MASTER LOOKUPS & CONFIGURATION
-- Consolidates: dt_Config, dt_Email_Config, DT_STATE, dt_Admission_Types, 
-- dt_Master_Reject_Diagnosis, DT_IC, DT_SUB_IC, DT_IC_INDEX
------------------------------------------------------------------------------

-- Replaces: Multiple legacy lookup tables (dt_Admission_Types, dt_Master_Reject_Diagnosis, DT_IC, DT_SUB_IC, etc.)
CREATE TABLE ccms_m_lookup_categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_category_id UNIQUEIDENTIFIER UNIQUE,    -- Maps to legacy lookup category source (for data migration verification)
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(255),
    is_active BIT DEFAULT 1
);

-- Replaces: All legacy lookup tables (dt_Admission_Types, dt_Master_Reject_Diagnosis, DT_IC, DT_SUB_IC, DT_IC_INDEX, DT_STATE)
CREATE TABLE ccms_m_lookups (
    lookup_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_lookup_id UNIQUEIDENTIFIER UNIQUE,     -- Maps to original lookup record from legacy tables (for data migration verification)
    category_id INT NOT NULL,
    lookup_code VARCHAR(50) NOT NULL,
    lookup_value NVARCHAR(MAX) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Lookup_Category FOREIGN KEY (category_id) REFERENCES ccms_m_lookup_categories(category_id),
    CONSTRAINT UQ_Lookup_Code UNIQUE (category_id, lookup_code)
);

-- Replaces: Extra attributes from legacy lookup tables (e.g., insurer-specific codes, additional metadata)
CREATE TABLE ccms_m_lookup_metadata (
    metadata_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    lookup_id INT NOT NULL,
    metadata_key VARCHAR(100) NOT NULL,
    metadata_value NVARCHAR(MAX),
    CONSTRAINT FK_LookupMeta_Lookup FOREIGN KEY (lookup_id) REFERENCES ccms_m_lookups(lookup_id),
    CONSTRAINT UQ_LookupMeta_Key UNIQUE (lookup_id, metadata_key)
);

-- Replaces: dt_Bank_Details (core bank data)
CREATE TABLE ccms_m_banks (
    bank_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_bank_id UNIQUEIDENTIFIER UNIQUE,       -- Maps to dt_Bank_Details.ID (for data migration verification)
    bank_name NVARCHAR(255) NOT NULL UNIQUE,
    bank_code VARCHAR(50),
    is_active BIT DEFAULT 1
);

-- Replaces: dt_Config (clause-related config entries)
CREATE TABLE ccms_m_clauses (
    clause_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_config_id UNIQUEIDENTIFIER UNIQUE,     -- Maps to dt_Config.ID (for data migration verification)
    clause_category VARCHAR(50),
    clause_code VARCHAR(20) NOT NULL UNIQUE,
    clause_text NVARCHAR(MAX),
    is_active BIT DEFAULT 1
);

-- 2. PROVIDERS (HOSPITALS & DOCTORS)
-- Consolidates: dt_Hospital, DT_HOSPITAL_CONTACTS, dt_Hospital_Doctors, 
-- dt_Fee_Schedule, dt_TPAFee, dt_WakalahFee, dt_Doctor_Remarks
------------------------------------------------------------------------------

-- Replaces: dt_Hospital (core hospital/provider data)
CREATE TABLE ccms_hospitals (
    hospital_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_hospital_id UNIQUEIDENTIFIER UNIQUE,   -- Maps to dt_Hospital.ID (for data migration verification)
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

-- Replaces: dt_Hospital (address fields normalized out)
CREATE TABLE ccms_hospital_addresses (
    address_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_hospital_address_id UNIQUEIDENTIFIER UNIQUE, -- Maps to address record from dt_Hospital (for data migration verification)
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
    CONSTRAINT FK_HospAddr_Hosp FOREIGN KEY (hospital_id) REFERENCES ccms_hospitals(hospital_id)
);

-- Replaces: dt_Hospital (insurer-specific codes normalized out: ZURICH_HOSP_CODE, FWD_HOSP_CODE, etc.)
CREATE TABLE ccms_hospital_codes (
    code_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_hospital_code_id UNIQUEIDENTIFIER UNIQUE, -- Maps to code record from dt_Hospital (for data migration verification)
    hospital_id BIGINT NOT NULL,
    code_type VARCHAR(50), -- ZURICH_HOSP_CODE, FWD_HOSP_CODE, INSURER_CODE
    code_value VARCHAR(100),
    is_active BIT DEFAULT 1,
    CONSTRAINT FK_HospCode_Hosp FOREIGN KEY (hospital_id) REFERENCES ccms_hospitals(hospital_id),
    CONSTRAINT UQ_HospCode UNIQUE (hospital_id, code_type)
);

-- Replaces: dt_Hospital_Doctors
CREATE TABLE ccms_hospital_staff (
    staff_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_hospital_staff_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_Hospital_Doctors.ID (for data migration verification)
    hospital_id BIGINT NOT NULL,
    staff_name NVARCHAR(255) NOT NULL,
    staff_type VARCHAR(50),
    specialty NVARCHAR(255),
    is_active BIT DEFAULT 1,
    CONSTRAINT FK_Staff_Hosp FOREIGN KEY (hospital_id) REFERENCES ccms_hospitals(hospital_id)
);

-- Replaces: DT_HOSPITAL_CONTACTS, dt_Hospital_Doctors (contact fields normalized out)
CREATE TABLE ccms_hospital_staff_contacts (
    contact_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_hospital_contact_id UNIQUEIDENTIFIER UNIQUE, -- Maps to DT_HOSPITAL_CONTACTS.ID (for data migration verification)
    staff_id BIGINT NOT NULL,
    contact_type VARCHAR(50), -- EMAIL, MOBILE, PHONE, EXT
    contact_value VARCHAR(100),
    is_primary BIT DEFAULT 0,
    CONSTRAINT FK_StaffContact_Staff FOREIGN KEY (staff_id) REFERENCES ccms_hospital_staff(staff_id)
);

-- Replaces: dt_Fee_Schedule, dt_TPAFee, dt_WakalahFee
CREATE TABLE ccms_fee_schedules (
    fee_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_fee_schedule_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_Fee_Schedule.ID or dt_TPAFee.ID or dt_WakalahFee.ID (for data migration verification)
    hospital_id BIGINT,
    fee_type VARCHAR(50), -- TPA, Wakalah, MMA
    item_code VARCHAR(50),
    description NVARCHAR(MAX),
    amount MONEY,
    effective_date DATE,
    expiry_date DATE,
    is_active BIT DEFAULT 1,
    CONSTRAINT FK_Fee_Hosp FOREIGN KEY (hospital_id) REFERENCES ccms_hospitals(hospital_id)
);

-- 3. PRODUCTS & MEMBERS
-- Consolidates: dt_Product, dt_Product_Details, dt_Product_Downgrade_Mapping,
-- dt_PolicyHolder, dt_PolicyHolder_Dependents, dt_PolicyHolder_Policy, 
-- dt_policyno_details, dt_Policy_Change_Mapping, DT_PH_DEP_PEC
------------------------------------------------------------------------------

-- Replaces: dt_Product (core product/plan data)
CREATE TABLE ccms_products (
    product_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_product_id UNIQUEIDENTIFIER UNIQUE,     -- Maps to dt_Product.ID (for data migration verification)
    insurer_name NVARCHAR(255),
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    plan_name NVARCHAR(255),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Replaces: dt_Product_Details (limit fields normalized out)
CREATE TABLE ccms_product_limits (
    limit_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_product_limit_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_Product_Details limit record (for data migration verification)
    product_id BIGINT NOT NULL,
    limit_type VARCHAR(50), -- ANNUAL, LIFETIME, ROOM_BOARD, SURGICAL
    limit_amount MONEY,
    is_active BIT DEFAULT 1,
    CONSTRAINT FK_ProdLimit_Prod FOREIGN KEY (product_id) REFERENCES ccms_products(product_id)
);

-- Replaces: dt_Product_Details (copay fields normalized out)
CREATE TABLE ccms_product_copay (
    copay_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_product_copay_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_Product_Details copay record (for data migration verification)
    product_id BIGINT NOT NULL,
    copay_type VARCHAR(50), -- PERCENTAGE, FIXED
    copay_value DECIMAL(10,2),
    applies_to NVARCHAR(255), -- Description of what this copay applies to
    is_active BIT DEFAULT 1,
    CONSTRAINT FK_ProdCopay_Prod FOREIGN KEY (product_id) REFERENCES ccms_products(product_id)
);

-- Replaces: dt_PolicyHolder (core member/policyholder data)
CREATE TABLE ccms_members (
    member_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_member_id UNIQUEIDENTIFIER UNIQUE,      -- Maps to dt_PolicyHolder.ID (for data migration verification)
    external_guid UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID(),
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

-- Replaces: dt_PolicyHolder (address fields normalized out)
CREATE TABLE ccms_member_addresses (
    address_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_member_address_id UNIQUEIDENTIFIER UNIQUE, -- Maps to address record from dt_PolicyHolder (for data migration verification)
    member_id BIGINT NOT NULL,
    address_type VARCHAR(50) DEFAULT 'PRIMARY',
    street_line1 NVARCHAR(255),
    street_line2 NVARCHAR(255),
    city NVARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    is_primary BIT DEFAULT 0,
    CONSTRAINT FK_MemAddr_Mem FOREIGN KEY (member_id) REFERENCES ccms_members(member_id)
);

-- Replaces: dt_PolicyHolder (contact fields normalized out: EMAIL, MOBILE, PHONE, FAX)
CREATE TABLE ccms_member_contacts (
    contact_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_member_contact_id UNIQUEIDENTIFIER UNIQUE, -- Maps to contact record from dt_PolicyHolder (for data migration verification)
    member_id BIGINT NOT NULL,
    contact_type VARCHAR(50), -- EMAIL, MOBILE, PHONE, FAX
    contact_value VARCHAR(100),
    is_primary BIT DEFAULT 0,
    CONSTRAINT FK_MemContact_Mem FOREIGN KEY (member_id) REFERENCES ccms_members(member_id)
);

-- Replaces: dt_PolicyHolder_Policy, dt_policyno_details
CREATE TABLE ccms_member_policies (
    policy_record_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_policy_id UNIQUEIDENTIFIER UNIQUE,      -- Maps to dt_PolicyHolder_Policy.ID (for data migration verification)
    member_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    policy_no VARCHAR(100) NOT NULL,
    effective_date DATE,
    expiry_date DATE,
    status VARCHAR(50),
    is_deleted BIT DEFAULT 0,
    CONSTRAINT FK_Pol_Mem FOREIGN KEY (member_id) REFERENCES ccms_members(member_id),
    CONSTRAINT FK_Pol_Prod FOREIGN KEY (product_id) REFERENCES ccms_products(product_id)
);

-- Replaces: dt_PolicyHolder_Dependents
CREATE TABLE ccms_member_dependents (
    dependent_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_dependent_id UNIQUEIDENTIFIER UNIQUE,   -- Maps to dt_PolicyHolder_Dependents.ID (for data migration verification)
    principal_member_id BIGINT NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    ic_no VARCHAR(20),
    relationship_id INT,
    dob DATE,
    is_active BIT DEFAULT 1,
    CONSTRAINT FK_Dep_Princ FOREIGN KEY (principal_member_id) REFERENCES ccms_members(member_id)
);

-- Replaces: DT_PH_DEP_PEC
CREATE TABLE ccms_member_pec_conditions (
    pec_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_pec_id UNIQUEIDENTIFIER UNIQUE,         -- Maps to DT_PH_DEP_PEC.ID (for data migration verification)
    dependent_id BIGINT NOT NULL,
    condition_code VARCHAR(50),
    condition_name NVARCHAR(255),
    diagnosis_date DATE,
    is_excluded BIT DEFAULT 1,
    notes NVARCHAR(MAX),
    CONSTRAINT FK_PEC_Dep FOREIGN KEY (dependent_id) REFERENCES ccms_member_dependents(dependent_id)
);

-- 4. CLAIMS & ADMISSIONS (The Core Workflow)
------------------------------------------------------------------------------

-- Replaces: dt_Claim (core claim/reimbursement data)
CREATE TABLE ccms_claims (
    claim_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_claim_id UNIQUEIDENTIFIER UNIQUE,       -- Maps to dt_Claim.ID (for data migration verification)
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
    document_received_at DATETIME2;
    CONSTRAINT FK_Claim_Member FOREIGN KEY (member_id) REFERENCES ccms_members(member_id),
    CONSTRAINT FK_Claim_Policy FOREIGN KEY (policy_record_id) REFERENCES ccms_member_policies(policy_record_id),
    CONSTRAINT FK_Claim_Hospital FOREIGN KEY (hospital_id) REFERENCES ccms_hospitals(hospital_id)
);

-- Replaces: dt_Admission (GL/admission-specific data)
CREATE TABLE ccms_admissions (
    admission_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_admission_id UNIQUEIDENTIFIER UNIQUE,   -- Maps to dt_Admission.ID (for data migration verification)
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

-- Replaces: dt_Admission_Assessment (dynamic assessment fields normalized to EAV pattern)
CREATE TABLE ccms_admission_assessments (
    assessment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_assessment_id UNIQUEIDENTIFIER UNIQUE,  -- Maps to dt_Admission_Assessment record (for data migration verification)
    admission_id BIGINT NOT NULL,
    field_name VARCHAR(100),
    field_value NVARCHAR(MAX),
    CONSTRAINT FK_Assess_Adm FOREIGN KEY (admission_id) REFERENCES ccms_admissions(admission_id),
    CONSTRAINT UQ_Assessment UNIQUE (admission_id, field_name)
);

-- Replaces: dt_Claim_Remarks, dt_Reminder_MQ_HOSP.REMINDER_REMARKS, dt_Reminder_MQ_PH.REMINDER_REMARKS
-- Generic polymorphic remarks table supporting multiple entity types
CREATE TABLE ccms_remarks (
    remark_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_remark_id UNIQUEIDENTIFIER UNIQUE,      -- Maps to dt_Claim_Remarks.ID or reminder remarks (for data migration verification)
    ref_type VARCHAR(50) NOT NULL,        -- CLAIM, ADMISSION, ESCALATION, INVESTIGATION, PA, REMINDER, etc.
    ref_id BIGINT NOT NULL,               -- ID of the referenced entity
    ref_desc VARCHAR(100),                -- Description/title of reference
    action_for VARCHAR(50),               -- Purpose: INVESTIGATION, APPROVAL, CLARIFICATION, FOLLOW_UP, MQ_RESPONSE, etc.
    remark_text NVARCHAR(MAX),            -- The actual remark content
    created_by VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_by VARCHAR(50),
    updated_at DATETIME2
);

-- Replaces: dt_Config (LOS alert configuration)
CREATE TABLE ccms_los_alert_thresholds (
    threshold_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_los_threshold_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_Config LOS threshold record (for data migration verification)
    product_id BIGINT,
    diagnosis_category VARCHAR(100),
    threshold_days INT,
    alert_level INT,
    is_active BIT DEFAULT 1,
    CONSTRAINT FK_LOSThreshold_Prod FOREIGN KEY (product_id) REFERENCES ccms_products(product_id)
);

-- Replaces: dt_LOS_Alert (Length of Stay alerts)
CREATE TABLE ccms_los_alerts (
    alert_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_los_alert_id UNIQUEIDENTIFIER UNIQUE,    -- Maps to dt_LOS_Alert.ID (for data migration verification)
    admission_id BIGINT NOT NULL,
    alert_level INT,
    triggered_at DATETIME2 DEFAULT GETDATE(),
    current_los INT,
    threshold_days INT,
    status VARCHAR(20),
    acknowledged_by VARCHAR(50),
    acknowledged_at DATETIME2,
    notes NVARCHAR(MAX),
    CONSTRAINT FK_LOSAlert_Adm FOREIGN KEY (admission_id) REFERENCES ccms_admissions(admission_id)
);

-- Replaces: dt_8HM_Monitoring (8-hour monitoring checks)
CREATE TABLE ccms_8hm_monitoring (
    monitoring_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_8hm_monitoring_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_8HM_Monitoring.ID (for data migration verification)
    admission_id BIGINT NOT NULL,
    check_time DATETIME2,
    hours_elapsed INT,
    status VARCHAR(50),
    checked_by VARCHAR(50),
    notes NVARCHAR(MAX),
    next_check_due DATETIME2,
    CONSTRAINT FK_8HM_Adm FOREIGN KEY (admission_id) REFERENCES ccms_admissions(admission_id)
);

-- 5. FINANCIALS (PAYMENT ADVICE)
------------------------------------------------------------------------------

-- Replaces: dt_Payment_Advice (core payment advice data)
CREATE TABLE ccms_payment_advice (
    pa_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_pa_id UNIQUEIDENTIFIER UNIQUE,          -- Maps to dt_Payment_Advice.ID (for data migration verification)
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
    physical_folder_status VARCHAR(50);
    CONSTRAINT FK_PA_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- Replaces: dt_PA_Details (payment advice line items)
CREATE TABLE ccms_pa_line_items (
    item_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_pa_line_item_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_PA_Details.ID (for data migration verification)
    pa_id BIGINT NOT NULL,
    benefit_name NVARCHAR(255),
    billed_amt MONEY,
    approved_amt MONEY,
    non_reimb_reason NVARCHAR(MAX),
    is_consultation_breakdown BIT DEFAULT 0,
    CONSTRAINT FK_PALine_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);

-- Replaces: dt_PA_SOB_Summary (statement of benefit summary)
CREATE TABLE ccms_pa_summary (
    summary_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_pa_summary_id UNIQUEIDENTIFIER UNIQUE,   -- Maps to dt_PA_SOB_Summary.ID (for data migration verification)
    pa_id BIGINT NOT NULL,
    sob_type VARCHAR(50),
    sob_category VARCHAR(100),
    amount_ia MONEY,
    amount_ra MONEY,
    amount_nra MONEY,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_PASummary_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);

-- Replaces: dt_PA_Consultation_Breakdown (consultation charges breakdown)
CREATE TABLE ccms_pa_consultation_breakdown (
    consultation_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_consultation_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_PA_Consultation_Breakdown.ID (for data migration verification)
    pa_id BIGINT NOT NULL,
    consultation_type VARCHAR(100),
    consultation_amount MONEY,
    doctor_id BIGINT,
    consultation_date DATE,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Consultation_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);

-- Replaces: dt_PA_Consultation_Breakdown_History (consultation changes audit trail)
CREATE TABLE ccms_pa_consultation_breakdown_history (
    history_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_consultation_history_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_PA_Consultation_Breakdown_History.ID (for data migration verification)
    consultation_id BIGINT NOT NULL,
    old_amount MONEY,
    new_amount MONEY,
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_ConsultHistory_Cons FOREIGN KEY (consultation_id) REFERENCES ccms_pa_consultation_breakdown(consultation_id)
);

-- Replaces: dt_PA_Uncovered_Charges (non-covered/excluded charges)
CREATE TABLE ccms_pa_uncovered_charges (
    uncovered_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_uncovered_charge_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_PA_Uncovered_Charges.ID (for data migration verification)
    pa_id BIGINT NOT NULL,
    charge_description NVARCHAR(MAX),
    charge_amount MONEY,
    uncovered_reason NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Uncovered_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);

-- Replaces: dt_PA_Payment (payment transactions)
CREATE TABLE ccms_pa_payments (
    payment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_pa_payment_id UNIQUEIDENTIFIER UNIQUE,   -- Maps to dt_PA_Payment.ID (for data migration verification)
    pa_id BIGINT NOT NULL,
    payment_amount MONEY,
    payment_method VARCHAR(50),
    payment_date DATETIME2,
    payment_reference VARCHAR(100),
    payment_status VARCHAR(50),
    member_ic VARCHAR(20),
    member_name NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    CONSTRAINT FK_Payment_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);

-- Replaces: dt_Multi_Payment_Advice (multiple PA header)
CREATE TABLE ccms_multi_payment_advice (
    mpa_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_mpa_id UNIQUEIDENTIFIER UNIQUE,          -- Maps to dt_Multi_Payment_Advice.ID (for data migration verification)
    mpa_ref_no VARCHAR(50) NOT NULL UNIQUE,
    claim_id BIGINT NOT NULL,
    total_amount MONEY,
    pa_count INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    CONSTRAINT FK_MPA_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- Replaces: dt_Multi_Payment_Advice_Details (multiple PA line items)
CREATE TABLE ccms_multi_payment_advice_details (
    mpa_detail_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_mpa_detail_id UNIQUEIDENTIFIER UNIQUE,   -- Maps to dt_Multi_Payment_Advice_Details.ID (for data migration verification)
    mpa_id BIGINT NOT NULL,
    pa_id BIGINT NOT NULL,
    pa_amount MONEY,
    sequence_no INT,
    CONSTRAINT FK_MPADetail_MPA FOREIGN KEY (mpa_id) REFERENCES ccms_multi_payment_advice(mpa_id),
    CONSTRAINT FK_MPADetail_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);

-- 6. UPLOADS & EXTERNAL SYNC
------------------------------------------------------------------------------

-- Replaces: dt_Claim_Upload (file upload tracking)
CREATE TABLE ccms_claim_uploads (
    upload_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_upload_id UNIQUEIDENTIFIER UNIQUE,       -- Maps to dt_Claim_Upload.ID (for data migration verification)
    batch_no VARCHAR(50),
    file_type VARCHAR(50),
    processing_status VARCHAR(20),
    error_details NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Replaces: dt_Claim_Upload_Batch (batch processing header)
CREATE TABLE ccms_claim_upload_batch (
    batch_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_batch_id UNIQUEIDENTIFIER UNIQUE,        -- Maps to dt_Claim_Upload_Batch.ID (for data migration verification)
    batch_no VARCHAR(50) NOT NULL UNIQUE,
    file_type VARCHAR(50),
    upload_date DATETIME2 DEFAULT GETDATE(),
    uploaded_by VARCHAR(50),
    record_count INT,
    processing_status VARCHAR(20),
    error_count INT DEFAULT 0,
    success_count INT DEFAULT 0
);

-- Replaces: dt_Claim_Upload_Notification_Details (notification upload details)
CREATE TABLE ccms_claim_upload_notification_details (
    notification_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_notification_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_Claim_Upload_Notification_Details.ID (for data migration verification)
    batch_id BIGINT NOT NULL,
    claim_id BIGINT NOT NULL,
    insurer_claim_no VARCHAR(50),
    notification_type VARCHAR(50),
    notification_date DATETIME2,
    kiv_status VARCHAR(50),
    kiv_reason NVARCHAR(MAX),
    deleted_by VARCHAR(50),
    deleted_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_NotifDetail_Batch FOREIGN KEY (batch_id) REFERENCES ccms_claim_upload_batch(batch_id),
    CONSTRAINT FK_NotifDetail_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- Replaces: dt_Claim_Upload_Offer (offer upload details)
CREATE TABLE ccms_claim_upload_offer (
    offer_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_offer_id UNIQUEIDENTIFIER UNIQUE,        -- Maps to dt_Claim_Upload_Offer.ID (for data migration verification)
    batch_id BIGINT NOT NULL,
    claim_id BIGINT NOT NULL,
    insurer_claim_no VARCHAR(50),
    offer_amount MONEY,
    offer_date DATETIME2,
    offer_status VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Offer_Batch FOREIGN KEY (batch_id) REFERENCES ccms_claim_upload_batch(batch_id),
    CONSTRAINT FK_Offer_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- Replaces: dt_Claim_Upload_Payment_Details (payment upload details)
CREATE TABLE ccms_claim_upload_payment_details (
    payment_detail_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_payment_detail_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_Claim_Upload_Payment_Details.ID (for data migration verification)
    batch_id BIGINT NOT NULL,
    claim_id BIGINT NOT NULL,
    insurer_claim_no VARCHAR(50),
    approved_amount MONEY,
    paid_amount MONEY,
    short_amount MONEY DEFAULT 0,
    refund_amount MONEY DEFAULT 0,
    short_reason NVARCHAR(MAX),
    payment_date DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_PaymentDetail_Batch FOREIGN KEY (batch_id) REFERENCES ccms_claim_upload_batch(batch_id),
    CONSTRAINT FK_PaymentDetail_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- Replaces: dt_Claim_Upload_Error (upload error tracking)
CREATE TABLE ccms_claim_upload_error (
    error_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_error_id UNIQUEIDENTIFIER UNIQUE,        -- Maps to dt_Claim_Upload_Error.ID (for data migration verification)
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
    CONSTRAINT FK_Error_Batch FOREIGN KEY (batch_id) REFERENCES ccms_claim_upload_batch(batch_id),
    CONSTRAINT FK_Error_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- Replaces: dt_RA_Matrix (risk assessment matrix)
CREATE TABLE ccms_ra_matrix (
    ra_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_ra_id UNIQUEIDENTIFIER UNIQUE,           -- Maps to dt_RA_Matrix.ID (for data migration verification)
    ra_code VARCHAR(20),
    ra_description NVARCHAR(MAX),
    ra_percentage DECIMAL(5,2),
    is_active BIT DEFAULT 1
);

-- 7. WORKFLOW MODULES (ESCALATIONS, INVESTIGATIONS, CHECKLISTS)
------------------------------------------------------------------------------

-- Replaces: dt_Escalation (escalation case data)
CREATE TABLE ccms_escalations (
    esc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_escalation_id UNIQUEIDENTIFIER UNIQUE,   -- Maps to dt_Escalation.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    source_id INT,
    nature_id INT,
    assigned_to VARCHAR(50),
    status VARCHAR(20),
    priority VARCHAR(20),
    created_at DATETIME2 DEFAULT GETDATE(),
    closed_at DATETIME2,
    CONSTRAINT FK_Esc_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- Replaces: dt_Escalation_Source (escalation source lookup)
CREATE TABLE ccms_escalation_source (
    source_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_source_id UNIQUEIDENTIFIER UNIQUE,       -- Maps to dt_Escalation_Source.ID (for data migration verification)
    source_code VARCHAR(20),
    source_description VARCHAR(100),
    is_active BIT DEFAULT 1
);

-- Replaces: dt_Escalation_Nature (escalation nature lookup)
CREATE TABLE ccms_escalation_nature (
    nature_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_nature_id UNIQUEIDENTIFIER UNIQUE,       -- Maps to dt_Escalation_Nature.ID (for data migration verification)
    nature_code VARCHAR(20),
    nature_description VARCHAR(100),
    is_active BIT DEFAULT 1
);

-- Replaces: dt_Escalation_Update (escalation progress updates)
CREATE TABLE ccms_escalation_updates (
    update_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_escalation_update_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_Escalation_Update.ID (for data migration verification)
    esc_id BIGINT NOT NULL,
    update_description NVARCHAR(MAX),
    updated_by VARCHAR(50),
    updated_at DATETIME2 DEFAULT GETDATE(),
    remarks NVARCHAR(MAX),
    CONSTRAINT FK_EscUpdate_Esc FOREIGN KEY (esc_id) REFERENCES ccms_escalations(esc_id)
);

-- Replaces: dt_Escalation_Settlement (escalation settlement details)
CREATE TABLE ccms_escalation_settlement (
    settlement_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_settlement_id UNIQUEIDENTIFIER UNIQUE,   -- Maps to dt_Escalation_Settlement.ID (for data migration verification)
    esc_id BIGINT NOT NULL,
    settlement_amount MONEY,
    settlement_date DATETIME2,
    settlement_status VARCHAR(50),
    approved_by VARCHAR(50),
    approved_at DATETIME2,
    CONSTRAINT FK_EscSettle_Esc FOREIGN KEY (esc_id) REFERENCES ccms_escalations(esc_id)
);

-- Replaces: dt_Investigation (investigation case data)
CREATE TABLE ccms_investigations (
    ix_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_investigation_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_Investigation.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    ix_status VARCHAR(50),
    clinic_id BIGINT,
    findings NVARCHAR(MAX),
    request_payment_amt MONEY,
    is_pec_found BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_IX_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- Replaces: dt_Investigation_Request (investigation document requests)
CREATE TABLE ccms_investigation_request (
    request_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_investigation_request_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_Investigation_Request.ID (for data migration verification)
    ix_id BIGINT NOT NULL,
    request_type VARCHAR(50),
    request_date DATETIME2,
    requested_from NVARCHAR(255),
    expected_date DATETIME2,
    received_date DATETIME2,
    status VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_IXRequest_IX FOREIGN KEY (ix_id) REFERENCES ccms_investigations(ix_id)
);

-- Replaces: dt_Investigation_Request_History (request status change history)
CREATE TABLE ccms_investigation_request_history (
    history_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_request_history_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_Investigation_Request_History.ID (for data migration verification)
    request_id BIGINT NOT NULL,
    status_change VARCHAR(50),
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_IXReqHist_Req FOREIGN KEY (request_id) REFERENCES ccms_investigation_request(request_id)
);

-- Replaces: dt_Investigation_Call_Log (investigation call tracking)
CREATE TABLE ccms_investigation_call_log (
    call_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_call_log_id UNIQUEIDENTIFIER UNIQUE,     -- Maps to dt_Investigation_Call_Log.ID (for data migration verification)
    ix_id BIGINT NOT NULL,
    call_date DATETIME2,
    called_party NVARCHAR(255),
    call_duration INT,
    call_notes NVARCHAR(MAX),
    called_by VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_IXCall_IX FOREIGN KEY (ix_id) REFERENCES ccms_investigations(ix_id)
);

-- Replaces: dt_Checklist (dynamic checklist items)
CREATE TABLE ccms_checklists (
    checklist_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_checklist_id UNIQUEIDENTIFIER UNIQUE,    -- Maps to dt_Checklist.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    checklist_type VARCHAR(50),
    check_key VARCHAR(100),
    check_value NVARCHAR(MAX),
    updated_by VARCHAR(50),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Checklist_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- 8. REMINDERS & DOCUMENTS
------------------------------------------------------------------------------

-- Replaces: dt_Documents (file attachments/uploads)
CREATE TABLE ccms_documents (
    doc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_document_id UNIQUEIDENTIFIER UNIQUE,     -- Maps to dt_Documents.ID (for data migration verification)
    ref_type VARCHAR(20),
    ref_id BIGINT NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    file_data VARBINARY(MAX),
    doc_category VARCHAR(50),
    file_path NVARCHAR(MAX),      -- For storage on disk/cloud (alternative to file_data)
    file_extension VARCHAR(10),
    file_size_bytes BIGINT,
    is_deleted BIT DEFAULT 0;
    uploaded_at DATETIME2 DEFAULT GETDATE(),
    uploaded_by VARCHAR(50)
);

-- Replaces: dt_Reminder_MQ_HOSP, dt_Reminder_MQ_PH (reminder tracking header)
-- Note: REMINDER_REMARKS from legacy tables → stored in ccms_remarks table (ref_type='REMINDER')
-- Note: Document references (REF_DOC_FILEID, REPLY_REF_DOC_FILEID) → stored in ccms_documents table
CREATE TABLE ccms_reminders (
    reminder_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_reminder_id UNIQUEIDENTIFIER UNIQUE,     -- Maps to dt_Reminder_MQ_HOSP.ID or dt_Reminder_MQ_PH.ID (for data migration verification)
    ref_type VARCHAR(20),                 -- REMINDER_HOSP, REMINDER_PH, or other reminder types
    ref_id BIGINT NOT NULL,               -- ID of the reminder instance
    reminder_level INT,
    reminder_type VARCHAR(50),            -- MQ_SOURCE value (e.g., INCOMPLETE_ADMISSION_FORM, MEDICAL_QUESTIONNAIRE)
    sent_at DATETIME2,
    status VARCHAR(20)                    -- PENDING, SENT, ACKNOWLEDGED, RECEIVED, etc.
);

-- 8A. MEDICAL QUERY TEMPLATES (DYNAMIC FORM BUILDER)
-- Replaces: DT_QUERY_CATEGORY, DT_QUERY_DETAILS
------------------------------------------------------------------------------

-- Replaces: DT_QUERY_CATEGORY (medical query template header/configuration)
CREATE TABLE ccms_query_templates (
    template_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_query_template_id UNIQUEIDENTIFIER UNIQUE, -- Maps to DT_QUERY_CATEGORY.ID (for data migration verification)
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
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    updated_at DATETIME2,
    updated_by VARCHAR(50)
);

-- Replaces: DT_QUERY_DETAILS (medical query template questions)
CREATE TABLE ccms_query_template_questions (
    question_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_query_question_id UNIQUEIDENTIFIER UNIQUE, -- Maps to DT_QUERY_DETAILS.ID (for data migration verification)
    template_id BIGINT NOT NULL,
    question_text NVARCHAR(MAX) NOT NULL,
    required_lines INT DEFAULT 0, -- Number of lines for response area (0 = single line)
    sort_order INT DEFAULT 0,
    status VARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    updated_at DATETIME2,
    updated_by VARCHAR(50),
    CONSTRAINT FK_QueryQuestion_Template FOREIGN KEY (template_id) REFERENCES ccms_query_templates(template_id)
);

-- 9. STOP LOSS MODULE
------------------------------------------------------------------------------

-- Replaces: dt_StopLoss_Data (stop loss calculations)
CREATE TABLE ccms_stop_loss_data (
    sl_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_stop_loss_id UNIQUEIDENTIFIER UNIQUE,    -- Maps to dt_StopLoss_Data.ID (for data migration verification)
    product_id BIGINT,
    period_type VARCHAR(10),
    period_date DATE,
    total_policy_count INT,
    total_gross_premium MONEY,
    claims_ol MONEY,
    claims_reim MONEY,
    tpa_fees MONEY,
    is_history_record BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_SL_Prod FOREIGN KEY (product_id) REFERENCES ccms_products(product_id)
);

-- 10. CLAIMS TRACKING & STATUS MANAGEMENT
------------------------------------------------------------------------------

-- Replaces: dt_Claim_Status_Log (claim status change history)
CREATE TABLE ccms_claim_status_log (
    log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_status_log_id UNIQUEIDENTIFIER UNIQUE,   -- Maps to dt_Claim_Status_Log.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE(),
    notes NVARCHAR(MAX),
    CONSTRAINT FK_StatusLog_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- Replaces: dt_Claim_Milestone (processing milestone tracking)
CREATE TABLE ccms_claim_processing_milestones (
    milestone_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_milestone_id UNIQUEIDENTIFIER UNIQUE,    -- Maps to dt_Claim_Milestone.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    milestone_name VARCHAR(100),
    milestone_date DATETIME2,
    created_by VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Milestone_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- Replaces: dt_Claim_Duration (claim processing time tracking)
CREATE TABLE ccms_claim_durations (
    duration_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_duration_id UNIQUEIDENTIFIER UNIQUE,     -- Maps to dt_Claim_Duration.ID (for data migration verification)
    claim_id BIGINT NOT NULL,
    start_date DATETIME2,
    end_date DATETIME2,
    duration_days INT,
    status VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Duration_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- 11. FWD BENEFIT ACCUMULATION
------------------------------------------------------------------------------

-- Replaces: dt_FWD_Accumulation_Client (client benefit accumulation)
CREATE TABLE ccms_fwd_accumulation_client (
    client_acc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_fwd_client_acc_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_FWD_Accumulation_Client.ID (for data migration verification)
    member_id BIGINT NOT NULL,
    fwd_client_no VARCHAR(50),
    period_year INT,
    period_month INT,
    accumulated_amount MONEY,
    as_at_date DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_FWDAccClient_Member FOREIGN KEY (member_id) REFERENCES ccms_members(member_id)
);

-- Replaces: dt_FWD_Accumulation_Disability (disability benefit accumulation)
CREATE TABLE ccms_fwd_accumulation_disability (
    disability_acc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_fwd_disability_acc_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_FWD_Accumulation_Disability.ID (for data migration verification)
    disability_code VARCHAR(50),
    period_year INT,
    period_month INT,
    accumulated_amount MONEY,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Replaces: dt_FWD_Accumulation_Onetime (one-time benefit accumulation)
CREATE TABLE ccms_fwd_accumulation_onetime (
    onetime_acc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_fwd_onetime_acc_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_FWD_Accumulation_Onetime.ID (for data migration verification)
    member_id BIGINT NOT NULL,
    fwd_member_no VARCHAR(50),
    benefit_code VARCHAR(50),
    accumulated_amount MONEY,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_FWDAccOnetime_Member FOREIGN KEY (member_id) REFERENCES ccms_members(member_id)
);

-- Replaces: dt_FWD_Accumulation_PA (PA-specific benefit accumulation)
CREATE TABLE ccms_fwd_accumulation_pa (
    pa_acc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_fwd_pa_acc_id UNIQUEIDENTIFIER UNIQUE,   -- Maps to dt_FWD_Accumulation_PA.ID (for data migration verification)
    pa_id BIGINT NOT NULL,
    claim_id BIGINT NOT NULL,
    accumulated_amount MONEY,
    as_at_date DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_FWDAccPA_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id),
    CONSTRAINT FK_FWDAccPA_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- 12. ADMISSION AUDIT & LOGGING
------------------------------------------------------------------------------

-- Replaces: dt_Admission_Log (admission change audit trail)
CREATE TABLE ccms_admission_log (
    log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_admission_log_id UNIQUEIDENTIFIER UNIQUE, -- Maps to dt_Admission_Log.ID (for data migration verification)
    admission_id BIGINT NOT NULL,
    change_type VARCHAR(50),
    change_description NVARCHAR(MAX),
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_AdmLog_Admission FOREIGN KEY (admission_id) REFERENCES ccms_admissions(admission_id)
);

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
    CONSTRAINT FK_LogNotif_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- 13. SYSTEM & SECURITY
------------------------------------------------------------------------------

-- Replaces: dt_Users (user accounts)
CREATE TABLE ccms_users (
    user_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_user_id UNIQUEIDENTIFIER UNIQUE,         -- Maps to dt_Users.ID (for data migration verification)
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name NVARCHAR(255),
    role_id INT,
    is_active BIT DEFAULT 1,
    last_login DATETIME2
);

-- Replaces: dt_User_Permissions (user access rights)
CREATE TABLE ccms_user_permissions (
    permission_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_permission_id UNIQUEIDENTIFIER UNIQUE,   -- Maps to dt_User_Permissions.ID (for data migration verification)
    user_id BIGINT NOT NULL,
    permission_code VARCHAR(100),
    granted_at DATETIME2 DEFAULT GETDATE(),
    granted_by VARCHAR(50),
    CONSTRAINT FK_UserPerm_User FOREIGN KEY (user_id) REFERENCES ccms_users(user_id),
    CONSTRAINT UQ_UserPerm UNIQUE (user_id, permission_code)
);

-- Replaces: dt_Audit_Log (system-wide audit trail)
CREATE TABLE ccms_audit_logs (
    audit_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    legacy_audit_log_id UNIQUEIDENTIFIER UNIQUE,    -- Maps to dt_Audit_Log.ID (for data migration verification)
    table_name VARCHAR(100),
    record_id BIGINT,
    action_type VARCHAR(20),
    old_value NVARCHAR(MAX),
    new_value NVARCHAR(MAX),
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE()
);

-- Replaces: dt_System_Version (schema version tracking)
CREATE TABLE ccms_system_version (
    version_id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_version_id UNIQUEIDENTIFIER UNIQUE,      -- Maps to dt_System_Version ID (for data migration verification)
    version_no VARCHAR(20),
    release_notes NVARCHAR(MAX),
    applied_at DATETIME2 DEFAULT GETDATE()
);

-- Replaces: dt_FileNo (Stores last running number for various prefixes)
CREATE TABLE ccms_sys_doc_sequences (
    sequence_code VARCHAR(50) PRIMARY KEY, -- e.g. 'CLAIM_REF', 'BATCH_NO'
    description NVARCHAR(255),
    prefix_format VARCHAR(20),             -- e.g. 'RE/{YYYY}/{MM}/'
    current_value BIGINT DEFAULT 0,
    last_updated DATETIME2 DEFAULT GETDATE()
);

-- 14. INDEXES FOR PERFORMANCE
------------------------------------------------------------------------------

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