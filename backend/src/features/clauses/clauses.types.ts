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
  clause_category?: string;
  clause_code: string;
  clause_text: string;
  is_active?: boolean;
}

export interface UpdateClauseDto {
  clause_code?: string;
  clause_text?: string;
  is_active?: boolean;
}

export interface ClauseFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
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
