import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Tooltip Component
 * Displays additional information on hover
 * 
 * @example
 * ```html
 * <app-tooltip text="This is a tooltip" position="top">
 *   Hover me
 * </app-tooltip>
 * ```
 */
@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block group">
      <!-- Trigger content -->
      <ng-content></ng-content>

      <!-- Tooltip content -->
      <div [class]="'absolute z-10 invisible group-hover:visible ' + getPositionClass() + ' ' + getTooltipClass()">
        <div class="bg-gray-900 text-white text-sm rounded py-2 px-3 whitespace-nowrap">
          {{ text }}
        </div>
        <!-- Arrow pointer -->
        <div [class]="'absolute w-0 h-0 ' + getArrowClass()"></div>
      </div>
    </div>
  `
})
export class TooltipComponent {
  @Input() text: string = '';
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'top';

  getPositionClass(): string {
    const positions = {
      'top': 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      'bottom': 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      'left': 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      'right': 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    };
    
    return positions[this.position] || positions['top'];
  }

  getTooltipClass(): string {
    const baseClass = 'opacity-0 group-hover:opacity-100 transition-opacity duration-300';
    return baseClass;
  }

  getArrowClass(): string {
    const arrowClasses = {
      'top': 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900',
      'bottom': 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900',
      'left': 'right-0 top-1/2 transform translate-x-full -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-gray-900',
      'right': 'left-0 top-1/2 transform -translate-x-full -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-gray-900'
    };
    
    return arrowClasses[this.position] || arrowClasses['top'];
  }
}
