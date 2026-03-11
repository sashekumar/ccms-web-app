import { MembersService } from './members.service';
import { MembersRepository } from './members.repository';
import { MemberAddressesRepository } from './member-addresses.repository';
import { MemberContactsRepository } from './member-contacts.repository';
import { MemberPoliciesRepository } from './member-policies.repository';
import { MemberDependentsRepository } from './member-dependents.repository';
import { MemberPECRepository } from './member-pec.repository';
import { CreateMemberDto, UpdateMemberDto, MemberFilters } from './members.types';
import { CreateMemberAddressDto, UpdateMemberAddressDto } from './member-addresses.types';
import { CreateMemberContactDto, UpdateMemberContactDto } from './member-contacts.types';
import { CreateMemberPolicyDto, UpdateMemberPolicyDto } from './member-policies.types';
import { CreateMemberDependentDto, UpdateMemberDependentDto } from './member-dependents.types';
import { CreateMemberPECDto, UpdateMemberPECDto } from './member-pec.types';

// Mock dependencies
jest.mock('./members.repository');
jest.mock('./member-addresses.repository');
jest.mock('./member-contacts.repository');
jest.mock('./member-policies.repository');
jest.mock('./member-dependents.repository');
jest.mock('./member-pec.repository');

// Create mock cache instance
const mockCacheInstance = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  flushAll: jest.fn(),
};

// Mock NodeCache
jest.mock('node-cache', () => {
  return jest.fn(() => mockCacheInstance);
});

describe('MembersService', () => {
  let service: MembersService;
  let mockRepository: jest.Mocked<MembersRepository>;
  let mockAddressesRepo: jest.Mocked<MemberAddressesRepository>;
  let mockContactsRepo: jest.Mocked<MemberContactsRepository>;
  let mockPoliciesRepo: jest.Mocked<MemberPoliciesRepository>;
  let mockDependentsRepo: jest.Mocked<MemberDependentsRepository>;
  let mockPECRepo: jest.Mocked<MemberPECRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset cache mocks and ensure they return values
    mockCacheInstance.get.mockReturnValue(undefined);
    mockCacheInstance.set.mockReturnValue(true);
    mockCacheInstance.del.mockReturnValue(1);
    mockCacheInstance.flushAll.mockReturnValue(undefined);

    mockRepository = {
      getMembers: jest.fn(),
      getMemberById: jest.fn(),
      checkICExists: jest.fn(),
      createMember: jest.fn(),
      updateMember: jest.fn(),
      deleteMember: jest.fn(),
      setMemberDeletedStatus: jest.fn(),
    } as any;

    mockAddressesRepo = {
      getAddressesByMemberId: jest.fn(),
      getAddressById: jest.fn(),
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
      setPrimaryAddress: jest.fn(),
    } as any;

    mockContactsRepo = {
      getContactsByMemberId: jest.fn(),
      getContactById: jest.fn(),
      createContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      setPrimaryContact: jest.fn(),
    } as any;

    mockPoliciesRepo = {
      getPoliciesByMemberId: jest.fn(),
      getPolicyById: jest.fn(),
      createPolicy: jest.fn(),
      updatePolicy: jest.fn(),
      deletePolicy: jest.fn(),
      checkPolicyNoExists: jest.fn(),
    } as any;

    mockDependentsRepo = {
      getDependentsByMemberId: jest.fn(),
      getDependentById: jest.fn(),
      createDependent: jest.fn(),
      updateDependent: jest.fn(),
      deleteDependent: jest.fn(),
      setDependentActiveStatus: jest.fn(),
    } as any;

    mockPECRepo = {
      getPECsByDependentId: jest.fn(),
      getPECById: jest.fn(),
      createPEC: jest.fn(),
      updatePEC: jest.fn(),
      deletePEC: jest.fn(),
      setPECExcludedStatus: jest.fn(),
    } as any;

    (MembersRepository as jest.MockedClass<typeof MembersRepository>).mockImplementation(() => mockRepository);
    (MemberAddressesRepository as jest.MockedClass<typeof MemberAddressesRepository>).mockImplementation(() => mockAddressesRepo);
    (MemberContactsRepository as jest.MockedClass<typeof MemberContactsRepository>).mockImplementation(() => mockContactsRepo);
    (MemberPoliciesRepository as jest.MockedClass<typeof MemberPoliciesRepository>).mockImplementation(() => mockPoliciesRepo);
    (MemberDependentsRepository as jest.MockedClass<typeof MemberDependentsRepository>).mockImplementation(() => mockDependentsRepo);
    (MemberPECRepository as jest.MockedClass<typeof MemberPECRepository>).mockImplementation(() => mockPECRepo);

    service = new MembersService();
    // Replace the cache with our mock
    (service as any).memberCache = mockCacheInstance;
  });

  // ========================================================================
  // CACHE MANAGEMENT
  // ========================================================================

  describe('clearMemberCache', () => {
    it('should clear cache for specific member', () => {
      service.clearMemberCache('MEM001');
      expect(mockCacheInstance.del).toHaveBeenCalledWith('member:MEM001');
      expect(mockCacheInstance.del).toHaveBeenCalledWith('addresses:MEM001');
      expect(mockCacheInstance.del).toHaveBeenCalledWith('contacts:MEM001');
      expect(mockCacheInstance.del).toHaveBeenCalledWith('policies:MEM001');
      expect(mockCacheInstance.del).toHaveBeenCalledWith('dependents:MEM001');
    });

    it('should flush all cache when no member ID provided', () => {
      service.clearMemberCache();
      expect(mockCacheInstance.flushAll).toHaveBeenCalled();
    });
  });

  describe('clearDependentCache', () => {
    it('should clear PEC cache for dependent', () => {
      service.clearDependentCache('DEP001');
      expect(mockCacheInstance.del).toHaveBeenCalledWith('pec:DEP001');
    });
  });

  // ========================================================================
  // MEMBERS
  // ========================================================================

  describe('getMembers', () => {
    it('should return paginated members', async () => {
      const filters: MemberFilters = { page: 1, limit: 10 };
      const mockResult = {
        data: [{ member_id: 'MEM001', full_name: 'Test Member', ic_no: '123456789012', is_deleted: false }],
        pagination: { total: 1, page: 1, limit: 10, total_pages: 1 }
      };

      mockRepository.getMembers.mockResolvedValue(mockResult);
      const result = await service.getMembers(filters);

      expect(result).toEqual(mockResult);
      expect(mockRepository.getMembers).toHaveBeenCalledWith(filters);
    });
  });

  describe('getMemberById', () => {
    it('should return cached member if available', async () => {
      const mockMember = { member_id: 'MEM001', full_name: 'John Doe', ic_no: '123456789012', is_deleted: false };
      mockCacheInstance.get.mockReturnValue(mockMember);

      const result = await service.getMemberById('MEM001');

      expect(result).toEqual(mockMember);
      expect(mockCacheInstance.get).toHaveBeenCalledWith('member:MEM001');
      expect(mockRepository.getMemberById).not.toHaveBeenCalled();
    });

    it('should fetch and cache member if not in cache', async () => {
      const mockMember = { member_id: 'MEM001', full_name: 'John Doe', ic_no: '123456789012', is_deleted: false };
      mockCacheInstance.get.mockReturnValue(undefined);
      mockRepository.getMemberById.mockResolvedValue(mockMember);

      const result = await service.getMemberById('MEM001');

      expect(result).toEqual(mockMember);
      expect(mockCacheInstance.set).toHaveBeenCalledWith('member:MEM001', mockMember);
    });

    it('should return null when member not found', async () => {
      mockCacheInstance.get.mockReturnValue(undefined);
      mockRepository.getMemberById.mockResolvedValue(null);

      const result = await service.getMemberById('NONEXISTENT');

      expect(result).toBeNull();
      expect(mockCacheInstance.set).not.toHaveBeenCalled();
    });
  });

  describe('checkICExists', () => {
    it('should return cached result if available', async () => {
      mockCacheInstance.get.mockReturnValue(true);
      const result = await service.checkICExists('123456789012');

      expect(result).toBe(true);
      expect(mockRepository.checkICExists).not.toHaveBeenCalled();
    });

    it('should fetch and cache IC check result', async () => {
      mockCacheInstance.get.mockReturnValue(undefined);
      mockRepository.checkICExists.mockResolvedValue(false);

      const result = await service.checkICExists('123456789012');

      expect(result).toBe(false);
      expect(mockCacheInstance.set).toHaveBeenCalledWith('ic_no:123456789012:new', false);
    });

    it('should cache with excludeId when provided', async () => {
      mockCacheInstance.get.mockReturnValue(undefined);
      mockRepository.checkICExists.mockResolvedValue(false);

      await service.checkICExists('123456789012', 'MEM001');

      expect(mockCacheInstance.set).toHaveBeenCalledWith('ic_no:123456789012:MEM001', false);
    });
  });

  describe('createMember', () => {
    it('should create member and clear IC cache', async () => {
      const dto: CreateMemberDto = { full_name: 'John Doe', ic_no: '123456789012' };
      mockRepository.createMember.mockResolvedValue('MEM001');

      const result = await service.createMember(dto, 'admin');

      expect(result).toBe('MEM001');
      expect(mockCacheInstance.del).toHaveBeenCalledWith('ic_no:123456789012:new');
    });
  });

  describe('updateMember', () => {
    it('should update member and clear cache', async () => {
      const dto: UpdateMemberDto = { full_name: 'Jane Doe' };
      mockRepository.updateMember.mockResolvedValue(true);

      const result = await service.updateMember('MEM001', dto, 'admin');

      expect(result).toBe(true);
      expect(mockCacheInstance.del).toHaveBeenCalledWith('member:MEM001');
    });

    it('should clear IC cache when ic_no changed', async () => {
      const dto: UpdateMemberDto = { ic_no: '999999999999' };
      mockRepository.updateMember.mockResolvedValue(true);

      await service.updateMember('MEM001', dto, 'admin');

      expect(mockCacheInstance.del).toHaveBeenCalledWith('ic_no:999999999999:MEM001');
    });

    it('should not clear cache when update fails', async () => {
      mockRepository.updateMember.mockResolvedValue(false);

      await service.updateMember('MEM001', {}, 'admin');

      expect(mockCacheInstance.del).not.toHaveBeenCalled();
    });
  });

  describe('deleteMember', () => {
    it('should delete member and clear cache', async () => {
      mockRepository.deleteMember.mockResolvedValue(true);

      const result = await service.deleteMember('MEM001', 'admin');

      expect(result).toBe(true);
      expect(mockCacheInstance.del).toHaveBeenCalled();
    });

    it('should not clear cache when delete fails', async () => {
      mockRepository.deleteMember.mockResolvedValue(false);

      await service.deleteMember('MEM001', 'admin');

      expect(mockCacheInstance.del).not.toHaveBeenCalled();
    });
  });

  describe('setMemberDeletedStatus', () => {
    it('should set status and clear cache', async () => {
      mockRepository.setMemberDeletedStatus.mockResolvedValue(true);

      const result = await service.setMemberDeletedStatus('MEM001', true);

      expect(result).toBe(true);
      expect(mockCacheInstance.del).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // ADDRESSES
  // ========================================================================

  describe('Member Addresses', () => {
    describe('getAddressesByMemberId', () => {
      it('should return cached addresses', async () => {
        const mockAddresses = [{ address_id: 'ADDR001', member_id: 'MEM001' }];
        mockCacheInstance.get.mockReturnValue(mockAddresses);

        const result = await service.getAddressesByMemberId('MEM001');

        expect(result).toEqual(mockAddresses);
        expect(mockAddressesRepo.getAddressesByMemberId).not.toHaveBeenCalled();
      });

      it('should fetch and cache addresses', async () => {
        const mockAddresses = [{ address_id: 'ADDR001', member_id: 'MEM001' }];
        mockCacheInstance.get.mockReturnValue(undefined);
        mockAddressesRepo.getAddressesByMemberId.mockResolvedValue(mockAddresses as any);

        const result = await service.getAddressesByMemberId('MEM001');

        expect(result).toEqual(mockAddresses);
        expect(mockCacheInstance.set).toHaveBeenCalledWith('addresses:MEM001', mockAddresses);
      });
    });

    describe('createAddress', () => {
      it('should create address and clear cache', async () => {
        const dto: CreateMemberAddressDto = { member_id: 'MEM001', street_line1: 'Test St' };
        mockAddressesRepo.createAddress.mockResolvedValue('ADDR001');

        const result = await service.createAddress(dto, 'admin');

        expect(result).toBe('ADDR001');
        expect(mockCacheInstance.del).toHaveBeenCalledWith('addresses:MEM001');
      });
    });

    describe('updateAddress', () => {
      it('should update address and clear cache', async () => {
        const dto: UpdateMemberAddressDto = { address_id: 'ADDR001', street_line1: 'New St' };
        mockAddressesRepo.getAddressById.mockResolvedValue({ address_id: 'ADDR001', member_id: 'MEM001' } as any);
        mockAddressesRepo.updateAddress.mockResolvedValue(true);

        const result = await service.updateAddress('ADDR001', dto, 'admin');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('addresses:MEM001');
      });
    });

    describe('deleteAddress', () => {
      it('should delete address and clear cache', async () => {
        mockAddressesRepo.getAddressById.mockResolvedValue({ address_id: 'ADDR001', member_id: 'MEM001' } as any);
        mockAddressesRepo.deleteAddress.mockResolvedValue(true);

        const result = await service.deleteAddress('ADDR001');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('addresses:MEM001');
      });
    });

    describe('setPrimaryAddress', () => {
      it('should set primary address and clear cache', async () => {
        mockAddressesRepo.setPrimaryAddress.mockResolvedValue(true);

        const result = await service.setPrimaryAddress('MEM001', 'ADDR001');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('addresses:MEM001');
      });
    });
  });

  // ========================================================================
  // CONTACTS
  // ========================================================================

  describe('Member Contacts', () => {
    describe('getContactsByMemberId', () => {
      it('should return cached contacts', async () => {
        const mockContacts = [{ contact_id: 'CONT001', member_id: 'MEM001' }];
        mockCacheInstance.get.mockReturnValue(mockContacts);

        const result = await service.getContactsByMemberId('MEM001');

        expect(result).toEqual(mockContacts);
        expect(mockContactsRepo.getContactsByMemberId).not.toHaveBeenCalled();
      });

      it('should fetch and cache contacts', async () => {
        const mockContacts = [{ contact_id: 'CONT001', member_id: 'MEM001' }];
        mockCacheInstance.get.mockReturnValue(undefined);
        mockContactsRepo.getContactsByMemberId.mockResolvedValue(mockContacts as any);

        const result = await service.getContactsByMemberId('MEM001');

        expect(result).toEqual(mockContacts);
        expect(mockCacheInstance.set).toHaveBeenCalledWith('contacts:MEM001', mockContacts);
      });
    });

    describe('createContact', () => {
      it('should create contact and clear cache', async () => {
        const dto: CreateMemberContactDto = { member_id: 'MEM001', contact_type: 'EMAIL', contact_value: 'test@example.com' };
        mockContactsRepo.createContact.mockResolvedValue('CONT001');

        const result = await service.createContact(dto, 'admin');

        expect(result).toBe('CONT001');
        expect(mockCacheInstance.del).toHaveBeenCalledWith('contacts:MEM001');
      });
    });

    describe('updateContact', () => {
      it('should update contact and clear cache', async () => {
        const dto: UpdateMemberContactDto = { contact_id: 'CONT001', contact_value: 'new@example.com' };
        mockContactsRepo.getContactById.mockResolvedValue({ contact_id: 'CONT001', member_id: 'MEM001' } as any);
        mockContactsRepo.updateContact.mockResolvedValue(true);

        const result = await service.updateContact('CONT001', dto, 'admin');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('contacts:MEM001');
      });
    });

    describe('deleteContact', () => {
      it('should delete contact and clear cache', async () => {
        mockContactsRepo.getContactById.mockResolvedValue({ contact_id: 'CONT001', member_id: 'MEM001' } as any);
        mockContactsRepo.deleteContact.mockResolvedValue(true);

        const result = await service.deleteContact('CONT001');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('contacts:MEM001');
      });
    });

    describe('setPrimaryContact', () => {
      it('should set primary contact and clear cache', async () => {
        mockContactsRepo.setPrimaryContact.mockResolvedValue(true);

        const result = await service.setPrimaryContact('MEM001', 'CONT001', 'EMAIL');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('contacts:MEM001');
      });
    });
  });

  // ========================================================================
  // POLICIES
  // ========================================================================

  describe('Member Policies', () => {
    describe('getPoliciesByMemberId', () => {
      it('should return cached policies', async () => {
        const mockPolicies = [{ policy_record_id: 'POL001', member_id: 'MEM001' }];
        mockCacheInstance.get.mockReturnValue(mockPolicies);

        const result = await service.getPoliciesByMemberId('MEM001');

        expect(result).toEqual(mockPolicies);
        expect(mockPoliciesRepo.getPoliciesByMemberId).not.toHaveBeenCalled();
      });

      it('should fetch and cache policies', async () => {
        const mockPolicies = [{ policy_record_id: 'POL001', member_id: 'MEM001' }];
        mockCacheInstance.get.mockReturnValue(undefined);
        mockPoliciesRepo.getPoliciesByMemberId.mockResolvedValue(mockPolicies as any);

        const result = await service.getPoliciesByMemberId('MEM001');

        expect(result).toEqual(mockPolicies);
        expect(mockCacheInstance.set).toHaveBeenCalledWith('policies:MEM001', mockPolicies);
      });
    });

    describe('checkPolicyNoExists', () => {
      it('should check if policy number exists', async () => {
        mockPoliciesRepo.checkPolicyNoExists.mockResolvedValue(true);

        const result = await service.checkPolicyNoExists('POL123');

        expect(result).toBe(true);
        expect(mockPoliciesRepo.checkPolicyNoExists).toHaveBeenCalledWith('POL123', undefined);
      });
    });

    describe('createPolicy', () => {
      it('should create policy and clear cache', async () => {
        const dto: CreateMemberPolicyDto = { member_id: 'MEM001', product_id: 'PROD001', policy_no: 'POL123' };
        mockPoliciesRepo.createPolicy.mockResolvedValue('POL001');

        const result = await service.createPolicy(dto, 'admin');

        expect(result).toBe('POL001');
        expect(mockCacheInstance.del).toHaveBeenCalledWith('policies:MEM001');
      });
    });

    describe('updatePolicy', () => {
      it('should update policy and clear cache', async () => {
        const dto: UpdateMemberPolicyDto = { policy_record_id: 'POL001', policy_no: 'POL456' };
        mockPoliciesRepo.getPolicyById.mockResolvedValue({ policy_record_id: 'POL001', member_id: 'MEM001' } as any);
        mockPoliciesRepo.updatePolicy.mockResolvedValue(true);

        const result = await service.updatePolicy('POL001', dto, 'admin');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('policies:MEM001');
      });
    });

    describe('deletePolicy', () => {
      it('should delete policy and clear cache', async () => {
        mockPoliciesRepo.getPolicyById.mockResolvedValue({ policy_record_id: 'POL001', member_id: 'MEM001' } as any);
        mockPoliciesRepo.deletePolicy.mockResolvedValue(true);

        const result = await service.deletePolicy('POL001');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('policies:MEM001');
      });
    });
  });

  // ========================================================================
  // DEPENDENTS
  // ========================================================================

  describe('Member Dependents', () => {
    describe('getDependentsByMemberId', () => {
      it('should return cached dependents', async () => {
        const mockDependents = [{ dependent_id: 'DEP001', principal_member_id: 'MEM001' }];
        mockCacheInstance.get.mockReturnValue(mockDependents);

        const result = await service.getDependentsByMemberId('MEM001');

        expect(result).toEqual(mockDependents);
        expect(mockDependentsRepo.getDependentsByMemberId).not.toHaveBeenCalled();
      });

      it('should fetch and cache dependents', async () => {
        const mockDependents = [{ dependent_id: 'DEP001', principal_member_id: 'MEM001' }];
        mockCacheInstance.get.mockReturnValue(undefined);
        mockDependentsRepo.getDependentsByMemberId.mockResolvedValue(mockDependents as any);

        const result = await service.getDependentsByMemberId('MEM001');

        expect(result).toEqual(mockDependents);
        expect(mockCacheInstance.set).toHaveBeenCalledWith('dependents:MEM001', mockDependents);
      });
    });

    describe('createDependent', () => {
      it('should create dependent and clear cache', async () => {
        const dto: CreateMemberDependentDto = { principal_member_id: 'MEM001', full_name: 'Child Doe' };
        mockDependentsRepo.createDependent.mockResolvedValue('DEP001');

        const result = await service.createDependent(dto, 'admin');

        expect(result).toBe('DEP001');
        expect(mockCacheInstance.del).toHaveBeenCalledWith('dependents:MEM001');
      });
    });

    describe('updateDependent', () => {
      it('should update dependent and clear cache', async () => {
        const dto: UpdateMemberDependentDto = { dependent_id: 'DEP001', full_name: 'Updated Child' };
        mockDependentsRepo.getDependentById.mockResolvedValue({ dependent_id: 'DEP001', principal_member_id: 'MEM001' } as any);
        mockDependentsRepo.updateDependent.mockResolvedValue(true);

        const result = await service.updateDependent('DEP001', dto, 'admin');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('dependents:MEM001');
      });
    });

    describe('deleteDependent', () => {
      it('should delete dependent and clear both caches', async () => {
        mockDependentsRepo.getDependentById.mockResolvedValue({ dependent_id: 'DEP001', principal_member_id: 'MEM001' } as any);
        mockDependentsRepo.deleteDependent.mockResolvedValue(true);

        const result = await service.deleteDependent('DEP001');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('dependents:MEM001');
        expect(mockCacheInstance.del).toHaveBeenCalledWith('pec:DEP001');
      });
    });

    describe('setDependentActiveStatus', () => {
      it('should set active status and clear cache', async () => {
        mockDependentsRepo.getDependentById.mockResolvedValue({ dependent_id: 'DEP001', principal_member_id: 'MEM001' } as any);
        mockDependentsRepo.setDependentActiveStatus.mockResolvedValue(true);

        const result = await service.setDependentActiveStatus('DEP001', false);

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('dependents:MEM001');
      });
    });
  });

  // ========================================================================
  // PEC CONDITIONS
  // ========================================================================

  describe('PEC Conditions', () => {
    describe('getPECsByDependentId', () => {
      it('should return cached PECs', async () => {
        const mockPECs = [{ pec_id: 'PEC001', dependent_id: 'DEP001' }];
        mockCacheInstance.get.mockReturnValue(mockPECs);

        const result = await service.getPECsByDependentId('DEP001');

        expect(result).toEqual(mockPECs);
        expect(mockPECRepo.getPECsByDependentId).not.toHaveBeenCalled();
      });

      it('should fetch and cache PECs', async () => {
        const mockPECs = [{ pec_id: 'PEC001', dependent_id: 'DEP001' }];
        mockCacheInstance.get.mockReturnValue(undefined);
        mockPECRepo.getPECsByDependentId.mockResolvedValue(mockPECs as any);

        const result = await service.getPECsByDependentId('DEP001');

        expect(result).toEqual(mockPECs);
        expect(mockCacheInstance.set).toHaveBeenCalledWith('pec:DEP001', mockPECs);
      });
    });

    describe('createPEC', () => {
      it('should create PEC and clear cache', async () => {
        const dto: CreateMemberPECDto = { dependent_id: 'DEP001', condition_name: 'Diabetes' };
        mockPECRepo.createPEC.mockResolvedValue('PEC001');

        const result = await service.createPEC(dto, 'admin');

        expect(result).toBe('PEC001');
        expect(mockCacheInstance.del).toHaveBeenCalledWith('pec:DEP001');
      });
    });

    describe('updatePEC', () => {
      it('should update PEC and clear cache', async () => {
        const dto: UpdateMemberPECDto = { pec_id: 'PEC001', condition_name: 'Hypertension' };
        mockPECRepo.getPECById.mockResolvedValue({ pec_id: 'PEC001', dependent_id: 'DEP001' } as any);
        mockPECRepo.updatePEC.mockResolvedValue(true);

        const result = await service.updatePEC('PEC001', dto, 'admin');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('pec:DEP001');
      });
    });

    describe('deletePEC', () => {
      it('should delete PEC and clear cache', async () => {
        mockPECRepo.getPECById.mockResolvedValue({ pec_id: 'PEC001', dependent_id: 'DEP001' } as any);
        mockPECRepo.deletePEC.mockResolvedValue(true);

        const result = await service.deletePEC('PEC001');

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('pec:DEP001');
      });
    });

    describe('setPECExcludedStatus', () => {
      it('should set excluded status and clear cache', async () => {
        mockPECRepo.getPECById.mockResolvedValue({ pec_id: 'PEC001', dependent_id: 'DEP001' } as any);
        mockPECRepo.setPECExcludedStatus.mockResolvedValue(true);

        const result = await service.setPECExcludedStatus('PEC001', true);

        expect(result).toBe(true);
        expect(mockCacheInstance.del).toHaveBeenCalledWith('pec:DEP001');
      });
    });
  });
});
