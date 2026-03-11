/**
 * Type definitions for Hospital Staff
 */

export interface HospitalStaff {
  staff_id: number;
  legacy_hospital_staff_id?: string | null;
  hospital_id: number;
  staff_name: string;
  staff_type?: string | null;
  specialty?: string | null;
  is_active: boolean;
}

export interface CreateHospitalStaffDto {
  hospital_id: number;
  staff_name: string;
  staff_type?: string;
  specialty?: string;
  is_active?: boolean;
}

export interface UpdateHospitalStaffDto {
  staff_name?: string;
  staff_type?: string;
  specialty?: string;
  is_active?: boolean;
}
