import { Router } from 'express';
import { BanksController } from './banks.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new BanksController();

// Apply authentication to all routes
router.use(authenticateToken);

// Bank management routes (require BANK_MGMT permissions)
router.post('/list', requirePermission('BANK_MGMT', 'VIEW'), controller.getBanks);
router.post('/get', requirePermission('BANK_MGMT', 'VIEW'), controller.getBankById);
router.post('/create', requirePermission('BANK_MGMT', 'CREATE'), controller.createBank);
router.put('/update', requirePermission('BANK_MGMT', 'UPDATE'), controller.updateBank);
router.post('/delete', requirePermission('BANK_MGMT', 'DELETE'), controller.deleteBank);
router.post('/check-code', controller.checkBankCode);

export default router;
