import { test, expect } from '../../fixtures/auth.fixture';
import { ProductListPage } from '../../page-objects/master-data/product-list.page';
import { ProductFormPage } from '../../page-objects/master-data/product-form.page';
import { ProductViewPage } from '../../page-objects/master-data/product-view.page';
import { ProductCopayFormPage } from '../../page-objects/master-data/product-copay-form.page';

/**
 * Product Copay - Sub-form CRUD Operations E2E Tests
 * 
 * Tests product co-payment rule management including:
 * - Creating copay rules for a product
 * - Updating copay percentages and amounts
 * - Deleting copay rules
 * - Copay type categorization (Percentage, Fixed Amount, etc.)
 * - Min/Max amount constraints
 */

test.describe.serial('Product Copay - CRUD Operations', () => {
  const timestamp = Date.now();
  const testProductName = `E2E Product Copay ${timestamp}`;
  const testProductCode = `PCOP${timestamp}`;
  const testCopayDescription = `E2E Copay ${timestamp}`;
  const updatedCopayDescription = `E2E Updated Copay ${timestamp}`;
  
  let productId: string;

  test('SETUP: Create a test product', async ({ authenticatedPage }) => {
    const productListPage = new ProductListPage(authenticatedPage);
    const productFormPage = new ProductFormPage(authenticatedPage);

    await productListPage.goto();
    await productListPage.waitForPageLoad();

    await productListPage.clickCreateProduct();
    await productFormPage.waitForPageLoad();

    await productFormPage.fillProductForm({
      productName: testProductName,
      productCode: testProductCode,
      productType: 'Medical Card'
    });

    await productFormPage.submit();
    await productListPage.waitForPageLoad();

    // Get product ID
    await productListPage.search(testProductCode);
    await authenticatedPage.waitForTimeout(1000);
    
    const viewButton = authenticatedPage.locator(`tr:has-text("${testProductCode}") button:has-text("View")`).first();
    await viewButton.click();
    await authenticatedPage.waitForTimeout(1000);
    
    const url = authenticatedPage.url();
    const match = url.match(/\/products\/view\/(\d+)/);
    if (match) {
      productId = match[1];
    }
    
    expect(productId).toBeDefined();
  });

  test('CREATE: should add percentage-based copay to product', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const copayFormPage = new ProductCopayFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();

    // Navigate to Copay tab
    await productViewPage.clickCopayTab();

    // Click Add Copay
    await productViewPage.clickAddCopay();
    await copayFormPage.waitForPageLoad();

    // Fill copay form - Percentage based
    await copayFormPage.fillCopayForm({
      copayType: 'Percentage',
      description: testCopayDescription,
      copayPercent: '20',
      minAmount: '50.00',
      maxAmount: '500.00',
      currency: 'MYR',
      isActive: true,
      remarks: 'E2E test copay - 20%'
    });

    await copayFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify copay appears in the table
    await productViewPage.expectCopayVisible('Percentage');
    await expect(authenticatedPage.locator(`td:has-text("20")`)).toBeVisible({ timeout: 10000 });
  });

  test('CREATE: should add fixed amount copay', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const copayFormPage = new ProductCopayFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickCopayTab();

    await productViewPage.clickAddCopay();
    await copayFormPage.waitForPageLoad();

    // Add fixed amount copay
    await copayFormPage.fillCopayForm({
      copayType: 'Fixed Amount',
      description: 'E2E Fixed Copay',
      copayFixedAmount: '100.00',
      currency: 'MYR',
      isActive: true
    });

    await copayFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify fixed copay appears
    await productViewPage.expectCopayVisible('Fixed Amount');
    await expect(authenticatedPage.locator(`td:has-text("100.00")`)).toBeVisible();
  });

  test('VALIDATION: should validate required copay fields', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const copayFormPage = new ProductCopayFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickCopayTab();

    await productViewPage.clickAddCopay();
    await copayFormPage.waitForPageLoad();

    // Try to submit without filling required fields
    const isDisabled = await copayFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('READ: should display copay details correctly', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickCopayTab();

    // Verify both copay rules are visible
    await productViewPage.expectCopayVisible('Percentage');
    await productViewPage.expectCopayVisible('Fixed Amount');
    await expect(authenticatedPage.locator(`td:has-text("20")`)).toBeVisible(); // Percentage
    await expect(authenticatedPage.locator(`td:has-text("100.00")`)).toBeVisible(); // Fixed amount
  });

  test('UPDATE: should update copay details', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const copayFormPage = new ProductCopayFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickCopayTab();

    // Edit the percentage copay
    await productViewPage.editCopay('Percentage');
    await copayFormPage.waitForPageLoad();

    // Verify current value
    const currentPercent = await copayFormPage.getCopayPercent();
    expect(currentPercent).toBe('20');

    // Update copay
    await copayFormPage.fillCopayForm({
      description: updatedCopayDescription,
      copayPercent: '25'
    });

    await copayFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify updated copay appears
    await expect(authenticatedPage.locator(`td:has-text("25")`)).toBeVisible({ timeout: 10000 });
  });

  test('DELETE: should delete copay successfully', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickCopayTab();

    // Verify copay exists before delete
    const row = authenticatedPage.locator(`tr:has-text("Fixed Amount")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    // Accept confirmation dialog
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Delete the copay
    await productViewPage.deleteCopay('Fixed Amount');
    await authenticatedPage.waitForTimeout(1000);

    // Verify copay is removed
    await expect(row).not.toBeVisible({ timeout: 5000 });
  });

  test('CLEANUP: Delete test product', async ({ authenticatedPage }) => {
    const productListPage = new ProductListPage(authenticatedPage);

    await productListPage.goto();
    await productListPage.waitForPageLoad();

    await productListPage.search(testProductCode);
    await authenticatedPage.waitForTimeout(500);

    const row = authenticatedPage.locator(`tr:has-text("${testProductCode}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    authenticatedPage.on('dialog', dialog => dialog.accept());

    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(row).not.toBeVisible({ timeout: 5000 });
  });
});
