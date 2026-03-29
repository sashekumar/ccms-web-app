import { Pipe, PipeTransform } from '@angular/core';

export type MalayDateFormat = 'DD/MM/YYYY' | 'DD MMM YYYY' | 'DD/MM/YYYY HH:mm' | 'DD MMM YYYY HH:mm';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * DateMalayPipe
 *
 * Formats a date value in common Malaysian/CCMS display formats.
 * Accepts `Date`, ISO string, or Unix timestamp number.
 *
 * @example
 * ```html
 * {{ '2026-03-25'           | dateMalay }}                   → "25/03/2026"
 * {{ '2026-03-25'           | dateMalay:'DD MMM YYYY' }}     → "25 Mar 2026"
 * {{ '2026-03-25T14:30:00'  | dateMalay:'DD/MM/YYYY HH:mm' }}→ "25/03/2026 14:30"
 * {{ null                   | dateMalay }}                   → "—"
 * ```
 */
@Pipe({ name: 'dateMalay', standalone: true, pure: true })
export class DateMalayPipe implements PipeTransform {

  transform(
    value: string | Date | number | null | undefined,
    format: MalayDateFormat = 'DD/MM/YYYY',
  ): string {
    if (!value && value !== 0) return '—';

    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';

    const dd   = pad(d.getDate());
    const mm   = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const mon  = MONTHS[d.getMonth()];
    const hh   = pad(d.getHours());
    const min  = pad(d.getMinutes());

    switch (format) {
      case 'DD MMM YYYY':        return `${dd} ${mon} ${yyyy}`;
      case 'DD/MM/YYYY HH:mm':   return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
      case 'DD MMM YYYY HH:mm':  return `${dd} ${mon} ${yyyy} ${hh}:${min}`;
      default:                   return `${dd}/${mm}/${yyyy}`;
    }
  }
}
