import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Alert component for displaying informational messages
 * Supports success, error, warning, and info types
 */
@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" [class]="alertClasses" role="alert">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <span [innerHTML]="icon"></span>
        </div>
        <div class="ml-3 flex-1">
          <h3 *ngIf="title" class="text-sm font-medium" [class]="titleColorClass">
            {{ title }}
          </h3>
          <div class="text-sm" [class]="messageColorClass">
            <ng-content></ng-content>
          </div>
        </div>
        <div *ngIf="dismissible" class="ml-auto pl-3">
          <button
            type="button"
            [class]="closeButtonClass"
            (click)="onClose()"
          >
            <span class="sr-only">Dismiss</span>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AlertComponent {
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() title = '';
  @Input() dismissible = false;
  @Input() visible = true;
  @Output() closed = new EventEmitter<void>();

  get alertClasses(): string {
    const baseClasses = 'rounded-lg p-4 mb-4 border';
    
    const typeClasses = {
      success: 'bg-green-50 border-green-200',
      error: 'bg-red-50 border-red-200',
      warning: 'bg-yellow-50 border-yellow-200',
      info: 'bg-blue-50 border-blue-200'
    };

    return `${baseClasses} ${typeClasses[this.type]}`;
  }

  get titleColorClass(): string {
    const colors = {
      success: 'text-green-800',
      error: 'text-red-800',
      warning: 'text-yellow-800',
      info: 'text-blue-800'
    };
    return colors[this.type];
  }

  get messageColorClass(): string {
    const colors = {
      success: 'text-green-700',
      error: 'text-red-700',
      warning: 'text-yellow-700',
      info: 'text-blue-700'
    };
    return colors[this.type];
  }

  get closeButtonClass(): string {
    const colors = {
      success: 'text-green-500 hover:text-green-700',
      error: 'text-red-500 hover:text-red-700',
      warning: 'text-yellow-500 hover:text-yellow-700',
      info: 'text-blue-500 hover:text-blue-700'
    };
    return `inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors[this.type]}`;
  }

  get icon(): string {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return `<span class="text-xl">${icons[this.type]}</span>`;
  }

  onClose(): void {
    this.visible = false;
    this.closed.emit();
  }
}
