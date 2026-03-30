import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Reusable checkbox component for boolean inputs.
 *
 * Features:
 * - Simple boolean toggle with label
 * - Customizable font size and weight for label
 * - Optional secondary label (e.g., codes) in grey
 * - Disabled state support
 * - Implements ControlValueAccessor for reactive/template-driven forms
 * - Consistent styling aligned with other form components
 * - Optional description text
 *
 * @example – basic usage
 * ```html
 * <app-checkbox
 *   label="Active"
 *   [(ngModel)]="isActive">
 * </app-checkbox>
 * ```
 *
 * @example – with secondary label and custom styling
 * ```html
 * <app-checkbox
 *   label="View Contacts"
 *   secondaryLabel="(VIEW_CONTACTS)"
 *   labelSize="sm"
 *   labelWeight="medium"
 *   [(ngModel)]="isSelected">
 * </app-checkbox>
 * ```
 *
 * @example – with description
 * ```html
 * <app-checkbox
 *   label="Enable notifications"
 *   description="Receive email alerts when items require attention"
 *   [(ngModel)]="notificationsEnabled">
 * </app-checkbox>
 * ```
 *
 * @example – disabled state
 * ```html
 * <app-checkbox
 *   label="Archived"
 *   [(ngModel)]="archived"
 *   [disabled]="true">
 * </app-checkbox>
 * ```
 *
 * @example – reactive form binding
 * ```html
 * <app-checkbox label="Active" [formControl]="isActiveCtrl"></app-checkbox>
 * ```
 */
@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex items-center">
      <input
        [id]="inputId"
        type="checkbox"
        [checked]="value"
        [disabled]="disabled"
        [class]="checkboxClasses"
        (change)="onChange($event)"
        (blur)="onBlur()"
      />
      <div *ngIf="label || description" class="ml-2">
        <label *ngIf="label" [for]="inputId" [class]="labelClasses">
          <span [class]="labelTextClasses">{{ label }}</span>
          <span *ngIf="secondaryLabel" [class]="secondaryLabelClasses">{{ secondaryLabel }}</span>
          <span *ngIf="required" class="text-red-500 ml-0.5" aria-hidden="true">*</span>
        </label>
        <p *ngIf="description" class="text-xs text-gray-500 mt-0.5">{{ description }}</p>
      </div>
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
export class CheckboxComponent implements ControlValueAccessor {
  // ── Inputs ────────────────────────────────────────────────────────────────

  /** The checkbox value (for ngModel or programmatic access) */
  @Input() value = false;

  /** Label text rendered next to the checkbox */
  @Input() label = '';

  /** Optional secondary label text (e.g., code or identifier) shown in grey */
  @Input() secondaryLabel = '';

  /** Optional description text rendered below the label */
  @Input() description = '';

  /** Font size for the label (default: 'sm' to match old UI) */
  @Input() labelSize: 'xs' | 'sm' | 'base' | 'lg' = 'sm';

  /** Font weight for the label (default: 'normal' for regular text) */
  @Input() labelWeight: 'normal' | 'medium' | 'semibold' | 'bold' = 'normal';

  /** Disables the checkbox when true */
  @Input() disabled = false;

  /** Marks the field as required (adds a red asterisk to the label) */
  @Input() required = false;

  /** HTML id forwarded to the checkbox. Auto-generated when omitted */
  @Input() id = '';

  // ── Outputs ───────────────────────────────────────────────────────────────

  /** Emits whenever the checkbox value changes */
  @Output() valueChange = new EventEmitter<boolean>();

  /** Emits when the checkbox loses focus */
  @Output() blur = new EventEmitter<void>();

  // ── State ─────────────────────────────────────────────────────────────────

  private _internalId = `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  // ── Computed helpers ──────────────────────────────────────────────────────

  get inputId(): string {
    return this.id || this._internalId;
  }

  get checkboxClasses(): string {
    const base =
      'h-4 w-4 rounded border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0';

    if (this.disabled) {
      return `${base} border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-70`;
    }

    return `${base} border-gray-300 text-primary-600 hover:border-primary-500 focus:ring-primary-200 cursor-pointer`;
  }

  get labelClasses(): string {
    return 'select-none cursor-pointer flex items-center flex-1';
  }

  get labelTextClasses(): string {
    const sizeClass = `text-${this.labelSize}`;
    const weightClass = this.labelWeight === 'normal' ? '' : `font-${this.labelWeight}`;
    const colorClass = this.disabled ? 'text-gray-400' : 'text-gray-900';
    return `${sizeClass} ${weightClass} ${colorClass}`.trim();
  }

  get secondaryLabelClasses(): string {
    const sizeClass = `text-${this.labelSize}`;
    const colorClass = this.disabled ? 'text-gray-400' : 'text-gray-500';
    return `${sizeClass} ${colorClass} ml-1`;
  }

  // ── ControlValueAccessor ──────────────────────────────────────────────────

  private onChangeCallback: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    this.value = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  onChange(event: Event): void {
    if (this.disabled) return;

    const checked = (event.target as HTMLInputElement).checked;
    this.value = checked;
    this.onChangeCallback(checked);
    this.valueChange.emit(checked);
  }

  onBlur(): void {
    this.onTouched();
    this.blur.emit();
  }
}
