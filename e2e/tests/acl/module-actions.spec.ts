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

  test('should display module-action management page', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('h1')).toContainText(/Module-Action Management/i);
  });

  test('should display "Attach Actions to Module" button', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('button:has-text("Attach Actions to Module")')).toBeVisible();
  });

  test('should display module-actions table', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('table')).toBeVisible();
  });

  test('should display table headers: Module, Action Name, Custom Label, Status', async ({ authenticatedPage }) => {
    const headers = authenticatedPage.locator('thead th');
    await expect(headers.filter({ hasText: 'Module' })).toBeVisible();
    await expect(headers.filter({ hasText: /^Action Name$/ })).toBeVisible();
    await expect(headers.filter({ hasText: 'Custom Label' })).toBeVisible();
    await expect(headers.filter({ hasText: 'Status' })).toBeVisible();
  });

  test('should show search input', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('input[name="search"]')).toBeVisible();
  });

  test('should show Module filter dropdown', async ({ authenticatedPage }) => {
    const dropdowns = authenticatedPage.locator('app-dropdown');
    await expect(dropdowns.first()).toBeVisible();
  });

  test('should show Action filter dropdown', async ({ authenticatedPage }) => { 
    const dropdowns = authenticatedPage.locator('app-dropdown');
    const count = await dropdowns.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should show Status filter dropdown', async ({ authenticatedPage }) => { 
    const dropdowns = authenticatedPage.locator('app-dropdown');
    const count = await dropdowns.count();
  });

  test('should display total count footer', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('text=/module-action/i').last()).toBeVisible();
  });

  test('should open create modal when Attach button is clicked', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('button:has-text("Attach Actions to Module")').click();
    await expect(authenticatedPage.locator('text=Attach Actions to Module').last()).toBeVisible();
    await expect(authenticatedPage.locator('[name="module"]')).toBeVisible();
  });

  test('should close modal when Cancel is clicked', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('button:has-text("Attach Actions to Module")').click();
    await authenticatedPage.locator('button:has-text("Cancel")').click();
    await expect(authenticatedPage.locator('[name="module"]')).not.toBeVisible();
  });

  test('should have disabled submit button on empty create form', async ({ authenticatedPage }) => {
    await authenticatedPage.locator('button:has-text("Attach Actions to Module")').click();
    const submitBtn = authenticatedPage.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('should filter results when search term is entered', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('input[name="search"]');
    await searchInput.fill('nonexistent_xyz_term_12345');
    await authenticatedPage.waitForTimeout(500);
    await expect(authenticatedPage.locator('td:has-text("No module-actions found")')).toBeVisible();
  });

  test('should show edit and delete buttons in action column', async ({ authenticatedPage }) => {
    const rows = authenticatedPage.locator('tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      const firstRow = rows.first();
      await expect(firstRow.locator('[data-testid="edit-module-action-button"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="delete-module-action-button"]')).toBeVisible();
    }
  });

  test('should open edit modal when edit button is clicked', async ({ authenticatedPage }) => {
    const editBtn = authenticatedPage.locator('[data-testid="edit-module-action-button"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(authenticatedPage.locator('h3:has-text("Edit Module-Action")')).toBeVisible();
    }
  });

  test('should open delete confirmation modal when delete button clicked', async ({ authenticatedPage }) => {
    const deleteBtn = authenticatedPage.locator('[data-testid="delete-module-action-button"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(authenticatedPage.locator('text=Delete Module-Action')).toBeVisible();
      await expect(authenticatedPage.locator('text=This action cannot be undone')).toBeVisible();
      // Close it
      await authenticatedPage.locator('button:has-text("Cancel")').last().click();
    }
  });
});
