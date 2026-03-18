import { test, expect } from '../../fixtures/auth.fixture';
import { ClauseListPage } from '../../page-objects/master-data/clause-list.page';
import { ClauseFormPage } from '../../page-objects/master-data/clause-form.page';

/**
 * Clause Management - CRUD Operations E2E Tests
 * 
 * Tests clause management including:
 * - Creating clauses
 * - Updating clause details
 * - Deleting clauses
 * - Validation and search functionality
 */

test.describe.serial('Clause Management - CRUD Operations', () => {
  const timestamp = Date.now();
  const testClauseCode = `E2E_CLS_${timestamp}`;
  const testClauseText = `E2E Clause Text for testing ${timestamp}`;
  const updatedClauseText = `E2E Clause Updated Text ${timestamp}`;

  test('CREATE: should create a new clause successfully', async ({ authenticatedPage }) => {
    const clauseListPage = new ClauseListPage(authenticatedPage);
    const clauseFormPage = new ClauseFormPage(authenticatedPage);

    await clauseListPage.goto();
    await clauseListPage.waitForPageLoad();

    await clauseListPage.clickCreateClause();
    await clauseFormPage.waitForPageLoad();

    await clauseFormPage.fillClauseForm({
      clauseCode: testClauseCode,
      clauseText: testClauseText,
      clauseCategory: 'General',
      isActive: true
    });

    await clauseFormPage.submit();
    await clauseListPage.waitForPageLoad();

    await clauseListPage.search(testClauseCode);
    await authenticatedPage.waitForTimeout(500);

    await clauseListPage.expectClauseVisible(testClauseCode);
  });

  test('VALIDATION: should validate required fields', async ({ authenticatedPage }) => {
    const clauseListPage = new ClauseListPage(authenticatedPage);
    const clauseFormPage = new ClauseFormPage(authenticatedPage);

    await clauseListPage.goto();
    await clauseListPage.waitForPageLoad();

    await clauseListPage.clickCreateClause();
    await clauseFormPage.waitForPageLoad();

    const isDisabled = await clauseFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('READ: should display clause details correctly', async ({ authenticatedPage }) => {
    const clauseListPage = new ClauseListPage(authenticatedPage);

    await clauseListPage.goto();
    await clauseListPage.waitForPageLoad();

    await clauseListPage.search(testClauseCode);
    await authenticatedPage.waitForTimeout(500);

    await clauseListPage.expectClauseVisible(testClauseCode);
  });

  test('UPDATE: should update clause details successfully', async ({ authenticatedPage }) => {
    const clauseListPage = new ClauseListPage(authenticatedPage);
    const clauseFormPage = new ClauseFormPage(authenticatedPage);

    await clauseListPage.goto();
    await clauseListPage.waitForPageLoad();

    await clauseListPage.search(testClauseCode);
    await authenticatedPage.waitForTimeout(500);

    await clauseListPage.clickEdit(testClauseCode);
    await clauseFormPage.waitForPageLoad();

    const currentCode = await clauseFormPage.getClauseCode();
    expect(currentCode).toBe(testClauseCode);

    await clauseFormPage.fillClauseForm({
      clauseText: updatedClauseText
    });

    await clauseFormPage.submit();
    await clauseListPage.waitForPageLoad();

    await clauseListPage.search(testClauseCode);
    await authenticatedPage.waitForTimeout(500);

    await clauseListPage.expectClauseVisible(testClauseCode);
  });

  test('DELETE: should delete clause successfully', async ({ authenticatedPage }) => {
    const clauseListPage = new ClauseListPage(authenticatedPage);

    await clauseListPage.goto();
    await clauseListPage.waitForPageLoad();

    await clauseListPage.search(testClauseCode);
    await authenticatedPage.waitForTimeout(500);

    // Verify test data exists before delete
    const row = authenticatedPage.locator(`tr:has-text("${testClauseCode}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    authenticatedPage.on('dialog', dialog => dialog.accept());

    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();

    await authenticatedPage.waitForTimeout(1000);

    await clauseListPage.expectClauseNotVisible(testClauseCode);
  });
});
