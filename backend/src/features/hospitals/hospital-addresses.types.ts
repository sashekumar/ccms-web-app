/**
 * Type definitions for Hospital Addresses
 */

export interface HospitalAddress {
  address_id: number;
  legacy_hospital_address_id: string;
  hospital_id: number;
  address_type: string;
  street_line1?: string | null;
  street_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_primary: boolean;
}

export interface CreateHospitalAddressDto {
  hospital_id: number;
  legacy_hospital_address_id: string;
  address_type?: string;
  street_line1?: string;
  street_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  is_primary?: boolean;
}

export interface UpdateHospitalAddressDto {
  address_type?: string;
  street_line1?: string;
  street_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  is_primary?: boolean;
}
