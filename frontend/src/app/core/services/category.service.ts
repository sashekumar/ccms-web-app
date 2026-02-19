import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Category } from '../../shared/models/permission.model';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

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
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/permissions/categories`;

  constructor(private http: HttpClient) {}

  /**
   * Get all categories
   * GET /api/permissions/categories
   */
  getAllCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(
      this.apiUrl,
      { withCredentials: true }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching categories:', error);
        throw error;
      })
    );
  }

  /**
   * Get category by ID
   * GET /api/permissions/categories/:id
   */
  getCategoryById(categoryId: number): Observable<Category> {
    return this.http.get<ApiResponse<Category>>(
      `${this.apiUrl}/${categoryId}`,
      { withCredentials: true }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching category:', error);
        throw error;
      })
    );
  }

  /**
   * Create new category
   * POST /api/permissions/categories
   */
  createCategory(data: CreateCategoryDto): Observable<number> {
    return this.http.post<ApiResponse<{ category_id: number }>>(
      this.apiUrl,
      data,
      { withCredentials: true }
    ).pipe(
      map(response => response.data.category_id),
      catchError(error => {
        console.error('Error creating category:', error);
        throw error;
      })
    );
  }

  /**
   * Update category
   * PUT /api/permissions/categories/:id
   */
  updateCategory(categoryId: number, data: UpdateCategoryDto): Observable<void> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/${categoryId}`,
      data,
      { withCredentials: true }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error updating category:', error);
        throw error;
      })
    );
  }

  /**
   * Delete category
   * DELETE /api/permissions/categories/:id
   */
  deleteCategory(categoryId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${categoryId}`,
      { withCredentials: true }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting category:', error);
        throw error;
      })
    );
  }
}
