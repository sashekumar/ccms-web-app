/**
 * Type definitions for Banks module
 */

export interface Bank {
  bank_id: number;
  legacy_bank_id?: string | null;
  bank_code: string;
  bank_name: string;
  is_active: boolean;
}

export interface BankListItem {
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
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedBanks {
  banks: BankListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetBankRequest {
  bank_id: number;
}
