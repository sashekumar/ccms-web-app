import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User {
  userId: number;
  username: string;
  fullName: string;
  roleId: number;
  permissions: any;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Auth Service - Authentication and authorization
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  public redirectUrl: string = '/dashboard';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadCurrentUser();
  }

  /**
   * Get CSRF token for login
   */
  getCsrfToken(): Observable<ApiResponse<{ csrfToken: string }>> {
    return this.http.get<ApiResponse<{ csrfToken: string }>>(`${this.apiUrl}/auth/csrf-token`);
  }

  /**
   * Login user with username and password
   */
  login(username: string, password: string): Observable<ApiResponse<User>> {
    // First get CSRF token, then login
    return this.getCsrfToken().pipe(
      switchMap(tokenResponse => {
        const csrfToken = tokenResponse.data.csrfToken;
        
        return this.http.post<ApiResponse<User>>(
          `${this.apiUrl}/auth/login`,
          { username, password },
          {
            withCredentials: true,
            headers: {
              'X-CSRF-Token': csrfToken
            }
          }
        );
      }),
      tap((response) => {
        if (response.success && response.data) {
          this.currentUserSubject.next(response.data);
          sessionStorage.setItem('currentUser', JSON.stringify(response.data));
        }
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/auth/logout`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        sessionStorage.removeItem('currentUser');
        this.router.navigate(['/auth/login']);
      })
    );
  }

  /**
   * Get current user info
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Check if user has specific role ID
   */
  hasRole(roleId: number): boolean {
    const user = this.getCurrentUser();
    return user ? user.roleId === roleId : false;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.permissions) return false;
    
    // Check if permission exists in the permissions object
    return user.permissions[permission] === true;
  }

  /**
   * Load current user from API
   */
  private loadCurrentUser(): void {
    // Try to load from session storage first
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
      
      // Verify with server only if user exists in session
      this.http.get<ApiResponse<User>>(`${this.apiUrl}/auth/me`, {
        withCredentials: true
      }).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data);
            sessionStorage.setItem('currentUser', JSON.stringify(response.data));
          }
        },
        error: (err) => {
          // Session expired, clear local data (silently)
          this.currentUserSubject.next(null);
          sessionStorage.removeItem('currentUser');
          // Don't log error - this is expected behavior when session expires
        }
      });
    }
  }
}
