import { Router } from 'express';
import { AdmissionsController } from './admissions.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new AdmissionsController();

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// ADMISSIONS ROUTES (ADMISSIONS module)
// ============================================================================

/**
 * Get paginated list of admissions
 * POST /api/admissions/list
 * Permission: ADMISSIONS.VIEW
 * Body: AdmissionFilterDto
 */
router.post('/list', requirePermission('ADMISSIONS', 'VIEW'), controller.getAdmissions);

/**
 * Get admission by ID
 * POST /api/admissions/get
 * Permission: ADMISSIONS.VIEW
 * Body: { admission_id: number }
 */
router.post('/get', requirePermission('ADMISSIONS', 'VIEW'), controller.getAdmissionById);

/**
 * Get admission with workflow history (remarks)
 * POST /api/admissions/get-with-remarks
 * Permission: ADMISSIONS.VIEW
 * Body: { admission_id: number }
 */
router.post('/get-with-remarks', requirePermission('ADMISSIONS', 'VIEW'), controller.getAdmissionWithRemarks);

/**
 * Create new admission
 * POST /api/admissions/create
 * Permission: ADMISSIONS.CREATE
 * Body: CreateAdmissionDto
 */
router.post('/create', requirePermission('ADMISSIONS', 'CREATE'), controller.createAdmission);

/**
 * Update admission details
 * PUT /api/admissions/update
 * Permission: ADMISSIONS.UPDATE
 * Body: { admission_id: number, ...UpdateAdmissionDto }
 */
router.put('/update', requirePermission('ADMISSIONS', 'UPDATE'), controller.updateAdmission);

/**
 * Delete admission (soft delete)
 * POST /api/admissions/delete
 * Permission: ADMISSIONS.DELETE
 * Body: { admission_id: number }
 */
router.post('/delete', requirePermission('ADMISSIONS', 'DELETE'), controller.deleteAdmission);

/**
 * Approve admission (generates GL)
 * POST /api/admissions/approve
 * Permission: ADMISSIONS.APPROVE
 * Body: { admission_id: number, remarks?: string }
 */
router.post('/approve', requirePermission('ADMISSIONS', 'APPROVE'), controller.approveAdmission);

/**
 * Reject admission
 * POST /api/admissions/reject
 * Permission: ADMISSIONS.APPROVE
 * Body: { admission_id: number, rejectionReason: string }
 */
router.post('/reject', requirePermission('ADMISSIONS', 'APPROVE'), controller.rejectAdmission);

/**
 * Send Medical Query to hospital
 * POST /api/admissions/send-mq
 * Permission: ADMISSIONS.APPROVE
 * Body: { admission_id: number, queryText: string, dueDate?: string }
 */
router.post('/send-mq', requirePermission('ADMISSIONS', 'APPROVE'), controller.sendMedicalQuery);

/**
 * Respond to Medical Query (Hospital)
 * POST /api/admissions/respond-mq
 * Permission: ADMISSIONS.UPDATE
 * Body: { admission_id: number, responseText: string, attachments?: string }
 */
router.post('/respond-mq', requirePermission('ADMISSIONS', 'UPDATE'), controller.respondToMQ);

/**
 * Defer admission for later review
 * POST /api/admissions/defer
 * Permission: ADMISSIONS.APPROVE
 * Body: { admission_id: number, defermentReason: string, followUpDate?: string, assignedTo?: string }
 */
router.post('/defer', requirePermission('ADMISSIONS', 'APPROVE'), controller.deferAdmission);

/**
 * Resolve deferment and continue review
 * POST /api/admissions/resolve-deferment
 * Permission: ADMISSIONS.APPROVE
 * Body: { admission_id: number, resolutionNotes: string }
 */
router.post('/resolve-deferment', requirePermission('ADMISSIONS', 'APPROVE'), controller.resolveDeferment);

/**
 * Get global medical query history
 * POST /api/admissions/mq-history
 * Permission: MQ_OPERATIONS.VIEW
 */
router.post('/mq-history', requirePermission('MQ_OPERATIONS', 'VIEW'), controller.getMQHistory);

/**
 * Update MQ status
 * POST /api/admissions/update-mq-status
 * Permission: MQ_OPERATIONS.MANAGE
 */
router.post('/update-mq-status', requirePermission('MQ_OPERATIONS', 'MANAGE'), controller.updateMQStatus);

router.post('/assessments/get', requirePermission('ADMISSIONS', 'VIEW'), controller.getAdmissionAssessments);
router.post('/assessments/upsert', requirePermission('ADMISSIONS', 'UPDATE'), controller.upsertAdmissionAssessments);

export default router;
