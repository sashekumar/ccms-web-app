import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Progress Bar Component
 * Visual progress indicator for displaying completion percentage
 * 
 * @example
 * ```html
 * <app-progress-bar [percentage]="65" [color]="'blue'" [showLabel]="true"></app-progress-bar>
 * ```
 */
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full">
      <!-- Label and percentage text -->
      <div *ngIf="showLabel" class="flex items-center justify-between mb-2">
        <span *ngIf="label" class="text-sm font-medium text-gray-700">{{ label }}</span>
        <span class="text-sm font-medium text-gray-700">{{ percentage }}%</span>
      </div>

      <!-- Progress bar container -->
      <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          [style.width.%]="percentage"
          [class]="'h-full transition-all duration-300 ' + getColorClass()"
          style="min-width: 2px;">
        </div>
      </div>

      <!-- Status text -->
      <div *ngIf="status" class="mt-1 text-xs text-gray-600">
        {{ status }}
      </div>
    </div>
  `
})
export class ProgressBarComponent {
  @Input() percentage: number = 0;
  @Input() label: string | null = null;
  @Input() color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' = 'blue';
  @Input() showLabel: boolean = true;
  @Input() status: string | null = null;

  getColorClass(): string {
    const colorClasses = {
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'red': 'bg-red-500',
      'yellow': 'bg-yellow-500',
      'purple': 'bg-purple-500'
    };
    
    return colorClasses[this.color] || colorClasses['blue'];
  }
}
