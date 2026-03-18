import { test, expect } from '../../fixtures/auth.fixture';
import { ProductListPage } from '../../page-objects/master-data/product-list.page';
import { ProductFormPage } from '../../page-objects/master-data/product-form.page';
import { ProductViewPage } from '../../page-objects/master-data/product-view.page';
import { ProductLimitFormPage } from '../../page-objects/master-data/product-limit-form.page';

/**
 * Product Limits - Sub-form CRUD Operations E2E Tests
 * 
 * Tests product coverage limit management including:
 * - Creating coverage limits for a product
 * - Updating limit amounts
 * - Deleting limits
 * - Limit type categorization (Annual, Lifetime, Per Visit, etc.)
 * - Period-based limit tracking
 */

test.describe.serial('Product Limits - CRUD Operations', () => {
  const timestamp = Date.now();
  const testProductName = `E2E Product Limits ${timestamp}`;
  const testProductCode = `PLIM${timestamp}`;
  const testLimitDescription = `E2E Limit ${timestamp}`;
  const updatedLimitDescription = `E2E Updated Limit ${timestamp}`;
  
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

  test('CREATE: should add annual limit to product', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const limitFormPage = new ProductLimitFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();

    // Navigate to Limits tab
    await productViewPage.clickLimitsTab();

    // Click Add Limit
    await productViewPage.clickAddLimit();
    await limitFormPage.waitForPageLoad();

    // Fill limit form - Annual Limit
    await limitFormPage.fillLimitForm({
      limitType: 'Annual',
      description: testLimitDescription,
      limitAmount: '100000.00',
      currency: 'MYR',
      periodType: 'Per Year',
      isUnlimited: false,
      remarks: 'E2E test annual limit'
    });

    await limitFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify limit appears in the table
    await productViewPage.expectLimitVisible('Annual');
    await expect(authenticatedPage.locator(`td:has-text("100000.00")`)).toBeVisible({ timeout: 10000 });
  });

  test('CREATE: should add per visit limit', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const limitFormPage = new ProductLimitFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickLimitsTab();

    await productViewPage.clickAddLimit();
    await limitFormPage.waitForPageLoad();

    // Add per visit limit
    await limitFormPage.fillLimitForm({
      limitType: 'Per Visit',
      description: 'E2E Per Visit Limit',
      limitAmount: '5000.00',
      currency: 'MYR',
      periodType: 'Per Visit',
      isUnlimited: false
    });

    await limitFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify per visit limit appears
    await productViewPage.expectLimitVisible('Per Visit');
    await expect(authenticatedPage.locator(`td:has-text("5000.00")`)).toBeVisible();
  });

  test('VALIDATION: should validate required limit fields', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const limitFormPage = new ProductLimitFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickLimitsTab();

    await productViewPage.clickAddLimit();
    await limitFormPage.waitForPageLoad();

    // Try to submit without filling required fields
    const isDisabled = await limitFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('READ: should display limit details correctly', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickLimitsTab();

    // Verify both limits are visible
    await productViewPage.expectLimitVisible('Annual');
    await productViewPage.expectLimitVisible('Per Visit');
    await expect(authenticatedPage.locator(`td:has-text("100000.00")`)).toBeVisible();
    await expect(authenticatedPage.locator(`td:has-text("5000.00")`)).toBeVisible();
  });

  test('UPDATE: should update limit details', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const limitFormPage = new ProductLimitFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickLimitsTab();

    // Edit the annual limit
    await productViewPage.editLimit('Annual');
    await limitFormPage.waitForPageLoad();

    // Verify current value
    const currentAmount = await limitFormPage.getLimitAmount();
    expect(currentAmount).toBe('100000.00');

    // Update limit
    await limitFormPage.fillLimitForm({
      description: updatedLimitDescription,
      limitAmount: '150000.00'
    });

    await limitFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify updated limit appears
    await expect(authenticatedPage.locator(`td:has-text("150000.00")`)).toBeVisible({ timeout: 10000 });
  });

  test('DELETE: should delete limit successfully', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickLimitsTab();

    // Verify limit exists before delete
    const row = authenticatedPage.locator(`tr:has-text("Per Visit")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    // Accept confirmation dialog
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Delete the limit
    await productViewPage.deleteLimit('Per Visit');
    await authenticatedPage.waitForTimeout(1000);

    // Verify limit is removed
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
