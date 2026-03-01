import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { User, UserRole } from '../../../shared/models/user.model';
import { SidebarService } from '../../../core/services/sidebar.service';

/**
 * Header component - Top navbar matching CCMS mockup design with sidebar toggle and role switcher
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styles: []
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  activeRole: UserRole | null = null;
  activeRoleId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private sidebarService: SidebarService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        // Load or set active role
        if (user && user.roles && user.roles.length > 0) {
          this.loadActiveRole();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load active role from session storage or set first role as active
   */
  private loadActiveRole(): void {
    if (!this.currentUser || !this.currentUser.roles || this.currentUser.roles.length === 0) {
      return;
    }

    const savedRoleId = sessionStorage.getItem('activeRoleId');
    
    if (savedRoleId) {
      const roleId = parseInt(savedRoleId);
      const role = this.currentUser.roles.find(r => r.role_id === roleId);
      if (role) {
        this.activeRole = role;
        this.activeRoleId = role.role_id;
        return;
      }
    }

    // Default to first role
    this.activeRole = this.currentUser.roles[0];
    this.activeRoleId = this.activeRole.role_id;
    sessionStorage.setItem('activeRoleId', this.activeRole.role_id.toString());
  }

  /**
   * Handle role change from select dropdown
   */
  onRoleChange(): void {
    if (!this.activeRoleId || !this.currentUser) {
      return;
    }

    const role = this.currentUser.roles.find(r => r.role_id === this.activeRoleId);
    if (!role || this.activeRole?.role_id === role.role_id) {
      return;
    }

    this.activeRole = role;
    sessionStorage.setItem('activeRoleId', role.role_id.toString());

    // Reload permissions for the new role
    this.permissionService.loadUserPermissions().subscribe({
      next: () => {
        console.log(`✅ Switched to role: ${role.role_name}`);
        // Reload the current page to refresh permissions
        window.location.reload();
      },
      error: (err) => {
        console.error('❌ Error reloading permissions:', err);
      }
    });
  }

  /**
   * Check if user has multiple roles
   */
  hasMultipleRoles(): boolean {
    return this.currentUser?.roles && this.currentUser.roles.length > 1 || false;
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout().subscribe({
        next: () => {
          sessionStorage.removeItem('activeRoleId');
        },
        error: (err) => {
          console.error('❌ Logout error:', err);
          sessionStorage.removeItem('activeRoleId');
          this.router.navigate(['/auth/login']);
        }
      });
    }
  }

  getUserInitials(): string {
    if (!this.currentUser || !this.currentUser.full_name) return 'U';
    const names = this.currentUser.full_name.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return this.currentUser.full_name.charAt(0).toUpperCase();
  }
}
