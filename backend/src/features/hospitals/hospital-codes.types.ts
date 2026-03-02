/**
 * Type definitions for Hospital Codes
 */

export interface HospitalCode {
  code_id: number;
  legacy_hospital_code_id?: string | null;
  hospital_id: number;
  code_type: string;
  code_value?: string | null;
  is_active: boolean;
}

export interface CreateHospitalCodeDto {
  hospital_id: number;
  code_type: string;
  code_value?: string;
  is_active?: boolean;
  legacy_hospital_code_id?: string;
}

export interface UpdateHospitalCodeDto {
  code_type?: string;
  code_value?: string;
  is_active?: boolean;
}
