import { test, expect } from '../../fixtures/auth.fixture';
import { CategoriesPage } from '../../page-objects/acl';

/**
 * Categories Management E2E Tests (ACL)
 * 
 * Tests category management for Access Control List.
 * Follows coding-standards.md principles:
 * - REUSABILITY: Uses shared auth fixture and page objects
 * - COMMONIZATION: Centralized page interactions in CategoriesPage
 * - DRY: No duplicate login/navigation code
 */

test.describe('Categories Management (ACL)', () => {
  let categoriesPage: CategoriesPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    categoriesPage = new CategoriesPage(authenticatedPage);
    await categoriesPage.navigateToPage();
  });

  test('should display categories page', async () => {
    await categoriesPage.expectPageDisplayed();
    await expect(categoriesPage.getPageTitle()).toContainText(/Categor/i);
  });

  test('should display create category button', async () => {
    await expect(categoriesPage.getCreateButton()).toBeVisible();
  });

  test('should display categories table or list', async () => {
    const hasData = await categoriesPage.hasDataDisplay();
    expect(hasData).toBe(true);
  });

  test('should have search functionality', async () => {
    await expect(categoriesPage.getSearchInput()).toBeVisible();
  });

  test('should navigate to create category form', async ({ authenticatedPage }) => {
    await categoriesPage.clickCreate();
    await expect(authenticatedPage).toHaveURL(/admin\/categories/);
  });
});
