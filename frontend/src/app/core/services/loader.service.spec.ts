import { TestBed } from '@angular/core/testing';
import { LoaderService } from './loader.service';
import { take } from 'rxjs/operators';

describe('LoaderService', () => {
  let service: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoaderService]
    });
    service = TestBed.inject(LoaderService);
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with loading state false', () => {
      service.loading$.pipe(take(1)).subscribe(loading => {
        expect(loading).toBe(false);
      });
    });

    it('should initialize isLoading() as false', () => {
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('show()', () => {
    it('should set loading state to true', () => {
      service.show();

      service.loading$.pipe(take(1)).subscribe(loading => {
        expect(loading).toBe(true);
      });
    });

    it('should set isLoading() to true', () => {
      service.show();
      expect(service.isLoading()).toBe(true);
    });

    it('should increment request count', () => {
      service.show();
      service.show();
      service.show();
      
      // All requests still loading
      expect(service.isLoading()).toBe(true);
    });
  });

  describe('hide()', () => {
    it('should set loading state to false when all requests complete', () => {
      service.show();
      service.hide();

      service.loading$.pipe(take(1)).subscribe(loading => {
        expect(loading).toBe(false);
      });
    });

    it('should maintain loading state when other requests pending', () => {
      service.show();
      service.show();
      service.show();
      
      service.hide();
      
      // Still 2 requests pending
      expect(service.isLoading()).toBe(true);
      
      service.hide();
      
      // Still 1 request pending
      expect(service.isLoading()).toBe(true);
      
      service.hide();
      
      // All requests complete
      expect(service.isLoading()).toBe(false);
    });

    it('should not go below zero request count', () => {
      // Call hide without show
      service.hide();
      service.hide();
      service.hide();

      expect(service.isLoading()).toBe(false);
    });

    it('should reset to false after negative count', () => {
      service.hide(); // Count would be -1, but resets to 0
      service.show(); // Count becomes 1
      service.hide(); // Count back to 0

      expect(service.isLoading()).toBe(false);
    });
  });

  describe('Request Counting', () => {
    it('should handle concurrent requests correctly', () => {
      // Simulate 5 concurrent requests
      service.show(); // Count: 1
      service.show(); // Count: 2
      service.show(); // Count: 3
      service.show(); // Count: 4
      service.show(); // Count: 5

      expect(service.isLoading()).toBe(true);

      // Complete 3 requests
      service.hide(); // Count: 4
      service.hide(); // Count: 3
      service.hide(); // Count: 2
      
      expect(service.isLoading()).toBe(true);

      // Complete remaining requests
      service.hide(); // Count: 1
      expect(service.isLoading()).toBe(true);
      
      service.hide(); // Count: 0
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('loading$ Observable', () => {
    it('should emit loading state changes', () => {
      const states: boolean[] = [];
      
      const subscription = service.loading$.subscribe(state => {
        states.push(state);
      });

      service.show();
      service.hide();
      
      expect(states.length).toBeGreaterThanOrEqual(3);
      expect(states[0]).toBe(false); // Initial
      expect(states[1]).toBe(true);  // After show
      expect(states[2]).toBe(false); // After hide
      
      subscription.unsubscribe();
    });

    it('should allow multiple subscribers', () => {
      let subscriber1State = false;
      let subscriber2State = false;

      service.loading$.subscribe(state => {
        subscriber1State = state;
      });

      service.loading$.subscribe(state => {
        subscriber2State = state;
      });

      service.show();

      expect(subscriber1State).toBe(true);
      expect(subscriber2State).toBe(true);

      service.hide();

      expect(subscriber1State).toBe(false);
      expect(subscriber2State).toBe(false);
    });
  });
});
