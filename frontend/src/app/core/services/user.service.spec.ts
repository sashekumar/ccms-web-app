import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { UserService } from './user.service';
import { LoggerService } from './logger.service';
import { ApiResponse } from './base-api.service';
import { UserDetail, UserFilters, PaginatedUsers } from '../../shared/models/user.model';
import { environment } from '../../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let loggerServiceMock: { error: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; debug: ReturnType<typeof vi.fn> };
  const apiUrl = environment.apiUrl;

  const mockUser: UserDetail = {
    user: {
      user_id: 1,
      username: 'testuser',
      full_name: 'Test User',
      is_active: true,
      last_login: new Date()
    },
    roles: []
  };

  const mockUsers: PaginatedUsers = {
    users: [
      {
        user_id: 1,
        username: 'user1',
        full_name: 'User One',
        is_active: true,
        last_login: new Date(),
        roles: []
      },
      {
        user_id: 2,
        username: 'user2',
        full_name: 'User Two',
        is_active: true,
        last_login: null,
        roles: []
      }
    ],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1
  };

  beforeEach(() => {
    loggerServiceMock = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        { provide: LoggerService, useValue: loggerServiceMock }
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should construct endpoint correctly', () => {
      expect(service['endpoint']).toBe(`${apiUrl}/users`);
    });
  });

  describe('getUsers()', () => {
    it('should retrieve paginated users with filters', () => {
      const filters: UserFilters = {
        search: 'test',
        page: 1,
        limit: 10,
        is_active: true
      };

      const mockResponse: ApiResponse<PaginatedUsers> = {
        success: true,
        message: 'Users retrieved',
        data: mockUsers
      };

      service.getUsers(filters).subscribe({
        next: (result) => {
          expect(result).toEqual(mockUsers);
          expect(result.users.length).toBe(2);
          expect(result.total).toBe(2);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/list`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filters);
      req.flush(mockResponse);
    });

    it('should handle empty filters', () => {
      const mockResponse: ApiResponse<PaginatedUsers> = {
        success: true,
        data: mockUsers
      };

      service.getUsers().subscribe({
        next: (result) => {
          expect(result).toEqual(mockUsers);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/list`);
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should handle empty results', () => {
      const emptyResult: PaginatedUsers = {
        users: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };

      const mockResponse: ApiResponse<PaginatedUsers> = {
        success: true,
        data: emptyResult
      };

      service.getUsers({ search: 'nonexistent' }).subscribe({
        next: (result) => {
          expect(result.users.length).toBe(0);
          expect(result.total).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/list`);
      req.flush(mockResponse);
    });
  });

  describe('getUserById() - inherited from BaseApiService', () => {
    it('should retrieve user by ID', () => {
      const mockResponse: ApiResponse<UserDetail> = {
        success: true,
        data: mockUser
      };

      service.getUserById(1).subscribe({
        next: (user) => {
          expect(user).toEqual(mockUser);
          expect(user.user.user_id).toBe(1);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle user not found', async () => {
      const testPromise = new Promise<void>((resolve, reject) => {
        service.getUserById(999).subscribe({
          next: () => reject(new Error('Should have failed')),
          error: (error) => {
            try {
              expect(error.message).toContain('not found');
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      const req = httpMock.expectOne(`${apiUrl}/users/999`);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });

      await testPromise;
    });
  });

  describe('createUser()', () => {
    it('should create new user and return userId', () => {
      const newUserData = {
        username: 'newuser',
        password: 'password123',
        full_name: 'New User',
        is_active: true
      };

      const mockResponse: ApiResponse<{ userId: number }> = {
        success: true,
        message: 'User created',
        data: { userId: 1 }
      };

      service.createUser(newUserData).subscribe({
        next: (userId) => {
          expect(userId).toBe(1);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newUserData);
      req.flush(mockResponse);
    });

    it('should handle validation errors', async () => {
      const invalidUser = {
        username: '',
        password: '123', // Too short
        full_name: '',
        is_active: true
      };

      const testPromise = new Promise<void>((resolve, reject) => {
        service.createUser(invalidUser).subscribe({
          next: () => reject(new Error('Should have failed')),
          error: (error) => {
            try {
              expect(error.message).toBeTruthy();
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      const req = httpMock.expectOne(`${apiUrl}/users`);
      req.flush(
        { message: 'Validation failed', error: 'Invalid data' },
        { status: 400, statusText: 'Bad Request' }
      );

      await testPromise;
    });
  });

  describe('updateUser()', () => {
    it('should update user', () => {
      const updates = {
        full_name: 'Updated Name',
        is_active: false
      };

      const mockResponse: ApiResponse<void> = {
        success: true,
        message: 'User updated',
        data: undefined as any
      };

      service.updateUser(1, updates).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush(mockResponse);
    });
  });

  describe('deleteUser()', () => {
    it('should delete user', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        message: 'User deleted',
        data: undefined as any
      };

      service.deleteUser(1).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle deletion errors', async () => {
      const testPromise = new Promise<void>((resolve, reject) => {
        service.deleteUser(999).subscribe({
          next: () => reject(new Error('Should have failed')),
          error: (error) => {
            try {
              expect(error.message).toContain('not found');
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      const req = httpMock.expectOne(`${apiUrl}/users/999`);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });

      await testPromise;
    });
  });

  describe('checkUsernameAvailability()', () => {
    it('should check if username is available', () => {
      const mockResponse: ApiResponse<{ available: boolean }> = {
        success: true,
        data: { available: true }
      };

      service.checkUsernameAvailability('newuser').subscribe({
        next: (available) => {
          expect(available).toBe(true);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/check-username`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'newuser', excludeUserId: undefined });
      req.flush(mockResponse);
    });

    it('should check username availability with exclusion', () => {
      const mockResponse: ApiResponse<{ available: boolean }> = {
        success: true,
        data: { available: true }
      };

      service.checkUsernameAvailability('testuser', 5).subscribe({
        next: (available) => {
          expect(available).toBe(true);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/check-username`);
      expect(req.request.body).toEqual({ username: 'testuser', excludeUserId: 5 });
      req.flush(mockResponse);
    });

    it('should return false when username is taken', () => {
      const mockResponse: ApiResponse<{ available: boolean }> = {
        success: true,
        data: { available: false }
      };

      service.checkUsernameAvailability('existinguser').subscribe({
        next: (available) => {
          expect(available).toBe(false);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/check-username`);
      req.flush(mockResponse);
    });

    it('should handle errors and return false', () => {
      service.checkUsernameAvailability('testuser').subscribe({
        next: (available) => {
          expect(available).toBe(false);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/check-username`);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });
    });
  });
});
