import { test, expect } from '../../fixtures/auth.fixture';
import { ActionsPage } from '../../page-objects/acl';

/**
 * Actions Management E2E Tests (ACL)
 * 
 * Tests action management for Access Control List.
 * Follows coding-standards.md principles:
 * - REUSABILITY: Uses shared auth fixture and page objects
 * - COMMONIZATION: Centralized page interactions in ActionsPage
 * - DRY: No duplicate login/navigation code
 */

test.describe('Actions Management (ACL)', () => {
  let actionsPage: ActionsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    actionsPage = new ActionsPage(authenticatedPage);
    await actionsPage.navigateToPage();
  });

  test('should display actions page', async () => {
    await actionsPage.expectPageDisplayed();
    await expect(actionsPage.getPageTitle()).toContainText(/Action/i);
  });

  test('should display create action button', async () => {
    await expect(actionsPage.getCreateButton()).toBeVisible();
  });

  test('should display actions table or list', async () => {
    const hasData = await actionsPage.hasDataDisplay();
    expect(hasData).toBe(true);
  });

  test('should have search functionality', async () => {
    await expect(actionsPage.getSearchInput()).toBeVisible();
  });

  test('should navigate to create action form', async ({ authenticatedPage }) => {
    await actionsPage.clickCreate();
    await expect(authenticatedPage).toHaveURL(/admin\/actions/);
  });
});
