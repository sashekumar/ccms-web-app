/**
 * Member Dependent Types
 * 
 * Type definitions for member dependents.
 * These types correspond to the ccms_member_dependents table structure.
 */

/**
 * Full Member Dependent entity (from database)
 */
export interface MemberDependent {
  dependent_id: string;
  legacy_dependent_id?: string;
  principal_member_id: string;
  full_name: string;
  ic_no?: string;
  relationship_id?: number;
  dob?: Date;
  is_active?: boolean;
}

/**
 * Create Member Dependent DTO
 */
export interface CreateMemberDependentDto {
  principal_member_id: string;
  full_name: string;
  ic_no?: string;
  relationship_id?: number;
  dob?: Date | string;
  is_active?: boolean;
}

/**
 * Update Member Dependent DTO
 */
export interface UpdateMemberDependentDto {
  dependent_id: string;
  full_name?: string;
  ic_no?: string;
  relationship_id?: number;
  dob?: Date | string;
  is_active?: boolean;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface GetMemberDependentsRequest {
  member_id: string;
}

export interface GetMemberDependentRequest {
  dependent_id: string;
}

export interface SetDependentActiveStatusRequest {
  dependent_id: string;
  is_active: boolean;
}

export interface CreateMemberDependentRequest extends CreateMemberDependentDto {}

export interface UpdateMemberDependentRequest extends UpdateMemberDependentDto {}

export interface DeleteMemberDependentRequest {
  dependent_id: string;
}
