import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants';
import {
  User,
  UserDetail,
  CreateUserDto,
  UpdateUserDto,
  UserFilters,
  PaginatedUsers
} from '../../shared/models/user.model';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * User Service - Handles user management operations
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private api: ApiService) {}

  /**
   * Get paginated list of users with filters
   */
  getUsers(filters: UserFilters = {}): Observable<PaginatedUsers> {
    return this.api.post<ApiResponse<PaginatedUsers>>(
      API_ENDPOINTS.USERS.LIST,
      filters
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching users:', error);
        throw error;
      })
    );
  }

  /**
   * Get user by ID
   */
  getUserById(userId: number): Observable<UserDetail> {
    return this.api.get<ApiResponse<UserDetail>>(
      API_ENDPOINTS.USERS.getById(userId)
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching user:', error);
        throw error;
      })
    );
  }

  /**
   * Create new user
   */
  createUser(dto: CreateUserDto): Observable<number> {
    return this.api.post<ApiResponse<{ userId: number }>>(
      API_ENDPOINTS.USERS.CREATE,
      dto
    ).pipe(
      map(response => response.data.userId),
      catchError(error => {
        console.error('Error creating user:', error);
        throw error;
      })
    );
  }

  /**
   * Update user
   */
  updateUser(userId: number, dto: UpdateUserDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.USERS.update(userId),
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error updating user:', error);
        throw error;
      })
    );
  }

  /**
   * Delete user (soft delete)
   */
  deleteUser(userId: number): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.USERS.delete(userId)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting user:', error);
        throw error;
      })
    );
  }

  /**
   * Check username availability
   */
  checkUsernameAvailability(username: string, excludeUserId?: number): Observable<boolean> {
    return this.api.post<ApiResponse<{ available: boolean }>>(
      API_ENDPOINTS.USERS.CHECK_USERNAME,
      { username, excludeUserId }
    ).pipe(
      map(response => response.data.available),
      catchError(error => {
        console.error('Error checking username:', error);
        return of(false);
      })
    );
  }
}
