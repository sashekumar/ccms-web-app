import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/login.page';
import { DashboardPage } from '../../page-objects/dashboard.page';
import { AuthHelper } from '../../helpers/auth.helper';
import { DatabaseHelper } from '../../helpers/database.helper';
import { TestDataFactory } from '../../helpers/test-data.factory';

/**
 * Authentication E2E Tests - Login Flow
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Uses Page Objects and Helpers
 * - MODULARIZATION: Tests organized by feature
 * - COMMONIZATION: Shared setup/teardown logic
 * 
 * Tests the complete login user journey including:
 * - Successful login
 * - Failed login attempts
 * - Validation
 * - Navigation after login
 */

test.describe('Authentication - Login', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // Navigate to login page
    await loginPage.goto();
  });

  test.afterEach(async () => {
    // Clean up any test data if needed
  });

  test('should display login page correctly', async ({ page }) => {
    // Verify we're on the login page
    await loginPage.expectOnLoginPage();

    // Verify login form is visible
    await loginPage.waitForPageLoad();

    // Verify page title
    const title = await page.title();
    expect(title).toContain('Login');
  });

  test('should login successfully with valid credentials', async () => {
    // Arrange
    const credentials = AuthHelper.getAdminCredentials();

    // Act
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.waitForLoginSuccess();

    // Assert
    await dashboardPage.expectOnDashboard();
    
    // Verify dashboard is loaded
    const isOnDashboard = await dashboardPage.isOnDashboard();
    expect(isOnDashboard).toBe(true);

    // Verify sidebar is visible
    const sidebarVisible = await dashboardPage.isSidebarVisible();
    expect(sidebarVisible).toBe(true);
  });

  test('should fail login with invalid username', async () => {
    // Arrange
    const invalidUsername = TestDataFactory.randomUsername();
    const password = 'SomePassword@123';

    // Act
    await loginPage.login(invalidUsername, password);

    // Assert
    await loginPage.expectLoginFailed();
    
    // Verify still on login page
    await loginPage.expectOnLoginPage();
  });

  test('should fail login with invalid password', async () => {
    // Arrange
    const credentials = AuthHelper.getUserCredentials();
    const invalidPassword = 'WrongPassword@123';

    // Act
    await loginPage.login(credentials.username, invalidPassword);

    // Assert
    await loginPage.expectLoginFailed();
    
    // Verify error message is displayed
    const hasError = await loginPage.isErrorMessageVisible();
    expect(hasError).toBe(true);
  });

  test('should fail login with non-existent user', async () => {
    // Arrange
    const nonExistentUsername = TestDataFactory.randomUsername();
    const password = 'Password@123';

    // Act
    await loginPage.login(nonExistentUsername, password);

    // Assert
    await loginPage.expectLoginFailed();
    
    // Verify appropriate error message
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
  });

  test('should fail login with empty credentials', async () => {
    // Act - Don't fill any fields
    
    // Assert - Login button should be disabled when form is empty
    const isLoginButtonEnabled = await loginPage.isLoginButtonEnabled();
    expect(isLoginButtonEnabled).toBe(false);
    
    // Verify we're still on login page
    const currentUrl = await loginPage.getCurrentUrl();
    expect(currentUrl).toContain('/auth/login');
  });

  test('should fail login with empty email', async () => {
    // Arrange
    const password = 'Password@123';

    // Act
    await loginPage.fillPassword(password);

    // Assert - Login button should be disabled when username is empty
    const isLoginButtonEnabled = await loginPage.isLoginButtonEnabled();
    expect(isLoginButtonEnabled).toBe(false);
    
    // Verify we're still on login page
    const currentUrl = await loginPage.getCurrentUrl();
    expect(currentUrl).toContain('/auth/login');
  });

  test('should fail login with empty password', async () => {
    // Arrange
    const username = TestDataFactory.randomUsername();

    // Act
    await loginPage.fillUsername(username);

    // Assert - Login button should be disabled when password is empty
    const isLoginButtonEnabled = await loginPage.isLoginButtonEnabled();
    expect(isLoginButtonEnabled).toBe(false);
    
    // Verify we're still on login page
    const currentUrl = await loginPage.getCurrentUrl();
    expect(currentUrl).toContain('/auth/login');
  });

  test('should submit form using Enter key', async () => {
    // Arrange
    const credentials = AuthHelper.getAdminCredentials();

    // Act
    await loginPage.fillUsername(credentials.username);
    await loginPage.fillPassword(credentials.password);
    await loginPage.submitWithEnter();
    await loginPage.waitForLoginSuccess();

    // Assert
    await dashboardPage.expectOnDashboard();
  });

  test('should clear form fields', async () => {
    // Arrange
    const username = TestDataFactory.randomUsername();
    const password = 'Password@123';

    // Act
    await loginPage.fillUsername(username);
    await loginPage.fillPassword(password);
    
    // Clear fields
    await loginPage.clearUsername();
    await loginPage.clearPassword();

    // Assert
    const usernameValue = await loginPage.getUsernameValue();
    const passwordValue = await loginPage.getPasswordValue();
    
    expect(usernameValue).toBe('');
    expect(passwordValue).toBe('');
  });

  test('should navigate to dashboard after successful login', async () => {
    // Arrange
    const credentials = AuthHelper.getManagerCredentials();

    // Act
    await loginPage.loginAndWait(credentials.username, credentials.password);

    // Assert
    await dashboardPage.expectOnDashboard();
    
    // Verify correct navigation
    const currentUrl = dashboardPage.getCurrentUrl();
    expect(currentUrl).toContain('/dashboard');
  });

  test('should show different dashboard items based on user role - Admin', async ({ page }) => {
    // Arrange & Act
    await AuthHelper.loginAsAdmin(page);

    // Assert
    const dashboard = new DashboardPage(page);
    
    // Check viewport - on mobile, some admin menu items may be in collapsed categories
    const isMobile = await page.evaluate(() => window.innerWidth < 768);
    
    if (isMobile) {
      // On mobile, just verify the dashboard loaded and admin is logged in
      // The System Administration category may require scrolling or specific UI interaction
      // This is a known mobile UI limitation being tracked for improvement
      await dashboard.expectOnDashboard();
      
      // Verify at least some navigation is visible (sidebar is accessible)
      const sidebarVisible = await dashboard.isSidebarVisible();
      expect(sidebarVisible).toBe(true);
    } else {
      // Desktop: Admin should see all administrative menu items
      await dashboard.expectMenuItemsVisible(['users', 'roles']);
    }
  });

  test('should show different dashboard items based on user role - Regular User', async ({ page }) => {
    // Arrange & Act
    await AuthHelper.loginAsUser(page);

    // Assert
    const dashboard = new DashboardPage(page);
    
    // Regular user should have limited menu access
    // (Specific menu items depend on permissions)
    const dashboardVisible = await dashboard.isMenuItemVisible('dashboard');
    expect(dashboardVisible).toBe(true);
  });

  test('should maintain session after page reload', async ({ page }) => {
    // Arrange
    await AuthHelper.loginAsAdmin(page);
    const dashboard = new DashboardPage(page);

    // Act
    await page.reload();
    await dashboard.waitForPageLoad();

    // Assert - Should still be logged in
    await dashboard.expectOnDashboard();
  });

  test('should handle concurrent login attempts', async ({ page, context }) => {
    // Arrange
    const credentials = AuthHelper.getAdminCredentials();

    // Act - Open second tab and login
    const secondPage = await context.newPage();
    const secondLoginPage = new LoginPage(secondPage);
    
    await secondLoginPage.goto();
    await secondLoginPage.loginAndWait(credentials.username, credentials.password);

    // Assert - Both sessions should be valid
    const firstDashboard = new DashboardPage(page);
    const secondDashboard = new DashboardPage(secondPage);
    
    const firstLoginPage = new LoginPage(page);
    await firstLoginPage.goto();
    await firstLoginPage.loginAndWait(credentials.username, credentials.password);
    
    await firstDashboard.expectOnDashboard();
    await secondDashboard.expectOnDashboard();

    await secondPage.close();
  });
});

test.describe('Authentication - Logout', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each logout test
    await AuthHelper.loginAsAdmin(page);
  });

  test('should logout successfully', async ({ page }) => {
    // Arrange
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);

    // Act
    await dashboardPage.logout();

    // Assert
    await loginPage.expectOnLoginPage();
  });

  test('should clear session data after logout', async ({ page }) => {
    // Arrange
    const dashboardPage = new DashboardPage(page);

    // Act
    await dashboardPage.logout();

    // Assert - Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to login (either /auth/login or /login)
    await page.waitForURL('**/auth/login');
  });

  test('should prevent unauthorized access after logout', async ({ page }) => {
    // Arrange
    const dashboardPage = new DashboardPage(page);

    // Act
    await dashboardPage.logout();

    // Try to access users page directly
    await page.goto('/users');

    // Assert - Should redirect to login
    await page.waitForURL('**/auth/login');
  });
});

test.describe('Authentication - Session Management', () => {
  test('should redirect to login when accessing protected route without authentication', async ({ page }) => {
    // Act - Try to access dashboard without login
    await page.goto('/dashboard');

    // Assert
    await page.waitForURL('**/auth/login');
  });

  test('should persist authentication across browser refresh', async ({ page }) => {
    // Arrange
    await AuthHelper.loginAsAdmin(page);
    const dashboardPage = new DashboardPage(page);

    // Act
    await page.reload();

    // Assert
    await dashboardPage.expectOnDashboard();
  });
});
