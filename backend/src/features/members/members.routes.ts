import { Router } from 'express';
import { MembersController } from './members.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new MembersController();

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// MEMBERS ROUTES (POLICY_HOLDERS module)
// ============================================================================

// Member management routes
router.post('/list', requirePermission('POLICY_HOLDERS', 'VIEW'), controller.getMembers);
router.post('/get', requirePermission('POLICY_HOLDERS', 'VIEW'), controller.getMemberById);
router.post('/check-ic', controller.checkICExists);
router.post('/create', requirePermission('POLICY_HOLDERS', 'CREATE'), controller.createMember);
router.put('/update', requirePermission('POLICY_HOLDERS', 'UPDATE'), controller.updateMember);
router.post('/delete', requirePermission('POLICY_HOLDERS', 'DELETE'), controller.deleteMember);
router.post('/:memberId/restore', requirePermission('POLICY_HOLDERS', 'DEACTIVATE'), controller.restoreMember);

// ============================================================================
// MEMBER ADDRESSES ROUTES
// READ: VIEW_ADDRESSES, WRITE: MANAGE_ADDRESSES
// ============================================================================

router.post('/:memberId/addresses/list', requirePermission('POLICY_HOLDERS', 'VIEW_ADDRESSES'), controller.getAddresses);
router.post('/addresses/get', requirePermission('POLICY_HOLDERS', 'VIEW_ADDRESSES'), controller.getAddressById);
router.post('/addresses/create', requirePermission('POLICY_HOLDERS', 'MANAGE_ADDRESSES'), controller.createAddress);
router.put('/addresses/:addressId', requirePermission('POLICY_HOLDERS', 'MANAGE_ADDRESSES'), controller.updateAddress);
router.delete('/addresses/:addressId', requirePermission('POLICY_HOLDERS', 'MANAGE_ADDRESSES'), controller.deleteAddress);
router.post('/addresses/:addressId/set-primary', requirePermission('POLICY_HOLDERS', 'MANAGE_ADDRESSES'), controller.setPrimaryAddress);

// ============================================================================
// MEMBER CONTACTS ROUTES
// READ: VIEW_CONTACTS, WRITE: MANAGE_CONTACTS
// ============================================================================

router.post('/:memberId/contacts/list', requirePermission('POLICY_HOLDERS', 'VIEW_CONTACTS'), controller.getContacts);
router.post('/contacts/get', requirePermission('POLICY_HOLDERS', 'VIEW_CONTACTS'), controller.getContactById);
router.post('/contacts/create', requirePermission('POLICY_HOLDERS', 'MANAGE_CONTACTS'), controller.createContact);
router.put('/contacts/:contactId', requirePermission('POLICY_HOLDERS', 'MANAGE_CONTACTS'), controller.updateContact);
router.delete('/contacts/:contactId', requirePermission('POLICY_HOLDERS', 'MANAGE_CONTACTS'), controller.deleteContact);
router.post('/contacts/:contactId/set-primary', requirePermission('POLICY_HOLDERS', 'MANAGE_CONTACTS'), controller.setPrimaryContact);

// ============================================================================
// MEMBER POLICIES ROUTES
// READ: VIEW_POLICIES, WRITE: MANAGE_POLICIES
// ============================================================================

router.post('/:memberId/policies/list', requirePermission('POLICY_HOLDERS', 'VIEW_POLICIES'), controller.getPolicies);
router.post('/policies/get', requirePermission('POLICY_HOLDERS', 'VIEW_POLICIES'), controller.getPolicyById);
router.post('/policies/check-policy-no', controller.checkPolicyNo);
router.post('/policies/create', requirePermission('POLICY_HOLDERS', 'MANAGE_POLICIES'), controller.createPolicy);
router.put('/policies/:policyId', requirePermission('POLICY_HOLDERS', 'MANAGE_POLICIES'), controller.updatePolicy);
router.delete('/policies/:policyId', requirePermission('POLICY_HOLDERS', 'MANAGE_POLICIES'), controller.deletePolicy);

// ============================================================================
// MEMBER DEPENDENTS ROUTES
// READ: VIEW_DEPENDENTS, WRITE: MANAGE_DEPENDENTS
// ============================================================================

router.post('/:memberId/dependents/list', requirePermission('POLICY_HOLDERS', 'VIEW_DEPENDENTS'), controller.getDependents);
router.post('/dependents/get', requirePermission('POLICY_HOLDERS', 'VIEW_DEPENDENTS'), controller.getDependentById);
router.post('/dependents/create', requirePermission('POLICY_HOLDERS', 'MANAGE_DEPENDENTS'), controller.createDependent);
router.put('/dependents/:dependentId', requirePermission('POLICY_HOLDERS', 'MANAGE_DEPENDENTS'), controller.updateDependent);
router.delete('/dependents/:dependentId', requirePermission('POLICY_HOLDERS', 'MANAGE_DEPENDENTS'), controller.deleteDependent);
router.post('/dependents/:dependentId/toggle-active', requirePermission('POLICY_HOLDERS', 'MANAGE_DEPENDENTS'), controller.toggleDependentActive);

// ============================================================================
// MEMBER PEC CONDITIONS ROUTES
// READ: VIEW_PEC, WRITE: MANAGE_PEC
// ============================================================================

router.post('/dependents/:dependentId/pec/list', requirePermission('POLICY_HOLDERS', 'VIEW_PEC'), controller.getPECs);
router.post('/pec/get', requirePermission('POLICY_HOLDERS', 'VIEW_PEC'), controller.getPECById);
router.post('/pec/create', requirePermission('POLICY_HOLDERS', 'MANAGE_PEC'), controller.createPEC);
router.put('/pec/:pecId', requirePermission('POLICY_HOLDERS', 'MANAGE_PEC'), controller.updatePEC);
router.delete('/pec/:pecId', requirePermission('POLICY_HOLDERS', 'MANAGE_PEC'), controller.deletePEC);
router.post('/pec/:pecId/toggle-excluded', requirePermission('POLICY_HOLDERS', 'MANAGE_PEC'), controller.togglePECExcluded);

export default router;
