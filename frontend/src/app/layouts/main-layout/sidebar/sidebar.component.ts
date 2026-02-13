import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter, Observable } from 'rxjs';
import { SidebarService } from '../../../core/services/sidebar.service';
import { RoleService, MenuItem } from '../../../core/services/role.service';

/**
 * Sidebar navigation component with role-based menu items
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
  menuItems$!: Observable<MenuItem[]>;
  private destroy$ = new Subject<void>();

  constructor(
    private sidebarService: SidebarService,
    private roleService: RoleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sidebarService.isSidebarOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOpen => this.isOpen = isOpen);

    // Get menu items for selected role
    this.menuItems$ = this.roleService.getCurrentMenuItems();

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
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
}
