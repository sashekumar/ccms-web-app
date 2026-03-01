import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToastService, Toast } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let currentToasts: Toast[];

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    currentToasts = [];
    
    // Subscribe to track current state
    service.toasts$.subscribe(toasts => {
      currentToasts = toasts;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty toasts array', () => {
      expect(currentToasts).toEqual([]);
    });

    it('should have toasts$ observable', () => {
      expect(service.toasts$).toBeDefined();
    });
  });

  describe('success()', () => {
    it('should add success toast with default duration', () => {
      service.success('Success message');

      expect(currentToasts.length).toBe(1);
      expect(currentToasts[0].message).toBe('Success message');
      expect(currentToasts[0].type).toBe('success');
      expect(currentToasts[0].duration).toBe(3000);
      expect(currentToasts[0].id).toBeDefined();
    });

    it('should add success toast with custom duration', () => {
      service.success('Custom duration', 5000);

      expect(currentToasts.length).toBe(1);
      expect(currentToasts[0].duration).toBe(5000);
    });

    it('should auto-remove success toast after duration', () => {
      service.success('Auto remove', 1000);

      expect(currentToasts.length).toBe(1);

      vi.advanceTimersByTime(1000);

      expect(currentToasts.length).toBe(0);
    });
  });

  describe('error()', () => {
    it('should add error toast with default duration', () => {
      service.error('Error message');

      expect(currentToasts.length).toBe(1);
      expect(currentToasts[0].message).toBe('Error message');
      expect(currentToasts[0].type).toBe('error');
      expect(currentToasts[0].duration).toBe(5000);
    });

    it('should add error toast with custom duration', () => {
      service.error('Custom error', 3000);

      expect(currentToasts.length).toBe(1);
      expect(currentToasts[0].duration).toBe(3000);
    });

    it('should auto-remove error toast after duration', () => {
      service.error('Auto remove error', 1000);

      expect(currentToasts.length).toBe(1);

      vi.advanceTimersByTime(1000);

      expect(currentToasts.length).toBe(0);
    });
  });

  describe('info()', () => {
    it('should add info toast with default duration', () => {
      service.info('Info message');

      expect(currentToasts.length).toBe(1);
      expect(currentToasts[0].message).toBe('Info message');
      expect(currentToasts[0].type).toBe('info');
      expect(currentToasts[0].duration).toBe(3000);
    });

    it('should add info toast with custom duration', () => {
      service.info('Custom info', 2000);

      expect(currentToasts.length).toBe(1);
      expect(currentToasts[0].duration).toBe(2000);
    });

    it('should auto-remove info toast after duration', () => {
      service.info('Auto remove info', 1000);

      expect(currentToasts.length).toBe(1);

      vi.advanceTimersByTime(1000);

      expect(currentToasts.length).toBe(0);
    });
  });

  describe('warning()', () => {
    it('should add warning toast with default duration', () => {
      service.warning('Warning message');

      expect(currentToasts.length).toBe(1);
      expect(currentToasts[0].message).toBe('Warning message');
      expect(currentToasts[0].type).toBe('warning');
      expect(currentToasts[0].duration).toBe(4000);
    });

    it('should add warning toast with custom duration', () => {
      service.warning('Custom warning', 6000);

      expect(currentToasts.length).toBe(1);
      expect(currentToasts[0].duration).toBe(6000);
    });

    it('should auto-remove warning toast after duration', () => {
      service.warning('Auto remove warning', 1000);

      expect(currentToasts.length).toBe(1);

      vi.advanceTimersByTime(1000);

      expect(currentToasts.length).toBe(0);
    });
  });

  describe('Multiple Toasts', () => {
    it('should handle multiple toasts', () => {
      service.success('First');
      service.error('Second');
      service.info('Third');

      expect(currentToasts.length).toBe(3);
      expect(currentToasts[0].message).toBe('First');
      expect(currentToasts[1].message).toBe('Second');
      expect(currentToasts[2].message).toBe('Third');
    });

    it('should generate unique IDs for each toast', () => {
      service.success('Toast 1');
      service.success('Toast 2');
      service.success('Toast 3');

      expect(currentToasts.length).toBe(3);
      expect(currentToasts[0].id).not.toBe(currentToasts[1].id);
      expect(currentToasts[1].id).not.toBe(currentToasts[2].id);
      expect(currentToasts[0].id).not.toBe(currentToasts[2].id);
    });

    it('should increment toast IDs sequentially', () => {
      service.success('Toast 1');
      service.success('Toast 2');

      expect(currentToasts.length).toBe(2);
      expect(currentToasts[1].id).toBe(currentToasts[0].id + 1);
    });

    it('should auto-remove each toast independently', () => {
      service.success('First', 1000);
      service.error('Second', 2000);
      service.info('Third', 3000);

      expect(currentToasts.length).toBe(3);

      vi.advanceTimersByTime(1000);
      expect(currentToasts.length).toBe(2);
      expect(currentToasts[0].message).toBe('Second');

      vi.advanceTimersByTime(1000);
      expect(currentToasts.length).toBe(1);
      expect(currentToasts[0].message).toBe('Third');

      vi.advanceTimersByTime(1000);
      expect(currentToasts.length).toBe(0);
    });
  });

  describe('remove()', () => {
    it('should remove specific toast by id', () => {
      service.success('Toast 1');
      service.success('Toast 2');
      service.success('Toast 3');

      expect(currentToasts.length).toBe(3);
      const removeId = currentToasts[1].id;
      
      service.remove(removeId);

      expect(currentToasts.length).toBe(2);
      expect(currentToasts.find(t => t.id === removeId)).toBeUndefined();
      expect(currentToasts[0].message).toBe('Toast 1');
      expect(currentToasts[1].message).toBe('Toast 3');
    });

    it('should not affect other toasts when removing one', () => {
      service.success('Keep 1');
      service.error('Remove This');
      service.info('Keep 2');

      expect(currentToasts.length).toBe(3);
      const removeId = currentToasts[1].id;

      service.remove(removeId);

      expect(currentToasts.length).toBe(2);
      expect(currentToasts[0].message).toBe('Keep 1');
      expect(currentToasts[1].message).toBe('Keep 2');
    });

    it('should handle removing non-existent toast gracefully', () => {
      service.success('Toast 1');

      expect(currentToasts.length).toBe(1);
      
      service.remove(999); // Non-existent ID

      expect(currentToasts.length).toBe(1);
      expect(currentToasts[0].message).toBe('Toast 1');
    });

    it('should handle removing from empty toasts array', () => {
      expect(() => service.remove(1)).not.toThrow();
      expect(currentToasts.length).toBe(0);
    });
  });

  describe('clear()', () => {
    it('should remove all toasts', () => {
      service.success('Toast 1');
      service.error('Toast 2');
      service.info('Toast 3');
      service.warning('Toast 4');

      expect(currentToasts.length).toBe(4);

      service.clear();

      expect(currentToasts).toEqual([]);
      expect(currentToasts.length).toBe(0);
    });

    it('should work when no toasts exist', () => {
      service.clear();

      expect(currentToasts).toEqual([]);
    });

    it('should cancel auto-removal timers', () => {
      service.success('Toast 1', 2000);
      service.error('Toast 2', 2000);

      expect(currentToasts.length).toBe(2);

      service.clear();
      expect(currentToasts.length).toBe(0);

      vi.advanceTimersByTime(2000);
      expect(currentToasts.length).toBe(0); // Should stay 0, timers should have been cleared
    });
  });

  describe('Toast with Zero Duration', () => {
    it('should not auto-remove toast with 0 duration', () => {
      service.success('Persistent toast', 0);

      expect(currentToasts.length).toBe(1);

      vi.advanceTimersByTime(10000); // Wait a long time

      expect(currentToasts.length).toBe(1); // Should still be there
      expect(currentToasts[0].message).toBe('Persistent toast');
    });
  });

  describe('Observable Behavior', () => {
    it('should emit new array on each change', () => {
      const emittedArrays: Toast[][] = [];

      service.toasts$.subscribe(toasts => {
        emittedArrays.push(toasts);
      });

      service.success('Toast 1');
      service.success('Toast 2');

      // Should have 3 emissions: initial empty, after first toast, after second toast
      expect(emittedArrays.length).toBeGreaterThanOrEqual(2);
      expect(emittedArrays[0]).not.toBe(emittedArrays[1]); // Different array references
    });

    it('should allow multiple subscribers', () => {
      let subscriber1Count = 0;
      let subscriber2Count = 0;

      service.toasts$.subscribe(() => subscriber1Count++);
      service.toasts$.subscribe(() => subscriber2Count++);

      service.success('Test');

      expect(subscriber1Count).toBeGreaterThan(0);
      expect(subscriber2Count).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      service.success('');

      expect(currentToasts.length).toBe(1);
      expect(currentToasts[0].message).toBe('');
    });

    it('should handle very long message', () => {
      const longMessage = 'a'.repeat(1000);
      service.success(longMessage);

      expect(currentToasts.length).toBe(1);
      expect(currentToasts[0].message).toBe(longMessage);
    });

    it('should handle negative duration', () => {
      service.success('Test', -1000);

      expect(currentToasts.length).toBe(1);

      vi.advanceTimersByTime(5000);
      
      // Negative duration should be treated as 0 (no auto-removal)
      expect(currentToasts.length).toBe(1);
    });

    it('should handle very short duration', () => {
      service.success('Quick toast', 1);

      expect(currentToasts.length).toBe(1);

      vi.advanceTimersByTime(1);

      expect(currentToasts.length).toBe(0);
    });
  });
});
