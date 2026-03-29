import { Injectable } from '@angular/core';
import { ApiResponse } from './base-api.service';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants';
import {
  Clause,
  CreateClauseDto,
  UpdateClauseDto,
  ClauseFilters,
  PaginatedClauses
} from '../../shared/models/clause.model';

/**
 * Clause Service - Handles clause management operations
 */
@Injectable({
  providedIn: 'root'
})
export class ClauseService {
  constructor(private api: ApiService) {}

  /**
   * Get paginated list of clauses with filters
   */
  getClauses(filters: ClauseFilters = {}): Observable<PaginatedClauses> {
    return this.api.post<ApiResponse<PaginatedClauses>>(
      API_ENDPOINTS.CLAUSES.LIST,
      filters
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Get clause by ID
   */
  getClauseById(clause_id: number): Observable<Clause> {
    return this.api.post<ApiResponse<Clause>>(
      API_ENDPOINTS.CLAUSES.GET,
      { clause_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Create new clause
   */
  createClause(dto: CreateClauseDto): Observable<number> {
    return this.api.post<ApiResponse<{ clause_id: number }>>(
      API_ENDPOINTS.CLAUSES.CREATE,
      dto
    ).pipe(
      map(response => response.data.clause_id),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Update clause
   */
  updateClause(clause_id: number, dto: UpdateClauseDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.CLAUSES.UPDATE,
      { clause_id, ...dto }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Delete clause (soft delete)
   */
  deleteClause(clause_id: number): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.CLAUSES.DELETE,
      { clause_id }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Check if clause code is available
   */
  checkClauseCode(clause_code: string, exclude_clause_id?: number): Observable<boolean> {
    return this.api.post<ApiResponse<{ available: boolean }>>(
      API_ENDPOINTS.CLAUSES.CHECK_CODE,
      { clause_code, exclude_clause_id }
    ).pipe(
      map(response => response.data.available),
      catchError(error => {
        throw error;
      })
    );
  }
}
