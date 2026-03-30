import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CurrencyMyrPipe } from '../../../pipes/currency-myr.pipe';

/**
 * Input type restrictions and validation rules
 */
export type TextInputType = 'string' | 'number' | 'integer' | 'decimal' | 'currency';

/**
 * Reusable text input component with type-specific validation and formatting.
 *
 * Features:
 * - Multiple input types: string, number, integer, decimal, currency
 * - Type-specific validation and formatting
 * - Single-line text input with label and placeholder
 * - Optional hint and error message display
 * - Disabled state support
 * - Implements ControlValueAccessor for reactive/template-driven forms
 * - Consistent styling aligned with Dropdown and DatePicker components
 * - Keyboard event support (enter, blur)
 *
 * @example – basic usage (default string type)
 * ```html
 * <app-text-input
 *   label="Search"
 *   placeholder="Enter search term…"
 *   [(ngModel)]="searchValue"
 *   (valueChange)="onSearchChange($event)"
 * ></app-text-input>
 * ```
 *
 * @example – currency input
 * ```html
 * <app-text-input
 *   label="Amount"
 *   inputType="currency"
 *   placeholder="0.00"
 *   [(ngModel)]="amount"
 * ></app-text-input>
 * ```
 *
 * @example – integer input
 * ```html
 * <app-text-input
 *   label="Age"
 *   inputType="integer"
 *   placeholder="Enter age"
 *   [(ngModel)]="age"
 * ></app-text-input>
 * ```
 *
 * @example – reactive form binding
 * ```html
 * <app-text-input [formControl]="searchCtrl"></app-text-input>
 * ```
 */
@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyMyrPipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="w-full">
      <!-- Label -->
      <label
        *ngIf="label"
        [for]="inputId"
        class="block text-sm font-medium text-gray-700 mb-1 select-none"
      >
        {{ label
        }}<span *ngIf="required" class="text-red-500 ml-0.5" aria-hidden="true">*</span>
      </label>

      <!-- Input field -->
      <div class="relative flex items-center h-[36px]">
        <input
          [id]="inputId"
          [type]="inputType === 'currency' ? 'text' : (inputType === 'integer' || inputType === 'number' || inputType === 'decimal' ? 'number' : 'text')"
          [attr.inputmode]="inputType === 'integer' ? 'numeric' : (inputType === 'number' || inputType === 'decimal' ? 'decimal' : null)"
          [attr.pattern]="inputType === 'integer' ? '[0-9]*' : null"
          [attr.step]="inputType === 'integer' ? '1' : (inputType === 'decimal' ? '0.01' : null)"
          [value]="inputType === 'currency' ? (currencyNumericValue | currencyMyr:decimalPlaces) : value"
          [placeholder]="placeholder || (inputType === 'currency' ? 'RM 0.00' : '')"
          [disabled]="disabled"
          [class]="inputClasses"
          (keydown)="inputType === 'currency' ? onCurrencyKeydown($event) : (inputType === 'integer' ? onIntegerKeydown($event) : null)"
          (input)="inputType !== 'currency' ? onInput($event) : null"
          (blur)="onBlur()"
          (keydown.enter)="onEnter()"
          [readonly]="inputType === 'currency'"
        />
      </div>

      <!-- Error/Hint text -->
      <p *ngIf="error" class="mt-1 text-xs text-red-600 flex items-start gap-1">
        <svg class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
            clip-rule="evenodd"
          />
        </svg>
        {{ error }}
      </p>
      <p *ngIf="hint && !error" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class TextInputComponent implements ControlValueAccessor, OnChanges {
  // ── Inputs ────────────────────────────────────────────────────────────────

  /** The input value (for ngModel or programmatic access) */
  @Input() value = '';

  /** Optional label rendered above the input */
  @Input() label = '';

  /** Placeholder text shown inside the input */
  @Input() placeholder = '';

  /** Disables the input when true */
  @Input() disabled = false;

  /** Marks the field as required (adds a red asterisk to the label) */
  @Input() required = false;

  /** Validation error message rendered below the input */
  @Input() error = '';

  /** Helper/hint text rendered below the input (hidden when error is set) */
  @Input() hint = '';

  /** HTML id forwarded to the input. Auto-generated when omitted */
  @Input() id = '';

  /** Debounce time in milliseconds for input events (optional) */
  @Input() debounceMs = 0;

  /**
   * Input type for validation and formatting
   * - 'string': Basic text (default)
   * - 'number': Accepts positive/negative numbers and decimals
   * - 'integer': Only whole numbers (0-9, +, -)
   * - 'decimal': Numbers with up to 2 decimal places
   * - 'currency': Currency format with RM prefix and 2 decimals
   */
  @Input() inputType: TextInputType = 'string';

  /** Maximum decimal places for decimal and currency types (default: 2) */
  @Input() decimalPlaces = 2;

  /** Maximum length for the input (0 = unlimited) */
  @Input() maxLength = 0;

  // ── Outputs ───────────────────────────────────────────────────────────────

  /** Emits whenever the input value changes */
  @Output() valueChange = new EventEmitter<string>();

  /** Emits when the input loses focus */
  @Output() blur = new EventEmitter<void>();

  /** Emits when Enter key is pressed */
  @Output() enter = new EventEmitter<string>();

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && !changes['value'].firstChange) {
      // Value was updated programmatically
      this.onTouched();
    }
  }

  // ── Computed helpers ──────────────────────────────────────────────────────

  get inputId(): string {
    return this.id || this._internalId;
  }

  /**
   * Returns numeric value for currency pipe formatting
   * Converts cents to decimal number (e.g., 12345 cents → 123.45)
   */
  get currencyNumericValue(): number | null {
    if (this.inputType !== 'currency' || this.currencyCents === 0) return null;
    return this.currencyCents / 100;
  }

  get inputClasses(): string {
    const base =
      'w-full h-full px-3 py-0 text-sm bg-white border rounded-lg transition-all duration-150 focus:outline-none leading-none';

    if (this.disabled) {
      return `${base} border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-70`;
    }
    if (this.error) {
      return `${base} border-red-400 text-gray-700 hover:border-red-500 focus:ring-2 focus:ring-red-200`;
    }
    return `${base} border-gray-300 text-gray-700 hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200`;
  }

  // ── ControlValueAccessor ──────────────────────────────────────────────────

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private _internalId = `text-input-${Math.random().toString(36).substr(2, 9)}`;
  private debounceTimer: any;

  /**
   * POS-style currency accumulator.
   * Stores the value as integer cents (e.g., RM 5.00 = 500 cents).
   * Every new digit is appended to the right; backspace removes from the right.
   */
  private currencyCents = 0;

  writeValue(value: any): void {
    if (this.inputType === 'currency') {
      const num = parseFloat(value ?? '');
      this.currencyCents = isNaN(num) ? 0 : Math.round(num * 100);
      this.value = this.currencyCents === 0 ? '' : (this.currencyCents / 100).toFixed(this.decimalPlaces);
    } else {
      // Convert number to string for numeric input types
      const stringValue = value !== null && value !== undefined ? String(value) : '';
      this.value = this.formatValue(stringValue);
    }
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

  // ── Validation & Formatting ──────────────────────────────────────────────

  /**
   * Validates input based on the configured input type
   */
  private validateInput(input: string): boolean {
    if (input === '') return true; // Allow empty values

    switch (this.inputType) {
      case 'integer':
        return /^-?\d+$/.test(input);

      case 'decimal':
      case 'currency':
        const decimalRegex = new RegExp(`^-?\\d+(\\.\\d{0,${this.decimalPlaces}})?$`);
        return decimalRegex.test(input);

      case 'number':
        return !isNaN(Number(input)) && input !== '';

      case 'string':
      default:
        return true;
    }
  }

  /**
   * Formats and cleans input based on the configured input type
   */
  private formatValue(input: string): string {
    if (input === '') return '';

    switch (this.inputType) {
      case 'integer':
        // Allow only digits and minus sign, strip everything else
        return input.replace(/[^\d-]/g, '').replace(/^-/, '$&').slice(0, this.maxLength || undefined);

      case 'currency':
      case 'decimal':
        // Strip all non-numeric characters except decimal point and minus
        let digits = input.replace(/[^\d.-]/g, '');
        
        // Prevent leading zeros but allow "0." or "0.5"
        digits = digits.replace(/^0+(?=\d)/, '');
        
        // Ensure only one decimal point
        const dotIndex = digits.indexOf('.');
        if (dotIndex >= 0) {
          const beforeDot = digits.substring(0, dotIndex);
          const afterDot = digits.substring(dotIndex + 1).replace(/\./g, ''); // Remove any extra dots
          // **CRITICAL: Strictly limit to exactly decimalPlaces digits after decimal**
          const limitedAfterDot = afterDot.substring(0, this.decimalPlaces);
          digits = beforeDot + (limitedAfterDot ? '.' + limitedAfterDot : '');
        }
        
        return digits;

      case 'number':
        // Allow numbers, decimal, and minus
        return input.replace(/[^\d.-]/g, '').slice(0, this.maxLength || undefined);

      case 'string':
      default:
        return this.maxLength > 0 ? input.slice(0, this.maxLength) : input;
    }
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  /**
   * POS-style currency keydown handler.
   *
   * Digits are appended to the right of an integer-cent accumulator.
   *   Press 5 → cents = 5    → display "RM 0.05"
   *   Press 0 → cents = 50   → display "RM 0.50"
   *   Press 0 → cents = 500  → display "RM 5.00"
   *   Press 0 → cents = 5000 → display "RM 50.00"
   * Backspace removes the last digit from the right.
   * All other keys are ignored / blocked for the input.
   */
  onCurrencyKeydown(event: KeyboardEvent): void {
    event.preventDefault(); // block browser default writing (input is readonly)

    if (event.key === 'Backspace' || event.key === 'Delete') {
      this.currencyCents = Math.floor(this.currencyCents / 10);
    } else if (/^\d$/.test(event.key)) {
      // Guard against unrealistic large values (max 999,999,999.99 = 99999999999 cents)
      if (this.currencyCents < 9_999_999_99) {
        this.currencyCents = this.currencyCents * 10 + parseInt(event.key, 10);
      }
    } else {
      // Ignore any other key
      return;
    }

    this.value = this.currencyCents === 0 ? '' : (this.currencyCents / 100).toFixed(this.decimalPlaces);
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  /**
   * Integer keydown handler to prevent invalid characters
   * Only allows: digits, backspace, delete, arrow keys, tab, minus sign
   */
  onIntegerKeydown(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    // Allow: Ctrl/Cmd+A, Ctrl/Cmd+C, Ctrl/Cmd+V, Ctrl/Cmd+X
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    // Allow: navigation keys
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Allow: minus sign at the beginning
    if (event.key === '-' && (event.target as HTMLInputElement).selectionStart === 0) {
      return;
    }

    // Prevent: anything that's not a digit
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let inputValue = target.value;

    // For currency/decimal, strip RM prefix if user pastes formatted value
    if (this.inputType === 'currency' || this.inputType === 'decimal') {
      inputValue = inputValue.replace(/RM\s?/g, '').replace(/,/g, '').trim();
    }

    // Format the input (strictly limits decimals)
    inputValue = this.formatValue(inputValue);

    // Validate the input
    if (!this.validateInput(inputValue) && inputValue !== '') {
      // Revert to last valid value
      target.value = this.value;
      return;
    }

    // Store raw numeric value
    this.value = inputValue;

    // Clear any pending debounce
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (this.debounceMs > 0) {
      // Emit after debounce
      this.debounceTimer = setTimeout(() => {
        this.onChange(this.value);
        this.valueChange.emit(this.value);
      }, this.debounceMs);
    } else {
      // Emit immediately
      this.onChange(this.value);
      this.valueChange.emit(this.value);
    }
  }

  onBlur(): void {
    this.onTouched();

    // Format on blur (especially for currency)
    if (this.inputType === 'currency' && this.value) {
      // Ensure currency has 2 decimal places
      const numValue = parseFloat(this.value);
      if (!isNaN(numValue)) {
        this.value = numValue.toFixed(this.decimalPlaces);
        this.onChange(this.value);
      }
    }

    this.blur.emit();
  }

  onEnter(): void {
    this.enter.emit(this.value);
  }
}
