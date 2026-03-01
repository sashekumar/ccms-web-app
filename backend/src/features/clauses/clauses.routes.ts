import { Router } from 'express';
import { ClausesController } from './clauses.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new ClausesController();

// Apply authentication to all routes
router.use(authenticateToken);

// Clause management routes (require CLAUSE_MGMT permissions)
router.post('/list', requirePermission('CLAUSE_MGMT', 'VIEW'), controller.getClauses);
router.post('/get', requirePermission('CLAUSE_MGMT', 'VIEW'), controller.getClauseById);
router.post('/create', requirePermission('CLAUSE_MGMT', 'CREATE'), controller.createClause);
router.put('/update', requirePermission('CLAUSE_MGMT', 'UPDATE'), controller.updateClause);
router.post('/delete', requirePermission('CLAUSE_MGMT', 'DELETE'), controller.deleteClause);
router.post('/check-code', controller.checkClauseCode);

export default router;
