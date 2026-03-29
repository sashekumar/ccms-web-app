import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Card Component
 * Reusable card wrapper for displaying content with standard styling
 * 
 * @example
 * ```html
 * <app-card [title]="'User Information'" [shadow]="true">
 *   <div>Card content goes here</div>
 * </app-card>
 * ```
 */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'rounded-lg ' + (shadow ? 'shadow-md' : 'border border-gray-200') + ' bg-white p-6'">
      <div *ngIf="title" class="mb-4 pb-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      </div>
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
  @Input() title: string | null = null;
  @Input() shadow: boolean = true;
}
