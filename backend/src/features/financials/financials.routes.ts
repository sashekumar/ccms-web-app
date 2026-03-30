import { Router } from 'express';
import { FinancialsController } from './financials.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new FinancialsController();

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// FINANCIALS ROUTES (Payment Advice Management)
// ============================================================================

/**
 * Get payment advices with filters
 * POST /api/financials
 * Permission: FINANCIALS.VIEW
 * Body: PaymentAdviceFilters
 */
router.post('/', requirePermission('FINANCIALS', 'VIEW'), controller.getPaymentAdvices);

/**
 * Get payment advice statistics
 * POST /api/financials/stats
 * Permission: FINANCIALS.VIEW
 */
router.post('/stats', requirePermission('FINANCIALS', 'VIEW'), controller.getStats);

/**
 * Create payment advice
 * POST /api/financials/create
 * Permission: FINANCIALS.UPDATE
 * Body: CreatePaymentAdviceDto
 */
router.post('/create', requirePermission('FINANCIALS', 'UPDATE'), controller.createPaymentAdvice);

/**
 * Get payment advice by ID (with sub-entities)
 * POST /api/financials/:id
 * Permission: FINANCIALS.VIEW
 */
router.post('/:id', requirePermission('FINANCIALS', 'VIEW'), controller.getPaymentAdviceById);

/**
 * Update payment advice status and fields
 * PUT /api/financials/:id
 * Permission: FINANCIALS.UPDATE
 * Body: UpdatePaymentAdviceDto
 */
router.put('/:id', requirePermission('FINANCIALS', 'UPDATE'), controller.updatePaymentAdvice);

export default router;
