import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let routerMock: any;
  let authServiceMock: any;
  let interceptor: AuthInterceptor;

  beforeEach(() => {
    routerMock = {
      navigate: vi.fn()
    };

    authServiceMock = {
      isAuthenticated: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    interceptor = TestBed.inject(AuthInterceptor);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(interceptor).toBeTruthy();
    });
  });

  describe('withCredentials', () => {
    it('should add withCredentials to all requests', () => {
      httpClient.get('/test').subscribe();

      const req = httpMock.expectOne('/test');
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });

    it('should add withCredentials to POST requests', () => {
      httpClient.post('/test', { data: 'test' }).subscribe();

      const req = httpMock.expectOne('/test');
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });

    it('should add withCredentials to PUT requests', () => {
      httpClient.put('/test', { data: 'test' }).subscribe();

      const req = httpMock.expectOne('/test');
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });

    it('should add withCredentials to DELETE requests', () => {
      httpClient.delete('/test').subscribe();

      const req = httpMock.expectOne('/test');
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });
  });

  describe('401 Unauthorized Handling', () => {
    it('should redirect to login on 401 error', () => {
      const sessionStorageSpy = vi.spyOn(Storage.prototype, 'removeItem');

      httpClient.get('/api/protected').subscribe({
        next: () => { throw new Error('Should have failed with 401'); },
        error: (error: any) => {
          expect(error.status).toBe(401);
          expect(sessionStorageSpy).toHaveBeenCalledWith('currentUser');
          expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
        }
      });

      const req = httpMock.expectOne('/api/protected');
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should remove currentUser from sessionStorage on 401', () => {
      const sessionStorageSpy = vi.spyOn(Storage.prototype, 'removeItem');
      sessionStorage.setItem('currentUser', JSON.stringify({ id: 1, username: 'test' }));

      httpClient.get('/api/protected').subscribe({
        error: () => {
          expect(sessionStorageSpy).toHaveBeenCalledWith('currentUser');
        }
      });

      const req = httpMock.expectOne('/api/protected');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle multiple 401 errors', () => {
      const sessionStorageSpy = vi.spyOn(Storage.prototype, 'removeItem');

      // First request
      httpClient.get('/api/test1').subscribe({
        error: () => {}
      });

      // Second request
      httpClient.get('/api/test2').subscribe({
        error: () => {}
      });

      const req1 = httpMock.expectOne('/api/test1');
      req1.flush({}, { status: 401, statusText: 'Unauthorized' });

      const req2 = httpMock.expectOne('/api/test2');
      req2.flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(sessionStorageSpy).toHaveBeenCalledTimes(2);
      expect(routerMock.navigate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Non-401 Error Handling', () => {
    it('should pass through 403 errors without redirecting', () => {
      httpClient.get('/api/forbidden').subscribe({
        next: () => { throw new Error('Should have failed with 403'); },
        error: (error: any) => {
          expect(error.status).toBe(403);
          expect(routerMock.navigate).not.toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/api/forbidden');
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should pass through 404 errors without redirecting', () => {
      httpClient.get('/api/notfound').subscribe({
        next: () => { throw new Error('Should have failed with 404'); },
        error: (error: any) => {
          expect(error.status).toBe(404);
          expect(routerMock.navigate).not.toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/api/notfound');
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    it('should pass through 500 errors without redirecting', () => {
      httpClient.get('/api/error').subscribe({
        next: () => { throw new Error('Should have failed with 500'); },
        error: (error: any) => {
          expect(error.status).toBe(500);
          expect(routerMock.navigate).not.toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/api/error');
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Successful Requests', () => {
    it('should pass through successful GET requests', () => {
      const mockData = { id: 1, name: 'Test' };

      httpClient.get('/api/data').subscribe(data => {
        expect(data).toEqual(mockData);
        expect(routerMock.navigate).not.toHaveBeenCalled();
      });

      const req = httpMock.expectOne('/api/data');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockData);
    });

    it('should pass through successful POST requests', () => {
      const mockResponse = { success: true, id: 1 };

      httpClient.post('/api/create', { name: 'Test' }).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(routerMock.navigate).not.toHaveBeenCalled();
      });

      const req = httpMock.expectOne('/api/create');
      req.flush(mockResponse);
    });
  });

  describe('Request Cloning', () => {
    it('should not mutate original request', () => {
      const originalUrl = '/api/test';
      
      httpClient.get(originalUrl).subscribe();

      const req = httpMock.expectOne(originalUrl);
      expect(req.request.url).toBe(originalUrl);
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });

    it('should preserve request headers', () => {
      httpClient.get('/api/test', {
        headers: { 'X-Custom-Header': 'test-value' }
      }).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('X-Custom-Header')).toBe('test-value');
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });

    it('should preserve request body', () => {
      const body = { name: 'Test', value: 123 };

      httpClient.post('/api/test', body).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.body).toEqual(body);
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });
  });
});
