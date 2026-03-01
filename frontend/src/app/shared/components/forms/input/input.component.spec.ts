import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputComponent } from './input.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;
  let inputElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InputComponent, FormsModule]
    });

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges here - let each test do it after setting properties
  });

  describe('Component Creation', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render input element', () => {
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      expect(inputElement).toBeTruthy();
    });

    it('should generate unique id', () => {
      expect(component.id).toContain('input-');
      expect(component.id.length).toBeGreaterThan(6);
    });
  });

  describe('Input Properties', () => {
    it('should have default type as text', () => {
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      expect(component.type).toBe('text');
      expect(inputElement.nativeElement.type).toBe('text');
    });

    it('should have empty label by default', () => {
      expect(component.label).toBe('');
    });

    it('should have empty placeholder by default', () => {
      expect(component.placeholder).toBe('');
    });

    it('should have empty hint by default', () => {
      expect(component.hint).toBe('');
    });

    it('should have empty error by default', () => {
      expect(component.error).toBe('');
    });

    it('should have required as false by default', () => {
      expect(component.required).toBe(false);
    });

    it('should have disabled as false by default', () => {
      expect(component.disabled).toBe(false);
    });

    it('should have empty value by default', () => {
      expect(component.value).toBe('');
    });
  });

  describe('Input Types', () => {
    it('should set type to email', () => {
      component.type = 'email';
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      expect(inputElement.nativeElement.type).toBe('email');
    });

    it('should set type to password', () => {
      component.type = 'password';
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      expect(inputElement.nativeElement.type).toBe('password');
    });

    it('should set type to number', () => {
      component.type = 'number';
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      expect(inputElement.nativeElement.type).toBe('number');
    });

    it('should set type to tel', () => {
      component.type = 'tel';
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      expect(inputElement.nativeElement.type).toBe('tel');
    });
  });

  describe('Label Rendering', () => {
    it('should not render label when empty', () => {
      component.label = '';
      fixture.detectChanges();
      const label = fixture.debugElement.query(By.css('label'));
      expect(label).toBeFalsy();
    });

    it('should render label when provided', () => {
      component.label = 'Email Address';
      fixture.detectChanges();
      const label = fixture.debugElement.query(By.css('label'));
      expect(label).toBeTruthy();
      expect(label.nativeElement.textContent).toContain('Email Address');
    });

    it('should show required asterisk when required', () => {
      component.label = 'Email';
      component.required = true;
      fixture.detectChanges();
      const asterisk = fixture.debugElement.query(By.css('.text-red-500'));
      expect(asterisk).toBeTruthy();
      expect(asterisk.nativeElement.textContent).toBe('*');
    });

    it('should not show required asterisk when not required', () => {
      component.label = 'Email';
      component.required = false;
      fixture.detectChanges();
      const asterisk = fixture.debugElement.query(By.css('.text-red-500'));
      expect(asterisk).toBeFalsy();
    });

    it('should associate label with input via id', () => {
      component.label = 'Username';
      component.id = 'test-input';
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      const label = fixture.debugElement.query(By.css('label'));
      expect(label.nativeElement.getAttribute('for')).toBe('test-input');
      expect(inputElement.nativeElement.id).toBe('test-input');
    });
  });

  describe('Input Classes', () => {
    it('should include base classes', () => {
      const classes = component.inputClasses;
      expect(classes).toContain('block');
      expect(classes).toContain('w-full');
      expect(classes).toContain('rounded-lg');
      expect(classes).toContain('border');
      expect(classes).toContain('px-3');
      expect(classes).toContain('py-2');
    });

    it('should apply error classes when error present', () => {
      component.error = 'Invalid email';
      fixture.detectChanges();
      const classes = component.inputClasses;
      expect(classes).toContain('border-red-300');
      expect(classes).toContain('text-red-900');
      expect(classes).toContain('focus:border-red-500');
      expect(classes).toContain('focus:ring-red-500');
    });

    it('should apply disabled classes when disabled', () => {
      component.disabled = true;
      fixture.detectChanges();
      const classes = component.inputClasses;
      expect(classes).toContain('border-gray-200');
      expect(classes).toContain('bg-gray-50');
      expect(classes).toContain('cursor-not-allowed');
    });

    it('should apply normal classes when no error and not disabled', () => {
      component.error = '';
      component.disabled = false;
      fixture.detectChanges();
      const classes = component.inputClasses;
      expect(classes).toContain('border-gray-300');
      expect(classes).toContain('focus:border-blue-500');
      expect(classes).toContain('focus:ring-blue-500');
    });
  });

  describe('Error Rendering', () => {
    it('should not show error icon when no error', () => {
      component.error = '';
      fixture.detectChanges();
      const errorIcon = fixture.debugElement.query(By.css('.text-red-500'));
      expect(errorIcon).toBeFalsy();
    });

    it('should show error icon when error present', () => {
      component.error = 'Required field';
      fixture.detectChanges();
      const errorIcon = fixture.debugElement.query(By.css('.text-red-500'));
      expect(errorIcon).toBeTruthy();
    });

    it('should display error message', () => {
      component.error = 'Invalid email format';
      fixture.detectChanges();
      const errorMsg = fixture.debugElement.query(By.css('.text-red-600'));
      expect(errorMsg).toBeTruthy();
      expect(errorMsg.nativeElement.textContent).toBe('Invalid email format');
    });

    it('should not display hint when error present', () => {
      component.error = 'Error';
      component.hint = 'Hint message';
      fixture.detectChanges();
      const hintMsg = fixture.debugElement.query(By.css('.text-gray-500'));
      expect(hintMsg).toBeFalsy();
    });
  });

  describe('Hint Rendering', () => {
    it('should not show hint when empty', () => {
      component.hint = '';
      fixture.detectChanges();
      const hint = fixture.debugElement.query(By.css('.text-gray-500'));
      expect(hint).toBeFalsy();
    });

    it('should display hint message when provided', () => {
      component.hint = 'Enter your email address';
      component.error = '';
      fixture.detectChanges();
      const hint = fixture.debugElement.query(By.css('.text-gray-500'));
      expect(hint).toBeTruthy();
      expect(hint.nativeElement.textContent).toBe('Enter your email address');
    });
  });

  describe('Input State', () => {
    it('should set placeholder', () => {
      component.placeholder = 'Enter email';
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      expect(inputElement.nativeElement.placeholder).toBe('Enter email');
    });

    it('should set required attribute', () => {
      component.required = true;
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      expect(inputElement.nativeElement.required).toBe(true);
    });

    it('should set disabled attribute', () => {
      component.disabled = true;
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      expect(inputElement.nativeElement.disabled).toBe(true);
    });

    it('should set value attribute', () => {
      component.value = 'test@email.com';
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      expect(inputElement.nativeElement.value).toBe('test@email.com');
    });
  });

  describe('Input Change Handler', () => {
    it('should update value on input', () => {
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      const onChangeSpy = vi.fn();
      component.onChange = onChangeSpy;

      inputElement.nativeElement.value = 'new value';
      inputElement.nativeElement.dispatchEvent(new Event('input'));

      expect(component.value).toBe('new value');
      expect(onChangeSpy).toHaveBeenCalledWith('new value');
    });

    it('should call onChange callback', () => {
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      const onChangeSpy = vi.fn();
      component.onChange = onChangeSpy;

      const event = new Event('input');
      Object.defineProperty(event, 'target', {
        value: { value: 'test' },
        writable: false
      });

      inputElement.nativeElement.value = 'test';
      inputElement.triggerEventHandler('input', event);

      expect(onChangeSpy).toHaveBeenCalled();
    });
  });

  describe('ControlValueAccessor', () => {
    it('should implement writeValue', () => {
      component.writeValue('test value');
      expect(component.value).toBe('test value');
    });

    it('should handle null in writeValue', () => {
      component.writeValue(null as any);
      expect(component.value).toBe('');
    });

    it('should handle undefined in writeValue', () => {
      component.writeValue(undefined as any);
      expect(component.value).toBe('');
    });

    it('should register onChange callback', () => {
      const callback = vi.fn();
      component.registerOnChange(callback);
      expect(component.onChange).toBe(callback);
    });

    it('should register onTouched callback', () => {
      const callback = vi.fn();
      component.registerOnTouched(callback);
      expect(component.onTouched).toBe(callback);
    });

    it('should call onTouched on blur', () => {
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      const onTouchedSpy = vi.fn();
      component.onTouched = onTouchedSpy;

      inputElement.nativeElement.dispatchEvent(new Event('blur'));

      expect(onTouchedSpy).toHaveBeenCalled();
    });

    it('should set disabled state', () => {
      component.setDisabledState(true);
      expect(component.disabled).toBe(true);

      component.setDisabledState(false);
      expect(component.disabled).toBe(false);
    });
  });

  describe('Form Integration', () => {
    it('should work with reactive forms', () => {
      fixture.detectChanges();
      inputElement = fixture.debugElement.query(By.css('input'));
      const onChangeSpy = vi.fn();
      const onTouchedSpy = vi.fn();

      component.registerOnChange(onChangeSpy);
      component.registerOnTouched(onTouchedSpy);
      component.writeValue('initial');

      expect(component.value).toBe('initial');

      inputElement.nativeElement.value = 'updated';
      inputElement.nativeElement.dispatchEvent(new Event('input'));

      expect(onChangeSpy).toHaveBeenCalled();

      inputElement.nativeElement.dispatchEvent(new Event('blur'));
      expect(onTouchedSpy).toHaveBeenCalled();
    });
  });

  describe('Multiple Inputs', () => {
    it('should generate unique ids for multiple instances', () => {
      const fixture2 = TestBed.createComponent(InputComponent);
      const component2 = fixture2.componentInstance;
      
      expect(component.id).not.toBe(component2.id);
    });
  });
});
