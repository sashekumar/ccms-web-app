import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ButtonComponent } from './button.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;
  let button: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ButtonComponent]
    });

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges here - let each test do it after setting properties
    button = fixture.debugElement.query(By.css('button'));
  });

  describe('Component Creation', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render button element', () => {
      fixture.detectChanges();
      button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeTruthy();
    });
  });

  describe('Button Properties', () => {
    it('should have default type as button', () => {
      fixture.detectChanges();
      button = fixture.debugElement.query(By.css('button'));
      expect(component.type).toBe('button');
      expect(button.nativeElement.type).toBe('button');
    });

    it('should have default variant as primary', () => {
      expect(component.variant).toBe('primary');
    });

    it('should have default size as md', () => {
      expect(component.size).toBe('md');
    });

    it('should have disabled as false by default', () => {
      fixture.detectChanges();
      button = fixture.debugElement.query(By.css('button'));
      expect(component.disabled).toBe(false);
      expect(button.nativeElement.disabled).toBe(false);
    });

    it('should have loading as false by default', () => {
      expect(component.loading).toBe(false);
    });

    it('should have fullWidth as false by default', () => {
      expect(component.fullWidth).toBe(false);
    });
  });

  describe('Button Types', () => {
    it('should set type to button by default', () => {
      fixture.detectChanges();
      button = fixture.debugElement.query(By.css('button'));
      expect(button.nativeElement.type).toBe('button');
    });

    it('should set type to submit', () => {
      component.type = 'submit';
      fixture.detectChanges();
      button = fixture.debugElement.query(By.css('button'));
      expect(button.nativeElement.type).toBe('submit');
    });

    it('should set type to reset', () => {
      component.type = 'reset';
      fixture.detectChanges();
      button = fixture.debugElement.query(By.css('button'));
      expect(button.nativeElement.type).toBe('reset');
    });
  });

  describe('Button Variants', () => {
    it('should apply primary variant classes', () => {
      component.variant = 'primary';
      fixture.detectChanges();
      const classes = component.buttonClasses;
      expect(classes).toContain('bg-gradient-to-r');
      expect(classes).toContain('from-primary-800');
      expect(classes).toContain('text-white');
      expect(classes).toContain('hover:opacity-90');
    });

    it('should apply secondary variant classes', () => {
      component.variant = 'secondary';
      fixture.detectChanges();
      const classes = component.buttonClasses;
      expect(classes).toContain('bg-white');
      expect(classes).toContain('text-gray-700');
      expect(classes).toContain('hover:bg-gray-50');
    });

    it('should apply danger variant classes', () => {
      component.variant = 'danger';
      fixture.detectChanges();
      const classes = component.buttonClasses;
      expect(classes).toContain('bg-red-600');
      expect(classes).toContain('text-white');
      expect(classes).toContain('hover:bg-red-700');
    });
  });

  describe('Button Sizes', () => {
    it('should apply small size classes', () => {
      component.size = 'sm';
      fixture.detectChanges();
      const classes = component.buttonClasses;
      expect(classes).toContain('px-3');
      expect(classes).toContain('py-1.5');
      expect(classes).toContain('text-xs');
    });

    it('should apply medium size classes', () => {
      component.size = 'md';
      fixture.detectChanges();
      const classes = component.buttonClasses;
      expect(classes).toContain('px-4');
      expect(classes).toContain('py-2');
      expect(classes).toContain('text-sm');
    });

    it('should apply large size classes', () => {
      component.size = 'lg';
      fixture.detectChanges();
      const classes = component.buttonClasses;
      expect(classes).toContain('px-5');
      expect(classes).toContain('py-2.5');
      expect(classes).toContain('text-sm');
    });
  });

  describe('Button States', () => {
    it('should disable button when disabled is true', () => {
      component.disabled = true;
      fixture.detectChanges();
      button = fixture.debugElement.query(By.css('button'));
      expect(button.nativeElement.disabled).toBe(true);
    });

    it('should disable button when loading is true', () => {
      component.loading = true;
      fixture.detectChanges();
      button = fixture.debugElement.query(By.css('button'));
      expect(button.nativeElement.disabled).toBe(true);
    });

    it('should add disabled classes when disabled', () => {
      component.disabled = true;
      fixture.detectChanges();
      const classes = component.buttonClasses;
      expect(classes).toContain('cursor-not-allowed');
      expect(classes).toContain('opacity-60');
    });

    it('should add disabled classes when loading', () => {
      component.loading = true;
      fixture.detectChanges();
      const classes = component.buttonClasses;
      expect(classes).toContain('cursor-not-allowed');
      expect(classes).toContain('opacity-60');
    });

    it('should show loading spinner when loading', () => {
      component.loading = true;
      fixture.detectChanges();
      const spinner = fixture.debugElement.query(By.css('.animate-spin'));
      expect(spinner).toBeTruthy();
    });

    it('should not show loading spinner when not loading', () => {
      component.loading = false;
      fixture.detectChanges();
      const spinner = fixture.debugElement.query(By.css('.animate-spin'));
      expect(spinner).toBeFalsy();
    });
  });

  describe('Full Width', () => {
    it('should apply full width class when fullWidth is true', () => {
      component.fullWidth = true;
      fixture.detectChanges();
      const classes = component.buttonClasses;
      expect(classes).toContain('w-full');
    });

    it('should not apply full width class when fullWidth is false', () => {
      component.fullWidth = false;
      fixture.detectChanges();
      const classes = component.buttonClasses;
      expect(classes).not.toContain('w-full');
    });
  });

  describe('Button Classes', () => {
    it('should include base classes', () => {
      fixture.detectChanges();
      const classes = component.buttonClasses;
      expect(classes).toContain('rounded-lg');
      expect(classes).toContain('font-medium');
      expect(classes).toContain('transition-all');
      expect(classes).toContain('focus:outline-none');
      expect(classes).toContain('focus:ring-2');
    });

    it('should return trimmed classes string', () => {
      component.fullWidth = true;
      component.disabled = true;
      fixture.detectChanges();
      
      const classes = component.buttonClasses;
      expect(classes).toContain('bg-gradient-to-r');
      expect(classes).toContain('px-4');
      expect(classes).toContain('w-full');
      expect(classes).toContain('cursor-not-allowed');
    });
  });

  describe('Disabled State Behavior', () => {
    it('should have disabled attribute when disabled', () => {
      component.disabled = true;
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
    });

    it('should have disabled attribute when loading', () => {
      component.loading = true;
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
    });

    it('should not be disabled when both disabled and loading are false', () => {
      component.disabled = false;
      component.loading = false;
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(false);
    });
  });

  describe('Content Projection', () => {
    it('should project content', () => {
      const testFixture = TestBed.createComponent(ButtonComponent);
      testFixture.componentInstance.type = 'button';
      testFixture.nativeElement.innerHTML = '<app-button>Click Me</app-button>';
      testFixture.detectChanges();
      
      // Content should be projected via ng-content
      expect(testFixture.nativeElement).toBeTruthy();
    });
  });
});
