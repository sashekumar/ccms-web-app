import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { RoleService, RoleConfig } from '../../../core/services/role.service';
import { Observable } from 'rxjs';

/**
 * Header component - Top navbar matching CCMS mockup design with sidebar toggle
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styles: []
})
export class HeaderComponent implements OnInit {
  roleMenuOpen = false;
  availableRoles$!: Observable<RoleConfig[]>;
  selectedRole$!: Observable<RoleConfig | null>;
  currentUser: User | null = null;
  isAdmin = false;
  showRoleDropdown = false;

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService,
    private roleService: RoleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      if (user) {
        // Check if user is admin (roleId === 0)
        this.isAdmin = user.roleId === null || user.roleId === 0;
        this.showRoleDropdown = this.isAdmin;
        
        // Initialize roles based on user's roleId
        this.roleService.initializeRoles(user.roleId);
      } else {
        this.isAdmin = false;
        this.showRoleDropdown = false;
      }
    });
    
    this.availableRoles$ = this.roleService.getAllRoles();
    this.selectedRole$ = this.roleService.getSelectedRole();
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  toggleRoleMenu(): void {
    this.roleMenuOpen = !this.roleMenuOpen;
  }

  selectRole(roleId: number): void {
    this.roleService.setSelectedRole(roleId);
    this.roleMenuOpen = false;
  }

  closeMenus(): void {
    this.roleMenuOpen = false;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Navigation handled by auth service
      },
      error: (err) => {
        console.error('Logout error:', err);
        // Force navigation even on error
        this.router.navigate(['/auth/login']);
      }
    });
  }

  getUserInitials(): string {
    if (!this.currentUser || !this.currentUser.fullName) return 'U';
    const names = this.currentUser.fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return this.currentUser.fullName.charAt(0).toUpperCase();
  }
}
