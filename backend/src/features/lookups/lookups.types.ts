/**
 * Type definitions for Lookups module
 * Handles lookup categories, lookups, and lookup metadata
 */

// ============================================================================
// LOOKUP CATEGORIES
// ============================================================================

export interface LookupCategory {
  category_id: number;
  legacy_category_id?: string | null;
  category_name: string;
  description: string | null;
  is_active: boolean;
}

export interface LookupCategoryListItem {
  category_id: number;
  legacy_category_id?: string | null;
  category_name: string;
  description: string | null;
  is_active: boolean;
  lookup_count: number;
}

export interface CategoryDropdownItem {
  category_id: number;
  category_name: string;
}

export interface CreateLookupCategoryDto {
  legacy_category_id?: string;
  category_name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateLookupCategoryDto {
  category_name?: string;
  description?: string;
  legacy_category_id?: string;
  is_active?: boolean;
}

// ============================================================================
// LOOKUPS
// ============================================================================

export interface Lookup {
  lookup_id: number;
  legacy_lookup_id?: string | null;
  category_id: number;
  lookup_code: string;
  lookup_value: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
}

export interface LookupListItem {
  lookup_id: number;
  legacy_lookup_id?: string | null;
  category_id: number;
  category_name: string;
  lookup_code: string;
  lookup_value: string;
  sort_order: number;
  is_active: boolean;
  metadata_count: number;
}

export interface CreateLookupDto {
  legacy_lookup_id?: string;
  category_id?: number;  // Either provide category_id
  new_category_name?: string;  // Or create new category
  new_category_description?: string;
  new_category_legacy_id?: string;  // Optional legacy ID for new category
  lookup_code: string;
  lookup_value: string;
  sort_order?: number;  // Auto-calculated if not provided
  is_active?: boolean;
}

export interface UpdateLookupDto {
  category_id?: number;
  lookup_code?: string;
  lookup_value?: string;
  sort_order?: number;
  legacy_lookup_id?: string;
  is_active?: boolean;
}

// ============================================================================
// LOOKUP METADATA
// ============================================================================

export interface LookupMetadata {
  metadata_id: number;
  lookup_id: number;
  metadata_key: string;
  metadata_value: string;
}

export interface LookupMetadataListItem {
  metadata_id: number;
  lookup_id: number;
  lookup_code: string;
  lookup_value: string;
  category_name: string;
  metadata_key: string;
  metadata_value: string;
}

export interface CreateLookupMetadataDto {
  lookup_id: number;
  metadata_key: string;
  metadata_value: string;
}

export interface UpdateLookupMetadataDto {
  metadata_key?: string;
  metadata_value?: string;
  legacy_metadata_id?: string;
}

// ============================================================================
// FILTERS & PAGINATION
// ============================================================================

export interface LookupCategoryFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface LookupFilters {
  search?: string;
  categoryId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface LookupMetadataFilters {
  search?: string;
  lookupId?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedLookupCategories {
  categories: LookupCategoryListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedLookups {
  lookups: LookupListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedLookupMetadata {
  metadata: LookupMetadataListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface GetLookupCategoryRequest {
  category_id: number;
}

export interface GetLookupRequest {
  lookup_id: number;
}

export interface GetLookupMetadataRequest {
  metadata_id: number;
}

export interface GetLookupsByCategoryRequest {
  category_id: number;
  is_active?: boolean;
}
