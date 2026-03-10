import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Role Management E2E Tests
 * 
 * Tests role management navigation and UI functionality.
 * Follows coding-standards.md principles:
 * - REUSABILITY: Uses shared auth fixture and direct navigation like ACL tests
 * - COMMONIZATION: Centralized page interactions
 * - DRY: No duplicate login code
 */

test.describe('Role Management', () => {
  test('should display role management page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(authenticatedPage.locator('h1')).toContainText(/Role/i);
  });

  test('should display create role button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(authenticatedPage.locator('button:has-text("Create")')).toBeVisible();
  });

  test('should display role table', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(authenticatedPage.locator('table')).toBeVisible();
  });

  test('should have search functionality', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(authenticatedPage.locator('input').first()).toBeVisible();
  });

  test('should display status filter', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(authenticatedPage.locator('select').first()).toBeVisible();
  });

  test('should navigate to create role form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.locator('button:has-text("Create")').click();
    await expect(authenticatedPage.locator('form, input[formControlName]').first()).toBeVisible();
  });

  test('should have role code field on form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.locator('button:has-text("Create")').click();
    // Wait for form to be visible before counting inputs
    await authenticatedPage.locator('form, input[formControlName]').first().waitFor({ state: 'visible' });
    await authenticatedPage.waitForLoadState('networkidle');
    const inputCount = await authenticatedPage.locator('input').count();
    expect(inputCount).toBeGreaterThanOrEqual(2);
  });

  test('should have cancel button on form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.locator('button:has-text("Create")').click();
    await expect(authenticatedPage.locator('button:has-text("Cancel")')).toBeVisible();
  });
});
