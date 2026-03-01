import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable loading spinner component
 * Displays an animated spinner with optional message
 * 
 * @example
 * <app-loading-spinner></app-loading-spinner>
 * <app-loading-spinner message="Loading users..."></app-loading-spinner>
 * <app-loading-spinner [size]="'large'"></app-loading-spinner>
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center" [ngClass]="containerClass">
      <svg 
        [class]="spinnerClass"
        class="animate-spin text-blue-600" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24">
        <circle 
          class="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          stroke-width="4">
        </circle>
        <path 
          class="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
      </svg>
      <span *ngIf="message" class="ml-2 text-gray-600" [ngClass]="textClass">
        {{ message }}
      </span>
    </div>
  `,
  styles: []
})
export class LoadingSpinnerComponent {
  /**
   * Optional loading message to display next to spinner
   */
  @Input() message?: string;

  /**
   * Size of the spinner
   * - 'small': 4x4 (h-4 w-4)
   * - 'medium': 8x8 (h-8 w-8) - default
   * - 'large': 12x12 (h-12 w-12)
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Vertical padding for the container
   */
  @Input() padding: 'none' | 'small' | 'medium' | 'large' = 'large';

  get spinnerClass(): string {
    const sizeMap = {
      small: 'h-4 w-4',
      medium: 'h-8 w-8',
      large: 'h-12 w-12'
    };
    return sizeMap[this.size];
  }

  get textClass(): string {
    const sizeMap = {
      small: 'text-xs',
      medium: 'text-sm',
      large: 'text-base'
    };
    return sizeMap[this.size];
  }

  get containerClass(): string {
    const paddingMap = {
      none: '',
      small: 'py-4',
      medium: 'py-8',
      large: 'py-12'
    };
    return paddingMap[this.padding];
  }
}
