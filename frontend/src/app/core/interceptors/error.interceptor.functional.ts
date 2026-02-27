import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { API_ENDPOINTS } from '../constants';

/**
 * Error Interceptor (Functional) - Global HTTP error handling with automatic token refresh
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;

        // Handle specific HTTP errors
        switch (error.status) {
          case 401:
            // Skip refresh for certain endpoints
            const skipRefreshEndpoints = [
              API_ENDPOINTS.AUTH.LOGIN,
              API_ENDPOINTS.AUTH.REFRESH,
              API_ENDPOINTS.AUTH.ME,
              API_ENDPOINTS.AUTH.CSRF_TOKEN
            ];
            const shouldSkipRefresh = skipRefreshEndpoints.some(endpoint => req.url.includes(endpoint));

            if (shouldSkipRefresh) {
              // For /me endpoint, fail silently (expected during session check)
              if (req.url.includes(API_ENDPOINTS.AUTH.ME)) {
                return throwError(() => error);
              }

              // For other auth endpoints, redirect to login
              if (!router.url.startsWith('/auth')) {
                sessionStorage.removeItem('currentUser');
                router.navigate(['/auth/login']);
              }
              return throwError(() => error);
            }

            // Attempt automatic token refresh
            console.log('🔄 Access token expired, attempting refresh...');

            // If already refreshing, wait for it to complete
            if (authService.isRefreshingToken()) {
              return authService.getRefreshState().pipe(
                filter(refreshed => refreshed === true),
                take(1),
                switchMap(() => {
                  console.log('♻️ Retrying original request after token refresh');
                  return next(req);
                })
              );
            }

            // Attempt token refresh
            return authService.refreshAccessToken().pipe(
              switchMap((success) => {
                if (success) {
                  console.log('♻️ Retrying original request after successful refresh');
                  // Retry the original request with new token
                  return next(req);
                }
                return throwError(() => error);
              }),
              catchError((refreshError) => {
                // Refresh failed, redirect to login
                console.error('❌ Token refresh failed, redirecting to login');
                return throwError(() => error);
              })
            );

          case 403:
            // Forbidden - log but don't redirect
            // Let the component handle this error (show message/toast)
            console.warn('Access denied:', error.error?.message || 'You do not have permission to perform this action');
            
            // Only redirect if explicitly navigating to a protected route (not for button clicks/API calls)
            // This prevents unwanted redirects when users click buttons they shouldn't have access to
            if (req.method === 'GET' && !req.url.includes('/api/')) {
              router.navigate(['/unauthorized']);
            }
            break;
          case 404:
            // Not found
            console.error('Resource not found');
            break;
          case 500:
            // Internal server error
            console.error('Server error occurred');
            break;
        }
      }

      // Only log non-401 errors or 401 errors from skipped endpoints
      if (error.status !== 401 || req.url.includes(API_ENDPOINTS.AUTH.ME)) {
        console.error(errorMessage);
      }
      
      return throwError(() => error);
    })
  );
};
