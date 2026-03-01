import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { LoadingSpinnerComponent } from './loading-spinner.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    // Don't call detectChanges() here - let each test control when to detect changes
  });

  describe('Component Creation', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render spinner SVG', () => {
      fixture.detectChanges();
      const svg = compiled.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.classList.contains('animate-spin')).toBe(true);
    });

    it('should have default size as medium', () => {
      expect(component.size).toBe('medium');
    });

    it('should have default padding as large', () => {
      expect(component.padding).toBe('large');
    });
  });

  describe('Message Display', () => {
    it('should not display message span when message is not provided', () => {
      fixture.detectChanges();
      const messageSpan = compiled.querySelector('span');
      expect(messageSpan).toBeNull();
    });

    it('should display message when provided', () => {
      component.message = 'Loading users...';
      fixture.detectChanges();

      const messageSpan = compiled.querySelector('span');
      expect(messageSpan).toBeTruthy();
      expect(messageSpan?.textContent?.trim()).toBe('Loading users...');
    });

    it('should have ml-2 class on message span', () => {
      component.message = 'Loading...';
      fixture.detectChanges();

      const messageSpan = compiled.querySelector('span');
      expect(messageSpan?.classList.contains('ml-2')).toBe(true);
      expect(messageSpan?.classList.contains('text-gray-600')).toBe(true);
    });

    it('should display first message correctly', () => {
      component.message = 'First message';
      fixture.detectChanges();
      const messageSpan = compiled.querySelector('span');
      expect(messageSpan?.textContent?.trim()).toBe('First message');
    });

    it('should display second message correctly', () => {
      component.message = 'Second message';
      fixture.detectChanges();
      const messageSpan = compiled.querySelector('span');
      expect(messageSpan?.textContent?.trim()).toBe('Second message');
    });

    it('should display message span when message is set', () => {
      component.message = 'Loading...';
      fixture.detectChanges();
      expect(compiled.querySelector('span')).toBeTruthy();
    });

    it('should not display message span when message is undefined', () => {
      component.message = undefined;
      fixture.detectChanges();
      expect(compiled.querySelector('span')).toBeNull();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      component.size = 'small';
      fixture.detectChanges();

      expect(component.spinnerClass).toBe('h-4 w-4');
      expect(component.textClass).toBe('text-xs');

      const svg = compiled.querySelector('svg');
      expect(svg?.classList.contains('h-4')).toBe(true);
      expect(svg?.classList.contains('w-4')).toBe(true);
    });

    it('should apply medium size classes', () => {
      component.size = 'medium';
      fixture.detectChanges();

      expect(component.spinnerClass).toBe('h-8 w-8');
      expect(component.textClass).toBe('text-sm');

      const svg = compiled.querySelector('svg');
      expect(svg?.classList.contains('h-8')).toBe(true);
      expect(svg?.classList.contains('w-8')).toBe(true);
    });

    it('should apply large size classes', () => {
      component.size = 'large';
      fixture.detectChanges();

      expect(component.spinnerClass).toBe('h-12 w-12');
      expect(component.textClass).toBe('text-base');

      const svg = compiled.querySelector('svg');
      expect(svg?.classList.contains('h-12')).toBe(true);
      expect(svg?.classList.contains('w-12')).toBe(true);
    });

    it('should apply text-xs class when size is small with message', () => {
      component.size = 'small';
      component.message = 'Loading...';
      fixture.detectChanges();
      const messageSpan = compiled.querySelector('span');
      expect(messageSpan?.classList.contains('text-xs')).toBe(true);
    });

    it('should apply text-sm class when size is medium with message', () => {
      component.size = 'medium';
      component.message = 'Loading...';
      fixture.detectChanges();
      const messageSpan = compiled.querySelector('span');
      expect(messageSpan?.classList.contains('text-sm')).toBe(true);
    });

    it('should apply text-base class when size is large with message', () => {
      component.size = 'large';
      component.message = 'Loading...';
      fixture.detectChanges();
      const messageSpan = compiled.querySelector('span');
      expect(messageSpan?.classList.contains('text-base')).toBe(true);
    });
  });

  describe('Padding Variants', () => {
    it('should apply no padding class when padding is none', () => {
      component.padding = 'none';
      fixture.detectChanges();

      expect(component.containerClass).toBe('');
      
      const container = compiled.querySelector('div.flex');
      expect(container?.classList.contains('py-4')).toBe(false);
      expect(container?.classList.contains('py-8')).toBe(false);
      expect(container?.classList.contains('py-12')).toBe(false);
    });

    it('should apply small padding class', () => {
      component.padding = 'small';
      fixture.detectChanges();

      expect(component.containerClass).toBe('py-4');

      const container = compiled.querySelector('div.flex');
      expect(container?.classList.contains('py-4')).toBe(true);
    });

    it('should apply medium padding class', () => {
      component.padding = 'medium';
      fixture.detectChanges();

      expect(component.containerClass).toBe('py-8');

      const container = compiled.querySelector('div.flex');
      expect(container?.classList.contains('py-8')).toBe(true);
    });

    it('should apply large padding class (default)', () => {
      component.padding = 'large';
      fixture.detectChanges();

      expect(component.containerClass).toBe('py-12');

      const container = compiled.querySelector('div.flex');
      expect(container?.classList.contains('py-12')).toBe(true);
    });
  });

  describe('Getter Methods', () => {
    it('spinnerClass should return correct classes for all sizes', () => {
      component.size = 'small';
      expect(component.spinnerClass).toBe('h-4 w-4');

      component.size = 'medium';
      expect(component.spinnerClass).toBe('h-8 w-8');

      component.size = 'large';
      expect(component.spinnerClass).toBe('h-12 w-12');
    });

    it('textClass should return correct classes for all sizes', () => {
      component.size = 'small';
      expect(component.textClass).toBe('text-xs');

      component.size = 'medium';
      expect(component.textClass).toBe('text-sm');

      component.size = 'large';
      expect(component.textClass).toBe('text-base');
    });

    it('containerClass should return correct classes for all padding values', () => {
      component.padding = 'none';
      expect(component.containerClass).toBe('');

      component.padding = 'small';
      expect(component.containerClass).toBe('py-4');

      component.padding = 'medium';
      expect(component.containerClass).toBe('py-8');

      component.padding = 'large';
      expect(component.containerClass).toBe('py-12');
    });
  });

  describe('SVG Structure', () => {
    it('should have correct SVG attributes', () => {
      fixture.detectChanges();
      const svg = compiled.querySelector('svg');
      expect(svg?.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
      expect(svg?.getAttribute('fill')).toBe('none');
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    });

    it('should contain circle element for spinner background', () => {
      fixture.detectChanges();
      const circle = compiled.querySelector('svg circle');
      expect(circle).toBeTruthy();
      expect(circle?.getAttribute('cx')).toBe('12');
      expect(circle?.getAttribute('cy')).toBe('12');
      expect(circle?.getAttribute('r')).toBe('10');
    });

    it('should contain path element for spinner animation', () => {
      fixture.detectChanges();
      const path = compiled.querySelector('svg path');
      expect(path).toBeTruthy();
      expect(path?.classList.contains('opacity-75')).toBe(true);
    });

    it('should have animate-spin class on SVG', () => {
      fixture.detectChanges();
      const svg = compiled.querySelector('svg');
      expect(svg?.classList.contains('animate-spin')).toBe(true);
      expect(svg?.classList.contains('text-blue-600')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message string', () => {
      component.message = '';
      fixture.detectChanges();

      // Empty string is falsy in *ngIf context, so span should not render
      const messageSpan = compiled.querySelector('span');
      expect(messageSpan).toBeNull();
    });

    it('should handle whitespace-only message', () => {
      component.message = '   ';
      fixture.detectChanges();

      const messageSpan = compiled.querySelector('span');
      expect(messageSpan).toBeTruthy();
      expect(messageSpan?.textContent?.trim()).toBe('');
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(200);
      component.message = longMessage;
      fixture.detectChanges();

      const messageSpan = compiled.querySelector('span');
      expect(messageSpan).toBeTruthy();
      expect(messageSpan?.textContent?.trim()).toBe(longMessage);
    });
  });

  describe('Integration Tests', () => {
    it('should work with small size and message', () => {
      component.size = 'small';
      component.message = 'Loading...';
      fixture.detectChanges();

      const svg = compiled.querySelector('svg');
      const span = compiled.querySelector('span');

      expect(svg?.classList.contains('h-4')).toBe(true);
      expect(span?.classList.contains('text-xs')).toBe(true);
      expect(span?.textContent?.trim()).toBe('Loading...');
    });

    it('should work with large size, message, and no padding', () => {
      component.size = 'large';
      component.message = 'Processing...';
      component.padding = 'none';
      fixture.detectChanges();

      const svg = compiled.querySelector('svg');
      const span = compiled.querySelector('span');
      const container = compiled.querySelector('div.flex');

      expect(svg?.classList.contains('h-12')).toBe(true);
      expect(span?.classList.contains('text-base')).toBe(true);
      expect(span?.textContent?.trim()).toBe('Processing...');
      expect(container?.classList.contains('py-4')).toBe(false);
      expect(container?.classList.contains('py-8')).toBe(false);
      expect(container?.classList.contains('py-12')).toBe(false);
    });

    it('should maintain consistent layout with default configuration', () => {
      fixture.detectChanges();
      const container = compiled.querySelector('div.flex');
      expect(container?.classList.contains('flex')).toBe(true);
      expect(container?.classList.contains('items-center')).toBe(true);
      expect(container?.classList.contains('justify-center')).toBe(true);
    });

    it('should maintain consistent layout with custom configuration', () => {
      component.size = 'large';
      component.message = 'Test';
      component.padding = 'small';
      fixture.detectChanges();

      const container = compiled.querySelector('div.flex');
      expect(container?.classList.contains('flex')).toBe(true);
      expect(container?.classList.contains('items-center')).toBe(true);
      expect(container?.classList.contains('justify-center')).toBe(true);
    });
  });
});
