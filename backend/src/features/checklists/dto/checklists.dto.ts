/**
 * Checklists - Data Transfer Objects
 * API request/response models for checklists
 */

// ============================================================================
// FILTERS & SEARCH PARAMS
// ============================================================================

export interface ChecklistFilters {
  claim_id?: bigint;
  checklist_type?: string;
  check_key?: string;
  modified_by?: string;
  updated_after?: Date;
  updated_before?: Date;
  search?: string; // Full-text search on check_key or check_value
}

// ============================================================================
// CREATE / UPDATE DTOs
// ============================================================================

export interface CreateChecklistDto {
  claim_id: bigint;
  checklist_type?: string | null;
  check_key: string;
  check_value?: string | null;
  updated_by: string;
}

export interface UpdateChecklistDto {
  check_value?: string | null;
  checklist_type?: string | null;
  updated_by?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

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
