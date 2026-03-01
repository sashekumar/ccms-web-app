import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants';
import {
  LookupCategory,
  Lookup,
  LookupMetadata,
  CreateLookupCategoryDto,
  UpdateLookupCategoryDto,
  CreateLookupDto,
  UpdateLookupDto,
  CreateLookupMetadataDto,
  UpdateLookupMetadataDto,
  LookupCategoryFilters,
  LookupFilters,
  LookupMetadataFilters,
  PaginatedLookupCategories,
  PaginatedLookups,
  PaginatedLookupMetadata
} from '../../shared/models/lookup.model';

@Injectable({
  providedIn: 'root'
})
export class LookupService {
  constructor(private api: ApiService) {}

  // ==================== Lookup Category Methods ====================

  /**
   * Get paginated list of lookup categories
   */
  getCategories(filters: LookupCategoryFilters = {}): Observable<PaginatedLookupCategories> {
    return this.api.post<{ success: boolean; data: PaginatedLookupCategories }>(
      API_ENDPOINTS.LOOKUPS.CATEGORIES.LIST,
      filters
    ).pipe(map(response => response.data));
  }

  /**
   * Get a single lookup category by ID
   */
  getCategoryById(categoryId: number): Observable<{ category: LookupCategory }> {
    return this.api.post<{ success: boolean; data: { category: LookupCategory } }>(
      API_ENDPOINTS.LOOKUPS.CATEGORIES.SINGLE,
      { category_id: categoryId }
    ).pipe(map(response => response.data));
  }

  /**
   * Create a new lookup category
   */
  createCategory(data: CreateLookupCategoryDto): Observable<{ category_id: number; message: string }> {
    return this.api.post<{ success: boolean; data: { category_id: number }; message: string }>(
      API_ENDPOINTS.LOOKUPS.CATEGORIES.CREATE,
      data
    ).pipe(map(response => ({ category_id: response.data.category_id, message: response.message })));
  }

  /**
   * Update an existing lookup category
   */
  updateCategory(categoryId: number, data: UpdateLookupCategoryDto): Observable<{ message: string }> {
    return this.api.put<{ success: boolean; message: string }>(
      API_ENDPOINTS.LOOKUPS.CATEGORIES.UPDATE,
      { category_id: categoryId, ...data }
    ).pipe(map(response => ({ message: response.message })));
  }

  /**
   * Delete a lookup category
   */
  deleteCategory(categoryId: number): Observable<{ message: string }> {
    return this.api.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.LOOKUPS.CATEGORIES.DELETE,
      { category_id: categoryId }
    ).pipe(map(response => ({ message: response.message })));
  }

  /**
   * Check if a category code already exists
   */
  checkCategoryCode(categoryCode: string, excludeCategoryId?: number): Observable<{ exists: boolean }> {
    return this.api.post<{ success: boolean; data: { available: boolean } }>(
      API_ENDPOINTS.LOOKUPS.CATEGORIES.CHECK_CODE,
      { category_code: categoryCode, exclude_category_id: excludeCategoryId }
    ).pipe(map(response => ({ exists: !response.data.available })));
  }

  // ==================== Lookup Methods ====================

  /**
   * Get paginated list of lookups
   */
  getLookups(filters: LookupFilters = {}): Observable<PaginatedLookups> {
    return this.api.post<{ success: boolean; data: PaginatedLookups }>(
      API_ENDPOINTS.LOOKUPS.LIST,
      filters
    ).pipe(map(response => response.data));
  }

  /**
   * Get all lookups for a category (unpaginated)
   */
  getAllLookupsByCategory(categoryId: number): Observable<{ lookups: Lookup[] }> {
    return this.api.post<{ success: boolean; data: { lookups: Lookup[] } }>(
      API_ENDPOINTS.LOOKUPS.ALL,
      { category_id: categoryId }
    ).pipe(map(response => response.data));
  }

  /**
   * Get a single lookup by ID
   */
  getLookupById(lookupId: number): Observable<{ lookup: Lookup }> {
    return this.api.post<{ success: boolean; data: { lookup: Lookup } }>(
      API_ENDPOINTS.LOOKUPS.SINGLE,
      { lookup_id: lookupId }
    ).pipe(map(response => response.data));
  }

  /**
   * Create a new lookup
   */
  createLookup(data: CreateLookupDto): Observable<{ lookup_id: number; message: string }> {
    return this.api.post<{ success: boolean; data: { lookup_id: number }; message: string }>(
      API_ENDPOINTS.LOOKUPS.CREATE,
      data
    ).pipe(map(response => ({ lookup_id: response.data.lookup_id, message: response.message })));
  }

  /**
   * Update an existing lookup
   */
  updateLookup(lookupId: number, data: UpdateLookupDto): Observable<{ message: string }> {
    return this.api.put<{ success: boolean; message: string }>(
      API_ENDPOINTS.LOOKUPS.UPDATE,
      { lookup_id: lookupId, ...data }
    ).pipe(map(response => ({ message: response.message })));
  }

  /**
   * Delete a lookup
   */
  deleteLookup(lookupId: number): Observable<{ message: string }> {
    return this.api.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.LOOKUPS.DELETE,
      { lookup_id: lookupId }
    ).pipe(map(response => ({ message: response.message })));
  }

  /**
   * Check if a lookup code already exists in a category
   */
  checkLookupCode(categoryId: number, lookupCode: string, excludeLookupId?: number): Observable<{ exists: boolean }> {
    return this.api.post<{ success: boolean; data: { available: boolean } }>(
      API_ENDPOINTS.LOOKUPS.CHECK_CODE,
      { category_id: categoryId, lookup_code: lookupCode, exclude_lookup_id: excludeLookupId }
    ).pipe(map(response => ({ exists: !response.data.available })));
  }

  // ==================== Lookup Metadata Methods ====================

  /**
   * Get paginated list of lookup metadata
   */
  getMetadata(filters: LookupMetadataFilters = {}): Observable<PaginatedLookupMetadata> {
    return this.api.post<{ success: boolean; data: PaginatedLookupMetadata }>(
      API_ENDPOINTS.LOOKUPS.METADATA.LIST,
      filters
    ).pipe(map(response => response.data));
  }

  /**
   * Get a single metadata entry by ID
   */
  getMetadataById(metadataId: number): Observable<{ metadata: LookupMetadata }> {
    return this.api.post<{ success: boolean; data: { metadata: LookupMetadata } }>(
      API_ENDPOINTS.LOOKUPS.METADATA.SINGLE,
      { metadata_id: metadataId }
    ).pipe(map(response => response.data));
  }

  /**
   * Create a new metadata entry
   */
  createMetadata(data: CreateLookupMetadataDto): Observable<{ metadata_id: number; message: string }> {
    return this.api.post<{ success: boolean; data: { metadata_id: number }; message: string }>(
      API_ENDPOINTS.LOOKUPS.METADATA.CREATE,
      data
    ).pipe(map(response => ({ metadata_id: response.data.metadata_id, message: response.message })));
  }

  /**
   * Update an existing metadata entry
   */
  updateMetadata(metadataId: number, data: UpdateLookupMetadataDto): Observable<{ message: string }> {
    return this.api.put<{ success: boolean; message: string }>(
      API_ENDPOINTS.LOOKUPS.METADATA.UPDATE,
      { metadata_id: metadataId, ...data }
    ).pipe(map(response => ({ message: response.message })));
  }

  /**
   * Delete a metadata entry
   */
  deleteMetadata(metadataId: number): Observable<{ message: string }> {
    return this.api.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.LOOKUPS.METADATA.DELETE,
      { metadata_id: metadataId }
    ).pipe(map(response => ({ message: response.message })));
  }

  /**
   * Check if a metadata key already exists for a lookup
   */
  checkMetadataKey(lookupId: number, metadataKey: string, excludeMetadataId?: number): Observable<{ exists: boolean }> {
    return this.api.post<{ success: boolean; data: { available: boolean } }>(
      API_ENDPOINTS.LOOKUPS.METADATA.CHECK_KEY,
      { lookup_id: lookupId, metadata_key: metadataKey, exclude_metadata_id: excludeMetadataId }
    ).pipe(map(response => ({ exists: !response.data.available })));
  }
}
