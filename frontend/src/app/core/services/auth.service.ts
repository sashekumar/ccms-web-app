import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, switchMap, catchError, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants';
import { PermissionService } from './permission.service';
import { User } from '../../shared/models/user.model';

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
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  public redirectUrl: string = '/dashboard';
  
  // Token refresh management
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private api: ApiService,
    private router: Router,
    private permissionService: PermissionService
  ) {
    // Don't call loadCurrentUser in constructor - use APP_INITIALIZER instead
  }

  /**
   * Initialize authentication (called by APP_INITIALIZER)
   * Returns a promise that resolves when auth check is complete
   */
  initializeAuth(): Promise<void> {
    return new Promise((resolve) => {
      this.api.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.ME).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data);
            sessionStorage.setItem('currentUser', JSON.stringify(response.data));
            console.log('✅ User authenticated on app init');
            
            // Load permissions
            this.permissionService.loadUserPermissions().subscribe({
              next: (permissions) => {
                const totalModules = (permissions.categories?.reduce((sum, cat) => sum + cat.modules.length, 0) || 0) +
                                    (permissions.uncategorized_modules?.length || 0) +
                                    (permissions.modules?.length || 0);
                console.log('✅ Permissions loaded on app init:', totalModules, 'modules');
                resolve();
              },
              error: () => {
                console.warn('⚠️ Failed to load permissions on init');
                resolve(); // Resolve anyway, permissions can be retried later
              }
            });
          } else {
            console.log('⚠️ No auth data from /auth/me');
            resolve();
          }
        },
        error: () => {
          // No valid session - user will be redirected to login by guard
          console.log('⚠️ No active session');
          resolve();
        }
      });
    });
  }

  /**
   * Get CSRF token for login
   */
  getCsrfToken(): Observable<ApiResponse<{ csrfToken: string }>> {
    return this.api.get<ApiResponse<{ csrfToken: string }>>(API_ENDPOINTS.AUTH.CSRF_TOKEN);
  }

  /**
   * Login user with username and password
   */
  login(username: string, password: string): Observable<ApiResponse<User>> {
    // First get CSRF token, then login
    return this.getCsrfToken().pipe(
      switchMap(tokenResponse => {
        const csrfToken = tokenResponse.data.csrfToken;
        
        return this.api.post<ApiResponse<User>>(
          API_ENDPOINTS.AUTH.LOGIN,
          { username, password },
          {
            'X-CSRF-Token': csrfToken
          }
        );
      }),
      switchMap((response) => {
        if (response.success && response.data) {
          this.currentUserSubject.next(response.data);
          sessionStorage.setItem('currentUser', JSON.stringify(response.data));
          
          // Wait for user permissions to load before completing login
          console.log('🔐 Login successful, now loading permissions...');
          return this.permissionService.loadUserPermissions().pipe(
            tap((permissions) => {
              console.log('✅ LOGIN COMPLETE: Permissions loaded successfully');
              const totalModules = (permissions.categories?.reduce((sum, cat) => sum + cat.modules.length, 0) || 0) +
                                  (permissions.uncategorized_modules?.length || 0) +
                                  (permissions.modules?.length || 0);
              console.log(`📊 User has ${totalModules} permission modules`);
            }),
            switchMap(() => of(response)),
            catchError(error => {
              console.error('⚠️ Failed to load permissions during login:', error);
              // Still allow login to proceed, permissions can be retried
              return of(response);
            })
          );
        }
        return of(response);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<ApiResponse<null>> {
    return this.api.post<ApiResponse<null>>(API_ENDPOINTS.AUTH.LOGOUT, {}).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        sessionStorage.removeItem('currentUser');
        this.permissionService.clearAllData();
        this.router.navigate(['/auth/login']);
      })
    );
  }

  /**
   * Refresh access token using refresh token
   * Returns observable that completes when refresh is done
   */
  refreshAccessToken(): Observable<boolean> {
    // Prevent multiple concurrent refresh requests
    if (this.isRefreshing) {
      return this.refreshTokenSubject.asObservable();
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(false);

    return this.api.post<ApiResponse<null>>(API_ENDPOINTS.AUTH.REFRESH, {}).pipe(
      tap((response) => {
        if (response.success) {
          console.log('✅ Token refreshed successfully');
          this.isRefreshing = false;
          this.refreshTokenSubject.next(true);
        }
      }),
      switchMap((response) => of(response.success)),
      catchError((error) => {
        console.error('❌ Token refresh failed:', error);
        this.isRefreshing = false;
        this.refreshTokenSubject.next(false);
        
        // Clear session and redirect to login
        this.currentUserSubject.next(null);
        sessionStorage.removeItem('currentUser');
        this.permissionService.clearAllData();
        this.router.navigate(['/auth/login']);
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Get refresh state observable for queuing requests during token refresh
   */
  getRefreshState(): Observable<boolean> {
    return this.refreshTokenSubject.asObservable();
  }

  /**
   * Check if token refresh is in progress
   */
  isRefreshingToken(): boolean {
    return this.isRefreshing;
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
}
