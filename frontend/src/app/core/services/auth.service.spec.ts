import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError, delay } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService, ApiResponse } from './auth.service';
import { ApiService } from './api.service';
import { PermissionService } from './permission.service';
import { User } from '../../shared/models/user.model';
import { API_ENDPOINTS } from '../constants';

describe('AuthService', () => {
  let service: AuthService;
  let apiServiceMock: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let permissionServiceMock: { loadUserPermissions: ReturnType<typeof vi.fn>; clearAllData: ReturnType<typeof vi.fn> };

  const mockUser: User = {
    user_id: 1,
    username: 'testuser',
    full_name: 'Test User',
    is_active: true,
    last_login: new Date(),
    roles: []
  };

  const mockCsrfResponse: ApiResponse<{ csrfToken: string }> = {
    success: true,
    message: 'CSRF token generated',
    data: { csrfToken: 'test-csrf-token' }
  };

  const mockLoginResponse: ApiResponse<User> = {
    success: true,
    message: 'Login successful',
    data: mockUser
  };

  const mockPermissions = {
    categories: [],
    uncategorized_modules: [],
    modules: []
  };

  beforeEach(() => {
    // Create mock objects with Vitest
    apiServiceMock = {
      get: vi.fn(),
      post: vi.fn()
    };
    routerMock = {
      navigate: vi.fn()
    };
    permissionServiceMock = {
      loadUserPermissions: vi.fn(),
      clearAllData: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: PermissionService, useValue: permissionServiceMock }
      ]
    });

    service = TestBed.inject(AuthService);

    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with null current user', () => {
      service.currentUser$.subscribe(user => {
        expect(user).toBeNull();
      });
    });

    it('should have default redirectUrl', () => {
      expect(service.redirectUrl).toBe('/dashboard');
    });
  });

  describe('initializeAuth()', () => {
    it('should initialize auth with valid user session', async () => {
      apiServiceMock.get.mockReturnValue(of(mockLoginResponse));
      permissionServiceMock.loadUserPermissions.mockReturnValue(of(mockPermissions));

      await service.initializeAuth();

      expect(apiServiceMock.get).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.ME);
      expect(permissionServiceMock.loadUserPermissions).toHaveBeenCalled();
      expect(service.getCurrentUser()).toEqual(mockUser);
      expect(sessionStorage.getItem('currentUser')).toBeTruthy();
    });

    it('should handle initialization with no valid session', async () => {
      apiServiceMock.get.mockReturnValue(
        throwError(() => new Error('Unauthorized'))
      );

      await service.initializeAuth();

      expect(service.getCurrentUser()).toBeNull();
    });

    it('should resolve even if permissions fail to load', async () => {
      apiServiceMock.get.mockReturnValue(of(mockLoginResponse));
      permissionServiceMock.loadUserPermissions.mockReturnValue(
        throwError(() => new Error('Permission error'))
      );

      await service.initializeAuth();

      expect(service.getCurrentUser()).toEqual(mockUser);
    });
  });

  describe('getCsrfToken()', () => {
    it('should retrieve CSRF token', () => {
      apiServiceMock.get.mockReturnValue(of(mockCsrfResponse));

      service.getCsrfToken().subscribe({
        next: (response) => {
          expect(response.data.csrfToken).toBe('test-csrf-token');
          expect(apiServiceMock.get).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.CSRF_TOKEN);
        }
      });
    });
  });

  describe('login()', () => {
    beforeEach(() => {
      apiServiceMock.get.mockReturnValue(of(mockCsrfResponse));
      permissionServiceMock.loadUserPermissions.mockReturnValue(of(mockPermissions));
    });

    it('should login user successfully', () => {
      apiServiceMock.post.mockReturnValue(of(mockLoginResponse));

      service.login('testuser', 'password123').subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.data).toEqual(mockUser);
          expect(service.getCurrentUser()).toEqual(mockUser);
          expect(sessionStorage.getItem('currentUser')).toBeTruthy();
        }
      });
    });

    it('should get CSRF token before login', () => {
      apiServiceMock.post.mockReturnValue(of(mockLoginResponse));

      service.login('testuser', 'password123').subscribe({
        next: () => {
          expect(apiServiceMock.get).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.CSRF_TOKEN);
          expect(apiServiceMock.post).toHaveBeenCalledWith(
            API_ENDPOINTS.AUTH.LOGIN,
            { username: 'testuser', password: 'password123' },
            { 'X-CSRF-Token': 'test-csrf-token' }
          );
        }
      });
    });

    it('should load permissions after login', () => {
      apiServiceMock.post.mockReturnValue(of(mockLoginResponse));

      service.login('testuser', 'password123').subscribe({
        next: () => {
          expect(permissionServiceMock.loadUserPermissions).toHaveBeenCalled();
        }
      });
    });

    it('should handle login failure', () => {
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Invalid credentials'))
      );

      service.login('testuser', 'wrongpassword').subscribe({
        next: () => {
          throw new Error('Should have failed');
        },
        error: (error) => {
          expect(error.message).toContain('Invalid credentials');
        }
      });
    });

    it('should proceed with login even if permissions fail', () => {
      apiServiceMock.post.mockReturnValue(of(mockLoginResponse));
      permissionServiceMock.loadUserPermissions.mockReturnValue(
        throwError(() => new Error('Permission error'))
      );

      service.login('testuser', 'password123').subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(service.getCurrentUser()).toEqual(mockUser);
        }
      });
    });
  });

  describe('logout()', () => {
    beforeEach(() => {
      // Set up logged-in state
      service['currentUserSubject'].next(mockUser);
      sessionStorage.setItem('currentUser', JSON.stringify(mockUser));
    });

    it('should logout user successfully', () => {
      const mockLogoutResponse: ApiResponse<null> = {
        success: true,
        message: 'Logged out',
        data: null
      };

      apiServiceMock.post.mockReturnValue(of(mockLogoutResponse));

      service.logout().subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(service.getCurrentUser()).toBeNull();
          expect(sessionStorage.getItem('currentUser')).toBeNull();
          expect(permissionServiceMock.clearAllData).toHaveBeenCalled();
          expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
        }
      });
    });

    it('should clear all user data on logout', () => {
      const mockLogoutResponse: ApiResponse<null> = {
        success: true,
        message: 'Logged out',
        data: null
      };

      apiServiceMock.post.mockReturnValue(of(mockLogoutResponse));

      service.logout().subscribe({
        next: () => {
          expect(service.isAuthenticated()).toBe(false);
        }
      });
    });
  });

  describe('refreshAccessToken()', () => {
    it('should refresh token successfully', () => {
      const mockRefreshResponse: ApiResponse<null> = {
        success: true,
        message: 'Token refreshed',
        data: null
      };

      apiServiceMock.post.mockReturnValue(of(mockRefreshResponse));

      service.refreshAccessToken().subscribe({
        next: (success) => {
          expect(success).toBe(true);
          expect(apiServiceMock.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.REFRESH, {});
        }
      });
    });

    it('should handle refresh failure and logout', () => {
      service['currentUserSubject'].next(mockUser);
      
      apiServiceMock.post.mockReturnValue(
        throwError(() => new Error('Token expired'))
      );

      service.refreshAccessToken().subscribe({
        next: () => {
          throw new Error('Should have failed');
        },
        error: (error) => {
          expect(service.getCurrentUser()).toBeNull();
          expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
          expect(permissionServiceMock.clearAllData).toHaveBeenCalled();
        }
      });
    });

    it('should prevent concurrent refresh requests', async () => {
      const mockRefreshResponse: ApiResponse<null> = {
        success: true,
        message: 'Token refreshed',
        data: null
      };

      // Use delay to simulate async API call so first request is still in progress
      // when second request is made
      apiServiceMock.post.mockReturnValue(of(mockRefreshResponse).pipe(delay(10)));

      // Make two concurrent refresh calls
      const promise1 = new Promise((resolve) => {
        service.refreshAccessToken().subscribe(resolve);
      });
      
      // Start second call immediately (while first is still in progress)
      const promise2 = new Promise((resolve) => {
        service.refreshAccessToken().subscribe(resolve);
      });
      
      await Promise.all([promise1, promise2]);
      
      // Should only have been called once - second call reused the first's observable
      expect(apiServiceMock.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentUser()', () => {
    it('should return null when no user is logged in', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should return current user when logged in', () => {
      service['currentUserSubject'].next(mockUser);
      expect(service.getCurrentUser()).toEqual(mockUser);
    });
  });

  describe('isAuthenticated()', () => {
    it('should return false when no user is logged in', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true when user is logged in', () => {
      service['currentUserSubject'].next(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('isRefreshingToken()', () => {
    it('should return false initially', () => {
      expect(service.isRefreshingToken()).toBe(false);
    });

    it('should return true during token refresh', () => {
      service['isRefreshing'] = true;
      expect(service.isRefreshingToken()).toBe(true);
    });
  });

  describe('getRefreshState()', () => {
    it('should return refresh state observable', () => {
      service.getRefreshState().subscribe({
        next: (state) => {
          expect(typeof state).toBe('boolean');
        }
      });
    });
  });
});
