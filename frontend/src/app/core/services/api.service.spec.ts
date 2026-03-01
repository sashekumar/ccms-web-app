import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('get()', () => {
    it('should make GET request with correct URL', () => {
      const mockResponse = { data: 'test' };
      const endpoint = 'users';

      service.get(endpoint).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);
    });

    it('should include query parameters', () => {
      const endpoint = 'users';
      const params = { page: 1, limit: 10, active: true };

      service.get(endpoint, params).subscribe();

      const req = httpMock.expectOne(
        (request) => request.url === `${apiUrl}/${endpoint}` && 
        request.params.get('page') === '1' &&
        request.params.get('limit') === '10' &&
        request.params.get('active') === 'true'
      );
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('should skip null and undefined parameters', () => {
      const endpoint = 'users';
      const params = { name: 'John', age: null as any, status: undefined as any };

      service.get(endpoint, params).subscribe();

      const req = httpMock.expectOne(
        (request) => request.url === `${apiUrl}/${endpoint}` && 
        request.params.get('name') === 'John' &&
        !request.params.has('age') &&
        !request.params.has('status')
      );
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('should include custom headers', () => {
      const endpoint = 'users';
      const headers = { 'X-Custom-Header': 'test-value', 'Authorization': 'Bearer token' };

      service.get(endpoint, undefined, headers).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/${endpoint}`);
      expect(req.request.headers.get('X-Custom-Header')).toBe('test-value');
      expect(req.request.headers.get('Authorization')).toBe('Bearer token');
      req.flush({});
    });
  });

  describe('post()', () => {
    it('should make POST request with body', () => {
      const endpoint = 'users';
      const body = { name: 'John', email: 'john@example.com' };
      const mockResponse = { id: 1, ...body };

      service.post(endpoint, body).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);
    });

    it('should include custom headers in POST request', () => {
      const endpoint = 'users';
      const body = { name: 'John' };
      const headers = { 'Content-Type': 'application/json', 'X-Custom': 'value' };

      service.post(endpoint, body, headers).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/${endpoint}`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('X-Custom')).toBe('value');
      req.flush({});
    });
  });

  describe('put()', () => {
    it('should make PUT request with body', () => {
      const endpoint = 'users/1';
      const body = { name: 'John Updated', email: 'john.updated@example.com' };
      const mockResponse = { success: true, data: body };

      service.put(endpoint, body).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);
    });
  });

  describe('delete()', () => {
    it('should make DELETE request', () => {
      const endpoint = 'users/1';
      const mockResponse = { success: true };

      service.delete(endpoint).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);
    });
  });

  describe('patch()', () => {
    it('should make PATCH request with body', () => {
      const endpoint = 'users/1';
      const body = { status: 'active' };
      const mockResponse = { success: true, data: body };

      service.patch(endpoint, body).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);
    });
  });

  describe('withCredentials', () => {
    it('should always include withCredentials in all requests', () => {
      // GET
      service.get('test1').subscribe();
      const req1 = httpMock.expectOne(`${apiUrl}/test1`);
      expect(req1.request.withCredentials).toBe(true);
      req1.flush({});

      // POST
      service.post('test2', {}).subscribe();
      const req2 = httpMock.expectOne(`${apiUrl}/test2`);
      expect(req2.request.withCredentials).toBe(true);
      req2.flush({});

      // PUT
      service.put('test3', {}).subscribe();
      const req3 = httpMock.expectOne(`${apiUrl}/test3`);
      expect(req3.request.withCredentials).toBe(true);
      req3.flush({});

      // DELETE
      service.delete('test4').subscribe();
      const req4 = httpMock.expectOne(`${apiUrl}/test4`);
      expect(req4.request.withCredentials).toBe(true);
      req4.flush({});

      // PATCH
      service.patch('test5', {}).subscribe();
      const req5 = httpMock.expectOne(`${apiUrl}/test5`);
      expect(req5.request.withCredentials).toBe(true);
      req5.flush({});
    });
  });
});
