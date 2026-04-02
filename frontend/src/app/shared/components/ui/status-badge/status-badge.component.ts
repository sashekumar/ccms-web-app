import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize    = 'xs' | 'sm' | 'md' | 'lg';

interface StatusConfig {
  variant: BadgeVariant;
  label: string;
}

/**
 * Central registry mapping every CCMS domain status string → variant + display label.
 * Add new status codes here as the system grows.
 */
const STATUS_REGISTRY: Record<string, StatusConfig> = {

  // ── Approved / Positive ────────────────────────────────────────────────
  'APPROVED':          { variant: 'success', label: 'Approved' },
  'PAID':              { variant: 'success', label: 'Paid' },
  'ACTIVE':            { variant: 'success', label: 'Active' },
  'Active':            { variant: 'success', label: 'Active' },
  'INFORCE':           { variant: 'success', label: 'In Force' },
  'COMPLETED':         { variant: 'success', label: 'Completed' },
  'RESOLVED':          { variant: 'success', label: 'Resolved' },
  'RECEIVED':          { variant: 'success', label: 'Received' },
  'MQ_RESPONDED':      { variant: 'success', label: 'MQ Responded' },
  'ACKNOWLEDGED':      { variant: 'success', label: 'Acknowledged' },
  'ACCREDITED':        { variant: 'success', label: 'Accredited' },
  'Accredited':        { variant: 'success', label: 'Accredited' },
  'DISCHARGED':        { variant: 'success', label: 'Discharged' },

  // ── Pending / Warning ──────────────────────────────────────────────────
  'PENDING':           { variant: 'warning', label: 'Pending' },
  'Pending':           { variant: 'warning', label: 'Pending' },
  'PENDING_APPROVAL':  { variant: 'warning', label: 'Pending Approval' },
  'PENDING_MQ':        { variant: 'warning', label: 'Pending MQ' },
  'UNDER_REVIEW':      { variant: 'warning', label: 'Under Review' },
  'IN_PROGRESS':       { variant: 'warning', label: 'In Progress' },
  'PARTIAL':           { variant: 'warning', label: 'Partial' },
  'DEFERRED':          { variant: 'warning', label: 'Deferred' },
  'SENT':              { variant: 'warning', label: 'Sent' },
  'FOLLOW_UP':         { variant: 'warning', label: 'Follow Up' },

  // ── Active / Processing (info / blue) ─────────────────────────────────
  'PROCESSING':        { variant: 'info', label: 'Processing' },
  'ASSIGNED':          { variant: 'info', label: 'Assigned' },
  'OPEN':              { variant: 'info', label: 'Open' },

  // ── Errors / Rejected / Danger ────────────────────────────────────────
  'REJECTED':          { variant: 'danger', label: 'Rejected' },
  'CANCELLED':         { variant: 'danger', label: 'Cancelled' },
  'UNASSIGNED':        { variant: 'danger', label: 'Unassigned' },
  'NOT_AVAILABLE':     { variant: 'danger', label: 'Not Available' },
  'OVERDUE':           { variant: 'danger', label: 'Overdue' },

  // ── Closed / Neutral ──────────────────────────────────────────────────
  'CLOSED':            { variant: 'default', label: 'Closed' },
  'EXPIRED':           { variant: 'default', label: 'Expired' },
  'Expired':           { variant: 'default', label: 'Expired' },
  'NOT_APPLICABLE':    { variant: 'default', label: 'N/A' },
  'INACTIVE':          { variant: 'default', label: 'Inactive' },
  'Inactive':          { variant: 'default', label: 'Inactive' },
  'SUSPENDED':         { variant: 'warning', label: 'Suspended' },
  'TERMINATED':        { variant: 'danger', label: 'Terminated' },
  'LAPSED':            { variant: 'default', label: 'Lapsed' },
  'TRANSFERRED':       { variant: 'info', label: 'Transferred' },
};

/**
 * StatusBadgeComponent
 *
 * Domain-aware badge that auto-resolves the colour variant and display label
 * from a CCMS status string. Wraps `app-badge` internally.
 *
 * @example Auto-resolved
 * ```html
 * <app-status-badge [status]="row.status"></app-status-badge>
 * <!-- APPROVED → green "Approved", PENDING → yellow "Pending", etc. -->
 * ```
 *
 * @example Override label only
 * ```html
 * <app-status-badge [status]="'IN_PROGRESS'" label="Reviewing"></app-status-badge>
 * ```
 *
 * @example Unknown / fallback
 * ```html
 * <app-status-badge [status]="'CUSTOM_CODE'"></app-status-badge>
 * <!-- Falls back to gray badge with the raw value as label -->
 * ```
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  template: `
    <app-badge [variant]="resolvedVariant" [size]="size">
      {{ resolvedLabel }}
    </app-badge>
  `,
})
export class StatusBadgeComponent {

  /** The raw CCMS status string (e.g. 'APPROVED', 'PENDING_MQ', 'CANCELLED'). */
  @Input() status: string | null | undefined = '';

  /**
   * Optional label override. When provided, this text is shown instead of the
   * registry label — the colour still comes from the status mapping.
   */
  @Input() label?: string;

  /** Size forwarded to `app-badge`. Defaults to `sm`. */
  @Input() size: BadgeSize = 'sm';

  get resolvedConfig(): StatusConfig {
    const key = this.status ?? '';
    return STATUS_REGISTRY[key] ?? { variant: 'default', label: key || '—' };
  }

  get resolvedVariant(): BadgeVariant {
    return this.resolvedConfig.variant;
  }

  get resolvedLabel(): string {
    return this.label ?? this.resolvedConfig.label;
  }
}
