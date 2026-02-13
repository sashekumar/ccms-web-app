import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Auth Interceptor (Functional) - Add credentials to outgoing HTTP requests
 * Enables httpOnly cookies for JWT authentication
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone request and add withCredentials for httpOnly cookies
  const clonedRequest = req.clone({
    withCredentials: true  // Send cookies with request
  });

  return next(clonedRequest);
};
