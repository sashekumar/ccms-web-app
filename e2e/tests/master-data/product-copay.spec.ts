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
  const testPlanCode = `PCOP${timestamp}`;
  const testPlanName = `E2E Product Copay ${timestamp}`;

  let productId: string;

  test('SETUP: Create a test product', async ({ authenticatedPage }) => {
    const productListPage = new ProductListPage(authenticatedPage);
    const productFormPage = new ProductFormPage(authenticatedPage);

    await productListPage.goto();
    await productListPage.waitForPageLoad();

    await productListPage.clickCreateProduct();
    await productFormPage.waitForPageLoad();

    await productFormPage.fillProductForm({
      planCode: testPlanCode,
      planName: testPlanName,
      isActive: true
    });

    await productFormPage.submit();
    await productListPage.waitForPageLoad();

    // Navigate to view to get product ID
    await productListPage.search(testPlanCode);
    await authenticatedPage.waitForTimeout(600);
    await productListPage.clickView(testPlanCode);
    await authenticatedPage.waitForURL(/\/products\/view\/\d+/, { timeout: 15000 });

    const url = authenticatedPage.url();
    const match = url.match(/\/products\/view\/(\d+)/);
    productId = match ? match[1] : '';
    expect(productId).toBeTruthy();
  });

  test('VALIDATION: should validate required copay fields', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const copayFormPage = new ProductCopayFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickCopayTab();

    await productViewPage.clickAddCopay();
    await copayFormPage.waitForPageLoad();

    const isDisabled = await copayFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('CREATE: should add percentage-based copay to product', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const copayFormPage = new ProductCopayFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickCopayTab();

    await productViewPage.clickAddCopay();
    await copayFormPage.waitForPageLoad();

    await copayFormPage.fillCopayForm({
      copayType: 'Percentage (%)',
      copayValue: '20',
      appliesTo: 'All Services',
      isActive: true
    });

    await copayFormPage.submit();
    await authenticatedPage.waitForLoadState('networkidle');

    await productViewPage.expectCopayVisible('PERCENTAGE');
  });

  test('CREATE: should add fixed amount copay', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const copayFormPage = new ProductCopayFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickCopayTab();

    await productViewPage.clickAddCopay();
    await copayFormPage.waitForPageLoad();

    await copayFormPage.fillCopayForm({
      copayType: 'Fixed Amount',
      copayValue: '100.00',
      appliesTo: 'Outpatient',
      isActive: true
    });

    await copayFormPage.submit();
    await authenticatedPage.waitForLoadState('networkidle');

    await productViewPage.expectCopayVisible('FIXED');
  });

  test('READ: should display copay details correctly', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickCopayTab();

    await productViewPage.expectCopayVisible('PERCENTAGE');
    await productViewPage.expectCopayVisible('FIXED');
  });

  test('UPDATE: should update copay value', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);
    const copayFormPage = new ProductCopayFormPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickCopayTab();

    await productViewPage.editCopay('FIXED');
    await copayFormPage.waitForPageLoad();

    await copayFormPage.fillCopayForm({
      copayValue: '150.00'
    });

    await copayFormPage.submit();
    await authenticatedPage.waitForLoadState('networkidle');

    await productViewPage.expectCopayVisible('FIXED');
  });

  test('DELETE: should delete copay successfully', async ({ authenticatedPage }) => {
    const productViewPage = new ProductViewPage(authenticatedPage);

    await productViewPage.goto(productId);
    await productViewPage.waitForPageLoad();
    await productViewPage.clickCopayTab();

    const row = authenticatedPage.locator(`tr:has-text("FIXED")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    await productViewPage.deleteCopay('FIXED');

    // Confirm the Angular ConfirmDialogComponent modal
    await authenticatedPage.locator('app-confirm-dialog').getByRole('button', { name: 'Delete' }).click();
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(row).not.toBeVisible({ timeout: 5000 });
  });

  test('CLEANUP: Delete test product', async ({ authenticatedPage }) => {
    const productListPage = new ProductListPage(authenticatedPage);

    await productListPage.goto();
    await productListPage.waitForPageLoad();

    await productListPage.search(testPlanCode);
    await authenticatedPage.waitForTimeout(500);

    await productListPage.clickDelete(testPlanCode);
    await authenticatedPage.locator('app-confirm-dialog').getByRole('button', { name: 'Delete' }).click();
    await authenticatedPage.waitForLoadState('networkidle');
    // Backend uses soft-delete (deactivation) - product still visible but deactivated
  });
});
