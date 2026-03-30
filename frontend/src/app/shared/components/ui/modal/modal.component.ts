import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Modal Component
 * Reusable modal/dialog component for displaying overlay content
 * 
 * @example
 * ```html
 * <app-modal 
 *   [isOpen]="showModal" 
 *   (onClose)="showModal = false"
 *   [title]="'Confirm Action'"
 *   [size]="'md'">
 *   <p>Are you sure?</p>
 *   <button (click)="confirm()">Yes</button>
 * </app-modal>
 * ```
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Backdrop -->
    <div 
      *ngIf="isOpen" 
      class="fixed inset-0 z-[10000] bg-black opacity-50 cursor-pointer"
      (click)="close()">
    </div>

    <!-- Modal Container (full screen flex center) -->
    <div 
      *ngIf="isOpen" 
      class="fixed inset-0 z-[10001] flex items-center justify-center p-4 pointer-events-none">
      
      <!-- Modal Content Box (gets the size classes) -->
      <div 
        [class]="'bg-white rounded-lg shadow-xl max-w-full pointer-events-auto ' + getModalClass()"
        (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 *ngIf="title" class="text-xl font-semibold text-gray-900">{{ title }}</h2>
          <button 
            (click)="close()" 
            class="text-gray-500 hover:text-gray-700 flex-shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <ng-content></ng-content>
        </div>

        <!-- Footer (if showFooter provided) -->
        <div *ngIf="showFooter" class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button 
            (click)="close()"
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            Close
          </button>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string | null = null;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showFooter: boolean = false;
  @Output() onClose = new EventEmitter<void>();

  close(): void {
    this.onClose.emit();
  }

  getModalClass(): string {
    const sizeClasses = {
      'sm': 'w-full sm:w-96',
      'md': 'w-full sm:w-96 md:w-512',
      'lg': 'w-full sm:w-96 md:w-full lg:w-2/3',
      'xl': 'w-full h-full'
    };
    
    return sizeClasses[this.size] || sizeClasses['md'];
  }
}
