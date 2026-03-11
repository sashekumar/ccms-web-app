/**
 * Member Contact Types
 * 
 * Type definitions for member contacts.
 * These types correspond to the ccms_member_contacts table structure.
 */

/**
 * Full Member Contact entity (from database)
 */
export interface MemberContact {
  contact_id: string;
  legacy_member_contact_id?: string;
  member_id: string;
  contact_type?: string; // EMAIL, MOBILE, PHONE, FAX
  contact_value?: string;
  is_primary?: boolean;
}

/**
 * Create Member Contact DTO
 */
export interface CreateMemberContactDto {
  member_id: string;
  contact_type?: string;
  contact_value?: string;
  is_primary?: boolean;
}

/**
 * Update Member Contact DTO
 */
export interface UpdateMemberContactDto {
  contact_id: string;
  contact_type?: string;
  contact_value?: string;
  is_primary?: boolean;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface GetMemberContactsRequest {
  member_id: string;
}

export interface GetMemberContactRequest {
  contact_id: string;
}

export interface CreateMemberContactRequest extends CreateMemberContactDto {}

export interface UpdateMemberContactRequest extends UpdateMemberContactDto {}

export interface DeleteMemberContactRequest {
  contact_id: string;
}

export interface SetPrimaryContactRequest {
  member_id: string;
  contact_id: string;
  contact_type: string; // Set primary within same type (e.g., primary EMAIL)
}
