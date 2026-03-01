import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BaseApiService, ApiResponse } from './base-api.service';
import { LoggerService } from './logger.service';
import { Category } from '../../shared/models/permission.model';

export interface CreateCategoryDto {
  category_name: string;
  category_code: string;
  description?: string;
  icon?: string;
  display_order: number;
}

export interface UpdateCategoryDto {
  category_name?: string;
  category_code?: string;
  description?: string;
  icon?: string;
  display_order?: number;
  is_active?: boolean;
}

/**
 * Category Service - Handles category management operations
 * Extends BaseApiService for standard CRUD operations
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService extends BaseApiService<Category> {
  constructor(
    http: HttpClient,
    protected override logger: LoggerService
  ) {
    // Pass base endpoint path
    // environment.apiUrl already includes '/api'
    super(http, '/permissions/categories', logger);
  }

  /**
   * Get all categories (inherited from BaseApiService as getAll)
   * Alias method for backward compatibility
   */
  getAllCategories(): Observable<Category[]> {
    return this.getAll();
  }

  /**
   * Get category by ID (inherited from BaseApiService as getById)
   * Alias method for backward compatibility
   */
  getCategoryById(categoryId: number): Observable<Category> {
    return this.getById(categoryId);
  }

  /**
   * Create new category
   * Uses BaseApiService infrastructure with custom response handling
   */
  createCategory(data: CreateCategoryDto): Observable<number> {
    return this.http.post<ApiResponse<{ category_id: number }>>(
      this.endpoint,
      data
    ).pipe(
      map(response => response.data.category_id),
      catchError(error => {
        this.logger.error('Error creating category:', error);
        throw error;
      })
    );
  }

  /**
   * Update category
   * Uses custom DTO that doesn't match entity type exactly
   */
  updateCategory(categoryId: number, data: UpdateCategoryDto): Observable<void> {
    return this.http.put<ApiResponse<void>>(
      `${this.endpoint}/${categoryId}`,
      data
    ).pipe(
      map(() => undefined),
      catchError(this.handleError)
    );
  }

  /**
   * Delete category (inherited from BaseApiService as delete)
   * Alias method for backward compatibility
   */
  deleteCategory(categoryId: number): Observable<void> {
    return this.delete(categoryId);
  }
}
