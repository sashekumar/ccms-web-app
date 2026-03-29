/**
 * Backend API Route Constants
 * 
 * Centralized routing configuration for all backend API endpoints.
 * Use these constants instead of hardcoded route strings to:
 * - Enable type-safe route definitions
 * - Prevent typos in route paths
 * - Make route refactoring easier
 * - Document API structure
 * - Ensure consistency with frontend API_ENDPOINTS
 * 
 * @example
 * ```typescript
 * // In routes files
 * router.post(API_ROUTES.USERS.LIST, requirePermission('USER_MANAGEMENT', 'VIEW'), controller.getUsers);
 * router.get(API_ROUTES.USERS.BY_ID(':userId'), controller.getUserById);
 * 
 * // Keep route base paths in routes files for organization
 * const userRoutes = Router();
 * userRoutes.post(API_ROUTES.USERS.LIST, ...);
 * app.use('/api/users', userRoutes);
 * ```
 */

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

export const AUTH_ROUTES = {
  BASE: '/auth',
  CSRF_TOKEN: '/csrf-token',
  LOGIN: '/login',
  LOGOUT: '/logout',
  REFRESH: '/refresh',
  ME: '/me',
  CHANGE_PASSWORD: '/change-password'
} as const;

// ============================================================================
// SYSTEM ADMINISTRATION ROUTES
// ============================================================================

export const USER_ROUTES = {
  LIST: '/list',
  CREATE: '',
  CHECK_USERNAME: '/check-username',
  BY_ID: (id: string | number) => `/${id}`,
  UPDATE: (id: string | number) => `/${id}`,
  DELETE: (id: string | number) => `/${id}`,
  ASSIGN_ROLE: '/:userId/assign-role'
} as const;

export const ROLE_ROUTES = {
  LIST: '/list',
  CREATE: '/create',
  UPDATE: '/update',
  DELETE: '/delete',
  GET_BY_ID: '/get',
  ASSIGN_PERMISSION: '/assign-permission'
} as const;

export const CATEGORY_ROUTES = {
  LIST: '/list',
  CREATE: '/create',
  UPDATE: '/update',
  DELETE: '/delete',
  GET_BY_ID: '/get'
} as const;

export const MODULE_ROUTES = {
  LIST: '/list',
  CREATE: '/create',
  UPDATE: '/update',
  DELETE: '/delete',
  GET_BY_ID: '/get'
} as const;

export const ACTION_ROUTES = {
  LIST: '/list',
  CREATE: '/create',
  UPDATE: '/update',
  DELETE: '/delete',
  GET_BY_ID: '/get'
} as const;

export const MODULE_ACTION_ROUTES = {
  LIST: '/list',
  CREATE: '/create',
  UPDATE: '/update',
  DELETE: '/delete',
  GET_BY_ID: '/get'
} as const;

// ============================================================================
// PERMISSION ROUTES
// ============================================================================

export const PERMISSION_ROUTES = {
  CHECK: '/check',
  USER_PERMISSIONS: '/user',
  ASSIGN_ROLE: '/assign-role',
  ROLES_LIST: '/roles/list',
  ROLE_CREATE: '/roles/create',
  ROLE_UPDATE: '/roles/update',
  ROLE_DELETE: '/roles/delete'
} as const;

// ============================================================================
// MASTER DATA ROUTES
// ============================================================================

export const BANK_ROUTES = {
  LIST: '/list',
  CREATE: '/create',
  GET: '/get',
  UPDATE: '/update',
  DELETE: '/delete',
  CHECK_CODE: '/check-code'
} as const;

export const CLAUSE_ROUTES = {
  LIST: '/list',
  CREATE: '/create',
  GET: '/get',
  UPDATE: '/update',
  DELETE: '/delete',
  CHECK_CODE: '/check-code'
} as const;

export const LOOKUP_ROUTES = {
  CATEGORIES_LIST: '/categories/list',
  CATEGORY_CREATE: '/categories/create',
  CATEGORY_UPDATE: '/categories/update',
  CATEGORY_DELETE: '/categories/delete',
  CATEGORY_GET: '/categories/get',
  LIST: '/list',
  CREATE: '/create',
  GET: '/get',
  UPDATE: '/update',
  DELETE: '/delete',
  BY_CATEGORY: '/by-category',
  METADATA_LIST: '/metadata/list',
  METADATA_CREATE: '/metadata/create',
  METADATA_UPDATE: '/metadata/update',
  METADATA_DELETE: '/metadata/delete'
} as const;

export const MQ_TEMPLATE_ROUTES = {
  LIST: '/list',
  CREATE: '/create',
  GET: '/get',
  UPDATE: '/update',
  DELETE: '/delete',
  GET_WITH_QUESTIONS: '/get-with-questions',
  QUESTIONS_CREATE: '/questions/create',
  QUESTIONS_UPDATE: '/questions/update',
  QUESTIONS_DELETE: '/questions/delete'
} as const;

// ============================================================================
// HOSPITAL MANAGEMENT ROUTES
// ============================================================================

export const HOSPITAL_ROUTES = {
  LIST: '/list',
  CREATE: '/create',
  GET: '/get',
  UPDATE: '/update',
  DELETE: '/delete',
  ADDRESSES_LIST: '/addresses/list',
  ADDRESSES_CREATE: '/addresses/create',
  ADDRESSES_UPDATE: '/addresses/update',
  ADDRESSES_DELETE: '/addresses/delete',
  CODES_LIST: '/codes/list',
  CODES_CREATE: '/codes/create',
  CODES_UPDATE: '/codes/update',
  CODES_DELETE: '/codes/delete',
  STAFF_LIST: '/staff/list',
  STAFF_CREATE: '/staff/create',
  STAFF_UPDATE: '/staff/update',
  STAFF_DELETE: '/staff/delete',
  FEE_SCHEDULES_LIST: '/fee-schedules/list',
  FEE_SCHEDULES_CREATE: '/fee-schedules/create',
  FEE_SCHEDULES_UPDATE: '/fee-schedules/update',
  FEE_SCHEDULES_DELETE: '/fee-schedules/delete'
} as const;

// ============================================================================
// POLICY HOLDERS / MEMBERS ROUTES
// ============================================================================

export const MEMBER_ROUTES = {
  LIST: '/list',
  CREATE: '/create',
  GET: '/get',
  UPDATE: '/update',
  DELETE: '/delete',
  CHECK_IC: '/check-ic',
  ADDRESSES_LIST: '/addresses/list',
  ADDRESSES_CREATE: '/addresses/create',
  ADDRESSES_UPDATE: '/addresses/update',
  ADDRESSES_DELETE: '/addresses/delete',
  CONTACTS_LIST: '/contacts/list',
  CONTACTS_CREATE: '/contacts/create',
  CONTACTS_UPDATE: '/contacts/update',
  CONTACTS_DELETE: '/contacts/delete',
  POLICIES_LIST: '/policies/list',
  POLICIES_CREATE: '/policies/create',
  POLICIES_UPDATE: '/policies/update',
  POLICIES_DELETE: '/policies/delete',
  DEPENDENTS_LIST: '/dependents/list',
  DEPENDENTS_CREATE: '/dependents/create',
  DEPENDENTS_UPDATE: '/dependents/update',
  DEPENDENTS_DELETE: '/dependents/delete',
  PEC_LIST: '/pec/list',
  PEC_CREATE: '/pec/create',
  PEC_UPDATE: '/pec/update',
  PEC_DELETE: '/pec/delete'
} as const;

// ============================================================================
// POLICY MANAGEMENT ROUTES
// ============================================================================

export const PRODUCT_ROUTES = {
  LIST: '/list',
  CREATE: '/create',
  GET: '/get',
  UPDATE: '/update',
  DELETE: '/delete',
  CHECK_CODE: '/check-code',
  ACTIVATE: '/:productId/activate',
  DEACTIVATE: '/:productId/deactivate',
  LIMITS_LIST: '/:productId/limits/list',
  LIMITS_CREATE: '/limits/create',
  LIMITS_UPDATE: '/limits/update',
  LIMITS_DELETE: '/limits/delete',
  COPAY_LIST: '/:productId/copay/list',
  COPAY_CREATE: '/copay/create',
  COPAY_UPDATE: '/copay/update',
  COPAY_DELETE: '/copay/delete',
  LOS_THRESHOLDS_LIST: '/:productId/los-thresholds/list',
  LOS_THRESHOLDS_CREATE: '/los-thresholds/create',
  LOS_THRESHOLDS_UPDATE: '/los-thresholds/update',
  LOS_THRESHOLDS_DELETE: '/los-thresholds/delete'
} as const;

// ============================================================================
// CLAIM MANAGEMENT ROUTES
// ============================================================================

export const CLAIM_ROUTES = {
  LIST: '/list',
  CREATE: '/create',
  GET: '/get',
  UPDATE: '/update',
  DELETE: '/delete',
  APPROVE: '/approve',
  REJECT: '/reject'
} as const;

// ============================================================================
// ADMISSION & MEDICAL QUERY ROUTES
// ============================================================================

export const ADMISSION_ROUTES = {
  LIST: '/list',
  CREATE: '/create',
  GET: '/get',
  GET_WITH_REMARKS: '/get-with-remarks',
  UPDATE: '/update',
  DELETE: '/delete',
  APPROVE: '/approve',
  REJECT: '/reject',
  SEND_MQ: '/send-mq',
  RESPOND_MQ: '/respond-mq',
  DEFER: '/defer',
  RESOLVE_DEFERMENT: '/resolve-deferment',
  MQ_HISTORY: '/mq-history',
  UPDATE_MQ_STATUS: '/update-mq-status',
  ASSESSMENTS_GET: '/assessments/get',
  ASSESSMENTS_UPSERT: '/assessments/upsert'
} as const;

// ============================================================================
// MONITORING ROUTES
// ============================================================================

export const MONITORING_ROUTES = {
  LOS_ALERTS: '/los-alerts',
  ACKNOWLEDGE_ALERT: '/acknowledge-alert',
  EIGHT_HM_CHECKS: '/8hm-checks',
  RECORD_CHECK: '/record-check',
  SCAN_LOS_ALERTS: '/scan-los-alerts',
  GET_ALERTS_SUMMARY: '/alerts-summary'
} as const;

// ============================================================================
// FILE & UPLOAD ROUTES
// ============================================================================

export const UPLOAD_ROUTES = {
  FILE: '/file',
  MULTIPLE: '/multiple',
  DOCUMENT: '/document'
} as const;

// ============================================================================
// HEALTH & STATUS ROUTES
// ============================================================================

export const HEALTH_ROUTES = {
  HEALTH: '/health',
  STATUS: '/status'
} as const;
