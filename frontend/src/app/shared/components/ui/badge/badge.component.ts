import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Badge Component
 * Small label component for displaying tags, statuses, and categories
 * 
 * @example
 * ```html
 * <app-badge [variant]="'success'" [size]="'sm'">Active</app-badge>
 * <app-badge [variant]="'danger'" [size]="'md'">Pending</app-badge>
 * ```
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="getClasses()">
      <ng-content></ng-content>
    </span>
  `
})
export class BadgeComponent {
  @Input() variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'default';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'sm';

  getClasses(): string {
    const baseClasses = 'inline-block font-semibold rounded-full';
    
    // Size classes
    const sizeClasses = {
      'xs': 'px-2 py-1 text-xs',
      'sm': 'px-3 py-1 text-sm',
      'md': 'px-4 py-2 text-base',
      'lg': 'px-5 py-3 text-lg'
    };
    
    // Variant classes
    const variantClasses = {
      'default': 'bg-gray-200 text-gray-800',
      'primary': 'bg-blue-100 text-blue-800',
      'success': 'bg-green-100 text-green-800',
      'warning': 'bg-yellow-100 text-yellow-800',
      'danger': 'bg-red-100 text-red-800',
      'info': 'bg-cyan-100 text-cyan-800'
    };
    
    return `${baseClasses} ${sizeClasses[this.size]} ${variantClasses[this.variant]}`;
  }
}
