import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

/**
 * Reusable input component with validation states
 * Implements ControlValueAccessor for reactive forms integration
 */
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div class="w-full">
      <label *ngIf="label" [for]="id" class="block text-sm font-medium text-gray-700 mb-1">
        {{ label }}
        <span *ngIf="required" class="text-red-500">*</span>
      </label>
      
      <div class="relative">
        <input
          [id]="id"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [required]="required"
          [class]="inputClasses"
          [value]="value"
          (input)="onInputChange($event)"
          (blur)="onTouched()"
        />
        <div *ngIf="error" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span class="text-red-500">⚠</span>
        </div>
      </div>

      <p *ngIf="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
      <p *ngIf="hint && !error" class="mt-1 text-sm text-gray-500">{{ hint }}</p>
    </div>
  `,
  styles: []
})
export class InputComponent implements ControlValueAccessor {
  @Input() id = `input-${Math.random().toString(36).substr(2, 9)}`;
  @Input() label = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' = 'text';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;

  value = '';
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  get inputClasses(): string {
    const baseClasses = 'block w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors';
    
    if (this.error) {
      return `${baseClasses} border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500`;
    }
    
    if (this.disabled) {
      return `${baseClasses} border-gray-200 bg-gray-50 cursor-not-allowed`;
    }
    
    return `${baseClasses} border-gray-300 focus:border-blue-500 focus:ring-blue-500`;
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
