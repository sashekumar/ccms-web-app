import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { User, UserRole } from '../../../shared/models/user.model';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockAuthService: any;
  let mockPermissionService: any;
  let mockSidebarService: any;
  let mockRouter: any;
  let currentUserSubject: BehaviorSubject<User | null>;
  let reloadSpy: any;

  const mockUser: User = {
    user_id: 1,
    username: 'testuser',
    full_name: 'Test User',
    is_active: true,
    last_login: new Date(),
    roles: [
      { role_id: 1, role_name: 'Admin', role_code: 'ADMIN' },
      { role_id: 2, role_name: 'User', role_code: 'USER' }
    ]
  };

  const mockSingleRoleUser: User = {
    ...mockUser,
    roles: [{ role_id: 1, role_name: 'Admin', role_code: 'ADMIN' }]
  };

  beforeEach(() => {
    // Mock window.location.reload at the suite level
    reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        reload: reloadSpy,
      },
      writable: true,
    });

    currentUserSubject = new BehaviorSubject<User | null>(null);

    mockAuthService = {
      currentUser$: currentUserSubject.asObservable(),
      logout: vi.fn()
    };

    mockPermissionService = {
      loadUserPermissions: vi.fn()
    };

    mockSidebarService = {
      toggle: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: SidebarService, useValue: mockSidebarService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with null user and role', () => {
      expect(component.currentUser).toBeNull();
      expect(component.activeRole).toBeNull();
      expect(component.activeRoleId).toBeNull();
    });
  });

  describe('User and Role Management', () => {
    it('should load user from auth service on init', () => {
      currentUserSubject.next(mockUser);
      fixture.detectChanges();

      expect(component.currentUser).toEqual(mockUser);
    });

    it('should set active role when user has roles', () => {
      currentUserSubject.next(mockUser);
      fixture.detectChanges();

      expect(component.activeRole).toBeTruthy();
      expect(component.activeRole?.role_id).toBe(mockUser.roles[0].role_id);
      expect(component.activeRoleId).toBe(mockUser.roles[0].role_id);
    });

    it('should load active role from session storage if available', () => {
      const savedRoleId = '2';
      sessionStorage.setItem('activeRoleId', savedRoleId);

      currentUserSubject.next(mockUser);
      fixture.detectChanges();

      expect(component.activeRole?.role_id).toBe(2);
      expect(component.activeRoleId).toBe(2);

      sessionStorage.removeItem('activeRoleId');
    });

    it('should default to first role if no saved role', () => {
      sessionStorage.removeItem('activeRoleId');

      currentUserSubject.next(mockUser);
      fixture.detectChanges();

      expect(component.activeRole).toEqual(mockUser.roles[0]);
      expect(component.activeRoleId).toBe(mockUser.roles[0].role_id);
    });

    it('should save active role to session storage', () => {
      sessionStorage.removeItem('activeRoleId');

      currentUserSubject.next(mockUser);
      fixture.detectChanges();

      const savedRoleId = sessionStorage.getItem('activeRoleId');
      expect(savedRoleId).toBe(mockUser.roles[0].role_id.toString());

      sessionStorage.removeItem('activeRoleId');
    });
  });

  describe('Role Switching', () => {
    beforeEach(() => {
      sessionStorage.removeItem('activeRoleId');
      currentUserSubject.next(mockUser);
      fixture.detectChanges();
    });

    afterEach(() => {
      sessionStorage.removeItem('activeRoleId');
      reloadSpy.mockClear();
    });

    it('should switch role when onRoleChange is called', () => {
      mockPermissionService.loadUserPermissions.mockReturnValue(of({}));

      component.activeRoleId = 2;
      component.onRoleChange();

      expect(component.activeRole?.role_id).toBe(2);
      expect(sessionStorage.getItem('activeRoleId')).toBe('2');
      expect(mockPermissionService.loadUserPermissions).toHaveBeenCalled();
    });

    it('should reload permissions after role switch', () => {
      mockPermissionService.loadUserPermissions.mockReturnValue(of({}));

      component.activeRoleId = 2;
      component.onRoleChange();

      expect(mockPermissionService.loadUserPermissions).toHaveBeenCalled();
    });

    it('should not switch if role is same as current', () => {
      const initialRole = component.activeRole;
      component.activeRoleId = initialRole?.role_id || null;
      
      component.onRoleChange();

      expect(mockPermissionService.loadUserPermissions).not.toHaveBeenCalled();
    });

    it('should handle permission reload error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockPermissionService.loadUserPermissions.mockReturnValue(
        throwError(() => new Error('Permission error'))
      );

      component.activeRoleId = 2;
      component.onRoleChange();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error reloading permissions'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
      sessionStorage.removeItem('activeRoleId');
    });

    it('should not change role if activeRoleId is null', () => {
      component.activeRoleId = null;
      component.onRoleChange();

      expect(mockPermissionService.loadUserPermissions).not.toHaveBeenCalled();
    });

    it('should not change role if currentUser is null', () => {
      component.currentUser = null;
      component.activeRoleId = 2;
      component.onRoleChange();

      expect(mockPermissionService.loadUserPermissions).not.toHaveBeenCalled();
    });
  });

  describe('hasMultipleRoles', () => {
    it('should return true when user has multiple roles', () => {
      currentUserSubject.next(mockUser);
      fixture.detectChanges();

      expect(component.hasMultipleRoles()).toBe(true);
    });

    it('should return false when user has single role', () => {
      currentUserSubject.next(mockSingleRoleUser);
      fixture.detectChanges();

      expect(component.hasMultipleRoles()).toBe(false);
    });

    it('should return false when user has no roles', () => {
      const noRoleUser = { ...mockUser, roles: [] };
      currentUserSubject.next(noRoleUser);
      fixture.detectChanges();

      expect(component.hasMultipleRoles()).toBe(false);
    });

    it('should return false when user is null', () => {
      currentUserSubject.next(null);
      fixture.detectChanges();

      expect(component.hasMultipleRoles()).toBe(false);
    });
  });

  describe('Sidebar Toggle', () => {
    it('should call sidebar service toggle', () => {
      component.toggleSidebar();

      expect(mockSidebarService.toggle).toHaveBeenCalled();
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      sessionStorage.setItem('activeRoleId', '1');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    afterEach(() => {
      sessionStorage.removeItem('activeRoleId');
    });

    it('should call auth service logout when confirmed', () => {
      mockAuthService.logout.mockReturnValue(of({}));

      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should remove activeRoleId from session storage on logout', () => {
      mockAuthService.logout.mockReturnValue(of({}));

      component.logout();

      expect(sessionStorage.getItem('activeRoleId')).toBeNull();
    });

    it('should not logout if not confirmed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      component.logout();

      expect(mockAuthService.logout).not.toHaveBeenCalled();
      expect(sessionStorage.getItem('activeRoleId')).toBe('1');
    });

    it('should navigate to login on logout error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAuthService.logout.mockReturnValue(throwError(() => new Error('Logout error')));

      component.logout();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
      expect(sessionStorage.getItem('activeRoleId')).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getUserInitials', () => {
    it('should return initials for full name with two words', () => {
      component.currentUser = mockUser;

      const initials = component.getUserInitials();

      expect(initials).toBe('TU');
    });

    it('should return first letter for single word name', () => {
      component.currentUser = { ...mockUser, full_name: 'TestUser' };

      const initials = component.getUserInitials();

      expect(initials).toBe('T');
    });

    it('should return first and last initials for three word name', () => {
      component.currentUser = { ...mockUser, full_name: 'Test Middle User' };

      const initials = component.getUserInitials();

      expect(initials).toBe('TU');
    });

    it('should return U for null user', () => {
      component.currentUser = null;

      const initials = component.getUserInitials();

      expect(initials).toBe('U');
    });

    it('should return U for user with empty name', () => {
      component.currentUser = { ...mockUser, full_name: '' };

      const initials = component.getUserInitials();

      expect(initials).toBe('U');
    });
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const destroySpy = vi.spyOn(component['destroy$'], 'next');
      const completeSpy = vi.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('DOM Integration', () => {
    it('should display user full name', () => {
      currentUserSubject.next(mockUser);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const userInfoDiv = compiled.querySelector('.text-right.leading-tight');

      expect(userInfoDiv).toBeTruthy();
      expect(userInfoDiv?.textContent).toContain(mockUser.full_name);
    });

    it('should display role badge when active role exists', () => {
      currentUserSubject.next(mockUser);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const roleBadge = compiled.querySelector('.uppercase.tracking-wide');

      expect(roleBadge?.textContent?.trim()).toBe(mockUser.roles[0].role_code);
    });

    it('should show role select dropdown when user has multiple roles', () => {
      currentUserSubject.next(mockUser);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const selectElement = compiled.querySelector('select');

      expect(selectElement).toBeTruthy();
      expect(selectElement?.options.length).toBe(mockUser.roles.length);
    });

    it('should not show role select dropdown when user has single role', () => {
      currentUserSubject.next(mockSingleRoleUser);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const selectElement = compiled.querySelector('select');

      expect(selectElement).toBeFalsy();
    });

    it('should have logout button', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const logoutButton = compiled.querySelector('button[title="Logout"]');

      expect(logoutButton).toBeTruthy();
    });

    it('should have sidebar toggle button', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const toggleButton = compiled.querySelector('button[aria-label="Toggle sidebar"]');

      expect(toggleButton).toBeTruthy();
    });
  });
});
