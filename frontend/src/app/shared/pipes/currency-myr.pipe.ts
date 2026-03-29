import { Pipe, PipeTransform } from '@angular/core';

/**
 * CurrencyMyrPipe
 *
 * Formats a numeric value as Malaysian Ringgit with the `RM` prefix.
 * Uses the browser's Intl API for locale-aware thousands separators.
 *
 * @example
 * ```html
 * {{ 1234.5  | currencyMyr }}          → "RM 1,234.50"
 * {{ 1000000 | currencyMyr }}          → "RM 1,000,000.00"
 * {{ 99      | currencyMyr:0 }}        → "RM 99"
 * {{ null    | currencyMyr }}          → "—"
 * ```
 */
@Pipe({ name: 'currencyMyr', standalone: true, pure: true })
export class CurrencyMyrPipe implements PipeTransform {

  transform(value: number | string | null | undefined, decimals = 2): string {
    if (value === null || value === undefined || value === '') return '—';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '—';

    return 'RM ' + num.toLocaleString('en-MY', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
}
