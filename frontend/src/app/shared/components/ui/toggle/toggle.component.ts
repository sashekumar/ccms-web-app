import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Chip/Badge-style toggle component for boolean state management.
 * 
 * Displays as a clickable badge with:
 * - Icon on the left (checkmark for active, circle for inactive)
 * - Status text ("Active"/"Inactive")
 * - Green background when active, gray when inactive
 * - Compact, chip-like appearance matching badge design
 * 
 * Features:
 * - No internal state; parent controls state via [isActive] input
 * - Loading state support (dims the chip)
 * - Disabled state support
 * - Keyboard accessible (space/enter to toggle)
 * - Full ARIA labels for screen readers
 * - Hover effects for better UX
 * 
 * @example – basic usage
 * ```html
 * <app-toggle
 *   [isActive]="user.is_active"
 *   [loading]="updatingStatus"
 *   [disabled]="!hasPermission"
 *   (toggle)="onToggleStatus($event)"
 * ></app-toggle>
 * ```
 */
@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss']
})
export class ToggleComponent {
  // ── Inputs ────────────────────────────────────────────────────────────────

  /** Current state of the toggle (true = active/ON, false = inactive/OFF) */
  @Input() isActive = false;

  /** Show loading spinner while API call is pending */
  @Input() loading = false;

  /** Disable toggle interaction */
  @Input() disabled = false;

  // ── Outputs ───────────────────────────────────────────────────────────────

  /** Emits new boolean state when toggle is clicked */
  @Output() toggle = new EventEmitter<boolean>();

  // ── Methods ───────────────────────────────────────────────────────────────

  /**
   * Handle toggle click event
   * The parent component is responsible for showing confirmation dialogs
   * and making API calls; this component is stateless.
   */
  onToggle(): void {
    if (this.disabled || this.loading) return;
    this.toggle.emit(!this.isActive);
  }

  /**
   * Handle keyboard events (space and enter keys)
   * Allows keyboard-accessible toggle interaction
   */
  onKeyDown(event: KeyboardEvent): void {
    if ((event.key === ' ' || event.key === 'Enter') && !this.disabled && !this.loading) {
      event.preventDefault();
      this.onToggle();
    }
  }
}
