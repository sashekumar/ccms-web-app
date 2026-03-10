import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';
import { DashboardPage } from '../page-objects/dashboard.page';
import { AuthHelper } from '../helpers/auth.helper';

/**
 * Test Fixtures - Extended test with pre-authenticated state
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Shared authentication setup across all tests
 * - COMMONIZATION: Centralized fixture definitions
 * - DRY: No duplicate beforeEach login code
 * 
 * Usage:
 * import { test, expect } from '../fixtures/auth.fixture';
 * 
 * test('my test', async ({ authenticatedPage, dashboardPage }) => {
 *   // Already logged in!
 *   await dashboardPage.navigateToUsers();
 * });
 */

// Define fixture types
type AuthFixtures = {
  /** Page with user already logged in as admin */
  authenticatedPage: Page;
  /** Pre-initialized LoginPage object */
  loginPage: LoginPage;
  /** Pre-initialized DashboardPage object (after login) */
  dashboardPage: DashboardPage;
};

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Provides a page that's already authenticated as admin
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    const credentials = AuthHelper.getAdminCredentials();
    
    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.waitForLoginSuccess();
    
    // Now provide the authenticated page to the test
    await use(page);
  },

  /**
   * Provides LoginPage object
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * Provides DashboardPage after authentication
   */
  dashboardPage: async ({ authenticatedPage }, use) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.expectOnDashboard();
    await use(dashboardPage);
  },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';
