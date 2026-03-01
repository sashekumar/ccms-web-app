/**
 * Clause model definitions
 */

export interface Clause {
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
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedClauses {
  clauses: Clause[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
