import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
      redirectUrl: '/dashboard'
    };

    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterModule.forRoot([])],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize login form with empty values', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('username')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
      expect(component.loginForm.get('rememberMe')?.value).toBe(false);
    });

    it('should initialize with isSubmitting as false', () => {
      expect(component.isSubmitting).toBe(false);
    });

    it('should initialize with no error message', () => {
      expect(component.errorMessage).toBe('');
      expect(component.showError).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should render form as invalid when empty', () => {
      expect(component.loginForm.valid).toBe(false);
    });

    it('should require username field', () => {
      const usernameControl = component.loginForm.get('username');
      expect(usernameControl?.hasError('required')).toBe(true);

      usernameControl?.setValue('testuser');
      expect(usernameControl?.hasError('required')).toBe(false);
    });

    it('should require password field', () => {
      const passwordControl = component.loginForm.get('password');
      expect(passwordControl?.hasError('required')).toBe(true);

      passwordControl?.setValue('password123');
      expect(passwordControl?.hasError('required')).toBe(false);
    });

    it('should require password to be at least 6 characters', () => {
      const passwordControl = component.loginForm.get('password');
      
      passwordControl?.setValue('12345');
      expect(passwordControl?.hasError('minlength')).toBe(true);

      passwordControl?.setValue('123456');
      expect(passwordControl?.hasError('minlength')).toBe(false);
    });

    it('should mark form as valid with correct values', () => {
      component.loginForm.setValue({
        username: 'testuser',
        password: 'password123',
        rememberMe: false
      });

      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('Form Controls', () => {
    it('should return username control', () => {
      const control = component.usernameControl;
      expect(control).toBe(component.loginForm.get('username'));
    });

    it('should return password control', () => {
      const control = component.passwordControl;
      expect(control).toBe(component.loginForm.get('password'));
    });
  });

  describe('Field Error Messages', () => {
    it('should return empty string for untouched field', () => {
      const error = component.getFieldError('username');
      expect(error).toBe('');
    });

    it('should return required error message for username', () => {
      const usernameControl = component.loginForm.get('username');
      usernameControl?.markAsTouched();
      
      const error = component.getFieldError('username');
      expect(error).toBe('Username is required');
    });

    it('should return required error message for password', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.markAsTouched();
      
      const error = component.getFieldError('password');
      expect(error).toBe('Password is required');
    });

    it('should return minlength error message for password', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('12345');
      passwordControl?.markAsTouched();
      
      const error = component.getFieldError('password');
      expect(error).toBe('Password must be at least 6 characters');
    });

    it('should return empty string for valid field', () => {
      const usernameControl = component.loginForm.get('username');
      usernameControl?.setValue('testuser');
      usernameControl?.markAsTouched();
      
      const error = component.getFieldError('username');
      expect(error).toBe('');
    });
  });

  describe('Form Submission', () => {
    it('should not submit when form is invalid', () => {
      component.onSubmit();

      expect(authServiceMock.login).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBe(false);
    });

    it('should mark all controls as touched when submitting invalid form', () => {
      component.onSubmit();

      expect(component.loginForm.get('username')?.touched).toBe(true);
      expect(component.loginForm.get('password')?.touched).toBe(true);
    });

    it('should call authService.login with correct credentials', () => {
      component.loginForm.setValue({
        username: 'testuser',
        password: 'password123',
        rememberMe: false
      });

      authServiceMock.login.mockReturnValue(of({ success: true, message: 'Login successful' }));

      component.onSubmit();

      expect(authServiceMock.login).toHaveBeenCalledWith('testuser', 'password123');
    });

    it('should set isSubmitting to true during submission', () => {
      component.loginForm.setValue({
        username: 'testuser',
        password: 'password123',
        rememberMe: false
      });

      authServiceMock.login.mockReturnValue(of({ success: true, message: 'Login successful' }));

      component.onSubmit();

      expect(component.isSubmitting).toBe(false); // Reset after completion
    });

    it('should clear error messages on submission', () => {
      component.showError = true;
      component.errorMessage = 'Previous error';

      component.loginForm.setValue({
        username: 'testuser',
        password: 'password123',
        rememberMe: false
      });

      authServiceMock.login.mockReturnValue(of({ success: true, message: 'Login successful' }));

      component.onSubmit();

      expect(component.showError).toBe(false);
      expect(component.errorMessage).toBe('');
    });
  });

  describe('Successful Login', () => {
    beforeEach(() => {
      component.loginForm.setValue({
        username: 'testuser',
        password: 'password123',
        rememberMe: false
      });
    });

    it('should navigate to dashboard on successful login', () => {
      authServiceMock.login.mockReturnValue(of({ success: true, message: 'Login successful' }));

      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should navigate to stored redirectUrl if available', () => {
      authServiceMock.redirectUrl = '/admin/users';
      authServiceMock.login.mockReturnValue(of({ success: true, message: 'Login successful' }));

      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/users']);
    });

    it('should reset redirectUrl after navigation', () => {
      authServiceMock.redirectUrl = '/admin/users';
      authServiceMock.login.mockReturnValue(of({ success: true, message: 'Login successful' }));

      component.onSubmit();

      expect(authServiceMock.redirectUrl).toBe('/dashboard');
    });

    it('should set isSubmitting to false after successful login', () => {
      authServiceMock.login.mockReturnValue(of({ success: true, message: 'Login successful' }));

      component.onSubmit();

      expect(component.isSubmitting).toBe(false);
    });
  });

  describe('Failed Login', () => {
    beforeEach(() => {
      component.loginForm.setValue({
        username: 'testuser',
        password: 'wrongpassword',
        rememberMe: false
      });
    });

    it('should display error message on failed login response', () => {
      authServiceMock.login.mockReturnValue(of({ 
        success: false, 
        message: 'Invalid credentials' 
      }));

      component.onSubmit();

      expect(component.showError).toBe(true);
      expect(component.errorMessage).toBe('Invalid credentials');
    });

    it('should display default error message if none provided', () => {
      authServiceMock.login.mockReturnValue(of({ success: false }));

      component.onSubmit();

      expect(component.showError).toBe(true);
      expect(component.errorMessage).toBe('Login failed');
    });

    it('should set isSubmitting to false after failed login', () => {
      authServiceMock.login.mockReturnValue(of({ 
        success: false, 
        message: 'Invalid credentials' 
      }));

      component.onSubmit();

      expect(component.isSubmitting).toBe(false);
    });

    it('should not navigate on failed login', () => {
      authServiceMock.login.mockReturnValue(of({ 
        success: false, 
        message: 'Invalid credentials' 
      }));

      component.onSubmit();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Login Error Handling', () => {
    beforeEach(() => {
      component.loginForm.setValue({
        username: 'testuser',
        password: 'password123',
        rememberMe: false
      });
    });

    it('should handle HTTP error response', () => {
      const errorResponse = {
        error: { message: 'Server error occurred' }
      };

      authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.showError).toBe(true);
      expect(component.errorMessage).toBe('Server error occurred');
    });

    it('should display default error message when error has no message', () => {
      authServiceMock.login.mockReturnValue(throwError(() => ({ error: {} })));

      component.onSubmit();

      expect(component.showError).toBe(true);
      expect(component.errorMessage).toBe('An error occurred. Please try again.');
    });

    it('should set isSubmitting to false on error', () => {
      authServiceMock.login.mockReturnValue(throwError(() => new Error('Network error')));

      component.onSubmit();

      expect(component.isSubmitting).toBe(false);
    });
  });

  describe('Error Close Handler', () => {
    it('should clear error message and hide error alert', () => {
      component.showError = true;
      component.errorMessage = 'Test error';

      component.onErrorClose();

      expect(component.showError).toBe(false);
      expect(component.errorMessage).toBe('');
    });
  });
});
