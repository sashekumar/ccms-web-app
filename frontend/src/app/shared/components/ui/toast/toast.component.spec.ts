import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { ToastComponent } from './toast.component';
import { ToastService, Toast } from '../../../../core/services/toast.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let compiled: HTMLElement;
  let toastServiceMock: {
    toasts$: BehaviorSubject<Toast[]>;
    remove: ReturnType<typeof vi.fn>;
  };

  const createMockToast = (
    id: number,
    type: Toast['type'],
    message: string
  ): Toast => ({
    id,
    type,
    message,
    duration: 3000
  });

  beforeEach(async () => {
    toastServiceMock = {
      toasts$: new BehaviorSubject<Toast[]>([]),
      remove: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [
        { provide: ToastService, useValue: toastServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    // Don't call detectChanges() here - let each test control when to detect changes
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty toasts array', () => {
      expect(component.toasts).toEqual([]);
    });

    it('should have toast container with correct classes', () => {
      fixture.detectChanges();
      const container = compiled.querySelector('div.fixed');
      expect(container).toBeTruthy();
      expect(container?.classList.contains('top-4')).toBe(true);
      expect(container?.classList.contains('right-4')).toBe(true);
      expect(container?.classList.contains('z-50')).toBe(true);
    });
  });

  describe('Toast Service Subscription', () => {
    it('should subscribe to toast service on init', () => {
      const mockToasts: Toast[] = [
        createMockToast(1, 'success', 'Success message')
      ];

      fixture.detectChanges(); // Trigger ngOnInit
      toastServiceMock.toasts$.next(mockToasts);

      expect(component.toasts).toEqual(mockToasts);
    });

    it('should update toasts when service emits new values', () => {
      fixture.detectChanges(); // Trigger ngOnInit
      
      const firstToasts: Toast[] = [
        createMockToast(1, 'success', 'First')
      ];
      toastServiceMock.toasts$.next(firstToasts);
      expect(component.toasts.length).toBe(1);

      const secondToasts: Toast[] = [
        createMockToast(1, 'success', 'First'),
        createMockToast(2, 'error', 'Second')
      ];
      toastServiceMock.toasts$.next(secondToasts);
      expect(component.toasts.length).toBe(2);
    });

    it('should handle empty toast array from service', () => {
      fixture.detectChanges(); // Trigger ngOnInit
      
      toastServiceMock.toasts$.next([
        createMockToast(1, 'info', 'Test')
      ]);
      expect(component.toasts.length).toBe(1);

      toastServiceMock.toasts$.next([]);
      expect(component.toasts.length).toBe(0);
    });
  });

  describe('Toast Rendering', () => {
    it('should not render any toasts when array is empty', () => {
      toastServiceMock.toasts$.next([]);
      fixture.detectChanges();

      const toastElements = compiled.querySelectorAll('.rounded-lg');
      expect(toastElements.length).toBe(0);
    });

    it('should render single toast', () => {
      toastServiceMock.toasts$.next([
        createMockToast(1, 'success', 'Success!')
      ]);
      fixture.detectChanges();

      const toastElements = compiled.querySelectorAll('.rounded-lg');
      expect(toastElements.length).toBe(1);
    });

    it('should render multiple toasts', () => {
      toastServiceMock.toasts$.next([
        createMockToast(1, 'success', 'First'),
        createMockToast(2, 'error', 'Second'),
        createMockToast(3, 'warning', 'Third')
      ]);
      fixture.detectChanges();

      const toastElements = compiled.querySelectorAll('.rounded-lg');
      expect(toastElements.length).toBe(3);
    });

    it('should display toast message correctly', () => {
      const message = 'Test notification message';
      toastServiceMock.toasts$.next([
        createMockToast(1, 'info', message)
      ]);
      fixture.detectChanges();

      const messageDiv = compiled.querySelector('.flex-1');
      expect(messageDiv?.textContent?.trim()).toBe(message);
    });
  });

  describe('Toast Types - Success', () => {
    it('should display success icon', () => {
      toastServiceMock.toasts$.next([createMockToast(1, 'success', 'Success!')]);
      fixture.detectChanges();
      
      const icons = compiled.querySelectorAll('svg');
      // First icon in template is success, find it
      const successIcon = Array.from(icons).find(icon => 
        icon.querySelector('path[fill-rule="evenodd"]')?.getAttribute('d')?.includes('10 18a8 8 0 100-16')
      );
      expect(successIcon).toBeTruthy();
    });

    it('should apply success border class', () => {
      toastServiceMock.toasts$.next([createMockToast(1, 'success', 'Success!')]);
      fixture.detectChanges();
      
      const toast = compiled.querySelector('.rounded-lg');
      expect(toast?.classList.contains('border-green-400')).toBe(true);
    });

    it('should apply success text class', () => {
      toastServiceMock.toasts$.next([createMockToast(1, 'success', 'Success!')]);
      fixture.detectChanges();
      
      const messageDiv = compiled.querySelector('.flex-1');
      expect(messageDiv?.classList.contains('text-green-800')).toBe(true);
    });

    it('getToastClass should return success classes', () => {
      expect(component.getToastClass('success')).toBe('bg-white border-l-4 border-green-400');
    });

    it('getTextClass should return success text class', () => {
      expect(component.getTextClass('success')).toBe('text-green-800');
    });
  });

  describe('Toast Types - Error', () => {
    it('should display error icon', () => {
      toastServiceMock.toasts$.next([createMockToast(1, 'error', 'Error occurred')]);
      fixture.detectChanges();
      
      const icons = compiled.querySelectorAll('svg');
      const errorIcon = Array.from(icons).find(icon => 
        icon.querySelector('path[fill-rule="evenodd"]')?.getAttribute('d')?.includes('8.707 7.293a1 1 0 00-1.414 1.414')
      );
      expect(errorIcon).toBeTruthy();
    });

    it('should apply error border class', () => {
      toastServiceMock.toasts$.next([createMockToast(1, 'error', 'Error occurred')]);
      fixture.detectChanges();
      
      const toast = compiled.querySelector('.rounded-lg');
      expect(toast?.classList.contains('border-red-400')).toBe(true);
    });

    it('should apply error text class', () => {
      toastServiceMock.toasts$.next([createMockToast(1, 'error', 'Error occurred')]);
      fixture.detectChanges();
      
      const messageDiv = compiled.querySelector('.flex-1');
      expect(messageDiv?.classList.contains('text-red-800')).toBe(true);
    });

    it('getToastClass should return error classes', () => {
      expect(component.getToastClass('error')).toBe('bg-white border-l-4 border-red-400');
    });

    it('getTextClass should return error text class', () => {
      expect(component.getTextClass('error')).toBe('text-red-800');
    });
  });

  describe('Toast Types - Warning', () => {
    it('should display warning icon', () => {
      toastServiceMock.toasts$.next([createMockToast(1, 'warning', 'Warning message')]);
      fixture.detectChanges();
      
      const icons = compiled.querySelectorAll('svg');
      const warningIcon = Array.from(icons).find(icon => 
        icon.querySelector('path[fill-rule="evenodd"]')?.getAttribute('d')?.includes('8.257 3.099c.765-1.36')
      );
      expect(warningIcon).toBeTruthy();
    });

    it('should apply warning border class', () => {
      toastServiceMock.toasts$.next([createMockToast(1, 'warning', 'Warning message')]);
      fixture.detectChanges();
      
      const toast = compiled.querySelector('.rounded-lg');
      expect(toast?.classList.contains('border-yellow-400')).toBe(true);
    });

    it('should apply warning text class', () => {
      toastServiceMock.toasts$.next([createMockToast(1, 'warning', 'Warning message')]);
      fixture.detectChanges();
      
      const messageDiv = compiled.querySelector('.flex-1');
      expect(messageDiv?.classList.contains('text-yellow-800')).toBe(true);
    });

    it('getToastClass should return warning classes', () => {
      expect(component.getToastClass('warning')).toBe('bg-white border-l-4 border-yellow-400');
    });

    it('getTextClass should return warning text class', () => {
      expect(component.getTextClass('warning')).toBe('text-yellow-800');
    });
  });

  describe('Toast Types - Info', () => {
    it('should display info icon', () => {
      toastServiceMock.toasts$.next([createMockToast(1, 'info', 'Info message')]);
      fixture.detectChanges();
      
      const icons = compiled.querySelectorAll('svg');
      const infoIcon = Array.from(icons).find(icon => 
        icon.querySelector('path[fill-rule="evenodd"]')?.getAttribute('d')?.includes('18 10a8 8 0 11-16 0')
      );
      expect(infoIcon).toBeTruthy();
    });

    it('should apply info border class', () => {
      toastServiceMock.toasts$.next([createMockToast(1, 'info', 'Info message')]);
      fixture.detectChanges();
      
      const toast = compiled.querySelector('.rounded-lg');
      expect(toast?.classList.contains('border-blue-400')).toBe(true);
    });

    it('should apply info text class', () => {
      toastServiceMock.toasts$.next([createMockToast(1, 'info', 'Info message')]);
      fixture.detectChanges();
      
      const messageDiv = compiled.querySelector('.flex-1');
      expect(messageDiv?.classList.contains('text-blue-800')).toBe(true);
    });

    it('getToastClass should return info classes', () => {
      expect(component.getToastClass('info')).toBe('bg-white border-l-4 border-blue-400');
    });

    it('getTextClass should return info text class', () => {
      expect(component.getTextClass('info')).toBe('text-blue-800');
    });
  });

  describe('Close Functionality', () => {
    it('should call toastService.remove when close button clicked', () => {
      const toastId = 42;
      toastServiceMock.toasts$.next([
        createMockToast(toastId, 'info', 'Test')
      ]);
      fixture.detectChanges();

      const closeButton = compiled.querySelector('button');
      closeButton?.click();

      expect(toastServiceMock.remove).toHaveBeenCalledWith(toastId);
    });

    it('should display close button with correct icon', () => {
      toastServiceMock.toasts$.next([
        createMockToast(1, 'success', 'Test')
      ]);
      fixture.detectChanges();

      const closeButton = compiled.querySelector('button');
      expect(closeButton).toBeTruthy();
      
      const closeIcon = closeButton?.querySelector('svg');
      expect(closeIcon).toBeTruthy();
      expect(closeIcon?.classList.contains('h-5')).toBe(true);
      expect(closeIcon?.classList.contains('w-5')).toBe(true);
    });

    it('should call onClose method with correct ID', () => {
      const spy = vi.spyOn(component, 'onClose');
      const toastId = 123;
      
      toastServiceMock.toasts$.next([
        createMockToast(toastId, 'warning', 'Test')
      ]);
      fixture.detectChanges();

      const closeButton = compiled.querySelector('button');
      closeButton?.click();

      expect(spy).toHaveBeenCalledWith(toastId);
    });

    it('should handle close for multiple toasts independently', () => {
      toastServiceMock.toasts$.next([
        createMockToast(1, 'success', 'First'),
        createMockToast(2, 'error', 'Second')
      ]);
      fixture.detectChanges();

      const closeButtons = compiled.querySelectorAll('button');
      expect(closeButtons.length).toBe(2);

      closeButtons[0]?.click();
      expect(toastServiceMock.remove).toHaveBeenCalledWith(1);

      closeButtons[1]?.click();
      expect(toastServiceMock.remove).toHaveBeenCalledWith(2);
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call ngOnInit', () => {
      const spy = vi.spyOn(component, 'ngOnInit');
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should unsubscribe on destroy', () => {
      const destroySpy = vi.spyOn(component['destroy$'], 'next');
      const completeSpy = vi.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should not receive toast updates after destroy', () => {
      component.ngOnDestroy();

      toastServiceMock.toasts$.next([
        createMockToast(1, 'info', 'After destroy')
      ]);

      // Component should not update after destroy
      // The last value before destroy should remain
      expect(component.toasts.length).toBe(0);
    });
  });

  describe('Animation Classes', () => {
    it('should have animate-slide-in class on toast elements', () => {
      toastServiceMock.toasts$.next([
        createMockToast(1, 'success', 'Animated')
      ]);
      fixture.detectChanges();

      const toast = compiled.querySelector('.rounded-lg');
      expect(toast?.classList.contains('animate-slide-in')).toBe(true);
    });

    it('should apply animation to all toasts', () => {
      toastServiceMock.toasts$.next([
        createMockToast(1, 'success', 'First'),
        createMockToast(2, 'error', 'Second'),
        createMockToast(3, 'info', 'Third')
      ]);
      fixture.detectChanges();

      const toasts = compiled.querySelectorAll('.rounded-lg');
      toasts.forEach(toast => {
        expect(toast.classList.contains('animate-slide-in')).toBe(true);
      });
    });
  });

  describe('Toast Structure', () => {
    it('should have correct base classes', () => {
      toastServiceMock.toasts$.next([
        createMockToast(1, 'success', 'Structured toast')
      ]);
      fixture.detectChanges();
      
      const toast = compiled.querySelector('.rounded-lg');
      expect(toast?.classList.contains('shadow-lg')).toBe(true);
      expect(toast?.classList.contains('p-4')).toBe(true);
      expect(toast?.classList.contains('flex')).toBe(true);
      expect(toast?.classList.contains('items-start')).toBe(true);
      expect(toast?.classList.contains('gap-3')).toBe(true);
    });

    it('should have icon container with flex-shrink-0', () => {
      toastServiceMock.toasts$.next([
        createMockToast(1, 'success', 'Structured toast')
      ]);
      fixture.detectChanges();
      
      const iconContainer = compiled.querySelector('.flex-shrink-0');
      expect(iconContainer).toBeTruthy();
    });

    it('should have message container with flex-1', () => {
      toastServiceMock.toasts$.next([
        createMockToast(1, 'success', 'Structured toast')
      ]);
      fixture.detectChanges();
      
      const messageContainer = compiled.querySelector('.flex-1');
      expect(messageContainer).toBeTruthy();
      expect(messageContainer?.classList.contains('text-sm')).toBe(true);
      expect(messageContainer?.classList.contains('font-medium')).toBe(true);
    });

    it('should have close button with hover styles', () => {
      toastServiceMock.toasts$.next([
        createMockToast(1, 'success', 'Structured toast')
      ]);
      fixture.detectChanges();
      
      const closeButton = compiled.querySelector('button');
      expect(closeButton?.classList.contains('flex-shrink-0')).toBe(true);
      expect(closeButton?.classList.contains('inline-flex')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle toast with empty message', () => {
      toastServiceMock.toasts$.next([
        createMockToast(1, 'info', '')
      ]);
      fixture.detectChanges();

      const messageDiv = compiled.querySelector('.flex-1');
      expect(messageDiv?.textContent?.trim()).toBe('');
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(500);
      toastServiceMock.toasts$.next([
        createMockToast(1, 'error', longMessage)
      ]);
      fixture.detectChanges();

      const messageDiv = compiled.querySelector('.flex-1');
      expect(messageDiv?.textContent?.trim()).toBe(longMessage);
    });

    it('should handle toast with special characters in message', () => {
      const specialMessage = '<script>alert("xss")</script> & " \' >';
      toastServiceMock.toasts$.next([
        createMockToast(1, 'warning', specialMessage)
      ]);
      fixture.detectChanges();

      const messageDiv = compiled.querySelector('.flex-1');
      // Angular should sanitize this
      expect(messageDiv?.textContent?.trim()).toBe(specialMessage);
    });

    it('should handle rapid toast updates', () => {
      toastServiceMock.toasts$.next([]);
      fixture.detectChanges();
      for (let i = 0; i < 10; i++) {
        toastServiceMock.toasts$.next([
          createMockToast(i, 'info', `Toast ${i}`)
        ]);
      }

      expect(component.toasts.length).toBe(1);
      expect(component.toasts[0].message).toBe('Toast 9');
    });
  });

  describe('Default Type Handling', () => {
    it('getToastClass should handle invalid type gracefully', () => {
      // @ts-ignore - Testing runtime behavior
      const result = component.getToastClass('invalid' as any);
      expect(result).toBe('bg-white border-l-4');
    });

    it('getTextClass should handle invalid type gracefully', () => {
      // @ts-ignore - Testing runtime behavior
      const result = component.getTextClass('invalid' as any);
      expect(result).toBe('text-gray-800');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete toast lifecycle', () => {
      // Emit toasts before detectChanges so ngOnInit subscription has data ready
      toastServiceMock.toasts$.next([
        createMockToast(1, 'success', 'Operation completed'),
        createMockToast(2, 'info', 'Processing...')
      ]);
      fixture.detectChanges();
      
      let toastElements = compiled.querySelectorAll('.rounded-lg');
      expect(toastElements.length).toBe(2);

      // Remove first toast
      const closeButton = compiled.querySelector('button');
      closeButton?.click();
      expect(toastServiceMock.remove).toHaveBeenCalledWith(1);

      // Simulate service removing the toast
      toastServiceMock.toasts$.next([
        createMockToast(2, 'info', 'Processing...')
      ]);
      fixture.detectChanges();
      
      toastElements = compiled.querySelectorAll('.rounded-lg');
      expect(toastElements.length).toBe(1);
    });

    it('should display all toast types simultaneously', () => {
      toastServiceMock.toasts$.next([
        createMockToast(1, 'success', 'Success!'),
        createMockToast(2, 'error', 'Error!'),
        createMockToast(3, 'warning', 'Warning!'),
        createMockToast(4, 'info', 'Info!')
      ]);
      fixture.detectChanges();

      const toastElements = compiled.querySelectorAll('.rounded-lg');
      expect(toastElements.length).toBe(4);

      // Verify each has correct styling
      expect(toastElements[0].classList.contains('border-green-400')).toBe(true);
      expect(toastElements[1].classList.contains('border-red-400')).toBe(true);
      expect(toastElements[2].classList.contains('border-yellow-400')).toBe(true);
      expect(toastElements[3].classList.contains('border-blue-400')).toBe(true);
    });
  });
});
