import { Request, Response } from 'express';
import { MembersService } from './members.service';
import { 
  MemberFilters, 
  CreateMemberDto, 
  UpdateMemberDto, 
  GetMemberRequest,
  CheckICRequest,
  SetMemberDeletedStatusRequest
} from './members.types';
import { 
  CreateMemberAddressDto, 
  UpdateMemberAddressDto, 
  GetMemberAddressRequest,
  SetPrimaryAddressRequest
} from './member-addresses.types';
import { 
  CreateMemberContactDto, 
  UpdateMemberContactDto, 
  GetMemberContactRequest,
  SetPrimaryContactRequest
} from './member-contacts.types';
import { 
  CreateMemberPolicyDto, 
  UpdateMemberPolicyDto, 
  GetMemberPolicyRequest,
  CheckPolicyNoRequest
} from './member-policies.types';
import { 
  CreateMemberDependentDto, 
  UpdateMemberDependentDto, 
  GetMemberDependentRequest,
  SetDependentActiveStatusRequest
} from './member-dependents.types';
import { 
  CreateMemberPECDto, 
  UpdateMemberPECDto, 
  GetMemberPECRequest,
  SetPECExcludedStatusRequest
} from './member-pec.types';
import { ResponseUtil } from '../../core/utils/response.util';
import { getErrorMessage } from '../../core/utils/error.util';

export class MembersController {
  private service: MembersService;

  constructor() {
    this.service = new MembersService();
  }

  // ============================================================================
  // MEMBERS
  // ============================================================================

  /**
   * Get paginated list of members
   * POST /api/members/list
   * Body: { search?, isDeleted?, page?, limit?, sortBy?, sortOrder? }
   */
  public getMembers = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: MemberFilters = {
        search: req.body.search,
        isDeleted: req.body.isDeleted ?? req.body.is_deleted,
        page: req.body.page || 1,
        limit: req.body.limit || 10,
        sortBy: req.body.sortBy ?? req.body.sort_by ?? 'member_id',
        sortOrder: req.body.sortOrder ?? req.body.sort_order ?? 'DESC'
      };

      const result = await this.service.getMembers(filters);

      ResponseUtil.success(res, result, 'Members retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching members', 500, getErrorMessage(error));
    }
  };

  /**
   * Get member by ID
   * POST /api/members/get
   * Body: { member_id }
   */
  public getMemberById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetMemberRequest = req.body;
      const memberId = request.member_id;

      if (!memberId || memberId.trim() === '') {
        ResponseUtil.error(res, 'Invalid member ID', 400);
        return;
      }

      const member = await this.service.getMemberById(memberId);

      if (!member) {
        ResponseUtil.notFound(res, 'Member not found');
        return;
      }

      ResponseUtil.success(res, member, 'Member retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching member', 500, getErrorMessage(error));
    }
  };

  /**
   * Check if IC number exists
   * POST /api/members/check-ic
   * Body: { ic_no, member_id? }
   */
  public checkICExists = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: CheckICRequest = req.body;
      const { ic_no, member_id } = request;

      if (!ic_no) {
        ResponseUtil.error(res, 'IC number is required', 400);
        return;
      }

      const exists = await this.service.checkICExists(ic_no, member_id);

      ResponseUtil.success(
        res,
        { exists, message: exists ? 'IC number already exists' : 'IC number is available' },
        'IC check completed'
      );
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking IC number', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new member
   * POST /api/members/create
   * Body: { ic_no, full_name, date_of_birth?, gender_id?, marital_status_id?, phone?, email?, address?, postcode?, 
   *         city?, state_id?, country_id?, bank_id?, bank_account_no?, bank_account_name?, legacy_member_id?, 
   *         external_guid? }
   */
  public createMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateMemberDto = req.body;

      // Validate required fields
      if (!dto.ic_no) {
        ResponseUtil.error(res, 'IC number is required', 400);
        return;
      }

      if (!dto.full_name) {
        ResponseUtil.error(res, 'Full name is required', 400);
        return;
      }

      // Check if IC already exists
      const exists = await this.service.checkICExists(dto.ic_no);
      if (exists) {
        ResponseUtil.error(res, 'IC number already exists', 400);
        return;
      }

      const memberId = await this.service.createMember(dto);

      ResponseUtil.success(res, { member_id: memberId }, 'Member created successfully', 201);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating member', 500, getErrorMessage(error));
    }
  };

  /**
   * Update member
   * PUT /api/members/update
   * Body: { member_id, ic_no?, full_name?, date_of_birth?, gender_id?, marital_status_id?, phone?, email?, 
   *         address?, postcode?, city?, state_id?, country_id?, bank_id?, bank_account_no?, bank_account_name?, 
   *         legacy_member_id?, external_guid? }
   */
  public updateMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const { member_id, ...dto }: UpdateMemberDto & { member_id: string } = req.body;

      if (!member_id || member_id.trim() === '') {
        ResponseUtil.error(res, 'Invalid member ID', 400);
        return;
      }

      // Check if member exists
      const member = await this.service.getMemberById(member_id);
      if (!member) {
        ResponseUtil.notFound(res, 'Member not found');
        return;
      }

      // If IC is being updated, check if it already exists
      if (dto.ic_no && dto.ic_no !== member.ic_no) {
        const exists = await this.service.checkICExists(dto.ic_no, member_id);
        if (exists) {
          ResponseUtil.error(res, 'IC number already exists', 400);
          return;
        }
      }

      const success = await this.service.updateMember(member_id, dto);

      if (success) {
        ResponseUtil.success(res, { member_id }, 'Member updated successfully');
      } else {
        ResponseUtil.error(res, 'No changes made', 400);
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error updating member', 500, getErrorMessage(error));
    }
  };

  /**
   * Delete member (soft delete)
   * POST /api/members/delete
   * Body: { member_id }
   */
  public deleteMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const { member_id } = req.body;

      if (!member_id || member_id.trim() === '') {
        ResponseUtil.error(res, 'Invalid member ID', 400);
        return;
      }

      const success = await this.service.deleteMember(member_id);

      if (success) {
        ResponseUtil.success(res, { member_id }, 'Member deleted successfully');
      } else {
        ResponseUtil.notFound(res, 'Member not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deleting member', 500, getErrorMessage(error));
    }
  };

  /**
   * Restore member (undelete)
   * POST /api/members/:memberId/restore
   * Params: { memberId }
   */
  public restoreMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const memberId = req.params.memberId;

      if (!memberId || memberId.trim() === '') {
        ResponseUtil.error(res, 'Invalid member ID', 400);
        return;
      }

      const success = await this.service.setMemberDeletedStatus(memberId, false);

      if (success) {
        ResponseUtil.success(res, { member_id: memberId }, 'Member restored successfully');
      } else {
        ResponseUtil.notFound(res, 'Member not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error restoring member', 500, getErrorMessage(error));
    }
  };

  // ============================================================================
  // MEMBER ADDRESSES
  // ============================================================================

  /**
   * Get all addresses for a member
   * POST /api/members/:memberId/addresses/list
   * Params: { memberId }
   */
  public getAddresses = async (req: Request, res: Response): Promise<void> => {
    try {
      const memberId = req.params.memberId;

      if (!memberId || memberId.trim() === '') {
        ResponseUtil.error(res, 'Invalid member ID', 400);
        return;
      }

      const addresses = await this.service.getAddressesByMemberId(memberId);

      ResponseUtil.success(res, addresses, 'Member addresses retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching addresses', 500, getErrorMessage(error));
    }
  };

  /**
   * Get address by ID
   * POST /api/members/addresses/get
   * Body: { address_id }
   */
  public getAddressById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetMemberAddressRequest = req.body;
      const addressId = request.address_id;

      if (!addressId || addressId.trim() === '') {
        ResponseUtil.error(res, 'Invalid address ID', 400);
        return;
      }

      const address = await this.service.getAddressById(addressId);

      if (!address) {
        ResponseUtil.notFound(res, 'Address not found');
        return;
      }

      ResponseUtil.success(res, address, 'Address retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching address', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new member address
   * POST /api/members/addresses/create
   * Body: { member_id, address_line1?, address_line2?, city?, state?, postcode?, country?, is_primary?, 
   *         legacy_member_address_id? }
   */
  public createAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateMemberAddressDto = req.body;

      if (!dto.member_id || dto.member_id.trim() === '') {
        ResponseUtil.error(res, 'Valid member ID is required', 400);
        return;
      }

      // Check if member exists
      const member = await this.service.getMemberById(dto.member_id);
      if (!member) {
        ResponseUtil.notFound(res, 'Member not found');
        return;
      }

      const addressId = await this.service.createAddress(dto);

      ResponseUtil.success(res, { address_id: addressId }, 'Address created successfully', 201);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating address', 500, getErrorMessage(error));
    }
  };

  /**
   * Update member address
   * PUT /api/members/addresses/:addressId
   * Params: { addressId }
   * Body: { address_line1?, address_line2?, city?, state?, postcode?, country?, is_primary? }
   */
  public updateAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const addressId = req.params.addressId;

      if (!addressId || addressId.trim() === '') {
        ResponseUtil.error(res, 'Invalid address ID', 400);
        return;
      }

      const dto: UpdateMemberAddressDto = req.body;

      const success = await this.service.updateAddress(addressId, dto);

      if (success) {
        ResponseUtil.success(res, { address_id: addressId }, 'Address updated successfully');
      } else {
        ResponseUtil.error(res, 'No changes made or address not found', 400);
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error updating address', 500, getErrorMessage(error));
    }
  };

  /**
   * Delete member address
   * DELETE /api/members/addresses/:addressId
   * Params: { addressId }
   */
  public deleteAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const addressId = req.params.addressId;

      if (!addressId || addressId.trim() === '') {
        ResponseUtil.error(res, 'Invalid address ID', 400);
        return;
      }

      const success = await this.service.deleteAddress(addressId);

      if (success) {
        ResponseUtil.success(res, { address_id: addressId }, 'Address deleted successfully');
      } else {
        ResponseUtil.notFound(res, 'Address not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deleting address', 500, getErrorMessage(error));
    }
  };

  /**
   * Set primary address
   * POST /api/members/addresses/:addressId/set-primary
   * Params: { addressId }
   */
  public setPrimaryAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const addressId = req.params.addressId;

      if (!addressId || addressId.trim() === '') {
        ResponseUtil.error(res, 'Invalid address ID', 400);
        return;
      }

      // Get the address to find member_id
      const address = await this.service.getAddressById(addressId);
      if (!address) {
        ResponseUtil.notFound(res, 'Address not found');
        return;
      }

      const success = await this.service.setPrimaryAddress(address.member_id, addressId);

      if (success) {
        ResponseUtil.success(res, { address_id: addressId }, 'Primary address set successfully');
      } else {
        ResponseUtil.notFound(res, 'Address not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error setting primary address', 500, getErrorMessage(error));
    }
  };

  // ============================================================================
  // MEMBER CONTACTS
  // ============================================================================

  /**
   * Get all contacts for a member
   * POST /api/members/:memberId/contacts/list
   * Params: { memberId }
   */
  public getContacts = async (req: Request, res: Response): Promise<void> => {
    try {
      const memberId = req.params.memberId;

      if (!memberId || memberId.trim() === '') {
        ResponseUtil.error(res, 'Invalid member ID', 400);
        return;
      }

      const contacts = await this.service.getContactsByMemberId(memberId);

      ResponseUtil.success(res, contacts, 'Member contacts retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching contacts', 500, getErrorMessage(error));
    }
  };

  /**
   * Get contact by ID
   * POST /api/members/contacts/get
   * Body: { contact_id }
   */
  public getContactById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetMemberContactRequest = req.body;
      const contactId = request.contact_id;

      if (!contactId || contactId.trim() === '') {
        ResponseUtil.error(res, 'Invalid contact ID', 400);
        return;
      }

      const contact = await this.service.getContactById(contactId);

      if (!contact) {
        ResponseUtil.notFound(res, 'Contact not found');
        return;
      }

      ResponseUtil.success(res, contact, 'Contact retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching contact', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new member contact
   * POST /api/members/contacts/create
   * Body: { member_id, contact_type, contact_value?, is_primary?, legacy_member_contact_id? }
   */
  public createContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateMemberContactDto = req.body;

      if (!dto.member_id || dto.member_id.trim() === '') {
        ResponseUtil.error(res, 'Valid member ID is required', 400);
        return;
      }

      if (!dto.contact_type) {
        ResponseUtil.error(res, 'Contact type is required', 400);
        return;
      }

      // Check if member exists
      const member = await this.service.getMemberById(dto.member_id);
      if (!member) {
        ResponseUtil.notFound(res, 'Member not found');
        return;
      }

      const contactId = await this.service.createContact(dto);

      ResponseUtil.success(res, { contact_id: contactId }, 'Contact created successfully', 201);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating contact', 500, getErrorMessage(error));
    }
  };

  /**
   * Update member contact
   * PUT /api/members/contacts/:contactId
   * Params: { contactId }
   * Body: { contact_type?, contact_value?, is_primary? }
   */
  public updateContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const contactId = req.params.contactId;

      if (!contactId || contactId.trim() === '') {
        ResponseUtil.error(res, 'Invalid contact ID', 400);
        return;
      }

      const dto: UpdateMemberContactDto = req.body;

      const success = await this.service.updateContact(contactId, dto);

      if (success) {
        ResponseUtil.success(res, { contact_id: contactId }, 'Contact updated successfully');
      } else {
        ResponseUtil.error(res, 'No changes made or contact not found', 400);
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error updating contact', 500, getErrorMessage(error));
    }
  };

  /**
   * Delete member contact
   * DELETE /api/members/contacts/:contactId
   * Params: { contactId }
   */
  public deleteContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const contactId = req.params.contactId;

      if (!contactId || contactId.trim() === '') {
        ResponseUtil.error(res, 'Invalid contact ID', 400);
        return;
      }

      const success = await this.service.deleteContact(contactId);

      if (success) {
        ResponseUtil.success(res, { contact_id: contactId }, 'Contact deleted successfully');
      } else {
        ResponseUtil.notFound(res, 'Contact not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deleting contact', 500, getErrorMessage(error));
    }
  };

  /**
   * Set primary contact
   * POST /api/members/contacts/:contactId/set-primary
   * Params: { contactId }
   */
  public setPrimaryContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const contactId = req.params.contactId;

      if (!contactId || contactId.trim() === '') {
        ResponseUtil.error(res, 'Invalid contact ID', 400);
        return;
      }

      // Get the contact to find member_id and contact_type
      const contact = await this.service.getContactById(contactId);
      if (!contact) {
        ResponseUtil.notFound(res, 'Contact not found');
        return;
      }

      if (!contact.contact_type) {
        ResponseUtil.error(res, 'Contact type is missing', 400);
        return;
      }

      const success = await this.service.setPrimaryContact(contact.member_id, contactId, contact.contact_type);

      if (success) {
        ResponseUtil.success(res, { contact_id: contactId }, 'Primary contact set successfully');
      } else {
        ResponseUtil.notFound(res, 'Contact not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error setting primary contact', 500, getErrorMessage(error));
    }
  };

  // ============================================================================
  // MEMBER POLICIES
  // ============================================================================

  /**
   * Get all policies for a member
   * POST /api/members/:memberId/policies/list
   * Params: { memberId }
   */
  public getPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
      const memberId = req.params.memberId;

      if (!memberId || memberId.trim() === '') {
        ResponseUtil.error(res, 'Invalid member ID', 400);
        return;
      }

      const policies = await this.service.getPoliciesByMemberId(memberId);

      ResponseUtil.success(res, policies, 'Member policies retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching policies', 500, getErrorMessage(error));
    }
  };

  /**
   * Get policy by ID
   * POST /api/members/policies/get
   * Body: { policy_id }
   */
  public getPolicyById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetMemberPolicyRequest = req.body;
      const policyId = request.policy_id;

      if (!policyId || policyId.trim() === '') {
        ResponseUtil.error(res, 'Invalid policy ID', 400);
        return;
      }

      const policy = await this.service.getPolicyById(policyId);

      if (!policy) {
        ResponseUtil.notFound(res, 'Policy not found');
        return;
      }

      ResponseUtil.success(res, policy, 'Policy retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching policy', 500, getErrorMessage(error));
    }
  };

  /**
   * Check if policy number exists
   * POST /api/members/policies/check-policy-no
   * Body: { policy_no, policy_id? }
   */
  public checkPolicyNo = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: CheckPolicyNoRequest = req.body;
      const { policy_no, policy_id } = request;

      if (!policy_no) {
        ResponseUtil.error(res, 'Policy number is required', 400);
        return;
      }

      const exists = await this.service.checkPolicyNoExists(policy_no, policy_id);

      ResponseUtil.success(
        res,
        { exists, message: exists ? 'Policy number already exists' : 'Policy number is available' },
        'Policy number check completed'
      );
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking policy number', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new member policy
   * POST /api/members/policies/create
   * Body: { member_id, product_id, policy_no?, effective_date?, expiry_date?, legacy_member_policy_id? }
   */
  public createPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateMemberPolicyDto = req.body;

      if (!dto.member_id || dto.member_id.trim() === '') {
        ResponseUtil.error(res, 'Valid member ID is required', 400);
        return;
      }

      if (!dto.product_id || dto.product_id.trim() === '') {
        ResponseUtil.error(res, 'Valid product ID is required', 400);
        return;
      }

      // Check if member exists
      const member = await this.service.getMemberById(dto.member_id);
      if (!member) {
        ResponseUtil.notFound(res, 'Member not found');
        return;
      }

      // Check if policy number already exists
      if (dto.policy_no) {
        const exists = await this.service.checkPolicyNoExists(dto.policy_no);
        if (exists) {
          ResponseUtil.error(res, 'Policy number already exists', 400);
          return;
        }
      }

      const policyId = await this.service.createPolicy(dto);

      ResponseUtil.success(res, { policy_id: policyId }, 'Policy created successfully', 201);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating policy', 500, getErrorMessage(error));
    }
  };

  /**
   * Update member policy
   * PUT /api/members/policies/:policyId
   * Params: { policyId }
   * Body: { product_id?, policy_no?, effective_date?, expiry_date? }
   */
  public updatePolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const policyId = req.params.policyId;

      if (!policyId || policyId.trim() === '') {
        ResponseUtil.error(res, 'Invalid policy ID', 400);
        return;
      }

      const dto: UpdateMemberPolicyDto = req.body;

      // If policy_no is being updated, check if it already exists
      if (dto.policy_no) {
        const exists = await this.service.checkPolicyNoExists(dto.policy_no, policyId);
        if (exists) {
          ResponseUtil.error(res, 'Policy number already exists', 400);
          return;
        }
      }

      const success = await this.service.updatePolicy(policyId, dto);

      if (success) {
        ResponseUtil.success(res, { policy_id: policyId }, 'Policy updated successfully');
      } else {
        ResponseUtil.error(res, 'No changes made or policy not found', 400);
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error updating policy', 500, getErrorMessage(error));
    }
  };

  /**
   * Delete member policy (soft delete)
   * DELETE /api/members/policies/:policyId
   * Params: { policyId }
   */
  public deletePolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const policyId = req.params.policyId;

      if (!policyId || policyId.trim() === '') {
        ResponseUtil.error(res, 'Invalid policy ID', 400);
        return;
      }

      const success = await this.service.deletePolicy(policyId);

      if (success) {
        ResponseUtil.success(res, { policy_id: policyId }, 'Policy deleted successfully');
      } else {
        ResponseUtil.notFound(res, 'Policy not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deleting policy', 500, getErrorMessage(error));
    }
  };

  // ============================================================================
  // MEMBER DEPENDENTS
  // ============================================================================

  /**
   * Get all dependents for a member
   * POST /api/members/:memberId/dependents/list
   * Params: { memberId }
   */
  public getDependents = async (req: Request, res: Response): Promise<void> => {
    try {
      const memberId = req.params.memberId;

      if (!memberId || memberId.trim() === '') {
        ResponseUtil.error(res, 'Invalid member ID', 400);
        return;
      }

      const dependents = await this.service.getDependentsByMemberId(memberId);

      ResponseUtil.success(res, dependents, 'Member dependents retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching dependents', 500, getErrorMessage(error));
    }
  };

  /**
   * Get dependent by ID
   * POST /api/members/dependents/get
   * Body: { dependent_id }
   */
  public getDependentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetMemberDependentRequest = req.body;
      const dependentId = request.dependent_id;

      if (!dependentId || dependentId.trim() === '') {
        ResponseUtil.error(res, 'Invalid dependent ID', 400);
        return;
      }

      const dependent = await this.service.getDependentById(dependentId);

      if (!dependent) {
        ResponseUtil.notFound(res, 'Dependent not found');
        return;
      }

      ResponseUtil.success(res, dependent, 'Dependent retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching dependent', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new member dependent
   * POST /api/members/dependents/create
   * Body: { principal_member_id, dependent_name, relationship_id?, date_of_birth?, is_active?, 
   *         legacy_member_dependent_id? }
   */
  public createDependent = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateMemberDependentDto = req.body;

      if (!dto.principal_member_id || dto.principal_member_id.trim() === '') {
        ResponseUtil.error(res, 'Valid principal member ID is required', 400);
        return;
      }

      if (!dto.full_name) {
        ResponseUtil.error(res, 'Dependent name is required', 400);
        return;
      }

      // Check if member exists
      const member = await this.service.getMemberById(dto.principal_member_id);
      if (!member) {
        ResponseUtil.notFound(res, 'Principal member not found');
        return;
      }

      const dependentId = await this.service.createDependent(dto);

      ResponseUtil.success(res, { dependent_id: dependentId }, 'Dependent created successfully', 201);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating dependent', 500, getErrorMessage(error));
    }
  };

  /**
   * Update member dependent
   * PUT /api/members/dependents/:dependentId
   * Params: { dependentId }
   * Body: { dependent_name?, relationship_id?, date_of_birth? }
   */
  public updateDependent = async (req: Request, res: Response): Promise<void> => {
    try {
      const dependentId = req.params.dependentId;

      if (!dependentId || dependentId.trim() === '') {
        ResponseUtil.error(res, 'Invalid dependent ID', 400);
        return;
      }

      const dto: UpdateMemberDependentDto = req.body;

      const success = await this.service.updateDependent(dependentId, dto);

      if (success) {
        ResponseUtil.success(res, { dependent_id: dependentId }, 'Dependent updated successfully');
      } else {
        ResponseUtil.error(res, 'No changes made or dependent not found', 400);
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error updating dependent', 500, getErrorMessage(error));
    }
  };

  /**
   * Delete member dependent
   * DELETE /api/members/dependents/:dependentId
   * Params: { dependentId }
   */
  public deleteDependent = async (req: Request, res: Response): Promise<void> => {
    try {
      const dependentId = req.params.dependentId;

      if (!dependentId || dependentId.trim() === '') {
        ResponseUtil.error(res, 'Invalid dependent ID', 400);
        return;
      }

      const success = await this.service.deleteDependent(dependentId);

      if (success) {
        ResponseUtil.success(res, { dependent_id: dependentId }, 'Dependent deleted successfully');
      } else {
        ResponseUtil.notFound(res, 'Dependent not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deleting dependent', 500, getErrorMessage(error));
    }
  };

  /**
   * Toggle dependent active status
   * POST /api/members/dependents/:dependentId/toggle-active
   * Params: { dependentId }
   * Body: { is_active }
   */
  public toggleDependentActive = async (req: Request, res: Response): Promise<void> => {
    try {
      const dependentId = req.params.dependentId;

      if (!dependentId || dependentId.trim() === '') {
        ResponseUtil.error(res, 'Invalid dependent ID', 400);
        return;
      }

      const { is_active } = req.body;

      if (typeof is_active !== 'boolean') {
        ResponseUtil.error(res, 'is_active must be a boolean value', 400);
        return;
      }

      const success = await this.service.setDependentActiveStatus(dependentId, is_active);

      if (success) {
        const status = is_active ? 'activated' : 'deactivated';
        ResponseUtil.success(res, { dependent_id: dependentId, is_active }, `Dependent ${status} successfully`);
      } else {
        ResponseUtil.notFound(res, 'Dependent not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error toggling dependent status', 500, getErrorMessage(error));
    }
  };

  // ============================================================================
  // MEMBER PEC CONDITIONS
  // ============================================================================

  /**
   * Get all PEC conditions for a dependent
   * POST /api/members/dependents/:dependentId/pec/list
   * Params: { dependentId }
   */
  public getPECs = async (req: Request, res: Response): Promise<void> => {
    try {
      const dependentId = req.params.dependentId;

      if (!dependentId || dependentId.trim() === '') {
        ResponseUtil.error(res, 'Invalid dependent ID', 400);
        return;
      }

      const pecs = await this.service.getPECsByDependentId(dependentId);

      ResponseUtil.success(res, pecs, 'PEC conditions retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching PEC conditions', 500, getErrorMessage(error));
    }
  };

  /**
   * Get PEC condition by ID
   * POST /api/members/pec/get
   * Body: { pec_id }
   */
  public getPECById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetMemberPECRequest = req.body;
      const pecId = request.pec_id;

      if (!pecId || pecId.trim() === '') {
        ResponseUtil.error(res, 'Invalid PEC ID', 400);
        return;
      }

      const pec = await this.service.getPECById(pecId);

      if (!pec) {
        ResponseUtil.notFound(res, 'PEC condition not found');
        return;
      }

      ResponseUtil.success(res, pec, 'PEC condition retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching PEC condition', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new PEC condition
   * POST /api/members/pec/create
   * Body: { dependent_id, condition_code?, condition_name?, diagnosis_date?, is_excluded?, notes?, 
   *         legacy_member_pec_id? }
   */
  public createPEC = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateMemberPECDto = req.body;

      if (!dto.dependent_id || dto.dependent_id.trim() === '') {
        ResponseUtil.error(res, 'Valid dependent ID is required', 400);
        return;
      }

      // Check if dependent exists
      const dependent = await this.service.getDependentById(dto.dependent_id);
      if (!dependent) {
        ResponseUtil.notFound(res, 'Dependent not found');
        return;
      }

      const pecId = await this.service.createPEC(dto);

      ResponseUtil.success(res, { pec_id: pecId }, 'PEC condition created successfully', 201);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating PEC condition', 500, getErrorMessage(error));
    }
  };

  /**
   * Update PEC condition
   * PUT /api/members/pec/:pecId
   * Params: { pecId }
   * Body: { condition_code?, condition_name?, diagnosis_date?, is_excluded?, notes? }
   */
  public updatePEC = async (req: Request, res: Response): Promise<void> => {
    try {
      const pecId = req.params.pecId;

      if (!pecId || pecId.trim() === '') {
        ResponseUtil.error(res, 'Invalid PEC ID', 400);
        return;
      }

      const dto: UpdateMemberPECDto = req.body;

      const success = await this.service.updatePEC(pecId, dto);

      if (success) {
        ResponseUtil.success(res, { pec_id: pecId }, 'PEC condition updated successfully');
      } else {
        ResponseUtil.error(res, 'No changes made or PEC condition not found', 400);
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error updating PEC condition', 500, getErrorMessage(error));
    }
  };

  /**
   * Delete PEC condition
   * DELETE /api/members/pec/:pecId
   * Params: { pecId }
   */
  public deletePEC = async (req: Request, res: Response): Promise<void> => {
    try {
      const pecId = req.params.pecId;

      if (!pecId || pecId.trim() === '') {
        ResponseUtil.error(res, 'Invalid PEC ID', 400);
        return;
      }

      const success = await this.service.deletePEC(pecId);

      if (success) {
        ResponseUtil.success(res, { pec_id: pecId }, 'PEC condition deleted successfully');
      } else {
        ResponseUtil.notFound(res, 'PEC condition not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deleting PEC condition', 500, getErrorMessage(error));
    }
  };

  /**
   * Toggle PEC excluded status
   * POST /api/members/pec/:pecId/toggle-excluded
   * Params: { pecId }
   * Body: { is_excluded }
   */
  public togglePECExcluded = async (req: Request, res: Response): Promise<void> => {
    try {
      const pecId = req.params.pecId;

      if (!pecId || pecId.trim() === '') {
        ResponseUtil.error(res, 'Invalid PEC ID', 400);
        return;
      }

      const { is_excluded } = req.body;

      if (typeof is_excluded !== 'boolean') {
        ResponseUtil.error(res, 'is_excluded must be a boolean value', 400);
        return;
      }

      const success = await this.service.setPECExcludedStatus(pecId, is_excluded);

      if (success) {
        const status = is_excluded ? 'excluded' : 'included';
        ResponseUtil.success(res, { pec_id: pecId, is_excluded }, `PEC condition ${status} successfully`);
      } else {
        ResponseUtil.notFound(res, 'PEC condition not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error toggling PEC excluded status', 500, getErrorMessage(error));
    }
  };
}
