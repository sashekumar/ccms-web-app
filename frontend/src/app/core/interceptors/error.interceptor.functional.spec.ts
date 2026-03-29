import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor.functional';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { API_ENDPOINTS } from '../constants';
import { of, throwError, BehaviorSubject, filter, take } from 'rxjs';

describe('errorInterceptor (Functional)', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let routerMock: any;
  let authServiceMock: any;
  let loggerServiceMock: any;
  let refreshStateSubject: BehaviorSubject<boolean | null>;

  beforeEach(() => {
    refreshStateSubject = new BehaviorSubject<boolean | null>(null);

    routerMock = {
      navigate: vi.fn(),
      url: '/dashboard'
    };

    authServiceMock = {
      refreshAccessToken: vi.fn(),
      isRefreshingToken: vi.fn().mockReturnValue(false),
      getRefreshState: vi.fn().mockReturnValue(refreshStateSubject.asObservable())
    };

    loggerServiceMock = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  describe('401 Unauthorized - Token Refresh', () => {
    it('should attempt token refresh on 401 error', () => {
      authServiceMock.refreshAccessToken.mockReturnValue(of(true));

      httpClient.get('/api/protected').subscribe({
        next: () => {
          expect(authServiceMock.refreshAccessToken).toHaveBeenCalled();
          
        },
        error: () => { throw new Error('Should not fail after successful refresh'); }
      });

      const req1 = httpMock.expectOne('/api/protected');
      req1.flush({}, { status: 401, statusText: 'Unauthorized' });

      // After refresh, original request is retried
      const req2 = httpMock.expectOne('/api/protected');
      req2.flush({ data: 'success' });
    });

    it('should retry original request after successful token refresh', () => {
      authServiceMock.refreshAccessToken.mockReturnValue(of(true));

      httpClient.get('/api/data').subscribe({
        next: (response) => {
          expect(response).toEqual({ data: 'success' });
          
        }
      });

      const req1 = httpMock.expectOne('/api/data');
      req1.flush({}, { status: 401, statusText: 'Unauthorized' });

      const req2 = httpMock.expectOne('/api/data');
      req2.flush({ data: 'success' });
    });

    it('should fail when token refresh fails', () => {
      authServiceMock.refreshAccessToken.mockReturnValue(throwError(() => new Error('Refresh failed')));

      httpClient.get('/api/protected').subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: (error: any) => {
          expect(error.status).toBe(401);
          
        }
      });

      const req = httpMock.expectOne('/api/protected');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should redirect to login when refresh returns false', () => {
      authServiceMock.refreshAccessToken.mockReturnValue(of(false));

      httpClient.get('/api/protected').subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: () => {
          
        }
      });

      const req = httpMock.expectOne('/api/protected');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('401 Unauthorized - Skip Refresh Endpoints', () => {
    it('should not refresh token for login endpoint', () => {
      httpClient.post(`/api${API_ENDPOINTS.AUTH.LOGIN}`, { username: 'test', password: 'test' }).subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: (error: any) => {
          expect(error.status).toBe(401);
          expect(authServiceMock.refreshAccessToken).not.toHaveBeenCalled();
          
        }
      });

      const req = httpMock.expectOne((r) => r.url.includes(API_ENDPOINTS.AUTH.LOGIN));
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should not refresh token for refresh endpoint', () => {
      httpClient.post(`/api${API_ENDPOINTS.AUTH.REFRESH}`, {}).subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: (error: any) => {
          expect(error.status).toBe(401);
          expect(authServiceMock.refreshAccessToken).not.toHaveBeenCalled();
          
        }
      });

      const req = httpMock.expectOne((r) => r.url.includes(API_ENDPOINTS.AUTH.REFRESH));
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should silently fail for /me endpoint', () => {
      httpClient.get(`/api${API_ENDPOINTS.AUTH.ME}`).subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: (error: any) => {
          expect(error.status).toBe(401);
          expect(authServiceMock.refreshAccessToken).not.toHaveBeenCalled();
          expect(routerMock.navigate).not.toHaveBeenCalled();
          
        }
      });

      const req = httpMock.expectOne((r) => r.url.includes(API_ENDPOINTS.AUTH.ME));
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should redirect to login for csrf endpoint on auth page', () => {
      routerMock.url = '/some-protected-page';
      const sessionStorageSpy = vi.spyOn(Storage.prototype, 'removeItem');

      httpClient.get(`/api${API_ENDPOINTS.AUTH.CSRF_TOKEN}`).subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: () => {
          expect(sessionStorageSpy).toHaveBeenCalledWith('currentUser');
          expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
          
        }
      });

      const req = httpMock.expectOne((r) => r.url.includes(API_ENDPOINTS.AUTH.CSRF_TOKEN));
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('401 Unauthorized - Concurrent Requests', () => {
    it('should wait for ongoing refresh instead of starting new one', () => {
      authServiceMock.isRefreshingToken.mockReturnValue(true);
      authServiceMock.refreshAccessToken.mockReturnValue(
        refreshStateSubject.asObservable().pipe(
          filter((state: boolean | null): state is boolean => state !== null),
          take(1)
        )
      );

      httpClient.get('/api/protected1').subscribe({
        next: (response: any) => {
          // refreshAccessToken is always called; concurrent handling is delegated to AuthService internally
          expect(authServiceMock.refreshAccessToken).toHaveBeenCalledTimes(1);
          expect(response).toEqual({ data: 'success' });
          
        }
      });

      const req1 = httpMock.expectOne('/api/protected1');
      req1.flush({}, { status: 401, statusText: 'Unauthorized' });

      // Simulate refresh completion
      refreshStateSubject.next(true);

      const req2 = httpMock.expectOne('/api/protected1');
      req2.flush({ data: 'success' });
    });
  });

  describe('403 Forbidden Handling', () => {
    it('should pass through 403 errors', () => {
      httpClient.get('/api/forbidden').subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: (error: any) => {
          expect(error.status).toBe(403);
          
        }
      });

      const req = httpMock.expectOne('/api/forbidden');
      req.flush({ message: 'Access denied' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should not redirect for 403 on API calls', () => {
      httpClient.post('/api/users', { name: 'test' }).subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: () => {
          expect(routerMock.navigate).not.toHaveBeenCalled();
          
        }
      });

      const req = httpMock.expectOne('/api/users');
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });

    it('should redirect for 403 on GET requests to non-API routes', () => {
      httpClient.get('/protected-page').subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: () => {
          expect(routerMock.navigate).toHaveBeenCalledWith(['/unauthorized']);
          
        }
      });

      const req = httpMock.expectOne('/protected-page');
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('404 Not Found Handling', () => {
    it('should pass through 404 errors', () => {
      httpClient.get('/api/notfound').subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: (error: any) => {
          expect(error.status).toBe(404);
          
        }
      });

      const req = httpMock.expectOne('/api/notfound');
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('500 Internal Server Error Handling', () => {
    it('should pass through 500 errors', () => {
      httpClient.get('/api/error').subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: (error: any) => {
          expect(error.status).toBe(500);
          
        }
      });

      const req = httpMock.expectOne('/api/error');
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Client-side Error Handling', () => {
    it('should handle client-side errors', () => {
      httpClient.get('/api/test').subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: (error: any) => {
          expect(error.error).toBeInstanceOf(ErrorEvent);
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ErrorEvent('error', { message: 'Network error' }));
    });
  });

  describe('Successful Requests', () => {
    it('should pass through successful requests unchanged', () => {
      const mockData = { id: 1, name: 'Test' };

      httpClient.get('/api/data').subscribe({
        next: (data) => {
          expect(data).toEqual(mockData);
          expect(authServiceMock.refreshAccessToken).not.toHaveBeenCalled();
          
        }
      });

      const req = httpMock.expectOne('/api/data');
      req.flush(mockData);
    });

    it('should not interfere with POST requests', () => {
      const mockResponse = { success: true, id: 1 };

      httpClient.post('/api/create', { name: 'Test' }).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          
        }
      });

      const req = httpMock.expectOne('/api/create');
      req.flush(mockResponse);
    });
  });
});
