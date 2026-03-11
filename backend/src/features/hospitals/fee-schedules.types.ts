/**
 * Type definitions for Fee Schedules
 */

export interface FeeSchedule {
  fee_id: number;
  legacy_fee_schedule_id?: string | null;
  hospital_id?: number | null;
  fee_type?: string | null;
  item_code?: string | null;
  description?: string | null;
  amount?: number | null;
  effective_date?: Date | null;
  expiry_date?: Date | null;
  is_active: boolean;
}

export interface CreateFeeScheduleDto {
  hospital_id?: number;
  fee_type?: string;
  item_code?: string;
  description?: string;
  amount?: number;
  effective_date?: Date;
  expiry_date?: Date;
  is_active?: boolean;
}

export interface UpdateFeeScheduleDto {
  fee_type?: string;
  item_code?: string;
  description?: string;
  amount?: number;
  effective_date?: Date;
  expiry_date?: Date;
  is_active?: boolean;
}

export interface FeeScheduleFilters {
  hospital_id?: number;
  fee_type?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}
