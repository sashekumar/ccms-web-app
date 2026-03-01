/**
 * Lookup category model
 */
export interface LookupCategory {
  category_id: number;
  legacy_category_id?: string | null;
  category_name: string;
  description?: string;
  is_active: boolean;
}

/**
 * Lookup model
 */
export interface Lookup {
  lookup_id: number;
  legacy_lookup_id?: string | null;
  category_id: number;
  lookup_code: string;
  lookup_value: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  
  // Joined fields
  category_name?: string;
}

/**
 * Lookup metadata model
 */
export interface LookupMetadata {
  metadata_id: number;
  lookup_id: number;
  metadata_key: string;
  metadata_value: string;
  
  // Joined fields
  lookup_code?: string;
  lookup_value?: string;
  category_name?: string;
}

/**
 * Lookup category DTOs
 */
export interface CreateLookupCategoryDto {
  legacy_category_id?: string;
  category_name: string;
  description?: string;
  is_active: boolean;
}

export interface UpdateLookupCategoryDto {
  category_name?: string;
  description?: string;
  legacy_category_id?: string;
  is_active?: boolean;
}

/**
 * Lookup DTOs
 */
export interface CreateLookupDto {
  legacy_lookup_id?: string;
  category_id?: number;  // Either provide category_id
  new_category_name?: string;  // Or create new category
  new_category_description?: string;
  new_category_legacy_id?: string;  // Optional legacy ID for new category
  lookup_code: string;
  lookup_value: string;
  sort_order?: number;  // Auto-calculated if not provided
  is_active: boolean;
}

export interface UpdateLookupDto {
  category_id?: number;
  lookup_code?: string;
  lookup_value?: string;
  sort_order?: number;
  legacy_lookup_id?: string;
  is_active?: boolean;
}

/**
 * Lookup metadata DTOs
 */
export interface CreateLookupMetadataDto {
  lookup_id: number;
  metadata_key: string;
  metadata_value: string;
}

export interface UpdateLookupMetadataDto {
  lookup_id?: number;
  metadata_key?: string;
  metadata_value?: string;
}

/**
 * Lookup category filters
 */
export interface LookupCategoryFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Lookup filters
 */
export interface LookupFilters {
  category_id?: number;
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Lookup metadata filters
 */
export interface LookupMetadataFilters {
  lookup_id?: number;
  metadata_key?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Paginated results
 */
export interface PaginatedLookupCategories {
  categories: LookupCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedLookups {
  lookups: Lookup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedLookupMetadata {
  metadata: LookupMetadata[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
