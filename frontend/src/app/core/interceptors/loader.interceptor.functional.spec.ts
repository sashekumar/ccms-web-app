import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { loaderInterceptor } from './loader.interceptor.functional';
import { LoaderService } from '../services/loader.service';

describe('loaderInterceptor (Functional)', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let loaderServiceMock: any;

  beforeEach(() => {
    loaderServiceMock = {
      show: vi.fn(),
      hide: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LoaderService, useValue: loaderServiceMock },
        provideHttpClient(withInterceptors([loaderInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Loader Show/Hide', () => {
    it('should show loader when request starts', () => {
      httpClient.get('/api/test').subscribe();

      expect(loaderServiceMock.show).toHaveBeenCalled();

      const req = httpMock.expectOne('/api/test');
      req.flush({ data: 'test' });
    });

    it('should hide loader when request completes successfully', () => {
      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      req.flush({ data: 'test' });
      
      expect(loaderServiceMock.show).toHaveBeenCalled();
      expect(loaderServiceMock.hide).toHaveBeenCalled();
    });

    it('should hide loader when request fails', () => {
      httpClient.get('/api/test').subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
      
      expect(loaderServiceMock.show).toHaveBeenCalled();
      expect(loaderServiceMock.hide).toHaveBeenCalled();
    });

    it('should hide loader on network error', () => {
      httpClient.get('/api/test').subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ProgressEvent('error'), { statusText: 'Network error' });
      
      expect(loaderServiceMock.show).toHaveBeenCalled();
      expect(loaderServiceMock.hide).toHaveBeenCalled();
    });
  });

  describe('Multiple Concurrent Requests', () => {
    it('should call show for each request', () => {
      httpClient.get('/api/test1').subscribe();
      httpClient.get('/api/test2').subscribe();
      httpClient.get('/api/test3').subscribe();

      expect(loaderServiceMock.show).toHaveBeenCalledTimes(3);

      const req1 = httpMock.expectOne('/api/test1');
      const req2 = httpMock.expectOne('/api/test2');
      const req3 = httpMock.expectOne('/api/test3');

      req1.flush({});
      req2.flush({});
      req3.flush({});
    });

    it('should call hide for each completed request', () => {
      httpClient.get('/api/test1').subscribe();
      httpClient.get('/api/test2').subscribe();
      httpClient.get('/api/test3').subscribe();

      const req1 = httpMock.expectOne('/api/test1');
      const req2 = httpMock.expectOne('/api/test2');
      const req3 = httpMock.expectOne('/api/test3');

      req1.flush({});
      req2.flush({});
      req3.flush({});
      
      expect(loaderServiceMock.hide).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure', () => {
      httpClient.get('/api/success').subscribe();
      httpClient.get('/api/error').subscribe({ 
        next: () => { throw new Error('Should have failed'); },
        error: () => {}
      });
      httpClient.get('/api/success2').subscribe();

      const req1 = httpMock.expectOne('/api/success');
      const req2 = httpMock.expectOne('/api/error');
      const req3 = httpMock.expectOne('/api/success2');

      req1.flush({ data: 'success' });
      req2.flush({}, { status: 500, statusText: 'Error' });
      req3.flush({ data: 'success' });
      
      expect(loaderServiceMock.show).toHaveBeenCalledTimes(3);
      expect(loaderServiceMock.hide).toHaveBeenCalledTimes(3);
    });
  });

  describe('Different HTTP Methods', () => {
    it('should handle GET requests', () => {
      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      req.flush({ data: 'test' });
      
      expect(loaderServiceMock.show).toHaveBeenCalled();
      expect(loaderServiceMock.hide).toHaveBeenCalled();
    });

    it('should handle POST requests', () => {
      httpClient.post('/api/test', { name: 'test' }).subscribe();

      const req = httpMock.expectOne('/api/test');
      req.flush({ success: true });
      
      expect(loaderServiceMock.show).toHaveBeenCalled();
      expect(loaderServiceMock.hide).toHaveBeenCalled();
    });

    it('should handle PUT requests', () => {
      httpClient.put('/api/test/1', { name: 'updated' }).subscribe();

      const req = httpMock.expectOne('/api/test/1');
      req.flush({ success: true });
      
      expect(loaderServiceMock.show).toHaveBeenCalled();
      expect(loaderServiceMock.hide).toHaveBeenCalled();
    });

    it('should handle DELETE requests', () => {
      httpClient.delete('/api/test/1').subscribe();

      const req = httpMock.expectOne('/api/test/1');
      req.flush({ success: true });
      
      expect(loaderServiceMock.show).toHaveBeenCalled();
      expect(loaderServiceMock.hide).toHaveBeenCalled();
    });

    it('should handle PATCH requests', () => {
      httpClient.patch('/api/test/1', { status: 'active' }).subscribe();

      const req = httpMock.expectOne('/api/test/1');
      req.flush({ success: true });
      
      expect(loaderServiceMock.show).toHaveBeenCalled();
      expect(loaderServiceMock.hide).toHaveBeenCalled();
    });
  });

  describe('Call Order', () => {
    it('should call show before hide', () => {
      const callOrder: string[] = [];

      loaderServiceMock.show.mockImplementation(() => {
        callOrder.push('show');
      });

      loaderServiceMock.hide.mockImplementation(() => {
        callOrder.push('hide');
      });

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      req.flush({ data: 'test' });
      
      expect(callOrder).toEqual(['show', 'hide']);
    });

    it('should call hide even if request is cancelled', () => {
      const subscription = httpClient.get('/api/test').subscribe();

      expect(loaderServiceMock.show).toHaveBeenCalled();

      const req = httpMock.expectOne('/api/test');
      
      subscription.unsubscribe();

      // finalize() should have been called after unsubscribe
      expect(loaderServiceMock.hide).toHaveBeenCalled();
    });
  });

  describe('Error Status Codes', () => {
    it('should hide loader on 401 Unauthorized', () => {
      httpClient.get('/api/protected').subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: () => {}
      });

      const req = httpMock.expectOne('/api/protected');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
      
      expect(loaderServiceMock.hide).toHaveBeenCalled();
    });

    it('should hide loader on 403 Forbidden', () => {
      httpClient.get('/api/forbidden').subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: () => {}
      });

      const req = httpMock.expectOne('/api/forbidden');
      req.flush({}, { status: 403, statusText: 'Forbidden' });
      
      expect(loaderServiceMock.hide).toHaveBeenCalled();
    });

    it('should hide loader on 404 Not Found', () => {
      httpClient.get('/api/notfound').subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: () => {}
      });

      const req = httpMock.expectOne('/api/notfound');
      req.flush({}, { status: 404, statusText: 'Not Found' });
      
      expect(loaderServiceMock.hide).toHaveBeenCalled();
    });

    it('should hide loader on 500 Internal Server Error', () => {
      httpClient.get('/api/error').subscribe({
        next: () => { throw new Error('Should have failed'); },
        error: () => {}
      });

      const req = httpMock.expectOne('/api/error');
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
      
      expect(loaderServiceMock.hide).toHaveBeenCalled();
    });
  });
});
