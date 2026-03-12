/**
 * Member (Policy Holder) model definitions
 * Aligned with backend types and v7 schema
 */

export interface Member {
  member_id: string;
  legacy_member_id?: string | null;
  external_guid?: string | null;
  full_name: string;
  ic_no: string;
  fwd_member_no?: string | null;
  fwd_client_no?: string | null;
  client_id?: string | null;
  dob?: Date | string | null;
  gender?: boolean | null;
  member_type?: string | null;
  member_status?: string | null;
  bank_id?: number | null;
  bank_acc_no?: string | null;
  bank_name?: string | null;
  enrollment_date?: Date | string | null;
  termination_date?: Date | string | null;
  created_at?: Date | string;
  created_by?: string | null;
  created_by_username?: string | null;
  updated_at?: Date | string | null;
  updated_by?: string | null;
  updated_by_username?: string | null;
  is_deleted?: boolean;
}

export interface MemberListItem {
  member_id: string;
  full_name: string;
  ic_no: string;
  member_type?: string | null;
  member_status?: string | null;
  enrollment_date?: Date | string | null;
  fwd_member_no?: string | null;
  client_id?: string | null;
  is_deleted?: boolean;
}

export interface CreateMemberDto {
  legacy_member_id?: string;
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
  created_by?: string;
}

export interface UpdateMemberDto {
  legacy_member_id?: string;
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
  updated_by?: string;
}

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

export interface PaginatedMembers {
  members: MemberListItem[];
  total: number;
  page: number;
  limit?: number;
  totalPages: number;
  stats: {
    total_members: number;
    active_members: number;
    deleted_members: number;
  };
}

// ============================================================================
// MEMBER ADDRESSES
// ============================================================================

export interface MemberAddress {
  address_id: string;
  legacy_member_address_id?: string | null;
  member_id: string;
  address_type?: string | null;
  street_line1?: string | null;
  street_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  is_primary?: boolean;
}

export interface CreateMemberAddressDto {
  legacy_member_address_id?: string;
  member_id: string;
  address_type?: string;
  street_line1?: string;
  street_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_primary?: boolean;
}

export interface UpdateMemberAddressDto {
  address_type?: string;
  street_line1?: string;
  street_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_primary?: boolean;
}

// ============================================================================
// MEMBER CONTACTS
// ============================================================================

export interface MemberContact {
  contact_id: string;
  legacy_member_contact_id?: string | null;
  member_id: string;
  contact_type: string;          // EMAIL, MOBILE, PHONE, FAX
  contact_value?: string | null;
  is_primary?: boolean;
}

export interface CreateMemberContactDto {
  legacy_member_contact_id?: string;
  member_id: string;
  contact_type: string;
  contact_value?: string;
  is_primary?: boolean;
}

export interface UpdateMemberContactDto {
  contact_type?: string;
  contact_value?: string;
  is_primary?: boolean;
}

// ============================================================================
// MEMBER POLICIES
// ============================================================================

export interface MemberPolicy {
  policy_id: string;
  legacy_member_policy_id?: string | null;
  member_id: string;
  product_id: string;
  policy_no?: string | null;
  effective_date?: Date | string | null;
  expiry_date?: Date | string | null;
  status?: string | null;
  is_deleted?: boolean;
  created_at?: Date | string;
}

export interface CreateMemberPolicyDto {
  legacy_member_policy_id?: string;
  member_id: string;
  product_id: string;
  policy_no?: string;
  effective_date?: Date | string;
  expiry_date?: Date | string;
  status?: string;
}

export interface UpdateMemberPolicyDto {
  product_id?: string;
  policy_no?: string;
  effective_date?: Date | string;
  expiry_date?: Date | string;
  status?: string;
}

// ============================================================================
// MEMBER DEPENDENTS
// ============================================================================

export interface MemberDependent {
  dependent_id: string;
  legacy_dependent_id?: string | null;
  principal_member_id: string;
  full_name: string;
  ic_no?: string | null;
  relationship_id?: number | null;
  relationship_name?: string | null;
  dob?: Date | string | null;
  is_active?: boolean;
}

export interface CreateMemberDependentDto {
  legacy_dependent_id?: string;
  principal_member_id: string;
  full_name: string;
  ic_no?: string;
  relationship_id?: number | null;
  dob?: Date | string;
  is_active?: boolean;
}

export interface UpdateMemberDependentDto {
  full_name?: string;
  ic_no?: string;
  relationship_id?: number | null;
  dob?: Date | string;
  is_active?: boolean;
}

// ============================================================================
// MEMBER PEC CONDITIONS
// ============================================================================

export interface MemberPEC {
  pec_id: string;
  legacy_member_pec_id?: string | null;
  dependent_id: string;
  condition_code?: string | null;
  condition_name?: string | null;
  diagnosis_date?: Date | string | null;
  is_excluded?: boolean;
  notes?: string | null;
}

export interface CreateMemberPECDto {
  legacy_member_pec_id?: string;
  dependent_id: string;
  condition_code?: string;
  condition_name?: string;
  diagnosis_date?: Date | string;
  is_excluded?: boolean;
  notes?: string;
}

export interface UpdateMemberPECDto {
  condition_code?: string;
  condition_name?: string;
  diagnosis_date?: Date | string;
  is_excluded?: boolean;
  notes?: string;
}
