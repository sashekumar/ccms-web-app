/**
 * Checklists - Frontend Model & Types
 * Defines TypeScript interfaces for frontend checklist operations
 */

export interface ChecklistRecord {
  checklist_id: bigint;
  claim_id: bigint;
  checklist_type?: string | null;
  check_key: string;
  check_value?: string | null;
  updated_by: string;
  updated_at: Date;
  created_at: Date;
}

export interface ChecklistFilters {
  claim_id?: bigint;
  checklist_type?: string;
  check_key?: string;
  modified_by?: string;
  updated_after?: string;
  updated_before?: string;
  search?: string;
}

export interface ChecklistsStatsResponse {
  total_checklists: number;
  total_claims_with_checklists: number;
  checklists_today: number;
  checklist_types: Array<{ type: string; count: number }>;
  top_modifier: string | null;
}

export interface PaginatedChecklistResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
