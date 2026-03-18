import { test, expect } from '../../fixtures/auth.fixture';
import { BankListPage } from '../../page-objects/master-data/bank-list.page';
import { BankFormPage } from '../../page-objects/master-data/bank-form.page';

/**
 * Bank Management - CRUD Operations E2E Tests
 * 
 * Tests actual CRUD operations for banks including:
 * - Creating banks
 * - Updating bank details
 * - Deleting banks
 * - Validation and error handling
 * - Search and filter functionality
 * 
 * Following coding-standards.md principles:
 * - Page Object Model for maintainability
 * - Proper test data management with timestamps
 * - Comprehensive validation testing
 * - Fail-fast pattern for DELETE operations
 */

test.describe.serial('Bank Management - CRUD Operations', () => {
  const timestamp = Date.now();
  const testBankCode = `E2E_BNK_${timestamp}`;
  const testBankName = `E2E Bank ${timestamp}`;
  const updatedBankName = `E2E Bank Updated ${timestamp}`;

  test('CREATE: should create a new bank successfully', async ({ authenticatedPage }) => {
    const bankListPage = new BankListPage(authenticatedPage);
    const bankFormPage = new BankFormPage(authenticatedPage);

    // Navigate to banks page
    await bankListPage.goto();
    await bankListPage.waitForPageLoad();

    // Click create button
    await bankListPage.clickCreateBank();
    await bankFormPage.waitForPageLoad();

    // Fill in bank details
    await bankFormPage.fillBankForm({
      bankCode: testBankCode,
      bankName: testBankName,
      isActive: true
    });

    // Submit form
    await bankFormPage.submit();
    await bankListPage.waitForPageLoad();

    // Search for the created bank
    await bankListPage.search(testBankCode);
    await authenticatedPage.waitForTimeout(500);

    // Verify bank appears in table
    await bankListPage.expectBankVisible(testBankCode);
    await bankListPage.expectBankVisible(testBankName);
  });

  test('VALIDATION: should validate required fields on bank creation', async ({ authenticatedPage }) => {
    const bankListPage = new BankListPage(authenticatedPage);
    const bankFormPage = new BankFormPage(authenticatedPage);

    await bankListPage.goto();
    await bankListPage.waitForPageLoad();

    await bankListPage.clickCreateBank();
    await bankFormPage.waitForPageLoad();

    // Try to submit without filling required fields
    const isDisabled = await bankFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('VALIDATION: should prevent duplicate bank codes', async ({ authenticatedPage }) => {
    const bankListPage = new BankListPage(authenticatedPage);
    const bankFormPage = new BankFormPage(authenticatedPage);

    await bankListPage.goto();
    await bankListPage.waitForPageLoad();

    await bankListPage.clickCreateBank();
    await bankFormPage.waitForPageLoad();

    // Try to create bank with existing code
    await bankFormPage.fillBankForm({
      bankCode: testBankCode,  // Same as created in first test
      bankName: 'Another Bank Name',
      isActive: true
    });

    await bankFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Should still be on form page (not closed) due to error
    // Or check for error message if visible
    const stillOnForm = await bankFormPage.modalTitle.isVisible();
    expect(stillOnForm).toBe(true);
  });

  test('READ: should display bank details correctly', async ({ authenticatedPage }) => {
    const bankListPage = new BankListPage(authenticatedPage);

    await bankListPage.goto();
    await bankListPage.waitForPageLoad();

    // Search for our test bank
    await bankListPage.search(testBankCode);
    await authenticatedPage.waitForTimeout(500);

    // Verify bank is visible with correct details
    await bankListPage.expectBankVisible(testBankCode);
    await bankListPage.expectBankVisible(testBankName);
  });

  test('SEARCH: should filter banks by search term', async ({ authenticatedPage }) => {
    const bankListPage = new BankListPage(authenticatedPage);

    await bankListPage.goto();
    await bankListPage.waitForPageLoad();

    // Search for our test bank
    await bankListPage.search(testBankCode);
    await authenticatedPage.waitForTimeout(500);

    // Should find our bank
    await bankListPage.expectBankVisible(testBankCode);

    // Search for non-existent bank
    await bankListPage.search('NONEXISTENT_BANK_99999');
    await authenticatedPage.waitForTimeout(500);

    // Should not find our bank
    await bankListPage.expectBankNotVisible(testBankCode);
  });

  test('UPDATE: should update bank details successfully', async ({ authenticatedPage }) => {
    const bankListPage = new BankListPage(authenticatedPage);
    const bankFormPage = new BankFormPage(authenticatedPage);

    await bankListPage.goto();
    await bankListPage.waitForPageLoad();

    // Search for our test bank
    await bankListPage.search(testBankCode);
    await authenticatedPage.waitForTimeout(500);

    // Click edit button
    await bankListPage.clickEdit(testBankCode);
    await bankFormPage.waitForPageLoad();

    // Verify current values are loaded
    const currentBankCode = await bankFormPage.getBankCode();
    const currentBankName = await bankFormPage.getBankName();
    expect(currentBankCode).toBe(testBankCode);
    expect(currentBankName).toBe(testBankName);

    // Update bank name
    await bankFormPage.fillBankForm({
      bankName: updatedBankName
    });

    // Submit update
    await bankFormPage.submit();
    await bankListPage.waitForPageLoad();

    // Search for updated bank
    await bankListPage.search(testBankCode);
    await authenticatedPage.waitForTimeout(500);

    // Verify updated name is visible
    await bankListPage.expectBankVisible(updatedBankName);
  });

  test('DELETE: should delete bank successfully', async ({ authenticatedPage }) => {
    const bankListPage = new BankListPage(authenticatedPage);

    await bankListPage.goto();
    await bankListPage.waitForPageLoad();

    // Search for the test bank
    await bankListPage.search(testBankCode);
    await authenticatedPage.waitForTimeout(500);

    // Verify test data exists before attempting delete (fail fast if CREATE didn't work)
    const row = authenticatedPage.locator(`tr:has-text("${testBankCode}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    // Setup dialog handler for confirmation
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Click delete button
    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();

    // Wait for deletion to process
    await authenticatedPage.waitForTimeout(1000);

    // Verify bank is no longer visible
    await bankListPage.expectBankNotVisible(testBankCode);
  });
});

/**
 * Bank Management - Additional Tests
 * Tests for edge cases and additional functionality
 */
test.describe('Bank Management - Additional Tests', () => {
  test('should display banks page with proper permissions', async ({ authenticatedPage }) => {
    const bankListPage = new BankListPage(authenticatedPage);

    await bankListPage.goto();
    await bankListPage.waitForPageLoad();

    // Verify page title is visible
    await expect(bankListPage.pageTitle).toBeVisible();
    
    // Verify create button is visible (user has permissions)
    await expect(bankListPage.createButton).toBeVisible();
  });

  test('should handle empty search results', async ({ authenticatedPage }) => {
    const bankListPage = new BankListPage(authenticatedPage);

    await bankListPage.goto();
    await bankListPage.waitForPageLoad();

    // Search for non-existent bank
    await bankListPage.search('ABSOLUTELY_NONEXISTENT_BANK_99999');
    await authenticatedPage.waitForTimeout(500);

    // Should show no data message or empty table
    const hasNoData = await bankListPage.isNoDataVisible();
    const bankCount = await bankListPage.getBankCount();
    
    expect(hasNoData || bankCount === 0).toBe(true);
  });
});
