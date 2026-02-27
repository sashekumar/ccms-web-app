import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor.functional';
import { errorInterceptor } from './core/interceptors/error.interceptor.functional';
import { loaderInterceptor } from './core/interceptors/loader.interceptor.functional';
import { AuthService } from './core/services/auth.service';
import { firstValueFrom } from 'rxjs';

/**
 * Initialize authentication before app starts
 */
function initializeAuth() {
  const authService = inject(AuthService);
  return () => authService.initializeAuth();
}

/**
 * Application Configuration
 * Provides all app-wide services, interceptors, and configuration
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
        loaderInterceptor
      ])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      multi: true
    }
  ]
};
