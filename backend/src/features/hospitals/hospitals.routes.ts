import { Router } from 'express';
import { HospitalsController } from './hospitals.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new HospitalsController();

// Apply authentication to all routes
router.use(authenticateToken);

// Hospital management routes (require HOSPITAL_MGMT permissions)
router.post('/list', requirePermission('HOSPITAL_MGMT', 'VIEW'), controller.getHospitals);
router.post('/get', requirePermission('HOSPITAL_MGMT', 'VIEW'), controller.getHospitalById);
router.post('/create', requirePermission('HOSPITAL_MGMT', 'CREATE'), controller.createHospital);
router.put('/update', requirePermission('HOSPITAL_MGMT', 'UPDATE'), controller.updateHospital);
router.post('/delete', requirePermission('HOSPITAL_MGMT', 'DELETE'), controller.deleteHospital);
router.post('/check-code', controller.checkHospitalCode);

// Hospital Addresses routes
router.post('/:hospitalId/addresses/list', requirePermission('HOSPITAL_MGMT', 'VIEW_ADDRESS'), controller.getAddresses);
router.post('/:hospitalId/addresses', requirePermission('HOSPITAL_MGMT', 'MANAGE_ADDRESS'), controller.createAddress);
router.put('/:hospitalId/addresses/:addressId', requirePermission('HOSPITAL_MGMT', 'MANAGE_ADDRESS'), controller.updateAddress);
router.delete('/:hospitalId/addresses/:addressId', requirePermission('HOSPITAL_MGMT', 'MANAGE_ADDRESS'), controller.deleteAddress);

// Hospital Codes routes
router.post('/:hospitalId/codes/list', requirePermission('HOSPITAL_MGMT', 'VIEW_CODES'), controller.getCodes);
router.post('/:hospitalId/codes', requirePermission('HOSPITAL_MGMT', 'MANAGE_CODES'), controller.createCode);
router.put('/:hospitalId/codes/:codeId', requirePermission('HOSPITAL_MGMT', 'MANAGE_CODES'), controller.updateCode);
router.delete('/:hospitalId/codes/:codeId', requirePermission('HOSPITAL_MGMT', 'MANAGE_CODES'), controller.deleteCode);

// Hospital Staff routes
router.post('/:hospitalId/staff/list', requirePermission('HOSPITAL_MGMT', 'VIEW_STAFF'), controller.getStaff);
router.post('/:hospitalId/staff', requirePermission('HOSPITAL_MGMT', 'MANAGE_STAFF'), controller.createStaff);
router.put('/:hospitalId/staff/:staffId', requirePermission('HOSPITAL_MGMT', 'MANAGE_STAFF'), controller.updateStaff);
router.delete('/:hospitalId/staff/:staffId', requirePermission('HOSPITAL_MGMT', 'MANAGE_STAFF'), controller.deleteStaff);

// Staff Contacts routes
router.post('/:hospitalId/staff/:staffId/contacts/list', requirePermission('HOSPITAL_MGMT', 'VIEW_CONTACT'), controller.getContacts);
router.post('/:hospitalId/staff/:staffId/contacts', requirePermission('HOSPITAL_MGMT', 'MANAGE_CONTACT'), controller.createContact);
router.put('/:hospitalId/staff/:staffId/contacts/:contactId', requirePermission('HOSPITAL_MGMT', 'MANAGE_CONTACT'), controller.updateContact);
router.delete('/:hospitalId/staff/:staffId/contacts/:contactId', requirePermission('HOSPITAL_MGMT', 'MANAGE_CONTACT'), controller.deleteContact);

// Fee Schedules routes
router.post('/:hospitalId/fees/list', requirePermission('HOSPITAL_MGMT', 'VIEW_FEES'), controller.getFees);
router.post('/:hospitalId/fees', requirePermission('HOSPITAL_MGMT', 'MANAGE_FEES'), controller.createFee);
router.put('/:hospitalId/fees/:feeId', requirePermission('HOSPITAL_MGMT', 'MANAGE_FEES'), controller.updateFee);
router.delete('/:hospitalId/fees/:feeId', requirePermission('HOSPITAL_MGMT', 'MANAGE_FEES'), controller.deleteFee);

export default router;
