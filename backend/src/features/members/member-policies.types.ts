/**
 * Member Policy Types
 * 
 * Type definitions for member policies.
 * These types correspond to the ccms_member_policies table structure.
 */

/**
 * Full Member Policy entity (from database)
 */
export interface MemberPolicy {
  policy_record_id: string;
  legacy_policy_id?: string;
  member_id: string;
  product_id: string;
  policy_no: string;
  effective_date?: Date;
  expiry_date?: Date;
  status?: string;
  is_deleted?: boolean;
}

/**
 * Create Member Policy DTO
 */
export interface CreateMemberPolicyDto {
  legacy_policy_id?: string;
  member_id: string;
  product_id: string;
  policy_no: string;
  effective_date?: Date | string;
  expiry_date?: Date | string;
  status?: string;
}

/**
 * Update Member Policy DTO
 */
export interface UpdateMemberPolicyDto {
  policy_record_id: string;
  legacy_policy_id?: string;
  product_id?: string;
  policy_no?: string;
  effective_date?: Date | string;
  expiry_date?: Date | string;
  status?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface GetMemberPoliciesRequest {
  member_id: string;
}

export interface GetMemberPolicyRequest {
  policy_id: string;
}

export interface CheckPolicyNoRequest {
  policy_no: string;
  policy_id?: string;
}

export interface CreateMemberPolicyRequest extends CreateMemberPolicyDto {}

export interface UpdateMemberPolicyRequest extends UpdateMemberPolicyDto {}

export interface DeleteMemberPolicyRequest {
  policy_record_id: string;
}
