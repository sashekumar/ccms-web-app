import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Error Interceptor (Functional) - Global HTTP error handling
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

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
            // Suppress logging for /me endpoint (expected during session check)
            if (!req.url.includes('/auth/me')) {
              console.error('Unauthorized:', errorMessage);
            }
            
            // Unauthorized - redirect to login (unless already on auth pages)
            if (!router.url.startsWith('/auth')) {
              sessionStorage.removeItem('currentUser');
              router.navigate(['/auth/login']);
            }
            break;
          case 403:
            // Forbidden
            router.navigate(['/unauthorized']);
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

      // Only log non-401 errors or 401 errors not from /me endpoint
      if (error.status !== 401 || !req.url.includes('/auth/me')) {
        console.error(errorMessage);
      }
      
      return throwError(() => error);
    })
  );
};
