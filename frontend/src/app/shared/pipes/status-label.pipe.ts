import { Pipe, PipeTransform } from '@angular/core';

/**
 * StatusLabelPipe
 *
 * Converts a SNAKE_CASE status code into a human-readable Title Case label.
 * Useful for displaying raw API status strings without a full StatusBadge.
 *
 * @example
 * ```html
 * {{ 'PENDING_APPROVAL' | statusLabel }}   → "Pending Approval"
 * {{ 'IN_PROGRESS'      | statusLabel }}   → "In Progress"
 * {{ 'CLAIM_SUBMITTED'  | statusLabel }}   → "Claim Submitted"
 * {{ 'ACTIVE'           | statusLabel }}   → "Active"
 * {{ null               | statusLabel }}   → ""
 * ```
 */
@Pipe({ name: 'statusLabel', standalone: true, pure: true })
export class StatusLabelPipe implements PipeTransform {

  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
