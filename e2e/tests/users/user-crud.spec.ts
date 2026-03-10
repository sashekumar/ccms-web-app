import { test, expect } from '../../fixtures/auth.fixture';

/**
 * User Management E2E Tests
 * 
 * Tests user management navigation and basic UI functionality.
 * Follows coding-standards.md principles:
 * - REUSABILITY: Uses shared auth fixture and direct navigation like ACL tests
 * - COMMONIZATION: Centralized page interactions
 * - DRY: No duplicate login code
 */

test.describe('User Management', () => {
  test('should display user management page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/users');
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(authenticatedPage.locator('h1')).toContainText(/User/i);
  });

  test('should display create user button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/users');
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(authenticatedPage.locator('button:has-text("Create")')).toBeVisible();
  });

  test('should navigate to create user form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/users');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.locator('button:has-text("Create")').click();
    await expect(authenticatedPage.locator('form, input[formControlName]').first()).toBeVisible();
  });

  test('should display user table', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/users');
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(authenticatedPage.locator('table')).toBeVisible();
  });

  test('should have search functionality', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/users');
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(authenticatedPage.locator('input').first()).toBeVisible();
  });

  test('should display status filter', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/users');
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(authenticatedPage.locator('select').first()).toBeVisible();
  });

  test('should show user form fields on create', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/users');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.locator('button:has-text("Create")').click();
    // Wait for form to be visible before counting inputs
    await authenticatedPage.locator('form, input[formControlName]').first().waitFor({ state: 'visible' });
    await authenticatedPage.waitForLoadState('networkidle');
    const inputCount = await authenticatedPage.locator('input').count();
    expect(inputCount).toBeGreaterThanOrEqual(4);
  });

  test('should have cancel button on form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/users');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.locator('button:has-text("Create")').click();
    await expect(authenticatedPage.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('should navigate back to list on cancel', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/users');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.locator('button:has-text("Create")').click();
    await authenticatedPage.locator('button:has-text("Cancel")').click();
    await expect(authenticatedPage.locator('table')).toBeVisible();
  });

  test('should show validation on empty submit', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/users');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.locator('button:has-text("Create")').click();
    const submitBtn = authenticatedPage.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });
});
