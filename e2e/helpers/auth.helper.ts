import { Page } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';

/**
 * Authentication Helper - Reusable authentication utilities
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Login logic used across all test suites
 * - COMMONIZATION: Centralized authentication
 * - DRY: No duplicate login code in tests
 * 
 * Provides quick authentication methods for different user roles.
 */

export class AuthHelper {
  // Test user credentials (from migration script)
  private static readonly credentials = {
    admin: {
      username: 'admin',
      password: 'Password123!',
    },
  };

  /**
   * Login as System Admin
   * @param page - Playwright page object
   */
  static async loginAsAdmin(page: Page): Promise<void> {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWait(
      this.credentials.admin.username,
      this.credentials.admin.password
    );
  }

  /**
   * Login as Regular User
   * Note: Use admin for now, create additional users if needed
   * @param page - Playwright page object
   */
  static async loginAsUser(page: Page): Promise<void> {
    await this.loginAsAdmin(page);
  }

  /**
   * Login as Manager
   * Note: Use admin for now, create additional users if needed
   * @param page - Playwright page object
   */
  static async loginAsManager(page: Page): Promise<void> {
    await this.loginAsAdmin(page);
  }

  /**
   * Login with custom credentials
   * @param page - Playwright page object
   * @param username - Username
   * @param password - User password
   */
  static async login(page: Page, username: string, password: string): Promise<void> {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWait(username, password);
  }

  /**
   * Login and navigate to specific page
   * @param page - Playwright page object
   * @param role - User role (admin, user, manager)
   * @param path - Target path after login
   */
  static async loginAndNavigate(
    page: Page,
    role: 'admin' | 'user' | 'manager',
    path: string
  ): Promise<void> {
    // Login first
    switch (role) {
      case 'admin':
        await this.loginAsAdmin(page);
        break;
      case 'user':
        await this.loginAsUser(page);
        break;
      case 'manager':
        await this.loginAsManager(page);
        break;
    }

    // Navigate to target path
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }

  /**
   * Get admin credentials
   */
  static getAdminCredentials(): { username: string; password: string } {
    return { ...this.credentials.admin };
  }

  /**
   * Get user credentials  
   */
  static getUserCredentials(): { username: string; password: string } {
    return { ...this.credentials.admin }; // Using admin for now
  }

  /**
   * Get manager credentials
   */
  static getManagerCredentials(): { username: string; password: string } {
    return { ...this.credentials.admin }; // Using admin for now
  }

  /**
   * Login via API (faster for test setup)
   * Returns authentication token
   * @param username - Username
   * @param password - User password
   */
  static async loginViaAPI(username: string, password: string): Promise<string> {
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.token;
  }

  /**
   * Set authentication token in browser storage
   * Use this to skip login UI for faster tests
   * @param page - Playwright page object
   * @param token - JWT token
   */
  static async setAuthToken(page: Page, token: string): Promise<void> {
    await page.goto('/'); // Must be on the same origin
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, token);
  }

  /**
   * Quick authenticated session (API login + token injection)
   * Fastest way to authenticate for tests that don't test login flow
   * @param page - Playwright page object
   * @param role - User role (all use admin for now)
   */
  static async quickAuth(page: Page, role: 'admin' | 'user' | 'manager'): Promise<void> {
    const credentials = this.credentials.admin; // Using admin for all roles
    const token = await this.loginViaAPI(credentials.username, credentials.password);
    await this.setAuthToken(page, token);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  }

  /**
   * Logout from application
   * @param page - Playwright page object
   */
  static async logout(page: Page): Promise<void> {
    // Click user menu and logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('**/login');
  }

  /**
   * Check if user is authenticated
   * @param page - Playwright page object
   */
  static async isAuthenticated(page: Page): Promise<boolean> {
    const token = await page.evaluate(() => {
      return localStorage.getItem('authToken');
    });
    return !!token;
  }

  /**
   * Clear authentication
   * @param page - Playwright page object
   */
  static async clearAuth(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.removeItem('authToken');
      sessionStorage.clear();
    });
  }

  /**
   * Get current authentication token
   * @param page - Playwright page object
   */
  static async getAuthToken(page: Page): Promise<string | null> {
    return await page.evaluate(() => {
      return localStorage.getItem('authToken');
    });
  }
}
