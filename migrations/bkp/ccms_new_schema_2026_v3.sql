/*
==============================================================================
CCMS (CLAIMS & CASE MANAGEMENT SYSTEM) - FULL CONSOLIDATED SCHEMA
==============================================================================
*/

-- 1. MASTER LOOKUPS & CONFIGURATION
-- Consolidates: dt_Config, dt_Email_Config, DT_STATE, dt_Admission_Types, 
-- dt_Master_Reject_Diagnosis, DT_IC, DT_SUB_IC, DT_IC_INDEX, DT_QUERY_CATEGORY
------------------------------------------------------------------------------

CREATE TABLE ccms_m_lookup_categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE -- e.g. 'CLAIM_STATUS', 'DIAGNOSIS_TYPE', 'STATE'
);

CREATE TABLE ccms_m_lookups (
    lookup_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT NOT NULL,
    lookup_code VARCHAR(50) NOT NULL,
    lookup_value NVARCHAR(MAX) NOT NULL,
    extra_metadata NVARCHAR(MAX), -- For mapping ZURICH_ID, FWD_ID, or limits
    is_active BIT DEFAULT 1,
    CONSTRAINT FK_Lookup_Category FOREIGN KEY (category_id) REFERENCES ccms_m_lookup_categories(category_id)
);

CREATE TABLE ccms_m_banks (
    bank_id INT IDENTITY(1,1) PRIMARY KEY,
    bank_name NVARCHAR(255) NOT NULL,
    bank_code VARCHAR(50),
    is_active BIT DEFAULT 1
);

CREATE TABLE ccms_m_clauses (
    clause_id INT IDENTITY(1,1) PRIMARY KEY,
    clause_category VARCHAR(50), -- Reim, Policy, Exclusion
    clause_code VARCHAR(20),
    clause_text NVARCHAR(MAX),
    is_active BIT DEFAULT 1
);

-- 2. PROVIDERS (HOSPITALS & DOCTORS)
-- Consolidates: dt_Hospital, DT_HOSPITAL_CONTACTS, dt_Hospital_Doctors, 
-- dt_Fee_Schedule, dt_TPAFee, dt_WakalahFee, dt_Doctor_Remarks
------------------------------------------------------------------------------

CREATE TABLE ccms_hospitals (
    hospital_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    hospital_name NVARCHAR(255) NOT NULL,
    hospital_code VARCHAR(50),
    hospital_type VARCHAR(50), -- Private, Government, NGO
    reg_no VARCHAR(50),
    bank_id INT,
    bank_acc_no VARCHAR(50),
    address_json NVARCHAR(MAX), 
    codes_json NVARCHAR(MAX), -- Unified storage for ZURICH_HOSP_CODE, FWD_HOSP_CODE
    is_panel BIT DEFAULT 0,
    panel_status VARCHAR(50), -- ACTIVE, SUSPENDED, TERMINATED
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

CREATE TABLE ccms_hospital_staff (
    staff_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    hospital_id BIGINT NOT NULL,
    staff_name NVARCHAR(255) NOT NULL,
    staff_type VARCHAR(50), -- 'DOCTOR', 'ADMIN', 'CONTACT'
    specialty NVARCHAR(255),
    contact_json NVARCHAR(MAX), -- Email, Mobile, Ext
    CONSTRAINT FK_Staff_Hosp FOREIGN KEY (hospital_id) REFERENCES ccms_hospitals(hospital_id)
);

CREATE TABLE ccms_fee_schedules (
    fee_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    hospital_id BIGINT,
    fee_type VARCHAR(50), -- 'TPA', 'Wakalah', 'MMA'
    item_code VARCHAR(50),
    description NVARCHAR(MAX),
    amount MONEY,
    effective_date DATE,
    CONSTRAINT FK_Fee_Hosp FOREIGN KEY (hospital_id) REFERENCES ccms_hospitals(hospital_id)
);
---MMA need to look further

-- 3. PRODUCTS & MEMBERS
-- Consolidates: dt_Product, dt_Product_Details, dt_Product_Downgrade_Mapping,
-- dt_PolicyHolder, dt_PolicyHolder_Dependents, dt_PolicyHolder_Policy, 
-- dt_policyno_details, dt_Policy_Change_Mapping, DT_PH_DEP_PEC, Sync_* tables
------------------------------------------------------------------------------

CREATE TABLE ccms_products (
    product_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    insurer_name NVARCHAR(255),
    plan_code VARCHAR(50) NOT NULL,
    limits_json NVARCHAR(MAX), -- Annual, Lifetime, Room & Board limits
    co_pay_json NVARCHAR(MAX),
    is_active BIT DEFAULT 1
);

CREATE TABLE ccms_members (
    member_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    external_guid UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID(),
    full_name NVARCHAR(255) NOT NULL,
    ic_no VARCHAR(20) NOT NULL UNIQUE,
    fwd_member_no VARCHAR(50),
    fwd_client_no VARCHAR(50),
    client_id VARCHAR(50),
    dob DATE,
    gender BIT,
    member_type VARCHAR(50), -- PRINCIPAL, DEPENDENT
    member_status VARCHAR(50),
    bank_id INT,
    bank_acc_no VARCHAR(50),
    contact_json NVARCHAR(MAX),
    address_json NVARCHAR(MAX),
    enrollment_date DATETIME2 DEFAULT GETDATE(),
    termination_date DATE,
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    updated_at DATETIME2,
    updated_by VARCHAR(50),
    is_deleted BIT DEFAULT 0
);

CREATE TABLE ccms_member_policies (
    policy_record_id BIGINT IDENTITY(1,1) PRIMARY KEY,
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

CREATE TABLE ccms_member_dependents (
    dependent_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    principal_member_id BIGINT NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    ic_no VARCHAR(20),
    relationship_id INT, 
    dob DATE,
    pec_details NVARCHAR(MAX), -- Consolidated Pre-Existing Conditions
    is_active BIT DEFAULT 1,
    CONSTRAINT FK_Dep_Princ FOREIGN KEY (principal_member_id) REFERENCES ccms_members(member_id)
);

-- 4. CLAIMS & ADMISSIONS (The Core Workflow)
-- Consolidates: dt_Claim_Reg, dt_Claim_Reg_Pending, DT_CLAIM_REG_DELETED, 
-- dt_Claim_Reg_Status, dt_Claim_Remarks, dt_Claim_FileNo_Changes, dt_Claim_RequireUW
-- dt_PolicyHolder_Admission, DT_POLICYHOLDER_ADMISSION_DELETED, dt_Deferment,
-- dt_Alert_Listing_LOS, dt_Patient_Alert_Listing, dt_avgclaimsize
------------------------------------------------------------------------------

CREATE TABLE ccms_claims (
    claim_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_ref_no VARCHAR(50) NOT NULL UNIQUE,
    fwd_claim_ref_no VARCHAR(50), -- FWD insurer claim reference
    file_no VARCHAR(50),
    member_id BIGINT NOT NULL,
    patient_type VARCHAR(20), -- 'PRINCIPAL', 'DEPENDENT'
    patient_id BIGINT, 
    policy_record_id BIGINT,
    hospital_id BIGINT,
    doctor_id BIGINT,
    diagnosis_id BIGINT,
    disability_code VARCHAR(50),
    disability_category VARCHAR(100),
    claim_status_id INT, -- Links to ccms_m_lookups (Pending, Reg, Deleted, etc)
    claim_status VARCHAR(50),
    claim_mode VARCHAR(20), -- Cashless / Reim
    priority_level INT DEFAULT 0, -- 1=High, 2=Medium, 3=Low
    total_billed MONEY DEFAULT 0,
    total_approved MONEY DEFAULT 0,
    pre_auth_required BIT DEFAULT 0,
    pre_auth_no VARCHAR(50),
    rejection_type VARCHAR(50),
    rejection_reason NVARCHAR(MAX),
    rejection_date DATETIME2,
    sla_days INT,
    sla_deadline DATETIME2,
    sla_status VARCHAR(20), -- ON_TRACK, OVERDUE, COMPLETED
    approval_authority VARCHAR(50),
    approval_date DATETIME2,
    batch_no VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    updated_at DATETIME2,
    updated_by VARCHAR(50),
    deleted_at DATETIME2,
    deleted_by VARCHAR(50),
    is_deleted BIT DEFAULT 0
);

CREATE TABLE ccms_admissions (
    admission_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    gl_ref_no VARCHAR(50),
    admission_date DATETIME,
    discharge_date DATETIME,
    los_days AS (DATEDIFF(day, admission_date, discharge_date)),
    admission_status VARCHAR(50),
    admission_type VARCHAR(50), -- IP, OP, Day Surgery
    room_type VARCHAR(50),
    room_rate MONEY,
    icu_days INT,
    icu_rate MONEY,
    ehm_status VARCHAR(50), -- 8HM logic
    deferment_status VARCHAR(50),
    alert_flag BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    updated_at DATETIME2,
    updated_by VARCHAR(50),
    is_deleted BIT DEFAULT 0,
    CONSTRAINT FK_Adm_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- THE "193 COLUMN" FIX: 
-- This table stores all the specific medical questionnaire answers 
-- from columns 27-180 of the legacy admission table.
CREATE TABLE ccms_admission_assessments (
    assessment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    admission_id BIGINT NOT NULL,
    field_name VARCHAR(100), -- e.g. 'IschaemicHeartDisease', 'AccidentCause'
    field_value NVARCHAR(MAX),
    CONSTRAINT FK_Assess_Adm FOREIGN KEY (admission_id) REFERENCES ccms_admissions(admission_id)
);

CREATE TABLE ccms_claim_remarks (
    remark_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    remark_type VARCHAR(50), -- Internal, External, Investigation
    remark_text NVARCHAR(MAX),
    created_by VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- LOS Alert Configuration & Thresholds
CREATE TABLE ccms_los_alert_thresholds (
    threshold_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_id BIGINT,
    diagnosis_category VARCHAR(100),
    threshold_days INT,
    alert_level INT, -- 1, 2, 3
    is_active BIT DEFAULT 1,
    CONSTRAINT FK_LOSThreshold_Prod FOREIGN KEY (product_id) REFERENCES ccms_products(product_id)
);

-- LOS Alert History & Tracking
CREATE TABLE ccms_los_alerts (
    alert_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    admission_id BIGINT NOT NULL,
    alert_level INT,
    triggered_at DATETIME2 DEFAULT GETDATE(),
    current_los INT,
    threshold_days INT,
    status VARCHAR(20), -- OPEN, ACKNOWLEDGED, CLOSED
    acknowledged_by VARCHAR(50),
    acknowledged_at DATETIME2,
    notes NVARCHAR(MAX),
    CONSTRAINT FK_LOSAlert_Adm FOREIGN KEY (admission_id) REFERENCES ccms_admissions(admission_id)
);

-- 8 Hours Monitoring (8HM) Workflow Tracking
CREATE TABLE ccms_8hm_monitoring (
    monitoring_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    admission_id BIGINT NOT NULL,
    check_time DATETIME2,
    hours_elapsed INT,
    status VARCHAR(50), -- PENDING, IN_PROGRESS, COMPLETED, ESCALATED, CANCELLED
    checked_by VARCHAR(50),
    notes NVARCHAR(MAX),
    next_check_due DATETIME2,
    CONSTRAINT FK_8HM_Adm FOREIGN KEY (admission_id) REFERENCES ccms_admissions(admission_id)
);

-- 5. FINANCIALS (PAYMENT ADVICE)
-- Consolidates: dt_PolicyHolder_PaymentAdvice, dt_PolicyHolder_PaymentAdvice_Summary,
-- dt_PolicyHolder_PaymentAdvice_Details, DT_POLICYHOLDER_PAYMENTADVICE_DELETED,
-- DT_PA_PAYMENT, DT_PA_IC, dt_PA, dt_PA_Details, dt_PA_Consulation_Breakdown,
-- dt_PA_UncoveredCharges, dt_PA_CB_HISTORY
------------------------------------------------------------------------------

CREATE TABLE ccms_payment_advice (
    pa_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    pa_ref_no VARCHAR(50) NOT NULL UNIQUE,
    hospital_invoice_no VARCHAR(100),
    hospital_invoice_amount MONEY,
    tax_amt MONEY DEFAULT 0,
    discount_amt MONEY DEFAULT 0,
    subtotal_ra MONEY DEFAULT 0, -- Reimburseable
    subtotal_nra MONEY DEFAULT 0, -- Non-Reimburseable
    subtotal_ia MONEY DEFAULT 0, -- Insurable Amount
    grand_total MONEY DEFAULT 0,
    grand_total_ia MONEY DEFAULT 0,
    consultation_total MONEY DEFAULT 0,
    uncovered_total MONEY DEFAULT 0,
    payment_status VARCHAR(50),
    payment_method VARCHAR(50),
    payment_date DATETIME2,
    is_shortfall BIT DEFAULT 0,
    is_multipl_pa BIT DEFAULT 0, -- Part of multi-PA consolidation
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    updated_at DATETIME2,
    updated_by VARCHAR(50),
    CONSTRAINT FK_PA_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

CREATE TABLE ccms_pa_line_items (
    item_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    pa_id BIGINT NOT NULL,
    benefit_name NVARCHAR(255),
    billed_amt MONEY,
    approved_amt MONEY,
    non_reimb_reason NVARCHAR(MAX),
    is_consultation_breakdown BIT DEFAULT 0,
    CONSTRAINT FK_PALine_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);

-- 6. UPLOADS & EXTERNAL SYNC
-- Consolidates: dt_ClaimUpload_Notification_Master, dt_ClaimUpload_Payment, 
-- dt_ClaimUpload_RegClaim, dt_ClaimUpload_Reply, DT_CLAIM_UPLOAD_LOG, 
-- dt_ClaimUpload_Error_Action, dt_FWD_Claim_Acc_* tables
------------------------------------------------------------------------------

CREATE TABLE ccms_claim_uploads (
    upload_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    batch_no VARCHAR(50),
    file_type VARCHAR(50), -- Notification, Payment, Reply
    raw_content_json NVARCHAR(MAX),
    processing_status VARCHAR(20),
    error_details NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 7. WORKFLOW MODULES (ESCALATIONS, INVESTIGATIONS, CHECKLISTS)
-- Consolidates: dt_Escalation_* (15 tables), dt_Claim_Investigation_* (7 tables),
-- dt_CheckList_* (7 tables), dt_MQ_PymtReq, dt_mq_templates
------------------------------------------------------------------------------

CREATE TABLE ccms_escalations (
    esc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    source_id INT,
    nature_id INT,
    assigned_to VARCHAR(50),
    status VARCHAR(20),
    priority VARCHAR(20),
    created_at DATETIME2 DEFAULT GETDATE(),
    closed_at DATETIME2
);

CREATE TABLE ccms_investigations (
    ix_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    ix_status VARCHAR(50),
    clinic_id BIGINT,
    findings NVARCHAR(MAX),
    request_payment_amt MONEY,
    is_pec_found BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE ccms_checklists (
    checklist_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    checklist_type VARCHAR(50), -- 'DISCHARGE', 'CCPLUS', 'GL_ISSUANCE'
    check_key VARCHAR(100),
    check_value NVARCHAR(MAX),
    updated_by VARCHAR(50),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- 8. REMINDERS & DOCUMENTS
-- Consolidates: dt_Reminder_Docs, dt_Reminder_MQ_HOSP, dt_Reminder_MQ_PH, 
-- dt_Reminder_Print, dt_documents, dt_fax_doc_mgmt
------------------------------------------------------------------------------

CREATE TABLE ccms_documents (
    doc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ref_type VARCHAR(20), -- CLAIM, MEMBER, ADMISSION
    ref_id BIGINT NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    file_data VARBINARY(MAX),
    doc_category VARCHAR(50), -- 'MedicalReport', 'Invoice', 'IC'
    uploaded_at DATETIME2 DEFAULT GETDATE(),
    uploaded_by VARCHAR(50)
);

CREATE TABLE ccms_reminders (
    reminder_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ref_type VARCHAR(20),
    ref_id BIGINT NOT NULL,
    reminder_level INT, -- 1, 2, 3
    reminder_type VARCHAR(50), -- 'MQ', 'DOCS', 'PAYMENT'
    sent_at DATETIME2,
    status VARCHAR(20)
);

-- 9. STOP LOSS MODULE
-- Consolidates: dt_StopLoss_Coverage, dt_StopLoss_Monthly, dt_StopLoss_Yearly, 
-- dt_StopLoss_Monthly_History, dt_StopLoss_Yearly_History
------------------------------------------------------------------------------

CREATE TABLE ccms_stop_loss_data (
    sl_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_id BIGINT,
    period_type VARCHAR(10), -- 'MONTHLY', 'YEARLY'
    period_date DATE,
    total_policy_count INT,
    total_gross_premium MONEY,
    claims_ol MONEY,
    claims_reim MONEY,
    tpa_fees MONEY,
    is_history_record BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 11. CLAIMS TRACKING & STATUS MANAGEMENT
-- Consolidates: dt_Claim_Reg_Pending, dt_Claim_Reg_Status, dt_Claim_Reg_Status_Log,
-- dt_claims_durations, dt_claims_process_updates, dt_prepost_claims_rejections
------------------------------------------------------------------------------

CREATE TABLE ccms_claim_status_log (
    log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE(),
    notes NVARCHAR(MAX),
    CONSTRAINT FK_StatusLog_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

CREATE TABLE ccms_claim_processing_milestones (
    milestone_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    milestone_name VARCHAR(100),
    milestone_date DATETIME2,
    created_by VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Milestone_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

CREATE TABLE ccms_claim_durations (
    duration_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    start_date DATETIME2,
    end_date DATETIME2,
    duration_days INT,
    status VARCHAR(50), -- IN_PROGRESS, COMPLETED
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Duration_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- 12. PAYMENT ADVICE ENHANCED TRACKING
-- Consolidates: dt_PolicyHolder_PaymentAdvice_Summary, dt_PA_Consulation_Breakdown,
-- dt_PA_UncoveredCharges, dt_PA_CB_HISTORY, DT_PA_PAYMENT, DT_PA_IC
------------------------------------------------------------------------------

CREATE TABLE ccms_pa_summary (
    summary_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    pa_id BIGINT NOT NULL,
    sob_type VARCHAR(50), -- Room & Board, Surgical, Consultation, etc
    sob_category VARCHAR(100),
    amount_ia MONEY, -- Insurable Amount
    amount_ra MONEY, -- Reimburseable Amount
    amount_nra MONEY, -- Non-Reimburseable Amount
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_PASummary_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);

CREATE TABLE ccms_pa_consultation_breakdown (
    consultation_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    pa_id BIGINT NOT NULL,
    consultation_type VARCHAR(100),
    consultation_amount MONEY,
    doctor_id BIGINT,
    consultation_date DATE,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Consultation_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);

CREATE TABLE ccms_pa_consultation_breakdown_history (
    history_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    consultation_id BIGINT NOT NULL,
    old_amount MONEY,
    new_amount MONEY,
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_ConsultHistory_Cons FOREIGN KEY (consultation_id) REFERENCES ccms_pa_consultation_breakdown(consultation_id)
);

CREATE TABLE ccms_pa_uncovered_charges (
    uncovered_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    pa_id BIGINT NOT NULL,
    charge_description NVARCHAR(MAX),
    charge_amount MONEY,
    uncovered_reason NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Uncovered_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);

CREATE TABLE ccms_pa_payments (
    payment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
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

CREATE TABLE ccms_multi_payment_advice (
    mpa_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    mpa_ref_no VARCHAR(50) NOT NULL UNIQUE,
    claim_id BIGINT NOT NULL,
    total_amount MONEY,
    pa_count INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    created_by VARCHAR(50),
    CONSTRAINT FK_MPA_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

CREATE TABLE ccms_multi_payment_advice_details (
    mpa_detail_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    mpa_id BIGINT NOT NULL,
    pa_id BIGINT NOT NULL,
    pa_amount MONEY,
    sequence_no INT,
    CONSTRAINT FK_MPADetail_MPA FOREIGN KEY (mpa_id) REFERENCES ccms_multi_payment_advice(mpa_id),
    CONSTRAINT FK_MPADetail_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id)
);

-- 13. UPLOAD & INSURER INTEGRATION ENHANCED
-- Consolidates: dt_ClaimUpload_Notification_Master extensions, dt_ClaimUpload_Offer, 
-- dt_ClaimUpload_Payment_Short_Refund, dt_ClaimUpload_RA_Matrix, DT_CLAIM_UPLOAD_LOG
------------------------------------------------------------------------------

CREATE TABLE ccms_claim_upload_batch (
    batch_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    batch_no VARCHAR(50) NOT NULL UNIQUE,
    file_type VARCHAR(50), -- Notification, Payment, Reply, Offer
    upload_date DATETIME2 DEFAULT GETDATE(),
    uploaded_by VARCHAR(50),
    record_count INT,
    processing_status VARCHAR(20), -- PENDING, PROCESSING, COMPLETED, FAILED
    error_count INT DEFAULT 0,
    success_count INT DEFAULT 0
);

CREATE TABLE ccms_claim_upload_notification_details (
    notification_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    batch_id BIGINT NOT NULL,
    claim_id BIGINT NOT NULL,
    insurer_claim_no VARCHAR(50),
    notification_type VARCHAR(50), -- STATUS, OFFER, PAYMENT, REPLY
    notification_date DATETIME2,
    kiv_status VARCHAR(50), -- For Keep In View tracking
    kiv_reason NVARCHAR(MAX),
    deleted_by VARCHAR(50),
    deleted_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_NotifDetail_Batch FOREIGN KEY (batch_id) REFERENCES ccms_claim_upload_batch(batch_id),
    CONSTRAINT FK_NotifDetail_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

CREATE TABLE ccms_claim_upload_offer (
    offer_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    batch_id BIGINT NOT NULL,
    claim_id BIGINT NOT NULL,
    insurer_claim_no VARCHAR(50),
    offer_amount MONEY,
    offer_date DATETIME2,
    offer_status VARCHAR(50), -- PENDING, ACCEPTED, REJECTED
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Offer_Batch FOREIGN KEY (batch_id) REFERENCES ccms_claim_upload_batch(batch_id),
    CONSTRAINT FK_Offer_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

CREATE TABLE ccms_claim_upload_payment_details (
    payment_detail_id BIGINT IDENTITY(1,1) PRIMARY KEY,
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

CREATE TABLE ccms_claim_upload_error (
    error_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    batch_id BIGINT NOT NULL,
    claim_id BIGINT,
    error_code VARCHAR(20),
    error_description NVARCHAR(MAX),
    error_severity VARCHAR(20), -- INFO, WARNING, ERROR, CRITICAL
    error_date DATETIME2 DEFAULT GETDATE(),
    resolved BIT DEFAULT 0,
    resolution_notes NVARCHAR(MAX),
    resolved_by VARCHAR(50),
    resolved_at DATETIME2,
    CONSTRAINT FK_Error_Batch FOREIGN KEY (batch_id) REFERENCES ccms_claim_upload_batch(batch_id),
    CONSTRAINT FK_Error_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

CREATE TABLE ccms_ra_matrix (
    ra_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ra_code VARCHAR(20),
    ra_description NVARCHAR(MAX),
    ra_percentage DECIMAL(5,2),
    is_active BIT DEFAULT 1
);

-- 14. FWD BENEFIT ACCUMULATION
-- Consolidates: dt_FWD_Claim_Acc_By_Client, dt_FWD_Claim_Acc_By_Disability,
-- dt_FWD_Claim_Acc_OneTime, dt_FWD_Claim_Acc_PA
------------------------------------------------------------------------------

CREATE TABLE ccms_fwd_accumulation_client (
    client_acc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    member_id BIGINT NOT NULL,
    fwd_client_no VARCHAR(50),
    period_year INT,
    period_month INT,
    accumulated_amount MONEY,
    as_at_date DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_FWDAccClient_Member FOREIGN KEY (member_id) REFERENCES ccms_members(member_id)
);

CREATE TABLE ccms_fwd_accumulation_disability (
    disability_acc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    disability_code VARCHAR(50),
    period_year INT,
    period_month INT,
    accumulated_amount MONEY,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE ccms_fwd_accumulation_onetime (
    onetime_acc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    member_id BIGINT NOT NULL,
    fwd_member_no VARCHAR(50),
    benefit_code VARCHAR(50),
    accumulated_amount MONEY,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_FWDAccOnetime_Member FOREIGN KEY (member_id) REFERENCES ccms_members(member_id)
);

CREATE TABLE ccms_fwd_accumulation_pa (
    pa_acc_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    pa_id BIGINT NOT NULL,
    claim_id BIGINT NOT NULL,
    accumulated_amount MONEY,
    as_at_date DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_FWDAccPA_PA FOREIGN KEY (pa_id) REFERENCES ccms_payment_advice(pa_id),
    CONSTRAINT FK_FWDAccPA_Claim FOREIGN KEY (claim_id) REFERENCES ccms_claims(claim_id)
);

-- 15. ADMISSION AUDIT & LOGGING
-- Consolidates: DT_POLICYHOLDER_ADMISSION_DELETED, dt_PolicyHolder_Admission_Log
------------------------------------------------------------------------------

CREATE TABLE ccms_admission_log (
    log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    admission_id BIGINT NOT NULL,
    change_type VARCHAR(50), -- CREATED, UPDATED, DELETED, STATUS_CHANGE
    change_description NVARCHAR(MAX),
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_AdmLog_Admission FOREIGN KEY (admission_id) REFERENCES ccms_admissions(admission_id)
);

-- 16. ESCALATION ENHANCED TRACKING
-- Consolidates: dt_Escalation_* (15 tables)
------------------------------------------------------------------------------

CREATE TABLE ccms_escalation_source (
    source_id INT IDENTITY(1,1) PRIMARY KEY,
    source_code VARCHAR(20),
    source_description VARCHAR(100), -- Phone, Email, Walk-in, System
    is_active BIT DEFAULT 1
);

CREATE TABLE ccms_escalation_nature (
    nature_id INT IDENTITY(1,1) PRIMARY KEY,
    nature_code VARCHAR(20),
    nature_description VARCHAR(100),
    is_active BIT DEFAULT 1
);

CREATE TABLE ccms_escalation_updates (
    update_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    esc_id BIGINT NOT NULL,
    update_description NVARCHAR(MAX),
    updated_by VARCHAR(50),
    updated_at DATETIME2 DEFAULT GETDATE(),
    remarks NVARCHAR(MAX),
    CONSTRAINT FK_EscUpdate_Esc FOREIGN KEY (esc_id) REFERENCES ccms_escalations(esc_id)
);

CREATE TABLE ccms_escalation_settlement (
    settlement_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    esc_id BIGINT NOT NULL,
    settlement_amount MONEY,
    settlement_date DATETIME2,
    settlement_status VARCHAR(50),
    approved_by VARCHAR(50),
    approved_at DATETIME2,
    CONSTRAINT FK_EscSettle_Esc FOREIGN KEY (esc_id) REFERENCES ccms_escalations(esc_id)
);

-- 17. INVESTIGATION ENHANCED TRACKING
-- Consolidates: dt_Claim_Investigation_* (7 tables)
------------------------------------------------------------------------------

CREATE TABLE ccms_investigation_request (
    request_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ix_id BIGINT NOT NULL,
    request_type VARCHAR(50), -- Document, Interview, Medical Report
    request_date DATETIME2,
    requested_from NVARCHAR(255),
    expected_date DATETIME2,
    received_date DATETIME2,
    status VARCHAR(50), -- PENDING, RECEIVED, OVERDUE
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_IXRequest_IX FOREIGN KEY (ix_id) REFERENCES ccms_investigations(ix_id)
);

CREATE TABLE ccms_investigation_request_history (
    history_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    request_id BIGINT NOT NULL,
    status_change VARCHAR(50),
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_IXReqHist_Req FOREIGN KEY (request_id) REFERENCES ccms_investigation_request(request_id)
);

CREATE TABLE ccms_investigation_call_log (
    call_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ix_id BIGINT NOT NULL,
    call_date DATETIME2,
    called_party NVARCHAR(255),
    call_duration INT, -- in minutes
    call_notes NVARCHAR(MAX),
    called_by VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_IXCall_IX FOREIGN KEY (ix_id) REFERENCES ccms_investigations(ix_id)
);

-- 10. SYSTEM & SECURITY
-- Consolidates: DT_USERS, DT_USERS_API, DT_USERS_PWD_HISTORY, 
-- tb_Special_Permission, DT_AUDIT, dt_Vlog
------------------------------------------------------------------------------

CREATE TABLE ccms_users (
    user_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name NVARCHAR(255),
    role_id INT,
    permissions_json NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    last_login DATETIME2
);

CREATE TABLE ccms_audit_logs (
    audit_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    table_name VARCHAR(100),
    record_id BIGINT,
    action_type VARCHAR(20), -- INSERT, UPDATE, DELETE
    old_value NVARCHAR(MAX),
    new_value NVARCHAR(MAX),
    changed_by VARCHAR(50),
    changed_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE ccms_system_version (
    version_id INT IDENTITY(1,1) PRIMARY KEY,
    version_no VARCHAR(20),
    release_notes NVARCHAR(MAX),
    applied_at DATETIME2 DEFAULT GETDATE()
);

-- 11. NEW TABLES;
-- PURPOSE: DYNAMIC RULES, SUMMARY TABLES FOR POLICY HOLDER COVERAGE PERIOD, UTILIZATION 
------------------------------------------------------------------------------

/* =========================================
   Dynamic Rules Management (CCMS_)
   ========================================= */

-- 1) Data sources and fields allowed in rules
CREATE TABLE dbo.CCMS_RuleDataSource (
    DataSourceID        INT IDENTITY(1,1) PRIMARY KEY,
    DataSourceCode      VARCHAR(50) NOT NULL UNIQUE,  -- e.g. POLICY, MEMBER, CLAIM
    DataSourceName      VARCHAR(100) NOT NULL,
    Description         VARCHAR(255) NULL,
    IsActive            BIT NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           VARCHAR(50) NULL
);

CREATE TABLE dbo.CCMS_RuleField (
    FieldID             INT IDENTITY(1,1) PRIMARY KEY,
    DataSourceID        INT NOT NULL,
    FieldCode           VARCHAR(80) NOT NULL,         -- e.g. POLICY_EXPIRY_DATE
    FieldName           VARCHAR(120) NOT NULL,        -- e.g. Policy Expiry Date
    DotPath             VARCHAR(200) NOT NULL,        -- e.g. Policy.ExpiryDate (used by evaluator)
    DataType            VARCHAR(20) NOT NULL,         -- string|int|decimal|money|date|datetime|bool
    AllowedOperators    VARCHAR(300) NOT NULL,        -- comma list: EQ,NEQ,GT,GTE,LT,LTE,BETWEEN,IN,CONTAINS,...
    IsNullable          BIT NOT NULL DEFAULT 1,
    IsActive            BIT NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

ALTER TABLE dbo.CCMS_RuleField
ADD CONSTRAINT FK_CCMS_RuleField_DataSource
FOREIGN KEY (DataSourceID) REFERENCES dbo.CCMS_RuleDataSource(DataSourceID);

CREATE UNIQUE INDEX UX_CCMS_RuleField_DataSource_FieldCode
ON dbo.CCMS_RuleField(DataSourceID, FieldCode);

-- 2) Operators (optional, but useful for UI + validation)
CREATE TABLE dbo.CCMS_RuleOperator (
    OperatorCode        VARCHAR(30) NOT NULL PRIMARY KEY, -- EQ, BETWEEN, IN, etc.
    OperatorName        VARCHAR(80) NOT NULL,
    ValueArity          INT NOT NULL,  -- 0=no value (IS_NULL), 1=single, 2=range, -1=list
    AppliesToDataTypes  VARCHAR(200) NOT NULL, -- comma list: string,int,date,bool,...
    IsActive            BIT NOT NULL DEFAULT 1
);

-- 3) Action types
CREATE TABLE dbo.CCMS_RuleActionType (
    ActionTypeCode      VARCHAR(50) NOT NULL PRIMARY KEY, -- BLOCK, WARN, REQUIRE_DOC, ROUTE, SET_FLAG
    ActionTypeName      VARCHAR(100) NOT NULL,
    Description         VARCHAR(255) NULL,
    IsActive            BIT NOT NULL DEFAULT 1
);

-- 4) Rule Sets
CREATE TABLE dbo.CCMS_RuleSet (
    RuleSetID           BIGINT IDENTITY(1,1) PRIMARY KEY,
    RuleSetCode         VARCHAR(60) NOT NULL UNIQUE, -- ELIGIBILITY, DUPLICATE, DOCS, PEC
    RuleSetName         VARCHAR(120) NOT NULL,
    ModuleCode          VARCHAR(50) NOT NULL,        -- e.g. Admission, Reimbursement, Submission
    Description         VARCHAR(255) NULL,
    IsActive            BIT NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           VARCHAR(50) NULL
);

-- 5) Rules (logical identity)
CREATE TABLE dbo.CCMS_Rule (
    RuleID              BIGINT IDENTITY(1,1) PRIMARY KEY,
    RuleSetID           BIGINT NOT NULL,
    RuleCode            VARCHAR(80) NOT NULL,   -- POLICY_NOT_IN_FORCE
    RuleName            VARCHAR(150) NOT NULL,
    Severity            VARCHAR(20) NOT NULL DEFAULT 'ERROR', -- INFO/WARN/ERROR
    Priority            INT NOT NULL DEFAULT 100, -- lower = higher priority
    StopProcessing      BIT NOT NULL DEFAULT 0,   -- stop evaluating further rules if matched
    IsActive            BIT NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           VARCHAR(50) NULL
);

ALTER TABLE dbo.CCMS_Rule
ADD CONSTRAINT FK_CCMS_Rule_RuleSet
FOREIGN KEY (RuleSetID) REFERENCES dbo.CCMS_RuleSet(RuleSetID);

CREATE UNIQUE INDEX UX_CCMS_Rule_RuleSet_RuleCode
ON dbo.CCMS_Rule(RuleSetID, RuleCode);

-- 6) Rule Versioning
CREATE TABLE dbo.CCMS_RuleVersion (
    RuleVersionID       BIGINT IDENTITY(1,1) PRIMARY KEY,
    RuleID              BIGINT NOT NULL,
    VersionNo           INT NOT NULL,
    Status              VARCHAR(20) NOT NULL,  -- DRAFT, PUBLISHED, ARCHIVED
    EffectiveFrom       DATETIME2 NULL,
    EffectiveTo         DATETIME2 NULL,
    Notes               VARCHAR(255) NULL,
    CreatedAt           DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           VARCHAR(50) NULL
);

ALTER TABLE dbo.CCMS_RuleVersion
ADD CONSTRAINT FK_CCMS_RuleVersion_Rule
FOREIGN KEY (RuleID) REFERENCES dbo.CCMS_Rule(RuleID);

CREATE UNIQUE INDEX UX_CCMS_RuleVersion_Rule_VersionNo
ON dbo.CCMS_RuleVersion(RuleID, VersionNo);

-- 7) Condition Groups (AND/OR)
CREATE TABLE dbo.CCMS_RuleConditionGroup (
    GroupID             BIGINT IDENTITY(1,1) PRIMARY KEY,
    RuleVersionID       BIGINT NOT NULL,
    ParentGroupID       BIGINT NULL,
    LogicalOperator     VARCHAR(10) NOT NULL, -- AND / OR
    GroupOrder          INT NOT NULL DEFAULT 1
);

ALTER TABLE dbo.CCMS_RuleConditionGroup
ADD CONSTRAINT FK_CCMS_RuleConditionGroup_RuleVersion
FOREIGN KEY (RuleVersionID) REFERENCES dbo.CCMS_RuleVersion(RuleVersionID);

ALTER TABLE dbo.CCMS_RuleConditionGroup
ADD CONSTRAINT FK_CCMS_RuleConditionGroup_Parent
FOREIGN KEY (ParentGroupID) REFERENCES dbo.CCMS_RuleConditionGroup(GroupID);

-- 8) Conditions
CREATE TABLE dbo.CCMS_RuleCondition (
    ConditionID         BIGINT IDENTITY(1,1) PRIMARY KEY,
    GroupID             BIGINT NOT NULL,
    FieldID             INT NOT NULL,
    OperatorCode        VARCHAR(30) NOT NULL,
    Value1              NVARCHAR(4000) NULL,  -- store as string; evaluator casts using Field.DataType
    Value2              NVARCHAR(4000) NULL,  -- for BETWEEN ranges
    ConditionOrder      INT NOT NULL DEFAULT 1,
    Negate              BIT NOT NULL DEFAULT 0
);

ALTER TABLE dbo.CCMS_RuleCondition
ADD CONSTRAINT FK_CCMS_RuleCondition_Group
FOREIGN KEY (GroupID) REFERENCES dbo.CCMS_RuleConditionGroup(GroupID);

ALTER TABLE dbo.CCMS_RuleCondition
ADD CONSTRAINT FK_CCMS_RuleCondition_Field
FOREIGN KEY (FieldID) REFERENCES dbo.CCMS_RuleField(FieldID);

ALTER TABLE dbo.CCMS_RuleCondition
ADD CONSTRAINT FK_CCMS_RuleCondition_Operator
FOREIGN KEY (OperatorCode) REFERENCES dbo.CCMS_RuleOperator(OperatorCode);

-- 9) Actions (what happens when matched)
CREATE TABLE dbo.CCMS_RuleAction (
    ActionID            BIGINT IDENTITY(1,1) PRIMARY KEY,
    RuleVersionID       BIGINT NOT NULL,
    ActionTypeCode      VARCHAR(50) NOT NULL,
    ActionOrder         INT NOT NULL DEFAULT 1,
    MessageTemplate     NVARCHAR(500) NULL,  -- user/admin message
    PayloadJson         NVARCHAR(MAX) NULL   -- parameters for action, e.g. {"DocType":"IC_COPY"}
);

ALTER TABLE dbo.CCMS_RuleAction
ADD CONSTRAINT FK_CCMS_RuleAction_RuleVersion
FOREIGN KEY (RuleVersionID) REFERENCES dbo.CCMS_RuleVersion(RuleVersionID);

ALTER TABLE dbo.CCMS_RuleAction
ADD CONSTRAINT FK_CCMS_RuleAction_ActionType
FOREIGN KEY (ActionTypeCode) REFERENCES dbo.CCMS_RuleActionType(ActionTypeCode);

-- 10) Scoping (optional but very useful)
-- Example: apply only for certain ProductType, CompanyCode, ClaimType, etc.
CREATE TABLE dbo.CCMS_RuleScope (
    RuleVersionID       BIGINT NOT NULL,
    ScopeKey            VARCHAR(50) NOT NULL,     -- COMPANY_CODE, PRODUCT_TYPE, CLAIM_TYPE, etc.
    ScopeValue          VARCHAR(100) NOT NULL,
    PRIMARY KEY (RuleVersionID, ScopeKey, ScopeValue)
);

ALTER TABLE dbo.CCMS_RuleScope
ADD CONSTRAINT FK_CCMS_RuleScope_RuleVersion
FOREIGN KEY (RuleVersionID) REFERENCES dbo.CCMS_RuleVersion(RuleVersionID);

-- 11) Execution Logs (audit)
CREATE TABLE dbo.CCMS_RuleExecutionLog (
    ExecutionID         BIGINT IDENTITY(1,1) PRIMARY KEY,
    RuleSetCode         VARCHAR(60) NOT NULL,
    RuleID              BIGINT NULL,
    RuleVersionID       BIGINT NULL,
    ContextRefType      VARCHAR(50) NOT NULL,  -- CLAIM / ADMISSION / REIMBURSEMENT
    ContextRefID        VARCHAR(50) NOT NULL,  -- e.g. ClaimNo or CCMS_ClaimID
    Matched             BIT NOT NULL,
    Severity            VARCHAR(20) NULL,
    Message             NVARCHAR(500) NULL,
    EvaluatedAt         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    EvaluatedBy         VARCHAR(50) NULL,      -- system/user
    DebugJson           NVARCHAR(MAX) NULL
);

CREATE INDEX IX_CCMS_RuleExecutionLog_Context
ON dbo.CCMS_RuleExecutionLog(ContextRefType, ContextRefID, EvaluatedAt DESC);


-- Operators
INSERT INTO dbo.CCMS_RuleOperator (OperatorCode, OperatorName, ValueArity, AppliesToDataTypes)
VALUES
('EQ','Equals',1,'string,int,decimal,money,date,datetime,bool'),
('NEQ','Not Equals',1,'string,int,decimal,money,date,datetime,bool'),
('GT','Greater Than',1,'int,decimal,money,date,datetime'),
('GTE','Greater Than Or Equal',1,'int,decimal,money,date,datetime'),
('LT','Less Than',1,'int,decimal,money,date,datetime'),
('LTE','Less Than Or Equal',1,'int,decimal,money,date,datetime'),
('BETWEEN','Between',2,'int,decimal,money,date,datetime'),
('IN','In List',-1,'string,int'),
('CONTAINS','Contains',1,'string'),
('IS_NULL','Is Null',0,'string,int,decimal,money,date,datetime,bool'),
('NOT_NULL','Is Not Null',0,'string,int,decimal,money,date,datetime,bool');

-- Action types
INSERT INTO dbo.CCMS_RuleActionType (ActionTypeCode, ActionTypeName, Description)
VALUES
('BLOCK','Block Processing','Stop the transaction / mark as invalid'),
('WARN','Warning Message','Allow but show warning'),
('REQUIRE_DOC','Require Document','Add mandatory doc requirement'),
('ROUTE','Route Case','Route to another workflow (investigation/escalation)'),
('SET_FLAG','Set Flag','Set a status/flag on the claim/member');