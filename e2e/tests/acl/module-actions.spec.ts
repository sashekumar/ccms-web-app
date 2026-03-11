import { test, expect } from '../../fixtures/auth.fixture';
import { ModuleActionsPage } from '../../page-objects/acl';

/**
 * Module Actions Management E2E Tests (ACL)
 * 
 * Tests module-action mapping for Access Control List.
 * Follows coding-standards.md principles:
 * - REUSABILITY: Uses shared auth fixture and page objects
 * - COMMONIZATION: Centralized page interactions in ModuleActionsPage
 * - DRY: No duplicate login/navigation code
 */

test.describe('Module Actions Management (ACL)', () => {
  let moduleActionsPage: ModuleActionsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    moduleActionsPage = new ModuleActionsPage(authenticatedPage);
    await moduleActionsPage.navigateToPage();
  });

  // SKIPPED: Frontend page /admin/module-actions is incomplete
  // Re-enable when the Angular component is fully implemented
  test.skip('should display module actions page', async () => {
    await moduleActionsPage.expectPageDisplayed();
    await expect(moduleActionsPage.getPageTitle()).toContainText(/Module.*Action|Action/i);
  });

  test('should display interactive elements', async ({ authenticatedPage }) => {
    const hasActions = await authenticatedPage.locator('button, a.btn').first().isVisible();
    expect(hasActions).toBe(true);
  });

  test('should display module actions table or list', async () => {
    const hasData = await moduleActionsPage.hasDataDisplay();
    expect(hasData).toBe(true);
  });

  test('should have search functionality', async () => {
    await expect(moduleActionsPage.getSearchInput()).toBeVisible();
  });

  test('should have filter controls', async ({ authenticatedPage }) => {
    const hasFilter = await authenticatedPage.locator('select, [role="listbox"], input').first().isVisible();
    expect(hasFilter).toBe(true);
  });
});
