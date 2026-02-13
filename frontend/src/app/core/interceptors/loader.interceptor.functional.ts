import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

/**
 * Loader Interceptor (Functional) - Show/hide global loader during HTTP requests
 */
export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);

  // Show loader
  loaderService.show();

  return next(req).pipe(
    finalize(() => {
      // Hide loader when request completes (success or error)
      loaderService.hide();
    })
  );
};
