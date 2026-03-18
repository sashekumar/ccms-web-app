import { test, expect } from '../../fixtures/auth.fixture';
import { LookupListPage } from '../../page-objects/master-data/lookup-list.page';
import { LookupFormPage } from '../../page-objects/master-data/lookup-form.page';

/**
 * Lookup Management - CRUD Operations E2E Tests
 * 
 * Tests lookup values management including:
 * - Creating lookup values
 * - Updating lookup details
 * - Deleting lookup values
 * - Validation and search functionality
 */

test.describe.serial('Lookup Management - CRUD Operations', () => {
  const timestamp = Date.now();
  const testLookupCode = `E2E_LKP_${timestamp}`;
  const testLookupValue = `E2E Lookup Value ${timestamp}`;
  const updatedLookupValue = `E2E Updated Lookup ${timestamp}`;

  test('CREATE: should create a new lookup value successfully', async ({ authenticatedPage }) => {
    const lookupListPage = new LookupListPage(authenticatedPage);
    const lookupFormPage = new LookupFormPage(authenticatedPage);

    await lookupListPage.goto();
    await lookupListPage.waitForPageLoad();

    await lookupListPage.clickCreateLookup();
    await lookupFormPage.waitForPageLoad();

    await lookupFormPage.fillLookupForm({
      lookupCode: testLookupCode,
      lookupValue: testLookupValue,
      displayOrder: '100',
      isActive: true
    });

    await lookupFormPage.submit();
    await lookupListPage.waitForPageLoad();

    await lookupListPage.search(testLookupCode);
    await authenticatedPage.waitForTimeout(500);

    await lookupListPage.expectLookupVisible(testLookupCode);
    await lookupListPage.expectLookupVisible(testLookupValue);
  });

  test('VALIDATION: should validate required fields', async ({ authenticatedPage }) => {
    const lookupListPage = new LookupListPage(authenticatedPage);
    const lookupFormPage = new LookupFormPage(authenticatedPage);

    await lookupListPage.goto();
    await lookupListPage.waitForPageLoad();

    await lookupListPage.clickCreateLookup();
    await lookupFormPage.waitForPageLoad();

    const isDisabled = await lookupFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('READ: should display lookup details correctly', async ({ authenticatedPage }) => {
    const lookupListPage = new LookupListPage(authenticatedPage);

    await lookupListPage.goto();
    await lookupListPage.waitForPageLoad();

    await lookupListPage.search(testLookupCode);
    await authenticatedPage.waitForTimeout(500);

    await lookupListPage.expectLookupVisible(testLookupCode);
    await lookupListPage.expectLookupVisible(testLookupValue);
  });

  test('UPDATE: should update lookup details successfully', async ({ authenticatedPage }) => {
    const lookupListPage = new LookupListPage(authenticatedPage);
    const lookupFormPage = new LookupFormPage(authenticatedPage);

    await lookupListPage.goto();
    await lookupListPage.waitForPageLoad();

    await lookupListPage.search(testLookupCode);
    await authenticatedPage.waitForTimeout(500);

    await lookupListPage.clickEdit(testLookupCode);
    await lookupFormPage.waitForPageLoad();

    const currentCode = await lookupFormPage.getLookupCode();
    const currentValue = await lookupFormPage.getLookupValue();
    expect(currentCode).toBe(testLookupCode);
    expect(currentValue).toBe(testLookupValue);

    await lookupFormPage.fillLookupForm({
      lookupValue: updatedLookupValue
    });

    await lookupFormPage.submit();
    await lookupListPage.waitForPageLoad();

    await lookupListPage.search(testLookupCode);
    await authenticatedPage.waitForTimeout(500);

    await lookupListPage.expectLookupVisible(updatedLookupValue);
  });

  test('DELETE: should delete lookup value successfully', async ({ authenticatedPage }) => {
    const lookupListPage = new LookupListPage(authenticatedPage);

    await lookupListPage.goto();
    await lookupListPage.waitForPageLoad();

    await lookupListPage.search(testLookupCode);
    await authenticatedPage.waitForTimeout(500);

    // Verify test data exists before delete
    const row = authenticatedPage.locator(`tr:has-text("${testLookupCode}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    authenticatedPage.on('dialog', dialog => dialog.accept());

    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();

    await authenticatedPage.waitForTimeout(1000);

    await lookupListPage.expectLookupNotVisible(testLookupCode);
  });
});
