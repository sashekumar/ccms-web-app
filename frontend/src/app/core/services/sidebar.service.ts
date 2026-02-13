import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service to manage sidebar state (open/closed)
 * Handles responsive behavior and persistence
 */
@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private isSidebarOpenSubject = new BehaviorSubject<boolean>(this.getInitialState());
  public isSidebarOpen$: Observable<boolean> = this.isSidebarOpenSubject.asObservable();

  constructor() {
    // Listen to window resize for responsive behavior
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.handleResize());
    }
  }

  private getInitialState(): boolean {
    // On desktop (>= 1024px), always start open. On mobile/tablet, check saved state or default closed
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      
      // Desktop: always open by default
      if (width >= 1024) {
        return true;
      }
      
      // Mobile/Tablet: check saved state or default to closed
      const savedState = localStorage.getItem('sidebarOpen');
      if (savedState !== null) {
        return savedState === 'true';
      }
      return false;
    }
    return true;
  }

  private handleResize(): void {
    const width = window.innerWidth;
    
    // Auto-close on mobile/tablet
    if (width < 1024 && this.isSidebarOpenSubject.value) {
      this.close();
    }
    
    // Auto-open on desktop
    if (width >= 1024 && !this.isSidebarOpenSubject.value) {
      this.open();
    }
  }

  get isOpen(): boolean {
    return this.isSidebarOpenSubject.value;
  }

  toggle(): void {
    const newState = !this.isSidebarOpenSubject.value;
    this.isSidebarOpenSubject.next(newState);
    this.saveState(newState);
  }

  open(): void {
    this.isSidebarOpenSubject.next(true);
    this.saveState(true);
  }

  close(): void {
    this.isSidebarOpenSubject.next(false);
    this.saveState(false);
  }

  private saveState(state: boolean): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sidebarOpen', state.toString());
    }
  }

}
