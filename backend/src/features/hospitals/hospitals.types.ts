/**
 * Type definitions for Hospitals module
 */

export interface Hospital {
  hospital_id: number;
  legacy_hospital_id?: string | null;
  hospital_name: string;
  hospital_code?: string | null;
  hospital_type?: string | null;
  reg_no?: string | null;
  bank_id?: number | null;
  bank_acc_no?: string | null;
  is_panel: boolean;
  panel_status?: string | null;
  panel_effective_date?: Date | null;
  accreditation_status?: string | null;
  accreditation_expiry?: Date | null;
  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date | null;
  updated_by?: string | null;
  is_deleted: boolean;
}

export interface HospitalListItem {
  hospital_id: number;
  legacy_hospital_id?: string | null;
  hospital_name: string;
  hospital_code?: string | null;
  hospital_type?: string | null;
  is_panel: boolean;
  panel_status?: string | null;
  accreditation_status?: string | null;
  is_deleted: boolean;
}

export interface CreateHospitalDto {
  hospital_name: string;
  hospital_code?: string;
  hospital_type?: string;
  reg_no?: string;
  bank_id?: number;
  bank_acc_no?: string;
  legacy_hospital_id?: string;
  is_panel?: boolean;
  panel_status?: string;
  panel_effective_date?: Date;
  accreditation_status?: string;
  accreditation_expiry?: Date;
  created_by?: string;
}

export interface UpdateHospitalDto {
  hospital_name?: string;
  hospital_code?: string;
  hospital_type?: string;
  reg_no?: string;
  bank_id?: number;
  bank_acc_no?: string;
  legacy_hospital_id?: string;
  is_panel?: boolean;
  panel_status?: string;
  panel_effective_date?: Date;
  accreditation_status?: string;
  accreditation_expiry?: Date;
  is_deleted?: boolean;
  updated_by?: string;
}

export interface HospitalFilters {
  search?: string;
  hospitalType?: string;
  isPanel?: boolean;
  panelStatus?: string;
  isDeleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface HospitalStats {
  total: number;
  panel: number;
  nonPanel: number;
  active: number;
  inactive: number;
}

export interface PaginatedHospitals {
  hospitals: HospitalListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: HospitalStats;
}

export interface GetHospitalRequest {
  hospital_id: number;
}
