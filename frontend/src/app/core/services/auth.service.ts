import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, switchMap, catchError, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { LoggerService } from './logger.service';
import { API_ENDPOINTS } from '../constants';
import { PermissionService } from './permission.service';
import { User } from '../../shared/models/user.model';
import { ApiResponse } from './base-api.service';


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
  private refreshTokenSubject: BehaviorSubject<boolean | null> = new BehaviorSubject<boolean | null>(null);

  constructor(
    private api: ApiService,
    private router: Router,
    private permissionService: PermissionService,
    private logger: LoggerService
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
            
            // Load permissions
            this.permissionService.loadUserPermissions().subscribe({
              next: (permissions) => {
                const totalModules = (permissions.categories?.reduce((sum, cat) => sum + cat.modules.length, 0) || 0) +
                                    (permissions.uncategorized_modules?.length || 0) +
                                    (permissions.modules?.length || 0);
                resolve();
              },
              error: () => {
                this.logger.warn('Failed to load permissions on init');
                resolve(); // Resolve anyway, permissions can be retried later
              }
            });
          } else {
            resolve();
          }
        },
        error: () => {
          // Access token may be expired — try refreshing and retrying /me
          this.refreshAccessToken().subscribe({
            next: (success) => {
              if (success) {
                this.api.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.ME).subscribe({
                  next: (response) => {
                    if (response.success && response.data) {
                      this.currentUserSubject.next(response.data);
                      sessionStorage.setItem('currentUser', JSON.stringify(response.data));
                      this.permissionService.loadUserPermissions().subscribe({
                        next: () => resolve(),
                        error: () => {
                          this.logger.warn('Failed to load permissions on init');
                          resolve();
                        }
                      });
                    } else {
                      resolve();
                    }
                  },
                  error: () => resolve()
                });
              } else {
                resolve();
              }
            },
            error: () => resolve() // Refresh token also expired — guard will redirect to login
          });
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
          return this.permissionService.loadUserPermissions().pipe(
            tap((permissions) => {
              const totalModules = (permissions.categories?.reduce((sum, cat) => sum + cat.modules.length, 0) || 0) +
                                  (permissions.uncategorized_modules?.length || 0) +
                                  (permissions.modules?.length || 0);
            }),
            switchMap(() => of(response)),
            catchError(error => {
              this.logger.error('Failed to load permissions during login:', error);
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
    // If a refresh is already in progress, wait for it to complete
    if (this.isRefreshing) {
      return this.refreshTokenSubject.asObservable().pipe(
        filter((state): state is boolean => state !== null),
        take(1)
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null); // null = refresh in progress

    return this.api.post<ApiResponse<null>>(API_ENDPOINTS.AUTH.REFRESH, {}).pipe(
      tap((response) => {
        // Always reset regardless of response.success to prevent isRefreshing from getting stuck
        this.isRefreshing = false;
        this.refreshTokenSubject.next(response.success);
      }),
      switchMap((response) => of(response.success)),
      catchError((error) => {
        this.logger.error('Token refresh failed:', error);
        this.isRefreshing = false;
        this.refreshTokenSubject.next(false);
        
        // Only clear session and redirect if we haven't already
        if (this.currentUserSubject.value) {
          this.currentUserSubject.next(null);
          sessionStorage.removeItem('currentUser');
          sessionStorage.removeItem('activeRoleId');
          this.permissionService.clearAllData();
          
          // Small delay to avoid race conditions during error handling
          setTimeout(() => {
            if (!this.router.url.startsWith('/auth')) {
              this.router.navigate(['/auth/login'], { 
                queryParams: { reason: 'session_expired' } 
              });
            }
          }, 100);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Get refresh state observable for queuing requests during token refresh
   */
  getRefreshState(): Observable<boolean | null> {
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
