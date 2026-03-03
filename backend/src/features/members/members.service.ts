const NodeCache = require('node-cache');
import { MembersRepository } from './members.repository';
import { MemberAddressesRepository } from './member-addresses.repository';
import { MemberContactsRepository } from './member-contacts.repository';
import { MemberPoliciesRepository } from './member-policies.repository';
import { MemberDependentsRepository } from './member-dependents.repository';
import { MemberPECRepository } from './member-pec.repository';
import { 
  Member, 
  MemberFilters, 
  PaginatedMembers, 
  CreateMemberDto, 
  UpdateMemberDto 
} from './members.types';
import { MemberAddress, CreateMemberAddressDto, UpdateMemberAddressDto } from './member-addresses.types';
import { MemberContact, CreateMemberContactDto, UpdateMemberContactDto } from './member-contacts.types';
import { MemberPolicy, CreateMemberPolicyDto, UpdateMemberPolicyDto } from './member-policies.types';
import { MemberDependent, CreateMemberDependentDto, UpdateMemberDependentDto } from './member-dependents.types';
import { MemberPEC, CreateMemberPECDto, UpdateMemberPECDto } from './member-pec.types';
import { BaseService } from '../../core/base/base.service';

// 5-minute cache TTL (same as permissions cache)
const MEMBER_CACHE_TTL = 300;

// Cache key prefixes
const CACHE_KEYS = {
  MEMBER: 'member',
  MEMBER_LIST: 'member_list',
  IC_NO: 'ic_no',
  ADDRESSES: 'addresses',
  CONTACTS: 'contacts',
  POLICIES: 'policies',
  DEPENDENTS: 'dependents',
  PEC: 'pec'
};

export class MembersService extends BaseService<Member> {
  protected repository: MembersRepository;
  private addressesRepository: MemberAddressesRepository;
  private contactsRepository: MemberContactsRepository;
  private policiesRepository: MemberPoliciesRepository;
  private dependentsRepository: MemberDependentsRepository;
  private pecRepository: MemberPECRepository;
  private memberCache: typeof NodeCache;

  constructor() {
    const repository = new MembersRepository();
    super(repository);
    this.repository = repository;
    this.addressesRepository = new MemberAddressesRepository();
    this.contactsRepository = new MemberContactsRepository();
    this.policiesRepository = new MemberPoliciesRepository();
    this.dependentsRepository = new MemberDependentsRepository();
    this.pecRepository = new MemberPECRepository();
    this.memberCache = new NodeCache({ stdTTL: MEMBER_CACHE_TTL, checkperiod: 60 });
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Clear member cache by member ID or all cache
   */
  public clearMemberCache(memberId?: string): void {
    if (memberId) {
      this.memberCache.del(`${CACHE_KEYS.MEMBER}:${memberId}`);
      this.memberCache.del(`${CACHE_KEYS.ADDRESSES}:${memberId}`);
      this.memberCache.del(`${CACHE_KEYS.CONTACTS}:${memberId}`);
      this.memberCache.del(`${CACHE_KEYS.POLICIES}:${memberId}`);
      this.memberCache.del(`${CACHE_KEYS.DEPENDENTS}:${memberId}`);
    } else {
      this.memberCache.flushAll();
    }
  }

  /**
   * Clear dependent cache
   */
  public clearDependentCache(dependentId: string): void {
    this.memberCache.del(`${CACHE_KEYS.PEC}:${dependentId}`);
  }

  // ============================================================================
  // MEMBERS
  // ============================================================================

  /**
   * Get paginated list of members
   */
  public async getMembers(filters: MemberFilters): Promise<PaginatedMembers> {
    // Don't cache list queries (too variable with filters)
    return await this.repository.getMembers(filters);
  }

  /**
   * Get member by ID (with caching)
   */
  public async getMemberById(memberId: string): Promise<Member | null> {
    const cacheKey = `${CACHE_KEYS.MEMBER}:${memberId}`;
    const cached = this.memberCache.get(cacheKey) as Member | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const member = await this.repository.getMemberById(memberId);
    
    if (member) {
      this.memberCache.set(cacheKey, member);
    }

    return member;
  }

  /**
   * Check if IC number exists (with caching)
   */
  public async checkICExists(icNo: string, excludeId?: string): Promise<boolean> {
    const cacheKey = `${CACHE_KEYS.IC_NO}:${icNo}:${excludeId || 'new'}`;
    const cached = this.memberCache.get(cacheKey) as boolean | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const exists = await this.repository.checkICExists(icNo, excludeId);
    this.memberCache.set(cacheKey, exists);

    return exists;
  }

  /**
   * Create new member
   */
  public async createMember(dto: CreateMemberDto, createdBy?: string): Promise<string> {
    const memberId = await this.repository.createMember(dto, createdBy);
    
    // Clear IC number cache
    this.memberCache.del(`${CACHE_KEYS.IC_NO}:${dto.ic_no}:new`);
    
    return memberId;
  }

  /**
   * Update member
   */
  public async updateMember(memberId: string, dto: UpdateMemberDto, updatedBy?: string): Promise<boolean> {
    const success = await this.repository.updateMember(memberId, dto, updatedBy);
    
    if (success) {
      this.clearMemberCache(memberId);
      
      // Clear IC number cache if ic_no changed
      if (dto.ic_no) {
        this.memberCache.del(`${CACHE_KEYS.IC_NO}:${dto.ic_no}:${memberId}`);
      }
    }

    return success;
  }

  /**
   * Delete member (soft delete)
   */
  public async deleteMember(memberId: string, deletedBy?: string): Promise<boolean> {
    const success = await this.repository.deleteMember(memberId, deletedBy);
    
    if (success) {
      this.clearMemberCache(memberId);
    }

    return success;
  }

  /**
   * Set member deleted status
   */
  public async setMemberDeletedStatus(memberId: string, isDeleted: boolean): Promise<boolean> {
    const success = await this.repository.setMemberDeletedStatus(memberId, isDeleted);
    
    if (success) {
      this.clearMemberCache(memberId);
    }

    return success;
  }

  // ============================================================================
  // ADDRESSES
  // ============================================================================

  /**
   * Get addresses by member ID (with caching)
   */
  public async getAddressesByMemberId(memberId: string): Promise<MemberAddress[]> {
    const cacheKey = `${CACHE_KEYS.ADDRESSES}:${memberId}`;
    const cached = this.memberCache.get(cacheKey) as MemberAddress[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const addresses = await this.addressesRepository.getAddressesByMemberId(memberId);
    this.memberCache.set(cacheKey, addresses);

    return addresses;
  }

  /**
   * Get address by ID
   */
  public async getAddressById(addressId: string): Promise<MemberAddress | null> {
    return await this.addressesRepository.getAddressById(addressId);
  }

  /**
   * Create member address
   */
  public async createAddress(dto: CreateMemberAddressDto): Promise<string> {
    const addressId = await this.addressesRepository.createAddress(dto);
    this.memberCache.del(`${CACHE_KEYS.ADDRESSES}:${dto.member_id}`);
    return addressId;
  }

  /**
   * Update member address
   */
  public async updateAddress(addressId: string, dto: UpdateMemberAddressDto): Promise<boolean> {
    const address = await this.addressesRepository.getAddressById(addressId);
    const success = await this.addressesRepository.updateAddress(addressId, dto);
    
    if (success && address) {
      this.memberCache.del(`${CACHE_KEYS.ADDRESSES}:${address.member_id}`);
    }

    return success;
  }

  /**
   * Delete member address
   */
  public async deleteAddress(addressId: string): Promise<boolean> {
    const address = await this.addressesRepository.getAddressById(addressId);
    const success = await this.addressesRepository.deleteAddress(addressId);
    
    if (success && address) {
      this.memberCache.del(`${CACHE_KEYS.ADDRESSES}:${address.member_id}`);
    }

    return success;
  }

  /**
   * Set primary address
   */
  public async setPrimaryAddress(memberId: string, addressId: string): Promise<boolean> {
    const success = await this.addressesRepository.setPrimaryAddress(memberId, addressId);
    
    if (success) {
      this.memberCache.del(`${CACHE_KEYS.ADDRESSES}:${memberId}`);
    }

    return success;
  }

  // ============================================================================
  // CONTACTS
  // ============================================================================

  /**
   * Get contacts by member ID (with caching)
   */
  public async getContactsByMemberId(memberId: string): Promise<MemberContact[]> {
    const cacheKey = `${CACHE_KEYS.CONTACTS}:${memberId}`;
    const cached = this.memberCache.get(cacheKey) as MemberContact[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const contacts = await this.contactsRepository.getContactsByMemberId(memberId);
    this.memberCache.set(cacheKey, contacts);

    return contacts;
  }

  /**
   * Get contact by ID
   */
  public async getContactById(contactId: string): Promise<MemberContact | null> {
    return await this.contactsRepository.getContactById(contactId);
  }

  /**
   * Create member contact
   */
  public async createContact(dto: CreateMemberContactDto): Promise<string> {
    const contactId = await this.contactsRepository.createContact(dto);
    this.memberCache.del(`${CACHE_KEYS.CONTACTS}:${dto.member_id}`);
    return contactId;
  }

  /**
   * Update member contact
   */
  public async updateContact(contactId: string, dto: UpdateMemberContactDto): Promise<boolean> {
    const contact = await this.contactsRepository.getContactById(contactId);
    const success = await this.contactsRepository.updateContact(contactId, dto);
    
    if (success && contact) {
      this.memberCache.del(`${CACHE_KEYS.CONTACTS}:${contact.member_id}`);
    }

    return success;
  }

  /**
   * Delete member contact
   */
  public async deleteContact(contactId: string): Promise<boolean> {
    const contact = await this.contactsRepository.getContactById(contactId);
    const success = await this.contactsRepository.deleteContact(contactId);
    
    if (success && contact) {
      this.memberCache.del(`${CACHE_KEYS.CONTACTS}:${contact.member_id}`);
    }

    return success;
  }

  /**
   * Set primary contact
   */
  public async setPrimaryContact(memberId: string, contactId: string, contactType: string): Promise<boolean> {
    const success = await this.contactsRepository.setPrimaryContact(memberId, contactId, contactType);
    
    if (success) {
      this.memberCache.del(`${CACHE_KEYS.CONTACTS}:${memberId}`);
    }

    return success;
  }

  // ============================================================================
  // POLICIES
  // ============================================================================

  /**
   * Get policies by member ID (with caching)
   */
  public async getPoliciesByMemberId(memberId: string): Promise<MemberPolicy[]> {
    const cacheKey = `${CACHE_KEYS.POLICIES}:${memberId}`;
    const cached = this.memberCache.get(cacheKey) as MemberPolicy[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const policies = await this.policiesRepository.getPoliciesByMemberId(memberId);
    this.memberCache.set(cacheKey, policies);

    return policies;
  }

  /**
   * Get policy by ID
   */
  public async getPolicyById(policyRecordId: string): Promise<MemberPolicy | null> {
    return await this.policiesRepository.getPolicyById(policyRecordId);
  }

  /**
   * Check if policy number exists
   */
  public async checkPolicyNoExists(policyNo: string, excludePolicyRecordId?: string): Promise<boolean> {
    return await this.policiesRepository.checkPolicyNoExists(policyNo, excludePolicyRecordId);
  }

  /**
   * Create member policy
   */
  public async createPolicy(dto: CreateMemberPolicyDto): Promise<string> {
    const policyRecordId = await this.policiesRepository.createPolicy(dto);
    this.memberCache.del(`${CACHE_KEYS.POLICIES}:${dto.member_id}`);
    return policyRecordId;
  }

  /**
   * Update member policy
   */
  public async updatePolicy(policyRecordId: string, dto: UpdateMemberPolicyDto): Promise<boolean> {
    const policy = await this.policiesRepository.getPolicyById(policyRecordId);
    const success = await this.policiesRepository.updatePolicy(policyRecordId, dto);
    
    if (success && policy) {
      this.memberCache.del(`${CACHE_KEYS.POLICIES}:${policy.member_id}`);
    }

    return success;
  }

  /**
   * Delete member policy
   */
  public async deletePolicy(policyRecordId: string): Promise<boolean> {
    const policy = await this.policiesRepository.getPolicyById(policyRecordId);
    const success = await this.policiesRepository.deletePolicy(policyRecordId);
    
    if (success && policy) {
      this.memberCache.del(`${CACHE_KEYS.POLICIES}:${policy.member_id}`);
    }

    return success;
  }

  // ============================================================================
  // DEPENDENTS
  // ============================================================================

  /**
   * Get dependents by member ID (with caching)
   */
  public async getDependentsByMemberId(memberId: string): Promise<MemberDependent[]> {
    const cacheKey = `${CACHE_KEYS.DEPENDENTS}:${memberId}`;
    const cached = this.memberCache.get(cacheKey) as MemberDependent[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const dependents = await this.dependentsRepository.getDependentsByMemberId(memberId);
    this.memberCache.set(cacheKey, dependents);

    return dependents;
  }

  /**
   * Get dependent by ID
   */
  public async getDependentById(dependentId: string): Promise<MemberDependent | null> {
    return await this.dependentsRepository.getDependentById(dependentId);
  }

  /**
   * Create member dependent
   */
  public async createDependent(dto: CreateMemberDependentDto): Promise<string> {
    const dependentId = await this.dependentsRepository.createDependent(dto);
    this.memberCache.del(`${CACHE_KEYS.DEPENDENTS}:${dto.principal_member_id}`);
    return dependentId;
  }

  /**
   * Update member dependent
   */
  public async updateDependent(dependentId: string, dto: UpdateMemberDependentDto): Promise<boolean> {
    const dependent = await this.dependentsRepository.getDependentById(dependentId);
    const success = await this.dependentsRepository.updateDependent(dependentId, dto);
    
    if (success && dependent) {
      this.memberCache.del(`${CACHE_KEYS.DEPENDENTS}:${dependent.principal_member_id}`);
    }

    return success;
  }

  /**
   * Delete member dependent
   */
  public async deleteDependent(dependentId: string): Promise<boolean> {
    const dependent = await this.dependentsRepository.getDependentById(dependentId);
    const success = await this.dependentsRepository.deleteDependent(dependentId);
    
    if (success && dependent) {
      this.memberCache.del(`${CACHE_KEYS.DEPENDENTS}:${dependent.principal_member_id}`);
      this.clearDependentCache(dependentId);
    }

    return success;
  }

  /**
   * Set dependent active status
   */
  public async setDependentActiveStatus(dependentId: string, isActive: boolean): Promise<boolean> {
    const dependent = await this.dependentsRepository.getDependentById(dependentId);
    const success = await this.dependentsRepository.setDependentActiveStatus(dependentId, isActive);
    
    if (success && dependent) {
      this.memberCache.del(`${CACHE_KEYS.DEPENDENTS}:${dependent.principal_member_id}`);
    }

    return success;
  }

  // ============================================================================
  // PEC CONDITIONS
  // ============================================================================

  /**
   * Get PEC conditions by dependent ID (with caching)
   */
  public async getPECsByDependentId(dependentId: string): Promise<MemberPEC[]> {
    const cacheKey = `${CACHE_KEYS.PEC}:${dependentId}`;
    const cached = this.memberCache.get(cacheKey) as MemberPEC[] | undefined;

    if (cached !== undefined) {
      return cached;
    }

    const pecs = await this.pecRepository.getPECsByDependentId(dependentId);
    this.memberCache.set(cacheKey, pecs);

    return pecs;
  }

  /**
   * Get PEC condition by ID
   */
  public async getPECById(pecId: string): Promise<MemberPEC | null> {
    return await this.pecRepository.getPECById(pecId);
  }

  /**
   * Create PEC condition
   */
  public async createPEC(dto: CreateMemberPECDto): Promise<string> {
    const pecId = await this.pecRepository.createPEC(dto);
    this.memberCache.del(`${CACHE_KEYS.PEC}:${dto.dependent_id}`);
    return pecId;
  }

  /**
   * Update PEC condition
   */
  public async updatePEC(pecId: string, dto: UpdateMemberPECDto): Promise<boolean> {
    const pec = await this.pecRepository.getPECById(pecId);
    const success = await this.pecRepository.updatePEC(pecId, dto);
    
    if (success && pec) {
      this.memberCache.del(`${CACHE_KEYS.PEC}:${pec.dependent_id}`);
    }

    return success;
  }

  /**
   * Delete PEC condition
   */
  public async deletePEC(pecId: string): Promise<boolean> {
    const pec = await this.pecRepository.getPECById(pecId);
    const success = await this.pecRepository.deletePEC(pecId);
    
    if (success && pec) {
      this.memberCache.del(`${CACHE_KEYS.PEC}:${pec.dependent_id}`);
    }

    return success;
  }

  /**
   * Set PEC excluded status
   */
  public async setPECExcludedStatus(pecId: string, isExcluded: boolean): Promise<boolean> {
    const pec = await this.pecRepository.getPECById(pecId);
    const success = await this.pecRepository.setPECExcludedStatus(pecId, isExcluded);
    
    if (success && pec) {
      this.memberCache.del(`${CACHE_KEYS.PEC}:${pec.dependent_id}`);
    }

    return success;
  }
}
