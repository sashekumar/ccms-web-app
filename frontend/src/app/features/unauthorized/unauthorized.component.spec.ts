import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { UnauthorizedComponent } from './unauthorized.component';

describe('UnauthorizedComponent', () => {
  let component: UnauthorizedComponent;
  let fixture: ComponentFixture<UnauthorizedComponent>;
  let routerMock: any;
  let windowSpy: any;

  beforeEach(async () => {
    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [UnauthorizedComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UnauthorizedComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be a standalone component', () => {
      const componentMetadata = (UnauthorizedComponent as any).ɵcmp;
      expect(componentMetadata.standalone).toBe(true);
    });
  });

  describe('goToDashboard()', () => {
    it('should navigate to dashboard', () => {
      component.goToDashboard();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should call navigate exactly once', () => {
      component.goToDashboard();

      expect(routerMock.navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('goBack() - Browser Platform', () => {
    beforeEach(() => {
      windowSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    });

    it('should call window.history.back() in browser', () => {
      component.goBack();

      expect(windowSpy).toHaveBeenCalled();
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate to dashboard when in browser', () => {
      component.goBack();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('goBack() - Server Platform (SSR)', () => {
    beforeEach(async () => {
      // Recreate component with server platform
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [UnauthorizedComponent],
        providers: [
          { provide: Router, useValue: routerMock },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(UnauthorizedComponent);
      component = fixture.componentInstance;
    });

    it('should navigate to dashboard in SSR mode', () => {
      component.goBack();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should not call window.history.back in SSR mode', () => {
      const windowSpy = vi.spyOn(window.history, 'back');
      component.goBack();

      expect(windowSpy).not.toHaveBeenCalled();
    });
  });

  describe('Template Rendering', () => {
    it('should display "Access Denied" title', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('h1');

      expect(title?.textContent).toContain('Access Denied');
    });

    it('should display permission message', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('p.text-lg');

      expect(message?.textContent).toContain("You don't have permission");
    });

    it('should have Go Back button', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');

      expect(buttons.length).toBeGreaterThanOrEqual(2);
      expect(buttons[0]?.textContent?.trim()).toContain('Go Back');
    });

    it('should have Go to Dashboard button', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');

      expect(buttons[1]?.textContent?.trim()).toContain('Go to Dashboard');
    });

    it('should display contact administrator message', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const infoBox = compiled.querySelector('.bg-blue-50');

      expect(infoBox?.textContent).toContain('Need Access?');
      expect(infoBox?.textContent).toContain('system administrator');
    });
  });

  describe('Button Click Handlers', () => {
    beforeEach(() => {
      windowSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    });

    it('should call goBack when Go Back button is clicked', () => {
      const goBackSpy = vi.spyOn(component, 'goBack');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const goBackButton = compiled.querySelectorAll('button')[0] as HTMLButtonElement;
      goBackButton.click();

      expect(goBackSpy).toHaveBeenCalled();
    });

    it('should call goToDashboard when Go to Dashboard button is clicked', () => {
      const goToDashboardSpy = vi.spyOn(component, 'goToDashboard');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const dashboardButton = compiled.querySelectorAll('button')[1] as HTMLButtonElement;
      dashboardButton.click();

      expect(goToDashboardSpy).toHaveBeenCalled();
    });
  });

  describe('SVG Icon', () => {
    it('should render SVG icon', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const svg = compiled.querySelector('svg');

      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    });

    it('should have red-themed icon container', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const iconContainer = compiled.querySelector('.bg-red-100');

      expect(iconContainer).toBeTruthy();
    });
  });
});
