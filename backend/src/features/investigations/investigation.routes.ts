import { Router } from 'express';
import { InvestigationController } from './investigation.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new InvestigationController();

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// INVESTIGATION ROUTES
// ============================================================================

/**
 * Get investigations with filters
 * POST /api/investigations
 * Permission: INVESTIGATIONS.VIEW
 * Body: InvestigationFilters
 */
router.post('/', requirePermission('INVESTIGATIONS', 'VIEW'), controller.getInvestigations);

/**
 * Get investigation statistics
 * POST /api/investigations/stats
 * Permission: INVESTIGATIONS.VIEW
 */
router.post('/stats', requirePermission('INVESTIGATIONS', 'VIEW'), controller.getStats);

/**
 * Get investigation by ID
 * POST /api/investigations/:id
 * Permission: INVESTIGATIONS.VIEW
 * Body: {}
 */
router.post('/:id', requirePermission('INVESTIGATIONS', 'VIEW'), controller.getInvestigationById);

/**
 * Create investigation
 * POST /api/investigations/create
 * Permission: INVESTIGATIONS.UPDATE
 * Body: CreateInvestigationDto
 */
router.post('/create', requirePermission('INVESTIGATIONS', 'UPDATE'), controller.createInvestigation);

/**
 * Update investigation status and findings
 * PUT /api/investigations/:id
 * Permission: INVESTIGATIONS.UPDATE
 * Body: UpdateInvestigationDto
 */
router.put('/:id', requirePermission('INVESTIGATIONS', 'UPDATE'), controller.updateInvestigation);

/**
 * Close investigation
 * PUT /api/investigations/:id/close
 * Permission: INVESTIGATIONS.UPDATE
 * Body: CloseInvestigationDto
 */
router.put('/:id/close', requirePermission('INVESTIGATIONS', 'UPDATE'), controller.closeInvestigation);

/**
 * Add investigation request (document/info request)
 * POST /api/investigations/:id/requests
 * Permission: INVESTIGATIONS.UPDATE
 * Body: CreateInvestigationRequestDto
 */
router.post('/:id/requests', requirePermission('INVESTIGATIONS', 'UPDATE'), controller.addInvestigationRequest);

/**
 * Get investigation requests
 * POST /api/investigations/:id/requests/list
 * Permission: INVESTIGATIONS.VIEW
 * Body: {}
 */
router.post('/:id/requests/list', requirePermission('INVESTIGATIONS', 'VIEW'), controller.getInvestigationRequests);

/**
 * Update investigation request status
 * PUT /api/investigations/requests/:requestId
 * Permission: INVESTIGATIONS.UPDATE
 * Body: UpdateInvestigationRequestDto
 */
router.put('/requests/:requestId', requirePermission('INVESTIGATIONS', 'UPDATE'), controller.updateInvestigationRequest);

/**
 * Add call log
 * POST /api/investigations/:id/calls
 * Permission: INVESTIGATIONS.UPDATE
 * Body: CreateInvestigationCallLogDto
 */
router.post('/:id/calls', requirePermission('INVESTIGATIONS', 'UPDATE'), controller.addCallLog);

/**
 * Get call logs
 * POST /api/investigations/:id/calls/list
 * Permission: INVESTIGATIONS.VIEW
 * Body: {}
 */
router.post('/:id/calls/list', requirePermission('INVESTIGATIONS', 'VIEW'), controller.getCallLogs);

export default router;
