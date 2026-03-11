/**
 * Member PEC (Pre-Existing Condition) Types
 * 
 * Type definitions for member pre-existing conditions.
 * These types correspond to the ccms_member_pec_conditions table structure.
 */

/**
 * Full Member PEC entity (from database)
 */
export interface MemberPEC {
  pec_id: string;
  legacy_pec_id?: string;
  dependent_id: string;
  condition_code?: string;
  condition_name?: string;
  diagnosis_date?: Date;
  is_excluded?: boolean;
  notes?: string;
}

/**
 * Create Member PEC DTO
 */
export interface CreateMemberPECDto {
  dependent_id: string;
  condition_code?: string;
  condition_name?: string;
  diagnosis_date?: Date | string;
  is_excluded?: boolean;
  notes?: string;
}

/**
 * Update Member PEC DTO
 */
export interface UpdateMemberPECDto {
  pec_id: string;
  condition_code?: string;
  condition_name?: string;
  diagnosis_date?: Date | string;
  is_excluded?: boolean;
  notes?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface GetDependentPECsRequest {
  dependent_id: string;
}

export interface GetMemberPECRequest {
  pec_id: string;
}

export interface SetPECExcludedStatusRequest {
  pec_id: string;
  is_excluded: boolean;
}

export interface CreateMemberPECRequest extends CreateMemberPECDto {}

export interface UpdateMemberPECRequest extends UpdateMemberPECDto {}

export interface DeleteMemberPECRequest {
  pec_id: string;
}
