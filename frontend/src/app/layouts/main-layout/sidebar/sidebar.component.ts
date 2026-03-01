import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { SidebarService } from '../../../core/services/sidebar.service';
import { MenuService, MenuItem } from '../../../core/services/menu.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Sidebar navigation component with permission-based menu items
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styles: []
})
export class SidebarComponent implements OnInit, OnDestroy {
  isOpen = true;
  currentRoute = '';
  menuItems: MenuItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private sidebarService: SidebarService,
    private menuService: MenuService,
    private router: Router,
    private authService: AuthService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.sidebarService.isSidebarOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOpen => this.isOpen = isOpen);

    // Subscribe to menu items and store them directly
    this.menuService.getCurrentMenuItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.menuItems = items;
      });

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        // Auto-close sidebar on mobile after navigation
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          this.sidebarService.close();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isActive(route: string): boolean {
    if (!route) return false;
    return this.currentRoute.startsWith(route);
  }

  toggleSubmenu(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  closeSidebar(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.sidebarService.close();
    }
  }

  onMenuItemClick(item: MenuItem, event: Event): void {
    // Handle logout with confirmation
    if (item.id === 'logout') {
      event.preventDefault();
      this.confirmLogout();
    }
  }

  private confirmLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout().subscribe({
        next: () => {
          // Navigate to login handled by auth service
        },
        error: (error) => {
          this.logger.error('Logout failed', error);
          // Still navigate to login on error
          this.router.navigate(['/auth/login']);
        }
      });
    }
  }

  /**
   * TrackBy function for menu items
   * Improves ngFor performance by tracking items by unique identifier
   */
  trackByMenuId(index: number, item: MenuItem): string {
    return item.id;
  }
}
