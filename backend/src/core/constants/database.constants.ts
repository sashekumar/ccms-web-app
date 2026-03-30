/**
 * Database Object Name Constants
 * 
 * Centralized naming for all database objects (tables, views, stored procedures).
 * Use these constants instead of hardcoded strings to:
 * - Enable type-safe refactoring
 * - Prevent typos
 * - Document database structure
 * - Make schema changes easier
 * 
 * @example
 * ```typescript
 * const query = `SELECT * FROM ${DB_TABLES.USERS} WHERE ${DB_TABLES.USERS} = 1`;
 * await pool.execute(DB_PROCEDURES.CHECK_USER_PERMISSION, params);
 * ```
 */

// ============================================================================
// TABLES
// ============================================================================

export const DB_TABLES = {
  // User Management
  USERS: 'ccms_users',
  
  // Permission Control System (v6 - ACL)
  ROLES: 'ccms_acl_roles',
  CATEGORIES: 'ccms_acl_categories',
  MODULES: 'ccms_acl_modules',
  ACTIONS: 'ccms_acl_actions',
  MODULE_ACTIONS: 'ccms_acl_module_actions',
  ROLE_PERMISSIONS: 'ccms_acl_role_permissions',
  USER_ROLES: 'ccms_acl_user_roles',
  
  // Master Data Tables
  BANKS: 'ccms_m_banks',
  CLAUSES: 'ccms_m_clauses',
  LOOKUP_CATEGORIES: 'ccms_m_lookup_categories',
  LOOKUPS: 'ccms_m_lookups',
  LOOKUP_METADATA: 'ccms_m_lookup_metadata',
  
  // Hospital Management
  HOSPITALS: 'ccms_hospitals',
  HOSPITAL_ADDRESSES: 'ccms_hospital_addresses',
  HOSPITAL_CODES: 'ccms_hospital_codes',
  HOSPITAL_STAFF: 'ccms_hospital_staff',
  HOSPITAL_STAFF_CONTACTS: 'ccms_hospital_staff_contacts',
  FEE_SCHEDULES: 'ccms_fee_schedules',
  
  // Products / Policy Management
  PRODUCTS: 'ccms_products',
  PRODUCT_LIMITS: 'ccms_product_limits',
  PRODUCT_COPAY: 'ccms_product_copay',
  
  // Policy Holders / Members
  MEMBERS: 'ccms_members',
  MEMBER_ADDRESSES: 'ccms_member_addresses',
  MEMBER_CONTACTS: 'ccms_member_contacts',
  MEMBER_POLICIES: 'ccms_member_policies',
  MEMBER_DEPENDENTS: 'ccms_member_dependents',
  MEMBER_PEC_CONDITIONS: 'ccms_member_pec_conditions',
  
  // Claims & Admissions
  CLAIMS: 'ccms_claims',
  ADMISSIONS: 'ccms_admissions',
  ADMISSION_ASSESSMENTS: 'ccms_admission_assessments',
  REMARKS: 'ccms_remarks',

  // Monitoring & Escalations
  ESCALATIONS: 'ccms_escalations',
  ESCALATION_UPDATES: 'ccms_escalation_updates',
  ESCALATION_SOURCES: 'ccms_escalation_sources',
  ESCALATION_NATURES: 'ccms_escalation_natures',

  // MQ Templates (Medical Questionnaire)
  MQ_TEMPLATES: 'ccms_query_templates',
  MQ_TEMPLATE_QUESTIONS: 'ccms_query_template_questions',

  // System
  DOCUMENTS: 'ccms_documents',

  // Financial Management (Payment Advice)
  PAYMENT_ADVICE: 'ccms_payment_advice',
  PA_LINE_ITEMS: 'ccms_pa_line_items',
  PA_SUMMARY: 'ccms_pa_summary',
  PA_CONSULTATION_BREAKDOWN: 'ccms_pa_consultation_breakdown',
  PA_CONSULTATION_HISTORY: 'ccms_pa_consultation_breakdown_history',
  PA_UNCOVERED_CHARGES: 'ccms_pa_uncovered_charges',
  PA_PAYMENTS: 'ccms_pa_payments',
  MULTI_PAYMENT_ADVICE: 'ccms_multi_payment_advice',
  MULTI_PAYMENT_ADVICE_DETAILS: 'ccms_multi_payment_advice_details',

  // Stop Loss
  STOP_LOSS_DATA: 'ccms_stop_loss_data',

  // FWD Benefit Accumulation
  FWD_ACCUMULATION_CLIENT: 'ccms_fwd_accumulation_client',
  FWD_ACCUMULATION_DISABILITY: 'ccms_fwd_accumulation_disability',
  FWD_ACCUMULATION_ONETIME: 'ccms_fwd_accumulation_onetime',
  FWD_ACCUMULATION_PA: 'ccms_fwd_accumulation_pa',

  // Claim Tracking / SLA
  CLAIM_STATUS_LOG: 'ccms_claim_status_log',
  CLAIM_PROCESSING_MILESTONES: 'ccms_claim_processing_milestones',
  CLAIM_DURATIONS: 'ccms_claim_durations',

  // Audit Trail
  AUDIT_LOGS: 'ccms_audit_logs',
  ADMISSION_LOG: 'ccms_admission_log',

  // Notifications Log
  NOTIFICATIONS_LOG: 'ccms_log_notifications',

  // Checklists
  CHECKLISTS: 'ccms_checklists',

  // Monitoring - 8-Hour & LOS
  EIGHT_HOUR_MONITORING: 'ccms_8hm_monitoring',
  LOS_ALERTS: 'ccms_los_alerts'
} as const;

// ============================================================================
// VIEWS
// ============================================================================

export const DB_VIEWS = {
  USER_PERMISSIONS: 'vw_acl_user_permissions',
  ROLE_PERMISSIONS: 'vw_acl_role_permissions'
} as const;

// ============================================================================
// STORED PROCEDURES
// ============================================================================

export const DB_PROCEDURES = {
  CHECK_USER_PERMISSION: 'sp_check_user_permission',
  GET_USER_PERMISSIONS_JSON: 'sp_get_user_permissions_json',
  ASSIGN_ROLE_TO_USER: 'sp_assign_role_to_user'
} as const;

// ============================================================================
// FUNCTIONS
// ============================================================================

export const DB_FUNCTIONS = {
  // Add custom functions here when needed
} as const;

// ============================================================================
// TYPE EXPORTS (for type safety)
// ============================================================================

export type TableName = typeof DB_TABLES[keyof typeof DB_TABLES];
export type ViewName = typeof DB_VIEWS[keyof typeof DB_VIEWS];
export type ProcedureName = typeof DB_PROCEDURES[keyof typeof DB_PROCEDURES];
export type FunctionName = typeof DB_FUNCTIONS[keyof typeof DB_FUNCTIONS];
