import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

/**
 * Base API Service
 * Provides common API operations with centralized error handling
 * All feature services should extend this class to eliminate code duplication
 * 
 * @template T - The entity type this service works with
 */
@Injectable()
export abstract class BaseApiService<T> {
  protected endpoint: string;

  /**
   * @param http - Angular HTTP client
   * @param endpoint - API endpoint path (e.g., '/users', '/roles')
   * @param logger - Optional LoggerService for error logging
   */
  constructor(
    protected http: HttpClient,
    endpoint: string,
    protected logger?: LoggerService
  ) {
    // Construct full URL from environment + endpoint
    this.endpoint = `${environment.apiUrl}${endpoint}`;
  }

  /**
   * Get all records
   */
  getAll(): Observable<T[]> {
    return this.http.get<ApiResponse<T[]>>(this.endpoint).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get record by ID
   */
  getById(id: string | number): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.endpoint}/${id}`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Create new record
   */
  create(data: Partial<T>): Observable<T> {
    return this.http.post<ApiResponse<T>>(this.endpoint, data).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Update record
   */
  update(id: string | number, data: Partial<T>): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.endpoint}/${id}`, data).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Delete record
   */
  delete(id: string | number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.endpoint}/${id}`).pipe(
      map(() => undefined),
      catchError(this.handleError)
    );
  }

  /**
   * Centralized error handling
   * Override this method in child classes for custom error handling
   */
  protected handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else {
        errorMessage = `Server error: ${error.status} - ${error.statusText}`;
      }
    }

    if (this.logger) {
      this.logger.error(`API Error: ${errorMessage}`, error);
    } else {
      console.error('API Error:', errorMessage, error);
    }
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Handle API response with data extraction
   */
  protected extractData<R>(response: ApiResponse<R>): R {
    return response.data;
  }
}
