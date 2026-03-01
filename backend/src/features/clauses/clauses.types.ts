/**
 * Type definitions for Clauses module
 */

export interface Clause {
  clause_id: number;
  legacy_config_id?: string | null;
  clause_category?: string | null;
  clause_code: string;
  clause_text: string;
  is_active: boolean;
}

export interface ClauseListItem {
  clause_id: number;
  legacy_config_id?: string | null;
  clause_category?: string | null;
  clause_code: string;
  clause_text: string;
  is_active: boolean;
}

export interface CreateClauseDto {
  legacy_config_id?: string;
  clause_category?: string;
  clause_code: string;
  clause_text: string;
  is_active?: boolean;
}

export interface UpdateClauseDto {
  clause_code?: string;
  clause_text?: string;
  legacy_config_id?: string;
  is_active?: boolean;
}

export interface ClauseFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedClauses {
  clauses: ClauseListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetClauseRequest {
  clause_id: number;
}
