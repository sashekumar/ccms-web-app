import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
  OnChanges,
  SimpleChanges,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Represents a single option within the dropdown list.
 */
export interface DropdownOption {
  /** The underlying value emitted on selection (string or number). */
  value: string | number;
  /** Human-readable label displayed in the list and trigger. */
  label: string;
  /** When true the option is rendered but cannot be selected. */
  disabled?: boolean;
}

/**
 * Reusable searchable dropdown / select component.
 *
 * When the number of options exceeds `searchThreshold` (default: 10) a search
 * box is automatically rendered inside the panel so the user can filter items.
 *
 * Implements `ControlValueAccessor` so it integrates transparently with both
 * template-driven and reactive forms.
 *
 * @example – basic usage (template-driven)
 * ```html
 * <app-dropdown
 *   [options]="statusOptions"
 *   label="Status"
 *   placeholder="Select status"
 *   [clearable]="true"
 *   (selectionChange)="onStatusChange($event)">
 * </app-dropdown>
 * ```
 *
 * @example – reactive form binding
 * ```html
 * <app-dropdown [options]="hospitals" [formControl]="hospitalCtrl"></app-dropdown>
 * ```
 */
@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true,
    },
  ],
  template: `
    <div class="w-full">
      <!-- Label -->
      <label
        *ngIf="label"
        [for]="triggerId"
        class="block text-sm font-medium text-gray-700 mb-1 select-none"
      >
        {{ label
        }}<span *ngIf="required" class="text-red-500 ml-0.5" aria-hidden="true">*</span>
      </label>

      <!-- Trigger + Panel wrapper -->
      <div class="relative">
        <!-- ── Trigger button ─────────────────────────────────────────────── -->
        <button
          [id]="triggerId"
          type="button"
          [disabled]="disabled"
          [class]="triggerClasses"
          (click)="toggle()"
          [attr.aria-expanded]="isOpen"
          [attr.aria-haspopup]="'listbox'"
        >
          <!-- Selected label or placeholder -->
          <span
            class="flex-1 truncate text-left leading-none"
            [class.text-gray-400]="!selectedOption"
          >
            {{ selectedOption ? selectedOption.label : placeholder }}
          </span>

          <!-- Trailing controls: clear + chevron -->
          <span class="flex items-center gap-0.5 flex-shrink-0 ml-2">
            <!-- Clear button (only when clearable & something is selected) -->
            <span
              *ngIf="clearable && selectedOption && !disabled"
              class="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear selection"
              role="button"
              (click)="clear($event)"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>

            <!-- Animated chevron -->
            <svg
              class="w-4 h-4 text-gray-400 transition-transform duration-200"
              [class.rotate-180]="isOpen"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
        </button>

        <!-- ── Dropdown panel ─────────────────────────────────────────────── -->
        <div
          *ngIf="isOpen"
          role="listbox"
          class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
          [style.maxHeight]="'280px'"
          [style.display]="'flex'"
          [style.flexDirection]="'column'"
        >
          <!-- Search box (auto-shown when options exceed searchThreshold) -->
          <div *ngIf="showSearch" class="p-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <div class="relative">
              <svg
                class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clip-rule="evenodd"
                />
              </svg>
              <input
                #searchInput
                type="text"
                [placeholder]="searchPlaceholder"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange($event)"
                class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
                (click)="$event.stopPropagation()"
                (keydown.escape)="close()"
                (keydown.arrowDown)="focusOption(0, $event)"
              />
            </div>
          </div>

          <!-- Options list -->
          <ul
            *ngIf="filteredOptions.length > 0; else noResults"
            class="overflow-y-auto flex-1"
          >
            <li
              *ngFor="let option of filteredOptions; let i = index"
              [attr.role]="'option'"
              [attr.aria-selected]="option.value === selectedOption?.value"
              [attr.data-index]="i"
              [class]="getOptionClasses(option)"
              (click)="select(option)"
              (keydown)="onOptionKeyDown($event, option, i)"
              [tabindex]="option.disabled ? -1 : 0"
            >
              <span class="flex-1 truncate">{{ option.label }}</span>

              <!-- Tick mark for the currently selected item -->
              <svg
                *ngIf="option.value === selectedOption?.value"
                class="w-4 h-4 text-primary-700 flex-shrink-0 ml-2"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clip-rule="evenodd"
                />
              </svg>
            </li>
          </ul>

          <!-- Empty-state when search yields no results -->
          <ng-template #noResults>
            <div class="px-4 py-6 text-center text-sm text-gray-400 flex-1">
              <svg
                class="w-8 h-8 mx-auto mb-2 text-gray-300"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ noResultsText }}
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Validation / hint messages -->
      <p *ngIf="error" class="mt-1 text-xs text-red-600 flex items-center gap-1">
        <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
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
export class DropdownComponent implements ControlValueAccessor, OnChanges {
  // ── Inputs ────────────────────────────────────────────────────────────────

  /** Array of selectable options. */
  @Input() options: DropdownOption[] = [];

  /** Optional label rendered above the trigger button. */
  @Input() label = '';

  /** Placeholder text shown when nothing is selected. */
  @Input() placeholder = 'Select an option';

  /** Disables the component when true. */
  @Input() disabled = false;

  /** Marks the field as required (adds a red asterisk to the label). */
  @Input() required = false;

  /**
   * Minimum number of options that triggers the inline search box.
   * Defaults to 10.
   */
  @Input() searchThreshold = 10;

  /** Placeholder text inside the search input. */
  @Input() searchPlaceholder = 'Search…';

  /** Message displayed when the search filter produces no results. */
  @Input() noResultsText = 'No results found';

  /** When true, a clear (×) button is shown allowing the user to deselect. */
  @Input() clearable = false;

  /** HTML id forwarded to the trigger `<button>`. Auto-generated when omitted. */
  @Input() id = '';

  /** Validation error message rendered below the trigger. */
  @Input() error = '';

  /** Helper/hint text rendered below the trigger (hidden when error is set). */
  @Input() hint = '';

  // ── Outputs ───────────────────────────────────────────────────────────────

  /** Emits the selected `DropdownOption` (or `null` when cleared). */
  @Output() selectionChange = new EventEmitter<DropdownOption | null>();

  /** Emits when the dropdown panel opens. */
  @Output() opened = new EventEmitter<void>();

  /** Emits when the dropdown panel closes. */
  @Output() closed = new EventEmitter<void>();

  /** Emits the current search term on every keystroke inside the search box. */
  @Output() searchChanged = new EventEmitter<string>();

  // ── Internal state ────────────────────────────────────────────────────────

  isOpen = false;
  searchTerm = '';
  selectedOption: DropdownOption | null = null;

  @ViewChild('searchInput') private searchInputRef?: ElementRef<HTMLInputElement>;

  /** Stable id used for the `[for]` / `[id]` binding. */
  private readonly _internalId = `dropdown-${Math.random().toString(36).substring(2, 9)}`;

  /**
   * Holds the last value passed via `writeValue()` so it can be resolved
   * against options that are loaded asynchronously after binding.
   */
  private pendingValue: string | number | null = null;

  private onChangeFn: (value: string | number | null) => void = () => {};
  private onTouchedFn: () => void = () => {};

  constructor(private readonly elementRef: ElementRef) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    // Re-resolve the selected option whenever the options array is (re)set,
    // which handles async data loading scenarios common in forms.
    if (changes['options'] && this.pendingValue != null) {
      this.selectedOption =
        this.options.find((opt) => opt.value === this.pendingValue) ?? null;
    }
  }

  // ── Computed helpers ──────────────────────────────────────────────────────

  get triggerId(): string {
    return this.id || this._internalId;
  }

  /** True when the number of options is above the auto-search threshold. */
  get showSearch(): boolean {
    return this.options.length > this.searchThreshold;
  }

  /** Options filtered by the current search term (case-insensitive). */
  get filteredOptions(): DropdownOption[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.options;
    return this.options.filter((opt) => opt.label.toLowerCase().includes(term));
  }

  get triggerClasses(): string {
    const base =
      'relative w-full flex items-center justify-between px-3 py-0 h-[36px] text-sm text-left bg-white border rounded-lg transition-all duration-150 focus:outline-none';

    if (this.disabled) {
      return `${base} border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-70`;
    }
    if (this.error) {
      return `${base} border-red-400 text-gray-700 hover:border-red-500 focus:ring-2 focus:ring-red-200 cursor-pointer`;
    }
    if (this.isOpen) {
      return `${base} border-primary-500 ring-2 ring-primary-200 text-gray-700 cursor-pointer`;
    }
    return `${base} border-gray-300 text-gray-700 hover:border-primary-400 cursor-pointer`;
  }

  getOptionClasses(option: DropdownOption): string {
    const base =
      'flex items-center justify-between px-3 py-2 text-sm transition-colors duration-100 select-none';

    if (option.disabled) {
      return `${base} text-gray-300 cursor-not-allowed`;
    }
    if (option.value === this.selectedOption?.value) {
      return `${base} bg-primary-50 text-primary-700 font-medium cursor-pointer`;
    }
    return `${base} text-gray-700 hover:bg-gray-50 cursor-pointer`;
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  /** Close the panel when clicking outside the component. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    this.isOpen = true;
    this.searchTerm = '';
    this.opened.emit();

    // Auto-focus the search input (when visible) after the view renders.
    if (this.showSearch) {
      setTimeout(() => this.searchInputRef?.nativeElement.focus(), 0);
    }
  }

  close(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.searchTerm = '';
      this.onTouchedFn();
      this.closed.emit();
    }
  }

  select(option: DropdownOption): void {
    if (option.disabled) return;
    this.selectedOption = option;
    this.pendingValue = option.value;
    this.onChangeFn(option.value);
    this.selectionChange.emit(option);
    this.close();
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.selectedOption = null;
    this.pendingValue = null;
    this.onChangeFn(null);
    this.selectionChange.emit(null);
  }

  onSearchChange(term: string): void {
    this.searchChanged.emit(term);
  }

  /** Arrow-key navigation on individual option elements. */
  onOptionKeyDown(event: KeyboardEvent, option: DropdownOption, index: number): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.select(option);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusOption(index + 1, event);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusOption(index - 1, event);
        break;
      case 'Escape':
        this.close();
        break;
    }
  }

  /** Move keyboard focus to the option at the given index (clamped to bounds). */
  focusOption(index: number, event?: Event): void {
    event?.preventDefault();
    const items = this.elementRef.nativeElement.querySelectorAll(
      '[role="option"]:not([tabindex="-1"])',
    ) as NodeListOf<HTMLElement>;
    if (!items.length) return;
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    items[clamped]?.focus();
  }

  // ── ControlValueAccessor ──────────────────────────────────────────────────

  writeValue(value: string | number | null): void {
    this.pendingValue = value;
    this.selectedOption =
      value != null ? (this.options.find((opt) => opt.value === value) ?? null) : null;
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
