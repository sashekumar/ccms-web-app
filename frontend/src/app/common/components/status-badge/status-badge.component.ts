import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable status badge component for displaying status indicators
 * Supports multiple variants and custom styling
 * 
 * @example
 * <app-status-badge [active]="true"></app-status-badge>
 * <app-status-badge [active]="false"></app-status-badge>
 * <app-status-badge [status]="'approved'" [variant]="'success'"></app-status-badge>
 * <app-status-badge [status]="'pending'" [variant]="'warning'" label="In Review"></app-status-badge>
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
      [ngClass]="badgeClass">
      {{ displayLabel }}
    </span>
  `,
  styles: []
})
export class StatusBadgeComponent {
  /**
   * Boolean active status (convenience for is_active fields)
   * If provided, will use 'Active'/'Inactive' labels with success/danger variants
   */
  @Input() active?: boolean;

  /**
   * Status string (for non-boolean statuses)
   */
  @Input() status?: string;

  /**
   * Custom label to display (overrides default labels)
   */
  @Input() label?: string;

  /**
   * Visual variant
   * - 'success': Green (approved, active, completed)
   * - 'warning': Yellow (pending, in-progress)
   * - 'danger': Red (rejected, inactive, blocked)
   * - 'info': Blue (informational)
   * - 'default': Gray (neutral)
   */
  @Input() variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';

  /**
   * Size of the badge
   * - 'small': text-xs px-2
   * - 'medium': text-sm px-3 (default)
   * - 'large': text-base px-4
   */
  @Input() size: 'small' | 'medium' | 'large' = 'small';

  /**
   * Custom CSS classes to apply
   */
  @Input() customClass?: string;

  get displayLabel(): string {
    // Priority: custom label > status > active/inactive
    if (this.label) return this.label;
    if (this.status) return this.status;
    if (this.active !== undefined) return this.active ? 'Active' : 'Inactive';
    return '';
  }

  get badgeClass(): string {
    if (this.customClass) return this.customClass;

    const variant = this.variant || this.getDefaultVariant();
    const sizeClass = this.getSizeClass();
    
    const variantClasses = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
      default: 'bg-gray-100 text-gray-800'
    };

    return `${variantClasses[variant]} ${sizeClass}`;
  }

  private getDefaultVariant(): 'success' | 'warning' | 'danger' | 'info' | 'default' {
    // Auto-detect variant from active status
    if (this.active !== undefined) {
      return this.active ? 'success' : 'danger';
    }

    // Auto-detect variant from status string
    if (this.status) {
      const statusLower = this.status.toLowerCase();
      // Check negative statuses first to avoid false matches (e.g., "inactive" contains "active")
      if (statusLower.includes('inactive') || statusLower.includes('rejected') || statusLower.includes('blocked') || 
          statusLower.includes('cancelled') || statusLower.includes('terminated')) {
        return 'danger';
      }
      if (statusLower.includes('active') || statusLower.includes('approved') || statusLower.includes('complete')) {
        return 'success';
      }
      if (statusLower.includes('pending') || statusLower.includes('progress')) {
        return 'warning';
      }
      if (statusLower.includes('suspended') || statusLower.includes('expired')) {
        return 'default';
      }
    }

    return 'default';
  }

  private getSizeClass(): string {
    const sizeMap = {
      small: 'text-xs px-2',
      medium: 'text-sm px-3 py-1',
      large: 'text-base px-4 py-1'
    };
    return sizeMap[this.size];
  }
}
