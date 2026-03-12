/**
 * Member Types
 * 
 * Type definitions for Policy Holders (Members) module.
 * These types correspond to the ccms_members table structure.
 */

/**
 * Full Member entity (from database)
 */
export interface Member {
  member_id: string;
  legacy_member_id?: string;
  external_guid?: string;
  full_name: string;
  ic_no: string;
  fwd_member_no?: string;
  fwd_client_no?: string;
  client_id?: string;
  dob?: Date;
  gender?: boolean;
  member_type?: string;
  member_status?: string;
  bank_id?: number;
  bank_acc_no?: string;
  bank_name?: string;
  enrollment_date?: Date;
  termination_date?: Date;
  created_at?: Date;
  created_by?: string;
  created_by_username?: string;
  updated_at?: Date;
  updated_by?: string;
  updated_by_username?: string;
  is_deleted?: boolean;
}

/**
 * Member list item (for grid display, may include computed fields)
 */
export interface MemberListItem {
  member_id: string;
  full_name: string;
  ic_no: string;
  member_type?: string;
  member_status?: string;
  enrollment_date?: Date;
  fwd_member_no?: string;
  client_id?: string;
  is_deleted?: boolean;
}

/**
 * Create Member DTO
 */
export interface CreateMemberDto {
  full_name: string;
  ic_no: string;
  fwd_member_no?: string;
  fwd_client_no?: string;
  client_id?: string;
  dob?: Date | string;
  gender?: boolean;
  member_type?: string;
  member_status?: string;
  bank_id?: number;
  bank_acc_no?: string;
  enrollment_date?: Date | string;
  termination_date?: Date | string;
}

/**
 * Update Member DTO
 */
export interface UpdateMemberDto {
  full_name?: string;
  ic_no?: string;
  fwd_member_no?: string;
  fwd_client_no?: string;
  client_id?: string;
  dob?: Date | string;
  gender?: boolean;
  member_type?: string;
  member_status?: string;
  bank_id?: number;
  bank_acc_no?: string;
  enrollment_date?: Date | string;
  termination_date?: Date | string;
}

/**
 * Member Filters
 */
export interface MemberFilters {
  search?: string;              // Search by full_name, ic_no, fwd_member_no
  member_type?: string;
  member_status?: string;
  enrollment_date_from?: Date | string;
  enrollment_date_to?: Date | string;
  is_deleted?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Pagination params
 */
export interface MemberPaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Paginated Members Response
 */
export interface PaginatedMembers {
  data: MemberListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  stats?: {
    total_members: number;
    active_members: number;
    deleted_members: number;
  };
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface GetMembersRequest extends MemberFilters, MemberPaginationParams {}

export interface GetMemberRequest {
  member_id: string;
}

export interface CheckICRequest {
  ic_no: string;
  member_id?: string; // For update scenarios (exclude self)
}

export interface CheckICResponse {
  available: boolean;
  message: string;
}

export interface CreateMemberRequest extends CreateMemberDto {}

export interface CreateMemberResponse {
  member_id: string;
  message: string;
}

export interface UpdateMemberRequest extends UpdateMemberDto {}

export interface UpdateMemberResponse {
  success: boolean;
  message: string;
}

export interface DeleteMemberRequest {
  member_id: string;
  deleted_by?: string;
}

export interface DeleteMemberResponse {
  success: boolean;
  message: string;
}

export interface ActivateMemberRequest {
  member_id: string;
  is_deleted: boolean;
}

export interface ActivateMemberResponse {
  success: boolean;
  message: string;
}

export interface SetMemberDeletedStatusRequest {
  member_id: string;
  is_deleted: boolean;
}
