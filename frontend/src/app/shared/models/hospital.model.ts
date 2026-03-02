/**
 * Hospital model definitions
 */

export interface Hospital {
  hospital_id: string;
  legacy_hospital_id?: string | null;
  hospital_name: string;
  hospital_code?: string | null;
  hospital_type?: string | null;
  reg_no?: string | null;
  bank_id?: number | null;
  bank_acc_no?: string | null;
  is_panel?: boolean | null;
  panel_status?: string | null;
  panel_effective_date?: Date | null;
  accreditation_status?: string | null;
  accreditation_expiry?: Date | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface HospitalListItem {
  hospital_id: string;
  hospital_name: string;
  hospital_code?: string | null;
  hospital_type?: string | null;
  is_panel?: boolean | null;
  panel_status?: string | null;
  accreditation_status?: string | null;
  is_deleted: boolean;
}

export interface CreateHospitalDto {
  hospital_name: string;
  legacy_hospital_id?: string;
  hospital_code?: string | null;
  hospital_type?: string | null;
  reg_no?: string | null;
  bank_id?: number | null;
  bank_acc_no?: string | null;
  is_panel?: boolean | null;
  panel_status?: string | null;
  panel_effective_date?: Date | string | null;
  accreditation_status?: string | null;
  accreditation_expiry?: Date | string | null;
}

export interface UpdateHospitalDto {
  hospital_name?: string;
  legacy_hospital_id?: string;
  hospital_code?: string | null;
  hospital_type?: string | null;
  reg_no?: string | null;
  bank_id?: number | null;
  bank_acc_no?: string | null;
  is_panel?: boolean | null;
  panel_status?: string | null;
  panel_effective_date?: Date | string | null;
  accreditation_status?: string | null;
  accreditation_expiry?: Date | string | null;
}

export interface HospitalFilters {
  search?: string;
  hospital_type?: string;
  is_panel?: boolean;
  panel_status?: string;
  is_deleted?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedHospitals {
  hospitals: HospitalListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: HospitalStats;
}

// Sub-entity models

export interface HospitalAddress {
  address_id: string;
  hospital_id: string;
  legacy_hospital_address_id: string;
  address_type?: string | null;
  street_line1?: string | null;
  street_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface HospitalCode {
  code_id: string;
  hospital_id: string;
  legacy_hospital_code_id?: string | null;
  code_type: string;
  code_value?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface HospitalStaff {
  staff_id: string;
  hospital_id: string;
  legacy_hospital_staff_id?: string | null;
  staff_name: string;
  staff_type?: string | null;
  specialty?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface HospitalStaffContact {
  contact_id: string;
  staff_id: string;
  legacy_hospital_contact_id?: string | null;
  contact_type: string;
  contact_value?: string | null;
  is_primary: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface FeeSchedule {
  fee_id: string;
  hospital_id: string;
  fee_type: string;
  item_code?: string | null;
  description?: string | null;
  amount?: number | null;
  effective_date?: Date | null;
  expiry_date?: Date | null;
  is_active: boolean;
  legacy_fee_schedule_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

// Stats interface for hospital list
export interface HospitalStats {
  total: number;
  panel: number;
  nonPanel: number;
  active: number;
  inactive: number;
}
