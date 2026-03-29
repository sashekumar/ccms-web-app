import { Injectable } from '@angular/core';
import { ApiResponse } from './base-api.service';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants';
import {
  Member,
  MemberListItem,
  CreateMemberDto,
  UpdateMemberDto,
  MemberFilters,
  PaginatedMembers,
  MemberAddress,
  CreateMemberAddressDto,
  UpdateMemberAddressDto,
  MemberContact,
  CreateMemberContactDto,
  UpdateMemberContactDto,
  MemberPolicy,
  CreateMemberPolicyDto,
  UpdateMemberPolicyDto,
  MemberDependent,
  CreateMemberDependentDto,
  UpdateMemberDependentDto,
  MemberPEC,
  CreateMemberPECDto,
  UpdateMemberPECDto
} from '../../shared/models/member.model';

/**
 * Member Service - Handles policy holder operations
 */
@Injectable({
  providedIn: 'root'
})
export class MemberService {
  constructor(private api: ApiService) {}

  // ============================================================================
  // MEMBERS
  // ============================================================================

  /**
   * Get paginated list of members with filters
   */
  getMembers(filters: MemberFilters = {}): Observable<PaginatedMembers> {
    return this.api.post<ApiResponse<{ data: MemberListItem[]; pagination: any; stats: any }>>(
      API_ENDPOINTS.MEMBERS.LIST,
      filters
    ).pipe(
      map(response => {
        const { data, pagination, stats } = response.data;
        return {
          members: data,
          total: pagination.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: pagination.totalPages,
          stats: stats
        };
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Get member by ID
   */
  getMemberById(member_id: string): Observable<Member> {
    return this.api.post<ApiResponse<Member>>(
      API_ENDPOINTS.MEMBERS.GET,
      { member_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Check if IC number exists
   */
  checkIC(ic_no: string, member_id?: string): Observable<{ exists: boolean; message: string }> {
    return this.api.post<ApiResponse<{ exists: boolean; message: string }>>(
      API_ENDPOINTS.MEMBERS.CHECK_IC,
      { ic_no, member_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Create new member
   */
  createMember(dto: CreateMemberDto): Observable<string> {
    return this.api.post<ApiResponse<{ member_id: string }>>(
      API_ENDPOINTS.MEMBERS.CREATE,
      dto
    ).pipe(
      map(response => response.data.member_id),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Update member
   */
  updateMember(member_id: string, dto: UpdateMemberDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.UPDATE,
      { member_id, ...dto }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Delete member (soft delete)
   */
  deleteMember(member_id: string): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.DELETE,
      { member_id }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Restore member (undo soft delete)
   */
  restoreMember(member_id: string): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.restore(member_id),
      {}
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  // ============================================================================
  // MEMBER ADDRESSES
  // ============================================================================

  /**
   * Get all addresses for a member
   */
  getAddressesByMemberId(member_id: string): Observable<MemberAddress[]> {
    return this.api.post<ApiResponse<MemberAddress[]>>(
      API_ENDPOINTS.MEMBERS.ADDRESSES.list(member_id),
      {}
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Get address by ID
   */
  getAddressById(address_id: string): Observable<MemberAddress> {
    return this.api.post<ApiResponse<MemberAddress>>(
      API_ENDPOINTS.MEMBERS.ADDRESSES.get,
      { address_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Create member address
   */
  createAddress(dto: CreateMemberAddressDto): Observable<string> {
    return this.api.post<ApiResponse<{ address_id: string }>>(
      API_ENDPOINTS.MEMBERS.ADDRESSES.create,
      dto
    ).pipe(
      map(response => response.data.address_id),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Update member address
   */
  updateAddress(address_id: string, dto: UpdateMemberAddressDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.ADDRESSES.update(address_id),
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Delete member address
   */
  deleteAddress(address_id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.ADDRESSES.delete(address_id)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Set primary address
   */
  setPrimaryAddress(address_id: string): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.ADDRESSES.setPrimary(address_id),
      {}
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  // ============================================================================
  // MEMBER CONTACTS  
  // ============================================================================

  /**
   * Get all contacts for a member
   */
  getContactsByMemberId(member_id: string): Observable<MemberContact[]> {
    return this.api.post<ApiResponse<MemberContact[]>>(
      API_ENDPOINTS.MEMBERS.CONTACTS.list(member_id),
      {}
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Get contact by ID
   */
  getContactById(contact_id: string): Observable<MemberContact> {
    return this.api.post<ApiResponse<MemberContact>>(
      API_ENDPOINTS.MEMBERS.CONTACTS.get,
      { contact_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Create member contact
   */
  createContact(dto: CreateMemberContactDto): Observable<string> {
    return this.api.post<ApiResponse<{ contact_id: string }>>(
      API_ENDPOINTS.MEMBERS.CONTACTS.create,
      dto
    ).pipe(
      map(response => response.data.contact_id),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Update member contact
   */
  updateContact(contact_id: string, dto: UpdateMemberContactDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.CONTACTS.update(contact_id),
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Delete member contact
   */
  deleteContact(contact_id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.CONTACTS.delete(contact_id)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Set primary contact
   */
  setPrimaryContact(contact_id: string): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.CONTACTS.setPrimary(contact_id),
      {}
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  // ============================================================================
  // MEMBER POLICIES
  // ============================================================================

  /**
   * Get all policies for a member
   */
  getPoliciesByMemberId(member_id: string): Observable<MemberPolicy[]> {
    return this.api.post<ApiResponse<MemberPolicy[]>>(
      API_ENDPOINTS.MEMBERS.POLICIES.list(member_id),
      {}
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Get policy by ID
   */
  getPolicyById(policy_id: string): Observable<MemberPolicy> {
    return this.api.post<ApiResponse<MemberPolicy>>(
      API_ENDPOINTS.MEMBERS.POLICIES.get,
      { policy_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Check if policy number exists
   */
  checkPolicyNo(policy_no: string, policy_id?: string): Observable<{ exists: boolean; message: string }> {
    return this.api.post<ApiResponse<{ exists: boolean; message: string }>>(
      API_ENDPOINTS.MEMBERS.POLICIES.checkPolicyNo,
      { policy_no, policy_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Create member policy
   */
  createPolicy(dto: CreateMemberPolicyDto): Observable<string> {
    return this.api.post<ApiResponse<{ policy_id: string }>>(
      API_ENDPOINTS.MEMBERS.POLICIES.create,
      dto
    ).pipe(
      map(response => response.data.policy_id),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Update member policy
   */
  updatePolicy(policy_id: string, dto: UpdateMemberPolicyDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.POLICIES.update(policy_id),
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Delete member policy (soft delete)
   */
  deletePolicy(policy_id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.POLICIES.delete(policy_id)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  // ============================================================================
  // MEMBER DEPENDENTS
  // ============================================================================

  /**
   * Get all dependents for a member
   */
  getDependentsByMemberId(member_id: string): Observable<MemberDependent[]> {
    return this.api.post<ApiResponse<MemberDependent[]>>(
      API_ENDPOINTS.MEMBERS.DEPENDENTS.list(member_id),
      {}
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Get dependent by ID
   */
  getDependentById(dependent_id: string): Observable<MemberDependent> {
    return this.api.post<ApiResponse<MemberDependent>>(
      API_ENDPOINTS.MEMBERS.DEPENDENTS.get,
      { dependent_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Create member dependent
   */
  createDependent(dto: CreateMemberDependentDto): Observable<string> {
    return this.api.post<ApiResponse<{ dependent_id: string }>>(
      API_ENDPOINTS.MEMBERS.DEPENDENTS.create,
      dto
    ).pipe(
      map(response => response.data.dependent_id),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Update member dependent
   */
  updateDependent(dependent_id: string, dto: UpdateMemberDependentDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.DEPENDENTS.update(dependent_id),
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Delete member dependent
   */
  deleteDependent(dependent_id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.DEPENDENTS.delete(dependent_id)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Toggle dependent active status
   */
  toggleDependentActive(dependent_id: string, is_active: boolean): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.DEPENDENTS.toggleActive(dependent_id),
      { is_active }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  // ============================================================================
  // MEMBER PEC CONDITIONS
  // ============================================================================

  /**
   * Get all PEC conditions for a dependent
   */
  getPECsByDependentId(dependent_id: string): Observable<MemberPEC[]> {
    return this.api.post<ApiResponse<MemberPEC[]>>(
      API_ENDPOINTS.MEMBERS.PEC.list(dependent_id),
      {}
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Get PEC condition by ID
   */
  getPECById(pec_id: string): Observable<MemberPEC> {
    return this.api.post<ApiResponse<MemberPEC>>(
      API_ENDPOINTS.MEMBERS.PEC.get,
      { pec_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Create PEC condition
   */
  createPEC(dto: CreateMemberPECDto): Observable<string> {
    return this.api.post<ApiResponse<{ pec_id: string }>>(
      API_ENDPOINTS.MEMBERS.PEC.create,
      dto
    ).pipe(
      map(response => response.data.pec_id),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Update PEC condition
   */
  updatePEC(pec_id: string, dto: UpdateMemberPECDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.PEC.update(pec_id),
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Delete PEC condition
   */
  deletePEC(pec_id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.PEC.delete(pec_id)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Toggle PEC excluded status
   */
  togglePECExcluded(pec_id: string, is_excluded: boolean): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.MEMBERS.PEC.toggleExcluded(pec_id),
      { is_excluded }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }
}
