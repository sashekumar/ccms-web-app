/**
 * Member Address Types
 * 
 * Type definitions for member addresses.
 * These types correspond to the ccms_member_addresses table structure.
 */

/**
 * Full Member Address entity (from database)
 */
export interface MemberAddress {
  address_id: string;
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

/**
 * Create Member Address DTO
 */
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

/**
 * Update Member Address DTO
 */
export interface UpdateMemberAddressDto {
  address_id: string;
  legacy_member_address_id?: string;
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
// Request/Response Types
// ============================================================================

export interface GetMemberAddressesRequest {
  member_id: string;
}

export interface GetMemberAddressRequest {
  address_id: string;
}

export interface CreateMemberAddressRequest extends CreateMemberAddressDto {}

export interface UpdateMemberAddressRequest extends UpdateMemberAddressDto {}

export interface DeleteMemberAddressRequest {
  address_id: string;
}

export interface SetPrimaryAddressRequest {
  member_id: string;
  address_id: string;
}
