import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
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
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of users with filters
   */
  getUsers(filters: UserFilters = {}): Observable<PaginatedUsers> {
    return this.http.post<ApiResponse<PaginatedUsers>>(
      `${this.apiUrl}/list`,
      filters,
      { withCredentials: true }
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
    return this.http.get<ApiResponse<UserDetail>>(
      `${this.apiUrl}/${userId}`,
      { withCredentials: true }
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
    return this.http.post<ApiResponse<{ userId: number }>>(
      this.apiUrl,
      dto,
      { withCredentials: true }
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
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/${userId}`,
      dto,
      { withCredentials: true }
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
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${userId}`,
      { withCredentials: true }
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
    return this.http.post<ApiResponse<{ available: boolean }>>(
      `${this.apiUrl}/check-username`,
      { username, excludeUserId },
      { withCredentials: true }
    ).pipe(
      map(response => response.data.available),
      catchError(error => {
        console.error('Error checking username:', error);
        return of(false);
      })
    );
  }
}
