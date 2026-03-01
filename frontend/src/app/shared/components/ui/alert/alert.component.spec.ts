import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlertComponent } from './alert.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('AlertComponent', () => {
  let component: AlertComponent;
  let fixture: ComponentFixture<AlertComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AlertComponent]
    });

    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges here - let each test do it after setting properties
  });

  describe('Component Creation', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should be visible by default', () => {
      expect(component.visible).toBe(true);
    });

    it('should render alert when visible', () => {
      fixture.detectChanges();
      const alertDiv = fixture.debugElement.query(By.css('[role="alert"]'));
      expect(alertDiv).toBeTruthy();
    });

    it('should not render alert when not visible', () => {
      component.visible = false;
      fixture.detectChanges();
      const alertDiv = fixture.debugElement.query(By.css('[role="alert"]'));
      expect(alertDiv).toBeFalsy();
    });
  });

  describe('Alert Properties', () => {
    it('should have default type as info', () => {
      expect(component.type).toBe('info');
    });

    it('should have empty title by default', () => {
      expect(component.title).toBe('');
    });

    it('should have dismissible as false by default', () => {
      expect(component.dismissible).toBe(false);
    });
  });

  describe('Alert Types', () => {
    it('should apply success type classes', () => {
      component.type = 'success';
      fixture.detectChanges();
      const classes = component.alertClasses;
      expect(classes).toContain('bg-green-50');
      expect(classes).toContain('border-green-200');
    });

    it('should apply error type classes', () => {
      component.type = 'error';
      fixture.detectChanges();
      const classes = component.alertClasses;
      expect(classes).toContain('bg-red-50');
      expect(classes).toContain('border-red-200');
    });

    it('should apply warning type classes', () => {
      component.type = 'warning';
      fixture.detectChanges();
      const classes = component.alertClasses;
      expect(classes).toContain('bg-yellow-50');
      expect(classes).toContain('border-yellow-200');
    });

    it('should apply info type classes', () => {
      component.type = 'info';
      fixture.detectChanges();
      const classes = component.alertClasses;
      expect(classes).toContain('bg-blue-50');
      expect(classes).toContain('border-blue-200');
    });
  });

  describe('Alert Classes', () => {
    it('should include base classes', () => {
      const classes = component.alertClasses;
      expect(classes).toContain('rounded-lg');
      expect(classes).toContain('p-4');
      expect(classes).toContain('mb-4');
      expect(classes).toContain('border');
    });
  });

  describe('Title Rendering', () => {
    it('should not render title when empty', () => {
      component.title = '';
      fixture.detectChanges();
      const title = fixture.debugElement.query(By.css('h3'));
      expect(title).toBeFalsy();
    });

    it('should render title when provided', () => {
      component.title = 'Success!';
      fixture.detectChanges();
      const title = fixture.debugElement.query(By.css('h3'));
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('Success!');
    });
  });

  describe('Title Color Classes', () => {
    it('should return green color for success', () => {
      component.type = 'success';
      expect(component.titleColorClass).toBe('text-green-800');
    });

    it('should return red color for error', () => {
      component.type = 'error';
      expect(component.titleColorClass).toBe('text-red-800');
    });

    it('should return yellow color for warning', () => {
      component.type = 'warning';
      expect(component.titleColorClass).toBe('text-yellow-800');
    });

    it('should return blue color for info', () => {
      component.type = 'info';
      expect(component.titleColorClass).toBe('text-blue-800');
    });
  });

  describe('Message Color Classes', () => {
    it('should return green color for success', () => {
      component.type = 'success';
      expect(component.messageColorClass).toBe('text-green-700');
    });

    it('should return red color for error', () => {
      component.type = 'error';
      expect(component.messageColorClass).toBe('text-red-700');
    });

    it('should return yellow color for warning', () => {
      component.type = 'warning';
      expect(component.messageColorClass).toBe('text-yellow-700');
    });

    it('should return blue color for info', () => {
      component.type = 'info';
      expect(component.messageColorClass).toBe('text-blue-700');
    });
  });

  describe('Icon Display', () => {
    it('should display success icon', () => {
      component.type = 'success';
      const icon = component.icon;
      expect(icon).toContain('✓');
    });

    it('should display error icon', () => {
      component.type = 'error';
      const icon = component.icon;
      expect(icon).toContain('✕');
    });

    it('should display warning icon', () => {
      component.type = 'warning';
      const icon = component.icon;
      expect(icon).toContain('⚠');
    });

    it('should display info icon', () => {
      component.type = 'info';
      const icon = component.icon;
      expect(icon).toContain('ℹ');
    });

    it('should wrap icon in span with text-xl class', () => {
      const icon = component.icon;
      expect(icon).toContain('<span class="text-xl">');
      expect(icon).toContain('</span>');
    });
  });

  describe('Dismissible Behavior', () => {
    it('should not show close button when not dismissible', () => {
      component.dismissible = false;
      fixture.detectChanges();
      const closeButton = fixture.debugElement.query(By.css('button'));
      expect(closeButton).toBeFalsy();
    });

    it('should show close button when dismissible', () => {
      component.dismissible = true;
      fixture.detectChanges();
      const closeButton = fixture.debugElement.query(By.css('button'));
      expect(closeButton).toBeTruthy();
    });

    it('should hide alert when close button clicked', () => {
      component.dismissible = true;
      component.visible = true;
      fixture.detectChanges();

      const closeButton = fixture.debugElement.query(By.css('button'));
      closeButton.nativeElement.click();
      fixture.detectChanges();

      expect(component.visible).toBe(false);
    });

    it('should emit closed event when dismissed', () => {
      component.dismissible = true;
      const closedSpy = vi.fn();
      component.closed.subscribe(closedSpy);

      component.onClose();

      expect(closedSpy).toHaveBeenCalled();
    });

    it('should set visible to false on close', () => {
      component.visible = true;
      component.onClose();
      expect(component.visible).toBe(false);
    });
  });

  describe('Close Button Classes', () => {
    it('should return green classes for success', () => {
      component.type = 'success';
      const classes = component.closeButtonClass;
      expect(classes).toContain('text-green-500');
      expect(classes).toContain('hover:text-green-700');
    });

    it('should return red classes for error', () => {
      component.type = 'error';
      const classes = component.closeButtonClass;
      expect(classes).toContain('text-red-500');
      expect(classes).toContain('hover:text-red-700');
    });

    it('should return yellow classes for warning', () => {
      component.type = 'warning';
      const classes = component.closeButtonClass;
      expect(classes).toContain('text-yellow-500');
      expect(classes).toContain('hover:text-yellow-700');
    });

    it('should return blue classes for info', () => {
      component.type = 'info';
      const classes = component.closeButtonClass;
      expect(classes).toContain('text-blue-500');
      expect(classes).toContain('hover:text-blue-700');
    });

    it('should include base close button classes', () => {
      const classes = component.closeButtonClass;
      expect(classes).toContain('inline-flex');
      expect(classes).toContain('rounded-md');
      expect(classes).toContain('p-1.5');
      expect(classes).toContain('focus:outline-none');
      expect(classes).toContain('focus:ring-2');
    });
  });

  describe('Content Projection', () => {
    it('should project content via ng-content', () => {
      // Content projection is handled via ng-content in the template
      fixture.detectChanges();
      const contentDiv = fixture.debugElement.query(By.css('.text-sm'));
      expect(contentDiv).toBeTruthy();
    });
  });

  describe('Complex Alert Scenarios', () => {
    it('should render success alert with title and dismissible', () => {
      component.type = 'success';
      component.title = 'Success';
      component.dismissible = true;
      fixture.detectChanges();

      const alert = fixture.debugElement.query(By.css('[role="alert"]'));
      const title = fixture.debugElement.query(By.css('h3'));
      const closeButton = fixture.debugElement.query(By.css('button'));

      expect(alert).toBeTruthy();
      expect(title).toBeTruthy();
      expect(closeButton).toBeTruthy();
      expect(component.alertClasses).toContain('bg-green-50');
    });

    it('should render error alert with title only', () => {
      component.type = 'error';
      component.title = 'Error Occurred';
      component.dismissible = false;
      fixture.detectChanges();

      const alert = fixture.debugElement.query(By.css('[role="alert"]'));
      const title = fixture.debugElement.query(By.css('h3'));
      const closeButton = fixture.debugElement.query(By.css('button'));

      expect(alert).toBeTruthy();
      expect(title).toBeTruthy();
      expect(closeButton).toBeFalsy();
      expect(component.alertClasses).toContain('bg-red-50');
    });

    it('should handle alert state changes', () => {
      // Test info type alert is visible
      component.type = 'info';
      component.visible = true;
      fixture.detectChanges();

      let alert = fixture.debugElement.query(By.css('[role="alert"]'));
      expect(alert).toBeTruthy();
      expect(component.alertClasses).toContain('bg-blue-50');

      // Create new fixture for testing warning type to avoid NG0100
      const warningFixture = TestBed.createComponent(AlertComponent);
      const warningComponent = warningFixture.componentInstance;
      warningComponent.type = 'warning';
      warningComponent.visible = true;
      warningFixture.detectChanges();
      const warningAlert = warningFixture.debugElement.query(By.css('[role="alert"]'));
      expect(warningAlert).toBeTruthy();
      expect(warningComponent.alertClasses).toContain('bg-yellow-50');

      // Create new fixture for testing visibility toggle to avoid NG0100
      const hiddenFixture = TestBed.createComponent(AlertComponent);
      const hiddenComponent = hiddenFixture.componentInstance;
      hiddenComponent.visible = false;
      hiddenFixture.detectChanges();
      const hiddenAlert = hiddenFixture.debugElement.query(By.css('[role="alert"]'));
      expect(hiddenAlert).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert" attribute', () => {
      fixture.detectChanges();
      const alertDiv = fixture.debugElement.query(By.css('[role="alert"]'));
      expect(alertDiv.nativeElement.getAttribute('role')).toBe('alert');
    });

    it('should have sr-only text for close button', () => {
      component.dismissible = true;
      fixture.detectChanges();
      const srOnly = fixture.debugElement.query(By.css('.sr-only'));
      expect(srOnly).toBeTruthy();
      expect(srOnly.nativeElement.textContent).toBe('Dismiss');
    });
  });
});
