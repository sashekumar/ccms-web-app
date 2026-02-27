import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';
import { SidebarService } from '../../../core/services/sidebar.service';

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
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout().subscribe({
        next: () => {
          console.log('✅ Logout successful');
        },
        error: (err) => {
          console.error('❌ Logout error:', err);
          // Force navigation even on error
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
