import { test, expect } from '../../fixtures/auth.fixture';
import { ModulesPage } from '../../page-objects/acl';

/**
 * Modules Management E2E Tests (ACL)
 * 
 * Tests module management for Access Control List.
 * Follows coding-standards.md principles:
 * - REUSABILITY: Uses shared auth fixture and page objects
 * - COMMONIZATION: Centralized page interactions in ModulesPage
 * - DRY: No duplicate login/navigation code
 */

test.describe('Modules Management (ACL)', () => {
  let modulesPage: ModulesPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    modulesPage = new ModulesPage(authenticatedPage);
    await modulesPage.navigateToPage();
  });

  test('should display modules page', async () => {
    await modulesPage.expectPageDisplayed();
    await expect(modulesPage.getPageTitle()).toContainText(/Module/i);
  });

  test('should display create module button', async () => {
    await expect(modulesPage.getCreateButton()).toBeVisible();
  });

  test('should display modules table or list', async () => {
    const hasData = await modulesPage.hasDataDisplay();
    expect(hasData).toBe(true);
  });

  test('should have search functionality', async () => {
    await expect(modulesPage.getSearchInput()).toBeVisible();
  });

  test('should navigate to create module form', async ({ authenticatedPage }) => {
    await modulesPage.clickCreate();
    await expect(authenticatedPage).toHaveURL(/admin\/modules/);
  });
});
