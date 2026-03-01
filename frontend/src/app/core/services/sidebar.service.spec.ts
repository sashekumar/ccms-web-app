import { TestBed } from '@angular/core/testing';
import { SidebarService } from './sidebar.service';
import { take } from 'rxjs/operators';

describe('SidebarService', () => {
  let service: SidebarService;
  let originalInnerWidth: number;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Store original window width
    originalInnerWidth = window.innerWidth;

    // Mock localStorage
    localStorageMock = {};
    const localStorageGetItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    const localStorageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    
    localStorageGetItemSpy.mockImplementation((key: string) => {
      return localStorageMock[key] || null;
    });
    
    localStorageSetItemSpy.mockImplementation((key: string, value: string) => {
      localStorageMock[key] = value;
      return undefined;
    });

    TestBed.configureTestingModule({
      providers: [SidebarService]
    });
  });

  afterEach(() => {
    // Restore original window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
    
    vi.restoreAllMocks();
  });

  const setWindowWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width
    });
  };

  describe('Service Creation', () => {
    it('should be created', () => {
      service = TestBed.inject(SidebarService);
      expect(service).toBeTruthy();
    });
  });

  describe('Initial State - Desktop', () => {
    it('should start open on desktop (>= 1024px)', () => {
      setWindowWidth(1440);
      service = TestBed.inject(SidebarService);

      service.isSidebarOpen$.pipe(take(1)).subscribe(isOpen => {
        expect(isOpen).toBe(true);
      });
      expect(service.isOpen).toBe(true);
    });

    it('should start open on exactly 1024px', () => {
      setWindowWidth(1024);
      service = TestBed.inject(SidebarService);

      expect(service.isOpen).toBe(true);
    });
  });

  describe('Initial State - Mobile/Tablet', () => {
    it('should start closed on mobile (< 1024px) by default', () => {
      setWindowWidth(768);
      localStorageMock = {}; // No saved state
      service = TestBed.inject(SidebarService);

      expect(service.isOpen).toBe(false);
    });

    it('should respect saved state on mobile if available', () => {
      setWindowWidth(768);
      localStorageMock['sidebarOpen'] = 'true';
      service = TestBed.inject(SidebarService);

      expect(service.isOpen).toBe(true);
    });

    it('should respect saved closed state on mobile', () => {
      setWindowWidth(768);
      localStorageMock['sidebarOpen'] = 'false';
      service = TestBed.inject(SidebarService);

      expect(service.isOpen).toBe(false);
    });
  });

  describe('toggle()', () => {
    beforeEach(() => {
      setWindowWidth(1440);
      service = TestBed.inject(SidebarService);
    });

    it('should toggle from open to closed', () => {
      const initialState = service.isOpen;
      service.toggle();
      expect(service.isOpen).toBe(!initialState);
    });

    it('should toggle from closed to open', () => {
      service.close();
      expect(service.isOpen).toBe(false);
      
      service.toggle();
      expect(service.isOpen).toBe(true);
    });

    it('should emit state changes through observable', () => {
      const states: boolean[] = [];
      
      const subscription = service.isSidebarOpen$.subscribe(state => {
        states.push(state);
      });

      service.toggle();
      service.toggle();
      
      expect(states.length).toBeGreaterThanOrEqual(3);
      expect(states[0]).toBe(true);  // Initial
      expect(states[1]).toBe(false); // After first toggle
      expect(states[2]).toBe(true);  // After second toggle
      
      subscription.unsubscribe();
    });

    it('should save state to localStorage', () => {
      service.toggle();
      expect(localStorageMock['sidebarOpen']).toBe('false');
      
      service.toggle();
      expect(localStorageMock['sidebarOpen']).toBe('true');
    });
  });

  describe('open()', () => {
    beforeEach(() => {
      setWindowWidth(1440);
      service = TestBed.inject(SidebarService);
    });

    it('should open sidebar', () => {
      service.close();
      service.open();
      expect(service.isOpen).toBe(true);
    });

    it('should save true state to localStorage', () => {
      service.open();
      expect(localStorageMock['sidebarOpen']).toBe('true');
    });

    it('should emit true through observable', () => {
      service.close(); // Start closed
      
      service.isSidebarOpen$.pipe(take(1)).subscribe(isOpen => {
        expect(isOpen).toBe(false);
      });

      service.open();
      
      service.isSidebarOpen$.pipe(take(1)).subscribe(isOpen => {
        expect(isOpen).toBe(true);
      });
    });
  });

  describe('close()', () => {
    beforeEach(() => {
      setWindowWidth(1440);
      service = TestBed.inject(SidebarService);
    });

    it('should close sidebar', () => {
      service.open();
      service.close();
      expect(service.isOpen).toBe(false);
    });

    it('should save false state to localStorage', () => {
      service.close();
      expect(localStorageMock['sidebarOpen']).toBe('false');
    });

    it('should emit false through observable', () => {
      service.close();
      
      service.isSidebarOpen$.pipe(take(1)).subscribe(isOpen => {
        expect(isOpen).toBe(false);
      });
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      setWindowWidth(1440);
      service = TestBed.inject(SidebarService);
    });

    it('should auto-close when resizing to mobile', () => {
      service.open();
      expect(service.isOpen).toBe(true);

      // Simulate resize to mobile
      setWindowWidth(768);
      window.dispatchEvent(new Event('resize'));

      expect(service.isOpen).toBe(false);
    });

    it('should auto-open when resizing to desktop', () => {
      setWindowWidth(768);
      service = TestBed.inject(SidebarService);
      service.close();
      expect(service.isOpen).toBe(false);

      // Simulate resize to desktop
      setWindowWidth(1440);
      window.dispatchEvent(new Event('resize'));

      expect(service.isOpen).toBe(true);
    });

    it('should not auto-close on desktop resize', () => {
      setWindowWidth(1440);
      service.open();
      expect(service.isOpen).toBe(true);

      // Simulate resize within desktop range
      setWindowWidth(1920);
      window.dispatchEvent(new Event('resize'));

      expect(service.isOpen).toBe(true);
    });

    it('should not auto-open on mobile resize', () => {
      setWindowWidth(375);
      service = TestBed.inject(SidebarService);
      service.close();
      expect(service.isOpen).toBe(false);

      // Simulate resize within mobile range
      setWindowWidth(768);
      window.dispatchEvent(new Event('resize'));

      expect(service.isOpen).toBe(false);
    });
  });

  describe('isOpen Getter', () => {
    beforeEach(() => {
      setWindowWidth(1440);
      service = TestBed.inject(SidebarService);
    });

    it('should return current sidebar state', () => {
      expect(service.isOpen).toBe(true);
      
      service.close();
      expect(service.isOpen).toBe(false);
      
      service.open();
      expect(service.isOpen).toBe(true);
    });
  });

  describe('Observable Subscription', () => {
    beforeEach(() => {
      setWindowWidth(1440);
      service = TestBed.inject(SidebarService);
    });

    it('should allow multiple subscribers', () => {
      let subscriber1State = true;
      let subscriber2State = true;

      service.isSidebarOpen$.subscribe(state => {
        subscriber1State = state;
      });

      service.isSidebarOpen$.subscribe(state => {
        subscriber2State = state;
      });

      service.close();

      expect(subscriber1State).toBe(false);
      expect(subscriber2State).toBe(false);

      service.open();

      expect(subscriber1State).toBe(true);
      expect(subscriber2State).toBe(true);
    });
  });
});
