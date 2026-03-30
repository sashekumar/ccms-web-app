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

/**
 * Reusable textarea component for multi-line text input.
 *
 * Features:
 * - Multi-line text input with configurable rows
 * - Optional character counter
 * - Auto-resize option
 * - Label, placeholder, hint, and error message support
 * - Disabled state support
 * - Implements ControlValueAccessor for reactive/template-driven forms
 * - Consistent styling aligned with TextInput and Dropdown components
 *
 * @example – basic usage
 * ```html
 * <app-text-area
 *   label="Description"
 *   placeholder="Enter description…"
 *   [(ngModel)]="description"
 *   [rows]="3">
 * </app-text-area>
 * ```
 *
 * @example – with character counter
 * ```html
 * <app-text-area
 *   label="Notes"
 *   [(ngModel)]="notes"
 *   [maxLength]="500"
 *   [showCounter]="true">
 * </app-text-area>
 * ```
 *
 * @example – auto-resize
 * ```html
 * <app-text-area
 *   label="Comments"
 *   [(ngModel)]="comments"
 *   [autoResize]="true"
 *   [minRows]="2"
 *   [maxRows]="10">
 * </app-text-area>
 * ```
 *
 * @example – reactive form binding
 * ```html
 * <app-text-area [formControl]="descriptionCtrl"></app-text-area>
 * ```
 */
@Component({
  selector: 'app-text-area',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextAreaComponent),
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

      <!-- Textarea field -->
      <div class="relative">
        <textarea
          [id]="inputId"
          [value]="value"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [rows]="currentRows"
          [attr.maxlength]="maxLength > 0 ? maxLength : null"
          [class]="textareaClasses"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
        ></textarea>
      </div>

      <!-- Character counter -->
      <div *ngIf="showCounter && maxLength" class="mt-1 flex justify-between items-center text-xs">
        <p *ngIf="hint && !error" class="text-gray-500">{{ hint }}</p>
        <p [class]="counterClasses">
          {{ value.length }} / {{ maxLength }}
        </p>
      </div>

      <!-- Error/Hint text (without counter) -->
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
      <p *ngIf="hint && !error && !showCounter" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
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
export class TextAreaComponent implements ControlValueAccessor, OnChanges {
  // ── Inputs ────────────────────────────────────────────────────────────────

  /** The textarea value (for ngModel or programmatic access) */
  @Input() value = '';

  /** Optional label rendered above the textarea */
  @Input() label = '';

  /** Placeholder text shown inside the textarea */
  @Input() placeholder = '';

  /** Disables the textarea when true */
  @Input() disabled = false;

  /** Marks the field as required (adds a red asterisk to the label) */
  @Input() required = false;

  /** Validation error message rendered below the textarea */
  @Input() error = '';

  /** Helper/hint text rendered below the textarea */
  @Input() hint = '';

  /** HTML id forwarded to the textarea. Auto-generated when omitted */
  @Input() id = '';

  /** Number of visible text rows (default: 3) */
  @Input() rows = 3;

  /** Maximum character length (0 = unlimited) */
  @Input() maxLength = 0;

  /** Show character counter (only works when maxLength is set) */
  @Input() showCounter = false;

  /** Enable auto-resize based on content */
  @Input() autoResize = false;

  /** Minimum rows when auto-resize is enabled */
  @Input() minRows = 2;

  /** Maximum rows when auto-resize is enabled */
  @Input() maxRows = 10;

  // ── Outputs ───────────────────────────────────────────────────────────────

  /** Emits whenever the textarea value changes */
  @Output() valueChange = new EventEmitter<string>();

  /** Emits when the textarea loses focus */
  @Output() blur = new EventEmitter<void>();

  /** Emits when the textarea gains focus */
  @Output() focus = new EventEmitter<void>();

  // ── State ─────────────────────────────────────────────────────────────────

  currentRows = this.rows;
  private _internalId = `text-area-${Math.random().toString(36).substr(2, 9)}`;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && !changes['value'].firstChange) {
      this.onTouched();
    }
    if (changes['rows']) {
      this.currentRows = this.rows;
    }
  }

  // ── Computed helpers ──────────────────────────────────────────────────────

  get inputId(): string {
    return this.id || this._internalId;
  }

  get textareaClasses(): string {
    const base =
      'w-full px-3 py-2 text-sm bg-white border rounded-lg transition-all duration-150 focus:outline-none resize-y';

    if (this.disabled) {
      return `${base} border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-70`;
    }
    if (this.error) {
      return `${base} border-red-400 text-gray-700 hover:border-red-500 focus:ring-2 focus:ring-red-200`;
    }
    return `${base} border-gray-300 text-gray-700 hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200`;
  }

  get counterClasses(): string {
    if (!this.maxLength) return 'text-gray-500';
    
    const percentage = (this.value.length / this.maxLength) * 100;
    if (percentage >= 100) return 'text-red-600 font-medium';
    if (percentage >= 90) return 'text-orange-600 font-medium';
    return 'text-gray-500';
  }

  // ── ControlValueAccessor ──────────────────────────────────────────────────

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value ?? '';
    if (this.autoResize) {
      this.adjustRows();
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

  // ── Event handlers ────────────────────────────────────────────────────────

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;

    if (this.autoResize) {
      this.adjustRows();
    }

    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  onBlur(): void {
    this.onTouched();
    this.blur.emit();
  }

  onFocus(): void {
    this.focus.emit();
  }

  // ── Auto-resize logic ─────────────────────────────────────────────────────

  private adjustRows(): void {
    if (!this.autoResize) return;

    const lines = this.value.split('\n').length;
    this.currentRows = Math.max(this.minRows, Math.min(lines, this.maxRows));
  }
}
