/**
 * Bank model definitions
 */

export interface Bank {
  bank_id: number;
  legacy_bank_id?: string | null;
  bank_code: string;
  bank_name: string;
  is_active: boolean;
}

export interface CreateBankDto {
  bank_code: string;
  bank_name: string;
  legacy_bank_id?: string;
  is_active?: boolean;
}

export interface UpdateBankDto {
  bank_code?: string;
  bank_name?: string;
  legacy_bank_id?: string;
  is_active?: boolean;
}

export interface BankFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedBanks {
  banks: Bank[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
