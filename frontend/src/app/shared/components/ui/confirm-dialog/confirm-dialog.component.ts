import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent, ButtonVariant } from '../button/button.component';

export type ConfirmDialogVariant = 'danger' | 'warn' | 'primary';

/**
 * ConfirmDialogComponent
 *
 * A reusable confirmation dialog that wraps `app-modal` and `app-button`.
 * Use wherever a destructive or irreversible action requires explicit user
 * acknowledgement before proceeding.
 *
 * @example Delete confirmation
 * ```html
 * <app-confirm-dialog
 *   [isOpen]="showDeleteConfirm"
 *   title="Delete User"
 *   message="This will permanently remove the user and all associated data. This cannot be undone."
 *   variant="danger"
 *   confirmLabel="Delete"
 *   (confirmed)="onDelete()"
 *   (cancelled)="showDeleteConfirm = false"
 * ></app-confirm-dialog>
 * ```
 *
 * @example Approval confirmation
 * ```html
 * <app-confirm-dialog
 *   [isOpen]="showApproveConfirm"
 *   title="Approve Claim"
 *   message="Are you sure you want to approve this claim? This action will notify the claimant."
 *   variant="primary"
 *   confirmLabel="Approve"
 *   (confirmed)="onApprove()"
 *   (cancelled)="showApproveConfirm = false"
 * ></app-confirm-dialog>
 * ```
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="title"
      size="sm"
      [showFooter]="false"
      (onClose)="cancel()"
    >
      <!-- Icon + message ------------------------------------------------ -->
      <div class="flex items-start gap-3 mb-6">

        <!-- Danger icon -->
        <div
          *ngIf="variant === 'danger'"
          class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100"
        >
          <svg class="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>

        <!-- Warning icon -->
        <div
          *ngIf="variant === 'warn'"
          class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100"
        >
          <svg class="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>

        <!-- Primary info icon -->
        <div
          *ngIf="variant === 'primary'"
          class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-50"
        >
          <svg class="h-5 w-5 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>

        <p class="text-sm leading-relaxed text-gray-600">{{ message }}</p>
      </div>

      <!-- Action buttons ----------------------------------------------- -->
      <div class="flex justify-end gap-3">
        <app-button variant="secondary" size="sm" (click)="cancel()">
          {{ cancelLabel }}
        </app-button>
        <app-button [variant]="confirmButtonVariant" size="sm" (click)="confirm()">
          {{ confirmLabel }}
        </app-button>
      </div>
    </app-modal>
  `,
})
export class ConfirmDialogComponent {

  /** Controls modal visibility. Bind to a boolean flag in the parent. */
  @Input() isOpen = false;

  /** Modal title shown in the header bar. */
  @Input() title = 'Confirm Action';

  /** The body message asking the user to confirm. */
  @Input() message = 'Are you sure you want to proceed?';

  /**
   * Visual variant controlling the icon colour and confirm button style.
   * - `danger`  — red icon + red button  (destructive actions: delete, reject)
   * - `warn`    — amber icon + amber button  (caution actions: override, force)
   * - `primary` — brand icon + brand button  (confirmations: approve, submit)
   */
  @Input() variant: ConfirmDialogVariant = 'danger';

  /** Label for the confirm / proceed button. */
  @Input() confirmLabel = 'Confirm';

  /** Label for the cancel button. */
  @Input() cancelLabel = 'Cancel';

  /** Emitted when the user clicks the confirm button. */
  @Output() confirmed = new EventEmitter<void>();

  /** Emitted when the user clicks cancel, the close button, or the backdrop. */
  @Output() cancelled = new EventEmitter<void>();

  get confirmButtonVariant(): ButtonVariant {
    const map: Record<ConfirmDialogVariant, ButtonVariant> = {
      danger:  'danger',
      warn:    'warn',
      primary: 'primary',
    };
    return map[this.variant];
  }

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
