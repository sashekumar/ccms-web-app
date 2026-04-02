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
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CalendarService, CalendarMonth, CalendarDay } from '../../../services/calendar.service';

/**
 * Date picker picker modes (what input the picker controls)
 */
export type DatePickerMode = 'date' | 'date-time' | 'month' | 'time' | 'range' | 'range-time';

/**
 * Internal picker view states
 */
type PickerViewMode = 'calendar' | 'year' | 'month';

/**
 * Reusable, user-friendly date picker component.
 *
 * Features:
 * - Multiple modes: date-only, date+time, month-only, time-only
 * - Min/max date range enforcement
 * - Keyboard navigation (arrows, enter, escape)
 * - ControlValueAccessor for reactive/template-driven forms
 * - Accessible (ARIA attributes, semantic HTML)
 * - ISO-format input/output (YYYY-MM-DD[THH:MM])
 *
 * @example – date mode
 * ```html
 * <app-date-picker
 *   mode="date"
 *   label="Admission Date"
 *   [minDate]="minDate"
 *   [maxDate]="maxDate"
 *   (dateChange)="onDateChange($event)"
 * ></app-date-picker>
 * ```
 *
 * @example – date-time mode
 * ```html
 * <app-date-picker
 *   mode="date-time"
 *   label="Incident DateTime"
 *   [formControl]="dateTimeCtrl"
 * ></app-date-picker>
 * ```
 */
@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
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

      <!-- Trigger Input + Modal -->
      <div class="relative">
        <!-- ── Input trigger (text field + icon) ────────────────────────────── -->
        <div class="relative">
          <input
            [id]="triggerId"
            type="text"
            [value]="inputDisplayValue"
            [placeholder]="placeholder"
            [disabled]="disabled"
            [class]="inputClasses"
            (click)="toggle()"
            (focus)="toggle()"
            readonly
            [attr.aria-label]="label || 'Date picker'"
          />

          <!-- Calendar icon (right side) -->
          <button
            type="button"
            [disabled]="disabled"
            class="absolute right-0 top-0 h-full px-3 hover:bg-gray-100 rounded-r-lg transition-colors text-gray-400"
            (click)="toggle()"
            (keydown.escape)="close()"
            [attr.aria-expanded]="isOpen"
          >
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v2H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v2H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- ── Background Overlay (Modal Effect) ────────────────────────────── -->
        <div
          *ngIf="isOpen"
          class="fixed inset-0 z-40 bg-black/30 transition-opacity duration-200"
          (click)="close()"
          [attr.aria-hidden]="true"
        ></div>

        <!-- ── Modal Panel (Larger, Centered, Spacious) ────────────────────── -->
        <div
          *ngIf="isOpen"
          role="dialog"
          [attr.aria-label]="'Date picker for ' + (label || 'date')"
          class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden modal-enter"
          (click)="$event.stopPropagation()"
        >
          <!-- ── Header: Year Selector Only ──────────────────────────────────────── -->
          <div class="bg-gradient-to-br from-primary-600 to-primary-700 px-6 py-6 text-white relative">
            <!-- Year Selector with Arrows at Edges -->
            <div class="flex items-center justify-between gap-6">
              <!-- Left Arrow -->
              <button
                type="button"
                (click)="changeYear(-1)"
                [disabled]="isYearDisabled('prev')"
                class="p-2 rounded-lg transition-colors flex-shrink-0"
                [class.hover:bg-primary-500]="!isYearDisabled('prev')"
                [class.opacity-50]="isYearDisabled('prev')"
                [class.cursor-not-allowed]="isYearDisabled('prev')"
                [attr.aria-label]="'Decrease year'"
              >
                <svg class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </button>

              <!-- Center Year Display (Clickable) -->
              <div class="text-center flex-1 relative min-w-max">
                <button
                  type="button"
                  (click)="toggleYearPicker()"
                  class="hover:bg-primary-500 rounded px-4 py-2 transition-colors w-full"
                  [attr.aria-label]="'Select year'"
                >
                  <div class="text-3xl font-bold">{{ currentYear }}</div>
                </button>
              </div>

              <!-- Right Arrow -->
              <button
                type="button"
                (click)="changeYear(1)"
                [disabled]="isYearDisabled('next')"
                class="p-2 rounded-lg transition-colors flex-shrink-0"
                [class.hover:bg-primary-500]="!isYearDisabled('next')"
                [class.opacity-50]="isYearDisabled('next')"
                [class.cursor-not-allowed]="isYearDisabled('next')"
                [attr.aria-label]="'Increase year'"
              >
                <svg class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- ── Year Picker Modal Overlay (When showYearPicker is true) ──────── -->
          <div
            *ngIf="showYearPicker"
            class="absolute inset-0 bg-black/20 flex items-center justify-center z-50 rounded-2xl"
            (click)="toggleYearPicker()"
          >
            <!-- Year Picker Modal Panel -->
            <div
              class="bg-white rounded-xl shadow-2xl w-64 max-h-80 overflow-hidden flex flex-col"
              (click)="$event.stopPropagation()"
            >
              <!-- Header -->
              <div class="bg-gradient-to-br from-primary-600 to-primary-700 px-6 py-4 text-white">
                <h3 class="text-center text-lg font-semibold">Select Year</h3>
              </div>
              
              <!-- Year Grid -->
              <div class="overflow-y-auto flex-1" #yearPickerScrollContainer>
                <div
                  #yearPickerContainer
                  class="grid grid-cols-3 gap-2 p-4"
                >
                  <button
                    [attr.data-year]="year"
                    type="button"
                    *ngFor="let year of getYearsRange()"
                    (click)="selectYear(year)"
                    [class]="year === currentYear ? 'bg-primary-600 text-white font-bold' : 'bg-gray-50 hover:bg-primary-100 text-gray-700 border border-gray-200'"
                    class="px-3 py-3 text-center transition-colors text-sm rounded-lg font-medium"
                  >
                    {{ year }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Month Picker Modal Overlay (When showMonthPicker is true) ──────── -->
          <div
            *ngIf="showMonthPicker"
            class="absolute inset-0 bg-black/20 flex items-center justify-center z-50 rounded-2xl"
            (click)="toggleMonthPicker()"
          >
            <!-- Month Picker Modal Panel -->
            <div
              class="bg-white rounded-xl shadow-2xl w-64 overflow-hidden flex flex-col"
              (click)="$event.stopPropagation()"
            >
              <!-- Header -->
              <div class="bg-gradient-to-br from-primary-600 to-primary-700 px-6 py-4 text-white">
                <h3 class="text-center text-lg font-semibold">Select Month</h3>
              </div>
              
              <!-- Month Grid -->
              <div class="p-4">
                <div class="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    *ngFor="let m of monthList; let i = index"
                    (click)="selectMonthFromPicker(i)"
                    [class]="i === currentMonth ? 'bg-primary-600 text-white font-bold' : 'bg-gray-50 hover:bg-primary-100 text-gray-700 border border-gray-200'"
                    class="px-3 py-3 text-center transition-colors text-sm rounded-lg font-medium"
                  >
                    {{ getMonthNameShort(i) }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Body: Calendar/Time Selection ──────────────────────────────── -->
          <div class="px-6 py-6 space-y-4 max-h-96 overflow-y-auto">
            <!-- Calendar view (date/month/range modes) -->
            <div *ngIf="mode === 'date' || mode === 'date-time' || mode === 'month' || mode === 'range' || mode === 'range-time'">
              <!-- Month Navigation (if date/range modes) - Now Clickable -->
              <div *ngIf="mode === 'date' || mode === 'date-time' || mode === 'range' || mode === 'range-time'" class="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 relative">
                <button
                  type="button"
                  (click)="previousMonth()"
                  [disabled]="isMonthAtMinBound()"
                  class="p-2 rounded-lg transition-colors text-gray-600"
                  [class.hover:bg-gray-100]="!isMonthAtMinBound()"
                  [class.opacity-50]="isMonthAtMinBound()"
                  [class.cursor-not-allowed]="isMonthAtMinBound()"
                  [attr.aria-label]="'Previous month'"
                >
                  <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </button>
                <button
                  type="button"
                  (click)="toggleMonthPicker()"
                  class="text-center text-lg font-semibold text-gray-700 hover:text-primary-700 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-gray-100"
                  [attr.aria-label]="'Select month'"
                >
                  {{ getMonthLabel(currentMonth) }}
                </button>
                <button
                  type="button"
                  (click)="nextMonth()"
                  [disabled]="isMonthAtMaxBound()"
                  class="p-2 rounded-lg transition-colors text-gray-600"
                  [class.hover:bg-gray-100]="!isMonthAtMaxBound()"
                  [class.opacity-50]="isMonthAtMaxBound()"
                  [class.cursor-not-allowed]="isMonthAtMaxBound()"
                  [attr.aria-label]="'Next month'"
                >
                  <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>

              <!-- Day labels (Sun-Sat) -->
              <div
                class="grid grid-cols-7 gap-2 mb-2 text-center"
                *ngIf="mode === 'date' || mode === 'date-time' || mode === 'range' || mode === 'range-time'"
              >
                <div class="text-xs font-bold text-gray-500 py-2" *ngFor="let dayLabel of dayLabels">
                  {{ dayLabel }}
                </div>
              </div>

              <!-- Calendar grid -->
              <div>
                <!-- Date mode (grid of days) -->
                <div
                  *ngIf="mode === 'date' || mode === 'date-time' || mode === 'range' || mode === 'range-time'"
                  class="space-y-1"
                >
                  <div *ngFor="let week of calendarData.weeks" class="grid grid-cols-7 gap-2">
                    <button
                      type="button"
                      *ngFor="let day of week.days; trackBy: trackByDay"
                      (click)="selectDate(day)"
                      (keydown)="onDayKeydown($event, day)"
                      [disabled]="day.isDisabled"
                      [class]="getDayButtonClasses(day)"
                      [attr.tabindex]="day.isSelected ? 0 : -1"
                      [attr.aria-label]="getDateAriaLabel(day)"
                      [attr.aria-current]="day.isToday ? 'date' : null"
                    >
                      <span>{{ day.dayOfMonth }}</span>
                    </button>
                  </div>
                </div>

                <!-- Month mode (grid of months) -->
                <div
                  *ngIf="mode === 'month'"
                  class="grid grid-cols-3 gap-3"
                >
                  <button
                    type="button"
                    *ngFor="let m of monthList; let i = index"
                    (click)="selectMonth(i)"
                    [disabled]="isMonthDisabledForSelection(i, currentYear)"
                    [class]="getMonthButtonClasses(i)"
                    [attr.aria-label]="getMonthName(i) + ' ' + currentYear"
                  >
                    {{ getMonthNameShort(i) }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Time picker (time/date-time modes) -->
            <div
              *ngIf="mode === 'time' || mode === 'date-time' || mode === 'range-time'"
              class="border-t border-gray-200 pt-4"
            >
              <div class="text-sm font-semibold text-gray-700 mb-4">Select Time</div>
              <div class="flex items-center justify-center gap-4">
                <!-- Hours -->
                <div class="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    (click)="increaseHours()"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    [disabled]="disabled"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M7.293 9.293a1 1 0 011.414 0L10 10.586l1.293-1.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                  <input
                    type="number"
                    [(ngModel)]="hours"
                    (change)="onTimeChange()"
                    [min]="timeFormat === '12h' ? 1 : 0"
                    [max]="timeFormat === '12h' ? 12 : 23"
                    class="w-16 px-2 py-3 border-2 border-gray-300 rounded-lg text-center text-lg font-bold focus:outline-none focus:border-primary-500 transition-colors"
                    [disabled]="disabled"
                  />
                  <button
                    type="button"
                    (click)="decreaseHours()"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    [disabled]="disabled"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M12.707 10.707a1 1 0 01-1.414 0L10 9.414l-1.293 1.293a1 1 0 01-1.414-1.414l2-2a1 1 0 011.414 0l2 2a1 1 0 010 1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                  <div class="text-xs text-gray-500 font-medium mt-1">Hours</div>
                </div>

                <!-- Separator -->
                <div class="text-3xl font-bold text-gray-400">:</div>

                <!-- Minutes -->
                <div class="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    (click)="increaseMinutes()"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    [disabled]="disabled"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M7.293 9.293a1 1 0 011.414 0L10 10.586l1.293-1.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                  <input
                    type="number"
                    [(ngModel)]="minutes"
                    (change)="onTimeChange()"
                    min="0"
                    max="59"
                    class="w-16 px-2 py-3 border-2 border-gray-300 rounded-lg text-center text-lg font-bold focus:outline-none focus:border-primary-500 transition-colors"
                    [disabled]="disabled"
                  />
                  <button
                    type="button"
                    (click)="decreaseMinutes()"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    [disabled]="disabled"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M12.707 10.707a1 1 0 01-1.414 0L10 9.414l-1.293 1.293a1 1 0 01-1.414-1.414l2-2a1 1 0 011.414 0l2 2a1 1 0 010 1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                  <div class="text-xs text-gray-500 font-medium mt-1">Minutes</div>
                </div>

                <!-- Optional: Seconds -->
                <div *ngIf="showSeconds" class="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    (click)="increaseSeconds()"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    [disabled]="disabled"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M7.293 9.293a1 1 0 011.414 0L10 10.586l1.293-1.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                  <input
                    type="number"
                    [(ngModel)]="seconds"
                    (change)="onTimeChange()"
                    min="0"
                    max="59"
                    class="w-16 px-2 py-3 border-2 border-gray-300 rounded-lg text-center text-lg font-bold focus:outline-none focus:border-primary-500 transition-colors"
                    [disabled]="disabled"
                  />
                  <button
                    type="button"
                    (click)="decreaseSeconds()"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    [disabled]="disabled"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M12.707 10.707a1 1 0 01-1.414 0L10 9.414l-1.293 1.293a1 1 0 01-1.414-1.414l2-2a1 1 0 011.414 0l2 2a1 1 0 010 1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                  <div class="text-xs text-gray-500 font-medium mt-1">Seconds</div>
                </div>

                <!-- AM/PM Selector (12-hour format only) -->
                <div *ngIf="timeFormat === '12h'" class="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    (click)="toggleAmPm()"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-primary-600 font-semibold"
                    [disabled]="disabled"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M7.293 9.293a1 1 0 011.414 0L10 10.586l1.293-1.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                  <div class="w-16 px-2 py-3 border-2 border-primary-300 rounded-lg text-center text-lg font-bold bg-primary-50">
                    {{ getAmPm() }}
                  </div>
                  <button
                    type="button"
                    (click)="toggleAmPm()"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-primary-600 font-semibold"
                    [disabled]="disabled"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M12.707 10.707a1 1 0 01-1.414 0L10 9.414l-1.293 1.293a1 1 0 01-1.414-1.414l2-2a1 1 0 011.414 0l2 2a1 1 0 010 1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                  <div class="text-xs text-gray-500 font-medium mt-1">AM/PM</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Footer: Action Buttons ──────────────────────────────────────── -->
          <div class="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between gap-3">
            <!-- Range display (if range mode) -->
            <div *ngIf="isRangeMode()" class="text-xs text-gray-600 flex-1">
              <div *ngIf="!startDate && !endDate">Select date range</div>
              <div *ngIf="startDate && !endDate" class="font-semibold">From: {{ formatDateDisplay(startDate) }}</div>
              <div *ngIf="startDate && endDate" class="font-semibold">
                {{ formatDateDisplay(startDate) }} → {{ formatDateDisplay(endDate) }}
              </div>
            </div>

            <!-- Today button (non-range modes) -->
            <button
              *ngIf="!isRangeMode()"
              type="button"
              (click)="selectToday()"
              class="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              [disabled]="!canSelectToday() || disabled"
            >
              <svg class="w-4 h-4 inline mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/>
              </svg>
              Today
            </button>

            <!-- Clear button (range mode) -->
            <button
              *ngIf="isRangeMode() && (startDate || endDate)"
              type="button"
              (click)="clearRange()"
              class="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
            >
              Clear
            </button>

            <!-- Close button -->
            <button
              type="button"
              (click)="close()"
              class="flex-1 px-4 py-2 text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>

      <!-- Error / hint messages -->
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

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes zoomInSmall {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }

      .modal-enter {
        animation: fadeIn 0.2s ease-out, zoomInSmall 0.2s ease-out;
      }

      :host ::ng-deep .grid.grid-cols-3 > button {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class DatePickerComponent implements ControlValueAccessor, OnChanges {
  // ── Inputs ────────────────────────────────────────────────────────────────

  /**
   * The picker mode — controls what can be selected.
   * - 'date': Only date selection
   * - 'date-time': Date + time selection
   * - 'month': Month & year only
   * - 'time': Time only
   */
  @Input() mode: DatePickerMode = 'date';

  /** Label displayed above the input. */
  @Input() label = '';

  /** Placeholder text in the input field. */
  @Input() placeholder = 'Select date';

  /** Disables the picker when true. */
  @Input() disabled = false;

  /** Marks as required (red asterisk). */
  @Input() required = false;

  /** Minimum allowed date (dates before this are disabled). */
  private _minDate: Date | null = null;
  @Input()
  set minDate(value: Date | string | null) {
    if (!value) {
      this._minDate = null;
    } else if (value instanceof Date) {
      this._minDate = value;
    } else if (typeof value === 'string') {
      const parsed = new Date(value);
      this._minDate = isNaN(parsed.getTime()) ? null : parsed;
    } else {
      this._minDate = null;
    }
  }
  get minDate(): Date | null {
    return this._minDate;
  }

  /** Maximum allowed date (dates after this are disabled). */
  private _maxDate: Date | null = null;
  @Input()
  set maxDate(value: Date | string | null) {
    if (!value) {
      this._maxDate = null;
    } else if (value instanceof Date) {
      this._maxDate = value;
    } else if (typeof value === 'string') {
      const parsed = new Date(value);
      this._maxDate = isNaN(parsed.getTime()) ? null : parsed;
    } else {
      this._maxDate = null;
    }
  }
  get maxDate(): Date | null {
    return this._maxDate;
  }

  /** When true, seconds column is shown in time picker. */
  @Input() showSeconds = false;

  /** Time format: '24h' for 24-hour format (default) or '12h' for 12-hour format with AM/PM. */
  @Input() timeFormat: '12h' | '24h' = '24h';

  /** Locale string for date formatting (default: 'en-MY'). */
  @Input() locale = 'en-MY';

  /** HTML id for the trigger input. Auto-generated when omitted. */
  @Input() id = '';

  /** Validation error message. */
  @Input() error = '';

  /** Helper/hint text. */
  @Input() hint = '';

  // ── Outputs ───────────────────────────────────────────────────────────────

  /** Emits when a date is selected. Value is ISO string (YYYY-MM-DD[THH:MM[:SS]]). */
  @Output() dateChange = new EventEmitter<string>();

  /** Emits when the picker opens. */
  @Output() opened = new EventEmitter<void>();

  /** Emits when the picker closes. */
  @Output() closed = new EventEmitter<void>();

  // ── Template references ───────────────────────────────────────────────────

  @ViewChild('yearPickerContainer', { static: false }) yearPickerContainer?: ElementRef;
  @ViewChild('yearPickerScrollContainer', { static: false }) yearPickerScrollContainer?: ElementRef;

  // ── Internal state ────────────────────────────────────────────────────────

  isOpen = false;
  showYearPicker = false;
  showMonthPicker = false;
  currentYear: number;
  currentMonth: number;
  calendarData!: CalendarMonth;

  hours = 0;
  minutes = 0;
  seconds = 0;

  selectedDate: Date | null = null;
  startDate: Date | null = null;  // For range mode
  endDate: Date | null = null;    // For range mode

  dayLabels = CalendarService.getDayLabels();
  monthList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  private readonly _internalId = `date-picker-${Math.random().toString(36).substring(2, 9)}`;
  private onChangeFn: (value: string | null) => void = () => {};
  private onTouchedFn: () => void = () => {};

  constructor(private readonly elementRef: ElementRef) {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
  }

  ngOnInit(): void {
    this.regenerateCalendar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['minDate'] ||
      changes['maxDate'] ||
      changes['currentYear'] ||
      changes['currentMonth']
    ) {
      this.regenerateCalendar();
    }
  }

  // ── Computed helpers ──────────────────────────────────────────────────────

  get triggerId(): string {
    return this.id || this._internalId;
  }

  get inputDisplayValue(): string {
    if (this.isRangeMode()) {
      if (!this.startDate) return '';
      const start = CalendarService.formatDisplay(this.startDate, this.locale);
      const end = this.endDate ? CalendarService.formatDisplay(this.endDate, this.locale) : '...';
      return `${start} to ${end}`;
    }

    if (!this.selectedDate) return '';
    if (this.mode === 'date') {
      return CalendarService.formatDisplay(this.selectedDate, this.locale);
    }
    if (this.mode === 'date-time') {
      return (
        CalendarService.formatDisplay(this.selectedDate, this.locale) +
        ' ' +
        this.formatTimeDisplay(this.selectedDate)
      );
    }
    if (this.mode === 'month') {
      return `${CalendarService.getMonthName(this.selectedDate.getMonth())} ${this.selectedDate.getFullYear()}`;
    }
    if (this.mode === 'time') {
      return CalendarService.formatTime(this.selectedDate);
    }
    return '';
  }

  get inputClasses(): string {
    const base =
      'w-full px-3 py-2 text-sm text-left bg-white border rounded-lg transition-all duration-150 focus:outline-none pr-10';
    if (this.disabled) {
      return `${base} border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-70`;
    }
    if (this.error) {
      return `${base} border-red-400 text-gray-700 hover:border-red-500 focus:ring-2 focus:ring-red-200`;
    }
    if (this.isOpen) {
      return `${base} border-primary-500 ring-2 ring-primary-200 text-gray-700`;
    }
    return `${base} border-gray-300 text-gray-700 hover:border-primary-400 cursor-pointer`;
  }

  getDayButtonClasses(day: CalendarDay): string {
    const base =
      'w-full aspect-square text-sm font-semibold rounded-lg transition-all duration-150 flex items-center justify-center';

    // For range mode, handle range highlighting
    if (this.isRangeMode()) {
      if (day.isDisabled) {
        return `${base} text-gray-200 cursor-not-allowed bg-gray-50`;
      }
      
      const isStart = this.startDate && this.isSameDay(day.date, this.startDate);
      const isEnd = this.endDate && this.isSameDay(day.date, this.endDate);
      const isInRange = this.isDateInRange(day.date);
      
      if (isStart || isEnd) {
        return `${base} bg-primary-700 text-white font-bold shadow-md hover:shadow-lg scale-100 hover:scale-105`;
      }
      
      if (isInRange) {
        return `${base} bg-primary-100 text-primary-700 hover:bg-primary-200`;
      }
      
      if (day.isToday) {
        return `${base} ring-2 ring-primary-400 ring-offset-1 text-primary-700 font-bold bg-primary-50 hover:bg-primary-100`;
      }
      
      if (!day.isCurrentMonth) {
        return `${base} text-gray-300 hover:bg-gray-100 cursor-default`;
      }
      return `${base} text-gray-700 hover:bg-primary-100 hover:text-primary-700 cursor-pointer`;
    }

    // Original single date logic
    if (day.isDisabled) {
      return `${base} text-gray-200 cursor-not-allowed bg-gray-50`;
    }
    if (day.isSelected) {
      return `${base} bg-primary-700 text-white font-bold shadow-md hover:shadow-lg scale-100 hover:scale-105`;
    }
    if (day.isToday) {
      return `${base} ring-2 ring-primary-400 ring-offset-1 text-primary-700 font-bold bg-primary-50 hover:bg-primary-100`;
    }
    if (!day.isCurrentMonth) {
      return `${base} text-gray-300 hover:bg-gray-100 cursor-default`;
    }
    return `${base} text-gray-700 hover:bg-primary-100 hover:text-primary-700 cursor-pointer`;
  }

  getMonthButtonClasses(monthIndex: number): string {
    const isCurrentMonth =
      monthIndex === this.currentMonth && this.currentYear === new Date().getFullYear();
    const isDisabled = this.isMonthDisabledForSelection(monthIndex, this.currentYear);
    const base = 'w-full px-2 py-2 text-sm font-medium rounded transition-colors duration-100';

    if (isDisabled) {
      return `${base} text-gray-200 cursor-not-allowed bg-gray-50`;
    }
    if (
      this.selectedDate &&
      monthIndex === this.selectedDate.getMonth() &&
      this.currentYear === this.selectedDate.getFullYear()
    ) {
      return `${base} bg-primary-700 text-white font-bold`;
    }
    if (isCurrentMonth) {
      return `${base} ring-2 ring-primary-400 text-primary-700 font-bold`;
    }
    return `${base} text-gray-700 hover:bg-primary-50`;
  }

  // ── Event handlers ────────────────────────────────────────────────────────

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
    this.opened.emit();
    if (this.selectedDate) {
      this.currentYear = this.selectedDate.getFullYear();
      this.currentMonth = this.selectedDate.getMonth();
    } else {
      const now = new Date();
      this.currentYear = now.getFullYear();
      this.currentMonth = now.getMonth();
    }
    this.regenerateCalendar();
  }

  close(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.onTouchedFn();
      this.closed.emit();
    }
  }

  selectDate(day: CalendarDay): void {
    if (day.isDisabled) return;
    
    if (this.isRangeMode()) {
      // Range mode: first click = start, second click = end
      if (!this.startDate) {
        this.startDate = new Date(day.date);
        this.endDate = null;
      } else if (!this.endDate) {
        // If selected date is before start date, swap them
        const selected = new Date(day.date);
        if (selected < this.startDate) {
          this.endDate = this.startDate;
          this.startDate = selected;
        } else {
          this.endDate = selected;
        }
        // Emit and close
        this.emitChange();
        this.close();
      }
      this.regenerateCalendar();
    } else {
      // Single date mode
      this.selectedDate = new Date(day.date);
      if (this.mode === 'date-time') {
        this.selectedDate.setHours(this.hours, this.minutes, this.showSeconds ? this.seconds : 0);
      }
      this.emitChange();
      if (this.mode !== 'time') {
        this.close();
      }
    }
  }

  selectToday(): void {
    const today = new Date();
    if (CalendarService.isBetween(today, this.minDate, this.maxDate)) {
      this.selectedDate = today;
      if (this.mode === 'date-time' || this.mode === 'time') {
        this.selectedDate.setHours(this.hours, this.minutes, this.showSeconds ? this.seconds : 0);
      }
      this.emitChange();
      if (this.mode === 'date') {
        this.close();
      }
    }
  }

  canSelectToday(): boolean {
    const today = new Date();
    return CalendarService.isBetween(today, this.minDate, this.maxDate);
  }

  previousMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.regenerateCalendar();
  }

  nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.regenerateCalendar();
  }

  isMonthDisabled(direction: 'prev' | 'next'): boolean {
    const checkYear = direction === 'prev' ? this.currentYear : this.currentYear;
    const checkMonth = direction === 'prev' ? this.currentMonth - 1 : this.currentMonth + 1;

    if (checkMonth <= 0 && this.minDate instanceof Date && this.minDate.getFullYear() === checkYear - 1) {
      return true;
    }
    if (checkMonth >= 11 && this.maxDate instanceof Date && this.maxDate.getFullYear() === checkYear + 1) {
      return true;
    }
    return false;
  }

  // ── Year navigation constraints ────────────────────────────────────────

  isYearDisabled(direction: 'prev' | 'next'): boolean {
    if (!this.minDate && !this.maxDate) return false;
    
    const testYear = direction === 'prev' ? this.currentYear - 1 : this.currentYear + 1;
    
    if (this.minDate instanceof Date && testYear < this.minDate.getFullYear()) return true;
    if (this.maxDate instanceof Date && testYear > this.maxDate.getFullYear()) return true;
    
    return false;
  }

  // ── Month navigation constraints ────────────────────────────────────────

  isMonthAtMinBound(): boolean {
    if (!(this.minDate instanceof Date)) return false;
    
    const minYear = this.minDate.getFullYear();
    const minMonth = this.minDate.getMonth();
    
    return this.currentYear === minYear && this.currentMonth <= minMonth;
  }

  isMonthAtMaxBound(): boolean {
    if (!(this.maxDate instanceof Date)) return false;
    
    const maxYear = this.maxDate.getFullYear();
    const maxMonth = this.maxDate.getMonth();
    
    return this.currentYear === maxYear && this.currentMonth >= maxMonth;
  }

  isMonthDisabledForSelection(monthIndex: number, year: number): boolean {
    if (!this.minDate && !this.maxDate) return false;
    const first = new Date(year, monthIndex, 1);
    const last = new Date(year, monthIndex + 1, 0);
    if (this.minDate && last < CalendarService.stripTime(this.minDate)) return true;
    if (this.maxDate && first > CalendarService.stripTime(this.maxDate)) return true;
    return false;
  }

  // ── Year Navigation ──────────────────────────────────────────────────────

  changeYear(offset: number): void {
    this.currentYear += offset;
    this.regenerateCalendar();
  }

  // ── Time Spinner Controls ────────────────────────────────────────────────

  increaseHours(): void {
    if (this.timeFormat === '12h') {
      const current = this.hours % 12;
      const isAm = this.hours < 12;
      const next = (current + 1) % 12;
      this.hours = isAm ? next : next + 12;
      if (next === 0) this.hours = isAm ? 0 : 12;
    } else {
      this.hours = (this.hours + 1) % 24;
    }
    this.onTimeChange();
  }

  decreaseHours(): void {
    if (this.timeFormat === '12h') {
      const current = this.hours % 12 || 12;
      const isAm = this.hours < 12;
      const prev = current === 1 ? 12 : current - 1;
      this.hours = isAm ? (prev === 12 ? 0 : prev) : prev + 12;
    } else {
      this.hours = (this.hours - 1 + 24) % 24;
    }
    this.onTimeChange();
  }

  toggleAmPm(): void {
    if (this.timeFormat === '12h') {
      // Toggle between AM (0-11) and PM (12-23)
      if (this.hours < 12) {
        this.hours += 12;
      } else {
        this.hours -= 12;
      }
      this.onTimeChange();
    }
  }

  increaseMinutes(): void {
    this.minutes = (this.minutes + 1) % 60;
    this.onTimeChange();
  }

  decreaseMinutes(): void {
    this.minutes = (this.minutes - 1 + 60) % 60;
    this.onTimeChange();
  }

  increaseSeconds(): void {
    this.seconds = (this.seconds + 1) % 60;
    this.onTimeChange();
  }

  decreaseSeconds(): void {
    this.seconds = (this.seconds - 1 + 60) % 60;
    this.onTimeChange();
  }

  onDayKeydown(event: KeyboardEvent, day: CalendarDay): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectDate(day);
        break;
      case 'Escape':
        this.close();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.selectAdjacentDay(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.selectAdjacentDay(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectAdjacentDay(-7);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.selectAdjacentDay(7);
        break;
    }
  }

  selectAdjacentDay(offset: number): void {
    if (this.selectedDate) {
      const adjacent = new Date(this.selectedDate);
      adjacent.setDate(adjacent.getDate() + offset);
      const day = this.findDayInCalendar(adjacent);
      if (day && !day.isDisabled) {
        this.selectDate(day);
      }
    }
  }

  findDayInCalendar(date: Date): CalendarDay | undefined {
    const targetTime = CalendarService.stripTime(date).getTime();
    for (const week of this.calendarData.weeks) {
      for (const day of week.days) {
        if (CalendarService.stripTime(day.date).getTime() === targetTime) {
          return day;
        }
      }
    }
    return undefined;
  }

  onTimeChange(): void {
    if (this.selectedDate) {
      this.selectedDate.setHours(this.hours, this.minutes, this.showSeconds ? this.seconds : 0);
      this.emitChange();
    }
  }

  getMonthLabel(month: number): string {
    return CalendarService.getMonthName(month);
  }

  getMonthName(month: number): string {
    return CalendarService.getMonthName(month);
  }

  getMonthNameShort(month: number): string {
    return CalendarService.getMonthName(month).substring(0, 3);
  }

  getDateAriaLabel(day: CalendarDay): string {
    return `${day.dayOfMonth} ${CalendarService.getMonthName(day.date.getMonth())} ${day.date.getFullYear()}`;
  }

  trackByDay(index: number, day: CalendarDay): string {
    return `${day.date.getTime()}-${day.isDisabled}`;
  }

  // ── Helper methods for year/month picking ──────────────────────────────────

  toggleYearPicker(): void {
    this.showYearPicker = !this.showYearPicker;
    this.showMonthPicker = false;

    // Auto-scroll to current year when picker opens
    if (this.showYearPicker) {
      setTimeout(() => {
        this.scrollYearPickerToCurrentYear();
      }, 100);
    }
  }

  toggleMonthPicker(): void {
    this.showMonthPicker = !this.showMonthPicker;
    this.showYearPicker = false;
  }

  selectYear(year: number): void {
    this.currentYear = year;
    this.showYearPicker = false;
    this.regenerateCalendar();
  }

  // ── Auto-scroll helper ────────────────────────────────────────────────────

  private scrollYearPickerToCurrentYear(): void {
    if (!this.yearPickerContainer || !this.yearPickerScrollContainer) return;

    const scrollContainer = this.yearPickerScrollContainer.nativeElement;
    const gridContainer = this.yearPickerContainer.nativeElement;
    const currentYearButton = gridContainer.querySelector(
      `[data-year="${this.currentYear}"]`
    ) as HTMLElement;

    if (currentYearButton) {
      // Use getBoundingClientRect for more accurate measurements
      const buttonRect = currentYearButton.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      
      // Calculate button's top position relative to scroll container
      const buttonTopInContainer = buttonRect.top - containerRect.top + scrollContainer.scrollTop;
      
      // Calculate scroll position to center the button in the container
      const targetScroll = buttonTopInContainer - (containerRect.height / 2) + (buttonRect.height / 2);
      
      // Clamp to valid scroll range
      const maxScroll = scrollContainer.scrollHeight - containerRect.height;
      scrollContainer.scrollTop = Math.max(0, Math.min(targetScroll, maxScroll));
    }
  }

  selectMonth(monthIndex: number): void {
    if (this.isMonthDisabledForSelection(monthIndex, this.currentYear)) return;
    
    // Handle both month-only selection and month navigation
    if (this.mode === 'month') {
      this.selectedDate = new Date(this.currentYear, monthIndex, 1);
      this.emitChange();
    } else {
      // Just change the calendar view (for month navigation when in date mode)
      this.currentMonth = monthIndex;
      this.showMonthPicker = false;
      this.regenerateCalendar();
    }
  }

  selectMonthFromPicker(monthIndex: number): void {
    if (this.isMonthDisabledForSelection(monthIndex, this.currentYear)) return;
    
    // Just change the calendar view and close the picker
    this.currentMonth = monthIndex;
    this.showMonthPicker = false;
    this.regenerateCalendar();
  }

  getYearsRange(): number[] {
    const years: number[] = [];
    const minY = (this.minDate instanceof Date) ? this.minDate.getFullYear() : this.currentYear - 50;
    const maxY = (this.maxDate instanceof Date) ? this.maxDate.getFullYear() : this.currentYear + 50;
    for (let y = Math.max(minY, 1900); y <= Math.min(maxY, 2100); y++) {
      years.push(y);
    }
    return years;
  }

  // ── Helper methods for range mode ──────────────────────────────────────────

  isRangeMode(): boolean {
    return this.mode === 'range' || this.mode === 'range-time';
  }

  isDateInRange(date: Date): boolean {
    if (!this.startDate || !this.endDate) return false;
    const dateTime = CalendarService.stripTime(date).getTime();
    const startTime = CalendarService.stripTime(this.startDate).getTime();
    const endTime = CalendarService.stripTime(this.endDate).getTime();
    return dateTime > startTime && dateTime < endTime;
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  formatDateDisplay(date: Date): string {
    return CalendarService.formatDisplay(date, this.locale);
  }

  // ── Time format helpers ──────────────────────────────────────────────────

  getDisplayHours(): number {
    if (this.timeFormat === '12h') {
      // Convert 0-23 to 1-12 (1 AM, 12 PM, 1 PM, 12 AM)
      const h = this.hours % 12;
      return h === 0 ? 12 : h;
    }
    return this.hours;
  }

  getAmPm(): string {
    if (this.timeFormat === '12h') {
      return this.hours >= 12 ? 'PM' : 'AM';
    }
    return '';
  }

  formatTimeDisplay(date: Date): string {
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');

    if (this.timeFormat === '12h') {
      const displayH = (h % 12) || 12;
      const ampm = h >= 12 ? 'PM' : 'AM';
      return `${displayH}:${m} ${ampm}`;
    }

    return `${String(h).padStart(2, '0')}:${m}`;
  }

  clearRange(): void {
    this.startDate = null;
    this.endDate = null;
    this.emitChange();
    this.regenerateCalendar();
  }

  private regenerateCalendar(): void {
    this.calendarData = CalendarService.generateCalendar(
      this.currentYear,
      this.currentMonth,
      this.selectedDate,
      this.minDate,
      this.maxDate,
    );
  }

  private emitChange(): void {
    // For range mode, emit range as JSON or special format
    if (this.isRangeMode()) {
      if (!this.startDate) {
        this.onChangeFn(null);
        this.dateChange.emit('');
      } else if (this.endDate) {
        const startStr = CalendarService.formatISO(this.startDate);
        const endStr = CalendarService.formatISO(this.endDate);
        const rangeValue = `${startStr}/${endStr}`;
        this.onChangeFn(rangeValue);
        this.dateChange.emit(rangeValue);
      } else {
        // Only start date selected, emit as JSON object
        const startStr = CalendarService.formatISO(this.startDate);
        this.onChangeFn(startStr);
        this.dateChange.emit(startStr);
      }
      return;
    }

    // Single date mode
    if (!this.selectedDate) {
      this.onChangeFn(null);
      this.dateChange.emit('');
      return;
    }

    let isoValue: string;
    if (this.mode === 'date') {
      isoValue = CalendarService.formatISO(this.selectedDate);
    } else if (this.mode === 'date-time') {
      isoValue = CalendarService.formatISO(this.selectedDate) + 'T' + CalendarService.formatTime(this.selectedDate);
    } else if (this.mode === 'month') {
      isoValue = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}`;
    } else if (this.mode === 'time') {
      isoValue = CalendarService.formatTime(this.selectedDate);
    } else {
      isoValue = '';
    }

    this.onChangeFn(isoValue);
    this.dateChange.emit(isoValue);
  }

  // ── ControlValueAccessor ──────────────────────────────────────────────────

  writeValue(value: string | Date | null): void {
    if (!value) {
      this.selectedDate = null;
      return;
    }

    if (value instanceof Date) {
      this.selectedDate = new Date(value);
    } else if (typeof value === 'string') {
      const parsed = CalendarService.parseDate(value);
      if (parsed) {
        this.selectedDate = parsed;
        // Parse time part if present (ISO format)
        if (value.includes('T')) {
          const timePart = value.split('T')[1];
          if (timePart && this.selectedDate) {
            const [h, m, s] = timePart.split(':');
            this.hours = parseInt(h, 10) || 0;
            this.minutes = parseInt(m, 10) || 0;
            this.seconds = parseInt(s, 10) || 0;
            this.selectedDate.setHours(this.hours, this.minutes, this.seconds);
          }
        } else if (this.mode === 'time') {
          const [h, m, s] = value.split(':');
          this.hours = parseInt(h, 10) || 0;
          this.minutes = parseInt(m, 10) || 0;
          this.seconds = parseInt(s, 10) || 0;
        }
      }
    }

    if (this.selectedDate) {
      this.hours = this.selectedDate.getHours();
      this.minutes = this.selectedDate.getMinutes();
      this.seconds = this.selectedDate.getSeconds();
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
