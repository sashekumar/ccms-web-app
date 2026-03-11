/**
 * Type definitions for Hospital Staff Contacts
 */

export interface HospitalStaffContact {
  contact_id: number;
  legacy_hospital_contact_id?: string | null;
  staff_id: number;
  contact_type: string;
  contact_value?: string | null;
  is_primary: boolean;
}

export interface CreateHospitalStaffContactDto {
  staff_id: number;
  contact_type: string;
  contact_value?: string;
  is_primary?: boolean;
}

export interface UpdateHospitalStaffContactDto {
  contact_type?: string;
  contact_value?: string;
  is_primary?: boolean;
}
