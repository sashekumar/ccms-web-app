import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BaseApiService, ApiResponse } from './base-api.service';
import { LoggerService } from './logger.service';
import {
  User,
  UserDetail,
  CreateUserDto,
  UpdateUserDto,
  UserFilters,
  PaginatedUsers
} from '../../shared/models/user.model';

/**
 * User Service - Handles user management operations
 * Extends BaseApiService for standard CRUD operations
 */
@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseApiService<UserDetail> {
  constructor(
    http: HttpClient,
    protected override logger: LoggerService
  ) {
    // Pass base endpoint path without the '/list' or '/create' suffix
    // environment.apiUrl already includes '/api'
    super(http, '/users', logger);
  }

  /**
   * Get paginated list of users with filters
   */
  getUsers(filters: UserFilters = {}): Observable<PaginatedUsers> {
    return this.http.post<ApiResponse<PaginatedUsers>>(
      `${this.endpoint}/list`,
      filters
    ).pipe(
      map(response => response.data),
      catchError(error => {
        this.logger.error('Error fetching users:', error);
        throw error;
      })
    );
  }

  /**
   * Get user by ID (inherited from BaseApiService as getById)
   * Alias method for backward compatibility
   */
  getUserById(userId: number): Observable<UserDetail> {
    return this.getById(userId);
  }

  /**
   * Create new user
   * Uses BaseApiService.create() and extracts userId from response
   */
  createUser(dto: CreateUserDto): Observable<number> {
    return this.http.post<ApiResponse<{ userId: number }>>(
      this.endpoint,
      dto
    ).pipe(
      map(response => response.data.userId),
      catchError(error => {
        this.logger.error('Error creating user:', error);
        throw error;
      })
    );
  }

  /**
   * Update user
   * Uses custom DTO that doesn't match entity type
   */
  updateUser(userId: number, dto: UpdateUserDto): Observable<void> {
    return this.http.put<ApiResponse<void>>(
      `${this.endpoint}/${userId}`,
      dto
    ).pipe(
      map(() => undefined),
      catchError(this.handleError)
    );
  }

  /**
   * Delete user (inherited from BaseApiService as delete)
   * Alias method for backward compatibility
   */
  deleteUser(userId: number): Observable<void> {
    return this.delete(userId);
  }

  /**
   * Check username availability
   */
  checkUsernameAvailability(username: string, excludeUserId?: number): Observable<boolean> {
    return this.http.post<ApiResponse<{ available: boolean }>>(
      `${this.endpoint}/check-username`,
      { username, excludeUserId }
    ).pipe(
      map(response => response.data.available),
      catchError(error => {
        this.logger.error('Error checking username:', error);
        return of(false);
      })
    );
  }
}
