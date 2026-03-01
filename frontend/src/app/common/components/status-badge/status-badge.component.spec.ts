import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { StatusBadgeComponent } from './status-badge.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;
  let badge: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StatusBadgeComponent]
    });

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render span element', () => {
      fixture.detectChanges();
      badge = fixture.debugElement.query(By.css('span'));
      expect(badge).toBeTruthy();
    });

    it('should have default size as small', () => {
      expect(component.size).toBe('small');
    });
  });

  describe('Display Label Priority', () => {
    it('should display custom label when provided', () => {
      component.label = 'Custom Label';
      component.status = 'pending';
      component.active = true;
      fixture.detectChanges();

      expect(component.displayLabel).toBe('Custom Label');
      badge = fixture.debugElement.query(By.css('span'));
      expect(badge.nativeElement.textContent.trim()).toBe('Custom Label');
    });

    it('should display status when no custom label provided', () => {
      component.status = 'Approved';
      component.active = true;
      fixture.detectChanges();

      expect(component.displayLabel).toBe('Approved');
      badge = fixture.debugElement.query(By.css('span'));
      expect(badge.nativeElement.textContent.trim()).toBe('Approved');
    });

    it('should display "Active" when active=true and no label/status', () => {
      component.active = true;
      fixture.detectChanges();

      expect(component.displayLabel).toBe('Active');
      badge = fixture.debugElement.query(By.css('span'));
      expect(badge.nativeElement.textContent.trim()).toBe('Active');
    });

    it('should display "Inactive" when active=false and no label/status', () => {
      component.active = false;
      fixture.detectChanges();

      expect(component.displayLabel).toBe('Inactive');
      badge = fixture.debugElement.query(By.css('span'));
      expect(badge.nativeElement.textContent.trim()).toBe('Inactive');
    });

    it('should display empty string when no inputs provided', () => {
      fixture.detectChanges();

      expect(component.displayLabel).toBe('');
      badge = fixture.debugElement.query(By.css('span'));
      expect(badge.nativeElement.textContent.trim()).toBe('');
    });
  });

  describe('Variant Classes', () => {
    it('should apply success variant classes', () => {
      component.variant = 'success';
      component.label = 'Success';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-green-100');
      expect(badgeClass).toContain('text-green-800');
    });

    it('should apply warning variant classes', () => {
      component.variant = 'warning';
      component.label = 'Warning';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-yellow-100');
      expect(badgeClass).toContain('text-yellow-800');
    });

    it('should apply danger variant classes', () => {
      component.variant = 'danger';
      component.label = 'Danger';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-red-100');
      expect(badgeClass).toContain('text-red-800');
    });

    it('should apply info variant classes', () => {
      component.variant = 'info';
      component.label = 'Info';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-blue-100');
      expect(badgeClass).toContain('text-blue-800');
    });

    it('should apply default variant classes', () => {
      component.variant = 'default';
      component.label = 'Default';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-gray-100');
      expect(badgeClass).toContain('text-gray-800');
    });
  });

  describe('Auto-detect Variant from Active', () => {
    it('should auto-detect success variant when active=true', () => {
      component.active = true;
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-green-100');
      expect(badgeClass).toContain('text-green-800');
    });

    it('should auto-detect danger variant when active=false', () => {
      component.active = false;
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-red-100');
      expect(badgeClass).toContain('text-red-800');
    });
  });

  describe('Auto-detect Variant from Status', () => {
    it('should auto-detect success variant from "active" status', () => {
      component.status = 'active';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-green-100');
    });

    it('should auto-detect success variant from "approved" status', () => {
      component.status = 'Approved';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-green-100');
    });

    it('should auto-detect success variant from "complete" status', () => {
      component.status = 'Complete';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-green-100');
    });

    it('should auto-detect warning variant from "pending" status', () => {
      component.status = 'Pending';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-yellow-100');
    });

    it('should auto-detect warning variant from "in progress" status', () => {
      component.status = 'In Progress';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-yellow-100');
    });

    it('should auto-detect danger variant from "inactive" status', () => {
      component.status = 'Inactive';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-red-100');
    });

    it('should auto-detect danger variant from "rejected" status', () => {
      component.status = 'Rejected';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-red-100');
    });

    it('should auto-detect danger variant from "blocked" status', () => {
      component.status = 'Blocked';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-red-100');
    });

    it('should use default variant for unknown status', () => {
      component.status = 'Unknown Status';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-gray-100');
    });
  });

  describe('Size Classes', () => {
    it('should apply small size classes by default', () => {
      component.label = 'Test';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('text-xs');
      expect(badgeClass).toContain('px-2');
    });

    it('should apply medium size classes', () => {
      component.size = 'medium';
      component.label = 'Test';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('text-sm');
      expect(badgeClass).toContain('px-3');
      expect(badgeClass).toContain('py-1');
    });

    it('should apply large size classes', () => {
      component.size = 'large';
      component.label = 'Test';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('text-base');
      expect(badgeClass).toContain('px-4');
      expect(badgeClass).toContain('py-1');
    });
  });

  describe('Custom Classes', () => {
    it('should use custom classes when provided', () => {
      component.customClass = 'custom-badge-class another-class';
      component.label = 'Test';
      fixture.detectChanges();

      expect(component.badgeClass).toBe('custom-badge-class another-class');
    });

    it('should override default classes with custom classes', () => {
      component.customClass = 'custom-class';
      component.variant = 'success';
      component.size = 'large';
      component.label = 'Test';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toBe('custom-class');
      expect(badgeClass).not.toContain('bg-green-100');
      expect(badgeClass).not.toContain('text-base');
    });
  });

  describe('Badge Rendering', () => {
    it('should render badge with correct classes in DOM', () => {
      component.active = true;
      component.size = 'medium';
      fixture.detectChanges();

      badge = fixture.debugElement.query(By.css('span'));
      expect(badge.nativeElement.classList.contains('inline-flex')).toBe(true);
      expect(badge.nativeElement.classList.contains('rounded-full')).toBe(true);
      expect(badge.nativeElement.classList.contains('font-semibold')).toBe(true);
      expect(badge.nativeElement.classList.contains('leading-5')).toBe(true);
    });

    it('should update classes when inputs change', () => {
      component.active = true;
      fixture.detectChanges();

      let badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-green-100');

      // Change input - getter should immediately reflect the change
      component.active = false;
      
      badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-red-100');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined active without errors', () => {
      component.active = undefined;
      component.label = 'Test';
      fixture.detectChanges();

      expect(component.displayLabel).toBe('Test');
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle empty string status', () => {
      component.status = '';
      fixture.detectChanges();

      expect(component.displayLabel).toBe('');
    });

    it('should handle case-insensitive status matching', () => {
      component.status = 'PENDING';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-yellow-100');
    });

    it('should handle mixed case status matching', () => {
      component.status = 'InAcTiVe';
      fixture.detectChanges();

      const badgeClass = component.badgeClass;
      expect(badgeClass).toContain('bg-red-100');
    });
  });
});
