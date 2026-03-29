import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant =
  | 'primary'    // brand gradient (navy blue) — use for main actions
  | 'secondary'  // white outlined — use for cancel / back
  | 'danger'     // red — destructive actions
  | 'success'    // green — confirm / approve
  | 'warn'       // amber — caution actions
  | 'ghost'      // transparent text-only — low-emphasis
  | 'outline'    // bordered brand-color — alternative primary
  | 'custom';    // no preset styles; supply via [customClass] / [customBg]

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonRounded = 'sm' | 'md' | 'lg' | 'full';

/**
 * Reusable button component aligned to the application's brand color scheme.
 *
 * Primary buttons use the navy gradient (from-primary-800 to-primary-700)
 * matching the standard "Add / Submit / Edit" buttons across all modules.
 *
 * @example Basic
 * ```html
 * <app-button variant="primary" (click)="save()">Save</app-button>
 * ```
 *
 * @example With icon
 * ```html
 * <app-button iconLeft="fas fa-plus" variant="primary">Add User</app-button>
 * ```
 *
 * @example Custom colour
 * ```html
 * <app-button variant="custom" customBg="#7c3aed" customTextColor="#fff">
 *   Custom
 * </app-button>
 * ```
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      [ngStyle]="buttonStyle"
    >
      <!-- SVG spinner (replaces content when loading) -->
      <svg
        *ngIf="loading"
        class="animate-spin shrink-0"
        [class]="spinnerClass"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>

      <!-- Optional left icon -->
      <i *ngIf="iconLeft && !loading" [class]="iconLeft + ' ' + iconClass + ' shrink-0'"></i>

      <!-- Label / projected content -->
      <ng-content></ng-content>

      <!-- Optional right icon -->
      <i *ngIf="iconRight && !loading" [class]="iconRight + ' ' + iconClass + ' shrink-0'"></i>
    </button>
  `,
})
export class ButtonComponent {

  // ── Core inputs ───────────────────────────────────────────────────────────

  /** HTML button type */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * Visual style preset.
   * - `primary`   — navy gradient, main actions (Save, Submit, Add)
   * - `secondary` — white + border, cancel / back / secondary actions
   * - `danger`    — red solid, destructive actions (Delete, Remove)
   * - `success`   — green solid, confirm / approve
   * - `warn`      — amber solid, caution actions
   * - `ghost`     — transparent text-only, low-emphasis actions
   * - `outline`   — brand-colour border on transparent bg
   * - `custom`    — no preset; use [customClass], [customBg], [customTextColor]
   */
  @Input() variant: ButtonVariant = 'primary';

  /** Button size. Affects padding and font size. Default: `md` */
  @Input() size: ButtonSize = 'md';

  /** Border-radius preset. Default: `lg` */
  @Input() rounded: ButtonRounded = 'lg';

  /** Disables the button and applies muted styling */
  @Input() disabled = false;

  /**
   * Shows an animated spinner and disables the button.
   * Existing icons are hidden while loading.
   */
  @Input() loading = false;

  /** Makes the button fill its parent container width */
  @Input() fullWidth = false;

  // ── Icon inputs ───────────────────────────────────────────────────────────

  /**
   * Icon class(es) rendered before the label.
   * Accepts any icon library class string, e.g. `"fas fa-plus"` or `"pi pi-save"`.
   */
  @Input() iconLeft?: string;

  /**
   * Icon class(es) rendered after the label.
   */
  @Input() iconRight?: string;

  // ── Custom colour overrides ───────────────────────────────────────────────

  /**
   * Extra Tailwind classes appended after all preset classes.
   * Useful for one-off tweaks without switching to `variant="custom"`.
   */
  @Input() customClass?: string;

  /**
   * Any CSS-valid background colour value (hex, rgb, hsl, etc.).
   * Applied as an inline style — takes precedence over preset backgrounds.
   * Most useful with `variant="custom"`.
   * @example  customBg="#7c3aed"
   */
  @Input() customBg?: string;

  /**
   * Any CSS-valid text colour value.
   * Applied as an inline style.
   * @example  customTextColor="#fff"
   */
  @Input() customTextColor?: string;

  // ── Derived class / style getters ─────────────────────────────────────────

  get buttonStyle(): Record<string, string> {
    const s: Record<string, string> = {};
    if (this.customBg)        s['backgroundColor'] = this.customBg;
    if (this.customTextColor) s['color']            = this.customTextColor;
    return s;
  }

  get buttonClasses(): string {
    const roundedMap: Record<ButtonRounded, string> = {
      sm:   'rounded',
      md:   'rounded-md',
      lg:   'rounded-lg',
      full: 'rounded-full',
    };

    const base = [
      'inline-flex items-center justify-center gap-1.5',
      'font-medium leading-none',
      'select-none transition-all duration-150',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      roundedMap[this.rounded],
    ].join(' ');

    // Variant colour preset
    const variantMap: Record<ButtonVariant, string> = {
      primary:
        'bg-gradient-to-r from-primary-800 to-primary-700 text-white shadow-sm ' +
        'hover:opacity-90 active:opacity-80 focus:ring-primary-700',
      secondary:
        'bg-white border border-gray-300 text-gray-700 shadow-sm ' +
        'hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-400',
      danger:
        'bg-red-600 text-white shadow-sm ' +
        'hover:bg-red-700 active:bg-red-800 focus:ring-red-500',
      success:
        'bg-green-600 text-white shadow-sm ' +
        'hover:bg-green-700 active:bg-green-800 focus:ring-green-500',
      warn:
        'bg-amber-500 text-white shadow-sm ' +
        'hover:bg-amber-600 active:bg-amber-700 focus:ring-amber-400',
      ghost:
        'bg-transparent text-gray-600 ' +
        'hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-400',
      outline:
        'bg-transparent border border-primary-700 text-primary-700 ' +
        'hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-700',
      custom: '',
    };

    // Size — padding intentionally compact to match app-wide button sizing
    const sizeMap: Record<ButtonSize, string> = {
      xs: 'px-2.5 py-1    text-xs',
      sm: 'px-3   py-1.5  text-xs',
      md: 'px-4   py-2    text-sm',
      lg: 'px-5   py-2.5  text-sm',
      xl: 'px-6   py-3    text-base',
    };

    const width     = this.fullWidth ? 'w-full' : '';
    const stateOff  = (this.disabled || this.loading) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';
    const extra     = this.customClass ?? '';

    return [base, variantMap[this.variant], sizeMap[this.size], width, stateOff, extra]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  get spinnerClass(): string {
    return { xs: 'h-3 w-3', sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-4 w-4', xl: 'h-5 w-5' }[this.size];
  }

  get iconClass(): string {
    return { xs: 'text-xs', sm: 'text-xs', md: 'text-sm', lg: 'text-sm', xl: 'text-base' }[this.size];
  }
}

