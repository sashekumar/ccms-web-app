/**
 * Calendar utility service — date calculations, formatting, and utilities
 * Used by the DatePickerComponent and exported for app-wide use
 */

/**
 * Represents metadata about a single day in the calendar.
 */
export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

/**
 * Represents a week of calendar days.
 */
export interface CalendarWeek {
  days: CalendarDay[];
}

/**
 * Represents an entire calendar month grid.
 */
export interface CalendarMonth {
  year: number;
  month: number;
  weeks: CalendarWeek[];
}

export class CalendarService {
  private static readonly DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  private static readonly MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  /**
   * Generate calendar data for the given month and year.
   * Includes days from the previous and next months to fill the grid.
   */
  static generateCalendar(
    year: number,
    month: number,
    selectedDate: Date | null,
    minDate: Date | null,
    maxDate: Date | null,
  ): CalendarMonth {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const weeks: CalendarWeek[] = [];
    const today = this.stripTime(new Date());
    const selected = selectedDate ? this.stripTime(selectedDate) : null;

    let currentDate = new Date(startDate);
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      const week: CalendarDay[] = [];
      for (let i = 0; i < 7; i++) {
        const dateOnly = this.stripTime(new Date(currentDate));
        week.push({
          date: new Date(currentDate),
          dayOfMonth: currentDate.getDate(),
          isCurrentMonth: currentDate.getMonth() === month,
          isToday: dateOnly.getTime() === today.getTime(),
          isSelected: selected ? dateOnly.getTime() === selected.getTime() : false,
          isDisabled: this.isDateDisabled(dateOnly, minDate, maxDate),
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push({ days: week });
    }

    return {
      year,
      month,
      weeks,
    };
  }

  /**
   * Check if a date is disabled (outside min/max range).
   */
  static isDateDisabled(date: Date, minDate: Date | null, maxDate: Date | null): boolean {
    if (minDate && date < this.stripTime(minDate)) return true;
    if (maxDate && date > this.stripTime(maxDate)) return true;
    return false;
  }

  /**
   * Get day-of-week labels.
   */
  static getDayLabels(): string[] {
    return [...this.DAYS_OF_WEEK];
  }

  /**
   * Get month name for display.
   */
  static getMonthName(month: number): string {
    return this.MONTHS[month] || '';
  }

  /**
   * Strip time components from a date (normalize to midnight UTC).
   */
  static stripTime(date: Date): Date {
    const stripped = new Date(date);
    stripped.setHours(0, 0, 0, 0);
    return stripped;
  }

  /**
   * Format a date as ISO string (YYYY-MM-DD).
   */
  static formatISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format a date as a locale-friendly string.
   */
  static formatDisplay(date: Date, locale: string = 'en-MY'): string {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format a time as HH:MM string.
   */
  static formatTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * Parse a date string (YYYY-MM-DD or similar).
   */
  static parseDate(dateString: string): Date | null {
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : this.stripTime(parsed);
  }

  /**
   * Add/subtract days from a date.
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Add/subtract months from a date.
   */
  static addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * Get the first day of the month for a given date.
   */
  static getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get the last day of the month for a given date.
   */
  static getLastDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * Check if a date is between two dates (inclusive).
   */
  static isBetween(date: Date, minDate: Date | null, maxDate: Date | null): boolean {
    const d = this.stripTime(date);
    if (minDate && d < this.stripTime(minDate)) return false;
    if (maxDate && d > this.stripTime(maxDate)) return false;
    return true;
  }
}
