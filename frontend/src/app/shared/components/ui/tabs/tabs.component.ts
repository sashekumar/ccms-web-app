import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Tabs Component
 * Tabbed interface for organizing content into multiple sections
 * 
 * @example
 * ```html
 * <app-tabs [tabs]="tabsList" [activeTabIndex]="0">
 *   <ng-container *ngFor="let tab of tabsList; let i = index">
 *     <ng-template [ngIf]="i === activeTabIndex">
 *       <div>{{ tab.content }}</div>
 *     </ng-template>
 *   </ng-container>
 * </app-tabs>
 * ```
 */

export interface Tab {
  label: string;
  content: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Tab buttons -->
    <div class="flex border-b border-gray-200">
      <button
        *ngFor="let tab of tabs; let i = index"
        (click)="setActiveTab(i)"
        [disabled]="tab.disabled"
        [class]="'px-4 py-2 font-medium text-sm transition-colors ' + getTabButtonClass(i, tab.disabled)">
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab content -->
    <div class="p-4">
      <ng-content></ng-content>
    </div>
  `
})
export class TabsComponent implements OnInit {
  @Input() tabs: Tab[] = [];
  @Input() activeTabIndex: number = 0;

  ngOnInit(): void {
    if (this.activeTabIndex < 0 || this.activeTabIndex >= this.tabs.length) {
      this.activeTabIndex = 0;
    }
  }

  setActiveTab(index: number): void {
    if (index >= 0 && index < this.tabs.length && !this.tabs[index].disabled) {
      this.activeTabIndex = index;
    }
  }

  getTabButtonClass(index: number, disabled?: boolean): string {
    const isActive = index === this.activeTabIndex;
    
    if (disabled) {
      return 'text-gray-400 cursor-not-allowed';
    }
    
    if (isActive) {
      return 'text-blue-600 border-b-2 border-blue-600 cursor-pointer';
    }
    
    return 'text-gray-700 hover:text-gray-900 cursor-pointer border-b-2 border-transparent hover:border-gray-300';
  }
}
