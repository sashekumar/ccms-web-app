import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { DropdownComponent, DropdownOption } from '../dropdown/dropdown.component';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { TextInputComponent, TextInputType } from '../text-input/text-input.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ToggleComponent } from '../toggle/toggle.component';
import { CurrencyMyrPipe } from '../../../pipes/currency-myr.pipe';
import { HasPermissionDirective } from '../../../directives/permissions/has-permission.directive';

// ── Public Types ─────────────────────────────────────────────────────────────

/** Colour variants for badge cells */
export type BadgeColor = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' | 'indigo' | 'orange' | 'cyan';

/** How a single badge value maps to a label + colour */
export interface BadgeConfig {
  label: string;
  color: BadgeColor;
}

/**
 * Column definition.
 *
 * @example – text column
 * ```ts
 * { key: 'username', label: 'Username' }
 * ```
 *
 * @example – avatar column (shows initials + name + subtitle)
 * ```ts
 * { key: 'full_name', label: 'User', type: 'avatar', avatarSubKey: 'username', avatarSubPrefix: '@' }
 * ```
 *
 * @example – badge column
 * ```ts
 * { key: 'is_active', label: 'Status', type: 'badge', badgeMap: {
 *     true:  { label: 'Active',   color: 'green' },
 *     false: { label: 'Inactive', color: 'gray'  },
 *   }
 * }
 * ```
 *
 * @example – tags column (array of objects)
 * ```ts
 * { key: 'roles', label: 'Roles', type: 'tags', tagLabelKey: 'role_name' }
 * ```
 */
export interface DataTableColumn {
  /** Property key on the row object (dot-notation supported: 'address.city') */
  key: string;
  /** Column header label */
  label: string;
  /** Rendering type – defaults to 'text' */
  type?: 'text' | 'badge' | 'status' | 'tags' | 'avatar' | 'date' | 'number' | 'currency' | 'toggle';
  /** Text alignment – defaults to 'left' */
  align?: 'left' | 'center' | 'right';
  // ── avatar options ──
  /** Key of the sub-label shown below the avatar name (e.g., 'username') */
  avatarSubKey?: string;
  /** Optional prefix prepended to the sub-label value (e.g., '@') */
  avatarSubPrefix?: string;
  // ── badge options ──
  /** Maps raw cell value (stringified) → display label + colour */
  badgeMap?: Record<string, BadgeConfig>;
  // ── tags options ──
  /** Property of each tag object to use as its display label (default: 'label') */
  tagLabelKey?: string;
  /** BadgeColor for all tags in this column (default: 'blue') */
  tagColor?: BadgeColor;
  // ── toggle options ──
  /** Custom label for toggle active state (default: 'Active') */
  toggleActiveLabel?: string;
  /** Custom label for toggle inactive state (default: 'Inactive') */
  toggleInactiveLabel?: string;
  // ── date options ──
  /** Angular DatePipe format string (default: 'dd MMM yyyy') */
  dateFormat?: string;
  /** Text shown when the value is null / undefined / empty (default: '—') */
  emptyText?: string;
  /** Allow this column to be sorted. Clicking the header emits sortChange and resets to page 1. */
  sortable?: boolean;
}

/** A single row-level action button */
export interface DataTableAction {
  /** Unique identifier emitted in rowAction output */
  id: string;
  /** Tooltip / title attribute shown on hover */
  title: string;
  /**
   * Inner SVG `<path …>` markup for the icon.  Supply one or more `<path>` elements
   * as a raw string; they are rendered inside a 24×24 viewBox with stroke styling.
   */
  iconPath: string;
  /** Button colour variant */
  color: 'blue' | 'indigo' | 'red' | 'purple' | 'green' | 'gray' | 'yellow';
  /** Optional permission required to show this action (e.g., 'USER_MANAGEMENT.UPDATE') */
  permission?: string;
  /** Optional data-testid attribute for E2E testing */
  testId?: string;
}

/** A configurable filter control rendered above the table */
export interface DataTableFilter {
  /** Key used in the emitted FilterState object */
  key: string;
  /** Label shown above the control */
  label: string;
  /** 'search' renders a text input; 'select' renders a Dropdown; 'date' renders a DatePicker */
  type: 'search' | 'select' | 'date';
  /** Placeholder text for search inputs and dropdowns */
  placeholder?: string;
  /** Options for select filters */
  options?: Array<{ value: any; label: string }>;
  /** Min date for date filters (for date-picker) */
  minDate?: Date | null;
  /** Max date for date filters (for date-picker) */
  maxDate?: Date | null;
  /** Input type for search filters (default: 'string') — can be 'string', 'number', 'integer', 'decimal', 'currency' */
  inputType?: TextInputType;
  /** Maximum decimal places for decimal and currency types (default: 2) */
  decimalPlaces?: number;
}

/** An optional KPI stat card shown above the filter bar */
export interface DataTableStat {
  label: string;
  value: number | string;
  /** SVG <path …> markup */
  iconPath: string;
  /** Tailwind bg class for the icon container (e.g., 'bg-blue-100') */
  iconBg: string;
  /** Tailwind text class for the icon (e.g., 'text-blue-600') */
  iconColor: string;
}

/** Pagination state passed in as an input */
export interface DataTablePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Active sort applied to the table */
export interface DataTableSort {
  /** Column key being sorted */
  column: string;
  direction: 'asc' | 'desc';
}

/** The shape of the query state emitted on every filter, page, or sort change */
export type DataTableFilterState = Record<string, any> & {
  page: number;
  limit: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
};

/** Emitted when the user clicks a row action button */
export interface DataTableRowActionEvent {
  action: string;
  row: any;
}

// ── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, DropdownComponent, DatePickerComponent, TextInputComponent, StatusBadgeComponent, ToggleComponent, CurrencyMyrPipe, HasPermissionDirective],
  providers: [DatePipe],
  templateUrl: './data-table.component.html',
})
export class DataTableComponent implements OnInit, OnDestroy, OnChanges {

  // ── Inputs ───────────────────────────────────────────────────────────────

  /** Column definitions — see DataTableColumn for all options (type, sortable, badgeMap, …) */
  @Input() columns: DataTableColumn[] = [];
  /** Data rows for the current page */
  @Input() rows: any[] = [];
  /** Filter controls displayed above the table (search / select types) */
  @Input() filters: DataTableFilter[] = [];
  /** Row action icon buttons rendered in the last column */
  @Input() rowActions: DataTableAction[] = [];
  /** Pagination state; update this whenever filterChange fires */
  @Input() pagination: DataTablePagination = { page: 1, limit: 10, total: 0, totalPages: 0 };
  /** When true, hides the table and shows a loading indicator */
  @Input() loading = false;
  /** Green banner shown above the table */
  @Input() successMessage = '';
  /** Red banner shown above the table */
  @Input() errorMessage = '';
  /** Page-size options shown in the pagination footer */
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  /** Row identifier key used for trackBy (default: 'id') */
  @Input() idKey = 'id';
  /** SVG path for the empty-state illustration */
  @Input() emptyIconPath = 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
  /** Heading text in the empty-state block */
  @Input() emptyMessage = 'No results found';
  /** Supporting text below the empty-state heading */
  @Input() emptySubMessage = 'Try adjusting your search or filter criteria.';

  // ── Outputs ──────────────────────────────────────────────────────────────

  /** Emits the full query state (filters + page + limit + optional sortBy/sortDir) on every change */
  @Output() filterChange = new EventEmitter<DataTableFilterState>();
  /** Emits the new sort state when the user clicks a sortable column header; null = sort cleared */
  @Output() sortChange = new EventEmitter<DataTableSort | null>();
  /** Emits { action, row } when the user clicks a row action button */
  @Output() rowAction = new EventEmitter<DataTableRowActionEvent>();
  /** Emits { row, column, newValue } when a toggle column is clicked */
  @Output() cellToggle = new EventEmitter<{ row: any; column: DataTableColumn; newValue: boolean }>();

  // ── Internal state ───────────────────────────────────────────────────────

  filterValues: Record<string, any> = {};
  currentLimit = 10;
  currentSort: DataTableSort | null = null;

  private searchSubject$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.currentLimit = this.pagination.limit;

    // Debounce search inputs (300 ms)
    this.searchSubject$
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => this.emit(1));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pagination']) {
      this.currentLimit = this.pagination.limit;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  get filterGridClass(): string {
    const count = this.filters.length;
    if (count <= 2) return 'md:grid-cols-2';
    if (count === 3) return 'md:grid-cols-3';
    return 'md:grid-cols-4';
  }

  // ── Filter handlers ───────────────────────────────────────────────────────

  onSearchChange(): void {
    this.searchSubject$.next();
  }

  onSelectFilterChange(filterKey: string, option: DropdownOption | null): void {
    this.filterValues[filterKey] = option?.value;
    this.emit(1);
  }

  onDateFilterChange(filterKey: string, value: any): void {
    this.filterValues[filterKey] = value;
    this.emit(1);
  }


  onLimitChange(): void {
    this.emit(1);
  }

  // ── Sort handlers ─────────────────────────────────────────────────────────

  onSortColumn(col: DataTableColumn): void {
    if (!col.sortable) return;
    if (this.currentSort?.column === col.key) {
      // Second click flips direction; third click clears the sort
      this.currentSort = this.currentSort.direction === 'asc'
        ? { column: col.key, direction: 'desc' }
        : null;
    } else {
      this.currentSort = { column: col.key, direction: 'asc' };
    }
    this.sortChange.emit(this.currentSort);
    this.emit(1);
  }

  getSortState(col: DataTableColumn): 'asc' | 'desc' | 'none' {
    if (!col.sortable) return 'none';
    if (this.currentSort?.column !== col.key) return 'none';
    return this.currentSort.direction;
  }

  // ── Toggle cell handler ───────────────────────────────────────────────────

  onToggleCellValue(newValue: boolean, row: any, col: DataTableColumn): void {
    this.cellToggle.emit({ row, column: col, newValue });
  }

  // ── Pagination helpers ────────────────────────────────────────────────────

  previousPage(): void {
    if (this.pagination.page > 1) {
      this.goToPage(this.pagination.page - 1);
    }
  }

  nextPage(): void {
    if (this.pagination.page < this.pagination.totalPages) {
      this.goToPage(this.pagination.page + 1);
    }
  }

  goToPage(page: number): void {
    this.emit(page);
  }

  getStartItem(): number {
    return (this.pagination.page - 1) * this.pagination.limit + 1;
  }

  getEndItem(): number {
    return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total);
  }

  getPageNumbers(): number[] {
    const total = this.pagination.totalPages;
    const current = this.pagination.page;
    const pages: number[] = [];
    const delta = 2;
    const left = Math.max(1, current - delta);
    const right = Math.min(total, current + delta);
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  }

  // ── Cell value helpers ────────────────────────────────────────────────────

  /** Reads a cell value from a row, supporting dot-notation keys */
  getCellValue(row: any, key: string): any {
    if (!row || !key) return undefined;
    return key.split('.').reduce((obj, k) => obj?.[k], row);
  }

  getInitials(value: any): string {
    const str = String(value ?? '');
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  }

  getBadge(col: DataTableColumn, row: any): BadgeConfig | null {
    if (!col.badgeMap) return null;
    const raw = this.getCellValue(row, col.key);
    return col.badgeMap[String(raw)] ?? null;
  }

  getBadgeClasses(color: BadgeColor): string {
    const map: Record<BadgeColor, string> = {
      green:  'bg-green-100 text-green-800',
      red:    'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      blue:   'bg-blue-100 text-blue-800',
      gray:   'bg-gray-100 text-gray-800',
      purple: 'bg-purple-100 text-purple-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      orange: 'bg-orange-100 text-orange-800',
      cyan:   'bg-cyan-100 text-cyan-800',
    };
    return map[color] ?? map['gray'];
  }

  // ── Style helpers ─────────────────────────────────────────────────────────

  getAlignClass(align: DataTableColumn['align'] = 'left'): string {
    const map = { left: 'text-left', center: 'text-center', right: 'text-right' };
    return map[align ?? 'left'];
  }

  getCellWrapClass(col: DataTableColumn): string {
    if (col.type === 'avatar' || col.type === 'tags') return '';
    return 'whitespace-nowrap';
  }

  getActionButtonClasses(color: DataTableAction['color'], isLast: boolean): string {
    const colorMap: Record<DataTableAction['color'], string> = {
      blue:   'text-blue-600 hover:text-blue-900',
      indigo: 'text-indigo-600 hover:text-indigo-900',
      red:    'text-red-600 hover:text-red-900',
      purple: 'text-purple-600 hover:text-purple-900',
      green:  'text-green-600 hover:text-green-900',
      gray:   'text-gray-500 hover:text-gray-800',
      yellow: 'text-yellow-600 hover:text-yellow-900',
    };
    return (isLast ? '' : 'mr-3 ') + colorMap[color];
  }

  // ── TrackBy ───────────────────────────────────────────────────────────────

  trackByRow(index: number, row: any): any {
    return row[this.idKey] ?? index;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private emit(page: number): void {
    const state: DataTableFilterState = {
      ...this.filterValues,
      page,
      limit: this.currentLimit,
    };
    if (this.currentSort) {
      state['sortBy'] = this.currentSort.column;
      state['sortDir'] = this.currentSort.direction;
    }
    this.filterChange.emit(state);
  }
}
